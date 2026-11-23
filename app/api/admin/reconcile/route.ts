import {NextResponse} from 'next/server';
import {and,desc,eq} from 'drizzle-orm';
import {z} from 'zod';
import {getDb} from '@/db';
import {operations} from '@/db/schema';
import {requireAdmin} from '@/lib/auth/session';
import {fail,HttpError,json,sameOrigin} from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(){try{await requireAdmin();const rows=await getDb().select().from(operations).where(eq(operations.status,'pending')).orderBy(desc(operations.createdAt)).limit(100);return NextResponse.json({rows},{headers:{'Cache-Control':'no-store'}});}catch(e){return fail(e);}}
const body=z.object({id:z.string().uuid(),outcome:z.enum(['verified_applied','verified_not_applied']),evidence:z.string().trim().min(12).max(300)});
export async function POST(r:Request){try{sameOrigin(r);const admin=await requireAdmin();if(admin.role!=='super_admin')throw new HttpError(403,'Super Admin confirmation required');const b=body.parse(await json(r));const db=getDb();const [original]=await db.update(operations).set({status:b.outcome,completedAt:new Date()}).where(and(eq(operations.id,b.id),eq(operations.status,'pending'))).returning();
 if(!original)throw new HttpError(409,'Operation has already been reconciled');
 await db.insert(operations).values({userId:admin.id,action:'manual_reconciliation',tab:'audit',record:b.id,fields:JSON.stringify({outcome:b.outcome,evidence:b.evidence}),status:'completed',completedAt:new Date()});
 return NextResponse.json({ok:true});}catch(e){return fail(e);}}
