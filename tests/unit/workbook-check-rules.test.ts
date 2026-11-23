import {describe,it,expect} from "vitest";
import {dateSerial,serialDate} from "@/lib/sheets/values";
import {weeklyDateCheck,calculatedColumnCheck,clinicalLookupCheck,targetErrorCheck} from "@/lib/sheets/workbook-check-rules";
const weeks=(start:string)=>Array.from({length:30},(_,i)=>[dateSerial(serialDate(dateSerial(start)+i*7))]);
describe("read-only workbook structural checks",()=>{
  it("accepts thirty consecutive Saturdays and warns when the range is exceeded",()=>{
    const rows=weeks("2026-10-24");
    expect(weeklyDateCheck("HR",rows,"2026-11-21").status).toBe("pass");
    expect(weeklyDateCheck("HR",rows,"2027-05-22").status).toBe("review");
  });
  it("identifies gaps, duplicate dates and non-Saturdays without modifying rows",()=>{
    const rows=weeks("2026-10-24");
    rows[1]=[rows[0][0]];
    expect(weeklyDateCheck("HR",rows,"2026-11-21").status).toBe("review");
    expect(weeklyDateCheck("HR",weeks("2026-10-23"),"2026-11-21").status).toBe("review");
    expect(weeklyDateCheck("HR",weeks("2026-10-31"),"2026-11-21").status).toBe("review");
    expect(weeklyDateCheck("HR",[],"2026-11-21").status).toBe("review");
  });
  it("checks formulas only for populated input rows, including explicit zeroes",()=>{
    const sources=[[0,2],[""],[15]];
    expect(calculatedColumnCheck("HR",sources,[["=IF(...)"],[],["=IF(...)"]]).status).toBe("pass");
    expect(calculatedColumnCheck("HR",sources,[["=IF(...)"],[],[0]]).status).toBe("review");
    expect(calculatedColumnCheck("HR",[],[]).status).toBe("review");
  });
  it("distinguishes hardcoded clinical cells from formulas",()=>{
    const valid=Array.from({length:3},()=>["=A1","=A2"]);
    expect(clinicalLookupCheck(valid).status).toBe("pass");
    valid[0][1]=1 as unknown as string;
    expect(clinicalLookupCheck(valid).detail).toContain("E28");
    expect(clinicalLookupCheck(valid).status).toBe("review");
  });
  it("reports visible target-cell spreadsheet errors",()=>{
    expect(targetErrorCheck([[["#ERROR!"]],[["+2 a month"]]]).status).toBe("review");
    expect(targetErrorCheck([[["normal"]],[["normal"]]]).status).toBe("pass");
  });
});
