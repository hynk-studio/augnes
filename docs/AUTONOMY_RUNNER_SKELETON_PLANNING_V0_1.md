# Autonomy Runner Skeleton Planning v0.1

## Purpose

Phase 9G defines the planning contract for a future explicit
operator-approved Autonomy Runner skeleton phase.

Phase 9G is planning only. Phase 9G does not implement a runner skeleton.
Phase 9G does not add execution authority. A future runner skeleton must be
separately scoped and explicitly operator-approved before any implementation
or execution authority can be considered.

Autonomy Runner Preflight remains planning context only. Autonomy Dry-Run Plan
remains preview context only. Readiness remains not authorization. Copy
packets remain review artifacts only. Codex alignment remains instruction-only.
No actual run may start from Phase 9G artifacts.

## Required Interpretation

- Preflight is not approval to run.
- Dry-run is not permission to run.
- Readiness is not authorization.
- Copy packets are not authorization.
- Codex alignment is not authorization.
- Phase 9G planning is not authorization.
- Operator approval is a future gate, not implied by this planning PR.
- No planned future run may execute in Phase 9G.
- No new write authority is introduced in Phase 9G.

`ready_for_future_supervised_runner` still means future supervised review only.
It is not approval, not launch authority, not schedule authority, and not a
runner start condition.

## Future Prerequisites

Before any runner skeleton can be implemented, a later explicitly approved
phase must decide and document:

1. Explicit operator approval model.
2. Run ledger decision.
3. Append-only run record schema decision.
4. Whether writes are allowed at all.
5. Pause / stop / cancel semantics.
6. Manual confirmation step before any run start.
7. Tool execution whitelist.
8. Read-only source whitelist.
9. Write target denylist and later allowlist proposal.
10. Codex launch boundary.
11. GitHub boundary.
12. Provider/OpenAI boundary.
13. DB write boundary.
14. Proof/evidence write boundary.
15. Memory mutation boundary.
16. Perspective apply boundary.
17. Handoff send boundary.
18. Branch/PR creation boundary.
19. Budget spend boundary.
20. External side-effect boundary.
21. Rollback / postmortem requirements.
22. Audit/review packet requirements.
23. Fixture/public-safety requirements.
24. Operator-facing failure states.
25. No-run fallback behavior.

Until those decisions exist, a future runner skeleton must remain out of
scope.

## Future Skeleton Non-Goals

A future skeleton must not default to:

- scheduler behavior
- daemon behavior
- background work
- automatic retry/replay/deploy
- auto-apply
- external posting
- hidden runs
- runs triggered by readiness alone
- runs triggered by copy packets
- runs triggered by ChatGPT App/MCP tool output
- runs triggered by Codex skill output

These non-goals remain controlling unless a later phase explicitly reopens a
specific boundary.

## Planning-Only Allowed Shape

Phase 9G may describe a future interface sketch in prose. It may list future
states. It may list a future gate sequence. It may describe a future no-op
dry-run continuation.

Phase 9G must not include executable code. It must not add an importable runtime
module. It must not add a function, class, route, worker, queue, scheduler, or
daemon that can be invoked. Any future pseudocode must be clearly labeled as
non-executable planning pseudocode.

## Future State Sketch

The following states are planning vocabulary only:

- `not_configured`
- `blocked_by_preflight`
- `awaiting_operator_approval`
- `approved_for_manual_start`
- `dry_run_preview_ready`
- `run_not_started`
- `stopped_before_start`
- `rejected_by_operator`

Active execution states are not implemented and not authorized in Phase 9G.
Examples of out-of-scope active states include `running`, `scheduled`,
`queued`, `executing_codex`, `calling_github`, and `writing_db`.

## Future Gate Sequence

A later approved phase should fail closed until it can prove:

1. The source preflight is present and supported.
2. The dry-run plan is present and `dry_run_only`.
3. Every planned step still has `would_execute: false`.
4. Blockers, warnings, user judgment, and operator review are preserved.
5. Budget, stop, staleness, forbidden-action, and authority boundaries are
   acknowledged.
6. The run ledger and write policy are decided.
7. The operator approval record is explicit, scoped, fresh, and auditable.
8. A manual confirmation step exists before any run start.
9. No execution, write, schedule, external call, handoff send, budget spend, or
   state mutation can occur without the future approval model.

## No-Run Authority Boundary

Phase 9G preserves this no-run authority boundary:

- no runner starts
- no scheduler starts
- no daemon starts
- no background work starts
- no Codex execution
- no GitHub/provider/OpenAI call
- no DB write
- no proof/evidence write
- no memory mutation
- no durable Perspective apply
- no handoff send
- no branch/PR creation
- no auto-apply
- no budget spend
- no external side effect

## Public-Safety Boundary

Phase 9G docs and smoke must remain public-safe:

- no private conversation
- no hidden reasoning
- no secrets/tokens
- no local private paths
- no raw provider output
- no raw retrieval output
- no real account artifacts

## Validation Expectations

`npm run smoke:autonomy-runner-skeleton-planning-v0-1` must verify that this
planning document and the approval gate document preserve the planning-only
boundary, include the future prerequisite list, deny implied approval, and add
no API, UI, App/MCP, runtime, write, runner, scheduler, daemon, worker, queue,
or external side-effect scope.

## Next Phase Readiness

The default recommended next phase is:

```text
Phase 9H - Autonomy Runner ledger and run-record policy planning v0.1, docs/smoke only
```

Moving to an actual supervised runner skeleton requires a separate explicit
operator approval decision. Phase 9G does not provide that approval.
