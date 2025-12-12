import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const roleEnumValues = ["SUPER_ADMIN", "ORG_ADMIN", "END_USER"] as const;
export type Role = (typeof roleEnumValues)[number];

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", roleEnumValues).default("END_USER").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const organizations = mysqlTable(
  "organizations",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    inviteCode: varchar("invite_code", { length: 64 }),
    domain: varchar("domain", { length: 255 }),
    email: varchar("email", { length: 320 }), 
    contactName: varchar("contact_name", { length: 255 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    slugIdx: uniqueIndex("organizations_slug_idx").on(table.slug),
    inviteCodeIdx: uniqueIndex("organizations_invite_code_idx").on(table.inviteCode),
  })
);


export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

export const userOrganizations = mysqlTable(
  "user_organizations",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: mysqlEnum("membership_role", roleEnumValues).default("END_USER").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    membershipUniqueIdx: uniqueIndex("user_org_unique_idx").on(table.userId, table.organizationId),
  })
);

export type UserOrganization = typeof userOrganizations.$inferSelect;
export type InsertUserOrganization = typeof userOrganizations.$inferInsert;

export interface GiftScoreRow {
  gift: string;
  score: number;
}

/**
 * Tabela de testes de dons
 */
export const giftTests = mysqlTable("gift_tests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  organization: varchar("organization", { length: 255 }),
  organizationId: int("organization_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  status: mysqlEnum("status", ["in_progress", "awaiting_external", "completed"])
    .default("in_progress")
    .notNull(),
  selfAnswers: json("self_answers").$type<number[]>(), // 180 respostas de autoavaliação
  externalToken1: varchar("external_token_1", { length: 64 }),
  externalToken2: varchar("external_token_2", { length: 64 }),
  externalAnswers1: json("external_answers_1").$type<number[]>(), // 30 respostas da primeira pessoa
  externalAnswers2: json("external_answers_2").$type<number[]>(), // 30 respostas da segunda pessoa
  externalCompleted1: boolean("external_completed_1").default(false).notNull(),
  externalCompleted2: boolean("external_completed_2").default(false).notNull(),

  // JÁ EXISTENTES
  manifestGifts: json("manifest_gifts").$type<string[]>(), // Dons manifestos calculados
  latentGifts: json("latent_gifts").$type<string[]>(),     // Dons latentes calculados

  // NOVOS CAMPOS COM PONTUAÇÃO
  manifestGiftScores: json("manifest_gift_scores").$type<GiftScoreRow[]>(),
  latentGiftScores: json("latent_gift_scores").$type<GiftScoreRow[]>(),

  resultSentAt: timestamp("result_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});


export type GiftTest = typeof giftTests.$inferSelect;
export type InsertGiftTest = typeof giftTests.$inferInsert;
