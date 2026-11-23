// Business validation shared by APIs and deterministic unit tests.
import {z} from 'zod';
export const priorityInput=z.object({
 title:z.string().trim().min(3).max(140),owner:z.string().trim().min(2).max(100),
 dueDate:z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/),z.literal('')]).optional(),
 status:z.enum(['open','in_progress','blocked','done']),notes:z.string().trim().max(1000),
});
export const targetInput=z.object({cell:z.string().regex(/^C(?:1[1-9]|2\d|3[0-2])$/),newValue:z.number().finite().min(0).max(1e12),rationale:z.string().trim().min(12).max(500)});
export const PERCENT_GOALS=new Set([19,27,28,30]);
export function validateGoal(cell:string,newValue:number){
 const row=Number(cell.slice(1));
 if(!/^C(?:1[1-9]|2\d|3[0-2])$/.test(cell)||[17,18].includes(row))throw new Error('Protected scorecard goal');
 if(!Number.isFinite(newValue)||newValue<0||newValue>1e12||(PERCENT_GOALS.has(row)&&newValue>1))throw new Error('Invalid goal value');
}
export function safeScorecardGoal(cell:string):boolean{const row=Number(cell.slice(1));return /^C(?:1[1-9]|2\d|3[0-2])$/.test(cell)&&![17,18].includes(row);}
