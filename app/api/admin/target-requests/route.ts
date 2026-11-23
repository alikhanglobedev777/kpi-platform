import {NextResponse} from 'next/server';
import {and,desc,eq} from 'drizzle-orm';
import {z} from 'zod';
import {getDb} from '@/db';
import {targetRequests,operations} from '@/db/schema';
import {requireAdmin} from '@/lib/auth/session';
import {fail,HttpError,json,sameOrigin} from '@/lib/http';
import {targetInput,validateGoal,safeScorecardGoal} from '@/lib/management/rules';
import {readRanges,writeRanges} from '@/lib/sheets/gateway';
import {withWriteLock} from '@/lib/write-lock';
import {limit} from '@/lib/auth/rate-limit';
export const dynamic='force-dynamic';
export async function GET(){try{await requireAdmin();const rows=await getDb().select().from(targetRequests).orderBy(desc(targetRequests.createdAt)).limit(200);return NextResponse.json({rows},{headers:{'Cache-Control':'no-store'}});}catch(e){return fail(e);}}
export async function POST(r:Request){try{sameOrigin(r);const u=await requireAdmin();await limit(`target-request:${u.id}`,12,60);const b=targetInput.parse(await json(r));try{validateGoal(b.cell,b.newValue);}catch{throw new HttpError(400,'Invalid target goal');}const range=`'Executive Scorecard'!${b.cell}`;
 const [[formatted],[raw],[name]]=await Promise.all([readRanges([range],'FORMATTED_VALUE'),readRanges([range],'FORMULA'),readRanges([`'Executive Scorecard'!A${b.cell.slice(1)}`],'FORMATTED_VALUE')]);
 if(String(raw[0]?.[0]??'').startsWith('='))throw new HttpError(409,'Goal cell contains a formula; cannot propose overwrite.');
 const metric=String(name[0]?.[0]??b.cell).slice(0,140);
 const [row]=await getDb().insert(targetRequests).values({cell:b.cell,metric,expectedFormatted:String(formatted[0]?.[0]??''),newValue:String(b.newValue),rationale:b.rationale,requestedBy:u.id}).returning();return NextResponse.json({row},{status:201});
 }catch(e){return fail(e);}}
const review=z.object({id:z.string().uuid(),decision:z.enum(['approved','rejected'])});
export async function PATCH(r:Request){try{sameOrigin(r);const u=await requireAdmin();if(u.role!=='super_admin')throw new HttpError(403,'Super Admin approval required.');const b=review.parse(await json(r));await limit(`target-approve:${u.id}`,12,1);return await withWriteLock(async()=>{const db=getDb();const [proposal]=await db.select().from(targetRequests).where(eq(targetRequests.id,b.id)).limit(1);
 if(!proposal)throw new HttpError(404,'Proposal not found');if(proposal.status!=='pending')throw new HttpError(409,'Proposal already reviewed');if(!safeScorecardGoal(proposal.cell))throw new HttpError(400,'Protected goal');
 if(b.decision==='rejected'){const [updated]=await db.update(targetRequests).set({status:'rejected',reviewedBy:u.id,reviewedAt:new Date()}).where(and(eq(targetRequests.id,b.id),eq(targetRequests.status,'pending'))).returning();return NextResponse.json({ok:!!updated});}
 const value=Number(proposal.newValue);validateGoal(proposal.cell,value);
 const range=`'Executive Scorecard'!${proposal.cell}`;
 const [[formatted],[raw]]=await Promise.all([readRanges([range],'FORMATTED_VALUE'),readRanges([range],'FORMULA')]);
 if(String(formatted[0]?.[0]??'')!==proposal.expectedFormatted||String(raw[0]?.[0]??'').startsWith('=')){
  await db.update(targetRequests).set({status:'needs_review',reviewedBy:u.id,reviewedAt:new Date()}).where(eq(targetRequests.id,b.id));throw new HttpError(409,'Goal changed since request. Create a new proposal.');
 }
 const [op]=await db.insert(operations).values({userId:u.id,action:'target_approval',tab:'scorecard',record:proposal.cell,fields:proposal.cell}).returning({id:operations.id});
 try{
  await writeRanges([{range,values:[[value]]}]);
  const [verified]=await readRanges([range],'FORMULA');
  const stored=verified[0]?.[0];
  if(typeof stored!=='number'||Math.abs(stored-value)>1e-8)throw new Error('Goal write could not be verified');
 }catch{throw new HttpError(502,'Sheet write outcome uncertain. Reconcile in the audit log before retrying.');}
 await db.batch([db.update(targetRequests).set({status:'approved',reviewedBy:u.id,reviewedAt:new Date()}).where(eq(targetRequests.id,b.id)),db.update(operations).set({status:'completed',completedAt:new Date()}).where(eq(operations.id,op.id))]);
 return NextResponse.json({ok:true});
 });}catch(e){return fail(e);}}
