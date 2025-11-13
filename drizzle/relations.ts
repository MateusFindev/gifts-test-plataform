import { relations } from "drizzle-orm";
import { giftTests, organizations, userOrganizations, users } from "./schema";

export const userRelations = relations(users, ({ many }) => ({
  memberships: many(userOrganizations),
}));

export const organizationRelations = relations(organizations, ({ many }) => ({
  memberships: many(userOrganizations),
  giftTests: many(giftTests),
}));

export const userOrganizationRelations = relations(userOrganizations, ({ one }) => ({
  user: one(users, {
    fields: [userOrganizations.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [userOrganizations.organizationId],
    references: [organizations.id],
  }),
}));

export const giftTestRelations = relations(giftTests, ({ one }) => ({
  organization: one(organizations, {
    fields: [giftTests.organizationId],
    references: [organizations.id],
  }),
}));
