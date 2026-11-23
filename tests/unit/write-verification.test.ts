import {describe,it,expect} from 'vitest';
import {matchesWrittenCells} from '@/lib/reliability/verify';
import type {Loaded} from '@/lib/sheets/records';
const row=(entered:(number|string)[]):Loaded=>({id:'2026-11-21',row:14,version:'v2',filled:true,entered,cells:entered,values:{}});
describe('read-after-write confirmation',()=>{
 it('checks only intended cells by column, not calculated formula cells',()=>{
  const r=row([0,55,2,'=IF(B14=0,0,D14/B14)','=D14/B14',0.95]);
  expect(matchesWrittenCells(r,[{range:"'HR Dashboard'!B14",values:[[55]]},{range:"'HR Dashboard'!E14",values:[[0.95]]}])).toBe(false);
  expect(matchesWrittenCells(r,[{range:"'HR Dashboard'!B14",values:[[55]]},{range:"'HR Dashboard'!F14",values:[[0.95]]}])).toBe(true);
  expect(matchesWrittenCells(r,[{range:"'HR Dashboard'!B14",values:[[50]]}])).toBe(false);
  expect(matchesWrittenCells(r,[{range:"'HR Dashboard'!B15",values:[[55]]}])).toBe(false);
 });
 it('preserves distinction between zero and missing values',()=>{
  expect(matchesWrittenCells(row([0]),[{range:"'HR Dashboard'!A14",values:[[0]]}])).toBe(true);
  expect(matchesWrittenCells(row(['']),[{range:"'HR Dashboard'!A14",values:[[0]]}])).toBe(false);
 });
});
