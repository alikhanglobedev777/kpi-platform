import {describe,expect,it} from 'vitest';
import {gmailSmtpSettings} from '../../lib/notifications/smtp-config';

const base={SMTP_USER:'sender@gmail.com',SMTP_APP_PASSWORD:'abcd efgh ijkl mnop'};
describe('Gmail SMTP configuration',()=>{
 it('uses port 465 and accepts display-spaced app passwords',()=>{
  expect(gmailSmtpSettings(base)).toEqual({
   host:'smtp.gmail.com',port:465,user:'sender@gmail.com',
   password:'abcdefghijklmnop',from:'sender@gmail.com',
  });
 });
 it('accepts the STARTTLS submission port',()=>{
  expect(gmailSmtpSettings({...base,SMTP_PORT:'587'})?.port).toBe(587);
 });
 it('allows unconfigured email transport',()=>expect(gmailSmtpSettings({})).toBeNull());
 it('rejects partial and invalid credentials',()=>{
  expect(()=>gmailSmtpSettings({SMTP_USER:'sender@gmail.com'})).toThrow('incomplete');
  expect(()=>gmailSmtpSettings({...base,SMTP_APP_PASSWORD:'password'})).toThrow('16 characters');
 });
 it('requires Gmail and the authenticated sender',()=>{
  expect(()=>gmailSmtpSettings({...base,SMTP_PORT:'25'})).toThrow('465 or 587');
  expect(()=>gmailSmtpSettings({...base,SMTP_HOST:'untrusted.example'})).toThrow('Only Gmail');
  expect(()=>gmailSmtpSettings({...base,NOTIFY_FROM:'other@gmail.com'})).toThrow('match SMTP_USER');
 });
});
