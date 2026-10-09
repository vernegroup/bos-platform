import "server-only";
import { db } from "@/lib/db";

export type StandardTemplateSummary={
  id:string; key:string; name:string; area:string; description:string; version:number;
  taskCount:number; requirementCount:number; criterionCount:number;
};

export async function listStandardTemplates():Promise<StandardTemplateSummary[]>{
  const sql=db();
  const rows=await sql`SELECT id,key,name,area,description,version,
    jsonb_array_length(tasks_json)::int task_count,
    jsonb_array_length(start_requirements_json)::int requirement_count,
    jsonb_array_length(readiness_criteria_json)::int criterion_count
    FROM standard_templates WHERE status='ACTIVE' ORDER BY area,name`;
  return rows.map(r=>({id:r.id,key:r.key,name:r.name,area:r.area,description:r.description,version:r.version,
    taskCount:r.task_count,requirementCount:r.requirement_count,criterionCount:r.criterion_count}));
}

export async function createStandardFromTemplate(input:{
  organizationId:string;productId:string;templateId:string;createdByUserId:string;
}){
  const sql=db();
  return sql.begin(async tx=>{
    const [member]=await tx`SELECT 1 ok FROM memberships WHERE organization_id=${input.organizationId}
      AND user_id=${input.createdByUserId} AND status='ACTIVE' LIMIT 1`;
    if(!member)throw new Error("Osoba tworząca Standard nie należy aktywnie do organizacji.");

    const [product]=await tx`SELECT p.id FROM products p JOIN licenses l ON l.product_id=p.id AND l.organization_id=${input.organizationId}
      WHERE p.id=${input.productId} AND p.key IN ('onboarding','promotions') AND p.status='ACTIVE'
      AND l.status='ACTIVE' AND (l.license_type='PERPETUAL' OR (l.license_type='ANNUAL' AND l.valid_until>now())) LIMIT 1`;
    if(!product) throw new Error("Wybierz produkt BOS z aktywną licencją.");
    const [template]=await tx`SELECT id,name,area,role_description,version,tasks_json,start_requirements_json,readiness_criteria_json
      FROM standard_templates WHERE id=${input.templateId} AND status='ACTIVE' FOR SHARE`;
    if(!template)throw new Error("Wybrany wzór BOS nie jest dostępny.");

    const [standard]=await tx`INSERT INTO standards(
      organization_id,product_id,name,area,status,created_by_user_id,source_template_id,source_template_version
    ) VALUES(
      ${input.organizationId},${input.productId},${template.name},${template.area},'DRAFT',${input.createdByUserId},${template.id},${template.version}
    ) RETURNING id`;
    const [version]=await tx`INSERT INTO standard_versions(
      organization_id,standard_id,version_number,version_label,status,change_note,created_by_user_id,role_description
    ) VALUES(
      ${input.organizationId},${standard.id},1,'v1','DRAFT','Utworzono z gotowego wzoru BOS',${input.createdByUserId},${template.role_description}
    ) RETURNING id`;

    await tx`INSERT INTO standard_tasks(organization_id,standard_version_id,position,name,execution,ready_when,hint,is_critical)
      SELECT ${input.organizationId},${version.id},ord::int,
        item->>'name',item->>'execution',COALESCE(item->>'readyWhen',''),NULLIF(item->>'hint',''),
        COALESCE((item->>'isCritical')::boolean,false)
      FROM jsonb_array_elements(${template.tasks_json}::jsonb) WITH ORDINALITY AS x(item,ord)`;

    await tx`INSERT INTO standard_start_requirements(organization_id,standard_version_id,position,category,requirement)
      SELECT ${input.organizationId},${version.id},ord::int,
        (item->>'category')::onboarding_start_requirement_category,item->>'requirement'
      FROM jsonb_array_elements(${template.start_requirements_json}::jsonb) WITH ORDINALITY AS x(item,ord)`;

    await tx`INSERT INTO standard_readiness_criteria(organization_id,standard_version_id,position,criterion,verification_method,verification_method_other)
      SELECT ${input.organizationId},${version.id},ord::int,item->>'criterion',
        (item->>'verificationMethod')::onboarding_readiness_verification_method,NULLIF(item->>'verificationMethodOther','')
      FROM jsonb_array_elements(${template.readiness_criteria_json}::jsonb) WITH ORDINALITY AS x(item,ord)`;

    await tx`UPDATE standards SET current_version_id=${version.id},updated_at=now()
      WHERE id=${standard.id} AND organization_id=${input.organizationId}`;
    return standard.id as string;
  });
}
