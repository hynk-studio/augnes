# Dogfooding Record Runtime Contract v0.1

## 1. Purpose

Dogfooding Record Runtime Contract is contract-only.

Dogfooding records are bounded review records.

This slice defines public-safe dogfooding signal and review cue shapes for
future ingestion work. It does not ingest records, read runtime logs, persist
dogfooding data, or make product decisions.

Dogfooding records are not raw conversation logs.

Dogfooding records are not hidden reasoning.

Dogfooding records are not telemetry dumps.

Dogfooding records are not truth.

Dogfooding records are not proof.

Dogfooding records are not promotion readiness.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This slice implements `dogfooding_record_runtime_contract_v0_1` from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` as a
contract-only step.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Field, type, enum, and runtime
authority remains with this contract and the existing repo-local SSOT layers.

## 3. Relationship to PR #792 through PR #794

PR #792 Feedback Event Aggregation Runtime defined advisory feedback aggregate
and rule-failure candidate boundaries.

PR #793 Feedback Controls Expansion kept local UI feedback controls
callback-only and read-only.

PR #794 Feedback Influenced Surfacing Preview added preview-only advisory
display hints from public-safe feedback aggregates and rule-failure candidates.

This PR follows those boundaries. It defines dogfooding record shapes that may
reference feedback, surfacing preview, manual anchor, promotion decision,
Formation Receipt, durable state, and trajectory refs as lineage pointers. It
does not add ingestion runtime, persistence, route writes, DB writes, runtime
reads, state mutation, proof/evidence writes, or product-write.

## 4. Scope and non-goals

In scope:

- Type contract for bounded dogfooding records.
- Public-safe fixture with deterministic fingerprints.
- Static smoke validation.
- Docs, package script, and latest-index pointer.

Out of scope:

- Dogfooding ingestion runtime.
- Dogfooding write route.
- Dogfooding read route.
- DB read/write or DB migration.
- Browser log ingestion.
- Session log ingestion.
- Raw conversation ingestion.
- Telemetry ingestion.
- External analytics ingestion.
- Private file reads.
- Source fetch.
- Provider/OpenAI calls.
- Prompt sending.
- Retrieval/RAG execution.
- Durable Perspective state mutation.
- Formation Receipt write.
- Promotion execution or promotion decision write.
- Proof/evidence creation.
- Claim/evidence writes.
- Product write or product ID allocation.
- Git Ledger export.
- Codex/GitHub automation.
- Work mutation, UI controls, background jobs, package dependencies, or GitHub Actions.

Dogfooding records do not mutate candidates.

Dogfooding records do not mutate durable Perspective state.

Dogfooding records do not write Formation Receipts.

Dogfooding records do not promote Perspective.

Dogfooding records do not create proof/evidence.

Dogfooding records do not write claim/evidence records.

Dogfooding records do not product-write.

Product-write remains parked by #686.

This PR does not implement dogfooding ingestion runtime.

This PR does not add dogfooding write route.

This PR does not add dogfooding read route.

This PR does not write DB.

This PR does not read browser logs.

This PR does not read session logs.

This PR does not ingest raw conversations.

This PR does not ingest telemetry.

## 5. Dogfooding signal shape

Dogfooding signals use `dogfooding_signal.v0.1`, `scope: project:augnes`, a
public-safe `signal_id`, a signal kind, surface, surface ref, severity, bounded
summary, lineage ref arrays, privacy class, redaction status, public-safe flag,
reason codes, and authority boundary.

Signal kinds cover usability friction, missing context, wrong surfacing,
confusing labels, broken flows, stale context, source gaps, overreach, latency
observations, trust-boundary confusion, product-write requests, and unknown.

Surfaces cover cockpit, research candidate review, constellation runtime UI,
feedback controls, surfacing preview, manual anchor store, promotion decision,
Formation Receipt, durable state, trajectory, Codex handoff, and unknown.

Source refs are lineage pointers, not proof.

Source refs must be public-safe symbolic refs.

## 6. Review cue shape

Review cues use `dogfooding_review_cue.v0.1`, `scope: project:augnes`, a
public-safe cue id, cue kind, target surface, target surface ref, target signal
refs, bounded summary, severity, `candidate_only: true`, product-write request
flags, reason codes, and authority boundary.

Review cue kinds cover review-needed, evidence-needed, boundary-confusion,
stale-context, source-gap, surfacing, usability, product-write reentry request,
and unknown.

Review cues are candidate-only. They are not proof, evidence, promotion
readiness, durable state, route writes, or product writes.

## 7. Product-write request handling

Product-write requests are review cues only.

Product-write requests do not execute product-write.

Product-write request cues must keep `product_write_request_only: true`,
`product_write_executed: false`, and reason codes for
`product_write_request_recorded_as_review_cue_only`,
`product_write_not_executed`, and `product_write_denied`.

Product-write remains parked by #686.

## 8. Privacy and redaction rules

Fixtures and examples use bounded summaries and public-safe symbolic refs only.
They do not store raw source bodies, raw provider output, raw retrieval output,
raw feedback payloads, raw surfacing payloads, raw dogfooding payloads, raw
conversation logs, hidden reasoning, browser dumps, raw DB rows, actual prompts,
actual queries, telemetry dumps, private URLs, local private paths, tokens, or
secrets.

Blocked examples may use bounded placeholder text only to demonstrate blocked
raw/private or secret-like inputs.

Privacy classes distinguish public-safe summaries, private-ref-only records,
blocked raw private payloads, and blocked secret-like payloads. Redaction
statuses distinguish not-needed, redacted, blocked raw payload,
blocked secret-like pattern, and blocked private location.

Records marked ready_for_future_ingestion must be public-safe and must not
contain blocked raw/private payload signals.

Blocked raw/private examples must remain blocked and must not be marked
ingestion-ready.

## 9. Authority boundary

Every record, signal, review cue, and bundle includes an authority boundary with
`contract_only: true` and all runtime/write/mutation/authority fields false.

The boundary denies dogfooding ingestion runtime, dogfooding routes, dogfooding
record writes, DB query/write, browser log ingestion, session log ingestion,
raw conversation ingestion, telemetry ingestion, external analytics ingestion,
durable state writes/apply, Formation Receipt writes, promotion execution,
promotion decision writes, proof/evidence records, claim/evidence writes,
product writes, product ID allocation, candidate mutation, rule mutation,
parser mutation, work mutation, source fetch, local/repository/uploaded file
reads, provider/OpenAI calls, prompt sending, retrieval execution, RAG answer
generation, embeddings, vector search, Git Ledger export, Codex execution
authority, GitHub automation authority, dogfooding record truth/proof/promotion
authority, raw conversation authority, hidden reasoning authority, telemetry
dump authority, and product-write authority.

## 10. Deferred work

- Dogfooding ingestion runtime.
- Runtime audit panel integration.
- Git Ledger export.
- Product write reentry.
- Release readiness matrix.

## 11. Verification expectations

Verification should run the static smoke for this contract, downstream
feedback/surfacing smokes, typecheck, and diff checks. The smoke should verify
the contract fields, fixture coverage, deterministic fingerprints, docs/index
boundary wording, package script, privacy markers, and authority-boundary false
fields.

Passing smoke is a review cue, not truth or proof.

## 12. Next recommended slices

1. dogfooding_ingestion_runtime_v0_1
2. runtime_audit_panel_v0_1
3. git_ledger_export_contract_v0_1 only after audit/readiness review
4. product_write_reentry_review_v0_1 only after explicit reentry approval
5. release_readiness_matrix_v0_1
