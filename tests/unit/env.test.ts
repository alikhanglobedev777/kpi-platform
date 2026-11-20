import { describe, expect, it } from "vitest";
import { parseEnv, PRODUCTION_SHEET_ID, requireSheetsEnv } from "../../lib/env";
describe("environment boundaries", () => {
  it("allows setup without credentials", () => expect(parseEnv({}).APP_TIMEZONE).toBe("America/New_York"));
  it.each([undefined, "preview", "development"])("blocks production sheet in %s", (VERCEL_ENV) => expect(() => parseEnv({ NODE_ENV: "production", VERCEL_ENV, GOOGLE_SHEET_ID: PRODUCTION_SHEET_ID })).toThrow());
  it("requires credentials at connection time", () => expect(() => requireSheetsEnv({})).toThrow());
  it("rejects invalid timezones", () => expect(() => parseEnv({ APP_TIMEZONE: "invalid" })).toThrow());
});
