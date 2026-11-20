import {test} from "node:test";
import assert from "node:assert/strict";
import {clinicalFormula,planRepairs,validateEnvironment} from "../../scripts/repair-development-workbook.mjs";
const id="1VPalzJc2T_ZK1rbf9ixV7lUERcmmRMj-zclEMHF-lPg";
const env={APP_ENV:"development",GOOGLE_SHEET_ID:id,ALLOW_PRODUCTION_SHEET:"false",GOOGLE_SERVICE_ACCOUNT_EMAIL:"fixture",GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:"fixture"};
function fixture(){return new Map([
  ...[[28,1],[29,0],[30,1]].flatMap(([r,n])=>["D","E"].map(c=>[`Executive Scorecard!${c}${r}`,{numberValue:n}])),
  ["Targets!E11",{formulaValue:"+2 a month"}],
  ["Targets!E57",{formulaValue:"=+2 a month until 90-day retention reaches target"}],
]);}
test("dry run is default and apply requires exact confirmation",()=>{assert.equal(validateEnvironment(env,[]),false);assert.throws(()=>validateEnvironment(env,["--apply"]));assert.equal(validateEnvironment(env,["--apply",`--confirm=${id}`]),true);});
test("production and other spreadsheets are rejected",()=>{assert.throws(()=>validateEnvironment({...env,APP_ENV:"production"},[]));assert.throws(()=>validateEnvironment({...env,GOOGLE_SHEET_ID:"other"},[]));assert.throws(()=>validateEnvironment({...env,ALLOW_PRODUCTION_SHEET:"true"},[]));});
test("plans exactly eight known repairs, preserves already corrected cells, aborts on drift",()=>{const current=fixture(),changes=planRepairs(current);assert.equal(changes.length,8);for(const c of changes)current.set(`${c.tab}!${c.col}${c.row}`,c.next);assert.equal(planRepairs(current).length,0);current.set("Executive Scorecard!D28",{numberValue:50});assert.throws(()=>planRepairs(current),/Unexpected source value/);});
test("lookup maps clinical fields and exact reporting dates",()=>{assert.match(clinicalFormula("I"),/\$I\$14:\$I\$43/);assert.match(clinicalFormula("F",true),/\(\$K\$12-7\)/);});
