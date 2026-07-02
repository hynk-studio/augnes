# Human Surface v0.1

## 1. Status and Scope

Status: Phase 4A Human Surface Home, v0.1.

Scope: `/` becomes a read-only Human Surface Home that helps a human start from
the Blank State, inspect the Current Working Perspective, review recent
projected delta hints, and choose `/perspective` or `/workbench`.

Phase 4A adds home UI components, a read-only Current Working Perspective UI
data helper, focused styling, a static smoke, a package script pointer, and an
index pointer. It does not add DB schema or migrations, DB writes, MCP/App
tools, provider/OpenAI calls, GitHub actuation, Codex execution,
proof/evidence writes, durable Perspective state apply, memory mutation,
product-write, scheduler/autonomy runner, merge/publish/retry/replay/deploy
behavior, or external side effects.

Blank State Review Entry Absorption v0.1 implements the PR 2 Legacy Cockpit
decomposition step on `/`. It adds native high-level Blank State entries for
Continue Current Work, Review Pending Proposals, Choose Perspective Lens,
Prepare Codex Handoff, Review Runner DeltaBatch, Automation Mode, and User
Judgment Summary. These entries are links and summaries only: they do not add
apply, approve, reject, commit, runner execution, Codex launch, provider calls,
GitHub actuation, DB writes, proof/evidence writes, durable memory apply,
Perspective apply, delta auto-apply, localStorage/sessionStorage writes, server
actions, new routes, `/cockpit` deletion, or `components/augnes-cockpit.tsx`
deletion.

## 2. Home Surface

The Human Surface Home renders:

- `Augnes`
- `What are you trying to do?`
- links to `/perspective` and `/workbench`
- Guided Blank State copy
- display-only mode presets
- Blank State Review Entry Absorption v0.1 seven-entry review grid
- read-only review entry cards
- Current Working Perspective summary
- recent important delta and review queue hints
- surface links for Perspective, Workbench, and future Guide / ChatGPT / Codex
  handoff work

`/workbench` remains the existing Cockpit workbench route. `/perspective`
remains the existing Perspective surface. Phase 4A does not change either
route.

## 3. Data Source and Fallback

Preferred source:

```text
GET /api/perspective/current?scope=project:augnes
x-augnes-local-readonly: current-working-perspective-v0.1
```

The home data helper reads that route with `cache: "no-store"` and verifies the
local/read-only marker before presenting the response as runtime data.

Fallback source:

- `fixtures/current-working-perspective.sample.v0.1.json`

The UI exposes:

- `data`
- `source_status: "runtime" | "fixture_fallback" | "empty_fallback"`
- `fallback_reason`
- `authority_boundary`

If runtime data is unavailable, the UI shows:

```text
Current Working Perspective is unavailable from runtime. Showing public-safe sample / empty fallback. No state was read or mutated.
```

Fixture fallback is never presented as live runtime state.

## 4. Mode Presets

Phase 4A mode presets are local/display only:

- `general`
- `writing`
- `research`
- `coding`
- `office`
- `presentation`
- `agentic`
- `physical_world_model`

Mode preset display does not create work, run agents, write records, launch
Codex, call providers, persist state, mutate memory, or grant authority.

## 4A. Blank State Review Entry Absorption

Blank State Review Entry Absorption v0.1 renders exactly seven native entry
cards with stable `data-blank-state-entry-id` markers:

- `continue_current_work_entry`
- `review_pending_proposals_entry`
- `choose_perspective_lens_entry`
- `prepare_codex_handoff_entry`
- `review_runner_deltabatch_entry`
- `automation_mode_entry`
- `user_judgment_summary_entry`

The entries use existing read-only Current Working Perspective context plus the
existing recovered runner DeltaBatch Workplane read helper. Runtime-unavailable
states use explicit fixture, empty, or fallback copy instead of fabricated live
counts.

Targets are `/workbench#work_queue`, `/workbench#review_queue`,
`/perspective`, `/workbench#handoff_builder_preview`,
`/workbench#runner_delta_batch`, and `/workbench#authority_boundary`.

Blank State remains high-level entry, summary, and navigation. Detailed
proposal diff, before/after preview, manual preview editor, Perspective lens
detail edit, memory proposal review, local draft review, source refs, impact
analysis, stale/fallback warning review, needs-user-judgment lane, authority
boundary review, and proposal status history stay assigned to Workplane State
Proposal Review or Agent Workplane follow-on work.

## 5. Current Working Perspective Display

The Current Working Perspective card shows:

- current thesis
- active goals count and top goals
- open questions count and top questions
- active risks count and top risks
- research pressure level
- next candidates
- staleness status
- source status
- link to `/perspective`

Raw diagnostics are not shown by default.

## 6. Recent Delta Preview

The recent delta preview shows:

- last major delta refs
- review queue counts
- needs-review count
- blocked/manual-review count

Projected deltas remain read-model inputs only. They are not source-of-truth
state, approval, proof, evidence, readiness, durable memory, durable
Perspective state, or apply authority.

## 7. Authority Boundary

This is a read-only Human Surface UI.

It cannot:

- write DB rows
- create work
- run agents
- launch Codex
- call providers or OpenAI
- call GitHub
- write proof or evidence
- mutate memory
- apply durable Perspective state
- publish externally
- merge
- retry, replay, or deploy
- schedule hidden automation

Mode preset selection is local UI state only if later made interactive. In
Phase 4A the preset cards are display-only.

## 8. Deferred Work

Phase 4B Perspective Human Timeline updates `/perspective` into a read-only
human review surface.

Phase 5 Agent Workplane is future work.

Human Surface does not include GuideBrief, Timeline, Handoff Capsule,
Autonomy Contract, product-write, merge/publish/retry/replay/deploy behavior,
or external side effects in Phase 4A.

## 9. Phase 4B Perspective Human Timeline

Phase 4B adds the `/perspective` Human Timeline skeleton. It renders:

- a Current Working Perspective rail
- a vertical timeline skeleton over projected Augnes Delta records
- Delta cards with type, status, source, title, created time, summary, and
  review state
- local selected delta state
- a Delta Inspector for source refs, evidence refs, artifact refs, handoff refs,
  diagnostic refs, merge policy, authority boundary, validation summary, gaps /
  staleness, review notes, and non-goals
- a Boundary / Next panel for next candidates, open questions, active risks,
  source/fallback notes, gaps, and staleness warnings

Preferred timeline data source:

```text
GET /api/augnes/read/deltas?scope=project:augnes
x-augnes-local-readonly: augnes-delta-projection-v0.1
```

Fallback source:

- `fixtures/augnes-delta-projection.sample.v0.1.json`

The Delta Projection helper exposes:

- `data`
- `source_status: "runtime" | "fixture_fallback" | "empty_fallback"`
- `fallback_reason`
- `authority_boundary`

Fixture fallback is disclosed and is never presented as live runtime state.

Phase 4B is read-only Human Surface UI with a read-only authority boundary.
Delta selection is local UI state only. It does not persist selection, write
records, apply deltas, call providers, launch Codex, or create work.

The Delta Inspector uses this compact boundary:

```text
Read-only projection. No state mutation, no proof/evidence write, no external action.
```

Phase 4B adds no graph editor, graph DB, drag/drop persistence, no
persistence, save/reset/rollback controls, DB schema/migration, DB write, write
route, MCP/App tool, provider/OpenAI call, GitHub actuation, Codex execution,
proof/evidence write, durable Perspective apply, memory mutation,
product-write, scheduler/autonomy runner, merge/publish/retry/replay/deploy
behavior, or external side effect.

Phase 5 Agent Workplane remains future work.

## 10. Validation and Smoke Plan

`npm run smoke:human-surface-home-v0-1` checks:

- package script pointer
- `/` still routes through the Human Surface home wrapper
- required Human Surface components exist
- The Blank State language exists
- all mode presets exist
- Current Working Perspective card and recent delta preview exist
- `/perspective` and `/workbench` links exist
- fallback disclosure text exists
- local/read-only route marker is used by the helper
- no mutating HTTP methods or write/import/actuation code was added
- no `/perspective` timeline, workbench page, DB migration, MCP/App tool,
  provider/OpenAI/GitHub runtime, Codex execution, proof/evidence write,
  durable Perspective apply, memory mutation, scheduler/autonomy runner, or
  external side effect files are added
- changed-file boundary remains focused on Phase 4A files

`npm run smoke:blank-state-review-entry-absorption-v0-1` checks:

- package script pointer
- Human Surface home wiring
- all seven required `blank_state` entry IDs
- stable `data-blank-state-entry-id` markers
- Workplane/Perspective targets
- source/fallback and authority notes
- no mutation controls, server action, localStorage/sessionStorage writes, new
  routes, DB/proof/evidence writes, provider/OpenAI/GitHub/Codex calls, runner
  execution/tick/recovery/scheduling, durable memory apply, Perspective apply,
  delta auto-apply, `/cockpit` deletion, or `components/augnes-cockpit.tsx`
  deletion

`npm run smoke:perspective-human-timeline-v0-1` checks:

- package script pointer
- `/perspective` still routes through the Perspective surface wrapper
- Current Working Perspective rail/card, timeline, Delta card, Delta Inspector,
  and Boundary / Next panel components exist
- the Delta Projection helper uses the GET-only read route, local/read-only
  marker, fixture fallback, source status, fallback reason, and authority
  boundary
- the timeline represents type, status, source, title, created_at, and review
  needs
- the inspector represents source refs, evidence refs, artifact refs, handoff
  refs, diagnostic refs, merge policy, authority boundary, validation summary,
  gaps/staleness, review notes, and non-goals
- no graph editor, graph DB, persistence, mutating HTTP method, DB migration,
  MCP/App tool, provider/OpenAI/GitHub runtime, Codex execution,
  proof/evidence write, memory mutation, durable Perspective apply,
  scheduler/autonomy runner, `/workbench` page change, or external side effect
  is added
- changed-file boundary remains focused on Phase 4B files
