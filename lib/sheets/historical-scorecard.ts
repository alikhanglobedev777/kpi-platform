import "server-only";
import {HttpError} from "@/lib/http";
import {dateSerial,serialDate} from "./values";
import {departments,type Department} from "./schema";
import {readRanges} from "./gateway";
import {load,type Loaded} from "./records";
import {KPI_SOURCE,PERCENT_ROWS,MONEY_ROWS,pulseFor,statusFor,trendFor,type Direction} from "./historical-rules";
const tabs=Array.from(new Set(KPI_SOURCE.map(x=>x.tab)));
function numeric(row:Loaded|undefined,tab:Department,column:string):number|null{
  const at=departments[tab].fields.findIndex(f=>f.column===column);
  const value=at>=0?row?.cells[at]:undefined;
  return typeof value==="number"&&Number.isFinite(value)?value:null;
}
export async function historicalScorecard(week:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(week))throw new HttpError(400,"Select a valid Saturday reporting date");
  let prior:string;
  try{const serial=dateSerial(week);if(new Date(`${week}T00:00:00Z`).getUTCDay()!==6)throw new Error("Not Saturday");prior=serialDate(serial-7);}catch{throw new HttpError(400,"Select a valid Saturday reporting date");}
  const [source,rawInfo,directions]=await Promise.all([
    Promise.all(tabs.map(async tab=>[tab,await load(tab)] as const)),
    readRanges(["'Executive Scorecard'!A11:C32"],"UNFORMATTED_VALUE"),
    readRanges(["'Executive Scorecard'!M11:M32"],"FORMATTED_VALUE"),
  ]);
  const byTab=new Map<Department,Loaded[]>(source);
  const availableWeeks=(byTab.get("hr")??[]).map(r=>r.id).filter(Boolean);
  if(!availableWeeks.includes(week))throw new HttpError(400,"Week is outside the configured worksheet range");
  const cells=rawInfo[0]??[],signs=directions[0]??[];
  const metrics=KPI_SOURCE.map((item,i)=>{
    const line=i+11;
    const field=byTab.get(item.tab)??[];
    const actual=numeric(field.find(r=>r.id===week),item.tab,item.column);
    const previous=numeric(field.find(r=>r.id===prior),item.tab,item.column);
    const suppliedGoal=cells[i]?.[2];
    // Row 18's workbook goal is the selected week's Payroll Budget (scorecard C18=D17).
    const goal=line===18?numeric(byTab.get("financial")?.find(r=>r.id===week),"financial","C"):
      typeof suppliedGoal==="number"&&Number.isFinite(suppliedGoal)?suppliedGoal:null;
    const rawSign=String(signs[i]?.[0]??"");
    const direction:Direction=rawSign==="L"||rawSign==="I"?rawSign:"H";
    return {row:line,name:String(cells[i]?.[0]??`KPI ${line}`),owner:String(cells[i]?.[1]??""),
      goal,actual,previous,direction,trend:trendFor(actual,previous,direction),status:statusFor(actual,goal,direction),
      isPercent:PERCENT_ROWS.has(line),isMoney:MONEY_ROWS.has(line)};
  });
  return {week,previousWeek:prior,availableWeeks,metrics,pulse:pulseFor(metrics.map(m=>m.status)),
    note:"Historical statuses use the current saved scorecard goals and direction rules, not historical target versions. Clinical metrics read the department rows, even if the current scorecard is still manually populated."};
}
