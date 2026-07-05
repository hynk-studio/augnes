# Augnes Intent Continuity Model v0.1

## Purpose

This document defines the first Augnes Intent Continuity Model, or AICM, as a
research and product-alignment model for preserving valid work direction across
broken AI-assisted work episodes.

It is intentionally scoped to modeling, sequencing, and review criteria. It does
not add a route, database table, provider call, GitHub action, Codex execution,
runner behavior, durable memory write, Perspective apply, handoff send,
automation loop, merge/publish/retry/replay/deploy behavior, or any external side
effect.

## Current Repo Fit

Augnes already has the pieces of an intent continuity substrate:

- Current Working Perspective summarizes the active frame, thesis, goals,
  assumptions, questions, risks, next candidates, gaps, staleness, and source
  refs.
- Workplane Continuity Relay derives preserve, warn, stop-if-missing, and
  next-focus anchors from Current Working Perspective, GuideBrief, and Workplane
  context.
- GuideBrief separates observed, inferred, suggested, and user-judgment material.
- AugnesDelta and Delta Projection provide a common change/projection vocabulary.
- Recent scoped write slices add local applied CurrentWorkingPerspective records
  and snapshots without replacing upstream source tables or the live current
  perspective route.

AICM does not replace these contracts. It names the common function that should
hold them together: preserve the working intent invariants that make the next
valid work step possible.

## Core State

AICM treats an Augnes work state as:

```text
S_t = (N_t, D_t, R_t, J_t, A_t, X_t, H_t)
```

Where:

```text
N_t = normative layer
```

The desired state: user goals, requirements, constraints, priorities, authority
limits, and product posture.

```text
D_t = descriptive layer
```

The observed state: repository files, PRs, diffs, tests, runtime records, review
artifacts, source refs, and actual implemented behavior.

```text
R_t = residual layer
```

The remaining gap between the normative layer and descriptive layer.

```text
R_t = Gap(N_t, D_t)
```

This is the most important state in the model. Progress is not PR existence,
work volume, document count, or smoke count. Progress is a decrease in relevant,
evidence-backed residuals.

```text
J_t = judgment layer
```

The review rationale: why a claim is trusted, partial, stale, blocked, or
rejected, and what evidence anchors that judgment.

```text
A_t = action frontier
```

The next valid actions: Codex prompts, ChatGPT review focus, operator decisions,
local checks, route integration tasks, or explicit stop/refetch/refresh actions.

```text
X_t = handoff surface
```

The boundary condition that allows the next episode to recover enough state to
continue correctly.

```text
H_t = intent validity horizon
```

A health estimate for how far the current state can safely guide future work
before needing operator review, source refresh, or repo-grounded verification.

## Evolution Function

The core AICM development function is:

```text
F_AICM(S_t, O_{t+1}, B_t) -> (S_{t+1}, X_{t+1}, a_{t+1})
```

Where:

- `S_t` is the current intent continuity state.
- `O_{t+1}` is the next observation bundle: conversation, PR, diff, test output,
  Codex report, source refs, runtime records, or operator correction.
- `B_t` is the current budget: time, token, review cost, user attention, and
  operational risk.
- `S_{t+1}` is the reconciled next state.
- `X_{t+1}` is the next handoff surface.
- `a_{t+1}` is the next recommended action.

Expanded:

```text
Z_{t+1} = Phi(O_{t+1})
S'_{t+1} = Reconcile(S_t, Z_{t+1})
S_{t+1} = ValidateAndNormalize(S'_{t+1})
X_{t+1} = CompressToHandoff(S_{t+1})
a_{t+1} = argmax_a U(a | S_{t+1}, B_t)
```

`Phi` extracts candidate state patches from observations. LLM output, PR body
text, and docs are candidate signals, not state truth.

`Reconcile` joins new observations with existing state using source authority:
user statements primarily update goals and constraints, repo/test evidence
primarily updates observed implementation state, and model summaries remain
lower-authority candidate interpretation.

`ValidateAndNormalize` prevents fake closure, source-less completion, silent goal
mutation, stale-anchor reuse, and document-only progress masquerading as feature
completion.

`CompressToHandoff` produces the next boundary condition instead of a vague
summary.

## Progress Function

For residuals `r_i`:

```text
M_R(S_t) = sum_i w_i * (1 - p_i) * u_i
```

Where:

- `w_i` is residual importance.
- `p_i` is current evidence-backed satisfaction, from `0` to `1`.
- `u_i` is uncertainty or risk weight.

Real progress for an action is:

```text
Delta_real(a) = M_R(S_t) - M_R(S_{t+1})
                - lambda * Drift(a)
                - mu * Debt(a)
                - nu * Uncertainty(a)
```

This means a PR, route, contract, or doc slice only counts as progress when it
reduces a priority residual or increases the system's ability to reduce that
residual safely.

A useful next action should maximize:

```text
a* = argmax_a E[Delta_real(a) + alpha * Delta_H(a)
                - beta * Cost(a)
                - gamma * IrreversibleRisk(a)]
```

`Delta_H` is improvement to the intent validity horizon.

## Handoff Surface

A valid AICM handoff surface is not a prose recap. It is a boundary condition:

```text
X_t = (G, R, E, C, J, A, Q)
```

Where:

- `G` = active goals.
- `R` = active residuals.
- `E` = critical evidence and source refs.
- `C` = binding constraints and authority limits.
- `J` = current judgment and rationale.
- `A` = next action pressure.
- `Q` = unresolved questions or stop-if-missing conditions.

The handoff is valid when recovering from `X_t` preserves the same next-action
judgment that the fuller state would have produced.

```text
Recover(X_t) ~ S_t
```

Here `~` means work-equivalent, not text-identical. Two states are
work-equivalent when they preserve active residual judgments, evidence anchors,
authority boundaries, and valid next actions.

## Current Adjustment For Augnes

At the current repo stage, AICM should adjust Augnes development in these ways:

1. Treat Workplane Continuity Relay as the existing handoff-boundary skeleton,
   not as a final continuity model.
2. Treat Current Working Perspective as the current high-level state carrier,
   but not as the full residual graph.
3. Treat local applied CurrentWorkingPerspective snapshots as scoped applied views,
   not upstream source-of-truth replacement.
4. Define the next product slice as a read-only Intent Continuity Packet derived
   from Current Working Perspective, Continuity Relay, GuideBrief, applied CWP
   snapshot records, Codex result review material, and source refs.
5. Require each next-work recommendation to name which residual it reduces, which
   evidence supports that claim, and which authority boundary still blocks
   stronger application.

## Near-Term Product Slice

The next bounded implementation target should be:

```text
Intent Continuity Packet v0.1
```

It should be a read-only derived packet with no new authority. It should expose:

- active goals
- active residuals
- evidence-backed satisfaction state
- fake-closure warnings
- source freshness and gaps
- next valid action candidates
- stop-if-missing blockers
- handoff surface material
- intent validity horizon metrics

It should be visible from Agent Workplane first. Blank State may later consume a
compact operator-facing summary.

Suggested first contract shape:

```text
IntentContinuityPacket {
  packet_version
  scope
  as_of
  active_goals[]
  residuals[]
  evidence_anchors[]
  judgment_notes[]
  action_frontier[]
  handoff_surface
  intent_validity_health
  source_refs
  authority_boundary
}
```

Suggested residual shape:

```text
IntentResidual {
  residual_id
  requirement_ref
  statement
  priority
  satisfaction
  uncertainty
  status
  evidence_refs[]
  source_refs[]
  blockers[]
  next_action_refs[]
  fake_closure_warnings[]
}
```

Suggested statuses:

```text
unstarted
claimed_satisfied
partially_satisfied
evidence_verified
blocked
superseded
stale
unknown
```

`claimed_satisfied` and `evidence_verified` must remain separate. A Codex report,
PR body, or guide summary may produce a claim. Repo evidence, tests, review, or
operator confirmation are required before verification.

## Development Phases

### Phase 0: Model alignment

Add this model document and use it to evaluate the next implementation slice.

### Phase 1: Read-only Intent Continuity Packet

Create a type-only contract, deterministic builder, fixture, and smoke check from
existing read models. No DB write, no source table mutation, no route replacement,
no handoff send, no Codex execution.

### Phase 2: Workplane display

Render the packet in Agent Workplane as residuals, evidence anchors, stop
conditions, and next-action pressure. This should reduce operator review cost,
not create action buttons.

### Phase 3: PR and Codex result review linkage

Map Codex result reports and PR review artifacts into residual updates as
candidate patches. Keep them review-only until verified.

### Phase 4: Scoped residual ledger

Only after the read-only packet proves useful, add a scoped local residual ledger
for candidate residual state and review history. This should not become committed
Perspective state by itself.

### Phase 5: Intent validity horizon metrics

Compute health signals such as anchor coverage, residual clarity, source
freshness, contradiction entropy, drift risk, and action specificity.

## Non-Goals

AICM v0.1 does not:

- make Augnes autonomous
- let ChatGPT execute Codex
- let Workplane create PRs
- merge PRs
- write durable memory
- mutate upstream Current Working Perspective source tables
- replace `/api/perspective/current`
- apply Perspective
- send handoff automatically
- call OpenAI, GitHub, providers, crawlers, browser observers, graph stores,
  vector stores, or RAG pipelines
- treat retrieval as authority
- treat documents as implementation
- treat PR existence as progress

## Review Rule

Every future Augnes PR that claims to improve continuity should answer:

1. Which residual did this reduce?
2. Which evidence verifies the reduction?
3. Which next action became safer, clearer, or cheaper?
4. Which authority boundary remains closed?
5. Did the intent validity horizon increase, decrease, or stay unknown?

If a PR cannot answer those questions, it may still be useful, but it should not
claim intent continuity progress.
