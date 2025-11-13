import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  createGiftTest,
  getGiftTestById,
  getGiftTestByEmail,
  getAllGiftTestsByEmail,
  getGiftTestByExternalToken,
  updateGiftTest,
  upsertUser,
} from "./db";
import { calculateGifts } from "./giftCalculation";
import { sendResultEmail } from "./emailService";
import { randomBytes } from "crypto";

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
        const adminEmail = ENV.localAdminEmail?.trim();
        const adminPassword = ENV.localAdminPassword;

        if (!adminEmail || !adminPassword) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Autenticação local não configurada",
          });
        }

        const normalizedInputEmail = input.email.trim().toLowerCase();
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

  giftTest: router({
    // Criar novo teste
    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          organization: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const test = await createGiftTest({
          name: input.name,
          email: input.email,
          organization: input.organization,
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

          const { manifestGifts, latentGifts } = calculateGifts(
            test.selfAnswers as number[],
            externalAnswers1,
            externalAnswers2
          );

          updateData.manifestGifts = manifestGifts;
          updateData.latentGifts = latentGifts;
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
  }),
});

export type AppRouter = typeof appRouter;
