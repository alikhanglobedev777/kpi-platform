import {NextResponse} from "next/server";
import {z} from "zod";
import {eq} from "drizzle-orm";
import {getDb} from "@/db";
import {operations,writeReceipts} from "@/db/schema";
import {matchesWrittenCells} from "@/lib/reliability/verify";
import {allowed,isAdmin,requirePermission,type User,type Grant,type Action} from "@/lib/auth/session";
import {isDepartment,departments,reportDepartment,type Department} from "@/lib/sheets/schema";
import {load,plan,publicRow,save,type Loaded} from "@/lib/sheets/records";
import {withWriteLock} from "@/lib/write-lock";
import {selectMutationRow} from "@/lib/sheets/mutation";
import {fail,HttpError,json,sameOrigin} from "@/lib/http";
import {limit} from "@/lib/auth/rate-limit";
const schema=z.object({id:z.string().max(40).optional(),version:z.string().length(64).optional(),fields:z.record(z.union([z.string(),z.number(),z.null()])).default({})});
function identifier(tab:string):Department{if(!isDepartment(tab))throw new HttpError(404,"Unknown department");return tab;}
function reportAllowed(u:User,p:Grant[],name:string,action:Action){return isAdmin(u)||Boolean(reportDepartment[name]&&allowed(u,p,reportDepartment[name],action));}
function visible(tab:Department,r:Loaded,u:User,p:Grant[]){return tab!=="weekly_kpi_report"||reportAllowed(u,p,r.values.B,"read");}
export const dynamic="force-dynamic";
export async function GET(_r:Request,{params}:{params:Promise<{tab:string}>}){try{const tab=identifier((await params).tab);const {u,p}=await requirePermission(tab,"read");await limit("read:"+u.id,40,1);const rows=(await load(tab)).filter(r=>r.id&&(departments[tab].weekly||r.filled)&&visible(tab,r,u,p)).map(publicRow);return NextResponse.json({rows,permissions:{create:allowed(u,p,tab,"create"),update:allowed(u,p,tab,"update"),delete:allowed(u,p,tab,"delete")},reportDepartments:tab==="weekly_kpi_report"?Object.keys(reportDepartment).filter(n=>reportAllowed(u,p,n,"read")):undefined},{headers:{"Cache-Control":"no-store"}});}catch(e){return fail(e);}}
async function mutate(r:Request,params:Promise<{tab:string}>,action:Exclude<Action,"read">){try{sameOrigin(r);const tab=identifier((await params).tab);const initial=await requirePermission(tab,action);await limit("write:"+initial.u.id,20,1);const b=schema.parse(await json(r));return await withWriteLock(async()=>{const {u,p}=await requirePermission(tab,action);const rows=await load(tab);const weekly=departments[tab].weekly;const row=selectMutationRow(tab,rows,action,b.id,b.version);if(tab==="weekly_kpi_report"){if(action!=="create"&&!reportAllowed(u,p,row.values.B,action))throw new HttpError(403,"Report department denied");const next=String(b.fields.B??row.values.B);if(action!=="delete"&&!reportAllowed(u,p,next,action))throw new HttpError(403,"Report department denied");}if(action==="create"&&!weekly){const required=tab==="weekly_kpi_report"?["A","B","C"]:tab==="compliance"?["A"]:["A","C"];if(required.some(k=>!String(b.fields[k]??"").trim()))throw new HttpError(400,"Complete required identifying fields");}const {updates,columns}=plan(tab,row,b.fields,action==="delete");if(!updates.length){if(action==="create")throw new HttpError(400,"Enter at least one value");return NextResponse.json({ok:true,unchanged:true});}const db=getDb();const [op]=await db.insert(operations).values({userId:u.id,action,tab,record:row.id,fields:JSON.stringify(columns)}).returning({id:operations.id});try{
 await save(updates);
 const latest=(await load(tab)).find(r=>r.row===row.row);
 if(!matchesWrittenCells(latest,updates))throw new Error('Write could not be verified against Google Sheets');
 await db.batch([
  db.insert(writeReceipts).values({operationId:op.id,beforeHash:row.version,afterHash:latest!.version}),
  db.update(operations).set({status:"completed",completedAt:new Date()}).where(eq(operations.id,op.id)),
 ]);
}catch{throw new HttpError(502,"Write outcome uncertain. Reload the record and reconcile the pending audit entry before retrying.");}return NextResponse.json({ok:true});});}catch(e){return fail(e);}}
export async function POST(r:Request,{params}:{params:Promise<{tab:string}>}){return mutate(r,params,"create");}
export async function PATCH(r:Request,{params}:{params:Promise<{tab:string}>}){return mutate(r,params,"update");}
export async function DELETE(r:Request,{params}:{params:Promise<{tab:string}>}){return mutate(r,params,"delete");}
