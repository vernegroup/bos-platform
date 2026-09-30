import { redirect } from "next/navigation";

export default async function LegacyEmployeeHistory({params}:{params:Promise<{employeeId:string}>}) {
 const {employeeId}=await params;
 redirect(`/app/employees/${encodeURIComponent(employeeId)}`);
}
