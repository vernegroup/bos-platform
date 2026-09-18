import "server-only";

import { db } from "@/lib/db";
import type { BOSAccess } from "@/lib/bos/access";

export type BOSSearchResult = {
  id: string;
  type: "STANDARD" | "TASK" | "ONBOARDING" | "CLOSURE" | "USER" | "FILE" | "ACTIVITY";
  title: string;
  context: string;
  href: string;
};

export async function searchOrganization(access: BOSAccess, rawQuery: string): Promise<BOSSearchResult[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];
  const sql = db();
  const pattern = `%${query}%`;
  const org = access.organization.id;

  const [standards,tasks,processes,closures,users,files,activity] = await Promise.all([
    sql`SELECT id,name,COALESCE(area,'') context FROM standards WHERE organization_id=${org} AND (name ILIKE ${pattern} OR COALESCE(area,'') ILIKE ${pattern}) ORDER BY updated_at DESC LIMIT 12`,
    sql`SELECT st.id,st.name,COALESCE(st.execution,'') context,s.id standard_id FROM standard_tasks st JOIN standard_versions sv ON sv.id=st.standard_version_id JOIN standards s ON s.id=sv.standard_id WHERE st.organization_id=${org} AND (st.name ILIKE ${pattern} OR st.execution ILIKE ${pattern} OR st.ready_when ILIKE ${pattern}) ORDER BY st.updated_at DESC LIMIT 12`,
    sql`SELECT id,employee_name_snapshot title,status::text context FROM onboarding_processes WHERE organization_id=${org} AND employee_name_snapshot ILIKE ${pattern} ORDER BY updated_at DESC LIMIT 12`,
    sql`SELECT id,employee_name_snapshot title,summary context FROM onboarding_closures WHERE organization_id=${org} AND (employee_name_snapshot ILIKE ${pattern} OR summary ILIKE ${pattern} OR COALESCE(recommendations,'') ILIKE ${pattern}) ORDER BY verified_at DESC LIMIT 12`,
    sql`SELECT u.id,u.display_name title,u.email context FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.organization_id=${org} AND (u.display_name ILIKE ${pattern} OR u.email ILIKE ${pattern}) ORDER BY u.display_name LIMIT 12`,
    sql`SELECT id,original_name title,mime_type context FROM file_resources WHERE organization_id=${org} AND original_name ILIKE ${pattern} ORDER BY created_at DESC LIMIT 12`,
    sql`SELECT id,summary title,action context FROM activity_logs WHERE organization_id=${org} AND (summary ILIKE ${pattern} OR action ILIKE ${pattern}) ORDER BY created_at DESC LIMIT 12`,
  ]);

  return [
    ...standards.map(r=>({id:r.id,type:"STANDARD" as const,title:r.name,context:r.context,href:`/app/onboarding/standards/${r.id}`})),
    ...tasks.map(r=>({id:r.id,type:"TASK" as const,title:r.name,context:r.context,href:`/app/onboarding/standards/${r.standard_id}`})),
    ...processes.map(r=>({id:r.id,type:"ONBOARDING" as const,title:r.title,context:r.context,href:`/app/onboarding/processes/${r.id}`})),
    ...closures.map(r=>({id:r.id,type:"CLOSURE" as const,title:r.title,context:r.context,href:`/app/onboarding/closed/${r.id}`})),
    ...users.map(r=>({id:r.id,type:"USER" as const,title:r.title,context:r.context,href:"/app/users"})),
    ...files.map(r=>({id:r.id,type:"FILE" as const,title:r.title,context:r.context,href:"/app/search"})),
    ...activity.map(r=>({id:r.id,type:"ACTIVITY" as const,title:r.title,context:r.context,href:"/app/search"})),
  ].slice(0,50);
}
