// Separate, additive feature migrations. Safe dry-run by default; run only after DB backup.
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {neon} from '@neondatabase/serverless';

const root=fileURLToPath(new URL('./migrations/',import.meta.url));
const files=(await readdir(root)).filter(x=>/^\d{4}_.+\.sql$/.test(x)).sort();
const apply=process.argv.includes('--apply');
if(!process.env.DATABASE_URL){console.error('DATABASE_URL missing');process.exit(1);}
if(process.env.APP_ENV==='production'&&!process.argv.includes('--confirm-production-migration')){
  console.error('Production migration requires --confirm-production-migration and a verified backup.');process.exit(1);
}
const sql=neon(process.env.DATABASE_URL);
if(apply){
  await sql.query('CREATE TABLE IF NOT EXISTS kpi_feature_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
}
for(const name of files){
  const body=await readFile(join(root,name),'utf8');
  const checksum=createHash('sha256').update(body).digest('hex');
  const statements=body.split('-- statement-breakpoint').map(x=>x.trim()).filter(Boolean);
  if(!apply){console.log(`DRY RUN ${name}: ${statements.length} SQL statements; no DB changes`);continue;}
  const prior=await sql.query('SELECT checksum FROM kpi_feature_migrations WHERE name = $1',[name]);
  if(prior.length){if(prior[0].checksum!==checksum)throw new Error(`Migration changed after application: ${name}`);console.log(`Already applied ${name}`);continue;}
  for(const statement of statements)await sql.query(statement);
  await sql.query('INSERT INTO kpi_feature_migrations (name,checksum) VALUES ($1,$2)',[name,checksum]);
  console.log(`Applied ${name}`);
}
console.log(apply?'Feature schema ready.':'Add --apply only after reviewing migrations and backing up Neon.');
