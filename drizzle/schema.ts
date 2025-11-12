import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de testes de dons
 */
export const giftTests = mysqlTable("gift_tests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  organization: varchar("organization", { length: 255 }),
  status: mysqlEnum("status", ["in_progress", "awaiting_external", "completed"]).default("in_progress").notNull(),
  selfAnswers: json("self_answers").$type<number[]>(), // 180 respostas de autoavaliação
  externalToken1: varchar("external_token_1", { length: 64 }),
  externalToken2: varchar("external_token_2", { length: 64 }),
  externalAnswers1: json("external_answers_1").$type<number[]>(), // 30 respostas da primeira pessoa
  externalAnswers2: json("external_answers_2").$type<number[]>(), // 30 respostas da segunda pessoa
  externalCompleted1: boolean("external_completed_1").default(false).notNull(), // Se o link 1 já foi respondido
  externalCompleted2: boolean("external_completed_2").default(false).notNull(), // Se o link 2 já foi respondido
  manifestGifts: json("manifest_gifts").$type<string[]>(), // Dons manifestos calculados
  latentGifts: json("latent_gifts").$type<string[]>(), // Dons latentes calculados
  resultSentAt: timestamp("result_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type GiftTest = typeof giftTests.$inferSelect;
export type InsertGiftTest = typeof giftTests.$inferInsert;
