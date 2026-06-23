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

Feedback Event write route browser validation v0.1 validates the #698 write
route behavior before UI integration. It invokes the exported route handler with
a temp DB under `/tmp` and observes valid insert, duplicate idempotency, and
required refusal behavior for durable feedback events only.

The validation starts no app server and uses no browser UI because route handler
temp-DB validation is sufficient before UI integration. It uses no production DB
path, activates no UI controls, adds no route behavior, and still validates no
proof/evidence, no Perspective promotion, no work mutation, no provider/OpenAI
call, no source fetch, no retrieval/RAG execution, no Codex/GitHub automation,
no agent routing/execution, and no product write. Product-write remains parked
by the #686 stopline. The next recommended slice after route validation is
`feedback_event_controls_ui_contract_v0_1`.

## Feedback Event Controls UI Contract v0.1

Feedback Event controls UI contract v0.1 maps preview controls to future route
requests as request previews only. It defines how future UI controls may
construct safe `POST /api/research-candidate/feedback-events` requests for
`dismiss_preview`, `pin_preview`, `correct_preview`, and `invalidate_preview`.

No UI control is implemented yet. No browser request is sent, No feedback is
persisted from the contract, and no component, route, server action, DB open, DB
write, or SQL execution is added in this slice. It grants no provider/OpenAI
call, no source fetch, no retrieval/RAG execution, no Codex/GitHub automation,
no proof/evidence, no Perspective promotion, no work mutation, no agent
routing/execution, and no product write. Product-write remains parked by the
#686 stopline. The next recommended slice after the UI contract is
`feedback_event_controls_ui_implementation_v0_1`.

## Feedback Event Controls UI Implementation v0.1

Feedback Event controls UI implementation v0.1 lets the folded audit panel
render feedback controls for dismiss/pin only. `dismiss_preview` is available
for Agent Perspective Substrate surfacing cards, and `pin_preview` is available
for the source coverage folded section.

These controls write durable feedback events only through
`POST /api/research-candidate/feedback-events`. `correct_preview` and
`invalidate_preview` remain disabled in this slice. The controls do not mutate
substrate snapshots, proof/evidence, work, Perspective state, agents, handoffs,
or product write. They perform no provider/OpenAI call, no source fetch, no
retrieval/RAG execution, no Codex/GitHub automation, and no product write.
Product-write remains parked by the #686 stopline. The next recommended slice
after the UI implementation is
`feedback_event_controls_ui_browser_validation_v0_1`.

## Feedback Event Controls UI Browser Validation v0.1

Feedback Event controls UI browser validation v0.1 confirms the dismiss/pin
feedback controls stay bounded after the UI implementation. It validates that
card-specific dismiss targets are bound to visible surfacing card ids and that
the source coverage pin remains section-level.

This slice adds no new UI behavior and does not change components. It uses
static component and fixture validation only: no app server, no browser UI, no
production DB, no route change, and no browser request execution. It performs no
provider/OpenAI call, no source fetch, no retrieval/RAG execution, no
proof/evidence write, no Perspective promotion, no work mutation, no
Codex/GitHub automation, and no product write. Product-write remains parked by
the #686 stopline. The next recommended slice after the UI browser validation
is `feedback_event_store_list_route_contract_v0_1`.

## Feedback Event Store List Route Contract v0.1

Feedback Event Store list route contract v0.1 documents future read/list behavior for `GET /api/research-candidate/feedback-events`. It is contract-only
fixture data and adds no route implementation.

The contract adds no app/api route, no GET export, no route handler, no server
action, no runtime DB read, no runtime DB write, no production DB open, no SQL
execution, no schema/migration change, no UI/component change, no DB read, and no browser
request. It performs no provider/OpenAI call, no source fetch, no retrieval/RAG
execution, no proof/evidence write, no Perspective promotion, no work mutation,
no Codex/GitHub automation, and no product write. Product-write remains parked
by the #686 stopline. The next recommended slice after the list route contract
is `feedback_event_store_list_route_implementation_v0_1`.

## Feedback Event Store List Route Implementation v0.1

Feedback Event Store list route implementation v0.1 implements
`GET /api/research-candidate/feedback-events` for bounded Feedback Event Store
reads. The route reads durable feedback events only; no feedback write occurs
on GET.

This implementation adds no UI/component change, no new route beyond the
existing feedback-events route module, no schema/migration change, and no
production DB use in smoke. It performs no provider/OpenAI call, no source
fetch, no retrieval/RAG execution, no proof/evidence write, no Perspective
promotion, no work mutation, no Codex/GitHub automation, no external handoff,
and no product write. Product-write remains parked by the #686 stopline. The
next recommended slice after the list route implementation is
`feedback_event_store_list_route_browser_validation_v0_1`.

## Feedback Event Store List Route Browser Validation v0.1

Feedback Event Store list route browser validation v0.1 validates
`GET /api/research-candidate/feedback-events` through route handler temp-DB
validation only. It reads durable feedback events only and confirms read,
filter, order, limit, `include_event_json=false`, and refusal behavior before
any list UI contract.

The validation starts no app server, uses no browser UI, and uses no production
DB read/write path. GET does not write feedback; no feedback write occurs. It
adds no UI/component change, no app/api route change, no route handler change,
and no schema/migration change. It performs no provider/OpenAI call, no source
fetch, no retrieval/RAG execution, no proof/evidence write, no Perspective
promotion, no work mutation, no Codex/GitHub automation, no external handoff,
and no product write. Product-write remains parked by the #686 stopline. The
next recommended slice after the list route browser validation is
`feedback_event_store_list_ui_contract_v0_1`.

## Feedback Event Store List UI Contract v0.1

Feedback Event Store list UI contract v0.1 maps future list panel requests for
`GET /api/research-candidate/feedback-events`. It defines deterministic
request previews, filter rules, display policy, state policy, error display
policy, and authority acknowledgement policy for a future UI list panel.

No UI component is implemented yet. No browser request is sent. No feedback event read happens now.
No feedback event write happens now, and no production
DB path is opened. The slice changes no app/api route, route handler, server
action, schema, migration, package dependency, component, browser persistence,
provider/OpenAI call, source fetch, retrieval/RAG execution, proof/evidence
state, Perspective promotion, work mutation, Codex/GitHub automation, external
handoff, product write, or product ID allocation. Product-write remains parked
by the #686 stopline. The next recommended slice after the list UI contract is
`feedback_event_store_list_ui_implementation_v0_1`.

## Feedback Event Store List UI Implementation v0.1

Feedback Event Store list UI implementation v0.1 adds a read-only feedback event history panel
to the folded audit surface. The panel uses the existing
`GET /api/research-candidate/feedback-events` route only and displays durable
feedback events as operator input only.

No feedback write from list UI is available. The panel does not mutate
substrate snapshots, create proof/evidence, promote Perspective state, change
work status, execute retrieval/RAG, call providers/OpenAI, fetch sources,
automate Codex/GitHub, send external handoffs, route agents, write products, or
allocate product IDs. It adds no app/api route, route handler, server action,
schema, migration, package dependency, browser persistence, or auto refresh.
Product-write remains parked by the #686 stopline. The next recommended slice
after the list UI implementation is
`feedback_event_store_list_ui_browser_validation_v0_1`.

## Feedback Event Store List UI Browser Validation v0.1

Feedback Event Store list UI browser validation v0.1 validates the #707
read-only Feedback event history panel in the folded audit panel. It confirms
the panel renders in the Agent Perspective Substrate folded audit panel,
receives `FEEDBACK_EVENT_STORE_LIST_UI_CONTRACT`, defaults to all feedback
events with limit 50 only, and has no target_kind or target_id default scope.

The validation confirms the allowed filters, the `GET
/api/research-candidate/feedback-events` request shape,
`feedback_event_store_list_route_request.v0.1`, `include_event_json=true`,
required read authority acknowledgements, local React state only,
loading/empty/success/refusal/validation failure displays, operator input only
labels, not proof/evidence, not Perspective state, not work status, not
retrieval/RAG result, not product write labels, and duplicate feedback
indication without mutation.

This is static validation only. It executes no runtime browser request and
starts no app server. It adds no feedback write from list UI, no POST, no
delete/edit/update/retry/write controls, no app/api route, route handler,
server action, schema, migration, package dependency, browser persistence, or
auto refresh. It creates no proof/evidence, performs no Perspective promotion,
makes no work mutation, calls no provider/OpenAI, fetches no source, executes
no retrieval/RAG, routes no agent, sends no external handoff, writes no
product state, and allocates no product IDs. Product-write remains parked by
the #686 stopline. The next recommended slice is
`feedback_event_aggregation_read_model_contract_v0_1`.

## Feedback Event Aggregation Read Model Contract v0.1

Feedback event aggregation read model contract v0.1 defines advisory/read-only
aggregation views over durable feedback events. It may summarize operator
feedback for review, but it is not proof/evidence, not Perspective state, not
work status, not promotion authority, not salience authority, not a
retrieval/RAG result, and not product write.

This slice is contract-only and fixture-backed. It adds no runtime
implementation, no runtime DB query, no browser request, no feedback
write/mutation, no app/api route, route handler, server action, schema,
migration, package dependency, browser persistence, provider/OpenAI call,
source fetch, retrieval/RAG execution, proof/evidence write, Perspective
promotion, durable Perspective state write, promotion decision record, work
mutation, salience governor, product write, product DB write, or product ID
allocation. Product-write remains parked by the #686 stopline. The next
recommended slice is
`feedback_event_aggregation_read_model_implementation_v0_1`.

## Feedback Event Aggregation Read Model Implementation v0.1

Feedback event aggregation read model implementation v0.1 is advisory/read-only
and fixture-backed. It deterministically summarizes operator feedback from
committed Feedback Event Store fixtures, but it is not proof/evidence, not
Perspective state, not work status, not promotion authority, not salience
authority, not a retrieval/RAG result, and not product write.

This slice adds no runtime DB query, no production DB read, no browser request,
no feedback write/mutation, no app/api route, route handler, server action,
component/UI implementation, schema, migration, package dependency, browser
persistence, provider/OpenAI call, source fetch, retrieval/RAG execution,
proof/evidence write, Perspective promotion, durable Perspective state write,
promotion decision record, work mutation, salience governor, product write,
product DB write, or product ID allocation. Product-write remains parked by the
#686 stopline. The next recommended slice is
`feedback_event_aggregation_read_model_browser_validation_v0_1`.

## Feedback Event Aggregation Read Model Browser Validation v0.1

Feedback event aggregation read model browser validation v0.1 validates the
advisory/read-only fixture-backed aggregation implementation from #710. It
confirms the deterministic read model remains sorted and limited by contract
policy, one recent-window row per `created_at_day`, duplicate groups as display
indicators only, and read-model-only authority boundaries.

This validation adds no runtime DB query, no production DB read, no browser
request, no feedback write/mutation, no app/api route, route handler, server
action, component/UI implementation, schema, migration, package dependency,
browser persistence, provider/OpenAI call, source fetch, retrieval/RAG
execution, proof/evidence write, Perspective promotion, durable Perspective
state write, promotion decision record, work mutation, salience governor,
product write, product DB write, or product ID allocation. It is not
proof/evidence, not Perspective state, not work status, not promotion
authority, not salience authority, not retrieval/RAG result, and not product
write. Product-write remains parked by the #686 stopline. The next recommended
slice is `formation_receipt_durable_event_contract_v0_1`.

## Formation Receipt Durable Event Contract v0.1

Formation Receipt durable event contract v0.1 records selected/excluded context
and unresolved tensions as audit/provenance only. It preserves source refs,
candidate refs, digest refs, handoff refs, decision refs, result refs, excluded
context reasons, and unresolved tensions, but it is not proof/evidence, not
Perspective state, not work status, not promotion authority, not salience
authority, not retrieval/RAG result, and not product write.

This contract slice defines the durable event shape only. It adds no durable
event write implementation, no runtime DB write, no production DB read, no
route, no route handler, no server action, no component/UI implementation, no
browser request, no browser persistence, no provider/OpenAI call, no source
fetch, no retrieval/RAG execution, no proof/evidence write, no Perspective
promotion, no durable Perspective state write, no promotion decision record, no
work mutation, no salience governor, no product write, no product DB write, and
no product ID allocation. Product-write remains parked by the #686 stopline.
The next recommended slice is
`formation_receipt_durable_event_implementation_v0_1`.

## Formation Receipt Durable Event Implementation v0.1

Formation Receipt durable event implementation v0.1 is deterministic and
fixture-backed. It generates receipt-shaped provenance artifacts only from the
#712 contract fixture, preserving selected/excluded context, excluded reasons,
unresolved tensions, digest refs, handoff refs, decision refs, and result refs.

This implementation is not proof/evidence, not Perspective state, not work
status, not promotion authority, not salience authority, not retrieval/RAG
result, and not product write. It adds no runtime persistence, no runtime DB
write/query, no production DB read, no schema/migration, no route, no route
handler, no server action, no component/UI implementation, no browser request,
no browser persistence, no feedback write/mutation, no provider/OpenAI call, no
source fetch, no retrieval/RAG execution, no proof/evidence write, no
Perspective promotion, no durable Perspective state write, no promotion
decision record, no work mutation, no salience governor, no product write, no
product DB write, and no product ID allocation. Product-write remains parked by
the #686 stopline. The next recommended slice is
`formation_receipt_durable_event_browser_validation_v0_1`.

## Formation Receipt Durable Event Browser Validation v0.1

Formation Receipt durable event browser validation v0.1 validates deterministic
fixture-backed provenance artifacts only. It validates the #713 builder output,
the generated receipt event shape from the #712 contract, selected/excluded
context summaries, invalid override summary/validation consistency, unresolved
tension preservation, and reference-only handoff/decision/result links.

This validation is not proof/evidence, not Perspective state, not work status,
not promotion authority, not salience authority, not retrieval/RAG result, and
not product write. It adds no runtime persistence, no runtime DB write/query,
no production DB read, no schema/migration, no route, no route handler, no
server action, no component/UI implementation, no browser request, no browser
persistence, no feedback write/mutation, no provider/OpenAI call, no source
fetch, no retrieval/RAG execution, no proof/evidence write, no Perspective
promotion, no durable Perspective state write, no promotion decision record, no
work mutation, no salience governor, no product write, no product DB write, and
no product ID allocation. Product-write remains parked by the #686 stopline.
The next recommended slice is Recent Rehearsal Buffer contract v0.1:
`recent_rehearsal_buffer_contract_v0_1`.

## Recent Rehearsal Buffer Contract v0.1

Recent Rehearsal Buffer contract v0.1 defines compact, non-durable resume context
for recent work in Research Candidate review. It may carry the last active
research question, active perspective/candidate context, recent failed checks,
open tensions, last user/operator decisions, recent context refs, excluded
context refs, and decay context, but this slice is contract-only.

The buffer is not proof/evidence, not Perspective state, not work status, not
promotion authority, not salience authority, not retrieval/RAG result, and not
product write. It is a non-durable working memory adapter that may later help a
human workbench or agent brief resume work, but it does not write durable
memory, implement runtime DB query/write behavior, start browser requests, call
providers/OpenAI, fetch sources, execute retrieval/RAG, promote Perspective
state, mutate work, or allocate product IDs. Product-write remains parked by
the #686 stopline.

The next recommended slice is
`recent_rehearsal_buffer_implementation_v0_1`.

## Recent Rehearsal Buffer Implementation v0.1

Recent Rehearsal Buffer implementation v0.1 is deterministic and fixture-backed.
It generates compact non-durable resume context only from the #715 contract
fixture, preserving recent context refs, excluded context reasons, last open
tensions, failed-check and user-decision references, and decay state.

This implementation is not proof/evidence, not Perspective state, not work
status, not promotion authority, not salience authority, not retrieval/RAG
result, and not product write. It adds no runtime persistence, no durable memory
write, no runtime DB write/query, no production DB read, no schema/migration, no
route, no route handler, no server action, no component/UI implementation, no
browser request, no browser persistence, no formation receipt write, no feedback
write/mutation, no provider/OpenAI call, no source fetch, no retrieval/RAG
execution, no proof/evidence write, no Perspective promotion, no durable
Perspective state write, no promotion decision record, no work mutation, no
salience governor, no product write, no product DB write, and no product ID
allocation. Product-write remains parked by the #686 stopline. The next
recommended slice is
`recent_rehearsal_buffer_browser_validation_v0_1`.

Recent Rehearsal Buffer browser validation v0.1 validates deterministic
fixture-backed compact non-durable resume context only. It validates the #716
builder output against the #715 contract fields, generated buffer contract
authority boundary, top-level implementation boundary separation, resume
context summary, decay summary, and invalid override summary/validation
consistency.

This validation is not proof/evidence, not Perspective state, not work status,
not promotion authority, not salience authority, not retrieval/RAG result, and
not product write. It adds no runtime persistence, no durable memory write, no
runtime DB write/query, no production DB read, no schema/migration, no route, no
route handler, no server action, no component/UI implementation, no browser
request, no browser persistence, no formation receipt write, no feedback
write/mutation, no provider/OpenAI call, no source fetch, no retrieval/RAG
execution, no proof/evidence write, no Perspective promotion, no durable
Perspective state write, no promotion decision record, no work mutation, no
salience governor, no product write, no product DB write, and no product ID
allocation. Product-write remains parked by the #686 stopline. The next
recommended slice is Salience Governor contract v0.1:
`salience_governor_contract_v0_1`.

Salience Governor contract v0.1 is display/reuse priority only. It defines
contract-only salience components, inhibition components, hint-only action
policy, and a display-only priority view for candidate overload reduction.

Salience Governor is not proof/evidence, not Perspective state, not work
status, not promotion authority, not salience authority, not retrieval/RAG
result, and not product write. Salience score must not be treated as promotion
readiness, durable approval, evidence strength, source of truth, work status, or
product write authority. This contract adds no runtime salience scoring, no
runtime persistence, no durable memory write, no runtime DB write/query, no
production DB read, no schema/migration, no route, no route handler, no server
action, no component/UI implementation, no browser request, no browser
persistence, no recent rehearsal buffer write, no formation receipt write, no
feedback write/mutation, no provider/OpenAI call, no source fetch, no
retrieval/RAG execution, no proof/evidence write, no Perspective promotion, no
durable Perspective state write, no promotion decision record, no candidate/work
mutation, no product write, no product DB write, and no product ID allocation.
Product-write remains parked by the #686 stopline. The next recommended slice is
`salience_governor_implementation_v0_1`.

Salience Governor implementation v0.1 is deterministic and fixture-backed. It
generates display/reuse priority preview only from the #718 contract fixture and
keeps salience component, inhibition component, action hint, and priority view
summaries as static implementation output.

This implementation is not proof/evidence, not Perspective state, not work
status, not promotion authority, not salience authority, not retrieval/RAG
result, and not product write. Salience score must not be treated as promotion
readiness, durable approval, evidence strength, source of truth, work status,
or authority. It adds no runtime salience scoring, no runtime persistence, no
durable salience write, no durable memory write, no runtime DB write/query, no
production DB read, no schema/migration, no route, no route handler, no server
action, no component/UI implementation, no browser request, no browser
persistence, no recent rehearsal buffer write, no formation receipt write, no
feedback write/mutation, no provider/OpenAI call, no source fetch, no
retrieval/RAG execution, no proof/evidence write, no Perspective promotion, no
durable Perspective state write, no promotion decision record, no
candidate/work mutation, no product write, no product DB write, and no product
ID allocation. Product-write remains parked by the #686 stopline. The next
recommended slice is
`salience_governor_browser_validation_v0_1`.

Salience Governor browser validation v0.1 validates deterministic
fixture-backed display/reuse priority preview only. It validates the #719
builder output against the #718 contract authority boundary, top-level
implementation boundary separation, action hints, salience score preview range,
and synthetic `top_k` override behavior.

This validation is not proof/evidence, not Perspective state, not work status,
not promotion authority, not salience authority, not retrieval/RAG result, and
not product write. Salience score must not be treated as promotion readiness,
durable approval, evidence strength, source of truth, work status, or authority.
It adds no runtime salience scoring, no runtime persistence, no durable
salience write, no durable memory write, no runtime DB write/query, no
production DB read, no schema/migration, no route, no route handler, no server
action, no component/UI implementation, no browser request, no browser
persistence, no recent rehearsal buffer write, no formation receipt write, no
feedback write/mutation, no provider/OpenAI call, no source fetch, no
retrieval/RAG execution, no proof/evidence write, no Perspective promotion, no
durable Perspective state write, no promotion decision record, no
candidate/work mutation, no product write, no product DB write, and no product
ID allocation. Product-write remains parked by the #686 stopline. The next
recommended slice is Bounded External Source Intake contract v0.1:
`bounded_external_source_intake_contract_v0_1`.

Bounded External Source Intake contract v0.1 is reference-only and
operator-provided in this contract. It defines how public-safe external source
references may later prepare candidate generation inputs while preserving
source refs, operator context, provenance, privacy, and non-authority
boundaries.

This contract is not source fetch, not crawler behavior, not provider
extraction, not retrieval/RAG, not proof/evidence, not Perspective state, not
work status, not promotion authority, not salience authority, and not product
write. Source references may prepare candidate generation later, but this PR is
contract-only and adds no candidate generation now. It adds no runtime source
fetch, no crawler, no provider/OpenAI call, no provider extraction, no
retrieval/RAG execution, no source index write, no durable source record write,
no runtime persistence, no durable memory write, no runtime DB write/query, no
production DB read, no schema/migration, no route, no route handler, no server
action, no component/UI implementation, no browser request, no browser
persistence, no durable salience write, no recent rehearsal buffer write, no
formation receipt write, no feedback write/mutation, no proof/evidence write,
no Perspective promotion, no durable Perspective state write, no promotion
decision record, no candidate/work mutation, no product write, no product DB
write, and no product ID allocation. Product-write remains parked by the #686
stopline. The next recommended slice is
`bounded_external_source_intake_implementation_v0_1`.

Bounded External Source Intake implementation v0.1 is deterministic and
fixture-backed. It generates reference-only source intake bundles from the #721
contract for operator-provided, public-safe source references.

This implementation records source intake references only. It is not source
fetch, not crawler behavior, not provider extraction, not retrieval/RAG, not
proof/evidence, not Perspective state, not work status, not promotion
authority, not salience authority, not candidate/work mutation, and not product
write. It adds no runtime source fetch, no crawler, no provider/OpenAI call, no
provider extraction, no retrieval/RAG execution, no source index write, no
durable source record write, no runtime persistence, no durable memory write,
no runtime DB write/query, no production DB read, no schema/migration, no
route, no route handler, no server action, no component/UI implementation, no
browser request, no browser persistence, no durable salience write, no recent
rehearsal buffer write, no formation receipt write, no feedback
write/mutation, no proof/evidence write, no Perspective promotion, no durable
Perspective state write, no promotion decision record, no candidate/work
mutation, no product write, no product DB write, and no product ID allocation.
Product-write remains parked by the #686 stopline. The next recommended slice
is `bounded_external_source_intake_browser_validation_v0_1`.

Bounded External Source Intake browser validation v0.1 validates
deterministic fixture-backed reference-only source intake bundles from the #722
implementation. It confirms the generated source intake bundle keeps the #721
contract authority boundary, keeps top-level implementation authority separate,
and rejects invalid source_refs overrides for disallowed input kinds, unknown
input kinds, source fetch enabled, provider extraction enabled, candidate
generation now, missing source refs, missing operator context, non-public-safe
refs, and invalid source status.

This validation is not source fetch, not crawler behavior, not provider
extraction, not retrieval/RAG, not proof/evidence, not Perspective state, not
work status, not promotion authority, not salience authority, not
candidate/work mutation, and not product write. It adds no runtime source
fetch, no crawler behavior, no provider/OpenAI call, no provider extraction, no
retrieval/RAG execution, no source index write, no durable source record write,
no runtime persistence, no durable memory write, no runtime DB write/query, no
production DB read, no schema/migration, no route, no route handler, no server
action, no component/UI implementation, no browser request, no browser
persistence, no durable salience write, no recent rehearsal buffer write, no
formation receipt write, no feedback write/mutation, no proof/evidence write,
no Perspective promotion, no durable Perspective state write, no promotion
decision record, no candidate/work mutation, no product write, no product DB
write, and no product ID allocation. Product-write remains parked by the #686
stopline. The next recommended slice is Operator Source Candidate Generation
contract v0.1: `operator_source_candidate_generation_contract_v0_1`.

Operator Source Candidate Generation contract v0.1 is contract-only and
preview-only. It defines how bounded, operator-provided, reference-only source
intake bundles may later produce candidate preview families for claims,
evidence candidates, tensions, knowledge gaps, Perspective deltas, and
follow-up work, but this PR does not implement generation.

This contract is not source fetch, not crawler behavior, not provider
extraction, not retrieval/RAG, not proof/evidence, not Perspective state, not
work status, not promotion authority, not salience authority, not
candidate/work mutation, and not product write. It adds no runtime candidate
generation, no runtime source fetch, no crawler behavior, no provider/OpenAI
call, no provider extraction, no retrieval/RAG execution, no source index
write, no durable source record write, no candidate record write, no runtime
persistence, no durable memory write, no runtime DB write/query, no production
DB read, no schema/migration, no route, no route handler, no server action, no
component/UI implementation, no browser request, no browser persistence, no
durable salience write, no recent rehearsal buffer write, no formation receipt
write, no feedback write/mutation, no proof/evidence write, no Perspective
promotion, no durable Perspective state write, no promotion decision record, no
candidate/work mutation, no product write, no product DB write, and no product
ID allocation. Product-write remains parked by the #686 stopline. The next
recommended slice is
`operator_source_candidate_generation_implementation_v0_1`.

## Next Recommended Slice

`operator_source_candidate_generation_implementation_v0_1`
