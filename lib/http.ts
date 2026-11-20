import {NextResponse} from "next/server";
import {ZodError} from "zod";
export class HttpError extends Error {constructor(public status:number,message:string){super(message);}}
export function fail(e:unknown){if(e instanceof HttpError)return NextResponse.json({error:e.message},{status:e.status});if(e instanceof ZodError)return NextResponse.json({error:"Invalid input"},{status:400});return NextResponse.json({error:"Request could not be completed. Reload before retrying."},{status:500});}
export function sameOrigin(r:Request){const origin=r.headers.get("origin");const expected=process.env.AUTH_URL||new URL(r.url).origin;if(!origin||origin!==new URL(expected).origin)throw new HttpError(403,"Invalid request origin");}
export async function json(r:Request){if(!r.headers.get("content-type")?.startsWith("application/json"))throw new HttpError(415,"JSON required");const body=await r.text();if(body.length>64000)throw new HttpError(413,"Request too large");try{return JSON.parse(body) as unknown;}catch{throw new HttpError(400,"Invalid JSON");}}
