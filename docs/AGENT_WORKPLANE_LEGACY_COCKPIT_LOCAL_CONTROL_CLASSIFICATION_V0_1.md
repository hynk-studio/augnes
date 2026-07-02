# Agent Workplane Legacy Cockpit Local Control Classification v0.1

## Status And Scope

Status: Legacy Cockpit Local UI Control Classification v0.1.

Scope: static classification and gate definition only. This slice classifies
useful Legacy Cockpit local UI controls into read-only, copy/export,
preview/local-draft, local-write, forbidden, compatibility-only, and unknown
buckets before any future Legacy Cockpit shrink candidate.

This is not a shrink PR, not a deletion PR, and not a UI behavior redesign PR.
No Legacy Cockpit functionality is deleted, shrunk, hidden, or disabled.
Compatibility path remains rendered. Future deletion requires a separate PR.

Classification is evidence/signaling, not shrink authority. Browser
regression, metrics, and dogfood are evidence/signals, not shrink authority.
Local-write controls require a separate authority contract before native
absorption.

Follow-on repeated dogfood/metrics baseline is documented in
`docs/AUGNES_DOGFOOD_METRICS_BASELINE_V0_2.md`. The v0.2 baseline consumes this
classification as evidence/signaling, keeps unknown/manual-review controls as a
`needs_review` blocker, and runs before any shrink candidate. It does not
delete, shrink, hide, disable, or absorb Legacy Cockpit local-write controls.

## Why This Exists

This section explains why local UI control classification exists and why it
happens before any shrink candidate.

The native Workplane now has stronger Bridge/Trace detail, Review / Memory
Proposal detail, and source-backed Run Postmortem detail. The remaining
Legacy Cockpit gap is not just missing read context: it is knowing which local
controls are safe to absorb later and which must stay behind compatibility.

This classification happens before any shrink candidate so reviewers can ask:

- Which controls are read-only visibility?
- Which controls are copy-only/export-only?
- Which controls are preview-only or local draft only?
- Which controls are local-write and therefore compatibility-only until a
  separate authority contract exists?
- Which controls represent forbidden external authority and should remain
  absent from native Workplane?
- Which controls are unknown and require further browser/manual inspection?

The sections below define control classes, authority classes, migration
targets, capability group mapping, and the control classification table.

## Control Classes

- `read_only_visibility`: tab, selection, loader, or navigation control that
  only changes what is visible or fetches read context.
- `copy_only`: copies text to the clipboard or selects text for manual copy.
- `export_only`: exports already-rendered local material without sending or
  mutating.
- `preview_only`: changes local preview state without durable persistence.
- `local_draft`: stores local draft metadata or local UI-only state.
- `local_write`: calls an existing local write route or local action helper.
- `external_authority_forbidden`: would execute, publish, merge, deploy, call
  providers, call GitHub, launch Codex, record proof/evidence, apply memory,
  apply Perspective, or auto-apply deltas.
- `compatibility_only`: useful control retained only in the compatibility path.
- `unknown`: control not safely classified by static source review.

## Authority Classes

- `no_authority`
- `copy_authority`
- `local_preview_authority`
- `local_write_authority`
- `external_execution_authority`
- `forbidden_authority`
- `unknown_authority`

## Migration Targets

- `native_workplane_read_only`
- `native_workplane_copy_only`
- `native_workplane_preview_only`
- `compatibility_only_until_authority_contract`
- `forbidden_do_not_absorb`
- `obsolete_do_not_absorb`
- `needs_browser_manual_review`

## Capability Group Mapping

| group_id | purpose | default classification | shrink effect |
| --- | --- | --- | --- |
| `overview_work_brief` | Cockpit tab navigation, review navigation, and work selection | read-only visibility | candidate only after Work Brief browser and metric evidence |
| `handoff_copy_export` | Work, Perspective, ChatGPT, and Codex packet copy/export controls | copy-only / export-only | candidate only when no send/launch authority exists |
| `perspective_preview` | Perspective formation, lens, scope, manual Gravity, local draft, pasted text preview | preview-only / local draft | blocks shrink until preview and draft authority are explicit |
| `bridge_navigation` | Bridge tab matrix and endpoint examples | read-only visibility | candidate only after native Source Ref Bridge parity |
| `operator_review_controls` | Plan next, local checklist actions, observe proposal input | local-write | compatibility-only until authority contract |
| `proposal_review_controls` | Consolidation, commit/reject, AG Resume lifecycle metadata controls | local-write | compatibility-only until authority contract |
| `evidence_trace_loaders` | Evidence Pack, Session Trace, Temporal Preview, review artifact loaders | read-only / preview | read-only candidates; provider-capable preview stays compatibility-only |
| `runner_trace_controls` | Run-like trace and recovered DeltaBatch visibility | read-only visibility | candidate only after repeated dogfood/metrics baselines |
| `external_forbidden_controls` | Publish, merge, retry, replay, deploy, provider, GitHub, Codex, runner, memory/Perspective/delta apply | forbidden | never absorb in this slice |
| `unknown_legacy_controls` | Any control not classified by static source review | unknown | blocks shrink until browser/manual review |

## Control Classification Table

| control_id | group_id | legacy_surface | observed_or_documented_source | control_class | authority_class | status | migration_target | native_replacement_or_candidate | compatibility_path | required_before_absorption | shrink_gate_effect | recommended_next_review |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `cockpit_tab_navigation` | `overview_work_brief` | Cockpit top tab buttons | `components/augnes-cockpit.tsx` active tab buttons | `read_only_visibility` | `no_authority` | `native_absorption_candidate` | `native_workplane_read_only` | Agent Workplane panel markers and header/navigation | `LegacyCockpitCompatibilityPanel` | browser regression and rollback marker | candidate only; not removal authority | browser/manual tab reachability review |
| `overview_review_local_proposals_navigation` | `overview_work_brief` | Overview Review Local Proposals button | Overview card switches to Operator tab | `read_only_visibility` | `no_authority` | `classified` | `native_workplane_read_only` | Review Queue and Review / Memory Proposal Detail | `LegacyCockpitCompatibilityPanel` | native review queue browser coverage | navigation can move only after no review visibility loss | review queue browser evidence |
| `work_item_selection` | `overview_work_brief` | Work list item buttons | WorkFocusSection selects work id and reads work brief | `read_only_visibility` | `no_authority` | `native_absorption_candidate` | `native_workplane_read_only` | Work Queue / Current Objective | `LegacyCockpitCompatibilityPanel` | Work Brief source fields and resume baseline | candidate only as read-only selection | Work Brief browser regression |
| `work_codex_handoff_copy` | `handoff_copy_export` | Copy Codex handoff | WorkFocusSection clipboard copy | `copy_only` | `copy_authority` | `native_absorption_candidate` | `native_workplane_copy_only` | Handoff copy/export preview | `LegacyCockpitCompatibilityPanel` | no send, no launch, no Codex execution | candidate after copy regression | copy/export parity review |
| `work_event_template_copy` | `handoff_copy_export` | Copy work event template | WorkFocusSection clipboard copy | `copy_only` | `copy_authority` | `native_absorption_candidate` | `native_workplane_copy_only` | Handoff copy/export preview | `LegacyCockpitCompatibilityPanel` | no record action, source refs visible | candidate only as copy-only | template copy parity |
| `perspective_packet_copy_export` | `handoff_copy_export` | Perspective ChatGPT/Codex packet copy/select preview | Perspective Constellation and ingest packet controls | `copy_only` | `copy_authority` | `native_absorption_candidate` | `native_workplane_copy_only` | Handoff Builder / Handoff Capsule / Codex packet previews | `LegacyCockpitCompatibilityPanel` | no send, no GitHub, no provider, no Codex launch | candidate after no-control browser regression | packet copy parity |
| `perspective_formation_basis_switch` | `perspective_preview` | Formation Basis switch and Apply View | local/free basis overlay | `preview_only` | `local_preview_authority` | `retained_compatibility` | `native_workplane_preview_only` | future native preview-only Perspective focus | `LegacyCockpitCompatibilityPanel` | preview authority contract, no persistence, no Perspective apply | blocks Perspective control shrink | Perspective preview contract |
| `perspective_lens_scope_controls` | `perspective_preview` | Lens, Whole, Connected Node, Cluster, Manual Selection | local preview selection controls | `preview_only` | `local_preview_authority` | `native_absorption_candidate` | `native_workplane_preview_only` | Intent Projection reversible view projection | `LegacyCockpitCompatibilityPanel` | reversible non-durable view projection | candidate only as preview/view state | Intent Projection parity review |
| `manual_gravity_preview_controls` | `perspective_preview` | Manual Gravity Preview marks, clear, apply preview, reset | local UI emphasis controls | `preview_only` | `local_preview_authority` | `retained_compatibility` | `native_workplane_preview_only` | none yet | `LegacyCockpitCompatibilityPanel` | preview contract distinguishes UI emphasis from Perspective apply | keep compatibility | manual preview browser inspection |
| `manual_gravity_local_draft_controls` | `perspective_preview` | Save, replace, cancel, clear local draft marks | local draft metadata controls | `local_draft` | `local_preview_authority` | `retained_compatibility` | `compatibility_only_until_authority_contract` | none yet | `LegacyCockpitCompatibilityPanel` | local draft authority contract and storage scope | blocks native absorption | local draft authority review |
| `manual_pasted_text_preview_controls` | `perspective_preview` | Manual pasted text source, textarea, safe example, clear, preview | local preview input form | `preview_only` | `local_preview_authority` | `retained_compatibility` | `compatibility_only_until_authority_contract` | none yet | `LegacyCockpitCompatibilityPanel` | privacy/intake contract and no raw persistence | keep compatibility | manual input review |
| `bridge_tab_matrix_navigation` | `bridge_navigation` | Bridge capability matrix and endpoint examples | `BridgeTab` static matrix | `read_only_visibility` | `no_authority` | `native_absorption_candidate` | `native_workplane_read_only` | Source Ref Bridge / Trace Bridge Detail | `LegacyCockpitCompatibilityPanel` | native bridge matrix parity and GuideBrief debug | gated by dogfood/metrics/browser | bridge equivalence review |
| `operator_plan_next` | `operator_review_controls` | Plan Next button | SafeLocalActions calls local `/api/plan` | `local_write` | `local_write_authority` | `retained_compatibility` | `compatibility_only_until_authority_contract` | none | `LegacyCockpitCompatibilityPanel` | separate local action authority contract | compatibility-only | local action authority review |
| `safe_local_checklist_actions` | `operator_review_controls` | README Checklist, Security Checklist, Demo Script buttons | SafeLocalActions calls `/api/actions/run` | `local_write` | `local_write_authority` | `retained_compatibility` | `compatibility_only_until_authority_contract` | none | `LegacyCockpitCompatibilityPanel` | action-runner authority contract | compatibility-only | local action contract |
| `observe_local_proposal_input` | `operator_review_controls` | Observe advanced local proposal form | Operator form posts observation text to `/api/observe` | `local_write` | `local_write_authority` | `retained_compatibility` | `compatibility_only_until_authority_contract` | none | `LegacyCockpitCompatibilityPanel` | input and proposal authority contract | compatibility-only; no chat composer added | proposal input authority review |
| `proposal_consolidate_candidates` | `proposal_review_controls` | Consolidate Candidates button | PendingProposalQueue local consolidation | `local_write` | `local_write_authority` | `retained_compatibility` | `compatibility_only_until_authority_contract` | Review / Memory Proposal Detail visibility only | `LegacyCockpitCompatibilityPanel` | consolidation authority contract | no native write absorption | proposal lifecycle review |
| `proposal_commit_reject` | `proposal_review_controls` | Commit local state proposal and Reject local state proposal | `/api/deltas/{id}/commit` or reject | `local_write` | `local_write_authority` | `retained_compatibility` | `compatibility_only_until_authority_contract` | Review / Memory Proposal Detail no-apply visibility | `LegacyCockpitCompatibilityPanel` | explicit local-write authority contract | hard shrink blocker | local state proposal write contract |
| `ag_resume_lifecycle_review_controls` | `proposal_review_controls` | AG Resume lifecycle metadata review controls | AG Resume candidate/proposal lifecycle panels | `local_write` | `local_write_authority` | `retained_compatibility` | `compatibility_only_until_authority_contract` | Review / Memory Proposal Detail visibility only | `LegacyCockpitCompatibilityPanel` | lifecycle authority contract and proof/evidence boundary | compatibility-only | AG Resume lifecycle inventory |
| `evidence_pack_loader` | `evidence_trace_loaders` | Load/Refresh Evidence Pack | EvidencePackPanel derived read-only bundle | `read_only_visibility` | `no_authority` | `native_absorption_candidate` | `native_workplane_read_only` | Evidence/Handoff and Source Ref Bridge detail | `LegacyCockpitCompatibilityPanel` | native validation/evidence refs parity | candidate after validation detail | evidence browser regression |
| `session_trace_loader` | `evidence_trace_loaders` | Load/Refresh Session Trace | SessionTracePanel read-only continuity trace | `read_only_visibility` | `no_authority` | `native_absorption_candidate` | `native_workplane_read_only` | Trace Diagnostics and Run Postmortem Detail | `LegacyCockpitCompatibilityPanel` | source-backed trace/postmortem refs | candidate after trace/postmortem baselines | trace equivalence review |
| `temporal_interpretation_preview_loader` | `evidence_trace_loaders` | Load/Refresh Temporal Interpretation Preview | preview route may use OpenAI inside explicit legacy route when configured | `preview_only` | `local_preview_authority` | `retained_compatibility` | `compatibility_only_until_authority_contract` | none | `LegacyCockpitCompatibilityPanel` | provider/preview contract and no native provider call | keep compatibility | temporal preview/provider boundary |
| `temporal_review_artifact_loader` | `evidence_trace_loaders` | Load Temporal Review Artifacts | GET review-artifact list browser | `read_only_visibility` | `no_authority` | `native_absorption_candidate` | `native_workplane_read_only` | Trace Diagnostics and Source Ref Bridge detail | `LegacyCockpitCompatibilityPanel` | artifact/ref detail parity | candidate after artifact visibility | validation artifact review |
| `runner_trace_visibility_controls` | `runner_trace_controls` | Session Trace, Evidence Pack, Work events, Operator validation material | adjacent run-like trace visibility, not runner execution | `read_only_visibility` | `no_authority` | `classified` | `native_workplane_read_only` | Runner DeltaBatch readback and Run Postmortem Detail | `LegacyCockpitCompatibilityPanel` | dogfood/metrics baselines and event payload gap review | improves readiness but no runner authority | dogfood/metrics baseline |
| `external_publish_merge_retry_replay_deploy_controls` | `external_forbidden_controls` | publish, merge, retry, replay, deploy-like controls | Operator/Bridge copy states absent or blocked | `external_authority_forbidden` | `forbidden_authority` | `forbidden` | `forbidden_do_not_absorb` | none | none | do not absorb | absence must remain validated | authority-boundary smoke |
| `provider_github_codex_execution_controls` | `external_forbidden_controls` | Provider/OpenAI, GitHub, Codex execution controls | denied by Legacy and Workplane authority copy | `external_authority_forbidden` | `forbidden_authority` | `forbidden` | `forbidden_do_not_absorb` | none | none | do not absorb | forbidden native target | authority-boundary smoke |
| `durable_memory_perspective_delta_apply_controls` | `external_forbidden_controls` | durable memory apply, Perspective apply, delta auto-apply | denied by shrink plan and native detail panels | `external_authority_forbidden` | `forbidden_authority` | `forbidden` | `forbidden_do_not_absorb` | none | none | do not absorb | forbidden apply authority | no-apply smoke |
| `unknown_legacy_browser_manual_controls` | `unknown_legacy_controls` | any controls not classified by static source review | large legacy component and browser-only conditional controls | `unknown` | `unknown_authority` | `needs_review` | `needs_browser_manual_review` | none | `LegacyCockpitCompatibilityPanel` | DOM-capable browser/manual inventory | unknown controls block shrink | browser/manual legacy control inventory |

## Native Absorption Candidate Summary

Native absorption candidates are limited to controls that can remain read-only,
copy-only, export-only, or preview-only:

- read-only tab/navigation/work selection controls;
- handoff and packet copy/export controls with no send or execution;
- Bridge matrix visibility;
- Evidence Pack, Session Trace, Temporal Review Artifact, and runner trace
  visibility controls;
- Perspective lens/scope preview controls only if they remain reversible and
  non-durable.

No local-write control is absorbed in this PR.

## Compatibility-Only Summary

Compatibility-only until a separate authority contract exists:

- Manual Gravity local draft controls;
- manual pasted text preview controls;
- Plan Next;
- safe local checklist/demo actions;
- Observe local proposal input;
- proposal consolidation;
- proposal commit/reject;
- AG Resume lifecycle metadata controls;
- Temporal Interpretation Preview when provider-capable behavior is in scope.

## Forbidden Controls Summary

The following are forbidden native absorption targets in this slice:

- publish, merge, retry, replay, deploy;
- provider/OpenAI calls;
- GitHub calls or actuation;
- Codex launch or execution;
- runner execution, runner tick, runner recovery write, scheduled runner
  behavior;
- product DB writes, proof/evidence writes;
- durable memory apply, Perspective apply, delta auto-apply.

Forbidden controls are not useful shrink candidates. They should remain absent
from native Workplane unless a future separate authority contract explicitly
reopens one of them.

## Unknown / Manual Review Summary

`unknown_legacy_browser_manual_controls` remains a deliberate blocker. Static
source review covers the main Legacy Cockpit controls, but the component is
large and has conditional browser-only details. Any unclassified control must
be reviewed through browser/manual inspection before shrink.

## Required Authority Contract Before Local-Write Absorption

Local-write controls require a separate authority contract before native
absorption. That contract must define:

- the exact route or helper invoked;
- whether the control writes product DB state, runner ledger state, proof,
  evidence, durable memory, Perspective, deltas, or local browser storage;
- the approval and rollback path;
- browser regression for the control and compatibility rollback;
- explicit human approval.

Until that exists, local-write controls remain behind Legacy Cockpit
compatibility.

## How Browser Regression Uses This Classification

Browser regression should continue to treat local UI controls as retained
compatibility unless a future native surface explicitly absorbs a read-only,
copy-only, or preview-only control. It should not claim full local-control
readiness while unknown/manual-review or local-write controls remain.

## How Metrics, Dogfood, And Shrink Plan Use This Classification

Metrics can use this classification as a Cockpit absorption dependency signal,
not as authority. Dogfood can use it to evaluate whether native Workplane loses
useful controls. The shrink plan can use it to decide which controls are
candidates, compatibility-only, forbidden, or unknown.

## Remaining Blockers

- Unknown controls need browser/manual review.
- Local-write controls need a separate authority contract.
- Repeated dogfood/metrics baselines are still needed.
- Richer proposal diff detail may still be needed later.
- Direct runner ledger event payload detail remains outside this slice.

## Authority Boundary

This slice adds no route, no API write route, no server action, no chat
composer, no provider/OpenAI/GitHub/Codex execution, no Codex launch, branch
creation, PR creation, merge, publish, retry, replay, or deploy, no runner
execution, no runner tick, no runner recovery write, no scheduled runner
behavior, no product DB write or persistence, no proof/evidence write, no
durable memory apply, no Perspective apply, no delta auto-apply, no
localStorage/sessionStorage durable view mode, and no product UI action
authority.

No Legacy Cockpit deletion, shrink, hiding, disabling, or compatibility-path
removal is implemented here. No native absorption of local-write controls is
implemented here.

## What Is Not Implemented Yet

- no Legacy Cockpit shrink candidate;
- no movement of controls into native Workplane;
- no product UI behavior change;
- no local-write authority contract;
- no browser/manual complete inventory of every conditional legacy control;
- no repeated dogfood/metrics baseline.

## Recommended Next Phase

Recommended next phase: repeated dogfood/metrics baseline, or targeted richer
proposal diff detail if this classification shows review/memory parity still
needs it; not Legacy Cockpit deletion yet.
