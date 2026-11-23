"use client";
import {useEffect,useState,useCallback} from "react";
import {previousSaturday} from "@/lib/sheets/values";
import {api} from "./client";
import type {historicalScorecard} from "@/lib/sheets/historical-scorecard";
type Result=Awaited<ReturnType<typeof historicalScorecard>>;
const num=new Intl.NumberFormat("en-US",{maximumFractionDigits:2});
const usd=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2});
function display(v:number|null,percent:boolean,money:boolean){return v===null?"—":percent?`${num.format(v*100)}%`:money?usd.format(v):num.format(v);}
export function HistoricalScorecard(){
  const [week,setWeek]=useState(previousSaturday()),[data,setData]=useState<Result|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
  const refresh=useCallback(async()=>{setLoading(true);setError("");try{setData(await api<Result>(`/api/scorecard/history?week=${encodeURIComponent(week)}`));}catch(e){setData(null);setError(e instanceof Error?e.message:"Could not load historical KPIs");}finally{setLoading(false);}},[week]);
  useEffect(()=>{void refresh();},[refresh]);
  return <div className="department-view scorecard-view"><div className="department-heading"><div><p className="eyebrow">Leadership · read-only</p><h1>Historical Executive Scorecard</h1><p className="muted">Compare weekly KPIs without changing the shared spreadsheet week selector.</p></div></div>
    <div className="panel"><label>Week ending (Saturday) <input type="date" value={week} onChange={e=>setWeek(e.target.value)}/></label><button className="secondary ml-2" disabled={loading} onClick={()=>void refresh()}>Reload</button><p className="muted">Select a configured reporting Saturday. This view never writes to the workbook.</p></div>
    {error&&<p role="alert" className="error">{error}</p>}
    {loading&&<p role="status">Loading historical reporting…</p>}
    {data&&!loading&&<><div className="department-cards"><article className="department-metric"><span>Overall status</span><strong>{data.pulse}</strong><small>Week ending {data.week}</small></article>{["Green","Yellow","Red","No data"].map(s=><article className="department-metric" key={s}><span>{s}</span><strong>{data.metrics.filter(m=>m.status===s).length}</strong><small>of {data.metrics.length} metrics</small></article>)}</div>
      <p className="notice">{data.note}</p><section className="record-panel"><div className="record-panel-heading"><h2>Weekly KPI comparison</h2></div><div className="record-table-wrap"><table className="record-table"><thead><tr>{["Metric","Owner","Goal","Selected week","Prior week","Trend","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{data.metrics.map(m=><tr key={m.row}><td><strong>{m.name}</strong></td><td>{m.owner}</td><td>{display(m.goal,m.isPercent,m.isMoney)}</td><td>{display(m.actual,m.isPercent,m.isMoney)}</td><td>{display(m.previous,m.isPercent,m.isMoney)}</td><td>{m.trend||"—"}</td><td><span className={`scorecard-status status-${m.status}`}>{m.status}</span></td></tr>)}</tbody></table></div></section></>}
  </div>;
}
