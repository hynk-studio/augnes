# Agent Workplane v0.1

## 1. Status and Scope

Status: Phase 5A Agent Workplane Shell and Phase 5B Agent Workplane Panels, v0.1.

Scope: `/workbench` is reframed as Agent Workplane: a backend work surface for agent/operator traces, projection candidates, handoff context, evidence pointers, validation context, and existing Cockpit compatibility content.

Phase 5A adds a read-only Workplane shell, header, overview cards, boundary card, compatibility panel, a thin workplane context read helper, this document, and a focused static smoke. It preserves the existing Cockpit content instead of deleting or replacing it.

Phase 5B extracts focused read-only Agent Workplane panels for work queue, Current Perspective, Delta Projection, Review Queue, Evidence/Handoff, and inspector context. It does not redo the shell, remove Cockpit compatibility, add writes, add route changes, execute agents, launch Codex, or apply deltas.

## 2. Surface Model

The route model remains:

```text
/ = Human Surface home
/perspective = Perspective Human Timeline
/workbench = Agent Workplane
```

The Human Surface remains the human-facing entry. Perspective remains the human review timeline. Workbench becomes the backend/operator work surface.

Agent Workplane renders:

- `Agent Workplane` header
- links to `/` and `/perspective`
- read-only boundary copy
- Current Working Perspective compact summary
- Augnes Delta Projection compact summary
- Trace context summary
- review queue counts
- source/fallback status
- work queue/context scope summary
- pointer-only inspector for handoff, Codex result, evidence, and latest delta refs
- focused read-only panels for Work Queue, Current Perspective, Delta Projection,
  Review Queue, Evidence/Handoff, and Workplane Inspector context
- existing Cockpit compatibility content

## 3. Existing Cockpit Preservation

Phase 5A keeps `AugnesCockpit` mounted inside `LegacyCockpitCompatibilityPanel`.

This preserves existing Work Brief, Handoff, Perspective, Bridge, Operator, trace, and diagnostic visibility while the surrounding information architecture moves from Cockpit-as-main-human-product-surface to Agent-Workplane-as-backend/operator-surface.

Phase 5B adds focused Agent Workplane panels around the existing compatibility content. It does not deep-extract or delete Cockpit functionality.

## 4. Data Sources and Fallback

Agent Workplane uses `lib/workplane/read-workplane-context.ts` as a thin alias/aggregator over the Phase 4 read-only helpers:

```text
readCurrentPerspectiveForHumanSurface()
readDeltaProjectionForHumanSurface()
```

Preferred Current Working Perspective source:

```text
GET /api/perspective/current?scope=project:augnes
x-augnes-local-readonly: current-working-perspective-v0.1
```

Fallback source:

```text
fixtures/current-working-perspective.sample.v0.1.json
```

Preferred Delta Projection source:

```text
GET /api/augnes/read/deltas?scope=project:augnes
x-augnes-local-readonly: augnes-delta-projection-v0.1
```

Fallback source:

```text
fixtures/augnes-delta-projection.sample.v0.1.json
```

The Agent Workplane UI exposes source status and fallback reason. Fixture fallback is disclosed and is not presented as live runtime state.

## 5. Overview Semantics

The Workplane overview shows:

- current thesis
- active goals count
- open questions count
- active risks count
- research pressure
- projected delta count
- Delta Batch count
- projection gap count
- evidence pointer count
- review queue counts for needs-review, blocked, manual-review, and validation-required delta refs
- source/fallback status
- staleness status

Projected deltas remain read-model inputs. Delta status, review hints, evidence pointers, artifact pointers, handoff refs, and Codex result refs are inspection context only.

## 6. Authority Boundary

This PR adds read-only Agent Workplane UI/IA only. It does not add DB schema/migration, DB writes, MCP/App tools, provider/OpenAI calls, GitHub actuation, Codex execution, proof/evidence writes, durable Perspective state apply, memory mutation, product-write, scheduler/autonomy runner, merge/publish/retry/replay/deploy behavior, or external side effects.

Agent Workplane cannot:

- write DB rows
- create or update work
- run agents
- launch Codex
- call providers or OpenAI
- call GitHub
- write proof or evidence
- mutate memory
- apply durable Perspective state
- approve or apply deltas
- publish externally
- merge
- retry, replay, or deploy
- schedule hidden automation

No approve, apply, reject, send, launch, publish, retry, replay, deploy, or persistence controls are added in Phase 5A.

## 7. Fallback and Empty States

Required visible states:

- Current Working Perspective unavailable: fixture fallback is disclosed.
- Delta Projection unavailable: fixture fallback is disclosed.
- No projected deltas: the overview and inspector say no projected deltas are materialized.
- No active goals: the work queue panel says no active work goals are materialized.
- No review queue refs: the review queue card says no review queue delta refs are materialized.
- No handoff/Codex/evidence refs: the inspector shows pointer counts as zero.
- No handoff refs: the inspector says no handoff refs materialized yet.
- No run/postmortem source: the inspector says run postmortem source is not
  materialized yet.

No fixture is silently presented as runtime data.

## 8. Phase 5B Panels

Phase 5B extracts focused read-only panels without redoing the shell:

- Work Queue panel
- Current Perspective Workplane panel
- Delta Projection Workplane panel
- Review Queue panel
- Evidence/Handoff panel
- Workplane Inspector

Panel semantics:

- Work Queue shows active goals, active work ids, and next candidate counts as
  read-only queue hints.
- Current Perspective shows thesis, frame summary, open questions, source
  status, staleness, and research pressure without exposing raw diagnostics by
  default.
- Delta Projection shows projected deltas, Delta Batch count, gaps, evidence
  pointers, and latest delta titles as read-model inputs only.
- Review Queue shows needs-review, blocked, manual-review, validation,
  Project Perspective, durable-memory, and user-decision delta refs as operator
  attention hints only.
- Evidence/Handoff shows pointer-only evidence, handoff, artifact, and Codex
  result refs. It does not create evidence, send handoffs, or launch Codex.
- Workplane Inspector shows compact pointer, merge-policy, non-goal, and
  boundary context for projected deltas. It does not add approve, apply, send,
  launch, publish, merge, retry, replay, deploy, save, reset, rollback, or
  persistence controls.

Phase 5B preserves the same no-write, no-execution, no-hidden-authority boundary.

Phase 5C remains deferred.

## 9. Smoke Plan

`npm run smoke:agent-workplane-shell-v0-1` checks:

- package script pointer exists
- `/workbench` route still exists
- `/workbench` renders `AgentWorkplane`
- Agent Workplane shell/header/overview/boundary/compatibility components exist
- links to `/` and `/perspective` exist
- visible copy includes `Agent Workplane`
- visible copy includes read-only/no hidden execution authority boundary
- existing `AugnesCockpit` compatibility content remains reachable
- Workplane context uses Current Working Perspective and Delta Projection read helpers
- no mutating HTTP method, provider/OpenAI/GitHub/Codex execution, proof/evidence write, scheduler/autonomy runner, or route/write behavior is introduced in the new Workplane files

`npm run smoke:agent-workplane-panels-v0-1` checks:

- package script pointer exists
- `/workbench` still routes through `AgentWorkplane`
- shell/header/overview/boundary/legacy compatibility content remain reachable
- Work Queue, Current Perspective, Delta Projection, Review Queue,
  Evidence/Handoff, and Workplane Inspector panel components exist
- panel copy includes read-only, pointer-only, source/fallback, and no hidden
  execution authority boundaries
- panel files use `WorkplaneContextRead` and existing read-only context
  summaries
- no route, DB schema/migration, DB write, MCP/App tool, provider/OpenAI/GitHub
  runtime call, Codex execution, proof/evidence write, scheduler/autonomy
  runner, merge/publish/retry/replay/deploy behavior, or external side effect is
  introduced

## 10. Validation

Minimum validation for Phase 5B:

```bash
npm run typecheck
npm run smoke:augnes-delta-contract-v0-1
npm run smoke:augnes-delta-projection-v0-1
npm run smoke:augnes-delta-projection-route-v0-1
npm run smoke:current-working-perspective-v0-1
npm run smoke:current-working-perspective-route-v0-1
npm run smoke:human-surface-home-v0-1
npm run smoke:perspective-human-timeline-v0-1
npm run smoke:agent-workplane-shell-v0-1
npm run smoke:agent-workplane-panels-v0-1
git diff --check
```

If files are staged, also run:

```bash
git diff --cached --check
```
