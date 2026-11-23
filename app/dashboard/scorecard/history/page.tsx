import {requirePermission} from "@/lib/auth/session";
import {HistoricalScorecard} from "@/components/portal/historical-scorecard";
export default async function Page(){await requirePermission("scorecard","read");return <HistoricalScorecard/>;}
