# Temporal Interpretation Perspective Development Memo

This is a development discussion memo for the temporal interpretation /
Rule-Governed Self-Graph Perspective candidate.

This memo is not canonical. It grants no runtime authority, adds no schema,
adds no API route, adds no Cockpit or ChatGPT App surface, and does not change
the current onboarding next goal. It should be treated as a temporal
interpretation productization discussion artifact.

## 1. Purpose

The goal is to improve Augnes' ability to provide temporally consistent,
context-aware, revisable interpretation to the user. Temporal interpretation
should help Augnes reason across long horizons, carry forward relevant context,
explain why a judgment changed, preserve uncertainty, and recommend safer next
steps when prior evidence or boundaries matter.

The purpose is not memory storage for its own sake. It is not a selfhood
theory. It is not runtime autonomy. The product question is whether Augnes can
derive better interpretation from existing records and governed evidence
without turning summaries, narratives, or generated hypotheses into authority.

## 2. Core Claim

Perspective should be understood as a regulated interpretive state over the
self-graph, not as a static belief node.

A perspective is formed from activated self-graph context, rule vectors,
evidence anchors, residual tensions, suppressed alternatives, and update
operators. It is the current bounded way Augnes interprets a situation, given
the available evidence and applicable governance constraints.

This framing keeps perspective revisable. New evidence can activate different
context, adjust rule weights, expose unresolved tensions, or require a previous
interpretation to be explained and revised.

## 3. User-Facing Meaning

Users should experience temporal interpretation as better long-horizon
interpretation, not as exposure to internal machinery. The user-facing effect
should be:

- clearer reasoning
- continuity with prior judgments
- explanation of revisions
- visible uncertainty and residual tension
- safer next-step recommendations

Internal vector math, scoring factors, and suppression mechanics should not be
exposed directly to users. User-facing surfaces should render the useful
consequences: what changed, why it changed, what remains uncertain, what
evidence anchors the interpretation, and what next step is safest under the
current authority boundary.

## 4. RawEpisodeBundle

`RawEpisodeBundle` is a derived evidence bundle over existing Augnes Core
records. It is a way to collect and reference relevant raw episodes for an
interpretive question without creating a new source of truth.

This memo does not propose a `raw_episode` table yet.

Possible source records include:

- sessions
- messages
- coordination_events
- work_events
- action_records
- state_delta_proposals
- state_transitions
- state_tensions
- handoffs
- mailbox_messages
- publication_drafts
- publication_approval_requests
- publication_approval_decisions
- publication_readiness_checks
- delivery_ledger rows
- GitHub PR refs
- commit refs
- test outputs
- user feedback

The important property is anchoring. A derived bundle may organize evidence,
but it must point back to existing records or external evidence references
where possible.

## 5. Evidence Hierarchy

The candidate evidence hierarchy should distinguish raw evidence, summaries,
hypotheses, promoted governance artifacts, and narrator output:

- `RawEpisodeBundle` = evidence layer
- `ExternalEvidence` = external evidence refs
- `EpisodeSummary` = retrieval view/cache/index
- `RuleCandidate` = hypothesis
- `PromotedRule` = conditional governance artifact
- `PerspectiveSnapshot` = derived interpretive view
- `SelfNarrative` = narrator layer, not truth layer

This hierarchy is intended to prevent convenient summaries or fluent
narratives from becoming accidental authority.

## 6. Summary Drift Guard

Summaries may retrieve evidence, but they must not replace evidence. An
`EpisodeSummary` can help locate relevant episodes, compress repeated patterns,
or support user-facing explanation, but it should not become the source of
truth for temporal interpretation.

Summary-only rules must not become vector providers without raw episode
anchoring. If a rule candidate was inferred only from summaries, it should be
treated as weak, review-needing discussion material until it is backed by raw
episode references or external evidence references.

## 7. RuleCandidate and PromotedRule

`RuleCandidate` is a hypothesis, not a rule. It proposes that future
interpretation may be improved by shaping attention, weighting, conflict
handling, explanation, or next-step recommendations in a particular way.

`PromotedRule` is a future concept for a candidate that passes defined gates
and may act as a vector provider. A promoted rule would still need scope,
authority, evidence anchors, counterexample handling, and conflict registration.

No runtime rule promotion is added by this PR. This memo only names the concept
for future productization discussion.

## 8. Difference from StateDeltaProposal

Current `state_delta_proposals` are a useful precedent for candidate lifecycle
and scoring, but `StateDeltaProposal` and `RuleCandidate` are separate concepts.

- `StateDeltaProposal` records possible state change.
- `RuleCandidate` proposes how future interpretation should be shaped.

The distinction matters because a state proposal asks whether Augnes state
should change, while a rule candidate asks whether future interpretation should
be biased, constrained, or explained differently under a bounded scope.

## 9. Axis Bank v0.1

The initial discussion axis bank is fixed:

- factuality
- continuity
- user_context
- boundary
- exploration
- implementation
- stability
- revision

LLMs must not auto-create axes. New axes would need explicit design review
because axes shape interpretation, scoring, explanation, and potential future
authority boundaries.

## 10. Operational Mathematical Sketch

The following model is non-canonical discussion material. These formulas are
not runtime formulas, not canonical law, and not automatic promotion criteria.
They are included to make the candidate reasoning concrete enough to evaluate.

```text
I_i =
  a_i
× w_i
× c_i
× m_i
× s_i
× raw_support_i
× evidence_authority_i
× negative_case_coverage_i
× (1 - conflict_penalty_i)
× (1 - summary_drift_risk_i)
× (1 - self_narrative_origin_risk_i)

p_t = normalize(sum over i of I_i v_i)

T_t =
  sum conflict(r_i, r_j) × I_i × I_j
+ suppression_cost
+ unresolved_counterexample_cost

D_t =
  distance(p_t, p_{t-1})
  adjusted by evidence_delta

promotion_score =
  recurrence
+ utility
+ evidence_support
+ scope_clarity
+ compatibility
+ counterexample_coverage
- conflict_cost
- overfit_risk
- self_justification_risk
- summary_drift_risk
```

`I_i` represents a possible influence strength for a rule or interpretive
factor. `p_t` represents a normalized perspective at time `t`. `T_t` represents
residual tension. `D_t` represents drift or revision distance adjusted by new
evidence. `promotion_score` sketches the kinds of considerations that could
support or block future promotion.

Again, these are discussion tools only. Runtime behavior, governance law, and
promotion gates would need separate explicit design and review.

## 11. Promotion Gates

Future rule promotion, if ever implemented, should be gated conceptually by:

- Evidence Anchor Gate: the candidate must point to raw episode anchors or
  external evidence references.
- Scope Binding Gate: the candidate must declare where it applies and where it
  does not apply.
- Counterexample Gate: known negative cases must be preserved and reviewed.
- Conflict Registration Gate: conflicts with existing rules, boundaries, or
  interpretations must be recorded.
- Anti-Self-Justification Gate: the candidate must not promote itself merely
  because Augnes narrated it fluently or because it flatters prior Augnes
  behavior.
- Summary Drift Check: the candidate must not rely on summary-only evidence
  when raw anchoring is required.

These gates describe a productization direction, not a current runtime path.

## 12. PerspectiveSnapshot

`PerspectiveSnapshot` should be derived, bounded, read-only, and not a source
of truth. It should express the current interpretive view for a scope and
moment, with links back to evidence anchors, active rules or candidates,
registered tensions, suppressed alternatives, and revision context.

It should follow the Control Packet pattern: generated from source-of-truth
records, scoped, bounded, inspectable, and unable to create authority by being
rendered. A `PerspectiveSnapshot` can help surfaces explain interpretation, but
it must not become a second state store or a hidden approval mechanism.

## 13. Existing Augnes Elements That Can Be Reused

Several current Augnes elements provide useful precedents:

- Control Packet as derived-view precedent
- Authority Matrix as surface/authority precedent
- `coordination_events.authority_level` as evidence authority precedent
- `state_delta_proposals` and candidate scoring as lifecycle/scoring precedent
- consolidation lifecycle as reinforcement/expiry/needs_review precedent
- `state_tensions` as tension precedent
- `work_events`, handoffs, and mailbox as episode boundary and coordination
  signals
- publication, approval, readiness, and delivery workflow as
  authority-separation precedent

The reuse goal is conceptual alignment, not silent expansion. Any schema,
runtime, route, or surface reuse would need a later scoped PR.

## 14. Capability Probes

Future productization should be evaluated with capability probes:

- Temporal Interpretation Consistency Probe: checks whether Augnes gives
  compatible interpretations across related moments without flattening new
  evidence.
- Context Carry-Forward Probe: checks whether relevant prior judgments,
  constraints, and evidence are carried into a new discussion.
- Revision Explanation Probe: checks whether Augnes can explain why a prior
  interpretation changed.
- User-Facing Helpfulness Probe: checks whether the interpretation improves
  user decisions without exposing unnecessary internals.
- Consistency-with-Adaptivity Probe: checks whether Augnes can remain coherent
  while adapting to changed evidence or changed user goals.

## 15. Safety/Governance Probes

Future productization should also be evaluated with safety and governance
probes:

- Raw Episode Anchor Probe: verifies that interpretive claims can point back to
  raw episode anchors or external evidence refs.
- Summary Drift Probe: verifies that summaries help retrieval without replacing
  source evidence.
- Self-Narrative Isolation Probe: verifies that narrator output is not treated
  as a truth source.
- Counterexample Preservation Probe: verifies that negative cases remain
  visible and are not optimized away.
- Axis Interpretability Probe: verifies that axes are fixed, understandable,
  and reviewable.
- Rule Bloat Control Probe: verifies that candidates do not accumulate without
  scope, utility, expiry, or review pressure.
- Factuality Boundary Probe: verifies that interpretive continuity does not
  override factual evidence.
- Tension Preservation Probe: verifies that unresolved tensions remain visible
  instead of being prematurely resolved.
- Explanation Fidelity Probe: verifies that user-facing explanations faithfully
  represent the evidence, uncertainty, and revision path.

## 16. Development Phases

Possible development phases:

- P0 Development memo
- P1 Docs-only candidate spec
- P2 Fixture/probe docs
- P3 RawEpisodeBundle design
- P4 Read-only PerspectiveSnapshot projection
- P5 RuleCandidate runtime experiment

This PR covers P0 only.

## 17. Current Implementation Boundary

This PR must not:

- edit `schema.sql`
- edit `lib/db.ts`
- edit runtime TypeScript
- add API routes
- add Cockpit UI
- add ChatGPT App tools
- change Control Packet contract
- change onboarding current next goal

It also must not edit `docs/DEVELOPMENT_ONBOARDING.md`,
`docs/AUGNES_CONTROL_PACKET_AND_SURFACE_ROLES.md`,
`docs/AUTHORITY_MATRIX.md`, schema files, or runtime files.

## 18. Final Summary

Augnes should not merely remember.
Augnes should interpret over time.
