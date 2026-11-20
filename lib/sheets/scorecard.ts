import "server-only";
import {readRanges} from "./gateway";
const q=(r:string)=>`'Executive Scorecard'!${r}`;
export async function scorecard(){const [metrics,week,pulse,seats,priorities,wins,risk,major,risks,notes,directions]=await readRanges(["A11:H32","K12","K16","J26:K32","A37:G39","K17","K20","A42","E42","A48","M11:M32"].map(q),"FORMATTED_VALUE");return {metrics,week:week[0]?.[0]??"",pulse:pulse[0]?.[0]??"",seats,priorities,wins:wins[0]?.[0]??"",risk:risk[0]?.[0]??"",major:major[0]?.[0]??"",risks:risks[0]?.[0]??"",notes:notes[0]?.[0]??"",directions};}
