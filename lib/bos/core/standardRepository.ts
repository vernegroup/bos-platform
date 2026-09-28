import "server-only";

/**
 * Shared Core Standard seam.
 *
 * Standard is organization-owned. The implementation is still delegated to
 * onboardingRepository during the incremental extraction so the frozen
 * Onboarding behavior is not rewritten in one step.
 */
export {
  archiveStandard,
  createDraftReadinessCriterion,
  createDraftStartRequirement,
  createDraftTask,
  deleteDraftReadinessCriterion,
  deleteDraftStartRequirement,
  deleteDraftTask,
  getStandard,
  listStandards,
  moveDraftReadinessCriterion,
  moveDraftStartRequirement,
  moveDraftTask,
  publishDraftStandard,
  updateDraftReadinessCriterion,
  updateDraftStandard,
  updateDraftStartRequirement,
  updateDraftTask,
  validateStandardCompleteness,
} from "@/lib/bos/onboardingRepository";

export type {
  ReadinessCriterionRecord,
  StandardDetailRecord,
  StandardTaskRecord,
  StandardVersionRecord,
  StandardVersionStatus,
  StartRequirementRecord,
} from "@/lib/bos/onboardingRepository";

import { db, hasDatabase } from "@/lib/db";

export async function createOrganizationDraftStandard(input:{
  organizationId:string;
  name:string;
  area?:string;
  createdByUserId:string;
}) {
  if (!hasDatabase()) throw new Error("Database is required for persisted Standard operations.");
  const organizationId=input.organizationId;
  if (!organizationId) throw new Error("organizationId is required for Standard data.");
  const name=input.name.trim();
  if (!name) throw new Error("Nazwa Standardu jest wymagana.");
  const sql=db();
  return sql.begin(async tx=>{
    const [member]=await tx`SELECT 1 ok FROM memberships
      WHERE organization_id=${organizationId} AND user_id=${input.createdByUserId} AND status='ACTIVE' LIMIT 1`;
    if(!member) throw new Error("Osoba tworząca Standard nie należy aktywnie do organizacji.");
    const [standard]=await tx`INSERT INTO standards(organization_id,product_id,name,area,status,created_by_user_id)
      VALUES(${organizationId},NULL,${name},${input.area?.trim()||null},'DRAFT',${input.createdByUserId})
      RETURNING id`;
    const [version]=await tx`INSERT INTO standard_versions(organization_id,standard_id,version_number,version_label,status,change_note,created_by_user_id)
      VALUES(${organizationId},${standard.id},1,'v1','DRAFT','Wersja robocza',${input.createdByUserId})
      RETURNING id`;
    await tx`UPDATE standards SET current_version_id=${version.id},updated_at=now()
      WHERE id=${standard.id} AND organization_id=${organizationId}`;
    return standard.id as string;
  });
}
