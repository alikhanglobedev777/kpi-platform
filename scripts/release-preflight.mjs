import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const fail=(m)=>{console.error(`FAIL: ${m}`);process.exitCode=1;};
const env=process.env;
const prod=env.APP_ENV==='production';
if(prod){
 if(env.NODE_ENV!=='production')fail('NODE_ENV must be production');
 if(!env.AUTH_URL?.startsWith('https://'))fail('AUTH_URL must be https in production');
 for(const key of ['DATABASE_URL','GOOGLE_SHEET_ID','GOOGLE_SERVICE_ACCOUNT_EMAIL','GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY','RESEND_API_KEY','NOTIFY_FROM','CRON_SECRET'])if(!env[key])fail(`${key} is missing`);
 if((env.CRON_SECRET??'').length<32)fail('CRON_SECRET must be at least 32 chars');
 if(env.ALLOW_PRODUCTION_SHEET!=='true')fail('Production workbook access was not explicitly enabled');
}else if(env.GOOGLE_SHEET_ID==='1_IIHD2hMsgUuvZvFSD9CnLiXhbyBk-nX4u8v6rTsQaI')fail('Production workbook configured in nonproduction mode');
const ignore=await readFile('.gitignore','utf8');if(!ignore.split(/\r?\n/).includes('.env*'))fail('.env* missing from .gitignore');
let branch='';try{branch=execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();}catch{/* CI detached HEAD allowed */}
console.log(`Release preflight: ${prod?'PRODUCTION':'DEVELOPMENT'}; branch ${branch||'detached'}. This checks configuration only, NOT live resources.`);
if(!process.exitCode)console.log('PASS: Static release checks');
