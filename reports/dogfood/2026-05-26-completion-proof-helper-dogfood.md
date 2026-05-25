# Dogfood Report: Proof-Only Codex Completion Helper

Date: 2026-05-26
Branch: `codex/dogfood-completion-proof-helper`

## 1. Scope

Dogfood `codex:record-completion-proof` after PR #220 and verify it is usable
as the preferred future Codex closeout proof path. This report checks the
helper against both the dedicated smoke and a temp local Augnes runtime.

No runtime behavior, schema, API route, Cockpit UI, bridge health, state-marker
helper, proof-only action-record route, or legacy `external.*` migration was
changed.

## 2. Runtime Setup

Temp database:

```text
/tmp/augnes-dogfood-completion-proof-helper.db
```

Runtime setup commands:

```bash
rm -f /tmp/augnes-dogfood-completion-proof-helper.db /tmp/augnes-dogfood-completion-proof-helper.db-shm /tmp/augnes-dogfood-completion-proof-helper.db-wal /tmp/augnes-dogfood-completion-proof-helper.db-journal
AUGNES_DB_PATH=/tmp/augnes-dogfood-completion-proof-helper.db npm run db:reset
AUGNES_DB_PATH=/tmp/augnes-dogfood-completion-proof-helper.db npm run db:migrate
AUGNES_DB_PATH=/tmp/augnes-dogfood-completion-proof-helper.db npm run demo:seed
AUGNES_DB_PATH=/tmp/augnes-dogfood-completion-proof-helper.db npm run dev -- --hostname 127.0.0.1 --port 3030
```

Runtime URL:

```text
http://127.0.0.1:3030
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
AUGNES_API_BASE_URL=http://127.0.0.1:3030 CODEX_SCOPE=project:augnes CODEX_WORK_ID=AG-004 npm run codex:read-brief
curl -sS 'http://127.0.0.1:3030/api/work/AG-004/brief?scope=project:augnes'
curl -sS 'http://127.0.0.1:3030/api/evidence-pack?scope=project:augnes&work_id=AG-004'
curl -sS 'http://127.0.0.1:3030/api/sessions/trace?scope=project:augnes'
curl -sS 'http://127.0.0.1:3030/api/state/brief?scope=project:augnes'
```

Completion proof command:

```bash
AUGNES_API_BASE_URL=http://127.0.0.1:3030 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-004 \
CODEX_ACTION_NAME=dogfood_completion_proof_helper \
CODEX_RESULT_SUMMARY="Dogfooded codex:record-completion-proof against a temp local Augnes runtime and verified proof-native marker deltas." \
CODEX_FILES_CHANGED="reports/dogfood/2026-05-26-completion-proof-helper-dogfood.md" \
CODEX_RESULT_STATUS=completed \
CODEX_RESULT_KIND=verification \
CODEX_RELATED_PR="https://github.com/Aurna-code/augnes/pull/220" \
CODEX_RELATED_STATE_KEYS="verification.evidence_records,coordination.execution_trace" \
npm run codex:record-completion-proof
```

## 4. Proof-Only Helper Result

The live helper run succeeded:

```text
Augnes Codex completion proof recorded
scope: project:augnes
work_id: AG-004
action_name: dogfood_completion_proof_helper
result_status: completed
result_kind: verification
event_type: verification
work_event_id: work-event:ba305ab0-6625-422d-962c-2ff0a1a5d30b
related_pr: https://github.com/Aurna-code/augnes/pull/220
files_changed count: 1
related_state_keys count: 2
```

The work event persisted with:

```json
{
  "id": "work-event:ba305ab0-6625-422d-962c-2ff0a1a5d30b",
  "event_type": "verification",
  "summary": "Dogfooded codex:record-completion-proof against a temp local Augnes runtime and verified proof-native marker deltas.",
  "result_status": "completed",
  "result_kind": "verification",
  "related_action_id": null,
  "related_pr": "https://github.com/Aurna-code/augnes/pull/220",
  "related_state_keys": "[\"verification.evidence_records\",\"coordination.execution_trace\"]"
}
```

The latest coordination event persisted with:

```json
{
  "event_id": "event:work-event:ba305ab0-6625-422d-962c-2ff0a1a5d30b",
  "event_type": "work_event_recorded",
  "authority_level": "execution_trace",
  "payload_ref": "work-event:ba305ab0-6625-422d-962c-2ff0a1a5d30b",
  "work_id": "AG-004",
  "state_keys": "[\"verification.evidence_records\",\"coordination.execution_trace\"]",
  "result_status": "completed"
}
```

## 5. Marker Delta

Dedicated smoke marker result:

```text
action_record_posts: 0
state_entries_delta: 0
state_transitions_delta: 0
external_state_entries_delta: 0
action_records_delta: 0
work_events_delta: 1
coordination_events_delta: 1
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

Live temp-runtime DB counts after:

```json
{
  "state_entries": 6,
  "state_transitions": 6,
  "external_state_entries": 0,
  "action_records": 0,
  "work_events": 7,
  "coordination_events": 2,
  "verification_evidence_records": 0
}
```

Live delta:

```text
action_record_posts: 0 by dedicated smoke; live DB action_records_delta: 0
state_entries_delta: 0
state_transitions_delta: 0
external_state_entries_delta: 0
action_records_delta: 0
work_events_delta: 1
coordination_events_delta: 1
```

Direct `external.*` query after the live helper run returned no rows:

```json
[]
```

## 6. Where The Proof Is Visible

### Work Brief

`GET /api/work/AG-004/brief?scope=project:augnes` showed the new work event as
the latest `recent_events` entry. The event included `result_status:
"completed"`, `result_kind: "verification"`, the PR link, and related state
keys. `related_proof.prs` also included `https://github.com/Aurna-code/augnes/pull/220`.

### Evidence Pack

`GET /api/evidence-pack?scope=project:augnes&work_id=AG-004` showed the event
under `work_trace.recent_events`. It also surfaced the event in
`verification_trace.checks_passed` with source `work_events`, and included both
`work_event:work-event:ba305ab0-6625-422d-962c-2ff0a1a5d30b` and
`coordination_event:event:work-event:ba305ab0-6625-422d-962c-2ff0a1a5d30b` in
`verification_trace.source_refs`.

### Session Trace

`GET /api/sessions/trace?scope=project:augnes` did not show this proof because
no session binding was performed and the helper does not create or bind
sessions. The seeded runtime still showed only `session:demo-runtime-core` with
`unbound_session` and no related work.

### State Brief

`GET /api/state/brief?scope=project:augnes` showed `recent_actions: []` and no
new committed `external.*` active state entries. That is expected for the
proof-only path and confirms the helper avoided the compatibility
action-record marker path.

## 7. What Was Confusing

- The seeded AG-004 Work Brief still says "Official execution proof remains
  action_records; work_events only link and summarize." That is historically
  accurate for the compatibility path, but it reads awkwardly now that the
  preferred proof-only completion helper intentionally uses `work_events` plus
  coordination trace.
- `codex:record-completion-proof` accepts `CODEX_ACTION_NAME` and
  `CODEX_FILES_CHANGED` for closeout contract compatibility and output
  context, but the current work-event route does not persist those as dedicated
  structured fields. The summary and related PR/state keys carry the review
  value instead.
- Session Trace is not a useful proof review surface unless a separate session
  bind step has already happened.

## 8. Preferred Path Readiness

`codex:record-completion-proof` is ready to be the preferred future completion
proof path for closeout flows that need a bounded work trace and Evidence Pack
visibility without committed state markers.

It is not a full replacement for all current action proof semantics because it
does not create `action_records` and therefore does not populate recent actions
or action-record-specific review surfaces.

## 9. Whether A Proof-Only Action-Record Route Is Needed

Likely yes, if the product still wants "official execution proof" to mean
`action_records` while also avoiding `external.*` markers. A proof-only action
record route or mode would close the gap between the new preferred helper and
the current Work Brief language around official execution proof.

This dogfood did not implement that route.

## 10. Whether An Explicit State-Marker Helper Is Needed

Likely yes, if operators still need deliberate Temporal State Graph/state-marker
visibility for external work outcomes. That helper should be explicitly named
as state mutation, gated, and tested separately.

This dogfood did not implement that helper.

## 11. Recommended Next Implementation Goal

Add a proof-only action-record route or mode that writes `action_records` and
coordination proof without calling `commitStateUpdate`, then update Work Brief
language so "official execution proof" can point to proof-native records
without relying on `external.*`.

## 12. Skipped Checks

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
