# Dogfood Report: Proof-Only Action-Record Completion Path

Date: 2026-05-26
Branch: `codex/dogfood-proof-only-action-record`

## 1. Scope

Dogfood `codex:record-completion-proof` after PR #222 and verify the new
proof-only action-record path is usable as the preferred Codex completion
closeout proof path.

This report checks the helper against the dedicated smoke and a temp local
Augnes runtime. No runtime behavior, schema, API route, Cockpit UI, bridge
health, explicit state-marker helper, compatibility helper migration, or
legacy `external.*` migration was changed.

## 2. Runtime Setup

Temp database:

```text
/tmp/augnes-dogfood-proof-only-action-record.db
```

Runtime setup commands:

```bash
rm -f /tmp/augnes-dogfood-proof-only-action-record.db /tmp/augnes-dogfood-proof-only-action-record.db-shm /tmp/augnes-dogfood-proof-only-action-record.db-wal /tmp/augnes-dogfood-proof-only-action-record.db-journal
AUGNES_DB_PATH=/tmp/augnes-dogfood-proof-only-action-record.db npm run db:reset
AUGNES_DB_PATH=/tmp/augnes-dogfood-proof-only-action-record.db npm run db:migrate
AUGNES_DB_PATH=/tmp/augnes-dogfood-proof-only-action-record.db npm run demo:seed
AUGNES_DB_PATH=/tmp/augnes-dogfood-proof-only-action-record.db npm run dev -- --hostname 127.0.0.1 --port 3032
```

Runtime URL:

```text
http://127.0.0.1:3032
```

The runtime started successfully. Next.js printed a workspace-root warning
because multiple lockfiles exist outside this repo path; no package or lockfile
changes were made.

## 3. Commands Run

Smoke and guardrail checks:

```bash
npm run smoke:codex-record-completion-proof-helper
npm run smoke:codex-helper-taxonomy
npm run smoke:codex-scope-env-consistency
npm run smoke:codex-session-adapter-v2
npm run smoke:codex-closeout-docs
npm run smoke:authority-invariants
npm run typecheck
npm --prefix apps/augnes_apps run typecheck
npm run smoke:codex-record-completion-follow-up-refs
```

Runtime dogfood commands:

```bash
AUGNES_API_BASE_URL=http://127.0.0.1:3032 CODEX_SCOPE=project:augnes CODEX_WORK_ID=AG-004 npm run codex:read-brief
curl -sS -X POST 'http://127.0.0.1:3032/api/actions/record-proof' -H 'content-type: application/json' --data '{"scope":"project:augnes","action_name":"invalid_missing_source_agent","result_summary":"Invalid proof request should fail before any writes.","files_changed":[],"result_status":"completed","result_kind":"verification","work_id":"AG-004","related_state_keys":["verification.evidence_records"]}'
AUGNES_API_BASE_URL=http://127.0.0.1:3032 CODEX_SCOPE=project:augnes CODEX_WORK_ID=AG-004 CODEX_ACTION_NAME=dogfood_proof_only_action_record CODEX_RESULT_SUMMARY="Dogfooded codex:record-completion-proof after PR #222 against a temp local Augnes runtime and verified proof-only action-record marker deltas." CODEX_FILES_CHANGED="reports/dogfood/2026-05-26-proof-only-action-record-dogfood.md" CODEX_RESULT_STATUS=completed CODEX_RESULT_KIND=verification CODEX_RELATED_PR="https://github.com/Aurna-code/augnes/pull/222" CODEX_RELATED_STATE_KEYS="verification.evidence_records,coordination.execution_trace" npm run codex:record-completion-proof
curl -sS 'http://127.0.0.1:3032/api/work/AG-004/brief?scope=project:augnes'
curl -sS 'http://127.0.0.1:3032/api/evidence-pack?scope=project:augnes&work_id=AG-004'
curl -sS 'http://127.0.0.1:3032/api/sessions/trace?scope=project:augnes'
curl -sS 'http://127.0.0.1:3032/api/state/brief?scope=project:augnes'
```

## 4. Proof-Only Action-Record Result

The live helper run succeeded:

```text
Augnes Codex completion proof recorded
scope: project:augnes
work_id: AG-004
action_name: dogfood_proof_only_action_record
source_agent_id: agent:codex
result_status: completed
result_kind: verification
action_record_id: action:81520e27-6264-44f2-b822-ea25cac4f422
event_type: verification
work_event_id: work-event:3ba6b0a2-df77-4c39-8284-86c2034cf714
related_pr: https://github.com/Aurna-code/augnes/pull/222
files_changed count: 1
related_state_keys count: 2
```

Persisted action record:

```json
{
  "id": "action:81520e27-6264-44f2-b822-ea25cac4f422",
  "state_key": null,
  "title": "dogfood_proof_only_action_record",
  "status": "completed",
  "source_agent_id": "agent:codex"
}
```

Persisted linked work event:

```json
{
  "id": "work-event:3ba6b0a2-df77-4c39-8284-86c2034cf714",
  "related_action_id": "action:81520e27-6264-44f2-b822-ea25cac4f422",
  "related_pr": "https://github.com/Aurna-code/augnes/pull/222",
  "related_state_keys": "[\"verification.evidence_records\",\"coordination.execution_trace\"]",
  "result_status": "completed",
  "result_kind": "verification"
}
```

Persisted coordination proof:

```json
[
  {
    "event_id": "event:work-event:3ba6b0a2-df77-4c39-8284-86c2034cf714",
    "event_type": "work_event_recorded",
    "authority_level": "execution_trace",
    "payload_ref": "work-event:3ba6b0a2-df77-4c39-8284-86c2034cf714",
    "work_id": "AG-004"
  },
  {
    "event_id": "event:action:81520e27-6264-44f2-b822-ea25cac4f422",
    "event_type": "action_result_recorded",
    "authority_level": "action_proof",
    "payload_ref": "action:81520e27-6264-44f2-b822-ea25cac4f422",
    "work_id": "AG-004"
  }
]
```

## 5. Marker Delta

Dedicated smoke marker result:

```text
action_records_delta: 1
state_entries_delta: 0
state_transitions_delta: 0
external_state_entries_delta: 0
proof_action_record_state_key: null
legacy_action_record_posts: 0
work_events_delta: 1
coordination_events_delta: 2
```

Live temp-runtime DB counts before:

```json
{
  "state_entries": 6,
  "state_transitions": 6,
  "external_state_entries": 0,
  "action_records": 0,
  "work_events": 6,
  "coordination_events": 1,
  "verification_evidence_records": 0
}
```

Live temp-runtime DB counts after invalid payload:

```json
{
  "state_entries": 6,
  "state_transitions": 6,
  "external_state_entries": 0,
  "action_records": 0,
  "work_events": 6,
  "coordination_events": 1,
  "verification_evidence_records": 0
}
```

Live temp-runtime DB counts after proof-only completion:

```json
{
  "state_entries": 6,
  "state_transitions": 6,
  "external_state_entries": 0,
  "action_records": 1,
  "work_events": 7,
  "coordination_events": 3,
  "verification_evidence_records": 0
}
```

Live delta:

```text
action_records_delta: 1
state_entries_delta: 0
state_transitions_delta: 0
external_state_entries_delta: 0
proof_action_record_state_key: null
legacy_action_record_posts: 0 by dedicated smoke; live helper used /api/actions/record-proof
work_events_delta: 1
coordination_events_delta: 2
```

Direct `external.*` query after the live helper run returned no rows:

```json
[]
```

## 6. Invalid Payload No-Write Result

The dedicated smoke includes an invalid direct `POST /api/actions/record-proof`
request with missing `source_agent_id`. It asserts the full proof/state
snapshot is unchanged before the successful helper case.

Smoke result:

```text
invalid_action_proof_posts: 1
invalid_action_proof_failed_without_writes: true
```

The live invalid payload returned:

```json
{"error":"source_agent_id is required."}
```

Live counts before and after the invalid payload were identical:

```text
action_records_delta: 0
state_entries_delta: 0
state_transitions_delta: 0
external_state_entries_delta: 0
work_events_delta: 0
coordination_events_delta: 0
```

## 7. Where The Proof Is Visible

### action_records

The `action_records` table contains the proof row with
`id: action:81520e27-6264-44f2-b822-ea25cac4f422`, title
`dogfood_proof_only_action_record`, status `completed`, and `state_key: null`.

### Work Brief

`GET /api/work/AG-004/brief?scope=project:augnes` showed the new work event as
the latest `recent_events` entry. The event included `related_action_id:
action:81520e27-6264-44f2-b822-ea25cac4f422` and PR #222.

`related_proof.action_ids` included:

```text
action:81520e27-6264-44f2-b822-ea25cac4f422
```

### Evidence Pack

`GET /api/evidence-pack?scope=project:augnes&work_id=AG-004` showed the proof
in `verification_trace.checks_passed` from both sources:

```text
work_events: work-event:3ba6b0a2-df77-4c39-8284-86c2034cf714
action_records: action:81520e27-6264-44f2-b822-ea25cac4f422
```

`verification_trace.source_refs` included the work event, action record, and
both coordination events.

### Session Trace

`GET /api/sessions/trace?scope=project:augnes` did not show this proof because
no session binding was performed. The seeded runtime still showed only
`session:demo-runtime-core` with `unbound_session`, `missing_related_work_id`,
and no linked action records.

### State Brief

`GET /api/state/brief?scope=project:augnes` showed the proof under
`recent_actions` with `state_key: null`. Active committed state count remained
3, and no `external.*` state entries appeared.

## 8. What Was Confusing

- The proof is now visible in `action_records`, Work Brief, Evidence Pack, and
  State Brief, which fixes the main PR #221 dogfood gap.
- Session Trace remains a separate workflow. The helper does not create or bind
  sessions, so proof is not visible there without a prior session binding.
- `docs/09_CODEX_COMPLETION_PROTOCOL.md` now documents the proof-only path near
  the top, but later wording still says "The helper checks that
  `CODEX_WORK_ID` exists, then records `/api/actions/record`, then records
  `/api/work/{work_id}/events`." That appears to describe compatibility helper
  behavior, but the heading/context could be clearer in a future docs cleanup.
- State Brief `recent_actions` now includes proof-only action records with
  `state_key: null`, while active state remains unchanged. That distinction is
  correct but important for reviewers to understand.

## 9. Preferred Path Readiness

`codex:record-completion-proof` is ready to be the preferred completion proof
path for closeout flows that need action proof, work trace, Evidence Pack
visibility, and no committed `external.*` marker.

## 10. Whether `codex:record-completion` Should Remain Compatibility Or Be Migrated

Recommendation: keep `codex:record-completion` as documented compatibility for
now and make a separate explicit migration decision. The compatibility helper
smoke still confirms that path posts one action record and one work event; it
was not run against the temp DB to avoid intentionally creating a legacy
`external.*` marker in this dogfood runtime.

Once reviewers accept the proof-only path, the next product decision can decide
whether `codex:record-completion` becomes an alias for the proof-only path or
remains a legacy compatibility helper indefinitely.

## 11. Whether An Explicit State-Marker Helper Is Needed

Likely yes only if operators still need deliberate Temporal State Graph/state
marker visibility for external work outcomes. That helper should be separately
named, gated, documented as committed state mutation, and tested independently.

This dogfood did not implement that helper.

## 12. Recommended Next Implementation Goal

Make a product decision on `codex:record-completion`: either migrate it to the
proof-only route with a compatibility note, or keep it as a legacy helper and
add a separately named explicit state-marker helper for the rare cases that
need committed marker state.

## 13. Skipped Checks

- Browser/Cockpit visual inspection: skipped because this dogfood task did not
  require UI changes or screenshots, and screenshots/generated artifacts are
  explicitly out of scope.
- ChatGPT Developer Mode inspection: skipped because no Developer Mode
  tunnel/session was available in this WSL runtime.
- Live compatibility helper run against the temp DB: skipped to avoid
  intentionally creating a legacy `external.*` marker in the dogfood runtime.
  Compatibility behavior was checked with
  `npm run smoke:codex-record-completion-follow-up-refs`, which confirmed
  `action_record_posts: 1` and `work_event_posts: 1`.

## Compatibility Notes

`codex:record-completion` and `codex:record-result` remain compatibility paths.
No legacy `external.*` records were migrated, deleted, hidden, or
reinterpreted.
