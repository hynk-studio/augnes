---
name: augnes-record-evidence
description: Record or report Augnes verification evidence rows using existing helpers, with concrete skipped reasons when evidence recording is unavailable.
---

# Augnes Record Evidence

## Purpose

Record or report verification evidence for Codex work without fabricating
evidence IDs or treating evidence as approval.

## When To Use

Use after running verification commands or when documenting skipped checks for a
work-linked Augnes task.

## Required Inputs

- Available local Augnes runtime.
- `CODEX_WORK_ID` for work-linked evidence.
- Evidence API availability.
- Command/check name.
- Result status and summary.
- Concrete skipped reason when a check did not run.

## Procedure

1. Run or identify the verification check.
2. Confirm runtime, `CODEX_WORK_ID`, and evidence API availability.
3. Use `npm run codex:record-evidence` when prerequisites are present.
4. Copy returned `evidence_id` values only from helper output.
5. If evidence recording is unavailable, report the exact gap in the PR body.

## Commands

Record a passed command run:

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-___ \
CODEX_EVIDENCE_KIND=command_run \
CODEX_EVIDENCE_STATUS=passed \
CODEX_EVIDENCE_LABEL="Root typecheck" \
CODEX_COMMAND="npm run typecheck" \
CODEX_RESULT_SUMMARY="npm run typecheck passed." \
npm run codex:record-evidence
```

Record a skipped check:

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-___ \
CODEX_EVIDENCE_KIND=check_skipped \
CODEX_EVIDENCE_STATUS=skipped \
CODEX_EVIDENCE_LABEL="Browser verification" \
CODEX_RESULT_SUMMARY="Browser verification was not run." \
CODEX_SKIPPED_REASON="no browser runtime available" \
npm run codex:record-evidence
```

## Expected Output

- Evidence row ID from helper output, or a concrete skipped reason.
- PR-ready evidence summary by check.

## Failure Or Skipped-Reason Handling

- Missing runtime: report `local runtime unavailable`.
- Missing work ID: report `missing CODEX_WORK_ID`.
- Evidence API unavailable: report `evidence API unavailable`.
- Helper failure: report the helper error.
- Do not fabricate `evidence_id`.

## Authority Boundaries

Evidence rows are verification material. They are not approval, committed state,
publication readiness, merge authority, or proof of user/Core durable decision.

## Forbidden Actions

- Claiming evidence was recorded when no helper ID was returned.
- Recording evidence without required work context.
- Using evidence rows to commit/reject state, approve, publish, retry, replay,
  externally post, merge, or enable auto-merge.

