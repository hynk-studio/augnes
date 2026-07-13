# Repository Reduction Scope

## Decision

Augnes development is now organized around one operability-first product path:

```text
Start Augnes
→ select a project
→ start a task
→ compile project context
→ run the native host / Codex
→ return a structured result
→ review the result
→ approve any durable semantic change
→ reuse the changed context in later work
```

Repository content is retained only when it satisfies at least one of these conditions:

1. It is used by the current production runtime.
2. It is required by the active feature-completion sequence below.
3. It preserves existing user data, migration, backup, restore, or recovery.
4. It enforces a real safety invariant: no unauthorized durable write, no unbounded external egress, no cross-project leakage, no replay/duplicate transition, or no credential leakage.
5. It is part of a small canonical unit, integration, authority, operability, or end-to-end test suite.
6. It is required for build, packaging, licensing, or CI.

Git history is the archive. Completed planning residue, one-off evidence output, and obsolete verification scaffolding should not remain in the active tree solely for historical preservation.

## Active feature-completion sequence

The following vNext commitments remain active and must not be removed during reduction:

- provider-neutral, local-first temporal project substrate
- Resume / Verify / Decide
- native hosts execute; Augnes preserves meaning, lineage, and durable project state
- project and workspace identity with project isolation
- `TaskContextPacket`
- `RunReceipt`
- `EpisodeDeltaProposal`
- `ReviewDecision`
- semantic transition receipts and replay protection
- minimal Model Gateway and OpenAI adapter
- OpenAI / Codex host round trip
- `RunReceipt → Delta → Decision → later context` closed loop
- Project Home
- Semantic Workbench
- shared Inspector
- migration, backup, restore, update, and recovery

The active implementation order is:

```text
R1 Development Authority and Operability Reset
R2 Zero-config Runtime Spine
R3 Project Onboarding and Project Home
R4 Minimal Model Gateway
R5 Codex Host Round Trip
R6 Core Closed Loop
R7 Semantic Workbench and Inspector Consolidation
R8 Packaging, Update, Backup, Restore, and Recovery
Alpha: short real-user flow verification
Post-Alpha: usefulness and product-fit validation
```

The following remain deferred until the core product is feature-complete:

- Generic CLI second adapter
- AutomationPolicy / Autohunt expansion
- Personal Perspective / Perspective Arena productization
- advanced multi-provider routing
- autonomous evidence-runner expansion
- long-form qualification infrastructure

## Classification rules

Every retained or removed path must be classified as one of:

- `KEEP_RUNTIME`: imported or invoked by the current product runtime
- `KEEP_PLAN`: directly required by R1–R8
- `KEEP_DATA`: migration, backup, restore, recovery, or existing-data compatibility
- `KEEP_SAFETY`: enforces a real runtime invariant
- `ABSORB`: valuable behavior that should move into a canonical document or test suite before the original path is removed
- `DELETE_NOW`: no live runtime, R1–R8, data, safety, build, or canonical-test role
- `DELETE_WITH_REPLACEMENT`: current compatibility path that is removed in the same PR as its replacement

Names such as `preview`, `smoke`, `dogfood`, or `handoff` are not sufficient evidence by themselves. Production imports, route consumers, package/CI references, database dependencies, and active-roadmap destinations decide classification.

## High-confidence keep scope

### Current runtime entry points

- `app/page.tsx`
- `app/workbench/page.tsx`
- `app/workbench/semantic-review/page.tsx`
- `app/workbench/semantic-review/[proposal_id]/page.tsx`
- `app/perspective/page.tsx`

Additional routes remain `KEEP_RUNTIME` until import and navigation audits prove they have no live consumer.

### Durable vNext core and data safety

- `lib/vnext/persistence/durable-semantic-store.ts`
- `lib/db/schema.sql`
- `scripts/db-migrations.mjs`
- current migration ledger and migration scripts
- project isolation, replay, idempotency, immutable-ledger, and semantic-target-head enforcement
- current protocol types and validators used by the durable loop

The `vnext_core_records`, `vnext_semantic_state_entries`, and `vnext_semantic_target_heads` paths are not deletion candidates. They are existing durable product foundations for R6 and must retain migration compatibility.

### Model egress safety and Model Gateway foundation

PR #1069 is open and overlaps directly with R4. Until that PR is resolved, the following paths are protected from reduction and must be reviewed as one unit:

- `lib/model-egress/openai-outbound-payload-boundary-v0-1.ts`
- `lib/observe/delta-compiler.ts`
- `lib/planner/planner.ts`
- `lib/temporal-interpretation/openai.ts`
- `lib/temporal-interpretation/preview.ts`
- its focused boundary regression test

Reduction work must not create conflicting edits to those paths while #1069 remains open.

### Product-direction documents to preserve, then shorten

- `docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md`
- `docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md`
- `docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`
- `docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md`

Their core product commitments remain active. Historical PR-by-PR checkpoint narration, repeated non-claims, and manual qualification sequencing should be removed or compressed during R1.

## High-confidence absorb or delete scope

The following classifications are sufficiently clear to drive the first cleanup PR after R1. Deletion still requires a final reference scan on the cleanup branch.

### `ABSORB`: canonical guidance replacement

- `README.md`
- `AGENTS.md`
- `docs/AUGNES_START_HERE_FOR_USERS_AND_AI.md`
- `docs/ACTIVE_DEVELOPMENT_COMPLETION_POSTURE_V0_1.md`
- `docs/00_INDEX_LATEST.md`
- `docs/vnext/00_AUGNES_VNEXT_DOCUMENT_INDEX.md`

Action:

- replace duplicated setup, authority, and sequencing guidance with concise active product, architecture, roadmap, development, and testing guidance
- remove the normal-path `db:reset` instruction
- stop presenting manual MCP setup, handoff copy, and result paste as the target experience
- reduce Codex startup requirements and document-reading requirements
- remove historical pointer ledgers from active guidance

### `DELETE_NOW`: committed execution reports

Subject to a final check that no build or runtime imports these paths:

- `reports/**`
- `reports/browser/**`
- committed screenshot-validation reports
- dogfood execution reports
- closeout result reports
- generated evidence output committed as source documentation

Future run evidence belongs in PR bodies or GitHub Actions artifacts.

### `DELETE_NOW`: document-only and historical smoke families

These package/script families are removal candidates when they only inspect documentation, historical panels, completed migrations, or previous PR closeout state:

- `smoke:cockpit-*` for removed Cockpit behavior or historical layout
- `smoke:*design*`
- `smoke:*plan*`
- `smoke:*preparation*`
- `smoke:*closeout*`
- `smoke:*dogfood-observation*`
- `smoke:*status-roadmap*`
- `smoke:*validation-docs*`
- `smoke:*screenshot-validation*`
- one-off package aliases beginning with `design:`, `plan:`, `review:`, `report:`, `envelope:`, `stopline:`, or `harness:` when they have no production or canonical-test consumer

Examples already identified as high-confidence candidates:

- `scripts/smoke-temporal-v02-status-roadmap.mjs`
- `scripts/smoke-temporal-persistence-design.mjs`
- `scripts/smoke-temporal-review-artifact-schema-design.mjs`
- `scripts/smoke-temporal-review-artifact-v01-closeout.mjs`
- `scripts/smoke-github-token-management-v01-closeout.mjs`
- `scripts/smoke-cockpit-post-removal-cleanup-v0-1.mjs`
- `scripts/smoke-readonly-api-route-planning-boundary.mjs`
- `scripts/smoke-temporal-openai-validation-docs.mjs`
- `scripts/smoke-temporal-cockpit-screenshot-validation.mjs`

These names are examples, not permission for pattern-only deletion. The cleanup PR must remove the package entry and source file together and prove that CI and runtime no longer reference them.

### `ABSORB`: high-value tests into canonical suites

The following behavior must survive even if one-off command names are removed:

- migration idempotency and existing-data preservation
- backup and restore
- immutable durable records
- unauthorized durable-write refusal
- project isolation
- exact replay and conflicting replay refusal
- stale-state and duplicate-transition refusal
- model-egress refusal before transport
- current runtime startup and child-process cleanup
- one automated golden-path integration

Candidate current tests to retain or absorb include:

- `scripts/smoke-vnext-durable-semantic-loop-v0-1.ts`
- current operator-pilot tests only to the extent they validate reusable durable-loop, isolation, replay, and browser behavior
- temporal hardening tests that exercise real behavior rather than documentation wording
- #1069 model-egress boundary regression

Target canonical commands:

```text
npm run typecheck
npm run build
npm test
npm run test:integration
npm run test:authority
npm run test:operability
npm run test:e2e
```

Exact command implementation belongs to the cleanup PR after the existing CI call graph is audited.

## Delete only with replacement

The following are not immediate deletion targets because they may still be the only working compatibility path. They are removed with their replacement PR.

### R5: Codex host round trip

Remove together with a working adapter-backed `TaskContextPacket → Codex → RunReceipt` path:

- manual Core Handoff / Handoff Capsule copy workflow
- Codex Launch Card copy workflow
- `codexResultText`
- `codexResultPaste`
- manual result report template
- result-paste normalizer
- manual result-ingestion UI and compatibility tests

Until R5, they should be visibly classified as legacy compatibility and must not receive new feature work.

### R3 and R7: product-surface consolidation

Remove only after destination behavior exists:

- Blank State cards that duplicate Project Home
- passive workflow-stage Workplane panels
- repeated boundary-copy cards
- duplicate lineage and diagnostics surfaces
- manual-controls migration rows
- preview-of-preview panels

Current runtime import is evidence to keep temporarily, not evidence of permanent product value.

### Deferred lanes

Autohunt, autonomy preview, Personal Perspective, research candidate, and second-adapter paths require separate classification. They are frozen from expansion. A later reduction pass may remove them if they have no current runtime value and no accepted post-Alpha destination.

## M3D disposition

M3D real-user pilot and autonomous evidence infrastructure are no longer ordinary PR merge gates or prerequisites for R2–R8.

Retain or absorb only the reusable invariants:

- durable transition correctness
- project isolation
- idempotency and replay refusal
- backup and restore
- browser mechanics needed by the active golden path

The following are candidates for deletion or deferment after reference audit:

- long-form operator pilot runbooks
- autonomous evidence-chain allocation and qualification narration
- dedicated runner qualification infrastructure that is not called by active CI
- PR-by-PR M3A/M3B/M3C/M3D historical checkpoint text

A short real-user verification belongs at Alpha or release-candidate time.

## Required audit before the cleanup PR

The cleanup implementation must produce a machine-generated or command-backed manifest with these columns:

```text
path
classification
production_imports
route_consumers
package_or_ci_references
migration_or_data_dependency
R1_R8_destination
replacement_pr
reason
```

At minimum, audit:

- all `app/**` routes
- all `components/**` production imports
- all `lib/**` public entry points
- all `scripts/**`
- every `package.json` script
- `.github/workflows/**`
- all migrations and schema files
- all active documentation links
- `reports/**`

No runtime code, migration, package command, test, report, or document is deleted solely because of its filename.

## Pull-request sequence

1. **R1 — Development Authority and Operability Reset**
   - change active guidance and milestone sequencing only
   - no runtime, schema, test, or package deletion

2. **Repository Reduction Cleanup**
   - apply the audited manifest
   - delete historical docs/reports and one-off test scaffolding
   - introduce canonical test entry points
   - preserve live compatibility paths

3. **R2–R8 vertical PRs**
   - each replacement PR deletes the compatibility path it supersedes

## Current blockers and overlap

- PR #1069 is open and draft. Do not edit its seven-path security boundary scope in a conflicting cleanup PR.
- The repository currently exposes a very large `package.json` script surface. Exact removal counts require a local checkout or a complete Git tree/CI audit before implementation.
- GitHub connector inspection can define and review scope, but local typecheck, build, browser, and disposable-database verification must be performed by Codex or GitHub Actions before deletion PRs are merged.
