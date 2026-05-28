# AGENTS.md

## Codex Operating Contract For Augnes

This repository uses Augnes to keep committed state, pending proposals,
work traces, proof-only action records, and evidence rows distinct. Codex is a
repo implementation and verification worker. Preserve the authority boundaries.

## Start Of Work

- Read current repo instructions and task-relevant docs before editing.
- For Augnes workflow tasks, prefer this minimum context:
  - `README.md`
  - `docs/AUTHORITY_MATRIX.md`
  - `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md`
  - task-specific roadmap, handoff, or protocol docs
- Inspect `git status` before editing and keep changes scoped to the task.
- If the local Augnes runtime is available, run `npm run codex:read-brief`.
- If `CODEX_WORK_ID` is set, use `npm run codex:read-brief` so the Work Brief
  context is read too.

## Authority Boundaries

- Never commit or reject Augnes state.
- Codex may edit repo files and open PRs through normal GitHub workflow.
- Never merge PRs, enable auto-merge, or claim merge authority.
- Never approve, publish, retry, replay, or externally post unless a future task
  explicitly scopes a Core-gated route and explicit user approval.
- Even when a future Core-gated publish, retry, or replay route is explicitly
  scoped, merge remains a user/GitHub review decision, not Codex authority.
- Do not execute Codex from ChatGPT, add ChatGPT execution controls, or imply
  ChatGPT owns implementation authority.
- Do not treat proof as approval.
- Do not treat a PR as merge authority.
- Do not treat legacy `external.*` marker state as accepted project fact.

## Evidence And IDs

- Do not fabricate work IDs, evidence IDs, action IDs, session IDs, PR refs, or
  skipped check results.
- Record concrete skipped reasons, such as `local runtime unavailable`,
  `missing CODEX_WORK_ID`, `missing CODEX_SESSION_ID`, `evidence API
  unavailable`, `no browser runtime available`, or `external check not
  applicable to this docs-only change`.
- Prefer proof-only completion with `npm run codex:record-completion-proof`
  when the runtime and `CODEX_WORK_ID` are available.
- Treat `npm run codex:record-completion` as legacy compatibility only unless
  explicitly instructed.

## Verification

- Run `npm run typecheck` for behavior changes and for documentation changes
  when requested by the task.
- Run relevant `npm run smoke:*` checks for touched areas.
- If a check is skipped, name the check and give a concrete reason.
- Do not claim a check, evidence row, action record, or proof closeout happened
  unless the command ran and returned the relevant result.

## Forbidden Without Explicit Scope

- Runtime behavior changes
- Database or schema changes
- API route changes
- MCP/App tool schema changes
- Package script changes
- Hook implementation
- Plugin implementation
- Skills implementation
- Secret handling changes
- Approve, publish, retry, replay, merge, or external posting automation

## PR Closeout

Every PR body should include:

- Summary
- Files changed
- Authority boundary statement
- Verification
- Skipped checks
- Proof-only closeout status or skipped reason

For docs-only PRs, explicitly confirm that no runtime, route, schema,
MCP/App tool, hook, plugin, skill, package script, or secret-handling changes
were made.
