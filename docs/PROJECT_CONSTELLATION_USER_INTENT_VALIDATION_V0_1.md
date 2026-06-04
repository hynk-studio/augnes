# Project Constellation User-Intent Validation v0.1

## 1. Status and scope

Status:

- docs/smoke/package-pointer only
- browser/computer-use validation plan and report pointer
- user-facing comprehension validation
- read-only preview validation
- non-SSOT
- non-authoritative
- no UI implementation change
- no runtime behavior
- no API route implementation
- no graph DB
- no persistence
- no proof/evidence/readiness writes
- no Codex SDK execution
- no provider behavior
- no branch creation authority
- no PR creation authority
- no merge authority
- no publish authority
- no approval authority
- no retry authority
- no replay authority
- no deploy authority

This document validates whether the current Project Constellation read-only
Cockpit preview and Perspective Capsule / Handoff Capsule copyable handoff
preview communicate the intended user-facing model. It does not change the
preview, add controls, define runtime contracts, add API routes, create graph
storage, persist snapshots, write proof/evidence/readiness records, or grant
execution authority.

The validation target is the current sample-fixture-backed preview anchored in
the existing Cockpit Perspective surface. The validation may inspect the local
running app through browser/computer-use when available. If local runtime or
browser/computer-use is unavailable, the report must say so directly and keep
scenario results as planned or skipped rather than observed.

## 2. Purpose

The purpose is to test whether a user can understand the constellation model
without reading implementation code or assuming hidden authority.

The surface should make these concepts legible:

- current Project Constellation preview and sample fixture status
- cluster thesis
- nodes
- edges
- clusters
- evidence pointers
- unresolved tensions
- boundaries
- next action candidates
- Perspective Capsule / Handoff Capsule handoff preview
- copyable handoff discipline
- absence of automatic execution or write authority

This validation is about comprehension and authority clarity. It is not a
request to implement new behavior.

## 3. User-intent validation thesis

A Project Constellation preview succeeds at v0.1 user intent when a user can
answer, from the visible Cockpit preview and copyable handoff text, what the
constellation is showing, why the selected work is grouped, which claims are
only supported by evidence pointers, which tensions remain unresolved, which
next actions are only candidates, and which actions the surface does not take.

The intended user-facing thesis:

- the preview is a read-only symbolic map over existing context
- the sample fixture is explicit and not hidden runtime state
- nodes and edges communicate project meaning, not database writes
- clusters communicate local thesis, not source-of-truth project status
- evidence pointers point to existing material and do not create evidence
- unresolved tensions stay visible and separate from support
- boundaries qualify what may be inferred
- next action candidates are advisory and not execution commands
- the handoff capsule is bounded text for manual review and selection
- no preview control may execute Codex
- no preview control may create branches
- no preview control may open PRs
- no preview control may merge
- no preview control may publish
- no preview control may approve
- no preview control may retry
- no preview control may replay
- no preview control may deploy
- no preview control may record proof
- no preview control may record evidence
- no preview control may save snapshots
- no preview control may roll back state
- no preview control may persist graphs
- no preview control may create runtime nodes

## 4. Scenario matrix

| Scenario | User question | Expected result | Required status |
| --- | --- | --- | --- |
| Scenario 1: first-entry orientation | What am I looking at, and is it live? | User can identify the current Project Constellation preview, fixture path, sample fixture status, read-only/non-authoritative status, and source scope. | PASS/PARTIAL/FAIL/SKIPPED |
| Scenario 2: node and edge meaning | What are the parts of the constellation? | User can distinguish nodes, edges, clusters, the cluster thesis, evidence pointers, unresolved tensions, and next action candidates. | PASS/PARTIAL/FAIL/SKIPPED |
| Scenario 3: evidence pointer comprehension | Are evidence pointers proof records? | User can understand evidence pointers are pointer-only and do not create proof, evidence, or readiness records. | PASS/PARTIAL/FAIL/SKIPPED |
| Scenario 4: unresolved tension visibility | What remains unresolved? | User can see unresolved tensions separately from support, evidence pointers, and next action candidates. | PASS/PARTIAL/FAIL/SKIPPED |
| Scenario 5: boundary and next-action clarity | What can I safely do next? | User can understand boundaries and that next action candidates are advisory, not execution commands. | PASS/PARTIAL/FAIL/SKIPPED |
| Scenario 6: Perspective Capsule / Handoff Capsule comprehension | What is the capsule for? | User can inspect capsule material as a bounded handoff preview and can manually inspect/select copyable text. | PASS/PARTIAL/FAIL/SKIPPED |
| Scenario 7: authority-misread prevention | Could this preview execute or write? | User can see explicit no-action boundaries: no Codex execution, no branch creation, no PR creation, no merge authority, no publish authority, no approval authority, no retry authority, no replay authority, no deploy authority, no proof/evidence recording, no snapshot save, no rollback, no graph persistence, and no runtime node creation. | PASS/PARTIAL/FAIL/SKIPPED |
| Scenario 8: user question answerability | Can a user answer natural questions from the surface? | User can answer what the preview is, what the thesis is, what evidence points at, what remains unresolved, what is forbidden, and what candidate follow-up exists. | PASS/PARTIAL/FAIL/SKIPPED |

## 5. Scenario 1: first-entry orientation

Intent: a user entering the Cockpit Perspective surface should know that the
Project Constellation section is a preview over a sample fixture, not an
interactive graph runtime.

Expected visible signals:

- Project Constellation preview label
- fixture path:
  `fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json`
- sample status such as `sample_fixture_only`
- authority status such as `read_only_non_authoritative`
- formation mode or scope such as `work_unit_constellation`
- source scope title, currently Sidecar e_t Strategy C first slice
- node and edge counts

Pass condition: a user can identify the current preview and sample fixture
status without inferring live persistence or hidden runtime state.

Fail condition: the preview looks like a live graph editor, source-of-truth
project state, or action surface.

## 6. Scenario 2: node and edge meaning

Intent: a user should understand the constituent parts of the constellation
model.

Expected visible signals:

- nodes are visible as typed project objects or concepts
- edges are visible as typed relationships
- clusters are visible as named regions of meaning
- cluster thesis is visible
- evidence pointers are visible as pointers to existing material
- unresolved tensions are visibly separate
- next action candidates are visible as candidates

Pass condition: a user can distinguish nodes, edges, clusters, evidence
pointers, unresolved tensions, and next action candidates.

Fail condition: support, evidence, tension, and next action material collapse
into one indistinct list.

## 7. Scenario 3: evidence pointer comprehension

Intent: a user should understand that evidence pointers are references only.

Expected visible signals:

- evidence pointer labels or source references are visible
- pointer-only semantics are stated in the preview, handoff text, report, or
  nearby boundary copy
- proof/evidence/readiness write absence is visible or inferable from explicit
  authority copy

Evidence pointers must not be promoted into proof records, evidence records,
readiness records, QP evidence, `z_t` commits, claim confidence, or
publication readiness. They create no approval authority.

Pass condition: a user can state that evidence pointers point to existing
material and do not create proof/evidence/readiness records.

Fail condition: the surface implies that seeing an evidence pointer records
proof, records evidence, or makes the work ready.

## 8. Scenario 4: unresolved tension visibility

Intent: a user should see unresolved tensions as first-class review material,
not as support.

Expected visible signals:

- unresolved tension section or labels
- tension text separate from evidence pointer text
- tension text separate from next action candidate text
- tension language that preserves uncertainty, missing context, conflict, or
  boundary risk

Pass condition: a user can identify at least one unresolved tension and can
tell it is not evidence in favor of the thesis.

Fail condition: tensions are hidden, merged into support, or presented as
resolved.

## 9. Scenario 5: boundary and next-action clarity

Intent: a user should understand that boundaries constrain interpretation and
that next action candidates are advisory.

Expected visible signals:

- explicit boundary or forbidden action copy
- next action candidates shown as candidates, follow-ups, or advisory moves
- no wording that turns candidates into execution commands
- no action buttons or controls for execution
- no action buttons or controls for branch creation
- no action buttons or controls for PR creation
- no action buttons or controls for proof/evidence recording
- no action buttons or controls for approval
- no action buttons or controls for publish
- no action buttons or controls for merge
- no action buttons or controls for retry
- no action buttons or controls for replay
- no action buttons or controls for deploy
- no action buttons or controls for snapshot save
- no action buttons or controls for rollback
- no action buttons or controls for graph persistence
- no action buttons or controls for runtime node creation

Pass condition: a user can distinguish "candidate next action" from "command
that the preview will run."

Fail condition: next action candidates look like buttons, queued work, or
automatic agent routing.

## 10. Scenario 6: Perspective Capsule / Handoff Capsule comprehension

Intent: a user should understand the capsule as bounded handoff material, not
an automatic task launcher.

Expected visible signals:

- Perspective Capsule / Handoff Capsule label
- thesis
- selected nodes
- selected edges
- evidence pointers
- unresolved tensions
- boundaries or forbidden actions
- next action candidates
- target handoff form such as `codex_handoff`
- readonly selectable handoff text
- manual review language

Pass condition: a user can inspect the capsule and manually inspect/select the
copyable handoff text without automatic execution.

Fail condition: the capsule does not clearly prevent a user from inferring
Codex execution, provider calls, GitHub posting, work record creation, or
Augnes state mutation.

## 11. Scenario 7: authority-misread prevention

Intent: the preview should actively prevent a user from mistaking review
material for execution or write authority.

Expected visible signals:

- no live SDK call
- no provider implementation
- no runtime execution
- no action controls
- no graph DB
- no persistence
- no proof/evidence/readiness writes
- no AG Resume writer/helper/route behavior

The user should be able to see that the surface:

- does not execute Codex
- does not create branches
- does not open PRs
- does not merge
- does not publish
- does not approve
- does not retry
- does not replay
- does not deploy
- does not record proof
- does not record evidence
- does not save snapshots
- does not roll back state
- does not persist graphs
- does not create runtime nodes

Pass condition: a user can state what the preview does not do and no false
affordance contradicts that boundary.

Fail condition: visible controls, labels, or copy imply write authority,
execution authority, proof/evidence creation, persistence, or readiness.

## 12. Scenario 8: user question answerability

Intent: after inspection, a user should be able to answer natural questions
without needing implementation knowledge.

Required answerable questions:

- What is the current Project Constellation preview?
- What sample fixture is being shown?
- What is the cluster thesis?
- Which items are nodes?
- Which relationships are edges?
- Which items are evidence pointers?
- Which items are unresolved tensions?
- Which items are next action candidates?
- What boundaries apply?
- What does the Perspective Capsule / Handoff Capsule contain?
- Can I manually inspect/select the handoff text?
- What actions does the surface not take?

Pass condition: most questions can be answered from visible text and local
navigation.

Partial condition: the concepts are present but require too much inference or
are split across hard-to-find regions.

Fail condition: a user cannot distinguish the model vocabulary or authority
boundaries from the UI.

## 13. Browser/computer-use validation method

Preferred method when local runtime and browser/computer-use are available:

```text
npm run db:reset
npm run db:migrate
npm run demo:seed
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000
open http://localhost:3000
inspect Cockpit > Perspective > Project Constellation preview
inspect the Perspective Capsule / Handoff Capsule copyable handoff preview
```

The inspection should use local browser/computer-use only. It should not call
external services, should not write proof/evidence/readiness records, should
not create branches, should not open PRs, should not merge, should not publish,
should not approve, should not retry, should not replay, should not deploy,
should not persist graphs, and should not create runtime nodes.

If the local app cannot run, the report must include the exact local runtime
skipped reason. If browser/computer-use cannot run, the report must include
the exact browser/computer-use skipped reason. Skipped runs must not fabricate
observations.

## 14. Pass/fail rubric

Use these statuses per scenario:

- PASS: visible UI/copy directly supports the expected user interpretation and
  no conflicting false affordance is observed
- PARTIAL: the expected material exists, but comprehension depends on
  inference, scrolling, cross-section comparison, or unclear copy
- FAIL: the expected material is missing, misleading, or contradicted by a
  false affordance
- SKIPPED: local runtime or browser/computer-use was unavailable, with a
  concrete skipped reason

Overall validation should pass only if Scenario 7 passes and no observed
control or copy grants execution, write, proof/evidence, persistence, PR
creation authority, no merge authority, no publish authority, no approval
authority, no retry authority, no replay authority, and no deploy authority.

## 15. Required report fields

The browser/computer-use report must include:

- inspected URL or skipped reason
- local runtime setup used or skipped reason
- browser/computer-use availability
- scenario results
- pass/fail/partial status per scenario
- screenshots or visual references only if already allowed and produced by the
  local browser workflow
- observed UX gaps
- authority clarity findings
- user-facing comprehension findings
- false-affordance findings
- recommended next UI/API/doc action
- skipped checks with concrete reasons

The report must also state whether proof-only closeout was skipped because no
runtime/work ID context exists and this PR must not record proof/evidence
writes.

## 16. Validation and smoke plan

Required checks for this docs/report/smoke/package-pointer PR:

```text
npm run typecheck
npm run smoke:project-constellation-user-intent-validation
AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-user-intent-validation
npm run smoke:project-constellation-ia-boundaries
npm run smoke:project-constellation-cockpit-preview
npm run smoke:perspective-capsule-copyable-handoff-preview
npm run smoke:perspective-capsule-contract
git diff --check
git diff --cached --check
```

The focused smoke checks the validation doc, browser report, required
sections, required scenario names, report fields, index pointer, package
script, scoped changed-file boundary, and forbidden positive authority grants.

`AUGNES_BOUNDARY_SMOKE_MODE=content-only` remains a cross-PR content diagnostic
for the same document/report assertions. It does not grant runtime, UI, API,
schema, DB, MCP/App tool, persistence, proof/evidence, AG Resume, Codex SDK, or
execution authority.

## 17. Non-goals

This validation does not implement or authorize:

- UI behavior
- runtime behavior
- API routes
- route handlers
- graph DB
- persistence
- DB schema or migrations
- auth implementation
- MCP/App tool implementation
- ChatGPT App component files
- plugin hooks, config, mappings, or runtime actions
- proof/evidence/readiness writes
- AG Resume behavior
- Sidecar runtime behavior
- Codex SDK execution, provider, or runtime behavior
- Project Constellation runtime behavior
- external calls beyond local browser/computer-use inspection of the running
  app when available
- branch creation authority by itself
- PR creation authority by itself
- no merge authority
- no publish authority
- no approval authority
- no retry authority
- no replay authority
- no deploy authority
