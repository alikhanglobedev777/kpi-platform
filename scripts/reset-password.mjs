import {existsSync} from 'node:fs';
import {randomBytes,scryptSync} from 'node:crypto';
import {neon} from '@neondatabase/serverless';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
const email=process.argv[2]?.trim().toLowerCase();if(!email||!process.env.DATABASE_URL)throw new Error('Usage: pnpm admin:reset verified@example.com');
const password=randomBytes(24).toString('base64url');const salt=randomBytes(16);const hash=`scrypt$${salt.toString('hex')}$${scryptSync(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024}).toString('hex')}`;
const sql=neon(process.env.DATABASE_URL);const [rows]=await sql.transaction([sql`update users set password_hash=${hash},must_change_password=true where email=${email} and status='approved' returning id`,sql`delete from sessions where user_id in (select id from users where email=${email} and status='approved')`]);if(!rows.length)throw new Error('Approved account not found.');console.log('Temporary password (deliver through independently verified private channel; do not log): '+password);
