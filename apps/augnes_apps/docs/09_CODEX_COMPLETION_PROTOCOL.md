# Codex Verification Evidence and Closeout Proof

This runbook documents optional operator-recorded verification evidence and
proof-only closeout. These records are distinct from native-host result intake.
Native-host completion returns a structured result automatically through the
shared run lifecycle, complete receipt normalizer, canonical `RunReceipt`
admission, and project result readers. No packet copy, pasted report, session
binding, or manual internal identifier transfer is part of that path.

## Boundaries

- `RunReceipt` is immutable execution residue from the native-host lifecycle.
- `verification_evidence_records` are bounded observations recorded only when
  the operator explicitly authorizes evidence recording.
- proof-only `action_records` and linked `work_events` are optional closeout
  trace. They are not a second native-host result authority.
- none of these records is a `ReviewDecision`, semantic transition, Evidence
  acceptance, work closure, publication, or merge authority.

## Optional verification evidence

When the local runtime and a concrete work item are available and the user has
authorized recording, use:

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-004 \
CODEX_EVIDENCE_KIND=command_run \
CODEX_EVIDENCE_STATUS=passed \
CODEX_EVIDENCE_LABEL="Root typecheck" \
CODEX_COMMAND="npm run typecheck" \
CODEX_RESULT_SUMMARY="TypeScript completed with no errors." \
npm run codex:record-evidence
```

The helper calls only `POST /api/evidence/records`. A skipped check must use a
concrete skipped reason; it must never be presented as passing. If runtime or
work identity is unavailable, report the exact reason and do not fabricate a
record.

## Optional proof-only closeout

When proof recording is explicitly authorized, use:

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-004 \
CODEX_ACTION_NAME=ag_004_closeout \
CODEX_RESULT_SUMMARY="Implemented and verified the bounded task." \
CODEX_FILES_CHANGED="path/to/changed-file.ts" \
CODEX_RESULT_STATUS=completed \
CODEX_RESULT_KIND=implementation \
npm run codex:record-completion-proof
```

The helper preflights the work item, then writes through
`/api/actions/record-proof` and `/api/work/{work_id}/events`. It does not use
the legacy state-marker writer, create or bind a host session, create a
`RunReceipt`, or change canonical project state.

Allowed result statuses are `completed`, `failed`, `blocked`, `partial`, and
`needs_review`. Allowed kinds are `implementation`, `verification`,
`documentation`, `screenshot`, `handoff`, `review`, and `other`. Preserve the
truthful status and exact skipped checks.

## Review

Proof-only records remain visible through the existing Work Brief, Evidence
Pack, State Brief, and work-linked trace readers. Native-host results remain
visible through Project Home, read-only Workbench result review, and Inspector.
These reader families must not be conflated.

## Verification

```bash
npm --prefix apps/augnes_apps run typecheck
node --import tsx apps/augnes_apps/scripts/smoke.ts
npm run typecheck
```

Normal R5 verification uses deterministic fakes and makes zero live provider
requests. Live remote-host qualification is an Alpha/RC activity.
