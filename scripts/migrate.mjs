import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false});

const MIGRATION_ORDER=[
  "001_bos_core.sql",
  "002_auth_identity_and_tenant_constraints.sql",
  "003_product_licenses.sql",
  "004_stripe_purchases.sql",
  "005_promotions.sql",
  "007_onboarding_web_v1.sql",
  "009_onboarding_standard_publisher.sql",
  "010_onboarding_failsafe.sql",
  "011_onboarding_task_stage_order_guard.sql",
  "012_employee_core.sql",
  "013_onboarding_decision_history_snapshot.sql",
  "013_promotions_employee_core.sql",
  "014_standard_role_description.sql",
  "014_promotions_standard_binding.sql",
  "015_promotions_entry_assessment.sql",
  "016_promotions_verification_branch.sql",
  "017_promotions_five_stage_engine.sql",
  "018_promotions_k_gate.sql",
  "019_promotions_evidence_layer.sql",
  "020_promotions_transition_handover.sql",
  "021_promotions_readiness.sql",
  "022_promotions_final_integrity_gate.sql",
  "023_promotions_decision_model.sql",
  "024_promotions_append_only_closure.sql",
  "025_promotions_security_integrity.sql",
  "026_shared_organization_standards.sql",
];

try{
 const dir=path.join(process.cwd(),"db","migrations");
 const files=(await fs.readdir(dir)).filter(f=>f.endsWith(".sql"));
 const unknown=files.filter(file=>!MIGRATION_ORDER.includes(file));
 const missing=MIGRATION_ORDER.filter(file=>!files.includes(file));
 if(missing.length)throw new Error("Missing migrations: "+missing.join(", "));
 if(unknown.length)throw new Error("Unordered migrations: "+unknown.join(", "));
 await sql`CREATE TABLE IF NOT EXISTS bos_schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
 for(const file of MIGRATION_ORDER){
   const [done]=await sql`SELECT name FROM bos_schema_migrations WHERE name=${file}`;
   if(done) continue;
   const source=await fs.readFile(path.join(dir,file),"utf8");
   await sql.unsafe(source);
   await sql`INSERT INTO bos_schema_migrations(name) VALUES(${file}) ON CONFLICT(name) DO NOTHING`;
   console.log("applied",file);
 }
} finally { await sql.end(); }
