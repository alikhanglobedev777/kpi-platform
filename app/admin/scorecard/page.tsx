import {requirePermission} from "@/lib/auth/session";
import {Scorecard} from "@/components/portal/scorecard";
export default async function Page(){await requirePermission("scorecard","read");return <Scorecard admin={true}/>;}
