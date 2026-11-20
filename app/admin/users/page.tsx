import {requireAdmin} from "@/lib/auth/session";
import {UserManagement} from "@/components/portal/users";
export default async function Page(){await requireAdmin();return <UserManagement/>;}
