"use client";
import {useEffect,useState,useCallback,type FormEvent} from "react";
import {departments,type Department} from "@/lib/sheets/schema";
import type {Row} from "@/lib/sheets/records";
import {api} from "./client";
import {Trend} from "./trend";
import {dateSerial,previousSaturday} from "@/lib/sheets/values";
import {DepartmentSummary} from "./department-summary";
import {entryRecord,formatCell,visibleRecords,pageRecords,tableFields,type WeekScope} from "@/lib/sheets/presentation";

type Data={rows:Row[];permissions:{create:boolean;update:boolean;delete:boolean};reportDepartments?:string[]};
export function DepartmentView({tab}:{tab:Department}) {
  const d=departments[tab],url=`/api/departments/${tab}`;
  const [data,setData]=useState<Data|null>(null),[error,setError]=useState(""),[message,setMessage]=useState(""),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  const [selected,setSelected]=useState<Row|null>(null),[editing,setEditing]=useState(false),[values,setValues]=useState<Record<string,string>>({}),[search,setSearch]=useState("");
  const [scope,setScope]=useState<WeekScope>("reported"),[from,setFrom]=useState(""),[to,setTo]=useState(""),[newest,setNewest]=useState(true),[page,setPage]=useState(1),[detail,setDetail]=useState<Row|null>(null);
  const refresh=useCallback(async()=>{setLoading(true);setError("");try{setData(await api<Data>(url));}catch(e){setData(null);setError(e instanceof Error?e.message:"Unable to load records");}finally{setLoading(false);}},[url]);
  useEffect(()=>{void refresh();},[refresh]);
  function edit(row:Row|null){setDetail(null);setSelected(row);setValues(row?.values??{});setEditing(true);setMessage("");setError("");}
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");try{const fields=Object.fromEntries(d.fields.filter(f=>!f.readonly&&(!selected||values[f.column]!==selected.values[f.column])).map(f=>[f.column,values[f.column]??""]));await api(url,selected?.filled?"PATCH":"POST",{id:selected?.id,version:selected?.version,fields});setEditing(false);setMessage("Saved to Google Sheets.");await refresh();}catch(e){setError(e instanceof Error?e.message:"Save failed");}finally{setBusy(false);}}
  async function clear(row:Row){if(!window.confirm(`Clear input values for ${row.id}? Dates and formulas will remain.`))return;setBusy(true);setError("");try{await api(url,"DELETE",{id:row.id,version:row.version});setDetail(null);setMessage("Record cleared.");await refresh();}catch(e){setError(e instanceof Error?e.message:"Clear failed");}finally{setBusy(false);}}
  const cutoff=previousSaturday(),current=data&&d.weekly?entryRecord(data.rows,cutoff):undefined;
  const allRows=data?.rows??[];
  const rows=visibleRecords(allRows,{weekly:d.weekly,cutoff,scope,search,from,to,newest});
  const paged=pageRecords(rows,page);
  const columns=tableFields(tab);
  const canEdit=(r:Row)=>r.filled?data?.permissions.update:data?.permissions.create;
  const resetFilters=()=>{setSearch("");setScope("reported");setFrom("");setTo("");setNewest(true);setPage(1);};
  return <div className="department-view">
    <div className="department-heading"><div><p className="eyebrow">Operations</p><h1>{d.name}</h1><p className="muted">{d.weekly?"Weekly reporting · Saturday week ending · Calculated fields are read-only.":"Manage the existing register without deleting spreadsheet rows."}</p></div>
      {current&&canEdit(current)&&<button className="primary" disabled={busy||loading} onClick={()=>edit(current)}>{current.filled?"Edit latest reporting week":"Submit weekly data"}</button>}
      {!d.weekly&&data?.permissions.create&&<button className="primary" disabled={busy||loading} onClick={()=>edit(null)}>Add record</button>}
    </div>
    {tab==="clinical"&&<p className="notice">Do not enter identifiable patient information. Use only approved non-identifying notes.</p>}
    {tab==="financial"&&<p className="notice">Payroll-week indicator follows the workbook schedule. Finance reporting frequency requires confirmation.</p>}
    {message&&<p role="status" className="notice">{message}</p>}{error&&<p role="alert" className="error">{error}</p>}
    {d.weekly&&data&&<DepartmentSummary tab={tab} rows={allRows} cutoff={cutoff}/>}
    {editing&&<section className="panel"><h2>{selected?.filled?"Edit record":"New entry"} {selected?.id??""}</h2><form onSubmit={submit}><div className="form-grid">{d.fields.map(f=><label key={f.column}>{f.label}{f.readonly&&" · read only"}{f.kind==="enum"?<select disabled={f.readonly} value={values[f.column]??""} onChange={e=>setValues(v=>({...v,[f.column]:e.target.value}))}><option value="">Select…</option>{(tab==="weekly_kpi_report"&&f.column==="B"?data?.reportDepartments??[]:f.options??[]).map(o=><option key={o}>{o}</option>)}</select>:f.kind==="text"?<textarea maxLength={500} readOnly={f.readonly} value={values[f.column]??""} onChange={e=>setValues(v=>({...v,[f.column]:e.target.value}))}/>:<input readOnly={f.readonly} type={f.kind==="date"?"date":"number"} step={f.kind==="integer"?1:"any"} min={f.kind==="cash"||f.kind==="date"?undefined:0} max={f.kind==="percent"&&!f.readonly?100:undefined} value={values[f.column]??""} onChange={e=>setValues(v=>({...v,[f.column]:e.target.value}))}/>}</label>)}</div><div className="toolbar"><button className="primary" disabled={busy}>Save to Sheets</button><button type="button" className="secondary" disabled={busy} onClick={()=>setEditing(false)}>Cancel</button></div></form></section>}
    {d.weekly&&data&&<Trend tab={tab} rows={allRows.filter(r=>r.id<=cutoff)}/>}
    {loading?<p role="status">Loading records…</p>:data&&<section className="record-panel" aria-label="Records">
      <div className="record-panel-heading"><div><h2>{d.weekly?"Weekly records":"Records"}</h2><p className="muted">{rows.length} matching {rows.length===1?"record":"records"} · {d.weekly?"Select Details to see all fields.":"Select Details for the full record."}</p></div><button className="secondary" disabled={busy||loading} onClick={()=>void refresh()}>Reload</button></div>
      <div className="record-filters">
        <label>Search<input placeholder="Search records" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></label>
        {d.weekly&&<><label>Show weeks<select value={scope} onChange={e=>{setScope(e.target.value as WeekScope);setPage(1);}}><option value="reported">Reported weeks</option><option value="completed">All completed weeks</option><option value="all">All scheduled weeks</option></select></label><label>From<input type="date" value={from} onChange={e=>{setFrom(e.target.value);setPage(1);}}/></label><label>To<input type="date" value={to} onChange={e=>{setTo(e.target.value);setPage(1);}}/></label></>}
        <label>Sort<select value={newest?"new":"old"} onChange={e=>{setNewest(e.target.value==="new");setPage(1);}}><option value="new">{d.weekly?"Latest week first":"Latest row first"}</option><option value="old">{d.weekly?"Earliest week first":"Earliest row first"}</option></select></label>
        <button className="secondary" onClick={resetFilters}>Reset filters</button>
      </div>
      {from&&to&&from>to&&d.weekly&&<p className="notice">From date must not be later than To date.</p>}
      {paged.rows.length?<div className="record-table-wrap"><table className="record-table"><thead><tr>{columns.map((f,i)=><th key={f.column} className={i>2?"optional-column":undefined}>{f.label}</th>)}<th>Actions</th></tr></thead><tbody>{paged.rows.map(r=><tr key={r.id}>{columns.map((f,i)=><td key={f.column} className={i>2?"optional-column":undefined} data-label={f.label}><span className="record-cell" title={formatCell(f,r.values[f.column])}>{formatCell(f,r.values[f.column])}</span>{d.weekly&&f.column==="A"&&<><small className={`record-state ${r.filled?"record-reported":"record-empty"}`}>{r.filled?"Reported":r.id>cutoff?"Upcoming":"Not entered"}</small>{tab==="financial"&&(dateSerial(r.id)-dateSerial("2026-10-24"))%14===0&&<small className="chip">Payroll week</small>}</>}</td>)}<td className="record-actions-cell"><div className="row-actions"><button className="secondary" onClick={()=>setDetail(r)}>Details</button>{canEdit(r)&&<button className="secondary" disabled={busy} onClick={()=>edit(r)}>{r.filled?"Edit":"Enter"}</button>}{r.filled&&data.permissions.delete&&<button className="secondary danger" disabled={busy} onClick={()=>void clear(r)}>Clear</button>}</div></td></tr>)}</tbody></table></div>:<div className="record-empty-state"><h3>No matching records</h3><p className="muted">{d.weekly?"Choose all completed or scheduled weeks to enter an empty record.":"Add a record or change your search."}</p><button className="secondary" onClick={resetFilters}>Reset filters</button>{d.weekly&&scope!=="all"&&<button className="secondary" onClick={()=>{setScope("all");setPage(1);}}>Show scheduled weeks</button>}</div>}
      <div className="record-pagination"><p className="muted">{rows.length?`${(paged.current-1)*10+1}–${Math.min(paged.current*10,rows.length)} of ${rows.length}`:"0 records"}</p><div className="row-actions"><button className="secondary" disabled={paged.current===1} onClick={()=>setPage(paged.current-1)}>Previous</button><span>Page {paged.current} of {paged.pages}</span><button className="secondary" disabled={paged.current===paged.pages} onClick={()=>setPage(paged.current+1)}>Next</button></div></div>
    </section>}
    {detail&&<section className="panel record-detail"><div className="section-heading"><h2>Record details · {d.weekly?formatCell(d.fields[0],detail.id):`Row ${detail.row}`}</h2><button className="secondary" onClick={()=>setDetail(null)}>Close</button></div><dl className="record-detail-grid">{d.fields.map(f=><div key={f.column}><dt>{f.label}</dt><dd>{formatCell(f,detail.values[f.column])}</dd></div>)}</dl>{canEdit(detail)&&<button className="primary" onClick={()=>edit(detail)}>{detail.filled?"Edit record":"Enter data"}</button>}</section>}
  </div>;
}
