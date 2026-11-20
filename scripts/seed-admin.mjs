import {existsSync} from 'node:fs';
import {randomBytes,scryptSync} from 'node:crypto';
import {neon} from '@neondatabase/serverless';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
const email=process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase(),password=process.env.SEED_ADMIN_PASSWORD;
if(!email||!password||password.length<12||!process.env.DATABASE_URL)throw new Error('Set SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD (12+ characters), DATABASE_URL.');
const allow=(process.env.INITIAL_ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase());if(!allow.includes(email))throw new Error('Seed email must be explicitly allowlisted.');
const salt=randomBytes(16);const hash=`scrypt$${salt.toString('hex')}$${scryptSync(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024}).toString('hex')}`;
const sql=neon(process.env.DATABASE_URL);const rows=await sql`insert into users (email, name, password_hash, status, role) values (${email}, 'Initial Admin', ${hash}, 'approved', 'super_admin') on conflict (email) do nothing returning id`;if(!rows.length)throw new Error('Account already exists. No changes made.');console.log('Initial super admin created. Remove seed password from environment.');
