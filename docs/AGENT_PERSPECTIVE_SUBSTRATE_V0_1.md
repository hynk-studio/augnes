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

## Next Recommended Slice

`candidate_to_codex_handoff_draft_geometry_substrate_v0_1`
