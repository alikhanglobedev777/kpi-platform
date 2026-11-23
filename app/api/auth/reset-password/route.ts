import {NextResponse} from 'next/server';
import {and,eq,gt} from 'drizzle-orm';
import {z} from 'zod';
import {getDb} from '@/db';
import {passwordResetTokens,sessions,users,operations} from '@/db/schema';
import {hashPassword} from '@/lib/auth/password';
import {hashResetToken} from '@/lib/notifications/reset';
import {fail,HttpError,json,sameOrigin} from '@/lib/http';
import {limit} from '@/lib/auth/rate-limit';
export const dynamic='force-dynamic';
const input=z.object({token:z.string().min(30).max(150),password:z.string().min(12).max(128)});
export async function POST(r:Request){try{
 sameOrigin(r);await limit('reset-global',90,15);
 const b=input.parse(await json(r)),hash=hashResetToken(b.token);
 await limit(`reset:${hash}`,8,15);
 const db=getDb();
 const [token]=await db.delete(passwordResetTokens).where(and(eq(passwordResetTokens.tokenHash,hash),gt(passwordResetTokens.expiresAt,new Date()))).returning({userId:passwordResetTokens.userId});
 if(!token)throw new HttpError(400,'Reset link expired or already used. Request a new link.');
 const [user]=await db.select({status:users.status}).from(users).where(eq(users.id,token.userId));
 if(!user||user.status!=='approved')throw new HttpError(403,'Account is not approved');
 await db.batch([
  db.update(users).set({passwordHash:await hashPassword(b.password),mustChangePassword:false}).where(eq(users.id,token.userId)),
  db.delete(sessions).where(eq(sessions.userId,token.userId)),
  db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId,token.userId)),
  db.insert(operations).values({userId:token.userId,action:'password_reset',tab:'auth',record:token.userId,fields:'password',status:'completed',completedAt:new Date()}),
 ]);
 return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}catch(e){return fail(e);}}
