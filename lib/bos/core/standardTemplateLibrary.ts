import "server-only";
import { db } from "@/lib/db";

type TemplateTask={name:string;execution:string;readyWhen:string;hint?:string;isCritical?:boolean};
type TemplateRequirement={category:string;requirement:string};
type TemplateCriterion={criterion:string;verificationMethod:string;verificationMethodOther?:string};

/** Central templates are not tenant Standards and never consume publication capacity. */
export async function listActiveStandardTemplates(){
  return db().unsafe("SELECT id,key,name,area,description,version FROM standard_templates WHERE status='ACTIVE' ORDER BY area,name");
}

/**
 * Copy a BOS template snapshot into a tenant's DRAFT Standard.
 * Product is explicitly selected; quota is consumed only by the publish path.
 * All operations are atomic and scoped to the authenticated organization's active membership/license.
 */
export async function instantiateStandardTemplate(input:{
  organizationId:string;productId:string;templateId:string;createdByUserId:string;
}){
  const sql=db();
  return sql.begin(async tx=>{
    const membership=await tx.unsafe(
      "SELECT 1 FROM memberships m JOIN organizations o ON o.id=m.organization_id WHERE m.organization_id=$1 AND m.user_id=$2 AND m.status='ACTIVE' AND o.status='ACTIVE' LIMIT 1",
      [input.organizationId,input.createdByUserId]
    );
    if(!membership.length) throw new Error("Brak aktywnego członkostwa w organizacji.");
    const product=await tx.unsafe(
      "SELECT id FROM products WHERE id=$1 AND key IN ('onboarding','promotions') AND status='ACTIVE' LIMIT 1",
      [input.productId]
    );
    if(!product.length) throw new Error("Nieprawidłowy produkt BOS.");
    const license=await tx.unsafe(
      "SELECT 1 FROM licenses WHERE organization_id=$1 AND product_id=$2 AND status='ACTIVE' AND (license_type='PERPETUAL' OR (license_type='ANNUAL' AND valid_until>now())) LIMIT 1",
      [input.organizationId,input.productId]
    );
    if(!license.length) throw new Error("Brak aktywnej licencji produktu.");
    const templates=await tx.unsafe(
      "SELECT id,name,area,role_description,version,tasks_json,start_requirements_json,readiness_criteria_json FROM standard_templates WHERE id=$1 AND status='ACTIVE' LIMIT 1",
      [input.templateId]
    );
    if(!templates.length) throw new Error("Wzór nie jest dostępny.");
    const t=templates[0];
    const standards=await tx.unsafe(
      "INSERT INTO standards(organization_id,product_id,name,area,status,created_by_user_id,source_template_id,source_template_version) VALUES($1,$2,$3,$4,'DRAFT',$5,$6,$7) RETURNING id",
      [input.organizationId,input.productId,t.name,t.area,input.createdByUserId,t.id,t.version]
    );
    const standardId=standards[0].id as string;
    const versions=await tx.unsafe(
      "INSERT INTO standard_versions(organization_id,standard_id,version_number,version_label,status,change_note,role_description,created_by_user_id) VALUES($1,$2,1,'v1','DRAFT','Kopia wzoru BOS',$3,$4) RETURNING id",
      [input.organizationId,standardId,t.role_description,input.createdByUserId]
    );
    const versionId=versions[0].id as string;
    const tasks=t.tasks_json as TemplateTask[];
    const requirements=t.start_requirements_json as TemplateRequirement[];
    const criteria=t.readiness_criteria_json as TemplateCriterion[];
    for(let i=0;i<tasks.length;i++){
      const task=tasks[i];
      await tx.unsafe("INSERT INTO standard_tasks(organization_id,standard_version_id,position,name,execution,ready_when,hint,is_critical) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [input.organizationId,versionId,i+1,task.name,task.execution,task.readyWhen,task.hint??"",task.isCritical??false]);
    }
    for(let i=0;i<requirements.length;i++){
      const requirement=requirements[i];
      await tx.unsafe("INSERT INTO standard_start_requirements(organization_id,standard_version_id,position,category,requirement) VALUES($1,$2,$3,$4,$5)",
        [input.organizationId,versionId,i+1,requirement.category,requirement.requirement]);
    }
    for(let i=0;i<criteria.length;i++){
      const criterion=criteria[i];
      await tx.unsafe("INSERT INTO standard_readiness_criteria(organization_id,standard_version_id,position,criterion,verification_method,verification_method_other) VALUES($1,$2,$3,$4,$5,$6)",
        [input.organizationId,versionId,i+1,criterion.criterion,criterion.verificationMethod,criterion.verificationMethodOther??null]);
    }
    await tx.unsafe("UPDATE standards SET current_version_id=$1,updated_at=now() WHERE id=$2 AND organization_id=$3",
      [versionId,standardId,input.organizationId]);
    return {standardId,versionId,sourceTemplateId:t.id as string,sourceTemplateVersion:t.version as number,status:"DRAFT" as const};
  });
}
