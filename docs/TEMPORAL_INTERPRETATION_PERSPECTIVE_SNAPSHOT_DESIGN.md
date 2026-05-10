# Temporal Interpretation PerspectiveSnapshot Design

## Status

- Type: Read-only derived view design document
- Phase: P4 design-only
- Based on:
  - `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_DEVELOPMENT_MEMO.md`
  - `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_PROBES.md`
  - `docs/TEMPORAL_INTERPRETATION_RAW_EPISODE_BUNDLE_DESIGN.md`
  - `docs/TEMPORAL_INTERPRETATION_FIXTURE_TEST_DESIGN_NOTES.md`
- Canonical status: Not canonical
- Runtime authority: None
- Implementation status: Documentation-only
- Scope: PerspectiveSnapshot design only

This is a P4 read-only `PerspectiveSnapshot` design document for the temporal
interpretation / Rule-Governed Self-Graph Perspective track. It is not
canonical. It grants no runtime authority, adds no schema, adds no API route,
adds no Cockpit UI, adds no ChatGPT App tool, and does not change the
onboarding current next goal.

This document does not implement `PerspectiveSnapshot`, `RawEpisodeBundle`,
`RuleCandidate`, or `PromotedRule`. It does not add JSON fixtures or executable
tests. It defines a future read-only projection shape and visibility
requirements before any implementation.

## Purpose

`PerspectiveSnapshot` exists to make temporal interpretation inspectable before
it becomes executable. Its purpose is to show why Augnes is interpreting a
situation in a certain way at a particular moment, grounded in evidence
anchors, prior context, tensions, counterexamples, and revision history.

It is not a memory store. It is not a source of truth. It is not a rule engine.
It is not a user approval surface. It should help users and reviewers inspect
interpretive stance without granting that stance authority.

The intended product value is explanation and review: what Augnes is currently
emphasizing, why that follows or revises prior context, what evidence anchors
the interpretation, what remains uncertain, and which next step is safe under
the current authority boundary.

## Core Definition

`PerspectiveSnapshot` is a derived, bounded, read-only interpretive view over
RawEpisodeBundle evidence, active prior context, candidate/rule references if
any, source authority profile, residual tensions, suppressed alternatives,
counterexamples, summary drift warnings, and revision explanation support.

Required properties:

- It is derived.
- It is bounded.
- It is read-only.
- It is not source of truth.
- It must point back to evidence refs.
- It cannot create durable state.
- It cannot promote rules.
- It cannot approve, publish, retry, record proof, commit, reject, or execute
  Codex.

The snapshot is an interpretive lens over existing evidence. If the evidence
refs are missing, stale, summary-only, or authority-limited, the snapshot should
show that limitation rather than smoothing it away.

## Relationship to Control Packet

`PerspectiveSnapshot` should follow the Control Packet pattern:

- generated from source-of-truth records
- scoped
- bounded
- inspectable
- surface-renderable
- not a second durable store
- not authority

Control Packet and PerspectiveSnapshot are related but distinct:

- Control Packet = operational/project decision context
- PerspectiveSnapshot = interpretive stance context

Both remain derived views. A Control Packet can help a user understand what is
allowed, forbidden, pending, or risky for project work. A PerspectiveSnapshot
can help a user understand why Augnes is interpreting a question, phase,
objection, or recommendation in a particular way over time. Neither should
become the source of truth it renders.

## User-Facing Role

A user should see:

- current interpretation
- why this interpretation follows or revises prior context
- key evidence anchors
- what changed
- what remains uncertain
- residual tensions
- suppressed alternatives
- safe next step

A user should not see by default:

- raw vector math
- raw scoring internals
- opaque internal equilibrium numbers
- unsupported self-narrative

The user-facing rendering should make the interpretation legible without
turning internals into a false precision display. Reviewer-oriented views may
show more diagnostic detail, but even reviewer views should keep evidence,
authority, and non-authority boundaries explicit.

## Conceptual Snapshot Sections

| Section | Purpose | Source refs likely needed | User-visible form | Cautions |
| --- | --- | --- | --- | --- |
| Snapshot identity | Identify the derived view and distinguish it from durable state | generated id, scope, request context | Short label and generated timestamp | Must not imply persistence or authority. |
| Scope and time boundary | Show what the snapshot covers and excludes | scope, time window, work/session/target refs | "For project:augnes, as of..." | Missing boundaries can make interpretation overbroad. |
| Interpretation summary | State the current interpretive stance in plain language | RawEpisodeBundle refs, prior context, active drivers | Brief current interpretation | Summary must remain backed by refs. |
| Active prior context | Show relevant prior decisions, phase boundaries, or user/project context | P0/P2/P3/pre-P4 docs, work/state refs, messages | "Relevant prior context" bullets | Do not include all memory; include scoped context only. |
| Evidence anchors | Show direct support for the interpretation | raw, proof/trace, committed-state, external refs | Linked or named source refs | Summary-only refs should not satisfy this section. |
| Source authority profile | Show source authority mix and limits | authority levels, record categories, external refs | Qualitative profile such as raw/proof/committed/external | Do not flatten authority levels. |
| Active interpretive drivers | Name what is shaping the interpretation | evidence anchors, prior context, candidate refs, tensions | Plain-language driver list | Drivers are explanatory, not rules. |
| Axis influence summary | Map drivers to fixed axes where useful | Axis Bank v0.1 refs, candidate refs, evidence refs | Qualitative axis summary | Avoid raw numbers until separately designed and reviewed. |
| Residual tensions | Preserve unresolved conflicts or uncertainty | state_tensions, objections, counterexamples, blocked checks | Visible unresolved items | Tensions should not be hidden for narrative polish. |
| Suppressed alternatives | Show plausible paths not currently recommended | prior alternatives, rejected proposals, user preference, phase refs | "Deferred alternatives" list | Suppressed does not mean false or permanently rejected. |
| Counterexamples / non-applicability cases | Preserve negative evidence and scope limits | counterexample refs, rejected proposals, user corrections | "Limits and exceptions" list | Do not let broad rules erase exceptions. |
| Summary drift warnings | Warn when summaries lost conditions or replaced evidence | summary refs, raw refs, drift notes | Warning with corrected boundary | Summaries may retrieve evidence, not replace it. |
| Revision explanation | Explain what changed and what stayed stable | prior snapshot/ref, new evidence, objection, revision refs | "What changed" and "what stayed stable" | Do not claim canonical revision authority. |
| User-facing safe next step | Recommend a bounded next step | evidence anchors, authority boundary, phase docs | Clear recommendation | Recommendation must not create authority. |
| Non-authority boundary | State what the snapshot cannot do | Authority Matrix, Control Packet precedent, non-goals | Explicit boundary note | Must be visible enough to prevent overclaiming. |
| Missing evidence warnings | Show absent, stale, or insufficient anchors | missing raw refs, stale refs, summary-only refs | Warning list | Missing evidence should not be silently inferred. |

These sections are conceptual. A future implementation may combine or rename
sections only after review, but the visibility requirements should not be
silently removed.

## Minimal Conceptual Shape

The shape below is conceptual only and not schema. It is not a JSON fixture, API
contract, database design, or implementation plan.

| Field | Conceptual meaning |
| --- | --- |
| `snapshot_id` | Derived identifier for the generated view. |
| `scope` | Project or domain scope covered by the snapshot. |
| `generated_at` | Time the view was generated. |
| `time_window` | Evidence window used for interpretation. |
| `source_bundle_refs` | RawEpisodeBundle refs or bundle design inputs used by the view. |
| `interpretation_summary` | Plain-language current interpretation. |
| `active_context_refs` | Prior context refs relevant to the interpretation. |
| `evidence_anchor_refs` | Raw, proof/trace, committed-state, or external refs that directly support the view. |
| `external_evidence_refs` | GitHub, commit, uploaded file, attached doc, or other external refs. |
| `source_authority_profile` | Qualitative summary of source authority categories and limitations. |
| `active_interpretive_drivers` | Plain-language reasons shaping the interpretation. |
| `axis_influence_summary` | Qualitative mapping to fixed axes when useful. |
| `residual_tension_refs` | Unresolved tensions, objections, conflicts, or blocked checks. |
| `suppressed_alternatives` | Plausible but currently deferred or non-recommended paths. |
| `counterexample_refs` | Negative cases and non-applicability evidence. |
| `summary_drift_warnings` | Warnings where summaries lost conditions or lack raw support. |
| `revision_explanation` | What changed, why it changed, and what remained stable. |
| `user_visible_next_step` | Safe, bounded next step in user-facing language. |
| `non_authority_boundary` | Explicit limits on what the snapshot can and cannot do. |
| `missing_evidence_warnings` | Missing, stale, summary-only, or insufficient evidence notes. |
| `derived_status` | Marker that the snapshot is derived, bounded, read-only, and not source of truth. |

This table is a design checklist. It should not be copied into schema or an API
without a separately scoped implementation review.

## Snapshot Visibility Requirements from P2/P3/pre-P4 Notes

A future snapshot must:

- show evidence anchors
- show active prior context
- show summary drift warnings when relevant
- show residual tensions
- show suppressed alternatives
- show counterexamples
- support revision explanation
- show source authority profile
- clearly state non-authority status
- support user-facing helpfulness without dumping internals

These requirements are drawn from P2 probe scenarios, P3 RawEpisodeBundle
requirements, and the post-P3 fixture/test design notes. A snapshot that cannot
show these elements is not ready to become an implemented projection.

## Scenario Mapping

| P2 scenario | Future PerspectiveSnapshot requirement |
| --- | --- |
| Scenario A Docs-only before runtime | Snapshot should show prior staged progression evidence, current no-runtime boundary, suppressed runtime alternative, and safe docs/probe/P3/P4 path. |
| Scenario B Summary-only rule candidate | Snapshot should show summary-only warning, raw support refs, counterexample refs, and blocked promotion status. |
| Scenario C New objection changes interpretation | Snapshot should show prior model, new objection, revision explanation, what changed, what remained stable, and residual tension. |
| Scenario D User preference vs factuality | Snapshot should show user preference context, factual repo boundary, tension between `user_context` and factuality, and safe next step. |
| Scenario E Axis proliferation | Snapshot should show fixed Axis Bank context, rejected/needs-review new axis, and mapping to existing axes if possible. |
| Scenario F Explanation fidelity | Snapshot should show user-facing rationale, evidence path, active drivers/tensions, and fidelity warning if rationale does not match evidence. |

The scenario mapping is a review requirement, not a runtime test result.

## Capability Probe Coverage

A future snapshot should support capability probes in these ways:

- Temporal Interpretation Consistency: show prior related decisions, current
  evidence, and why the current interpretation follows the same reasoning
  standard or validly differs.
- Context Carry-Forward: show active prior context and deferral reasons that
  remain relevant to the current question.
- Revision Explanation: show the prior interpretation, new evidence or
  objection, what changed, what remained stable, and residual tension.
- User-Facing Helpfulness: provide a clear user-visible next step while keeping
  internal diagnostic detail secondary.
- Consistency-with-Adaptivity: show which evidence justifies adaptation and
  which authority boundaries still block further movement.

The snapshot should make these evaluations inspectable. It should not claim the
probe passed merely because the interpretation sounds coherent.

## Safety/Governance Probe Coverage

A future snapshot should support safety/governance probes in these ways:

- Raw Episode Anchor: show raw, proof/trace, committed-state, or external
  evidence refs, and warn when support is summary-only.
- Summary Drift: show summary drift warnings and the raw refs that restore
  lost conditions.
- Self-Narrative Isolation: keep narrator-layer claims separate from evidence
  anchors and mark unsupported self-narrative as non-evidence.
- Counterexample Preservation: show counterexample refs and non-applicability
  conditions next to any broad interpretation.
- Axis Interpretability: map influence to fixed Axis Bank v0.1 axes and mark
  new axes rejected or needs-review.
- Rule Bloat Control: show duplicate or near-duplicate candidates as cautions
  rather than separate reinforcing evidence.
- Factuality Boundary: show factual evidence separately from `user_context`
  and preserve tension when they conflict.
- Tension Preservation: keep residual tensions and suppressed alternatives
  visible instead of resolving them narratively.
- Explanation Fidelity: compare user-facing rationale with evidence path and
  active drivers, and warn when they diverge.

These are visibility obligations, not permission to promote rules or create
runtime authority.

## Read-Only Boundary Requirements

A future `PerspectiveSnapshot` must not:

- commit state
- reject state
- create `state_delta_proposals`
- promote RuleCandidates
- create PromotedRules
- record proof
- approve publication
- publish
- retry delivery
- update mailbox status
- execute Codex
- mutate GitHub
- post to Discord
- create or modify Control Packet source records
- become a source of truth

If a snapshot rendering suggests or implies one of these actions happened, the
rendering is unsafe. If a future surface wants to trigger any action, that must
be separately scoped, authorized, and routed through the appropriate existing
authority boundary.

## Future API Considerations, Design-Only

A future API could exist only after separate review. This document does not add
one.

One possible conceptual route name for discussion:

```text
GET /api/perspective/snapshot?scope=project:augnes
```

This endpoint is not implemented by this PR. This endpoint shape is not
approved by this PR. Any future endpoint must be read-only, derived, bounded,
have no side effects, and pass fixture/probe review first.

The route shape is included only to make future discussions concrete enough to
evaluate. It is not an API contract.

## Future Surface Considerations, Design-Only

Possible future renderers could include:

- ChatGPT Apps decision support
- Cockpit observability
- Codex handoff/review context

No surface is implemented now. No surface gains authority. Any future surface
must render `PerspectiveSnapshot` as a derived view only.

Potential future surface behavior should preserve the same boundary:

- ChatGPT Apps may explain the interpretation and pending user decision, but
  not approve, publish, or commit state.
- Cockpit may show observability context, but not become hidden authority.
- Codex may use snapshot context for handoff/review framing, but not treat the
  snapshot as proof, approval, or execution instruction by itself.

## Failure Modes

Important failure modes to test before implementation:

- Snapshot treated as source of truth
- Snapshot hides missing raw evidence
- Snapshot converts summary into authority
- Snapshot hides counterexamples
- Snapshot erases residual tension
- Snapshot overexposes vector math to user
- Snapshot gives polished but unfaithful rationale
- Snapshot suggests runtime/schema action without evidence
- Snapshot confuses user preference with factual readiness
- Snapshot causes rule promotion by implication

These failures are not presentation nits. Several would corrupt future
interpretation authority by making a derived view look like a decision,
approval, or implemented model.

## Acceptance Criteria Before Any P4 Implementation

Before any P4 implementation is scoped:

- All required visibility sections are defined.
- P2 scenarios A-F map to snapshot requirements.
- Evidence anchors and source authority profile are required.
- Summary drift warnings are included.
- Counterexample and tension visibility are included.
- Non-authority boundary is explicit.
- User-facing output is separated from internal diagnostic detail.
- No schema/API/UI/App implementation is added.

These are design acceptance criteria only. Passing them does not approve an
endpoint, schema, UI, App tool, runtime projection, or rule promotion.

## Relationship to P5

P5 `RuleCandidate` runtime experiment must not start merely because
`PerspectiveSnapshot` is designed.

P5 requires:

- actual fixture/test design conversion
- raw support refs
- counterexample refs
- anti-self-justification checks
- summary drift checks
- axis governance
- authority-boundary review

A snapshot can make candidate reasoning inspectable. It must not become a
shortcut around the evidence and governance work required before runtime rule
experiments.

## Open Questions

- Should a future snapshot be generated per user question, per work item, per
  session, or per explicit review request?
- What is the minimum evidence anchor set for a snapshot?
- Should snapshots be ephemeral only, or can they be cached as derived
  artifacts?
- How should snapshot drift be compared across time?
- What should be visible to users vs reviewers vs Codex?
- Should axis influence summary be qualitative before numeric?
- Should missing evidence block snapshot generation or merely warn?
- How should privacy/local-only refs be represented?
- Who approves a future API or surface projection?

These questions should be resolved before implementation, or explicitly scoped
as open design constraints in the implementation PR.

## Non-Goals

This document does not add:

- schema
- runtime code
- API
- Cockpit UI
- ChatGPT App tool
- Control Packet contract change
- onboarding next-goal change
- actual PerspectiveSnapshot implementation
- JSON fixtures
- executable tests
- automatic scoring thresholds
- rule promotion
- new authority

## Final Summary

PerspectiveSnapshot is not the truth.
It is a read-only interpretive lens over evidence.
It exists so Augnes can explain how it interprets over time before that interpretation becomes executable.
Augnes should not merely remember.
Augnes should interpret over time, and its interpretation should remain visibly grounded, revisable, and non-authoritative until explicitly scoped otherwise.
