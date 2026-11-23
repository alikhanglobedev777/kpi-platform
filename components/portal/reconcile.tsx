'use client';
import {useEffect,useState} from 'react';
import {api} from './client';
type Op={id:string;action:string;tab:string;record:string;fields:string;createdAt:string};
export function ReconcileView({superAdmin}:{superAdmin:boolean}){
 const [rows,setRows]=useState<Op[]>([]),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function refresh(){try{const r=await api<{rows:Op[]}>('/api/admin/reconcile');setRows(r.rows);setError('');}catch(e){setError(e instanceof Error?e.message:'Unable to load');}}
 useEffect(()=>{void refresh();},[]);
 async function resolve(id:string,outcome:'verified_applied'|'verified_not_applied'){
 const evidence=window.prompt('Describe the exact workbook row/cell and evidence checked. Do not paste sensitive clinical data.');
 if(!evidence)return;
 setBusy(true);try{await api('/api/admin/reconcile','POST',{id,outcome,evidence});setMessage(`Marked ${outcome}. No workbook cells were changed.`);await refresh();}catch(e){setError(e instanceof Error?e.message:'Review failed');}finally{setBusy(false);}
 }
 return <div className="department-view"><h1>Reconcile uncertain writes</h1><p className="notice">Check the actual Google Sheet and record its outcome before confirming. This page never replays writes. Marking an operation does not undo, retry or repair it.</p>{message&&<p role="status">{message}</p>}{error&&<p role="alert" className="error">{error}</p>}<div className="table-wrap"><table><thead><tr>{['Date','Module','Action','Record','Fields','Review'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(o=><tr key={o.id}><td>{new Date(o.createdAt).toLocaleString()}</td><td>{o.tab}</td><td>{o.action}</td><td>{o.record}</td><td>{o.fields}</td><td>{superAdmin?<span className="row-actions"><button className="secondary" disabled={busy} onClick={()=>void resolve(o.id,'verified_applied')}>Verified applied</button><button className="secondary" disabled={busy} onClick={()=>void resolve(o.id,'verified_not_applied')}>Verified not applied</button></span>:'Super Admin only'}</td></tr>)}</tbody></table>{rows.length===0&&<p className="muted">No pending operations.</p>}</div></div>;
}
