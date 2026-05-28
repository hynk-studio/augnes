---
name: augnes-authority-audit
description: Audit an Augnes PR before closeout for forbidden authority changes and produce a pass/warn/fail checklist.
---

# Augnes Authority Audit

## Purpose

Check a PR before closeout for forbidden authority changes and produce a
pass/warn/fail checklist suitable for a PR body or review note.

## When To Use

Use before committing, before PR creation, and before final closeout on Augnes
workflow, bridge, Codex, ChatGPT, publication, or docs-only changes.

## Required Inputs

- User task scope.
- `git status` and changed file list.
- PR body or closeout draft.
- Verification results and skipped checks.
- Any explicit user approval or Core-gated route scope, if present.

## Procedure

1. Compare changed files against allowed scope.
2. Check for forbidden authority changes.
3. Confirm docs-only PRs changed only docs/instruction files.
4. Confirm PR body includes Summary, Files changed, Authority boundary
   statement, Verification, Skipped checks, and Proof-only closeout status or
   skipped reason.
5. Emit pass/warn/fail checklist.

## Commands

```bash
git status --short
git diff --name-only
git diff --check
```

## Expected Output

```text
Authority audit:
- PASS: no ChatGPT direct Codex execution
- PASS: no Codex commit/reject authority
- PASS: no Codex merge or auto-merge authority
- WARN: proof-only closeout skipped: missing CODEX_WORK_ID
- FAIL: docs-only PR changed a runtime route
```

## Failure Or Skipped-Reason Handling

- Use `FAIL` for forbidden changes.
- Use `WARN` for missing evidence/proof/runtime context with concrete reasons.
- Use `PASS` only when the check was actually inspected.

## Authority Boundaries

The audit is a review aid. It is not runtime enforcement, not approval, not
publication readiness, not merge authority, and not an Augnes commit/reject
decision.

## Forbidden Actions

- Adding ChatGPT direct Codex execution.
- Adding Codex commit/reject authority.
- Adding Codex merge authority or auto-merge.
- Adding approve, publish, retry, replay, or external-posting automation unless
  explicitly scoped through a Core-gated route and user approval.
- Changing secret handling.
- Letting docs-only PRs change runtime, route, schema, MCP/App tool, hook,
  plugin, skill implementation, package script, closeout helper, browser
  runbook, dogfood helper, or secret-handling files.
