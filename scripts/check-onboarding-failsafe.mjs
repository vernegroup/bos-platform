import postgres from "postgres";

const url=process.env.DATABASE_URL;
if(!url){console.error("DATABASE_URL is required.");process.exit(2);}
const sql=postgres(url,{max:1});

const requiredConstraints=[
  ["onboarding_processes","onboarding_processes_standard_org_fk"],
  ["onboarding_processes","onboarding_processes_version_standard_org_fk"],
  ["onboarding_processes","onboarding_processes_owner_membership_fk"],
  ["onboarding_processes","onboarding_processes_trainer_membership_fk"],
  ["onboarding_processes","onboarding_processes_evaluator_membership_fk"],
  ["onboarding_processes","onboarding_processes_buddy_membership_fk"],
  ["onboarding_processes","onboarding_processes_employee_membership_fk"],
  ["onboarding_processes","onboarding_processes_product_license_fk"],
  ["onboarding_task_progress","onboarding_task_progress_process_org_fk"],
  ["onboarding_task_progress","onboarding_task_progress_task_org_fk"]
];
const requiredTriggers=[
  ["standard_versions","standard_versions_published_guard"],
  ["standard_tasks","standard_tasks_published_guard"],
  ["standard_start_requirements","standard_start_requirements_published_guard"],
  ["standard_readiness_criteria","standard_readiness_criteria_published_guard"],
  ["onboarding_processes","onboarding_process_standard_binding_guard"],
  ["onboarding_processes","onboarding_process_published_version_guard"],
  ["onboarding_task_progress","onboarding_task_progress_version_guard"],
  ["onboarding_start_checks","onboarding_start_checks_version_guard"],
  ["onboarding_readiness_checks","onboarding_readiness_checks_version_guard"],
  ["onboarding_closures","onboarding_closures_append_only_guard"]
];

let failed=0;
for(const [table,name] of requiredConstraints){
 const rows=await sql`SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid WHERE t.relname=${table} AND c.conname=${name}`;
 if(!rows.length){failed++;console.error("FAIL constraint",table,name);} else console.log("PASS constraint",table,name);
}
for(const [table,name] of requiredTriggers){
 const rows=await sql`SELECT 1 FROM pg_trigger g JOIN pg_class t ON t.oid=g.tgrelid WHERE t.relname=${table} AND g.tgname=${name} AND NOT g.tgisinternal`;
 if(!rows.length){failed++;console.error("FAIL trigger",table,name);} else console.log("PASS trigger",table,name);
}
const migrations=await sql`SELECT name FROM bos_schema_migrations WHERE name IN ('007_onboarding_web_v1.sql','009_onboarding_standard_publisher.sql','010_onboarding_failsafe.sql') ORDER BY name`;
if(migrations.length!==3){failed++;console.error("FAIL migrations: expected 007, 009 and 010.");}
else console.log("PASS migrations 007/009/010");
await sql.end();
if(failed){console.error(`Onboarding fail-safe: ${failed} check(s) failed.`);process.exit(1);}
console.log("Onboarding fail-safe: PASS.");
