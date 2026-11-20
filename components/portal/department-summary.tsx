import type {Row} from "@/lib/sheets/records";
import {departments, type Department} from "@/lib/sheets/schema";
import {formatCell, latestCompletedRecord, summaryColumns} from "@/lib/sheets/presentation";

export function DepartmentSummary({tab, rows, cutoff}: {tab: Department; rows: Row[]; cutoff: string}) {
  const latest = latestCompletedRecord(rows, cutoff);
  const date = departments[tab].fields[0];
  const fields = (summaryColumns[tab] ?? []).flatMap(c => departments[tab].fields.filter(f => f.column === c));
  if (!fields.length) return null;
  return <section aria-label="Weekly KPI summary" className="department-summary">
    <div className="section-heading"><h2>Weekly snapshot</h2><p className="muted">{latest ? `Week ending ${formatCell(date, latest.id)}` : "No completed-week submissions yet"}</p></div>
    <div className="department-cards">{fields.map(f => <article className="department-metric" key={f.column}>
      <span>{f.label}</span><strong>{formatCell(f, latest?.values[f.column])}</strong><small>{latest?.values[f.column] !== undefined && latest.values[f.column] !== "" ? "Reported value" : "Not reported"}</small>
    </article>)}</div>
  </section>;
}
