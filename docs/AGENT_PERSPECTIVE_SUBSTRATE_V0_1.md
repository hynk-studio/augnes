# Agent Perspective Substrate v0.1

## Status

This slice is docs/type/fixture/smoke only.

Agent Perspective Substrate v0.1 is advisory-only, non-SSOT,
non-authoritative, and has no runtime behavior. It adds no DB/API/provider/
retrieval/source-fetch behavior, no proof/evidence creation, no Perspective
promotion, no durable Perspective promotion, no work mutation, no agent
execution or routing, and no product write. It adds no MCP/App tool widening.
no Perspective promotion is granted by this slice.
It adds no agent execution or routing.
Candidate Constellation Overlay remains an advisory source input only.
It is never source of truth.

The committed artifact surface is:

- `types/agent-perspective-substrate.ts`
- `fixtures/agent-perspective-substrate.sample.v0.1.json`
- `scripts/smoke-agent-perspective-substrate-v0-1.mjs`
- `npm run smoke:agent-perspective-substrate-v0-1`

## Definition

Agent Perspective Substrate is an AI-native folded advisory projection. It is
derived from PerspectiveGeometryDigest, Research Candidate Review, Candidate
Constellation Overlay, AI Context Packet previews, Formation Receipt previews,
user overrides, accepted state references, and work trace references.

It is used for retrieval hints, warning, comparison, compression, handoff
preparation, capsule preparation, and stale-context detection. It is never
source of truth, proof/evidence, durable Perspective state, execution
authority, or product-write authority.

## Explicit Allowed Capabilities

The substrate may:

- retrieve references conceptually, but not execute retrieval in this slice
- rank advisory surfacing candidates
- compress derived context
- warn about unresolved tensions
- compare candidate structures
- suggest handoff improvements
- prepare capsule/handoff context previews
- improve future AI context packet selection
- identify stale or risky context

## Explicit Forbidden Capabilities

The substrate may not:

- commit or reject state
- create proof
- create evidence
- mutate work
- create work items
- call external services
- route agents
- execute agents
- call providers/OpenAI
- run retrieval/RAG
- fetch sources
- write DB
- update Perspective state
- promote candidates
- allocate product IDs
- execute product write

## Required Source Discipline

Every surfaced warning, suggestion, blocker, and handoff improvement must
include:

- `source_refs` or an explicit source coverage boundary note
- `epistemic_status`
- `review_status` or lifecycle status
- `why_now`
- `authority_boundary_notes`

Source refs may point to committed public-safe fixtures, digest fixtures, or
accepted future state references. Missing source refs must be explicit and
must downgrade or block grounded-claim-like surfacing. Missing source refs must
never be silently filled by inference, retrieval, provider output, or agent
execution.

## Initial Deterministic Rule Set

Initial rule names:

- `source_refs_missing_blocks_grounded_claim`
- `evidence_missing_blocks_perspective_delta_promotion`
- `unresolved_tension_missing_from_handoff_warns`
- `local_constraint_globalized_warns_scope_overreach`
- `forbidden_action_missing_from_handoff_warns`
- `repeated_dismissed_warning_without_new_source_downgrades`
- `stale_high_gravity_node_warns_context_distortion`
- `retrieval_hint_without_execution_only`
- `coordinates_as_truth_forbidden`
- `product_write_lane_parked`

The rules are deterministic preview policy names only. They do not commit or
reject state, create proof/evidence, mutate work, route or execute agents, call
providers, run retrieval, fetch sources, write DB, promote Perspective, or
execute product write.

## Relationship To #687

#687 added PerspectiveGeometryDigest Builder v0.1 as the first upstream
structural digest for Research-to-Perspective. Agent Perspective Substrate
will consume PerspectiveGeometryDigest as advisory input. It must consume the
digest without treating layout coordinates as truth and without elevating the
digest into source of truth, proof/evidence, durable Perspective state,
retrieval result, execution authority, or product-write authority.

The substrate fixture references:

- `fixtures/research-candidate-review.perspective-geometry-digest.sample.v0.1.json`
- `fixtures/research-candidate-review.perspective-geometry-digest.manual-parser.sample.v0.1.json`
- `fixtures/research-candidate-review.constellation-overlay.sample.v0.1.json`
- `fixtures/research-candidate-review.manual-note-constellation-overlay.sample.v0.1.json`
- `fixtures/research-candidate-review.ai-context-packet.sample.v0.1.json`
- `fixtures/research-candidate-review.manual-note-ai-context-packet.sample.v0.1.json`
- `fixtures/research-candidate-review.formation-receipt.sample.v0.1.json`
- `fixtures/research-candidate-review.manual-note-formation-receipt.sample.v0.1.json`

## Product Write Stopline

#686 parked the product-write preparation lane. Agent Perspective Substrate
must preserve that stopline. It must not implement product write, persist a
command envelope, allocate product IDs, open DB, execute SQL, execute
transactions, enable adapters, add route/UI behavior, or create product write
authority.

## Preview Builder v0.1

Agent Perspective Substrate Preview Builder v0.1 consumes the substrate
fixture as advisory input and folds surfaced candidates into an audit preview.
It writes:

- `types/agent-perspective-substrate-preview.ts`
- `lib/research-candidate-review/agent-perspective-substrate-preview.ts`
- `fixtures/agent-perspective-substrate-preview.sample.v0.1.json`
- `scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs`

The preview is folded-by-default, non-authoritative, advisory-only, and not
source of truth. It preserves direct `source_refs` or explicit source coverage
boundary notes, `epistemic_status`, `review_status`, `why_now`, and
`authority_boundary_notes` on every surfacing card.

This builder adds no route/UI yet, no runtime API behavior, no DB/SQL/
transaction behavior, no provider/OpenAI call, no source fetch, no retrieval
execution, no agent routing/execution, no proof/evidence/work/Perspective
durable write, and no product write authority.

The next recommended slice after the preview builder is
`cockpit_agent_perspective_substrate_folded_audit_panel_v0_1`.

The original downstream slice from the docs/type/fixture substrate contract was
`agent_perspective_substrate_preview_builder_v0_1`; that preview-builder work is
now upstream lineage for the folded audit panel.

## Cockpit Folded Audit Panel v0.1

Cockpit Agent Perspective Substrate folded audit panel v0.1 consumes the #689
preview fixture as static advisory input and renders a folded audit panel in
Cockpit/Perspective. The panel is preview UI only: folded-by-default, local
component state only, and non-authoritative.

It preserves `source_refs` or explicit source coverage boundary notes,
`epistemic_status`, `review_status`, `why_now`, and
`authority_boundary_notes` on surfaced cards. Suggested actions remain preview
labels only, with no durable feedback persistence and no feedback persistence.

This panel adds no route/API behavior, no server action, no DB/SQL/transaction
behavior, no provider/OpenAI call, no source fetch, no retrieval execution, no
agent routing/execution, no proof/evidence/work/Perspective durable write, and
no product write authority. Product-write remains parked by the #686 stopline.

The next recommended slice after the folded audit panel is
`ai_context_packet_compiler_geometry_substrate_upgrade_v0_1`.

## AI Context Packet Geometry/Substrate Upgrade v0.1

AI Context Packet compiler GeometryDigest/Substrate upgrade v0.1 can now
consume Agent Perspective Substrate preview and folded audit context as
advisory input, alongside #687 PerspectiveGeometryDigest and the existing
Research Candidate AI Context Packet preview. The upgraded packet remains
non-authoritative and target-agent-safe.

It carries geometry/substrate/folded-audit summaries, source coverage,
surfacing blockers and warnings, target-agent forbidden actions, lineage, and
an advisory authority boundary. It is not source of truth, proof/evidence,
durable Perspective state, retrieval output, agent execution authority, Codex
execution authority, external handoff authority, DB write authority, or product
write authority.

The upgraded packet lineage includes both static/base and manual-note context
chains: the manual-note AI Context Packet fixture and manual-note Formation
Receipt fixture are represented directly in lineage and verified by smoke.

This AI Context Packet compiler GeometryDigest/Substrate upgrade v0.1 adds no
route/UI behavior, no DB/SQL/transaction behavior, no provider/OpenAI call, no
source fetch, no retrieval execution, no agent routing/execution, no Codex execution, no external handoff sending, no proof/evidence/work/Perspective durable write, and no product write.

The next recommended slice after the AI Context Packet compiler upgrade is
`candidate_to_codex_handoff_draft_geometry_substrate_v0_1`.

## Candidate-to-Codex Handoff Draft v0.1

Candidate-to-Codex handoff draft Geometry/Substrate v0.1 consumes the #691
upgraded AI Context Packet geometry/substrate/folded audit context as advisory
input. It is copyable-preview-only planning text plus structured fixture data
for a future handoff draft review slice. It preserves static/base and
manual-note lineage from the upgraded packet, including manual-note AI Context
Packet and manual-note Formation Receipt refs.

The draft is non-authoritative: not source of truth, not proof/evidence, not
durable Perspective state, not retrieval output, not agent execution
authority, not merge authority, not GitHub automation authority, and not
product-write authority. It performs no Codex execution, no branch/PR/GitHub
automation, no external handoff sending, no retrieval execution, no
provider/OpenAI call, no source fetch, no DB/SQL/transaction behavior, no
proof/evidence/work/Perspective durable write, no agent routing/execution, and
no product write. Product-write remains parked by the #686 stopline.
No branch/PR/GitHub automation is allowed from this draft.

The next recommended slice after the Candidate-to-Codex handoff draft is
`candidate_to_codex_handoff_draft_review_v0_1`.

## Candidate-to-Codex Handoff Draft Review v0.1

Candidate-to-Codex handoff draft review v0.1 can consume the #692 draft as
advisory input. It remains review-only and copyable-preview-only: it checks
the draft prompt completeness, structured handoff completeness, static/base and
manual-note lineage, unresolved tensions, source refs, expected checks, stop
conditions, and authority boundary before a human operator decision.

The review artifact is non-authoritative and grants no Codex execution, no
branch/PR/GitHub automation, no external handoff sending, no provider/OpenAI
call, no source fetch, no retrieval/RAG execution, no DB/SQL/transaction
behavior, no proof/evidence/work/Perspective durable write, no agent
routing/execution, and no product write. Product-write remains parked by the
#686 stopline. The next recommended slice after the review is
`candidate_to_codex_handoff_operator_decision_v0_1`.

## Candidate-to-Codex Handoff Operator Decision Preview v0.1

Candidate-to-Codex handoff operator decision preview v0.1 can consume the
#693 handoff draft review as advisory input. The operator decision required
state is explicit, but the decision is not satisfied or recorded by this
preview.

The operator decision preview remains non-authoritative and preview-only. It
preserves manual lineage, source refs, unresolved tensions, and the
product-write stopline while granting no Codex execution, no
branch/PR/GitHub automation, no external handoff sending, no provider/OpenAI
call, no source fetch, no retrieval/RAG execution, no DB/SQL/transaction
behavior, no proof/evidence/work/Perspective durable write, no agent
routing/execution, and no product write. Product-write remains parked by the
#686 stopline. The next recommended slice after the preview is
`feedback_event_store_minimal_v0_1`.

## Feedback Event Store Minimal v0.1

Feedback Event Store minimal v0.1 can record preview feedback events such as
`dismiss_preview`, `pin_preview`, `correct_preview`, and
`invalidate_preview` for Research-to-Perspective preview surfaces, including
Agent Perspective Substrate cards/sections and Candidate-to-Codex handoff
previews.

Feedback events are durable operator input only. They do not mutate substrate
snapshots, proof/evidence, work, Perspective state, agents, handoffs, or
product write. The slice adds no Codex execution, no GitHub automation, no
external handoff sending, no provider/OpenAI call, no source fetch, no
retrieval/RAG execution, no agent routing/execution, and no product write.
Product-write remains parked by the #686 stopline. The next recommended slice
after Feedback Event Store minimal v0.1 is
`feedback_event_store_review_controls_preview_v0_1`.

## Feedback Event Store Review Controls Preview v0.1

Feedback Event Store review controls preview v0.1 maps substrate and feedback
targets to feedback event previews only. It can show disabled control previews
for `dismiss_preview`, `pin_preview`, `correct_preview`, and
`invalidate_preview`, but the controls do not persist feedback in this slice.

The review controls preview remains non-authoritative and preview-only. No feedback is persisted from controls, and there is still no route/server action/DB write. It grants no Codex execution, no GitHub automation, no
external handoff sending, no provider/OpenAI call, no source fetch, no
retrieval/RAG execution, no agent routing/execution, and no product write.
Product-write remains parked by the #686 stopline. The next recommended slice
after the review controls preview is
`feedback_event_write_route_contract_v0_1`.

## Feedback Event Write Route Contract v0.1

Feedback Event write route contract v0.1 documents future
`POST /api/research-candidate/feedback-events` behavior as contract-only
fixture data. It is non-executing and adds no route implementation.

The contract adds no app/api route, no route handler, no server action, no DB
open, no DB write, no SQL execution, no schema/migration change, and no
UI/component change. It grants no Codex execution, no GitHub automation, no external
handoff sending, no provider/OpenAI call, no source fetch, no retrieval/RAG
execution, no proof/evidence/work/Perspective durable write, no agent
routing/execution, and no product write. Product-write remains parked by the
#686 stopline. The next recommended slice after the route contract is
`feedback_event_write_route_implementation_v0_1`.

## Feedback Event Write Route Implementation v0.1

Feedback Event write route implementation v0.1 implements
`POST /api/research-candidate/feedback-events` for durable feedback events
only. It can persist Feedback Event Store v0.1 records through the feedback
event store helper and keeps the authority boundary attached to the written
event.

The route persists feedback events only. It does not mutate substrate
snapshots, proof/evidence, work, Perspective state, agents, handoffs, or
product write. It adds no UI/component change, no Codex execution, no GitHub
automation, no external handoff sending, no provider/OpenAI call, no source
fetch, no retrieval/RAG execution, no agent routing/execution, and no product
write. Product-write remains parked by the #686 stopline. The next recommended
slice after the route implementation is
`feedback_event_write_route_browser_validation_v0_1`.

## Next Recommended Slice

`feedback_event_write_route_browser_validation_v0_1`
