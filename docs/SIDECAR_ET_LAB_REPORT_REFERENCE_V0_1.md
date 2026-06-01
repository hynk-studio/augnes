# Sidecar e_t Lab Report Reference v0.1

## 1. Status and Scope

Status:

- original-repo docs-only lab-report reference
- based on merged lab repo evidence from `hynk-studio/augnes-perspective-lab`
- non-authoritative
- not runtime promotion
- not helper or harness import
- not CI policy

This document imports no lab code, fixtures, trace-pack harnesses, helper
logic, package scripts, thresholds as runtime policy, runtime computation,
schema/API behavior, Cockpit action behavior, QP evidence, `z_t` commits,
proof/evidence/readiness writes, Gate/SRF/proposal scoring, Claim confidence,
Evidence status, publication readiness, MCP/App/tool schemas, or CI
enforcement.

It exists so original-repo reviewers can inspect the merged lab evidence trail
without treating lab outputs as original-repo runtime behavior.

## 2. Lab Evidence Source

Merged lab evidence references:

| Source | Scope | Merge commit |
| --- | --- | --- |
| [lab PR #52 grounded/quiet probes](https://github.com/hynk-studio/augnes-perspective-lab/pull/52) | Added explicit-only grounded/quiet probe pack and baseline. | `46007407a585afb8484277b84e87a97146a8b6c6` |
| [lab PR #50 lab findings](https://github.com/hynk-studio/augnes-perspective-lab/pull/50) | Summarized lab findings, thresholds, ambiguity, and original-repo readiness. | `f45d6115f7b5c24ac1617eeb4d8991cc641d8e93` |
| [lab PR #51 application packet/product bridge](https://github.com/hynk-studio/augnes-perspective-lab/pull/51) | Added application packet, product bridge wording, runtime decision draft, and browser validation summary. | `4c0565575a4120fa7120826d73f53af5fe5711bc` |
| [lab PR #54 upstream dry-run packet](https://github.com/hynk-studio/augnes-perspective-lab/pull/54) | Added upstream strategy ladder, portability classification, seam checklist, data package, and decision gate. | `66ab48a8a680f569b7561462b7999203f05ed7e7` |
| [original PR #338 upstream alignment](https://github.com/hynk-studio/augnes/pull/338) | Added original-repo docs-only Strategy A alignment pointer. | `2e928e84cf517333d92715251e11979ab76aea51` |

The current local original-repo alignment pointer is
`docs/SIDECAR_ET_LAB_UPSTREAM_ALIGNMENT_V0_1.md`.

## 3. Reference Baseline

Lab trace-pack inventory:

| field | value |
| --- | ---: |
| manifest packs | 8 |
| total manifest traces | 35 |
| default compare packs | 2 |
| explicit-only packs | 6 |
| probe packs | 5 |
| stress packs | 1 |

Grounded/quiet baseline:

| field | value |
| --- | ---: |
| grounded/quiet trace count | 5 |
| grounded traces | 3 |
| quiet traces | 2 |
| `surprising_cases` | 0 |

Observed lab thresholds:

| threshold | observed lab value |
| --- | ---: |
| strong tension | 0.65 |
| medium tension | 0.5 |
| low evidence recovery | 0.35 |

Runtime boundary observed through the lab evidence:

- runtime `sidecar_e_t` placeholder preserved
- runtime `sidecar_e_t.computed=false` preserved
- lab commands did not promote runtime Sidecar e_t computation
- lab commands did not create QP evidence or commit `z_t`

These values are lab-report observations. They are not runtime policy in
`hynk-studio/augnes`.

## 4. Findings Summary

Strong tension behavior:

- Strong tension is anchored in the lab reports at `tension_axis >= 0.65`.
- Strong tension can produce `tension_loaded` even when evidence is high and
  loop pressure is visible.
- Dense high-tension and sparse high-tension slices can both resolve to
  `tension_loaded`.
- High evidence with strong open tension remains a review hint, not a runtime
  decision.

Medium tension behavior:

- Medium tension is surfaced in the lab reports at `tension_axis >= 0.5`.
- A medium-tension high-evidence drift probe resolves to `tension_loaded` in
  the lab evidence.
- High-evidence recovery with resolved or lower open tension can still resolve
  to `evidence_supported`.
- Default-recovery-like medium tension resolving to `quiet` remains a review
  question, not policy.

Recovery behavior:

- Strong evidence recovery-like traces usually resolve to
  `evidence_supported`.
- Clean recovery, resolved medium tension, open medium tension with high
  recovery evidence, and sparse high-evidence context resolve to
  `evidence_supported` in the lab recovery probes.
- Recent negative pressure can still move recovery-like slices toward
  `history_blocked`.
- Flapping can be hidden by evidence-supported labels and remains a product
  review question.

Low-evidence recovery behavior:

- Low-evidence latest-positive recovery with visible prior instability resolves
  to `uncertain_context`, not `quiet`.
- The lab low-evidence recovery rule activates below the observed `0.35`
  evidence threshold when the latest activity is positive, strong tension is
  absent, and prior instability is visible.
- Low evidence without visible prior instability can resolve to `grounded`,
  which remains a label review question.

Grounded/quiet baseline:

- Five explicit-only grounded/quiet probes are present in the lab baseline.
- Three resolve to `grounded`.
- Two resolve to `quiet`.
- The pack reports `surprising_cases=0`.
- This clarifies the current lab fallback boundary but does not prove the
  labels are product-ready.

Known ambiguous or review-hint cases:

- high evidence with strong open tension
- latest negative recovered context
- flapping evidence-supported
- dense high-volume stress
- default-recovery-like medium tension
- low-evidence boundary above the current threshold
- low evidence without prior instability
- low-stability recovery
- medium-tension low evidence below priority threshold
- explicit-only ambiguity staying outside default compare

## 5. What Original Reviewers Should Use This For

Use this document as:

- review context for the merged lab evidence trail
- planning input for a future Strategy C trace-pack/report harness adaptation
- companion context for
  `docs/SIDECAR_ET_TRACE_PACK_HARNESS_ADAPTATION_PLAN_V0_1.md`
- input for a future runtime log-only decision packet
- product copy and non-authority wording reference
- a checklist of lab ambiguities to keep visible during review

This document is not a substitute for rerunning or adapting lab validation in a
future scoped PR.

## 6. What Original Reviewers Must Not Infer

Do not infer:

- runtime Sidecar e_t computation
- `sidecar_e_t.computed=true`
- QP evidence
- `z_t` commit
- proof/evidence/readiness creation
- Gate/SRF/proposal scoring
- Claim confidence changes
- Evidence status changes
- publication readiness changes
- Cockpit action input
- schema/API changes
- threshold runtime policy
- CI requirement
- helper or harness approval
- fixture import approval

Runtime `PerspectiveSnapshot.research_diagnostics.sidecar_e_t` remains the
structured placeholder with `computed=false` unless a separately scoped future
PR changes it.

## 7. Drift and Refresh Note

Original repo snapshot for this PR:

| field | value |
| --- | --- |
| repo | `hynk-studio/augnes` |
| remote | `https://github.com/hynk-studio/augnes.git` |
| base branch | `main` |
| original `origin/main` SHA | `2e928e84cf517333d92715251e11979ab76aea51` |
| comparison time | 2026-06-02 00:11 KST |
| target branch | `codex/sidecar-et-lab-report-reference-import` |

Refresh requirements:

- Refresh lab evidence before any Strategy C harness adaptation.
- Refresh lab evidence before any Strategy D runtime log-only decision packet.
- Refresh lab evidence before any Strategy E runtime implementation proposal.
- Re-check original `PerspectiveSnapshot`, `research_diagnostics`, Cockpit, API,
  schema, and package-script drift before any non-docs-only work.
- Preserve original-only `ag:resume-*` and `smoke:ag-work-resume-*` flows.

This PR does not change package scripts or original-only AG Resume flows.

## 8. Browser/Computer-Use Note

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
