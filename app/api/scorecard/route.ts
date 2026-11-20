import {NextResponse} from "next/server";
import {z} from "zod";
import {eq} from "drizzle-orm";
import {getDb} from "@/db";
import {operations} from "@/db/schema";
import {requireAdmin,requirePermission} from "@/lib/auth/session";
import {scorecard} from "@/lib/sheets/scorecard";
import {readRanges,writeRanges} from "@/lib/sheets/gateway";
import {fail,HttpError,json,sameOrigin} from "@/lib/http";
import {withWriteLock} from "@/lib/write-lock";
const body=z.object({cell:z.string(),value:z.union([z.number(),z.string()]),expected:z.string()});
export const dynamic="force-dynamic";
export async function GET(){try{await requirePermission("scorecard","read");return NextResponse.json(await scorecard(),{headers:{"Cache-Control":"no-store"}});}catch(e){return fail(e);}}
export async function PATCH(r:Request){try{sameOrigin(r);await requireAdmin();const b=body.parse(await json(r));const row=Number(b.cell.slice(1));const goal=/^C\d+$/.test(b.cell)&&row>=11&&row<=32&&![17,18].includes(row);const note=["K17","K20","A42","E42","A48"].includes(b.cell);if(!goal&&!note)throw new HttpError(400,"Protected scorecard cell");let v:string|number=b.value;if(goal){if(v!==""){if(typeof v!=="number"||!Number.isFinite(v)||v<0||v>1e12||([19,27,28,30].includes(row)&&v>1))throw new HttpError(400,"Invalid goal");}}else{if(typeof v!=="string"||v.length>500)throw new HttpError(400,"Invalid note");if(/^[=+\-@]/.test(v))v="'"+v;}return await withWriteLock(async()=>{const u=await requireAdmin();const range=`'Executive Scorecard'!${b.cell}`;const [formatted]=await readRanges([range],"FORMATTED_VALUE");const [raw]=await readRanges([range],"FORMULA");if(String(formatted[0]?.[0]??"")!==b.expected||String(raw[0]?.[0]??"").startsWith("="))throw new HttpError(409,"Scorecard changed or contains a formula. Reload.");const db=getDb();const [op]=await db.insert(operations).values({userId:u.id,action:goal?"edit_goal":"edit_note",tab:"scorecard",record:b.cell,fields:b.cell}).returning({id:operations.id});await writeRanges([{range,values:[[v]]}]);await db.update(operations).set({status:"completed",completedAt:new Date()}).where(eq(operations.id,op.id));return NextResponse.json({ok:true});});}catch(e){return fail(e);}}
