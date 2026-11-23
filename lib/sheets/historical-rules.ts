import type {Department} from "./schema";
export type Direction="H"|"L"|"I";
export type HistoricalStatus="Green"|"Yellow"|"Red"|"No data"|"Set goal"|"—";
export const KPI_SOURCE: ReadonlyArray<{tab:Department;column:string}>=[
  {tab:"business_development",column:"G"}, // 11 active clients
  {tab:"business_development",column:"B"}, // 12 new referrals
  {tab:"business_development",column:"C"}, // 13 assessments scheduled
  {tab:"business_development",column:"E"}, // 14 starts
  {tab:"business_development",column:"H"}, // 15 discharges
  {tab:"financial",column:"B"},             // 16 revenue
  {tab:"financial",column:"C"},             // 17 budget (informational)
  {tab:"financial",column:"D"},             // 18 actual payroll
  {tab:"financial",column:"E"},             // 19 payroll percentage
  {tab:"financial",column:"J"},             // 20 cash position
  {tab:"scheduling",column:"B"},            // 21 open shifts
  {tab:"scheduling",column:"C"},            // 22 overtime hours
  {tab:"scheduling",column:"D"},            // 23 uncovered shifts
  {tab:"hr",column:"B"},                    // 24 active caregivers
  {tab:"hr",column:"C"},                    // 25 new hires
  {tab:"hr",column:"F"},                    // 26 callouts
  {tab:"hr",column:"E"},                    // 27 turnover percentage
  {tab:"clinical",column:"I"},              // 28 client satisfaction
  {tab:"clinical",column:"F"},              // 29 incidents
  {tab:"clinical",column:"H"},              // 30 care plan compliance
  {tab:"founder_transition",column:"B"},    // 31 escalations
  {tab:"founder_transition",column:"D"},    // 32 Jay operations hours
];
export const PERCENT_ROWS=new Set([19,27,28,30]);
export const MONEY_ROWS=new Set([16,17,18,20]);
export function statusFor(actual:number|null,goal:number|null,direction:Direction):HistoricalStatus{
  if(direction==="I")return "—";
  if(goal===null)return "Set goal";
  if(actual===null)return "No data";
  if(direction==="H")return actual>=goal?"Green":actual>=goal*0.9?"Yellow":"Red";
  return actual<=goal?"Green":(goal===0?actual<=1:actual<=goal*1.1)?"Yellow":"Red";
}
export function trendFor(now:number|null,prior:number|null,direction:Direction):"Improving"|"Declining"|"Stable"|""{
  if(direction==="I"||now===null||prior===null)return "";
  if(now===prior)return "Stable";
  return (now>prior)===(direction==="H")?"Improving":"Declining";
}
export function pulseFor(statuses:HistoricalStatus[]){
  const red=statuses.filter(s=>s==="Red").length;
  if(red>=3)return "Red";
  if(red+statuses.filter(s=>s==="Yellow").length>0)return "Yellow";
  return statuses.some(s=>s==="Green")?"Green":"Waiting on numbers";
}
