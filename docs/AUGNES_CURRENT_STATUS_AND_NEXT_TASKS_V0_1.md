# Augnes Current Status And Next Tasks v0.1

## Purpose

This document summarizes the current public-facing Augnes structure and the next
major development lanes after the Legacy Cockpit removal work. It now also points
the current development posture toward the Augnes Intent Continuity Model v0.1.

## Current Shape

```text
Blank State
= human-facing entry surface

Agent Workplane
= AI/operator-facing work surface

GuideBrief
= cross-surface guidance and explanation layer

Provider / Runner / Tool Layer
= ChatGPT, Codex, local runtime, bridge, and runner capability sources
```

Legacy Cockpit is no longer a product surface. Its useful capabilities were
migrated into Blank State, Agent Workplane, Workplane State Proposal Review, and
Manual Controls Migration review rows.

## Current Read-Model Path

```text
Source records
  -> Augnes Delta Projection
  -> Current Working Perspective
  -> Workplane Context
  -> Blank State / Agent Workplane / State Proposal Review / GuideBrief
```

Current surfaces emphasize reading, projection, preview, review, source refs,
fallback visibility, handoff preparation, scoped local apply records, and explicit
operator review.

## Intent Continuity Adjustment

The current product direction should treat Augnes as an intent continuity system,
not as a generic memory bucket or autonomous execution surface.

The active model pointer is:

- `docs/AUGNES_INTENT_CONTINUITY_MODEL_V0_1.md`

The practical adjustment is:

```text
user goal / project constraint
  -> observed repo and runtime state
  -> residual gap
  -> evidence-backed judgment
  -> next valid action
  -> handoff surface
```

This means the next useful Augnes slices should reduce requirement residuals,
increase evidence-backed continuity, or improve the handoff boundary between
ChatGPT, Codex, GitHub PR review, and the local Workplane.

PR existence, document volume, smoke count, and approval-boundary repetition are
not sufficient progress claims by themselves.

## Current Surface Summary

### Blank State

Blank State is the human-facing entry point for continuing work, reviewing
pending items, choosing Perspective context, preparing Codex handoff, and moving
into review lanes.

### Agent Workplane

Agent Workplane is the AI/operator-facing work surface. It displays Current
Working Perspective, Delta Projection, Review Queue, State Proposal Review,
GuideBrief context, handoff previews, Codex Launch Card preview, runner readback,
source refs, trace diagnostics, metrics, Continuity Relay material, and current
scoped CWP apply/review material.

### GuideBrief

GuideBrief explains current context across surfaces. It separates observed,
inferred, suggested, and user-judgment material while keeping source status,
fallbacks, gaps, and staleness visible.

### ChatGPT / MCP And Codex

The local bridge keeps read and preview surfaces for state, work, GuideBrief,
Handoff Capsule, Codex Launch Card, Autonomy Contract, runner preflight, evidence
packs, and session traces. Codex handoff and result-review drafts remain manual
and review-first.

## Completed For Current Purposes

```text
Cockpit route removal
Cockpit component removal
Workplane legacy compatibility pointer removal
pre-removal retained-route smoke retirement
Cockpit post-removal cleanup
Blank State entry absorption
Workplane State Proposal Review introduction
Manual Controls Migration rows introduction
Workplane handoff and Codex Launch Card preview retention
ChatGPT Apps / MCP read-only surface retention
GuideBrief read-only / fallback structure retention
Runner DeltaBatch readback retention
Workplane Continuity Relay read-model foundation
Perspective / next-work signal and relay update candidate foundations
Scoped local write foundations for PerspectiveUnit, NextWorkBias, ContinuityRelay,
  and CurrentWorkingPerspective apply records
Applied CurrentWorkingPerspective local snapshot foundation
```

These completions do not grant autonomy, merge authority, direct Codex execution,
upstream Perspective replacement, handoff send, durable memory mutation, or live
external side effects.

## Next Development Lanes

### 1. Intent Continuity Packet v0.1

Define and implement the first read-only Intent Continuity Packet derived from
Current Working Perspective, Continuity Relay, GuideBrief, applied CWP snapshot
records, Codex result review material, and source refs.

The packet should expose active goals, residuals, evidence anchors, fake-closure
warnings, stop-if-missing blockers, next valid action candidates, source freshness,
handoff surface material, and intent validity health. It should not write DB state
in its first slice.

### 2. GuideBrief live integration

Make GuideBrief reflect current Workplane context more directly while preserving
source status, fallback disclosure, user-judgment separation, and AICM residual /
evidence distinction.

### 3. Codex handoff and result-review loop

Connect Workplane work items, Codex Launch Card preview, handoff drafts, Codex
result paste, result-review drafts, and residual updates into a clearer loop.

The loop should distinguish `claimed_satisfied` from `evidence_verified` so a
Codex report or PR body does not silently become completion.

### 4. State Proposal Review action contract

Define the first small action contract for review-packet preparation, local draft
creation, handoff preparation, and explicit user review requests.

### 5. Applied CWP route and handoff-context decision

Decide whether scoped applied CurrentWorkingPerspective snapshots should
participate in `/api/perspective/current`, handoff context update contracts, or
both. Keep upstream source tables and live relay state protected until explicitly
scoped.

### 6. Durable memory and Perspective apply contract

Define proposal state, review completion, approval criteria, apply target classes,
and rollback/audit expectations before adding stronger state-transition behavior.

### 7. Runner and Workplane metrics

Improve runner readback freshness, latest-run summaries, dogfood friction signals,
and the relation between runner output, Delta Projection, and intent validity
health.

### 8. Augnes-on-Augnes dogfood loop

Connect Blank State, Agent Workplane, GuideBrief, Codex handoff, Codex result
review, State Proposal Review, Intent Continuity Packet, and next-candidate
generation into a repeatable Augnes development loop.
