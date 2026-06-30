# Augnes Delta Contract v0.1

## 1. Status and Scope

Status:

- repo-local contract/design pointer
- type/fixture/smoke/package-pointer/index-pointer only
- non-SSOT projection contract
- no runtime behavior
- no UI, route, API, DB schema, migration, persistence, MCP/App tool, Codex
  execution, provider/OpenAI call, GitHub actuation, proof/evidence write,
  durable Perspective state apply, product-write, scheduler, autonomy runner,
  merge, publish, retry, replay, deploy, or external side effect

AugnesDelta v0.1 defines the common semantic change unit for Augnes review,
projection, handoff, and future controlled application workflows. It is a
contract vocabulary and TypeScript shape only in this phase.

## 2. Purpose

Augnes needs one common way to describe meaningful change across Perspective,
memory, artifacts, code, research, office material, handoffs, world-state,
validation, user decisions, coordination, and agent plans.

AugnesDelta is that unit. It lets Augnes name what may change, where it came
from, which snapshot or diagnostic informed it, which authority boundary
applies, and whether the delta is only reviewable, manually approvable, or
eligible for future contract-bounded auto-apply.

## 3. Why Augnes Delta Exists

Without a common change contract, each surface risks inventing a separate
change vocabulary:

- code work is represented as a GitHub PR
- research work is represented as diagnostics, source refs, or candidate notes
- Perspective work is represented as snapshots, capsules, overlays, or
  pending state
- handoff work is represented as packets or copied prompts
- memory work is represented as review items or reuse context

Those are useful local artifacts, but they are not the same thing as a common
Augnes semantic change unit.

AugnesDelta is broader than code, PRs, proof, evidence, or work events.
AugnesDelta is a projection/change contract, not source-of-truth state by
itself. GitHub PRs are external review artifacts for code deltas, not the
universal Augnes change unit.

## 4. Relationship to Existing Augnes Concepts

AugnesDelta does not replace existing Augnes concepts.

- PerspectiveSnapshot remains a derived-view read model over existing records.
- Project Constellation remains an interpretive node/edge/capsule model.
- Perspective Capsule / Handoff Capsule remains a bounded review and handoff
  packet.
- EvidenceRef, ArtifactRef, and HandoffRef remain pointers unless a future
  scoped workflow explicitly writes evidence, artifacts, or handoffs through
  authorized paths.
- ResearchDiagnosticRef informs review, but it is not truth, proof, approval,
  readiness, or committed Perspective state.
- GitHub PRs remain code review artifacts for code deltas.
- Work events, action records, proof rows, evidence rows, and state delta
  proposals remain their own records.

AugnesDelta can point at these concepts and can be derived from them, but the
delta is not the canonical record that those systems own.

## 5. Delta Types

v0.1 delta types:

- `perspective_delta`
- `memory_delta`
- `artifact_delta`
- `code_delta`
- `research_delta`
- `office_delta`
- `handoff_delta`
- `world_state_delta`
- `agent_plan_delta`
- `validation_delta`
- `user_decision_delta`
- `coordination_delta`

All meaningful changes should be representable as AugnesDelta, even when the
delta later routes to a more specific review artifact, storage path, or human
decision gate.

## 6. Delta Statuses

v0.1 delta statuses:

- `draft`
- `auto_applied`
- `needs_review`
- `approved`
- `rejected`
- `superseded`
- `deferred`
- `archived`

Status is review metadata for the delta. It does not by itself commit Augnes
state, write proof/evidence, merge a PR, publish externally, update memory, or
apply project Perspective.

## 7. Delta Sources

v0.1 delta sources:

- `manual_user_input`
- `chatgpt_guide`
- `codex_result`
- `agent_run`
- `work_event`
- `coordination_event`
- `state_delta_proposal`
- `state_transition`
- `perspective_snapshot_diff`
- `research_diagnostic`
- `evidence_record`
- `action_record`
- `handoff_packet`
- `dogfooding_record`
- `external_review`
- `unknown`

A source explains where the delta came from. It is not source-of-truth
authority.

## 8. Delta Merge Policy

DeltaMergePolicy describes whether and where a delta may be applied.

v0.1 modes:

- `manual_review_required`
- `auto_apply_within_contract`
- `auto_apply_working_memory_only`
- `review_required_for_durable_memory`
- `review_required_for_project_perspective`
- `blocked`

Required policy fields:

- `mode`
- `target_scope`
- `allowed_auto_apply`
- `requires_user_judgment`
- `requires_fresh_snapshot`
- `requires_validation`
- `durable_memory_allowed`
- `project_perspective_allowed`
- `external_side_effect_allowed`
- `blocked_reason`

Important, durable, irreversible, or boundary-crossing deltas must remain
reviewable. Not all AugnesDelta records require user approval, but durable
Perspective state, durable memory, external side effects, GitHub actuation,
provider calls, proof/evidence writes, and merge/publish/retry/replay/deploy
behavior require explicit future authority outside this Phase 1 contract.

## 9. DeltaBatch

DeltaBatch groups deltas that should be reviewed together.

A batch can represent a perspective update packet, research review packet,
Codex result summary, office-document change set, handoff preparation packet,
or coordination update. The batch is still a projection contract. It is not a
transaction, not a DB write, not a PR, not a proof/evidence bundle, and not a
source-of-truth state commit.

DeltaBatch should preserve:

- batch id and version
- scope
- creation metadata
- batch title and summary
- deltas
- shared snapshot refs
- shared diagnostic refs
- validation summary
- budget summary when relevant
- authority boundary

## 10. ResearchDiagnosticRef

ResearchDiagnosticRef points to a research diagnostic that informed a delta.

Research diagnostics can identify weak signals, trace pressure, source gaps,
staleness, contradictions, or suggested review paths. They are not truth,
proof, approval, readiness, committed Perspective state, source-of-truth state,
Gate/SRF input, Claim confidence, Evidence status, publication readiness,
proposal scoring, or commit/reject input.

## 11. Snapshot / Staleness Semantics

SnapshotRef records the snapshot basis used to form or review a delta.

Snapshot refs should include:

- snapshot id
- snapshot kind
- created at
- source refs
- staleness status
- freshness notes

If a delta depends on a stale or partial snapshot, the merge policy should
require a fresh snapshot before manual approval or any future auto-apply path.
Freshness metadata is review support only. It does not create approval.

## 12. EvidenceRef / ArtifactRef / HandoffRef

EvidenceRef, ArtifactRef, and HandoffRef are pointers.

- EvidenceRef points to an existing evidence, proof, validation, report, or
  review artifact.
- ArtifactRef points to a document, fixture, code artifact, office artifact, or
  other output relevant to the delta.
- HandoffRef points to a handoff packet, capsule, Codex prompt, review packet,
  or operator packet.

Pointers do not create new proof, new evidence, readiness, approval, state
commit, external publication, or merge authority.

## 13. Manual Mode Semantics

manual mode means a human or authorized Augnes Core gate must review the delta
before any durable, irreversible, external, or boundary-crossing change.

Manual mode is required for:

- project Perspective apply
- durable memory mutation
- durable world-state change
- product-write behavior
- proof/evidence writes
- external publication
- GitHub actuation beyond normal Codex PR workflow
- provider/OpenAI calls
- Codex execution
- merge, publish, retry, replay, or deploy behavior

Manual review may approve, reject, defer, archive, or supersede a delta through
a future explicitly scoped implementation. This Phase 1 contract does not add
that implementation.

## 14. Autonomy Mode Semantics

autonomy mode is contract-only in Phase 1.

An autonomy policy may eventually allow narrow deltas to be auto-applied when
they stay inside an explicit future Autonomy Contract. Examples may include
working-memory-only notes, draft handoff cleanup, reversible local
organization, or low-risk validation summaries.

This Phase 1 contract does not implement an autonomy runner, scheduler, daemon,
hidden automation, launch control, merge/publish/retry/replay/deploy behavior,
or external side effect. Autonomy-mode auto-apply semantics require a future
explicit Autonomy Contract before any runtime behavior exists.

## 15. Authority Boundaries

AugnesDelta records must carry explicit authority boundaries.

Authority boundary fields include:

- `source_of_truth`
- `can_commit_or_reject_state`
- `can_record_proof`
- `can_create_evidence`
- `can_update_work`
- `can_mutate_memory`
- `can_apply_project_perspective`
- `can_publish_external`
- `can_merge`
- `can_retry_replay_deploy`
- `can_call_github`
- `can_call_openai_or_provider`
- `can_execute_codex`
- `can_create_branch_or_pr`
- `notes`

In v0.1 fixtures, those capabilities are false. A delta may describe a future
change path, but it does not grant the authority to carry it out.

## 16. Non-Goals

This Phase 1 contract does not add:

- UI changes
- route changes
- API routes
- DB schema or migrations
- persistence
- MCP/App tools
- Codex execution
- GitHub actuation
- provider/OpenAI calls
- source fetching
- retrieval
- proof or evidence writes
- durable Perspective state apply
- product-write behavior
- autonomy runner, scheduler, daemon, hidden automation, or launch controls
- merge/publish/retry/replay/deploy behavior
- external side effects

## 17. Future Phase Handoff

Future phases may define:

- Delta Projection Read Model
- review UI/read surface
- deterministic delta diff builders
- bounded manual approval path
- durable memory review path
- project Perspective apply gates
- explicit Autonomy Contract
- delta-to-PR mapping for code deltas
- delta-to-handoff mapping for handoff deltas

Each future phase must state changed files, authority boundaries, validation,
and non-goals separately.

## 18. Validation and Smoke Plan

Phase 1 validation:

```text
npm run typecheck
npm run smoke:augnes-delta-contract-v0-1
git diff --check
```

The focused smoke is deterministic and static. It checks required file
existence, package/index pointers, contract wording, TypeScript exports,
fixture shape, public-safe authority boundaries, and changed-file scope. It
does not read DB state, call routes, call providers, call GitHub, fetch
sources, write files, record proof/evidence, or apply state.

## 19. Next Phase Readiness Criteria

Phase 2 is ready only when:

- Phase 1 files exist and pass static smoke.
- AugnesDelta types and fixture fields are reviewable.
- Manual and autonomy-mode policy examples are explicit about authority.
- ResearchDiagnosticRef remains non-authoritative.
- Snapshot freshness requirements are visible.
- GitHub PRs remain code-delta review artifacts only.
- The next phase has a separate explicit scope and validation plan.

Recommended next phase: Phase 2 - Delta Projection Read Model.
