# Augnes vNext Evaluation and Maturity

## Purpose

Separate development correctness from post-Alpha usefulness validation.

During R2–R8, Augnes is judged by whether the interactive flow, bounded automation path, and any active Personal Perspective slice are implemented, operable, and mechanically safe. After feature completion, Augnes is judged by whether it is genuinely more useful than coordinating ChatGPT or Codex directly.

## Development maturity

| Level | Name | Requirement |
|---:|---|---|
| 0 | Intent | problem or design only |
| 1 | Tested component | implementation with focused behavior tests |
| 2 | Integrated path | real producer and consumer connected |
| 3 | Operable flow | user-facing path works without internal operator procedures |
| 4 | Feature-complete flow | interactive and bounded automated R2–R8 golden paths work end to end |
| 5 | Useful product | repeated real use shows measurable benefit |

A document, type, fixture, panel, table, preview, smoke, or PR does not advance maturity by itself.

## R2–R8 merge gates

Normal development PRs require only the checks appropriate to the changed path:

- type and build correctness
- focused unit or integration tests
- disposable-database migration, writer, readback, and recovery tests when persistence changes
- automated browser/CDP coverage when user flows change
- shared lifecycle tests when interactive and policy-triggered runs are affected
- no unauthorized durable write
- no automation authority expansion beyond policy/grant
- no cross-project leakage or conflicting replay
- no unbounded provider egress or credential leakage

The following are not ordinary merge gates during R2–R8:

- long manual operator runbooks
- broad real-project dogfood
- usefulness scores
- every-platform visual review
- long-running evidence-chain qualification
- multiple-provider or multiple-host proof
- proof that advanced Autohunt heuristics are useful
- proof that Personal Perspective improves every task

## Semantic authority guardrails

The following are zero-tolerance correctness guardrails for any implemented path
that can produce, reuse, export, or restore structured semantic material:

- `semantic_layer_collapse_incidents = 0`: a Receipt is not treated as accepted
  Evidence; a Claim does not become state without Decision and Transition; a
  Decision is not applied as Transition; an assessment is not persisted as
  project truth.
- `unreviewed_structured_context_injection = 0`: an unreviewed host result,
  assessment, or pending proposal does not enter a later `TaskContextPacket` as
  durable reviewed context.
- `authority_drift_after_export_restore = 0`: candidate, reviewed, accepted,
  rejected, deferred, retracted, superseded, and applied authority/lifecycle do
  not change through export/import or restore.

Focused quality measures, where the corresponding path exists, are:

- success-criterion assessment source coverage
- semantic-delta item source coverage
- preservation of `unknown` when support is insufficient
- proposal → decision → transition → later-context traceability
- projection rebuild consistency against restored canonical records

Semantic object count, edge count, graph density, schema count, and panel count
are not quality metrics. These correctness measures belong to R2–R8 merge
verification for the changed path; long dogfood and demonstrated usefulness
remain post-Alpha evidence.

## Operability criteria

Feature completion requires the normal path to avoid making the user act as a database, process, security, scheduler, or integration operator.

Target budgets:

- normal startup environment variables: 0
- user-managed long-running processes: 0
- user-selected ports or internal URLs: 0
- manual DB and migration commands: 0
- TaskContextPacket or result copy/paste: 0
- internal ID, nonce, fingerprint, TTL, or checksum handling: 0
- ordinary durable semantic change approval: one meaningful user decision
- ordinary automation control: visible enable/pause/cancel, not internal policy editing

A feature is not operable when its safety depends on the user correctly performing an internal protocol.

## Automation maturity

Bounded automation is part of feature completion, not a post-Alpha experiment.

Minimum R2–R8 evidence:

- policy-triggered and interactive work share the same project scope and Core contracts
- a bounded grant controls budget, capability, timeout, retry eligibility, and stop conditions
- run start, completion, failure, cancellation, and orphan reconciliation are observable
- returned work produces a `RunReceipt`
- automated work can create reviewable proposals but cannot silently commit semantic state
- restart and exact replay do not duplicate or lose a run

Advanced hunt quality, self-prioritization, long-horizon autonomy, and scheduler optimization remain post-feature-completion evaluation topics.

## Personal Perspective maturity

Personal Perspective may progress in parallel without becoming a prerequisite for unrelated R2–R8 work.

A bounded slice is integrated when:

- the user can create, review, revise, remove, and scope the material
- project inclusion is explicit
- context selection records `why_included`
- it uses the same `TaskContextPacket`, `RunReceipt`, lineage, and feedback paths as other context
- hidden or automatic cross-project injection is absent

Its usefulness can be evaluated as soon as the slice is operable, but lack of outcome evidence does not block unrelated mainline PRs.

## Alpha verification

Run after the core R2–R8 flow is feature-complete.

Purpose:

- find critical workflow breaks missed by automation
- confirm that a user can complete one real interactive task without learning internal architecture
- confirm that one bounded automated task starts, returns, stops, and reaches review coherently
- verify that setup, task execution, result return, semantic approval, and later reuse form one coherent flow
- try one Personal Perspective-assisted task when that bounded lane is ready

This should be a short product-use session, not a forensic operator qualification.

## Release-candidate verification

Add bounded real-world checks for:

- provider and Codex/native-host round trips
- automation pause, cancel, budget, stop, and reconciliation
- migration, backup, restore, and failed-upgrade recovery
- secret and private-data handling
- durable semantic transition correctness
- packaged startup and shutdown

Manual qualification is justified here when automation cannot establish the final environment-dependent property.

## Post-Alpha usefulness evaluation

The core hypothesis is:

> Reviewed temporal context, evidence lineage, explicit decisions, and bounded automation reduce repeated explanation, wrong-context correction, coordination burden, and time to the first correct action.

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
- decision change per unit of review burden
- duplicate or ignored proposals
- transition traceability
- decision reversal caused by missing context

### Operability

- setup actions
- manual copy/paste actions
- recovery actions requiring internal knowledge
- user-visible failure recovery time

### Automation

- user interventions per completed automated run
- pause/cancel success
- duplicate or orphan run count
- policy/budget violation count
- reviewable-result return rate
- useful work completed without semantic-authority overreach

### Personal Perspective

- scoped inclusion rate
- helpful versus misleading context feedback
- removal or correction rate
- cross-project leakage count
- whether the user prefers it enabled for representative tasks

### Comparative value

Compare representative tasks against direct ChatGPT or Codex use:

- total user effort
- repeated context explanation
- successful task completion
- correction rate
- preference after repeated use

## Outcome claims

Do not claim usefulness from one fixture, one synthetic run, one self-evaluation, or the existence of a feedback record.

Usefulness requires repeated real tasks and user review. Product development should not be blocked waiting for that evidence before the complete product flow and minimal Automation Spine exist.

## Go, narrow, or stop

After post-Alpha evaluation:

- **Go** when Augnes reduces effort or errors without excessive review burden.
- **Narrow** when only a subset such as continuity, bounded automation, semantic review, Personal Perspective, or cross-host lineage provides value.
- **Stop or redesign** when Augnes remains harder to use than direct host use without a compensating measurable benefit.
