import "server-only";
import {createHash} from "node:crypto";
import {departments,range,FIRST_ROW,LAST_ROW,type Cell,type Department} from "./schema";
import {display,normalize,serialDate} from "./values";
import {readRanges,writeRanges} from "./gateway";
import {HttpError} from "@/lib/http";
export type Row={id:string;row:number;version:string;filled:boolean;values:Record<string,string>};
const hash=(cells:Cell[])=>createHash("sha256").update(JSON.stringify(cells)).digest("hex");
export async function load(tab:Department){const d=departments[tab];const last=d.fields.at(-1)!.column;const [raw,formulas]=await readRanges([range(tab,`A${FIRST_ROW}`,`${last}${LAST_ROW}`)]).then(async ([v])=>[v,(await readRanges([range(tab,`A${FIRST_ROW}`,`${last}${LAST_ROW}`)],"FORMULA"))[0]]);return Array.from({length:LAST_ROW-FIRST_ROW+1},(_,i)=>{const cells=d.fields.map((_,j)=>raw[i]?.[j]??"");const entered=d.fields.map((_,j)=>formulas[i]?.[j]??"");const row=i+FIRST_ROW;const id=d.weekly&&typeof cells[0]==="number"?serialDate(cells[0]):d.weekly?"":String(row);return {cells,entered,row,id,version:hash(entered),filled:d.fields.some((f,j)=>!f.readonly&&entered[j]!==""),values:Object.fromEntries(d.fields.map((f,j)=>[f.column,display(f,cells[j])]))};});}
export type Loaded=Awaited<ReturnType<typeof load>>[number];
export function publicRow(r:Loaded):Row{return {id:r.id,row:r.row,version:r.version,filled:r.filled,values:r.values};}
export function plan(tab:Department,row:Loaded,fields:Record<string,unknown>,clear=false){const d=departments[tab];const changes=new Map<string,Cell>();for(const key of Object.keys(fields)){if(!d.fields.some(f=>f.column===key&&!f.readonly))throw new HttpError(400,"Unknown or protected field");}for(const [i,f] of d.fields.entries()){if(f.readonly)continue;if(!clear&&!Object.hasOwn(fields,f.column))continue;if(typeof row.entered[i]==="string"&&String(row.entered[i]).startsWith("="))throw new HttpError(409,"Unexpected formula in editable cell; ask administrator to review");try{changes.set(f.column,clear?"":normalize(f,fields[f.column]));}catch(e){throw new HttpError(400,e instanceof Error?e.message:"Invalid value");}}
 if(tab==="weekly_kpi_report"){const value=(c:string)=>changes.get(c)??row.cells[c.charCodeAt(0)-65];if(clear||changes.has("D")||changes.has("E")){const a=value("D"),b=value("E");if(String(row.entered[6]).startsWith("="))throw new HttpError(409,"Variance contains an unexpected formula");changes.set("G",clear||a===""||b===""?"":Math.round((Number(b)-Number(a))*100)/100);}}
 const updates=[...changes].filter(([c,v])=>row.entered[c.charCodeAt(0)-65]!==v).map(([c,v])=>({range:range(tab,`${c}${row.row}`),values:[[v]]}));return {updates,columns:updates.map(x=>x.range.split("!")[1])};}
export async function save(updates:ReturnType<typeof plan>["updates"]){await writeRanges(updates);}
