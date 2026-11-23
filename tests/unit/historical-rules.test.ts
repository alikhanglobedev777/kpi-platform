import {describe,it,expect} from "vitest";
import {KPI_SOURCE,PERCENT_ROWS,pulseFor,statusFor,trendFor} from "@/lib/sheets/historical-rules";
describe("historical scorecard policy parity",()=>{
 it("maps exactly 22 original scorecard metrics",()=>{expect(KPI_SOURCE).toHaveLength(22);expect(KPI_SOURCE[0]).toEqual({tab:"business_development",column:"G"});expect(KPI_SOURCE[17]).toEqual({tab:"clinical",column:"I"});});
 it("treats missing as missing and actual zero as zero",()=>{expect(statusFor(null,0,"L")).toBe("No data");expect(statusFor(0,0,"L")).toBe("Green");expect(statusFor(1,0,"L")).toBe("Yellow");expect(statusFor(2,0,"L")).toBe("Red");});
 it("uses correct higher, lower and informational thresholds",()=>{expect(statusFor(90,100,"H")).toBe("Yellow");expect(statusFor(89,100,"H")).toBe("Red");expect(statusFor(110,100,"L")).toBe("Yellow");expect(statusFor(111,100,"L")).toBe("Red");expect(statusFor(900,null,"H")).toBe("Set goal");expect(statusFor(900,0,"I")).toBe("—");});
 it("treats decreasing overtime as improvement",()=>{expect(trendFor(37,77,"L")).toBe("Improving");expect(trendFor(26,27,"H")).toBe("Declining");expect(trendFor(null,77,"L")).toBe("");});
 it("matches the original overall pulse thresholds",()=>{expect(pulseFor(["Red","Red","Red","Green"])).toBe("Red");expect(pulseFor(["Red","Green"])).toBe("Yellow");expect(pulseFor(["No data","Set goal"])).toBe("Waiting on numbers");expect(pulseFor(["Green","No data"])).toBe("Green");});
 it("lists the same percentage KPI rows as the existing scorecard",()=>{expect([...PERCENT_ROWS]).toEqual([19,27,28,30]);});
});
