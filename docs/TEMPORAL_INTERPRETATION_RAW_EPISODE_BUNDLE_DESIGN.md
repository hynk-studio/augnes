# Temporal Interpretation RawEpisodeBundle Design

## Status

- Type: Evidence-bundle design document
- Phase: P3
- Based on:
  - `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_DEVELOPMENT_MEMO.md`
  - `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_PROBES.md`
- Canonical status: Not canonical
- Runtime authority: None
- Implementation status: Documentation-only
- Scope: RawEpisodeBundle design only

This is a P3 RawEpisodeBundle design document for the temporal interpretation /
Rule-Governed Self-Graph Perspective track. It is not canonical. It grants no
runtime authority, adds no schema, adds no API route, adds no Cockpit or
ChatGPT App surface, and does not change the onboarding current next goal.

This document does not implement `RawEpisodeBundle`, `PerspectiveSnapshot`,
`RuleCandidate`, or `PromotedRule`. It is a design document for evidence
modeling only.

## Purpose

`RawEpisodeBundle` exists to support temporally consistent, context-aware,
revisable interpretation. It should help Augnes explain current interpretations
against prior user/project context, raw records, counterexamples, and revision
history.

The goal is not to store more memory for its own sake. The goal is to preserve
evidence anchors so later interpretation can answer questions such as:

- What prior context is relevant?
- Which raw records support this interpretation?
- Which counterexamples or non-applicability cases limit it?
- What changed since the prior interpretation?
- Which summaries are only retrieval aids, not evidence?
- What should remain visible to the user before any next step is recommended?

A useful RawEpisodeBundle should make temporal interpretation more auditable,
not more self-confirming.

## Core Definition

`RawEpisodeBundle` is a derived, bounded evidence bundle over existing Augnes
Core records and external evidence refs, grouped by scope, time, `work_id`,
causal chain, session, target, and outcome where appropriate.

It is not a new source of truth. It is not a summary. It is not a new table at
this phase. It points back to durable records and external references.

At this phase, `RawEpisodeBundle` is only a design concept. Future
implementation would need a separately scoped PR and should prove that bundle
projection can remain derived, bounded, and evidence-anchored.

## Evidence Source Map

The source map below identifies existing or expected Augnes evidence surfaces
and how they could contribute to a derived RawEpisodeBundle.

| Source type | Evidence role | Evidence category | Possible bundle key fields | Cautions |
| --- | --- | --- | --- | --- |
| `sessions` | Conversation or work-session boundary | raw evidence | `session_id`, `scope`, time window | A session boundary is useful but may not match the task or causal boundary. |
| `messages` | User/assistant exchange, objections, corrections, preference signals | raw evidence | `message_id`, `session_id`, `scope`, time window | Messages can contain interpretation; user corrections and explicit instructions should be distinguished from assistant narration. |
| `coordination_events` | Time-ordered coordination spine across work, handoff, publication, and proof flows | proof/trace | `event_id`, `scope`, `work_id`, `causal_parent_id`, `target`, `created_at` | Event payloads can include derived interpretation; authority level must be inspected. |
| `coordination_events.authority_level` | Evidence authority signal for coordination events | proof/trace | `event_id`, `authority_level`, `scope`, `work_id` | Authority level is a precedent, not automatic truth. `interpretation_only` must not be upgraded into evidence by itself. |
| `work_items` | Current or historical task container | committed state | `scope`, `work_id`, status, updated time | Work item summaries may be useful for retrieval but should point to events and records for evidence. |
| `work_events` | Work progress, completion, blockers, skipped checks, and handoff traces | proof/trace | `scope`, `work_id`, event id, time window | Work events can mix raw execution trace with summary. Preserve skipped checks and reasons. |
| `action_records` | Tool/action result evidence and local execution traces | proof/trace | action id, `scope`, `work_id`, created time | Action success is not the same as governance approval. Failed actions and error outputs matter. |
| `state_delta_proposals` | Candidate lifecycle precedent for possible state changes | candidate | proposal id, `scope`, `state_key`, status, score fields, expiry | A state proposal is not a RuleCandidate. It can inform candidate lifecycle but should not shape interpretation automatically. |
| `state_entries` | Committed Augnes state values | committed state | `scope`, `state_key`, updated time, source proposal id | Committed state carries stronger authority but may still need source context and transition history. |
| `state_transitions` | Commit/reject or state lifecycle evidence | proof/trace | transition id, `scope`, `state_key`, proposal id, time window | A transition explains state movement; it should not erase rejected alternatives or tensions. |
| `state_tensions` | Recorded conflicts, unresolved questions, or residual tensions | interpretation/view | tension id, `scope`, `state_key`, status, time window | Tensions are essential negative/limiting evidence but may include interpretation. Keep anchors to triggering records. |
| `handoffs` | Cross-agent or cross-surface task handoff context | proof/trace | handoff id, `scope`, `work_id`, source/target, status | Handoff guidance is not execution proof. Preserve both intended task and delivered result. |
| `mailbox_messages` | Coordination messages and acknowledgements | proof/trace | message id, `scope`, sender, recipient, status, time window | Acknowledgement is not necessarily approval. Mailbox text can be summary-like. |
| `publication_drafts` | Proposed outbound text and target intent | candidate | publication id, `scope`, target surface/ref, status | Drafts are not publication, approval, proof, or committed state. |
| `publication_approval_requests` | Durable request for approval on an exact publication target | proof/trace | approval request id, publication id, `scope`, target surface/ref, status | Requests are not approval grants. Superseded requests need preservation. |
| `publication_approval_decisions` | Durable approval or rejection decision | proof/trace | approval decision id, approval request id, publication id, decision, target | Approval is still not delivery. Rejections and conditions matter. |
| `publication_readiness_checks` | Dry-run readiness evidence for approved targets | proof/trace | readiness check id, approval decision id, publication id, target, result | Readiness is not publication. Failed or stale checks are evidence, not noise. |
| `delivery_ledger` | Publication attempt, success/failure, replay, acknowledgement, target effects | proof/trace | delivery id, publication id, target surface/ref, idempotency key, status | Delivery status should be interpreted with target exactness and idempotency context. |
| GitHub PR refs | External review, discussion, diff, and merge evidence | external evidence | repo, PR number, URL, head/base refs, merge status | Prefer references over copying large PR content. PR state can change and may need timestamped retrieval. |
| commit refs | External code history evidence | external evidence | repo, commit SHA, branch, timestamp | Commit SHA is stable, but interpretation of impact still needs diff/check context. |
| test outputs | Verification evidence, failures, skipped checks, and environment constraints | proof/trace | command, run id if any, `work_id`, commit SHA, timestamp | Passing tests do not prove broad correctness. Skipped checks and reasons must be preserved. |
| user feedback | Preference, correction, approval intent, objection, or decision input | raw evidence | message id, session id, target ref, time window | User feedback may be conversational. Approval-like language must be checked against authority boundaries. |
| uploaded files or attached docs when available | User-provided or external artifact evidence | external evidence | file id/path/ref, source message id, timestamp, content hash if available | Handle privacy and locality. Avoid copying sensitive contents unless explicitly scoped. |

This map is not a schema. It is a review aid for deciding which existing refs a
future derived bundle would need to collect.

## Authority-Level Handling

`coordination_events.authority_level` is a useful precedent for evidence
authority. RawEpisodeBundle should preserve source authority distinctions
instead of flattening all records into equal "memory."

Conceptual handling:

- `raw_observation`: useful as direct observation or input, but still needs
  source context.
- `interpretation_only`: useful for retrieval and explanation context; must not
  become evidence by itself.
- `handoff_guidance`: useful for intent, task scope, and expected work; not
  proof that the work happened.
- `execution_trace`: useful for what an implementation or work process did;
  should be linked to changed files, checks, and outcomes where possible.
- `action_proof`: stronger evidence that a specific action ran or produced a
  result; still bounded to the action's actual scope.
- `publication_notice`: evidence that a publication-related notice was created
  or sent; not necessarily approval or acknowledgement.
- `acknowledged_notice`: evidence that a notice was acknowledged; not
  automatically a state approval.
- `committed_state`: strongest internal state evidence; still benefits from
  source proposal, transition, and tension context.

`interpretation_only` records and summaries can help find evidence, but they
must not become evidence by themselves. A bundle may include them as
`summary_refs` or retrieval aids, with cautions, but should require raw,
proof/trace, committed-state, or external evidence refs for support.

## Bundle Grouping Strategy

RawEpisodeBundle boundaries should be derived from the question being asked.
No single key will fit every interpretation problem.

- `scope`: primary project or domain boundary. Useful for all bundles.
- `work_id`: best for task/work episodes, Codex execution, handoffs, and
  work-event chains.
- `session_id`: best for conversation continuity, user preference, objections,
  and corrections.
- `message_id`: best for exact user feedback, instruction, objection, or
  approval-like language.
- `causal_parent_id`: best for coordination chains where one event caused or
  followed another.
- `state_key`: best for committed state, proposed state change, state tension,
  and revision history.
- `target_surface` / `target_ref`: best for GitHub, Discord, ChatGPT App,
  Cockpit, or other surface-specific decisions and publications.
- `publication_id`: best for draft-to-approval-to-delivery publication flow.
- `approval_request_id`: best for exact approval request context.
- `approval_decision_id`: best for approval grant/rejection and readiness
  dependencies.
- `readiness_check_id`: best for dry-run readiness and stale/failed readiness
  evidence.
- `delivery_id`: best for actual delivery attempt, replay, acknowledgement, or
  failure evidence.
- `related_pr`: best for GitHub review, PR discussion, CI, and merge context.
- commit SHA: best for immutable code-history anchor and check association.
- time window: best for temporal revision, drift analysis, and session/work
  slicing when IDs are unavailable or overlapping.

Future projection logic may combine several keys. For example, a publication
episode may group by `publication_id`, target ref, approval decision, readiness
check, delivery id, related PR, and time window.

## Episode Boundary Rules

RawEpisodeBundle boundaries may overlap and should remain derived. They should
not imply a new durable store.

- Task/work episode: group work item, work events, action records, handoffs,
  related PR refs, commit refs, test outputs, blockers, skipped checks, and
  completion evidence.
- Conversation/session episode: group session, messages, user feedback,
  objections, corrections, preference signals, and explicit decisions.
- PR/review episode: group PR refs, review comments, commits, CI/test outputs,
  merge state, and any Augnes work item or handoff that led to the PR.
- Publication/approval/delivery episode: group publication draft, approval
  request, approval decision, readiness check, delivery ledger rows,
  acknowledgements, failures, and target refs.
- State transition episode: group state delta proposal, committed state entry,
  transition record, source evidence, rejected alternatives, and state
  tensions.
- Objection/revision episode: group prior interpretation, objection or user
  correction, raw support, counterexamples, revised interpretation, and
  residual tension.

An episode boundary is a lens for review. The same record may appear in several
bundles when it is relevant to several questions.

## Evidence vs Summary Distinction

The evidence hierarchy should stay explicit:

- `RawEpisodeBundle` = evidence anchor
- `EpisodeSummary` = derived retrieval view/cache/index
- Control Packet = derived view
- `PerspectiveSnapshot` = future derived interpretive view
- `SelfNarrative` = narrator layer, not truth layer

Summaries may retrieve evidence. Summaries may not replace evidence.

A future bundle may include summary refs to explain how evidence was found, but
summary refs should not satisfy evidence-anchor requirements for
RuleCandidate, PerspectiveSnapshot, or user-facing revision claims.

## Counterexample Preservation

RawEpisodeBundle must support positive evidence, negative evidence, and
non-applicability conditions. Temporal interpretation becomes unsafe if it only
collects examples that support the current story.

Future bundles should preserve:

- counterexamples
- failed assumptions
- blocked checks
- skipped checks and reasons
- user corrections
- rejected proposals
- `state_tensions`
- failed delivery or readiness evidence

Counterexamples should remain attached to scope. A negative episode may reject
a universal rule while still allowing a narrower scoped rule. For example,
episodes where concise terminology clarification was enough should limit any
candidate that says Augnes should always prefer dynamic runtime loops.

## Scenario Coverage from P2

P2 scenarios imply specific RawEpisodeBundle requirements:

| P2 scenario | RawEpisodeBundle requirement |
| --- | --- |
| Scenario A Docs-only before runtime | RawEpisodeBundle must retrieve prior staged design/read-only/Core-gated progression evidence, including Control Packet, Authority Matrix, approval gating, P0, and P2 refs where relevant. |
| Scenario B Summary-only rule candidate | RawEpisodeBundle must retrieve raw support and counterexample episodes so summary-only universal claims cannot become vector providers. |
| Scenario C New objection changes interpretation | RawEpisodeBundle must connect prior model, objection, and revision, including what remained useful and what changed. |
| Scenario D User preference vs factuality | RawEpisodeBundle must preserve user preference context and factual repo boundary separately so tone can adapt without overriding evidence. |
| Scenario E Axis proliferation | RawEpisodeBundle must preserve fixed Axis Bank decision context and the explicit no-auto-created-axes rule. |
| Scenario F Explanation fidelity | RawEpisodeBundle must preserve the evidence path enough to compare a user-facing rationale with the actual support and tension path. |

The P2 scenarios should be treated as pressure tests for this design. If a
bundle cannot retrieve counterexamples, revision context, or source authority
profile, it is not strong enough for P4/P5 work.

## Future PerspectiveSnapshot Requirements

A future read-only `PerspectiveSnapshot` would need RawEpisodeBundle support
for:

- evidence anchors
- active prior context
- counterexamples
- residual tensions
- suppressed alternatives
- revision history
- source authority profile
- summary drift warnings
- user-facing explanation support

The snapshot should remain derived, bounded, and read-only. It should not
promote a bundle into truth, approval, schema, runtime behavior, or a new
source of state.

## Future RuleCandidate Requirements

A future `RuleCandidate` experiment would require RawEpisodeBundle support for:

- raw support refs
- external evidence refs
- negative episode refs
- scope evidence
- non-applicability evidence
- summary drift risk basis
- self-narrative origin risk basis
- conflict/tension refs

Runtime RuleCandidate work must not begin until these requirements are
reviewed. A candidate without raw support, counterexample handling, and
conflict/tension refs should remain a discussion artifact, not a vector
provider or future governance artifact.

## Minimal Conceptual Bundle Shape

The shape below is conceptual only and not schema. It is included to make the
design reviewable without adding JSON fixtures or tables.

| Field | Conceptual meaning |
| --- | --- |
| `bundle_id` | Derived identifier for the projected bundle. |
| `scope` | Project or domain scope for the evidence bundle. |
| `bundle_kind` | Task/work, conversation/session, PR/review, publication/approval/delivery, state transition, objection/revision, or other derived kind. |
| `time_window` | Time interval covered by the bundle, with caution if inferred. |
| `primary_refs` | Raw, proof/trace, committed-state, or external refs that directly anchor the episode. |
| `external_refs` | GitHub PRs, commit SHAs, uploaded files, attached docs, external docs, or other non-Core refs. |
| `authority_profile` | Distribution of source authority levels and source categories. |
| `summary_refs` | EpisodeSummary, Control Packet, or other derived retrieval/view refs used to find or explain evidence. |
| `candidate_refs` | StateDeltaProposal-like or future candidate refs included for lifecycle context, not truth. |
| `counterexample_refs` | Negative cases, non-applicability evidence, failed assumptions, or rejected proposals. |
| `tension_refs` | State tensions, conflict records, unresolved objections, suppressed alternatives, or known ambiguities. |
| `outcome_refs` | State transitions, approval decisions, readiness checks, delivery outcomes, merged PRs, or completion evidence. |
| `cautions` | Summary drift risk, self-narrative origin risk, stale refs, missing raw anchors, privacy concerns, or authority limitations. |
| `derived_status` | Marker that the bundle is derived, bounded, read-only, and not source of truth. |

This shape is a design checklist. It should not be copied into schema without a
separate product and implementation review.

## Open Design Questions

- Is derived bundle projection enough, or will a durable `raw_episode` table
  ever be needed?
- What should be the primary bundle boundary: `work_id`, `session_id`, causal
  chain, or `target_ref`?
- How should user feedback be captured when it exists only in conversation?
- How should uploaded files or external docs be referenced?
- How much of GitHub PR evidence should be copied versus referenced?
- How should privacy/local-only artifacts be handled?
- What minimum evidence anchor is required before a RuleCandidate can be
  considered for future promotion?
- Who approves future conversion from bundle design to runtime projection?

These questions should be answered before treating RawEpisodeBundle as a
runtime projection or schema candidate.

## Non-Goals

This document does not add:

- schema
- runtime code
- API
- Cockpit UI
- ChatGPT App tool
- Control Packet contract change
- onboarding next-goal change
- actual RawEpisodeBundle implementation
- JSON fixtures
- automatic rule promotion
- new authority

## Relationship to Future Phases

P4 read-only `PerspectiveSnapshot` projection should use this design to
determine what evidence refs and warnings must be visible. In particular, P4
should not hide summary drift risk, source authority profile, counterexamples,
or residual tensions.

P5 `RuleCandidate` runtime experiment must wait until RawEpisodeBundle
requirements and probe fixtures are clear. P5 should not start from summaries
alone, narrator claims, or candidate fluency.

This document may lead to fixture design, but it does not add fixtures.

## Final Summary

RawEpisodeBundle is not more memory for its own sake.
It is the evidence substrate that lets Augnes interpret over time without letting summaries become truth.
Augnes should not merely remember.
Augnes should interpret over time, anchored to evidence.
