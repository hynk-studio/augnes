# Verification Evidence Pack

A Verification Evidence Pack is the small review bundle Codex should leave behind after repo work. It records what was checked across commands, Browser/Chrome, ChatGPT Developer Mode, MCP/widget flows, and artifacts without committing generated outputs.

## Goals

- Make verification reproducible from the PR.
- Separate evidence summaries from generated artifacts.
- Preserve exact failures instead of smoothing them over.
- Show which execution surfaces were used.
- Keep secrets, local DB files, screenshots, tunnel URLs, generated outputs, and local artifacts out of git.

## Evidence Categories

### Command Checks

Record each command, working directory, result, and important output.

```text
Command: npm run typecheck
Working directory: repo root
Result: passed | failed | unavailable | skipped
Evidence: short summary or exact failure
```

Required commands for Augnes PRs unless unavailable:

```bash
npm run typecheck
npm --prefix apps/augnes_apps run typecheck
npm --prefix apps/augnes_apps run smoke
npm --prefix apps/augnes_apps run invariants
```

### Browser/Chrome Checks

Use Browser/Chrome when the local runtime or UI is available. Record:

- URL opened
- surface checked, such as Runtime Cockpit, Temporal State Graph, or Work Focus
- expected behavior
- actual behavior
- whether screenshots were produced and where they remained locally

Do not commit screenshots unless the user explicitly asks for committed proof assets.

### ChatGPT Developer Mode Checks

When available, record:

- endpoint used, redacting tunnel details if sensitive
- tool or widget checked
- expected structured content
- actual result
- whether the check used public profile or bridge-enabled mode

A skipped Developer Mode check is acceptable when no tunnel, local runtime, or Developer Mode access is available. State the reason plainly.

### MCP / Widget Checks

For MCP Inspector or widget checks, record:

- MCP endpoint
- tools invoked
- result status
- widget URI and profile when relevant
- proof recorded back into Augnes, if any

### Live Publication Adapter Checks

Only include live GitHub publication adapter evidence when the user/PM explicitly
approved one specific target for that PR. Record the target PR, comment id/URL,
`idempotency_key`, dry-run result, actual publish result, replay result, delivery
ledger result, and event-spine result. PR #67 is the baseline example: one live
GitHub PR comment, comment id `4414174258`, one sent delivery, publication
became sent, replay produced no duplicate, and the retained comment remains
evidence. This does not authorize automatic posting in future PRs.

### Artifacts

Artifacts include screenshots, local DB files, generated `outputs/`, log captures, and tunnel URLs. The evidence pack should summarize artifacts without committing them.

```text
Artifact: local screenshot
Path: not committed, retained locally at <local path or omitted>
Purpose: browser verification of Work Focus
Committed: no
```

## Minimal PR Evidence Template

```text
Verification Evidence Pack

Commands:
- npm run typecheck: 
- npm --prefix apps/augnes_apps run typecheck: 
- npm --prefix apps/augnes_apps run smoke: 
- npm --prefix apps/augnes_apps run invariants: 

Browser/Chrome:
- Surface:
- Expected:
- Actual:
- Skipped reason, if any:

ChatGPT Developer Mode:
- Surface/tool:
- Expected:
- Actual:
- Skipped reason, if any:

MCP/widget:
- Surface/tool:
- Expected:
- Actual:
- Skipped reason, if any:

Artifacts not committed:
- 
```

## Failure Rule

If a command or surface fails because of environment setup, missing dependencies, missing local runtime, unavailable Developer Mode, or absent Browser/Chrome capability, report the exact failure. Do not mark it as passed and do not hide it under a generic note.
