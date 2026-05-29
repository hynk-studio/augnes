# Current Runtime Codex Handoff Contract v0.1

## Purpose

The Current Runtime Codex Handoff Contract is the user-facing packet for
starting a real current-runtime Codex slice. Users should not normally manage
raw database paths. The preferred abstraction is a current Augnes runtime
endpoint plus a current Augnes work item.

The contract gives Codex enough context to start safely: where to read current
state, which work item anchors the task, what Codex may change, which checks
are expected, and whether evidence or proof-only closeout writes are allowed.
When any required value is missing, Codex must stop and report the concrete
gap instead of guessing.

A raw DB path is a local-dev fallback only. It is not the primary
user-facing concept and should not be requested from a user unless a local
operator explicitly chooses to run Codex against a local-current database.

## Conceptual Model

- Current runtime endpoint: the Augnes runtime URL where Codex reads current
  state and the current work brief.
- Work item: the trace anchor for this Codex task, identified by
  `CODEX_WORK_ID`.
- Evidence/proof authorization: explicit user/Core choices that decide whether
  Codex may write runtime evidence rows or proof-only action records.
- Scope/forbidden surfaces: the files, surfaces, and authority boundaries
  Codex must honor while implementing and verifying.
- Stop conditions: the concrete missing or unsafe conditions where Codex must
  stop instead of reconstructing state, inventing IDs, or using demo refs.

## Required Fields

The handoff contract must include:

- `AUGNES_API_BASE_URL`, or `provided by local operator` when the local
  operator will start a current runtime before Codex begins.
- `CODEX_SCOPE`.
- `CODEX_WORK_ID`.
- Work title.
- Work status.
- Work next action.
- Related state keys.
- Expected files.
- Expected checks.
- Evidence recording allowed: yes/no.
- Proof-only closeout allowed: yes/no.
- Browser verification required: yes/no.
- Forbidden changes.
- Publication/approval/retry/replay/external posting allowed: no by default.
- Merge authority: no.
- Start command.
- Stop conditions.

The start command should include the current runtime endpoint, scope, and work
ID:

```bash
AUGNES_API_BASE_URL=<provided> CODEX_SCOPE=<provided> CODEX_WORK_ID=<provided> npm run codex:read-brief
```

If `codex:read-brief` fails, Codex stops. If the work ID is missing or unknown
to the provided current runtime, Codex stops. If evidence or proof-only
closeout is not explicitly allowed, Codex must not record it.

## DB-Path Guidance

Do not ask the user to choose a DB path unless the task is explicitly operating
in local-dev fallback mode. In the normal flow, the user/Core chooses a current
work item and supplies, or points Codex to, a current runtime endpoint.

If a DB path is used, label it as a local-current DB path. Do not run
`db:reset` or `demo:seed` unless the task is explicitly demo mode and the
user/Core accepts demo-mode refs as rehearsal-only refs. Do not run
`db:migrate` unless the user/Core separately authorizes migrations.

Demo DB paths under `/tmp`, including `/tmp/augnes-runtime-dogfood.db` and
`/tmp/augnes-browser-verification.db`, are rehearsal only. They must not be
mixed with current-runtime refs, current work IDs, current evidence IDs,
current proof/action IDs, current work-event IDs, or current session refs.

## Relationship To Current Runtime Readiness Runbook

`docs/CURRENT_RUNTIME_DOGFOOD_READINESS_RUNBOOK_V0_1.md` defines the readiness
gate for moving from demo DB validation to real current-runtime dogfood. This
contract is the preferred user-facing handoff packet for that gate. It keeps
the start packet centered on a runtime endpoint and work item, with raw DB
paths reserved for local-dev fallback only.

## Relationship To Work Contract Card

The Work Contract Card is a read-only human-facing summary of work context from
`augnes_get_work_brief`. It helps a user or reviewer inspect work ID, expected
checks, related state keys, proof/evidence expectations, and authority limits.
This contract is the handoff packet Codex receives before starting work. The
card can help fill the contract, but it does not execute Codex, write proof, or
write evidence.

## Relationship To Codex Session Adapter

`docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md` defines the repo workflow for
reading state/work briefs, optionally binding an existing session, recording
verification evidence, and recording proof-only closeout. This contract feeds
the adapter start gate with explicit `AUGNES_API_BASE_URL`, `CODEX_SCOPE`, and
`CODEX_WORK_ID` values plus authorization choices.

Session binding remains optional and requires an existing session ID. The
handoff contract must not create sessions automatically or imply that missing
session refs can be reconstructed.

## Relationship To Closeout Preflight

`docs/CODEX_CLOSEOUT_PREFLIGHT_V0_1.md` documents a local review helper for PR
closeout packets. Closeout preflight is advisory. It does not call the runtime,
record evidence, record proof, approve, publish, merge, or mutate state.

The handoff contract should provide the fields that later make closeout
reviewable: work ID, scope, expected files, expected checks, skipped-check
reasons, related state keys, and authority statements.

## Relationship To Dogfood Capture

`docs/DOGFOOD_AI_SURFACE_EPISODE_CAPTURE_V0_1.md` preserves raw anchors for
future dogfood reports. This contract can become one of those raw anchors when
a real current-runtime episode is later authorized.

This PR does not create a dogfood episode. A future episode must only report
runtime refs, evidence IDs, proof/action IDs, work-event IDs, session IDs, and
PR refs that actually exist.

## Relationship To Authority Matrix

`docs/AUTHORITY_MATRIX.md` defines the actor and surface boundaries. This
contract keeps the same split: Codex may implement and verify repo work inside
the supplied scope, while Augnes Core owns durable state/proof routes and the
user/Core owns durable approval.

## Authority Boundaries

- ChatGPT does not execute Codex.
- Codex does not commit/reject Augnes state.
- Codex does not approve, publish, retry, replay, externally post, merge, or
  enable auto-merge.
- Evidence is not approval.
- Proof is not approval.
- PR is not merge authority.
- Durable approval remains user/Core gated.

## Stop Conditions

Codex must stop and report blocked when:

- `AUGNES_API_BASE_URL` is missing and no local operator is explicitly
  providing a current runtime.
- `CODEX_SCOPE` is missing.
- `CODEX_WORK_ID` is missing.
- The supplied work ID is unknown to the provided current runtime.
- `codex:read-brief` fails.
- The work item is not confirmed safe for Codex implementation.
- Expected scope or forbidden surfaces are ambiguous.
- Evidence recording is requested without explicit user/Core authorization.
- Proof-only closeout is requested without explicit user/Core authorization.
- Publication, approval, retry, replay, or external posting is requested
  without explicit user/Core approval for that exact action.
