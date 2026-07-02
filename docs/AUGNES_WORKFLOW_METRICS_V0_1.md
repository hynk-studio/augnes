# Augnes Workflow Metrics v0.1

## 1. Status and Scope

Status: Runner / Workplane Metrics v0.1.

Scope: this slice adds read-only metrics for Agent Workplane, GuideBrief
Workplane Debug Context, GuideBrief Intent Projection, recovered runner
DeltaBatch readback, stale/fallback visibility, Cockpit absorption readiness,
and Augnes-on-Augnes dogfood readiness.

metrics are signals, not execution authority or auto-apply decisions. They help
operators decide whether native Agent Workplane absorption is strong enough to
plan a later Legacy Cockpit shrink, but they do not shrink or delete anything.

## 2. Why Metrics Before Legacy Cockpit Shrink

Legacy Cockpit still contains useful compatibility content. Native Agent
Workplane, GuideBrief debug, and GuideBrief intent projection now exist, but
shrinking compatibility should be based on observed signals, not confidence in
new panels alone.

Runner / Workplane Metrics helps answer:

- is Agent Workplane reducing resume friction?
- are recovered DeltaBatches useful or noisy?
- are stale/fallback contexts visible?
- is review burden going down?
- are runner outputs producing useful review candidates?
- is native absorption complete enough to justify a later shrink plan?

## 3. Metric Groups

Metric groups are:

- `runner`
- `workplane`
- `guidebrief`
- `handoff`
- `stale_context`
- `cockpit_absorption`
- `dogfood_readiness`

Each metric records value, numerator, denominator, unit, status, trend, summary,
source refs, caveats, and validation refs.

Statuses are:

- `healthy`
- `watch`
- `needs_review`
- `blocked`
- `unknown`
- `insufficient_data`

Trends are:

- `improving`
- `steady`
- `degrading`
- `unknown`

v0.1 computes point-in-time signals only, so trend is usually `unknown`.

## 4. Core Workflow Metrics

Core workflow metrics are:

- `handoff_loss_rate`
- `resume_latency_signal`
- `perspective_delta_quality_signal`
- `review_burden_signal`
- `autonomy_yield_signal`
- `stale_context_incident_count`
- `delta_noise_signal`
- `research_integration_yield_signal`

These are cross-surface signals. They do not approve work, apply deltas,
trigger handoffs, run agents, or change state.

## 5. Runner Metrics

Runner metrics include:

- `run_completion_rate`: completed runs divided by total runs.
- `scheduled_run_success_rate`: completed scheduled runs divided by scheduled
  runs.
- `delta_batch_recovery_rate`: completed, needs-review, or blocked runs with
  at least one recovered DeltaBatch divided by those eligible runs.
- `cancelled_run_safety_rate`: cancelled runs with no running step in the
  supplied snapshot divided by cancelled runs.
- `paused_run_non_execution_rate`: paused runs with no running step divided by
  paused runs.
- `forbidden_action_attempt_count`: runner events, step errors, and DeltaBatch
  validation notes that contain an explicit attempted, forbidden,
  unauthorized, disallowed, denied, `blocked_by_authority`,
  `authority_violation`, `forbidden_action_attempt`, or
  `attempted_forbidden_action` marker near a forbidden authority keyword.
  This is a conservative explicit forbidden-attempt signal, not a naive keyword
  count. It must not count safe boundary disclosures or negated authority
  statements such as `no_*`, `not`, `without`, `does not`, `false`, `not memory
  mutation`, `not durable Perspective apply`, `no memory mutation`, or `no
  durable Perspective apply`.
- `runner_error_rate`: blocked/failed runs, or runs with blocked/failed steps,
  divided by total runs.
- `average_run_duration_ms`: average `finished_at - started_at` for runs with
  both timestamps.
- `average_delta_batch_count_per_run`: recovered DeltaBatch count divided by
  total runs.
- `needs_review_ratio`: needs-review runs divided by total runs.

The product `/workbench` render does not create fixture runs, create runs, tick
runs, recover DeltaBatches, schedule runs, or write the runner ledger. Fixture
smokes may pass in-memory runner data to validate deterministic metric math.

## 6. Workplane Review Metrics

Workplane metrics include:

- `recovered_delta_batch_visibility_rate`: whether Workplane can expose latest
  recovered runner DeltaBatch readback.
- `workplane_review_queue_load`: total attention refs from the Workplane
  review queue summary.
- `workplane_fallback_source_count`: Workplane source entries that are not
  runtime or runner ledger.
- `workplane_stale_source_count`: stale, unknown, or fallback staleness signals
  visible in Workplane context.
- `perspective_delta_quality_signal`: projected Delta Projection deltas with
  evidence refs divided by projected deltas.
- `review_burden_signal`: review queue load used as a review-burden proxy.
- `stale_context_incident_count`: combined stale and fallback signals.

## 7. GuideBrief Debug and Intent Projection Metrics

GuideBrief metrics include:

- `intent_projection_reversibility_signal`: healthy when Intent Projection is
  reversible, dismissible, durable-state unchanged, and non-executable.
- `guidebrief_debug_context_coverage_signal`: healthy when Debug Context
  preserves Observed, Inferred, Suggested, and Needs user judgment sections.
- `projected_vs_recovered_deltabatch_identity_signal`: healthy when
  `delta_projection / perspective_delta`, `projected_delta_batch /
  perspective_delta`, and `delta_batch / runner_delta_batch` remain distinct.
- `handoff_loss_rate`: blocked draft handoff candidates divided by all draft
  handoff candidates.

These metrics inspect existing GuideBrief read models. They do not create
GuideBrief execution authority.

## 8. Stale and Fallback Metrics

Stale/fallback metrics count visible stale, unknown, empty, or fallback state.
They are designed to make poor source freshness visible before work resumes or
before compatibility surfaces are shrunk.

Fallback is not failure by itself. It is a signal that user judgment may be
needed before treating a panel as fresh runtime truth.

## 9. Cockpit Absorption Readiness Metrics

`cockpit_compatibility_dependency_signal` records whether compatibility content
still appears necessary. It can use the Cockpit inventory and native absorption
map when supplied, and it can see the retained
`legacy_cockpit_compatibility` Workplane node.

This is not deletion authority. A `healthy` or `watch` metric cannot shrink
Legacy Cockpit. Shrink requires a later explicit Legacy Cockpit Shrink Plan.

## 10. Dogfood Readiness Metrics

Dogfood readiness combines:

- `autonomy_yield_signal`
- `delta_noise_signal`
- `resume_latency_signal`
- `research_integration_yield_signal`

The summary helps decide whether to proceed toward Legacy Cockpit Shrink Plan
v0.1 or keep running Longer Augnes-on-Augnes Dogfood v0.1.

## 11. Source Refs

Metric source refs remain pointer-only. They may name docs, Workplane source
refs, GuideBrief debug refs, intent projection refs, runner run ids, batch ids,
delta ids, and smoke refs.

Source refs are not proof writes, evidence writes, durable memory applies,
Perspective applies, runner ledger writes, or delta applies.

## 12. Empty and Insufficient Data

If no runner ledger data is supplied or readable, runner metrics return
`insufficient_data` instead of throwing. Workplane-derived metrics can still be
computed from existing Workplane context.

The product `/workbench` render does not create fixture runs to make metrics
look populated. Empty runner metrics mean the current readback lacks run data,
not that runner output is approved, failed, or safe to ignore.

## 13. Validation Summary

Metrics validation names:

- `smoke:runner-workplane-metrics-v0-1`
- `smoke:guidebrief-intent-projection-v0-1`
- `smoke:guide-workplane-debug-context-v0-1`
- `smoke:workplane-runner-deltabatch-integration-v0-1`

The validation summary records relevant smoke refs. It does not run smokes and
does not become approval authority.

## 14. UI Panel Behavior

`WorkplaneMetricsPanel` renders on `/workbench` with:

- `data-workplane-metrics-panel="v0.1"`
- `data-workplane-metrics-status`

It renders read-only sections:

- summary
- runner metrics
- Workplane metrics
- GuideBrief / intent projection metrics
- stale/fallback metrics
- Cockpit absorption readiness
- dogfood readiness
- authority boundary
- validation summary

It renders no buttons, no forms, no textareas, no inputs, no click handlers,
no form actions, no server actions, no chat composer, and no mutation controls.
The visible copy states metrics are signals, not authority or auto-apply
decisions.

## 15. Browser Sanity Expectation

Because this slice renders a new `/workbench` panel, browser sanity should
verify:

- `/workbench` renders
- `data-workplane-metrics-panel="v0.1"` is present
- `data-guide-workplane-debug-panel="v0.1"` is still present
- `data-guide-intent-projection-panel="v0.1"` is still present
- `data-workplane-intent-mode-panel="v0.1"` is still present
- `data-workplane-panel-id="delta_projection"` is present
- `data-workplane-panel-id="projected_delta_batch"` is present
- `data-workplane-panel-id="delta_batch"` is present
- the metrics panel contains no button, form, input, or textarea
- the metrics panel visibly states metrics are signals, not authority or
  auto-apply decisions
- the metrics panel includes runner, Workplane, stale/fallback, and dogfood
  readiness sections

If Turbopack panic messages appear while `/workbench` still serves 200, report
the caveat. If `/workbench` does not serve 200, this slice is blocked.

## 16. Authority Boundary

Runner / Workplane Metrics denies:

- `can_write_db`
- `can_write_runner_ledger`
- `can_record_proof`
- `can_create_evidence`
- `can_update_work`
- `can_mutate_memory`
- `can_apply_project_perspective`
- `can_apply_durable_memory`
- `can_auto_apply_delta`
- `can_call_provider_openai`
- `can_call_github`
- `can_actuate_github`
- `can_execute_codex`
- `can_execute_runner`
- `can_schedule_runner`
- `can_recover_delta_batch`
- `can_create_branch_or_pr`
- `can_send_handoff`
- `can_merge_publish_retry_replay_deploy`
- `can_delete_legacy_cockpit`

## 17. Not Implemented Yet

This slice explicitly does not add:

- no Legacy Cockpit shrink
- no deletion of Cockpit content
- no metrics-driven auto decision
- no executable projection
- no Workplane persistent mode
- no user metric filter input
- no prompt or chat composer
- no execution button
- no apply/approve/reject control
- no route
- no API write route
- no server action
- no provider/OpenAI call
- no GitHub call or actuation
- no Codex launch or execution
- no branch creation or PR creation from product code
- no runner execution
- no runner tick
- no runner recovery write
- no scheduled runner behavior
- no GuideBrief execution authority
- no DB write or persistence
- no proof/evidence write
- no durable memory apply
- no Perspective apply
- no delta auto-apply
- no merge/publish/retry/replay/deploy behavior
- no `localStorage` or `sessionStorage` durable view mode
- no legacy Cockpit functionality is deleted or shrunk
- no new local-write controls

## 18. Recommended Next Phase

Recommended next phase: Legacy Cockpit Shrink Plan v0.1 after metrics
baseline, if metrics indicate native absorption is ready. If shrink readiness
is still low, run Longer Augnes-on-Augnes Dogfood v0.1 first.
