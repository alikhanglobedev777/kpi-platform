import {NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import {runScheduledNotices} from '@/lib/notifications/schedule';
import {mailConfigured} from '@/lib/notifications/mailer';
export const runtime='nodejs';export const dynamic='force-dynamic';
export function authorizedCron(header:string|null,secret:string|undefined){
 if(!secret||secret.length<32||!header?.startsWith('Bearer '))return false;
 const x=Buffer.from(header.slice(7)),y=Buffer.from(secret);
 return x.length===y.length&&timingSafeEqual(x,y);
}
export async function POST(r:Request){if(!authorizedCron(r.headers.get('authorization'),process.env.CRON_SECRET))return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!mailConfigured())return NextResponse.json({error:'Email provider not configured'},{status:503});
 try{const result=await runScheduledNotices();return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({error:'Scheduled notification check failed'},{status:503});}}
