import "server-only";
import { db, hasDatabase } from "@/lib/db";

function org(id?:string){if(!id) throw new Error("organizationId is required for data portability.");return id;}
function required(){if(!hasDatabase()) throw new Error("Database is required for data portability.");}
const iso=(v:unknown)=>v?new Date(v as string|Date).toISOString():"";

export type BosPortableDataset={
 schemaVersion:"1.0";
 exportedAt:string;
 employees:Array<Record<string,unknown>>;
 standards:Array<Record<string,unknown>>;
 standardVersions:Array<Record<string,unknown>>;
 standardTasks:Array<Record<string,unknown>>;
 startRequirements:Array<Record<string,unknown>>;
 readinessCriteria:Array<Record<string,unknown>>;
 onboardingProcesses:Array<Record<string,unknown>>;
 onboardingClosures:Array<Record<string,unknown>>;
};

export async function buildPortableDataset(organizationId?:string):Promise<BosPortableDataset>{
 required();const sql=db();const organization=org(organizationId);
 const [employees,standards,versions,tasks,startRequirements,readinessCriteria,processes,closures]=await Promise.all([
  sql`SELECT id,employee_number,first_name,last_name,position,department,status,linked_user_id,created_at,updated_at FROM employees WHERE organization_id=${organization} ORDER BY last_name,first_name,id`,
  sql`SELECT id,product_id,name,area,status,current_version_id,created_at,updated_at FROM standards WHERE organization_id=${organization} ORDER BY name,id`,
  sql`SELECT id,standard_id,version_number,version_label,status,change_note,created_by_user_id,published_by_user_id,published_at,created_at FROM standard_versions WHERE organization_id=${organization} ORDER BY standard_id,version_number`,
  sql`SELECT id,standard_version_id,position,name,execution,ready_when,hint,is_critical FROM standard_tasks WHERE organization_id=${organization} ORDER BY standard_version_id,position`,
  sql`SELECT id,standard_version_id,position,category,requirement FROM standard_start_requirements WHERE organization_id=${organization} ORDER BY standard_version_id,position`,
  sql`SELECT id,standard_version_id,position,criterion,verification_method,verification_method_other FROM standard_readiness_criteria WHERE organization_id=${organization} ORDER BY standard_version_id,position`,
  sql`SELECT id,product_id,employee_id,employee_name_snapshot,standard_id,standard_version_id,owner_user_id,trainer_user_id,evaluator_user_id,buddy_user_id,status,started_on,target_on,closed_at,created_at,updated_at FROM onboarding_processes WHERE organization_id=${organization} ORDER BY created_at,id`,
  sql`SELECT id,onboarding_process_id,standard_id,standard_version_id,employee_name_snapshot,decision,verified_by_user_id,summary,recommendations,decision_sequence,verified_at FROM onboarding_closures WHERE organization_id=${organization} ORDER BY onboarding_process_id,decision_sequence`
 ]);
 const clean=(rows:any[])=>rows.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,v instanceof Date?iso(v):v])));
 return {schemaVersion:"1.0",exportedAt:new Date().toISOString(),employees:clean(employees),standards:clean(standards),standardVersions:clean(versions),standardTasks:clean(tasks),startRequirements:clean(startRequirements),readinessCriteria:clean(readinessCriteria),onboardingProcesses:clean(processes),onboardingClosures:clean(closures)};
}

const csvCell=(value:unknown)=>{
 const raw=value==null?"":typeof value==="object"?JSON.stringify(value):String(value);
 return /[",\n\r;]/.test(raw)?`"${raw.replace(/"/g,'""')}"`:raw;
};
export function recordsToCsv(records:Array<Record<string,unknown>>){
 if(!records.length)return "";
 const headers=Object.keys(records[0]);
 return [headers.join(","),...records.map(row=>headers.map(h=>csvCell(row[h])).join(","))].join("\r\n");
}
export function portableDatasetToCsvFiles(data:BosPortableDataset){
 return {
  "employees.csv":recordsToCsv(data.employees),
  "standards.csv":recordsToCsv(data.standards),
  "standard_versions.csv":recordsToCsv(data.standardVersions),
  "standard_tasks.csv":recordsToCsv(data.standardTasks),
  "start_requirements.csv":recordsToCsv(data.startRequirements),
  "readiness_criteria.csv":recordsToCsv(data.readinessCriteria),
  "onboarding_processes.csv":recordsToCsv(data.onboardingProcesses),
  "onboarding_closures.csv":recordsToCsv(data.onboardingClosures)
 };
}
