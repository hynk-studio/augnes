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

## Agent Perspective Substrate v0.1 Pointer

`docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md`,
`types/agent-perspective-substrate.ts`, and
`fixtures/agent-perspective-substrate.sample.v0.1.json` define the M10
docs/type/fixture/smoke substrate slice. PerspectiveGeometryDigest can now feed
Agent Perspective Substrate as advisory input.

The substrate remains a folded advisory layer. It is not source of truth,
proof, evidence, durable Perspective state, execution authority, agent routing,
retrieval result, or product write authority. It may prepare warning,
comparison, compression, stale-context, handoff, capsule, and retrieval-hint
previews only as non-executing advisory material.

Every surfaced warning, suggestion, blocker, or handoff improvement must carry
`source_refs` or an explicit source coverage boundary note, `why_now`,
epistemic/review status, and `authority_boundary_notes`.

This adds no runtime route/UI behavior, no DB/SQL/transaction, no
provider/OpenAI call, no source fetch, no retrieval execution or indexing implementation, no proof/evidence write, no work
mutation or work item creation, no durable Perspective promotion, no agent
execution/routing, no MCP/App tool widening, and no product write.
Product-write remains parked by the #686 stopline. Next recommended slice:
`agent_perspective_substrate_preview_builder_v0_1`.

## Agent Perspective Substrate Preview Builder v0.1 Pointer

`types/agent-perspective-substrate-preview.ts`,
`lib/research-candidate-review/agent-perspective-substrate-preview.ts`, and
`fixtures/agent-perspective-substrate-preview.sample.v0.1.json` define the
M11 pure type/builder/fixture/smoke preview builder. It consumes the #688 Agent
Perspective Substrate fixture as advisory input and folds surfacing candidates
into folded-by-default audit sections, preview cards, rule groups, source
coverage preview, diagnostics, and an advisory-only authority boundary.

Every preview card preserves `source_refs` or an explicit source coverage
boundary note, `epistemic_status`, `review_status`, `why_now`, and
`authority_boundary_notes`. The preview remains a folded advisory projection:
not source of truth, proof/evidence, durable Perspective state, execution
authority, retrieval execution, agent routing, or product write authority.

This adds no runtime route/UI yet, no API route, no UI/component change, no
DB/SQL/transaction, no provider/OpenAI call, no source fetch, no retrieval
execution or indexing implementation, no proof/evidence write, no work
mutation or work item creation, no durable Perspective promotion, no agent
execution/routing, no MCP/App tool widening, and no product write.
Product-write remains parked by the #686 stopline. Next recommended slice:
`cockpit_agent_perspective_substrate_folded_audit_panel_v0_1`.

## Cockpit Agent Perspective Substrate folded audit panel v0.1 Pointer

`components/agent-perspective-substrate-folded-audit-panel.tsx` displays the
#689 Agent Perspective Substrate Preview fixture in Cockpit as a folded audit
panel. The panel consumes static advisory input only, keeps folded state local
to the component, and renders source coverage, surfacing cards, rule groups,
diagnostics, and authority boundaries with no durable feedback persistence and
no feedback persistence.

Every card continues to require `source_refs` or a source coverage boundary
note, `epistemic_status`, `review_status`, `why_now`, and
`authority_boundary_notes`. The panel remains preview UI only: not source of
truth, proof/evidence, durable Perspective state, execution authority,
retrieval execution, agent routing, product write, or feedback persistence.

This adds no API route, no server action, no DB/SQL/transaction, no
provider/OpenAI call, no source fetch, no retrieval execution or indexing
implementation, no proof/evidence write, no work mutation or work item
creation, no durable Perspective promotion, no agent execution/routing, no
MCP/App tool widening, and no product write. Product-write remains parked by
the #686 stopline. Next recommended slice:
`ai_context_packet_compiler_geometry_substrate_upgrade_v0_1`.

## AI Context Packet compiler GeometryDigest/Substrate upgrade v0.1 Pointer

`types/research-candidate-ai-context-packet.ts` and
`lib/research-candidate-review/ai-context-packet.ts` now extend the existing AI
Context Packet preview/compiler with GeometryDigest, Agent Perspective
Substrate, Agent Perspective Substrate Preview, and folded audit panel lineage
as advisory input. The generated fixture is
`fixtures/research-candidate-review.ai-context-packet.geometry-substrate-upgrade.sample.v0.1.json`.
It is guarded by
`npm run smoke:research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1`.

The upgraded AI Context Packet includes `geometry_context`,
`agent_substrate_context`, `folded_audit_context`, `target_agent_context`,
`authority_boundary`, `lineage`, validation, and a deterministic fingerprint.
It preserves base packet fields and carries source refs, source coverage
boundaries, epistemic/review status, `why_now`, authority notes, and
target-agent forbidden actions.
Manual-note AI Context Packet and manual-note Formation Receipt fixtures are
now included directly in the upgraded packet lineage, preserving both the
static/base and manual-note context chains for the next handoff draft.

The packet remains preview-only and non-authoritative: not source of truth,
proof/evidence, durable state, execution authority, retrieval execution, agent
routing, Codex execution, external handoff, product write authority, or DB
write authority. This adds no provider/OpenAI call, no source fetch, no
retrieval execution, no Codex execution, no GitHub automation, no external handoff sending, no DB/SQL/transaction, no proof/evidence write, no work
mutation or work item creation, no durable Perspective promotion, no route/UI
behavior, no MCP/App tool widening, and no product write. Product-write remains
parked by the #686 stopline. Next recommended slice:
`candidate_to_codex_handoff_draft_geometry_substrate_v0_1`.

## Candidate-to-Codex handoff draft Geometry/Substrate v0.1 Pointer

`types/candidate-to-codex-handoff-draft.ts` and
`lib/research-candidate-review/candidate-to-codex-handoff-draft.ts` now derive
a deterministic Candidate-to-Codex handoff draft from the #691 upgraded AI
Context Packet fixture. The generated fixture is
`fixtures/research-candidate-review.candidate-to-codex-handoff-draft.geometry-substrate.sample.v0.1.json`.
It is guarded by
`npm run smoke:research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1`.

The draft preserves GeometryDigest, Agent Substrate, folded audit,
static/base packet lineage, and manual-note packet/receipt lineage as advisory
context. It is copyable preview text only and non-authoritative: not source of
truth, not proof/evidence, not durable Perspective state, not execution
authority, not retrieval output, not GitHub automation, not external handoff
sending, and not product write authority.

This adds no Codex execution, no branch/PR/GitHub automation, no external
handoff sending, no provider/OpenAI call, no source fetch, no retrieval
execution, no DB/SQL/transaction, no proof/evidence write, no work mutation or
work item creation, no durable Perspective promotion, no route/UI behavior, no
agent routing/execution, and no product write. Product-write remains parked by
the #686 stopline. Next recommended slice:
`candidate_to_codex_handoff_draft_review_v0_1`.
No branch/PR/GitHub automation is allowed from this draft.

## Candidate-to-Codex handoff draft review v0.1 Pointer

The Candidate-to-Codex handoff draft now has a review artifact.
`types/candidate-to-codex-handoff-draft-review.ts` and
`lib/research-candidate-review/candidate-to-codex-handoff-draft-review.ts`
consume the #692 handoff draft fixture as advisory input and generate
`fixtures/research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1.json`.
It is guarded by
`npm run smoke:research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1`.

The review preserves GeometryDigest, Agent Substrate, Folded Audit,
static/base packet lineage, manual-note packet/receipt lineage, source refs,
unresolved tensions, and product-write stopline context. It checks prompt
completeness, structured handoff completeness, manual lineage, source refs,
expected checks, stop conditions, and authority boundary before a human
operator handoff decision.

The review artifact is review-only and copyable-preview-only. It is still not
source of truth, proof/evidence, durable state, execution authority, retrieval
execution, agent routing, Codex execution, GitHub automation, external
handoff, or product write authority. This adds no branch/PR/GitHub automation,
no external handoff sending, no provider/OpenAI call, no source fetch, no
retrieval/RAG execution, no DB/SQL/transaction, no proof/evidence write, no
work mutation or work item creation, no durable Perspective promotion, no
route/UI behavior, no agent routing/execution, and no product write.
Product-write remains parked by the #686 stopline. Next recommended slice:
`candidate_to_codex_handoff_operator_decision_v0_1`.

## Candidate-to-Codex handoff operator decision preview v0.1 Pointer

The Candidate-to-Codex handoff operator decision preview requires a human
decision before any future execution discussion. It consumes the #693 handoff
draft review fixture as advisory input and generates
`fixtures/research-candidate-review.candidate-to-codex-handoff-operator-decision.sample.v0.1.json`.
It is guarded by
`npm run smoke:research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1`.

The preview keeps the operator decision required but not satisfied. It still
does not grant execution authority, Codex execution, branch/PR/GitHub
automation, external handoff sending, provider/OpenAI calls, source fetch,
retrieval/RAG execution, DB/SQL/transaction behavior, proof/evidence/work/
Perspective durable writes, agent routing/execution, or product write. It
preserves manual lineage, source refs, unresolved tensions, and the
product-write stopline. Next recommended slice:
`feedback_event_store_minimal_v0_1`.

## Feedback Event Store minimal v0.1 Pointer

Feedback Event Store minimal v0.1 begins M15 with durable feedback events for
Research-to-Perspective preview surfaces. It records operator feedback events
for `dismiss_preview`, `pin_preview`, `correct_preview`, and
`invalidate_preview` while preserving the target id, source refs, and explicit
authority boundary for each event.

Feedback events are durable, but they are not Perspective promotion
decisions, not proof/evidence records, not work mutation, not execution
authority, and not product-write authority. This slice adds no
provider/OpenAI calls, no source fetch, no retrieval/RAG execution, no Codex
execution, no GitHub automation, no external handoff sending, no agent
routing/execution, and no product write. Product-write remains parked by the
#686 stopline. Next recommended slice:
`feedback_event_store_review_controls_preview_v0_1`.

## Feedback Event Store review controls preview v0.1 Pointer

Feedback Event Store review controls preview v0.1 maps existing review
surfaces and surfacing cards to non-persisting feedback control previews for
`dismiss_preview`, `pin_preview`, `correct_preview`, and
`invalidate_preview`. It generates
`fixtures/research-candidate-review.feedback-event-store-review-controls-preview.sample.v0.1.json`
and is guarded by
`npm run smoke:feedback-event-store-review-controls-preview-v0-1`.

The review controls preview is non-persisting and maps UI/control intent to
event previews only. It does not write feedback events yet and adds no route/server action/DB write. It grants no provider/OpenAI calls, no source
fetch, no retrieval/RAG execution, no Codex execution, no GitHub automation,
no external handoff sending, no agent routing/execution, and no product
write. Product-write remains parked by the #686 stopline. Next recommended
slice: `feedback_event_write_route_contract_v0_1`.

## Feedback Event write route contract v0.1 Pointer

Feedback Event write route contract v0.1 is contract-only and documents a future
`POST /api/research-candidate/feedback-events` write path before
implementation. It generates
`fixtures/research-candidate-review.feedback-event-write-route-contract.sample.v0.1.json`
and is guarded by
`npm run smoke:feedback-event-write-route-contract-v0-1`.

The route contract documents the future write path but does not implement it.
No route/API/server action exists yet, no feedback event is persisted from the
contract, no DB write occurs yet, and no SQL execution occurs. It grants no
provider/OpenAI calls, no source fetch, no retrieval/RAG execution, no Codex
execution, no GitHub automation, no external handoff sending, no
proof/evidence/work/Perspective durable write, no agent routing/execution, and
no product write. Product-write remains parked by the #686 stopline. Next
recommended slice: `feedback_event_write_route_implementation_v0_1`.

## Feedback Event write route implementation v0.1 Pointer

Feedback Event write route implementation v0.1 implements
`POST /api/research-candidate/feedback-events` for durable feedback events
only. It persists feedback event records through the Feedback Event Store helper
and is guarded by
`npm run smoke:feedback-event-write-route-implementation-v0-1`.

The route persists feedback event only. No UI controls are activated yet, and
there is no UI/component change. It does not create proof/evidence, does not
promote Perspective state, and performs no work mutation. It grants no
provider/OpenAI calls, no source fetch, no retrieval/RAG execution, no Codex
execution, no GitHub automation, no external handoff sending, no agent
routing/execution, and no product write. Product-write remains parked by the
#686 stopline. Next recommended slice:
`feedback_event_write_route_browser_validation_v0_1`.

## Feedback Event write route browser validation v0.1 Pointer

Feedback Event write route browser validation v0.1 validates the #698 route
through temp-DB route handler invocation only. It observes insert, duplicate
idempotency, missing-acknowledgement refusal, forbidden authority-boundary
refusals, and capability/status flag refusals against a temporary DB
under `/tmp`.

No UI controls are activated yet, no app server is started, no browser UI is
used, and no production DB path is used in smoke. The validation does not add
routes, does not change schema/migrations, does not create proof/evidence, does
not promote Perspective state, and performs no work mutation. It grants no
provider/OpenAI calls, no source fetch, no retrieval/RAG execution, no Codex
execution, no GitHub automation, no external handoff sending, no agent
routing/execution, and no product write. Product-write remains parked by the
#686 stopline. Next recommended slice:
`feedback_event_controls_ui_contract_v0_1`.

## Feedback Event controls UI contract v0.1 Pointer

Feedback Event controls UI contract v0.1 is non-executing and non-persisting.
It maps preview controls to future route request previews for
`dismiss_preview`, `pin_preview`, `correct_preview`, and `invalidate_preview`.

No UI control is implemented yet, no UI component changes are made, No browser request is sent, and No feedback is persisted now. The contract does not add or
change routes, does not add server actions, does not open DB, and does not
execute SQL. It grants no provider/OpenAI calls, no source fetch, no
retrieval/RAG execution, no Codex execution, no GitHub automation, no external
handoff sending, no proof/evidence creation, no Perspective promotion, no work
mutation, no agent routing/execution, and no product write. Product-write
remains parked by the #686 stopline. Next recommended slice:
`feedback_event_controls_ui_implementation_v0_1`.

## Feedback Event controls UI implementation v0.1 Pointer

Feedback Event controls UI implementation v0.1 is bounded to feedback events
only. It enables `dismiss_preview` for Agent Perspective Substrate surfacing
cards and `pin_preview` for the source coverage folded section in the folded
audit panel.

The controls send browser requests only to
`POST /api/research-candidate/feedback-events` and write durable feedback events only. `correct_preview` and `invalidate_preview` remain disabled. This
slice adds no new routes, does not change schema/migrations, does not create
proof/evidence, does not promote Perspective state, and performs no work
mutation. It grants no provider/OpenAI calls, no source fetch, no retrieval/RAG
execution, no Codex execution, no GitHub automation, no external handoff
sending, no agent routing/execution, and no product write. Product-write
remains parked by the #686 stopline. Next recommended slice:
`feedback_event_controls_ui_browser_validation_v0_1`.

## Feedback Event controls UI browser validation v0.1 Pointer

Feedback Event controls UI browser validation v0.1 is validation-only. It uses
static component and fixture validation to confirm card-specific dismiss
feedback targets, source coverage pin behavior, and disabled correct/invalidate
controls.

This slice does not add route/UI behavior, does not change components, does not
start an app server, does not use production DB, and does not send browser
requests in smoke. It creates no proof/evidence, does not promote Perspective
state, and performs no work mutation. It grants no provider/OpenAI calls, no
source fetch, no retrieval/RAG execution, no Codex execution, no GitHub
automation, no external handoff sending, no agent routing/execution, and no
product write. Product-write remains parked by the #686 stopline. Next
recommended slice: `feedback_event_store_list_route_contract_v0_1`.

## Feedback Event Store list route contract v0.1 Pointer

Feedback Event Store list route contract v0.1 documents future read/list behavior for `GET /api/research-candidate/feedback-events`.

No route implementation exists yet. This contract does not add or change
app/api routes, does not add a GET export, does not add server actions, does
not open production DB, does no DB read, does no DB write, and does not
execute SQL. It creates no proof/evidence, does not promote Perspective state,
and performs no work mutation. It grants no provider/OpenAI calls, no source
fetch, no retrieval/RAG execution, no Codex execution, no GitHub automation, no
external handoff sending, no agent routing/execution, and no product write.
Product-write remains parked by the #686 stopline. Next recommended slice:
`feedback_event_store_list_route_implementation_v0_1`.

## Feedback Event Store list route implementation v0.1 Pointer

Feedback Event Store list route implementation v0.1 implements
`GET /api/research-candidate/feedback-events` for durable feedback-event reads
only. This route reads durable feedback events only. There is no feedback write
on GET, and this slice does not add UI controls.

The implementation does not create proof/evidence, does not promote
Perspective state, and performs no work mutation. It grants no provider/OpenAI
calls, no source fetch, no retrieval/RAG execution, no Codex execution, no
GitHub automation, no external handoff sending, no agent routing/execution, no
product write, and no product ID allocation. Product-write remains parked by
the #686 stopline. Next recommended slice:
`feedback_event_store_list_route_browser_validation_v0_1`.

## Feedback Event Store list route browser validation v0.1 Pointer

Feedback Event Store list route browser validation v0.1 validates
`GET /api/research-candidate/feedback-events` through route handler temp-DB
validation only. It reads durable feedback events only, observes read/filter
behavior, validates deterministic order and limit behavior, and confirms
refusal boundaries before any list UI contract or list panel work.

The validation uses no browser UI, starts no app server, and uses no production
DB read/write path. GET does not write feedback, and the validation performs no
feedback write. It adds no UI/component change, no app/api route change, no
route handler change, no schema/migration change, no proof/evidence write, no
Perspective promotion, no work mutation, no provider/OpenAI call, no source
fetch, no retrieval/RAG execution, no Codex/GitHub automation, no external
handoff sending, no agent routing/execution, no product write, and no product
ID allocation. Product-write remains parked by the #686 stopline. Next
recommended slice: `feedback_event_store_list_ui_contract_v0_1`.

## Feedback Event Store list UI contract v0.1 Pointer

Feedback Event Store list UI contract v0.1 is non-executing and non-reading.
It defines request previews only for a future list panel that may call
`GET /api/research-candidate/feedback-events` after a separate implementation
slice. The contract records filter rules, display policy, state policy, error
display policy, and authority acknowledgement policy without implementing a UI
component.

No UI component changes yet. No browser request is sent. No feedback event read happens now.
No feedback event write happens now, and no production DB path is
opened. The slice changes no app/api route, route handler, server action,
schema, migration, package dependency, component, browser persistence,
proof/evidence write, Perspective promotion, work mutation, provider/OpenAI
call, source fetch, retrieval/RAG execution, Codex/GitHub automation, external
handoff sending, agent routing/execution, product write, or product ID
allocation. Product-write remains parked by the #686 stopline. Next
recommended slice: `feedback_event_store_list_ui_implementation_v0_1`.

## Feedback Event Store list UI implementation v0.1 Pointer

Feedback Event Store list UI implementation v0.1 adds a read-only feedback event history panel
to the folded audit surface. It can load durable feedback
events with `GET /api/research-candidate/feedback-events` and displays them as
operator input only, not proof/evidence, not Perspective state, not work
status, not retrieval/RAG result, and not product write.

No feedback write from list UI is available. The panel changes no app/api
route, route handler, server action, schema, migration, package dependency, or
browser persistence. It creates no proof/evidence, performs no Perspective
promotion, makes no work mutation, executes no provider/OpenAI call, performs
no source fetch, executes no retrieval/RAG, triggers no Codex/GitHub
automation, sends no external handoff, routes no agents, writes no product
state, and allocates no product IDs. Product-write remains parked by the #686
stopline. Next recommended slice:
`feedback_event_store_list_ui_browser_validation_v0_1`.

## Feedback Event Store list UI browser validation v0.1 Pointer

Feedback Event Store list UI browser validation v0.1 validates the #707
read-only Feedback event history panel in the folded audit surface. It confirms
the panel renders with `FEEDBACK_EVENT_STORE_LIST_UI_CONTRACT`, defaults to all
feedback events with limit 50 only, has no target_kind or target_id default
scope, exposes only allowed filters, uses `GET
/api/research-candidate/feedback-events`, includes
`feedback_event_store_list_route_request.v0.1`, includes
`include_event_json=true`, and includes required read authority
acknowledgements.

The validation confirms local React state only, loading/empty/success/refusal
and validation failure display paths, operator input only labels, not
proof/evidence, not Perspective state, not work status, not retrieval/RAG
result, not product write labels, and duplicate feedback indication without
mutation. No feedback write from list UI is available. It performs static
validation only and does not execute a runtime browser request.

No POST, delete/edit/update/retry/write controls, app/api route change, route
handler change, server action, schema/migration change, package dependency
addition, browser persistence, auto refresh, proof/evidence write, Perspective
promotion, work mutation, provider/OpenAI call, source fetch, retrieval/RAG
execution, Codex/GitHub automation, external handoff, agent routing, product
write, product DB write, or product ID allocation is added. Product-write
remains parked by the #686 stopline. Next recommended slice:
`feedback_event_aggregation_read_model_contract_v0_1`.

## Feedback Event Aggregation Read Model Contract v0.1 Pointer

Feedback event aggregation read model contract v0.1 defines a contract-only
preview over durable feedback events. The aggregation read model is
advisory/read-only and may summarize operator feedback, but it remains
separated from durable Perspective promotion.

The contract adds no runtime implementation, no runtime DB query, no browser
request, no feedback write/mutation, no app/api route change, no route handler
change, no server action, no schema/migration change, no package dependency,
no browser persistence, no provider/OpenAI call, no source fetch, no
retrieval/RAG execution, no proof/evidence write, no Perspective promotion, no
durable Perspective state write, no promotion decision record, no work
mutation, no salience authority, no product write, no product DB write, and no
product ID allocation. It is not proof/evidence, not Perspective state, not
work status, not promotion authority, not salience authority, not
retrieval/RAG result, and not product write. Product-write remains parked by
the #686 stopline. Next recommended slice:
`feedback_event_aggregation_read_model_implementation_v0_1`.

## Feedback Event Aggregation Read Model Implementation v0.1 Pointer

Feedback event aggregation read model implementation v0.1 is deterministic and
fixture-backed. It implements read-model-only aggregation views over committed
feedback event fixtures and remains separated from durable Perspective
promotion.

The implementation adds no runtime DB query, no production DB read, no browser
request, no feedback write/mutation, no app/api route change, no route handler
change, no server action, no component/UI implementation, no schema/migration
change, no package dependency, no browser persistence, no provider/OpenAI call,
no source fetch, no retrieval/RAG execution, no proof/evidence write, no
Perspective promotion, no durable Perspective state write, no promotion decision
record, no work mutation, no salience authority, no product write, no product
DB write, and no product ID allocation. It is advisory/read-only and is not
proof/evidence, not Perspective state, not work status, not promotion authority,
not salience authority, not retrieval/RAG result, and not product write.
Product-write remains parked by the #686 stopline. Next recommended slice:
`feedback_event_aggregation_read_model_browser_validation_v0_1`.

## Feedback Event Aggregation Read Model Browser Validation v0.1 Pointer

Feedback event aggregation read model browser validation v0.1 validates the
deterministic fixture-backed aggregation implementation from #710. Aggregation
validation remains separated from durable Perspective promotion.

The validation adds no runtime DB query, no production DB read, no browser
request, no feedback write/mutation, no app/api route change, no route handler
change, no server action, no component/UI implementation, no schema/migration
change, no package dependency, no browser persistence, no provider/OpenAI call,
no source fetch, no retrieval/RAG execution, no proof/evidence write, no
Perspective promotion, no durable Perspective state write, no promotion decision
record, no work mutation, no salience authority, no product write, no product
DB write, and no product ID allocation. It is advisory/read-only validation and
is not proof/evidence, not Perspective state, not work status, not promotion
authority, not salience authority, not retrieval/RAG result, and not product
write. Product-write remains parked by the #686 stopline. Next recommended
slice: `formation_receipt_durable_event_contract_v0_1`.

## Formation Receipt Durable Event Contract v0.1 Pointer

Formation Receipt durable event contract v0.1 remains separated from durable
Perspective promotion. It records selected/excluded context, excluded reasons,
unresolved tensions, source refs, candidate refs, digest refs, handoff refs,
decision refs, and result refs as provenance and decision links only.

This slice defines a type-only contract and deterministic fixture only. It does
not implement runtime DB/browser/provider/retrieval behavior. It adds no
runtime DB write, no production DB read, no route, no route handler, no server
action, no component/UI implementation, no browser request, no browser
persistence, no durable event write implementation, no feedback write/mutation,
no provider/OpenAI call, no source fetch, no retrieval/RAG execution, no
proof/evidence write, no Perspective promotion, no durable Perspective state
write, no promotion decision record, no work mutation, no salience authority,
no product write, no product DB write, and no product ID allocation. It is not
proof/evidence, not Perspective state, not work status, not promotion
authority, not salience authority, not retrieval/RAG result, and not product
write. Product-write remains parked by the #686 stopline. Next recommended
slice: `formation_receipt_durable_event_implementation_v0_1`.

## Formation Receipt Durable Event Implementation v0.1 Pointer

Formation Receipt durable event implementation v0.1 remains separated from
durable Perspective promotion. It records provenance and reference links only
by generating receipt-shaped artifacts from the #712 contract fixture.

This slice does not implement runtime DB/browser/provider/retrieval behavior.
It adds no runtime persistence, no runtime DB write/query, no production DB
read, no schema/migration, no route, no route handler, no server action, no
component/UI implementation, no browser request, no browser persistence, no
feedback write/mutation, no provider/OpenAI call, no source fetch, no
retrieval/RAG execution, no proof/evidence write, no Perspective promotion, no
durable Perspective state write, no promotion decision record, no work
mutation, no salience authority, no product write, no product DB write, and no
product ID allocation. It is not proof/evidence, not Perspective state, not
work status, not promotion authority, not salience authority, not retrieval/RAG
result, and not product write. Product-write remains parked by the #686
stopline. Next recommended slice:
`formation_receipt_durable_event_browser_validation_v0_1`.

## Formation Receipt Durable Event Browser Validation v0.1 Pointer

Formation Receipt durable event browser validation v0.1 remains separated from
durable Perspective promotion. It validates provenance and reference links only
by checking the deterministic fixture-backed #713 receipt artifacts.

This slice does not implement runtime DB/browser/provider/retrieval behavior.
It adds no runtime persistence, no runtime DB write/query, no production DB
read, no schema/migration, no route, no route handler, no server action, no
component/UI implementation, no browser request, no browser persistence, no
feedback write/mutation, no provider/OpenAI call, no source fetch, no
retrieval/RAG execution, no proof/evidence write, no Perspective promotion, no
durable Perspective state write, no promotion decision record, no work
mutation, no salience authority, no product write, no product DB write, and no
product ID allocation. It is not proof/evidence, not Perspective state, not
work status, not promotion authority, not salience authority, not retrieval/RAG
result, and not product write. Product-write remains parked by the #686
stopline. Next recommended slice:
`recent_rehearsal_buffer_contract_v0_1`.

## Recent Rehearsal Buffer Contract v0.1 Pointer

Recent Rehearsal Buffer contract v0.1 remains separated from durable
Perspective promotion. It records recent work resume context only: compact,
non-durable references to the last active research question, recent
perspective/candidate context, open tensions, recent failed checks, user
decisions, included context refs with source_refs, excluded context refs with
reasons, and decay state.

This slice does not implement runtime DB/browser/provider/retrieval behavior.
It adds no runtime persistence, no durable memory write, no runtime DB
write/query, no production DB read, no schema/migration, no route, no route
handler, no server action, no component/UI implementation, no browser request,
no browser persistence, no formation receipt write, no feedback
write/mutation, no provider/OpenAI call, no source fetch, no retrieval/RAG
execution, no proof/evidence write, no Perspective promotion, no durable
Perspective state write, no promotion decision record, no work mutation, no
salience authority, no product write, no product DB write, and no product ID
allocation. It is not proof/evidence, not Perspective state, not work status,
not promotion authority, not salience authority, not retrieval/RAG result, and
not product write. Product-write remains parked by the #686 stopline. Next
recommended slice: `recent_rehearsal_buffer_implementation_v0_1`.

## Recent Rehearsal Buffer Implementation v0.1 Pointer

Recent Rehearsal Buffer implementation v0.1 remains separated from durable
Perspective promotion. It records recent work resume context only by generating
compact non-durable resume context from the #715 contract fixture.

This slice does not implement runtime DB/browser/provider/retrieval behavior.
It adds no runtime persistence, no durable memory write, no runtime DB
write/query, no production DB read, no schema/migration, no route, no route
handler, no server action, no component/UI implementation, no browser request,
no browser persistence, no formation receipt write, no feedback
write/mutation, no provider/OpenAI call, no source fetch, no retrieval/RAG
execution, no proof/evidence write, no Perspective promotion, no durable
Perspective state write, no promotion decision record, no work mutation, no
salience authority, no product write, no product DB write, and no product ID
allocation. It is not proof/evidence, not Perspective state, not work status,
not promotion authority, not salience authority, not retrieval/RAG result, and
not product write. Product-write remains parked by the #686 stopline. Next
recommended slice: `recent_rehearsal_buffer_browser_validation_v0_1`.

## Recent Rehearsal Buffer Browser Validation v0.1 Pointer

Recent Rehearsal Buffer browser validation v0.1 remains separated from durable
Perspective promotion. It validates recent work resume context only by checking
the #716 deterministic fixture-backed implementation against the #715 contract
fields, generated buffer contract authority boundary, top-level implementation
boundary separation, resume context summary, decay summary, and invalid override
summary/validation consistency.

This validation does not implement runtime DB/browser/provider/retrieval
behavior. It adds no runtime persistence, no durable memory write, no runtime DB
write/query, no production DB read, no schema/migration, no route, no route
handler, no server action, no component/UI implementation, no browser request,
no browser persistence, no formation receipt write, no feedback
write/mutation, no provider/OpenAI call, no source fetch, no retrieval/RAG
execution, no proof/evidence write, no Perspective promotion, no durable
Perspective state write, no promotion decision record, no work mutation, no
salience authority, no product write, no product DB write, and no product ID
allocation. It is not proof/evidence, not Perspective state, not work status,
not promotion authority, not salience authority, not retrieval/RAG result, and
not product write. Product-write remains parked by the #686 stopline. Next
recommended slice: `salience_governor_contract_v0_1`.

## Salience Governor Contract v0.1 Pointer

Salience Governor contract v0.1 remains separated from durable Perspective
promotion. It is display/reuse priority only and can prioritize display/reuse hints by defining salience
components, inhibition components, hint-only action policy, and a display-only
priority view for candidate overload reduction.

This contract does not implement runtime DB/browser/provider/retrieval behavior
in this slice. It adds no runtime salience scoring, no salience score authority,
no runtime persistence, no durable memory write, no runtime DB write/query, no
production DB read, no schema/migration, no route, no route handler, no server
action, no component/UI implementation, no browser request, no browser
persistence, no recent rehearsal buffer write, no formation receipt write, no
feedback write/mutation, no provider/OpenAI call, no source fetch, no
retrieval/RAG execution, no proof/evidence write, no Perspective promotion, no
durable Perspective state write, no promotion decision record, no candidate/work
mutation, no product write, no product DB write, and no product ID allocation.
It is not proof/evidence, not Perspective state, not work status, not promotion
authority, not salience authority, not retrieval/RAG result, and not product
write. Salience score must not be treated as promotion readiness or durable
approval. Product-write remains parked by the #686 stopline. Next recommended
slice: `salience_governor_implementation_v0_1`.

## Salience Governor Implementation v0.1 Pointer

Salience Governor implementation v0.1 remains separated from durable
Perspective promotion. It is deterministic and fixture-backed, and generates
display/reuse priority hints only from the #718 Salience Governor contract.

The implementation records a generated display/reuse priority preview, salience
component summary, inhibition component summary, action hint summary, priority
view summary, non-authority summary, and authority boundary. It does not make
salience score promotion readiness, durable approval, evidence strength, source
of truth, proof/evidence, Perspective state, work status, or product write
authority.

This implementation does not implement runtime DB/browser/provider/retrieval
behavior in this slice. It adds no runtime salience scoring, no salience score
authority, no runtime persistence, no durable salience write, no durable memory
write, no runtime DB write/query, no production DB read, no schema/migration,
no route, no route handler, no server action, no component/UI implementation,
no browser request, no browser persistence, no recent rehearsal buffer write, no
formation receipt write, no feedback write/mutation, no provider/OpenAI call,
no source fetch, no retrieval/RAG execution, no proof/evidence write, no
Perspective promotion, no durable Perspective state write, no promotion
decision record, no candidate/work mutation, no product write, no product DB
write, and no product ID allocation. It is not proof/evidence, not Perspective
state, not work status, not promotion authority, not salience authority, not
retrieval/RAG result, and not product write. Product-write remains parked by the
#686 stopline. Next recommended slice:
`salience_governor_browser_validation_v0_1`.

## Salience Governor Browser Validation v0.1 Pointer

Salience Governor browser validation v0.1 remains separated from durable
Perspective promotion. It validates deterministic fixture-backed display/reuse
priority hints only from the #719 Salience Governor implementation.

The validation checks generated priority view contract boundary, top-level
implementation boundary separation, salience component summary, inhibition
component summary, action hint summary, priority view summary, salience score
preview range, and synthetic `top_k` override behavior. It does not make
salience score promotion readiness, durable approval, evidence strength, source
of truth, proof/evidence, Perspective state, work status, or product write
authority.

This validation does not implement runtime DB/browser/provider/retrieval
behavior in this slice. It adds no runtime salience scoring, no salience score
authority, no runtime persistence, no durable salience write, no durable memory
write, no runtime DB write/query, no production DB read, no schema/migration,
no route, no route handler, no server action, no component/UI implementation,
no browser request, no browser persistence, no recent rehearsal buffer write, no
formation receipt write, no feedback write/mutation, no provider/OpenAI call,
no source fetch, no retrieval/RAG execution, no proof/evidence write, no
Perspective promotion, no durable Perspective state write, no promotion
decision record, no candidate/work mutation, no product write, no product DB
write, and no product ID allocation. It is not proof/evidence, not Perspective
state, not work status, not promotion authority, not salience authority, not
retrieval/RAG result, and not product write. Product-write remains parked by the
#686 stopline. Next recommended slice:
`bounded_external_source_intake_contract_v0_1`.

## Bounded External Source Intake Contract v0.1 Pointer

Bounded External Source Intake contract v0.1 remains separated from durable
Perspective promotion. It records source intake reference policy only for
operator-provided, public-safe source references that may prepare candidate
generation later.

The contract keeps source intake reference-only. It defines allowed
operator-provided source input kinds and disallowed crawler/search/provider/raw
private ID inputs. It does not make source references proof/evidence, source of
truth, Perspective state, work status, promotion authority, salience authority,
retrieval/RAG result, product write, or product ID allocation authority.

This contract does not implement runtime DB/browser/provider/retrieval
behavior in this slice. It adds no runtime source fetch, no crawler behavior,
no provider/OpenAI call, no provider extraction, no retrieval/RAG execution, no
source index write, no durable source record write, no runtime persistence, no
durable memory write, no runtime DB write/query, no production DB read, no
schema/migration, no route, no route handler, no server action, no
component/UI implementation, no browser request, no browser persistence, no
durable salience write, no recent rehearsal buffer write, no formation receipt
write, no feedback write/mutation, no proof/evidence write, no Perspective
promotion, no durable Perspective state write, no promotion decision record, no
candidate/work mutation, no product write, no product DB write, and no product
ID allocation. Product-write remains parked by the #686 stopline. Next
recommended slice:
`bounded_external_source_intake_implementation_v0_1`.

## Bounded External Source Intake Implementation v0.1 Pointer

Bounded External Source Intake implementation v0.1 remains separated from
durable Perspective promotion. It records source intake references only and
generates deterministic, fixture-backed, reference-only source intake bundles
from the #721 contract.

The implementation keeps operator-provided source refs, operator context,
source status, provenance, privacy, and non-authority boundaries visible for
later review. It is not source fetch, not crawler behavior, not provider
extraction, not retrieval/RAG, not proof/evidence, not Perspective state, not
work status, not promotion authority, not salience authority, not
candidate/work mutation, and not product write.

This implementation does not implement runtime DB/browser/provider/retrieval
behavior in this slice. It adds no runtime source fetch, no crawler behavior,
no provider/OpenAI call, no provider extraction, no retrieval/RAG execution, no
source index write, no durable source record write, no runtime persistence, no
durable memory write, no runtime DB write/query, no production DB read, no
schema/migration, no route, no route handler, no server action, no
component/UI implementation, no browser request, no browser persistence, no
durable salience write, no recent rehearsal buffer write, no formation receipt
write, no feedback write/mutation, no proof/evidence write, no Perspective
promotion, no durable Perspective state write, no promotion decision record, no
candidate/work mutation, no product write, no product DB write, and no product
ID allocation. Product-write remains parked by the #686 stopline. Next
recommended slice:
`bounded_external_source_intake_browser_validation_v0_1`.

## Bounded External Source Intake Browser Validation v0.1 Pointer

Bounded External Source Intake browser validation v0.1 remains separated from
durable Perspective promotion. It validates deterministic, fixture-backed,
reference-only source intake bundles from the #722 implementation and keeps the
generated bundle contract boundary separate from the top-level implementation
boundary.

The validation records source intake references only. It validates invalid
source_refs override rejection for disallowed source input kinds, unknown input
kinds, source fetch enabled, provider extraction enabled, candidate generation
now, missing source refs, missing operator context, non-public-safe refs, and
invalid source status. It is not source fetch, not crawler behavior, not
provider extraction, not retrieval/RAG, not proof/evidence, not Perspective
state, not work status, not promotion authority, not salience authority, not
candidate/work mutation, and not product write.

This validation does not implement runtime DB/browser/provider/retrieval
behavior in this slice. It adds no runtime source fetch, no crawler behavior,
no provider/OpenAI call, no provider extraction, no retrieval/RAG execution, no
source index write, no durable source record write, no runtime persistence, no
durable memory write, no runtime DB write/query, no production DB read, no
schema/migration, no route, no route handler, no server action, no
component/UI implementation, no browser request, no browser persistence, no
durable salience write, no recent rehearsal buffer write, no formation receipt
write, no feedback write/mutation, no proof/evidence write, no Perspective
promotion, no durable Perspective state write, no promotion decision record, no
candidate/work mutation, no product write, no product DB write, and no product
ID allocation. Product-write remains parked by the #686 stopline. Next
recommended slice:
`operator_source_candidate_generation_contract_v0_1`.

## Operator Source Candidate Generation Contract v0.1 Pointer

Operator Source Candidate Generation contract v0.1 remains separated from
durable Perspective promotion. It defines candidate preview families only for
bounded, operator-provided, reference-only source intake bundles and does not
implement generation in this slice.

The contract keeps generated candidates candidate-only and preview-only. Claim,
evidence, tension, knowledge gap, Perspective delta, and follow-up work
candidate preview families require source_refs, operator context, and later
human review. They do not become proof/evidence, source of truth, Perspective
state, work status, promotion basis, retrieval/RAG result, salience authority,
candidate/work mutation, or product write.

This contract does not implement runtime DB/browser/provider/retrieval
behavior in this slice. It adds no runtime candidate generation, no runtime
source fetch, no crawler behavior, no provider/OpenAI call, no provider
extraction, no retrieval/RAG execution, no source index write, no durable source
record write, no candidate record write, no runtime persistence, no durable
memory write, no runtime DB write/query, no production DB read, no
schema/migration, no route, no route handler, no server action, no component/UI
implementation, no browser request, no browser persistence, no durable salience
write, no recent rehearsal buffer write, no formation receipt write, no
feedback write/mutation, no proof/evidence write, no Perspective promotion, no
durable Perspective state write, no promotion decision record, no
candidate/work mutation, no product write, no product DB write, and no product
ID allocation. Product-write remains parked by the #686 stopline. Next
recommended slice:
`operator_source_candidate_generation_implementation_v0_1`.

## Operator Source Candidate Generation Implementation v0.1 Pointer

Operator Source Candidate Generation implementation remains separated from
durable Perspective promotion. It generates candidate previews only from the
#724 contract and committed fixtures.
Operator Source Candidate Generation implementation remains separated from durable Perspective promotion.
It generates candidate previews only.
It does not implement runtime DB/browser/provider/retrieval behavior in this slice.

The implementation keeps generated candidate previews candidate-only,
preview-only, source-ref-backed, operator-context-backed, and review-required
later. It validates invalid generated candidate preview override rejection and
does not treat previews as proof/evidence, source of truth, Perspective state,
work status, promotion basis, retrieval/RAG result, salience authority,
candidate/work mutation, or product write.

It does not implement runtime DB/browser/provider/retrieval behavior in this
slice. It adds no runtime candidate generation, no runtime source fetch, no
crawler behavior, no provider/OpenAI call, no provider extraction, no
retrieval/RAG execution, no source index write, no durable source record write,
no candidate record write, no runtime persistence, no durable memory write, no
runtime DB write/query, no production DB read, no schema/migration, no route,
no route handler, no server action, no component/UI implementation, no browser
request, no browser persistence, no durable salience write, no recent
rehearsal buffer write, no formation receipt write, no feedback write/mutation,
no proof/evidence write, no Perspective promotion, no durable Perspective state
write, no promotion decision record, no candidate/work mutation, no product
write, no product DB write, and no product ID allocation. Product-write remains
parked by the #686 stopline. Next recommended slice:
`operator_source_candidate_generation_browser_validation_v0_1`.

## Operator Source Candidate Generation Browser Validation v0.1 Pointer

Operator Source Candidate Generation validation remains separated from durable Perspective promotion.
It validates candidate previews only.
It validates deterministic, fixture-backed candidate preview bundles from the
#725 implementation against the #724 contract boundary. It validates invalid
generated candidate preview override rejection and invalid source_refs override
rejection while preserving source-ref-backed, operator-context-backed, and
later-review-only candidate previews.
It does not implement runtime DB/browser/provider/retrieval behavior in this slice.

This validation adds no runtime candidate generation, no runtime source fetch,
no crawler behavior, no provider/OpenAI call, no provider extraction, no
retrieval/RAG execution, no source index write, no durable source record write,
no candidate record write, no runtime persistence, no durable memory write, no
runtime DB write/query, no production DB read, no schema/migration, no route,
no route handler, no server action, no component/UI implementation, no browser
request, no browser persistence, no durable salience write, no recent
rehearsal buffer write, no formation receipt write, no feedback write/mutation,
no proof/evidence write, no Perspective promotion, no durable Perspective state
write, no promotion decision record, no candidate/work mutation, no product
write, no product DB write, and no product ID allocation. Product-write remains
parked by the #686 stopline. Next recommended slice:
`non_authoritative_retrieval_rag_contract_v0_1`.

## Non-authoritative Retrieval/RAG Contract v0.1 Pointer

Retrieval/RAG remains separated from durable Perspective promotion.
Retrieval results preserve candidate/durable distinction.
Search results must link back to source_refs.
Stale index cannot override current state.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval behavior.

The contract defines recall and context expansion only. Retrieval result is
recall, not authority; RAG answer is context preview, not evidence/proof; and
embedding similarity or retrieval scores are not truth, promotion readiness,
salience authority, or evidence strength. Any future index must remain
rebuildable, derived, and non-authoritative, and vector DB storage must not be
treated as source of truth or hidden permanent memory.

This contract adds no runtime retrieval/RAG execution, no runtime index build,
no index write, no source index write, no embedding generation, no vector DB,
no FTS, no provider/OpenAI call, no source fetch, no crawler behavior, no
runtime persistence, no durable memory write, no runtime DB write/query, no
production DB read, no schema/migration, no route, no route handler, no server
action, no component/UI implementation, no browser request, no browser
persistence, no durable source record write, no candidate record write, no
proof/evidence write, no Perspective promotion, no durable Perspective state
write, no promotion decision record, no candidate/work mutation, no product
write, no product DB write, and no product ID allocation. Product-write remains
parked by the #686 stopline. Next recommended slice:
`non_authoritative_retrieval_rag_implementation_v0_1`.

## Non-authoritative Retrieval/RAG Implementation v0.1 Pointer

Non-authoritative Retrieval/RAG implementation remains separated from durable Perspective promotion.
Retrieval results preserve candidate/durable distinction.
Search/retrieval results must link back to source_refs or explicit public-safe gap reason.
RAG context preview is not proof/evidence/source of truth.
Stale index cannot override current state.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval behavior.

The implementation is deterministic fixture-backed only. It materializes
public-safe recall/context preview bundles from the #727 contract, with
retrieval result as recall and RAG answer as context preview. It is not runtime
retrieval/RAG, source fetch, provider extraction, index build/write, embedding
generation, vector DB, FTS, proof/evidence, Perspective state, work status,
promotion authority, salience authority, candidate/work mutation, or product
write.

It adds no provider/OpenAI call, no crawler behavior, no source index write, no
durable source record write, no candidate record write, no runtime persistence,
no durable memory write, no runtime DB write/query, no production DB read, no
schema/migration, no route, no route handler, no server action, no component/UI
implementation, no browser request, no browser persistence, no proof/evidence
write, no Perspective promotion, no durable Perspective state write, no
promotion decision record, no product DB write, and no product ID allocation.
Product-write remains parked by the #686 stopline. Next recommended slice:
`non_authoritative_retrieval_rag_browser_validation_v0_1`.

## Non-authoritative Retrieval/RAG Browser Validation v0.1 Pointer

Non-authoritative Retrieval/RAG validation remains separated from durable Perspective promotion.
Retrieval results preserve candidate/durable distinction.
Search/retrieval results must link back to source_refs or explicit public-safe gap reason.
RAG context preview is not proof/evidence/source of truth.
Stale index cannot override current state.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval behavior.

The browser validation validates the deterministic fixture-backed #728
implementation and recall/context preview bundles against the #727 contract.
It validates public-safe source references, retrieval result family coverage,
source reference summary coverage, and invalid override rejection for retrieval
results, RAG context preview, source_refs, and authority boundary flags.

It is not runtime retrieval/RAG, source fetch, provider extraction, index
build/write, embedding generation, vector DB, FTS, proof/evidence, Perspective
state, work status, promotion authority, salience authority, candidate/work
mutation, or product write.

It adds no provider/OpenAI call, no crawler behavior, no source index write, no
durable source record write, no candidate record write, no runtime persistence,
no durable memory write, no runtime DB write/query, no production DB read, no
schema/migration, no route, no route handler, no server action, no component/UI
implementation, no browser request, no browser persistence, no proof/evidence
write, no Perspective promotion, no durable Perspective state write, no
promotion decision record, no product DB write, and no product ID allocation.
Product-write remains parked by the #686 stopline. Next recommended slice:
`human_reviewed_durable_perspective_promotion_contract_v0_1`.

## Human-reviewed Durable Perspective Promotion Contract v0.1 Pointer

Durable Perspective promotion remains separated from candidate preview.
PerspectiveDeltaCandidate is not committed state.
Claim candidate is not fact.
Evidence candidate is not accepted evidence.
Promotion requires explicit human review, source_refs, basis, unresolved tension handling, knowledge gap handling, and future promotion decision record.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion behavior.

The contract defines the future human/Core promotion gate only. Retrieval
results, RAG context previews, salience signals, provider output, feedback
events, context packets, Codex/GitHub automation, and Agent Substrate context
remain advisory only and cannot initiate promotion.

It adds no runtime promotion, no durable Perspective state write, no durable
Perspective delta apply, no promotion decision record write, no proof/evidence
write, no Formation Receipt write, no work mutation, no runtime DB write/query,
no production DB read, no schema/migration, no route, no route handler, no
server action, no component/UI implementation, no browser request, no browser
persistence, no provider/OpenAI call, no source fetch, no crawler behavior, no
retrieval/RAG execution, no product DB write, and no product ID allocation.
Product-write remains parked by the #686 stopline. Next recommended slice:
`human_reviewed_durable_perspective_promotion_implementation_v0_1`.

Human-reviewed Durable Perspective Promotion implementation remains separated from durable Perspective promotion runtime.
It preserves candidate/durable distinction.
PerspectiveDeltaCandidate is not committed state.
Claim candidate is not fact.
Evidence candidate is not accepted evidence.
Promotion requires explicit human review, source_refs, basis, unresolved tension handling, knowledge gap handling, and future promotion decision record later.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion behavior.

The implementation materializes a deterministic public-safe preview bundle from
the #730 contract only. It adds no runtime promotion, no durable Perspective
state write, no durable Perspective delta apply, no promotion decision record
write, no proof/evidence write, no Formation Receipt write, no work mutation,
no runtime DB write/query, no production DB read, no schema/migration, no route,
no route handler, no server action, no component/UI implementation, no browser
request, no browser persistence, no provider/OpenAI call, no source fetch, no
crawler behavior, no retrieval/RAG execution, no product DB write, and no
product ID allocation. Product-write remains parked by the #686 stopline. Next
recommended slice:
`human_reviewed_durable_perspective_promotion_browser_validation_v0_1`.

Human-reviewed Durable Perspective Promotion validation remains separated from durable Perspective promotion runtime.
It preserves candidate/durable distinction.
PerspectiveDeltaCandidate is not committed state.
Claim candidate is not fact.
Evidence candidate is not accepted evidence.
Promotion requires explicit human review, source_refs, basis, unresolved tension handling, knowledge gap handling, and future promotion decision record later.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion behavior.

The validation checks the deterministic #731 promotion preview bundle against
the #730 contract only. It adds no runtime promotion, no durable Perspective
state write, no durable Perspective delta apply, no promotion decision record
write, no proof/evidence write, no Formation Receipt write, no work mutation,
no runtime DB write/query, no production DB read, no schema/migration, no route,
no route handler, no server action, no component/UI implementation, no browser
request, no browser persistence, no provider/OpenAI call, no source fetch, no
crawler behavior, no retrieval/RAG execution, no product DB write, and no
product ID allocation. Product-write remains parked by the #686 stopline. Next
recommended slice:
`durable_perspective_state_trajectory_contract_v0_1`.

Durable Perspective State / Trajectory remains separated from candidate preview and promotion preview.
PerspectiveDeltaCandidate is not committed state.
Only future human/Core promotion can create durable Perspective state changes.
Current thesis must have lineage.
Prior thesis must not be overwritten silently.
Retired claims remain auditable.
Contradicted evidence is not deleted.
Open tensions and knowledge gaps must remain visible unless explicitly handled.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state behavior.

This contract defines future durable Perspective state shape and trajectory
grammar only. It adds no runtime state read/write, no durable Perspective delta
apply, no PerspectiveSnapshot runtime, no trajectory runtime build, no
proof/evidence write, no accepted evidence write, no Formation Receipt write,
no work mutation, no runtime DB write/query, no production DB read, no
schema/migration, no route, no route handler, no server action, no
component/UI implementation, no browser request, no browser persistence, no
provider/OpenAI call, no source fetch, no crawler behavior, no retrieval/RAG
execution, no product DB write, and no product ID allocation. Product-write
remains parked by the #686 stopline. Next recommended slice:
`durable_perspective_state_trajectory_implementation_v0_1`.

Durable Perspective State / Trajectory implementation v0.1 remains separated from runtime durable Perspective state.
It is deterministic fixture-backed and preserves candidate/durable distinction.
PerspectiveDeltaCandidate is not committed state.
Only future human/Core promotion can create durable Perspective state changes.
Current thesis has lineage.
Prior thesis is not overwritten silently.
Retired claims remain auditable.
Contradicted evidence is not deleted.
Open tensions and knowledge gaps remain visible unless explicitly handled.
Boundary phrases: current thesis has lineage; prior thesis is not overwritten silently; retired claims remain auditable; Contradicted evidence is not deleted; no runtime state read/write; no durable Perspective delta apply; no PerspectiveSnapshot runtime; no trajectory runtime build; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no product write; product-write remains parked by #686.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state behavior.

This implementation materializes a public-safe preview bundle from the #733
contract only. It adds no runtime state read/write, no durable Perspective
delta apply, no PerspectiveSnapshot runtime, no trajectory runtime build, no
proof/evidence write, no accepted evidence write, no Formation Receipt write,
no work mutation, no runtime DB write/query, no production DB read, no
schema/migration, no route, no route handler, no server action, no
component/UI implementation, no browser request, no browser persistence, no
provider/OpenAI call, no source fetch, no crawler behavior, no retrieval/RAG
execution, no product write, no product DB write, and no product ID
allocation. Product-write remains parked by #686. Next recommended slice:
`durable_perspective_state_trajectory_browser_validation_v0_1`.

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
