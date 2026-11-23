import type {Cell} from '@/lib/sheets/schema';
import type {Loaded} from '@/lib/sheets/records';
export function matchesWrittenCells(row:Loaded|undefined,updates:{range:string;values:Cell[][]}[]):boolean{
 if(!row)return false;
 return updates.every(u=>{
  const addr=u.range.match(/!([A-Z]+)(\d+)$/);if(!addr||Number(addr[2])!==row.row)return false;
  const idx=addr[1].split('').reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1;
  const actual=row.entered[idx],expected=u.values[0]?.[0];
  return typeof expected==='number'&&typeof actual==='number'?Math.abs(expected-actual)<1e-8:actual===expected;
 });
}
