import { describe, expect, it } from "vitest";
import { parseEnv, PRODUCTION_SHEET_ID, requireSheetsEnv } from "../../lib/env";
describe("environment boundaries",()=>{
 it("allows setup without credentials",()=>expect(parseEnv({}).SHEET_TIMEZONE).toBe("America/Los_Angeles"));
 it.each(["development","staging","production"])("blocks production sheet without explicit authorization in %s",APP_ENV=>expect(()=>parseEnv({APP_ENV,GOOGLE_SHEET_ID:PRODUCTION_SHEET_ID})).toThrow());
 it("permits opted-in production",()=>expect(parseEnv({APP_ENV:"production",ALLOW_PRODUCTION_SHEET:"true",GOOGLE_SHEET_ID:PRODUCTION_SHEET_ID}).GOOGLE_SHEET_ID).toBe(PRODUCTION_SHEET_ID));
 it("requires credentials at connection time",()=>expect(()=>requireSheetsEnv({})).toThrow());
 it("rejects invalid timezones",()=>expect(()=>parseEnv({SHEET_TIMEZONE:"invalid"})).toThrow());
});
