'use client';
import {useState,type FormEvent} from 'react';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {api} from '@/components/portal/client';
import {Suspense} from 'react';
function Form(){const params=useSearchParams();const token=params.get('token')??'';const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
async function submit(e:FormEvent){e.preventDefault();setError('');if(password!==confirm){setError('Passwords do not match.');return;}setBusy(true);try{await api('/api/auth/reset-password','POST',{token,password});setMessage('Password updated. You can now sign in.');setPassword('');setConfirm('');}catch(e){setError(e instanceof Error?e.message:'Reset failed');}finally{setBusy(false);}}
return <main className="auth-shell"><section className="panel auth-panel"><h1>Choose a new password</h1>{!token?<p role="alert">Missing reset token. Request a new link.</p>:message?<p role="status">{message}</p>:<form className="stack" onSubmit={submit}><label>New password<input type="password" minLength={12} maxLength={128} autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirm password<input type="password" minLength={12} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><button className="primary" disabled={busy}>Reset password</button></form>}{error&&<p role="alert" className="error">{error}</p>}<Link href="/login">Back to sign in</Link></section></main>;
}
export default function Page(){return <Suspense fallback={<p>Loading…</p>}><Form/></Suspense>;}
