# Augnes Research Candidate Review Surface v0.1

## Purpose

This slice defines a candidate-only review surface for manually supplied
source/reference/notes in Augnes Perspective development.

The surface does not make papers, notes, or sessions into durable knowledge. It
prepares reviewable candidates so an operator can inspect source provenance,
claims, evidence, tensions, knowledge gaps, perspective deltas, and follow-up
work before any later human review, promote, or commit path exists.

## Source Work Routing

- Work ID: `AG-RESEARCH-CAPABILITY-LANES-001`
- Scope: `project:augnes`
- Preferred fallback command:
  `npm run codex:next-work -- --scope project:augnes --prefer-research`

`AG-DOGFOOD-RESEARCH-001` remains historical dogfood evidence and is not the
current active research target.

## Relationship To Existing Research Capability Lanes

This contract follows the active product-facing lane preparation in
`docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md`.

It is related to, but does not duplicate, the historical preview vocabulary in
`docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md`.

This PR advances the first recommended product slice named by the Research
Capability Lanes Preparation document.

## Preview Contract

The preview response and fixture are:

- display/review contracts
- candidate-only
- non-authoritative
- not database schemas
- not API route contracts
- not provider prompts
- not extraction pipelines
- not durable memory schemas
- not proof/evidence records
- not work-status mutations
- not perspective promotion authority

These boundaries apply to this slice. They do not permanently ban future
bounded research lanes.

## Candidate Object Families

### research_session_preview

Purpose: summarize one bounded operator-led research review session without
creating durable research state.

Fields:

- `session_id`
- `scope`
- `work_id`
- `research_question`
- `operator_intent`
- `source_refs`
- `claim_candidate_count`
- `evidence_candidate_count`
- `tension_candidate_count`
- `knowledge_gap_candidate_count`
- `perspective_delta_candidate_count`
- `follow_up_work_candidate_count`
- `review_status`
- `boundary_notes`

### source_reference_preview

Purpose: show one manually supplied source/reference/notes item with provenance
and review status, without fetching or enriching it automatically.

Fields:

- `source_ref_id`
- `title`
- `authors_or_origin`
- `identifier_or_url`
- `reference_source`
- `source_status`
- `operator_note_summary`
- `review_status`
- `boundary_notes`

### claim_candidate

Purpose: show a candidate claim extracted or summarized from manually supplied
material without treating it as truth, evidence, or committed perspective
state.

Fields:

- `claim_candidate_id`
- `source_ref_id` or `source_refs`
- `claim_text`
- `claim_type`
- `confidence_label`
- `supporting_evidence_candidate_ids`
- `contradicting_evidence_candidate_ids`
- `review_status`
- `epistemic_status`
- `boundary_notes`

### evidence_candidate

Purpose: show candidate support, contradiction, or context for a claim without
creating proof/evidence records.

Fields:

- `evidence_candidate_id`
- `source_ref_id` or `source_refs`
- `claim_candidate_id`
- `evidence_summary`
- `evidence_role`
- `locator`
- `quality_note`
- `review_status`
- `epistemic_status`
- `boundary_notes`

### tension_candidate

Purpose: show a contradiction, uncertainty, unresolved comparison, or promotion
blocker between candidate claims or evidence.

Fields:

- `tension_candidate_id`
- `source_ref_id` or `source_refs`
- `summary`
- `related_claim_candidate_ids`
- `related_evidence_candidate_ids`
- `tension_type`
- `operator_question`
- `blocks_or_qualifies_promotion`
- `review_status`
- `epistemic_status`
- `boundary_notes`

### knowledge_gap_candidate

Purpose: show missing knowledge that should remain explicit instead of being
filled by inference or provider output.

Fields:

- `knowledge_gap_candidate_id`
- `source_ref_id` or `source_refs`
- `summary`
- `why_it_matters`
- `related_claim_candidate_ids`
- `related_tension_candidate_ids`
- `suggested_next_reading`
- `review_status`
- `epistemic_status`
- `boundary_notes`

### perspective_delta_candidate

Purpose: show a possible future pressure on an existing or future Perspective
without committing any perspective update.

Fields:

- `perspective_delta_candidate_id`
- `target_perspective_key`
- `delta_type`
- `before_summary`
- `after_summary`
- `proposed_update_summary`
- `basis_claim_candidate_ids`
- `basis_evidence_candidate_ids`
- `related_tension_candidate_ids`
- `related_gap_candidate_ids`
- `risk_or_conflict_note`
- `promotion_readiness`
- `review_status`
- `epistemic_status`
- `boundary_notes`

### follow_up_work_candidate

Purpose: show a possible follow-up work item seed without creating a work item,
dispatching Codex, or changing work status.

Fields:

- `follow_up_work_candidate_id`
- `candidate_title`
- `candidate_scope`
- `candidate_summary`
- `reason`
- `suggested_expected_files`
- `suggested_expected_checks`
- `review_status`
- `boundary_notes`

## Perspective Delta Candidate Grammar

`delta_type` values:

- `add`
- `refine`
- `weaken`
- `reverse`
- `split`
- `merge`
- `retire`
- `reweight`
- `reactivate`

`promotion_readiness` values:

- `not_ready`
- `weak_ready`
- `ready_with_tensions`
- `ready`
- `blocked`

A perspective delta candidate is not a committed perspective update. It is a
candidate pressure on an existing or future perspective.

## Review Status And Epistemic Status

`review_status` describes operator/reviewer workflow posture. Recommended
values:

- `candidate_only`
- `needs_review`
- `reviewed_reference_only`
- `rejected`
- `superseded`

`epistemic_status` describes the current knowledge posture of a candidate.
Recommended values:

- `operator_note`
- `candidate_claim`
- `weakly_supported`
- `supported`
- `contested`
- `contradicted`
- `hypothesis_only`
- `promoted`
- `retired`

Reviewed does not mean true.

Supported does not mean promoted.

Candidate does not mean evidence.

## Authority Model

This PR does not implement:

- source fetching
- crawler behavior
- provider/OpenAI call
- embeddings/RAG/vector/FTS/index implementation
- DB migration
- durable research write
- candidate/review record storage
- proof/evidence write
- perspective promotion
- work status mutation
- state commit/reject
- API route changes
- App/MCP tool changes
- automatic Codex execution inside Augnes runtime
- GitHub automation inside Augnes runtime
- package dependency additions

Codex itself may create a branch, commit, push, and open a PR as the
development worker. Augnes runtime code must not implement automatic
GitHub/Codex execution behavior in this PR.

## First User-Facing Surface

A later Cockpit/Perspective read-only preview can show:

- source provenance
- claims
- evidence
- unresolved tensions
- knowledge gaps
- perspective delta candidates
- follow-up work candidates
- authority boundary

This PR does not add that UI yet.

## Fixture Contract

The public-safe fixture is
`fixtures/research-candidate-review.sample.v0.1.json`.

Required object families:

- `research_session_preview`
- `source_reference_previews`
- `claim_candidates`
- `evidence_candidates`
- `tension_candidates`
- `knowledge_gap_candidates`
- `perspective_delta_candidates`
- `follow_up_work_candidates`

Minimum fixture counts:

- at least 1 `source_reference_preview`
- at least 2 `claim_candidates`
- at least 2 `evidence_candidates`
- at least 1 `tension_candidate`
- at least 1 `knowledge_gap_candidate`
- at least 1 `perspective_delta_candidate`
- at least 1 `follow_up_work_candidate`

Every candidate object must include `review_status` and `boundary_notes`.
Claim, evidence, tension, knowledge gap, and perspective delta candidates must
also include `epistemic_status` and `source_ref_id` or `source_refs`.

## Type Contract Pointer

`types/research-candidate-review.ts` is the type-only preview contract for
this surface. It is non-SSOT and non-authoritative.

The type contract is not a DB schema, not an API contract, not runtime
validation, not a provider prompt, not proof/evidence, and not perspective
promotion authority. The static fixture should remain aligned with it through
`smoke:research-candidate-review-types-v0-1`.

## Canonical Promotion Gate Pointer

`docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md` defines a static
audit preventing raw source titles, URLs, provider IDs, raw thread/run/session
IDs, arbitrary user strings, episode IDs, and demo refs from becoming canonical
state labels or operational tags.

The gate is static audit only and non-authoritative. It does not add
runtime/API/DB/provider/retrieval/promotion behavior.

## Cockpit Static Preview Pointer

`components/augnes-cockpit.tsx` renders the Research Candidate Review static
fixture inside the Perspective tab.

The preview uses `fixtures/research-candidate-review.sample.v0.1.json` and
`types/research-candidate-review.ts`. It is read-only, static fixture only, and
non-authoritative.

The preview does not add parser behavior, runtime API routes, DB writes,
provider calls, retrieval indexes, proof/evidence writes, work item creation,
perspective promotion, or Codex execution. It is guarded by
`smoke:research-candidate-review-cockpit-preview-v0-1`.

## Manual Parser Preview Pointer

`lib/research-candidate-review/manual-note-parser.ts` provides a
deterministic preview-only parser for bounded prefix-based manual notes.

The parser converts public-safe manual note text into Research Candidate Review
preview data and uses the type contract from
`types/research-candidate-review.ts`. It is a deterministic parser and
preview-only.

The parser does not fetch sources, call providers, run retrieval, create DB
writes, create proof/evidence rows, create work items, or promote perspective.
It is guarded by `smoke:research-candidate-review-manual-parser-v0-1`.
Boundary shorthand: no provider calls, no retrieval, no DB writes, and no promotion behavior.

The parser fixture pair is
`fixtures/research-candidate-review.manual-note.sample.v0.1.txt` and
`fixtures/research-candidate-review.manual-note-preview.sample.v0.1.json`.

## Parser Output Cockpit Preview Pointer

The parser output Cockpit/Perspective static preview panel in
`components/augnes-cockpit.tsx` renders the manual parser output fixture beside
the original Research Candidate Review static fixture.

The panel uses
`fixtures/research-candidate-review.manual-note-preview.sample.v0.1.json`. It
displays the source input fixture path
`fixtures/research-candidate-review.manual-note.sample.v0.1.txt` as reference
text only.

The panel is read-only and static parser output fixture only. It does not run
the parser in the component.

The panel does not add runtime UI input, API routes, DB writes, provider calls,
retrieval indexes, proof/evidence writes, work item creation, perspective
promotion, or Codex execution. It is guarded by
`smoke:research-candidate-review-parser-output-cockpit-preview-v0-1`.
Boundary shorthand: no runtime UI input, no live parser execution, no provider
calls, no retrieval, no DB writes, and no promotion behavior.

## Candidate Constellation Overlay Pointer

`types/research-candidate-constellation-overlay.ts` defines the type-only
overlay contract.

`lib/research-candidate-review/constellation-overlay.ts` builds a deterministic
read-only overlay from Research Candidate Review preview data.

`fixtures/research-candidate-review.constellation-overlay.sample.v0.1.json`
contains the original static fixture overlay.

`fixtures/research-candidate-review.manual-note-constellation-overlay.sample.v0.1.json`
contains the manual parser output overlay.

`components/research-candidate-constellation-overlay-preview.tsx` renders
overlay diagnostics, candidate nodes, and typed edges read-only.

`components/augnes-cockpit.tsx` shows the Candidate Constellation Overlay preview
in the Perspective tab.

This is not graph DB, not layout, not embeddings, not retrieval, not
proof/evidence, not work item creation, and not perspective promotion. It adds
no runtime/API/DB/provider/retrieval/promotion behavior.

It is guarded by
`smoke:research-candidate-review-constellation-overlay-v0-1`.

## PerspectiveGeometryDigest Builder v0.1 Pointer

`types/perspective-geometry-digest.ts` defines the advisory-only
PerspectiveGeometryDigest contract.

`lib/research-candidate-review/perspective-geometry-digest.ts` builds a
deterministic read-only digest from Candidate Constellation Overlay fixture
data.

`fixtures/research-candidate-review.perspective-geometry-digest.sample.v0.1.json`
contains the original static overlay digest.

`fixtures/research-candidate-review.perspective-geometry-digest.manual-parser.sample.v0.1.json`
contains the manual parser overlay digest.

Candidate Constellation Overlay can now be summarized into
PerspectiveGeometryDigest for AI-usable structure without exposing layout
coordinates as truth. The digest is derived/advisory only. It is not source of
truth, proof, evidence, durable Perspective state, retrieval result, or agent
execution authority.

This adds no provider/OpenAI call, no source fetch, no retrieval or indexing
execution, no route/UI behavior, no DB/SQL/transaction,
no proof/evidence write, no work item creation, no durable Perspective
promotion, and no product write. Product-write remains parked by the #686
stopline. Next recommended slice:
`agent_perspective_substrate_docs_type_fixture_v0_1`.

It is guarded by
`smoke:research-candidate-review-perspective-geometry-digest-v0-1`.

## AI Context Packet Preview Pointer

`types/research-candidate-ai-context-packet.ts` defines the type-only packet
contract.

`lib/research-candidate-review/ai-context-packet.ts` builds a deterministic
read-only handoff packet from Candidate Constellation Overlay data.

`fixtures/research-candidate-review.ai-context-packet.sample.v0.1.json`
contains the original overlay packet.

`fixtures/research-candidate-review.manual-note-ai-context-packet.sample.v0.1.json`
contains the manual parser overlay packet.

`components/research-candidate-ai-context-packet-preview.tsx` renders packet
diagnostics, summaries, guardrails, and authority read-only.

`components/augnes-cockpit.tsx` shows the Research Candidate AI Context Packet
preview in the Perspective tab.

This is not provider prompt execution, not Codex execution, not retrieval, not
durable memory, not proof/evidence write, not work item creation, and not
perspective promotion. It adds no runtime/API/DB/provider/retrieval/promotion
behavior.

It is guarded by `smoke:research-candidate-review-ai-context-packet-v0-1`.

## Formation Receipt Preview Pointer

`types/research-candidate-formation-receipt.ts` defines the type-only receipt
contract.

`lib/research-candidate-review/formation-receipt.ts` builds a deterministic
read-only receipt from AI context packet and Candidate Constellation Overlay
data.

`fixtures/research-candidate-review.formation-receipt.sample.v0.1.json`
contains the original packet receipt.

`fixtures/research-candidate-review.manual-note-formation-receipt.sample.v0.1.json`
contains the manual parser packet receipt.

`components/research-candidate-formation-receipt-preview.tsx` renders receipt
diagnostics and contributions read-only.

`components/augnes-cockpit.tsx` shows the Formation Receipt preview in the
Perspective tab.

This records source refs, candidate nodes, typed edges, AI context packet
sections, and guardrails as read-only contribution data.

This is not durable receipt storage, not an event log, not proof/evidence
write, not work item creation, and not perspective promotion. It adds no
runtime/API/DB/provider/retrieval behavior.

It is guarded by `smoke:research-candidate-review-formation-receipt-v0-1`.

Closeout pointer: `docs/RESEARCH_CANDIDATE_REVIEW_V0_1_CLOSEOUT.md` closes
the v0.1 preview milestone and points to the next manual preview UI lane.

## Expected Files And Checks

Expected files:

- `components/research-candidate-formation-receipt-preview.tsx`
- `components/research-candidate-ai-context-packet-preview.tsx`
- `components/research-candidate-constellation-overlay-preview.tsx`
- `components/augnes-cockpit.tsx`
- `docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md`
- `docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md`
- `lib/research-candidate-review/formation-receipt.ts`
- `lib/research-candidate-review/ai-context-packet.ts`
- `lib/research-candidate-review/constellation-overlay.ts`
- `lib/research-candidate-review/manual-note-parser.ts`
- `types/research-candidate-formation-receipt.ts`
- `types/research-candidate-ai-context-packet.ts`
- `types/research-candidate-constellation-overlay.ts`
- `types/research-candidate-review.ts`
- `fixtures/research-candidate-canonical-promotion-gates.sample.v0.1.json`
- `fixtures/research-candidate-review.formation-receipt.sample.v0.1.json`
- `fixtures/research-candidate-review.ai-context-packet.sample.v0.1.json`
- `fixtures/research-candidate-review.constellation-overlay.sample.v0.1.json`
- `fixtures/research-candidate-review.manual-note-formation-receipt.sample.v0.1.json`
- `fixtures/research-candidate-review.manual-note-ai-context-packet.sample.v0.1.json`
- `fixtures/research-candidate-review.manual-note-preview.sample.v0.1.json`
- `fixtures/research-candidate-review.manual-note-constellation-overlay.sample.v0.1.json`
- `fixtures/research-candidate-review.manual-note.sample.v0.1.txt`
- `fixtures/research-candidate-review.sample.v0.1.json`
- `scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs`
- `scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs`
- `scripts/smoke-research-candidate-review-cockpit-preview-v0-1.mjs`
- `scripts/smoke-research-candidate-review-constellation-overlay-v0-1.mjs`
- `scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs`
- `scripts/smoke-research-candidate-review-parser-output-cockpit-preview-v0-1.mjs`
- `scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs`
- `scripts/smoke-research-candidate-review-surface-v0-1.mjs`
- `scripts/smoke-research-candidate-review-types-v0-1.mjs`
- `docs/00_INDEX_LATEST.md`
- `package.json`

Expected checks:

- `node scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs`
- `node scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs`
- `node scripts/smoke-research-candidate-review-cockpit-preview-v0-1.mjs`
- `node scripts/smoke-research-candidate-review-constellation-overlay-v0-1.mjs`
- `node scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs`
- `node scripts/smoke-research-candidate-review-parser-output-cockpit-preview-v0-1.mjs`
- `npm run smoke:research-candidate-review-formation-receipt-v0-1`
- `npm run smoke:research-candidate-review-ai-context-packet-v0-1`
- `npm run smoke:research-candidate-review-cockpit-preview-v0-1`
- `npm run smoke:research-candidate-review-constellation-overlay-v0-1`
- `npm run smoke:research-candidate-review-manual-parser-v0-1`
- `npm run smoke:research-candidate-review-parser-output-cockpit-preview-v0-1`
- `node scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs`
- `node scripts/smoke-research-candidate-review-types-v0-1.mjs`
- `node scripts/smoke-research-candidate-review-surface-v0-1.mjs`
- `git diff --check`
- `npm run smoke:research-capability-lanes-preparation-v0-1`
- `npm run smoke:codex-worker-bootstrap-v0-1`

## Scoped Stop Conditions

Codex must stop and report if this PR would require:

- source fetching
- crawler behavior
- provider/OpenAI call
- embeddings/RAG/vector/FTS/index implementation
- DB migration
- durable research write
- candidate/review record storage
- proof/evidence write
- perspective promotion
- work status mutation
- state commit/reject
- API route changes
- App/MCP tool changes
- automatic Codex execution inside Augnes runtime
- GitHub automation inside Augnes runtime
- package dependency additions

## What This Slice Implements

This slice implements only:

- docs contract
- public-safe fixture
- static smoke
- package script pointer
- docs index pointer

## What This Slice Does Not Implement

This slice does not implement source fetching, crawler behavior,
provider/OpenAI calls, embeddings/RAG/vector/FTS/indexing, DB migrations,
durable research writes, candidate/review record storage, proof/evidence
writes, perspective promotion, work status mutation, state commit/reject, API
routes, App/MCP tool changes, package dependencies, or automatic Codex/GitHub
automation inside Augnes runtime.

## Next Recommended Step

Add Cockpit manual pasted note preview UI shell using the existing
deterministic parser in a preview-only, read-only path.
