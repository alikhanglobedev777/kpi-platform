import Link from "next/link";
import {requireUser,grants,allowed} from "@/lib/auth/session";
import {departments,keys} from "@/lib/sheets/schema";
import {previousSaturday} from "@/lib/sheets/values";
import {parseEnv} from "@/lib/env";
export default async function Page(){const u=await requireUser(),p=await grants(u);const items=keys.filter(k=>allowed(u,p,k,"read"));return <><p className="eyebrow">Your workspace</p><h1>Weekly KPI dashboard</h1><p className="muted">Reporting week ending {previousSaturday(new Date(),parseEnv(process.env).SHEET_TIMEZONE)} · Due Monday at 10 AM.</p><div className="cards">{items.map(k=><Link className="panel hover:border-primary" key={k} href={`/dashboard/${k}`}><h2>{departments[k].name}</h2><p className="muted">View records and manage permitted entries.</p></Link>)}</div>{!items.length&&<p className="panel">No departments assigned. Contact your administrator.</p>}</>;}
