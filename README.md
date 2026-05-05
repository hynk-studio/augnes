# Augnes

## Temporal State Trajectories for AI Work

Augnes is a temporal state runtime for AI-assisted work. It is not a chatbot with memory, and it is not a prompt wrapper. It turns conversation into typed, time-aware state delta proposals, lets the user commit or reject those proposals, records accepted transitions in a local SQLite ledger, and shows how project state changes over time.

> The model interprets. The runtime owns state. The timeline shows how work evolves.

Augnes started from a practical annoyance: I was tired of being the human message bus between ChatGPT, Codex, and GitHub. ChatGPT could plan and review. Codex could implement and test. GitHub could store the code. But the project state still lived in my head. Augnes makes that state explicit.

## What Augnes Is

Augnes treats working context as governed state, not passive memory. A user can describe goals, constraints, future plans, security rules, and completion signals in natural language. Augnes converts that input into structured temporal state changes such as:

```json
{
  "scope": "project:augnes",
  "state_key": "submission.requires_screenshots",
  "operation": "set",
  "before_value": "unknown",
  "after_value": true,
  "temporal_scope": "current_project",
  "stability": "tentative",
  "change_type": "new_state",
  "status": "pending"
}
```

Those proposals are not committed automatically. The runtime validates them, shows them as pending changes, and only records them in committed state after the user accepts them.

## Why This Is Not a Prompt Wrapper

A prompt wrapper usually follows this flow:

```text
User input -> Model response -> UI output
```

Augnes follows a runtime flow:

```text
Conversation
  -> Temporal State Delta Proposals
  -> Runtime Validation
  -> Commit / Reject Gate
  -> Temporal State Ledger
  -> State Snapshot
  -> Temporal State Graph
  -> State-Grounded Actions
  -> External State Brief
  -> MCP / Agent Bridge Proof
```

The prompt does not define durable context. Committed state does.

## Implemented MVP

The current challenge build includes:

- A Next.js cockpit UI.
- A local SQLite temporal state runtime.
- `POST /api/observe` for temporal delta proposal generation.
- OpenAI Responses API support when `OPENAI_API_KEY` is set.
- Deterministic mock fallbacks when `OPENAI_API_KEY` is unset.
- Pending Temporal Delta Proposal cards.
- Commit and reject routes for proposals.
- A central Temporal State Graph with state-key lanes, transition nodes, and an inspector.
- A State Snapshot panel grouped by active, future, deprecated, completed, and open tensions.
- Minimal tension handling that distinguishes contradictions from future-phase temporal layering.
- A state-grounded planner with OpenAI support and mock fallback.
- Local tools that create files under `outputs/`.
- Action records and after-action state transitions.
- `GET /api/state/brief` for Codex or other external agents.
- MCP bridge proof through `Aurna-code/augnes_apps`, exposing Augnes state to MCP-compatible clients.

## How Augnes Uses OpenAI APIs

OpenAI APIs are used for interpretation, not direct mutation.

`POST /api/observe` asks the model to compile natural language into typed temporal state delta proposals. The output is validated against runtime enums before it is saved as pending state.

`POST /api/plan` asks the model to recommend actions grounded in committed state. The planner receives active, future, completed, deprecated, and tension state so it can avoid treating future work as current work.

Local demos do not require an API key. If `OPENAI_API_KEY` is missing, Augnes uses deterministic mock behavior for observe and planner flows so the full demo remains runnable from a clean checkout.

## Temporal State Delta Proposals

Each proposal includes:

- `scope`
- `state_key`
- `before_value`
- `after_value`
- `operation`
- `temporal_scope`
- `valid_from`
- `valid_until`
- `stability`
- `change_type`
- `reason`
- `status`

Recommended temporal values include `current_project`, `future_phase`, `historical_note`, and `global_preference`. Stability values include `tentative`, `active`, `stable`, `deprecated`, and `completed`.

## Commit / Reject Gate

The model proposes. The runtime validates. The user decides.

- Commit writes to `state_entries` and `state_transitions`.
- Reject only updates the proposal status.
- Rejected proposals do not create committed transitions.
- Future-phase proposals can coexist with active current state without creating contradiction tensions.

## State Snapshot

`GET /api/state/snapshot?scope=project:augnes` returns committed state grouped as:

- `active_state`
- `future_state`
- `deprecated_state`
- `completed_state`
- `open_tensions`

The UI renders these groups in the State Snapshot and Tensions panels.

## Temporal State Graph

`GET /api/state/trajectory?scope=project:augnes` returns committed transitions grouped by `state_key`.

The UI renders those transitions as a time-oriented graph: each `state_key` is a lane, committed transitions are nodes, and repeated transitions for the same state are connected across time. Selecting a node opens an inspector with previous value, new value, temporal scope, stability, change type, reason, and commit time. Pending proposals remain visible as reviewable deltas and can appear as ghost nodes before commit.

Example seeded trajectories:

```text
product.name
unknown -> Augnes

integration.chatgpt_app
unknown -> planned_after_challenge

submission.readme_checklist_created
false -> true
```

## Tension vs Temporal Layering

Augnes treats active contradictions differently from future plans.

This is temporal layering, not a contradiction:

```text
current_project: integration.chatgpt_app = not_now
future_phase:   integration.chatgpt_app = planned_after_challenge
```

This can create a tension:

```text
current_project: security.no_api_keys_in_repo = true
incoming active proposal: security.no_api_keys_in_repo = false
```

Tensions are recorded for review. They do not block commits in the MVP.

## Planner

`POST /api/plan` returns state-grounded recommendations. It uses committed state and open tensions to recommend next actions and identify local tools that can help.

Example:

```bash
curl -s -X POST "http://localhost:3000/api/plan" \
  -H "Content-Type: application/json" \
  -d '{"scope":"project:augnes","message":"What should I do next?"}'
```

## Local Tools

`POST /api/actions/run` can run small local tools:

- `create_readme_checklist`
- `create_security_checklist`
- `create_demo_script`

Tool outputs are generated under `outputs/`, which is intentionally ignored by git. Successful tool runs create action records and after-action state transitions.

Example:

```bash
curl -s -X POST "http://localhost:3000/api/actions/run" \
  -H "Content-Type: application/json" \
  -d '{"scope":"project:augnes","tool_name":"create_readme_checklist"}'
```

## External State Brief

`GET /api/state/brief?scope=project:augnes` returns compact continuity context for Codex or another external agent.

The brief includes:

- `runtime: "augnes"`
- `scope`
- `as_of`
- `active_state`
- `future_state`
- `deprecated_state`
- `completed_state`
- `open_tensions`
- `pending_proposals`
- `recent_actions`
- `agent_instructions`

Agent instructions include:

- Treat committed state as the source of truth.
- Use pending proposals as suggestions only.
- Respect future-phase work as deferred unless the user changes priority.
- Surface open tensions before depending on contested state.
- Record external work through `POST /api/actions/record`.
- Do not commit API keys or local secrets.

## MCP Bridge Proof

Augnes also has a bridge proof through the companion repo `Aurna-code/augnes_apps`.

The bridge exposes the Augnes runtime to MCP-compatible clients through tools such as:

- `augnes_get_state_brief`
- `augnes_observe`
- `augnes_plan`
- `augnes_record_action_result`
- `augnes_list_pending_proposals`

A local MCP Inspector run verified this loop:

```text
MCP Inspector
  -> augnes_apps /mcp
  -> augnes_get_state_brief
  -> Augnes runtime /api/state/brief
  -> augnes_record_action_result
  -> Augnes runtime /api/actions/record
  -> Temporal State Graph external action node
```

The recorded proof appears in the graph as:

```text
external.mcp_inspector_bridge_check_recorded
false -> true
current_project · completed · completion
```

The selected transition inspector shows:

```text
MCP Inspector successfully read Augnes state brief through the Augnes Agent Bridge.
```

This proves the first practical version of the intended coordination layer: an external MCP client can read Augnes state and write an action result back into the temporal graph. In other words, Augnes is beginning to replace the human message bus between ChatGPT, Codex, and GitHub with an explicit state handoff layer. Finally, one tiny burden removed from the meat-based routing protocol.

## How to Run

```bash
npm install
cp .env.example .env.local
npm run db:reset
npm run demo:seed
npm run dev -- --port 3000
```

Then open `http://localhost:3000`.

`OPENAI_API_KEY` is optional for local demo because mock fallbacks exist. To use OpenAI-backed observe and planner calls, set:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Never commit `.env.local`, API keys, local secrets, or generated SQLite files.

## MCP Bridge Local Check

To reproduce the MCP bridge proof locally, run both repos.

Terminal 1:

```bash
cd ../augnes
npm install
npm run db:reset
npm run demo:seed
npm run dev -- --port 3000
```

Terminal 2:

```bash
cd ../augnes_apps
npm install
AUGNES_ENABLE_AGENT_BRIDGE=true \
AUGNES_API_BASE_URL=http://localhost:3000 \
npm run dev
```

Then open MCP Inspector and connect to:

```text
http://localhost:8787/mcp
```

Run:

```text
augnes_get_state_brief
```

with:

```json
{ "scope": "project:augnes" }
```

Then run:

```text
augnes_record_action_result
```

with an action name such as:

```json
{
  "scope": "project:augnes",
  "sourceAgentId": "agent:codex",
  "actionName": "mcp_inspector_bridge_check",
  "resultSummary": "MCP Inspector successfully read Augnes state brief through the Augnes Agent Bridge.",
  "filesChanged": []
}
```

Refresh `http://localhost:3000`. The Temporal State Graph should show an `external.mcp_inspector_bridge_check_recorded` completion transition.

## Final Demo Flow

1. Open `http://localhost:3000`.
2. Confirm seeded State Snapshot and Temporal State Graph load.
3. Submit the canonical demo message in Conversation Input.
4. Confirm multiple pending Temporal Delta Proposals appear.
5. Commit at least two proposals.
6. Reject at least one proposal.
7. Confirm the rejected proposal creates no transition.
8. Confirm State Snapshot updates.
9. Confirm Temporal State Graph shows committed transitions.
10. Click Plan Next in State-Grounded Actions.
11. Run README Checklist.
12. Confirm `outputs/readme_checklist.md` exists locally.
13. Confirm the checklist run creates an action record and completion transition.
14. Fetch `/api/state/brief?scope=project:augnes` for external-agent continuity.
15. Optionally run the MCP bridge proof and confirm the external action appears in the graph.

Canonical demo message:

```text
이번 출품작 이름은 Augnes로 가자. Next.js + SQLite + OpenAI API로 만들고, ChatGPT App 연결은 나중에 확장으로 미루자. 이번 제출 전까지는 README, 스크린샷, no API keys가 우선이야.
```

## Useful API Checks

```bash
curl -s "http://localhost:3000/api/state/snapshot?scope=project:augnes"

curl -s "http://localhost:3000/api/state/trajectory?scope=project:augnes"

curl -s -X POST "http://localhost:3000/api/observe" \
  -H "Content-Type: application/json" \
  -d '{"scope":"project:augnes","message":"이번 출품작 이름은 Augnes로 가자. Next.js + SQLite + OpenAI API로 만들고, ChatGPT App 연결은 나중에 확장으로 미루자. 이번 제출 전까지는 README, 스크린샷, no API keys가 우선이야."}'

curl -s -X POST "http://localhost:3000/api/plan" \
  -H "Content-Type: application/json" \
  -d '{"scope":"project:augnes","message":"What should I do next?"}'

curl -s -X POST "http://localhost:3000/api/actions/run" \
  -H "Content-Type: application/json" \
  -d '{"scope":"project:augnes","tool_name":"create_readme_checklist"}'

curl -s "http://localhost:3000/api/state/brief?scope=project:augnes"
```

## Security Notes

- `.env.local` is ignored.
- `data/*.db` and `data/*.db-*` are ignored.
- `outputs/*` is ignored.
- `OPENAI_API_KEY` is optional for local demo.
- Do not commit API keys or local secrets.
- The MVP has no auth and should be run locally for the challenge demo.
- The MCP bridge proof is local-first. Public deployment requires a secure HTTPS endpoint and careful write-action review.

## Limitations

- The runtime is local SQLite only.
- Tension detection is intentionally minimal.
- The planner can recommend local tools, but it is not a full autonomous agent.
- The Augnes runtime itself does not host MCP; the MCP bridge lives in the companion `augnes_apps` repo.
- There is no auth, vector database, or charting library.
- The Temporal State Graph is a lightweight UI, not a full analytics timeline.

## Submission Tagline

> Augnes turns AI work into temporal state trajectories.
