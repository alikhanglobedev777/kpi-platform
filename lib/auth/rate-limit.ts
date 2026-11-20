import {createHash} from "node:crypto";
import {sql} from "drizzle-orm";
import {getDb} from "@/db";
import {rateLimits} from "@/db/schema";
import {HttpError} from "@/lib/http";
export async function limit(key:string,max:number,minutes=15){const k=createHash("sha256").update(key).digest("hex"),window=Math.floor(Date.now()/(minutes*60000));const [r]=await getDb().insert(rateLimits).values({key:k,window,count:1}).onConflictDoUpdate({target:rateLimits.key,set:{window,count:sql`case when ${rateLimits.window} = ${window} then ${rateLimits.count} + 1 else 1 end`}}).returning({count:rateLimits.count});if(r.count>max)throw new HttpError(429,"Too many requests. Try again later.");}
