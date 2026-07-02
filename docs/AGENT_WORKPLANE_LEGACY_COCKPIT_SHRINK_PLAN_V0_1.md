# Agent Workplane Legacy Cockpit Shrink Plan v0.1

## 1. Status And Scope

Status: Legacy Cockpit Shrink Plan v0.1.

Scope: planning and gate definition only. This document defines how Augnes can
later decide whether specific Legacy Cockpit compatibility content can be
reduced after native Agent Workplane replacement, GuideBrief debug/intent
projection support, Runner / Workplane Metrics, browser regression coverage,
dogfood evidence, rollback rules, and explicit human approval exist.

This is not a deletion PR. No Legacy Cockpit functionality is deleted or
shrunk in this PR. No compatibility path is removed in this PR. No UI behavior
is changed in this PR. Future deletion requires a separate PR.

## 2. Why This Plan Exists

Legacy Cockpit remains useful inside `/workbench` as a compatibility path while
Agent Workplane absorbs native AI-operational surfaces. Native Workplane,
GuideBrief Workplane Debug Context, GuideBrief Intent Projection, recovered
runner DeltaBatch readback, Runner / Workplane Metrics, and Augnes-on-Augnes
Dogfood now provide enough evidence sources to define a rigorous shrink review
process.

The current evidence does not justify deleting or hiding compatibility content.
The #927 dogfood signal was:

- `cockpit_shrink_readiness`: `needs_review`
- metrics Cockpit shrink readiness: `watch`
- `resume_latency` still needs repeated baseline data
- `review_burden` still needs repeated baseline data

Therefore this plan records gates, capability-level decisions, required native
replacement evidence, smoke/browser checks, and rollback requirements. It does
not remove anything.

## 3. Current Compatibility And Native Absorption State

Legacy Cockpit is currently preserved inside `/workbench` through
`LegacyCockpitCompatibilityPanel`, which mounts `AugnesCockpit`. The retained
compatibility path exposes useful Work Brief, Handoff, Perspective, Bridge,
Operator, work/run, source/ref, review/memory proposal, validation/smoke, and
local UI control context while native Workplane surfaces mature.

Native absorption is partial:

- Agent Workplane has stable native panels and node IDs for Work Queue,
  Current Perspective, Delta Projection, Review Queue, Evidence/Handoff,
  Workplane Inspector, Projection Candidates, projected Delta Batch, recovered
  runner DeltaBatch, Handoff Builder preview, Run Postmortem, Trace /
  Diagnostics, and legacy Cockpit compatibility.
- GuideBrief Workplane Debug Context can explain selected panels/nodes/refs,
  including the DeltaBatch identity split.
- GuideBrief Intent Projection can focus reversible view/draft context and
  prepare draft candidates, but it cannot execute them.
- Runner / Workplane Metrics can surface review burden, resume friction
  proxies, stale/fallback visibility, Cockpit absorption dependency, and
  dogfood readiness, but metrics are signals, not shrink authority.
- Augnes-on-Augnes Dogfood can produce local fixture-backed evidence, but
  dogfood reports are evidence, not shrink authority.

## 4. Shrink Readiness Summary

Current shrink readiness is not a blanket go-signal yet. Compatibility remains
the default for every useful capability until all applicable gates pass.

Allowed `shrink_readiness` values:

- `not_ready`
- `watch`
- `candidate_after_more_dogfood`
- `candidate_after_browser_regression`
- `candidate_after_metric_threshold`
- `ready_for_future_removal_plan`
- `obsolete_with_rationale`

Allowed `recommended_action` values:

- `retain_compatibility`
- `add_native_absorption`
- `add_browser_regression`
- `add_metric_baseline`
- `add_dogfood_baseline`
- `plan_future_removal_pr`
- `mark_obsolete_later`
- `no_action`

## 5. Shrink Gate Model

Gate 0: compatibility path present.
`LegacyCockpitCompatibilityPanel` remains rendered and `AugnesCockpit` remains
present before any shrink discussion.

Gate 1: native replacement exists.
The capability has a native panel/node or documented native replacement with
the same useful AI-operational information.

Gate 2: stable panel/node contract and source refs exist.
The replacement uses stable `data-workplane-*` IDs and records source refs,
fallback status, staleness, validation summary, and authority boundary.

Gate 3: GuideBrief debug path exists.
GuideBrief can explain the selected replacement context through observed,
inferred, suggested, needs-user-judgment, source-ref, stale-warning, and
validation sections.

Gate 4: intent projection can focus/recover the capability context.
Intent Projection can focus the native replacement without durable mode,
without hiding source truth, and without confusing projected Delta Projection
context with recovered runner DeltaBatch readback.

Gate 5: metrics show acceptable review burden / resume latency / stale
visibility.
Metrics must show sustained acceptable status for review burden, resume
latency, stale/fallback visibility, and relevant capability quality across more
than one baseline. Metrics are signals, not shrink authority.

Gate 6: dogfood shows no useful capability loss.
Augnes-on-Augnes Dogfood must show the native replacement helps continuation
without losing useful Cockpit information. Dogfood reports are evidence, not
shrink authority.

Gate 7: browser smoke validates replacement and compatibility rollback.
Browser or server-rendered HTML checks must confirm the native replacement,
the compatibility path, and rollback markers are reachable before and after
the candidate shrink.

Gate 8: explicit human approval for removal PR.
Removal requires a separate, dedicated PR with explicit human approval. This
plan cannot authorize deletion.

## 6. Capability Shrink Readiness Table

| capability_id | legacy_surface | native_replacement | native_panel_or_node_ids | compatibility_path | current_status | shrink_readiness | required_evidence_before_removal | required_smoke_or_browser_coverage | guidebrief_debug_path | metrics_or_dogfood_signal | recommended_action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| work_brief | `AugnesCockpit` Overview `CurrentWorkCard` and Work `WorkFocusSection` | Work Queue, Current Perspective, Workplane Overview, Workplane Inspector | `work_queue` / `current_objective`; `current_perspective`; `workplane_inspector` / `source_ref_bridge` | `LegacyCockpitCompatibilityPanel` keeps Cockpit Work Brief reachable | partially_native | candidate_after_metric_threshold | Repeated resume-latency baseline shows native Work Brief context is enough to resume work without opening compatibility; source refs cover work id, next action, recent events, related proof, and handoff refs | `smoke:agent-workplane-shell-v0-1`; `smoke:agent-workplane-panels-v0-1`; browser check for native Work Queue and compatibility rollback | select `work_queue` / `current_objective`; fallback `workplane_inspector` / `source_ref_bridge` | `resume_latency_signal`; dogfood `resume_latency`; Cockpit dependency signal | add_metric_baseline |
| handoff | Cockpit handoff copy actions, `CurrentWorkCard`, `WorkFocusSection`, `WorkCodexHandoffReview` | Evidence/Handoff, Handoff Builder preview, Handoff Capsule preview, Codex launch card preview, Handoff copy/export preview | `evidence_handoff` / `handoff_context`; `handoff_builder_preview`; handoff preview panels | Compatibility retains current Cockpit copy paths | partially_native | candidate_after_browser_regression | Native handoff exposes constraints, verification commands, source refs, handoff refs, and copy-only boundaries without launch/send authority | `smoke:agent-workplane-projection-handoff-v0-1`; browser copy/readability regression; compatibility rollback check | select `handoff_builder_preview` / `handoff_context`; related handoff refs | `handoff_loss_rate`; dogfood handoff projection usefulness | add_browser_regression |
| perspective | Cockpit Perspective tab, PerspectiveSnapshot panels, Project Constellation preview, Perspective event rail, formation/local preview controls | Current Perspective, Delta Projection, Projection Candidates, Trace / Diagnostics | `current_perspective`; `delta_projection` / `perspective_delta`; `projection_candidates`; `trace_diagnostics` / `trace_bridge` | Compatibility retains detailed Perspective tab and local preview controls | partially_native | watch | Native read context preserves current frame, temporal state, evidence basis, trace basis, stale/fallback disclosure, and open tensions; local preview/apply-like controls remain separately scoped | `smoke:agent-workplane-panels-v0-1`; `smoke:agent-workplane-projection-handoff-v0-1`; browser stale/fallback regression | select `current_perspective` or `delta_projection` / `perspective_delta` | `stale_context_incident_count`; dogfood stale context visibility | retain_compatibility |
| bridge | Cockpit Bridge tab capability matrix and endpoint examples | Source Ref Bridge / Trace Bridge native contract is only partial through Inspector and Trace / Diagnostics | `workplane_inspector` / `source_ref_bridge`; `trace_diagnostics` / `trace_bridge` | Compatibility retains Bridge tab matrix | needs_native_absorption | not_ready | Native Bridge matrix covers read, draft, record, commit-state, provider, GitHub, Codex, runner, DB, proof/evidence, memory, Perspective, and delta authority rows | new native Bridge smoke plus browser check; existing inheritance smoke must keep compatibility reachable | select `workplane_inspector` / `source_ref_bridge` and `trace_diagnostics` / `trace_bridge` | Cockpit compatibility dependency signal stays watch until absorbed | add_native_absorption |
| operator_visibility | Cockpit Operator tab, Operator Handoff Snapshot, mailbox/publication/approval summaries, coordination timeline | Boundary card, Review Queue, Workplane Inspector, Trace / Diagnostics, metrics panel | `review_queue` / `authority_validation_debug`; `workplane_inspector`; `trace_diagnostics`; metrics panel | Compatibility retains Operator tab and summaries | partially_native | watch | Native panels show blocked gates, review queues, validation material, authority copy, and operator blockers without local-write controls | `smoke:agent-workplane-panels-v0-1`; `smoke:agent-workplane-cleanup-hardening-v0-1`; browser operator-summary replacement regression | select `review_queue` / `authority_validation_debug` | `review_burden_signal`; dogfood `review_burden` | add_dogfood_baseline |
| work_run_visibility | Cockpit Work tab, Session Trace loader, Evidence Pack loader, temporal review artifact loader, operator validation state | Work Queue, Evidence/Handoff, recovered Runner DeltaBatch, Run Postmortem skeleton, Trace / Diagnostics | `work_queue`; `evidence_handoff`; `delta_batch` / `runner_delta_batch`; `run_postmortem`; `trace_diagnostics` | Compatibility retains full Work, proof, trace, and loader surfaces | partially_native | candidate_after_metric_threshold | Recovered runner DeltaBatch and native work/run context expose enough continuity without rerunning hidden automation; Run Postmortem has source-backed fields beyond skeleton | `smoke:workplane-runner-deltabatch-integration-v0-1`; `smoke:autonomy-runner-v0-1`; browser recovered runner DeltaBatch regression | select `delta_batch` / `runner_delta_batch`; fallback `run_postmortem` | recovered DeltaBatch visibility; autonomy yield; review burden | add_metric_baseline |
| source_ref_visibility | Cockpit Work context, Perspective source refs, Bridge endpoint examples, Evidence Pack refs, Session Trace refs | Overview, Evidence/Handoff, Workplane Inspector, Trace / Diagnostics, node context source refs | `workplane_inspector` / `source_ref_bridge`; `evidence_handoff`; `trace_diagnostics` | Compatibility remains available for detailed legacy refs | native_complete | candidate_after_browser_regression | Native source/ref rows cover work ids, state keys, action ids, PR refs, evidence refs, diagnostic refs, handoff refs, stale/fallback status, and DeltaBatch identity split | source/ref browser regression; `smoke:agent-workplane-node-contract-v0-1`; `smoke:guide-workplane-debug-context-v0-1` | select `workplane_inspector` / `source_ref_bridge` | projected-vs-recovered DeltaBatch identity; stale/fallback visibility | add_browser_regression |
| review_memory_proposal_visibility | Cockpit pending proposal queue, AG Resume technical review panels, durable-memory review refs, local review summaries | Review Queue exposes some durable-memory and user-decision refs only | `review_queue` / `authority_validation_debug` | Compatibility retains detailed AG Resume and local proposal review panels | needs_native_absorption | not_ready | Native read-only proposal/memory review node exists with candidate labels, lifecycle state, conflict context, and no apply authority | new native proposal/memory smoke; browser negative case for no apply/commit controls | select `review_queue` / `authority_validation_debug`; future proposal node | durable-memory review refs; Cockpit dependency signal | add_native_absorption |
| validation_smoke_visibility | Cockpit Evidence Pack, Session Trace, suggested verification, recent validation, approval/publication summaries | Trace / Diagnostics, Evidence/Handoff, Workplane Inspector, Handoff preview validation refs | `trace_diagnostics`; `evidence_handoff`; `workplane_inspector`; `handoff_builder_preview` | Compatibility retains detailed Evidence Pack and Session Trace material | partially_native | candidate_after_browser_regression | Native panels expose validation commands/status, skipped checks, failures, evidence status, session gaps, and approval-gate context | `smoke:agent-workplane-projection-handoff-v0-1`; `smoke:autonomy-runner-v0-1`; browser validation visibility regression | select `trace_diagnostics` / `trace_bridge` | validation refs in node context; dogfood delta quality and stale visibility | add_browser_regression |
| legacy_local_ui_controls | Cockpit tab buttons, work selection, copy buttons, load evidence/session artifacts, local proposal commit/reject, consolidate, observe, plan next, checklist actions | Native copy/export preview exists for copy/read controls only; no native replacement for local-write controls | Handoff copy/export preview plus compatibility-only controls | `LegacyCockpitCompatibilityPanel` is the retained compatibility path | legacy_only_still_useful | not_ready | Separate authority contract proves which controls are read/copy-only, which are local-write, and which must never be absorbed by Workplane | browser regression for retained compatibility; negative smokes for no new Workplane write controls | select `legacy_cockpit_compatibility` | Cockpit dependency signal; dogfood no capability loss | retain_compatibility |
| external_control_buttons | Historical Cockpit maps forbid publish, merge, retry, GitHub token controls, live exchange, execute Codex, backup, replay, Publish Proof, Record Proof, and new ChatGPT App tools | No native replacement; intentionally blocked external authority | not applicable; no panel or node should add this authority | not applicable; blocked rather than retained | obsolete | obsolete_with_rationale | These are obsolete because they would add external authority or hidden execution, not because a native replacement should absorb them | authority-boundary smokes must keep them absent | absence is intentional and should remain documented by authority smokes | forbidden-action attempt count must remain zero | no_action |

## 7. Required Evidence Before Any Future Removal

Before a future removal PR can be proposed for any capability, reviewers need:

- native replacement fields with source refs, stale/fallback status, validation
  summary, and authority boundary;
- GuideBrief debug selection that explains the capability without scraping
  legacy visible copy;
- Intent Projection focus that is reversible, dismissible, non-durable, and
  does not suppress source truth;
- Runner / Workplane Metrics baseline showing acceptable review burden, resume
  latency, stale/fallback visibility, and relevant capability-specific status;
- Augnes-on-Augnes Dogfood report showing no useful capability loss;
- browser regression showing native replacement reachability and compatibility
  rollback reachability;
- static smoke coverage for no new route, no API write route, no server action,
  no provider/OpenAI/GitHub/Codex execution, no runner behavior, no DB write,
  no proof/evidence write, no durable memory apply, no Perspective apply, and
  no delta auto-apply;
- explicit human approval for a dedicated removal PR.

## 8. Required Native Replacement, Debug, Metrics, And Browser Paths

The table above is the source for capability-specific replacement expectations.
At minimum:

- Work Brief removal requires native `work_queue` / `current_objective`
  coverage and repeated resume-latency baseline.
- Handoff removal requires native `handoff_context` coverage, source-backed
  handoff refs, and browser copy/regression coverage.
- Perspective removal requires native current perspective, delta projection,
  stale/fallback, and trace context coverage while local preview controls stay
  separately authorized.
- Bridge removal requires a native Source Ref Bridge / Trace Bridge matrix.
- Operator visibility removal requires native blocked-gate, review-queue,
  validation, and authority summaries.
- Work/run visibility removal requires recovered runner DeltaBatch readback and
  source-backed Run Postmortem fields.
- Review/memory proposal visibility requires native candidate-only proposal
  review context with no apply authority.
- Useful legacy local UI controls must remain until a separate local-control
  authority contract exists.

## 9. What Can Be Shrunk Later

Only duplicate compatibility content can be considered later, and only after
all gates pass for the capability being removed. Possible future candidates
are duplicated read-only summaries where native Workplane panels, GuideBrief
debug, Intent Projection, metrics, dogfood, and browser regression all show no
useful capability loss.

`ready_for_future_removal_plan` is not a deletion state. It means a later
dedicated removal PR may be drafted for review.

## 10. What Must Remain For Now

The following must remain for now:

- `LegacyCockpitCompatibilityPanel`
- `AugnesCockpit`
- Work Brief compatibility
- Handoff compatibility copy/read paths
- detailed Perspective tab and local preview controls
- Bridge tab matrix until native absorption exists
- Operator tab summaries and blocked-gate visibility
- Work/run loaders, trace, evidence, temporal review material
- review/memory proposal visibility
- validation/smoke visibility
- useful legacy local UI controls

## 11. Obsolete Only With Rationale

External execution controls remain obsolete with rationale. Publish, merge,
retry, replay, deploy, provider/OpenAI execution, GitHub actuation, Codex
launch/execution, proof/evidence writes, durable memory apply, Perspective
apply, and delta auto-apply are not shrink candidates. They are blocked
authority. Their absence must remain validated by no-authority smokes.

## 12. Still Needs Native Absorption

The major native absorption gaps are:

- Bridge matrix rows and endpoint examples;
- detailed review/memory proposal visibility;
- source-backed Run Postmortem fields;
- full validation/smoke evidence context;
- local UI control classification into read-only, copy-only, local-write, and
  never-absorb categories.

## 13. GuideBrief, Intent, Metrics, And Dogfood Support

GuideBrief Workplane Debug Context supports shrink review by explaining why a
native replacement is shown, which source refs support it, what is inferred,
what is stale or fallback-backed, which validation applies, and what still
needs user judgment.

Intent Projection supports shrink review by focusing the Workplane on a
capability and producing reversible view/draft candidates without durable mode,
execution, send, apply, approve, reject, runner behavior, or storage.

Runner / Workplane Metrics supports shrink review by measuring review burden,
resume latency proxies, stale/fallback visibility, recovered DeltaBatch
visibility, projected-vs-recovered DeltaBatch identity separation, Cockpit
dependency, and dogfood readiness. Metrics are signals, not shrink authority.

Augnes-on-Augnes Dogfood supports shrink review by exercising Augnes with
native Workplane, GuideBrief debug, Intent Projection, metrics, runner
fixtures, recovered DeltaBatch readback, and handoff candidates. Dogfood
reports are evidence, not shrink authority.

## 14. DeltaBatch Identity Separation

Shrink review must preserve these separate identities:

- `delta_projection` / `perspective_delta`
- `projected_delta_batch` / `perspective_delta`
- `delta_batch` / `runner_delta_batch`

Projected Delta Projection preview context must not be confused with recovered
runner DeltaBatch ledger readback.

## 15. Rollback And Compatibility Restore Requirements

Any future shrink PR must include a rollback plan:

- restore `LegacyCockpitCompatibilityPanel` rendering without route or DB
  migration;
- restore the capability-specific Cockpit surface from git history if browser
  or dogfood regression shows useful capability loss;
- keep compatibility markers and source refs visible during the candidate
  rollout;
- include browser evidence that rollback content is reachable;
- keep a static smoke asserting `AugnesCockpit` remains present until the
  approved removal PR actually lands;
- never require provider/OpenAI/GitHub/Codex execution, runner execution,
  product DB writes, proof/evidence writes, durable memory apply, Perspective
  apply, or delta auto-apply to roll back.

## 16. Authority Boundary

This PR adds:

- no Legacy Cockpit deletion
- no Legacy Cockpit shrink
- no hiding of Cockpit content
- no removal of compatibility path
- no UI behavior change
- no route
- no API write route
- no server action
- no chat composer
- no execution button
- no apply/approve/reject control
- no provider/OpenAI call
- no GitHub call or actuation
- no Codex launch, branch creation, PR creation, merge, publish, retry, replay, or deploy
- no runner execution
- no runner tick
- no runner recovery write
- no scheduled runner behavior
- no product DB write or persistence
- no proof/evidence write
- no durable memory apply
- no Perspective apply
- no delta auto-apply
- no localStorage/sessionStorage durable view mode
- no new local-write product controls

Metrics are signals, not shrink authority. Dogfood reports are evidence, not
shrink authority. Future deletion requires a separate PR.

## 17. Smoke And Browser Coverage For This Plan

`npm run smoke:agent-workplane-legacy-cockpit-shrink-plan-v0-1` verifies this
document, backlinks, required capability fields, allowed values, gate model,
compatibility retention, no product UI behavior file changes, no route/API
write/server action additions, no external/product write authority additions,
and DeltaBatch identity separation.

Browser or server-rendered HTML sanity should verify `/workbench` still
returns 200 and exposes:

- `data-workplane-metrics-panel="v0.1"`
- `data-guide-workplane-debug-panel="v0.1"`
- `data-guide-intent-projection-panel="v0.1"`
- `data-workplane-intent-mode-panel="v0.1"`
- `data-workplane-panel-id="delta_projection"`
- `data-workplane-panel-id="projected_delta_batch"`
- `data-workplane-panel-id="delta_batch"`
- `data-workplane-panel-id="legacy_cockpit_compatibility"`
- visible Legacy Cockpit compatibility content

If Turbopack panic messages appear while `/workbench` still serves 200, the PR
must report the caveat. If `/workbench` does not serve 200, shrink planning is
blocked.

## 18. Next Review Criteria

The next review should ask:

- Did repeated dogfood reduce resume latency and review burden?
- Did native Workplane expose the same useful capability without opening
  compatibility?
- Did GuideBrief debug explain the replacement context?
- Did Intent Projection focus the right panels without persistent mode?
- Did metrics stay healthy or improve across more than one baseline?
- Did browser regression show native replacement and compatibility rollback?
- Did any capability still require Bridge, review/memory proposal, local UI
  control, or validation/evidence detail from Legacy Cockpit?

## 19. Recommended Next Phase

Recommended next phase: Browser Regression for Native Workplane Replacement
v0.1 if shrink readiness remains `watch` / `needs_review`.

The shrink plan recommends Legacy Cockpit removal only in a future dedicated
removal PR, another dogfood/metrics baseline if readiness remains `watch` /
`needs_review`, and browser regression before any actual shrink.

Only if all gates are satisfied should Augnes consider Legacy Cockpit Shrink
Candidate v0.1, and even then no automatic deletion is allowed. The removal
decision must be reviewed in a separate PR.
