# Active Development Completion Posture v0.3

## Decision

Augnes development is operability-first, flow-first, and automation-aware.

The product should become easier to start and use than manually coordinating ChatGPT, Codex, databases, ports, tokens, schedulers, and handoff text. Internal complexity belongs in the product and its automated tests, not in routine user procedures.

## Active defaults

- Complete the end-to-end product flow before optimizing broad usefulness or adding unrelated advanced lanes.
- Build the minimal Automation Spine across R2–R8 instead of treating automation as a late add-on.
- Prefer working vertical slices over planning-only, approval-gate-only, preview-only, smoke-only, or boundary-only PRs.
- Treat behavior, reliability, user-effort reduction, and a shared interactive/automated run path as progress. Do not count document, panel, table, contract, or metric existence as progress by itself.
- Allow Personal Perspective to progress as a bounded parallel lane when it reuses existing Core contracts and does not block the mainline flow.
- Use focused unit/integration tests, disposable-database tests, and automated browser/CDP tests during R2–R8.
- Keep long manual operator pilots, broad real-project dogfood, and usefulness measurement out of ordinary PR merge gates.
- Preserve only real safety invariants: data integrity, explicit irreversible authority, project isolation, replay refusal, credential safety, bounded provider egress, automation budget/stop enforcement, backup, and restore.
- Keep current documentation short and tied to implemented behavior or the active R1–R8 roadmap.
- Delete obsolete planning residue, reports, and one-off verification scaffolding after reference audit.

## Automation rule

Automation may be a first-class trigger for the same Core loop used by interactive work.

The product should support, under bounded policy and grant:

- task proposal or selection
- host start
- timeout, cancel, pause, retry eligibility, and stop conditions
- test execution
- result intake
- `RunReceipt` creation
- proposal creation and review-needed state
- restart-time reconciliation

Automation must not silently approve durable semantic state, merge, publish, deploy, increase its own budget, expand capabilities, or self-modify.

Augnes should reuse native scheduler and host execution surfaces rather than building a generic scheduler or agent shell.

## Personal Perspective rule

Personal Perspective is not a separate subsystem. It may advance during R2–R8 when it uses the same candidate, review, scoped state, context-selection, receipt, lineage, and feedback paths as project context.

It should remain user-visible, explicitly scoped, removable, and project-selective. Hidden profiles, automatic cross-project injection, and broad Perspective Arena or Personal Vault productization are later work.

## User-effort rule

A required user step is justified only when it is a meaningful project decision or an unavoidable external authorization.

The product should automate:

- DB creation, backup, migration, integrity checking, and recovery
- process, port, and run lifecycle management
- internal IDs, nonces, fingerprints, TTLs, and receipts
- TaskContextPacket delivery and result return
- policy-triggered start, pause, cancel, and reconciliation mechanics
- routine test and qualification mechanics

The user should retain:

- project and task choice, including whether automation is enabled
- acceptance or rejection of semantic changes
- approval of irreversible external actions and authority expansion
- post-Alpha usefulness judgment

## Merge gates

During R2–R8, the normal merge gate is:

- build and type correctness for the changed path
- focused behavior tests
- disposable-database safety where persistence changes
- automated browser coverage where the user flow changes
- shared lifecycle coverage when interactive and automated runs are affected
- no new unauthorized durable write, automation authority expansion, or unbounded external egress

Alpha/RC gates may add short real-user interactive and automated flows, real provider/host round trips, backup/restore rehearsal, and usefulness evaluation.

## Reporting

Reports begin with:

1. what now works or what verified residue was removed
2. how user effort, automation, or product flow improved
3. tests actually run

Then report remaining blockers and compatibility debt.