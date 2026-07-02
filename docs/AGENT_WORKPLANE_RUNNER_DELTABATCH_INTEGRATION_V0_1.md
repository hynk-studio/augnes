# Agent Workplane Runner DeltaBatch Integration v0.1

## 1. Status and Scope

Status: Recovered DeltaBatch to Workplane Integration v0.1.

Scope: Agent Workplane now reads existing recovered runner DeltaBatches from
the autonomy runner ledger and exposes them as read-only review context in the
Workplane read context, node/panel context, and a native Workplane panel.

This slice adds:

- `lib/workplane/read-runner-delta-batches-for-workplane.ts`
- `runner_delta_batch_read` on `readWorkplaneContext()`
- runner DeltaBatch refs in `workplane-node-context.ts`
- `components/workplane/runner-delta-batch-panel.tsx`
- this document
- `scripts/smoke-workplane-runner-deltabatch-integration-v0-1.mjs`

## 2. Why This Exists

Autonomy runner recovery already writes `RecoveredAutonomyDeltaBatch` records
to the runner ledger. Before this slice, Agent Workplane could show projected
Delta Projection batch context, but recovered runner DeltaBatches were not
visible as native Workplane review context.

This integration makes recovered runner DeltaBatches useful to agents without
granting any new authority. They are review candidates for inspection, not
approvals, applies, proof/evidence records, runner commands, or durable state
changes.

## 3. Data Read From the Runner Ledger

The Workplane reader reads existing recovered DeltaBatch records from the
runner ledger:

- run id
- run title and run status
- batch id
- batch title and summary
- batch created timestamp
- delta count
- validation status
- source refs
- related step ids
- related event ids
- related delta ids
- runner authority notes

When a temp DB path is passed, smoke setup can create a fixture run, tick it to
completion, and recover a DeltaBatch through existing runner APIs before the
Workplane reader reads it back. Normal Workplane reads do not call recovery or
runner lifecycle APIs.

For the default app DB path, the reader opens the ledger read-only. If the DB
or runner schema is absent, it returns an explicit empty state instead of
throwing.

## 4. Projected vs Recovered DeltaBatches

Projected Delta Projection batches and recovered runner DeltaBatches are
different sources:

- Projected Delta Projection batches come from the Delta Projection read model.
  They remain preview context for projected deltas, gaps, snapshots,
  diagnostics, and evidence pointers.
- Recovered runner DeltaBatches come from `autonomy_run_delta_batches` after an
  existing runner recovery has already written them to the runner ledger.
  Workplane only reads them back.

The existing `DeltaBatchPanel` is labeled as projected Delta Batch context and
uses `data-workplane-panel-id="projected_delta_batch"` with
`data-workplane-node-id="perspective_delta"`. The native Delta Projection panel
keeps `data-workplane-panel-id="delta_projection"`.

The new `RunnerDeltaBatchPanel` is labeled as recovered runner DeltaBatch
context and keeps `data-workplane-panel-id="delta_batch"` with
`data-workplane-node-id="runner_delta_batch"`.

These IDs are intentionally separate so future GuideBrief Workplane Debug
Context can distinguish a selected Delta Projection panel from the projected
Delta Batch preview panel and from recovered runner DeltaBatch ledger readback.

## 5. Workplane Read Context Shape

`WorkplaneContextRead` now includes:

- `runner_delta_batch_read`
- `overview.runner_delta_batch.recovered_batch_count`
- `overview.runner_delta_batch.recovered_delta_count`
- `overview.runner_delta_batch.latest_batch_id`
- `overview.runner_delta_batch.latest_run_id`
- `overview.runner_delta_batch.latest_validation_status`
- `source_status.runner_delta_batch`
- `fallback_reason.runner_delta_batch`

The runner read exposes:

- `status`
- `scope`
- `limit`
- `as_of`
- `recovered_batch_count`
- `recovered_delta_count`
- `latest_batch_id`
- `latest_run_id`
- `latest_validation_status`
- `batches`
- `empty_state`
- `source_status`
- `fallback_reason`
- `staleness`
- `fallback_status`
- `authority_boundary`
- `validation_summary`
- `debug_notes`

## 6. Node and Panel Context Integration

`workplane-node-context.ts` now materializes runner DeltaBatch context when
recovered runner batches exist:

- `delta_batch` / `runner_delta_batch` can become `ready` when ledger readback
  has recovered batches.
- `projected_delta_batch` remains projected Delta Projection preview context
  and sources Delta Projection refs, projected batch ids, projected delta ids,
  staleness, and fallback context.
- `runner_state` can become `ready` from recovered runner DeltaBatch readback.
- related run ids are sourced from recovered batches.
- related batch ids are sourced from recovered batch ids.
- related delta ids are sourced from recovered batch deltas.
- related step and event ids are sourced from run records and runner source
  refs where available.
- source refs preserve recovered runner refs separately from projected Delta
  Projection refs.

No node status is an approval, apply, or execution signal.

## 7. UI Panel Behavior

`RunnerDeltaBatchPanel` renders in Agent Workplane with stable metadata:

- `data-workplane-panel-id="delta_batch"`
- `data-workplane-node-id="runner_delta_batch"`
- `data-workplane-node-kind="runner_context_source"`
- `data-workplane-node-status` based on read data

The panel shows latest recovered batch summary, run id, batch id, delta count,
validation status, source ref count, related step/event/delta refs, authority
boundary notes, and an empty state when no recovered DeltaBatch exists.

It adds no apply, approve, reject, execute, recover, tick, schedule, send, or
launch button behavior.

`DeltaBatchPanel` remains the projected Delta Batch preview panel and renders
with stable metadata:

- `data-workplane-panel-id="projected_delta_batch"`
- `data-workplane-node-id="perspective_delta"`
- `data-workplane-node-kind="preview_panel"`
- `data-workplane-node-status="preview_only"`

It is not a runner ledger source. `delta_batch` / `runner_delta_batch` are the
recovered runner DeltaBatch ledger readback identities.

## 8. Source Ref Expectations

Runner DeltaBatch source refs remain pointer-only. They can include:

- `autonomy_run:*`
- `autonomy_run_step:*`
- `autonomy_run_event:*`
- `autonomy_run_delta_batch:*`
- `delta:*`
- autonomy contract refs
- GuideBrief refs
- handoff refs
- Codex launch card refs
- Current Working Perspective refs
- Delta Projection refs
- preflight refs
- docs refs
- repo refs

These refs are review context. They are not proof writes, evidence writes,
approval records, Perspective applies, or durable memory applies.

## 9. Validation Summary Expectations

Runner DeltaBatch Workplane context names:

- `smoke:workplane-runner-deltabatch-integration-v0-1`

The smoke verifies static contract wiring, empty state behavior, a temp-ledger
fixture path, projected-vs-recovered distinction, and authority boundaries.

## 10. Staleness, Fallback, and Empty State

Recovered runner DeltaBatch staleness is bounded by the latest recovered batch
`created_at`. If no recovered batch exists, staleness is represented as empty
or unknown. If the DB or runner schema is absent, fallback is explicit and the
Workplane read does not throw.

Empty state means no recovered runner DeltaBatch is available. It does not
mean the runner is currently running, blocked, approved, or failed.

## 11. Authority Boundary

Workplane reads are read-only:

- no new runner execution behavior is added
- no recovery write behavior is added to Workplane reads
- no scheduled runner behavior is added
- no GuideBrief debug panel is added
- no GuideBrief intent projection is added
- no provider/OpenAI/GitHub/Codex execution is added
- no DB write or persistence is added by Workplane reads
- no proof/evidence write is added
- no durable memory apply is added
- no Perspective apply is added
- no delta auto-apply is added
- no legacy Cockpit functionality is deleted

## 12. GuideBrief Preparation

GuideBrief Workplane Debug Context v0.1 now uses the recovered runner
DeltaBatch node to explain runner-derived review candidates, source refs,
validation status, fallback status, and authority boundaries.

This integration slice itself did not implement GuideBrief debug behavior or
intent projection. The follow-on debug context remains read-only and adds no
GuideBrief intent projection, runner execution, recovery write, scheduled
runner behavior, provider/OpenAI/GitHub/Codex execution, DB write,
proof/evidence write, durable memory apply, Perspective apply, or delta
auto-apply.

## 13. Not Implemented Yet

This v0.1 integration intentionally does not implement:

- new runner execution behavior
- automatic recovery from Workplane reads
- Workplane buttons that recover DeltaBatches
- Workplane buttons that tick or schedule runners
- GuideBrief Workplane Debug Context
- GuideBrief debug panel
- GuideBrief intent projection
- Workplane intent mode
- external actuation
- provider/OpenAI calls
- GitHub execution or actuation
- Codex launch or execution
- proof/evidence writes
- durable memory apply
- Perspective apply
- delta auto-apply
- merge/publish/retry/replay/deploy behavior
- legacy Cockpit shrink or deletion
- new local-write controls

Recommended next phase: GuideBrief Workplane Debug Context v0.1.
