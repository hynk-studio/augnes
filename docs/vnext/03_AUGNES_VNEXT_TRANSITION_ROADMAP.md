# Augnes vNext Transition Roadmap

## Objective

Complete one operable product flow before expanding advanced lanes:

```text
Start Augnes
→ select a project
→ start a task
→ compile project context
→ run the native host / Codex
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
4. Reuse native host task, terminal, browser, diff, PR, and worktree UX.
5. Keep irreversible external actions and durable semantic changes under explicit user authority.
6. Internal safety mechanics should be automated; users should not manage DB paths, ports, nonces, fingerprints, TTLs, checksums, or handoff text in the normal product flow.
7. Delete obsolete residue after reference audit. Git history is the archive.

## Immediate freeze

Do not add these by default:

- workflow-stage-specific tables or passive panels
- Codex-only Core contracts
- new manual handoff, copy, or result-paste UX
- custom schedulers or native execution replicas
- repeated boundary copy
- feature-specific package smoke commands
- automatic model routing before a real second adapter exists
- Autohunt, Personal Perspective, or Perspective Arena product expansion before core feature completion

## Active implementation sequence

### R1 — Development Authority and Operability Reset

Align README, AGENTS, active vNext guidance, evaluation timing, and repository reduction policy.

Completion:

- active documents agree on R1–R8
- M3D manual pilot is not a normal R2–R8 merge gate
- long manual qualification is moved to Alpha/RC
- normal user effort is treated as a product constraint

### R2 — Zero-config Runtime Spine

Deliver one-command development startup and the foundation for no-command packaged startup.

Scope:

- platform-appropriate data, config, and backup paths
- safe automatic database creation and migration
- backup before migration and original preservation on failure
- runtime and bridge supervision
- port selection, health, status, stop, and child-process cleanup
- deterministic operation without provider credentials

Completion:

- no normal DB reset, path, port, or multi-terminal procedure
- empty environment reaches a ready local UI through one command
- restart, occupied-port, old-schema, and child-crash behavior are automated tests

### R3 — Project Onboarding and Project Home

Scope:

- select a project folder
- infer and persist workspace/project identity
- remove `project:augnes` from the normal path
- remember recent projects
- show current state, pending decisions, and next moves in Project Home
- treat OpenAI, Codex, GitHub, and MCP as lazy capabilities

Completion:

- two projects remain isolated
- starting a project requires folder selection and confirmation, not internal IDs

### R4 — Minimal Model Gateway

Scope:

- common invocation envelope
- OpenAI reference adapter
- bounded egress policy
- timeout and cancellation
- usage, latency, failure, and provenance receipt
- deterministic zero-model fallback
- direct-call bypass detection
- migrate current observe, planner, and temporal interpretation calls

Completion:

- all normal remote model calls pass through the Gateway
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

Completion:

- no manual TaskContextPacket copy
- no manual result paste
- task/session/run refs are normalized
- changed files, checks, status, and bounded result return automatically
- old handoff/result-paste compatibility is removed in the same PR after replacement coverage passes

### R6 — Core Closed Loop

Scope:

```text
RunReceipt
→ EpisodeDeltaProposal
→ ReviewDecision
→ semantic transition when approved
→ changed later TaskContextPacket
```

Completion:

- one automated end-to-end flow uses real writers/readers and disposable data
- decision and transition remain distinct
- project isolation, idempotency, replay refusal, stale-state refusal, and lineage are preserved
- usefulness is not yet a merge gate

### R7 — Semantic Workbench and Inspector Consolidation

Scope:

- Semantic Workbench owns active compare, verify, propose, and decide work
- Inspector owns shared detail, provenance, and lineage drill-down
- remove passive workflow-stage panels, duplicate diagnostics, repeated boundary cards, and preview-of-preview UI after destination behavior exists

Completion:

- one coherent golden path replaces the current panel maze
- Project Home, Workbench, and Inspector have distinct roles

### R8 — Packaging, Update, Backup, Restore, and Recovery

Scope:

- distributable runtime
- automatic update backup
- transactional migration
- integrity checks
- restore and crash recovery
- public-safe diagnostics

Completion:

- ordinary users do not run migration, checksum, or restore shell commands
- failed upgrades preserve recoverable data

## Alpha and post-Alpha validation

### Alpha

After R2–R8 are feature-complete, run a short real-user flow to find critical workflow breaks. The user should perform the product task, not a long operator runbook.

### Release candidate

Validate real provider/host round trips, backup/restore, secret handling, durable transitions, and recovery using a bounded qualification flow.

### Post-Alpha usefulness

Measure whether Augnes reduces repeated explanation, wrong-context correction, review burden, and time to first correct action compared with using ChatGPT or Codex directly.

Usefulness, long dogfood, and outcome claims do not block ordinary R2–R8 PRs.

## Deferred lanes

Deferred until the core product is feature-complete:

- Generic CLI second adapter
- AutomationPolicy and Autohunt expansion
- Personal Perspective, Personal Vault, and Perspective Arena productization
- advanced multi-provider routing
- autonomous evidence-chain expansion
- long-form qualification infrastructure

Existing data required for compatibility is preserved, but these lanes are frozen from feature expansion.

## Compatibility and deletion

Classify repository paths using `docs/REPOSITORY_REDUCTION_SCOPE.md`.

- delete historical docs, reports, and one-off verification scaffolding after reference audit
- absorb high-value behavior into canonical test suites
- remove live compatibility only with a tested replacement
- preserve migration and recovery dependencies
- avoid conflicting edits to open PR #1069 until it is resolved

## PR policy

Every PR should answer:

- what step of the active flow now works better
- what user effort was removed or what real invariant was preserved
- what focused tests ran
- what compatibility was removed or remains

The existence of a type, panel, fixture, document, smoke, or PR is not a maturity increase by itself.
