# Augnes Current Working Perspective v0.1

## 1. Status and Scope

Status: Phase 3A read-model contract/helper, v0.1.

Scope: repo-local read-only packet for synthesizing `PerspectiveSnapshot` and
`AugnesDeltaProjectionReadModel` into a stable Current Working Perspective for
future Human Surface, GuideBrief, Timeline, Handoff Capsule, and Autonomy
Contract consumers.

Phase 3A adds docs, types, a pure helper, a public-safe fixture, a static
smoke, a package script pointer, and an index pointer only. It adds no UI,
route, API route, DB schema or migration, DB write, persistence, MCP/App tool,
provider/OpenAI call, GitHub actuation, Codex execution, proof/evidence write,
durable Perspective state apply, memory mutation, product-write behavior,
scheduler, autonomy runner, merge, publish, retry, replay, deploy, or external
side effect.

## 2. Purpose

`CurrentWorkingPerspective` is the read-only packet that answers:

- What is the current derived frame?
- Which goals, assumptions, questions, risks, and next candidates are active?
- Which projected deltas matter most right now?
- Which source refs, freshness notes, and gaps should downstream consumers
  preserve?
- Which authority boundaries keep the packet from becoming source-of-truth
  state or apply authority?

The packet is intentionally broader than a snapshot and narrower than durable
state. It is a stable read model for consumer surfaces, not an execution or
approval surface.

## 3. Inputs

Phase 3A has two required inputs:

- `PerspectiveSnapshot`: derived source context over committed state basis,
  work trace basis, tensions, boundary-next guidance, missing context, and
  log-only research diagnostics.
- `AugnesDeltaProjectionReadModel`: projected deltas, batches, source refs,
  source counts, gaps, snapshot refs, diagnostic refs, and conservative merge
  policies.

Project Constellation refs may be included as contextual refs only. They do
not become source-of-truth state and do not grant graph, persistence, UI,
route, agent-routing, or handoff execution authority.

## 4. Output Shape

`CurrentWorkingPerspective` includes:

- `runtime`
- `perspective_version`
- `projection_version`
- `snapshot_version`
- `scope`
- `as_of`
- `current_frame`
- `current_thesis`
- `active_goals`
- `accepted_assumptions`
- `rejected_assumptions`
- `open_questions`
- `active_risks`
- `research_pressure`
- `next_candidates`
- `last_major_delta_refs`
- `review_queue_hints`
- `source_refs`
- `staleness`
- `gaps`
- `authority_boundary`
- `next_phase_notes`

The output is deterministic for the provided inputs. It performs no source
collection by itself.

## 5. Source Mapping

### PerspectiveSnapshot

`PerspectiveSnapshot` maps into:

- `current_frame`: snapshot current frame summary, primary state keys, active
  work ids, pressure level, and source refs.
- `current_thesis`: bounded synthesis of committed-state basis, work trace
  basis, and delta projection counts.
- `active_goals`: active work trace items and their recent work-event refs.
- `accepted_assumptions`: committed state basis refs only.
- `open_questions`: missing context and open tensions.
- `active_risks`: open tensions and source gaps.
- `research_pressure`: pending proposal pressure and log-only research
  diagnostics.
- `next_candidates`: boundary-next guidance.
- `source_refs`: snapshot source refs and diagnostic refs.

Accepted assumptions are derived only from committed state basis refs. Phase
3A must not invent durable assumptions or user preferences from temporary
work events, coordination events, handoffs, private traces, or diagnostic
pressure.

### AugnesDeltaProjectionReadModel

`AugnesDeltaProjectionReadModel` maps into:

- `last_major_delta_refs`: recent projected delta refs.
- `review_queue_hints`: needs-review, blocked, manual-review, validation,
  project-perspective, durable-memory, and user-decision delta ids.
- `rejected_assumptions`: rejected projected delta metadata only.
- `active_risks`: blocked deltas and medium/high projection gaps.
- `open_questions`: medium/high projection gaps.
- `source_refs`: delta projection source refs, source counts, delta ids,
  batch ids, snapshot refs, diagnostic refs, and gap codes.
- `staleness`: source gap and freshness summary.
- `gaps`: inherited projection gaps with Current Working Perspective context.

Projected deltas remain read-model inputs. They are not source-of-truth state,
proof, evidence, approval, readiness, durable memory, durable Perspective
state, or apply authority.

## 6. Staleness and Gaps

`staleness` reports whether the supplied snapshot and delta projection inputs
are present and whether medium/high gaps make the packet partial.

`gaps` preserve inherited delta projection gaps and add Current Working
Perspective-specific gaps such as scope mismatch or empty delta projection.
Gaps are review context; they do not authorize reconstructing missing source
text.

## 7. Research Diagnostics

Research diagnostics remain non-authoritative.

`research_pressure` may include log-only diagnostic refs such as
`loopness_hint`, pending proposal pressure, and projection gap counts. It is
not truth, proof, approval, readiness, committed Perspective state, proposal
scoring, Gate/SRF input, evidence status, publication readiness, or
commit/reject input.

## 8. Authority Boundary

Current Working Perspective is a read-only derived model only.

It cannot:

- commit or reject state
- record proof
- create evidence
- update work
- mutate memory
- apply project Perspective
- publish externally
- merge
- retry, replay, or deploy
- call GitHub
- call OpenAI or providers
- execute Codex
- create branches or PRs
- write DB rows
- add routes
- add UI

The source of truth remains Augnes Core records and the supplied
PerspectiveSnapshot / AugnesDeltaProjectionReadModel inputs.

## 9. Non-Goals

Phase 3A does not add UI changes, route changes, API routes, DB schema or
migrations, DB writes, persistence, source record mutation, proof writes,
evidence writes, memory mutation, durable Perspective state apply, work status
updates, MCP/App tools, Codex execution from Augnes runtime, GitHub calls from
Augnes runtime, provider/OpenAI calls, retrieval, source fetching, scheduler,
daemon, autonomy runner, hidden automation, launch controls, product-write,
merge, publish, retry, replay, deploy, or external side effects.

## 10. Validation and Smoke Plan

`npm run smoke:current-working-perspective-v0-1` checks:

- Required Phase 3A files exist.
- `package.json` has `smoke:current-working-perspective-v0-1`.
- `docs/00_INDEX_LATEST.md` points to this document.
- This document mentions `CurrentWorkingPerspective`, `PerspectiveSnapshot`,
  `AugnesDeltaProjectionReadModel`, `source_refs`, `staleness`, `gaps`,
  read-only derived current perspective model, and no state mutation.
- Type exports exist and remain type-only.
- Helper exports exist and does not collect DB records, call routes, call
  providers, call GitHub, execute Codex, or write proof/evidence.
- Fixture parses as public-safe JSON and includes all required read-model
  fields.
- Authority boundary booleans deny writes, execution, external calls, merge,
  publish, retry/replay/deploy, DB writes, routes, UI, durable state authority,
  and memory mutation.
- Source refs preserve both PerspectiveSnapshot and Delta Projection refs.
- Research diagnostics are marked non-authoritative.
- Projected deltas are treated as read-model inputs, not source-of-truth state.
- Changed-file boundaries stay focused on Phase 3A helper/type/doc/fixture/
  smoke/package/index files and exact follow-on smoke compatibility edits.

## 11. Future Phase Handoff

Phase 3B may add a GET-only read-only route for this packet if explicitly
scoped. Route work should reuse the established local/read-only guard pattern
and must preserve the same authority boundary.

Phase 4 - Human Surface v0.1 can consume this read model to render the current
frame, goals, assumptions, questions, risks, next candidates, delta refs,
review hints, source refs, staleness, and gaps without needing state mutation.

## 12. Next Phase Readiness Criteria

Phase 3A is ready for Phase 4 when:

- `CurrentWorkingPerspective` exists.
- The helper deterministically synthesizes PerspectiveSnapshot and
  AugnesDeltaProjectionReadModel inputs.
- Source refs, staleness, and gaps are preserved.
- Research diagnostics remain non-authoritative.
- Projected deltas remain read-model inputs.
- Static smoke and typecheck pass.
- No UI, route, DB write, proof/evidence write, durable apply, memory
  mutation, provider/OpenAI call, GitHub actuation, Codex execution,
  scheduler/autonomy runner, product-write, merge, publish, retry, replay,
  deploy, or external side effect was added.
