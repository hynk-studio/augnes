# Repository Reduction Scope

## Decision

Augnes development is organized around one operability-first product path:

```text
Start Augnes
→ select a project
→ start or accept a task
→ compile project context
→ run the native host / Codex interactively or through bounded automation
→ return a structured result
→ review the result
→ approve any durable semantic change
→ reuse the changed context in later work
```

Git history is the archive. Active repository content is retained only when it satisfies at least one of these conditions:

1. It is used by the current product runtime.
2. It is required by the active R1–R8 roadmap or the bounded Personal Perspective parallel lane.
3. It preserves existing user data, migration, backup, restore, portable export, or recovery.
4. It enforces a real safety invariant: no unauthorized durable write, no unbounded external egress, no cross-project leakage, no replay or duplicate transition, or no credential leakage.
5. It belongs to a small canonical unit, integration, authority, operability, or end-to-end test suite.
6. It is required for build, packaging, licensing, or CI.

A filename containing `preview`, `smoke`, `dogfood`, `handoff`, `autohunt`, or `perspective` is not enough to keep or delete it. Production imports, route consumers, package or CI references, data dependencies, safety enforcement, and active-roadmap destinations decide classification.

## Classification

Every retained or removed path must be classified as one of:

- `KEEP_RUNTIME`: imported or invoked by the current product runtime
- `KEEP_PLAN`: directly required by R1–R8 or the bounded Personal Perspective lane
- `KEEP_DATA`: migration, backup, restore, portable export, recovery, or existing-data compatibility
- `KEEP_SAFETY`: enforces a real runtime invariant
- `ABSORB`: valuable behavior that must move into a canonical document or test before the original path is removed
- `DELETE_NOW`: no live runtime, roadmap, data, safety, build, or canonical-test role
- `DELETE_WITH_REPLACEMENT`: current compatibility path removed in the same PR as its tested replacement

## Protected product commitments

Reduction must not remove or collapse:

- provider-neutral, local-first temporal project substrate
- Resume / Verify / Decide
- project and workspace identity with project isolation
- Evidence, Claim, accepted state, reviewed memory, Perspective, projection, ReviewDecision, and transition as distinct source-linked semantic layers
- `TaskContextPacket`, `RunReceipt`, `EpisodeDeltaProposal`, `ReviewDecision`, and `StateTransitionReceipt`
- semantic transition receipts, idempotency, and replay protection
- minimal Model Gateway and OpenAI reference adapter
- Codex or native-host context and receipt round trip
- shared Automation Spine: policy, bounded grants, runs, receipts, budgets, stop conditions, reconciliation, and user control
- first bounded Autohunt path using the shared Core loop
- Blank State, AI Workplane, and shared Inspector
- bounded Personal Perspective work that reuses existing candidate, review, scoped-state, context-selection, lineage, receipt, and feedback contracts
- migration, backup, restore, provider-neutral portable export, update, and recovery

Blank State, AI Workplane, Shared Inspector, Portability와 Recovery에 대한 이
보호는 현재 implemented runtime behavior, user data, authority와 compatibility를
tested replacement 전까지 보존한다는 뜻이다. final user-facing topology 권한은
`vnext/07_AUGNES_POST_BUILD_WEEK_PRODUCT_UX_CORRECTION_CHARTER.md`가 소유한다.
그 charter에 따른 Blank State 또는 AI Workplane absorption, contextual Inspector
demotion, management/safety relocation은 behavior parity와 replacement proof가 있는
later correction PR에서 이 보호를 충족하면서 수행할 수 있다.

`TaskContextPacket` is selected working context, not project truth. Automation may create tasks, runs, receipts, and proposals, but does not gain semantic authority or collapse Evidence, Claim, state, memory, Perspective, decision, and transition into one generic record.

## Active implementation destinations

```text
R1 Development Authority and Operability Reset
R2 Zero-config Runtime Spine + automation lifecycle primitives
R3 Project Onboarding and Project Home + project automation state
R4 Minimal Model Gateway + budget, timeout, and cancellation
R5 Codex Host Round Trip + unattended run mode
R6 Core Closed Loop + first bounded Autohunt
R6-P bounded Personal Perspective parallel slice
R7 Semantic Workbench and Inspector + automation control and review
R8 Packaging, portable export, update, backup, restore, recovery, and run reconciliation
Alpha and RC verification
Post-Alpha usefulness evaluation
```

## Keep or absorb

The cleanup manifest must preserve or absorb:

- current app routes and their production component imports
- durable vNext store, semantic projections, target heads, and migration ledger
- project isolation, immutable ledger, idempotency, stale-state refusal, and conflicting replay refusal
- model egress boundaries and later Model Gateway foundations
- Autohunt and autonomy primitives that map to policy, grants, runs, receipts, budgets, stop conditions, pause or cancel, and reconciliation
- Personal Perspective primitives that map to reviewed candidates, scoped state, context selection, source lineage, `TaskContextPacket`, `RunReceipt`, and context-use feedback
- portable-export foundations separately from full-fidelity recovery-backup foundations
- behavior tests for migration safety, backup and restore, export isolation, durable writes, project isolation, replay refusal, egress refusal, startup, process cleanup, host round trip, and one automated golden path

Open PR #1069 owns its model-egress paths until resolved. A reduction PR must not create conflicting edits to that scope.

## Delete now after reference audit

The following are deletion candidates when they have no runtime, roadmap, data, safety, build, CI, or canonical-test consumer:

- committed execution, browser, dogfood, screenshot-validation, and closeout reports
- historical planning, readiness, observation, snapshot, and PR-by-PR checkpoint documents
- scripts that only assert document wording, removed-panel existence, historical layout, completed closeout state, or disabled/no-op design scaffolding
- one-off `design:`, `plan:`, `review:`, `report:`, `envelope:`, `stopline:`, or `harness:` aliases with no active consumer
- feature-specific smoke commands whose useful behavior has been absorbed into canonical suites
- preview-only scheduler replicas, duplicated automation contracts, or separate Personal Perspective subsystems that duplicate the shared Core

Names or patterns alone do not authorize deletion. The cleanup PR must remove the package entry and source together and prove that no runtime or CI reference remains.

## Delete with replacement

Current compatibility remains until a tested replacement exists.

### R5 host integration

Remove with a working `TaskContextPacket → host → RunReceipt` path:

- manual handoff and launch-card copy flows
- `codexResultText` and `codexResultPaste`
- manual result templates, normalizers, ingestion UI, and compatibility tests

### R3 and R7 surface consolidation

Remove after destination behavior exists:

- Project Home navigation and cards whose user-facing capability is absorbed
  into Blank State
- superseded Semantic Workbench default projections after C4 AI Workplane
  replacement evidence remains canonical
- passive workflow-stage Workplane panels
- repeated boundary cards
- duplicate diagnostics and lineage surfaces
- manual-controls migration rows
- preview-of-preview panels
- top-level Portability and Recovery entries after their capability is relocated
  to project management, safety, settings, or condition-triggered paths

For exact R7 detail, the replacement destination remains the generated,
project-scoped `/workbench/inspector` read surface. Result and suggested-change
deep links remain valid; C4 moves large diagnostics and durable-lineage detail
behind advanced or contextual access only where their assertions remain owned
by the shared Inspector and canonical tests. `/workbench` redirects to the
compatible canonical AI Workplane route rather than remaining a competing
landing. This compatibility rule does not make Inspector a target peer
navigation destination.

C5 moves active live-Codex start, progress, approval, cancellation and resume
ownership from the Project options compatibility component into AI Workplane.
The deterministic local round-trip remains an advanced project option. The
existing host-round-trip route and autonomy runner ledger remain retained
runtime authorities; broad adapter/file-name cleanup is deferred to C9.

C6 retains `shared_project_inspector.v0.1` and the compatible
`/workbench/inspector` route as the exact authenticated reader. Active product
presentation is `contextual_inspector_view.v0.1`: generic
`project_coordination` navigation is compatibility/direct-audit residue only,
while concrete result, suggested-change, delegated-run, automation-policy and
Personal Perspective links open contextual Exact details. Historical
SharedProjectInspector component/type names and inactive Agent Workplane links
remain C9 cleanup residue.

C7 removes active shared-shell Project tools rendering but retains compatible
`/portability` and `/recovery` route names and their exact engines. Project
transfer/import and ordinary backups/recovery are discovered through Blank
State’s closed Manage and protect context; forced recovery remains owned by the
existing proxy. `ProductUtilityContext`, `utilityContext` data markers, old
`.product-project-tools` CSS, historical callers, and internal Portability/
Recovery names remain explicit C9 compatibility residue.

### Automation and Personal Perspective

Do not delete shared roadmap foundations. Delete only duplicated or advanced subsystems after replacement or an explicit later product decision:

- Augnes-owned generic scheduler replica
- advanced hunt heuristics not used by the bounded loop
- unrestricted retry, self-modification, automatic authority expansion, and automatic semantic commit
- hidden personal profiles, automatic cross-project injection, and broad Perspective Arena or Personal Vault subsystems

## M3D disposition

M3D real-user pilot and autonomous evidence infrastructure are not ordinary R2–R8 merge gates.

Retain or absorb reusable invariants:

- durable transition correctness
- project isolation
- idempotency and replay refusal
- backup and restore
- browser mechanics needed by the active golden path

Long-form operator runbooks, evidence-chain allocation narration, and dedicated qualification infrastructure not used by active CI are deletion or deferment candidates after reference audit. Short real-user verification belongs at Alpha or release-candidate time.

## Required cleanup manifest

Before deletion, produce a command-backed manifest with:

```text
path
classification
production_imports
route_consumers
package_or_ci_references
migration_export_or_data_dependency
R1_R8_or_parallel_destination
replacement_pr
reason
```

Audit at minimum:

- `app/**`
- `components/**`
- public `lib/**` entry points
- `scripts/**`
- every `package.json` script
- `.github/workflows/**` (must remain free of executable GitHub Actions
  workflows unless repository policy is explicitly changed)
- schema and migrations
- active documentation links
- `reports/**`

No runtime code, migration, package command, test, report, or document is deleted solely because of its filename.

## Pull-request sequence

1. R1 aligns active authority and sequencing.
2. Repository Reduction Cleanup applies the audited manifest, removes historical residue, and creates canonical test entry points while preserving live compatibility.
3. R2–R8 vertical PRs remove compatibility in the same PR as its tested replacement.

Local typecheck, build, browser, disposable-database, export, and recovery
verification must run through the exact-head local Canonical surface before
implementation deletion PRs are merged. GitHub Actions is not an active
verification surface for this repository.
