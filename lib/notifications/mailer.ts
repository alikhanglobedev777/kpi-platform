import 'server-only';
import {createHash} from 'node:crypto';
import nodemailer from 'nodemailer';
import {getDb} from '@/db';
import {notificationDeliveries} from '@/db/schema';
import {eq} from 'drizzle-orm';
import {gmailSmtpSettings} from './smtp-config';

export function mailConfigured(){
 const env=process.env;
 return Boolean(((env.SMTP_USER??'').trim()&&(env.SMTP_APP_PASSWORD??'').trim())||
  (env.RESEND_API_KEY&&env.NOTIFY_FROM));
}
export async function sendMail(to:string,subject:string,message:string,key:string){
 const smtp=gmailSmtpSettings(process.env);
 if(smtp){
  const transporter=nodemailer.createTransport({
   host:smtp.host,port:smtp.port,secure:smtp.port===465,requireTLS:smtp.port===587,
   auth:{user:smtp.user,pass:smtp.password},
   connectionTimeout:10000,greetingTimeout:10000,socketTimeout:20000,
   tls:{minVersion:'TLSv1.2',rejectUnauthorized:true},
  });
  try{
   // Await Gmail's SMTP reply before returning from the Vercel function.
   await transporter.sendMail({
    from:{name:'Dawson KPI Platform',address:smtp.from},
    to,subject,text:message,
   });
  }finally{transporter.close();}
  return;
 }
 // Preserve Resend for existing users who have no SMTP credentials configured.
 const apiKey=process.env.RESEND_API_KEY,from=process.env.NOTIFY_FROM;
 if(!apiKey||!from)throw new Error('Outbound email is not configured');
 const digest=createHash('sha256').update(key).digest('hex');
 const res=await fetch('https://api.resend.com/emails',{
  method:'POST',
  headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','Idempotency-Key':digest},
  body:JSON.stringify({from,to:[to],subject,text:message}),
  cache:'no-store',signal:AbortSignal.timeout(12000),
 });
 if(!res.ok)throw new Error('Mail provider returned '+res.status);
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
  // SMTP has no provider idempotency key; inspect uncertain deliveries before manual retries.
  await db.delete(notificationDeliveries).where(eq(notificationDeliveries.messageKey,messageKey));
  throw e;
 }
}
