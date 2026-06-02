# Sidecar e_t Trace-Pack Fixture Descriptor Validation Plan v0.1

## 1. Status and Scope

Status:

- original-repo docs-only descriptor/naming plan
- Strategy C planning refinement only
- non-authoritative
- not fixture import
- not manifest JSON import
- not harness implementation
- not helper import
- not runtime promotion
- not CI policy

This document proposes descriptor-only candidates and validation names for a
possible future Sidecar e_t trace-pack adaptation. It does not import fixture
data, manifest JSON, trace-pack harness scripts, helper logic, thresholds as
runtime policy, package scripts, runtime computation, schema/API behavior,
Cockpit behavior, QP evidence, `z_t` commits, proof/evidence/readiness writes,
AG Resume bridge-table behavior, or CI enforcement.

Current original-repo snapshot for this plan:

| field | value |
| --- | --- |
| repo | `hynk-studio/augnes` |
| remote | `https://github.com/hynk-studio/augnes.git` |
| base branch | `main` |
| original `origin/main` SHA | `589520520ad1e58140de741933a555e23b613e4f` |
| comparison time | 2026-06-02 01:48 KST, refreshed after PR #346 |
| target branch | `codex/sidecar-et-fixture-descriptor-validation-plan` |

Runtime `PerspectiveSnapshot.research_diagnostics.sidecar_e_t` remains a
structured placeholder with `computed=false`.

## 2. Candidate Descriptor Set

These are descriptor-only candidates. They name possible future review units
without importing lab fixture data or manifest JSON.

| proposed descriptor id | pack class | source lab pack name | proposed original-repo treatment | why | what must not be inferred |
| --- | --- | --- | --- | --- | --- |
| `sidecar_et_descriptor.example.v0.1` | example | `sidecar-et-trace-pack.example.json` | docs-only; descriptor-only; future default-compare candidate only after review | Smallest canonical pack and easiest first shape review. | Not fixture import, not coverage, not runtime behavior. |
| `sidecar_et_descriptor.curated.v0.1` | curated | `sidecar-et-trace-pack.curated-v0.1.json` | docs-only; descriptor-only; future default-compare candidate only after review | Useful baseline compare vocabulary after smaller descriptor review. | Not benchmark completeness and not label policy. |
| `sidecar_et_descriptor.surprising_probes.v0.1` | surprising probes | `sidecar-et-trace-pack.surprising-probes-v0.1.json` | docs-only; descriptor-only; future explicit-only fixture candidate | Keeps surprising/review-hint cases separate from default compare behavior. | Not runtime surprising-case detection. |
| `sidecar_et_descriptor.medium_tension_probes.v0.1` | medium-tension probes | `sidecar-et-trace-pack.medium-tension-probes-v0.1.json` | docs-only; descriptor-only; future explicit-only fixture candidate | Useful for reviewing medium-tension priority ambiguity. | Not threshold runtime policy and not Gate/SRF policy. |
| `sidecar_et_descriptor.recovery_policy_probes.v0.1` | recovery-policy probes | `sidecar-et-trace-pack.recovery-policy-probes-v0.1.json` | docs-only; descriptor-only; future explicit-only fixture candidate | Captures recovery-like ambiguity and history-blocked review cases. | Not recovery policy, proof/evidence status, or readiness. |
| `sidecar_et_descriptor.low_evidence_boundary_probes.v0.1` | low-evidence-boundary probes | `sidecar-et-trace-pack.low-evidence-boundary-probes-v0.1.json` | docs-only; descriptor-only; future explicit-only fixture candidate | Useful for reviewing low-evidence recovery sensitivity. | Not low-evidence runtime threshold configuration. |
| `sidecar_et_descriptor.grounded_quiet_probes.v0.1` | grounded/quiet probes | `sidecar-et-trace-pack.grounded-quiet-probes-v0.1.json` | docs-only; descriptor-only; future explicit-only fixture candidate | Small fallback-boundary pack for grounded versus quiet review. | Not product-ready fallback policy and not runtime label behavior. |
| `sidecar_et_descriptor.stress.v0.1` | stress | `sidecar-et-trace-pack.stress-v0.1.json` | docs-only; descriptor-only; defer fixture candidate | Stress contexts are highest risk and should not be first. | Not performance coverage, CI policy, or acceptance criteria. |

All descriptor ids are planning labels only. They do not define runtime schema,
product API shape, package scripts, fixtures, or report output.

## 3. Recommended First Subset

Safest first path:

- start descriptor-only
- do not import fixture data yet
- do not import manifest JSON yet
- do not add package scripts yet
- do not add report, compare, suite, or matrix behavior yet

If a future fixture import is separately approved, start with:

- `sidecar_et_descriptor.example.v0.1`
- one small explicit-only probe descriptor, preferably
  `sidecar_et_descriptor.grounded_quiet_probes.v0.1` or another user/PM-chosen
  low-risk probe

Do not start by importing:

- the stress pack
- all 8 packs at once
- default compare behavior without separate review
- threshold-sensitive behavior as runtime policy
- any fixture content containing private text, raw URLs, raw DB rows, pasted PR
  bodies, conversation text, secrets, or production proof/evidence/readiness
  data

## 4. Validation Naming Plan

These names are proposals only. This PR does not change `package.json`.

| proposed name | purpose | existing `smoke:sidecar-et-*` collision risk | `ag:resume-*` / `smoke:ag-work-resume-*` collision risk | prefix recommendation | CI-eligible by default |
| --- | --- | --- | --- | --- | --- |
| `smoke:sidecar-et-trace-pack-fixture-descriptors` | Validate descriptor-only docs/metadata once descriptors exist. | Medium: shares Sidecar smoke namespace; no current script with this exact name. | Low: no AG Resume prefix. | `smoke:` only if implemented as a local boundary smoke; docs-only until then. | No. |
| `smoke:sidecar-et-trace-pack-manifest-validation` | Validate future manifest shape if manifest import is approved. | Medium: mirrors lab naming and shares Sidecar namespace. | Low. | `smoke:` only after manifest scope is approved. | No. |
| `lab:sidecar-et-trace-pack-report` | Generate future reviewer-readable report. | Low: not `smoke:`, but may overlap with lab command vocabulary. | Low. | `lab:` if report remains review-only and non-CI. | No. |
| `lab:sidecar-et-trace-pack-compare` | Compare approved future default-compare packs. | Low: not `smoke:`, but default-compare behavior needs separate review. | Low. | `lab:` unless promoted through a separate gate. | No. |
| `lab:sidecar-et-trace-pack-suite` | Run future report/compare grouping. | Medium: suite names can look like readiness gates. | Low. | `lab:` first; avoid `smoke:` until scope is narrow and approved. | No. |
| `smoke:sidecar-et-trace-pack-matrix` | Future matrix assertions after fixtures are reviewed. | Medium to high: matrix smoke can imply coverage. | Low. | `smoke:` only after explicit approval; docs-only now. | No. |

Any future package script must be reviewed against existing
`smoke:sidecar-et-*`, `ag:resume-*`, and `smoke:ag-work-resume-*` names before
implementation.

## 5. Required Changed-File Boundaries For Future Implementation

Allowed paths by future option:

| option | allowed paths if separately scoped |
| --- | --- |
| descriptor-only docs PR | `docs/SIDECAR_ET_*`, `docs/00_INDEX_LATEST.md`, and existing Sidecar docs cross-links. |
| fixture-only PR | Approved `fixtures/sidecar-et-*` files plus docs describing non-authority boundaries. |
| fixture + validation smoke PR | Approved fixture files, a narrowly named `scripts/smoke-sidecar-et-*` validator, `package.json` only for the approved script entry, and docs. |
| report/compare harness PR | Approved `scripts/report-sidecar-et-*` files, approved report docs, `package.json` only for approved `lab:` scripts, and docs. |
| suite/matrix PR | Approved suite or matrix script files, approved package-script entries, and docs after component smokes already exist. |

Forbidden paths unless separately scoped:

- `lib/db/schema.sql`
- app routes
- components
- runtime snapshot builder
- AG Resume docs/smokes/schema/package entries
- proof/evidence/readiness routes/helpers
- CI workflows
- MCP/App/tool schemas
- Cockpit UI/action behavior
- QP, `z_t`, or proposal-scoring code paths

Any future implementation PR must stop if its changed-file set expands beyond
the approved option.

## 6. AG Resume Bridge Safety Note

Future Sidecar descriptor, fixture, or harness work must prove:

- no calls to `createAgWorkResumeProofEvidenceRecordingFromCandidate`
- no calls to or wrappers around
  `npm run ag:resume-proof-evidence-recording-create`
- no dependency on AG Resume proof/evidence recording writer/helper outputs
- no bridge-table rows
- no `verification_evidence_records` rows
- no `action_records` rows
- no proof/evidence/readiness writes
- no QP evidence or `z_t` commits
- no AG Resume reconciliation/import/mapping/proposal/approval/publication/
  delivery mutation
- no package-script collisions with `ag:resume-*`
- no package-script collisions with `smoke:ag-work-resume-*`
- no weakening of AG Resume proof/evidence bridge or writer/helper gate
  expectations

This plan does not touch `ag_work_resume_proof_evidence_recording_links`, AG
Resume writer/helper gate design docs, the AG Resume proof/evidence recording
writer helper added on `main` by PR #346, AG Resume smoke scripts, package
scripts, or AG Resume runtime flows.

## 7. Browser/Computer-Use Note

Browser/computer-use validation is skipped for this PR because the change is
docs-only. No UI, runtime, API, schema, fixture, manifest JSON, package script,
trace-pack harness, Cockpit action, AG Resume, or browser-facing files are
changed.

Future implementation PRs must use isolated temp DB checks if they are runtime,
UI, or browser-facing, and must confirm:

- Cockpit/Perspective loads when UI is touched.
- Runtime `research_diagnostics.sidecar_e_t.version` remains
  `sidecar_e_t.placeholder.v0.1` unless a separately approved runtime PR
  changes it.
- Runtime `research_diagnostics.sidecar_e_t.status` remains `placeholder` for
  docs/reference/harness planning.
- Runtime `research_diagnostics.sidecar_e_t.computed` remains `false` for
  docs/reference/harness planning.
- Viewing or running diagnostics creates no proof, evidence, readiness, action,
  bridge-table, QP, or `z_t` writes.

## 8. Decision Gate

Before any actual fixture import:

- user/PM chooses exact subset
- routing class is chosen
- validator/smoke names are approved
- browser/computer-use requirement is decided
- AG Resume bridge guards stay green
- runtime placeholder boundary is preserved
- changed-file boundaries are reviewed
- rollback criteria are documented

If any decision is unclear, keep the original repo at docs/reference-only
planning and do not import fixtures, manifest JSON, harness scripts, helper
logic, package scripts, or runtime computation.

Exact descriptor proposal pointer:

- `docs/SIDECAR_ET_TRACE_PACK_EXACT_FIXTURE_DESCRIPTOR_PROPOSAL_V0_1.md`
  records the exact first descriptor subset proposal, deferred descriptor set,
  first two-file fixture import slice, and first manifest routing slice. It
  imports only the approved `example` and `grounded/quiet probes` fixture files,
  a two-entry routing manifest, and focused local validation smokes; it does not
  add report/compare/suite/matrix behavior, helper logic, package scripts
  beyond the approved smokes, thresholds as runtime policy, runtime computation,
  schema/API changes, Cockpit behavior, proof/evidence/readiness writes, QP
  evidence, `z_t` commits, AG Resume bridge/writer/helper behavior, or CI
  enforcement.
- `docs/SIDECAR_ET_TRACE_PACK_STRATEGY_C_FIRST_SLICE_CLOSEOUT_V0_1.md`
  records the docs-only closeout and stop/go decision packet after the approved
  first fixture/manifest slices. It summarizes what validation exists, what
  remains forbidden, how AG Resume proof/evidence recording stays isolated, and
  what gates must be satisfied before any next implementation PR. It does not
  add report/compare/suite/matrix behavior, additional fixtures, package
  scripts, runtime computation, helper logic, schema/API/Cockpit changes,
  proof/evidence/readiness writes, QP evidence, `z_t` commits, AG Resume
  bridge/writer/helper/route behavior, or CI enforcement.
