# Sidecar e_t Lab Upstream Alignment v0.1

## 1. Status and Scope

Status:

- original-repo docs-only alignment
- based on lab evidence from `hynk-studio/augnes-perspective-lab`
- non-authoritative
- not runtime promotion
- not implementation
- not CI policy

This document is a compact pointer for the first safe upstream alignment from
the Sidecar e_t lab work into `hynk-studio/augnes`. It does not port lab helper
logic, trace-pack harnesses, fixtures, runtime computation, threshold policy,
schema/API behavior, Cockpit action behavior, QP evidence, `z_t` commits,
proof/evidence/readiness writes, Gate/SRF/proposal scoring, Claim confidence,
Evidence status, publication readiness, or CI enforcement.

The current original-repo runtime boundary remains unchanged:
`PerspectiveSnapshot.research_diagnostics.sidecar_e_t` is a structured
placeholder with `computed=false`.

## 2. Lab Evidence Pointer

The lab repo `hynk-studio/augnes-perspective-lab` has a merged Sidecar e_t lab
evidence baseline. This original-repo document references that baseline only as
review context.

Lab baseline:

- 8 manifest packs / 35 total manifest traces
- 2 default compare packs
- 6 explicit-only packs
- 5 probe packs
- grounded/quiet probes: 5 traces, grounded 3, quiet 2, `surprising_cases=0`
- thresholds observed in lab reports:
  - `strong_tension_axis_threshold = 0.65`
  - `medium_tension_axis_threshold = 0.5`
  - `low_evidence_recovery_evidence_axis_threshold = 0.35`
- runtime `sidecar_e_t` placeholder and `computed=false` preserved

Lab PR references:

| Lab PR | Merged evidence | Merge commit |
| --- | --- | --- |
| [#52 grounded/quiet probes](https://github.com/hynk-studio/augnes-perspective-lab/pull/52) | Added explicit-only grounded/quiet probe pack and baseline. | `46007407a585afb8484277b84e87a97146a8b6c6` |
| [#50 lab findings](https://github.com/hynk-studio/augnes-perspective-lab/pull/50) | Summarized current lab findings, ambiguity, thresholds, and original-repo readiness. | `f45d6115f7b5c24ac1617eeb4d8991cc641d8e93` |
| [#51 application packet/product bridge](https://github.com/hynk-studio/augnes-perspective-lab/pull/51) | Added original application packet, product bridge wording, runtime decision draft, and browser validation summary. | `4c0565575a4120fa7120826d73f53af5fe5711bc` |
| [#54 upstream dry-run packet](https://github.com/hynk-studio/augnes-perspective-lab/pull/54) | Added upstream strategy ladder, portability classification, seam checklist, data package, and decision gate. | `66ab48a8a680f569b7561462b7999203f05ed7e7` |

These lab thresholds and labels are observations from lab reports. They are not
runtime policy in this repo.

## 3. Original Repo Boundary

The original repo boundary remains:

- runtime `PerspectiveSnapshot.research_diagnostics.sidecar_e_t` must remain a
  placeholder unless a separately scoped PR changes it
- no runtime Sidecar e_t computation
- no QP evidence
- no `z_t` commit
- no proof/evidence/readiness writes
- no Gate/SRF/proposal scoring
- no Claim confidence change
- no Evidence status change
- no publication readiness change
- no Cockpit action input
- no schema/API changes
- no MCP/App/tool schema changes
- no helper logic changes
- no fixture or trace-pack harness port
- no threshold change or runtime threshold policy
- no package script or CI workflow change

The relevant current docs already define this boundary:

- `docs/PERSPECTIVE_SNAPSHOT_V0_1.md`
- `docs/COCKPIT_PERSPECTIVE_IA_V0_1.md`
- `docs/SIDECAR_ET_DIAGNOSTIC_DESIGN_V0_1.md`
- `docs/SIDECAR_ET_RUNTIME_LOG_ONLY_DESIGN_V0_1.md`
- `docs/SIDECAR_ET_RUNTIME_IMPLEMENTATION_CHECKLIST_V0_1.md`

## 4. Future Upstream Strategy Ladder

| Strategy | Scope | Status after this PR |
| --- | --- | --- |
| Strategy A: docs-only alignment | Add original-repo documentation pointer and index link. | This PR. |
| Strategy B: lab-report reference import | Reference selected lab reports or PR-body evidence without helper/harness import. | Future candidate strategy requiring separate review. |
| Strategy C: trace-pack/report harness adaptation | Adapt lab fixtures, manifest, report, compare, suite, or matrix commands. | Future scoped PR only. |
| Strategy D: runtime log-only candidate | Add a non-authoritative runtime `log_only` candidate surface. | Requires explicit user/PM decision and separate implementation gates. |
| Strategy E: full runtime implementation | Implement runtime Sidecar e_t behavior beyond a display-only candidate. | Out of scope unless separately approved. |

This PR chooses Strategy A only.

Strategy B reference pointer:

- `docs/SIDECAR_ET_LAB_REPORT_REFERENCE_V0_1.md` records the docs-only
  lab-report reference import for original-repo reviewers. It does not import
  helper logic, trace-pack harnesses, fixtures, thresholds as runtime policy,
  runtime computation, schema/API changes, Cockpit action behavior, QP
  evidence, `z_t` commits, proof/evidence/readiness writes, package scripts, or
  CI enforcement.

## 5. Drift Checklist

Original repo snapshot for this PR:

| field | value |
| --- | --- |
| repo | `hynk-studio/augnes` |
| remote | `https://github.com/hynk-studio/augnes.git` |
| base branch | `main` |
| original `origin/main` SHA | `a0c349d4b08b42fb9d3fced495d8b3d33ec286a6` |
| comparison time | 2026-06-02 00:02 KST |
| target branch | `codex/sidecar-et-docs-only-upstream-alignment` |

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

Relevant runtime/UI/package paths inspected read-only:

- `lib/perspective/snapshot.ts`
- `app/api/perspective/snapshot/route.ts`
- `components/augnes-cockpit.tsx`
- `package.json`

What this PR does not change:

- runtime code
- helper logic
- package scripts
- fixtures
- trace-pack harness scripts
- thresholds
- API routes
- DB schema/migrations
- MCP/App/tool schemas
- Cockpit UI or action behavior
- CI workflows

Original-only product/runtime paths preserved:

- `ag:resume-*` package scripts are untouched.
- `smoke:ag-work-resume-*` package scripts are untouched.
- AG Work Resume docs, helpers, routes, schema designs, proof/evidence
  reconciliation docs, and Cockpit panels are untouched.

## 6. Browser/Computer-Use

Browser/computer-use validation is skipped for this PR because the change is
docs-only. No UI, runtime, API, schema, fixture, package script, or Cockpit
action file changes.

If a future PR touches UI or runtime behavior, run browser/computer-use checks
with an isolated temp DB and confirm:

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
- Product wording remains non-authoritative: review context only, not actual
  Sidecar state, not proof/evidence, not QP, not `z_t`, and not readiness.
