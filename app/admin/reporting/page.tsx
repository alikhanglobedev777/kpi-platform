import Link from "next/link";
import {requireAdmin} from "@/lib/auth/session";
import {parseEnv} from "@/lib/env";
import {departments} from "@/lib/sheets/schema";
import {load} from "@/lib/sheets/records";
import {previousSaturday} from "@/lib/sheets/values";
import {coverageFor,reportingWeeks,weeklyModules} from "@/lib/reporting/coverage";
export const dynamic="force-dynamic";
export default async function ReportingPage(){
  await requireAdmin();
  const cutoff=previousSaturday(new Date(),parseEnv(process.env).SHEET_TIMEZONE);
  const weeks=reportingWeeks(cutoff,8);
  const results=await Promise.allSettled(weeklyModules.map(async tab=>({tab,rows:await load(tab)})));
  const byModule=new Map(results.flatMap(r=>r.status==="fulfilled"?[[r.value.tab,r.value.rows] as const]:[]));
  const unavailable=weeklyModules.filter(tab=>!byModule.has(tab));
  const coverage=weeks.map(week=>({week,items:weeklyModules.map(tab=>({tab,record:byModule.get(tab)?coverageFor(tab,byModule.get(tab)!,week):null}))}));
  const available=coverage.flatMap(w=>w.items.filter(i=>i.record!==null));
  const reported=available.filter(i=>i.record?.reported).length;
  const total=available.length;
  return <div className="department-view"><div className="department-heading"><div><p className="eyebrow">Administration</p><h1>Reporting coverage</h1><p className="muted">Eight most recent completed weeks · six weekly departments · read only</p></div></div>
    <p className="notice">"Reported" means at least one editable field contains data. It does not certify submission quality, approval, or all required KPIs. Zero is counted as entered; blank is missing.</p>
    {unavailable.length>0&&<p className="error" role="alert">Unable to read: {unavailable.map(t=>departments[t].name).join(", ")}. Results are incomplete; try again after restoring Sheets access.</p>}
    <div className="department-cards"><article className="department-metric"><span>Department-weeks with data</span><strong>{reported} / {total}</strong><small>Available results only</small></article><article className="department-metric"><span>Awaiting first entry</span><strong>{total-reported}</strong><small>Not necessarily overdue</small></article><article className="department-metric"><span>Reporting week</span><strong>{cutoff}</strong><small>Last completed Saturday</small></article></div>
    <section className="record-panel" aria-label="Reporting coverage"><div className="record-panel-heading"><h2>Department reporting matrix</h2></div>
      <div className="record-table-wrap"><table className="record-table"><thead><tr><th>Week ending</th>{weeklyModules.map(tab=><th key={tab}>{departments[tab].name}</th>)}</tr></thead><tbody>{coverage.map(w=><tr key={w.week}><td><strong>{w.week}</strong></td>{w.items.map(({tab,record})=><td key={tab}>{record===null?<span>Unavailable</span>:record.reported?<span title="Numeric fields entered out of all configured numeric fields">{record.entered} / {record.expected} numeric fields</span>:<span className="muted">No entries</span>}</td>)}</tr>)}</tbody></table></div>
    </section><p className="muted">To fill missing data, open a department and select "All completed weeks". Changes are made only through authorized department forms.</p><p><Link href="/admin">Back to admin overview</Link></p>
  </div>;
}
