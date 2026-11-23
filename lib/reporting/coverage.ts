import {departments,type Department} from "@/lib/sheets/schema";
import {dateSerial,serialDate} from "@/lib/sheets/values";
import type {Loaded} from "@/lib/sheets/records";
export const weeklyModules=(Object.keys(departments) as Department[]).filter(k=>departments[k].weekly);
export type Coverage={reported:boolean;entered:number;expected:number;ratio:number;status:"none"|"partial"|"present"};
export function reportingWeeks(cutoff:string,count=8){
  const n=dateSerial(cutoff);
  return Array.from({length:Math.max(0,Math.min(30,count))},(_,i)=>serialDate(n-i*7));
}
export function coverageFor(tab:Department,rows:Pick<Loaded,"id"|"values">[],week:string):Coverage{
  const fields=departments[tab].fields.filter(f=>!f.readonly&&!["text","enum","date"].includes(f.kind));
  const current=rows.find(r=>r.id===week);
  const entered=fields.filter(f=>current?.values[f.column]!==undefined&&current.values[f.column]!=="").length;
  const reported=Boolean(current&&Object.entries(current.values).some(([c,v])=>v!==""&&departments[tab].fields.some(f=>f.column===c&&!f.readonly)));
  const expected=fields.length;
  return {reported,entered,expected,ratio:expected?Math.round(entered*100/expected):0,status:!reported?"none":entered<expected?"partial":"present"};
}
