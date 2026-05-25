# Codex Session Adapter v0.2 Workflow

Codex Session Adapter v0.2 packages the existing Augnes/Codex continuity pieces into a standard repo workflow. It is a workflow, tooling, and documentation layer for starting Codex work with current state context, optionally binding an existing session, recording verification evidence, recording completion, and leaving reviewable Evidence Pack and Session Trace refs.

v0.2 is not a new session runtime. v0.2 does not create sessions automatically. v0.2 does not execute Codex from ChatGPT. v0.2 does not add ChatGPT App write tools. v0.2 does not approve, publish, retry, replay, or mutate state. v0.2 uses existing helpers and existing read-only trace surfaces.

## Purpose

- Give Codex a repeatable start, implementation, verification, completion, and review trace flow.
- Connect `work_id`, optional `session_id`, PR refs, handoff refs, Evidence Pack refs, evidence rows, action proof, and work events.
- Preserve authority boundaries: Codex can implement and verify repo work; Augnes Core owns proof/state routes; the user owns durable approval.
- Keep missing runtime, missing session, missing work, and skipped checks visible as explicit gaps.

## Existing Components Used

- State/work brief read: `npm run codex:read-brief`, `GET /api/state/brief`,
  and, when `CODEX_WORK_ID` is set, `GET /api/work/{work_id}/brief`.
- Session binding: `npm run codex:bind-session` and `POST /api/sessions/bind`.
- Session trace review: `GET /api/sessions/trace` and `GET /api/sessions/{session_id}/trace`.
- Structured evidence rows: `npm run codex:record-evidence` and `POST /api/evidence/records`.
- Evidence Pack review: `GET /api/evidence-pack`.
- Proof-only completion trace: `npm run codex:record-completion-proof` and
  `/api/work/{work_id}/events`.
- Compatibility completion proof: `npm run codex:record-completion`,
  `/api/actions/record`, and `/api/work/{work_id}/events`.
- Handoff smoke/check path: `npm run codex:handoff-check`, a read-only
  state-brief check.
- Command taxonomy: `docs/CODEX_HELPER_COMMAND_TAXONOMY.md` separates
  check-only, record-proof, and commit-state helper semantics.
- ChatGPT App read-only review tools:
  - `augnes_get_evidence_pack`
  - `augnes_get_session_trace`
  - `augnes_get_verification_evidence_records`

## Required Environment

- `CODEX_SCOPE`: Augnes scope. Defaults to `project:augnes` in helpers that support defaults.
- `CODEX_WORK_ID`: Optional for `codex:read-brief`; existing Augnes work trace
  anchor, such as `AG-004`, when reading Work Brief context or recording
  evidence or completion.
- `AUGNES_API_BASE_URL`: Local Augnes runtime URL. Defaults to `http://localhost:3000` in existing helpers.

## Optional Environment

- `CODEX_SESSION_ID`: Existing `sessions` row to bind. Required only for `codex:bind-session`.
- `CODEX_SESSION_SURFACE`: Session surface, usually `codex`.
- `CODEX_SESSION_ACTOR`: Session actor, usually `codex`.
- `CODEX_SESSION_SUMMARY`: Short human-readable session summary.
- `CODEX_RELATED_PR`: GitHub PR URL or target ref.
- `CODEX_HANDOFF_REF`: Handoff packet or handoff record ref.
- `CODEX_EVIDENCE_PACK_REF`: Evidence Pack ref string.
- `CODEX_RELATED_STATE_KEYS`: Comma-separated or JSON string array for completion proof.
- `CODEX_SOURCE_REF`: Optional source ref for evidence rows.

## Session Start / Preflight Checklist

1. Read current repo instructions and PR trace docs.
2. Read current Augnes state/work context:

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
npm run codex:read-brief
```

When the work ID is already known, include it so the helper reads the Work Brief
route after the state brief:

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-___ \
npm run codex:read-brief
```

With `CODEX_WORK_ID` set, `codex:read-brief` prints the Work Brief summary,
Codex handoff constraints, and suggested verification. Missing runtime or an
unknown `work_id` must be reported as a concrete skipped reason or helper error,
not reconstructed.

3. Identify the `work_id` from the handoff packet, state/work brief, or user task.
4. Identify the `session_id` only if one was supplied or already exists in Augnes Core. Never create a session automatically in v0.2.
5. Confirm the expected PR target, handoff ref, Evidence Pack ref, and state keys when they are known.
6. If local runtime is unavailable, continue repo work only if the task allows it and record the exact skipped reason for runtime-backed steps.

## Bind An Existing Session

Bind only a pre-existing session row. Unknown sessions fail closed.

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
CODEX_SESSION_ID=session:... \
CODEX_SESSION_SURFACE=codex \
CODEX_WORK_ID=AG-___ \
CODEX_RELATED_PR="https://github.com/Aurna-code/augnes/pull/___" \
CODEX_SESSION_SUMMARY="Codex session for the v0.2 workflow packaging PR." \
CODEX_HANDOFF_REF="handoff:..." \
CODEX_EVIDENCE_PACK_REF="evidence-pack:..." \
npm run codex:bind-session
```

If `CODEX_SESSION_ID` is missing, do not bind. If the runtime has no matching session row, report `session binding skipped: existing session_id not found` or the exact helper error. Do not create a replacement session.

## Implementation Phase

Codex works in the repository using normal repo capabilities: editing files, running tests, using Browser/Chrome for verification when relevant, committing, pushing, and opening a draft PR. ChatGPT App may read state and continuity views, but it does not execute Codex.

During implementation, do not call GitHub publication adapter routes, do not execute replay, do not attempt duplicate publish, do not approve or publish, and do not add ChatGPT App write tools or Cockpit write controls.

## Record Structured Evidence Rows

After verification commands or explicit skipped checks, record bounded observation rows when the local runtime and evidence API are available:

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

For skipped checks:

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-___ \
CODEX_EVIDENCE_KIND=check_skipped \
CODEX_EVIDENCE_STATUS=skipped \
CODEX_EVIDENCE_LABEL="ChatGPT Developer Mode check" \
CODEX_RESULT_SUMMARY="ChatGPT Developer Mode check was not run." \
CODEX_SKIPPED_REASON="No local runtime tunnel or Developer Mode session was available." \
npm run codex:record-evidence
```

Copy returned `evidence_id` values into the PR body. Do not fabricate evidence IDs. If evidence rows are unavailable, write the exact skipped reason instead.

## Skipped-Reason Policy

Every skipped check must name the check and a concrete reason. Acceptable reasons include:

- `local runtime unavailable`
- `evidence API unavailable`
- `missing CODEX_WORK_ID`
- `missing CODEX_SESSION_ID`
- `existing session_id not found`
- `no browser runtime available`
- `no ChatGPT Developer Mode tunnel/session available`
- `external check not applicable to this docs-only change`

Avoid generic reasons such as `not needed`, `skipped`, or `N/A` unless paired with the concrete reason.

## Record Codex Completion

At closeout, prefer proof-only completion recording when the runtime is
available and `CODEX_WORK_ID` is known:

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-___ \
CODEX_ACTION_NAME=codex_session_adapter_v0_2_workflow \
CODEX_RESULT_SUMMARY="Codex packaged the Session Adapter v0.2 workflow and verified docs/smoke checks." \
CODEX_FILES_CHANGED="docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md,apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md" \
CODEX_RESULT_STATUS=completed \
CODEX_RESULT_KIND=documentation \
CODEX_RELATED_PR="https://github.com/Aurna-code/augnes/pull/___" \
CODEX_RELATED_STATE_KEYS="coordination.session_binding,verification.evidence_records" \
npm run codex:record-completion-proof
```

`codex:record-completion-proof` preflights `GET /api/work/{work_id}` and then
records only `/api/work/{work_id}/events`. It does not call
`/api/actions/record` and does not create legacy `external.*` state markers.

`codex:record-completion` remains available as a compatibility path:

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-___ \
CODEX_SOURCE_AGENT_ID=agent:codex \
CODEX_ACTION_NAME=codex_session_adapter_v0_2_workflow \
CODEX_RESULT_SUMMARY="Codex packaged the Session Adapter v0.2 workflow and verified docs/smoke checks." \
CODEX_FILES_CHANGED="docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md,apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md" \
CODEX_RESULT_STATUS=completed \
CODEX_RESULT_KIND=documentation \
CODEX_RELATED_PR="https://github.com/Aurna-code/augnes/pull/___" \
CODEX_RELATED_STATE_KEYS="coordination.session_binding,verification.evidence_records" \
npm run codex:record-completion
```

If completion cannot be recorded, state the exact reason: missing runtime, missing work ID, unknown work ID, or helper failure. Do not claim a completion action ID unless the helper returned one.

## Inspect Evidence Pack

Review the derived Evidence Pack before PR closeout when the runtime is available:

```bash
curl -sS 'http://localhost:3000/api/evidence-pack?scope=project:augnes&work_id=AG-___' | jq .
```

The Evidence Pack is read-only. It may show structured evidence rows, session refs, and gaps. Missing rows or refs must remain gaps.

ChatGPT App review may use `augnes_get_evidence_pack` for the same read-only route.

## Inspect Session Trace

Review the bounded Session Trace when a `session_id` is known:

```bash
curl -sS 'http://localhost:3000/api/sessions/trace?scope=project:augnes' | jq .
curl -sS 'http://localhost:3000/api/sessions/session:.../trace?scope=project:augnes' | jq .
```

The trace is read-only. It does not bind sessions, create sessions, expand authority, execute Codex, call OpenAI/GitHub, approve, publish, replay, or mutate work/evidence/publication/delivery/readiness/mailbox/state records.

ChatGPT App review may use `augnes_get_session_trace` and `augnes_get_verification_evidence_records` for the same read-only continuity views.

## PR Body Evidence IDs

The PR body must include:

- `session_id`, session binding status, or skipped reason when applicable.
- Structured evidence record IDs by kind, or the exact skipped reason.
- Completion recording status, related action/work event IDs if returned, or skipped reason.
- Evidence Pack and Session Trace review status.
- Temporal Interpretation Manual Review Report status for temporal preview tasks.
- Changed files, tests, blockers, assumptions, scope risks, questions, and next goal.

## Missing Runtime, Session, Or Work

- Missing runtime: repo work may continue; runtime-backed evidence, binding, completion, Evidence Pack, and Session Trace checks must be marked skipped with `local runtime unavailable`.
- Missing `work_id`: do not record evidence or completion as work-linked proof. Report `missing CODEX_WORK_ID`.
- Unknown `work_id`: do not create orphan completion proof. Report the helper's unknown-work failure.
- Missing `session_id`: do not bind a session. Report `missing CODEX_SESSION_ID`.
- Unknown `session_id`: do not create a session. Report `existing session_id not found` or the helper's exact failure.

## Authority Boundaries

v0.2 keeps these boundaries:

- no automatic session creation
- no ChatGPT App write tools
- no publish/replay/approval/state mutation
- no autonomous Codex execution
- no Codex execution from ChatGPT
- no GitHub publication adapter calls
- no Cockpit write controls
- no DB schema changes
- no new runtime authority
- check-only helper names such as `codex:handoff-check` remain read-only
- legacy `external.*` markers from action-record compatibility helpers are not
  treated as accepted project facts
- proof-only completion recording uses `codex:record-completion-proof`; the
  legacy `codex:record-completion` helper remains compatibility behavior

Normal development use of GitHub remains allowed: fetch, branch, commit, push, and open a draft PR for code review.

## Example Closeout Report

```text
Changed files:
- docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md
- apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md

Verification:
- npm run typecheck: passed
- npm run smoke:codex-session-adapter-v2: passed
- Browser/Chrome: skipped, external check not applicable to this docs-only change

Structured evidence records:
- command_run: evidence:...
- check_skipped: evidence:...
- skipped reason if none: local runtime unavailable

Session trace:
- session_id: session:...
- binding status: bound to AG-___ and PR ___
- trace review: GET /api/sessions/{session_id}/trace passed

Completion:
- npm run codex:record-completion-proof: recorded proof-native work event, ID copied from helper output
- skipped reason if not recorded: missing CODEX_WORK_ID

Authority boundaries:
- automatic session creation added: no
- ChatGPT App write tools added: no
- GitHub publication adapter called: no
- replay or duplicate publish executed: no

Blockers:
- none

Assumptions:
- AG-___ is the intended work trace anchor

Next suggested goal:
- Review the Evidence Pack and Session Trace from ChatGPT read-only tools before the next implementation slice.
```
