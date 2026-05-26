# Codex Completion Compatibility Transition Plan

## Status

- decision / transition plan only
- docs-only
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

The proof-only action-record dogfood report is present on `origin/main` at
`reports/dogfood/2026-05-26-proof-only-action-record-dogfood.md`. It found:

- action-record proof exists with `state_key: null`
- the Work Brief links the proof action ID
- the Evidence Pack includes both work-event and action-record proof
- State Brief shows the proof in `recent_actions` while active committed state
  remains unchanged
- Session Trace still requires a separate session binding workflow
- invalid proof payloads fail without writes

The legacy completion path still behaves differently:

- `codex:record-completion` preflights `GET /api/work/{work_id}`, then records
  through `recordActionResult`, which posts to `/api/actions/record`, and then
  records `/api/work/{work_id}/events`.
- `/api/actions/record` calls `recordExternalAction`, which inserts an
  `action_records` row and creates a committed state marker named
  `external.<sanitized_action_name>_recorded`.
- `codex:record-result` is the lower-level compatibility helper for the same
  `/api/actions/record` path. Its output still tells operators to confirm the
  Temporal State Graph shows `external.<action>_recorded`.

## 2. Preferred Future Path

The preferred future path for Codex closeout proof is:

1. Use read-only checks for preflight and closeout readiness.
2. Record structured evidence through proof-native evidence rows when useful.
3. Record completion through `codex:record-completion-proof`.
4. Review proof through Work Brief, Evidence Pack, State Brief recent actions,
   and Session Trace only when a session was explicitly bound.

This keeps completion proof discoverable without adding committed
`external.*` state markers or treating proof markers as accepted project facts.

## 3. Compatibility Policy For `codex:record-completion`

Keep `codex:record-completion` as a legacy compatibility helper for now.

It should remain available for existing scripts, operator muscle memory, and
old closeout flows that still expect the `/api/actions/record` response shape
or the Temporal State Graph `external.*` marker. It should not be presented as
the preferred closeout path in new Codex handoff, closeout, or adapter docs.

For the transition period:

- document it as compatibility behavior
- keep its current side effects explicit
- do not silently change it to proof-only
- do not remove it
- do not make it the default recommendation
- do not treat its `external.*` marker as accepted project fact

Changing `codex:record-completion` should require a separate implementation PR
with dedicated smokes and a clear migration decision.

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
- keep taxonomy guardrails that explain its legacy state-marker side effect
- retain it for compatibility while callers move to proof-native helpers

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

The proof-only path is usable without it, and adding a state-marker helper now
would force unresolved product choices before they are necessary:

- whether `external.*` should remain the state-marker namespace
- whether marker state belongs in active committed state or a separate proof
  lane
- which runtime/user gate should authorize state marker creation
- which views should show deliberate marker state

Defer this helper until there is a concrete operator need for committed marker
state that proof-native records do not satisfy.

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
- Keep Session Trace binding separate and explicit.

Stage 4: inventory legacy dependencies before changing behavior.

- Search docs, scripts, smokes, and operator runbooks for
  `codex:record-completion`, `codex:record-result`, `/api/actions/record`, and
  `external.*` marker assumptions.
- Decide whether compatibility helpers should warn, remain indefinitely, or be
  migrated.

Stage 5: make a separate implementation decision.

- Option A: leave compatibility helpers indefinitely.
- Option B: migrate `codex:record-completion` to call the proof-only route and
  keep `codex:record-result` as the explicit legacy route.
- Option C: add a separately named, gated state-marker helper before changing
  any compatibility command that users still need for marker state.

This plan recommends Stage 1 through Stage 4 now. Stage 5 remains unresolved.

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
- Session Trace behavior is explicit when no session binding exists
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
- whether compatibility helpers should warn before writing legacy markers
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
