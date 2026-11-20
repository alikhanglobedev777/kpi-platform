// Single-process coordination only. Production MVP must run one instance.
const state=globalThis as typeof globalThis & {kpiWriteTail?:Promise<void>};
export async function withWriteLock<T>(fn:()=>Promise<T>):Promise<T>{const previous=state.kpiWriteTail??Promise.resolve();let release!:()=>void;state.kpiWriteTail=new Promise<void>(r=>{release=r;});await previous;try{return await fn();}finally{release();}}
