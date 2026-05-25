# Decision Memo: Proof vs State Boundary v0.1

## Status

- decision memo only
- docs-only
- product decision not yet made
- no runtime behavior change
- no schema change
- no API route change
- no helper behavior change
- no Cockpit UI change
- no package/script change

## 1. Problem Statement

Dogfood Run 001 found that some Codex proof/check helpers can create committed
`external.*` state entries. The clearest observed example was
`codex:record-completion` creating a completion action/work event and also an
active state key such as
`external.dogfood_independent_execution_layer_test_recorded = needs_review`.
The app-prefix `codex:handoff-check` path was also reported as creating
`external.codex_handoff_check_recorded`.

This creates a product and authority-boundary question:

Should Codex proof/check helpers create committed `external.*` state entries,
or should proof remain only in `action_records`, `work_events`, and
`verification_evidence_records` unless the user explicitly invokes a state
mutation command?

This memo does not decide the product question. It frames the options and gives
a recommended direction for user/PM review.

## 2. Current Observed Behavior

Current code paths on `origin/main` show these behaviors:

- `npm run codex:record-completion` calls
  `apps/augnes_apps/scripts/codex-record-completion.ts`.
- That helper preflights `GET /api/work/{work_id}`, calls
  `/api/actions/record` through `recordActionResult`, then records
  `/api/work/{work_id}/events`.
- `/api/actions/record` calls `recordExternalAction` in
  `lib/actions/local-tools.ts`.
- `recordExternalAction` inserts an `action_records` row and then calls
  `commitStateUpdate` with a state key shaped as
  `external.<sanitized_action_name>_recorded`.
- `recordExternalAction` also appends a coordination event with
  `authority_level: "action_proof"`.
- `npm run codex:handoff-check` calls `recordActionResult` and prints an
  expected transition label of `external.codex_handoff_check_recorded`.
- `npm run codex:record-evidence` posts to `/api/evidence/records`, whose
  route states that evidence records are observation evidence only and do not
  commit or reject state.
- `/api/work/{work_id}/events` appends work events and coordination events, but
  does not call `commitStateUpdate`.

Dogfood Run 001 artifacts are not present on current `origin/main`; this memo
uses the fetched PR #216 artifact branch as contextual evidence for the
observed dogfood report and backlog. The code observations above come from
current `origin/main`.

## 3. Why The Current Behavior May Be Confusing

The current behavior is internally consistent if `external.*` state keys are
intended to be durable proof markers. It is confusing because the user-facing
language often says "proof", "check", or "trace" rather than "commit state".

The confusing cases are:

- A helper named `codex:handoff-check` sounds read-only, but it records an
  action result and creates an `external.*` state transition.
- Completion helper text says it records proof and trace notes only, but the
  proof path includes a committed state update.
- `external.*` entries appear in active committed state, which can read like a
  project fact rather than an execution proof marker.
- The Authority Matrix says Codex can record proof but cannot commit/reject
  Augnes state. A committed `external.*` update can blur that distinction even
  when it does not commit or reject a pending state proposal.

The distinction matters because Augnes relies on explicit authority boundaries:
proof should say what happened, while committed project state should say what
the runtime/user has accepted as durable project fact.

## 4. Authority Boundary Implications

The current path does not appear to grant Codex proposal commit/reject
authority. The authority invariant smoke explicitly allows the current
action-proof state transition behavior while asserting no pending proposal is
committed or rejected.

The unresolved boundary question is narrower:

- Is a committed `external.*` proof marker a valid kind of committed state?
- Or should committed state be reserved for accepted project facts, with proof
  stored in proof-native tables and surfaced through derived views?

If `external.*` proof markers remain committed state, docs and helper names
must say that proof recording creates a committed proof marker. If proof moves
out of committed state, Evidence Pack, Work Brief, State Brief, and Cockpit
views must continue to make proof discoverable without relying on active
`external.*` state entries.

## 5. Command Categories

### Check-Only Commands

Check-only commands should inspect or validate and must not create records or
state transitions.

Examples of expected properties:

- may call read-only routes
- may run local static checks or smoke checks
- may return pass/fail output
- must not call `/api/actions/record`
- must not call `/api/evidence/records`
- must not call `/api/work/{work_id}/events`
- must not call `commitStateUpdate`

### Proof/Evidence Recording Commands

Proof/evidence recording commands should create bounded observation records.
They may write to proof-native stores, but should not imply approval,
readiness, or accepted project state.

Examples of acceptable proof-native destinations:

- `action_records`
- `work_events`
- `verification_evidence_records`
- coordination events with proof or execution-trace authority

Open question: whether `external.*` committed state keys belong in this
category.

### Committed State Mutation Commands

Committed state mutation commands should be explicit and user/runtime gated.
They create or alter durable project state and must be named as state mutation
commands, not checks.

Examples of expected properties:

- clear command name such as `commit-state` or `record-state-marker`
- explicit user/runtime authority boundary
- route/helper docs say a committed state transition will be created
- tests assert exactly which state keys are allowed to change

## 6. Options

### Option A: Keep Current `external.*` State Behavior

Keep action proof recording as both an `action_records` insert and a committed
`external.*` state transition.

Benefits:

- Minimal implementation migration.
- Temporal State Graph already shows external work outcomes.
- Existing smoke tests and demo flows keep passing with little change.
- State Brief can continue exposing external proof markers as active state.

Costs:

- "Proof" and "check" helpers can look like committed state mutation helpers.
- The Authority Matrix must explain that `external.*` proof markers are a
  special committed-state category that does not equal project-fact approval.
- Users may over-read `external.*` entries as accepted project truth.

Required follow-up if chosen:

- Rename or document `codex:handoff-check` as a recording command, not
  check-only.
- Update completion docs to say proof recording creates an `external.*`
  committed proof marker.
- Add smoke coverage that distinguishes `external.*` proof markers from
  proposal commit/reject authority.

### Option B: Move Proof To Action/Work/Evidence Records Only

Stop proof helpers from creating committed `external.*` state transitions.
Proof remains in `action_records`, `work_events`,
`verification_evidence_records`, and coordination events.

Benefits:

- Strongest conceptual boundary between proof and committed project state.
- Helper names can stay close to "record proof" without implying state commit.
- Active state remains limited to accepted project facts.
- Evidence Pack and Session Trace become the natural proof review surfaces.

Costs:

- Temporal State Graph and State Brief may lose current `external.*` proof
  visibility unless they read proof-native records as a separate lane.
- Existing tests and demo expectations around `external.*` labels would need
  migration.
- Historical `external.*` entries need a compatibility story.

Required follow-up if chosen:

- Change `/api/actions/record` or `recordExternalAction` behavior in a separate
  implementation PR.
- Add read-only proof lanes to views if needed so proof stays discoverable.
- Update smoke tests that currently expect state entry/state transition deltas.

### Option C: Split Helper Names And Behavior Into Check / Record-Proof / Commit-State

Make the command model explicit:

- `check` commands are read-only.
- `record-proof` commands write action/work/evidence proof records only.
- `commit-state` commands create committed state transitions and are
  user/runtime gated.

This option may keep current behavior temporarily, but the target model splits
semantics so command names, docs, tests, and routes match what each command
actually writes.

Benefits:

- Clearest long-term operator model.
- Allows compatibility migration instead of one abrupt behavior change.
- Lets the product choose whether `external.*` is retired, reserved, or moved
  behind an explicitly named state-marker command.
- Prevents future helpers from inheriting ambiguous "check but writes state"
  behavior.

Costs:

- More naming and docs work than Option A.
- More implementation work than Option B if compatibility aliases are needed.
- Requires user/PM decision on whether `external.*` survives as a state-marker
  concept.

Required follow-up if chosen:

- Define the command taxonomy in docs first.
- Add smoke tests that assert `check` helpers are read-only.
- Add or rename helpers in a separate implementation PR.
- Decide whether current `codex:record-completion` remains a compatibility
  alias or becomes proof-only.

## 7. Recommendation

Recommendation for review: choose Option C as the product direction, with a
near-term implementation target that moves normal proof recording toward
proof-native records only.

The reason is not that the current behavior is broken. The current behavior can
be defended as a durable proof marker model. The problem is that command names
and user mental models are not sharp enough for the authority boundary Augnes
is trying to protect.

The recommended end state is:

- check-only commands never write records
- proof/evidence recording commands write proof-native records
- committed state mutation commands are explicitly named and gated
- any retained `external.*` state marker is treated as a deliberate state
  mutation, not incidental proof recording

This memo does not mark that decision resolved. It should be reviewed by the
user/PM before implementation.

## 8. Migration Impact

If Option C is accepted, migration should be staged:

1. Documentation and tests define the command taxonomy.
2. Existing `codex:handoff-check` is renamed or supplemented with a read-only
   check command.
3. Existing `codex:record-completion` is either made proof-only or kept as a
   compatibility alias with explicit warning text.
4. Views that currently depend on `external.*` active state entries are checked
   for proof visibility gaps.
5. Historical `external.*` entries remain readable as historical proof markers.

Compatibility should avoid deleting historical proof/state records. The
question is where future records should go and how helpers should be named.

## 9. Naming Changes If Needed

Candidate naming model:

- `codex:handoff-check`: read-only validation only
- `codex:record-handoff-proof`: records action/work/evidence proof
- `codex:record-completion-proof`: records completion proof without committed
  state mutation
- `codex:commit-external-state-marker`: explicit state-marker command if
  `external.*` remains supported
- `codex:record-completion`: compatibility alias, only if docs state exactly
  what it writes

Avoid names where `check`, `preview`, `read`, or `validate` write durable state.

## 10. Tests That Should Protect The Chosen Model

Tests should make the chosen boundary executable:

- A check-only smoke asserts no changes to state entries, state transitions,
  action records, work events, evidence records, coordination events, mailbox,
  publication, delivery, approval, or readiness tables.
- A proof-recording smoke asserts proof-native records are created and pending
  proposals are not committed or rejected.
- If proof-only is chosen, proof-recording smokes assert no `external.*` state
  entry or state transition is created.
- If `external.*` state markers remain, tests assert they are created only by
  explicitly named state-marker commands.
- Evidence Pack and Session Trace smokes assert proof remains discoverable
  without implying approval, readiness, or state commit authority.
- Authority invariant smokes keep asserting no pending proposal commit/reject,
  no publish/replay/approval, no GitHub/OpenAI calls, and no Cockpit write
  controls.

## 11. What Remains Out Of Scope

This memo does not:

- change runtime behavior
- change package scripts
- change schemas
- change API routes
- change helper behavior
- change Cockpit UI
- update generated screenshots
- add bridge health behavior
- add root `codex:handoff-check`
- decide whether proof-vs-state behavior is accepted
- migrate historical `external.*` records
- mark any product decision as resolved

## 12. Questions Requiring User/PM Judgment

1. Should committed state include proof-marker state keys at all?
2. If `external.*` remains, should it be hidden from normal active project
   state or shown as a separate proof-marker lane?
3. Should `codex:record-completion` become proof-only, or remain a
   compatibility helper that also writes a state marker?
4. Should `codex:handoff-check` be renamed because it is not check-only today?
5. Should historical `external.*` entries be treated as proof markers, project
   state, or legacy compatibility data?
6. Which surface should be the primary proof review surface: Temporal State
   Graph, Evidence Pack, Session Trace, Work Brief, or a separate proof lane?

## 13. Next Suggested Implementation Goal

If the user accepts the recommendation, the next implementation goal should be:

```text
Define and enforce the Codex helper command taxonomy. Make check-only helpers
read-only, make proof-recording helpers write only action/work/evidence proof
records, and reserve committed state transitions for explicitly named,
user/runtime-gated state mutation commands. Do not change Cockpit UI or bridge
health in the same PR.
```

That implementation should be separate from this memo and should include smoke
tests proving the chosen boundary.
