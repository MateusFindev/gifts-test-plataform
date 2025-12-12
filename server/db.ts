import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  giftTests,
  InsertGiftTest,
  GiftTest,
  organizations,
  userOrganizations,
  Role,
  InsertUserOrganization,
} from "../drizzle/schema";
import { ENV } from "./_core/env";



let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==== Admin Users helpers ====

export type AdminUserRow = {
  id: number;
  name: string | null;
  email: string | null;
  role: Role;
  createdAt: Date;
  lastSignedIn: Date;
  organizationId: number | null;
  organizationName: string | null;
};

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      organizationId: userOrganizations.organizationId,
      organizationName: organizations.name,
    })
    .from(users)
    .leftJoin(userOrganizations, eq(userOrganizations.userId, users.id))
    .leftJoin(organizations, eq(organizations.id, userOrganizations.organizationId));

  const byId = new Map<number, AdminUserRow>();

  for (const row of rows) {
    if (!byId.has(row.id)) {
      byId.set(row.id, {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        createdAt: row.createdAt,
        lastSignedIn: row.lastSignedIn,
        organizationId: row.organizationId ?? null,
        organizationName: row.organizationName ?? null,
      });
    }
  }

  return Array.from(byId.values());
}

export async function createAdminUser(input: {
  name: string;
  email: string;
  role: Role;
  passwordHash?: string | null;
  organizationId?: number | null;
}): Promise<AdminUserRow> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const now = new Date();
  const openId = `local-admin-created:${input.email.toLowerCase()}:${now.getTime()}`;

  await db.insert(users).values({
    openId,
    name: input.name,
    email: input.email,
    loginMethod: "local-admin-created",
    role: input.role,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    passwordHash: input.passwordHash ?? null,
  });

  // Buscar o usuário recém criado
  const [rawUser] = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  if (!rawUser) {
    throw new Error("Failed to create admin user");
  }

  // Vincular a uma organização se for ORG_ADMIN ou END_USER
  if (input.organizationId && input.role !== "SUPER_ADMIN") {
    const membership: InsertUserOrganization = {
      userId: rawUser.id,
      organizationId: input.organizationId,
      role: input.role,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(userOrganizations).values(membership);
  }

  // Retornar linha completa
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      organizationId: userOrganizations.organizationId,
      organizationName: organizations.name,
    })
    .from(users)
    .leftJoin(userOrganizations, eq(userOrganizations.userId, users.id))
    .leftJoin(organizations, eq(organizations.id, userOrganizations.organizationId))
    .where(eq(users.id, rawUser.id))
    .limit(1);

  if (!user) {
    throw new Error("User not found after create");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    lastSignedIn: user.lastSignedIn,
    organizationId: user.organizationId ?? null,
    organizationName: user.organizationName ?? null,
  };
}

export async function updateAdminUser(input: {
  id: number;
  name: string;
  email: string;
  role: Role;
  passwordHash?: string | null;
  organizationId?: number | null;
}): Promise<AdminUserRow> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const now = new Date();

  const updateSet: Partial<InsertUser> & { updatedAt: Date } = {
    name: input.name,
    email: input.email,
    role: input.role,
    updatedAt: now,
  };

  if (input.passwordHash) {
    (updateSet as any).passwordHash = input.passwordHash;
  }

  await db.update(users).set(updateSet).where(eq(users.id, input.id));

  // Zera vínculos anteriores
  await db.delete(userOrganizations).where(eq(userOrganizations.userId, input.id));

  // Recria vínculo se role não for SUPER_ADMIN
  if (input.organizationId && input.role !== "SUPER_ADMIN") {
    const membership: InsertUserOrganization = {
      userId: input.id,
      organizationId: input.organizationId,
      role: input.role,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(userOrganizations).values(membership);
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      organizationId: userOrganizations.organizationId,
      organizationName: organizations.name,
    })
    .from(users)
    .leftJoin(userOrganizations, eq(userOrganizations.userId, users.id))
    .leftJoin(organizations, eq(organizations.id, userOrganizations.organizationId))
    .where(eq(users.id, input.id))
    .limit(1);

  if (!user) {
    throw new Error("User not found after update");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    lastSignedIn: user.lastSignedIn,
    organizationId: user.organizationId ?? null,
    organizationName: user.organizationName ?? null,
  };
}

export async function deleteUserById(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(userOrganizations).where(eq(userOrganizations.userId, id));
  await db.delete(users).where(eq(users.id, id));
}

export async function listActiveOrganizations() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      isActive: organizations.isActive,
    })
    .from(organizations);

  return rows
    .filter(row => row.isActive)
    .map(row => ({
      id: row.id,
      name: row.name,
    }));
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'SUPER_ADMIN';
      updateSet.role = 'SUPER_ADMIN';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by email: database not available");
    return undefined;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== ORGANIZAÇÕES (ADMIN) =====

export type OrganizationWithStats = {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  contactName: string | null;
  isActive: boolean;
  createdAt: Date;
  respondentCount: number;
  completedCount: number;
  completionRate: number;
};

function makeSlugFromName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function listOrganizationsWithStats(): Promise<OrganizationWithStats[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const orgRows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      email: organizations.email,
      contactName: organizations.contactName,
      isActive: organizations.isActive,
      createdAt: organizations.createdAt,
    })
    .from(organizations);

  const tests = await db
    .select({
      organizationId: giftTests.organizationId,
      status: giftTests.status,
    })
    .from(giftTests);

  const statsByOrg = new Map<number, { total: number; completed: number }>();

  for (const t of tests) {
    if (!t.organizationId) continue;
    const current = statsByOrg.get(t.organizationId) ?? { total: 0, completed: 0 };
    current.total += 1;
    if (t.status === "completed") current.completed += 1;
    statsByOrg.set(t.organizationId, current);
  }

  return orgRows.map(org => {
    const stats = statsByOrg.get(org.id) ?? { total: 0, completed: 0 };
    const completionRate = stats.total === 0 ? 0 : stats.completed / stats.total;

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email ?? null,
      contactName: org.contactName ?? null,
      isActive: org.isActive,
      createdAt: org.createdAt,
      respondentCount: stats.total,
      completedCount: stats.completed,
      completionRate,
    };
  });
}

export async function createOrganizationAdmin(input: {
  name: string;
  email?: string | null;
  contactName?: string | null;
  isActive: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const slug = makeSlugFromName(input.name);

  await db.insert(organizations).values({
    name: input.name,
    slug,
    email: input.email ?? null,
    contactName: input.contactName ?? null,
    isActive: input.isActive,
    createdAt: now,
    updatedAt: now,
  });

  const all = await listOrganizationsWithStats();
  const created = all.find(o => o.slug === slug);
  if (!created) throw new Error("Failed to create organization");

  return created;
}

export async function updateOrganizationAdmin(input: {
    id: number;
    name: string;
    email?: string | null;
    contactName?: string | null;
    isActive: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(organizations)
    .set({
      name: input.name,
      email: input.email ?? null,
      contactName: input.contactName ?? null,
      isActive: input.isActive,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, input.id));

  const all = await listOrganizationsWithStats();
  const updated = all.find(o => o.id === input.id);
  if (!updated) throw new Error("Organization not found after update");

  return updated;
}

export async function organizationHasGiftTests(orgId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({ id: giftTests.id })
    .from(giftTests)
    .where(eq(giftTests.organizationId, orgId))
    .limit(1);

  return rows.length > 0;
}

export async function deleteOrganizationAdmin(orgId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(organizations).where(eq(organizations.id, orgId));
}



// Gift Test helpers
export async function createGiftTest(data: InsertGiftTest): Promise<GiftTest> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(giftTests).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(giftTests).where(eq(giftTests.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getGiftTestById(id: number): Promise<GiftTest | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(giftTests).where(eq(giftTests.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getGiftTestByEmail(email: string): Promise<GiftTest | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(giftTests).where(eq(giftTests.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllGiftTestsByEmail(email: string): Promise<GiftTest[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(giftTests).where(eq(giftTests.email, email));
  // Ordenar por data de criação (mais recente primeiro)
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getGiftTestByExternalToken(token: string): Promise<GiftTest | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const allTests = await db.select().from(giftTests);
  return allTests.find(test => test.externalToken1 === token || test.externalToken2 === token);
}

export async function updateGiftTest(id: number, data: Partial<InsertGiftTest>): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(giftTests).set(data).where(eq(giftTests.id, id));
}


export type AdminResultListItem = {
  id: number;
  name: string;
  email: string;
  organizationId: number | null;
  organizationName: string | null;
  status: GiftTest["status"];
  createdAt: Date;
  updatedAt: Date;
};

export async function listAdminResults(): Promise<AdminResultListItem[]> {
  
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const rows = await db
    .select({
      id: giftTests.id,
      name: giftTests.name,
      email: giftTests.email,
      organizationId: giftTests.organizationId,
      organizationName: organizations.name,
      fallbackOrganization: giftTests.organization,
      status: giftTests.status,
      createdAt: giftTests.createdAt,
      updatedAt: giftTests.updatedAt,
    })
    .from(giftTests)
    .leftJoin(organizations, eq(giftTests.organizationId, organizations.id));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    organizationId: row.organizationId,
    organizationName:
      row.organizationName ?? row.fallbackOrganization ?? null,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function deleteGiftTestById(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.delete(giftTests).where(eq(giftTests.id, id));
}
