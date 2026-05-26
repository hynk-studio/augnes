# Dogfood Report: Session Trace Proof Visibility Vocabulary

Date: 2026-05-26
Branch: `codex/dogfood-session-trace-proof-visibility`

## 1. Scope

Dogfood the Session Trace proof visibility vocabulary added after PR #227:

- `proof_visibility`
- `work_linked_proof_actions[]`
- unchanged `action_records_by_session` semantics
- proof-only closeout actions with `source_session_id: null`

This is a report-only dogfood artifact. No runtime behavior, schema, API route,
Cockpit UI, bridge health behavior, explicit state-marker helper,
compatibility helper behavior, automatic session binding, automatic session
creation, or legacy `external.*` migration was changed.

## 2. Runtime Setup

Temp database:

```text
/tmp/augnes-session-trace-proof-visibility.db
```

Runtime setup commands:

```bash
rm -f /tmp/augnes-session-trace-proof-visibility.db /tmp/augnes-session-trace-proof-visibility.db-shm /tmp/augnes-session-trace-proof-visibility.db-wal /tmp/augnes-session-trace-proof-visibility.db-journal
AUGNES_DB_PATH=/tmp/augnes-session-trace-proof-visibility.db npm run db:reset
AUGNES_DB_PATH=/tmp/augnes-session-trace-proof-visibility.db npm run db:migrate
AUGNES_DB_PATH=/tmp/augnes-session-trace-proof-visibility.db npm run demo:seed
AUGNES_DB_PATH=/tmp/augnes-session-trace-proof-visibility.db npm run dev -- --hostname 127.0.0.1 --port 3035
```

Runtime URL:

```text
http://127.0.0.1:3035
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
AUGNES_API_BASE_URL=http://127.0.0.1:3035 CODEX_SCOPE=project:augnes CODEX_WORK_ID=AG-004 CODEX_ACTION_NAME=dogfood_session_trace_proof_visibility CODEX_RESULT_SUMMARY="Dogfooded Session Trace proof visibility vocabulary after PR #227 against a temp local Augnes runtime." CODEX_FILES_CHANGED="reports/dogfood/2026-05-26-session-trace-proof-visibility-dogfood.md" CODEX_RESULT_STATUS=completed CODEX_RESULT_KIND=verification CODEX_RELATED_PR="https://github.com/Aurna-code/augnes/pull/227" CODEX_RELATED_STATE_KEYS="verification.evidence_records,coordination.execution_trace" npm run codex:record-completion-proof
curl -sS 'http://127.0.0.1:3035/api/sessions/trace?scope=project:augnes'
AUGNES_API_BASE_URL=http://127.0.0.1:3035 CODEX_SCOPE=project:augnes CODEX_SESSION_ID=session:demo-runtime-core CODEX_SESSION_SURFACE=codex CODEX_WORK_ID=AG-004 CODEX_RELATED_PR="https://github.com/Aurna-code/augnes/pull/227" CODEX_SESSION_SUMMARY="Dogfood Session Trace proof visibility vocabulary after PR #227." CODEX_EVIDENCE_PACK_REF="/api/evidence-pack?scope=project%3Aaugnes&work_id=AG-004" npm run codex:bind-session
curl -sS 'http://127.0.0.1:3035/api/sessions/session%3Ademo-runtime-core/trace?scope=project:augnes'
curl -sS 'http://127.0.0.1:3035/api/work/AG-004/brief?scope=project:augnes'
curl -sS 'http://127.0.0.1:3035/api/evidence-pack?scope=project:augnes&work_id=AG-004'
curl -sS 'http://127.0.0.1:3035/api/state/brief?scope=project:augnes'
```

Proof-only completion result:

```text
action_record_id: action:7110a56d-d9ab-46eb-aaaa-38d4547c8bc1
work_event_id: work-event:e660597c-a454-42d1-b2a2-abdea623458d
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
  "verification_evidence_records": 0,
  "sessions": 1
}
```

Counts after proof-only completion and explicit session binding:

```json
{
  "state_entries": 6,
  "state_transitions": 6,
  "external_state_entries": 0,
  "action_records": 1,
  "work_events": 7,
  "coordination_events": 3,
  "verification_evidence_records": 0,
  "sessions": 1
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
  "id": "action:7110a56d-d9ab-46eb-aaaa-38d4547c8bc1",
  "state_key": null,
  "title": "dogfood_session_trace_proof_visibility",
  "status": "completed",
  "source_session_id": null
}
```

Direct `external.*` state query returned no rows.

## 5. Session Trace Before Binding

Demo seed created one existing session, `session:demo-runtime-core`. Recording
proof-only closeout did not create another session and did not bind the
existing one.

Before explicit binding, `GET /api/sessions/trace?scope=project:augnes`
showed:

```json
{
  "session_id": "session:demo-runtime-core",
  "related_work_id": null,
  "related_pr": null,
  "evidence_counts": {
    "action_records_by_session": 0
  },
  "proof_visibility": {
    "session_owned_action_ids": [],
    "work_linked_proof_action_ids": [],
    "latest_work_event_related_action_id": null
  },
  "latest_work_event": null,
  "action_records": [],
  "work_linked_proof_actions": [],
  "gaps": [
    "unbound_session",
    "missing_related_work_id",
    "no_verification_evidence_records_linked"
  ]
}
```

Assessment: clear. The proof action was not falsely counted as
session-owned, and the trace stayed explicit that the session was unbound.

## 6. Session Trace After Explicit Binding

The existing session was explicitly bound with `npm run codex:bind-session`.
The bind helper printed:

```text
Session Trace note: action_records_by_session counts only action_records whose source_session_id matches this session.
Session Trace note: proof-only completion actions keep source_session_id null and appear through bound work_events.related_action_id.
```

After binding, `GET /api/sessions/session%3Ademo-runtime-core/trace` showed:

```json
{
  "session_id": "session:demo-runtime-core",
  "related_work_id": "AG-004",
  "related_pr": "https://github.com/Aurna-code/augnes/pull/227",
  "evidence_counts": {
    "action_records_by_session": 0
  },
  "work_event_counts": {
    "total": 2,
    "with_related_action_id": 1,
    "with_related_pr": 1
  },
  "latest_work_event": {
    "id": "work-event:e660597c-a454-42d1-b2a2-abdea623458d",
    "related_action_id": "action:7110a56d-d9ab-46eb-aaaa-38d4547c8bc1",
    "result_status": "completed",
    "result_kind": "verification"
  },
  "action_records": []
}
```

Assessment: clear. Binding connected the session to the work trace and made
the proof discoverable without changing the action record into a
session-owned action.

## 7. `work_linked_proof_actions[]` Findings

After binding, Session Trace showed:

```json
[
  {
    "id": "action:7110a56d-d9ab-46eb-aaaa-38d4547c8bc1",
    "title": "dogfood_session_trace_proof_visibility",
    "state_key": null,
    "status": "completed",
    "source_session_id": null,
    "proof_marker_type": "proof_only",
    "linked_work_event_ids": [
      "work-event:e660597c-a454-42d1-b2a2-abdea623458d"
    ]
  }
]
```

Assessment: useful. The field name accurately communicates that these action
records are proof discovered through the bound work trace, not through direct
session ownership. The embedded `source_session_id: null` removes the PR #226
caveat that reviewers had to infer from `latest_work_event.related_action_id`
alone.

## 8. `proof_visibility` Findings

After binding, Session Trace showed:

```json
{
  "session_owned_action_ids": [],
  "work_linked_proof_action_ids": [
    "action:7110a56d-d9ab-46eb-aaaa-38d4547c8bc1"
  ],
  "latest_work_event_related_action_id": "action:7110a56d-d9ab-46eb-aaaa-38d4547c8bc1",
  "source_session_id_note": "action_records_by_session counts only action_records whose source_session_id matches this session.",
  "binding_note": "Proof-only closeout remains visible through bound work_events.related_action_id after explicit session binding; completion proof recording does not bind sessions."
}
```

Assessment: clear enough for reviewers. The split between
`session_owned_action_ids` and `work_linked_proof_action_ids` is the most
important vocabulary improvement because it makes `action_records_by_session:
0` unsurprising.

## 9. `action_records_by_session` Findings

`action_records_by_session` remained `0` before and after explicit binding.
This is correct because the proof action has `source_session_id: null`.

Assessment: clear after PR #227. The count retains its original meaning and no
longer appears to contradict visible closeout proof because Session Trace now
shows the separate work-linked proof lane.

## 10. `source_session_id` Clarity Assessment

The vocabulary is understandable:

- `source_session_id: null` on `work_linked_proof_actions[]` explains why the
  proof action is not counted in `action_records_by_session`.
- `source_session_id_note` explains the count in plain language.
- `binding_note` explains why explicit binding is required and why binding
  does not rewrite the proof action.

No wording change is required from this dogfood run.

## 11. Work Brief / Evidence Pack / State Brief Consistency Check

Work Brief stayed consistent with Session Trace:

```json
{
  "related_proof": {
    "action_ids": [
      "action:7110a56d-d9ab-46eb-aaaa-38d4547c8bc1"
    ],
    "action_records": [
      {
        "state_key": null,
        "proof_marker_type": "proof_only",
        "linked_work_event_ids": [
          "work-event:e660597c-a454-42d1-b2a2-abdea623458d"
        ]
      }
    ]
  }
}
```

Evidence Pack stayed consistent:

```json
{
  "proof_visibility": {
    "proof_only_action_ids": [
      "action:7110a56d-d9ab-46eb-aaaa-38d4547c8bc1"
    ],
    "committed_state_marker_action_ids": [],
    "linked_work_event_ids": [
      "work-event:e660597c-a454-42d1-b2a2-abdea623458d"
    ]
  }
}
```

State Brief stayed consistent:

```json
{
  "active_external_keys": [],
  "recent_action_visibility": {
    "proof_only_action_ids": [
      "action:7110a56d-d9ab-46eb-aaaa-38d4547c8bc1"
    ],
    "committed_state_marker_action_ids": []
  }
}
```

Assessment: clear. The four review surfaces now use compatible proof-only
vocabulary: proof action, linked work event, no active committed state marker,
and explicit session binding.

## 12. Whether The Vocabulary Is Clear Enough For Reviewers

Yes. The Session Trace vocabulary is clear enough for reviewers to distinguish:

- session-owned action records
- work-linked proof action records
- latest work events with `related_action_id`
- explicit session binding requirements

The most useful fields are `work_linked_proof_actions[]`,
`proof_visibility.work_linked_proof_action_ids`, and
`proof_visibility.source_session_id_note`.

## 13. Any Confusing Field Names Or Wording

No blocking confusion found.

Minor observation: `latest_work_event_related_action_id` is useful as a quick
pointer, but it is less self-explanatory than `work_linked_proof_actions[]`.
Reviewers should use it as a latest-event shortcut, not as the primary proof
summary.

## 14. Whether Compatibility-Helper Migration Should Still Be Deferred

Yes. Compatibility-helper migration should still be deferred.

This dogfood validates review clarity for the proof-only path, but it does not
resolve the open product decisions for:

- whether `codex:record-completion` should become proof-only
- how long `codex:record-result` remains a legacy compatibility helper
- whether an explicit state-marker helper is needed
- how to treat historical `external.*` records
- which proof review surface should be primary

## 15. Recommended Next Step

Keep `codex:record-completion-proof` as the preferred closeout proof path and
ask ChatGPT review to validate whether Session Trace should use
`work_linked_proof_actions[]` as the canonical phrase for proof visible only
after explicit session binding.

Do not migrate compatibility helpers yet.

## 16. Skipped Checks With Concrete Reasons

No required checks were skipped.

Screenshots, generated artifacts, DB files, secrets, tokens, and tunnel URLs
were not created or committed. The temp DB was local to `/tmp` and is not part
of the branch.
