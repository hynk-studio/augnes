# Codex Closeout Proof Review Surface Hierarchy

## Status

- decision memo only
- docs-only
- no runtime behavior change
- no helper behavior change
- no package script change
- no schema change
- no API route change
- no Cockpit UI change
- no bridge health behavior change
- no new warning behavior
- no explicit state-marker helper
- no legacy `external.*` migration
- no compatibility helper conversion

## 1. Purpose

This memo defines the recommended review-surface hierarchy for Codex closeout
proof. It answers where operators and reviewers should look first, second, and
last after `codex:record-completion-proof` records proof-only closeout.

The goal is to keep proof discoverable without making active committed state,
legacy `external.*` markers, or session-owned action records the default proof
review anchor.

## 2. Current Proof-Only Closeout Path

The preferred/default Codex closeout proof helper is:

```bash
npm run codex:record-completion-proof
```

The proof-only path is:

1. Preflight the work trace anchor with `GET /api/work/{work_id}`.
2. Record proof through `POST /api/actions/record-proof`.
3. Create a proof-only `action_records` row with `state_key: null`.
4. Record a linked `work_events` entry through
   `POST /api/work/{work_id}/events`.
5. Link the work event back to the proof action through
   `work_events.related_action_id`.
6. Append coordination trace.

This path does not call the legacy `/api/actions/record` route and does not
create committed `external.*` marker state.

## 3. Review-Surface Hierarchy Recommendation

Recommended order for Codex closeout proof review:

1. Work Brief `related_proof.action_records[]`
2. Evidence Pack `verification_trace.proof_visibility`
3. State Brief `recent_action_visibility`
4. Session Trace `work_linked_proof_actions[]`

Use Work Brief first when reviewing a specific `work_id`. Use Evidence Pack
when the reviewer needs the deeper verification bundle. Use State Brief for
recent activity awareness and proof/state boundary checks. Use Session Trace
only when reviewing an explicitly bound session and its work-linked proof.

Do not make active committed state the primary proof surface. Do not use
legacy `external.*` markers as default closeout proof anchors.

## 4. Recommended Primary Surface

The primary operator-facing proof check for a specific Codex closeout should
be:

```text
GET /api/work/{work_id}/brief?scope=project:augnes
related_proof.action_records[]
```

Work Brief is first because the closeout helper is work-linked. The operator
usually has a `CODEX_WORK_ID`, and Work Brief shows the work item, recent work
events, linked proof action records, related PR refs, and related state keys
in one work-scoped view.

For proof-only closeout, the key fields are:

- `recent_events[].related_action_id`
- `related_proof.action_ids[]`
- `related_proof.action_records[].id`
- `related_proof.action_records[].state_key`
- `related_proof.action_records[].proof_marker_type`
- `related_proof.action_records[].linked_work_event_ids[]`

The expected proof-only interpretation is:

```text
state_key: null
proof_marker_type: proof_only
linked_work_event_ids includes the closeout work event
```

## 5. Recommended Secondary Surfaces

Use these secondary surfaces after the Work Brief check:

- Evidence Pack `verification_trace.proof_visibility`: deeper verification and
  source-ref review for the selected work, PR, publication, delivery, or target
  ref.
- State Brief `recent_action_visibility`: recent proof/state boundary awareness
  across the scope.
- Session Trace `work_linked_proof_actions[]`: explicit session/work binding
  review after `codex:bind-session`.

These surfaces are complementary, not interchangeable. Each answers a
different review question.

## 6. When To Use Each Surface

### Work Brief `related_proof.action_records[]`

Use Work Brief when the reviewer asks:

- Did this `work_id` get closeout proof?
- Which work event linked to the proof action?
- Is the action record proof-only or a legacy committed marker?
- Which PR and related state keys were recorded with this work trace?

Work Brief is the first check for normal Codex closeout because it is scoped to
the work item and shows the proof action in direct relation to the work event.

### Evidence Pack `verification_trace.proof_visibility`

Use Evidence Pack when the reviewer asks:

- What proof is visible in the selected review bundle?
- Which proof-only action IDs were included?
- Which linked work event IDs were included?
- Are any legacy committed marker action IDs also present?
- What source refs, command records, skipped checks, or gaps support this
  review?

Evidence Pack is the deeper review surface. It is better than Work Brief for
review packets, PR summaries, and cross-record verification because it
collects proof, evidence rows, source refs, authority boundaries, and gaps.

### State Brief `recent_action_visibility`

Use State Brief when the reviewer asks:

- Did recent action activity include proof-only rows?
- Did proof-only closeout avoid adding active committed state?
- Are recent actions separated from active committed state?
- Are recent legacy marker actions present and labeled separately?

State Brief is useful for awareness and boundary checks. It should not be the
primary proof surface for a specific closeout because it is scope-oriented,
recent-action-limited, and not centered on a single `work_id`.

### Session Trace `work_linked_proof_actions[]`

Use Session Trace when the reviewer asks:

- Was a pre-existing session explicitly bound to the work or PR?
- What proof became visible through that bound work trace?
- Which proof actions are work-linked rather than session-owned?
- Why is `action_records_by_session` zero even though closeout proof exists?

Session Trace is the session continuity surface. It is appropriate only after
an explicit session binding exists or when the reviewer is checking that
missing binding remains an explicit gap.

## 7. What Each Surface Is Good For

Work Brief is good for:

- first-pass proof check for a known `work_id`
- linking proof action IDs to work event IDs
- confirming `proof_marker_type: proof_only`
- finding related PR refs and related state keys for the work trace

Evidence Pack is good for:

- deeper verification review
- compact proof visibility summaries
- source refs for work events, action records, coordination events, and
  evidence rows
- distinguishing proof-only action IDs from legacy committed marker action IDs
- preserving gaps and skipped checks in review prose

State Brief is good for:

- scope-level recent action awareness
- checking that proof-only action records do not add active committed state
- distinguishing `proof_only_action_ids` from
  `committed_state_marker_action_ids`
- reminding agents that `codex:record-completion-proof` is preferred

Session Trace is good for:

- session continuity review
- explicit binding review
- understanding `source_session_id: null`
- showing work-linked proof through `work_linked_proof_actions[]`
- keeping session-owned action records separate from work-linked proof

## 8. What Each Surface Is Not Good For

Work Brief is not good for:

- proving broad verification completeness across all evidence types
- reviewing unrelated sessions
- replacing the Evidence Pack when a review packet needs gaps and source refs

Evidence Pack is not good for:

- creating proof or binding sessions
- approving, publishing, replaying, or committing state
- replacing a direct Work Brief check when the operator only needs the
  work-scoped proof link

State Brief is not good for:

- primary proof review for a specific `work_id`
- treating proof-only rows as active committed state
- treating legacy `external.*` markers as the default proof model

Session Trace is not good for:

- finding proof before a session is explicitly bound to work or PR context
- treating work-linked proof as session-owned proof
- changing `source_session_id` on existing proof actions
- auto-creating or auto-binding sessions

## 9. How To Interpret `state_key: null`

For closeout proof action records, `state_key: null` means proof-only.

It means:

- the action record is proof/continuity material
- the action record did not create a committed state marker
- active committed state should remain separate
- the record can still be linked to a work event and review surfaces

It does not mean:

- proof is missing
- the action failed
- the proof has lower review value
- the system should look for an `external.*` marker instead

For proof-only closeout, `state_key: null` is the expected outcome.

## 10. How To Interpret `source_session_id: null`

For `codex:record-completion-proof`, `source_session_id: null` is also
expected.

It means:

- completion proof recording did not create or bind a session
- the proof action is not session-owned
- explicit `codex:bind-session` can link an existing session to the work or PR
- Session Trace may later show the action through work-linked proof after
  explicit binding

It does not mean:

- proof is missing
- the work event link is invalid
- the Session Trace should rewrite the action record
- `action_records_by_session` should include the proof action

The proof remains reviewable through Work Brief and Evidence Pack even when
Session Trace binding is absent.

## 11. Why `action_records_by_session` Is Not The Same As Work-Linked Proof

`action_records_by_session` counts only action records whose
`source_session_id` matches the session. Proof-only closeout actions recorded
by `codex:record-completion-proof` keep `source_session_id: null`, so they are
not counted there.

Work-linked proof is different. It is derived from:

```text
bound session -> related_work_id -> work_events.related_action_id -> action_records
```

Session Trace exposes that lane through:

- `proof_visibility.work_linked_proof_action_ids[]`
- `work_linked_proof_actions[]`
- `latest_work_event.related_action_id` as a latest-event shortcut

The canonical Session Trace vocabulary for this lane is
`work_linked_proof_actions[]`. `latest_work_event.related_action_id` is useful
as a debug anchor, but it should not be treated as the primary Session Trace
proof summary.

## 12. How Legacy Compatibility Helpers Differ

`codex:record-completion` remains legacy compatibility. It still uses
`/api/actions/record`, may create committed `external.*` marker state, records
a linked work event, and emits a stderr compatibility warning on successful
legacy writes.

`codex:record-result` remains low-level legacy compatibility. It posts
directly to `/api/actions/record`, may create committed `external.*` marker
state, does not provide the full completion helper's linked work-event flow,
and emits a stderr compatibility warning on successful legacy writes.

Legacy `external.*` marker state should be interpreted as compatibility
proof-marker material, not as the preferred proof review anchor and not as an
accepted project fact by default.

## 13. How Stderr Warnings Should Influence Reviewer Behavior

When a reviewer sees a legacy helper stderr warning, they should treat it as a
steering signal:

- confirm whether the legacy helper was intentionally used
- prefer `codex:record-completion-proof` for future closeout proof
- expect possible `external.*` marker state from the legacy path
- avoid treating `external.*` markers as the default proof anchor
- review the legacy result as compatibility material until migration is
  explicitly decided

The warning should not be read as:

- a failure
- a deprecation decision
- a migration completion signal
- a reason to ignore the returned action ID or work event ID
- a reason to change helper behavior in the review itself

The warning stays on stderr so stdout parsing and helper output shape remain
compatible.

## 14. What Remains Unresolved

This memo does not resolve compatibility migration decisions. These remain
open:

- whether `codex:record-completion` eventually becomes proof-only, remains a
  legacy command, or becomes an alias with migration caveats
- how long `codex:record-result` remains available as a low-level legacy
  compatibility helper
- whether an explicit state-marker helper is needed
- whether legacy `external.*` records remain active committed state, move to a
  proof lane, are hidden from normal state views, or are treated only as
  historical compatibility data
- whether historical `external.*` records are ever migrated or reclassified
- whether the current stderr warnings remain indefinitely or change as part of
  a future migration

## 15. Recommended Next Implementation Or Dogfood Step

No immediate implementation step is required to define the hierarchy.

Recommended next dogfood step: use this hierarchy in the next real Codex
closeout and report whether the ordered review path is ergonomic:

1. Work Brief first for `related_proof.action_records[]`.
2. Evidence Pack second for `verification_trace.proof_visibility`.
3. State Brief only for recent activity and proof/state boundary awareness.
4. Session Trace only after explicit session binding.

If that dogfood finds ambiguity, the next implementation or docs goal should be
narrow: improve labels or review instructions around the confusing surface
without changing helper behavior, routes, schemas, committed state semantics,
or compatibility migration policy.
