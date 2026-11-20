import {expect,it} from "vitest";
import {departments} from "../../lib/sheets/schema";
import {dateSerial,serialDate,normalize,previousSaturday} from "../../lib/sheets/values";
it("round trips dates and handles Saturday",()=>{expect(serialDate(dateSerial("2026-11-21"))).toBe("2026-11-21");expect(previousSaturday(new Date("2026-11-21T20:00Z"))).toBe("2026-11-14");expect(()=>dateSerial("2026-02-31")).toThrow();});
it("preserves zero, blank and percentages",()=>{const f=departments.hr.fields[7];expect(normalize(f,0)).toBe(0);expect(normalize(f," ".trim())).toBe("");expect(normalize(f,75)).toBe(.75);expect(()=>normalize(f,101)).toThrow();});
it("escapes formula-like text",()=>expect(normalize(departments.hr.fields[10],"=1+2")).toBe("'=1+2"));
