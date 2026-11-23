import {describe,it,expect} from "vitest";
import {coverageFor,reportingWeeks,weeklyModules} from "@/lib/reporting/coverage";
const blank={id:"2026-11-14",values:{B:"",C:"",D:""}};
const populated={id:"2026-11-14",values:{B:"0",C:"1",D:""}};
describe("reporting coverage (not certification)",()=>{
 it("shows only the six weekly data-entry departments",()=>{expect(weeklyModules).toHaveLength(6);expect(weeklyModules).not.toContain("quarterly_goals");});
 it("counts a recorded zero as data, but not an empty value",()=>{const c=coverageFor("scheduling",[populated],"2026-11-14");expect(c.reported).toBe(true);expect(c.entered).toBe(2);expect(c.expected).toBe(3);expect(c.status).toBe("partial");});
 it("does not equate missing weeks with completed submissions",()=>{expect(coverageFor("scheduling",[blank],"2026-11-14").status).toBe("none");expect(coverageFor("scheduling",[],"2026-11-14").reported).toBe(false);});
 it("generates Saturday reporting weeks in descending order",()=>{expect(reportingWeeks("2026-11-21",3)).toEqual(["2026-11-21","2026-11-14","2026-11-07"]);});
});
