# Autonomy Runner Execution v0.1

Phase 9 implements a local bounded Autonomy Runner execution path. It can create
an Autonomy Run, execute safe deterministic internal steps, write runner ledger
records, recover a review-only DeltaBatch, and read the recovered DeltaBatch
back from the runner ledger.

This is not another planning, preflight, dry-run, launch-card, or copy-packet
artifact. It is still local/operator scoped and deliberately bounded.

## Purpose

Autonomy Runner v0.1 exists to prove the smallest useful execution loop:

- create a local run record
- tick one deterministic local step at a time
- pause, resume, and cancel without hidden execution
- process due scheduled runs only when the local scheduler is explicitly invoked
- run a bounded watch loop that exits cleanly
- recover run output as a DeltaBatch candidate
- read that DeltaBatch back through runner ledger helpers

The first deterministic internal action is one of:

- `summarize_current_autonomy_context`
- `recover_preflight_delta_batch`
- `generate_runner_status_delta_batch`

Runner steps do not call provider APIs, OpenAI, GitHub, Codex, external posting
surfaces, proof/evidence writers, durable memory writers, or durable
Perspective apply paths.

## Ledger Model

`lib/autonomy/runner-ledger.ts` owns the local durable runner ledger. The four
required tables are:

- `autonomy_runs`
- `autonomy_run_steps`
- `autonomy_run_events`
- `autonomy_run_delta_batches`

The schema is also recorded in `lib/db/schema.sql`. The ledger helper creates
the tables with `CREATE TABLE IF NOT EXISTS` so temp smoke DBs and local
operator DBs do not need a separate migration step before use.

`autonomy_runs` records:

- `run_id`
- `scope`
- `autonomy_contract_ref`
- `status`
- `scheduled_for`
- `started_at`
- `finished_at`
- `created_at`
- `updated_at`
- `stop_reason`
- source refs
- authority boundary snapshot
- budget snapshot

`autonomy_run_steps` records deterministic local step plans and step status
transitions. `autonomy_run_events` is append-only event history. `autonomy_run_delta_batches`
stores recovered DeltaBatch records for readback.

Autonomy Run is an execution record, not an approval record. Runner ledger is
not a proof/evidence ledger.

## Status Lifecycle

Public runner statuses remain present and usable:

- `planned`
- `running`
- `paused`
- `blocked`
- `completed`
- `needs_review`
- `cancelled`

Internal statuses may appear where useful:

- `created`
- `scheduled`
- `failed`
- `stopped`
- `cancel_requested`

A normal manual run starts as `planned`, moves to `running` on tick, and reaches
`completed` after all deterministic local steps complete. If the runner cannot
safely complete, it uses `blocked` or `needs_review` with a clear
`stop_reason` and event record.

Paused runs do not progress on tick. Cancelled runs do not execute additional
steps.

## Runner API

`lib/autonomy/runner.ts` exports:

- `createAutonomyRun(...)`
- `getAutonomyRun(...)`
- `listAutonomyRuns(...)`
- `tickAutonomyRun(...)`
- `pauseAutonomyRun(...)`
- `resumeAutonomyRun(...)`
- `cancelAutonomyRun(...)`
- `recoverDeltaBatchForRun(...)`

`tickAutonomyRun(...)` advances at most one safe deterministic internal step.
It records `step_started` and `step_completed` events and updates the step
record. It never executes a contract-forbidden action as a runner step.

## Scheduler

`lib/autonomy/scheduler.ts` exports:

- `findDueAutonomyRuns(...)`
- `runDueAutonomyRunsOnce(...)`
- `runAutonomySchedulerWatch(...)`

`findDueAutonomyRuns(...)` finds `planned` or `scheduled` runs whose
`scheduled_for <= now`. `runDueAutonomyRunsOnce(...)` processes each due run
once. `runAutonomySchedulerWatch(...)` loops on an interval and accepts
`max_loops` so smoke tests and local validation can exit cleanly.

Watch mode supports an `AbortSignal` and optional SIGINT/SIGTERM handlers. It
does not start from import side effects. Scheduled run is processed only when
the local runner process is explicitly started.

## Local API Routes

The local/operator-scoped routes are:

```text
GET /api/autonomy/runs?scope=project:augnes
POST /api/autonomy/runs
GET /api/autonomy/runs/[id]
POST /api/autonomy/runs/[id]
```

Supported POST actions on `/api/autonomy/runs/[id]` are:

```json
{ "action": "tick" }
{ "action": "pause" }
{ "action": "resume" }
{ "action": "cancel" }
```

Routes are local-host bounded and same-origin guarded for POST. They write only
runner ledger records. They do not call provider APIs, OpenAI, GitHub, Codex,
publish, deploy, merge, post externally, apply Perspective, mutate durable
memory, or write proof/evidence records.

## DeltaBatch Recovery

`recoverDeltaBatchForRun(...)` recovers completed, needs-review, or blocked
runner output as a review-only DeltaBatch and writes it to
`autonomy_run_delta_batches`.

Minimum recovered batch fields are:

- `batch_id`
- `run_id`
- `batch_version`
- `status`
- `title`
- `summary`
- `created_at`
- `delta_count`
- `deltas`
- `source_refs`
- `validation`
- `authority_boundary`

Recovered deltas use existing AugnesDelta vocabulary where practical:

- `coordination_delta`
- `validation_delta`
- `agent_plan_delta`
- `handoff_delta`

DeltaBatch recovery is not durable Perspective apply. DeltaBatch recovery is
not memory mutation. Delta is not source of truth; it is a projection/change
unit.

## Invariants Preserved

- Delta is not source of truth; it is a projection/change unit.
- Research diagnostics are not authority.
- Evidence pointer is not evidence write.
- PR is not merge authority.
- Guide suggestion is not user decision.
- Delta outside an Autonomy Contract boundary cannot be auto_applied.
- Durable memory follows a separate merge policy.
- Stale snapshot based handoff must include a warning.
- Autonomy Run is an execution record, not an approval record.
- Runner ledger is not a proof/evidence ledger.
- Scheduled run is processed only when the local runner process is explicitly started.
- Watch mode does not start from import side effects.
- DeltaBatch recovery is not durable Perspective apply.
- DeltaBatch recovery is not memory mutation.
- Cancelled run does not execute additional steps.
- Paused run does not progress on tick.
- Contract-forbidden action is never executed as a runner step.

## Forbidden Actions

Autonomy Runner v0.1 does not implement or trigger:

- provider/OpenAI calls
- GitHub API calls
- Codex execution
- branch creation from Augnes product code
- PR creation from Augnes product code
- external posting
- publish
- deploy
- merge
- proof/evidence writes
- durable Perspective apply
- durable memory mutation
- hidden daemon auto-start
- auto-apply outside Autonomy Contract
- any contract-forbidden action as a runner step

## Known Deferrals

Workplane and full Delta Projection integration are deferred. The v0.1 proof is
runner-ledger recovery and readback: the runner writes a DeltaBatch to
`autonomy_run_delta_batches`, and smoke tests read it back through
`readRecoveredDeltaBatch(...)`.
