# BOS Core — data model 1.0

Status: **DESIGNED / pre-persistence**  
Date: 2026-09-18  
Purpose: database contract for point 11. No database, ORM or authentication is installed by this document.

## 1. Design rules

1. BOS is multi-tenant. Every organization-owned business record carries `organization_id`.
2. A User is a platform identity. Access to an Organization exists only through Membership.
3. Product access exists only through License. Membership and License answer different questions.
4. Published operational definitions are versioned. Historical processes point to exact versions.
5. Closed operational outcomes are historical records and are not rewritten by later product/template changes.
6. Cross-module platform concerns live in BOS Core; product-specific process data remains in its product module.
7. IDs are opaque application/database IDs. Human-readable names and version labels are not primary keys.
8. Timestamps are stored as timezone-aware instants. Business dates may additionally use date-only fields.

## 2. BOS Core entities

### Organization

Tenant boundary and owner of company data.

Fields:
- id
- name
- slug
- legal_name nullable
- tax_id nullable
- status: ACTIVE | SUSPENDED
- created_at
- updated_at

Rule: no organization-owned record may be fetched or mutated without matching the active organization context.

### User

Platform identity independent of a company and independent of purchased products.

Fields:
- id
- display_name
- email
- status: ACTIVE | INVITED | DISABLED
- created_at
- updated_at

Authentication identities/providers are intentionally deferred to point 12. User is the BOS-side identity to which future auth identities will map.

### Membership

Many-to-many relationship User ↔ Organization.

Fields:
- id
- organization_id
- user_id
- role: OWNER | ADMIN | MANAGER | USER
- status: ACTIVE | INVITED | SUSPENDED
- invited_at nullable
- joined_at nullable
- created_at
- updated_at

Constraints:
- unique (organization_id, user_id)
- organization_id required
- user_id required

### Product

BOS product catalogue entry.

Fields:
- id
- key unique, e.g. onboarding, promotions
- name
- status: ACTIVE | HIDDEN | RETIRED
- current_version nullable
- created_at
- updated_at

Product is global BOS catalogue data, not tenant-owned.

### License

Organization entitlement to a Product.

Fields:
- id
- organization_id
- product_id
- status: ACTIVE | REVOKED
- license_type: PERPETUAL
- granted_at
- revoked_at nullable
- source_purchase_id nullable
- created_at
- updated_at

Constraints:
- unique active entitlement for (organization_id, product_id)
- license checks happen server-side

Purchase/Stripe-specific persistence is deferred to point 15, but `source_purchase_id` reserves the relationship.

## 3. Onboarding entities

These preserve the frozen Standard → Realization → Verification invariant.

### Standard

Tenant-owned reusable role/work definition.

Fields:
- id
- organization_id
- product_id
- name
- area nullable
- status: DRAFT | ACTIVE | ARCHIVED
- current_version_id nullable
- created_by_user_id
- created_at
- updated_at

Constraints:
- organization_id required
- product_id must identify BOS Onboarding
- current_version_id must belong to this Standard

### StandardVersion

Immutable published snapshot.

Fields:
- id
- organization_id
- standard_id
- version_number integer
- version_label, e.g. v1.2
- status: DRAFT | PUBLISHED | ARCHIVED
- change_note nullable
- published_at nullable
- created_by_user_id
- created_at
- updated_at

Constraints:
- unique (standard_id, version_number)
- published version content is immutable; edits create another version
- organization_id must equal parent Standard organization_id

### StandardTask

Ordered task belonging to one StandardVersion.

Fields:
- id
- organization_id
- standard_version_id
- position integer
- name
- execution
- ready_when
- created_at
- updated_at

Constraints:
- unique (standard_version_id, position)
- organization_id must equal parent version organization_id

### OnboardingProcess

Concrete employee realization.

Fields:
- id
- organization_id
- product_id
- employee_id nullable
- employee_name_snapshot
- standard_id
- standard_version_id
- owner_user_id
- buddy_user_id nullable
- status: PLANNED | IN_PROGRESS | READY_TO_CLOSE | CLOSED | CANCELLED
- started_on
- target_on nullable
- closed_at nullable
- created_by_user_id
- created_at
- updated_at

Rules:
- standard_version_id is fixed after process start
- standard_id is retained for direct navigation/reporting but must match the version parent
- employee_name_snapshot preserves historical display even if employee data later changes
- process cannot become CLOSED without a closure record

### OnboardingTaskProgress

Execution state for each task copied/referenced from the selected StandardVersion.

Fields:
- id
- organization_id
- onboarding_process_id
- standard_task_id
- status: TODO | IN_PROGRESS | DONE
- note nullable
- completed_at nullable
- completed_by_user_id nullable
- created_at
- updated_at

Constraints:
- unique (onboarding_process_id, standard_task_id)
- referenced StandardTask must belong to process.standard_version_id

### OnboardingClosure

One verified historical outcome per process.

Fields:
- id
- organization_id
- onboarding_process_id
- standard_id
- standard_version_id
- employee_name_snapshot
- verified_by_user_id
- result: COMPLETED | COMPLETED_WITH_RECOMMENDATIONS
- summary
- recommendations nullable
- verified_at
- created_at

Constraints:
- unique onboarding_process_id
- standard/version must equal the process bindings
- after creation this record is immutable except narrowly defined administrative correction with audit history

## 4. Supporting BOS Core entities

### FileResource

Metadata for files/resources. Binary storage provider is intentionally not selected yet.

Fields:
- id
- organization_id
- product_id nullable
- storage_key
- original_name
- mime_type
- size_bytes
- uploaded_by_user_id
- created_at

Relations to Standards, tasks or processes should use explicit resource links rather than copying the file record.

### ResourceLink

Fields:
- id
- organization_id
- file_resource_id
- entity_type
- entity_id
- purpose nullable
- created_at

Initial allowed entity types: ORGANIZATION, STANDARD, STANDARD_VERSION, STANDARD_TASK, ONBOARDING_PROCESS, ONBOARDING_CLOSURE.

### ActivityLog

Append-only operational/audit-friendly history.

Fields:
- id
- organization_id
- actor_user_id nullable
- product_id nullable
- entity_type
- entity_id
- action
- summary
- metadata_json nullable
- created_at

ActivityLog supports dashboard/history. Security-sensitive audit requirements may later justify a stricter dedicated AuditLog.

### ProductUpdate

Global BOS release/update information.

Fields:
- id
- product_id
- version
- title
- description
- published_at
- created_at

Not tenant-owned. Visibility to a tenant is derived through its License.

## 5. Reserved extension entities

The database implementation should leave clean extension points for these, but point 11 does not need to implement their full product UI:

### ProcessMilestone
For Plan 30/60/90 and other checkpoints.

### ProcessAssignment
For manager, buddy and future process-specific responsibilities beyond the primary owner.

### ProcessEvidence
For tests, 1:1 reviews, confirmations and attached evidence.

### ProcessNote
For structured journal/operational notes if ActivityLog is insufficient.

### ProcessEvaluation
For post-closure evaluation/feedback.

### TaskTemplateGroup
For reusable preboarding, D1/T1, handover and similar checklist groups.

These extensions must reference organization_id and their parent process/version explicitly.

## 6. Relationship map

```text
User
  └──< Membership >── Organization
                         │
                         ├──< License >── Product
                         │
                         ├──< Standard
                         │      └──< StandardVersion
                         │             └──< StandardTask
                         │
                         ├──< OnboardingProcess
                         │      ├── Standard
                         │      ├── StandardVersion (fixed)
                         │      ├──< OnboardingTaskProgress >── StandardTask
                         │      └── 0..1 OnboardingClosure
                         │
                         ├──< FileResource
                         │      └──< ResourceLink
                         │
                         └──< ActivityLog

Product
  └──< ProductUpdate
```

## 7. Tenant isolation contract

The application layer must never trust an organization ID supplied only by a client request.

Future request flow:

```text
authenticated session
→ BOS user
→ active Membership
→ organization_id from authorized membership
→ required Product License
→ query constrained by organization_id
→ record-level relationship checks
```

Every tenant-owned table listed above contains organization_id even when it could theoretically be derived through a parent. This deliberate duplication makes tenant filtering explicit and supports defensive constraints/indexing.

Minimum indexes for tenant-owned tables:
- index on organization_id
- compound indexes beginning with organization_id for frequent list/query paths
- unique constraints scoped by organization where names/keys become tenant-unique

## 8. Historical integrity contract

BOS must distinguish mutable current work from historical evidence.

Mutable:
- Organization profile
- Membership state
- draft StandardVersion
- active OnboardingTaskProgress
- active process dates/assignments where allowed

Immutable or versioned:
- published StandardVersion
- StandardTask content inside a published version
- selected standard_version_id of a started process
- OnboardingClosure
- ProductUpdate publication

Deleting referenced historical definitions should normally be prohibited. Use ARCHIVED/RETIRED states instead.

## 9. Mapping from current demo TypeScript

Current demo:
- OnboardingStandard → Standard
- OnboardingStandardVersion → StandardVersion
- OnboardingStandardTask → StandardTask
- OnboardingProcess → OnboardingProcess
- OnboardingProcessTask → OnboardingTaskProgress
- OnboardingClosure → OnboardingClosure

Important normalization changes for persistence:
- employee strings gain employee_id when available plus historical name snapshot
- owner/verifier strings become User foreign keys
- standardVersion string becomes StandardVersion foreign key
- task arrays become rows
- closure duplicates selected snapshots intentionally for historical readability
- calculated progress remains derived from task-progress rows, not stored as authoritative percentage

## 10. Point 11 implementation boundary

Point 11 may now choose and configure PostgreSQL persistence and an ORM/query layer, then translate this contract into schema/migrations.

Point 11 must not:
- redesign the frozen Onboarding process,
- add authentication,
- add Stripe webhook licensing,
- silently merge User, Membership and License,
- remove organization_id from tenant-owned records,
- make published StandardVersion mutable.

This document is the contract to review before any schema migration that changes those invariants.
