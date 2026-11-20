import { z } from "zod";
export const PRODUCTION_SHEET_ID = "1_IIHD2hMsgUuvZvFSD9CnLiXhbyBk-nX4u8v6rTsQaI";
const optional = z.preprocess((v) => v === "" ? undefined : v, z.string().optional());
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  APP_TIMEZONE: z.string().default("America/New_York").refine((v) => { try { new Intl.DateTimeFormat("en", { timeZone: v }); return true; } catch { return false; } }, "Invalid IANA timezone"),
  GOOGLE_SHEET_ID: optional, GOOGLE_SERVICE_ACCOUNT_EMAIL: optional, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: optional,
  DATABASE_URL: optional, AUTH_SECRET: optional, AUTH_URL: optional, AUTH_GOOGLE_ID: optional, AUTH_GOOGLE_SECRET: optional,
  ALLOWED_GOOGLE_DOMAIN: z.string().default("dawsonhomecare.com"), INITIAL_ADMIN_EMAILS: optional,
  RESEND_API_KEY: optional, EMAIL_FROM: optional, ADMIN_NOTIFY_EMAILS: optional, SENTRY_DSN: optional,
  SHEET_GATEWAY: z.enum(["service_account", "apps_script"]).default("service_account"),
  APPS_SCRIPT_URL: optional, APPS_SCRIPT_SECRET: optional,
}).superRefine((env, ctx) => {
  // next build sets NODE_ENV=production even for local and preview builds.
  if (env.GOOGLE_SHEET_ID === PRODUCTION_SHEET_ID && env.VERCEL_ENV !== "production") {
    ctx.addIssue({ code: "custom", path: ["GOOGLE_SHEET_ID"], message: "The production sheet is forbidden outside the production deployment." });
  }
});
export function parseEnv(source: Record<string, string | undefined>) { return schema.parse(source); }
export function requireSheetsEnv(source = process.env) {
  const env = parseEnv(source);
  return z.object({ GOOGLE_SHEET_ID: z.string().min(1), GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email(), GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().min(1) }).parse(env);
}
