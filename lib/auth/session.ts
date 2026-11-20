import "server-only";
import {createHash,randomBytes} from "node:crypto";
import {cookies} from "next/headers";
import {and,eq,gt} from "drizzle-orm";
import {getDb} from "@/db";
import {sessions,users,userTabs} from "@/db/schema";
import {HttpError} from "@/lib/http";
import type {Department} from "@/lib/sheets/schema";
const COOKIE="dawson_session";
const digest=(s:string)=>createHash("sha256").update(s).digest("hex");
export async function currentUser(){const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;const db=getDb();const [r]=await db.select({id:users.id,email:users.email,name:users.name,role:users.role,status:users.status,mustChangePassword:users.mustChangePassword}).from(sessions).innerJoin(users,eq(sessions.userId,users.id)).where(and(eq(sessions.sessionToken,digest(token)),gt(sessions.expires,new Date()))).limit(1);return r??null;}
export type User=NonNullable<Awaited<ReturnType<typeof currentUser>>>;
export async function requireUser(){const u=await currentUser();if(!u)throw new HttpError(401,"Sign in required");if(u.status!=="approved"||!u.role)throw new HttpError(403,"Account not approved");if(u.mustChangePassword)throw new HttpError(403,"Password change required");return u;}
export function isAdmin(u:Pick<User,"role">){return u.role==="admin"||u.role==="super_admin";}
export async function requireAdmin(){const u=await requireUser();if(!isAdmin(u))throw new HttpError(403,"Administrator access required");return u;}
export type Module=Department|"scorecard"|"targets"|"help";
export type Action="create"|"read"|"update"|"delete";
export async function grants(u:User){return getDb().select().from(userTabs).where(eq(userTabs.userId,u.id));}
export type Grant=Awaited<ReturnType<typeof grants>>[number];
export function allowed(u:User,p:Grant[],tab:Module,action:Action){if(u.status!=="approved")return false;if(isAdmin(u))return true;if(u.role==="viewer"&&action!=="read")return false;const field={create:"canCreate",read:"canRead",update:"canUpdate",delete:"canDelete"} as const;return p.some(g=>g.tab===tab&&g[field[action]]&&(action==="read"||g.canRead));}
export async function requirePermission(tab:Module,action:Action){const u=await requireUser();const p=await grants(u);if(!allowed(u,p,tab,action))throw new HttpError(403,"Department access denied");return {u,p};}
export async function createSession(userId:string){const token=randomBytes(32).toString("base64url"),expires=new Date(Date.now()+8*3600000);await getDb().insert(sessions).values({sessionToken:digest(token),userId,expires});(await cookies()).set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",expires});}
export async function logout(){const c=await cookies();const token=c.get(COOKIE)?.value;if(token)await getDb().delete(sessions).where(eq(sessions.sessionToken,digest(token)));c.delete(COOKIE);}
