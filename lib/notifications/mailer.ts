import 'server-only';
import {createHash} from 'node:crypto';
import {getDb} from '@/db';
import {notificationDeliveries} from '@/db/schema';
import {eq} from 'drizzle-orm';

export function mailConfigured(){return Boolean(process.env.RESEND_API_KEY&&process.env.NOTIFY_FROM);}
export async function sendMail(to:string,subject:string,message:string,key:string){
 const apiKey=process.env.RESEND_API_KEY,from=process.env.NOTIFY_FROM;
 if(!apiKey||!from)throw new Error('Outbound email is not configured');
 const digest=createHash('sha256').update(key).digest('hex');
 const res=await fetch('https://api.resend.com/emails',{
  method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':digest},
  body:JSON.stringify({from,to:[to],subject,text:message}),cache:'no-store',signal:AbortSignal.timeout(12000),
 });
 if(!res.ok)throw new Error(`Mail provider returned ${res.status}`);
}
export async function sendOnce(messageKey:string,recipient:string,category:string,subject:string,message:string){
 const db=getDb();
 const [reserved]=await db.insert(notificationDeliveries).values({messageKey,recipient,category}).onConflictDoNothing().returning({messageKey:notificationDeliveries.messageKey});
 if(!reserved)return false;
 try{
  await sendMail(recipient,subject,message,messageKey);
  await db.update(notificationDeliveries).set({status:'sent',sentAt:new Date()}).where(eq(notificationDeliveries.messageKey,messageKey));
  return true;
 }catch(e){
  // Retrying uses the provider's idempotency key. Never silently discard a failed delivery.
  await db.delete(notificationDeliveries).where(eq(notificationDeliveries.messageKey,messageKey));
  throw e;
 }
}
