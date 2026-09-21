import "server-only";
import { db, hasDatabase } from "@/lib/db";

function requireDb(){if(!hasDatabase()) throw new Error("Database is required for Employee Core.");}
function tenantId(id?:string){if(!id) throw new Error("organizationId is required for employee data.");return id;}
export type EmployeeStatus="ACTIVE"|"INACTIVE";
export type EmployeeRecord={id:string;employeeNumber?:string;firstName:string;lastName:string;displayName:string;position?:string;department?:string;status:EmployeeStatus;linkedUserId?:string};

const map=(x:any):EmployeeRecord=>({id:x.id,employeeNumber:x.employee_number??undefined,firstName:x.first_name,lastName:x.last_name??"",displayName:[x.first_name,x.last_name].filter(Boolean).join(" "),position:x.position??undefined,department:x.department??undefined,status:x.status,linkedUserId:x.linked_user_id??undefined});

export async function listEmployees(organizationId?:string,includeInactive=false){
 requireDb();const sql=db();const org=tenantId(organizationId);
 const rows=includeInactive
  ? await sql`SELECT * FROM employees WHERE organization_id=${org} ORDER BY last_name,first_name,created_at`
  : await sql`SELECT * FROM employees WHERE organization_id=${org} AND status='ACTIVE' ORDER BY last_name,first_name,created_at`;
 return rows.map(map);
}

export async function getEmployee(employeeId:string,organizationId?:string){
 requireDb();const sql=db();const org=tenantId(organizationId);
 const [row]=await sql`SELECT * FROM employees WHERE id=${employeeId} AND organization_id=${org} LIMIT 1`;
 return row?map(row):null;
}

export async function createEmployee(input:{organizationId:string;firstName:string;lastName?:string;employeeNumber?:string;position?:string;department?:string;linkedUserId?:string}){
 requireDb();const sql=db();const org=tenantId(input.organizationId);const first=input.firstName.trim();const last=input.lastName?.trim()??"";
 if(!first) throw new Error("Imię pracownika jest wymagane.");
 const [row]=await sql`INSERT INTO employees(organization_id,employee_number,first_name,last_name,position,department,linked_user_id)
 VALUES(${org},${input.employeeNumber?.trim()||null},${first},${last},${input.position?.trim()||null},${input.department?.trim()||null},${input.linkedUserId??null})
 RETURNING *`;
 return map(row);
}

export async function setEmployeeStatus(input:{organizationId:string;employeeId:string;status:EmployeeStatus}){
 requireDb();const sql=db();const org=tenantId(input.organizationId);
 const [row]=await sql`UPDATE employees SET status=${input.status},updated_at=now() WHERE id=${input.employeeId} AND organization_id=${org} RETURNING *`;
 if(!row) throw new Error("Nie znaleziono pracownika.");
 return map(row);
}


export type EmployeeOnboardingHistoryItem={
 processId:string; standardId:string; standardName:string; standardVersionId:string; standardVersion:string;
 startedOn:string; targetOn?:string; processStatus:string; owner:string;
 latestDecision?:"READY"|"NOT_YET"|"STOP"; latestDecisionAt?:string; latestDecisionBy?:string; decisionCount:number;
};
export type EmployeeOperationalHistory={employee:EmployeeRecord;onboarding:EmployeeOnboardingHistoryItem[]};

export async function getEmployeeOperationalHistory(input:{organizationId:string;employeeId:string}):Promise<EmployeeOperationalHistory|null>{
 requireDb();const sql=db();const org=tenantId(input.organizationId);
 const employee=await getEmployee(input.employeeId,org);
 if(!employee) return null;
 const rows=await sql`
  SELECT p.id process_id,p.standard_id,s.name standard_name,p.standard_version_id,sv.version_label,
    p.started_on,p.target_on,p.status process_status,owner.display_name owner,
    lc.decision latest_decision,lc.verified_at latest_decision_at,verifier.display_name latest_decision_by,
    (SELECT count(*)::int FROM onboarding_closures c2 WHERE c2.organization_id=p.organization_id AND c2.onboarding_process_id=p.id) decision_count
  FROM onboarding_processes p
  JOIN standards s ON s.id=p.standard_id AND s.organization_id=p.organization_id
  JOIN standard_versions sv ON sv.id=p.standard_version_id AND sv.organization_id=p.organization_id
  JOIN users owner ON owner.id=p.owner_user_id
  LEFT JOIN LATERAL (
    SELECT c.decision,c.verified_at,c.verified_by_user_id
    FROM onboarding_closures c
    WHERE c.organization_id=p.organization_id AND c.onboarding_process_id=p.id
    ORDER BY c.decision_sequence DESC,c.verified_at DESC LIMIT 1
  ) lc ON true
  LEFT JOIN users verifier ON verifier.id=lc.verified_by_user_id
  WHERE p.organization_id=${org} AND p.employee_id=${input.employeeId}
  ORDER BY p.started_on DESC,p.created_at DESC`;
 return {employee,onboarding:rows.map(r=>({
  processId:r.process_id,standardId:r.standard_id,standardName:r.standard_name,standardVersionId:r.standard_version_id,
  standardVersion:r.version_label,startedOn:String(r.started_on),targetOn:r.target_on?String(r.target_on):undefined,
  processStatus:r.process_status,owner:r.owner,latestDecision:r.latest_decision??undefined,
  latestDecisionAt:r.latest_decision_at?String(r.latest_decision_at):undefined,latestDecisionBy:r.latest_decision_by??undefined,
  decisionCount:r.decision_count??0
 }))};
}
