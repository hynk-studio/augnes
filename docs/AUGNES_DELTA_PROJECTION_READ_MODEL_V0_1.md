# Augnes Delta Projection Read Model v0.1

## 1. Status and Scope

Status: Phase 2A read-model contract/helper, v0.1.

Scope: project-local Augnes redesign work for projecting existing Augnes source
records into `AugnesDelta[]` and `DeltaBatch[]`.

This phase is read-only. It adds a document, TypeScript projection contract,
pure projector helper, public-safe fixture, static smoke, package script
pointer, and latest-index pointer. It adds no UI, route, API route, DB
schema/migration, DB write, persistence, MCP/App tool, provider/OpenAI call,
GitHub actuation, Codex execution, proof/evidence write, durable Perspective
apply, memory mutation, product-write behavior, scheduler, autonomy runner,
merge/publish/retry/replay/deploy behavior, or external side effect.

## 2. Purpose

`AugnesDeltaProjectionReadModel` is a derived read model that translates
existing Augnes records into the common semantic change language introduced by
`AugnesDelta`.

The read model exists so downstream surfaces can inspect a common projection of
Perspective, memory, artifact, code, research, office, handoff, world-state,
validation, user-decision, coordination, and agent-plan changes without
mutating any source record.

## 3. Relationship to AugnesDelta

`AugnesDelta` remains the semantic change unit. `DeltaBatch` remains the grouped
review/read unit. Phase 2A does not change the Phase 1 contract.

This read model only maps source records into deltas and batches. A projection
does not become source-of-truth state, proof, evidence, approval, readiness, or
apply authority.

## 4. Read Model Shape

`AugnesDeltaProjectionReadModel` includes:

- `runtime: "augnes"`
- `projection_version: "augnes_delta_projection.v0.1"`
- `contract_version: "augnes_delta_contract.v0.1"`
- `scope`
- `as_of`
- `source_refs`
- `source_counts`
- `deltas`
- `batches`
- `gaps`
- `authority_boundary`
- `next_phase_notes`

`source_refs` identifies source records by pointer only. `source_counts`
summarizes projected source family counts. `gaps` records source families or
freshness contexts that were not safely materialized in Phase 2A.

## 5. Projection Source Mapping

### State Delta Proposals

Source kind: `state_delta_proposal`.

Mapped delta source: `state_delta_proposal`.

Mapped type:

- Perspective/project-affecting proposals become `perspective_delta`.
- Memory-like proposals become `memory_delta`.
- Unknown or ambiguous proposals become `coordination_delta`.

Mapped status:

- `pending` becomes `needs_review`.
- `committed` becomes `approved`.
- `rejected` becomes `rejected`.
- Unknown or missing status becomes `draft` or `needs_review`.

Rules:

- Committed proposals must not be recommitted.
- Rejected proposals must not be restored.
- Proposal status becomes delta review metadata only.
- Existing Augnes Core records remain the source of truth.

### Work Events

Source kind: `work_event`.

Mapped delta source: `work_event`.

Mapped type:

- `implementation` becomes `code_delta` or conservative `coordination_delta`.
- `verification` becomes `validation_delta`.
- `review` becomes `user_decision_delta` or `validation_delta`.
- `handoff` becomes `handoff_delta`.
- `decision` becomes `user_decision_delta`.
- `blocked` becomes `coordination_delta`.
- Unknown event types become `coordination_delta`.

Rules:

- WorkEvent is a human-readable trace.
- WorkEvent is not proof, evidence, approval, or readiness.
- `related_pr`, when present, is only an `ArtifactRef` or `EvidenceRef`
  pointer.

### Coordination Events

Source kind: `coordination_event`.

Mapped delta source: `coordination_event`.

Mapped type:

- `handoff_created`, `handoff_ready`, `handoff_delivered`, and
  `handoff_acknowledged` become `handoff_delta`.
- `work_event_recorded` becomes `coordination_delta`.
- `action_result_recorded` becomes `validation_delta` or
  `coordination_delta`.
- `result_review_created` becomes `validation_delta` or
  `user_decision_delta`.
- `publication_*` events become `artifact_delta` or `coordination_delta` with
  blocked external authority.
- `mailbox_*` events become `coordination_delta`.
- Unknown event types become `coordination_delta`.

Rules:

- Coordination event `authority_level` is not delta authority.
- `committed_state` authority level does not let Phase 2 mutate state.
- Publication events are references only, not publish authority.

### Action Records

Source kind: `action_record`.

Mapped delta source: `action_record`.

Mapped type: `validation_delta` or `coordination_delta`.

Rules:

- Action records may inform validation summaries and pointer refs.
- Proof-only action records are not approval.
- Action records do not grant retry, replay, deploy, or merge authority.

### Evidence Records

Source kind: `evidence_record`.

Mapped delta source: `evidence_record`.

Mapped type: `validation_delta`.

Rules:

- `EvidenceRef` remains pointer-only.
- Phase 2A creates no evidence rows.
- Validation pass is not approval.

### Dogfooding Records

Source kind: `dogfooding_record`.

Mapped delta source: `dogfooding_record`.

Mapped type: `research_delta`, `user_decision_delta`, `validation_delta`, or
`coordination_delta`.

Rules:

- Dogfooding records are bounded summaries only.
- The projection does not ingest raw conversations.
- The projection does not expose private payloads.
- The projection performs no product-write execution.
- If no safe structured source is available, the read model records a gap.

### Handoff and Codex Result Traces

Source kind: `handoff_packet` or `codex_result`.

Mapped delta source: `handoff_packet` or `codex_result`.

Mapped type:

- Handoff packets become `handoff_delta`.
- Codex result traces become `code_delta`, `validation_delta`, or
  `coordination_delta`.

Rules:

- Missing traces are gap-reported.
- The projector must not reconstruct missing result text from vibes.
- Handoff and result refs are pointer-only and grant no execution authority.

## 6. Source Refs and Source Counts

`source_refs` records only identifiers and pointer refs. It must not include
raw private conversations, hidden reasoning, secrets, local private paths,
private account artifacts, GitHub tokens, or API keys.

`source_counts` reports source family counts so consumers can distinguish
empty source families from projected source families.

## 7. DeltaBatch Construction

The read model may place projected deltas into one deterministic
`DeltaBatch`. The batch is a projection batch, not an apply batch. Every batch
must include the same explicit authority boundary used by projected deltas.

## 8. Snapshot and Staleness Semantics

When a current `PerspectiveSnapshot` or equivalent read context is available,
the projection should attach a `SnapshotRef`.

If no fresh snapshot is materialized in Phase 2A, the read model must report:

- `code: "snapshot_not_materialized"`
- `severity: "medium"`
- `summary: "Delta projection did not materialize a fresh PerspectiveSnapshot in this phase."`

The projector must not invent persistent-looking snapshot IDs. Synthetic IDs
are allowed only in fixtures and must be marked synthetic/sample.

## 9. Gaps

`gaps` are explicit read-model limitations. They are not failures by default.
They make missing source families, missing snapshots, unsupported record
shapes, or deferred route/source collection clear to downstream consumers.

Gap severities:

- `low`: optional source family or non-blocking enrichment was unavailable.
- `medium`: important context was unavailable but deltas remain inspectable.
- `high`: projection is incomplete enough that a downstream phase should not
  rely on it without more source context.

## 10. Authority Boundary

Every projected `AugnesDelta` and every `DeltaBatch` must include an explicit
authority boundary.

Default authority boundary:

- `source_of_truth`: Existing Augnes source records remain authoritative; this
  delta is a read-only projection.
- `can_commit_or_reject_state: false`
- `can_record_proof: false`
- `can_create_evidence: false`
- `can_update_work: false`
- `can_mutate_memory: false`
- `can_apply_project_perspective: false`
- `can_publish_external: false`
- `can_merge: false`
- `can_retry_replay_deploy: false`
- `can_call_github: false`
- `can_call_openai_or_provider: false`
- `can_execute_codex: false`
- `can_create_branch_or_pr: false`

Authority notes must include read-only projection, pointer-only refs, no
durable apply, no external side effect, no proof/evidence write, and no
source-of-truth claim.

## 11. Conservative Merge Policy

Phase 2A merge policies are conservative and projection-only.

Default projection policy:

- `mode: "manual_review_required"`
- `target_scope: "projection_read_model"`
- `allowed_auto_apply: false`
- `requires_user_judgment`: source-dependent
- `requires_fresh_snapshot: false` unless a project Perspective, durable
  memory, or stale/partial snapshot concern is present
- `requires_validation: false` unless validation/code/handoff claims are
  present
- `durable_memory_allowed: false`
- `project_perspective_allowed: false`
- `external_side_effect_allowed: false`
- `blocked_reason: "Phase 2 projection read model has no apply authority."`

Special cases:

- Project Perspective deltas use
  `review_required_for_project_perspective`.
- Durable memory candidates use `review_required_for_durable_memory`.
- External side-effect candidates use `blocked`.
- Code PR pointers use `manual_review_required`; GitHub PRs are external
  review artifacts for code deltas, not Augnes apply authority.
- Working-memory-only future candidates remain blocked unless a future explicit
  Autonomy Contract exists.

## 12. Manual Mode Semantics

Manual mode means projected deltas are reviewable. It does not mean the
projection can commit, reject, merge, publish, create evidence, record proof,
or apply durable Perspective state.

Important, durable, irreversible, source-of-truth-affecting, or
boundary-crossing deltas remain reviewable.

## 13. Autonomy Mode Semantics

Autonomy mode in Phase 2A is contract-only. The read model may identify future
working-memory-only candidates, but it cannot auto-apply them. A future
explicit Autonomy Contract is required before any auto-apply behavior exists.

## Phase 2B Runtime Read Surface

Phase 2B adds a GET-only read-only runtime read surface:

- `GET /api/augnes/read/deltas?scope=project:augnes`
- Required local/read-only response marker:
  `x-augnes-local-readonly: augnes-delta-projection-v0.1`
- The route requires the `scope` query parameter and fails closed unless the
  scope is exactly `project:augnes`.
- The route uses the existing local/read-only access guard pattern with a
  route-specific marker and no-store response headers.
- The route returns `AugnesDeltaProjectionReadModel` JSON with `runtime`,
  `projection_version`, `contract_version`, `scope`, `as_of`, `source_refs`,
  `source_counts`, `deltas`, `batches`, `gaps`, `authority_boundary`, and
  `next_phase_notes`.

The Phase 2B source collector is read-only. It opens the existing Augnes DB in
SQLite read-only/query-only mode, requires the DB file to already exist, and
does not create DB files, run migrations, create schema, persist records,
mutate source records, append work events, append coordination events, insert
or update state delta proposals, write proof, or write evidence.

Supported source families in Phase 2B:

- `state_delta_proposals` -> `state_delta_proposal` projection inputs.
- `work_events` -> `work_event` projection inputs.
- `coordination_events` -> `coordination_event` projection inputs.
- `action_records` -> `action_record` projection inputs when the table exists.
- `verification_evidence_records` -> `evidence_record` pointer inputs when
  the table exists.
- `dogfooding_records` -> public-safe bounded `dogfooding_record` projection
  inputs when the table exists.
- handoff traces -> derived only from structured handoff coordination event
  refs; packet text is not reconstructed.
- Codex result traces -> derived only from structured Codex work-event result
  refs; result text is not reconstructed.
- Snapshot context -> represented as an in-memory `SnapshotRef` for the current
  read-only DB projection context, not as durable Perspective state.

Gap behavior is explicit. Missing DB files, missing optional source tables,
unreadable source families, absent handoff traces, and absent Codex result
traces are represented as `gaps`; the route does not invent source data.

The Phase 2B route and collector add no writes, no persistence, no external
calls, and no approval/apply/proof/evidence authority. They do not grant merge,
publish, retry, replay, deploy, provider/OpenAI, GitHub, Codex execution,
memory mutation, durable Perspective apply, product-write, scheduler, daemon,
or autonomy runner authority.

## 14. Non-Goals

Phase 2A does not add UI, route changes, API routes, DB schema or migrations,
DB writes, persistence, source record mutation, work event append,
coordination event append, state delta proposal insert/update, proof write,
evidence write, memory mutation, durable Perspective state apply, work status
update, MCP/App tools, Codex execution from Augnes runtime, GitHub calls from
Augnes runtime, provider/OpenAI calls, retrieval, source fetching, scheduler,
daemon, autonomy runner, hidden automation, launch controls, product-write,
merge, publish, retry, replay, deploy, or external side effects.

## 15. Validation and Smoke Plan

The static smoke for Phase 2A must check:

- Required files exist.
- `package.json` contains `smoke:augnes-delta-projection-v0-1`.
- `docs/00_INDEX_LATEST.md` points to this document.
- This document mentions `AugnesDeltaProjectionReadModel`, `AugnesDelta`,
  `DeltaBatch`, `source_refs`, `source_counts`, `gaps`, read-only projection,
  authority boundary, conservative merge policy, and no state mutation.
- Projection types export the expected names.
- Projector helper exports exist.
- Fixture parses as JSON and includes source examples for
  `state_delta_proposal`, `work_event`, and `coordination_event`.
- Fixture includes at least one validation or handoff delta.
- Fixture includes at least one gap.
- Authority boundaries deny writes, execution, external calls, merge, publish,
  retry/replay/deploy, and durable state authority.
- Every merge policy includes `blocked_reason` and keeps apply-authority flags
  false.
- Evidence, artifact, and handoff refs are pointer-only.
- No UI, route, migration, MCP/App tool, provider/OpenAI/GitHub call, Codex
  execution, proof/evidence write, or changed-file boundary drift is present.

## 16. Future Phase Handoff

Phase 2B adds the read-only route and source collector authorized by the
operator prompt. It remains a read-only projection surface and does not apply
or approve deltas.

Phase 3 can consume this read model to build Current Working Perspective v0.1
from deltas, batches, source refs, gaps, and snapshot refs.

## 17. Next Phase Readiness Criteria

Phase 2A is ready for Phase 3 when:

- `AugnesDeltaProjectionReadModel` exists.
- Projection helpers are deterministic and side-effect-free.
- Deltas and batches include explicit source refs and authority boundaries.
- Gaps are explicit for missing snapshots and unsupported source families.
- Merge policies are conservative and include required `blocked_reason`.
- Static smoke and typecheck pass.
- Current Working Perspective can consume deltas, batches, source refs, gaps,
  and snapshot refs without requiring state mutation.
