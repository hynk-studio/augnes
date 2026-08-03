# Codex Current Continuity v0.1

## Purpose

`codex_current_continuity.v0.1` is the canonical read-only projection of the
current Augnes project situation for a fresh Codex session. It answers:

- which project is active and whether its registered folder is available;
- which exact current work packet is fresh, stale, absent, or ambiguous;
- whether that work is eligible for the existing managed Start action;
- the current managed execution stage;
- whether the latest canonical result is present and bound to the exact current
  packet;
- the current proposal, Decision, and Transition relation;
- one next consequential action and the boundary that still requires the user.

The canonical owner is
`lib/vnext/codex-current-continuity/codex-current-continuity.ts`. The local GET
route and Codex command are thin adapters over that owner; neither reconstructs
continuity from presentation copy or repository state.

## Public Command

With a packaged local Augnes runtime already running:

```sh
npm run codex:current-continuity
```

`AUGNES_API_BASE_URL` may select another loopback HTTP port. Non-loopback URLs,
URL credentials, and non-HTTP transports are refused. The command prints a
bounded human summary followed by one parseable JSON block between:

```text
BEGIN_AUGNES_CODEX_CURRENT_CONTINUITY_JSON
END_AUGNES_CODEX_CURRENT_CONTINUITY_JSON
```

Exit status `0` means both `source_status` and the snapshot are exact. Exit
status `2` means the configured local runtime transport was unavailable. Exit
status `3` means a valid partial/unavailable projection was returned, its
snapshot is unavailable, or the route, marker, request, or response contract
was invalid. A valid partial/unavailable projection is printed in both human
and machine-readable forms before exit `3`. No failure falls back to
`codex:next-work`, GuideBrief, Work Brief,
repository seeds, docs, git state, or source inspection.

## Local Read Route

The adapter is:

```text
GET /api/augnes/read/codex-current-continuity?scope=project:augnes
x-augnes-local-readonly: codex-current-continuity-v0.1
```

It is local-only, GET-only, `no-store`, and refuses missing, duplicate, or
unknown query keys. It does not accept an arbitrary project selector. A
bounded error payload is returned when exact continuity cannot be read.

## Exactness and Currentness

The projection reads canonical active-selection, registered-root,
TaskContextPacket, managed-run ledger, RunReceipt/result, proposal,
ReviewDecision, and Transition owners. GuideBrief and legacy Work Brief are not
input truth owners.

A result is `current` only when its validated receipt packet identity and
fingerprint exactly match the validated current packet identity and
fingerprint. A valid result for another historical packet is `stale`. A
missing or incomplete packet relation is `unavailable_or_ambiguous`.

Managed-run metadata may name an expected persisted receipt, but that claim is
not result availability. `terminal_result_ready` and `result_available: true`
require the canonical result reader to validate the exact receipt, run, and
packet relation. A missing or invalid expected receipt fails closed as partial
continuity with an unavailable snapshot. Every nonterminal run likewise must
bind its packet ID and fingerprint to the one exact current packet before a
running, preparing, approval, or reconciliation stage is exposed.

Durable work history is not automatically called stale. `stale_current_work`
requires positively proven supersession. Multiple candidates, malformed
packets, invalid revision/Transition lineage, or history without one provable
current packet are ambiguous or unavailable, keep Start ineligible, and make
the snapshot unavailable.

The review state remains relation-specific:

- RunReceipt is not a proposal;
- result is not a Decision;
- proposal is not a Decision;
- Decision is not a Transition;
- an accepted Decision can still await or be blocked from Transition;
- only an applied Transition changes later project meaning.

## Snapshot Binding

`codex_current_continuity_snapshot.v0.1` is a deterministic SHA-256 binding over
the minimum exact canonical material for the active workspace/project,
selection revision, root availability, current packet identity and lineage,
managed run, canonical result, current review attention, operator Start
configuration availability, Start/revision eligibility reason codes, the
derived next-action kind, and source status. It excludes
`generated_at` and other per-read values. Identical canonical state produces
the same binding; a material current-owner change produces a different one.

The binding is opaque, grants no authority, and creates no persistent record.
Raw workspace, project, packet, run, receipt, proposal, Decision, and Transition
identities used to compute it are not exposed by the public projection.

## Privacy, Bounds, and Authority

The projection exposes bounded display text, result summaries, repository-
relative artifact paths already allowed by the result privacy model, checks,
warnings, gaps, and one advisory next action. It does not expose the registered
local root path, database path, credentials, cookies, tokens, provider/model
configuration, hidden prompts or reasoning, raw event ledgers, approval control
references, internal commands, adapter payloads, or transcripts.

Every authority flag is false. Reading continuity performs no database or
filesystem write, selection/session change, run creation, Start, result or
proof admission, proposal, Decision, Transition, provider/GitHub call, retry,
poll, prefetch, scheduler, daemon, or background work. Saving or revising work
does not Start it, and the projection adds no Start control.

This slice intentionally adds no MCP tool. The repository command is the
bounded discoverable adapter; a future MCP surface would require separate
authorization and must remain a thin adapter over the same canonical owner.
