import {NextResponse} from 'next/server';
import {authorizedCron} from '@/lib/notifications/cron-auth';
import {runScheduledNotices} from '@/lib/notifications/schedule';
import {mailConfigured} from '@/lib/notifications/mailer';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(r:Request){if(!authorizedCron(r.headers.get('authorization'),process.env.CRON_SECRET))return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!mailConfigured())return NextResponse.json({error:'Email provider not configured'},{status:503});
 try{const result=await runScheduledNotices();return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({error:'Scheduled notification check failed'},{status:503});}}
