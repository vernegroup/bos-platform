import "server-only";
import { db } from "@/lib/db";
import type { BOSAccess } from "@/lib/bos/access";

const datePL=(v:string|Date|null)=>v?new Intl.DateTimeFormat("pl-PL",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(v)):"—";

export async function listPromotionProcesses(access:BOSAccess){
 const rows=await db().unsafe("SELECT pp.id,pp.employee_name_snapshot,pp.from_role,pp.to_role,pp.change_type,pp.status,pp.started_on,pp.effective_on,u.display_name owner,(SELECT count(*)::int FROM promotion_checks pc WHERE pc.promotion_process_id=pp.id) total_checks,(SELECT count(*)::int FROM promotion_checks pc WHERE pc.promotion_process_id=pp.id AND pc.status='DONE') done_checks FROM promotion_processes pp JOIN users u ON u.id=pp.owner_user_id WHERE pp.organization_id=$1 AND pp.status<>'CLOSED' AND pp.status<>'CANCELLED' ORDER BY pp.started_on DESC",[access.organization.id]);
 return rows.map(r=>({id:r.id,employee:r.employee_name_snapshot,fromRole:r.from_role,toRole:r.to_role,type:r.change_type==="PROMOTION"?"AWANS":"PRZESUNIĘCIE",status:r.status,startedOn:datePL(r.started_on),effectiveOn:datePL(r.effective_on),owner:r.owner,total:r.total_checks,done:r.done_checks}));
}
export async function listPromotionClosures(access:BOSAccess){
 const rows=await db().unsafe("SELECT pc.id,pp.employee_name_snapshot,pp.from_role,pp.to_role,pp.change_type,pc.result,pc.summary,pc.recommendations,pc.verified_at,u.display_name verifier FROM promotion_closures pc JOIN promotion_processes pp ON pp.id=pc.promotion_process_id JOIN users u ON u.id=pc.verified_by_user_id WHERE pc.organization_id=$1 ORDER BY pc.verified_at DESC",[access.organization.id]);
 return rows.map(r=>({id:r.id,employee:r.employee_name_snapshot,fromRole:r.from_role,toRole:r.to_role,type:r.change_type==="PROMOTION"?"AWANS":"PRZESUNIĘCIE",result:r.result,summary:r.summary,recommendations:r.recommendations,verifiedAt:datePL(r.verified_at),verifier:r.verifier}));
}
export async function getPromotionProcess(access:BOSAccess,id:string){
 const rows=await db().unsafe("SELECT pp.id,pp.employee_name_snapshot,pp.from_role,pp.to_role,pp.change_type,pp.status,pp.started_on,pp.effective_on,u.display_name owner FROM promotion_processes pp JOIN users u ON u.id=pp.owner_user_id WHERE pp.id=$1 AND pp.organization_id=$2 LIMIT 1",[id,access.organization.id]);
 if(!rows[0])return null;
 const checks=await db().unsafe("SELECT id,position,name,criterion,status,completed_at FROM promotion_checks WHERE promotion_process_id=$1 AND organization_id=$2 ORDER BY position",[id,access.organization.id]);
 const r=rows[0];return{id:r.id,employee:r.employee_name_snapshot,fromRole:r.from_role,toRole:r.to_role,type:r.change_type==="PROMOTION"?"AWANS":"PRZESUNIĘCIE",status:r.status,startedOn:datePL(r.started_on),effectiveOn:datePL(r.effective_on),owner:r.owner,checks:checks.map(c=>({id:c.id,position:c.position,name:c.name,criterion:c.criterion,status:c.status,completedAt:datePL(c.completed_at)}))};
}
