import {Logout} from "@/components/portal/logout";
import Link from "next/link";
export default function Page(){return <main className="auth-shell"><section className="panel auth-panel"><h1>Waiting for approval</h1><p>Your administrator will confirm your identity and assign access. Sign in again after approval.</p><Logout/><Link href="/login">Back to login</Link></section></main>;}
