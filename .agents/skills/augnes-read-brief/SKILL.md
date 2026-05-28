---
name: augnes-read-brief
description: Read Augnes state and work context before implementation using existing Codex brief helpers while preserving missing-runtime gaps.
---

# Augnes Read Brief

## Purpose

Read current Augnes state and work context before implementation.

## When To Use

Use at the start of Augnes repo work when the local Augnes runtime may be
available, when a handoff mentions a scope or work ID, or when `CODEX_WORK_ID`
is set.

## Required Inputs

- `AUGNES_API_BASE_URL`: local Augnes runtime URL, usually
  `http://localhost:3000`.
- `CODEX_SCOPE`: Augnes scope. Existing helpers default to `project:augnes`
  where supported.
- `CODEX_WORK_ID`: optional work trace anchor. When set, `codex:read-brief`
  reads Work Brief context after the state brief.

## Procedure

1. Read repo instructions and task-relevant docs first.
2. Check whether the local Augnes runtime is available.
3. Run `npm run codex:read-brief` when runtime context is available.
4. If `CODEX_WORK_ID` is set, keep it in the environment so the helper reads
   the Work Brief context.
5. Preserve helper output as context. Do not reconstruct missing runtime output.

## Commands

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
npm run codex:read-brief
```

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-___ \
npm run codex:read-brief
```

## Expected Output

- State brief summary when runtime is reachable.
- Work Brief context when `CODEX_WORK_ID` is set and valid.
- Concrete skipped reason when runtime or work context is unavailable.

## Failure Or Skipped-Reason Handling

- Runtime unavailable: report `local runtime unavailable`.
- Missing work ID: report `missing CODEX_WORK_ID` when work-linked context is
  required.
- Unknown work ID: report the helper's unknown-work failure.
- Do not fabricate state brief, work brief, work IDs, evidence IDs, action IDs,
  session IDs, or PR refs.

## Authority Boundaries

This skill is read-only context intake. It does not commit/reject Augnes state,
record proof, approve, publish, retry, replay, merge, externally post, or
execute Codex from ChatGPT.

## Forbidden Actions

- Reconstructing missing runtime output.
- Treating Work IDs as state authority.
- Treating read context as approval.
- Calling approval, publish, retry, replay, merge, or external-posting paths.

