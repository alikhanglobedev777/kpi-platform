import {PortalShell} from "@/components/portal/shell";
export const dynamic="force-dynamic";
export default function Layout({children}:{children:React.ReactNode}){return <PortalShell admin>{children}</PortalShell>;}
