---
name: augnes-read-brief
description: Read the current-project GuideBrief v0.2 and optional work context before implementation while preserving source gaps and TaskContextPacket separation.
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
- `CODEX_PROJECT_ID`: optional exact project ID supplied only by an authorized
  host/operator path. The active project is used by default.
- `CODEX_WORK_ID`: optional work trace anchor. When set, `codex:read-brief`
  reads Work Brief context after GuideBrief.

## Procedure

1. Read repo instructions and task-relevant docs first.
2. For a fresh local repository resume/continue/current-state request, invoke
   `augnes_resume_repository` with the current physical repository root first.
3. Check whether the local Augnes runtime is available.
4. Run `npm run codex:read-brief` only when GuideBrief conversation context is
   separately useful; it is not a fallback for repository continuity.
5. If `CODEX_WORK_ID` is set, keep it in the environment so the helper reads
   the Work Brief context.
6. Preserve observed, inferred, suggested and unresolved-judgment separation.
   GuideBrief does not override an exact `TaskContextPacket`.
7. Do not reconstruct missing runtime output.

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

- Current coordinate, Observed, Inferred with caveats, Suggested, Needs user
  judgment, Constraints, Required checks, Authority boundary, and Source status
  from GuideBrief v0.2 when runtime is reachable.
- Work Brief context when `CODEX_WORK_ID` is set and valid.
- Concrete skipped reason when runtime or work context is unavailable.

## Failure Or Skipped-Reason Handling

- Runtime unavailable: report `local runtime unavailable`.
- Missing work ID: report `missing CODEX_WORK_ID` when work-linked context is
  required.
- Unknown work ID: report the helper's unknown-work failure.
- Do not fabricate GuideBrief, work brief, work IDs, evidence IDs, action IDs,
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
