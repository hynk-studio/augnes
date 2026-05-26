# Dogfood: Closeout Proof Review Surface Hierarchy

## 1. Scope

Report-only dogfood validation for the ordered Codex closeout proof review
hierarchy from `docs/CODEX_CLOSEOUT_PROOF_REVIEW_SURFACE_HIERARCHY.md`.

Validated order:

1. Work Brief `related_proof.action_records[]`
2. Evidence Pack `verification_trace.proof_visibility`
3. State Brief `recent_action_visibility`
4. Session Trace `work_linked_proof_actions[]` after explicit binding

No runtime behavior, helper behavior, package scripts, schemas, API routes,
Cockpit UI, bridge health behavior, warning text, exit codes, state-marker
helpers, legacy `external.*` records, or compatibility-helper migration
decisions were changed.

## 2. Runtime setup

- Branch: `codex/dogfood-proof-review-surface-hierarchy`
- Base: fresh branch from `origin/main` after `git fetch origin`
- Runtime: local Next dev server at `http://localhost:3100`
- Database: temp SQLite DB at
  `/tmp/augnes-proof-review-surface-hierarchy.KsmlUl/augnes.db`
- Seed flow:
  - `AUGNES_DB_PATH=/tmp/augnes-proof-review-surface-hierarchy.KsmlUl/augnes.db npm run db:reset`
  - `AUGNES_DB_PATH=/tmp/augnes-proof-review-surface-hierarchy.KsmlUl/augnes.db npm run db:migrate`
  - `AUGNES_DB_PATH=/tmp/augnes-proof-review-surface-hierarchy.KsmlUl/augnes.db npm run demo:seed`
- Work ID used: `AG-004`
- Session ID explicitly bound for Session Trace review:
  `session:demo-runtime-core`
- Proof action ID:
  `action:8aea88d4-5b59-4a64-8a7f-46d9ba0808bf`
- Linked work event ID:
  `work-event:8b3c6cd5-20a5-4d36-a204-abf8c6729d0a`

## 3. Commands run

- `git fetch origin`: passed
- `git switch --create codex/dogfood-proof-review-surface-hierarchy origin/main`: passed
- `test -f docs/CODEX_CLOSEOUT_PROOF_REVIEW_SURFACE_HIERARCHY.md`: passed
- Read-first review of requested docs and code paths: completed
- Temp runtime seed commands listed in Runtime setup: passed
- `AUGNES_DB_PATH=/tmp/augnes-proof-review-surface-hierarchy.KsmlUl/augnes.db npm run dev -- --port 3100 --webpack`: passed
- `AUGNES_DB_PATH=/tmp/augnes-proof-review-surface-hierarchy.KsmlUl/augnes.db AUGNES_API_BASE_URL=http://localhost:3100 CODEX_SCOPE=project:augnes CODEX_WORK_ID=AG-004 CODEX_ACTION_NAME=proof_review_surface_hierarchy_dogfood CODEX_RESULT_SUMMARY="Codex dogfooded the closeout proof review surface hierarchy using Work Brief, Evidence Pack, State Brief, and explicit Session Trace binding review." CODEX_FILES_CHANGED="reports/dogfood/2026-05-26-proof-review-surface-hierarchy-dogfood.md" CODEX_RESULT_STATUS=completed CODEX_RESULT_KIND=review CODEX_RELATED_STATE_KEYS="verification.proof_visibility,coordination.session_binding" npm run codex:record-completion-proof`: passed
- `curl -sS 'http://localhost:3100/api/work/AG-004/brief?scope=project:augnes' | jq ...`: passed
- `curl -sS 'http://localhost:3100/api/evidence-pack?scope=project:augnes&work_id=AG-004' | jq ...`: passed
- `curl -sS 'http://localhost:3100/api/state/brief?scope=project:augnes' | jq ...`: passed
- `AUGNES_DB_PATH=/tmp/augnes-proof-review-surface-hierarchy.KsmlUl/augnes.db AUGNES_API_BASE_URL=http://localhost:3100 CODEX_SCOPE=project:augnes CODEX_SESSION_ID=session:demo-runtime-core CODEX_SESSION_SURFACE=codex CODEX_SESSION_ACTOR=codex CODEX_WORK_ID=AG-004 CODEX_SESSION_SUMMARY="Dogfood closeout proof review surface hierarchy with explicit Session Trace binding." CODEX_EVIDENCE_PACK_REF="/api/evidence-pack?scope=project%3Aaugnes&work_id=AG-004" npm run codex:bind-session`: passed
- `curl -sS 'http://localhost:3100/api/sessions/session%3Ademo-runtime-core/trace?scope=project:augnes' | jq ...`: passed
- `npm run smoke:codex-record-completion-proof-helper`: passed
- `npm run smoke:codex-helper-taxonomy`: passed
- `npm run smoke:codex-scope-env-consistency`: passed
- `npm run smoke:codex-session-adapter-v2`: passed
- `npm run smoke:codex-closeout-docs`: passed
- `npm run smoke:authority-invariants`: passed
- `npm run typecheck`: passed
- `npm --prefix apps/augnes_apps run typecheck`: passed

## 4. Marker guardrail result

Temp-runtime proof-only closeout snapshot:

| Metric | Result |
| --- | --- |
| `state_entries_delta` | `0` |
| `state_transitions_delta` | `0` |
| `external_state_entries_delta` | `0` |
| `proof_action_record_state_key` | `null` |
| `legacy_action_record_posts` | `0` |

Observed temp-runtime before/after counts:

- Before: `state_entries=6`, `state_transitions=6`,
  `external_state_entries=0`, `action_records=0`, `work_events=6`,
  `coordination_events=1`
- After proof-only closeout: `state_entries=6`, `state_transitions=6`,
  `external_state_entries=0`, `action_records=1`, `work_events=7`,
  `coordination_events=3`

The helper returned `state_key: null` for
`action:8aea88d4-5b59-4a64-8a7f-46d9ba0808bf`. The required helper smoke also
reported `legacy_action_record_posts: 0`, `state_entries_delta: 0`,
`state_transitions_delta: 0`, `external_state_entries_delta: 0`, and
`proof_action_record_state_key: null`.

## 5. Work Brief findings

Work Brief was the first review surface:

```text
GET /api/work/AG-004/brief?scope=project:augnes
related_proof.action_records[]
```

It was enough to confirm work-item proof. The brief showed:

- `related_proof.action_ids[]` included
  `action:8aea88d4-5b59-4a64-8a7f-46d9ba0808bf`
- `related_proof.action_records[]` included the proof action with
  `state_key: null`
- `proof_marker_type: proof_only`
- `linked_work_event_ids[]` included
  `work-event:8b3c6cd5-20a5-4d36-a204-abf8c6729d0a`
- `recent_events[]` showed the same work event with
  `related_action_id` pointing back to the proof action

This was the fastest and least noisy way to answer whether `AG-004` had
closeout proof.

## 6. Evidence Pack findings

Evidence Pack was the second review surface:

```text
GET /api/evidence-pack?scope=project:augnes&work_id=AG-004
verification_trace.proof_visibility
```

It gave the deeper verification context needed after Work Brief. It showed:

- `proof_only_action_ids[]` included the proof action ID
- `committed_state_marker_action_ids[]` was empty
- `linked_work_event_ids[]` included the linked work event ID
- `checks_passed[]` included the proof action with `state_key: null` and
  `proof_marker_type: proof_only`
- `source_refs[]` included both `action_record:...` and `work_event:...`
- `gaps[]` preserved unrelated missing evidence/publication/readiness context
  instead of hiding it

Evidence Pack was better than Work Brief for source refs, gaps, and bundle
context. It was not necessary for the first proof check, but it was the right
second surface.

## 7. State Brief findings

State Brief was the third review surface:

```text
GET /api/state/brief?scope=project:augnes
recent_action_visibility
```

It helped distinguish proof-only recent action from active committed state:

- `recent_action_visibility.proof_only_action_ids[]` included the proof action
- `recent_action_visibility.committed_state_marker_action_ids[]` was empty
- `recent_actions[]` preserved `state_key: null`
- `active_state[]` contained no `external.*` entry from this closeout

This surface was useful for awareness and proof/state boundary confirmation,
but it was not the best first proof surface because it is scope-level and
recent-action-limited.

## 8. Session Trace findings

Session Trace was used because explicit session/work binding semantics were
relevant to this dogfood. The existing seeded session
`session:demo-runtime-core` was explicitly bound to `AG-004` using
`codex:bind-session`.

After binding:

```text
GET /api/sessions/session%3Ademo-runtime-core/trace?scope=project:augnes
work_linked_proof_actions[]
```

Findings:

- `work_linked_proof_actions[]` included the proof action
- `proof_visibility.work_linked_proof_action_ids[]` included the proof action
- `work_linked_proof_actions[].state_key` was `null`
- `work_linked_proof_actions[].proof_marker_type` was `proof_only`
- `work_linked_proof_actions[].source_session_id` remained `null`
- `work_linked_proof_actions[].linked_work_event_ids[]` included the linked
  work event
- `evidence_counts.action_records_by_session` remained `0`
- `action_records[]` remained empty

This confirms `action_records_by_session` still means session-owned actions
only. Work-linked closeout proof appears through
`work_linked_proof_actions[]` after explicit binding and does not become
session-owned action proof.

## 9. Whether the hierarchy order was ergonomic

Yes. The order was ergonomic:

1. Work Brief answered the direct work proof question.
2. Evidence Pack added source refs, proof visibility summary, and gaps.
3. State Brief confirmed the proof/state boundary without making state the
   primary proof surface.
4. Session Trace was useful only after binding, and using it last prevented
   confusing `action_records_by_session: 0` with missing proof.

## 10. Whether Work Brief is sufficient as the first proof check

Yes. For a known `CODEX_WORK_ID`, Work Brief was sufficient as the first proof
check because it showed the proof action, proof-only marker type, `state_key:
null`, and linked work event in one work-scoped view.

## 11. Whether Evidence Pack is sufficient as the deeper review surface

Yes. Evidence Pack was sufficient as the deeper review surface because
`verification_trace.proof_visibility` summarized proof-only versus legacy
marker action IDs while `checks_passed[]`, `source_refs[]`, and `gaps[]`
provided review context.

## 12. Whether State Brief should stay awareness-only

Yes. State Brief should stay awareness-only for this proof path. It is useful
for confirming recent proof-only rows and absence of active `external.*`
state, but it is not work-scoped enough to be the primary proof check.

## 13. Whether Session Trace should stay explicit-binding-only

Yes. Session Trace should stay explicit-binding-only. The dogfood confirmed
that proof-only completion does not create or bind sessions, and explicit bind
made the proof visible through `work_linked_proof_actions[]` without changing
`source_session_id` or `action_records_by_session`.

## 14. Any confusing field names or wording

No blocking field-name issues were found.

Minor observation: `action_records_by_session` is precise, but it can look
surprising beside visible work-linked proof until the reviewer reads
`work_linked_proof_actions[]` and the `source_session_id_note`. Keeping
Session Trace fourth in the hierarchy reduces that confusion.

`latest_work_event_related_action_id` remained understandable as a shortcut,
not the primary proof summary, because `work_linked_proof_actions[]` was
available in the same trace.

## 15. Whether compatibility-helper migration should remain deferred

Yes. This dogfood found the proof-only path discoverable without changing
`codex:record-completion`, `codex:record-result`, `/api/actions/record`,
legacy warnings, or `external.*` marker handling. Compatibility-helper
migration should remain deferred until a separate user/PM decision resolves
the migration shape.

## 16. Recommended next step

Keep the hierarchy as documented. The next useful step is another report-only
dogfood during a closeout with a real PR URL populated in `CODEX_RELATED_PR`,
to validate whether the Work Brief and Evidence Pack PR/source-ref path is as
ergonomic as the work-only path.

No implementation change is recommended from this run.

## 17. Skipped checks with concrete reasons

- Session Trace skipped reason: not skipped. It was used because explicit
  session/work binding review was relevant to this dogfood.
- Browser/Cockpit UI screenshot checks: skipped because this was a report-only
  runtime/API closeout proof hierarchy validation and the task explicitly
  prohibited Cockpit UI changes and generated artifact commits.
- Compatibility-helper migration checks: skipped because compatibility and
  migration decisions must remain unresolved for this task.
- Legacy helper execution: skipped because the goal was proof-only closeout
  validation, and intentionally running legacy helpers would create unrelated
  compatibility proof/state-marker material.
