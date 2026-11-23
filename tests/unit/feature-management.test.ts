import {describe,expect,it} from 'vitest';
import {priorityInput,targetInput,validateGoal,safeScorecardGoal,PERCENT_GOALS} from '@/lib/management/rules';
describe('management input and formula-safety',()=>{
 it('accepts only eligible scorecard C cells',()=>{
  for(let i=11;i<=32;i++)expect(safeScorecardGoal(`C${i}`)).toBe(![17,18].includes(i));
  for(const s of ['A11','D28','C9','C33','K12','C17','C18','C11:E32','C28\n'])expect(safeScorecardGoal(s)).toBe(false);
 });
 it('never permits out-of-range percent targets',()=>{
  expect(()=>validateGoal('C28',1)).not.toThrow();
  expect(()=>validateGoal('C28',1.01)).toThrow();
  expect(()=>validateGoal('C12',1e12)).not.toThrow();
  expect(()=>validateGoal('C12',-2)).toThrow();
 });
 it('rejects short reasons and unstructured priority records',()=>{
  expect(targetInput.safeParse({cell:'C19',newValue:0.95,rationale:'approved budget revision'}).success).toBe(true);
  expect(targetInput.safeParse({cell:'C19',newValue:0.95,rationale:'no'}).success).toBe(false);
  expect(priorityInput.safeParse({title:'Improve on-time staffing',owner:'Ops Lead',status:'open',notes:''}).success).toBe(true);
  expect(priorityInput.safeParse({title:'a',owner:'x',status:'deleted',notes:''}).success).toBe(false);
  expect(PERCENT_GOALS.has(28)).toBe(true);
 });
});
