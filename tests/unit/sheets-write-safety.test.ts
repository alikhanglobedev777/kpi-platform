import {describe,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
vi.mock("../../lib/sheets/gateway",()=>({readRanges:vi.fn(),writeRanges:vi.fn()}));
import {plan,type Loaded} from "../../lib/sheets/records";
import {departments,type Cell,type Department} from "../../lib/sheets/schema";
function fixture(tab:Department):Loaded {
  const fields=departments[tab].fields;
  const cells:Cell[]=fields.map(f=>f.column==="A"&&departments[tab].weekly?46340:"");
  const entered=cells.slice();
  for(const [i,f] of fields.entries())if(f.readonly&&f.column!=="A"){entered[i]="=TEST_FORMULA()";cells[i]=0.125;}
  return {id:departments[tab].weekly?"2026-11-14":"14",row:14,filled:true,version:"fixture",cells,entered,values:Object.fromEntries(fields.map(f=>[f.column,""]))};
}
describe("formula-safe write planning",()=>{
  it("updates only changed HR input cells, preserves dates and calculated turnover",()=>{const row=fixture("hr");const p=plan("hr",row,{B:"50",D:"2",H:"95",F:"0"});expect(p.updates).toEqual([
    {range:"'HR Dashboard'!B14",values:[[50]]},{range:"'HR Dashboard'!D14",values:[[2]]},{range:"'HR Dashboard'!F14",values:[[0]]},{range:"'HR Dashboard'!H14",values:[[0.95]]},
  ]);});
  it("refuses date keys, formula columns and unknown columns",()=>{const row=fixture("hr");for(const key of ["A","E","Z"])expect(()=>plan("hr",row,{[key]:"1"})).toThrow(/protected field/);});
  it("clears populated input cells without writing to formula cells",()=>{const row=fixture("financial");row.entered[1]=1000;row.entered[3]=400;expect(plan("financial",row,{},true).updates).toEqual([{range:"'Financial Dashboard'!B14",values:[[""]]},{range:"'Financial Dashboard'!D14",values:[[""]]}]);});
  it("rejects unexpected formulas even in input columns",()=>{const row=fixture("clinical");row.entered[5]="=SUM(A1:A2)";expect(()=>plan("clinical",row,{F:"0"})).toThrow(/Unexpected formula/);});
  it("does not replace blanks with numeric zeros or alter fields omitted in a partial update",()=>{const row=fixture("scheduling");row.entered[1]=4;expect(plan("scheduling",row,{B:""}).updates).toEqual([{range:"'Scheduling Dashboard'!B14",values:[[""]]}]);expect(plan("scheduling",row,{}).updates).toEqual([]);});
});

describe("boundary and injection checks",()=>{
  it("never writes the weekly reporting date or computed percentages on clear",()=>{
    for(const tab of ["hr","business_development","financial"] as const){
      const row=fixture(tab);
      row.entered[1]=100;
      const result=plan(tab,row,{},true);
      expect(result.updates.every(u=>!/[!]A\d+$/.test(u.range))).toBe(true);
      const formula=tab==="hr"?"E":tab==="business_development"?"F":"E";
      expect(result.updates.every(u=>!new RegExp(`!${formula}\\d+$`).test(u.range))).toBe(true);
    }
  });
  it("treats zero distinctly from blank and escapes formula-looking text",()=>{
    const row=fixture("hr");
    expect(plan("hr",row,{F:0}).updates[0].values).toEqual([[0]]);
    expect(plan("hr",row,{F:""}).updates.length).toBe(0);
    expect(plan("hr",row,{K:"=IMPORTDATA(\"https://example.org\")"}).updates[0].values[0][0]).toMatch(/^'/);
  });
  it("rejects invalid percentages and negative caregiver counts",()=>{
    const row=fixture("hr");
    for(const value of ["101","-1","NaN"]){expect(()=>plan("hr",row,{H:value})).toThrow();}
    expect(()=>plan("hr",row,{B:-1})).toThrow();
  });
});
