# Research-to-Perspective Fixture Smoke Legacy Audit v0.1

Slice name: `research_to_perspective_fixture_smoke_legacy_audit_v0_1`

## Scope And Non-Goals

This document inventories Research-to-Perspective fixture, smoke, package
script, parked preflight, and historical closeout artifacts after the
Foundation Milestone closeout. It is a repo-local audit surface for
classification and future cleanup planning.

Non-goals:

- Do not implement runtime persistence.
- Do not add provider/OpenAI calls.
- Do not execute retrieval/RAG.
- Do not query or write production DB.
- Do not promote Perspective state.
- Do not create proof/evidence records.
- Do not mutate work.
- Do not implement product write.
- Do not unpark product-write.
- Do not enable disabled adapters.
- Do not add GitHub Actions.
- Do not change CI runtime.

## Why This Exists After #759

PR #759 closed the Research-to-Perspective Foundation Milestone as a
milestone closeout-only, fixture-only, smoke-only slice. The scaffold is now
closed through Dogfooding Research-to-Perspective CI Expansion closeout, but
runtime persistence, provider runtime, retrieval/RAG runtime, durable
Perspective promotion, product DB writes, and product-write remain unopened or
parked. Product-write remains parked by #686.

The repo has accumulated many validation artifacts that are still useful for
lineage, but they are hard to scan as a single chain: active foundation smokes,
historical preview smokes, closeout smokes, disabled adapter smokes, temp DB
harness smokes, product-write preflight smokes, package-only pointers, and known
Node warning families. This slice creates one bounded inventory so future
cleanup can be reviewed without deleting active validation coverage.

## Active Foundation Rails

Active foundation coverage is the current contract/fixture/smoke scaffold
represented by:

- Research-to-Perspective Foundation Milestone closeout v0.1.
- Dogfooding Research-to-Perspective CI Expansion closeout v0.1.
- Agent Perspective Substrate Feedback Loop closeout v0.1.
- Perspective Packet Receipt Linkage.
- Codex Handoff Draft.
- AI Context Packet.
- Perspective Geometry Digest.
- Project Constellation Runtime Layout.
- Durable Perspective State / Trajectory.
- Human-reviewed Durable Perspective Promotion.
- Non-authoritative Retrieval/RAG.
- Operator Source Candidate Generation.
- Bounded External Source Intake.
- Salience Governor.
- Recent Rehearsal Buffer.
- Formation Receipt Durable Event.
- Feedback Event Store.

These rails remain active validation lineage. They are not cleanup targets in
this slice.

## Parked Product-Write Preflight Rails

Product-write remains parked by #686. Artifacts containing names such as
`product-write`, `disabled-adapter`, `temp-db-single-claim`,
`preflight-command-envelope`, `preflight-stopline`, `temp-to-product`,
`dry-run-transaction`, `noop-invocation`, and `disabled-bridge` are classified
as parked or historical validation artifacts unless a later product-write
reentry decision explicitly changes their authority.

Do not delete the parked product-write chain in this slice. It is still useful
as stopline history and future reentry context.

## Historical And Closeout Rails

Historical and closeout rails record validation lineage. They are useful as
review context and should not be read as runtime completion proof. Closeout
fixtures summarize what was closed in fixture/smoke space; they do not prove
runtime behavior.

Examples include Research Candidate manual note preview draft lane artifacts,
Codex Handoff Draft artifacts, AI Context Packet artifacts, Perspective
Geometry Digest artifacts, Project Constellation Runtime Layout artifacts, and
older closeout smokes that preserve downstream compatibility.

## Fixture Categories

- `active_foundation_smoke`: active foundation fixtures and smokes that current
  downstream validation still relies on.
- `active_runtime_smoke`: active runtime-adjacent smokes that validate bounded
  routes/read models without opening product-write or provider authority.
- `closeout_smoke`: summary-only closeout fixtures and smokes.
- `historical_preview_smoke`: preview or contract rails retained for lineage.
- `parked_product_write_smoke`: product-write stopline and preflight artifacts
  parked by #686.
- `disabled_adapter_smoke`: disabled adapter artifacts that must remain disabled.
- `temp_db_harness_smoke`: temp DB harness artifacts retained until
  product-write reentry decisions are made.
- `design_only_smoke`: design-only validation surfaces.
- `report_only_runner`: report runners that summarize parked lanes without
  creating product/proof/evidence writes.
- `package_script_only`: package.json script pointers with no standalone
  fixture authority.
- `docs_pointer`: docs and index pointers.
- `warning_debt`: known Node warning families.

## Smoke Categories

The audit fixture classifies representative smokes rather than enumerating
every historical file. The intent is to make future cleanup reviewable:

- Active foundation smokes stay active.
- Active runtime smokes stay active unless replaced by a stronger runtime test.
- Closeout smokes remain summary-only lineage.
- Parked product-write and disabled adapter smokes remain parked.
- Temp DB harness smokes remain retained until product-write reentry is decided.
- Design-only smokes remain design-only.
- Warning debt is tracked, not globally suppressed.

## Package Script Categories

Package scripts are grouped by authority:

- Active foundation smoke scripts.
- Bounded runtime-adjacent smoke scripts.
- Closeout smoke scripts.
- Parked product-write, disabled adapter, preflight, and temp DB harness scripts.
- Report-only runner scripts.
- Design-only runner scripts.

This slice adds only
`smoke:research-to-perspective-fixture-smoke-legacy-audit-v0-1`.

## Warning Debt

Known warning families that may appear in existing validation runs:

- `MODULE_TYPELESS_PACKAGE_JSON`
- `ExperimentalWarning: stripTypeScriptTypes`

Do not suppress these globally in this slice. If a warning is newly introduced
by this audit work, fix the local cause. Otherwise, keep the warning family
classified here for future Node runner policy cleanup.

## Cleanup Candidates

Future cleanup candidates:

- Centralize downstream smoke allowlists.
- Split package.json smoke scripts into domain manifests or generated docs.
- Normalize node vs tsx smoke runner policy.
- Resolve known Node warning debt.
- Add a parked lane registry.
- Add smoke catalog generation.
- Evaluate obsolete temp DB/product-write preflight artifacts only after
  product-write reentry decision.
- Evaluate closeout fixture retention policy only after runtime replacement
  exists.

## Explicitly Deferred Cleanup

Deferred and not authorized in this slice:

- Deleting active foundation fixtures or smokes.
- Deleting parked product-write, disabled adapter, preflight, disabled bridge,
  temp DB, dry-run transaction, noop invocation, or report-only artifacts.
- Deleting old Temporal, AG Work Resume, readonly route, or GitHub token smokes.
- Enabling adapters or converting parked lanes into runtime behavior.
- Moving package scripts into generated manifests.
- Creating GitHub Actions or changing CI runtime.
- Treating any closeout fixture as replacement for a future runtime test.

## Explicit Non-Deletion Policy

No fixture or smoke script is deleted by this slice. Future deletion requires a
separate PR proving the artifact is unreferenced by package.json, docs, smokes,
fixtures, and source imports, and proving that no active validation lineage is
lost.

## Safe Future Refactor Plan

1. Add a parked lane registry that is static data only.
2. Generate a smoke catalog from package.json and fixture metadata.
3. Centralize downstream smoke allowlists after the catalog exists.
4. Normalize runner policy for `node` vs `tsx`.
5. Revisit temp DB and product-write preflight artifacts only after a
   product-write reentry decision.
6. Revisit closeout fixture retention only after equivalent runtime coverage
   exists.

Next recommended slice: `parked_lane_registry_and_smoke_catalog_plan_v0_1`.

## Authority Boundaries

This audit is classification-only. It does not implement runtime persistence,
provider/OpenAI calls, retrieval/RAG execution, Perspective promotion,
proof/evidence writes, product write, product DB writes, GitHub Actions, CI
runtime changes, work mutation, or adapter enablement. Smoke pass remains a
validation signal only, not proof/evidence. Closeout fixtures remain lineage and
summary artifacts, not runtime completion proof.
