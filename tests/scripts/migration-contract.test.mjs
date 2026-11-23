import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
for(const [name,expected] of [['0022_management.sql',['kpi_priority_actions','kpi_target_requests']],['0023_notification_recovery.sql',['kpi_password_reset_tokens','kpi_notification_deliveries']],['0024_reliability.sql',['kpi_write_leases','kpi_write_receipts']]]){
 test(`${name} declares required additive tables`,async()=>{
  const text=await readFile(new URL(`../../scripts/migrations/${name}`,import.meta.url),'utf8');
  for(const table of expected)assert.match(text,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  assert.equal(/\bDROP TABLE\b|\bTRUNCATE\b|\bDELETE FROM\b/i.test(text),false);
 });
}
