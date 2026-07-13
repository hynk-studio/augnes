# Augnes vNext Evaluation and Maturity

## Purpose

Separate development correctness from post-Alpha usefulness validation.

During R2–R8, Augnes is judged by whether the product flow is implemented, operable, and mechanically safe. After feature completion, Augnes is judged by whether it is genuinely more useful than coordinating ChatGPT or Codex directly.

## Development maturity

| Level | Name | Requirement |
|---:|---|---|
| 0 | Intent | problem or design only |
| 1 | Tested component | implementation with focused behavior tests |
| 2 | Integrated path | real producer and consumer connected |
| 3 | Operable flow | user-facing path works without internal operator procedures |
| 4 | Feature-complete flow | R2–R8 golden path works end to end |
| 5 | Useful product | repeated real use shows measurable benefit |

A document, type, fixture, panel, table, preview, smoke, or PR does not advance maturity by itself.

## R2–R8 merge gates

Normal development PRs require only the checks appropriate to the changed path:

- type and build correctness
- focused unit or integration tests
- disposable-database migration, writer, readback, and recovery tests when persistence changes
- automated browser/CDP coverage when user flows change
- no unauthorized durable write
- no cross-project leakage or conflicting replay
- no unbounded provider egress or credential leakage

The following are not ordinary merge gates during R2–R8:

- long manual operator runbooks
- real-project dogfood
- usefulness scores
- every-platform visual review
- long-running evidence-chain qualification
- multiple-provider or multiple-host proof

## Operability criteria

Feature completion requires the normal path to avoid making the user act as a database, process, security, or integration operator.

Target budgets:

- normal startup environment variables: 0
- user-managed long-running processes: 0
- user-selected ports or internal URLs: 0
- manual DB and migration commands: 0
- TaskContextPacket or result copy/paste: 0
- internal ID, nonce, fingerprint, TTL, or checksum handling: 0
- ordinary durable semantic change approval: one meaningful user decision

A feature is not operable when its safety depends on the user correctly performing an internal protocol.

## Alpha verification

Run after R2–R8 are feature-complete.

Purpose:

- find critical workflow breaks missed by automation
- confirm that a user can complete one real task without learning internal architecture
- verify that setup, task execution, result return, semantic approval, and later reuse form one coherent flow

This should be a short product-use session, not a forensic operator qualification.

## Release-candidate verification

Add bounded real-world checks for:

- provider and Codex/native-host round trips
- migration, backup, restore, and failed-upgrade recovery
- secret and private-data handling
- durable semantic transition correctness
- packaged startup and shutdown

Manual qualification is justified here when automation cannot establish the final environment-dependent property.

## Post-Alpha usefulness evaluation

The core hypothesis is:

> Reviewed temporal context, evidence lineage, and explicit decisions reduce repeated explanation, wrong-context correction, and time to the first correct action.

Primary metrics:

### Resume

- time to first correct action
- repeated explanation amount
- wrong-context corrections
- stale or missing critical context

### Verify

- receipt completeness
- source and lineage coverage
- skipped-check visibility
- contradiction and stale-state detection

### Decide

- review time and decision debt
- duplicate or ignored proposals
- transition traceability
- decision reversal caused by missing context

### Operability

- setup actions
- manual copy/paste actions
- recovery actions requiring internal knowledge
- user-visible failure recovery time

### Comparative value

Compare representative tasks against direct ChatGPT or Codex use:

- total user effort
- repeated context explanation
- successful task completion
- correction rate
- preference after repeated use

## Outcome claims

Do not claim usefulness from one fixture, one synthetic run, one self-evaluation, or the existence of a feedback record.

Usefulness requires repeated real tasks and user review. Product development should not be blocked waiting for that evidence before the complete product flow exists.

## Go, narrow, or stop

After post-Alpha evaluation:

- **Go** when Augnes reduces effort or errors without excessive review burden.
- **Narrow** when only a subset such as continuity, semantic review, or cross-host lineage provides value.
- **Stop or redesign** when Augnes remains harder to use than direct host use without a compensating measurable benefit.
