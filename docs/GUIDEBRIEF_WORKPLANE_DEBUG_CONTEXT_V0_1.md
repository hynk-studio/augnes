# GuideBrief Workplane Debug Context v0.1

## 1. Status and Scope

Status: GuideBrief Workplane Debug Context v0.1.

Scope: this slice extends GuideBrief with a read-only debug context for
selected Agent Workplane panels, nodes, and related refs. It explains why a
selected Workplane context is showing, which source refs support it, what is
observed versus inferred, what is stale or fallback-sourced, which validation
smoke applies, what needs user judgment, and what Codex could inspect next as
a preview-only debug handoff candidate.

It does not implement GuideBrief Intent Projection. The follow-on GuideBrief
Intent Projection v0.1 now consumes this debug context as its selected
Workplane basis while preserving the same no-execution boundary.

## 2. Why This Exists

Agent Workplane now exposes stable panel and node IDs. GuideBrief needs a way
to open the hood on those IDs without becoming an execution layer. Debug
Context gives Codex, ChatGPT, future agents, and operators a compact packet
that explains a selected panel, node, run, step, event, batch, delta, or
handoff ref.

This makes Workplane state explainable before GuideBrief Intent Projection.
The v0.1 intent layer now refers to the same stable IDs without guessing which
rendered panel was selected.

## 3. GuideBrief Authority

GuideBrief Workplane Debug Context extends GuideBrief without changing
GuideBrief authority. It preserves the existing separation:

- Observed: source-backed Workplane node/context facts only.
- Inferred: derived interpretation with caveats.
- Suggested: candidate debug, navigation, or validation checks only.
- Needs user judgment: unresolved operator decisions only.

The debug packet may create only a preview-only Codex debug handoff candidate.
It must not launch Codex, create a branch, open a PR, send anything, or execute
anything.

GuideBrief Intent Projection v0.1 is documented in
`docs/GUIDEBRIEF_INTENT_PROJECTION_V0_1.md`. It creates reversible view
projections and draft candidate packets from this debug context while
preserving no executable projection, no durable mutation, no route, no server
action, no chat composer, no runner behavior, no external authority, no
Perspective apply, no durable memory apply, and no delta auto-apply.

## 4. Selection Inputs

`GuideWorkplaneDebugSelectionInput` supports partial selection:

- `selected_panel_id`
- `selected_node_id`
- `run_id`
- `step_id`
- `event_id`
- `batch_id`
- `delta_id`
- `handoff_ref`
- `debug_question`

No field is required. Unknown or incomplete selection returns
`not_found`, `partial_match`, or `ambiguous` context without throwing.

Default `/workbench` selection is:

- `selected_panel_id: "workplane_inspector"`
- `selected_node_id: "source_ref_bridge"`
- `debug_question: "Why is this Workplane context shown here?"`

## 5. Output Shape

`GuideWorkplaneDebugContext` includes:

- `debug_context_id`
- `debug_version`
- `scope`
- `as_of`
- `selected_context`
- `observed`
- `inferred`
- `suggested`
- `needs_user_judgment`
- `source_refs`
- `debug_trace`
- `validation_summary`
- `stale_warnings`
- `authority_boundary`
- `codex_debug_handoff_candidate`

The packet is deterministic for supplied input and node context.

## 6. Selected Context

`selected_context` records:

- `selection_status`
- `selected_panel_id`
- `selected_node_id`
- `matched_panel_id`
- `matched_node_id`
- `matched_kind`
- `matched_status`
- `title`
- `summary`
- related run, step, event, batch, delta, and handoff refs
- `source_refs`
- `fallback_status`
- `staleness`
- `validation_summary`
- `debug_notes`

Selection status values are:

- `matched`
- `partial_match`
- `not_found`
- `ambiguous`

## 7. Source Refs

Source refs are pointer-only. They are copied from
`AgentWorkplaneNodeContextRead.panels` and the top-level Workplane node
context. They may name Current Perspective refs, Delta Projection refs,
runner DeltaBatch refs, run refs, step refs, event refs, batch refs, delta
refs, handoff refs, diagnostic refs, docs, and smoke refs.

They are not proof writes, evidence writes, durable memory applies,
Perspective applies, or delta applies.

## 8. Debug Trace

`debug_trace` explains:

- which selection fields were supplied
- how matching was performed against Workplane panels/nodes
- whether the result was matched, partial, not found, or ambiguous
- that the authority boundary was preserved

The trace is explanatory. It is not a route log, runner trace, provider trace,
Codex execution trace, or proof record.

## 9. Validation Summary

`validation_summary` names applicable smoke refs. It includes:

- `smoke:guide-workplane-debug-context-v0-1`
- `smoke:guide-brief-v0-1`
- `smoke:agent-workplane-node-contract-v0-1`
- `smoke:workplane-runner-deltabatch-integration-v0-1`
- any smoke refs already attached to the selected Workplane node context

GuideBrief debug does not run validation. It only names candidate checks.

## 10. Stale, Fallback, and Judgment Behavior

Stale and fallback metadata are copied from Workplane node context. When a
selected context is stale, unknown, fallback-backed, ambiguous, partial, or not
found, the packet adds stale warnings and/or needs-user-judgment items.

The packet must not hide fallback status. It must not present fallback or
stale state as fresh runtime truth.

## 11. Projected vs Recovered DeltaBatch Distinction

GuideBrief debug must preserve the ID separation fixed before this slice:

- `delta_projection / perspective_delta` is the native Delta Projection panel.
- `projected_delta_batch / perspective_delta` is projected Delta Projection
  preview context.
- `delta_batch / runner_delta_batch` is recovered runner DeltaBatch ledger
  readback context.

The IDs are intentionally separate so GuideBrief debug selection is
unambiguous. Projected Delta Projection batches must not be blurred with
recovered runner DeltaBatches.

## 12. UI Panel Behavior

`GuideWorkplaneDebugPanel` renders in `/workbench` with:

- `data-guide-workplane-debug-panel="v0.1"`
- `data-guide-workplane-debug-selected-panel-id`
- `data-guide-workplane-debug-selected-node-id`
- `data-guide-workplane-debug-selection-status`

The panel renders read-only sections:

- Selected context
- Observed
- Inferred
- Suggested
- Needs user judgment
- Source refs
- Debug trace
- Validation summary
- Stale warnings
- Authority boundary
- Codex debug handoff candidate

It renders no buttons, forms, textareas, inputs, click handlers, form actions,
server actions, chat composer, or mutation controls.

## 13. Browser Sanity Expectation

Because this slice renders a new Workplane panel, browser sanity should verify
`/workbench` renders and exposes:

- `data-guide-workplane-debug-panel="v0.1"`
- `data-workplane-panel-id="delta_projection"`
- `data-workplane-panel-id="projected_delta_batch"`
- `data-workplane-panel-id="delta_batch"`
- no button, form, input, or textarea inside the debug panel
- visible Observed, Inferred, Suggested, and Needs user judgment sections

If local browser validation is unavailable, static smoke must cover the same
metadata and authority boundaries.

## 14. Authority Boundary

GuideBrief Workplane Debug Context denies:

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
- `can_create_branch_or_pr`
- `can_send_handoff`
- `can_merge_publish_retry_replay_deploy`
- `can_create_ui_action`
- `can_project_intent`

## 15. Not Implemented Yet

This slice explicitly adds:

- no GuideBrief intent projection
- no Workplane intent mode
- no user intent parser
- no prompt or chat composer
- no execution button
- no apply, approve, or reject control
- no route
- no API write route
- no server action
- no provider/OpenAI call
- no GitHub call or actuation
- no Codex launch or execution
- no branch or PR creation from product code
- no runner execution
- no runner tick
- no runner recovery write
- no scheduled runner behavior
- no DB write or persistence
- no proof/evidence write
- no durable memory apply
- no Perspective apply
- no delta auto-apply
- no merge, publish, retry, replay, or deploy behavior
- no legacy Cockpit shrink or deletion
- no new local-write controls

Recommended next phase: GuideBrief Intent Projection v0.1.

Follow-on status: GuideBrief Intent Projection v0.1 is now implemented as a
view/draft projection only. The debug context itself remains read-only
explanation context and still adds no execution authority.
