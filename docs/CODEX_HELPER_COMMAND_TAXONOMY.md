# Codex Helper Command Taxonomy

This taxonomy implements the first guardrail from
`docs/DECISION_PROOF_VS_STATE_BOUNDARY_V0_1.md`.

Codex helper names must describe their side effects. A command that reads or
checks must stay read-only. A command that records proof must say it records
proof or evidence. A command that creates committed state must use an explicit
state-mutation name and be user/runtime gated.

## Categories

### Check-Only

Check-only helpers inspect local files, parse supplied material, or read
Augnes review routes. They must not create durable records.

Allowed behavior:

- local validation
- `GET` requests to read-only Augnes routes
- pass/fail output

Forbidden behavior:

- `POST`, `PATCH`, `PUT`, or `DELETE` to Augnes runtime routes
- `/api/actions/record`
- `/api/evidence/records`
- `/api/work/{work_id}/events`
- `commitStateUpdate`
- new `external.*` committed state markers

Current check-only helpers:

- `codex:read-brief`
- `codex:next-work`

### Record-Proof

Record-proof helpers create bounded proof or trace records. They may write only
proof-native rows such as `verification_evidence_records`, `work_events`,
`action_records`, coordination trace records, session trace material, or
Evidence Pack material. New record-proof helpers must not create committed
`external.*` state markers by default.

Current proof-native helpers:

- `codex:record-evidence`: records `verification_evidence_records` only.
- `codex:record-completion-proof`: records completion proof as proof-only
  `action_records`, linked `work_events`, and coordination trace.
  It uses `/api/actions/record-proof`, not the legacy `/api/actions/record`
  state-marker route.

The retired legacy completion helpers are not package entry points. Historical
`external.*` marker records remain readable, but no current helper creates them
as native-host result intake.

### Commit-State

Commit-state helpers create or alter committed Augnes state. They must be
explicitly named and gated. A helper in this category should include
`commit-state`, `state-marker`, or an equally explicit state mutation phrase in
its command name.

No Codex commit-state helper is defined yet.

## Naming Rules

- Names containing `check`, `read`, `preview`, `readiness`, or `validate` are
  read-only.
- Names containing `record-evidence` or `record-proof` may write proof-native
  records only. Names ending in `-proof` may also write proof-native records
  only when the helper docs state the exact proof record type.
- Names that create `external.*` or other committed state markers must be
  explicit state mutation commands.
- Legacy `external.*` entries remain readable compatibility proof-marker
  material. This guardrail does not delete, rewrite, migrate, or reinterpret
  historical records.

## Guardrail

Canonical package-graph and authority tests check this taxonomy against package
scripts and helper sources. They block retired manual-result aliases, require
record-proof helpers to disclose their side effects, and keep historical
`external.*` records read-only.
