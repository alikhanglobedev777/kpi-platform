import {NextResponse} from "next/server";
import {z} from "zod";
import {eq} from "drizzle-orm";
import {getDb} from "@/db";
import {users} from "@/db/schema";
import {hashPassword,verifyPassword} from "@/lib/auth/password";
import {createSession,currentUser,logout,isAdmin} from "@/lib/auth/session";
import {limit} from "@/lib/auth/rate-limit";
import {fail,HttpError,json,sameOrigin} from "@/lib/http";
const email=z.string().trim().toLowerCase().email().max(254);
const credentials=z.object({email,password:z.string().min(1).max(128)});
const registration=credentials.extend({password:z.string().min(12).max(128),name:z.string().trim().min(2).max(100),department:z.string().trim().min(1).max(100)});
export const runtime="nodejs";
export async function GET(_r:Request,{params}:{params:Promise<{action:string}>}){try{if((await params).action!=="me")throw new HttpError(404,"Not found");return NextResponse.json({user:await currentUser()},{headers:{"Cache-Control":"no-store"}});}catch(e){return fail(e);}}
export async function POST(r:Request,{params}:{params:Promise<{action:string}>}){try{sameOrigin(r);const {action}=await params;if(action==="logout"){await logout();return NextResponse.json({ok:true});}const body=await json(r);if(action==="register"){const v=registration.parse(body);await limit("register-global",60);await limit("register:"+v.email,4);await getDb().insert(users).values({email:v.email,name:v.name,passwordHash:await hashPassword(v.password),requestedDepartment:v.department}).onConflictDoNothing();return NextResponse.json({ok:true,message:"If eligible, your request is awaiting admin approval."});}if(action==="login"){const v=credentials.parse(body);await limit("login-global",200);await limit("login:"+v.email,10);const [u]=await getDb().select().from(users).where(eq(users.email,v.email)).limit(1);const valid=await verifyPassword(v.password,u?.passwordHash??null);if(!valid||!u||u.status==="rejected"||u.status==="deactivated")throw new HttpError(401,"Invalid credentials or unavailable account");await createSession(u.id);await getDb().update(users).set({lastLoginAt:new Date()}).where(eq(users.id,u.id));return NextResponse.json({next:u.status!=="approved"?"/pending-approval":isAdmin(u)?"/admin":"/dashboard"});}throw new HttpError(404,"Not found");}catch(e){return fail(e);}}
