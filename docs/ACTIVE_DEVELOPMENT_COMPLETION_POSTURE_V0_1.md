# Active Development Completion Posture v0.2

## Decision

Augnes development is operability-first and flow-first.

The product should become easier to start and use than manually coordinating ChatGPT, Codex, databases, ports, tokens, and handoff text. Internal complexity belongs in the product and its automated tests, not in routine user procedures.

## Active defaults

- Complete the end-to-end product flow before optimizing usefulness or adding advanced lanes.
- Prefer working vertical slices over planning-only, approval-gate-only, preview-only, smoke-only, or boundary-only PRs.
- Treat behavior, reliability, and user effort reduction as progress. Do not count document, panel, table, contract, or metric existence as progress by itself.
- Use focused unit/integration tests, disposable-database tests, and automated browser/CDP tests during R2–R8.
- Keep long manual operator pilots, real-project dogfood, and usefulness measurement out of ordinary PR merge gates.
- Preserve only real safety invariants: data integrity, explicit irreversible authority, project isolation, replay refusal, credential safety, bounded provider egress, backup, and restore.
- Keep current documentation short and tied to implemented behavior or the active R1–R8 roadmap.
- Delete obsolete planning residue, reports, and one-off verification scaffolding after reference audit.

## User-effort rule

A required user step is justified only when it is a meaningful project decision or an unavoidable external authorization.

The product should automate:

- DB creation, backup, migration, integrity checking, and recovery
- process and port management
- internal IDs, nonces, fingerprints, TTLs, and receipts
- TaskContextPacket delivery and result return
- routine test and qualification mechanics

The user should retain:

- project and task choice
- acceptance or rejection of semantic changes
- approval of irreversible external actions
- post-Alpha usefulness judgment

## Merge gates

During R2–R8, the normal merge gate is:

- build and type correctness for the changed path
- focused behavior tests
- disposable-database safety where persistence changes
- automated browser coverage where the user flow changes
- no new unauthorized durable write or unbounded external egress

Alpha/RC gates may add short real-user flows, real provider/host round trips, backup/restore rehearsal, and usefulness evaluation.

## Reporting

Reports begin with:

1. what now works or what verified residue was removed
2. how user effort or product flow improved
3. tests actually run

Then report remaining blockers and compatibility debt.
