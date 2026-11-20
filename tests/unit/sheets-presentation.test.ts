import {describe,expect,it} from "vitest";
import {departments} from "../../lib/sheets/schema";
import {formatCell,latestCompletedRecord,visibleRecords,pageRecords,numericValue} from "../../lib/sheets/presentation";
import type {Row} from "../../lib/sheets/records";
const row=(id:string,filled:boolean,value=""):Row=>({id,filled,row:14,version:"test",values:{A:id,B:value}});
const rows=[row("2026-11-07",true,"0"),row("2026-11-14",true,"12"),row("2026-11-21",false),row("2026-11-28",true,"99")];
const options={weekly:true,cutoff:"2026-11-21",scope:"reported" as const,search:"",newest:true};
describe("dashboard presentation",()=>{
  it("formats percentages, currency and zero without treating missing cells as zero",()=>{
    expect(formatCell(departments.clinical.fields[7],"95")).toBe("95%");
    expect(formatCell(departments.financial.fields[1],"1234.5")).toBe("$1,234.50");
    expect(formatCell(departments.hr.fields[1],"0")).toBe("0");
    expect(formatCell(departments.hr.fields[1],"")).toBe("—");
    expect(numericValue("0")).toBe(0);expect(numericValue("")).toBeNull();
  });
  it("selects the latest completed populated week",()=>expect(latestCompletedRecord(rows,options.cutoff)?.id).toBe("2026-11-14"));
  it("hides future and empty weeks but makes them available explicitly",()=>{
    expect(visibleRecords(rows,options).map(r=>r.id)).toEqual(["2026-11-14","2026-11-07"]);
    expect(visibleRecords(rows,{...options,scope:"completed"})).toHaveLength(3);
    expect(visibleRecords(rows,{...options,scope:"all"})).toHaveLength(4);
  });
  it("supports date and text search, reverses sort and clamps pagination",()=>{
    expect(visibleRecords(rows,{...options,from:"2026-11-14",search:"12"})).toHaveLength(1);
    expect(visibleRecords(rows,{...options,newest:false})[0].id).toBe("2026-11-07");
    expect(pageRecords(Array.from({length:23},(_,i)=>i),9)).toEqual({pages:3,current:3,rows:[20,21,22]});
  });
});
