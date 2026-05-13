# Augnes

## Temporal State Trajectories for AI Work

Augnes is a temporal state runtime for AI-assisted work. It is not a chatbot with memory, a prompt wrapper, a generic task tracker, or an autonomous agent swarm. It turns conversation into typed, time-aware state delta proposals, lets the user commit or reject those proposals, records accepted transitions in a local SQLite ledger, anchors task traces with work IDs, and shows how project state changes over time.

> The model interprets. The runtime owns state. The bridge lets agents act. Work IDs anchor task traces. The graph shows what changed.

Augnes started from a practical annoyance: I was tired of being the human message bus between ChatGPT, Codex, GitHub, and local project state. ChatGPT could plan and review. Codex could implement and test. GitHub could store the code. But the project state still lived in my head. Augnes replaces that human message bus with explicit temporal state, work trace anchors, and recorded proof.

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
  -> Current Work Brief
  -> Work Trace Spine
  -> MCP / ChatGPT App Bridge Proof
  -> Codex Completion Proof
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
- Project-level Current Work through `agent_handoff`.
- Work Trace Spine and Work Focus for `AG-xxx` task context.
- Work APIs for listing work items, reading work briefs, and recording work events.
- Read-only Cockpit Session Trace continuity panel for already-bound sessions.
- ChatGPT App read tools for state and work briefs, with bridge-gated write tools for action and work-event proof.
- `npm run codex:record-completion` for recording Codex completion into action proof and work trace notes.
- `npm run codex:record-evidence` for recording Codex verification evidence observations into `verification_evidence_records`.
- `npm run codex:bind-session` for binding a pre-existing session row to Codex/work/PR continuity metadata.
- MCP bridge proof through `apps/augnes_apps`, exposing Augnes state to MCP-compatible clients.

## Single-Repo Layout

The challenge submission is now a single GitHub repository:

- Root package: Augnes runtime, temporal state ledger, Runtime Cockpit, `/api/state/brief`, and `/api/actions/record`.
- `apps/augnes_apps`: ChatGPT App / MCP bridge, bridge tools, and Codex handoff scripts.

`apps/augnes_apps` remains its own nested package with its own `package.json`. The root Augnes runtime package is unchanged.

## Coordination Layers

Augnes now has four visible coordination layers:

1. Project-level Current Work answers "Where are we?" for the whole project.
2. Work-level Trace Spine / Work Focus answers "Where is AG-001?" for a specific work item.
3. Completion / Proof records what changed, why, and which agent or tool produced the result.
4. Session Binding v0.1 answers "Which human/tool session carried this work/PR/evidence context?"

These layers do not replace the commit/reject gate. Committed Augnes state remains the source of truth. A `work_id` is only a trace anchor. `action_records` are official execution proof. `work_events` are human-readable trace notes.

## How Augnes Uses OpenAI APIs

OpenAI APIs are used for interpretation, not direct mutation.

`POST /api/observe` asks the model to compile natural language into typed temporal state delta proposals. The output is validated against runtime enums before it is saved as pending state.

`POST /api/plan` asks the model to recommend actions grounded in committed state. The planner receives active, future, completed, deprecated, and tension state so it can avoid treating future work as current work.

`POST /api/temporal-interpretation/preview` asks the model to generate a read-only PerspectiveSnapshot-like Temporal Interpretation Preview from current project/demo context. It preserves evidence anchors, summary refs, source authority profile, counterexamples, residual tensions, transition relation, active context admission rationale, suppressed alternatives, temporal hierarchy, memory lifecycle, interpretive drivers, a safe next step, and a non-authority boundary. The route then runs deterministic local guardrails before returning the preview.

Local demos do not require an API key. If `OPENAI_API_KEY` is missing, Augnes uses deterministic mock behavior for observe and planner flows so the full demo remains runnable from a clean checkout.

The Temporal Interpretation Preview also has deterministic mock fallback. If `OPENAI_API_KEY` is unset, `generator` is `mock`; if OpenAI fails, the route returns `mock_fallback` with a warning. Cockpit OpenAI usage is explicit and button-triggered: the panel does not call the preview route on page load. This preview is intentionally read-only: it does not commit state, approve work, publish proof, mutate mailbox state, promote rules, or claim full P4 PerspectiveSnapshot readiness.

## Temporal Interpretation Preview

The Runtime Cockpit includes a read-only `Temporal Interpretation Preview` panel. It starts in a not-generated state and calls the preview route only after the user clicks `Generate Preview` or `Refresh Preview`. It demonstrates Augnes applying the temporal interpretation model to current project/demo context without adding durable snapshot authority.

Preview v0.1.1 adds qualitative research-model fields for reviewer-visible structure: active context admission rationale, suppressed alternatives, temporal hierarchy, memory lifecycle, interpretive drivers, and qualitative axis pressures. These fields are not DB schema, numeric scoring, rule-vector formula runtime, automatic memory admission, or runtime authority.

API check:

```bash
curl -s -X POST "http://localhost:3000/api/temporal-interpretation/preview" \
  -H "Content-Type: application/json" \
  -d '{"scope":"project:augnes"}' | jq .
```

Smoke check while the Next server is running:

```bash
npm run smoke:temporal-preview
```

OpenAI is useful here because the preview is interpretive rather than a direct state read: it relates current context, prior interpretation, counterexamples, residual tensions, and authority boundaries while preserving structured anchors. The local guardrails remain deterministic and run for both OpenAI and mock output. In the Cockpit, OpenAI is used only after an explicit button click when `OPENAI_API_KEY` is present.

See `docs/TEMPORAL_INTERPRETATION_PREVIEW_RUNBOOK.md` for run instructions, guardrails, boundaries, and intentionally omitted P4 work.

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

## Current Work

Current Work is the project-level "Where are we?" surface in the Runtime Cockpit. It is backed by `GET /api/state/brief?scope=project:augnes` and the deterministic `agent_handoff` packet inside that brief.

Current Work shows:

- current project status
- next recommended action
- blockers or open tensions
- Codex handoff details
- copyable templates for recording external work

Current Work is a user-facing summary surface, not a new state authority. It summarizes committed state, pending proposals, open tensions, and recent actions that already exist in the runtime. It does not create state and does not bypass commit/reject.

## Session Trace

The Runtime Cockpit includes a read-only `Session Trace` panel for Session Binding v0.1 continuity. It is button-triggered and calls `GET /api/sessions/trace?scope=project:augnes` only after the operator clicks `Load Session Trace` or `Refresh Session Trace`.

The panel displays bound session metadata, message/work/action/evidence counts, latest continuity records, gaps, and trace boundaries. It does not create sessions, bind sessions, add write controls, mutate evidence packs, or expand evidence packs with full nested session trace bodies.

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

## Work Trace Spine / Work Focus

The Work Trace Spine adds task-level continuity without turning tasks into state authority. A `work_id` such as `AG-001` is a trace anchor only. Durable project truth still lives in committed Augnes state, and official execution proof still lives in `action_records`.

Work Focus answers questions like "Where is AG-001?" It shows the selected work item beside the project-level Current Work card and keeps the task-specific trace close to the state it depends on.

A work brief includes:

- work status and priority
- next action
- recent work events
- related proof from action records
- related state keys
- work-specific Codex handoff

Work APIs:

- `GET /api/work`
- `GET /api/work/{work_id}`
- `GET /api/work/{work_id}/brief`
- `POST /api/work/{work_id}/events`

Recording a work event appends a human-readable trace note to the work item. It does not commit, reject, or infer runtime state.

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

External agents can record official execution proof through `POST /api/actions/record`. Existing callers only need `scope`, `source_agent_id`, `action_name`, `result_summary`, and `files_changed`; omitted `result_status` values default to `completed`, and omitted `result_kind` values default to `other`.

Optional `result_status` values are `completed`, `failed`, `blocked`, `partial`, and `needs_review`. Optional `result_kind` values are `implementation`, `verification`, `documentation`, `screenshot`, `handoff`, `review`, and `other`. Only `completed` creates a completed boolean transition; non-completed outcomes are recorded with their semantic status instead.

## Completion / Proof Layer

Augnes separates official execution proof from human-readable task notes:

- `action_records` are official execution proof. They feed recent actions and the Temporal State Graph.
- `work_events` are human-readable trace notes attached to a `work_id`.
- Temporal State Graph is the time-oriented proof surface for committed state transitions and recorded actions.

The Codex completion protocol records both layers with:

```bash
npm run codex:record-completion
```

The helper lives in `apps/augnes_apps` and is exposed from the root package for convenience. It records:

- `/api/actions/record` for official execution proof
- `/api/work/{work_id}/events` for the work trace note

Before writing an action record, the helper preflights `CODEX_WORK_ID` with `GET /api/work/{work_id}?scope=<scope>`. Unknown work IDs fail before `/api/actions/record`, which avoids orphan action records caused by mistyped trace anchors.

The protocol preserves real `result_status` and `result_kind` values, including `failed`, `blocked`, `partial`, and `needs_review`. It never calls commit/reject routes and does not add autonomous Codex execution, GitHub sync, Discord sync, or automatic work status inference.

Codex verification evidence can be recorded with:

```bash
npm run codex:record-evidence
```

The evidence helper reads env vars such as `CODEX_EVIDENCE_KIND`,
`CODEX_EVIDENCE_STATUS`, `CODEX_EVIDENCE_LABEL`, `CODEX_COMMAND`,
`CODEX_RESULT_SUMMARY`, and `CODEX_SKIPPED_REASON`, then calls only
`POST /api/evidence/records`. It records observation traces for Evidence Pack;
it does not approve, publish, replay, call GitHub/OpenAI, or mutate authority
rows directly.

Codex PR closeout should report the returned evidence IDs in the PR template.
When the local runtime or evidence API is unavailable, the PR should state the
exact reason structured evidence rows were skipped.

Codex sessions can be bound to an existing Augnes session row with:

```bash
npm run codex:bind-session
```

The helper calls only `POST /api/sessions/bind`, fails when
`CODEX_SESSION_ID` is missing or unknown, and records metadata such as
`CODEX_SESSION_SURFACE`, `CODEX_WORK_ID`, `CODEX_RELATED_PR`,
`CODEX_SESSION_SUMMARY`, `CODEX_HANDOFF_REF`, and `CODEX_EVIDENCE_PACK_REF`.
Trace can be read with `GET /api/sessions/trace` or
`GET /api/sessions/{session_id}/trace`. Session binding does not execute Codex,
call GitHub/OpenAI, record evidence, approve, publish, replay, or mutate
publication/approval/readiness/delivery/mailbox/state rows.

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
- `agent_handoff`

`agent_handoff` is a deterministic coordination packet generated from the same committed state, pending proposals, open tensions, and recent actions already in the brief. It summarizes current status, recommends the next action, lists blockers or tensions, and gives Codex a compact task brief with constraints, verification commands, expected report fields, and a `POST /api/actions/record`-compatible template.

Agent instructions include:

- Treat committed state as the source of truth.
- Use pending proposals as suggestions only.
- Respect future-phase work as deferred unless the user changes priority.
- Surface open tensions before depending on contested state.
- Record external work through `POST /api/actions/record`.
- Do not commit API keys or local secrets.

## ChatGPT App Bridge Tools

Augnes also has a bridge proof through the nested package `apps/augnes_apps`.

The bridge exposes the Augnes runtime to MCP-compatible clients and ChatGPT Developer Mode through tools such as:

- `augnes_get_state_brief`
- `augnes_observe`
- `augnes_plan`
- `augnes_record_action_result`
- `augnes_list_pending_proposals`
- `augnes_list_work_items`
- `augnes_get_work_brief`

The work-specific ChatGPT App tools are:

- `augnes_list_work_items`: read tool for available work trace anchors.
- `augnes_get_work_brief`: read tool for Work Focus context.
- `augnes_record_work_event`: bridge-gated write tool for recording human-readable work trace notes.

`augnes_record_work_event` is only available when the bridge is explicitly enabled with `AUGNES_ENABLE_AGENT_BRIDGE=true`. Recording a work event does not commit or reject state proposals. ChatGPT App bridge tools do not get commit/reject authority.

Local bridge and Developer Mode validation covered two flows:

- state brief validation through `/api/state/brief` and `structuredContent.brief.agent_handoff`
- work tools validation through `augnes_list_work_items`, `augnes_get_work_brief`, and bridge-gated `augnes_record_work_event`

This is local-first validation through a local bridge and HTTPS tunnel, not hosted production deployment.

Earlier MCP Inspector validation verified the action proof loop:

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

This proves the first practical version of the intended coordination layer: an external MCP client can read Augnes state and write an action result back into the temporal graph. In other words, Augnes replaces the human message bus between ChatGPT, Codex, GitHub, and local project state with explicit state handoff, task trace, and proof layers.

## How to Run

Terminal 1: Augnes runtime.

```bash
cd /path/to/augnes
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

Terminal 2: ChatGPT App / MCP bridge.

```bash
cd /path/to/augnes/apps/augnes_apps
npm install
AUGNES_ENABLE_AGENT_BRIDGE=true \
AUGNES_API_BASE_URL=http://localhost:3000 \
npm run dev
```

Verification:

```bash
cd /path/to/augnes
npm run db:reset
npm run db:migrate
npm run demo:seed
npm run typecheck
npm run build

cd /path/to/augnes/apps/augnes_apps
npm run typecheck
npm run smoke
```

## MCP Bridge Local Check

To reproduce the MCP bridge proof locally, run both packages from this repo.

Terminal 1:

```bash
cd /path/to/augnes
npm install
npm run db:reset
npm run demo:seed
npm run dev -- --port 3000
```

Terminal 2:

```bash
cd /path/to/augnes/apps/augnes_apps
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

For Work Trace Spine validation, run:

```text
augnes_list_work_items
augnes_get_work_brief
```

Use a work ID such as `AG-001` for `augnes_get_work_brief`. If bridge mode is enabled with `AUGNES_ENABLE_AGENT_BRIDGE=true`, `augnes_record_work_event` can append a work trace note without committing or rejecting state.

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
15. Confirm the Current Work card summarizes `agent_handoff`.
16. Open Work Focus for `AG-001` and confirm recent events, related proof, and Codex handoff render.
17. Optionally run the MCP bridge proof and confirm the external action appears in the graph.

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

curl -s "http://localhost:3000/api/work?scope=project:augnes"

curl -s "http://localhost:3000/api/work/AG-001?scope=project:augnes"

curl -s "http://localhost:3000/api/work/AG-001/brief?scope=project:augnes"
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
- The Augnes runtime itself does not host MCP; the MCP bridge lives in `apps/augnes_apps`.
- There is no auth, vector database, or charting library.
- The Temporal State Graph is a lightweight UI, not a full analytics timeline.

## Submission Tagline

> Augnes turns AI work into temporal state trajectories.
