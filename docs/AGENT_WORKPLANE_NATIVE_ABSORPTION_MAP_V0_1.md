# Agent Workplane Native Absorption Map v0.1

## Status And Scope

Status: Agent Workplane Native Absorption Map v0.1.

Scope: static mapping only. This document maps useful legacy Cockpit
capabilities into native Agent Workplane panels/nodes or explicit retained
compatibility paths. It does not implement GuideBrief debug behavior,
GuideBrief intent projection, a Workplane node/panel contract, runner behavior,
Runner / DeltaBatch Workplane integration, or external actuation. It adds no
provider/OpenAI calls, no GitHub execution, no Codex execution, no durable
memory apply, and no Perspective apply.

Legacy Cockpit must not be removed until native replacement and validation
exist.

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

## Baseline Native Absorption Map

| legacy_capability | inventory_capability_id | native_target | retained_compatibility_path | absorption_status | validation_coverage | next_step |
| --- | --- | --- | --- | --- | --- | --- |
| Work Brief | work_brief | Work Queue / Current Objective | `LegacyCockpitCompatibilityPanel` mounting `AugnesCockpit` | partial native replacement exists | `smoke:agent-workplane-shell-v0-1`; `smoke:agent-workplane-panels-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Define exact Work Brief node fields in Agent Workplane Node / Panel Contract v0.1. |
| Handoff | handoff | Handoff Builder / Handoff Capsule / Codex packet panel | `LegacyCockpitCompatibilityPanel` for current Cockpit copy controls | partial native replacement exists | `smoke:agent-workplane-projection-handoff-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Keep copy/send/execution separation explicit before native retirement. |
| Perspective | perspective | Current Perspective / Perspective Delta / Timeline context | `LegacyCockpitCompatibilityPanel` for detailed Perspective tab and local preview controls | partial native replacement exists | `smoke:agent-workplane-panels-v0-1`; `smoke:agent-workplane-projection-handoff-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Absorb read-only context first; leave local preview controls in compatibility. |
| Bridge | bridge | Source Ref Bridge / Trace Bridge | `LegacyCockpitCompatibilityPanel` for Bridge tab matrix | partial native replacement exists | `smoke:agent-workplane-bridge-trace-detail-v0-1`; `smoke:workplane-native-browser-regression-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Keep compatibility until dogfood, metrics, browser regression, rollback, and human review prove no useful Bridge capability loss. |
| Operator visibility | operator_visibility | Authority / Validation / Debug Inspector | `LegacyCockpitCompatibilityPanel` for Operator tab, local summaries, and controls | partial native replacement exists | `smoke:agent-workplane-panels-v0-1`; `smoke:agent-workplane-cleanup-hardening-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Split read-only operator visibility from local-write controls in the next contract. |
| Runner outputs | runner_outputs | Runner State / DeltaBatch panel | Runner ledger helpers and `smoke:autonomy-runner-v0-1`; no legacy Cockpit runner panel is deleted | needs native absorption | `smoke:autonomy-runner-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Later PR should add display-only runner-output source mapping, not runner behavior. |
| Postmortem | postmortem | Run Postmortem panel | `LegacyCockpitCompatibilityPanel` for Session Trace, Evidence Pack, Work events, and temporal review material | needs native absorption | `smoke:agent-workplane-projection-handoff-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Define source-backed postmortem fields before changing UI behavior. |
| Trace context | trace_context | Trace / Diagnostics panel | `LegacyCockpitCompatibilityPanel` for full trace and graph detail | partial native replacement exists | `smoke:agent-workplane-projection-handoff-v0-1`; `smoke:agent-workplane-cleanup-hardening-v0-1`; `smoke:agent-workplane-cockpit-inheritance-v0-1` | Keep bounded trace summaries native and full detail compatible until validated. |

## Compatibility Rules

- Legacy Cockpit remains reachable through
  `components/workplane/legacy-cockpit-compatibility-panel.tsx`.
- The compatibility path is intentional, not cleanup residue.
- Useful legacy capabilities marked partial or pending absorption must not be
  deleted just because native Agent Workplane panels exist.
- Native panels may inherit visibility, source refs, and copy-only affordances,
  but must not inherit external authority or hidden execution.
- Local-write Cockpit controls require a separate authority contract before
  native Workplane absorption.

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
