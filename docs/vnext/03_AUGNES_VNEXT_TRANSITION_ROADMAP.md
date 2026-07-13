# Augnes vNext Transition Roadmap

## Objective

Complete one operable product flow while building bounded automation into the same Core path:

```text
Start Augnes
→ select a project
→ start or accept a task
→ compile project context
→ run the native host / Codex interactively or through bounded automation
→ return a structured result
→ review the result
→ approve any durable semantic change
→ reuse the changed context in later work
```

The roadmap is provider-neutral at the Core and uses OpenAI/Codex as the default reference path.

## Transition principles

1. Preserve existing user data, migration history, recovery paths, and working runtime behavior until an explicit replacement is tested.
2. Do not dual-write the same meaning to two authoritative stores.
3. Prefer working vertical slices and behavior tests over planning, preview, boundary, or smoke-only work.
4. Reuse native host task, terminal, browser, diff, PR, worktree, and scheduler UX.
5. Keep irreversible external actions and durable semantic changes under explicit user authority.
6. Internal safety mechanics should be automated; users should not manage DB paths, ports, nonces, fingerprints, TTLs, checksums, or handoff text in the normal product flow.
7. Interactive and policy-triggered runs use the same Core contracts, lifecycle, receipts, and review path.
8. Build the minimal Automation Spine during R2–R8; defer only advanced autonomy and product sprawl.
9. Personal Perspective may progress as a bounded parallel lane when it reuses the existing Core loop and does not block mainline feature completion.
10. Preserve the semantic separation between Evidence, Claim, accepted state, reviewed memory, Perspective, projection, ReviewDecision, and transition. `TaskContextPacket` is selected working context, not project truth; automation may create runs and proposals but does not collapse semantic layers or gain semantic authority.
11. Delete obsolete residue after reference audit. Git history is the archive.

## Immediate freeze

Do not add these by default:

- workflow-stage-specific tables or passive panels
- Codex-only Core contracts
- new manual handoff, copy, or result-paste UX
- native execution or generic scheduler replicas
- repeated boundary copy
- feature-specific package smoke commands
- automatic model routing before a real second adapter exists
- separate Autohunt, automation, Personal Perspective, or Perspective Arena substrates that duplicate Core records and review flows
- unrestricted retry, self-modification, automatic semantic commit, or authority expansion

## Shared Automation Spine

Automation is a core execution mode, not a post-feature add-on. The minimal spine is:

```text
WorkProposal or user-selected task
→ AutomationPolicy evaluation
→ bounded CapabilityGrant
→ Run lifecycle
→ native host / scheduler reference
→ RunReceipt
→ pause / retry / stop / review-needed state
→ EpisodeDeltaProposal
```

It may automate task selection, host start, tests, result intake, and proposal creation within explicit policy and budget. It does not silently approve durable semantic state, merge, publish, deploy, increase budget, or expand its own capabilities.

Augnes does not rebuild a general scheduler. Native scheduled tasks, operating-system schedulers, or host scheduling are referenced through adapters and `ExternalRef`; Augnes owns policy, grants, lineage, receipts, reconciliation, and user control.

## Personal Perspective parallel lane

Personal Perspective remains active as a bounded parallel product lane rather than a mainline prerequisite.

Allowed during R2–R8 when the work reuses existing Core contracts:

- user-created and user-reviewed personal continuity candidates
- source and revision lineage
- project-specific inclusion or exclusion
- context-selection preview and `why_included`
- `TaskContextPacket` use through explicit scope
- later `RunReceipt` and context-use feedback

Do not create a separate persistence, review, context packet, receipt, or outcome subsystem for Personal Perspective. Model-inferred identity, hidden profiles, automatic cross-project injection, Perspective Arena, evolutionary actors, and broad Personal Vault productization remain later work.

## Active implementation sequence

### R1 — Development Authority and Operability Reset

Align README, AGENTS, active vNext guidance, evaluation timing, automation posture, Personal Perspective posture, and repository reduction policy.

Completion:

- active documents agree on R1–R8
- the Automation Spine is active across R2–R8 rather than deferred
- Personal Perspective is a bounded parallel lane rather than a mainline blocker or blanket-deferred feature
- M3D manual pilot is not a normal R2–R8 merge gate
- long manual qualification is moved to Alpha/RC
- normal user effort is treated as a product constraint
- Core semantic layers remain distinct in the active implementation roadmap

### R2 — Zero-config Runtime Spine

Deliver one-command development startup and the foundation for no-command packaged startup.

Scope:

- platform-appropriate data, config, and backup paths
- safe automatic database creation and migration
- backup before migration and original preservation on failure
- runtime and bridge supervision
- port selection, health, status, stop, and child-process cleanup
- deterministic operation without provider credentials
- unattended start, shutdown, crash detection, and run-process supervision primitives

Automation contribution:

- stable runtime lifecycle for interactive and policy-triggered runs
- process ownership and cleanup
- crash and orphan detection hooks

Completion:

- no normal DB reset, path, port, or multi-terminal procedure
- empty environment reaches a ready local UI through one command
- restart, occupied-port, old-schema, child-crash, and orphan-process behavior are automated tests

### R3 — Project Onboarding and Project Home

Scope:

- select a project folder
- infer and persist workspace/project identity
- remove `project:augnes` from the normal path
- remember recent projects
- show current state, pending decisions, automation status, and next moves in Project Home
- treat OpenAI, Codex, GitHub, MCP, and scheduler integrations as lazy capabilities
- project-level automation enablement, pause state, and visible policy summary

Personal Perspective contribution:

- explicit per-project inclusion or exclusion
- no hidden global injection

Completion:

- two projects remain isolated
- starting a project requires folder selection and confirmation, not internal IDs
- automation cannot cross project scope

### R4 — Minimal Model Gateway

Scope:

- common invocation envelope
- OpenAI reference adapter
- bounded egress policy
- timeout and cancellation
- usage, latency, failure, provenance, and budget receipt
- deterministic zero-model fallback
- direct-call bypass detection
- migrate current observe, planner, and temporal interpretation calls

Automation contribution:

- policy-visible model budget
- cancellation and stop propagation
- provider failure surfaced to run lifecycle

Completion:

- all normal remote model calls pass through the Gateway
- interactive and automated calls share the same envelope and receipts
- no automatic multi-provider router

### R5 — Codex Host Round Trip

Scope:

```text
TaskContextPacket
→ Codex/native host
→ execution
→ structured result
→ RunReceipt
→ Augnes
```

Automation contribution:

- interactive and unattended run modes
- bounded approval callback when host tools require it
- timeout, cancel, and stop handling
- scheduler/native-task refs normalized through `ExternalRef`

Completion:

- no manual TaskContextPacket copy
- no manual result paste
- task/session/run refs are normalized
- changed files, checks, status, and bounded result return automatically
- old handoff/result-paste compatibility is removed in the same PR after replacement coverage passes

### R6 — Core Closed Loop and First Bounded Autohunt

Scope:

```text
RunReceipt
→ EpisodeDeltaProposal
→ ReviewDecision
→ semantic transition when approved
→ changed later TaskContextPacket
```

Semantic preservation:

- Evidence remains source-linked support, not accepted project state
- Claims remain revisable and distinguishable from state
- accepted state, reviewed memory, and Perspective retain separate lifecycles
- projections and `TaskContextPacket` remain derived views, not authority
- `ReviewDecision` and durable transition remain distinct

Automation contribution:

- one real bounded policy-triggered work loop
- manual-triggered and policy-triggered runs converge on the same receipt, delta, and review path
- retry only under explicit policy, idempotency, budget, and stop conditions
- no automatic semantic commit

Personal Perspective contribution:

- one bounded context-selection slice may feed a task only after explicit user-reviewed scope
- later receipt and context-use feedback use existing contracts

Completion:

- one automated end-to-end flow uses real writers/readers and disposable data
- one bounded Autohunt path starts, observes, returns, and stops through the shared Core loop
- decision and transition remain distinct
- project isolation, idempotency, replay refusal, stale-state refusal, and lineage are preserved
- semantic layers remain source-linked and are not collapsed into a single generic state record
- usefulness is not yet a merge gate

### R7 — Semantic Workbench and Inspector Consolidation

Scope:

- Semantic Workbench owns active compare, verify, propose, and decide work
- Inspector owns shared detail, provenance, and lineage drill-down
- show automation queue, active run, pause, cancel, retry eligibility, stop reason, and review-needed state
- show Personal Perspective context basis only where it affects the current task
- remove passive workflow-stage panels, duplicate diagnostics, repeated boundary cards, and preview-of-preview UI after destination behavior exists

Completion:

- one coherent golden path replaces the current panel maze
- Project Home, Workbench, and Inspector have distinct roles
- automation state is understandable without exposing internal IDs or protocol mechanics

### R8 — Packaging, Update, Portable Export, Backup, Restore, Recovery, and Run Reconciliation

Scope:

- distributable runtime
- automatic update backup
- transactional migration
- integrity checks
- restore and crash recovery
- provider-neutral portable project export
- explicit separation between portable export and full-fidelity recovery backup
- project-scoped export validation and redaction
- public-safe diagnostics
- restart-time reconciliation for active, completed, failed, cancelled, and orphaned runs
- exact replay handling for returned receipts

Portable export:

```text
redacted
provider-neutral
movable or shareable
reconstructable continuity and lineage
```

Recovery backup:

```text
full-fidelity
local-only
restore-oriented
not a portable sharing format
```

Completion:

- ordinary users do not run migration, checksum, restore, export-repair, or run-repair shell commands
- failed upgrades preserve recoverable data
- portable export and recovery backup have separate contracts and validation
- project export does not leak data from another project
- restart does not duplicate or silently lose an automated run

## Alpha and post-Alpha validation

### Alpha

After the core R2–R8 flow is feature-complete, run short real-user sessions for:

- one interactive task
- one bounded automated task
- one Personal Perspective-assisted task when that parallel slice is ready

The user should perform product work, not a long operator runbook.

### Release candidate

Validate real provider/host round trips, bounded automation, pause/cancel/reconciliation, portable export, backup/restore, secret handling, durable transitions, and recovery using a bounded qualification flow.

### Post-Alpha usefulness

Measure whether Augnes reduces repeated explanation, wrong-context correction, review burden, and time to first correct action compared with using ChatGPT or Codex directly.

Usefulness, long dogfood, and outcome claims do not block ordinary R2–R8 PRs. Personal Perspective usefulness may be evaluated as soon as its bounded slice is operable, without blocking unrelated mainline work.

## Deferred lanes

Deferred until the core product and minimal Automation Spine are feature-complete:

- Generic CLI second adapter
- advanced Autohunt heuristics and autonomous work discovery optimization
- generic scheduler implementation inside Augnes
- unrestricted retry, self-modification, authority expansion, and automatic semantic commit
- broad Personal Vault and Perspective Arena productization
- hidden or automatic cross-project Personal Perspective injection
- advanced multi-provider routing
- autonomous evidence-chain expansion
- long-form qualification infrastructure

Existing Autohunt and Personal Perspective code/data required for the shared Core path or compatibility is preserved and may be simplified into that path. These lanes are not frozen from bounded implementation that directly advances the roadmap above.

## Compatibility and deletion

Classify repository paths using `docs/REPOSITORY_REDUCTION_SCOPE.md`.

- preserve or absorb Autohunt primitives that map to policy, grants, runs, receipts, stop conditions, and reconciliation
- preserve or absorb Personal Perspective primitives that reuse review, scoped state, context selection, lineage, and feedback
- preserve semantic-layer contracts and source/decision lineage used by Evidence, Claim, accepted state, reviewed memory, Perspective, projection, ReviewDecision, and transition
- preserve portable-export foundations separately from recovery-backup foundations
- delete separate preview-only, scheduler-replica, duplicated-contract, historical docs, reports, and one-off verification scaffolding after reference audit
- absorb high-value behavior into canonical test suites
- remove live compatibility only with a tested replacement
- preserve migration and recovery dependencies
- avoid conflicting edits to open PR #1069 until it is resolved

## PR policy

Every PR should answer:

- what step of the active flow now works better
- what interactive, automated, or Personal Perspective path it affects
- what semantic layer it reads or changes and whether authority is preserved
- what user effort was removed or what real invariant was preserved
- what focused tests ran
- what compatibility was removed or remains

The existence of a type, panel, fixture, document, smoke, or PR is not a maturity increase by itself.