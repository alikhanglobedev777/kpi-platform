import {describe,it,expect} from "vitest";
import {selectMutationRow} from "@/lib/sheets/mutation";
import type {Loaded} from "@/lib/sheets/records";
const row=(id:string,filled:boolean,version:string,entered:(string|number)[]=[]):Loaded=>({
  id,row:14,filled,version,entered,cells:entered,values:{},
});
describe("CRUD record selection",()=>{
  it("creates a weekly entry only against its existing Saturday key and revision",()=>{
    const r=row("2026-11-14",false,"abc");
    expect(selectMutationRow("hr",[r],"create",r.id,"abc")).toBe(r);
    expect(()=>selectMutationRow("hr",[r],"create",r.id)).toThrow(/changed/i);
    expect(()=>selectMutationRow("hr",[r],"create","2026-12-12","abc")).toThrow(/No available/);
  });
  it("rejects overwriting reported weeks and stale edits",()=>{
    const r=row("2026-11-14",true,"new");
    expect(()=>selectMutationRow("hr",[r],"create",r.id,"new")).toThrow(/already exists/);
    expect(()=>selectMutationRow("hr",[r],"update",r.id,"old")).toThrow(/changed/i);
    expect(selectMutationRow("hr",[r],"update",r.id,"new")).toBe(r);
  });
  it("never deletes unreported rows or selects the wrong date",()=>{
    const r=row("2026-11-14",false,"v");
    expect(()=>selectMutationRow("hr",[r],"delete",r.id,"v")).toThrow(/empty/);
    expect(()=>selectMutationRow("hr",[r],"delete","2026-11-21","v")).toThrow(/not found/i);
  });
  it("uses a genuinely empty row for list creation",()=>{
    const busy=row("14",true,"one",["Q4"]);
    const blank=row("15",false,"two",["","",""]);
    expect(selectMutationRow("compliance",[busy,blank],"create")).toBe(blank);
    expect(()=>selectMutationRow("compliance",[busy],"create")).toThrow(/No available/);
  });
});
