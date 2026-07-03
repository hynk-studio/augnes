# Agent Workplane Native Absorption Map v0.1

## Status And Scope

Status: Agent Workplane Native Absorption Map v0.1.

Scope: static mapping only. This document maps useful legacy Cockpit
capabilities into native Agent Workplane panels/nodes, native State Proposal
Review rows, blocked-authority classifications, or delete classifications. It
does not implement GuideBrief debug behavior,
GuideBrief intent projection, a Workplane node/panel contract, runner behavior,
Runner / DeltaBatch Workplane integration, or external actuation. It adds no
provider/OpenAI calls, no GitHub execution, no Codex execution, no durable
memory apply, and no Perspective apply.

Legacy Cockpit was removed only after native replacement and validation existed.
Cockpit Route Removal v0.1 removed `/cockpit`,
`components/augnes-cockpit.tsx`, and the Workplane compatibility pointer after
zero-count readiness.

Runner / Workplane Metrics v0.1 is the read-only measurement layer before any
Legacy Cockpit Shrink Plan. It is documented in
`docs/AUGNES_WORKFLOW_METRICS_V0_1.md` and treats Cockpit absorption readiness
as a signal only. It adds no Legacy Cockpit deletion, shrink, execution
authority, runner behavior, DB write, proof/evidence write, durable memory
apply, Perspective apply, or delta auto-apply.

Legacy Cockpit Shrink Plan v0.1 is documented in
`docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md`. It consumes this
absorption map as replacement context and defines gates for future review. It
is not a deletion or shrink slice: no compatibility path is removed, no UI
behavior changes, and future removal requires a separate PR with browser
regression, rollback coverage, metrics/dogfood evidence, and explicit human
approval.

Agent Workplane Bridge Trace Detail v0.1 is documented in
`docs/AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md`. It improves native Source
Ref Bridge / Trace Bridge absorption with read-only bridge rows, source ref
kind classification, validation summary detail, evidence refs, diagnostic
refs, gap details, and browser-regression-visible markers. It does not delete,
shrink, hide, or disable Legacy Cockpit content and does not authorize a
shrink candidate.

Agent Workplane Review / Memory Proposal Detail v0.1 is documented in
`docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md`. It improves native
Review / memory proposal visibility with a read-only `review_memory_detail`
panel, durable memory review candidate lanes, Perspective review candidate
lanes, validation-required and user-decision lanes, source refs, explicit
no-apply boundaries, gap details, and browser-regression-visible markers. It
does not apply durable memory, apply Perspective, auto-apply deltas, delete,
shrink, hide, or disable Legacy Cockpit content, or authorize a shrink
candidate.

Agent Workplane Run Postmortem Detail v0.1 is documented in
`docs/AGENT_WORKPLANE_RUN_POSTMORTEM_DETAIL_V0_1.md`. It improves native
Work/run visibility with a read-only `run_postmortem` panel, source-backed run
summaries, step refs, event refs, recovered DeltaBatch summaries, validation
status, source refs, no-runner-authority boundaries, gap details, and
browser-regression-visible markers. It does not execute runners, tick runners,
recover DeltaBatches, schedule runners, apply durable memory, apply
Perspective, auto-apply deltas, delete, shrink, hide, or disable Legacy
Cockpit content, or authorize a shrink candidate.

The active Run Postmortem panel is now the read-only Run Postmortem Detail
panel; the stable `run_postmortem` panel identity is retained.

Legacy Cockpit Local UI Control Classification v0.1 is documented in
`docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md`.
It classifies retained Legacy Cockpit controls into read-only visibility,
copy/export, preview/local-draft, local-write, forbidden, compatibility-only,
and unknown/manual-review buckets before any shrink candidate. It is
evidence/signaling only, not shrink authority. Local-write controls require a
separate authority contract before any native absorption.

## Baseline Native Absorption Map

| legacy_capability | inventory_capability_id | native_target | retained_compatibility_path | absorption_status | validation_coverage | next_step |
| --- | --- | --- | --- | --- | --- | --- |
| Work Brief | work_brief | Work Queue / Current Objective | Removed in Cockpit Route Removal v0.1 after native Work Queue coverage and zero-count readiness | partial native replacement exists | `smoke:agent-workplane-shell-v0-1`; `smoke:agent-workplane-panels-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1`; `smoke:agent-workplane-legacy-cockpit-shrink-v0-1` | Define exact Work Brief node fields in Agent Workplane Node / Panel Contract v0.1. |
| Handoff | handoff | Handoff Builder / Handoff Capsule / Codex packet panel | Removed in Cockpit Route Removal v0.1; copy/export review is represented natively where safe | partial native replacement exists | `smoke:agent-workplane-projection-handoff-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Keep copy/send/execution separation explicit after native review migration. |
| Perspective | perspective | Current Perspective / Perspective Delta / Timeline context | Removed in Cockpit Route Removal v0.1; Perspective review and manual preview rows are native or blocked | partial native replacement exists | `smoke:agent-workplane-panels-v0-1`; `smoke:agent-workplane-projection-handoff-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Absorb read-only context first; keep local preview controls represented as native review rows or blocked until authority exists. |
| Bridge | bridge | Source Ref Bridge / Trace Bridge | Removed in Cockpit Route Removal v0.1; Source Ref Bridge / Trace Bridge carry native read-only coverage | partial native replacement exists | `smoke:agent-workplane-bridge-trace-detail-v0-1`; `smoke:workplane-native-browser-regression-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Route removal readiness verified no useful Bridge capability remained Cockpit-only. |
| Operator visibility | operator_visibility | Authority / Validation / Debug Inspector | Removed in Cockpit Route Removal v0.1; operator visibility is native and local-write controls are blocked | partial native replacement exists | `smoke:agent-workplane-panels-v0-1`; `smoke:agent-workplane-cleanup-hardening-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Split read-only operator visibility from local-write controls in the next contract. |
| Runner outputs | runner_outputs | Runner State / DeltaBatch panel plus Run Postmortem Detail | Runner ledger helpers and `smoke:autonomy-runner-v0-1`; no legacy Cockpit runner panel is deleted | partial native replacement exists | `smoke:autonomy-runner-v0-1`; `smoke:workplane-runner-deltabatch-integration-v0-1`; `smoke:agent-workplane-run-postmortem-detail-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Keep runner output visibility read-only; repeated dogfood/metrics baselines still gate shrink. |
| Review / memory proposal visibility | review_memory_proposal_visibility | Review Queue plus Review / Memory Proposal Detail | Removed in Cockpit Route Removal v0.1; State Proposal Review carries native proposal/memory review | partial native replacement exists | `smoke:agent-workplane-review-memory-detail-v0-1`; `smoke:workplane-native-browser-regression-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Keep no-apply boundaries explicit; source-backed Run Postmortem and repeated dogfood/metrics baselines still block further absorption. |
| Postmortem | postmortem | Run Postmortem Detail panel | Removed in Cockpit Route Removal v0.1; Run Postmortem and Trace Diagnostics carry native read-only coverage | partial native replacement exists | `smoke:agent-workplane-run-postmortem-detail-v0-1`; `smoke:workplane-native-browser-regression-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Keep direct event payload detail, local UI control classification, repeated dogfood/metrics baselines, rollback, and human review as gates before further absorption. |
| Useful legacy local UI controls | legacy_local_ui_controls | Static classification for read-only, copy/export, preview/local-draft, local-write, forbidden, compatibility-only, and unknown controls | Removed in Cockpit Route Removal v0.1; safe manual controls are native review rows and local-write controls remain blocked | classified and route removed after migration | `smoke:legacy-cockpit-local-control-classification-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1`; `smoke:agent-workplane-legacy-cockpit-shrink-v0-1` | Absorb only read/copy/preview controls after browser/manual review; keep local-write controls blocked until a separate authority contract exists; keep forbidden controls absent. |
| Trace context | trace_context | Trace / Diagnostics panel | Removed in Cockpit Route Removal v0.1; Trace Diagnostics and Source Ref Bridge carry native bounded trace coverage | partial native replacement exists | `smoke:agent-workplane-projection-handoff-v0-1`; `smoke:agent-workplane-cleanup-hardening-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Keep bounded trace summaries native and full detail compatible until validated. |

## Post-Removal Coverage Rules

- Legacy Cockpit was removed in Cockpit Route Removal v0.1 after zero-count readiness.
- `components/workplane/legacy-cockpit-compatibility-panel.tsx` was deleted in Cockpit Route Removal v0.1.
- No active compatibility path remains after route removal.
- Useful legacy capabilities marked partial or pending absorption must stay
  represented in native surfaces, blocked-authority classifications, or delete
  classifications after route removal.
- Native panels may inherit visibility, source refs, and copy-only affordances,
  but must not inherit external authority or hidden execution.
- Local-write Cockpit controls require a separate authority contract before
  native Workplane absorption.
- `docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md`
  is the current classification pointer for local UI controls. It did not authorize shrink on its own; later PRs moved safe controls natively, verified zero count, and removed Cockpit.

## Deferred Work

Recommended next phase: Agent Workplane Node / Panel Contract v0.1.

That phase should define:

- stable node and panel ids;
- source refs for Work Brief, Handoff, Perspective, Bridge, Operator,
  Runner State, DeltaBatch, Postmortem, and Trace context;
- which panels are read-only, copy-only, preview-only, or compatibility-only;
- validation required before any legacy Cockpit surface can be hidden;
- explicit non-goals for provider/OpenAI/GitHub/Codex execution, runner
  behavior, durable memory apply, and Perspective apply.
