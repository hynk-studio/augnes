# Dogfood Report: Proof-Only Closeout Visibility Vocabulary

Date: 2026-05-26
Branch: `codex/dogfood-proof-visibility-vocabulary`

## 1. Scope

Dogfood the proof-only Codex closeout review vocabulary added after PR #225:

- Work Brief `related_proof.action_records[]`
- Evidence Pack `verification_trace.proof_visibility`
- State Brief `recent_action_visibility`
- Session Trace explicit-binding-only behavior

This is a report-only dogfood artifact. No runtime behavior, schema, API route,
Cockpit UI, bridge health behavior, explicit state-marker helper,
compatibility helper behavior, or legacy `external.*` migration was changed.

## 2. Runtime Setup

Temp database:

```text
/tmp/augnes-proof-visibility-vocabulary.db
```

Runtime setup commands:

```bash
rm -f /tmp/augnes-proof-visibility-vocabulary.db /tmp/augnes-proof-visibility-vocabulary.db-shm /tmp/augnes-proof-visibility-vocabulary.db-wal /tmp/augnes-proof-visibility-vocabulary.db-journal
AUGNES_DB_PATH=/tmp/augnes-proof-visibility-vocabulary.db npm run db:reset
AUGNES_DB_PATH=/tmp/augnes-proof-visibility-vocabulary.db npm run db:migrate
AUGNES_DB_PATH=/tmp/augnes-proof-visibility-vocabulary.db npm run demo:seed
AUGNES_DB_PATH=/tmp/augnes-proof-visibility-vocabulary.db npm run dev -- --hostname 127.0.0.1 --port 3034
```

Runtime URL:

```text
http://127.0.0.1:3034
```

The runtime started successfully. Next.js printed the existing workspace-root
warning because multiple lockfiles exist outside this repo path. No package or
lockfile changes were made.

## 3. Commands Run

Smoke and typecheck commands:

```bash
npm run smoke:codex-record-completion-proof-helper
npm run smoke:codex-helper-taxonomy
npm run smoke:codex-scope-env-consistency
npm run smoke:codex-session-adapter-v2
npm run smoke:codex-closeout-docs
npm run smoke:authority-invariants
npm run typecheck
npm --prefix apps/augnes_apps run typecheck
```

All commands passed.

Runtime dogfood commands:

```bash
AUGNES_API_BASE_URL=http://127.0.0.1:3034 CODEX_SCOPE=project:augnes CODEX_WORK_ID=AG-004 CODEX_ACTION_NAME=dogfood_proof_visibility_vocabulary CODEX_RESULT_SUMMARY="Dogfooded proof-only closeout visibility vocabulary after PR #225 against a temp local Augnes runtime." CODEX_FILES_CHANGED="reports/dogfood/2026-05-26-proof-visibility-vocabulary-dogfood.md" CODEX_RESULT_STATUS=completed CODEX_RESULT_KIND=verification CODEX_RELATED_PR="https://github.com/Aurna-code/augnes/pull/225" CODEX_RELATED_STATE_KEYS="verification.evidence_records,coordination.execution_trace" npm run codex:record-completion-proof
curl -sS 'http://127.0.0.1:3034/api/work/AG-004/brief?scope=project:augnes'
curl -sS 'http://127.0.0.1:3034/api/evidence-pack?scope=project:augnes&work_id=AG-004'
curl -sS 'http://127.0.0.1:3034/api/state/brief?scope=project:augnes'
curl -sS 'http://127.0.0.1:3034/api/sessions/trace?scope=project:augnes'
AUGNES_API_BASE_URL=http://127.0.0.1:3034 CODEX_SCOPE=project:augnes CODEX_SESSION_ID=session:demo-runtime-core CODEX_SESSION_SURFACE=codex CODEX_WORK_ID=AG-004 CODEX_RELATED_PR="https://github.com/Aurna-code/augnes/pull/225" CODEX_SESSION_SUMMARY="Dogfood proof visibility vocabulary after PR #225." CODEX_EVIDENCE_PACK_REF="/api/evidence-pack?scope=project%3Aaugnes&work_id=AG-004" npm run codex:bind-session
curl -sS 'http://127.0.0.1:3034/api/sessions/session%3Ademo-runtime-core/trace?scope=project:augnes'
```

Proof-only completion result:

```text
action_record_id: action:f0ff65e9-e082-4644-8966-a62dd3c1a936
work_event_id: work-event:534a5a82-820e-434a-bec6-32807a701fed
session_trace_url: (requires CODEX_SESSION_ID and explicit session binding)
session_trace_note: this helper does not create or bind sessions; run codex:bind-session separately for Session Trace visibility.
```

## 4. Marker Guardrail Result

Counts before proof-only completion:

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

Counts after proof-only completion:

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

Required marker guardrail:

```text
state_entries_delta: 0
state_transitions_delta: 0
external_state_entries_delta: 0
proof_action_record_state_key: null
legacy_action_record_posts: 0
```

The latest action record was:

```json
{
  "id": "action:f0ff65e9-e082-4644-8966-a62dd3c1a936",
  "state_key": null,
  "title": "dogfood_proof_visibility_vocabulary",
  "status": "completed",
  "source_session_id": null
}
```

Direct `external.*` state query returned no rows.

## 5. Work Brief Visibility Findings

`GET /api/work/AG-004/brief?scope=project:augnes` showed the latest work event
with the linked action ID:

```json
{
  "id": "work-event:534a5a82-820e-434a-bec6-32807a701fed",
  "event_type": "verification",
  "result_status": "completed",
  "result_kind": "verification",
  "related_action_id": "action:f0ff65e9-e082-4644-8966-a62dd3c1a936",
  "related_pr": "https://github.com/Aurna-code/augnes/pull/225"
}
```

The new `related_proof.action_records[]` vocabulary was visible and useful:

```json
{
  "id": "action:f0ff65e9-e082-4644-8966-a62dd3c1a936",
  "title": "dogfood_proof_visibility_vocabulary",
  "status": "completed",
  "state_key": null,
  "proof_marker_type": "proof_only",
  "linked_work_event_ids": [
    "work-event:534a5a82-820e-434a-bec6-32807a701fed"
  ]
}
```

Assessment: clear. The combination of `state_key: null`,
`proof_marker_type: proof_only`, and `linked_work_event_ids` makes it easy to
understand that the work event is trace context and the action record is the
proof object, without implying committed state mutation.

## 6. Evidence Pack Visibility Findings

`GET /api/evidence-pack?scope=project:augnes&work_id=AG-004` showed:

```json
{
  "proof_only_action_ids": [
    "action:f0ff65e9-e082-4644-8966-a62dd3c1a936"
  ],
  "committed_state_marker_action_ids": [],
  "linked_work_event_ids": [
    "work-event:534a5a82-820e-434a-bec6-32807a701fed"
  ],
  "note": "proof_only action records have state_key: null and do not represent active committed state; committed_state_marker action records are legacy compatibility markers."
}
```

`verification_trace.checks_passed` included both sides of the proof:

```json
[
  {
    "source": "work_events",
    "id": "work-event:534a5a82-820e-434a-bec6-32807a701fed",
    "related_action_id": "action:f0ff65e9-e082-4644-8966-a62dd3c1a936",
    "result_status": "completed",
    "result_kind": "verification"
  },
  {
    "source": "action_records",
    "id": "action:f0ff65e9-e082-4644-8966-a62dd3c1a936",
    "state_key": null,
    "proof_marker_type": "proof_only",
    "status": "completed",
    "title": "dogfood_proof_visibility_vocabulary"
  }
]
```

`verification_trace.source_refs` included:

```text
work_event:work-event:534a5a82-820e-434a-bec6-32807a701fed
action_record:action:f0ff65e9-e082-4644-8966-a62dd3c1a936
coordination_event:event:work-event:534a5a82-820e-434a-bec6-32807a701fed
coordination_event:event:action:f0ff65e9-e082-4644-8966-a62dd3c1a936
```

Assessment: clear enough for reviewers. `proof_visibility` is a good summary
field because it prevents reviewers from having to infer proof/state semantics
from lower-level `checks_passed` entries.

## 7. State Brief Visibility Findings

`GET /api/state/brief?scope=project:augnes` showed active committed state
remained unchanged:

```json
{
  "active_count": 3,
  "active_external_keys": []
}
```

The latest `recent_actions` row was the proof-only action:

```json
{
  "id": "action:f0ff65e9-e082-4644-8966-a62dd3c1a936",
  "state_key": null,
  "title": "dogfood_proof_visibility_vocabulary",
  "status": "completed"
}
```

The new `recent_action_visibility` field made the boundary explicit:

```json
{
  "proof_only_action_ids": [
    "action:f0ff65e9-e082-4644-8966-a62dd3c1a936"
  ],
  "committed_state_marker_action_ids": [],
  "note": "recent_actions is proof/continuity context. Rows with state_key: null are proof-only and do not add active committed state."
}
```

Assessment: clear. `recent_action_visibility` is useful because it explains why
the proof appears in State Brief while active state stays unchanged.

## 8. Session Trace Binding Findings

Before explicit binding, the seeded runtime had `session:demo-runtime-core`
with no related work or PR. Session Trace did not show the proof-only action or
work event as session-scoped proof:

```json
{
  "gaps": [
    "one_or_more_sessions_unbound"
  ],
  "sessions": [
    {
      "session_id": "session:demo-runtime-core",
      "related_work_id": null,
      "related_pr": null,
      "action_records_by_session": 0,
      "with_related_action_id": 0
    }
  ]
}
```

After an explicit `npm run codex:bind-session` against the existing seeded
session, Session Trace showed the work linkage:

```json
{
  "session_id": "session:demo-runtime-core",
  "surface": "codex",
  "related_work_id": "AG-004",
  "related_pr": "https://github.com/Aurna-code/augnes/pull/225",
  "work_event_counts": {
    "total": 2,
    "with_related_action_id": 1,
    "with_related_pr": 1
  },
  "latest_work_event": {
    "id": "work-event:534a5a82-820e-434a-bec6-32807a701fed",
    "related_action_id": "action:f0ff65e9-e082-4644-8966-a62dd3c1a936"
  },
  "action_records": []
}
```

Assessment: explicit-binding-only behavior is correct and understandable, but
there is one reviewer nuance. After binding, Session Trace shows the linked
work event and its `related_action_id`, while `action_records_by_session`
remains `0` because the proof action has `source_session_id: null`. That is
consistent with current behavior, but reviewers should know that Session Trace
currently sees this proof through the bound work event, not through
session-owned action records.

## 9. Whether The Vocabulary Is Clear Enough For Reviewers

Yes, with one caveat.

The vocabulary is clear enough for the next review cycle:

- `related_proof.action_records[]` is the most direct place to inspect the
  Work Brief proof link.
- `proof_marker_type: proof_only` is explicit and easy to scan.
- `verification_trace.proof_visibility` is a good Evidence Pack summary.
- `recent_action_visibility` explains why State Brief can show proof while
  active state remains unchanged.
- The helper output clearly says Session Trace requires explicit binding.

Caveat: Session Trace uses two different ideas that can look inconsistent at
first glance: work-linked proof is visible through `latest_work_event`, while
`action_records_by_session` remains empty unless an action record has
`source_session_id`. This does not require a behavior change in this dogfood
PR, but it should be called out in review docs or a future Session Trace
clarity pass.

## 10. Confusing Field Names Or Wording

No blocker-level naming issue found.

Minor clarity notes:

- `committed_state_marker_action_ids` is accurate but long. It is acceptable
  because it distinguishes legacy marker actions from proof-only actions.
- `recent_action_visibility` is clear in State Brief, but reviewers still need
  to understand that `recent_actions` is proof/continuity context, not active
  state.
- Session Trace `action_records_by_session` can be misread as "all action
  records linked to this work/session." Today it means action records whose
  `source_session_id` matches the session, which is narrower.

## 11. Whether `codex:record-completion-proof` Is Ready To Remain Preferred

Yes. The helper remains ready to be the preferred Codex closeout proof path.

This dogfood confirmed that it:

- creates proof-native action and work records
- links the work event to the proof action ID
- exposes proof through Work Brief, Evidence Pack, and State Brief
- avoids committed state mutation and `external.*` markers
- keeps Session Trace binding explicit

## 12. Whether Compatibility-Helper Migration Should Still Be Deferred

Yes. Compatibility-helper migration should still be deferred.

`codex:record-completion` and `codex:record-result` were not changed or run in
this dogfood. The proof-only vocabulary is usable enough to continue moving
new closeout flows to `codex:record-completion-proof`, but it does not resolve
whether legacy helpers should become aliases, remain indefinitely, warn, or
move state-marker behavior behind a separate helper.

## 13. Recommended Next Step

Review PR #225 and this dogfood report from ChatGPT read-only tools. If the
vocabulary is accepted, the next narrow goal should be a Session Trace clarity
pass that explains the distinction between work-linked proof and
`source_session_id` action records, without auto-binding sessions and without
changing compatibility helper behavior.

Do not start compatibility-helper migration until user/PM judgment resolves:

- `codex:record-completion` migration
- `codex:record-result` lifetime
- explicit state-marker helper need
- legacy `external.*` treatment
- primary proof review surface

## 14. Skipped Checks

- Browser/Cockpit visual inspection: skipped because this dogfood did not
  change Cockpit UI and screenshots/generated artifacts are out of scope.
- ChatGPT Developer Mode inspection: skipped because no Developer Mode
  tunnel/session was available in this local WSL runtime.
- Live `codex:record-completion` compatibility run: skipped to avoid creating
  a legacy `external.*` marker in the dogfood temp runtime.
- Live `codex:record-result` compatibility run: skipped for the same reason.
- Legacy `external.*` migration check: skipped because migration is explicitly
  out of scope and remains unresolved.
