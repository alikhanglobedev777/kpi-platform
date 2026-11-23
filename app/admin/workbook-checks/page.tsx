import Link from "next/link";
import {requireAdmin} from "@/lib/auth/session";
import {workbookChecks} from "@/lib/sheets/workbook-checks";
import type {CheckStatus} from "@/lib/sheets/workbook-check-rules";

export const dynamic="force-dynamic";
const labels:Record<CheckStatus,string>={pass:"Checked",review:"Needs review",error:"Issue detected",unavailable:"Unable to check"};

export default async function WorkbookChecksPage(){
  await requireAdmin();
  const {checks,cutoff,checkedAt}=await workbookChecks();
  const counts={pass:0,review:0,error:0,unavailable:0};
  for(const c of checks)counts[c.status]++;
  return <div className="department-view">
    <div className="department-heading"><div><p className="eyebrow">Administration</p><h1>Workbook checks</h1><p className="muted">Read-only Google Sheets health and reporting consistency checks</p></div></div>
    <p className="notice">Nothing on this page writes to Google Sheets or changes business formulas. A green result indicates the specified structural check passed; it is not a certification of KPI correctness or healthcare compliance.</p>
    <div className="department-cards">
      <article className="department-metric"><span>Structural checks passed</span><strong>{counts.pass}</strong><small>Not a business approval</small></article>
      <article className="department-metric"><span>Need review</span><strong>{counts.review+counts.error}</strong><small>Warnings and detected issues</small></article>
      <article className="department-metric"><span>Unable to check</span><strong>{counts.unavailable}</strong><small>Check API access and tab names</small></article>
      <article className="department-metric"><span>Reporting week</span><strong>{cutoff}</strong><small>Workbook timezone</small></article>
    </div>
    <section className="record-panel" aria-label="Workbook health results">
      <div className="record-panel-heading"><div><h2>Validation results</h2><p className="muted">Checked at {checkedAt} (UTC) · {checks.length} checks</p></div></div>
      <div className="record-table-wrap"><table className="record-table"><thead><tr><th>Area</th><th>Check</th><th>Status</th><th>What it means</th></tr></thead><tbody>
        {checks.map(c=><tr key={c.id}><td>{c.area}</td><td><strong>{c.title}</strong></td><td><span className={c.status==="pass"?"record-state":"record-state record-empty"}>{labels[c.status]}</span></td><td>{c.detail}</td></tr>)}
      </tbody></table></div>
    </section>
    <p className="muted">For known clinical or target-cell problems, review the dry-run instructions in docs/UI_PATCH_VERIFICATION.md. Do not change protected cells without the workbook owner&apos;s authorization.</p>
    <div className="toolbar"><Link href="/admin/reporting">Reporting coverage</Link><Link href="/admin/scorecard">Executive Scorecard</Link><Link href="/admin">Admin overview</Link></div>
  </div>;
}
