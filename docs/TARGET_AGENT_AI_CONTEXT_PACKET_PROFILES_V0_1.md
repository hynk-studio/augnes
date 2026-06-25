# Target-Agent AI Context Packet Profiles v0.1

## 1. Purpose

Target-Agent AI Context Packet Profiles are profile-preview-only.

This slice derives target-specific advisory packet profiles for human review, ChatGPT review, Codex handoff review, and dogfooding review. The profile decides which caller-provided lifecycle, calibration, logical claim shape, Feedback-to-Rule, and temporal handoff diagnostic context should be included, emphasized, compressed, omitted, or warned about for each target.

The profile is packet-shaping context only. It does not send a prompt, execute an agent, approve Codex execution, or mutate Augnes state.

## 2. Relationship to the integrated roadmap guide v0.2

It implements Phase 1.6 from the integrated development roadmap guide v0.2.

The primary planning basis is `AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_GUIDE_V0_2_2026-06-25.md`. Older remaining-development, Research/ROI, Temporal Perspective Overlay, and Git Ledger proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship to #762-#767 read-model/diagnostic/handoff slices

The profile builder consumes caller-provided summaries from the merged Phase 1 sequence:

- #762 Lifecycle Read Model
- #763 Calibration Diagnostic
- #764 Logical Claim Shape Preview
- #765 Feedback-to-Rule Candidate Contract
- #766 Feedback-to-Rule Candidate Builder
- #767 Temporal Handoff Diagnostic Sections

Those artifacts remain input signals only. The profile builder only shapes target-agent context around them.

## 4. Scope and non-goals

In scope:

- type contract
- deterministic helper/builder
- public-safe fixture
- smoke validation
- docs pointer
- package script
- index pointer

Out of scope:

- runtime routes
- UI
- DB reads or writes
- DB migrations
- provider/OpenAI calls
- source fetch
- retrieval/RAG execution
- embeddings or vector search
- proof/evidence writes
- Perspective promotion
- durable Perspective state writes
- work mutation
- Codex/GitHub automation
- branch or PR creation
- Git Ledger export
- product write
- product ID allocation
- package dependencies
- GitHub Actions
- CI runtime changes
- automatic handoff execution
- prompt execution
- feedback rule mutation
- parser/helper behavior changes outside the new helper

## 5. Input artifacts

The helper accepts caller-provided targets and artifacts only. The caller supplies:

- target agent and target ref
- optional profile mode
- optional compression level
- requested or omitted section hints
- lifecycle summaries
- calibration diagnostics
- logical claim shapes
- Feedback-to-Rule candidates
- temporal handoff diagnostic sections
- source refs, candidate refs, unresolved tension refs, knowledge gap refs, and review cue refs

The helper does not read files, write files, open a DB, call providers, call GitHub, fetch sources, execute retrieval/RAG, create branches, create PRs, execute Codex, execute prompts, create proof/evidence records, promote Perspective, mutate durable state, or use the current clock.

## 6. Profile report shape

The report uses:

- `target_agent_ai_context_packet_profiles_report.v0.1`
- `project:augnes`
- `profile_preview_only`

Each profile uses:

- `target_agent_ai_context_packet_profiles.v0.1`
- target agent and target ref
- profile mode
- included sections
- omitted sections
- source, candidate, tension, gap, and review cue refs
- reason codes
- boundary notes
- authority boundary

The report includes deterministic target, section, and compression counts plus a SHA-256 fingerprint over canonical JSON excluding the fingerprint field itself.

## 7. Target agent profiles

Supported targets:

- `human_review`
- `chatgpt_review`
- `codex_handoff`
- `dogfooding_review`
- `unknown`

Target aliases are normalized. `human` maps to `human_review`, `chatgpt` maps to `chatgpt_review`, `codex` maps to `codex_handoff`, and `dogfood` maps to `dogfooding_review`. Unknown targets stay bounded and receive only safe profile context.

## 8. Section inclusion rules

The profile includes source refs when source refs exist. It includes lifecycle, calibration, logical shape, Feedback-to-Rule, and temporal handoff diagnostic sections when the corresponding caller-provided artifacts exist. It includes unresolved tension, knowledge gap, and review cue sections when those refs exist. It always includes an authority boundary section.

`codex_handoff` and `dogfooding_review` profiles also include deferred work sections. Requested sections that are unavailable and sections explicitly omitted are summarized through an omitted-context section.

## 9. Compression rules

Default compression is target-specific:

- `human_review` -> balanced
- `chatgpt_review` -> compact
- `codex_handoff` -> minimal
- `dogfooding_review` -> balanced
- `unknown` -> compact

Explicit controlled compression overrides may be used by the caller. Compression is only a packet-shaping hint, not authority.

## 10. Target-specific boundary notes

Context packet profile is advisory, not source of truth.

Codex handoff profile is not execution approval.

Calibration context is diagnostic, not readiness authority.

Logical shape context is structure-only, not proof.

Feedback-to-Rule context is candidate-only, not rule mutation.

Temporal handoff context is diagnostic, not authority.

ChatGPT review profile context is not memory or proof. Dogfooding review profile context is not PR, Codex, or CI report authority.

## 11. Authority boundary

It does not execute prompts.

It does not call provider/OpenAI.

It does not execute Codex.

It does not call GitHub.

It does not create a branch or PR.

It does not fetch sources.

It does not execute retrieval/RAG.

It does not create proof/evidence.

It does not promote Perspective.

It does not mutate durable Perspective state.

It does not mutate work.

It does not export Git Ledger packets.

It does not write product records.

Product-write remains parked by #686.

The authority boundary requires `profile_preview_only: true` and keeps prompt execution, provider/OpenAI call, Codex execution authority, GitHub automation authority, branch/PR creation authority, source of truth, proof/evidence record, Perspective promotion, durable Perspective state, work mutation, source fetch authority, retrieval/RAG authority, Git Ledger export authority, product write authority, and product ID allocation authority false.

## 12. Deferred work

Deferred:

- AI Context Packet runtime UI
- Cockpit lifecycle/calibration/logical preview UI
- Durable Candidate Review Memory
- Source intake runtime
- Provider extraction runtime
- Retrieval/RAG runtime
- Dogfooding ingestion route
- Codex result report ingestion
- Feedback aggregation runtime
- Feedback controls expansion
- Human-reviewed promotion
- Formation Receipt durable write
- Durable Perspective state apply
- Git Ledger export
- Product write reentry

## 13. Verification expectations

The smoke checks the document, fixture, type contract, helper, package script, and index pointer. It imports the helper, rebuilds the fixture report, validates the report, recomputes the fingerprint, checks target/section/compression/reason coverage, verifies safe authority boundaries, guards helper source from runtime/DB/network/GitHub/process patterns, and checks that section summaries do not claim prompt execution, provider call, Codex execution, GitHub PR creation, branch creation, proof/evidence creation, Perspective promotion, state commit, product write, or truth.

Smoke pass is validation signal only, not proof/evidence and not prompt execution.

## 14. Next recommended slices

Next recommended slices:

1. `research_candidate_review_memory_contract_v0_1`
2. `research_candidate_review_memory_store_v0_1`
3. `research_candidate_review_memory_routes_v0_1`
4. `research_candidate_review_memory_ui_v0_1`
5. `foundation_lifecycle_review_memory_readonly_ui_v0_1`

Do not implement those slices in this PR.
