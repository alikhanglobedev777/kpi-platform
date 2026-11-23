import Link from "next/link";
import {count,eq} from "drizzle-orm";
import {requireAdmin} from "@/lib/auth/session";
import {getDb} from "@/db";
import {users} from "@/db/schema";
export default async function Page(){await requireAdmin();const db=getDb();const [total,pending,active]=await Promise.all([db.select({n:count()}).from(users),db.select({n:count()}).from(users).where(eq(users.status,"pending")),db.select({n:count()}).from(users).where(eq(users.status,"approved"))]);return <><p className="eyebrow">Administration</p><h1>Command center</h1><div className="cards">{[["Total accounts",total[0].n],["Pending requests",pending[0].n],["Approved accounts",active[0].n]].map(([name,n])=><article className="panel" key={name}><p className="muted">{name}</p><strong className="metric">{n}</strong></article>)}</div><div className="panel"><h2>Access management</h2><p>Confirm employee identities independently before granting access. Restrict financial and clinical access to authorized staff.</p><Link className="primary inline-block" href="/admin/users">Review requests</Link> <Link className="secondary inline-block" href="/admin/reporting">Reporting coverage</Link></div></>;}
