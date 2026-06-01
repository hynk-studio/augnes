# Sidecar e_t Trace-Pack Exact Fixture Descriptor Proposal v0.1

## 1. Status and Scope

Status:

- original-repo docs-only exact descriptor proposal
- final Strategy C planning step before any fixture-import decision
- non-authoritative
- not fixture import
- not manifest JSON import
- not harness implementation
- not helper import
- not runtime promotion
- not CI policy

This document proposes the exact synthetic descriptor subset that should be
reviewed before deciding whether a future original-repo implementation PR should
import any Sidecar e_t trace-pack fixture files at all. It imports no fixture
data, manifest JSON, trace-pack harness scripts, helper logic, thresholds as
runtime policy, package scripts, runtime computation, schema/API behavior,
Cockpit behavior, QP evidence, `z_t` commits, proof/evidence/readiness writes,
AG Resume bridge-table behavior, AG Resume writer/helper behavior, or CI
enforcement.

Current original-repo snapshot for this proposal:

| field | value |
| --- | --- |
| repo | `hynk-studio/augnes` |
| remote | `https://github.com/hynk-studio/augnes.git` |
| base branch | `main` |
| original `origin/main` SHA | `fb11a0882245e584048059e2ffcab95cd42b5fa6` |
| comparison time | 2026-06-02 02:57 KST, refreshed after PR #352 |
| target branch | `codex/sidecar-et-first-manifest-routing` |

Runtime `PerspectiveSnapshot.research_diagnostics.sidecar_e_t` remains a
structured placeholder with `computed=false`.

First implementation slice status:

- imported `fixtures/sidecar-et-trace-pack.example.json`
- imported `fixtures/sidecar-et-trace-pack.grounded-quiet-probes-v0.1.json`
- added `fixtures/sidecar-et-trace-pack.manifest.json` with exactly those two
  packs
- added `npm run smoke:sidecar-et-trace-pack-fixture-descriptors`
- added `npm run smoke:sidecar-et-trace-pack-manifest`
- did not include curated, surprising, medium-tension, recovery-policy,
  low-evidence-boundary, stress, or any unimported fixture
- did not add report, compare, suite, or matrix behavior
- did not add runtime computation, helper logic, API/schema/Cockpit changes, AG
  Resume writer/helper calls, bridge-table rows, QP evidence, `z_t` commits,
  proof/evidence/readiness writes, or CI enforcement

## 2. Proposed First Descriptor Subset

Recommend only these two descriptor ids for any first future review subset:

| descriptor id | source lab pack | intended future treatment | why chosen | expected review value | what must not be inferred |
| --- | --- | --- | --- | --- | --- |
| `sidecar_et_descriptor.example.v0.1` | `sidecar-et-trace-pack.example.json` | docs-only descriptor now; future fixture candidate only after separate user/PM approval; future default-compare treatment only after separate review | Smallest canonical pack and lowest-cardinality shape check. | Lets reviewers inspect descriptor metadata, naming, and future validation boundaries with minimal ambiguity. | Not fixture import, not manifest import, not coverage, not default compare approval, not runtime behavior. |
| `sidecar_et_descriptor.grounded_quiet_probes.v0.1` | `sidecar-et-trace-pack.grounded-quiet-probes-v0.1.json` | docs-only descriptor now; future explicit-only fixture candidate only after separate user/PM approval | Small explicit-only fallback-boundary pack with 5 traces, grounded 3, quiet 2, and `surprising_cases=0` in the lab baseline. | Lets reviewers inspect grounded/quiet wording and fallback-boundary risk without importing tension, recovery, or stress packs. | Not product-ready fallback policy, not runtime label behavior, not QP evidence, not `z_t`, not proof/evidence/readiness. |

The original descriptor subset proposal was non-authoritative planning only.
The current implementation slices copy only the approved fixture files and the
two-entry routing manifest listed above, with local validation smokes. They do
not approve report output, compare logic, suite/matrix behavior, helper
functions, runtime computation, CI enforcement, or additional fixture packs.

The first implementation slice imports only these two approved fixture files
plus a focused descriptor validation smoke and a focused manifest routing
smoke. It does not change the deferred descriptor set or authorize any
additional fixture pack.

## 3. Deferred Descriptor Set

Defer these six descriptors from any first fixture-import decision:

| deferred descriptor | source lab pack | why deferred | extra decision needed before import |
| --- | --- | --- | --- |
| `sidecar_et_descriptor.curated.v0.1` | `sidecar-et-trace-pack.curated-v0.1.json` | Curated baseline can look like coverage or default benchmark authority. | Decide whether default-compare behavior is acceptable and how reviewers will prevent benchmark/readiness inference. |
| `sidecar_et_descriptor.surprising_probes.v0.1` | `sidecar-et-trace-pack.surprising-probes-v0.1.json` | Surprising-case review hints can be mistaken for runtime detection. | Decide whether explicit-only surprising-case wording is useful without implying product behavior. |
| `sidecar_et_descriptor.medium_tension_probes.v0.1` | `sidecar-et-trace-pack.medium-tension-probes-v0.1.json` | Medium-tension probes are threshold-sensitive. | Decide how to preserve threshold-as-observation wording and avoid Gate/SRF/proposal-scoring inference. |
| `sidecar_et_descriptor.recovery_policy_probes.v0.1` | `sidecar-et-trace-pack.recovery-policy-probes-v0.1.json` | Recovery-like cases can be confused with proof/evidence/readiness or policy state. | Decide whether recovery review value outweighs proof/evidence/readiness authority risk. |
| `sidecar_et_descriptor.low_evidence_boundary_probes.v0.1` | `sidecar-et-trace-pack.low-evidence-boundary-probes-v0.1.json` | Low-evidence recovery cases are threshold-sensitive and easy to overread. | Decide whether low-evidence threshold observations can stay docs/report-only. |
| `sidecar_et_descriptor.stress.v0.1` | `sidecar-et-trace-pack.stress-v0.1.json` | Stress contexts carry the highest coverage, performance, and CI-authority risk. | Decide explicit stress scope, non-CI wording, and rollback rules before any import. |

None of the deferred descriptors should be imported by default, folded into a
first implementation PR, or treated as required validation coverage without a
separate scoped review.

## 4. Exact Descriptor Fields

The following fields define descriptor metadata only. They are not runtime
schema, API fields, DB columns, MCP/App/tool schema, Cockpit display contract,
fixture JSON, manifest JSON, or report output.

| field | descriptor metadata meaning |
| --- | --- |
| `descriptor_id` | Stable docs-only planning id for the review unit. |
| `source_lab_pack` | Lab pack filename used as review provenance, not copied fixture data. |
| `source_lab_pr` | Lab PR used as provenance for this descriptor metadata. |
| `source_lab_merge_commit` | Lab merge commit used as provenance for this descriptor metadata. |
| `pack_class` | Review class from the manifest appendix, such as `example` or `grounded/quiet probes`. |
| `proposed_routing` | Proposed future routing class, such as `future default-compare candidate` or `future explicit-only fixture candidate`. |
| `expected_trace_count` | Lab-observed count for planning review only. |
| `review_goal` | Narrow reviewer question the descriptor is meant to answer. |
| `non_authority_boundary` | What reviewers must not infer from the descriptor. |
| `future_validation_required` | Checks required before any separate implementation PR may import fixtures. |

Exact proposed descriptor metadata:

| descriptor_id | source_lab_pack | source_lab_pr | source_lab_merge_commit | pack_class | proposed_routing | expected_trace_count | review_goal | non_authority_boundary | future_validation_required |
| --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- |
| `sidecar_et_descriptor.example.v0.1` | `sidecar-et-trace-pack.example.json` | lab PR #54 upstream dry-run packet | `66ab48a8a680f569b7561462b7999203f05ed7e7` | example | future default-compare candidate only after separate review | 1 | Confirm descriptor metadata, file naming, and minimal fixture-safety expectations before any import. | Does not authorize default compare behavior, runtime computation, coverage, manifest import, package scripts, or CI. | Refresh lab evidence, refresh original SHA, approve exact fixture content, approve validation names, run boundary smokes, preserve placeholder runtime. |
| `sidecar_et_descriptor.grounded_quiet_probes.v0.1` | `sidecar-et-trace-pack.grounded-quiet-probes-v0.1.json` | lab PR #52 grounded/quiet probes | `46007407a585afb8484277b84e87a97146a8b6c6` | grounded/quiet probes | future explicit-only fixture candidate only after separate review | 5 | Review grounded/quiet fallback-boundary labels without importing tension, recovery, or stress behavior. | Does not authorize product fallback policy, runtime labels, `sidecar_e_t.computed=true`, proof/evidence/readiness, QP evidence, or `z_t`. | Refresh lab grounded/quiet baseline, verify synthetic fixture boundaries, approve explicit-only routing, run boundary smokes, preserve AG Resume writer/helper isolation. |

Descriptor metadata may be used for review discussion. It must not be consumed by
runtime code or treated as an implementation source of truth.

## 5. Future Fixture Import Gate

Before any additional fixture file import beyond the approved first subset:

- user/PM confirms the exact subset
- descriptor metadata is rechecked against the current lab repo
- original repo SHA is refreshed
- validation names are approved
- package script changes are separately scoped
- AG Resume bridge/writer/helper calls remain forbidden
- runtime `sidecar_e_t` placeholder is preserved
- fixture content is verified synthetic and low-cardinality
- import paths and rollback criteria are reviewed

If any gate is unclear, keep the original repo at docs/reference-only planning
and do not import more fixture files, broaden manifest routing, add harness
scripts, helper logic, package scripts, or runtime computation.

## 6. AG Resume Writer/Helper Safety Note

Future Sidecar descriptor, fixture, or harness work must not:

- call `createAgWorkResumeProofEvidenceRecordingFromCandidate`
- call or wrap `npm run ag:resume-proof-evidence-recording-create`
- depend on AG Resume proof/evidence recording writer/helper outputs
- create bridge-table rows
- create `verification_evidence_records`
- create `action_records`
- record proof/evidence/readiness
- create QP evidence
- commit `z_t`

This proposal does not touch `ag_work_resume_proof_evidence_recording_links`,
`verification_evidence_records`, `action_records`, AG Resume writer/helper
files, AG Resume docs, AG Resume smoke scripts, package scripts, schema files,
or AG Resume runtime flows.

## 7. Browser/Computer-Use Note

Browser/computer-use validation is skipped for this PR because the change is
docs-only. No UI, runtime, API, schema, fixture, manifest JSON, package script,
trace-pack harness, Cockpit action, AG Resume, or browser-facing files are
changed.

Future runtime, UI, or browser-facing PRs must use isolated temp DB checks and
confirm:

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
