import { pgTable, pgEnum, uuid, text, timestamp, boolean, primaryKey, bigserial, date, integer, numeric, type AnyPgColumn } from "drizzle-orm/pg-core";
export const userStatus = pgEnum("user_status", ["pending", "approved", "rejected", "deactivated"]);
export const userRole = pgEnum("user_role", ["super_admin", "admin", "seat_owner", "viewer"]);
export const sheetTab = pgEnum("sheet_tab", ["hr", "business_development", "scheduling", "financial", "clinical", "founder_transition", "weekly_kpi_report", "compliance", "quarterly_goals", "scorecard", "targets", "help"]);
export const auditAction = pgEnum("audit_action", ["create", "update", "clear", "approve_user", "reject_user", "deactivate_user", "change_role", "change_tabs", "edit_goal", "extend_weeks"]);
export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(), email: text().notNull().unique(), name: text(), image: text(), passwordHash: text("password_hash"), mustChangePassword: boolean("must_change_password").notNull().default(false), requestedDepartment: text("requested_department"),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  status: userStatus().notNull().default("pending"), role: userRole(),
  approvedBy: uuid("approved_by").references((): AnyPgColumn => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});
export const userTabs = pgTable("user_tabs", { userId: uuid("user_id").notNull().references(() => users.id), tab: sheetTab().notNull(), canEdit: boolean("can_edit").notNull().default(false), canRead: boolean("can_read").notNull().default(false), canCreate: boolean("can_create").notNull().default(false), canUpdate: boolean("can_update").notNull().default(false), canDelete: boolean("can_delete").notNull().default(false) }, (t) => [primaryKey({ columns: [t.userId, t.tab] })]);
export const auditLog = pgTable("audit_log", { id: bigserial({ mode: "number" }).primaryKey(), userId: uuid("user_id").notNull().references(() => users.id), action: auditAction().notNull(), tab: text(), cell: text(), weekEnding: date("week_ending"), field: text(), oldValue: text("old_value"), newValue: text("new_value"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() });
export const accounts = pgTable("accounts", { userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), type: text().notNull(), provider: text().notNull(), providerAccountId: text("provider_account_id").notNull(), refresh_token: text(), access_token: text(), expires_at: integer(), token_type: text(), scope: text(), id_token: text(), session_state: text() }, (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]);
export const sessions = pgTable("sessions", { sessionToken: text("session_token").primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), expires: timestamp({ withTimezone: true }).notNull() });
export const verificationTokens = pgTable("verification_tokens", { identifier: text().notNull(), token: text().notNull(), expires: timestamp({ withTimezone: true }).notNull() }, (t) => [primaryKey({ columns: [t.identifier, t.token] })]);

export const rateLimits = pgTable("rate_limits", {key: text().primaryKey(), window: integer().notNull(), count: integer().notNull()});
export const operations = pgTable("operations", {id: uuid().primaryKey().defaultRandom(), userId: uuid("user_id").notNull().references(()=>users.id), action: text().notNull(), tab: text().notNull(), record: text().notNull(), fields: text().notNull(), status: text().notNull().default("pending"), createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow(), completedAt: timestamp("completed_at",{withTimezone:true})});

// Feature tables introduced by scripts/migrations/0022_management.sql.
// Do not regenerate the old baseline migration against a populated Neon project.
export const priorityActions=pgTable('kpi_priority_actions',{
 id:uuid().primaryKey().defaultRandom(),title:text().notNull(),owner:text().notNull(),
 dueDate:date('due_date'),status:text().notNull().default('open'),notes:text().notNull().default(''),
 createdBy:uuid('created_by').notNull().references(()=>users.id),updatedBy:uuid('updated_by').notNull().references(()=>users.id),
 version:integer().notNull().default(1),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow(),
});
export const targetRequests=pgTable('kpi_target_requests',{
 id:uuid().primaryKey().defaultRandom(),cell:text().notNull(),metric:text().notNull(),
 expectedFormatted:text('expected_formatted').notNull(),newValue:numeric('new_value').notNull(),
 rationale:text().notNull(),status:text().notNull().default('pending'),
 requestedBy:uuid('requested_by').notNull().references(()=>users.id),reviewedBy:uuid('reviewed_by').references(()=>users.id),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),reviewedAt:timestamp('reviewed_at',{withTimezone:true}),
});

export const passwordResetTokens=pgTable('kpi_password_reset_tokens',{
 tokenHash:text('token_hash').primaryKey(),userId:uuid('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
 expiresAt:timestamp('expires_at',{withTimezone:true}).notNull(),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
});
export const notificationDeliveries=pgTable('kpi_notification_deliveries',{
 messageKey:text('message_key').primaryKey(),recipient:text().notNull(),category:text().notNull(),
 status:text().notNull().default('pending'),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
 sentAt:timestamp('sent_at',{withTimezone:true}),
});
