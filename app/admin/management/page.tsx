import {requireAdmin} from '@/lib/auth/session';
import {ManagementView} from '@/components/portal/management';
export const dynamic='force-dynamic';
export default async function Page(){const u=await requireAdmin();return <ManagementView superAdmin={u.role==='super_admin'}/>;}
