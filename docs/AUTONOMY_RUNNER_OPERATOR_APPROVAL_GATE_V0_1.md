# Autonomy Runner Operator Approval Gate v0.1

## Purpose

This document defines the explicit operator approval gate that any later
Autonomy Runner skeleton must pass before implementation or execution authority
can be considered.

Operator approval is not implied by preflight readiness. Operator approval is
not implied by a dry-run plan. Operator approval is not implied by copy packet
review. Operator approval is not implied by Codex alignment. Operator approval
is not implied by ChatGPT App/MCP preview tool output.

Operator approval must be explicit, phase-scoped, and auditable. Phase 9G does
not create the approval mechanism; it only documents required properties. A
later phase must separately define the approval mechanism before runner
execution exists.

## Approval Gate Requirements

A future approval gate must require:

- operator identity or local operator context
- exact scope, for example `project:augnes`
- exact run target
- source preflight id
- source dry-run id
- preflight readiness
- blocker status
- warning status
- required user judgment status
- required operator review status
- budget boundary acknowledged
- stop conditions acknowledged
- stale-source status acknowledged
- forbidden actions acknowledged
- authority boundary acknowledged
- `dry_run_only` acknowledged
- every planned step with `would_execute: false` acknowledged
- run ledger/write policy decision acknowledged
- rollback/postmortem expectation acknowledged
- explicit expiration or freshness window
- explicit denial path
- no implicit approval through UI read, App/MCP read, copy packet read, or
  Codex summary

## Fail-Closed Requirements

A future implementation must fail closed when:

- preflight is missing
- preflight is `not_supported`
- blockers exist
- required user judgment is unresolved
- required operator review is unresolved
- budget is missing or unacknowledged
- stop condition is active
- source is stale enough to block
- forbidden action is requested
- authority boundary is unclear
- planned step `would_execute` is anything other than `false` in
  preflight/dry-run preview
- source composition is unknown
- operator approval expired
- operator approval scope mismatch
- ledger/write policy is unresolved

Fail-closed means no runner starts, no schedule is created, no background work
starts, no write occurs, no external call occurs, and no run record is treated
as approved.

## Explicit Denials

The approval gate must explicitly deny:

- auto-approval
- approval inferred from readiness
- approval inferred from `ready_for_future_supervised_runner`
- approval inferred from copy/manual-copy packet
- approval inferred from App/MCP tool call
- approval inferred from Codex summary
- approval inferred from browser visibility
- approval inferred from successful smoke tests
- approval inferred from merged PR unless the PR explicitly scopes execution
  authority, which Phase 9G does not

## Non-Approval Surfaces

The following surfaces may help humans review planning context, but they do not
approve execution:

- Autonomy Runner Preflight
- Autonomy Dry-Run Plan
- Agent Workplane preview panel
- ChatGPT App/MCP read-only preview tool
- local copy/manual-copy packet
- Codex alignment skill output
- browser visibility
- smoke test success
- merged docs/smoke PR

## No-Run Boundary

Phase 9G does not create approval authority and does not create execution
authority:

- no runner starts
- no scheduler starts
- no daemon starts
- no background work starts
- no queue or worker starts
- no Codex execution
- no GitHub/provider/OpenAI call
- no DB write
- no proof/evidence write
- no memory mutation
- no durable Perspective apply
- no handoff send
- no branch/PR creation from Augnes product code
- no auto-apply
- no budget spend
- no external side effect

## Future Approval Record Shape

A future phase may define an approval record only after the operator explicitly
scopes that work. At minimum, that later record should bind the operator
context, scope, target, preflight id, dry-run id, readiness, blockers,
warnings, user judgment, operator review, budget boundary, stop conditions,
staleness, forbidden actions, authority boundary, dry-run-only acknowledgment,
planned-step `would_execute: false` acknowledgment, ledger/write policy,
expiration, denial path, and rollback/postmortem expectation.

This document is not that approval record.
