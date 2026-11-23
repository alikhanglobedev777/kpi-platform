import {timingSafeEqual} from 'node:crypto';
export function authorizedCron(header:string|null,secret:string|undefined){
 if(!secret||secret.length<32||!header?.startsWith('Bearer '))return false;
 const x=Buffer.from(header.slice(7)),y=Buffer.from(secret);
 return x.length===y.length&&timingSafeEqual(x,y);
}
