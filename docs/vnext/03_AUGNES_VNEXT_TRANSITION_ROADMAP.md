# Augnes vNext Transition Roadmap

## Objective

Complete one operable product flow while building bounded automation into the same Core path:

```text
Start Augnes
→ select a project
→ start or accept a task
→ compile project context
→ run the native host / Codex interactively or through bounded automation
→ RunReceipt
→ source-linked assessment/comparison
→ EpisodeDeltaProposal
→ ReviewDecision
→ authorized Transition
→ later TaskContextPacket
→ later ContextUseReview feedback
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
11. Required criterion assessment and optional bounded strategic advantage transfer
    share the same non-authoritative R6 boundary. Strategic transfer is not an
    Arena, durable actor system, separate engine, or authority layer.
12. Delete obsolete residue after reference audit. Git history is the archive.

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
- a separate StrategicCompetitionEngine, actor registry, debate store, or automatic strategy winner
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

Status: complete on current main. R5 is the operational round trip consumed by
R6; this roadmap does not reopen its implementation or contracts.

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
TaskContextPacket intent
+
RunReceipt operational residue
→ source-linked, non-authoritative assessment/comparison
→ EpisodeDeltaProposal
→ ReviewDecision
→ authorized Transition
→ changed later TaskContextPacket
```

Semantic preservation:

- task goal and success criteria are compared with concrete observations,
  attestations, checks, skipped checks, changed artifacts, gaps, and uncertainty
- each criterion preserves satisfied, unsatisfied, unknown, or not-applicable
  status; insufficient support remains unknown
- observed, attested, mixed, and insufficient basis remain distinguishable
- Evidence remains source-linked support, not accepted project state
- Claims remain revisable and distinguishable from state
- accepted state, reviewed memory, and Perspective retain separate lifecycles
- projections and `TaskContextPacket` remain derived views, not authority
- `ReviewDecision` and durable transition remain distinct

`criterion_assessment` is the required profile. Optional bounded
`strategic_advantage_transfer` runs inside the same source-linked,
non-authoritative boundary only when a concrete base strategy and exact working
frame can be bound. These are working names and internal R6 slices, not new
top-level phases, durable protocol types, or authority layers.

#### R6-A — Source-linked criterion assessment

Scope:

- load the persisted packet and applicable receipt with exact project, ID, and fingerprint binding
- assess every success criterion against observations, attestations, checks,
  skipped checks, artifacts, gaps, and uncertainty
- preserve criterion status, assessment basis, residue provenance/trust,
  concrete supporting/opposing/missing refs, and uncertainty as separate axes
- start with a pure, non-durable, deterministic path

Completion:

- exact packet/receipt binding and project isolation are enforced
- insufficient support remains `unknown`; output is deterministic and bounded
- `completed` does not equal task success and skipped checks do not satisfy criteria

#### R6-B — Production proposal creation

Scope:

- convert source-linked assessment material into a real `EpisodeDeltaProposal`
- use one proposal admission authority with exact replay and conflict handling
- feed the existing semantic-review queue and Workbench consumer
- use the same path for interactive and policy-triggered work and retain zero-model support

Completion:

- a real R5 receipt creates a real reviewable proposal through existing production writers/readers
- pending assessment or proposal does not change later context
- no second proposal store, queue, or review path exists

#### R6-C — Operation-aware review and Transition closure

The intended operation mapping is:

```text
add                → create
revise             → replace
supersede          → supersede
retract / remove   → retract
no-change / unknown → no Transition
```

Scope:

- expand beyond the current narrow accept/create/absent-target pilot
- validate current state, exact target revision, prior applied lineage, gate,
  authorized after-state, replay behavior, and project scope
- close proposal → decision → gate → Transition → later packet without collapsing steps

Completion:

- each supported operation applies only its authorized effect and refuses stale state
- decision alone is not applied as Transition; no-change and unknown create no Transition
- later packet selection changes only after the authorized Transition is durable

#### R6-D — Strategic advantage-transfer profile

Scope:

- bind a source-backed base strategy to exact packet ID/fingerprint, applicable
  receipt ID/fingerprint, project, task goal/success criteria, base source
  refs/fingerprint, profile/version, and bounded budget
- use at most three ephemeral, bounded strategic lenses in the initial profile
- generate challenger strategy candidates and extract local advantages with
  applicability condition, expected effect, transfer cost, concrete source refs,
  falsifier, uncertainty, and introduced/transferred risks
- express a source-linked patch candidate against the base and perform regression review
- normalize only reviewable material into existing proposal material lanes and delta types
- present candidate-level human review; do not select a global winner or consensus

Initial restrictions:

- one provider/model path and one bounded invocation, or a small fixed call graph
  justified by the implementation PR
- no free-form debate, persistent actors, actor/session/debate store, automatic
  winner, automatic semantic commit, automatic context injection, or Arena UI
- model confidence, agreement, agent count, provider count, and strategic score
  are not semantic authority

Completion:

- exact base binding is enforced and a stale or changed base invalidates the patch candidate
- no source-less transfer is admitted; insufficient support remains `unknown`
  and is normally downgraded to `research_delta` or `validation_delta`
- regression material and bounded stop/budget reason are preserved
- unavailable model enrichment retains the base zero-model R6 loop

#### R6-E — Bounded automation and feedback closure

Scope:

- run one real bounded policy-triggered work loop through run → receipt →
  assessment → pending proposal automation, then stop at review
- after an authorized Transition, compile a later packet, run later work, and
  record `ContextUseReview` feedback
- retain explicit policy, idempotency, timeout, cancellation, retry budget, and stop conditions

Completion:

- interactive and policy-triggered paths have assessment/proposal/review/transition parity
- there is no automatic acceptance, unauthorized retry, budget increase, or scope expansion
- later helpful, stale, or misleading feedback is traceable to the accepted material and exact lineage
- restart, replay, cancellation, budget, and stop behavior remain bounded

Personal Perspective contribution:

- one bounded context-selection slice may feed a task only after explicit user-reviewed scope
- later receipt and context-use feedback use existing contracts

R6 overall completion:

- one automated end-to-end flow uses real writers/readers and disposable data
- one bounded Autohunt path starts, observes, returns, and stops through the shared Core loop
- host completion and task success remain distinct
- success criteria are assessed against concrete operational residue and
  insufficient support remains `unknown`
- every semantic delta and strategic transfer item has concrete source anchors;
  `RunReceipt` summary alone cannot authorize or justify semantic change
- host/model-proposed next steps and strategy patches remain advisory unless
  separately admitted through the proposal path
- `RunReceipt` alone, assessment alone, and pending `EpisodeDeltaProposal` do
  not change later `TaskContextPacket`
- `ReviewDecision` alone does not equal an applied Transition
- only an authorized Transition changes durable semantic state and later
  `TaskContextPacket` selection
- project isolation, exact lineage, replay refusal, stale-state/base refusal,
  and idempotency are preserved
- interactive and policy-triggered work converge on the same assessment,
  proposal, review, transition, later-packet, and feedback path
- semantic layers remain source-linked and are not collapsed into a generic state record
- no automatic semantic commit; usefulness is not yet an ordinary merge gate

### R7 — Semantic Workbench and Inspector Consolidation

Scope:

- Semantic Workbench is decision-centered, not ontology-centered; it owns active
  compare, verify, propose, and decide work
- Workbench presents semantic delta, basis, limitations, and the consequence of
  approval, rejection, or deferral
- for strategic material, Workbench presents intent, residue, criterion
  assessment, source-bound base strategy, challenger, condition-bound local
  advantage, patch, transfer cost, falsifier, uncertainty, regression, decision
  consequence, and later-context consequence
- strategic review supports candidate-level accept, reject, edit, or defer;
  frame challenge remains distinct from within-frame strategy challenge
- Inspector owns typed-record, source-map, epistemic-basis, authority, provenance,
  and lineage drill-down
- Project Home shows strategic attention and pending-decision summary only;
  protocol IDs, fingerprints, and exact bindings belong in Inspector drill-down
- show automation queue, active run, pause, cancel, retry eligibility, stop reason, and review-needed state
- show Personal Perspective context basis only where it affects the current task
- remove passive workflow-stage panels, duplicate diagnostics, repeated boundary cards, and preview-of-preview UI after destination behavior exists
- do not make users manage internal IDs, graph edges, protocol objects, or
  ontology administration

Default Workbench review flow:

1. What was intended.
2. What was observed or reported.
3. Which success criteria are satisfied, unsatisfied, unknown, or not applicable.
4. What semantic delta is proposed.
5. Which sources support or oppose it.
6. What remains uncertain.
7. What approving, rejecting, or deferring would change.
8. Whether and how later context would change after an authorized Transition.

When an optional strategic profile exists, steps 4–7 also show which local
advantage is proposed for transfer, its applicability, cost, falsifier and risk,
the patch/regression material, and what remains rejected or disputed. The user
does not manage lenses, actors, graph edges, or strategy IDs.

Completion:

- one coherent golden path replaces the current panel maze
- Project Home, Workbench, and Inspector have distinct roles
- automation state is understandable without exposing internal IDs or protocol mechanics
- host completion is visibly distinct from task success
- residue provenance/trust distinguishes direct local observation, verified
  external observation, host attestation, provider report, and derived interpretation
- criterion assessment basis distinguishes observed, attested, mixed, and insufficient
- criterion status distinguishes satisfied, unsatisfied, unknown, and not applicable
- semantic deltas and decision consequences are understandable without opening
  raw protocol records
- each meaningful change can drill down to source and lineage
- Inspector can trace success criterion → assessment →
  observation/attestation/check/artifact → `RunReceipt` → run →
  `TaskContextPacket` → selected context/source
- after proposal, Inspector can trace semantic delta → supporting/opposing/missing
  refs → `ReviewDecision` → Transition → later `TaskContextPacket`
- for strategic material, Inspector can trace base strategy/source/fingerprint →
  advantage and applicability → patch/regression candidate → proposal →
  decision → Transition → later packet → `ContextUseReview`
- critical review is possible without displaying every provenance object by default
- no new panel maze, workflow-stage table family, ontology editor, generic
  graph-management UI, or Arena surface

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

- is redacted, provider-neutral, movable or shareable, and reconstructs
  continuity and lineage
- when implemented and applicable, preserves canonical project/workspace
  identity, project scope, record contract/version, canonical Evidence, Claim,
  state and memory records and, where implemented and canonical, durable
  Perspective records with their revision lineage, plus `RunReceipt`,
  `EpisodeDeltaProposal`, `ReviewDecision`, `StateTransitionReceipt`, source
  anchors, temporal/lifecycle status, integrity, and provider-neutral `ExternalRef`
- preserves each implemented record's exact lifecycle values and
  epistemic/authority classification; candidate, reviewed, accepted, rejected,
  deferred, superseded, retracted, and applied are illustrative distinctions,
  not a newly approved universal lifecycle enum
- preserves relation-assertion source, scope, basis and revision lineage only
  when that relation is an implemented canonical record; this roadmap does not
  pre-authorize unimplemented semantic concepts as export truth
- includes enough exact lineage to reconstruct continuity and derived views
- where strategic material has been normalized into an implemented canonical
  proposal, preserves its base/source binding, material, exact lifecycle and
  authority classification, and advantage → candidate → decision → Transition
  → later packet → feedback lineage
- requires explicit consent and sharing scope before any later-implemented
  Personal Perspective material enters a portable export

Rebuildable, non-authoritative projection data:

- Current Working Perspective rendering
- semantic assessment/comparison projection
- ephemeral strategic lenses and base/challenger comparison rendering
- strategic transfer ledger, patch/regression summary, and candidate ordering
- Workbench summaries and attention ranking
- Inspector grouping/layout and graph coordinates
- search ranking, display badges, and recommendation ordering

If cached or exported, these are explicitly marked `derived`,
`non-authoritative`, `rebuildable`, and `source-bound`.

Recovery backup:

- is local-only, restore-oriented, and not a portable sharing format
- preserves full fidelity to legitimately persisted durable Augnes state
- does not broaden fidelity into collection of raw prompts, transcripts, hidden
  reasoning, raw strategic reasoning or provider/challenger output, credentials, or other
  material Augnes intentionally does not persist

Completion:

- ordinary users do not run migration, checksum, restore, export-repair, or run-repair shell commands
- failed upgrades preserve recoverable data
- portable export and recovery backup have separate contracts and validation
- export/import preserves each implemented record's exact lifecycle values and
  epistemic/authority classification: candidate material does not become
  accepted, `ReviewDecision` does not become Transition, and superseded or
  retracted material does not silently reactivate
- derived assessment does not become canonical state
- export/import or restore creates no new Decision or Transition
- exact replay does not duplicate proposal, decision, or transition
- exact replay does not duplicate normalized strategic proposals, feedback, or transitions
- project export does not leak data from another project and cross-project refs
  remain rejected
- rebuilt Project Home, Workbench, and Inspector projections agree with restored
  canonical records
- ephemeral lenses, comparison layouts, and strategic rankings rebuild as
  non-authoritative projections and cannot promote candidate material
- restart does not duplicate or silently lose an automated run

## Alpha and post-Alpha validation

### Alpha

After the core R2–R8 flow is feature-complete, run short real-user sessions for:

- one interactive task
- one bounded automated task
- one source-bound strategic-review task after R6-D is feature-complete
- one Personal Perspective-assisted task when that parallel slice is ready

The user should perform product work, not a long operator runbook.

### Release candidate

Validate real provider/host round trips, bounded automation, pause/cancel/reconciliation,
one bounded strategic transfer/regression path, portable export, backup/restore,
secret handling, durable transitions, and recovery using a bounded qualification flow.

### Post-Alpha usefulness

Measure whether Augnes reduces repeated explanation, wrong-context correction, review burden, and time to first correct action compared with using ChatGPT or Codex directly.
For completed strategic features, compare a single-strategy baseline, ordinary
critique/debate, and the Augnes advantage-transfer loop on the same source-bound
task; track accepted/rejected edits, harmful transfer, regression escape, later
outcome, cost, and latency.

Usefulness, long dogfood, and outcome claims do not block ordinary R2–R8 PRs. Personal Perspective usefulness may be evaluated as soon as its bounded slice is operable, without blocking unrelated mainline work.

## Deferred lanes

Deferred until the core product and minimal Automation Spine are feature-complete:

- Generic CLI second adapter
- advanced Autohunt heuristics and autonomous work discovery optimization
- generic scheduler implementation inside Augnes
- unrestricted retry, self-modification, authority expansion, and automatic semantic commit
- broad Personal Vault and Perspective Arena productization
- persistent strategic/Perspective actors, actor mutation/branching/merging,
  population evolution, resource bidding, and hidden cross-project actors
- unrestricted debate, automatic winner/fitness selection, consensus or
  model-count promotion, and automatic strategy mutation
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
