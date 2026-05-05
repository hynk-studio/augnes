# Submission Message

Submission: Augnes — Temporal State Trajectories for AI Work

GitHub: https://github.com/Aurna-code/augnes

Augnes started from a practical annoyance: I was tired of being the human message bus between ChatGPT, Codex, and GitHub.

ChatGPT could plan and review. Codex could implement and test. GitHub could store the code. But the project state still lived in my head.

Augnes makes that state explicit. It is not a chatbot with memory and not a prompt wrapper. It is a temporal state runtime for AI-assisted work.

OpenAI APIs interpret natural language and propose typed, time-aware state deltas. The Augnes runtime validates those proposals, asks for commit/reject, records accepted transitions in a temporal ledger, and visualizes each state key as a Temporal State Graph.

Demo flow:
1. User describes project goals, constraints, and future plans.
2. Augnes proposes temporal state deltas.
3. User commits/rejects proposals.
4. State Snapshot and Temporal State Graph update.
5. Planner recommends actions grounded in active committed state.
6. Local tools create real checklist/demo files.
7. Action results become after-action state transitions.
8. Codex or another agent can read `/api/state/brief` for compact cross-agent state continuity.

MCP bridge proof:

This submitted repo contains both the Augnes runtime/cockpit at the repository root and the ChatGPT App / MCP bridge under `apps/augnes_apps`.

The nested `apps/augnes_apps` package exposes Augnes through MCP bridge tools such as:

- `augnes_get_state_brief`
- `augnes_observe`
- `augnes_plan`
- `augnes_record_action_result`
- `augnes_list_pending_proposals`

I verified the bridge through MCP Inspector from the single repo:

```text
MCP Inspector
  -> apps/augnes_apps /mcp
  -> augnes_get_state_brief
  -> Augnes runtime /api/state/brief
  -> augnes_record_action_result
  -> Augnes runtime /api/actions/record
  -> Temporal State Graph external action node
```

The proof appears in the graph as:

```text
external.mcp_inspector_bridge_check_recorded
false -> true
current_project · completed · completion
```

The selected transition says:

```text
MCP Inspector successfully read Augnes state brief through the Augnes Agent Bridge.
```

So the bridge loop is not just a diagram: an external MCP client can read Augnes state and write an action result back into the temporal graph.

Single-repo proof path: run the runtime from the repository root, run the bridge from `apps/augnes_apps`, call `augnes_get_state_brief` and `augnes_record_action_result`, then confirm the Temporal State Graph records the external action.

The model interprets.
The runtime owns state.
The bridge lets other agents act on it.
The graph shows what changed.
