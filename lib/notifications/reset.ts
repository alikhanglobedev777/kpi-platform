import {createHash,randomBytes} from 'node:crypto';
export function hashResetToken(token:string){return createHash('sha256').update(token).digest('hex');}
export function newResetToken(){return randomBytes(32).toString('base64url');}
export const RESET_TTL_MS=20*60*1000;
export function resetUrl(origin:string,token:string){const url=new URL('/reset-password',origin);url.searchParams.set('token',token);return url.toString();}
