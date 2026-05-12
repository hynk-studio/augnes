# Verification Evidence Pack

A Verification Evidence Pack is the small review bundle Codex should leave behind after repo work. It records what was checked across commands, Browser/Chrome, ChatGPT Developer Mode, MCP/widget flows, and artifacts without committing generated outputs.

## Goals

- Make verification reproducible from the PR.
- Separate evidence summaries from generated artifacts.
- Preserve exact failures instead of smoothing them over.
- Show which execution surfaces were used.
- Keep secrets, local DB files, screenshots, tunnel URLs, generated outputs, and local artifacts out of git.

## Evidence Pack v0.1 API

The runtime exposes a narrow derived review bundle at:

```text
GET /api/evidence-pack?scope=project:augnes
```

Optional filters are `work_id`, `publication_id`, `delivery_id`, and
`target_ref`. If no filter is supplied, v0.1 selects deterministically: latest
delivery by `updated_at`, `created_at`, then `delivery_id`; otherwise latest
publication; otherwise the first deterministic work item; otherwise an empty
pack with gaps. If multiple filters are supplied, selection priority is
`delivery_id`, `publication_id`, `work_id`, then `target_ref`.

Evidence Pack v0.1 is read-only derived data. It does not approve, publish,
retry, acknowledge, record proof, commit or reject state, mutate mailbox, call
GitHub, call OpenAI, or create delivery rows. It includes delivery
`external_artifact_id`, `external_artifact_url`, and `external_artifact_type`
when those fields are stored. Missing command/skipped-check structure is shown
as `gaps`; the endpoint must not fabricate verification results to make a pack
look complete.

Structured verification evidence records are now stored separately from
approval, publication, readiness, delivery, mailbox, and committed state rows.
The local runtime exposes:

```text
GET /api/evidence/records?scope=project:augnes
POST /api/evidence/records
```

`POST /api/evidence/records` records bounded observation evidence only. It can
store `command_run`, `check_passed`, `check_failed`, `check_skipped`,
`replay_observed`, and `duplicate_block_observed` records. It does not approve,
publish, replay, retry, commit or reject state, mutate mailbox, call GitHub,
call OpenAI, or require `GITHUB_TOKEN` / `OPENAI_API_KEY`.

Evidence Pack reads matching records for the selected work, publication,
delivery, or target. Matching `command_run` records populate
`verification_trace.commands_run`; matching `check_passed` records populate
`verification_trace.checks_passed`; matching `check_skipped` records populate
`verification_trace.skipped_checks`; matching `replay_observed` and
`duplicate_block_observed` records set the corresponding replay observation
fields. Gaps are reduced only when matching records exist. Unrelated evidence
records must not make a selected pack appear complete.

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

After running a command, Codex or another local verifier may record a bounded
`command_run` evidence record. The record says the command was reported as run;
it is not broad proof of correctness beyond that exact command and result
summary.

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

Skipped checks should be recorded as `check_skipped` with a concrete
`skipped_reason` when the evidence record API is available.

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
ledger result, stored `external_artifact_id`/`external_artifact_url`/
`external_artifact_type`, and event-spine result. PR #67 is the baseline
example: one live GitHub PR comment, comment id `4414174258`, one sent delivery,
publication became sent, replay produced no duplicate, and the retained comment
remains evidence. This does not authorize automatic posting in future PRs.

Replay and duplicate-block observations are stored only when explicitly
observed elsewhere. Creating `replay_observed` or `duplicate_block_observed`
records must not itself execute replay or attempt a duplicate publish.

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
