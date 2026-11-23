import {NextResponse} from 'next/server';
import {and,desc,eq,sql} from 'drizzle-orm';
import {z} from 'zod';
import {getDb} from '@/db';
import {priorityActions,operations} from '@/db/schema';
import {requireAdmin} from '@/lib/auth/session';
import {fail,HttpError,json,sameOrigin} from '@/lib/http';
import {priorityInput} from '@/lib/management/rules';
import {limit} from '@/lib/auth/rate-limit';
export const dynamic='force-dynamic';
export async function GET(){try{await requireAdmin();const rows=await getDb().select().from(priorityActions).orderBy(desc(priorityActions.updatedAt)).limit(250);return NextResponse.json({rows},{headers:{'Cache-Control':'no-store'}});}catch(e){return fail(e);}}
export async function POST(r:Request){try{sameOrigin(r);const u=await requireAdmin();await limit(`priority:${u.id}`,30,1);const b=priorityInput.parse(await json(r));const db=getDb();const [v]=await db.insert(priorityActions).values({title:b.title,owner:b.owner,dueDate:b.dueDate||null,status:b.status,notes:b.notes,createdBy:u.id,updatedBy:u.id}).returning();await db.insert(operations).values({userId:u.id,tab:'management',action:'priority_create',record:v.id,fields:'title,owner,dueDate,status',status:'completed',completedAt:new Date()});return NextResponse.json({row:v},{status:201});}catch(e){return fail(e);}}
const change=z.object({id:z.string().uuid(),version:z.number().int().positive(),fields:priorityInput});
export async function PATCH(r:Request){try{sameOrigin(r);const u=await requireAdmin();await limit(`priority:${u.id}`,30,1);const b=change.parse(await json(r));const db=getDb();const [v]=await db.update(priorityActions).set({...b.fields,dueDate:b.fields.dueDate||null,updatedAt:new Date(),updatedBy:u.id,version:sql`${priorityActions.version}+1`}).where(and(eq(priorityActions.id,b.id),eq(priorityActions.version,b.version))).returning();if(!v)throw new HttpError(409,'Priority changed. Reload to edit the latest version.');await db.insert(operations).values({userId:u.id,tab:'management',action:'priority_update',record:v.id,fields:'title,owner,dueDate,status',status:'completed',completedAt:new Date()});return NextResponse.json({row:v});}catch(e){return fail(e);}}
// No destructive DELETE endpoint: keep completed/blocked action history for accountability.
