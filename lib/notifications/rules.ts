import {departments,type Department} from '@/lib/sheets/schema';
export function dueReminders(week:string,assigned:{email:string;tab:Department}[],reported:Set<Department>){
 return assigned.filter(a=>departments[a.tab].weekly&&!reported.has(a.tab)).map(a=>({
  key:`reminder:${week}:${a.tab}:${a.email.toLowerCase()}`,recipient:a.email,tab:a.tab,
 }));
}
