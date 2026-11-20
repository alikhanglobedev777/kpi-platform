export type Cell = string | number | boolean;
export type Kind = "integer" | "decimal" | "money" | "cash" | "percent" | "text" | "date" | "enum";
export type Field = {column:string;label:string;kind:Kind;readonly?:boolean;options?:string[]};
const f=(column:string,label:string,kind:Kind="integer",readonly=false,options?:string[]):Field=>({column,label,kind,readonly,options});
const date=f("A","Week Ending","date",true);
const weekly=(name:string,fields:Field[])=>({name,weekly:true,fields:[date,...fields]});
const list=(name:string,fields:Field[])=>({name,weekly:false,fields});
export const departments = {
 hr:weekly("HR Dashboard",[f("B","Active Caregivers"),f("C","New Hires"),f("D","Separations"),f("E","Turnover %","percent",true),f("F","Call-Outs"),f("G","Open Positions"),f("H","Training Compliance %","percent"),f("I","Corrective Actions"),f("J","Declined Applicants"),f("K","Notes","text")]),
 business_development:weekly("Business Development",[f("B","New Referrals"),f("C","Assessments Scheduled"),f("D","Assessments Completed"),f("E","New Starts"),f("F","Conversion %","percent",true),f("G","Active Clients"),f("H","Client Discharges"),f("I","Outreach Meetings"),f("J","Top Referral Source","text"),f("K","Hot Opportunities","text"),f("L","Next Action","text")]),
 scheduling:weekly("Scheduling Dashboard",[f("B","Open Shifts"),f("C","Overtime Hours","decimal"),f("D","Shifts Unable to Cover"),f("E","Notes","text")]),
 financial:weekly("Financial Dashboard",[f("B","Revenue","money"),f("C","Payroll Budget","money"),f("D","Actual Payroll","money"),f("E","Payroll %","percent",true),f("F","Overtime $","money"),f("G","A/R Outstanding","money"),f("H","Collections","money"),f("I","Other Expenses","money"),f("J","Cash Position","cash"),f("K","Notes","text")]),
 clinical:weekly("Clinical Dashboard",[f("B","Assessments Due"),f("C","Assessments Completed"),f("D","Reassessments Due"),f("E","Reassessments Completed"),f("F","Incidents"),f("G","Complaints"),f("H","Care Plan Compliance %","percent"),f("I","Client Satisfaction %","percent"),f("J","Training Issues","text"),f("K","Follow-Up","text")]),
 founder_transition:weekly("Founder Transition",[f("B","Escalations to Jay or Monique"),f("C","Seats That Escalated","text"),f("D","Jay's Operations Hours","decimal"),f("E","Notes","text")]),
 weekly_kpi_report:list("Weekly KPI Report",[f("A","Week Ending","date"),f("B","Department","enum",false,["Clinical","Operations","HR","Finance","Scheduling","Business Development","Compliance"]),f("C","KPI","text"),f("D","Goal","cash"),f("E","Actual","cash"),f("F","Status","enum",false,["Green","Yellow","Red"]),f("G","Variance","cash",true),f("H","Owner","text"),f("I","Corrective Action","text"),f("J","Due Date","date")]),
 compliance:list("Compliance Dashboard",[f("A","Requirement","text"),f("B","Category","text"),f("C","Responsible Leader","text"),f("D","Frequency","text"),f("E","Last Completed","date"),f("F","Next Due","date"),f("G","Status","enum",false,["Current","Due Soon","Past Due","In Progress"]),f("H","Evidence Location","text"),f("I","Action Required","text"),f("J","Notes","text")]),
 quarterly_goals:list("Quarterly Goals",[f("A","Quarter","enum",false,["Q1","Q2","Q3","Q4"]),f("B","Strategic Pillar","text"),f("C","Goal","text"),f("D","Success Metric","text"),f("E","Baseline","text"),f("F","Target","text"),f("G","Owner","text"),f("H","Status","enum",false,["Not Started","On Track","At Risk","Complete"]),f("I","Milestone Date","date"),f("J","Progress Notes","text")]),
};
export type Department = keyof typeof departments;
export const keys=Object.keys(departments) as Department[];
export function isDepartment(v:string):v is Department{return Object.hasOwn(departments,v);}
export const reportDepartment:Record<string,Department>={Clinical:"clinical",Operations:"founder_transition",HR:"hr",Finance:"financial",Scheduling:"scheduling","Business Development":"business_development",Compliance:"compliance"};
export const FIRST_ROW=14, LAST_ROW=43;
export function range(tab:Department,start:string,end?:string){return `'${departments[tab].name}'!${start}${end?`:${end}`:""}`;}
