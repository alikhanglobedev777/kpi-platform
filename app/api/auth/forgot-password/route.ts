import {NextResponse} from 'next/server';
import {eq} from 'drizzle-orm';
import {z} from 'zod';
import {getDb} from '@/db';
import {passwordResetTokens,users} from '@/db/schema';
import {fail,HttpError,json,sameOrigin} from '@/lib/http';
import {limit} from '@/lib/auth/rate-limit';
import {mailConfigured,sendMail} from '@/lib/notifications/mailer';
import {hashResetToken,newResetToken,RESET_TTL_MS,resetUrl} from '@/lib/notifications/reset';
export const runtime='nodejs';
export const maxDuration=30;
export const dynamic='force-dynamic';
const schema=z.object({email:z.string().trim().toLowerCase().email().max(254)});
export async function POST(r:Request){try{
 sameOrigin(r);const {email}=schema.parse(await json(r));await limit('forgot-global',100,15);await limit(`forgot:${email}`,4,60);
 if(!mailConfigured())throw new HttpError(503,'Email recovery is not configured. Contact your administrator.');
 if(process.env.NODE_ENV==='production'&&!process.env.AUTH_URL?.startsWith('https://'))throw new HttpError(503,'Recovery link requires a configured HTTPS origin.');
 const db=getDb();const [user]=await db.select({id:users.id,status:users.status}).from(users).where(eq(users.email,email)).limit(1);
 if(user?.status==='approved'){
  const token=newResetToken(),hash=hashResetToken(token);
  await db.insert(passwordResetTokens).values({tokenHash:hash,userId:user.id,expiresAt:new Date(Date.now()+RESET_TTL_MS)});
  try{await sendMail(email,'Dawson KPI password reset',`A password reset was requested. The link expires in 20 minutes:\n${resetUrl(process.env.AUTH_URL??new URL(r.url).origin,token)}\n\nIf you did not request this, you can ignore this message.`,`reset:${hash}`);}
  catch{await db.delete(passwordResetTokens).where(eq(passwordResetTokens.tokenHash,hash));throw new HttpError(503,'Recovery email could not be sent. Contact your administrator.');}
 }
 return NextResponse.json({ok:true,message:'If an approved account exists, a reset link has been sent.'},{headers:{'Cache-Control':'no-store'}});
}catch(e){return fail(e);}}
