// Dry-run by default. Intentionally supports only the known development copy.
import {createSign} from "node:crypto";
import {pathToFileURL} from "node:url";
const DEVELOPMENT_ID="1VPalzJc2T_ZK1rbf9ixV7lUERcmmRMj-zclEMHF-lPg";
const PRODUCTION_ID="1_IIHD2hMsgUuvZvFSD9CnLiXhbyBk-nX4u8v6rTsQaI";
export function clinicalFormula(column,previous=false){
  const date=previous?"($K$12-7)":"$K$12";
  const lookup=`INDEX('Clinical Dashboard'!$${column}$14:$${column}$43,MATCH(${date},'Clinical Dashboard'!$A$14:$A$43,0))`;
  return `=IF($K$12="","",IFERROR(IF(${lookup}="","",${lookup}),""))`;
}
const repairCells=[
  ...[[28,"I",1],[29,"F",0],[30,"H",1]].flatMap(([row,col,old])=>[false,true].map(previous=>({tab:"Executive Scorecard",row,col:previous?"E":"D",old:{numberValue:old},next:{formulaValue:clinicalFormula(col,previous)}}))),
  {tab:"Targets",row:11,col:"E",old:{formulaValue:"+2 a month"},next:{stringValue:"+2 a month"}},
  {tab:"Targets",row:57,col:"E",old:{formulaValue:"+2 a month until 90-day retention reaches target"},next:{stringValue:"+2 a month until 90-day retention reaches target"}},
];
function equal(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function matchesOld(actual,old){return equal(actual,old)||(typeof old.formulaValue==="string"&&actual?.formulaValue===`=${old.formulaValue}`);}
export function planRepairs(current){
  const changes=[];
  for(const c of repairCells){const actual=current.get(`${c.tab}!${c.col}${c.row}`);if(equal(actual,c.next))continue;if(!matchesOld(actual,c.old))throw new Error(`Unexpected source value at ${c.tab}!${c.col}${c.row}; no changes planned. Review manually.`);changes.push(c);}
  return changes;
}
export function validateEnvironment(env,args){
  if(env.APP_ENV!=="development"||env.GOOGLE_SHEET_ID!==DEVELOPMENT_ID||env.GOOGLE_SHEET_ID===PRODUCTION_ID||env.ALLOW_PRODUCTION_SHEET==="true")throw new Error("Refusing to run: only the explicitly configured Dawson DEVELOPMENT copy is allowed.");
  if(!env.GOOGLE_SERVICE_ACCOUNT_EMAIL||!env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)throw new Error("Google Sheets credentials are missing.");
  const apply=args.includes("--apply");
  if(apply&&!args.includes(`--confirm=${DEVELOPMENT_ID}`))throw new Error("Apply requires the exact development spreadsheet ID in --confirm.");
  return apply;
}
async function authenticate(env){
  const b64=v=>Buffer.from(JSON.stringify(v)).toString("base64url");
  const now=Math.floor(Date.now()/1000),jwt=b64({alg:"RS256",typ:"JWT"})+"."+b64({iss:env.GOOGLE_SERVICE_ACCOUNT_EMAIL,scope:"https://www.googleapis.com/auth/spreadsheets",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600});
  const assertion=jwt+"."+createSign("RSA-SHA256").update(jwt).sign(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g,"\n"),"base64url");
  const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion}),signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new Error(`Google authorization failed (${r.status}).`);
  const {access_token}=await r.json();return access_token;
}
async function main(){
  const env=process.env,apply=validateEnvironment(env,process.argv.slice(2)),token=await authenticate(env);
  const base=`https://sheets.googleapis.com/v4/spreadsheets/${DEVELOPMENT_ID}`;
  async function request(path,body){const r=await fetch(base+path,{method:body?"POST":"GET",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error(`Google Sheets request failed (${r.status}). Check the service account and protected ranges. Reload and dry-run again before any retry.`);return r.json();}
  async function read(){
    const params=new URLSearchParams({includeGridData:"true",fields:"properties(title),sheets(properties(sheetId,title),data(startRow,startColumn,rowData(values(userEnteredValue))) )".replace(/ /g,"")});
    for(const c of repairCells)params.append("ranges",`'${c.tab}'!${c.col}${c.row}`);
    const result=await request(`?${params}`);if(!/development/i.test(result.properties?.title??""))throw new Error("Workbook title must identify it as DEVELOPMENT.");
    const current=new Map(),ids=new Map();
    for(const s of result.sheets??[]){ids.set(s.properties.title,s.properties.sheetId);for(const g of s.data??[]){const row=(g.startRow??0)+1,col=String.fromCharCode(65+(g.startColumn??0));current.set(`${s.properties.title}!${col}${row}`,g.rowData?.[0]?.values?.[0]?.userEnteredValue);}}
    return {current,ids};
  }
  const {current,ids}=await read(),changes=planRepairs(current);
  console.log(`${apply?"APPLY":"DRY RUN"}: ${changes.length} development cells need repair.`);
  for(const c of changes)console.log(`${c.tab}!${c.col}${c.row}: ${c.next.formulaValue?"restore date-based clinical lookup":"store target as plain text"}`);
  if(!apply||!changes.length){console.log("No workbook changes made.");return;}
  // One Sheets batch, value-only fields: preserves protections, formatting and other cells.
  const requests=changes.map(c=>({updateCells:{start:{sheetId:ids.get(c.tab),rowIndex:c.row-1,columnIndex:c.col.charCodeAt(0)-65},rows:[{values:[{userEnteredValue:c.next}]}],fields:"userEnteredValue"}}));
  await request(":batchUpdate",{requests});
  const verified=await read();if(planRepairs(verified.current).length)throw new Error("Repair response received, but verification was incomplete. Review the workbook.");
  console.log("Development workbook repaired and verified. Production was not accessed.");
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){main().catch(e=>{console.error(e instanceof Error?e.message:"Workbook repair failed");process.exitCode=1;});}
