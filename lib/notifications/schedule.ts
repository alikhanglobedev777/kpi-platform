import 'server-only';
import {eq} from 'drizzle-orm';
import {getDb} from '@/db';
import {users,userTabs} from '@/db/schema';
import {departments,keys,type Department} from '@/lib/sheets/schema';
import {load} from '@/lib/sheets/records';
import {previousSaturday} from '@/lib/sheets/values';
import {historicalScorecard} from '@/lib/sheets/historical-scorecard';
import {sendOnce} from './mailer';
import {dueReminders} from './rules';
const weekly=keys.filter(k=>departments[k].weekly);
export async function runScheduledNotices(){
 const week=previousSaturday();
 const db=getDb();
 const [accounts,grants]=await Promise.all([db.select({id:users.id,email:users.email}).from(users).where(eq(users.status,'approved')),db.select({userId:userTabs.userId,tab:userTabs.tab,canCreate:userTabs.canCreate}).from(userTabs)]);
 const accountEmails=new Map(accounts.map(a=>[a.id,a.email]));
 const assigned=grants.filter(g=>g.canCreate&&weekly.includes(g.tab as Department)).flatMap(g=>accountEmails.has(g.userId)?[{email:accountEmails.get(g.userId)!,tab:g.tab as Department}]:[]);
 const reported=new Set<Department>();
 for(const tab of weekly){const rows=await load(tab);if(rows.find(r=>r.id===week)?.filled)reported.add(tab);}
 let sent=0;const errors:string[]=[];
 for(const item of dueReminders(week,assigned,reported)){
  try{if(await sendOnce(item.key,item.recipient,'weekly-reminder','KPI weekly submission reminder',`Please review your ${departments[item.tab].name} submission for week ending ${week}. Sign in to the KPI platform. Do not email client or patient data.`))sent++;}catch{errors.push('One weekly reminder could not be delivered.');}
 }
 const admin=process.env.NOTIFY_ADMIN_EMAIL;
 if(admin){try{
  const score=await historicalScorecard(week);
  const red=score.metrics.filter(m=>m.status==='Red').map(m=>m.name);
  if(red.length&&await sendOnce(`red-alert:${week}`,admin,'kpi-red-alert','KPI red status summary',`Week ending ${week}: ${red.length} scorecard metrics are Red. Sign in to review the dashboard. No clinical details are included.`))sent++;
 }catch{errors.push('Could not calculate or send the weekly KPI alert.');}}
 return {week,sent,errors};
}
