# Augnes Research Candidate Canonical Promotion Gates v0.1

## Purpose

This slice defines a static audit for preventing raw research/source strings
from becoming canonical labels, operational tags, dashboard keys, task schema
IDs, or evidence metadata promoted keys.

Research candidate review may preserve unstable source strings as display
text, source pointers, local candidate IDs, or public-safe audit samples. This
gate keeps those strings candidate/pointer/raw-only unless they are explicitly
allowed as closed, low-cardinality vocabulary.

## Source Work Routing

- Work ID: `AG-RESEARCH-CANDIDATE-CANONICAL-GATES-001`
- Scope: `project:augnes`
- Related state keys:
  - `research.candidate_review`
  - `research.canonical_promotion_gates`
  - `perspective.development`

## Relationship To Research Candidate Review Surface

This gate follows the Research Candidate Review contract artifacts:

- `docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md`
- `types/research-candidate-review.ts`
- `fixtures/research-candidate-review.sample.v0.1.json`
- `scripts/smoke-research-candidate-review-types-v0-1.mjs`

This PR does not change the Research Candidate Review preview contract. It adds
a static gate around how raw source/candidate strings may be used in future
slices.

This gate is static audit only and non-authoritative.

## Threat Model

A raw title, URL, provider ID, thread ID, arbitrary user label, or demo DB ref
can look stable enough to become a state key or operational tag. That pollutes
ontology, dashboards, task routing, and future evidence metadata.

Examples to block:

- paper title becoming `target_perspective_key`
- source URL becoming `dashboard_group_key`
- provider run ID becoming `operational_tag`
- raw thread ID becoming `task_schema_id`
- arbitrary pasted user label becoming `canonical_state_label`
- demo DB ref becoming evidence metadata promoted key

## Gate Vocabulary

`input_class` values:

- `source_title`
- `source_url`
- `doi_or_identifier`
- `provider_id`
- `workspace_id`
- `thread_id`
- `run_id`
- `raw_session_id`
- `arbitrary_user_string`
- `episode_id`
- `demo_db_ref`
- `source_ref_id`
- `candidate_id`
- `repo_path`
- `work_id`
- `low_cardinality_enum`

`proposed_usage` values:

- `raw_display`
- `source_pointer`
- `local_candidate_id`
- `local_preview_id`
- `review_label`
- `canonical_state_label`
- `dashboard_group_key`
- `task_schema_id`
- `evidence_metadata_promoted_key`
- `operational_tag`
- `type_union_literal`

`disposition` values:

- `blocked_canonical_promotion`
- `raw_only`
- `source_pointer_only`
- `candidate_id_only`
- `allowed_repo_path_pointer`
- `allowed_work_id_pointer`
- `allowed_low_cardinality_enum`

## Blocked Promotion Targets

For unstable/raw input classes, these proposed usages are blocked:

- `canonical_state_label`
- `dashboard_group_key`
- `task_schema_id`
- `evidence_metadata_promoted_key`
- `operational_tag`

The blocked input classes are:

- `source_title`
- `source_url`
- `doi_or_identifier`
- `provider_id`
- `workspace_id`
- `thread_id`
- `run_id`
- `raw_session_id`
- `arbitrary_user_string`
- `episode_id`
- `demo_db_ref`

## Allowed Pointer And Candidate Uses

- `source_ref_id` may be used as a local preview pointer, not as a canonical
  state label.
- Candidate IDs may be used inside a candidate bundle, not as global
  operational tags.
- Repo paths may be used as source pointers, not as newly invented state
  labels.
- Work IDs may be used as existing work pointers, not as arbitrary
  research-derived labels.
- Raw titles/URLs may appear as display/reference fields only.

## Allowed Low-Cardinality Vocabulary

Closed, documented union values may be used as labels because they are
controlled vocabulary.

Allowed examples from `types/research-candidate-review.ts`:

- `review_status` values
- `epistemic_status` values
- `delta_type` values
- `promotion_readiness` values
- `evidence_role` values
- `tension_type` values
- authority boolean fields from `ResearchCandidateReviewAuthority`

## Gate Rules

### RCR-GATE-001

Raw source strings must not become canonical labels.

### RCR-GATE-002

Provider/workspace/thread/run/session IDs must not become operational tags or
task schema IDs.

### RCR-GATE-003

Source URLs and DOI-like identifiers remain source pointers or raw display
fields only.

### RCR-GATE-004

Candidate IDs remain local preview IDs unless a later explicit durable record
design says otherwise.

### RCR-GATE-005

Only closed low-cardinality vocabulary from the type contract may be used as
review/status labels.

### RCR-GATE-006

`target_perspective_key` must not be copied from source titles, URLs,
DOI/provider IDs, raw thread IDs, or arbitrary pasted user strings.

### RCR-GATE-007

Future durable candidate/review storage must store raw unstable strings as
raw/source fields, not promoted ontology keys.

### RCR-GATE-008

This gate is a static audit slice, not a permanent ban on future bounded source
intake, retrieval, or durable review records.

This gate does not permanently ban future bounded research lanes.

## Sample Fixture Contract

The public-safe sample fixture is:

- `fixtures/research-candidate-canonical-promotion-gates.sample.v0.1.json`

It includes blocked promotion samples, allowed pointer samples, allowed
low-cardinality samples, and the static audit surface file list.

## Static Audit Scope

The smoke checks only static docs/fixture/type/sample surfaces. It does not
call runtime, DB, network, API routes, MCP/App tools, OpenAI, GitHub, or
external services.

This slice has no runtime/API/DB/provider/retrieval/persistence behavior.

The manual parser preserves canonical promotion gates: raw source strings remain raw/source-bound. Source title, origin, identifier, and note text stay
display/reference material, while `target_perspective_key` remains a stable
dotted key such as `research.candidate_review`. The parser adds no runtime/API/DB/provider/retrieval/promotion behavior.

The parser output Cockpit/Perspective static preview panel renders the static parser output fixture read-only. Raw source title/origin/identifier remain
raw/source-bound display material, and `target_perspective_key` remains a
stable dotted key. The panel adds no runtime/API/DB/provider/retrieval/promotion
behavior.

The Candidate Constellation Overlay preview preserves canonical promotion
gates. Node IDs and edge IDs must not use raw source titles, URLs, provider
IDs, raw thread/run/session strings, arbitrary user strings, episode IDs, or
demo refs. Target perspective anchors are read-only and non-authoritative. The
overlay adds no graph DB, layout algorithm, runtime/API/DB/provider/retrieval,
or promotion behavior.

The PerspectiveGeometryDigest Builder v0.1 preserves canonical promotion
gates. Candidate Constellation Overlay can now be summarized into
PerspectiveGeometryDigest for AI-usable derived structure, but layout
coordinates as truth are explicitly forbidden. The digest is derived/advisory
only; it is not source of truth, proof, evidence, durable Perspective state,
retrieval result, or agent execution authority. It adds no provider/OpenAI
call, no source fetch, no retrieval or indexing execution, no route/UI
behavior, no DB/SQL/transaction, no proof/evidence write, no work item
creation, no durable Perspective promotion, and no product write. Product-write
remains parked by the #686 stopline. Next recommended slice:
`agent_perspective_substrate_docs_type_fixture_v0_1`.

Agent Perspective Substrate v0.1 preserves canonical promotion gates.
PerspectiveGeometryDigest can now feed Agent Perspective Substrate as advisory
input. The substrate remains a folded advisory layer; it is not source of
truth, proof, evidence, durable Perspective state, execution authority, agent
routing, retrieval result, or product write authority. Surfaced warnings,
suggestions, blockers, and handoff improvements must carry `source_refs` or an
explicit source coverage boundary note, `why_now`, epistemic/review status, and
`authority_boundary_notes`. The substrate adds no runtime route/UI behavior, no
DB/SQL/transaction, no provider/OpenAI call, no source fetch, no retrieval
execution or indexing implementation, no proof/evidence write, no work
mutation or work item creation, no durable Perspective
promotion, no agent execution/routing, no MCP/App tool widening, and no product
write. Product-write remains parked by the #686 stopline. Next recommended
slice: `agent_perspective_substrate_preview_builder_v0_1`.

Agent Perspective Substrate Preview Builder v0.1 preserves canonical
promotion gates. The #688 substrate fixture can now be folded into an advisory
preview artifact with folded-by-default sections, surfacing cards, rule groups,
source coverage preview, diagnostics, and an advisory-only authority boundary.
Every preview card must carry `source_refs` or an explicit source coverage
boundary note, `epistemic_status`, `review_status`, `why_now`, and
`authority_boundary_notes`. The preview remains non-authoritative: not source
of truth, proof/evidence, durable Perspective state, execution authority,
retrieval execution, agent routing, or product write authority. It adds no
runtime route/UI yet, no API route, no UI/component change, no
DB/SQL/transaction, no provider/OpenAI call, no source fetch, no retrieval
execution or indexing implementation, no proof/evidence write, no work
mutation or work item creation, no durable Perspective promotion, no agent
execution/routing, no MCP/App tool widening, and no product write.
Product-write remains parked by the #686 stopline. Next recommended slice:
`cockpit_agent_perspective_substrate_folded_audit_panel_v0_1`.

Cockpit Agent Perspective Substrate folded audit panel v0.1 preserves
canonical promotion gates. The #689 preview fixture can now be displayed in
Cockpit as a folded audit panel from static advisory input. The panel keeps
folded state local to the component, renders suggested actions as preview
labels only, and has no durable feedback persistence or feedback persistence.
Every displayed surfacing card must carry `source_refs` or an explicit source
coverage boundary note, `epistemic_status`, `review_status`, `why_now`, and
`authority_boundary_notes`. The panel remains non-authoritative: not source of
truth, proof/evidence, durable Perspective state, execution authority,
retrieval execution, agent routing, product write authority, or feedback
persistence. It adds no API route, no server action, no DB/SQL/transaction, no
provider/OpenAI call, no source fetch, no retrieval execution or indexing
implementation, no proof/evidence write, no work mutation or work item
creation, no durable Perspective promotion, no agent execution/routing, no
MCP/App tool widening, and no product write. Product-write remains parked by
the #686 stopline. Next recommended slice:
`ai_context_packet_compiler_geometry_substrate_upgrade_v0_1`.

AI Context Packet compiler GeometryDigest/Substrate upgrade v0.1 preserves
canonical promotion gates. It upgrades the Research Candidate AI Context Packet
compiler with #687 GeometryDigest, #688 Agent Perspective Substrate, #689
substrate preview, and #690 folded audit panel lineage as advisory input. The
upgraded packet remains non-authoritative and target-agent-safe: not source of
truth, proof/evidence, durable Perspective state, execution authority,
retrieval/RAG execution, agent routing, Codex execution, external handoff,
product write authority, or DB write authority. Manual-note AI Context Packet
and manual-note Formation Receipt fixtures are included directly in upgraded
packet lineage while remaining preview-only and non-authoritative. It adds no
route/UI behavior, no DB/SQL/transaction, no provider/OpenAI call, no source
fetch, no retrieval/RAG execution, no Codex execution, no GitHub automation, no
external handoff sending, no proof/evidence write, no work mutation or work
item creation, no durable Perspective promotion, no MCP/App tool widening, and no product write.
Product-write remains parked by the #686 stopline. Next recommended slice:
`candidate_to_codex_handoff_draft_geometry_substrate_v0_1`.

Candidate-to-Codex handoff draft Geometry/Substrate v0.1 preserves canonical
promotion gates. It consumes the #691 upgraded AI Context Packet only as
advisory input and emits copyable preview text plus structured fixture data for
a future handoff draft review slice. It preserves GeometryDigest, Agent
Substrate, folded audit, static/base packet lineage, and manual-note
packet/receipt lineage while remaining non-authoritative: not source of truth,
not proof/evidence, not durable Perspective state, not execution authority,
not retrieval/RAG output, not GitHub automation, not external handoff sending,
and not product write authority. It adds no Codex execution, no
branch/PR/GitHub automation, no external handoff sending, no provider/OpenAI
call, no source fetch, no retrieval/RAG execution, no DB/SQL/transaction, no proof/evidence
write, no work mutation or work item creation, no durable Perspective
promotion, no route/UI behavior, no agent routing/execution, and no product
write. Product-write remains parked by the #686 stopline. Next recommended
slice: `candidate_to_codex_handoff_draft_review_v0_1`.
No branch/PR/GitHub automation is allowed from this draft.

Candidate-to-Codex handoff draft review v0.1 preserves canonical promotion
gates before any human may use the #692 draft as a Codex task. It consumes the
#692 handoff draft fixture only as advisory input and remains review-only and
copyable-preview-only. The review preserves GeometryDigest, Agent Substrate,
Folded Audit, static/base packet lineage, manual-note packet/receipt lineage,
source refs, unresolved tensions, and the product-write stopline.

The review artifact is still not source of truth, proof/evidence, durable
state, execution authority, retrieval/RAG execution, agent routing, Codex
execution, GitHub automation, external handoff, or product write authority. It
adds no Codex execution, no branch/PR/GitHub automation, no external handoff
sending, no provider/OpenAI call, no source fetch, no retrieval/RAG execution,
no DB/SQL/transaction, no proof/evidence write, no work mutation or work item
creation, no durable Perspective promotion, no route/UI behavior, no agent
routing/execution, and no product write. Product-write remains parked by the
#686 stopline. Next recommended slice:
`candidate_to_codex_handoff_operator_decision_v0_1`.

Candidate-to-Codex handoff operator decision preview v0.1 preserves canonical
promotion gates before any future execution discussion. It consumes the #693
handoff draft review fixture only as advisory input and keeps the operator
decision required but not satisfied. The preview preserves manual lineage,
source refs, unresolved tensions, and the product-write stopline.

The operator decision preview is still not source of truth, proof/evidence,
durable state, execution authority, retrieval/RAG execution, agent routing,
Codex execution, GitHub automation, external handoff, or product write
authority. It adds no Codex execution, no branch/PR/GitHub automation, no
external handoff sending, no provider/OpenAI call, no source fetch, no
retrieval/RAG execution, no DB/SQL/transaction, no proof/evidence write, no
work mutation or work item creation, no durable Perspective promotion, no
route/UI behavior, no agent routing/execution, and no product write.
Product-write remains parked by the #686 stopline. Next recommended slice:
`feedback_event_store_minimal_v0_1`.

Feedback Event Store minimal v0.1 begins M15 while preserving canonical
promotion gates for Research-to-Perspective preview feedback. It records
durable operator feedback events only, including dismiss, pin, correct, and
invalidate preview feedback, and preserves source refs, target id, and an
explicit authority boundary for each event.

Feedback events are not source of truth, not proof/evidence, not Perspective
promotion decisions, not work mutation, not execution authority, not
retrieval/RAG execution, not agent routing, not Codex execution, not GitHub
automation, not external handoff, and not product write authority. The slice adds no proof/evidence record,
no durable Perspective promotion, no work mutation or work item creation, no
Codex execution, no branch/PR/GitHub automation, no external handoff sending,
no provider/OpenAI call, no source fetch, no retrieval/RAG execution, no
agent routing/execution, and no product write or product IDs. Product-write
remains parked by the #686 stopline. Next recommended slice:
`feedback_event_store_review_controls_preview_v0_1`.

Feedback Event Store review controls preview v0.1 preserves canonical
promotion gates while mapping review surfaces and surfacing cards to feedback
event previews only. It defines disabled, preview-only controls for dismiss,
pin, correct, and invalidate feedback intent, but it does not write feedback
events yet and does not add runtime persistence.

The review controls preview is not source of truth, not proof/evidence, not
Perspective promotion, not work mutation, not execution authority, not
retrieval/RAG execution, not agent routing, not Codex execution, not GitHub
automation, not external handoff, and not product write authority. The slice
adds no route/server action/DB write, no proof/evidence record, no durable
Perspective promotion, no work mutation or work item creation, no Codex
execution, no branch/PR/GitHub automation, no external handoff sending, no
provider/OpenAI call, no source fetch, no retrieval/RAG execution, no agent
routing/execution, and no product write or product IDs. Product-write remains
parked by the #686 stopline. Next recommended slice:
`feedback_event_write_route_contract_v0_1`.

Feedback Event write route contract v0.1 preserves canonical promotion gates
before any feedback write route implementation. It documents future
`POST /api/research-candidate/feedback-events` behavior as contract-only
fixture data, including request, response, refusal, idempotency, and authority
boundary expectations.

The route contract is not source of truth, not proof/evidence, not
Perspective promotion, not work mutation, not execution authority, not
retrieval/RAG execution, not agent routing, not Codex execution, not GitHub
automation, not external handoff, and not product write authority. The slice
adds no app/api route, no route handler, no server action, no DB open/write,
no SQL execution, no schema/migration change, no proof/evidence record, no
durable Perspective promotion, no work mutation or work item creation, no
Codex execution, no branch/PR/GitHub automation, no external handoff sending,
no provider/OpenAI call, no source fetch, no retrieval/RAG execution, no agent
routing/execution, and no product write or product IDs. Product-write remains
parked by the #686 stopline. Next recommended slice:
`feedback_event_write_route_implementation_v0_1`.

Feedback Event write route implementation v0.1 preserves canonical promotion
gates while implementing only `POST /api/research-candidate/feedback-events`
for Feedback Event Store v0.1 records. The route persists feedback events only
through the feedback event store helper.

The route implementation is not source of truth, not proof/evidence, not
Perspective promotion, not work mutation, not execution authority, not
retrieval/RAG execution, not agent routing, not Codex execution, not GitHub
automation, not external handoff, and not product write authority. The slice
adds no UI/component change, no proof/evidence record, no Perspective promotion, no durable Perspective
promotion, no work mutation or work item creation, no Codex execution, no
branch/PR/GitHub automation, no external handoff sending, no provider/OpenAI
call, no source fetch, no retrieval/RAG execution, no agent routing/execution,
and no product write or product IDs. Product-write remains parked by the #686
stopline. Next recommended slice:
`feedback_event_write_route_browser_validation_v0_1`.

Feedback Event write route browser validation v0.1 preserves canonical
promotion gates while validating only the #698 Feedback Event write route
behavior. It invokes the exported route handler with a temp DB under `/tmp` and
observes insert, duplicate idempotency, required refusal, authority-boundary
refusal, and capability/status flag refusal behavior for durable feedback events
only.

The validation is not source of truth, not proof/evidence, not Perspective
promotion, not work mutation, not execution authority, not retrieval/RAG
execution, not agent routing, not Codex execution, not GitHub automation, not
external handoff, and not product write authority. The slice starts no app
server, uses no browser UI, uses no production DB path, adds no UI/component
change, adds no route behavior, changes no schema/migrations, performs no
provider/OpenAI call, performs no source fetch, performs no retrieval/RAG
execution, and creates no proof/evidence/Perspective/work/product durable state.
Product-write remains parked by the #686 stopline. Next recommended slice:
`feedback_event_controls_ui_contract_v0_1`.

Feedback Event controls UI contract v0.1 preserves canonical promotion gates
while defining request previews for future UI controls. It maps preview
controls to future `POST /api/research-candidate/feedback-events` requests, but
does not implement the UI controls.

The controls UI contract is not source of truth, not proof/evidence, not
Perspective promotion, not work mutation, not execution authority, not
retrieval/RAG execution, not agent routing, not Codex execution, not GitHub
automation, not external handoff, and not product write authority. No UI
control is implemented, no UI component is changed, No browser request is sent,
and No feedback is persisted now. The slice adds no route behavior, no server
action, no DB open, no SQL execution, performs no provider/OpenAI call, performs
no source fetch, performs no retrieval/RAG execution, and creates no
proof/evidence/Perspective/work/product durable state. Product-write remains
parked by the #686 stopline. Next recommended slice:
`feedback_event_controls_ui_implementation_v0_1`.

Feedback Event controls UI implementation v0.1 preserves canonical promotion
gates while activating only the first narrow feedback controls in the folded
audit panel. It enables `dismiss_preview` for Agent Perspective Substrate
surfacing cards and `pin_preview` for the source coverage folded section.

The controls UI implementation is not source of truth, not proof/evidence, not
Perspective promotion, not work mutation, not execution authority, not
retrieval/RAG execution, not agent routing, not Codex execution, not GitHub
automation, not external handoff, and not product write authority. It sends
browser requests only to `POST /api/research-candidate/feedback-events` and
writes durable feedback events only. `correct_preview` and
`invalidate_preview` remain disabled. The slice adds no new route behavior, no
schema/migration change, performs no provider/OpenAI call, performs no source
fetch, performs no retrieval/RAG execution, and creates no
proof/evidence/Perspective/work/product durable state. Product-write remains
parked by the #686 stopline. Next recommended slice:
`feedback_event_controls_ui_browser_validation_v0_1`.

Feedback Event controls UI browser validation v0.1 preserves canonical
promotion gates while validating the existing controls UI. It validates
card-specific dismiss targets, the section-level source coverage pin, disabled
correct/invalidate controls, and the single feedback-event route boundary.

The validation is not source of truth, not proof/evidence, not Perspective
promotion, not work mutation, not execution authority, not retrieval/RAG
execution, not agent routing, not Codex execution, not GitHub automation, not
external handoff, and not product write authority. It adds no route/UI behavior,
changes no components, starts no app server, uses no production DB, sends no
browser requests in smoke, performs no provider/OpenAI call, performs no source
fetch, performs no retrieval/RAG execution, and creates no
proof/evidence/Perspective/work/product durable state. Product-write remains
parked by the #686 stopline. Next recommended slice:
`feedback_event_store_list_route_contract_v0_1`.

Feedback Event Store list route contract v0.1 preserves canonical promotion
gates while documenting future read/list behavior. It is a
contract-only fixture for `GET /api/research-candidate/feedback-events` and is
not a route implementation.

The contract is not source of truth, not proof/evidence, not Perspective
promotion, not work mutation, not feedback mutation, not execution authority,
not retrieval/RAG execution, not agent routing, not Codex execution, not GitHub
automation, not external handoff, and not product write authority. It adds no
app/api route change, no GET export, no server action, no runtime DB read, no
runtime DB write, no DB read, no DB write, no production DB open, no SQL
execution, no schema/migration change, no UI/component change, and no browser
request. It performs no
provider/OpenAI call, performs no source fetch, performs no retrieval/RAG
execution, and creates no proof/evidence/Perspective/work/product durable
state. Product-write remains parked by the #686 stopline. Next recommended
slice: `feedback_event_store_list_route_implementation_v0_1`.

Feedback Event Store list route implementation v0.1 preserves canonical
promotion gates while implementing the bounded read path. It implements
`GET /api/research-candidate/feedback-events` for durable feedback-event reads
only. This route reads durable feedback events only.

The implementation is not source of truth, not proof/evidence, not Perspective
promotion, not work mutation, not feedback mutation, not execution authority,
not retrieval/RAG execution, not agent routing, not Codex execution, not GitHub
automation, not external handoff, and not product write authority. GET does not
write feedback events; no feedback write occurs on GET. It adds no UI/component change, no schema/migration
change, no provider/OpenAI call, no source fetch, and creates no
proof/evidence/Perspective/work/product durable state. Product-write remains
parked by the #686 stopline. Next recommended slice:
`feedback_event_store_list_route_browser_validation_v0_1`.

Feedback Event Store list route browser validation v0.1 preserves canonical
promotion gates while validating the bounded read path. It validates
`GET /api/research-candidate/feedback-events` through route handler temp-DB
validation only and reads durable feedback events only.

The validation is not source of truth, not proof/evidence, not Perspective
promotion, not work mutation, not feedback mutation, not execution authority,
not retrieval/RAG execution, not agent routing, not Codex execution, not GitHub
automation, not external handoff, and not product write authority. GET does not
write feedback events; no feedback write occurs. It uses no browser UI, starts
no app server, uses no production DB read/write path, and adds no UI/component
change, no app/api route change, no route handler change, no schema/migration
change, no provider/OpenAI call, no source fetch, and creates no
proof/evidence/Perspective/work/product durable state. Product-write remains
parked by the #686 stopline. Next recommended slice:
`feedback_event_store_list_ui_contract_v0_1`.

Feedback Event Store list UI contract v0.1 preserves canonical promotion gates
while defining request previews only for a future list panel. It is
non-executing and non-reading: no UI component is implemented, no browser
request is sent. No feedback event read happens now. No feedback event write
happens now, no production DB path is opened, and no SQL executes.

The list UI contract is not source of truth, not proof/evidence, not
Perspective promotion, not work mutation, not feedback mutation, not execution
authority, not retrieval/RAG execution, not agent routing, not Codex execution,
not GitHub automation, not external handoff, and not product write authority.
It changes no app/api route, route handler, server action, schema, migration,
package dependency, component, browser persistence, provider/OpenAI call, or
source fetch, and creates no proof/evidence/Perspective/work/product durable
state. Product-write remains parked by the #686 stopline. Next recommended
slice: `feedback_event_store_list_ui_implementation_v0_1`.

Feedback Event Store list UI implementation v0.1 preserves canonical promotion
gates while adding a read-only feedback event history panel. It reads durable
feedback events only through `GET /api/research-candidate/feedback-events` and
labels feedback as operator input only, not proof/evidence, not Perspective
state, not work status, not retrieval result, and not product write.

The list UI implementation is not source of truth, not proof/evidence, not
Perspective promotion, not work mutation, not feedback mutation, not execution
authority, not retrieval/RAG execution, not agent routing, not Codex execution,
not GitHub automation, not external handoff, and not product write authority.
No feedback write from list UI is available. It changes no app/api route, route
handler, server action, schema, migration, package dependency, or browser
persistence, performs no provider/OpenAI call or source fetch, and creates no
proof/evidence/Perspective/work/product durable state. Product-write remains
parked by the #686 stopline. Next recommended slice:
`feedback_event_store_list_ui_browser_validation_v0_1`.

Feedback Event Store list UI browser validation v0.1 preserves canonical
promotion gates while validating the #707 read-only Feedback event history
panel. It confirms the panel renders in the folded audit surface, defaults to
all feedback events with limit 50 only, has no target_kind or target_id default
scope, exposes only allowed filters, uses `GET
/api/research-candidate/feedback-events`, includes
`feedback_event_store_list_route_request.v0.1`, includes
`include_event_json=true`, and includes required read authority
acknowledgements.

The validation confirms local React state only, loading/empty/success/refusal
and validation failure display paths, operator input only labels, not
proof/evidence, not Perspective state, not work status, not retrieval/RAG
result, not product write labels, and duplicate feedback indication without
mutation. It is not proof/evidence, not Perspective promotion, not work
mutation, not execution authority, not source fetch, not retrieval/RAG
execution, not Codex execution, not GitHub automation, not external handoff,
not product write authority, and not product ID allocation authority.

No runtime browser request is executed by the smoke. No feedback write from
list UI, POST, delete/edit/update/retry/write controls, app/api route change,
route handler change, server action, schema/migration change, package
dependency addition, browser persistence, auto refresh, provider/OpenAI call,
source fetch, retrieval/RAG execution, proof/evidence write, durable
Perspective state write, work mutation, product write, product DB write, or
product ID allocation is added. Product-write remains parked by the #686
stopline. Next recommended slice:
`feedback_event_aggregation_read_model_contract_v0_1`.

Feedback event aggregation read model contract v0.1 preserves canonical
promotion gates by defining advisory/read-only aggregation views over durable
feedback events only. The aggregation read model is contract-only in this
slice and remains separated from durable Perspective promotion.

The aggregation read model may summarize operator feedback, but it is not
proof/evidence, not Perspective state, not work status, not promotion authority,
not salience authority, not retrieval/RAG result, not source fetch,
not provider/OpenAI output, not work mutation, not product write, and not
product ID allocation authority. It adds no runtime implementation, no runtime
DB query, no browser request, no feedback write/mutation, no app/api route
change, no route handler change, no server action, no schema/migration change,
no package dependency, no browser persistence, no proof/evidence write, no
Perspective promotion, no durable Perspective state write, no promotion
decision record, no work mutation, no salience governor, no product write,
no product DB write, and no product ID allocation. Product-write remains
parked by the #686 stopline. Next recommended slice:
`feedback_event_aggregation_read_model_implementation_v0_1`.

Feedback event aggregation read model implementation v0.1 preserves canonical
promotion gates by implementing deterministic, fixture-backed aggregation over
committed feedback event fixtures only. Feedback aggregation remains separated
from durable Perspective promotion.

The implementation may summarize operator feedback, but it is advisory/read-only
and is not proof/evidence, not Perspective state, not work status, not promotion
authority, not salience authority, not retrieval/RAG result, not source fetch,
not provider/OpenAI output, not work mutation, not product write, and not
product ID allocation authority. It adds no runtime DB query, no production DB
read, no browser request, no feedback write/mutation, no app/api route change,
no route handler change, no server action, no component/UI implementation, no
schema/migration change, no package dependency, no browser persistence, no
proof/evidence write, no Perspective promotion, no durable Perspective state
write, no promotion decision record, no work mutation, no salience governor, no
product write, no product DB write, and no product ID allocation. Product-write
remains parked by the #686 stopline. Next recommended slice:
`feedback_event_aggregation_read_model_browser_validation_v0_1`.

Feedback event aggregation read model browser validation v0.1 preserves
canonical promotion gates by validating the deterministic fixture-backed
aggregation implementation from #710 only. Aggregation validation remains
separated from durable Perspective promotion.

The validation is advisory/read-only and is not proof/evidence, not Perspective
state, not work status, not promotion authority, not salience authority, not
retrieval/RAG result, not source fetch, not provider/OpenAI output, not work
mutation, not product write, and not product ID allocation authority. It adds no
runtime DB query, no production DB read, no browser request, no feedback
write/mutation, no app/api route change, no route handler change, no server
action, no component/UI implementation, no schema/migration change, no package
dependency, no browser persistence, no proof/evidence write, no Perspective
promotion, no durable Perspective state write, no promotion decision record, no
work mutation, no salience governor, no product write, no product DB write, and
no product ID allocation. Product-write remains parked by the #686 stopline.
Next recommended slice: `formation_receipt_durable_event_contract_v0_1`.

Formation Receipt durable event contract v0.1 preserves canonical promotion
gates by recording selected/excluded context, excluded reasons, unresolved
tensions, source refs, candidate refs, digest refs, handoff refs, decision refs,
and result refs as audit/provenance and decision links only. It remains
separated from durable Perspective promotion.

The contract is not proof/evidence, not Perspective state, not work status, not
promotion authority, not salience authority, not retrieval/RAG result, not
source fetch, not provider/OpenAI output, not work mutation, not product write,
and not product ID allocation authority. It adds no durable event write
implementation, no runtime DB write, no production DB read, no browser request,
no feedback write/mutation, no app/api route change, no route handler change,
no server action, no component/UI implementation, no schema/migration change,
no package dependency, no browser persistence, no proof/evidence write, no
Perspective promotion, no durable Perspective state write, no promotion
decision record, no work mutation, no salience governor, no product write, no
product DB write, and no product ID allocation. Product-write remains parked by
the #686 stopline. Next recommended slice:
`formation_receipt_durable_event_implementation_v0_1`.

Formation Receipt durable event implementation v0.1 preserves canonical
promotion gates by generating receipt-shaped provenance artifacts only from the
#712 contract fixture. It records selected/excluded context, excluded reasons,
unresolved tensions, source refs, candidate refs, digest refs, handoff refs,
decision refs, and result refs as provenance and reference links only.

The implementation remains separated from durable Perspective promotion. It is
not proof/evidence, not Perspective state, not work status, not promotion
authority, not salience authority, not retrieval/RAG result, not source fetch,
not provider/OpenAI output, not work mutation, not product write, and not
product ID allocation authority. It adds no runtime persistence, no runtime DB
write/query, no production DB read, no schema/migration change, no app/api
route change, no route handler change, no server action, no component/UI
implementation, no browser request, no browser persistence, no feedback
write/mutation, no proof/evidence write, no Perspective promotion, no durable
Perspective state write, no promotion decision record, no work mutation, no
salience governor, no product write, no product DB write, and no product ID
allocation. Product-write remains parked by the #686 stopline. Next recommended
slice: `formation_receipt_durable_event_browser_validation_v0_1`.

Formation Receipt durable event browser validation v0.1 preserves canonical
promotion gates by validating deterministic fixture-backed provenance artifacts
only. It validates generated receipt event shape from the #712 contract,
selected/excluded context summaries, invalid override summary/validation
consistency, unresolved tension preservation, and reference-only handoff,
decision, and result links.

The validation remains separated from durable Perspective promotion. It records
no durable state and validates provenance and reference links only. It is not
proof/evidence, not Perspective state, not work status, not promotion authority,
not salience authority, not retrieval/RAG result, not source fetch, not
provider/OpenAI output, not work mutation, not product write, and not product ID
allocation authority. It adds no runtime persistence, no runtime DB write/query,
no production DB read, no schema/migration change, no app/api route change, no
route handler change, no server action, no component/UI implementation, no
browser request, no browser persistence, no feedback write/mutation, no
proof/evidence write, no Perspective promotion, no durable Perspective state
write, no promotion decision record, no work mutation, no salience governor, no
product write, no product DB write, and no product ID allocation. Product-write
remains parked by the #686 stopline. Next recommended slice:
`recent_rehearsal_buffer_contract_v0_1`.

Recent Rehearsal Buffer contract v0.1 preserves canonical promotion gates by
defining compact, non-durable recent work resume context only. It may carry the
last active research question, recent perspective/candidate refs, open tensions,
recent failed checks, last user decisions, recent context refs with source_refs,
excluded context refs with reasons, and decay state, but this contract remains
separated from durable Perspective promotion.

The buffer is not proof/evidence, not Perspective state, not work status, not
promotion authority, not salience authority, not retrieval/RAG result, not
source fetch, not provider/OpenAI output, not work mutation, not product write,
and not product ID allocation authority. It adds no runtime persistence, no
durable memory write, no runtime DB write/query, no production DB read, no
schema/migration change, no app/api route change, no route handler change, no
server action, no component/UI implementation, no browser request, no browser
persistence, no formation receipt write, no feedback write/mutation, no
proof/evidence write, no Perspective promotion, no durable Perspective state
write, no promotion decision record, no work mutation, no salience governor, no
product write, no product DB write, and no product ID allocation. Product-write
remains parked by the #686 stopline. Next recommended slice:
`recent_rehearsal_buffer_implementation_v0_1`.

Recent Rehearsal Buffer implementation v0.1 preserves canonical promotion
gates by generating compact non-durable recent work resume context only from
the #715 contract fixture. It records recent context refs, excluded context
reasons, open tensions, failed-check and user-decision references, and decay
state as resume context only.

The implementation remains separated from durable Perspective promotion. It is
not proof/evidence, not Perspective state, not work status, not promotion
authority, not salience authority, not retrieval/RAG result, not source fetch,
not provider/OpenAI output, not work mutation, not product write, and not
product ID allocation authority. It adds no runtime persistence, no durable
memory write, no runtime DB write/query, no production DB read, no
schema/migration change, no app/api route change, no route handler change, no
server action, no component/UI implementation, no browser request, no browser
persistence, no formation receipt write, no feedback write/mutation, no
proof/evidence write, no Perspective promotion, no durable Perspective state
write, no promotion decision record, no work mutation, no salience governor, no
product write, no product DB write, and no product ID allocation. Product-write
remains parked by the #686 stopline. Next recommended slice:
`recent_rehearsal_buffer_browser_validation_v0_1`.

Recent Rehearsal Buffer browser validation v0.1 preserves canonical promotion
gates by validating compact non-durable recent work resume context only from the
#716 deterministic fixture-backed implementation. It validates generated buffer
contract authority boundary, top-level implementation boundary separation,
resume context summary, decay summary, and invalid override
summary/validation consistency.

The validation remains separated from durable Perspective promotion. It is not
proof/evidence, not Perspective state, not work status, not promotion authority,
not salience authority, not retrieval/RAG result, not source fetch, not
provider/OpenAI output, not work mutation, not product write, and not product ID
allocation authority. It adds no runtime persistence, no durable memory write,
no runtime DB write/query, no production DB read, no schema/migration change, no
app/api route change, no route handler change, no server action, no
component/UI implementation, no browser request, no browser persistence, no
formation receipt write, no feedback write/mutation, no proof/evidence write,
no Perspective promotion, no durable Perspective state write, no promotion
decision record, no work mutation, no salience governor, no product write, no
product DB write, and no product ID allocation. Product-write remains parked by
the #686 stopline. Next recommended slice:
`salience_governor_contract_v0_1`.

Salience Governor contract v0.1 preserves canonical promotion gates by defining
display/reuse priority hints only. It can prioritize display/reuse hints for
candidate overload reduction, but it remains separated from durable Perspective
promotion and product write authority.

The contract is not proof/evidence, not Perspective state, not work status, not
promotion authority, not salience authority, not retrieval/RAG result, not source
fetch, not provider/OpenAI output, not candidate/work mutation, not product
write, and not product ID allocation authority. Salience score must not be
treated as promotion readiness, durable approval, evidence strength, source of
truth, proof/evidence, Perspective state, work status, or product write. It adds
no runtime salience scoring, no runtime persistence, no durable memory write, no
runtime DB write/query, no production DB read, no schema/migration change, no
app/api route change, no route handler change, no server action, no
component/UI implementation, no browser request, no browser persistence, no
recent rehearsal buffer write, no formation receipt write, no feedback
write/mutation, no proof/evidence write, no Perspective promotion, no durable
Perspective state write, no promotion decision record, no candidate/work
mutation, no product write, no product DB write, and no product ID allocation.
Product-write remains parked by the #686 stopline. Next recommended slice:
`salience_governor_implementation_v0_1`.

Salience Governor implementation v0.1 preserves canonical promotion gates by
generating display/reuse priority hints only from the #718 contract fixture. It
is deterministic and fixture-backed, and it remains separated from durable
Perspective promotion and product write authority.

The implementation is not proof/evidence, not Perspective state, not work
status, not promotion authority, not salience authority, not retrieval/RAG
result, not source fetch, not provider/OpenAI output, not candidate/work
mutation, not product write, and not product ID allocation authority. Salience
score must not be treated as promotion readiness, durable approval, evidence
strength, source of truth, proof/evidence, Perspective state, work status, or
product write. It adds no runtime salience scoring, no runtime persistence, no
durable salience write, no durable memory write, no runtime DB write/query, no
production DB read, no schema/migration change, no app/api route change, no
route handler change, no server action, no component/UI implementation, no
browser request, no browser persistence, no recent rehearsal buffer write, no
formation receipt write, no feedback write/mutation, no proof/evidence write,
no Perspective promotion, no durable Perspective state write, no promotion
decision record, no candidate/work mutation, no product write, no product DB
write, and no product ID allocation. Product-write remains parked by the #686
stopline. Next recommended slice:
`salience_governor_browser_validation_v0_1`.

Salience Governor browser validation v0.1 preserves canonical promotion gates
by validating display/reuse priority hints only from the #719 implementation.
It is deterministic, fixture-backed, and remains separated from durable
Perspective promotion and product write authority.

The validation is not proof/evidence, not Perspective state, not work status,
not promotion authority, not salience authority, not retrieval/RAG result, not
source fetch, not provider/OpenAI output, not candidate/work mutation, not
product write, and not product ID allocation authority. Salience score must not
be treated as promotion readiness, durable approval, evidence strength, source
of truth, proof/evidence, Perspective state, work status, or product write. It
adds no runtime salience scoring, no runtime persistence, no durable salience
write, no durable memory write, no runtime DB write/query, no production DB
read, no schema/migration change, no app/api route change, no route handler
change, no server action, no component/UI implementation, no browser request,
no browser persistence, no recent rehearsal buffer write, no formation receipt
write, no feedback write/mutation, no proof/evidence write, no Perspective
promotion, no durable Perspective state write, no promotion decision record, no
candidate/work mutation, no product write, no product DB write, and no product
ID allocation. Product-write remains parked by the #686 stopline. Next
recommended slice:
`bounded_external_source_intake_contract_v0_1`.

Bounded External Source Intake contract v0.1 preserves canonical promotion
gates by defining reference-only operator-provided source intake policy. It can
prepare source references for later candidate generation, but it remains
separated from durable Perspective promotion, proof/evidence, retrieval/RAG
authority, salience authority, and product write authority.

The contract is not source fetch, not crawler behavior, not provider
extraction, not provider/OpenAI output, not retrieval/RAG result, not source
index write, not durable source record write, not proof/evidence, not
Perspective state, not work status, not promotion authority, not salience
authority, not candidate/work mutation, not product write, and not product ID
allocation authority. It adds no runtime source fetch, no crawler, no
provider/OpenAI call, no provider extraction, no retrieval/RAG execution, no
source index write, no durable source record write, no runtime persistence, no
durable memory write, no runtime DB write/query, no production DB read, no
schema/migration change, no app/api route change, no route handler change, no
server action, no component/UI implementation, no browser request, no browser
persistence, no durable salience write, no recent rehearsal buffer write, no
formation receipt write, no feedback write/mutation, no proof/evidence write,
no Perspective promotion, no durable Perspective state write, no promotion
decision record, no candidate/work mutation, no product write, no product DB
write, and no product ID allocation. Product-write remains parked by the #686
stopline. Next recommended slice:
`bounded_external_source_intake_implementation_v0_1`.

Bounded External Source Intake implementation v0.1 preserves canonical
promotion gates by generating deterministic, fixture-backed, reference-only source intake bundles from the #721 contract. It records source intake
references only and remains separated from durable Perspective promotion.

The implementation is not source fetch, not crawler behavior, not provider
extraction, not provider/OpenAI output, not retrieval/RAG result, not source
index write, not durable source record write, not proof/evidence, not
Perspective state, not work status, not promotion authority, not salience
authority, not candidate/work mutation, not product write, and not product ID
allocation authority. It adds no runtime source fetch, no crawler, no
provider/OpenAI call, no provider extraction, no retrieval/RAG execution, no
source index write, no durable source record write, no runtime persistence, no
durable memory write, no runtime DB write/query, no production DB read, no
schema/migration change, no app/api route change, no route handler change, no
server action, no component/UI implementation, no browser request, no browser
persistence, no durable salience write, no recent rehearsal buffer write, no
formation receipt write, no feedback write/mutation, no proof/evidence write,
no Perspective promotion, no durable Perspective state write, no promotion
decision record, no candidate/work mutation, no product write, no product DB
write, and no product ID allocation. Product-write remains parked by the #686
stopline. Next recommended slice:
`bounded_external_source_intake_browser_validation_v0_1`.

Bounded External Source Intake browser validation v0.1 preserves canonical
promotion gates by validating deterministic, fixture-backed, reference-only
source intake bundles from the #722 implementation. It validates the generated
bundle contract boundary, top-level implementation boundary separation, and
invalid source_refs override rejection while remaining separated from durable
Perspective promotion.

The validation is not source fetch, not crawler behavior, not provider
extraction, not provider/OpenAI output, not retrieval/RAG result, not source
index write, not durable source record write, not proof/evidence, not
Perspective state, not work status, not promotion authority, not salience
authority, not candidate/work mutation, not product write, and not product ID
allocation authority. It adds no runtime source fetch, no crawler, no
provider/OpenAI call, no provider extraction, no retrieval/RAG execution, no
source index write, no durable source record write, no runtime persistence, no
durable memory write, no runtime DB write/query, no production DB read, no
schema/migration change, no app/api route change, no route handler change, no
server action, no component/UI implementation, no browser request, no browser
persistence, no durable salience write, no recent rehearsal buffer write, no
formation receipt write, no feedback write/mutation, no proof/evidence write,
no Perspective promotion, no durable Perspective state write, no promotion
decision record, no candidate/work mutation, no product write, no product DB
write, and no product ID allocation. Product-write remains parked by the #686
stopline. Next recommended slice:
`operator_source_candidate_generation_contract_v0_1`.

Operator Source Candidate Generation contract v0.1 preserves canonical
promotion gates by defining candidate preview families only. It can describe
later candidate previews from bounded, operator-provided, reference-only source
intake bundles, but it remains separated from durable Perspective promotion,
proof/evidence gates, retrieval/RAG authority, salience authority, work
creation, candidate record writes, and product write authority.

The contract is not runtime candidate generation, not source fetch, not crawler
behavior, not provider extraction, not provider/OpenAI output, not retrieval/RAG
result, not source index write, not durable source record write, not candidate
record write, not proof/evidence, not Perspective state, not work status, not
promotion authority, not salience authority, not candidate/work mutation, not
product write, and not product ID allocation authority. It adds no runtime
candidate generation, no runtime source fetch, no crawler, no provider/OpenAI
call, no provider extraction, no retrieval/RAG execution, no source index
write, no durable source record write, no candidate record write, no runtime
persistence, no durable memory write, no runtime DB write/query, no production
DB read, no schema/migration change, no app/api route change, no route handler
change, no server action, no component/UI implementation, no browser request,
no browser persistence, no durable salience write, no recent rehearsal buffer
write, no formation receipt write, no feedback write/mutation, no
proof/evidence write, no Perspective promotion, no durable Perspective state
write, no promotion decision record, no candidate/work mutation, no product
write, no product DB write, and no product ID allocation. Product-write remains
parked by the #686 stopline. Next recommended slice:
`operator_source_candidate_generation_implementation_v0_1`.

Operator Source Candidate Generation implementation v0.1 preserves canonical
promotion gates by generating candidate previews only from the #724 contract
and committed fixtures. It remains separated from durable Perspective promotion
and validates invalid generated candidate preview override rejection without
creating proof/evidence, work, candidate records, product writes, or promotion
decisions.
Operator Source Candidate Generation implementation remains separated from durable Perspective promotion.
It generates candidate previews only.
It does not implement runtime DB/browser/provider/retrieval behavior in this slice.

The implementation is not runtime candidate generation, not source fetch, not
crawler behavior, not provider extraction, not provider/OpenAI output, not
retrieval/RAG result, not source index write, not durable source record write,
not candidate record write, not proof/evidence, not Perspective state, not work
status, not promotion authority, not salience authority, not candidate/work
mutation, not product write, and not product ID allocation authority. It does
not implement runtime DB/browser/provider/retrieval behavior in this slice. It
adds no runtime persistence, no durable memory write, no runtime DB write/query,
no production DB read, no schema/migration change, no app/api route change, no
route handler change, no server action, no component/UI implementation, no
browser request, no browser persistence, no feedback write/mutation, no
Perspective promotion, no durable Perspective state write, no promotion
decision record, no product DB write, and no product ID allocation.
Product-write remains parked by the #686 stopline. Next recommended slice:
`operator_source_candidate_generation_browser_validation_v0_1`.

Operator Source Candidate Generation validation remains separated from durable Perspective promotion.
It validates candidate previews only.
It validates deterministic, fixture-backed candidate preview bundles from the
#725 implementation against the #724 contract boundary and keeps generated
candidate previews out of proof/evidence, Perspective state, work status,
promotion basis, retrieval/RAG authority, salience authority, candidate/work
mutation, product write, and product ID allocation authority.
It does not implement runtime DB/browser/provider/retrieval behavior in this slice.

The validation is not runtime candidate generation, not source fetch, not
crawler behavior, not provider extraction, not provider/OpenAI output, not
retrieval/RAG result, not source index write, not durable source record write,
not candidate record write, not proof/evidence, not Perspective state, not
work status, not promotion authority, not salience authority, not
candidate/work mutation, not product write, and not product ID allocation
authority. It adds no runtime persistence, no durable memory write, no runtime
DB write/query, no production DB read, no schema/migration change, no app/api
route change, no route handler change, no server action, no component/UI
implementation, no browser request, no browser persistence, no feedback
write/mutation, no Perspective promotion, no durable Perspective state write,
no promotion decision record, no product DB write, and no product ID
allocation. Product-write remains parked by the #686 stopline. Next
recommended slice: `non_authoritative_retrieval_rag_contract_v0_1`.

Retrieval/RAG remains separated from durable Perspective promotion.
Retrieval results preserve candidate/durable distinction.
Search results must link back to source_refs.
Stale index cannot override current state.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval behavior.

The Non-authoritative Retrieval/RAG contract v0.1 preserves canonical
promotion gates by defining recall/context expansion only. Retrieval result is
recall, not authority. RAG answer is context preview, not evidence/proof.
Embedding similarity and retrieval scores are not truth, promotion readiness,
salience authority, or evidence strength. Any future index remains rebuildable,
derived, and non-authoritative; vector DB storage is not source of truth, and
hidden permanent memory is not allowed.

The contract is not runtime retrieval/RAG execution, not runtime index build,
not index write, not source index write, not embedding generation, not vector
DB, not FTS, not source fetch, not crawler behavior, not provider/OpenAI output,
not durable source record write, not candidate record write, not
proof/evidence, not Perspective state, not work status, not promotion
authority, not salience authority, not candidate/work mutation, not product
write, and not product ID allocation authority. It adds no runtime persistence,
no durable memory write, no runtime DB write/query, no production DB read, no
schema/migration change, no app/api route change, no route handler change, no
server action, no component/UI implementation, no browser request, no browser
persistence, no Perspective promotion, no durable Perspective state write, no
promotion decision record, no product DB write, and no product ID allocation.
Product-write remains parked by the #686 stopline. Next recommended slice:
`non_authoritative_retrieval_rag_implementation_v0_1`.

Non-authoritative Retrieval/RAG implementation remains separated from durable Perspective promotion.
Retrieval results preserve candidate/durable distinction.
Search/retrieval results must link back to source_refs or explicit public-safe gap reason.
RAG context preview is not proof/evidence/source of truth.
Stale index cannot override current state.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval behavior.

The Non-authoritative Retrieval/RAG implementation v0.1 preserves canonical
promotion gates by materializing public-safe recall/context preview bundles
from the #727 contract only. Retrieval result remains recall, not authority.
RAG answer remains context preview, not evidence/proof. Embedding similarity is
not truth, salience authority, or promotion readiness. Retrieval score is not
truth score, promotion score, or evidence strength.

The implementation is not runtime retrieval/RAG execution, not runtime index
build, not index write, not source index write, not embedding generation, not
vector DB, not FTS, not source fetch, not crawler behavior, not
provider/OpenAI output, not durable source record write, not candidate record
write, not proof/evidence, not Perspective state, not work status, not
promotion authority, not salience authority, not candidate/work mutation, not
product write, and not product ID allocation authority. It adds no runtime
persistence, no durable memory write, no runtime DB write/query, no production
DB read, no schema/migration change, no app/api route change, no route handler
change, no server action, no component/UI implementation, no browser request,
no browser persistence, no Perspective promotion, no durable Perspective state
write, no promotion decision record, no product DB write, and no product ID
allocation. Product-write remains parked by the #686 stopline. Next
recommended slice: `non_authoritative_retrieval_rag_browser_validation_v0_1`.

Non-authoritative Retrieval/RAG validation remains separated from durable Perspective promotion.
Retrieval results preserve candidate/durable distinction.
Search/retrieval results must link back to source_refs or explicit public-safe gap reason.
RAG context preview is not proof/evidence/source of truth.
Stale index cannot override current state.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval behavior.

The Non-authoritative Retrieval/RAG browser validation v0.1 preserves canonical
promotion gates by validating the deterministic fixture-backed #728
implementation and public-safe recall/context preview bundles against the #727
contract. It validates invalid retrieval result override rejection, invalid RAG
context preview override rejection, invalid source_refs override rejection, and
invalid authority boundary override rejection.

The validation is not runtime retrieval/RAG execution, not runtime index build,
not index write, not source index write, not embedding generation, not vector
DB, not FTS, not source fetch, not crawler behavior, not provider/OpenAI
output, not durable source record write, not candidate record write, not
proof/evidence, not Perspective state, not work status, not promotion
authority, not salience authority, not candidate/work mutation, not product
write, and not product ID allocation authority. It adds no runtime
persistence, no durable memory write, no runtime DB write/query, no production
DB read, no schema/migration change, no app/api route change, no route handler
change, no server action, no component/UI implementation, no browser request,
no browser persistence, no Perspective promotion, no durable Perspective state
write, no promotion decision record, no product DB write, and no product ID
allocation. Product-write remains parked by the #686 stopline. Next
recommended slice:
`human_reviewed_durable_perspective_promotion_contract_v0_1`.

Durable Perspective promotion remains separated from candidate preview.
PerspectiveDeltaCandidate is not committed state.
Claim candidate is not fact.
Evidence candidate is not accepted evidence.
Promotion requires explicit human review, source_refs, basis, unresolved tension handling, knowledge gap handling, and future promotion decision record.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion behavior.

The Human-reviewed Durable Perspective Promotion contract v0.1 preserves
canonical promotion gates by defining the future human/Core promotion gate
only. Candidate previews, retrieval results, RAG answers, embeddings, salience
scores, provider output, feedback events, context packets, Codex/GitHub
automation, and Agent Substrate context cannot initiate promotion.

The contract is not runtime promotion, not durable Perspective state write, not
durable Perspective delta apply, not promotion decision record write, not
proof/evidence write, not Formation Receipt write, not work mutation, not
runtime DB write/query, not production DB read, not schema/migration, not route
or UI, not browser request, not provider/OpenAI call, not source fetch, not
crawler behavior, not retrieval/RAG execution, not product write, not product
DB write, and not product ID allocation. Product-write remains parked by the
#686 stopline. Next recommended slice:
`human_reviewed_durable_perspective_promotion_implementation_v0_1`.

Human-reviewed Durable Perspective Promotion implementation remains separated from durable Perspective promotion runtime.
It preserves candidate/durable distinction.
PerspectiveDeltaCandidate is not committed state.
Claim candidate is not fact.
Evidence candidate is not accepted evidence.
Promotion requires explicit human review, source_refs, basis, unresolved tension handling, knowledge gap handling, and future promotion decision record later.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion behavior.

The implementation validates and materializes the #730 promotion preview bundle
only. It does not grant promotion authority, durable Perspective authority,
proof/evidence authority, Formation Receipt authority, work mutation authority,
DB authority, provider/OpenAI authority, retrieval/RAG execution authority,
source-fetch authority, Codex/GitHub automation authority, or product-write
authority. Product-write remains parked by the #686 stopline. Next recommended
slice:
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

Durable Perspective State / Trajectory validation remains separated from runtime durable Perspective state.
It preserves candidate/durable distinction.
PerspectiveDeltaCandidate is not committed state.
Only future human/Core promotion can create durable Perspective state changes.
Current thesis must have lineage.
Prior thesis must not be overwritten silently.
Retired claims remain auditable.
Contradicted evidence is not deleted.
Open tensions and knowledge gaps remain visible unless explicitly handled.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state behavior.

This browser validation checks the deterministic fixture-backed #734
implementation output against the #733 contract only. It adds no runtime state
read/write, no durable Perspective delta apply, no PerspectiveSnapshot runtime,
no trajectory runtime build, no proof/evidence write, no accepted evidence
write, no Formation Receipt write, no work mutation, no runtime DB write/query,
no production DB read, no schema/migration, no route, no route handler, no
server action, no component/UI implementation, no browser request, no browser
persistence, no provider/OpenAI call, no source fetch, no crawler behavior, no
retrieval/RAG execution, no product write, no product DB write, and no product
ID allocation. Product-write remains parked by #686. Next recommended slice:
`project_constellation_runtime_layout_contract_v0_1`.

Project Constellation Runtime Layout remains separated from candidate preview, durable Perspective state, and promotion runtime.
Candidate overlay is not durable graph.
Coordinates are display hints, not truth.
Evidence rays are refs, not proof/evidence records.
Tension and knowledge gap markers remain visible and do not imply resolution or closure.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout behavior.

This contract defines future stable Project Constellation layout grammar only.
It adds no runtime layout execution, no seeded layout runtime, no
force-directed layout runtime, no temporal smoothing runtime, no layout
persistence, no graph DB, no graph mutation, no durable Perspective state
read/write, no durable Perspective delta apply, no PerspectiveSnapshot runtime,
no proof/evidence write, no accepted evidence write, no Formation Receipt
write, no work mutation, no runtime DB write/query, no production DB read, no
schema/migration, no route, no route handler, no server action, no
component/UI implementation, no browser request, no browser persistence, no
provider/OpenAI call, no source fetch, no crawler behavior, no retrieval/RAG
execution, no product write, no product DB write, and no product ID allocation.
Product-write remains parked by #686. Next recommended slice:
`project_constellation_runtime_layout_implementation_v0_1`.

Project Constellation Runtime Layout implementation remains separated from runtime layout, candidate preview, durable Perspective state, and promotion runtime.
Candidate overlay is not durable graph.
Coordinates are display hints, not truth.
Evidence rays are refs, not proof/evidence records.
Tension and knowledge gap markers remain visible and do not imply resolution or closure.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout behavior.
Product-write remains parked by #686. Next recommended slice:
`project_constellation_runtime_layout_browser_validation_v0_1`.

Project Constellation Runtime Layout validation remains separated from runtime layout, candidate preview, durable Perspective state, and promotion runtime.
Candidate overlay is not durable graph.
Coordinates are display hints, not truth.
Evidence rays are refs, not proof/evidence records.
Tension and knowledge gap markers remain visible and do not imply resolution or closure.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout behavior.
Product-write remains parked by #686. Next recommended slice:
`perspective_geometry_digest_contract_v0_1`.

Perspective Geometry Digest remains separated from candidate preview, layout runtime, durable Perspective state, promotion runtime, and AI context execution.
Raw coordinates are display hints, not truth.
Digest clusters, diagnostics, and recommendations are advisory-only.
Candidate overlay remains distinct from durable graph.
Evidence chains and evidence rays are refs, not proof/evidence records.
Tensions and knowledge gaps remain visible and do not imply resolution or closure.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest behavior.
Product-write remains parked by #686. Next recommended slice:
`perspective_geometry_digest_implementation_v0_1`.

Perspective Geometry Digest implementation remains separated from candidate preview, layout runtime, durable Perspective state, promotion runtime, and AI context execution.
Raw coordinates are display hints, not truth.
Digest clusters, diagnostics, and recommendations are advisory-only.
Candidate overlay remains distinct from durable graph.
Evidence chains and evidence rays are refs, not proof/evidence records.
Tensions and knowledge gaps remain visible and do not imply resolution or closure.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest behavior.
Product-write remains parked by #686. Next recommended slice:
`perspective_geometry_digest_browser_validation_v0_1`.

Perspective Geometry Digest validation remains separated from candidate preview, layout runtime, durable Perspective state, promotion runtime, and AI context execution.
Raw coordinates are display hints, not truth.
Digest clusters, diagnostics, and recommendations are advisory-only.
Candidate overlay remains distinct from durable graph.
Evidence chains and evidence rays are refs, not proof/evidence records.
Tensions and knowledge gaps remain visible and do not imply resolution or closure.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest behavior.
Product-write remains parked by #686. Next recommended slice:
`ai_context_packet_contract_v0_1`.

AI Context Packet remains separated from candidate preview, digest runtime, layout runtime, durable Perspective state, promotion runtime, and execution.
Packet-selected candidates remain candidates, not proof/evidence or durable state.
Unresolved tensions and knowledge gaps must remain visible.
Perspective Geometry Digest remains interpretation, not truth.
AI Context Packet cannot execute Codex, create PRs, call providers, run retrieval/RAG, mutate state/work, or write product data.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest/packet behavior.
Product-write remains parked by #686. Next recommended slice:
`ai_context_packet_implementation_v0_1`.

AI Context Packet implementation remains separated from candidate preview, digest runtime, layout runtime, durable Perspective state, promotion runtime, and execution.
Packet-selected candidates remain candidates, not proof/evidence or durable state.
Unresolved tensions and knowledge gaps must remain visible.
Perspective Geometry Digest remains interpretation, not truth.
AI Context Packet cannot execute Codex, create PRs, call providers, run retrieval/RAG, mutate state/work, or write product data.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest/packet behavior.
Product-write remains parked by #686. Next recommended slice:
`ai_context_packet_browser_validation_v0_1`.

AI Context Packet validation remains separated from candidate preview, digest runtime, layout runtime, durable Perspective state, promotion runtime, and execution.
Packet-selected candidates remain candidates, not proof/evidence or durable state.
Unresolved tensions and knowledge gaps must remain visible.
Perspective Geometry Digest remains interpretation, not truth.
AI Context Packet cannot execute Codex, create PRs, call providers, run retrieval/RAG, mutate state/work, or write product data.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest/packet behavior.
Product-write remains parked by #686. Next recommended slice:
`codex_handoff_draft_contract_v0_1`.

Codex Handoff Draft remains separated from candidate preview, AI Context Packet runtime, digest runtime, layout runtime, durable Perspective state, promotion runtime, and execution.
Draft-selected candidates remain candidates, not proof/evidence or durable state.
Unresolved tensions and knowledge gaps must remain visible.
AI Context Packet remains context, not execution authority.
Codex Handoff Draft cannot execute Codex, create branches, create commits, create PRs, call providers, run retrieval/RAG, mutate state/work, or write product data.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest/packet/handoff behavior.
Product-write remains parked by #686. Next recommended slice:
`codex_handoff_draft_implementation_v0_1`.

Codex Handoff Draft implementation remains separated from candidate preview, AI Context Packet runtime, digest runtime, layout runtime, durable Perspective state, promotion runtime, and execution.
Draft-selected candidates remain candidates, not proof/evidence or durable state.
Unresolved tensions and knowledge gaps must remain visible.
AI Context Packet remains context, not execution authority.
Codex Handoff Draft cannot execute Codex, create branches, create commits, create PRs, call providers, run retrieval/RAG, mutate state/work, or write product data.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest/packet/handoff behavior.
Product-write remains parked by #686. Next recommended slice:
`codex_handoff_draft_browser_validation_v0_1`.

Codex Handoff Draft validation remains separated from candidate preview, AI Context Packet runtime, digest runtime, layout runtime, durable Perspective state, promotion runtime, and execution.
Draft-selected candidates remain candidates, not proof/evidence or durable state.
Unresolved tensions and knowledge gaps must remain visible.
AI Context Packet remains context, not execution authority.
Codex Handoff Draft cannot execute Codex, create branches, create commits, create PRs, call providers, run retrieval/RAG, mutate state/work, or write product data.
This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest/packet/handoff behavior.
Product-write remains parked by #686. Next recommended slice:
`perspective_packet_receipt_linkage_contract_v0_1`.

The Research Candidate AI Context Packet preview preserves canonical promotion
gates. Packet IDs must not use raw source titles, URLs, provider IDs, raw
thread/run/session strings, arbitrary user strings, episode IDs, or demo refs.
Target perspective summaries are read-only and non-authoritative. The packet
adds no provider prompt execution, Codex execution, retrieval, durable memory,
runtime/API/DB/provider/retrieval, or promotion behavior.

The Formation Receipt preview preserves canonical promotion gates. Receipt IDs
must not use raw source titles, URLs, provider IDs, raw thread/run/session
strings, arbitrary user strings, episode IDs, or demo refs. Receipt
contributions are read-only and non-authoritative. The receipt preview adds no
durable receipt storage, event log, runtime/API/DB/provider/retrieval, or
promotion behavior.

The v0.1 closeout doc summarizes the preview chain before runtime/manual input
work begins.

## Expected Files And Checks

Expected files:

- `docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md`
- `fixtures/research-candidate-canonical-promotion-gates.sample.v0.1.json`
- `scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs`
- `docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md`
- `docs/00_INDEX_LATEST.md`
- `package.json`

Expected checks:

- `node scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs`
- `npm run smoke:research-candidate-canonical-promotion-gates-v0-1`
- `npm run smoke:research-candidate-review-types-v0-1`
- `npm run smoke:research-candidate-review-surface-v0-1`
- `git diff --check`
- `npm run typecheck`

## Scoped Stop Conditions

Stop if this PR would require runtime/API/DB/provider/retrieval/persistence/UI
or type redesign behavior.

Also stop if the work would require source fetching, crawler behavior,
provider/OpenAI calls, embeddings/RAG/vector/FTS/indexing, durable research
writes, candidate/review record storage, proof/evidence writes, perspective
promotion, work status mutation, state commit/reject, App/MCP tool changes,
package dependencies, or automatic Codex/GitHub automation inside Augnes
runtime.

## What This Slice Implements

This slice implements only:

- docs gate contract
- public-safe gate fixture
- static smoke
- docs/index pointer
- package script pointer

## What This Slice Does Not Implement

This slice does not implement runtime UI, API routes, DB schema or migrations,
source fetching, crawler behavior, provider/OpenAI calls,
embeddings/RAG/vector/FTS/indexing, durable research writes,
candidate/review record storage, proof/evidence writes, perspective promotion,
work status mutation, state commit/reject, App/MCP tool changes, package
dependencies, automatic Codex execution inside Augnes runtime, or GitHub
automation inside Augnes runtime.

## Next Recommended Step

Add Cockpit manual pasted note preview UI shell using the existing
deterministic parser in a preview-only, read-only path.
