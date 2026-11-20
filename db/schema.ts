import { pgTable, pgEnum, uuid, text, timestamp, boolean, primaryKey, bigserial, date, integer, type AnyPgColumn } from "drizzle-orm/pg-core";
export const userStatus = pgEnum("user_status", ["pending", "approved", "rejected", "deactivated"]);
export const userRole = pgEnum("user_role", ["admin", "seat_owner", "viewer"]);
export const sheetTab = pgEnum("sheet_tab", ["hr", "business_development", "scheduling", "financial", "clinical", "founder_transition", "weekly_kpi_report", "compliance", "quarterly_goals"]);
export const auditAction = pgEnum("audit_action", ["create", "update", "clear", "approve_user", "reject_user", "deactivate_user", "change_role", "change_tabs", "edit_goal", "extend_weeks"]);
export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(), email: text().notNull().unique(), name: text(), image: text(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  status: userStatus().notNull().default("pending"), role: userRole(),
  approvedBy: uuid("approved_by").references((): AnyPgColumn => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});
export const userTabs = pgTable("user_tabs", { userId: uuid("user_id").notNull().references(() => users.id), tab: sheetTab().notNull(), canEdit: boolean("can_edit").notNull().default(true) }, (t) => [primaryKey({ columns: [t.userId, t.tab] })]);
export const auditLog = pgTable("audit_log", { id: bigserial({ mode: "number" }).primaryKey(), userId: uuid("user_id").notNull().references(() => users.id), action: auditAction().notNull(), tab: text(), cell: text(), weekEnding: date("week_ending"), field: text(), oldValue: text("old_value"), newValue: text("new_value"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() });
export const accounts = pgTable("accounts", { userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), type: text().notNull(), provider: text().notNull(), providerAccountId: text("provider_account_id").notNull(), refresh_token: text(), access_token: text(), expires_at: integer(), token_type: text(), scope: text(), id_token: text(), session_state: text() }, (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]);
export const sessions = pgTable("sessions", { sessionToken: text("session_token").primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), expires: timestamp({ withTimezone: true }).notNull() });
export const verificationTokens = pgTable("verification_tokens", { identifier: text().notNull(), token: text().notNull(), expires: timestamp({ withTimezone: true }).notNull() }, (t) => [primaryKey({ columns: [t.identifier, t.token] })]);
