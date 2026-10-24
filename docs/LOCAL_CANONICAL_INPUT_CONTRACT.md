# Local Canonical execution-input contract

This is the design/source map for #1530. The Local Canonical policy owns
admission and acceptance. This document records the consumers and regression
obligations; it does not grant execution, provider, lifecycle or merge authority.

## Scope and consumer map

| Boundary | Existing owner and actual consumption | Planned evidence/control |
| --- | --- | --- |
| Parent/controller | `run-local-canonical-verification.mjs`, `local-canonical-environment.mjs`, Git identity/planner reads, Node/npm selected through PATH | Exact tree, source/lock/executor identities, selected plan, Node/npm and environment bindings; changes invalidate inputs |
| Authenticated base read | `github-main-branch-transport.mjs` invokes `gh api` GET using parent transport credentials | Preserve authenticated read and current-main gate; transport failure is admission refusal, credentials are neither exported nor forwarded to phases |
| Isolated phase | `local-canonical-isolated-resources.mjs` and `canonical-test-environment.mjs` select private HOME, temp, npm cache, database/runtime and filtered environment | Bind selected environment and physical isolation; positive/negative disposable controls prove actual consumption, not HOME assignment alone |
| Suite child/native fixture | `run-canonical-test-suite.mjs`, `canonical-child-runner.mjs`, `test-harness-process-lifecycle.mjs` | Retain bounded process ownership/settlement, two integration lanes, original assertions and deadlines; native/model tests use existing disposable fake adapters |
| Dependency preparation | Root/nested/Web `npm ci`, lockfiles and package lifecycle scripts | Existing clean-install authority retained; private npm configuration/cache; package and lock changes are source inputs, installed trees are not reusable proof |
| Browser | Project-experience and continuity launchers; shared operator lifecycle including golden path | Record executable identity at actual launch and after use, plus CDP-reported version; require evidence for every selected Browser phase |
| Installed Companion | Supported preservation observer and existing context owner | Coherent before/after identity, no lifecycle in isolated context; observation/ownership failure remains blocking |
| Shared Codex preferences | No selected isolated controller/phase launches the developer Codex client or uses its model selection | Only narrowly recognized top-level model/effort/tier values may be excluded on this audited path; remainder and metadata safety checks remain conservative |
| Hooks and authority | Git reads do not dispatch checkout/commit hooks; canonical suites use private fake clients and runtime roots | No live client/model launch from this contract; source changes introducing a consumer require renewed classification and tests |

The orchestration conversation's running model is outside the deterministic
qualification process. Its effective settings and historical configuration
writers are not established by this contract. A consuming path cannot claim the
isolated path's exclusion. Inherited PATH, explicit paths, transport, package
scripts and descendant launchers remain inputs even with a private HOME.

## Implementation mapping

- Extend the executor with a frozen, versioned input classification, a latched
  observer and its existing AbortSignal/owned-child cleanup path. Preserve raw
  cancellation/timeout/failure and never admit another phase after a fault.
- Extend the receipt owner with separate execution, validity, safety and current
  applicability decisions, strict final conjunction, Browser provenance and a
  sanitized derived review export. Preserve legacy receipt interpretation.
- Add a checkout-owned, append-only attempt family: one initial invocation and
  one explicit recovery only with substantiated infrastructure cause and verified
  remedy. Family identity survives wrapper restart and cosmetic commits.
- Extend existing bounded retention to protect active and explicitly pinned
  evidence. Unsafe aliases and ambiguous ownership refuse cleanup.
- Add one integrated disposable regression suite through real classification,
  sequencing, child lifecycle and receipt validation. Keep accepted Full phase
  inventory and every existing child bound, including 30 seconds for the
  settled-expired-successor child. Register new controls in authority coverage.

## Required contrasts and limits

Controls cover excluded preferences versus the same values on a consuming path;
mixed unknown/permission/trust changes; relevant input/browser mutation; missing
evidence/coverage; observer failure and first-fault latching; exit-zero after
cancellation/timeout; owner replacement; one repaired infrastructure recovery
versus product/unknown/evasion refusal; stale main versus historical integrity;
export privacy/tamper; pinned versus disposable retention. No synthetic change
is made to protected live configuration.

Polling observes intervals, not every possible transient write. Integer file
timestamps retain their precision but are not exact observed write times.
Cooperative same-user ownership is not a hostile-user sandbox. An excluded
change has unknown authorship unless separately established; exclusion gives the
task no authority to write it. Missing or ambiguous comparison fails closed.

The accepted-base phase inventory is retained separately before implementation.
The redesign's own Full uses the accepted workload, adversarial controls and
separate stock validation; a green self-test is not independent attestation.
Historical #1430/#1524/#1529 failures and exceptions are not promoted or retried.
