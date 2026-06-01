# Sidecar e_t Trace-Pack Manifest Appendix v0.1

## 1. Status and Scope

Status:

- original-repo docs-only manifest appendix
- based on merged lab repo evidence from `hynk-studio/augnes-perspective-lab`
- non-authoritative
- not fixture import
- not manifest JSON import
- not harness implementation
- not helper import
- not runtime promotion
- not CI policy

This appendix summarizes lab trace-pack inventory, routing classes, labels, and
future adaptation checks for original-repo review. It does not import lab
fixtures, manifest JSON, trace-pack harness scripts, helper logic, thresholds
as runtime policy, package scripts, runtime computation, schema/API behavior,
Cockpit behavior, QP evidence, `z_t` commits, proof/evidence/readiness writes,
or CI enforcement.

Current original-repo snapshot for this appendix:

| field | value |
| --- | --- |
| repo | `hynk-studio/augnes` |
| remote | `https://github.com/hynk-studio/augnes.git` |
| base branch | `main` |
| original `origin/main` SHA | `50405eab893565d85615005e85f58910518e0ac5` |
| comparison time | 2026-06-02 01:26 KST |
| target branch | `codex/sidecar-et-manifest-appendix-plan` |

The current original-repo runtime boundary remains unchanged:
`PerspectiveSnapshot.research_diagnostics.sidecar_e_t` is a structured
placeholder with `computed=false`.

## 2. Lab Manifest Inventory Snapshot

Lab trace-pack inventory:

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
- no proof/evidence/readiness writes produced by the lab packet

These values are lab observations. They are not runtime policy in
`hynk-studio/augnes`.

## 3. Pack Class Appendix

This appendix describes pack classes only. It does not copy fixture content or
import the lab manifest JSON.

| pack class | purpose | routing class | expected trace count | what reviewers should learn | what must not be inferred |
| --- | --- | --- | ---: | --- | --- |
| example | Canonical v0.1 example pack. | `default_compare` | 1 | Basic trace-pack shape and a small recovered-validation example. | Not coverage, not product readiness, not runtime behavior. |
| curated | First curated anonymized v0.1 batch. | `default_compare` | 5 | Baseline compare behavior for a small mixed pack. | Not a complete benchmark and not policy for label decisions. |
| surprising probes | Explicit-only surprising-case probe pack. | `explicit_only` | 3 | Cases that should stay visible as review hints instead of default compare inputs. | Not evidence of runtime surprising-case detection. |
| medium-tension probes | Explicit-only medium tension priority probe pack. | `explicit_only` | 4 | Medium tension behavior and priority ordering questions. | Not a runtime threshold or Gate/SRF rule. |
| recovery-policy probes | Explicit-only recovery-like policy probe pack. | `explicit_only` | 5 | Recovery-like behavior, high-evidence recovery, and history-blocked ambiguity. | Not proof/evidence/readiness status and not recovery policy. |
| low-evidence-boundary probes | Explicit-only low-evidence recovery boundary probe pack. | `explicit_only` | 5 | Low-evidence recovery ambiguity and threshold sensitivity. | Not threshold runtime configuration. |
| grounded/quiet probes | Explicit-only grounded versus quiet boundary probe pack. | `explicit_only` | 5 | Grounded versus quiet fallback boundaries and `surprising_cases=0` in the lab baseline. | Not product-ready copy and not runtime fallback policy. |
| stress | Explicit-only stress trace pack for offline candidate bounds. | `explicit_only` | 7 | Stress behavior under dense or high-volume trace slices. | Not performance coverage, CI policy, or runtime acceptance criteria. |

The two `default_compare` packs are useful for compact report comparison. The
six `explicit_only` packs are review-focused and should not be silently pulled
into default comparison or CI behavior.

## 4. Label Behavior Appendix

The labels below summarize lab-report behavior only. The original repo cannot
treat any label as runtime policy through this appendix.

| label | lab meaning | observed contexts | productization risk | original repo runtime policy |
| --- | --- | --- | --- | --- |
| `quiet` | Low activity or low priority context with no strong evidence pressure. | Quiet fallback and some default-recovery-like medium tension cases. | Can hide ambiguity if presented as "all clear." | No. |
| `grounded` | Sparse or stable context with enough grounding to avoid uncertainty. | Grounded/quiet probes, low evidence without visible prior instability. | Can overstate support if users read it as proof. | No. |
| `evidence_supported` | Recovery-like or high-evidence context where the lab candidate sees support. | Strong recovery, resolved medium tension, sparse high-evidence recovery. | Can be mistaken for proof, Evidence status, or publication readiness. | No. |
| `dense_loop` | Dense repeated activity or loop-like pressure in the lab candidate vocabulary. | Dense or high-volume trace slices and stress-style review contexts. | Can be confused with the implemented `loopness_hint` or an action gate. | No. |
| `tension_loaded` | Open tension remains significant enough to dominate the lab candidate label. | Strong tension, some medium tension, high evidence with open tension. | Can be mistaken for a Gate/SRF block, rejection, or priority rule. | No. |
| `history_blocked` | Recent negative history or prior instability remains salient. | Latest-negative recovered context and recovery-like traces with recent negative pressure. | Can be mistaken for a commit/reject decision. | No. |
| `uncertain_context` | Evidence is too thin or ambiguous for confident lab labeling. | Low-evidence latest-positive recovery with visible prior instability. | Can become vague product copy or a hidden fallback policy. | No. |

All labels remain lab review vocabulary. They are not `sidecar_e_t.computed=true`
signals, QP evidence, `z_t` commits, proof/evidence/readiness records,
Gate/SRF/proposal scoring, Cockpit action inputs, schema/API fields, or CI
requirements.

## 5. Future Adaptation Checklist

Before any fixture, manifest, or harness import, reviewers must:

- refresh lab evidence
- refresh original repo SHA
- compare docs, runtime, package-script, schema, and AG Resume drift
- decide exact pack subset
- decide explicit-only versus default routing
- decide package script names
- decide validation commands
- confirm no AG Resume bridge-table writes
- confirm no proof/evidence/readiness/action/QP/`z_t` writes
- confirm no package-script collision
- confirm no helper logic or runtime computation is imported accidentally
- confirm browser/computer-use requirements if any UI or runtime files change

If any decision is unclear, keep the original repo at docs/reference-only
alignment and do not import lab fixtures, manifest JSON, or harness scripts.

Fixture-boundary design pointer:

- `docs/SIDECAR_ET_TRACE_PACK_FIXTURE_BOUNDARY_DESIGN_V0_1.md` records the
  docs-only boundary design that should be reviewed before any fixture import.
  It does not import fixtures, manifest JSON, harness scripts, helper logic,
  package scripts, runtime computation, schema/API changes, proof/evidence/
  readiness writes, QP evidence, `z_t` commits, AG Resume bridge behavior, or
  CI enforcement.
- `docs/SIDECAR_ET_TRACE_PACK_FIXTURE_DESCRIPTOR_VALIDATION_PLAN_V0_1.md`
  records docs-only descriptor candidates and validation naming proposals before
  any fixture import. It does not import fixtures, manifest JSON, harness
  scripts, helper logic, package scripts, runtime computation, schema/API
  changes, proof/evidence/readiness writes, QP evidence, `z_t` commits, AG
  Resume bridge behavior, or CI enforcement.
- `docs/SIDECAR_ET_TRACE_PACK_EXACT_FIXTURE_DESCRIPTOR_PROPOSAL_V0_1.md`
  records the docs-only exact first descriptor subset proposal and deferred
  descriptor set before any fixture import. It does not import fixtures,
  manifest JSON, harness scripts, helper logic, package scripts, runtime
  computation, schema/API changes, proof/evidence/readiness writes, QP
  evidence, `z_t` commits, AG Resume bridge/writer/helper behavior, or CI
  enforcement.

## 6. AG Resume Bridge Safety Note

PR #341 added the empty schema table
`ag_work_resume_proof_evidence_recording_links`. This appendix does not touch
that table, `lib/db/schema.sql`, AG Resume docs, AG Resume smoke scripts,
package scripts, or AG Resume runtime flows.

Future Sidecar harness work must prove:

- it creates no `ag_work_resume_proof_evidence_recording_links` rows
- it creates no `verification_evidence_records` rows
- it creates no `action_records` rows
- it records no proof/evidence/readiness
- it creates no QP evidence
- it commits no `z_t`
- it preserves `ag:resume-*` package-script flows
- it preserves `smoke:ag-work-resume-*` package-script flows
- it does not weaken AG Resume proof/evidence bridge guard expectations

Current original `main` also includes AG Resume proof/evidence writer-helper
gate design docs from PR #343. This appendix does not modify those docs or
authorize Sidecar harness overlap with AG Resume proof/evidence recording.

## 7. Browser/Computer-Use Note

Browser/computer-use validation is skipped for this PR because the change is
docs-only. No UI, runtime, API, schema, fixture, manifest JSON, package script,
trace-pack harness, or Cockpit action files are changed.

Future UI, runtime, or harness PRs must use isolated temp DB checks if they are
browser-facing or runtime-facing, and must confirm:

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
- Product wording remains non-authoritative.
