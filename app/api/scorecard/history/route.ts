import {NextResponse} from "next/server";
import {requirePermission} from "@/lib/auth/session";
import {historicalScorecard} from "@/lib/sheets/historical-scorecard";
import {limit} from "@/lib/auth/rate-limit";
import {fail} from "@/lib/http";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{
  const {u}=await requirePermission("scorecard","read");
  await limit(`historical-scorecard:${u.id}`,30,1);
  const date=new URL(request.url).searchParams.get("week")??"";
  const data=await historicalScorecard(date);
  return NextResponse.json(data,{headers:{"Cache-Control":"no-store"}});
}catch(e){return fail(e);}}
