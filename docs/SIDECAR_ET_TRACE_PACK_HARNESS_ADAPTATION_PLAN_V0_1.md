# Sidecar e_t Trace-Pack Harness Adaptation Plan v0.1

## 1. Status and Scope

Status:

- original-repo docs-only Strategy C planning
- based on merged lab repo evidence from `hynk-studio/augnes-perspective-lab`
- non-authoritative
- not harness implementation
- not helper import
- not runtime promotion
- not CI policy

This document plans a possible future Strategy C trace-pack/report harness
adaptation for original-repo review. It does not port lab helper logic,
trace-pack harnesses, fixtures, package scripts, runtime computation, threshold
policy, schema/API behavior, Cockpit action behavior, QP evidence, `z_t`
commits, proof/evidence/readiness writes, Gate/SRF/proposal scoring, Claim
confidence, Evidence status, publication readiness, MCP/App/tool schemas, or CI
enforcement.

The current original-repo runtime boundary remains unchanged:
`PerspectiveSnapshot.research_diagnostics.sidecar_e_t` is a structured
placeholder with `computed=false`.

## 2. Lab Evidence Baseline

The lab repo evidence baseline used for this planning note is:

| field | lab baseline |
| --- | ---: |
| manifest packs | 8 |
| total manifest traces | 35 |
| default compare packs | 2 |
| explicit-only packs | 6 |
| probe packs | 5 |
| stress packs | 1 |

Grounded/quiet baseline:

| field | lab baseline |
| --- | ---: |
| grounded/quiet traces | 5 |
| grounded traces | 3 |
| quiet traces | 2 |
| `surprising_cases` | 0 |

Observed lab thresholds:

| threshold | observed lab value |
| --- | ---: |
| strong tension | 0.65 |
| medium tension | 0.5 |
| low evidence recovery | 0.35 |

Runtime boundary preserved in lab evidence:

- runtime `sidecar_e_t` placeholder preserved
- runtime `sidecar_e_t.computed=false` preserved
- no QP evidence produced by the lab packet
- no `z_t` commit produced by the lab packet

These values are lab observations. They are not runtime policy in
`hynk-studio/augnes`.

## 3. Candidate Harness Components

These components are candidates for future planning only. Any adaptation must
arrive through a separate scoped PR after user/PM review.

| candidate component | suitability | dependencies | package script impact | validation requirement | authority risk |
| --- | --- | --- | --- | --- | --- |
| Trace-pack fixture shape | Useful as a review vocabulary for trace metadata and expected labels. | Lab fixture schema, original docs boundary language, local TypeScript compatibility. | None in this PR. Future import would need explicit script and fixture review. | Static fixture-boundary smoke plus diff review for no runtime imports. | Medium: fixtures can look like policy if labels are treated as runtime truth. |
| Trace-pack manifest | Useful for counting packs, classifying default compare versus explicit-only packs, and checking drift. | Lab manifest fields, original docs index, local path conventions. | None in this PR. Future manifest command must avoid colliding with existing scripts. | Manifest validation smoke, `git diff --check`, typecheck/build if TypeScript is touched. | Medium: manifest can imply coverage or CI authority if wording is too strong. |
| Validation smoke | Useful for confirming imported fixtures remain review-aid-only. | Existing smoke style, `tsx` availability, fixture paths. | None in this PR. Future script names must be scoped and reviewed. | Dedicated smoke plus existing boundary smokes. | Low to medium: must not become CI enforcement without separate approval. |
| Report command | Useful for reviewer-readable lab-style summaries. | Manifest, fixtures, deterministic formatter, no runtime writes. | None in this PR. Future `lab:*` or `smoke:*` command requires separate review. | Report golden/check output, typecheck/build, boundary smokes. | Medium: report output can be mistaken for proof/evidence/readiness. |
| Compare command | Useful for comparing default packs and surfacing surprising cases. | Two or more default compare packs, deterministic compare logic. | None in this PR. Future command must not replace existing original flows. | Compare smoke, surprising-case assertions, no DB/write assertions. | Medium: compare labels can be mistaken for runtime decisions. |
| Suite command | Useful for grouping manifest, validation, report, compare, and probe checks. | All component commands, stable local script naming. | None in this PR. Future suite command changes `package.json` and must be justified. | Full Strategy C smoke suite plus typecheck/build. | High: suite naming can look like CI policy or readiness gate. |
| Matrix smoke | Useful for cross-pack label and boundary matrix checks. | Manifest metadata, report output, deterministic assertions. | None in this PR. Future smoke command requires explicit scope. | Matrix smoke plus fixture-boundary smoke. | Medium: matrix summaries can overstate behavioral guarantees. |
| Low-evidence sweep | Useful for planning threshold sensitivity review. | Lab sweep logic, observed threshold docs, explicit non-policy wording. | None in this PR. Future command must keep thresholds observational. | Sweep smoke/report with threshold-as-observation assertions. | High: thresholds can be accidentally promoted to runtime policy. |
| Offline candidate report | Useful for summarizing non-runtime candidate labels. | Offline candidate helper boundaries, fixtures, deterministic report logic. | None in this PR. Future command must not import runtime helper logic. | Offline report smoke, no runtime import assertions, no DB/write assertions. | High: candidate labels can be mistaken for computed runtime state. |
| Perspective diagnostics report | Useful for reviewer context across `research_diagnostics` placeholders. | `PerspectiveSnapshot` docs, current route/read model shape, no runtime changes. | None in this PR. Future report command must remain read-only. | Perspective diagnostics smoke plus route/Cockpit boundary checks if runtime files change. | High: diagnostics report can appear to add schema/API authority. |
| Runtime boundary smoke | Useful for confirming placeholder-only behavior during future harness work. | Current placeholder shape, temp DB isolation if runtime is exercised. | None in this PR. Existing smoke remains untouched. | `smoke:sidecar-et-runtime-boundaries` and browser/computer-use if UI/runtime changes. | Low when kept as boundary-only; high if it starts asserting computed behavior. |

## 4. Explicit Non-Port List

This plan does not port or authorize:

- helper logic
- thresholds as runtime configuration
- fixtures
- trace-pack harness scripts
- runtime Sidecar e_t computation
- API routes
- DB schema or migrations
- MCP/App/tool schemas
- Cockpit UI or action behavior
- package scripts
- CI workflows
- QP evidence
- `z_t` commits
- proof/evidence/readiness writes
- Gate/SRF/proposal scoring
- Claim confidence, Evidence status, or publication readiness changes
- original-only `ag:resume-*` or `smoke:ag-work-resume-*` flow changes

## 5. Original Repo Seam Checklist

Original repo snapshot for this PR:

| field | value |
| --- | --- |
| repo | `hynk-studio/augnes` |
| remote | `https://github.com/hynk-studio/augnes.git` |
| base branch | `main` |
| original `origin/main` SHA | `1ac7d27f65d58d98c13778530d09ea25167b8b63` |
| comparison time | 2026-06-02 01:01 KST |
| target branch | `codex/sidecar-et-harness-adaptation-plan` |

Relevant docs inspected:

- `docs/00_INDEX_LATEST.md`
- `docs/PERSPECTIVE_SNAPSHOT_V0_1.md`
- `docs/COCKPIT_PERSPECTIVE_IA_V0_1.md`
- `docs/SIDECAR_ET_DIAGNOSTIC_DESIGN_V0_1.md`
- `docs/SIDECAR_ET_OFFLINE_FIXTURE_DESIGN_V0_1.md`
- `docs/SIDECAR_ET_OFFLINE_HELPER_DESIGN_V0_1.md`
- `docs/SIDECAR_ET_OFFLINE_COMPUTATION_DESIGN_V0_1.md`
- `docs/SIDECAR_ET_RUNTIME_LOG_ONLY_DESIGN_V0_1.md`
- `docs/SIDECAR_ET_RUNTIME_SMOKE_DESIGN_V0_1.md`
- `docs/SIDECAR_ET_RUNTIME_IMPLEMENTATION_CHECKLIST_V0_1.md`
- `docs/SIDECAR_ET_LAB_UPSTREAM_ALIGNMENT_V0_1.md`
- `docs/SIDECAR_ET_LAB_REPORT_REFERENCE_V0_1.md`

Relevant runtime/UI/package paths inspected read-only:

- `lib/perspective/snapshot.ts`
- `app/api/perspective/snapshot/route.ts`
- `components/augnes-cockpit.tsx`
- `package.json`

Package script collision risks:

- Existing `smoke:perspective-*`, `smoke:research-diagnostics-*`, and
  `smoke:sidecar-et-*` scripts already occupy the local diagnostics namespace.
- Existing original-only `ag:resume-*` and `smoke:ag-work-resume-*` scripts are
  product/runtime flows and must remain untouched by any Sidecar e_t harness
  adaptation.
- Any future Strategy C script must use an explicit reviewed name and must not
  silently change existing script behavior.

Dependency and environment assumptions:

- Future harness adaptation must re-check local Node, TypeScript, `tsx`, Next,
  and package-lock state before adding scripts or dependencies.
- This planning PR adds no dependencies and changes no package scripts.
- Future runtime or browser checks must use isolated temp DB state and must not
  write proof, evidence, readiness, QP, `z_t`, transition, approval, delivery,
  or action records.
- Future lab evidence refresh may require network fetches from both the lab repo
  and the original repo. Record both SHAs before comparing.

Checkout context note:

- `git rev-parse origin/main` is checkout-context dependent. Run it inside the
  original repo checkout when recording original repo drift, and inside the lab
  checkout when recording lab repo drift.

## 6. Current original-repo drift after AG Resume proof/evidence bridge work

Latest original `main` includes:

- PR #339, `docs: design AG Resume proof/evidence recording bridge table
  migration policy`, merge commit
  `3640dc8972e7fb52f62958ff8956fb6fbc75abbe`.
- PR #341, `db: add AG Resume proof/evidence recording bridge table schema`,
  merge commit `1ac7d27f65d58d98c13778530d09ea25167b8b63`.

PR #341 added the empty schema table
`ag_work_resume_proof_evidence_recording_links`. This Strategy C Sidecar
trace-pack/report harness planning must not overlap with or weaken AG Resume
proof/evidence recording gates.

Strategy C Sidecar trace-pack/report harness planning must not:

- write to `ag_work_resume_proof_evidence_recording_links`
- create `verification_evidence_records`
- create `action_records`
- record proof/evidence
- create QP evidence
- commit `z_t`
- create readiness writes
- mutate AG Resume reconciliation candidates
- mutate imported context, confirmed mappings, proposals, approval,
  publication, delivery, or committed-state paths

Any future Sidecar harness implementation PR must prove:

- no bridge-table rows are created by Sidecar validation or reporting
- no proof/evidence/readiness/action rows are created by viewing or running
  Sidecar diagnostics
- existing AG Resume proof/evidence bridge smoke expectations remain green
- Sidecar harness package scripts, if ever added later, do not collide with
  `ag:resume-*` or `smoke:ag-work-resume-*` flows

## 7. Minimal Future Options A-E

These are future options only. This document does not choose or authorize any
implementation option.

| option | when | files likely touched | validation | browser/computer-use | risk |
| --- | --- | --- | --- | --- | --- |
| A: Keep docs/reference only | Reviewers decide lab reports are enough for now. | Docs only. | typecheck, build, diff checks, existing boundary smokes. | Skip if docs-only. | Low. |
| B: Add docs-only manifest appendix | Reviewers want a compact manifest inventory without fixtures. | Docs only. | typecheck, build, diff checks, existing boundary smokes. | Skip if docs-only. | Low to medium: wording must avoid coverage authority. |
| C: Add fixture-boundary design before import | Reviewers want exact fixture shape and naming reviewed before code. | Docs only, maybe no scripts. | typecheck, build, diff checks, existing boundary smokes. | Skip if docs-only. | Medium: fixture labels can look like runtime policy. |
| D: Add local harness scripts and fixture copies | User/PM explicitly approves a scoped Strategy C implementation PR. | `fixtures/`, `scripts/`, `package.json`, docs. | typecheck, build, new harness smokes, existing boundary smokes, diff checks. | Required if UI/runtime files change; otherwise document skip. | High: script and fixture imports can imply CI or runtime authority. |
| E: Add runtime log-only candidate planning | Strategy C evidence is accepted as input to a separate runtime decision packet. | Docs first; runtime files only in a separately approved PR. | Full Strategy D/E gate suite, runtime boundary smokes, AG Resume bridge guard smokes, browser/computer-use with temp DB. | Required. | Very high: can affect user-facing diagnostic meaning if scoped poorly. |

Manifest appendix pointer:

- `docs/SIDECAR_ET_TRACE_PACK_MANIFEST_APPENDIX_V0_1.md` records the docs-only
  manifest appendix for lab trace-pack inventory, pack classes, labels, and
  future adaptation checks. It does not import fixtures, manifest JSON, harness
  scripts, helper logic, package scripts, thresholds as runtime policy, runtime
  computation, schema/API changes, Cockpit behavior, proof/evidence/readiness
  writes, QP evidence, `z_t` commits, or CI enforcement.

Fixture-boundary design pointer:

- `docs/SIDECAR_ET_TRACE_PACK_FIXTURE_BOUNDARY_DESIGN_V0_1.md` records the
  docs-only fixture-boundary design for possible future trace-pack fixture
  adaptation. It defines safe input boundaries, allowed low-cardinality
  vocabulary, candidate validation assertions, non-authority label rules, AG
  Resume bridge safety, and future implementation gates. It does not import
  fixtures, manifest JSON, harness scripts, helper logic, package scripts,
  thresholds as runtime policy, runtime computation, schema/API changes,
  Cockpit behavior, proof/evidence/readiness writes, QP evidence, `z_t`
  commits, AG Resume bridge-table behavior, or CI enforcement.
- `docs/SIDECAR_ET_TRACE_PACK_FIXTURE_DESCRIPTOR_VALIDATION_PLAN_V0_1.md`
  records docs-only descriptor candidates, safest first subset, validation
  naming proposals, and future changed-file boundaries. It does not import
  fixtures, manifest JSON, harness scripts, helper logic, package scripts,
  thresholds as runtime policy, runtime computation, schema/API changes,
  Cockpit behavior, proof/evidence/readiness writes, QP evidence, `z_t`
  commits, AG Resume bridge-table behavior, or CI enforcement.

## 8. Future Validation Plan Commands

Required validation for this docs-only Strategy C planning PR:

- `npm run typecheck`
- `npm run build`
- `npm run smoke:perspective-quality`
- `npm run smoke:research-diagnostics-boundaries`
- `npm run smoke:sidecar-et-runtime-boundaries`
- `npm run smoke:cockpit-perspective-snapshot`
- `npm run smoke:sidecar-et-fixture-boundaries`
- `git diff --check`
- `git diff --cached --check`

AG Resume bridge-table guard check:

- Run `npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-schema`
  on a clean PR #341/main baseline or with Sidecar docs stashed, because the
  smoke has an AG-schema-PR-specific changed-file allowlist.
- Record PASS or the non-applicable reason.
- Do not change the AG smoke allowlist from this Sidecar docs PR.

For a future Strategy C implementation PR, add the new harness-specific
validation commands only after their scope, names, inputs, and authority
boundaries are separately reviewed.

## 9. Browser/Computer-Use Plan

Browser/computer-use validation is skipped for this PR because the change is
docs-only. No UI, runtime, API, schema, fixture, package script, or Cockpit
action files are changed.

Future UI or runtime PRs must run browser/computer-use checks with an isolated
temp DB and confirm:

- Cockpit/Perspective loads.
- Runtime `research_diagnostics.sidecar_e_t.version` remains
  `sidecar_e_t.placeholder.v0.1` unless a separately approved runtime PR
  changes it.
- Runtime `research_diagnostics.sidecar_e_t.status` remains `placeholder` for
  docs/reference/harness strategies.
- Runtime `research_diagnostics.sidecar_e_t.computed` remains `false` for
  docs/reference/harness strategies.
- Sidecar e_t display has no action affordance.
- Viewing diagnostics creates no proof, evidence, readiness, action,
  transition, approval, delivery, QP, or `z_t` writes.
- Product wording remains non-authoritative.

## 10. Decision Gate

Before any future Strategy C implementation PR, reviewers must explicitly
decide:

- which candidate components are in scope
- whether fixtures are copied, translated, or left in the lab repo
- whether any package script changes are acceptable
- whether new harness commands are local-only, smoke-only, or CI candidates
- how thresholds are worded as observations rather than runtime policy
- how reports avoid proof/evidence/readiness authority
- which boundary smokes must pass before review
- whether browser/computer-use checks are required for the exact file set

If any decision is unclear, keep the original repo at docs/reference-only
alignment and do not import lab harness code.
