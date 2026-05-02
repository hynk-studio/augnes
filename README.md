# Augnes

## Temporal State Trajectories for AI Work

Augnes is not a chatbot with memory. It is a temporal state runtime for AI-assisted work.

The user steers from a ChatGPT-like cockpit. OpenAI APIs interpret natural language and propose typed, time-aware state deltas. The Augnes runtime validates those deltas, detects tensions, asks for commit/reject, records accepted transitions in a ledger, and visualizes each state key as a trajectory over time.

> The model interprets. The runtime owns state. The timeline shows how work evolves.

---

## Status

This repository is the first public challenge build of Augnes.

The initial goal is to demonstrate the core loop:

```text
Conversation
  -> Temporal State Delta Proposal
  -> Runtime Validation
  -> Commit / Reject Gate
  -> Temporal State Ledger
  -> State Trajectory View
  -> State-Grounded Action
  -> After-Action Delta
  -> External Agent State Brief
```

This is intentionally scoped as a small, inspectable build rather than a full agent framework. Humanity may survive one more MVP if we keep the scope from eating the house.

---

## What Augnes Builds

Most AI memory tools answer:

> What should the agent remember?

Augnes asks:

> When did this become true, what did it replace, how stable is it, and how does it affect future action?

Augnes treats memory as governed state transition, not passive recall.

A model cannot directly mutate persistent state. It can only propose a typed state delta. The runtime validates the proposal, detects tensions with committed state, asks for commit/reject, records accepted transitions in a ledger, and visualizes the resulting state trajectory.

---

## Core Concepts

### 1. Temporal State Delta Proposal

A proposed change to operational state.

Example:

```json
{
  "scope": "project:augnes",
  "state_key": "submission.requires_readme",
  "operation": "set",
  "before_value": "unknown",
  "after_value": true,
  "temporal_scope": "until_deadline",
  "valid_from": "2026-05-02T18:00:00+09:00",
  "valid_until": "2026-05-16T16:00:00+09:00",
  "stability": "active",
  "change_type": "new_state",
  "confidence": 0.97,
  "reason": "The challenge requires a README for submission.",
  "status": "pending"
}
```

### 2. Commit / Reject Gate

OpenAI models propose state changes. Augnes does not blindly save them.

```text
Model proposes.
Runtime validates.
User commits.
Ledger records.
Trajectory visualizes.
```

### 3. Temporal State Ledger

Every committed transition records:

- state key
- before value
- after value
- temporal scope
- valid-from / valid-until
- stability
- change type
- source session
- source agent
- reason
- committed timestamp

### 4. State Trajectory View

Augnes does not only show the latest state. It shows how each state key evolves over time.

```text
submission.requires_screenshots
unknown --- true --- ⚠ tension --- encouraged --- completed
          Session 1  Session 2     resolved       action result
```

This is the main product surface. The point is not merely remembering a fact, but seeing the state trajectory that produced the current working context.

### 5. Tension vs Temporal Layering

Not every mismatch is a contradiction.

Example:

```text
Current phase:
integration.github_api = excluded_for_mvp

Future phase:
integration.github_api = planned_after_challenge
```

Augnes should treat this as temporal layering, not a conflict.

A real tension looks more like:

```text
Existing active state:
security.no_api_keys_in_repo = true

Incoming proposal:
security.allow_test_api_key_in_repo = true
```

### 6. External Agent State Brief

Augnes can expose a compact state brief for Codex or other external agents.

Example:

```json
{
  "runtime": "augnes",
  "scope": "project:augnes",
  "as_of": "2026-05-11T21:00:00+09:00",
  "active_state": {
    "product.name": "Augnes",
    "implementation.stack": "Next.js + SQLite + OpenAI API",
    "security.no_api_keys_in_repo": true
  },
  "future_state": {
    "integration.chatgpt_app": "planned_after_challenge"
  },
  "open_tensions": [],
  "agent_instructions": [
    "Do not commit API keys.",
    "Focus on README and screenshots before future integrations."
  ]
}
```

---

## Why This Is Not a Prompt Wrapper

A prompt wrapper usually follows this shape:

```text
User input -> Model response -> UI output
```

Augnes follows a different shape:

```text
User input
  -> OpenAI temporal interpretation
  -> Typed state delta proposals
  -> Runtime validation
  -> Commit/reject gate
  -> Temporal state ledger
  -> State trajectory visualization
  -> State-grounded action
  -> After-action state update
```

The prompt does not define the agent. The committed state does.

---

## How Augnes Uses OpenAI APIs

OpenAI APIs are used as the semantic engine of the runtime.

### 1. Temporal Delta Compiler

OpenAI models convert natural language into typed, time-aware state delta proposals.

The output includes:

- `state_key`
- `before_value`
- `after_value`
- `temporal_scope`
- `stability`
- `change_type`
- `reason`
- `confidence`

### 2. Time-Aware Planner

OpenAI models read committed active/future/deprecated/completed state and recommend next actions.

The planner must explain:

- what action is recommended
- which committed state entries ground the recommendation
- why future-phase work should or should not be deferred

### 3. Action Reflection

After a local tool or external agent records a result, Augnes can convert that result into an after-action state delta.

Example:

```text
repo.readme_created: false -> true
COMPLETION · ACTIVE
```

---

## Planned MVP Features

### P0

- [ ] Next.js Web UI
- [ ] SQLite state ledger
- [ ] OpenAI-powered temporal state delta proposals
- [ ] Commit / reject gate
- [ ] State Snapshot as-of-now
- [ ] State Trajectory View
- [ ] Tension detection vs temporal layering
- [ ] Time-aware planner
- [ ] Local tools that generate files in `outputs/`
- [ ] After-action temporal deltas
- [ ] README and screenshots

### P1

- [ ] `/api/state/brief` for Codex or other external agents
- [ ] `/api/actions/record` for external action results
- [ ] Demo script for external agent state continuity

### P2

- [ ] Local MCP server
- [ ] `augnes_get_state_brief`
- [ ] `augnes_record_action_result`
- [ ] Codex MCP config example

---

## Proposed Architecture

```text
┌──────────────────────────────────────┐
│ Chat Cockpit                          │
│ - user intent                         │
│ - OpenAI temporal interpretation      │
└──────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│ Temporal Delta Compiler               │
│ - state_key                           │
│ - before / after                      │
│ - temporal_scope                      │
│ - stability                           │
│ - change_type                         │
└──────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│ Augnes Runtime                        │
│ - validation                          │
│ - commit/reject gate                  │
│ - tension detection                   │
│ - temporal layering                   │
└──────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│ Temporal State Ledger                 │
│ - transitions                         │
│ - active/future/deprecated/completed  │
│ - sessions                            │
│ - agents                              │
└──────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│ State Trajectory View                 │
│ - unknown -> active                   │
│ - active -> tension                   │
│ - tension -> resolved                 │
│ - active -> completed                 │
│ - active -> deprecated                │
└──────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│ Agent Brief / Actions                 │
│ - Codex-readable state brief          │
│ - state-grounded planner              │
│ - action records                      │
│ - after-action deltas                 │
└──────────────────────────────────────┘
```

---

## Demo Flow

The challenge demo should show:

1. User describes project goals, constraints, and future plans.
2. Augnes uses OpenAI APIs to propose temporal state deltas.
3. User commits selected deltas.
4. The State Trajectory View shows how each state evolves over time.
5. The planner recommends actions grounded in active state while deferring future-phase work.
6. A real tension is detected when a new proposal conflicts with stable active state.
7. A local tool generates checklist files.
8. The tool result becomes an after-action delta on the timeline.
9. A compact state brief is available for Codex or another external agent.

Example trajectory:

```text
security.no_api_keys_in_repo
unknown --- true --- ⚠ tension
          commit     incoming unsafe proposal

integration.chatgpt_app
unknown ---------------- planned_after_challenge
                         future phase

submission.readme_checklist_created
false ------------------ true
                         after-action delta
```

---

## Initial Tech Stack

- Next.js
- TypeScript
- SQLite
- OpenAI API
- Zod or equivalent schema validation
- Local file tools
- Optional MCP server later

---

## How to Run

_Not implemented yet. Planned commands:_

```bash
npm install
cp .env.example .env.local
npm run db:init
npm run demo:seed
npm run dev
```

Environment variables:

```bash
OPENAI_API_KEY=your_key_here
```

No API keys should be committed to this repository. Apparently we still need to say this out loud because civilization remains fragile.

---

## Development Plan

1. Project scaffold
2. SQLite temporal state schema
3. OpenAI temporal delta compiler
4. Commit / reject gate
5. Snapshot and trajectory APIs
6. State Trajectory View
7. Tension detection and temporal layering
8. Time-aware planner
9. Local action tools and after-action deltas
10. External state brief
11. README, screenshots, and final demo

---

## Submission Tagline

> Augnes turns AI work into temporal state trajectories.

Or, more directly:

> Not memory lists. Not prompt UI. Temporal state trajectories for AI work.
