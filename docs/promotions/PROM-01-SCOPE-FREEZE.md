# BOS Promotions — Scope Freeze 1.0

**Task:** PROM-01  
**Status:** FROZEN  
**Module:** BOS Promotions  
**Branch:** `promotions-1-0`  
**Onboarding reference (read-only):** `66569efba58a8572bbe013d7f6f58a86238b8fa9`

## 1. Product event

BOS Promotions models an internal transition of an existing employee from **role A** to **role B** and supports a human decision about readiness for the target role.

Promotions is not shortened Onboarding. It may reuse shared BOS mechanisms, but it retains role-transition semantics.

## 2. Supported transition types

Exactly two transition types are in scope for Promotions 1.0:

- **AWANS** — internal move to a target role with a higher level of responsibility.
- **PRZESUNIĘCIE POZIOME** — internal move to another target role without defining the event as an awans.

Canonical code values for Web:
- `PROMOTION`
- `LATERAL_MOVE`

No third transition type is permitted in 1.0.

## 3. Explicitly out of scope

The following are NOT separate Promotions 1.0 transition types:

- rozszerzenie odpowiedzialności bez zmiany roli,
- zmiana specjalizacji as a separate type,
- external hiring / first entry into the organization,
- general employee assessment,
- talent management,
- performance appraisal,
- succession planning,
- arbitrary workflow management.

A future addition requires a separate product decision and must not be introduced silently through UI, Excel, PDF, database enum, API, or guidance.

## 4. Frozen terminology

Use consistently in Excel, PDF, Guide and Web:

### Process
- **Promotions**
- **zmiana roli / przejście do roli docelowej**
- **rola obecna**
- **rola docelowa**
- **Standard roli docelowej**
- **wersja Standardu / StandardVersion**
- **data rozpoczęcia procesu**
- **planowana / faktyczna data zmiany**
- **prowadzący / oceniający**

### Entry assessment
Exactly three states:
- **POTWIERDZONE**
- **DO SPRAWDZENIA**
- **DO WDROŻENIA**

Meaning:
- POTWIERDZONE — there is sufficient basis that the employee performs the requirement according to the target Standard.
- DO SPRAWDZENIA — capability is plausible, but sufficient evidence must still be obtained.
- DO WDROŻENIA — the requirement is new or is not performed according to the target Standard.

### BOS execution method
- **WYJAŚNIJ → POKAŻ → RAZEM → SAM → SPRAWDŹ**

### Decision
Exactly three decisions:
- **GOTOWY**
- **JESZCZE NIE**
- **STOP**

The system may calculate readiness and show `gotowy do decyzji`; the final decision belongs to a human.

## 5. Frozen process boundary

Canonical top-level flow:

**PRZYGOTUJ → PRZEPROWADŹ → ZAMKNIJ**

Within it:

`Employee + role A → target StandardVersion (role B) → entry assessment → verification/deployment of gaps → readiness → human decision → closure of transition → history`

The exact behavior of DO SPRAWDZENIA, K gate, readiness, STOP/JESZCZE NIE, old-role handover and historical snapshots is finalized in subsequent PROM tasks. PROM-01 freezes vocabulary and scope, not unresolved transition mechanics.

## 6. Shared Core boundary

Promotions should reuse shared BOS concepts where their meaning remains unchanged:

- Organization / tenant isolation,
- Employee identity and history,
- Standard / StandardVersion,
- version immutability,
- task/progress facts,
- K,
- BOS five-stage execution where applicable,
- readiness,
- factual notes / evidence,
- decisions and immutable history,
- audit trail,
- licensing/platform shell.

Do not create Promotions-specific duplicates of shared entities solely to make implementation easier.

## 7. Onboarding boundary

The frozen Onboarding implementation at commit
`66569efba58a8572bbe013d7f6f58a86238b8fa9`
is a **read-only functional and visual reference**.

Allowed:
- inspect,
- compare,
- reuse shared mechanisms/components through the existing architecture where appropriate.

Forbidden:
- modify that frozen commit or Onboarding behavior merely to accommodate Promotions,
- copy Onboarding-specific semantics such as "new employee", first-day/preboarding language or routing into Promotions.

## 8. Consistency rule

From PROM-01 onward, no active Promotions 1.0 artifact may present the old four-type scope.

The following legacy terms are historical only and must be removed or migrated when the relevant artifact is updated:
- `zmiana specjalizacji` as a separate transition type,
- `rozszerzenie odpowiedzialności` as a separate transition type.

If old source/audit material contains them, it remains historical evidence and is not the 1.0 specification.

## 9. Freeze rule

Changes to the scope or canonical terminology above require an explicit **Scope Change** decision before implementation.

Implementation tasks PROM-02+ may refine behavior but may not silently expand Promotions 1.0 beyond this freeze.
