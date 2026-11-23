// Deterministic target selection, separated from network and database writes.
import {HttpError} from "@/lib/http";
import {departments,type Department} from "./schema";
import type {Loaded} from "./records";
export type MutationAction = "create"|"update"|"delete";
export function selectMutationRow(tab:Department,rows:Loaded[],action:MutationAction,id?:string,version?:string):Loaded{
  const weekly=departments[tab].weekly;
  // Only list modules may allocate an unused row. Weekly modules must use a preconfigured week.
  const row=action==="create"&&!weekly
    ? rows.find(r=>!r.filled&&r.entered.every(v=>v===""))
    : rows.find(r=>Boolean(id)&&r.id===id);
  if(!row)throw new HttpError(action==="create"?409:404,action==="create"
    ?"No available record; check configured weeks or list capacity":"Record not found");
  if(action!=="create"||weekly){
    if(version!==row.version)throw new HttpError(409,"Record changed. Reload and try again.");
  }
  if(action==="create"&&row.filled)throw new HttpError(409,"Record already exists");
  if(action!=="create"&&!row.filled)throw new HttpError(409,"Record is empty");
  return row;
}
