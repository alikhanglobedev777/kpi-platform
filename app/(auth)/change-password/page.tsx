import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth/session";
import {ChangePassword} from "@/components/portal/change-password";
export const dynamic="force-dynamic";
export default async function Page(){const u=await currentUser();if(!u)redirect("/login");if(u.status!=="approved")redirect("/pending-approval");return <ChangePassword/>;}
