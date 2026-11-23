import {describe,it,expect} from 'vitest';
import {newResetToken,hashResetToken,resetUrl,RESET_TTL_MS} from '@/lib/notifications/reset';
import {authorizedCron} from '@/lib/notifications/cron-auth';
import {dueReminders} from '@/lib/notifications/rules';
describe('reset token and scheduled messages',()=>{
 it('creates random opaque reset tokens and only stores their hash',()=>{
  const a=newResetToken(),b=newResetToken();expect(a).not.toBe(b);expect(a.length).toBeGreaterThan(30);
  expect(hashResetToken(a)).toMatch(/^[a-f\d]{64}$/);expect(hashResetToken(a)).not.toBe(a);
  expect(RESET_TTL_MS).toBe(20*60*1000);
 });
 it('constructs URL using configured trusted origin',()=>{
  const u=new URL(resetUrl('https://kpi.example.org','opaque'));
  expect(u.origin).toBe('https://kpi.example.org');expect(u.pathname).toBe('/reset-password');expect(u.searchParams.get('token')).toBe('opaque');
 });
 it('requires matching long bearer secret for cron',()=>{
  const secret='a'.repeat(32);expect(authorizedCron(`Bearer ${secret}`,secret)).toBe(true);
  expect(authorizedCron('Bearer bad',secret)).toBe(false);expect(authorizedCron(`Bearer ${secret}`,'short')).toBe(false);
  expect(authorizedCron(null,secret)).toBe(false);
 });
 it('distinguishes zero-valued or reported department from missing department',()=>{
  const people=[{email:'HR@Example.com',tab:'hr' as const},{email:'finance@example.com',tab:'financial' as const}];
  const d=dueReminders('2026-11-21',people,new Set(['financial'] as const));
  expect(d).toEqual([{key:'reminder:2026-11-21:hr:hr@example.com',recipient:'HR@Example.com',tab:'hr'}]);
 });
});
