import { z } from "zod";
export const PRODUCTION_SHEET_ID = "1_IIHD2hMsgUuvZvFSD9CnLiXhbyBk-nX4u8v6rTsQaI";
const optional = z.preprocess(v => v === "" ? undefined : v, z.string().optional());
const timezone = (fallback: string) => z.string().default(fallback).refine(v => { try { new Intl.DateTimeFormat("en", {timeZone:v}); return true; } catch {return false;} }, "Invalid IANA timezone");
const schema = z.object({
 NODE_ENV: z.enum(["development","test","production"]).default("development"),
 APP_ENV: z.enum(["development","staging","production"]).default("development"),
 ALLOW_PRODUCTION_SHEET: z.enum(["true","false"]).default("false"),
 APP_TIMEZONE: timezone("America/New_York"), SHEET_TIMEZONE: timezone("America/Los_Angeles"),
 GOOGLE_SHEET_ID: optional, GOOGLE_SERVICE_ACCOUNT_EMAIL: optional, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: optional,
 DATABASE_URL: optional, AUTH_URL: optional, INITIAL_ADMIN_EMAILS: optional,
}).superRefine((e,ctx)=>{if(e.GOOGLE_SHEET_ID===PRODUCTION_SHEET_ID && !(e.APP_ENV==="production" && e.ALLOW_PRODUCTION_SHEET==="true"))ctx.addIssue({code:"custom",path:["GOOGLE_SHEET_ID"],message:"Production workbook requires explicit production authorization."});});
export function parseEnv(source: Record<string,string|undefined>){return schema.parse(source);}
export function requireSheetsEnv(source: Record<string,string|undefined> = process.env){return z.object({GOOGLE_SHEET_ID:z.string().min(1),GOOGLE_SERVICE_ACCOUNT_EMAIL:z.string().email(),GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:z.string().min(1)}).parse(parseEnv(source));}
