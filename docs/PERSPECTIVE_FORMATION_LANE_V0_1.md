# Perspective Formation Lane v0.1

## Purpose and Status

Perspective Formation Lane v0.1 is a docs/smoke/package-pointer only,
docs/report/smoke/package-only boundary slice. It is non-runtime,
non-authoritative, and design/boundary only.

This PR defines a bounded lane model where Augnes turns Codex work traces into
reviewable Perspective Candidates. It does not implement the lane at runtime,
add routes, add persistence, or create new decision authority.

## Current Repo Basis

This lane follows the existing Augnes authority and Perspective direction:

- `AGENTS.md` defines Codex as the repo implementation and verification worker,
  while preserving Augnes Core and user decision boundaries.
- `docs/AUTHORITY_MATRIX.md` keeps Augnes Core as the durable authority for
  committed state, proof records, event spine, gate validation, and publication
  gates.
- `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md` defines repo work traces,
  evidence rows, session trace refs, proof-only action records, skipped-check
  reasons, PR refs, and handoff refs as reviewable continuity material.
- `docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md` defines Perspective Capsule /
  Handoff Capsule material as evidence-pointer-based, non-authoritative, and
  handoff-preview-oriented.
- `docs/PERSPECTIVE_AGENT_BRIEF_READ_SURFACE_V0_1.md` keeps Agent Brief
  surfaces read-only and separate from ingress, provider calls, persistence,
  and Codex execution.
- `docs/PERSPECTIVE_AGENT_BRIEF_HANDOFF_COPY_REFINE_V0_1.md` keeps handoff
  copy useful for review and planning without making it an implementation
  instruction by itself.
- `docs/PERSPECTIVE_REVIEWED_MANUAL_AGENT_BRIEF_CODEX_TEMPLATE_V0_1.md` and
  `docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_PROMOTION_PATH_V0_1.md` preserve
  the PR-centered workflow: Codex codes/tests/opens PR, ChatGPT reviews PR,
  and the user decides merge.

## Actor and Lane Model

The lane model uses five named actors:

- `codex_worker`: the scoped repo worker that edits files, runs checks, and
  opens PRs when explicitly tasked.
- `codex_perspective_former`: a separate read-only formation worker that
  consumes an Augnes-filtered Formation Input Bundle and produces
  non-committed Perspective Candidate material.
- `augnes_core`: the durable authority for committed state, gates, proof/state
  routes, work traces, evidence/proof read models, and decision validation.
- `chatgpt_review_surface`: a briefing, review, user-judgment capture, and
  next-handoff drafting surface.
- `user_decision_authority`: the durable decision authority for accept, reject,
  supersede, and merge decisions.

## Codex Worker Lane

`codex_worker` may:

- edit repo files inside explicit scope;
- run typecheck, smoke, build, and other requested checks;
- open scoped PRs through normal GitHub workflow;
- leave repo work material through PRs, reports, changed files, and commit
  history;
- leave evidence rows, proof-only action records, work events, skipped-check
  reasons, session/work traces, and handoff refs when the relevant runtime,
  work id, and APIs are available.

`codex_worker` must not commit or reject Augnes state, approve, merge,
publish, deploy, retry, replay, externally post, or claim durable decision
authority.

## Formation Codex Lane

`codex_perspective_former` is read-only. It consumes an Augnes-filtered
Formation Input Bundle and produces Perspective Candidate material only.

`codex_perspective_former` must not edit repo files, open PRs, record
proof/evidence/readiness, commit or reject state, approve, merge, publish,
deploy, call providers, call GitHub, call the Codex SDK, or call model/API
services.

Perspective Candidate output from this lane is not committed state, not a
runtime route result, not a persistence record, not proof, not evidence, not
readiness, not approval, and not merge authority.

## Formation Input Bundle Shape

Formation Input Bundle is conceptual only. It is an Augnes-filtered bundle for
read-only formation, not a schema, route, DB object, graph DB object, persisted
record, source ingress path, OAuth path, provider call payload, or model/API
call payload.

A complete Formation Input Bundle should account for:

- `scope`
- `work_id`
- `source_pr_refs`
- `changed_files_summary`
- `tests_checks_run`
- `skipped_checks_with_concrete_reasons`
- `evidence_row_refs`
- `proof_only_action_refs`
- `work_event_refs`
- `session_trace_refs`
- `existing_perspective_refs`
- `unresolved_gaps`
- `authority_boundaries`
- `source_privacy_redaction_notes`

For human-readable handoffs, the same bundle must preserve the phrase
`skipped checks with concrete reasons` so skipped work remains reviewable.

## Perspective Candidate Output Shape

Perspective Candidate is conceptual only. It is non-committed review material
for inspection by the user, Augnes Core, Cockpit, ChatGPT review surfaces, or a
future explicitly scoped promotion path.

A complete candidate should account for:

- `candidate_id`
- `status: perspective_candidate`
- `authority: non_committed`
- `thesis`
- `selected_nodes_edges_or_selected_material`
- `evidence_pointers`
- `unresolved_tensions`
- `basis_quality`
- `blockers_gaps`
- `next_action_candidates`
- `user_core_decision_questions`
- `forbidden_actions`

For human-readable handoffs, the same candidate must preserve the phrases
`evidence pointers`, `unresolved tensions`, and `user/Core decision` so review
does not collapse into hidden approval.

## UX Model

Codex side:

- execution feed for repo work, checks, skipped reasons, PR refs, and proof
  closeout status;
- perspective checkpoint feed for read-only candidate milestones and unresolved
  gaps;
- no action that treats formation output as approval or durable state.

ChatGPT side:

- briefing surface for Perspective Candidate review;
- user judgment capture for questions, tensions, and acceptance boundaries;
- next-handoff drafting for a future Codex task packet;
- no autonomous Codex execution surface.

Cockpit side:

- read-only candidate inspection;
- candidate basis, evidence pointers, unresolved tensions, and forbidden
  actions visible near next action candidates;
- no accept/reject/supersede implementation in this PR.

## Promotion Boundary

This PR defines the lane only.

Runtime implementation requires a later explicit promotion decision and stronger
validation. Any later route, schema, persistence, graph DB, source ingress,
OAuth, provider/model/API call, ChatGPT App, Codex plugin, proof/evidence,
readiness, or Core-gated accept/reject/supersede route must be separately
scoped and reviewed.

## Non-Goals and Forbidden Actions

This lane definition includes explicit forbidden authority wording:

- no runtime route
- no DB schema
- no persistence
- no provider/model/API calls
- no OAuth/source ingress
- no proof/evidence/readiness writes
- no Codex SDK execution
- no merge/publish/approval authority

This PR also does not modify `app/api`, product UI, components,
`app/globals.css`, browser-facing behavior, runtime builders, graph topology,
node ids/types, edge ids/types, Event Rail, packet section order, Agent Brief
route behavior, local manual preview route behavior, source ingress, OAuth,
provider/model/API services, GitHub mutation beyond scoped PR workflow, ChatGPT
Apps integration, Codex plugin integration, proof/evidence/readiness writes, or
Codex SDK execution.

This lane definition must not include raw pasted text, raw candidate payloads,
raw source payloads, raw pointer payloads, raw actor or consent payloads,
private/provider/token/OAuth/API key/billing payloads, hidden reasoning, raw
generated model payloads, or secrets.

Bounded summaries are allowed when they are explicit, safe, and reviewable.
Examples include changed file summaries, check result summaries,
skipped-check reasons, unresolved gap summaries, safe source labels, and
source privacy/redaction notes. This is a deliberate usability correction after
the lane-definition slice: raw/private/provider/token/source payloads remain
forbidden, but bounded summaries are necessary Formation Input Bundle material.

## Future Implementation Ladder

- PR A: docs/smoke lane definition.
- PR B: pure local formation input bundle builder.
- PR C: deterministic perspective candidate builder fixture, implemented as a
  pure local builder fixture.
- PR D: ChatGPT briefing surface preview, implemented as a pure local briefing
  preview builder.
- PR E: manual ChatGPT user judgment capture packet, implemented as a pure
  local user judgment capture packet builder.
- PR F: Codex next-handoff draft packet, implemented as a pure local
  non-executing draft packet builder.
- PR G: local Codex handoff draft dogfood report, implemented as a
  deterministic local dogfood/report validation slice.
- PR H: Refine Codex handoff draft copy from dogfood findings.
- PR I: Evaluate Codex handoff draft in a real docs-only Codex task.
- PR J: Refine expected-file scope readability for Codex handoff drafts.
- PR K: Core-gated accept/reject/supersede route, only after explicit approval.
