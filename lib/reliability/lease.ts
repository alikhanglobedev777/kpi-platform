import 'server-only';
import {randomUUID} from 'node:crypto';
import {neon} from '@neondatabase/serverless';
import {parseEnv} from '@/lib/env';
import {HttpError} from '@/lib/http';

// Atomic lease in Neon. The 90s expiry is a failure-recovery bound, NOT a
// distributed transaction with Google Sheets or direct manual spreadsheet edits.
export async function withDatabaseLease<T>(fn:()=>Promise<T>):Promise<T>{
 const {DATABASE_URL}=parseEnv(process.env);
 if(!DATABASE_URL)throw new Error('Database required for writes');
 const sql=neon(DATABASE_URL),holder=randomUUID();
 const rows=await sql.query(`INSERT INTO kpi_write_leases(name,holder,expires_at)
 VALUES ('sheets', $1::uuid, now()+interval '90 seconds')
 ON CONFLICT (name) DO UPDATE SET holder=EXCLUDED.holder,expires_at=EXCLUDED.expires_at
 WHERE kpi_write_leases.expires_at < now()
 RETURNING holder`,[holder]);
 if(rows.length===0)throw new HttpError(423,'Another change is underway. Reload shortly before retrying.');
 try{return await fn();}finally{
  try{await sql.query('DELETE FROM kpi_write_leases WHERE name=$1 AND holder=$2::uuid',['sheets',holder]);}catch{/* Lease expires automatically; operator can inspect pending records. */}
 }
}
