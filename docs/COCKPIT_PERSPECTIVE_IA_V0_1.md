# Cockpit Perspective IA v0.1

Historical Legacy Cockpit artifact.
This document describes pre-removal Cockpit-era architecture or validation.
It is not current product IA.
Current product structure is Blank State + Agent Workplane + GuideBrief.
Legacy Cockpit has been removed as a product surface.

## Summary

Current Cockpit top-level tabs are:

```text
Overview / Work / Perspective / Bridge / Operator
```

- Overview: first screen and demo status summary.
- Work: work focus and trace anchors.
- Perspective: Temporal Perspective, the current interpretive frame and how it was formed.
- Bridge: external/tool authority boundaries.
- Operator: local runtime controls and proposal decisions.

## Rationale

Perspective becomes the center because the Cockpit needs one place where Augnes
can show how a frame was formed without granting that frame authority. Temporal
context, work traces, committed state, evidence, tensions, and bridge/operator
boundaries are easier to inspect when they are arranged around the question:
"Why does this frame currently look this way?"

Ledger and Proof become Perspective basis/evidence sections, not erased
concepts. Ledger remains committed runtime state. Proof remains
evidence/verification support. The IA change moves their inspection surfaces
under Perspective so the user sees the frame, its basis, its evidence, its
limits, and its safe next step together.

## Perspective Sections

### Frame

Shows the current interpretive frame and "How this frame was formed." The trace
pipeline is:

```text
Scan -> Bind -> Resolve -> Anchor -> Next
```

If `temporalPreview` is available, the section shows compact fields from the
existing preview response, including current interpretation, active prior
context, transition relation, evidence anchor counts, and summary ref counts.
If it is not loaded, a read-only load/refresh action may call the existing
Temporal Interpretation Preview callback.

### Ledger Basis

Shows the committed runtime state basis used by Perspective:

- committed transition count
- state key count
- selected transition summary
- before/after values
- `committed_at`
- reason
- source session/agent where available
- compact committed state graph

Boundary: Ledger Basis is committed runtime state. Perspective interprets it,
but does not own it. Pending proposals are not ledger entries.

### Evidence

Shows proof/evidence support for the current frame:

- Evidence Pack loaded/not loaded
- Temporal review artifact count
- Session Trace loaded/not loaded
- gaps/needs review counts where derivable
- evidence anchor refs
- summary refs
- read-only preview refs

Read-only load controls are allowed for Evidence Pack, Temporal Review
Artifacts, Session Trace, and Temporal Interpretation Preview. These controls
inspect existing read models only.

Boundary: Evidence supports or challenges the frame. It does not commit,
approve, publish, replay, or execute.

### Tensions

Shows what weakens, limits, or challenges the frame:

- `snapshot.open_tensions`
- temporal preview counterexamples
- temporal preview residual tensions
- temporal preview suppressed alternatives
- evidence pack gaps
- temporal review artifact gaps
- session trace gaps

Principle: Perspective must not become a self-confirming summary. It must show
what weakens, limits, or challenges the frame.

### Boundary / Next

Shows safe next steps and authority boundaries:

- `brief.agent_handoff.next_recommended_action`
- selected work `next_action`
- read-first
- commit state blocked outside local runtime gate
- execute Codex blocked
- publish/mutate GitHub blocked
- proof/trace recording gated

Perspective may include navigation to Operator for review. It must not contain
commit/reject controls, run-tool buttons, publish controls, replay controls, or
external execution controls.

## Data Source Mapping

| Perspective UI | Existing Cockpit state |
|---|---|
| Frame | `temporalPreview`, `temporalPreviewError`, `temporalPreviewBusy`, `temporalPreviewRequested`, `onRefreshTemporalPreview` |
| Ledger Basis metrics | `trajectory`, `snapshot`, derived ledger counts |
| Selected transition | `selectedTransition`, `onSelectTransition` |
| Pending proposal count | `proposals` as non-ledger candidates only |
| Evidence Pack | `evidencePack`, `evidencePackError`, `evidencePackLoading`, `onLoadEvidencePack` |
| Temporal review artifacts | `temporalReviewArtifacts`, `selectedTemporalReviewArtifact`, `temporalReviewArtifactsError`, `temporalReviewArtifactsBusy`, `temporalReviewArtifactsRequested`, `onLoadTemporalReviewArtifacts`, `onSelectTemporalReviewArtifact` |
| Session Trace | `sessionTrace`, `sessionTraceError`, `sessionTraceBusy`, `sessionTraceRequested`, `onRefreshSessionTrace` |
| Tensions | `snapshot.open_tensions`, temporal preview tensions/counterexamples/suppressed alternatives, evidence gaps |
| Next step | `workBrief`, `selectedWorkItem`, `brief.agent_handoff.next_recommended_action` |

## Authority Boundaries

Perspective is a read-only interpretation surface. It does not commit state,
approve work, publish proof, admit memory, replay delivery, route agents,
execute Codex, or mutate external systems.

Operator remains the only top-level surface for local proposal commit/reject
decisions. Bridge remains the place to inspect read-first external/tool
authority boundaries. Runtime behavior, APIs, database schema, OpenAI behavior,
bridge authority, proof recording semantics, proposal commit/reject logic, and
external action behavior are unchanged by this IA refactor.

## Non-Goals

- no hidden chain-of-thought display
- no DB/schema/API changes
- no new runtime authority
- no publish/merge/retry/token/live-exchange controls
- no commit/reject controls inside Perspective
- no dark theme redesign in this PR
- no PerspectiveSnapshot runtime claim
- no RawEpisodeBundle runtime work
- no logo/glyph implementation

## Migration Notes From Six-Tab IA

The previous top-level IA was:

```text
Overview / Work / Ledger / Proof / Bridge / Operator
```

The current v0.1 IA supersedes that top-level structure with:

```text
Overview / Work / Perspective / Bridge / Operator
```

Ledger inspection moves into Perspective as Ledger Basis. Proof inspection
moves into Perspective as Evidence. Existing local proposal decisions remain in
Operator. Existing Bridge authority summary remains in Bridge. Existing
Overview and Work purposes remain intact.

Compatibility smoke scripts with old `six-tab` names should validate that the
old IA is superseded and that the current Cockpit uses the five-tab Perspective
IA.

## Open Questions

- Should Ledger/Proof remain available as deep links?
- Should Perspective default to Frame or Ledger Basis?
- How much anthropomorphic language is acceptable?
- Should top-level tab be named Perspective, Temporal, or Frame?
- When should Augnes Temporal Focus Glyph `◇─◉─◇` be introduced?
