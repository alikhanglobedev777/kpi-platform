import {notFound} from "next/navigation";
import {isDepartment} from "@/lib/sheets/schema";
import {requirePermission} from "@/lib/auth/session";
import {DepartmentView} from "@/components/portal/department";
export default async function Page({params}:{params:Promise<{tab:string}>}){const {tab}=await params;if(!isDepartment(tab))notFound();await requirePermission(tab,"read");return <DepartmentView key={tab} tab={tab}/>;}
