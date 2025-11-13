import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, giftTests, InsertGiftTest, GiftTest } from "../drizzle/schema";
import { ENV } from './_core/env';

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
