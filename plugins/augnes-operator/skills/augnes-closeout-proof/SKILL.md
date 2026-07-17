---
name: augnes-closeout-proof
description: Close out Codex work with the proof-only completion helper when runtime and work context are available.
---

# Augnes Closeout Proof

## Purpose

Close out Codex work with proof-only completion when runtime and work context
are available.

## When To Use

Use at PR closeout after implementation and verification are complete, or when
the user asks for Augnes proof recording.

## Required Inputs

- Local Augnes runtime availability.
- `CODEX_WORK_ID`.
- Result status.
- Result kind.
- Result summary.
- Files changed.
- Related PR when known.
- Related state keys when known.
- Skipped checks with concrete reasons.

## Procedure

1. Confirm verification results and skipped checks.
2. Confirm runtime and `CODEX_WORK_ID`.
3. Use `npm run codex:record-completion-proof`.
4. Use returned action/work event IDs only from helper output.
5. If proof-only closeout cannot run, state the exact skipped reason.

## Commands

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-___ \
CODEX_ACTION_NAME=codex_closeout \
CODEX_RESULT_SUMMARY="Codex completed the requested slice and verified checks." \
CODEX_FILES_CHANGED="AGENTS.md,docs/example.md" \
CODEX_RESULT_STATUS=completed \
CODEX_RESULT_KIND=documentation \
CODEX_RELATED_PR="https://github.com/Aurna-code/augnes/pull/___" \
CODEX_RELATED_STATE_KEYS="coordination.example" \
npm run codex:record-completion-proof
```

## Expected Output

- Proof-only action record/work event IDs from helper output, or a concrete
  skipped reason.
- PR body closeout section that distinguishes proof from approval.

## Failure Or Skipped-Reason Handling

- Missing runtime: report `local runtime unavailable`.
- Missing work ID: report `missing CODEX_WORK_ID`.
- Unknown work ID: report the helper's unknown-work failure.
- Helper failure: report the helper error.
- Do not claim proof was recorded unless the helper returned proof IDs.

## Authority Boundaries

Proof-only completion records what Codex did. It does not create or imply
committed Augnes state, approval, publication, retry, replay, external posting,
merge, auto-merge, or durable user/Core decision.

## Forbidden Actions

- Creating or implying committed Augnes state.
- Creating a second native-host result or receipt authority.
- Fabricating action IDs, work event IDs, evidence IDs, PR refs, or state keys.
- Merging PRs, enabling auto-merge, or claiming merge authority.
