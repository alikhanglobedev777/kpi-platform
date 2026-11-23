import {withDatabaseLease} from '@/lib/reliability/lease';
// Serialize writes in-process, and coordinate app instances using an atomic Neon lease.
// Never run direct spreadsheet editors concurrently with portal writes.
const state=globalThis as typeof globalThis & {kpiWriteTail?:Promise<void>};
export async function withWriteLock<T>(fn:()=>Promise<T>):Promise<T>{
 const previous=state.kpiWriteTail??Promise.resolve();let release!:()=>void;
 state.kpiWriteTail=new Promise<void>(r=>{release=r;});
 await previous;
 try{return await withDatabaseLease(fn);}finally{release();}
}
