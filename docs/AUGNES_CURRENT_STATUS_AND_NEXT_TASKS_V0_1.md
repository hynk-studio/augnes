# Augnes Current Status And Next Tasks v0.1

## Purpose

This document summarizes the current public-facing Augnes structure and the next
major development lanes after the Legacy Cockpit removal work.

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
fallback visibility, and handoff preparation.

## Current Surface Summary

### Blank State

Blank State is the human-facing entry point for continuing work, reviewing
pending items, choosing Perspective context, preparing Codex handoff, and moving
into review lanes.

### Agent Workplane

Agent Workplane is the AI/operator-facing work surface. It displays Current
Working Perspective, Delta Projection, Review Queue, State Proposal Review,
GuideBrief context, handoff previews, Codex Launch Card preview, runner readback,
source refs, trace diagnostics, and metrics.

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
```

## Next Development Lanes

### 1. Merge Workplane post-Cockpit note cleanup

Close the remaining stale Workplane copy that described Cockpit compatibility
content as preserved.

### 2. GuideBrief live integration

Make GuideBrief reflect current Workplane context more directly while preserving
source status, fallback disclosure, and user-judgment separation.

### 3. Codex handoff flow

Connect Workplane work items, Codex Launch Card preview, handoff drafts, Codex
result paste, and result-review drafts into a clearer loop.

### 4. State Proposal Review action contract

Define the first small action contract for review-packet preparation, local draft
creation, handoff preparation, and explicit user review requests.

### 5. Durable memory and Perspective apply contract

Define proposal state, review completion, approval criteria, apply target classes,
and rollback/audit expectations before adding stronger state-transition behavior.

### 6. Runner and Workplane metrics

Improve runner readback freshness, latest-run summaries, dogfood friction
signals, and the relation between runner output and Delta Projection.

### 7. Augnes-on-Augnes dogfood loop

Connect Blank State, Agent Workplane, GuideBrief, Codex handoff, Codex result
review, State Proposal Review, and next-candidate generation into a repeatable
Augnes development loop.
