const url=process.env.AUTH_URL,token=process.env.READINESS_TOKEN;
if(!url||!token||token.length<32)throw new Error('AUTH_URL and 32+ character READINESS_TOKEN required');
const origin=new URL(url);if(origin.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(origin.hostname))throw new Error('Refusing insecure remote app');
for(const [path,headers] of [['/api/health',{}],['/api/ready',{authorization:`Bearer ${token}`}]] ){
 const r=await fetch(new URL(path,origin),{headers,cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new Error(`${path}: HTTP ${r.status}`);
 const result=await r.json();if(result.status!=='ok'&&result.ok!==true)throw new Error(`${path}: unexpected body`);
 console.log(`${path}: PASS`);
}
console.log('Dependency smoke checks passed. This does not certify user roles, workbook writes, migrations or compliance.');
