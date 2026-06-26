# Git Ledger Export Contract v0.1

## 1. Purpose

Git Ledger Export Contract is contract-only.

Ledger packets are review/export candidates.

Ledger packets are not commits.

Ledger packets are not truth.

Ledger packets are not proof.

Ledger packets are not accepted evidence.

Ledger packets are not product-write.

This slice defines public-safe packet, entry, and lineage-ref shapes for a
future Git Ledger export runtime. It does not execute Git, write repository
files, call GitHub, create commits, or create product-write authority.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This implements the `git_ledger_export_contract_v0_1` slice from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` as a
contract-only step after Runtime Audit Panel v0.1.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Field, type, enum, and future runtime
authority remains with this contract and the existing repo-local SSOT layers.

## 3. Relationship to Runtime Audit Panel and prior runtime slices

This slice follows PR #797 Runtime Audit Panel and the bounded runtime chain
from PR #786 through PR #796. Runtime audit refs are review context, not truth.

Runtime audit, dogfooding, feedback aggregation, surfacing preview, durable
state apply, Formation Receipt, promotion decision, manual anchor, trajectory,
provider extraction, and retrieval index refs can appear only as public-safe
symbolic lineage refs in this contract. They do not grant Git export authority,
proof authority, accepted evidence authority, product-write authority, or
durable Perspective state authority.

Smoke/CI pass is not truth.

## 4. Scope and non-goals

In scope:

- Type contract for Git Ledger packets, entries, and lineage refs.
- Public-safe fixture with deterministic fingerprints.
- Static smoke validation.
- Docs, package script, and latest-index pointer.

Out of scope:

- Git Ledger export runtime.
- Git writes.
- Git commit creation.
- Git branch creation.
- Git tag creation.
- GitHub API calls.
- Pull request creation.
- Repository file writes.
- DB read/write.
- Routes or UI.
- Provider/OpenAI calls.
- Prompt sending.
- Retrieval or RAG execution.
- Source fetch or file reads as source input.
- Browser log, session log, raw conversation, hidden reasoning, or telemetry ingestion.
- Durable Perspective state mutation.
- Formation Receipt write.
- Promotion execution or promotion decision write.
- Proof/evidence creation.
- Claim/evidence writes.
- Product write or product ID allocation.
- Codex/GitHub automation.
- Work mutation, background jobs, external network calls, dependencies, or GitHub Actions.

This PR does not implement Git Ledger export runtime.

This PR does not execute Git.

This PR does not create commits.

This PR does not create branches.

This PR does not create tags.

This PR does not call GitHub.

This PR does not create pull requests.

This PR does not write repository files.

This PR does not write DB.

This PR does not mutate durable Perspective state.

This PR does not write Formation Receipts.

This PR does not promote Perspective.

This PR does not create proof/evidence.

This PR does not write claim/evidence records.

This PR does not product-write.

## 5. Ledger packet shape

Ledger packets use `git_ledger_packet.v0.1`,
`git_ledger_export_contract.v0.1`, and `scope: project:augnes`.

A packet carries a status, public-safe packet id, runtime audit refs, ledger
entries, boundary notes, privacy and redaction status, `public_safe`, reason
codes, authority boundary, and a deterministic packet fingerprint.

Packet fingerprints are deterministic canonical JSON over the packet without
`packet_fingerprint`.

## 6. Ledger entry shape

Ledger entries use `git_ledger_entry.v0.1` and `scope: project:augnes`.

An entry carries a public-safe entry id, entry kind, bounded title, bounded
summary, lineage refs, privacy and redaction status, reason codes, and an
authority boundary. Entries are contract records only. They are not commits,
proof, accepted evidence, product writes, or durable state changes.

## 7. Lineage ref shape

Lineage refs use `git_ledger_lineage_ref.v0.1` and `scope: project:augnes`.

A lineage ref carries a public-safe id, lineage kind, bounded summary,
public-safe symbolic source refs, privacy and redaction status, reason codes,
and an authority boundary.

Source refs are lineage pointers, not proof.

Source refs must be public-safe symbolic refs.

## 8. Export status rules

`contract_only` means the packet is present only as a contract fixture.

`candidate_only` means the packet is a bounded review/export candidate.

`ready_for_future_operator_export` means the packet is public-safe and may be
considered by a future export runtime only after explicit operator approval.

Git Ledger export requires future explicit operator action.

`blocked_private_or_raw_payload`, `blocked_missing_lineage`,
`blocked_forbidden_authority`, and `rejected` are blocked or rejected contract
states. Blocked packets must not be treated as ready for export.

## 9. Privacy and redaction rules

Fixtures and examples use bounded summaries and public-safe symbolic refs only.
They do not store raw source bodies, raw provider output, raw retrieval output,
raw ledger payload, raw audit payload, raw dogfooding payload, raw
conversations, hidden reasoning, browser dumps, raw DB rows, actual prompts,
actual queries, telemetry dumps, private URLs, local private paths, tokens, or
secrets.

Blocked examples may use bounded placeholder text only to demonstrate blocked
raw/private or secret-like inputs.

Private/raw, raw conversation, hidden reasoning, telemetry, private URL, local
path, and secret-like examples must remain blocked. They must not be marked
`ready_for_future_operator_export`.

## 10. Authority boundary

Product-write remains parked by #686.

The contract denies Git Ledger export runtime, Git writes, Git commit
creation, Git branch creation, Git tag creation, GitHub API calls, pull request
creation, repository file writes, DB query/write, routes, UI, provider/OpenAI
calls, prompt sending, retrieval execution, RAG answer generation, source
fetch, local/repository/uploaded file reads, browser/session/raw conversation
ingestion, telemetry ingestion, durable state writes/apply, Formation Receipt
writes, promotion execution, promotion decision writes, proof/evidence records,
claim/evidence writes, product writes, product ID allocation, candidate
mutation, rule mutation, parser mutation, work mutation, embeddings, vector
search, Codex execution authority, GitHub automation authority, ledger packet
commit/truth/proof/accepted-evidence/product-write authority, and product-write
authority.

## 11. Deferred work

- Git Ledger export runtime
- Product write reentry
- Release readiness matrix
- Disabled product write adapter reentry harness
- Product write target contract

## 12. Verification expectations

Verification should run the Git Ledger Export Contract smoke, Runtime Audit
Panel downstream smoke, browser/static audit validation, dogfooding and
feedback downstream smokes, typecheck, and diff checks.

The smoke should verify version fields, type union coverage, parsed fixture
coverage, authority boundaries, ready-for-future export safety, blocked packet
state consistency, product-write denial coverage, deterministic packet and
bundle fingerprints, docs/index pointers, package script, privacy boundaries,
and absence of positive authority grants.

## 13. Next recommended slices

1. git_ledger_export_runtime_v0_1 only after explicit export approval
2. product_write_reentry_review_v0_1 only after explicit reentry approval
3. release_readiness_matrix_v0_1
4. disabled_product_write_adapter_reentry_harness_v0_1 only after explicit reentry approval
5. product_write_target_contract_v0_1 only after explicit reentry approval
