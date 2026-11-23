// Encrypted data-only backup: not a replacement for a full Drive workbook copy or Neon PITR.
import {neon} from '@neondatabase/serverless';
import {createSign,randomBytes,scryptSync,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
import {writeFile,readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
const pass=process.env.KPI_BACKUP_PASSPHRASE;
if(!pass||pass.length<20)throw new Error('KPI_BACKUP_PASSPHRASE must be 20+ chars; never store it in Git.');
const mode=process.argv.includes('--verify')?'verify':process.argv.includes('--export')?'export':'help';
const arg=process.argv.find(x=>x.startsWith('--file='));
if(!arg){console.log('Usage: node --env-file=.env.local scripts/encrypted-backup.mjs --export|--verify --file=C:\\secure\\backup.kpi');process.exit(1);}
const file=resolve(arg.slice(7));
if(mode==='help')throw new Error('Specify --export or --verify');
function decrypt(envelope){const salt=Buffer.from(envelope.salt,'base64'),iv=Buffer.from(envelope.iv,'base64'),tag=Buffer.from(envelope.tag,'base64');const key=scryptSync(pass,salt,32);const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAuthTag(tag);return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext,'base64')),decipher.final()]).toString('utf8'));}
if(mode==='verify'){
 const body=decrypt(JSON.parse(await readFile(file,'utf8')));
 if(body.schema!=='kpi-backup-v1'||!Array.isArray(body.sheets)||!body.database)throw new Error('Unexpected backup schema');
 console.log(JSON.stringify({verified:true,createdAt:body.createdAt,spreadsheetIdSuffix:body.spreadsheetId.slice(-6),tables:Object.keys(body.database),sheets:body.sheets.map(x=>x.range)},null,2));process.exit(0);
}
if(process.env.APP_ENV==='production'&&!process.argv.includes('--confirm-production-backup'))throw new Error('Production backup requires --confirm-production-backup');
if(!process.env.DATABASE_URL||!process.env.GOOGLE_SHEET_ID||!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL||!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)throw new Error('Database and Google Sheets credentials required');
if(file.startsWith(resolve('.')+sep))throw new Error('Choose an encrypted backup location OUTSIDE the repository');
const sql=neon(process.env.DATABASE_URL);
// Only app tables; schema dumps, PostgreSQL extensions, grants and recovery settings are not included.
const tables=['users','user_tabs','operations','sessions','rate_limits','kpi_priority_actions','kpi_target_requests','kpi_password_reset_tokens','kpi_notification_deliveries','kpi_write_leases','kpi_write_receipts','kpi_feature_migrations'];
const database={};for(const name of tables)database[name]=await sql.query(`SELECT * FROM ${name}`);
const now=Math.floor(Date.now()/1000),b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');const header=b64({alg:'RS256',typ:'JWT'}),claim=b64({iss:process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,scope:'https://www.googleapis.com/auth/spreadsheets.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});const payload=`${header}.${claim}`;
const assertion=`${payload}.${createSign('RSA-SHA256').update(payload).sign(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g,'\n'),'base64url')}`;
const tokenRes=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});if(!tokenRes.ok)throw new Error('Google authentication failed');const {access_token}=await tokenRes.json();
const metaRes=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(process.env.GOOGLE_SHEET_ID)}?fields=sheets(properties(title))`,{headers:{Authorization:`Bearer ${access_token}`}});if(!metaRes.ok)throw new Error('Workbook metadata unavailable');const meta=await metaRes.json();
const sheets=[];for(const s of meta.sheets){const name=s.properties.title;const range=`'${name.replaceAll("'","''")}'`;
 const url=new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(process.env.GOOGLE_SHEET_ID)}/values/${encodeURIComponent(range)}`);url.searchParams.set('valueRenderOption','FORMULA');
 const response=await fetch(url,{headers:{Authorization:`Bearer ${access_token}`},signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error(`Could not read backup range for ${name}`);const data=await response.json();sheets.push({range:name,values:data.values??[]});
}
const backup={schema:'kpi-backup-v1',createdAt:new Date().toISOString(),spreadsheetId:process.env.GOOGLE_SHEET_ID,sheets,database,limitations:['Data-only; does not preserve spreadsheet protections, formatting, charts, scripts, or Drive revisions','Not a PostgreSQL physical backup; use Neon PITR and Drive copies']};
const salt=randomBytes(16),iv=randomBytes(12),key=scryptSync(pass,salt,32),cipher=createCipheriv('aes-256-gcm',key,iv),plain=Buffer.from(JSON.stringify(backup));const encrypted=Buffer.concat([cipher.update(plain),cipher.final()]);
await writeFile(file,JSON.stringify({version:1,salt:salt.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:encrypted.toString('base64')}),{mode:0o600,flag:'wx'});
console.log('Encrypted data-only snapshot created. Verify it with --verify and store it in a restricted location.');
