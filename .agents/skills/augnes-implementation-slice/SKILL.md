---
name: augnes-implementation-slice
description: Keep Augnes implementation work bounded to the requested task, expected files, verification checks, and authority constraints.
---

# Augnes Implementation Slice

## Purpose

Keep implementation bounded to the task and prevent scope drift into unrelated
runtime, schema, API, tool, hook, plugin, or package-script changes.

## When To Use

Use before editing and during closeout for any Augnes code or documentation
task, especially when the request names expected files, forbidden changes, or
verification requirements.

## Required Inputs

- User task and allowed/forbidden scope.
- Current `git status`.
- Expected files or file classes.
- Relevant docs, handoff, or work brief context.
- Verification commands for touched areas.

## Procedure

1. Inspect `git status` before editing.
2. Identify expected files or file classes.
3. Identify forbidden changes before touching files.
4. Keep edits focused on the requested slice.
5. Avoid unrelated refactors and metadata churn.
6. Run `npm run typecheck` for behavior changes and when requested.
7. Run relevant `npm run smoke:*` checks for touched areas.
8. Record skipped checks with concrete reasons.

## Commands

```bash
git status --short
npm run typecheck
```

Run targeted smoke checks only when relevant to touched areas, for example:

```bash
npm run smoke:codex-session-adapter-v2
npm run smoke:authority-invariants
```

## Expected Output

- A bounded diff matching the requested scope.
- Verification results or concrete skipped reasons.
- PR body language that states changed files and authority boundaries.

## Failure Or Skipped-Reason Handling

- If a required check cannot run, name the check and exact reason.
- If scope is ambiguous and risky, stop and ask for clarification.
- If unrelated worktree changes exist, do not stage or modify them silently.

## Authority Boundaries

Codex may edit repo files and open PRs through normal GitHub workflow. Codex
does not commit/reject Augnes state, approve, publish, retry, replay,
externally post, merge PRs, enable auto-merge, or claim merge authority.

## Forbidden Actions

- Broadening into runtime behavior, database/schema, API route, MCP/App tool
  schema, package script, hook, plugin, skill, closeout helper, MCP config,
  browser runbook, dogfood helper, or secret-handling changes unless explicitly
  requested.
- Adding ChatGPT direct Codex execution.
- Adding approve/publish/retry/replay/external-posting automation.
- Claiming skipped checks passed.
