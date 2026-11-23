import "server-only";
import {parseEnv} from "@/lib/env";
import {metadata,readRanges} from "./gateway";
import {departments,type Department} from "./schema";
import {previousSaturday} from "./values";
import {calculatedColumnCheck,check,clinicalLookupCheck,targetErrorCheck,weeklyDateCheck,type WorkbookCheck} from "./workbook-check-rules";

const weekly=(Object.keys(departments) as Department[]).filter(k=>departments[k].weekly);
const calculated=[
  {tab:"HR Dashboard",source:"B14:D43",formula:"E14:E43"},
  {tab:"Business Development",source:"B14:E43",formula:"F14:F43"},
  {tab:"Financial Dashboard",source:"B14:D43",formula:"E14:E43"},
] as const;
const quoted=(tab:string,range:string)=>`'${tab}'!${range}`;
const expectedTabs=[...Object.values(departments).map(d=>d.name),"Executive Scorecard","Targets","KPI Guide","Start Here"];

export async function workbookChecks(){
  const env=parseEnv(process.env),cutoff=previousSaturday(new Date(),env.SHEET_TIMEZONE);
  const [info,dates,formulaInputs,formulas,clinical,targets]=await Promise.allSettled([
    metadata(),
    readRanges(weekly.map(tab=>quoted(departments[tab].name,"A14:A43"))),
    readRanges(calculated.map(c=>quoted(c.tab,c.source))),
    readRanges(calculated.map(c=>quoted(c.tab,c.formula)),"FORMULA"),
    readRanges([quoted("Executive Scorecard","D28:E30")],"FORMULA"),
    readRanges([quoted("Targets","E11"),quoted("Targets","E57")],"FORMATTED_VALUE"),
  ]);
  const checks:WorkbookCheck[]=[];
  if(info.status==="fulfilled"){
    const actual=info.value.sheets.map(s=>s.properties.title);
    const missing=expectedTabs.filter(t=>!actual.includes(t));
    checks.push(check("tabs","Workbook","Expected worksheet tabs",missing.length?"error":"pass",missing.length?`Missing: ${missing.join(", ")}. Check tab names and workbook selection.`:`All ${expectedTabs.length} expected worksheet tabs found.`));
    checks.push(check("timezone","Workbook","Spreadsheet timezone",info.value.properties.timeZone==="America/Los_Angeles"?"pass":"review",`Workbook timezone: ${info.value.properties.timeZone}. Expected America/Los_Angeles for existing reporting calculations.`));
    checks.push(check("workbook-title","Workbook","Development workbook selection",env.APP_ENV==="development"&&!/development/i.test(info.value.properties.title)?"review":"pass",`Workbook: ${info.value.properties.title}. Confirm environment and workbook identity before testing writes.`));
  }else checks.push(check("metadata","Workbook","Workbook metadata","unavailable","Unable to read metadata. Verify the configured service account and spreadsheet access."));
  for(let i=0;i<weekly.length;i++){
    const tab=departments[weekly[i]].name;
    checks.push(dates.status==="fulfilled"?weeklyDateCheck(tab,dates.value[i]??[],cutoff):check(`week-${tab}`,tab,"Weekly date keys","unavailable","Could not verify the configured weekly date range."));
  }
  for(let i=0;i<calculated.length;i++){
    const tab=calculated[i].tab;
    checks.push(formulaInputs.status==="fulfilled"&&formulas.status==="fulfilled"?calculatedColumnCheck(tab,formulaInputs.value[i]??[],formulas.value[i]??[]):check(`formula-${tab}`,tab,"Calculated KPI column","unavailable","Could not read formula cells or input rows."));
  }
  checks.push(clinical.status==="fulfilled"?clinicalLookupCheck(clinical.value[0]??[]):check("clinical-scorecard","Executive Scorecard","Clinical lookup formulas","unavailable","Could not inspect clinical scorecard formulas."));
  checks.push(targets.status==="fulfilled"?targetErrorCheck(targets.value):check("target-errors","Targets","Known target-cell errors","unavailable","Could not read the two known target cells."));
  checks.push(check("goal-reconciliation","Business rules","Goal and threshold reconciliation","review","The Targets sheet and Executive Scorecard goals are distinct. Confirm approved targets, KPI directions, and red/yellow/green thresholds with leadership; this read-only check cannot certify them."));
  checks.push(check("finance-frequency","Business rules","Finance reporting frequency","review","Confirm whether payroll and revenue figures are weekly, biweekly, or monthly before interpreting comparisons. No calculation changes are made."));
  return {checks,cutoff,checkedAt:new Date().toISOString()};
}
