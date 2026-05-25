# Codex Handoff Demo

This is a small local proof that Codex, or another external agent, can use Augnes as the coordination layer:

1. Read the Augnes runtime state brief.
2. Perform or simulate a small repo task.
3. Record the external action result back into Augnes.
4. Confirm the Temporal State Graph shows the external action transition.

The scripts call the Augnes runtime REST API directly. They do not invoke MCP tools, add ChatGPT write tools, or change the public app surface.

## Why this exists

Augnes exists because the user was tired of being the human message bus between ChatGPT, Codex, and GitHub.

ChatGPT can plan and review. Codex can implement and test. GitHub stores code. Augnes makes the project state explicit and records what changed.

This demo proves that loop without turning Augnes Apps into a workflow platform.

## Prerequisites

- Single `Aurna-code/augnes` checkout.
- Augnes Apps bridge scripts under `apps/augnes_apps`.
- Augnes runtime running on port `3000`.
- Augnes Apps bridge is optional for MCP or ChatGPT validation. These scripts call the runtime REST API directly.

The scripts read:

- `AUGNES_API_BASE_URL`, default `http://localhost:3000`
- `AUGNES_SCOPE`, default `project:augnes`

## Start the runtime

From the repository root:

```bash
cd /path/to/augnes
npm install
npm run db:reset
npm run demo:seed
npm run dev -- --port 3000
```

## Read the state brief

From the nested bridge package:

```bash
cd /path/to/augnes/apps/augnes_apps
npm install
npm run codex:read-brief
```

Expected output is compact:

```text
Augnes state brief
runtime: augnes
scope: project:augnes
active_state count: ...
pending_proposals count: ...
recent_actions count: ...
open_tensions count: ...
```

When the runtime returns `agent_handoff`, the MCP bridge preserves it as `structuredContent.brief.agent_handoff` on `augnes_get_state_brief`. The packet can carry current status, next action, blockers or tensions, verification commands, and an action record template for Codex handoff.

If the runtime is unavailable, the script exits nonzero with a stable message such as:

```text
CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE
```

## Simulate a repo task

Do any small local action that belongs in the handoff story. For example, update this runbook, run `npm run typecheck`, or inspect a targeted source file.

The important boundary is that the action result is recorded in Augnes Core, not hidden in ChatGPT or Codex session state.

## Record the action result

```bash
npm run codex:record-result
```

The default record payload is:

```json
{
  "scope": "project:augnes",
  "source_agent_id": "agent:codex",
  "action_name": "codex_handoff_demo",
  "result_summary": "Codex handoff demo recorded an external action result through Augnes.",
  "files_changed": ["docs/CODEX_HANDOFF_DEMO.md"]
}
```

The runtime wire contract is snake_case. Keep it that way.

## Optional custom result

```bash
CODEX_ACTION_NAME=update_agent_bridge_runbook \
CODEX_RESULT_SUMMARY="Updated the local bridge demo runbook and verified typecheck." \
CODEX_FILES_CHANGED="docs/11_AGENT_BRIDGE_LOCAL_RUNBOOK.md,README.md" \
CODEX_RESULT_STATUS=completed \
CODEX_RESULT_KIND=verification \
npm run codex:record-result
```

Supported result statuses are `completed`, `failed`, `blocked`, `partial`, and `needs_review`. Supported result kinds are `implementation`, `verification`, `documentation`, `screenshot`, `handoff`, `review`, and `other`.

`CODEX_FILES_CHANGED` has three useful modes: unset uses the demo default, `CODEX_FILES_CHANGED=""` records no changed files, and comma-separated values record the trimmed non-empty paths.

Optional source agent override:

```bash
CODEX_SOURCE_AGENT_ID=agent:codex-local npm run codex:record-result
```

## Optional end-to-end check

If the runtime is running and seeded:

```bash
npm run codex:handoff-check
```

This reads the state brief twice and confirms visible state counts do not
change. It does not record an action result, evidence row, work event, or
`external.*` state marker.

## Confirm in Augnes

Refresh:

```text
http://localhost:3000
```

When using `codex:record-result`, check the Temporal State Graph for:

```text
external.<action_name>_recorded
```

For the default script:

```text
external.codex_handoff_demo_recorded
```

You can also inspect the state brief directly:

```bash
curl "http://localhost:3000/api/state/brief?scope=project:augnes"
```

## Safety notes

- No auth is added here.
- No MCP tools are added here.
- No commit, reject, or job-trigger path is added here.
- No public tool defaults change.
- No local DB files or generated outputs should be committed.
- The public ChatGPT App remains read-only; the direct REST write belongs to Augnes Core.
