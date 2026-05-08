# Codex Handoff Packet

A Codex Handoff Packet is a copy-pasteable bridge from Augnes state/work context into Codex execution. It should be produced from committed Augnes state, the current work brief, pending proposals, open tensions, and recent proof. It is guidance for Codex, not an execution trigger.

## When To Use

Use this packet when ChatGPT App or Augnes needs to hand a repo task to Codex while preserving state boundaries:

- ChatGPT App interprets the user request and reads Augnes state/work brief.
- Codex executes repo work, verification, and PR preparation.
- Augnes records proof after the work.
- The user remains the durable approval authority.

## Source Material

Prefer these sources, in order:

1. `GET /api/work/{work_id}/brief?scope=project:augnes`
2. `GET /api/state/brief?scope=project:augnes`
3. `structuredContent.brief.agent_handoff` from `augnes_get_state_brief`
4. Recent `action_records` and `work_events`
5. Pending proposals and open tensions as warnings, not committed truth

## Copy-Paste Template

```text
Codex Handoff Packet

Augnes Work ID:
AG-___

Scope:
project:augnes

Current committed state summary:
- 

Related state keys:
- state.key

Task for Codex:
- 

Expected impact:
- Files expected to change:
- State keys expected to be referenced or recorded:
- Execution surfaces expected:
- Checks expected:

Constraints and safety boundaries:
- Treat committed Augnes state as source of truth.
- Treat pending proposals as suggestions only.
- Surface open tensions before depending on contested state.
- Do not commit API keys, local secrets, local DB files, screenshots, tunnel URLs, generated outputs, or local artifacts.
- Do not add direct Codex orchestration.
- Do not add autonomous Codex execution.
- Do not add ChatGPT App commit/reject tools.
- Do not add GitHub auto-merge.
- Do not add hosted auth or deployment semantics.

Verification commands:
- npm run typecheck
- npm --prefix apps/augnes_apps run typecheck
- npm --prefix apps/augnes_apps run smoke
- npm --prefix apps/augnes_apps run invariants

Browser/Chrome checks:
- 

ChatGPT App / Developer Mode checks:
- 

Completion record fields:
CODEX_WORK_ID=AG-___
CODEX_SCOPE=project:augnes
CODEX_ACTION_NAME=
CODEX_RESULT_SUMMARY=
CODEX_FILES_CHANGED=
CODEX_RESULT_STATUS=completed
CODEX_RESULT_KIND=documentation
CODEX_RELATED_PR=https://github.com/Aurna-code/augnes/pull/___
CODEX_RELATED_STATE_KEYS=state.key
```

## Completion Expectations

Codex should report:

- files changed
- commands run and exact failures, if any
- Browser/Chrome checks run or skipped with reason
- ChatGPT Developer Mode and MCP/widget checks run or skipped with reason
- expected impact vs actual result
- PR URL, if opened
- whether `npm run codex:record-completion` was run or why it was skipped

## Boundary

The packet is not an instruction for ChatGPT App to run Codex. It is a durable handoff format that a user, ChatGPT, or Augnes can present to Codex so execution remains explicit, user-directed, and reviewable.
