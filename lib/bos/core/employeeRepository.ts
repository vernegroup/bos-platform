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
