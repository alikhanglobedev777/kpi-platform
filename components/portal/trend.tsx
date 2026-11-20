"use client";
import {useState} from "react";
import type {Row} from "@/lib/sheets/records";
import type {Department} from "@/lib/sheets/schema";
import {formatCell,numericFields,numericValue} from "@/lib/sheets/presentation";
import {dateSerial} from "@/lib/sheets/values";

export function Trend({tab,rows}:{tab:Department;rows:Row[]}) {
  const fields=numericFields(tab);
  const [selected,setSelected]=useState("");
  const [windowSize,setWindowSize]=useState("12");
  const [active,setActive]=useState<string|null>(null);
  const sorted=rows.slice().sort((a,b)=>a.id.localeCompare(b.id));
  const last=sorted.at(-1)?.id;
  const visible=windowSize==="all"||!last?sorted:sorted.filter(r=>dateSerial(r.id)>=dateSerial(last)-7*(Number(windowSize)-1));
  const defaultField=fields.find(f=>visible.some(r=>numericValue(r.values[f.column])!==null))??fields[0];
  const field=fields.find(f=>f.column===selected)??defaultField;
  if(!field)return null;
  const populated=visible.flatMap(r=>{const n=numericValue(r.values[field.column]);return n===null?[]:[{date:r.id,value:n,raw:r.values[field.column]}];});
  const values=populated.map(p=>p.value),min=Math.min(0,...values),max=Math.max(1,...values);
  const firstDate=visible[0]?.id,lastDate=visible.at(-1)?.id;
  const start=firstDate?dateSerial(firstDate):0,end=lastDate?dateSerial(lastDate):0;
  const x=(date:string)=>80+(dateSerial(date)-start)*644/Math.max(1,end-start);
  const y=(n:number)=>152-(n-min)/(max-min)*120;
  // Break the line when a reporting week has no value; never invent zeros.
  const segments: typeof populated[]=[];
  for(const point of populated){const segment=segments.at(-1);if(segment&&dateSerial(point.date)-dateSerial(segment.at(-1)!.date)===7)segment.push(point);else segments.push([point]);}
  const latest=populated.at(-1),focused=populated.find(p=>p.date===active)??latest;
  return <section className="panel trend-panel" aria-label="Weekly trend">
    <div className="section-heading"><div><h2>Weekly trend</h2><p className="muted">Actual reported values · missing weeks are gaps</p></div><span className="trend-count">{populated.length} reported</span></div>
    <div className="trend-controls"><label>Metric<select value={field.column} onChange={e=>{setSelected(e.target.value);setActive(null);}}>{fields.map(f=><option key={f.column} value={f.column}>{f.label}{!visible.some(r=>numericValue(r.values[f.column])!==null)?" (no data)":""}</option>)}</select></label><label>Period<select value={windowSize} onChange={e=>{setWindowSize(e.target.value);setActive(null);}}><option value="4">Last 4 weeks</option><option value="12">Last 12 weeks</option><option value="all">All completed weeks</option></select></label></div>
    {populated.length?<><div className="trend-highlight"><strong>{formatCell(field,focused?.raw)}</strong><span className="muted">{focused?.date} · {field.label}</span></div><svg viewBox="0 0 760 190" role="img" aria-label={`${field.label} trend, ${populated.length} reported weeks`} className="trend-svg">
      {[0,1,2,3].map(i=>{const v=min+(max-min)*i/3;return <g key={i}><line x1="80" x2="724" y1={y(v)} y2={y(v)} stroke="#e9e3ee"/><text x="73" y={y(v)+4} textAnchor="end" fontSize="11" fill="#6b6176">{formatCell(field,String(v))}</text></g>;})}
      {segments.map((segment,i)=><polyline key={i} points={segment.map(p=>`${x(p.date)},${y(p.value)}`).join(" ")} fill="none" stroke="#5e4b73" strokeWidth="2.5" strokeLinejoin="round"/>)}
      {populated.map(p=><g key={p.date}><circle cx={x(p.date)} cy={y(p.value)} r={focused?.date===p.date?5.5:3.8} fill="#5e4b73"/><circle cx={x(p.date)} cy={y(p.value)} r="10" fill="transparent" onMouseEnter={()=>setActive(p.date)} onClick={()=>setActive(p.date)}><title>{p.date}: {formatCell(field,p.raw)}</title></circle></g>)}
      <text x="80" y="176" fontSize="11" fill="#6b6176">{firstDate}</text>{firstDate!==lastDate&&<text x="724" y="176" textAnchor="end" fontSize="11" fill="#6b6176">{lastDate}</text>}
    </svg><details className="trend-data"><summary>View chart values</summary><div className="trend-values">{populated.map(p=><div key={p.date}><span>{p.date}</span><strong>{formatCell(field,p.raw)}</strong></div>)}</div></details></>:<div className="record-empty-state"><p className="muted">No reported values for this metric in the selected period.</p><button className="secondary" onClick={()=>{setSelected("");setWindowSize("all");setActive(null);}}>Find a reported metric</button></div>}
  </section>;
}
