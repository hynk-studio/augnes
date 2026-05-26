# Codex Completion Compatibility Transition Plan

## Status

- decision / transition plan only
- docs-only
- updated after proof-only closeout review-surface hardening and Session Trace
  vocabulary canonicalization
- no runtime behavior change
- no helper behavior change
- no schema change
- no API route change
- no Cockpit UI change
- no state-marker helper added
- no legacy `external.*` migration

## 1. Current State

Option C from `docs/DECISION_PROOF_VS_STATE_BOUNDARY_V0_1.md` is the accepted
direction for Codex helper semantics:

- check-only helpers must be read-only
- proof/evidence recording helpers should write proof-native records only
- committed state mutation must be explicit, separately named, and
  user/runtime gated
- `external.*` committed state keys should not be the default proof marker path

`docs/CODEX_HELPER_COMMAND_TAXONOMY.md` now classifies helpers as check-only,
record-proof, or commit-state. It also identifies `codex:record-completion`
and `codex:record-result` as compatibility proof helpers because they still
use the legacy `/api/actions/record` path.

`codex:record-completion-proof` is the new proof-only closeout helper. It uses
`POST /api/actions/record-proof` and `POST /api/work/{work_id}/events`.
The proof-only action route creates an `action_records` row with
`state_key: null`, appends coordination proof, and does not call
`commitStateUpdate`.

The current preferred proof-only closeout path is:

- `codex:record-completion-proof`
- `POST /api/actions/record-proof`
- proof-only `action_records` with `state_key: null`
- linked `work_events` with `related_action_id`
- coordination trace in `coordination_events`
- no legacy `/api/actions/record` call
- no committed `external.*` state marker

The proof-only action-record dogfood report is present on `origin/main` at
`reports/dogfood/2026-05-26-proof-only-action-record-dogfood.md`. It found:

- action-record proof exists with `state_key: null`
- the Work Brief links the proof action ID
- the Evidence Pack includes both work-event and action-record proof
- State Brief shows the proof in `recent_actions` while active committed state
  remains unchanged
- Session Trace still requires a separate session binding workflow
- invalid proof payloads fail without writes

Follow-up visibility hardening and dogfood runs established the current
proof-only review model:

- Work Brief: `related_proof.action_records[]`
- Evidence Pack: `verification_trace.proof_visibility`
- State Brief: `recent_action_visibility`
- Session Trace: `work_linked_proof_actions[]`

`work_linked_proof_actions[]` is the canonical Session Trace vocabulary for
proof visible through explicit work binding. `action_records_by_session`
continues to mean only action records whose `source_session_id` matches the
session. `latest_work_event.related_action_id` and
`proof_visibility.latest_work_event_related_action_id` are useful shortcuts or
debug anchors, but they are not the primary Session Trace proof summary.

Proof-only completion actions keep `source_session_id: null`. Explicit
`codex:bind-session` links an existing session to work/PR context, but it does
not rewrite proof actions, create sessions, bind sessions automatically, or
turn work-linked proof into session-owned action proof.

The legacy completion path still behaves differently:

- `codex:record-completion` preflights `GET /api/work/{work_id}`, then records
  through `recordActionResult`, which posts to `/api/actions/record`, and then
  records `/api/work/{work_id}/events`.
- On successful legacy writes, `codex:record-completion` emits a stderr-only
  compatibility warning that recommends `codex:record-completion-proof`.
- `/api/actions/record` calls `recordExternalAction`, which inserts an
  `action_records` row and creates a committed state marker named
  `external.<sanitized_action_name>_recorded`.
- `codex:record-result` is the lower-level compatibility helper for the same
  `/api/actions/record` path. Its output still tells operators to confirm the
  Temporal State Graph shows `external.<action>_recorded`.
- On successful legacy writes, `codex:record-result` emits a stderr-only
  compatibility warning that recommends `codex:record-completion-proof`.

The stderr-only warning behavior was dogfooded in
`reports/dogfood/2026-05-26-legacy-helper-warning-dogfood.md`. The report found
that warnings stay off stdout, stdout JSON-bearing lines remain parseable,
failure paths do not print extra compatibility warning text, exit codes remain
compatible, legacy helpers retain `external.*` marker behavior, and
`codex:record-completion-proof` remains unchanged and warning-free.

## 2. Preferred Future Path

The preferred future path for Codex closeout proof is:

1. Use read-only checks for preflight and closeout readiness.
2. Record structured evidence through proof-native evidence rows when useful.
3. Record completion through `codex:record-completion-proof`.
4. Review proof through Work Brief, Evidence Pack, State Brief recent actions,
   and Session Trace only when a session was explicitly bound.

This keeps completion proof discoverable without adding committed
`external.*` state markers or treating proof markers as accepted project facts.

For new Codex closeout and handoff workflows, the default proof review path is:

1. Work Brief `related_proof.action_records[]` for linked proof action
   summaries.
2. Evidence Pack `verification_trace.proof_visibility` for compact proof-only
   action IDs, linked work event IDs, and legacy committed marker action IDs
   when present.
3. State Brief `recent_action_visibility` for distinguishing proof-only
   `state_key: null` recent actions from active committed state.
4. Session Trace `work_linked_proof_actions[]` after explicit session binding
   for work-linked proof visible through bound work events.

In Session Trace, `work_linked_proof_actions[]` is the canonical phrase for
work-linked proof. `latest_work_event.related_action_id` should remain a
latest-event shortcut and debugging anchor, not the primary proof review
surface.

## 3. Compatibility Policy For `codex:record-completion`

Keep `codex:record-completion` as a legacy compatibility helper for now.

It should remain available for existing scripts, operator muscle memory, and
old closeout flows that still expect the `/api/actions/record` response shape
or the Temporal State Graph `external.*` marker. It should not be presented as
the preferred closeout path in new Codex handoff, closeout, or adapter docs.

For the transition period:

- document it as compatibility behavior
- expect a stderr compatibility warning on successful legacy writes
- keep its current side effects explicit
- do not silently change it to proof-only
- do not remove it
- do not make it the default recommendation
- do not treat its `external.*` marker as accepted project fact

Changing `codex:record-completion` should require a separate implementation PR
with dedicated smokes and a clear migration decision.

Do not convert `codex:record-completion` to proof-only yet. The proof-only
review model is now clear enough for new closeouts, but the compatibility
helper may still be embedded in existing scripts, runbooks, and operator
habits that expect the legacy `/api/actions/record` behavior or the
`external.<action>_recorded` marker. An immediate behavior change would reuse a
familiar command name for different side effects and could make existing
legacy proof appear missing to reviewers who still depend on Temporal State
Graph marker visibility.

## 4. Compatibility Policy For `codex:record-result`

Keep `codex:record-result` as a lower-level legacy compatibility helper for
the same reason.

`codex:record-result` is more direct than `codex:record-completion`: it posts
to `/api/actions/record` and does not add the completion helper's linked work
event flow. Because `/api/actions/record` still creates
`external.<action>_recorded`, this helper belongs in the compatibility category
until a separate product decision changes the legacy action-record route.

For now:

- do not advertise it as a new proof-only pattern
- do not use it as the default Codex closeout recommendation
- expect a stderr compatibility warning on successful legacy writes
- keep taxonomy guardrails that explain its legacy state-marker side effect
- retain it for compatibility while callers move to proof-native helpers

Do not convert or remove `codex:record-result` yet. It remains the low-level
legacy compatibility path for callers that deliberately use
`/api/actions/record`. Its lifetime should be decided together with the
future of legacy action-record state markers, not as part of proof-only
closeout vocabulary hardening.

## 5. Default Closeout Recommendation

Yes. `codex:record-completion-proof` should be the default closeout
recommendation for Codex completion proof.

It now matches the accepted proof-vs-state boundary:

- it records proof-native `action_records`
- it links work trace through `work_events`
- it records coordination proof
- it leaves committed state unchanged
- it avoids new `external.*` markers
- it fails invalid payloads without writes

The default recommendation should still include skipped-reason handling:
missing runtime, missing `CODEX_WORK_ID`, unknown work ID, missing session ID,
or unavailable evidence/session review routes should be reported as explicit
gaps, not papered over.

This recommendation is now stronger after review-surface hardening:

- Work Brief, Evidence Pack, and State Brief make proof-only closeout visible
  without committed state mutation.
- Session Trace has canonical vocabulary for proof visible through explicit
  work binding.
- `action_records_by_session` remains session-owned only, which prevents
  proof-only actions with `source_session_id: null` from being misread as
  direct session-owned actions.

## 6. Legacy `external.*` Markers

Do not migrate legacy `external.*` markers yet.

Existing `external.*` records should remain readable as historical
compatibility proof-marker material until a separate migration decision says
otherwise. This plan does not delete, rewrite, hide, reinterpret, or backfill
legacy records.

Near-term docs and review surfaces should continue to distinguish:

- proof records: action records, work events, evidence records, coordination
  events, Evidence Pack material, and session trace material
- committed state: durable project state accepted through Augnes state
  authority
- legacy compatibility markers: historical `external.*` entries created by
  old action-record flows

## 7. Explicit State-Marker Helper

Do not add an explicit state-marker helper now.

The proof-only path is usable and reviewable without it. Adding a state-marker
helper now would force unresolved product choices before they are necessary:

- whether `external.*` should remain the state-marker namespace
- whether marker state belongs in active committed state or a separate proof
  lane
- which runtime/user gate should authorize state marker creation
- which views should show deliberate marker state

Defer this helper until there is a concrete operator need for committed marker
state that proof-native records do not satisfy. The now-canonical proof review
surfaces reduce the need to create committed state markers merely to make
closeout proof discoverable.

## 8. Risks Of Changing `codex:record-completion` Immediately

Changing `codex:record-completion` immediately is risky because it is the
older, familiar command and may be embedded in human closeout habits, scripts,
or docs outside the current repo snapshot.

Specific risks:

- existing closeout scripts may expect `/api/actions/record` response fields
- existing review steps may expect `external.<action>_recorded` in the Temporal
  State Graph
- a silent behavior change could make old proof appear missing to operators
  who have not moved to Evidence Pack or Work Brief review
- downstream docs may still describe the compatibility route
- tests that assert legacy marker behavior would need coordinated updates
- support burden would rise if the same command name means different side
  effects across branches or local runtimes
- Session Trace clarity now depends on explicit work binding and
  `work_linked_proof_actions[]`; silently changing the legacy helper would
  mix compatibility migration with proof-review vocabulary adoption
- any migration must decide whether existing `external.*` marker expectations
  become warnings, aliases, explicit state-marker commands, or unsupported
  legacy behavior

The safer transition is to make the proof-only command preferred first, then
change or retire the compatibility command only after callers and smokes have
moved.

## 9. Suggested Staged Migration Path

Stage 1: document the current split.

- Keep `codex:record-completion-proof` as the preferred path.
- Keep `codex:record-completion` and `codex:record-result` as compatibility
  helpers.
- Keep taxonomy guardrails explicit.

Stage 2: move new closeout docs and handoff templates to proof-only language.

- Recommend `codex:record-completion-proof`.
- Mention `codex:record-completion` only as compatibility behavior.
- Avoid presenting `external.*` markers as the normal proof path.

Stage 3: harden proof-only review surfaces.

- Keep Work Brief and Evidence Pack visibility covered by smokes.
- Keep State Brief `recent_actions` behavior clear for `state_key: null`.
- Keep State Brief `recent_action_visibility` clear about proof-only recent
  actions versus active committed state.
- Keep Session Trace binding separate and explicit.
- Use `work_linked_proof_actions[]` as the canonical Session Trace phrase for
  proof visible through explicit work binding.
- Treat `latest_work_event.related_action_id` as a shortcut/debug anchor, not
  the primary proof summary.

Stage 4: inventory legacy dependencies before changing behavior.

- Search docs, scripts, smokes, and operator runbooks for
  `codex:record-completion`, `codex:record-result`, `/api/actions/record`, and
  `external.*` marker assumptions.
- Decide whether compatibility helper warnings remain indefinitely, are changed
  in a later migration, or are replaced by a different compatibility shape.

Stage 5: make a separate implementation decision.

- Option A: leave compatibility helpers indefinitely.
- Option B: migrate `codex:record-completion` to call the proof-only route and
  keep `codex:record-result` as the explicit legacy route.
- Option C: add a separately named, gated state-marker helper before changing
  any compatibility command that users still need for marker state.

This plan recommends Stage 1 through Stage 4 now. Stage 5 remains unresolved.

Recommended next compatibility policy decision:

- keep `codex:record-completion` as legacy compatibility for now
- keep `codex:record-result` as low-level legacy compatibility for now
- keep `codex:record-completion-proof` as the preferred/default closeout proof
  helper
- defer behavior-changing compatibility migration until a separate explicit
  decision chooses the migration shape, user/runtime gating, warning lifetime,
  and legacy marker treatment

## 10. Tests And Smokes Required Before Any Behavior Change

Before changing `codex:record-completion`, `codex:record-result`, or
`/api/actions/record`, run or add smokes that prove:

- `codex:record-completion-proof` creates one proof action record with
  `state_key: null`
- `codex:record-completion-proof` creates the linked work event and
  coordination proof
- proof-only completion creates no state entries, no state transitions, and no
  `external.*` entries
- invalid `/api/actions/record-proof` payloads fail without writes
- Work Brief links the proof action ID
- Evidence Pack includes both work-event and action-record proof
- State Brief shows proof-only records as recent actions while active committed
  state remains unchanged
- State Brief `recent_action_visibility` distinguishes proof-only actions from
  committed state marker actions
- Session Trace behavior is explicit when no session binding exists
- Session Trace `work_linked_proof_actions[]` shows work-linked proof after
  explicit binding
- Session Trace `action_records_by_session` remains session-owned only
- Session Trace `latest_work_event.related_action_id` remains a secondary
  shortcut/debug anchor, not the primary proof summary
- proof-only completion actions keep `source_session_id: null`
- no session is auto-created or auto-bound by proof recording
- check-only helpers remain read-only
- compatibility helpers are the only allowed helpers that create legacy
  `external.*` state markers
- no pending proposal is committed or rejected by proof recording
- no publish, replay, approval, mailbox, readiness, delivery, GitHub, OpenAI,
  or Cockpit write side effect is introduced

Useful current commands include:

```bash
npm run smoke:codex-record-completion-proof-helper
npm run smoke:codex-helper-taxonomy
npm run smoke:codex-session-adapter-v2
npm run smoke:codex-closeout-docs
npm run smoke:authority-invariants
npm run smoke:codex-record-completion-follow-up-refs
npm run typecheck
npm --prefix apps/augnes_apps run typecheck
```

Runtime-backed dogfood should also compare table counts before and after
proof-only completion, including `state_entries`, `state_transitions`,
`external_state_entries`, `action_records`, `work_events`, and
`coordination_events`.

Before any future behavior migration, the implementation PR should also:

- inventory docs, scripts, smokes, runbooks, and operator references to
  `codex:record-completion`, `codex:record-result`, `/api/actions/record`, and
  `external.*`
- choose whether legacy helpers warn, remain unchanged, become aliases, or move
  state marker writes behind a separate gated helper
- keep the existing stderr-only warnings unchanged unless that same migration
  decision explicitly changes the warning contract
- document how historical `external.*` entries remain readable
- update PR templates, handoff packets, closeout docs, and smoke expectations
  in the same PR or a staged pair of PRs
- include rollback guidance for callers that still need legacy state-marker
  behavior

## 11. What Remains Unresolved

These decisions remain open:

- whether `codex:record-completion` should eventually become an alias for
  `codex:record-completion-proof`
- whether `codex:record-result` remains forever as a low-level legacy marker
  command
- whether `external.*` should remain visible in active committed state, move to
  a separate proof lane, or be deprecated
- whether a separately named state-marker helper is needed at all
- what user/runtime gate would authorize deliberate marker state
- whether the existing stderr-only compatibility warnings should remain
  indefinitely, change timing, or move to a later migration path
- whether old local runtime records should ever be migrated, hidden, or
  reclassified
- how Session Trace should be bound during Codex closeout without automatic
  session creation

This plan intentionally does not resolve those migration decisions.

## 12. Recommendation For The Next Implementation PR

No immediate implementation PR is required to change behavior.

The next implementation PR, if any, should be a narrow hardening PR for the
preferred proof-only path, not a compatibility migration. Recommended scope:

- keep `codex:record-completion-proof` as the default closeout recommendation
- add or tighten smokes around proof visibility in Work Brief, Evidence Pack,
  and State Brief `recent_actions`
- keep Session Trace binding explicit and separately tested
- keep compatibility helpers documented and constrained by taxonomy guardrails
- do not change `/api/actions/record`
- do not change `codex:record-completion`
- do not change `codex:record-result`
- do not add a state-marker helper
- do not migrate legacy `external.*` records

The first behavior-changing PR should wait until user/PM judgment resolves
whether compatibility helpers remain legacy commands, become proof-only aliases,
or are split around a new explicit state-marker helper.
