'use client';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
import {api} from '@/components/portal/client';
export default function Page(){const [email,setEmail]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{const d=await api<{message:string}>('/api/auth/forgot-password','POST',{email});setMessage(d.message);}catch(e){setError(e instanceof Error?e.message:'Unable to send reset link');}finally{setBusy(false);}}
return <main className="auth-shell"><section className="panel auth-panel"><h1>Reset your password</h1><p className="muted">Enter your approved work email to request a one-time reset link. If email recovery is not configured, contact your administrator.</p><form className="stack" onSubmit={submit}><label>Email<input autoComplete="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><button className="primary" disabled={busy}>Send reset link</button></form>{message&&<p role="status" className="notice">{message}</p>}{error&&<p role="alert" className="error">{error}</p>}<Link href="/login">Back to sign in</Link></section></main>;
}
