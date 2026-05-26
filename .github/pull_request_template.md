# Augnes PR Trace

## Work Trace

- Augnes Work ID: `AG-___`
- Related Augnes state keys:
  - `state.key`
- Related issue(s):
- Related proof or prior PRs:

## Summary

- 

## Result

- Result status: `completed | failed | blocked | partial | needs_review`
- Result kind: `implementation | verification | documentation | screenshot | handoff | review | other`
- Expected impact:
- Actual result:

## Execution Surfaces Used

Check only the surfaces used for this PR.

- [ ] GitHub
- [ ] Browser/Chrome
- [ ] ChatGPT Developer Mode
- [ ] MCP Inspector
- [ ] Local runtime
- [ ] Other:

## Verification Commands

Paste the command and result. If a command is unavailable or skipped, state the exact reason.

- [ ] `npm run typecheck`
- [ ] `npm --prefix apps/augnes_apps run typecheck`
- [ ] `npm --prefix apps/augnes_apps run smoke`
- [ ] `npm --prefix apps/augnes_apps run invariants`

## Browser / Chrome Checks

- [ ] Runtime cockpit checked in Browser/Chrome
- [ ] Relevant UI state or graph behavior checked
- [ ] Not run. Reason:

## ChatGPT App / Developer Mode Checks

- [ ] ChatGPT Developer Mode endpoint checked
- [ ] `augnes_get_state_brief` or work brief checked
- [ ] MCP/widget behavior checked
- [ ] Not run. Reason:

## Verification Evidence Pack

- Command evidence:
- Browser/Chrome evidence:
- ChatGPT Developer Mode evidence:
- MCP/widget evidence:
- Artifacts produced but not committed:

Do not commit secrets, local DB files, screenshots, generated outputs, or tunnel URLs containing private material.

## Structured Evidence Records

- Were structured evidence records created? `yes | no`
- Evidence record IDs:
  - `command_run`:
  - `check_passed`:
  - `check_failed`:
  - `check_skipped`:
  - `replay_observed`:
  - `duplicate_block_observed`:
- If not recorded, exact reason: `local runtime unavailable | evidence API unavailable | docs-only PR | external check not applicable | other:`
- Confirm evidence recording:
  - [ ] Did not call GitHub/OpenAI.
  - [ ] Did not execute replay or duplicate publish.
  - [ ] Did not mutate publication/approval/readiness/delivery/mailbox/state rows directly.

## Expected Impact vs Actual Result

- Expected files changed:
- Actual files changed:
- Expected state keys affected:
- Actual state keys recorded or referenced:
- Expected execution surfaces:
- Actual execution surfaces:
- Expected checks:
- Actual checks:
- Mismatch or follow-up:

## Safety Boundaries

Confirm this PR keeps the authority boundaries intact.

- [ ] No direct Codex orchestration was added.
- [ ] No autonomous Codex execution was added.
- [ ] No ChatGPT App commit/reject authority was added.
- [ ] No GitHub auto-merge was added.
- [ ] No auth or hosted deployment semantics were added.
- [ ] No secret handling changes were added.
- [ ] No secrets, local DB files, screenshots, tunnel URLs, generated outputs, or local artifacts are committed.

## Completion Record Reminder

After the PR task is complete, record Augnes proof with
`npm run codex:record-completion-proof` when a local runtime and valid
`CODEX_WORK_ID` are available. The proof-only helper uses
`/api/actions/record-proof`. Use `npm run codex:record-completion` only as
legacy compatibility behavior; it uses `/api/actions/record` and may create
legacy `external.*` marker state. Successful legacy writes emit a stderr
compatibility warning; compatibility migration remains unresolved.

Recommended fields:

```bash
CODEX_WORK_ID=AG-___
CODEX_RESULT_STATUS=completed
CODEX_RESULT_KIND=documentation
CODEX_RELATED_PR=https://github.com/Aurna-code/augnes/pull/___
CODEX_RELATED_STATE_KEYS="state.key,another.state.key"
```
