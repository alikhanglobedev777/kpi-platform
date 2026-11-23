import {requireAdmin} from '@/lib/auth/session';
import {ReconcileView} from '@/components/portal/reconcile';
export const dynamic='force-dynamic';
export default async function Page(){const u=await requireAdmin();return <ReconcileView superAdmin={u.role==='super_admin'}/>;}
