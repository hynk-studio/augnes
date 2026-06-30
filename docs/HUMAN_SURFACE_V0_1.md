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

## 2. Home Surface

The Human Surface Home renders:

- `Augnes`
- `What are you trying to do?`
- links to `/perspective` and `/workbench`
- Guided Blank State copy
- display-only mode presets
- read-only start-intent cards
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

Phase 4B Perspective Human Timeline is deferred.

Phase 5 Agent Workplane is future work.

Human Surface does not include GuideBrief, Timeline, Handoff Capsule,
Autonomy Contract, product-write, merge/publish/retry/replay/deploy behavior,
or external side effects in Phase 4A.

## 9. Validation and Smoke Plan

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
