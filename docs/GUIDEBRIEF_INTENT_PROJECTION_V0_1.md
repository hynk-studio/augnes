# GuideBrief Intent Projection v0.1

## 1. Status and Scope

Status: GuideBrief Intent Projection v0.1.

Scope: this slice translates a user intent string plus existing Agent
Workplane / GuideBrief debug context into a structured, reversible projection
packet. It can focus panels, suppress irrelevant refs, prioritize panels,
suggest view modes, and create draft handoff, runner config, and Perspective
update candidates.

Intent Projection is allowed to create view projections and draft candidate
packets. It is not allowed to execute those candidates.

## 2. Why This Exists

Agent Workplane now has stable panel and node IDs, recovered runner DeltaBatch
readback, and GuideBrief Workplane Debug Context. GuideBrief Intent Projection
uses those read-only packets to answer: given this user intent, which Workplane
context should be emphasized, what should be hidden as irrelevant for this
view, what candidates could be prepared as drafts, and what still needs human
judgment.

This is a reversible projection layer, not a source-of-truth layer.

## 3. How It Builds on Debug Context

`lib/guide/workplane-intent-projection.ts` consumes GuideBrief Workplane Debug
Context and Agent Workplane node context. It does not read the runner ledger
directly. It does not call runner lifecycle helpers, routes, fetch, providers,
OpenAI, GitHub, Codex, DB writes, browser storage, or persistence.

The default `/workbench` selection is:

- `selected_panel_id: "delta_batch"`
- `selected_node_id: "runner_delta_batch"`
- `debug_question: "How should the Workplane focus runner and DeltaBatch review?"`

The default intent is:

```text
Focus the Workplane on runner and DeltaBatch review.
```

## 4. Input Shape

`WorkplaneIntentProjectionInput` supports:

- `original_user_intent`
- `scope`
- `selected_panel_id`
- `selected_node_id`
- `selected_run_id`
- `selected_step_id`
- `selected_event_id`
- `selected_batch_id`
- `selected_delta_id`
- `selected_handoff_ref`
- `debug_question`
- `now`
- `max_focus_refs`
- `max_candidate_actions`

Unknown, empty, ambiguous, stale, fallback, or executable-looking intent is
represented in the output instead of throwing.

## 5. Output Shape

`WorkplaneIntentProjection` includes:

- `projection_id`
- `projection_version`
- `created_at`
- `scope`
- `original_user_intent`
- `interpreted_intent`
- `intent_class`
- `projection_level`
- `projection_status`
- `target_surface`
- `focus_refs`
- `suppressed_refs`
- `prioritized_panels`
- `suggested_panel_modes`
- `candidate_actions`
- `candidate_handoffs`
- `candidate_runner_configs`
- `candidate_perspective_updates`
- `display_filters`
- `source_refs`
- `stale_warnings`
- `authority_boundary`
- `needs_user_judgment`
- `reversibility`
- `validation_summary`
- `debug_context_refs`
- `notes`

## 6. Supported Intent Classes

Supported classes are:

- `debug`
- `navigate`
- `review`
- `handoff`
- `run_planning`
- `dogfood`
- `research`
- `implementation`
- `cleanup`
- `metric_review`
- `perspective_alignment`
- `unknown`

Classification is deterministic and local. It is rule-based, not a model call.

## 7. Projection Levels and Statuses

Projection levels are:

- `view_projection`
- `draft_projection`
- `executable_projection_deferred`

v0.1 may describe executable projection as deferred, but no executable
projection is implemented.

Projection statuses are:

- `projected`
- `partial`
- `needs_user_judgment`
- `unsupported`
- `empty_intent`

## 8. View Projection Behavior

`lib/workplane/apply-workplane-view-projection.ts` is a pure non-durable view
transform despite the word `apply` in the filename. It returns:

- `ordered_panel_ids`
- `highlighted_panel_ids`
- `hidden_panel_ids`
- `focus_refs`
- `suppressed_refs`
- `display_filters`
- `notes`

It does not mutate Agent Workplane node context. It does not write DB state,
call routes, call runner/provider/GitHub/Codex, persist view mode, use
`localStorage`, use `sessionStorage`, or create browser state.

## 9. Draft Projection Behavior

Draft projections may create:

- draft candidate actions
- draft handoff candidates
- draft runner config candidates
- draft Perspective update candidates

Drafts are data packets. They are not commands, approvals, sends, applies,
runner ticks, runner schedules, recovery writes, Codex launches, GitHub
actuations, branch creation, PR creation, proof/evidence writes, or durable
state changes.

## 10. Candidate Action Behavior

Candidate actions are preview-only or require user judgment. They name possible
checks such as source-ref inspection or validation review. They are never
executable commands.

## 11. Candidate Handoff Behavior

Candidate handoffs are draft-only packet candidates. They may prepare context
for a future Codex handoff, operator review, or GuideBrief preview, but they do
not send a handoff, launch Codex, create a branch, open a PR, call GitHub, or
call providers/OpenAI.

## 12. Candidate Runner Config Behavior

Candidate runner configs are draft-only review candidates. They may name
related run, batch, and delta refs from the selected debug context. They do not
execute a runner, tick a runner, schedule a runner, recover a DeltaBatch, write
the runner ledger, or create a run.

## 13. Candidate Perspective Update Behavior

Candidate Perspective updates are draft-only lens/update candidates. They do
not apply Perspective state, mutate memory, write durable memory, or
auto-apply deltas.

## 14. Display Filters

Display filters are pure view filters. They may name included panel IDs and
suppressed ref patterns, but suppression is reversible UI projection only. It
does not delete refs, hide source truth, mutate Workplane state, or persist
view mode.

## 15. Source Refs

Source refs come from GuideBrief Workplane Debug Context and Agent Workplane
node context. They remain pointer-only. They are not proof writes, evidence
writes, durable memory applies, Perspective applies, runner ledger writes, or
delta applies.

## 16. Stale and Fallback Warnings

Stale and fallback warnings are copied or derived from the selected debug
context. If a projection relies on stale, unknown, fallback, partial, or
unmatched context, it adds `needs_user_judgment` rather than silently treating
the projection as fresh runtime truth.

## 17. Needs User Judgment

Intent Projection adds `needs_user_judgment` when:

- intent is empty
- intent class is unsupported
- executable-looking language is present
- selected debug context is not matched
- stale or fallback context may affect review quality

Executable-looking language remains deferred and must be handled by existing
approved Autonomy Contract / Runner boundaries or by human/operator action
outside product code.

## 18. Reversibility and Dismissibility

`WorkplaneIntentReversibility` states:

- `reversible: true`
- `durable_state_changed: false`
- `dismissible: true`
- reset behavior describing how to return to the unprojected Workplane view
- notes that no durable state was changed

## 19. Authority Boundary

Intent Projection allows only:

- `can_change_ui_view: true`
- `can_create_draft_projection: true`
- `can_create_handoff_candidate: true`
- `can_create_runner_config_candidate: true`
- `can_create_perspective_candidate: true`

It denies:

- `can_apply_perspective`
- `can_mutate_memory`
- `can_execute_runner`
- `can_schedule_runner`
- `can_recover_delta_batch`
- `can_call_provider_openai`
- `can_call_github`
- `can_actuate_github`
- `can_execute_codex`
- `can_create_branch_or_pr`
- `can_auto_apply_delta`
- `can_write_db`
- `can_write_runner_ledger`
- `can_record_proof`
- `can_create_evidence`
- `can_merge_publish_retry_replay_deploy`
- `can_send_handoff`

## 20. Projected vs Recovered DeltaBatch Distinction

Intent Projection preserves the stable identity split:

- `delta_projection / perspective_delta` is native Delta Projection context.
- `projected_delta_batch / perspective_delta` is projected Delta Projection
  preview batch context.
- `delta_batch / runner_delta_batch` is recovered runner DeltaBatch ledger
  readback context.

The default runner/DeltaBatch projection prioritizes `delta_batch`,
`projected_delta_batch`, `delta_projection`, `trace_diagnostics`,
`review_queue`, `workplane_inspector`, and `handoff_builder_preview` so
projected preview batches stay visibly separate from recovered runner
DeltaBatches.

## 21. UI Panel Behavior

`GuideIntentProjectionPanel` renders with:

- `data-guide-intent-projection-panel="v0.1"`
- `data-guide-intent-class`
- `data-guide-intent-projection-level`
- `data-guide-intent-projection-status`

`WorkplaneIntentModePanel` renders with:

- `data-workplane-intent-mode-panel="v0.1"`
- `data-workplane-intent-class`
- `data-workplane-intent-projection-status`

Both panels are read-only. They render no buttons, forms, textareas, inputs,
click handlers, form actions, server actions, chat composer, or mutation
controls.

## 22. Browser Sanity Expectation

Browser sanity should verify `/workbench` renders and exposes:

- `data-guide-workplane-debug-panel="v0.1"`
- `data-guide-intent-projection-panel="v0.1"`
- `data-workplane-intent-mode-panel="v0.1"`
- `data-workplane-panel-id="delta_projection"`
- `data-workplane-panel-id="projected_delta_batch"`
- `data-workplane-panel-id="delta_batch"`
- no button, form, input, or textarea inside the intent projection panels
- visible distinction between projected Delta Batch and recovered runner
  DeltaBatch
- visible reversible/dismissible and non-executable projection copy

If Turbopack panic messages appear while `/workbench` still serves 200, report
the caveat. If `/workbench` does not serve 200, this slice is blocked.

## 23. Not Implemented Yet

This slice explicitly does not add:

- no executable projection
- no GuideBrief execution authority
- no Workplane persistent mode
- no user intent text input
- no chat composer
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
- no DB write or persistence
- no proof/evidence write
- no durable memory apply
- no Perspective apply
- no delta auto-apply
- no merge/publish/retry/replay/deploy behavior
- no `localStorage` or `sessionStorage` durable view mode
- no legacy Cockpit shrink or deletion
- no new local-write controls

No legacy Cockpit functionality is deleted.

## 24. Recommended Next Phase

Recommended next phase: Runner / Workplane Metrics v0.1 before Legacy Cockpit
Shrink Plan v0.1.

Reason: Intent Projection keeps native Workplane and GuideBrief context
distinguishable, but the system still needs lightweight metrics for whether
runner DeltaBatch review, projected Delta Projection preview, stale warnings,
and draft candidates are actually useful before planning Cockpit shrinkage.
