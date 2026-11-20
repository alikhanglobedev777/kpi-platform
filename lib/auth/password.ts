import {randomBytes,scrypt,timingSafeEqual} from "node:crypto";
function derive(password:string,salt:Buffer){return new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024},(err,key)=>err?reject(err):resolve(key)));}
export async function hashPassword(password:string){const salt=randomBytes(16);return `scrypt$${salt.toString("hex")}$${(await derive(password,salt)).toString("hex")}`;}
export async function verifyPassword(password:string,stored:string|null){const parts=stored?.split("$")??[];const salt=/^[a-f0-9]{32}$/.test(parts[1]??"")?Buffer.from(parts[1],"hex"):Buffer.alloc(16);const key=await derive(password,salt);return parts[0]==="scrypt"&&/^[a-f0-9]{128}$/.test(parts[2]??"")&&timingSafeEqual(key,Buffer.from(parts[2],"hex"));}
