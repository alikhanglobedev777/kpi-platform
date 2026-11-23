import {NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import {neon} from '@neondatabase/serverless';
import {parseEnv} from '@/lib/env';
import {metadata} from '@/lib/sheets/gateway';
export const runtime='nodejs';export const dynamic='force-dynamic';
function authorized(header:string|null,secret:string|undefined){
 if(!secret||secret.length<32||!header?.startsWith('Bearer '))return false;
 const a=Buffer.from(header.slice(7)),b=Buffer.from(secret);
 return a.length===b.length&&timingSafeEqual(a,b);
}
export async function GET(r:Request){
 if(!authorized(r.headers.get('authorization'),process.env.READINESS_TOKEN))return NextResponse.json({error:'Unauthorized'},{status:401,headers:{'Cache-Control':'no-store'}});
 try{
  const env=parseEnv(process.env);if(!env.DATABASE_URL)throw new Error('Missing DB');
  const sql=neon(env.DATABASE_URL);await sql.query('SELECT 1');
  const sheet=await metadata();if(!sheet.sheets?.length)throw new Error('Missing spreadsheet tabs');
  return NextResponse.json({ok:true,checks:['database','sheets']},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({ok:false,error:'One or more dependencies unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
