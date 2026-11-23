import {dateSerial,serialDate} from "./values";

export type CheckStatus="pass"|"review"|"error"|"unavailable";
export type WorkbookCheck={id:string;area:string;title:string;status:CheckStatus;detail:string};
export const check=(id:string,area:string,title:string,status:CheckStatus,detail:string):WorkbookCheck=>({id,area,title,status,detail});
const nonempty=(v:unknown)=>v!==undefined&&v!==null&&v!=="";

/** Inspect raw Sheets values only; never modify dates, formulas, or workbook cells. */
export function weeklyDateCheck(tab:string,rows:unknown[][],cutoff:string):WorkbookCheck{
  const serials=Array.from({length:30},(_,i)=>rows[i]?.[0]);
  const problems:number[]=[],firstWeek=dateSerial("2026-10-24");
  for(let i=0;i<serials.length;i++){
    const n=serials[i];
    if(typeof n!=="number"||!Number.isInteger(n)||n<1){problems.push(i+14);continue;}
    try{
      const date=serialDate(n);
      if(new Date(`${date}T00:00:00Z`).getUTCDay()!==6)problems.push(i+14);
      if(n!==firstWeek+i*7)problems.push(i+14);
    }catch{problems.push(i+14);}
  }
  if(problems.length)return check(`week-${tab}`,tab,"Weekly date keys","review",`Review column A rows ${[...new Set(problems)].slice(0,6).join(", ")}${problems.length>6?" and others":""}: missing, shifted, non-Saturday, or non-consecutive date keys. Do not overwrite dates through the portal.`);
  const last=serialDate(serials[29] as number);
  if(last<cutoff)return check(`week-${tab}`,tab,"Weekly date keys","review",`Last scheduled week is ${last}, earlier than the current reporting week ${cutoff}. Extend the workbook using an approved procedure before new submissions.`);
  return check(`week-${tab}`,tab,"Weekly date keys","pass",`30 consecutive Saturday date keys; final scheduled week ${last}.`);
}

/** A formula is required only when source inputs for the same week are populated. */
export function calculatedColumnCheck(tab:string,source:unknown[][],formulas:unknown[][]):WorkbookCheck{
  const active=Array.from({length:30},(_,i)=>i).filter(i=>(source[i]??[]).some(nonempty));
  if(!active.length)return check(`formula-${tab}`,tab,"Calculated KPI column","review","No populated input rows available to verify formula coverage.");
  const missing=active.filter(i=>typeof formulas[i]?.[0]!=="string"||!String(formulas[i][0]).startsWith("="));
  if(missing.length)return check(`formula-${tab}`,tab,"Calculated KPI column","review",`Expected a spreadsheet formula in ${missing.length} populated row(s), starting at row ${missing[0]+14}. Review formula protection and calculation; no cells were changed.`);
  return check(`formula-${tab}`,tab,"Calculated KPI column","pass",`${active.length} populated row(s) have spreadsheet formulas. This does not validate the mathematical rules.`);
}

export function clinicalLookupCheck(rows:unknown[][]):WorkbookCheck{
  const missing:string[]=[];
  for(let row=28;row<=30;row++)for(let col=0;col<2;col++){
    const value=rows[row-28]?.[col];
    if(typeof value!=="string"||!value.startsWith("="))missing.push(`${col===0?"D":"E"}${row}`);
  }
  return missing.length?check("clinical-scorecard","Executive Scorecard","Clinical lookup formulas","review",`${missing.join(", ")} ${missing.length===1?"is":"are"} not formula-backed. Run the existing development-only workbook repair dry run and review with the workbook owner.`):check("clinical-scorecard","Executive Scorecard","Clinical lookup formulas","pass","All six clinical scorecard cells D28:E30 contain formulas. Their business correctness still needs verification.");
}

export function targetErrorCheck(ranges:unknown[][][]):WorkbookCheck{
  const cells=["E11","E57"];
  const bad=cells.filter((_,i)=>/^#(ERROR!|REF!|VALUE!|DIV\/0!|NAME\?|N\/A|NUM!|NULL!)/i.test(String(ranges[i]?.[0]?.[0]??"")));
  return bad.length?check("target-errors","Targets","Known target-cell errors","review",`Spreadsheet error displayed in ${bad.join(", ")}. Review the existing development-only repair plan. Targets remain read-only.`):check("target-errors","Targets","Known target-cell errors","pass","No visible spreadsheet errors in Targets E11 or E57. This does not confirm that business targets are approved.");
}
