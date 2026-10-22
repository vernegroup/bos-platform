/**
 * BOS-SAM 1.0 — versioned architecture/security registry (SAM-01).
 * Inventory/activation metadata only. NOT an authorization service.
 * CORE remains authoritative; legacy integrations are observed, never overridden.
 */
export const SAM_SCHEMA_VERSION = "1.0.0" as const;
export type SamLifecycle = "planned" | "implemented" | "verified" | "active" | "retired";
export type SamMode = "observe" | "enforce";
export type SamBoundary = "server" | "client" | "external";
export type SamModule = Readonly<{
  id: string;
  owner: string;
  lifecycle: SamLifecycle;
  mode: SamMode;
  boundary: SamBoundary;
  dependencies: readonly string[];
  existingGuards: readonly string[];
  requiredControls: readonly string[];
  dataClasses: readonly ("public" | "organization" | "employee" | "billing")[];
  operations: readonly string[];
  sourcePaths: readonly string[];
  note?: string;
}>;
const controls = {
  session: "session-verified",
  tenant: "tenant-scoped-server-read",
  core: "core-authorization-preserved",
  license: "product-entitlement-checked",
  noPii: "client-context-minimized",
  actions: "explicit-server-action-allowlist",
  state: "server-state-revalidated",
  audit: "security-events-audited",
  stripe: "stripe-signature-verified",
} as const;
export const SAM_MODULES = [
  {
    id:"legacy.identity",owner:"BOS CORE",lifecycle:"active",mode:"observe",boundary:"server",
    dependencies:[],existingGuards:["resolveBOSAccess","requireBOSAccess","canManageMembers"],
    requiredControls:[controls.session,controls.tenant,controls.core],dataClasses:["organization"],
    operations:["resolve-access"],sourcePaths:["lib/bos/access.ts"],
    note:"Existing organization selection is authoritative; SAM cannot select a tenant."
  },
  {
    id:"legacy.entitlements",owner:"BOS Commerce",lifecycle:"active",mode:"observe",boundary:"server",
    dependencies:["legacy.identity"],existingGuards:["requireProductLicense","hasProductLicense"],
    requiredControls:[controls.license,controls.core],dataClasses:["organization","billing"],
    operations:["check-product-license"],sourcePaths:["lib/bos/licenseRepository.ts"],
    note:"Expired-license read/export semantics require policy reconciliation; do not auto-enforce."
  },
  {
    id:"legacy.onboarding",owner:"BOS Wdrożenia",lifecycle:"active",mode:"observe",boundary:"server",
    dependencies:["legacy.identity","legacy.entitlements"],
    existingGuards:["requireBOSAccess","requireProductLicense","organization_id filters"],
    requiredControls:[controls.session,controls.tenant,controls.core,controls.state],
    dataClasses:["organization","employee"],operations:["read-process","confirm-stage","close-process"],
    sourcePaths:["lib/bos/onboardingRepository.ts","app/app/onboarding/processes/[processId]/page.tsx"],
    note:"SAM-00 R1/R3 require separate verification before claiming idempotence."
  },
  {
    id:"legacy.promotions",owner:"BOS Awanse",lifecycle:"active",mode:"observe",boundary:"server",
    dependencies:["legacy.identity","legacy.entitlements"],
    existingGuards:["requireBOSAccess","requireProductLicense","organization_id filters","promotion gates"],
    requiredControls:[controls.session,controls.tenant,controls.core,controls.state],
    dataClasses:["organization","employee"],operations:["read-process","assess","verify","decide"],
    sourcePaths:["lib/bos/promotionsRepository.ts","app/app/promotions/processes/[id]/page.tsx"]
  },
  {
    id:"legacy.stripe-webhook",owner:"BOS Commerce",lifecycle:"active",mode:"observe",boundary:"external",
    dependencies:[],existingGuards:["stripe.webhooks.constructEvent"],
    requiredControls:[controls.stripe,controls.audit],dataClasses:["billing"],
    operations:["receive-stripe-event"],sourcePaths:["app/api/stripe/webhook/route.ts"]
  },
  {
    id:"ui.product-adapters",owner:"BOS UI Engine",lifecycle:"planned",mode:"enforce",boundary:"server",
    dependencies:["legacy.identity","legacy.onboarding","legacy.promotions"],
    existingGuards:[],requiredControls:[controls.session,controls.tenant,controls.core,controls.license],
    dataClasses:["organization","employee"],operations:["read-snapshot"],
    sourcePaths:["lib/bos/ui-engine/adapters/"],
    note:"Read-only adapters; must project minimal authorized data."
  },
  {
    id:"ui.process-interpreter",owner:"BOS UI Engine",lifecycle:"planned",mode:"enforce",boundary:"server",
    dependencies:["ui.product-adapters"],existingGuards:[],
    requiredControls:[controls.noPii,controls.core],dataClasses:["organization"],
    operations:["derive-presentation"],sourcePaths:["lib/bos/ui-engine/interpreter/"]
  },
  {
    id:"ui.action-dispatcher",owner:"BOS UI Engine",lifecycle:"planned",mode:"enforce",boundary:"server",
    dependencies:["ui.product-adapters","legacy.identity"],existingGuards:[],
    requiredControls:[controls.actions,controls.session,controls.tenant,controls.core,controls.state,controls.audit],
    dataClasses:["organization","employee"],operations:["dispatch-allowlisted-action"],
    sourcePaths:["lib/bos/ui-engine/actions/"],
    note:"Must delegate to existing CORE actions; no generic function invocation."
  },
  {
    id:"ui.help-context",owner:"BOS UI Engine",lifecycle:"planned",mode:"enforce",boundary:"client",
    dependencies:["ui.process-interpreter"],existingGuards:["bos:help-context"],
    requiredControls:[controls.noPii],dataClasses:["public"],
    operations:["display-help"],sourcePaths:["components/app-shell/HelpProcessContext.tsx"]
  },
  {
    id:"future.ai-assistant",owner:"BOS AI",lifecycle:"planned",mode:"enforce",boundary:"server",
    dependencies:["ui.process-interpreter"],existingGuards:[],
    requiredControls:[controls.session,controls.tenant,controls.core,controls.noPii,controls.audit],
    dataClasses:["organization"],operations:[],sourcePaths:[],
    note:"Reserved contract only; no permissions or runtime activation."
  }
] as const satisfies readonly SamModule[];
export type SamModuleId = (typeof SAM_MODULES)[number]["id"];
export function validateSamRegistry(modules: readonly SamModule[] = SAM_MODULES): string[] {
  const errors:string[]=[];
  const ids=new Set<string>();
  for (const m of modules) {
    if(ids.has(m.id))errors.push(`duplicate module: ${m.id}`);
    ids.add(m.id);
    if(m.mode==="enforce" && m.lifecycle==="active" && m.requiredControls.length===0)
      errors.push(`active enforce module without controls: ${m.id}`);
    if(m.lifecycle==="planned" && m.operations.length>0 && m.mode!=="enforce")
      errors.push(`planned module not fail-closed: ${m.id}`);
    if(m.boundary==="client" && m.dataClasses.some(x=>x==="employee"||x==="billing"))
      errors.push(`sensitive client boundary: ${m.id}`);
  }
  for(const m of modules)for(const dep of m.dependencies)
    if(!ids.has(dep))errors.push(`unknown dependency: ${m.id} -> ${dep}`);
  return errors;
}
/** A registry entry never grants access. Missing or inactive entries are denied by new integrations. */
export function canActivateSamModule(
  moduleId:string,
  verifiedControls:readonly string[],
  modules:readonly SamModule[]=SAM_MODULES
):boolean {
  const m=modules.find(x=>x.id===moduleId);
  if(!m || m.mode!=="enforce" || m.lifecycle!=="active")return false;
  if(validateSamRegistry(modules).length)return false;
  return m.requiredControls.every(x=>verifiedControls.includes(x));
}
