# Agent Workplane Node / Panel Contract v0.1

## 1. Status and Scope

Status: Agent Workplane Node / Panel Contract v0.1.

Scope: this contract gives existing Agent Workplane panels and absorption-map
targets stable read-context IDs and typed metadata so future GuideBrief
Workplane Debug Context and GuideBrief Intent Projection can reference the
Workplane without scraping visible copy or depending on unstable component
names.

This slice adds:

- `types/agent-workplane-node.ts`
- `lib/workplane/workplane-node-context.ts`
- stable `data-workplane-*` attributes on key existing Workplane panels
- this document
- `scripts/smoke-agent-workplane-node-contract-v0-1.mjs`

The original node contract did not add Runner / DeltaBatch Workplane
integration. The follow-on Recovered Runner DeltaBatch Integration v0.1 now
uses this contract to expose recovered runner DeltaBatch readback as read-only
review context. The contract still does not add a new GuideBrief debug panel,
GuideBrief intent projection, new runner behavior, a route, a DB write or
persistence path, provider/OpenAI/GitHub/Codex execution, durable memory apply,
Perspective apply, delta auto-apply, or legacy Cockpit deletion.

The follow-on GuideBrief Workplane Debug Context v0.1 now consumes this
contract to explain selected Workplane panels, nodes, and refs. The node
contract remains the stable identity layer; the debug context remains
read-only and adds no intent projection or execution authority.

The follow-on GuideBrief Intent Projection v0.1 now consumes this contract
through GuideBrief Workplane Debug Context to create reversible view
projections and draft candidate packets. It relies on stable panel IDs such as
`delta_projection`, `projected_delta_batch`, and `delta_batch` so native Delta
Projection, projected Delta Batch preview, and recovered runner DeltaBatch
readback remain distinguishable. The node contract itself remains read-only
and adds no executable projection, persistent Workplane mode, route, write,
runner behavior, external authority, durable memory apply, Perspective apply,
or delta auto-apply.

The follow-on Workplane State Proposal Review v0.1 now uses this contract for
the stable `state_proposal_review` panel/node and the
`proposal_review_context` node kind. The node contract remains read-only; State
Proposal Review adds proposal review context only and no approve, reject,
commit, apply, write, execution, or external authority.

Exact boundary statement: no GuideBrief debug panel is added, no GuideBrief
intent projection is added, no new runner execution behavior is added, no
recovery write behavior is added to Workplane reads, no scheduled runner
behavior is added, no route is added, no DB write or persistence is added by
Workplane reads, no provider/OpenAI/GitHub/Codex execution is added, no durable
memory apply is added, no Perspective apply is added, no legacy Cockpit
deletion occurs, and no legacy Cockpit functionality is deleted.

## 2. Why This Contract Exists

Agent Workplane is the AI-first operational surface for agents, Codex,
ChatGPT, and local runners to inspect Augnes state, handoff context, review
pressure, source refs, validation context, and retained Cockpit compatibility.
Future GuideBrief work needs a stable way to say which Workplane panel or node
is being explained, debugged, or used as an intent-projection source.

The contract separates stable identity from implementation details:

- `panel_id` names a stable Workplane panel or compatibility path.
- `node_id` names the stable context node that future GuideBrief logic may
  target.
- `kind` describes whether the node is native, preview-only, retained
  compatibility, debug context, handoff context, runner context, or trace
  context.
- status, staleness, fallback, validation, and authority fields keep the
  context honest about what is live, preview-only, or not materialized.

## 3. GuideBrief Enablement

Future GuideBrief Workplane Debug Context can consume this contract to explain
why a Workplane panel shows a value, which source refs back it, whether fixture
fallback is active, and which smoke validation covers it.

Future GuideBrief Intent Projection can use the same IDs to point suggestions
at stable Workplane targets. That later projection must still be suggestion
only until a separate authority slice explicitly adds any action path. This
v0.1 contract is read context only.

## 4. Required Fields

Each `AgentWorkplaneNodeContext` records:

- `panel_id`
- `node_id`
- `kind`
- `title`
- `summary`
- `status`
- `created_at`
- `updated_at`
- `source_refs`
- `related_run_ids`
- `related_step_ids`
- `related_event_ids`
- `related_batch_ids`
- `related_delta_ids`
- `related_handoff_refs`
- `authority_boundary`
- `validation_summary`
- `staleness`
- `fallback_status`
- `debug_notes`

`AgentWorkplanePanelContext` uses the same fields for panels. The top-level
`AgentWorkplaneNodeContextRead` records contract version, scope, `as_of`,
source refs, authority boundary, validation summary, staleness, fallback
status, panel contexts, node contexts, and debug notes.

## 5. Stable Panel IDs

The v0.1 stable Workplane panel IDs are:

- `work_queue`
- `current_perspective`
- `delta_projection`
- `review_queue`
- `review_memory_detail`
- `state_proposal_review`
- `evidence_handoff`
- `workplane_inspector`
- `projection_candidates`
- `projected_delta_batch`
- `delta_batch`
- `handoff_builder_preview`
- `run_postmortem`
- `trace_diagnostics`

The v0.1 absorption-map target IDs are:

- `current_objective`
- `handoff_context`
- `perspective_delta`
- `source_ref_bridge`
- `trace_bridge`
- `authority_validation_debug`
- `runner_state`
- `runner_delta_batch`
- `run_postmortem`
- `trace_diagnostics`
- `state_proposal_review`

`delta_projection` and `projected_delta_batch` are intentionally separate
panel IDs even though both point at the `perspective_delta` context node.
`delta_projection` names the native Delta Projection panel.
`projected_delta_batch` names projected Delta Projection preview context.
`delta_batch` / `runner_delta_batch` names recovered runner DeltaBatch ledger
readback context. The IDs are separate so future GuideBrief debug selection is
unambiguous.

## 6. Stable Node Kinds

Allowed node kinds are:

- `native_panel`
- `preview_panel`
- `debug_context_source`
- `proposal_review_context`
- `handoff_context_source`
- `runner_context_source`
- `trace_context_source`

Kinds are descriptive only. They do not grant write, apply, execution, or
external authority.

## 7. Status Semantics

Allowed node statuses are:

- `ready`: source-backed enough to be treated as a stable read context.
- `partial`: useful native context exists but the full legacy capability is
  not completely absorbed yet.
- `preview_only`: visible as preview context without write or execution
  authority.
- `not_materialized`: reserved in the contract but not backed by a live source
  yet.
- `empty`: a native panel exists but has no materialized source rows.
- `needs_review`: review context is materialized and requires user attention.
- `blocked`: the panel is intentionally blocked from action authority.
- `stale`: source staleness is known and should be disclosed.
- `fallback`: fixture or empty fallback is active and must be disclosed.

## 8. Source Refs Expectations

`source_refs` must stay pointer-only. They may include Current Working
Perspective refs, Augnes Delta Projection refs, delta IDs, batch IDs, handoff
refs, evidence pointer refs, artifact pointer refs, diagnostic refs, and
source/fallback notes. They are not proof writes, evidence writes, or source of
truth promotion.

The helper derives source refs from existing `readWorkplaneContext()` output,
especially `current_perspective_read`, `delta_projection_read`,
`runner_delta_batch_read`, source/fallback status, Current Perspective `as_of`,
Delta Projection `as_of`, runner DeltaBatch `as_of`, and related source ref
arrays. Recovered runner source refs stay separate from projected Delta
Projection refs.

`projected_delta_batch` must derive source refs from `delta_projection_read`.
It must not source runner ledger refs. `delta_batch` / `runner_delta_batch`
derive recovered runner refs from `runner_delta_batch_read`.

## 9. Related Ref Expectations

Related refs are explicit arrays:

- `related_run_ids`
- `related_step_ids`
- `related_event_ids`
- `related_batch_ids`
- `related_delta_ids`
- `related_handoff_refs`

Missing refs must be represented as empty arrays, not guessed.
`projected_delta_batch` related batch and delta refs are projected read-model
refs from Delta Projection. `delta_batch` / `runner_delta_batch` related run,
step, event, batch, and delta refs are recovered runner ledger readback refs
only. Recovered runner DeltaBatch refs are populated only when the runner
ledger readback has existing recovered batches. Missing runner batches remain
empty or `not_materialized`, not errors.

## 10. Authority Boundary Expectations

Every node context preserves the Agent Workplane authority boundary:

- no DB write
- no proof/evidence write
- no provider/OpenAI call
- no GitHub call or actuation
- no Codex execution
- no runner execution
- no scheduler behavior
- no durable memory apply
- no Perspective apply
- no delta auto-apply
- no merge/publish/retry/replay/deploy behavior

Authority fields are explicit booleans and remain `false` in v0.1.

## 11. Validation Summary Expectations

`validation_summary` records the relevant smoke script names and concise notes.
For this slice the primary validation is:

- `smoke:agent-workplane-node-contract-v0-1`
- `smoke:agent-workplane-cockpit-inheritance-v0-1`
- `smoke:agent-workplane-shell-v0-1`
- `smoke:agent-workplane-panels-v0-1`
- `smoke:agent-workplane-projection-handoff-v0-1`
- `smoke:workplane-runner-deltabatch-integration-v0-1`

Validation summary does not imply live runtime execution, human approval, or
authority to apply any change.

## 12. Staleness and Fallback Expectations

`staleness` records the source status, `as_of` / `updated_at` timestamps, and
notes. Existing Current Perspective staleness is preserved where available.
Delta Projection staleness is bounded by its `as_of` timestamp.

`fallback_status` records whether the node is backed by runtime, fixture
fallback, empty fallback, or not materialized. Fixture fallback must remain
visible and must not be presented as live runtime state.

## 13. Legacy Cockpit Removal

Legacy Cockpit compatibility was represented explicitly during the route split
stage, then removed in Cockpit Route Removal v0.1 after zero-count readiness was
verified.

- `/cockpit` route removed.
- `components/augnes-cockpit.tsx` removed.
- `components/workplane/legacy-cockpit-compatibility-panel.tsx` removed.
- `legacy_cockpit_compatibility` is not an active Workplane panel or node ID.

Route removal is documented in `docs/COCKPIT_ROUTE_REMOVAL_V0_1.md`. Migrated
capabilities remain represented in Blank State, Agent Workplane, Workplane State
Proposal Review, and Manual Controls Migration rows.

## 14. UI Metadata

`WorkplanePanelShell` accepts optional stable metadata:

- `panelId`
- `nodeId`
- `nodeKind`
- `nodeStatus`

It renders them as:

- `data-workplane-panel-id`
- `data-workplane-node-id`
- `data-workplane-node-kind`
- `data-workplane-node-status`

The removed Legacy Cockpit compatibility panel is no longer part of active
metadata. No new visible buttons, controls, forms, or action surfaces are added
by this contract.

## 15. Not Implemented Yet

This v0.1 contract itself intentionally does not implement:

- GuideBrief intent projection
- Workplane intent mode
- new runner execution behavior
- recovery write behavior from Workplane reads
- scheduled runner behavior
- DB write
- route or API write route
- MCP/App tool
- provider/OpenAI call
- GitHub execution or actuation
- Codex launch or execution
- proof/evidence write
- durable memory apply
- Perspective apply
- delta auto-apply
- legacy Cockpit shrink or deletion
- new local-write controls

Recovered runner DeltaBatch Workplane readback is documented in
`docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md`.

Recommended next phase: GuideBrief Workplane Debug Context v0.1.
