import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure } from "./_core/trpc";
import {
  createGiftTest,
  getGiftTestById,
  getGiftTestByEmail,
  getAllGiftTestsByEmail,
  getGiftTestByExternalToken,
  updateGiftTest,
  upsertUser,
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteUserById,
  listActiveOrganizations,
  getUserByEmail,
  listOrganizationsWithStats,
  createOrganizationAdmin,
  updateOrganizationAdmin,
  organizationHasGiftTests,
  deleteOrganizationAdmin,
  listAdminResults,
  deleteGiftTestById,
  getDb
} from "./db";
import { calculateGifts, calculateFullGiftRanking } from "./giftCalculation";
import { sendResultEmail } from "./emailService";
import { randomBytes } from "crypto";
import { roleEnumValues, giftTests  } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  organizations,
  type GiftTest,
} from "../drizzle/schema";



export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,

  auth: router({
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const normalizedInputEmail = input.email.trim().toLowerCase();

        // 1) Tentar autenticação via usuário do banco
        const dbUser = await getUserByEmail(normalizedInputEmail);

        if (dbUser) {
          // Ajusta aqui o nome da coluna de senha que você criou no schema:
          // ex: dbUser.passwordHash ou (dbUser as any).passwordHash
          const passwordHash = (dbUser as any).passwordHash ?? (dbUser as any).password_hash;

          // POR ENQUANTO: comparação simples (sem hash) – só pra funcionar
          // depois você troca por bcrypt/argon2.
          if (passwordHash && input.password === passwordHash) {
            const openId = dbUser.openId || `local-db:${dbUser.id}`;
            const name = dbUser.name || dbUser.email || normalizedInputEmail;

            await upsertUser({
              openId,
              email: dbUser.email || normalizedInputEmail,
              name,
              loginMethod: "local-db",
              role: dbUser.role || "END_USER",
              lastSignedIn: new Date(),
            });

            const cookieOptions = getSessionCookieOptions(ctx.req);
            const token = await sdk.createSessionToken(openId, {
              name,
              expiresInMs: ONE_YEAR_MS,
            });

            ctx.res.cookie(COOKIE_NAME, token, {
              ...cookieOptions,
              maxAge: ONE_YEAR_MS,
            });

            return { success: true } as const;
          }
        }

        // 2) Fallback: super admin do .env (comportamento antigo)
        const adminEmail = ENV.localAdminEmail?.trim();
        const adminPassword = ENV.localAdminPassword;

        if (!adminEmail || !adminPassword) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Autenticação local não configurada",
          });
        }

        const normalizedAdminEmail = adminEmail.toLowerCase();
        const isEmailValid = normalizedInputEmail === normalizedAdminEmail;
        const isPasswordValid = input.password === adminPassword;

        if (!isEmailValid || !isPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Credenciais inválidas",
          });
        }

        const openId = `local-admin:${normalizedAdminEmail}`;
        const adminName = ENV.localAdminName?.trim() || adminEmail;

        await upsertUser({
          openId,
          email: adminEmail,
          name: adminName,
          loginMethod: "local",
          role: "SUPER_ADMIN",
          lastSignedIn: new Date(),
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        const token = await sdk.createSessionToken(openId, {
          name: adminName,
          expiresInMs: ONE_YEAR_MS,
        });

        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return { success: true } as const;
      }),
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  adminUser: router({
    list: adminProcedure.query(async () => {
      const rows = await listAdminUsers();
      const now = Date.now();

      return rows.map(row => {
        const diffDays =
          Math.abs(now - row.lastSignedIn.getTime()) / (1000 * 60 * 60 * 24);

        let status: "active" | "invited" | "blocked" = "active";
        if (diffDays > 365) status = "blocked";
        else if (diffDays > 30) status = "invited";

        return {
          id: row.id,
          name: row.name ?? "",
          email: row.email ?? "",
          role: row.role,
          createdAt: row.createdAt,
          lastSignedIn: row.lastSignedIn,
          organizationId: row.organizationId,
          organizationName: row.organizationName,
          status,
        };
      });
    }),

    organizations: adminProcedure.query(async () => {
      const orgs = await listActiveOrganizations();
      return orgs;
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          role: z.enum(roleEnumValues),
          password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
          organizationId: z.number().optional().nullable(),
        }),
      )
      .mutation(async ({ input }) => {
        // aqui você pode futuramente trocar por bcrypt/argon2
        const passwordHash = input.password; // << POR ENQUANTO sem hash, só para destravar o fluxo

        const user = await createAdminUser({
          name: input.name,
          email: input.email,
          role: input.role,
          passwordHash,
          organizationId:
            input.role === "SUPER_ADMIN" ? null : input.organizationId ?? null,
        });

        const now = Date.now();
        const diffDays =
          Math.abs(now - user.lastSignedIn.getTime()) / (1000 * 60 * 60 * 24);

        let status: "active" | "invited" | "blocked" = "active";
        if (diffDays > 365) status = "blocked";
        else if (diffDays > 30) status = "invited";

        return {
          id: user.id,
          name: user.name ?? "",
          email: user.email ?? "",
          role: user.role,
          createdAt: user.createdAt,
          lastSignedIn: user.lastSignedIn,
          organizationId: user.organizationId,
          organizationName: user.organizationName,
          status,
        };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1),
          email: z.string().email(),
          role: z.enum(roleEnumValues),
          // senha opcional na edição; se vier preenchida, atualiza
          password: z.string().min(6).optional().nullable(),
          organizationId: z.number().optional().nullable(),
        }),
      )
      .mutation(async ({ input }) => {
        const passwordHash = input.password || undefined;

        const user = await updateAdminUser({
          id: input.id,
          name: input.name,
          email: input.email,
          role: input.role,
          passwordHash,
          organizationId:
            input.role === "SUPER_ADMIN" ? null : input.organizationId ?? null,
        });

        const now = Date.now();
        const diffDays =
          Math.abs(now - user.lastSignedIn.getTime()) / (1000 * 60 * 60 * 24);

        let status: "active" | "invited" | "blocked" = "active";
        if (diffDays > 365) status = "blocked";
        else if (diffDays > 30) status = "invited";

        return {
          id: user.id,
          name: user.name ?? "",
          email: user.email ?? "",
          role: user.role,
          createdAt: user.createdAt,
          lastSignedIn: user.lastSignedIn,
          organizationId: user.organizationId,
          organizationName: user.organizationName,
          status,
        };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteUserById(input.id);
        return { success: true as const };
      }),
  }),

  adminOrganization: router({
    list: adminProcedure.query(async () => {
      const orgs = await listOrganizationsWithStats();
      return orgs.map(o => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        email: o.email,
        contactName: o.contactName,
        isActive: o.isActive,
        createdAt: o.createdAt.toISOString(),
        respondentCount: o.respondentCount,
        completedCount: o.completedCount,
        completionRate: o.completionRate,
      }));
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email().optional().nullable(),
          contactName: z.string().min(1).optional().nullable(),
          isActive: z.boolean().default(true),
        })
      )
      .mutation(async ({ input }) => {
        const org = await createOrganizationAdmin({
          name: input.name,
          email: input.email ?? null,
          contactName: input.contactName ?? null,
          isActive: input.isActive,
        });
        return {
          ...org,
          createdAt: org.createdAt.toISOString(),
        };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1),
          email: z.string().email().optional().nullable(),
          contactName: z.string().min(1).optional().nullable(),
          isActive: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        const org = await updateOrganizationAdmin({
          id: input.id,
          name: input.name,
          email: input.email ?? null,
          contactName: input.contactName ?? null,
          isActive: input.isActive,
        });
        return {
          ...org,
          createdAt: org.createdAt.toISOString(),
        };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const hasTests = await organizationHasGiftTests(input.id);
        if (hasTests) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Não é possível excluir a organização porque existem respostas vinculadas. Em vez disso, desative a organização.",
          });
        }
        await deleteOrganizationAdmin(input.id);
        return { success: true as const };
      }),
  }),

  adminDashboard: router({
    overview: adminProcedure
      .input(
        z
          .object({
            organizationId: z.number().optional().nullable(),
          })
          .optional(),
      )
      .query(async ({ input }) => {
        const orgFilterId = input?.organizationId ?? null;

        // Puxa dados básicos em paralelo (globais, sem filtro)
        const [results, orgs, users] = await Promise.all([
          listAdminResults(),
          listOrganizationsWithStats(),
          listAdminUsers(),
        ]);

        // --- Estatísticas de resultados (globais, se você quiser manter assim) ---
        const totalResults = results.length;
        const completedResults = results.filter(
          (r) => r.status === "completed",
        ).length;
        const inProgressResults = results.filter(
          (r) => r.status === "in_progress",
        ).length;
        const awaitingExternalResults = results.filter(
          (r) => r.status === "awaiting_external",
        ).length;

        // Pessoas distintas (global)
        const distinctRespondentsGlobal = new Set(
          results
            .map((r) => r.email?.trim().toLowerCase())
            .filter(Boolean),
        ).size;

        // --- Estatísticas de organizações ---
        const totalOrganizations = orgs.length;
        const activeOrganizations = orgs.filter((o) => o.isActive).length;

        // --- Estatísticas de usuários ---
        const totalUsers = users.length;
        const superAdmins = users.filter((u) => u.role === "SUPER_ADMIN").length;
        const orgAdmins = users.filter((u) => u.role === "ORG_ADMIN").length;
        const endUsers = users.filter((u) => u.role === "END_USER").length;

        // --- Resultados recentes (pra tabela) ---
        const recentResults = [...results]
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, 20)
          .map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            organizationName: r.organizationName,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          }));

        // --- Gráficos (giftDistribution + engagementTrend) FILTRADOS por organização ---
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        type DashboardTestRow = {
          id: number;
          email: string | null;
          organizationId: number | null;
          status: GiftTest["status"];
          createdAt: Date;
          updatedAt: Date;
          manifestGifts: unknown; // pode ser string ou array, tratamos depois
          latentGifts: unknown;
        };

        let tests: DashboardTestRow[];

        if (orgFilterId != null) {
          tests = await db
            .select({
              id: giftTests.id,
              email: giftTests.email,
              organizationId: giftTests.organizationId,
              status: giftTests.status,
              createdAt: giftTests.createdAt,
              updatedAt: giftTests.updatedAt,
              manifestGifts: giftTests.manifestGifts,
              latentGifts: giftTests.latentGifts,
            })
            .from(giftTests)
            .where(eq(giftTests.organizationId, orgFilterId));
        } else {
          tests = await db
            .select({
              id: giftTests.id,
              email: giftTests.email,
              organizationId: giftTests.organizationId,
              status: giftTests.status,
              createdAt: giftTests.createdAt,
              updatedAt: giftTests.updatedAt,
              manifestGifts: giftTests.manifestGifts,
              latentGifts: giftTests.latentGifts,
            })
            .from(giftTests);
        }

        // --- Activity feed (O que aconteceu recentemente) ---
        const activityFeed = tests
          .slice() // cópia pra não mutar
          .sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
          )
          .slice(0, 20)
          .map((t) => {
            let message: string;

            switch (t.status) {
              case "completed":
                message = `Teste de ${t.email} foi concluído`;
                break;
              case "awaiting_external":
                message = `Teste de ${t.email} está aguardando avaliações externas`;
                break;
              case "in_progress":
                message = `Teste de ${t.email} foi iniciado`;
                break;
              default:
                message = `Teste de ${t.email} teve atualização de status`;
                break;
            }

            return {
              id: t.id,
              message,
              timestamp: t.updatedAt.toISOString(),
            };
          });

        // --- Distribuição de dons (contagem de resultados que têm o dom como manifesto/latente) ---
        const manifestCounts = new Map<string, number>();
        const latentCounts = new Map<string, number>();

        for (const test of tests) {
          // só faz sentido olhar dons de testes concluídos
          if (test.status !== "completed") continue;

          // manifestGifts e latentGifts podem vir como JSON (array) ou string JSON, então normalizamos
          const rawManifest = (test as any).manifestGifts;
          const rawLatent = (test as any).latentGifts;

          let manifestList: string[] = [];
          let latentList: string[] = [];

          if (Array.isArray(rawManifest)) {
            manifestList = rawManifest as string[];
          } else if (typeof rawManifest === "string") {
            try {
              const parsed = JSON.parse(rawManifest);
              if (Array.isArray(parsed)) {
                manifestList = parsed as string[];
              }
            } catch {
              // ignora parse error
            }
          }

          if (Array.isArray(rawLatent)) {
            latentList = rawLatent as string[];
          } else if (typeof rawLatent === "string") {
            try {
              const parsed = JSON.parse(rawLatent);
              if (Array.isArray(parsed)) {
                latentList = parsed as string[];
              }
            } catch {
              // ignora parse error
            }
          }

          // incrementa 1 para cada dom presente na lista de manifestos
          manifestList.forEach((giftName) => {
            const current = manifestCounts.get(giftName) ?? 0;
            manifestCounts.set(giftName, current + 1);
          });

          // incrementa 1 para cada dom presente na lista de latentes
          latentList.forEach((giftName) => {
            const current = latentCounts.get(giftName) ?? 0;
            latentCounts.set(giftName, current + 1);
          });
        }

        // juntar todos os nomes de dons que apareceram em manifest ou latent
        const giftNameSet = new Set<string>();
        manifestCounts.forEach((_, key) => {
          giftNameSet.add(key);
        });
        latentCounts.forEach((_, key) => {
          giftNameSet.add(key);
        });

        const giftNames = Array.from(giftNameSet);

        // transformar em array pro frontend
        const giftDistribution = giftNames.map((giftName) => ({
          gift: giftName,
          manifest: manifestCounts.get(giftName) ?? 0,
          latent: latentCounts.get(giftName) ?? 0,
        }));


        // --- engagementTrend (por mês) ---
        type TrendBucket = {
          monthKey: string;
          month: string;
          started: number;
          completed: number;
        };

        const trendMap = new Map<string, TrendBucket>();

        for (const t of tests) {
          const createdAt = t.createdAt;
          if (!createdAt) continue;

          const monthKey = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}`;
          const monthLabel = format(createdAt, "MMM yyyy", { locale: ptBR });

          let bucket = trendMap.get(monthKey);
          if (!bucket) {
            bucket = {
              monthKey,
              month: monthLabel,
              started: 0,
              completed: 0,
            };
            trendMap.set(monthKey, bucket);
          }

          bucket.started += 1;
          if (t.status === "completed") {
            bucket.completed += 1;
          }
        }

        const engagementTrend = Array.from(trendMap.values()).sort((a, b) =>
          a.monthKey.localeCompare(b.monthKey),
        );

        return {
          results: {
            total: totalResults,
            completed: completedResults,
            inProgress: inProgressResults,
            awaitingExternal: awaitingExternalResults,
            distinctRespondents: distinctRespondentsGlobal,
          },
          organizations: {
            total: totalOrganizations,
            active: activeOrganizations,
          },
          users: {
            total: totalUsers,
            superAdmins,
            orgAdmins,
            endUsers,
          },
          recentResults,
          giftDistribution,
          engagementTrend,
          activityFeed,
        };
      }),
  }),

  giftTest: router({
    // Criar novo teste 
    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          // NOVO: id da organização (preferencial)
          organizationId: z.number().optional().nullable(),
          // LEGADO: texto da organização (só pra compatibilidade / fallback)
          organization: z.string().optional().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        const test = await createGiftTest({
          name: input.name,
          email: input.email,
          // se vier organizationId, salvamos no campo certo
          organizationId: input.organizationId ?? null,
          // mantemos o texto legado só como fallback
          organization: input.organization ?? null,
          status: "in_progress",
        });
        return { testId: test.id };
      }),

    // Salvar respostas de autoavaliação
    saveSelfAnswers: publicProcedure
      .input(
        z.object({
          testId: z.number(),
          answers: z.array(z.number().min(0).max(4)).length(180),
        })
      )
      .mutation(async ({ input }) => {
        // Gerar tokens para avaliação externa
        const token1 = randomBytes(32).toString("hex");
        const token2 = randomBytes(32).toString("hex");

        await updateGiftTest(input.testId, {
          selfAnswers: input.answers,
          externalToken1: token1,
          externalToken2: token2,
          status: "awaiting_external",
        });

        return {
          token1,
          token2,
        };
      }),

    // Obter informações do teste por token externo
    getByExternalToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const test = await getGiftTestByExternalToken(input.token);
        if (!test) {
          throw new Error("Teste não encontrado");
        }

        // Verificar qual token foi usado
        const isToken1 = test.externalToken1 === input.token;
        const isToken2 = test.externalToken2 === input.token;

        // Verificar se já foi respondido usando os campos externalCompleted
        const alreadyAnswered = isToken1
          ? test.externalCompleted1
          : test.externalCompleted2;

        return {
          testId: test.id,
          name: test.name,
          alreadyAnswered,
          tokenNumber: isToken1 ? 1 : 2,
          maritalStatus: test.maritalStatus,
        };
      }),

    // Salvar respostas de avaliação externa
    saveExternalAnswers: publicProcedure
      .input(
        z.object({
          token: z.string(),
          answers: z.array(z.number().min(0).max(4)).length(30),
        })
      )
      .mutation(async ({ input }) => {
        const test = await getGiftTestByExternalToken(input.token);
        if (!test) {
          throw new Error("Teste não encontrado");
        }

        const isToken1 = test.externalToken1 === input.token;

        // Verificar se já foi respondido
        const alreadyCompleted = isToken1
          ? test.externalCompleted1
          : test.externalCompleted2;

        if (alreadyCompleted) {
          throw new Error("Este link de avaliação já foi respondido");
        }

        // Atualizar respostas e marcar como completado
        const updateData: any = {};
        if (isToken1) {
          updateData.externalAnswers1 = input.answers;
          updateData.externalCompleted1 = true;
        } else {
          updateData.externalAnswers2 = input.answers;
          updateData.externalCompleted2 = true;
        }

        // Verificar se ambas as avaliações foram completadas
        const bothCompleted =
          (isToken1 && test.externalCompleted2) ||
          (!isToken1 && test.externalCompleted1);

        if (bothCompleted) {
          // Calcular resultados
          const externalAnswers1 = isToken1
            ? input.answers
            : (test.externalAnswers1 as number[]);
          const externalAnswers2 = isToken1
            ? (test.externalAnswers2 as number[])
            : input.answers;

          const {
            manifestGifts,
            latentGifts,
            manifestGiftScores,
            latentGiftScores,
          } = calculateGifts(
            test.selfAnswers as number[],
            externalAnswers1,
            externalAnswers2
          );

          updateData.manifestGifts = manifestGifts;
          updateData.latentGifts = latentGifts;

          // NOVO: guardar também as pontuações dos dons principais
          updateData.manifestGiftScores = manifestGiftScores;
          updateData.latentGiftScores = latentGiftScores;

          updateData.status = "completed";
          updateData.resultSentAt = new Date();

          // Enviar email
          await sendResultEmail(test.email, {
            name: test.name,
            organization: test.organization || undefined,
            manifestGifts,
            latentGifts,
          });
        }

        await updateGiftTest(test.id, updateData);

        return { success: true };
      }),

    // Consultar todos os resultados por email
    getAllResultsByEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        const tests = await getAllGiftTestsByEmail(input.email);
        if (tests.length === 0) {
          throw new Error("Nenhum teste encontrado para este email");
        }

        // Retornar lista de testes com informações básicas
        return tests.map(test => ({
          id: test.id,
          status: test.status,
          createdAt: test.createdAt,
          name: test.name,
          organization: test.organization,
          manifestGifts: test.manifestGifts,
          latentGifts: test.latentGifts,
          manifestGiftScores: test.manifestGiftScores,
          latentGiftScores: test.latentGiftScores,
          externalToken1: test.externalToken1,
          externalToken2: test.externalToken2,
          externalCompleted1: test.externalCompleted1,
          externalCompleted2: test.externalCompleted2,
          selfAnswers: test.selfAnswers,
          maritalStatus: test.maritalStatus,
        }));
      }),

    // Consultar resultado por email (mantido para compatibilidade, retorna o mais recente)
    getResultByEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        const test = await getGiftTestByEmail(input.email);
        if (!test) {
          throw new Error("Nenhum teste encontrado para este email");
        }

        if (test.status !== "completed") {
          return {
            status: test.status,
            message:
              test.status === "in_progress"
                ? "Teste ainda não foi finalizado"
                : "Aguardando avaliações externas",
          };
        }

        return {
          status: "completed",
          name: test.name,
          organization: test.organization,
          manifestGifts: test.manifestGifts,
          latentGifts: test.latentGifts,
        };
      }),

    // Obter teste por ID
    getById: publicProcedure
      .input(z.object({ testId: z.number() }))
      .query(async ({ input }) => {
        const test = await getGiftTestById(input.testId);
        if (!test) {
          throw new Error("Teste não encontrado");
        }
        return test;
      }),

    organizations: publicProcedure.query(async () => {
      // Reaproveita a função existente, que já retorna { id, name }
      const orgs = await listActiveOrganizations();
      return orgs;
    }),

    // Verificar se existe teste em andamento para um email
    checkInProgressTest: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        const tests = await getAllGiftTestsByEmail(input.email);
        
        // Buscar teste em andamento (prioridade máxima)
        const inProgressTest = tests.find(
          test => test.status === "in_progress"
        );

        // Buscar testes aguardando avaliações externas (com pelo menos 1 pendente)
        const awaitingExternalTests = tests.filter(
          test => test.status === "awaiting_external" &&
                  (!test.externalCompleted1 || !test.externalCompleted2)
        );

        // Contar total de testes aguardando avaliações
        const totalAwaitingExternal = awaitingExternalTests.length;

        if (!inProgressTest && awaitingExternalTests.length === 0) {
          return { hasInProgressTest: false, hasAwaitingExternal: false };
        }

        // PRIORIDADE 1: Teste em andamento sempre vem primeiro
        if (inProgressTest) {
          return {
            hasInProgressTest: true,
            hasAwaitingExternal: false,
            testId: inProgressTest.id,
            name: inProgressTest.name,
            selfAnswers: inProgressTest.selfAnswers,
            createdAt: inProgressTest.createdAt,
            otherAwaitingCount: totalAwaitingExternal, // Informar quantos outros testes aguardando
          };
        }

        // PRIORIDADE 2: Se não tem in_progress, mostrar awaiting_external mais recente
        const mostRecentAwaiting = awaitingExternalTests.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];

        return {
          hasInProgressTest: false,
          hasAwaitingExternal: true,
          testId: mostRecentAwaiting.id,
          name: mostRecentAwaiting.name,
          email: mostRecentAwaiting.email,
          createdAt: mostRecentAwaiting.createdAt,
          externalCompleted1: mostRecentAwaiting.externalCompleted1,
          externalCompleted2: mostRecentAwaiting.externalCompleted2,
          otherAwaitingCount: totalAwaitingExternal - 1, // Outros testes além deste
        };
      }),

    // Salvar progresso parcial das respostas
    saveProgress: publicProcedure
      .input(
        z.object({
          testId: z.number(),
          answers: z.array(z.number().min(-1).max(4)).length(180),
        })
      )
      .mutation(async ({ input }) => {
        await updateGiftTest(input.testId, {
          selfAnswers: input.answers,
        });
        return { success: true };
      }),

    // Deletar teste em andamento (para quando usuário quer começar novo)
    deleteInProgressTest: publicProcedure
      .input(z.object({ testId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteGiftTestById(input.testId);
        return { success: true };
      }),
  }),

  adminAnalysis: router({
    
    byGift: adminProcedure
      .input(
        z.object({
          organizationId: z.number().nullable().optional(),
          giftName: z.string().min(1),
          scope: z.enum(["all", "latestPerPerson"]).default("all"),
        }),
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        type AnalysisTestRow = {
          id: number;
          name: string | null;
          email: string | null;
          organizationId: number | null;
          organizationName: string | null;
          status: GiftTest["status"];
          createdAt: Date;
          updatedAt: Date;
          resultSentAt: Date | null;
          manifestGifts: unknown;
          latentGifts: unknown;
        };

        let tests: AnalysisTestRow[];

        if (input.organizationId != null) {
          tests = await db
            .select({
              id: giftTests.id,
              name: giftTests.name,
              email: giftTests.email,
              organizationId: giftTests.organizationId,
              organizationName: organizations.name,
              status: giftTests.status,
              createdAt: giftTests.createdAt,
              updatedAt: giftTests.updatedAt,
              resultSentAt: giftTests.resultSentAt,
              manifestGifts: giftTests.manifestGifts,
              latentGifts: giftTests.latentGifts,
            })
            .from(giftTests)
            .leftJoin(
              organizations,
              eq(giftTests.organizationId, organizations.id),
            )
            .where(eq(giftTests.organizationId, input.organizationId));
        } else {
          tests = await db
            .select({
              id: giftTests.id,
              name: giftTests.name,
              email: giftTests.email,
              organizationId: giftTests.organizationId,
              organizationName: organizations.name,
              status: giftTests.status,
              createdAt: giftTests.createdAt,
              updatedAt: giftTests.updatedAt,
              resultSentAt: giftTests.resultSentAt,
              manifestGifts: giftTests.manifestGifts,
              latentGifts: giftTests.latentGifts,
            })
            .from(giftTests)
            .leftJoin(
              organizations,
              eq(giftTests.organizationId, organizations.id),
            );
        }

        const normalizeGifts = (raw: unknown): string[] => {
          if (Array.isArray(raw)) {
            return raw.filter((g): g is string => typeof g === "string");
          }
          if (typeof raw === "string") {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                return parsed.filter(
                  (g): g is string => typeof g === "string",
                );
              }
            } catch {
              // ignora JSON inválido
            }
          }
          return [];
        };

        const giftName = input.giftName;

        type PersonRow = {
          testId: number;
          name: string;
          email: string;
          organizationId: number | null;
          organizationName: string | null;
          createdAt: string;
          completedAt: string | null;
        };

        const manifestAll: PersonRow[] = [];
        const latentAll: PersonRow[] = [];

        for (const t of tests) {
          if (t.status !== "completed") continue;

          const manifestList = normalizeGifts((t as any).manifestGifts);
          const latentList = normalizeGifts((t as any).latentGifts);

          const completedDate = t.resultSentAt ?? t.updatedAt ?? t.createdAt;

          const base: PersonRow = {
            testId: t.id,
            name: t.name ?? "",
            email: (t.email ?? "").toLowerCase(),
            organizationId: t.organizationId ?? null,
            organizationName: t.organizationName ?? null,
            createdAt: t.createdAt.toISOString(),
            completedAt: completedDate ? completedDate.toISOString() : null,
          };

          if (manifestList.includes(giftName)) {
            manifestAll.push(base);
          }
          if (latentList.includes(giftName)) {
            latentAll.push(base);
          }
        }

        const dedupeLatest = (rows: PersonRow[]): PersonRow[] => {
          const byEmail = new Map<string, PersonRow>();
          for (const row of rows) {
            const key = row.email;
            const existing = byEmail.get(key);
            if (!existing) {
              byEmail.set(key, row);
              continue;
            }
            const existingDate = existing.completedAt ?? existing.createdAt;
            const currentDate = row.completedAt ?? row.createdAt;
            if (currentDate > existingDate) {
              byEmail.set(key, row);
            }
          }
          return Array.from(byEmail.values());
        };

        const manifest =
          input.scope === "latestPerPerson"
            ? dedupeLatest(manifestAll)
            : manifestAll;
        const latent =
          input.scope === "latestPerPerson"
            ? dedupeLatest(latentAll)
            : latentAll;

        const sortByDateDesc = (rows: PersonRow[]) =>
          [...rows].sort((a, b) => {
            const aDate = a.completedAt ?? a.createdAt;
            const bDate = b.completedAt ?? b.createdAt;
            return bDate.localeCompare(aDate);
          });

        return {
          manifest: sortByDateDesc(manifest),
          latent: sortByDateDesc(latent),
        };
      }),
  }),


  adminResult: router({
    list: adminProcedure.query(async () => {
      const rows = await listAdminResults();

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        organizationId: row.organizationId,
        organizationName: row.organizationName,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    }),

    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        
        // Buscar teste com JOIN para pegar nome da organização atualizado
        const [test] = await db
          .select({
            id: giftTests.id,
            name: giftTests.name,
            email: giftTests.email,
            organizationId: giftTests.organizationId,
            organizationName: organizations.name,
            status: giftTests.status,
            selfAnswers: giftTests.selfAnswers,
            externalAnswers1: giftTests.externalAnswers1,
            externalAnswers2: giftTests.externalAnswers2,
            externalCompleted1: giftTests.externalCompleted1,
            externalCompleted2: giftTests.externalCompleted2,
            manifestGiftScores: giftTests.manifestGiftScores,
            latentGiftScores: giftTests.latentGiftScores,
            createdAt: giftTests.createdAt,
            resultSentAt: giftTests.resultSentAt,
          })
          .from(giftTests)
          .leftJoin(organizations, eq(giftTests.organizationId, organizations.id))
          .where(eq(giftTests.id, input.id));

        if (!test) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resultado não encontrado",
          });
        }

        // === 1) pontuações dos dons salvas em JSON ===
        const manifestScoresArr =
          (test.manifestGiftScores as any[] | null) ?? [];
        const latentScoresArr =
          (test.latentGiftScores as any[] | null) ?? [];

        // máximos teóricos (os mesmos que você já usava)
        const MANIFEST_MAX_SCORE = 20;
        const LATENT_MAX_SCORE = 12;

        const toPercentage = (value: number, max: number) =>
          Math.max(0, Math.min(100, Math.round((value / max) * 100)));

        // === 2) montar lista de dons manifestos com percentual ===
        const manifestGifts = manifestScoresArr.map((item) => ({
          name: item.gift as string,
          score: item.score as number,
          percentage: toPercentage(item.score as number, MANIFEST_MAX_SCORE),
        }));

        // === 3) montar lista de dons latentes com percentual ===
        const latentGifts = latentScoresArr.map((item) => ({
          name: item.gift as string,
          score: item.score as number,
          percentage: toPercentage(item.score as number, LATENT_MAX_SCORE),
        }));
        
        // === Calcular ranking completo recalculando a partir das respostas ===
        const selfAnswers = (test.selfAnswers as number[] | null) ?? [];
        const externalAnswers1 = (test.externalAnswers1 as number[] | null) ?? undefined;
        const externalAnswers2 = (test.externalAnswers2 as number[] | null) ?? undefined;
        
        // Recalcular todos os 30 dons usando a função de ranking completo
        const fullRanking = calculateFullGiftRanking(
          selfAnswers,
          externalAnswers1,
          externalAnswers2
        );
        
        // Converter para o formato esperado pelo frontend
        const allManifestScores = fullRanking.allManifestScores.map((item) => ({
          name: item.gift,
          score: item.score,
          percentage: toPercentage(item.score, MANIFEST_MAX_SCORE),
        }));
        
        const allLatentScores = fullRanking.allLatentScores.map((item) => ({
          name: item.gift,
          score: item.score,
          percentage: toPercentage(item.score, LATENT_MAX_SCORE),
        }));

        // === 4) avaliações externas (genéricas por enquanto) ===
        const externalAssessments = [
          {
            name: "Convidado 1",
            relation: "",
            status: test.externalCompleted1 ? "completed" : "pending",
            completedAt: null as string | null,
          },
          {
            name: "Convidado 2",
            relation: "",
            status: test.externalCompleted2 ? "completed" : "pending",
            completedAt: null as string | null,
          },
        ];

        return {
          id: test.id,
          personName: test.name,
          email: test.email,
          status: test.status,
          organizationId: test.organizationId ?? null,
          organizationName: test.organizationName ?? null,
          createdAt: test.createdAt.toISOString(),
          completedAt: test.resultSentAt
            ? test.resultSentAt.toISOString()
            : null,
          manifestGifts,
          latentGifts,
          allManifestScores,
          allLatentScores,
          externalAssessments,
        };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          personName: z.string().min(1).optional(),
          organizationId: z.number().nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        const updateData: any = {};
        
        if (input.personName !== undefined) {
          updateData.name = input.personName;
        }
        
        if (input.organizationId !== undefined) {
          updateData.organizationId = input.organizationId;
        }
        
        await db
          .update(giftTests)
          .set(updateData)
          .where(eq(giftTests.id, input.id));
        
        return { success: true as const };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteGiftTestById(input.id);
        return { success: true as const };
      }),
  }),

});
  
export type AppRouter = typeof appRouter;
