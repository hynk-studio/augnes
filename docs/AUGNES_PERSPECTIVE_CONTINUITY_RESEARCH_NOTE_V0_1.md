# Augnes Perspective Continuity Research Note v0.1

## Status

- research-note-only
- non-SSOT
- does not expand Active set
- no runtime behavior
- no schema authority
- no implementation authority
- no diagnostic authority
- no evaluation authority
- no production-readiness claim

## Purpose

Define research vocabulary for discussing how project context changes over time.

This note is non-authoritative. It does not change PerspectiveSnapshot behavior,
diagnostics, schema, routes, Cockpit controls, or Augnes Core authority.

## Important Boundary

Continuity does not mean preserving the current project view at all costs. A
valid outcome may be maintenance, revision, repair, transition, retirement,
suspension, or boundary blocking.

## Perspective

Perspective means the current project-facing view assembled from committed
state, recent work context, open questions, known gaps, and next-step framing.

## Vocabulary

- Continuity: the degree to which a project-facing view remains usable and
  accurate across time, sessions, tools, and reviews.
- Formation: the initial assembly of a project-facing view from available
  committed state and recent context.
- Maintenance: preserving a project-facing view when new information is
  consistent with it.
- Revision: updating a project-facing view when new information changes its
  content without replacing the overall direction.
- Drift: gradual movement away from committed state, current constraints, or
  unresolved gaps.
- Repair: explicit correction of stale, incomplete, or misaligned project
  context.
- Transition pressure: evidence that the current project-facing view may need
  to move to a materially different framing.
- Supersession: replacement of a prior project-facing view by a newer accepted
  framing.
- Retirement: deliberate removal of an old project-facing view from active use.
- Inheritance: carrying forward useful context from a prior project-facing view
  into a newer one.
- Boundary blocking: stopping a transition or update because authority, scope,
  evidence, or safety boundaries are insufficient.

## Temporal Sequence

- t0 project view: the project-facing view before new update pressure.
- t1 update pressure: new information, review feedback, task pressure, or
  boundary pressure that may affect the view.
- t2 result: maintenance, revision, repair, transition, or retirement result
  after review.

## Continuity States

- forming
- maintained
- revised
- drifting
- stale
- repair_needed
- transition_pressure
- superseded
- retired
- boundary_blocked

## Pressure Model

- Conservation pressure: reasons to preserve the current project-facing view.
- Revision pressure: reasons to update details while keeping the current
  framing.
- Transition pressure: reasons to move to a materially different framing.
- Retirement pressure: reasons to stop using a project-facing view.

## Existing Diagnostics Boundary

Existing diagnostic placeholders remain placeholders. This note does not promote
any placeholder diagnostic into runtime computation.

This note does not create diagnostic authority, evaluation authority, runtime
Sidecar e_t computation, QP evidence, z_t commits, or source-of-truth status.

## Sequence Casebook Outline

- Stable continuity
- Minor revision
- Drift detected
- Repair needed
- Transition pressure
- Transition accepted
- Retirement
- Boundary blocked
- Source-ref temptation
- Temporal grouping failure

## Future Smoke Direction

Future smoke may use sequence fixtures, but must remain non-authoritative until
separately designed, implemented, and approved.

## Non-Goals

- no proof
- no evidence status
- no readiness
- no action
- no commit/reject
- no Gate/SRF input
- no proposal scoring
- no QP evidence
- no z_t commit
- no runtime Sidecar e_t computation
- no PerspectiveSnapshot response-shape change
- no source-of-truth claim
- no production-readiness claim
- no autonomous-agent claim
