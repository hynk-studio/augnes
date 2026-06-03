# Project Constellation IA v0.1

## 1. Status and Scope

Status:

- docs-only IA/design document
- non-SSOT
- read-only Perspective interaction model
- non-authoritative
- evidence-pointer-based, not evidence-producing
- perspective-assistive, not action-granting
- agent-handoff-preview-oriented, not agent-executing
- no runtime, UI, schema, route, storage, or graph-engine implementation

Project Constellation v0.1 defines a symbolic Perspective model for arranging
scattered Augnes project context as nodes, typed edges, clusters, tensions,
evidence pointers, validation results, and next-move candidates.

The design is meant to help a user and Augnes form actionable perspectives over
existing project material, then compile selected perspectives into
agent-ready handoff packets for Codex, ChatGPT Apps/MCP review surfaces,
documentation/research agents, or future AI work units.

This PR does not implement persistence, graph storage, graph layout, API
request routing, Cockpit UI controls, save/rollback buttons, automatic agent
routing, external calls, proof/evidence/readiness writes, or any new authority
path. All snapshot, rollback, diff, fork, compare, and capsule semantics in
this document are design semantics only.

Authority boundary:

- Project Constellation may read and point at existing context.
- Project Constellation may not become source of truth.
- Project Constellation may not create evidence or proof.
- Project Constellation may not approve, publish, retry, replay, merge,
  commit/reject, mutate state, mutate external systems, route agents, or
  continue Codex work.
- Project Constellation may not depend on AG Resume proof/evidence recording
  behavior.

## 2. Product Goal

Project Constellation should make Augnes project context inspectable as a
practical symbolic map rather than a linear pile of documents, PRs, traces, and
decisions.

The product goal is not a decorative space UI. The goal is a usable
node/edge/cluster Perspective surface that helps users answer:

- what is currently connected
- what evidence supports or weakens a frame
- what tensions remain unresolved
- what work units depend on one another
- what can safely become a handoff packet
- what must stay blocked because it would create authority, execution, or
  evidence-production risk

The map should support both fast user-facing review and disciplined handoff
compilation. A selected Perspective should be able to become a bounded capsule
with thesis, evidence pointers, constraints, forbidden actions, and next actions
for a target agent.

## 3. User-Facing Metaphor

The user-facing metaphor is a constellation, but the implementation expectation
is a practical symbolic graph:

- nodes are project objects, concepts, decisions, constraints, evidence
  pointers, validation results, tensions, and next moves
- edges are typed relationships such as supports, depends_on, derived_from,
  refines, validates, conflicts_with, warns_against, and next_candidate
- clusters are local regions of meaning, not visual decoration
- gravity means user or Augnes weighting that pulls important nodes, edges, or
  clusters into the foreground
- rays show evidence pointers from a node or edge to existing proof, trace,
  document, PR, or smoke output
- tension lines keep disagreements and limits visible
- beacons mark safe next-move candidates

The metaphor should help the user orient. It must not hide authority boundaries
behind immersive visual language.

## 4. Existing Repo Anchors

Project Constellation v0.1 is anchored to existing repo-local documents and
runtime boundaries:

- `docs/PERSPECTIVE_SNAPSHOT_V0_1.md`: `PerspectiveSnapshot` v0.1 is a
  derived-view-only read model. It is not source of truth and does not mutate
  Core records.
- `docs/COCKPIT_PERSPECTIVE_IA_V0_1.md`: Cockpit Perspective is the natural
  home for interpretive frame, basis, evidence, tensions, and safe next-step
  inspection. It does not contain write or execution controls.
- `docs/CODEX_HANDOFF_V0_1.md`: Codex handoff is a docs-only task shape for
  scoping, testing, reporting, and PR review. It does not grant merge,
  execution, or runtime authority.
- `docs/SIDECAR_ET_TRACE_PACK_STRATEGY_C_FIRST_SLICE_CLOSEOUT_V0_1.md`:
  Strategy C first slice is stopped at two fixture files, one manifest, and
  local fixture/manifest smokes. It does not authorize report, compare, suite,
  matrix, runtime Sidecar e_t computation, schema/API/Cockpit changes,
  proof/evidence/readiness writes, QP evidence, `z_t` commits, CI enforcement,
  or AG Resume behavior.
- `docs/00_INDEX_LATEST.md`: repo-local index pointer. This Project
  Constellation document is a pointer, not an Active-set expansion or SSOT.

These anchors define the main safety rule: Project Constellation is an
interpretive layer over existing material. It does not own the material.

## 5. Core Objects

Project Constellation v0.1 uses the following conceptual objects:

- `Constellation`: a symbolic graph formed from existing project context,
  user-provided scope, manual edits, or a hybrid of Augnes draft formation and
  user refinement.
- `ConstellationNode`: a typed symbolic object such as a project, work unit,
  PR, document, concept, decision, tension, evidence pointer, validation
  result, constraint, or next move.
- `ConstellationEdge`: a typed relationship between nodes with optional
  weight, evidence pointers, tension markers, and boundary notes.
- `ConstellationCluster`: a named grouping of nodes and edges that represents a
  local work region, decision frame, concept family, or open tension set.
- `PerspectiveScope`: the selected portion of the constellation being viewed,
  compared, locked, or compiled.
- `PerspectiveRequest`: a normalized conceptual request for a perspective,
  regardless of whether it originates in Cockpit, ChatGPT Apps/MCP, Codex,
  GitHub review, or a future agent surface.
- `PerspectiveSnapshot`: a read-only conceptual lock of selected nodes, edges,
  positions, weights, user overrides, evidence pointers, tensions, next moves,
  and capsule references.
- `PerspectiveCapsule`: a bounded handoff-ready packet compiled from a
  snapshot or selected scope.
- `AgentHandoffAdapter`: a target-specific formatting adapter that turns a
  capsule into a review or work packet without granting execution authority.

These objects are design vocabulary only in v0.1. They are not schema, storage,
API, runtime, or graph-engine contracts.

## 6. Node Types

Initial node types:

| node type | Meaning | Boundary |
| --- | --- | --- |
| project | A repo, product initiative, research direction, or broad program. | Not source of truth for project state. |
| work_unit | A PR, work item, milestone, session, episode, task, or delivery unit. | Does not imply execution or completion authority. |
| pull_request | A GitHub PR or PR-like review object. | Does not mutate GitHub or merge. |
| document | A docs file, design note, runbook, report, or index pointer. | Does not expand SSOT unless the referenced doc already has authority. |
| concept | A reusable idea, vocabulary item, product model, or research frame. | Does not create schema or runtime behavior. |
| decision | A stop/go, closeout, approval, deferral, or boundary choice. | Informational unless authority is held elsewhere. |
| tension | An unresolved conflict, risk, uncertainty, counterexample, or weak spot. | Must remain visible and not be collapsed into support. |
| evidence_pointer | A pointer to existing evidence, proof, trace, smoke output, PR, doc, or log. | Pointer only; does not produce evidence. |
| validation_result | A recorded command result, smoke status, review outcome, or check summary. | Does not create readiness authority by itself. |
| constraint | A boundary, forbidden path, isolation rule, non-goal, or required guard. | Blocks interpretation from becoming action. |
| next_move | A candidate next action or follow-up. | Candidate only; does not route or execute. |
| capsule | A compiled Perspective Capsule or capsule reference. | Handoff preview only. |

Future node types may be added only as docs/design vocabulary unless a separate
approved implementation PR defines runtime or schema behavior.

## 7. Edge Types

Initial edge types:

| edge type | Directional meaning | Boundary |
| --- | --- | --- |
| supports | Source gives support to target. | Support is interpretive, not proof creation. |
| evidence_for | Source points to existing evidence for target. | Pointer only. |
| evidence_against | Source points to existing evidence against target. | Pointer only. |
| derived_from | Source was formed from target or target was formed from source, depending on edge direction. | Must keep source refs explicit. |
| depends_on | Source requires target or target context. | Does not execute dependency work. |
| refines | Source narrows, clarifies, or hardens target. | Does not commit a new policy by itself. |
| validates | Source check or result validates target within a stated scope. | Does not create publication readiness. |
| conflicts_with | Source and target are in tension. | Must preserve conflict rather than erase it. |
| warns_against | Source warns against target, route, or interpretation. | Must remain a visible boundary. |
| blocks | Source blocks target until condition changes. | Does not enforce runtime policy by itself. |
| next_candidate | Source suggests target as a possible next move. | Does not route or execute agents. |
| supersedes | Source replaces target as a newer interpretation or decision. | Does not delete historical context. |
| belongs_to | Source belongs to target cluster, work unit, or project. | Grouping only. |
| adjacent_to | Source is related to target without stronger claim. | Weak relation only. |

Edges may carry conceptual weights, notes, evidence pointers, tension markers,
and boundary labels. In v0.1 those are design semantics only.

## 8. Formation Modes

Project Constellation should support these formation modes conceptually:

| formation mode | Description | Expected use |
| --- | --- | --- |
| Global Auto Constellation | Augnes forms a constellation from the whole project context. | Broad orientation across repo state, recent work, open tensions, evidence pointers, and next-move candidates. |
| Keyword Constellation | A user-provided keyword creates a scoped constellation. | Focused exploration around terms such as `Sidecar e_t`, `Codex handoff`, `PerspectiveSnapshot`, or `AG Resume isolation`. |
| Work-Unit Constellation | A PR, work item, session, milestone, or episode creates a scoped constellation. | Review a bounded unit and its basis, constraints, validation, and next moves. |
| Manual Constellation | The user manually creates nodes, edges, clusters, weights, and visible tensions. | Capture an intentional frame, planning map, or review map. |
| Hybrid Constellation | Augnes auto-forms a draft and the user refines it through Manual Gravity. | Fast start plus user correction, pinning, pruning, and weighting. |

Formation mode is metadata on a snapshot or capsule. It does not grant authority
to the resulting graph.

Perspective scopes:

- node
- edge
- cluster
- full constellation
- temporal slice
- whole perspective

`whole perspective` means the currently selected broad interpretive frame over
the active global constellation and recent context. It is not a request for
hidden reasoning or source-of-truth state.

## 9. Whole Perspective Call

Users must be able to request the current whole perspective from:

- Augnes Core
- ChatGPT Apps/MCP
- Codex/Codex CLI
- GitHub PR review flows
- future AI agent surfaces

Each request should normalize into a common conceptual `PerspectiveRequest`:

```text
PerspectiveRequest {
  requested_scope: whole_perspective
  requester_surface: cockpit | chatgpt_mcp | codex | github_review | agent
  formation_mode: global_auto | keyword | work_unit | manual | hybrid
  seed_refs: optional existing project refs
  user_query: optional natural language request
  user_overrides: optional selected pins, weights, exclusions, or clusters
  output_intent: inspect | compare | capsule_preview | handoff_preview
}
```

The whole perspective should be materialized from the current global
constellation state plus recent episodes, user overrides, active tensions, and
next-move candidates.

In v0.1 this is conceptual only. This PR does not implement runtime request
routing, route handlers, MCP tools, Codex CLI behavior, GitHub integration,
agent calls, persistence, graph computation, or UI controls.

## 10. Natural Language Request Surfaces

Natural-language requests should be allowed to ask for a perspective without
requiring the user to specify graph internals.

Expected request surfaces:

- Augnes Cockpit
- ChatGPT Apps / MCP bridge
- Codex / Codex CLI
- GitHub PR review flow
- future AI agent surfaces

Example conceptual requests:

- "Show the whole perspective for the current Augnes work."
- "Create a constellation around Sidecar e_t Strategy C."
- "What tensions block runtime Sidecar e_t work?"
- "Compile a Codex handoff capsule for the next docs-only follow-up."
- "Compare this PR against the current Perspective boundaries."

All surfaces should normalize to `PerspectiveRequest`. The request should be
read-only unless a future separately approved implementation defines a bounded
write path. No such write path is introduced here.

## 11. Manual Gravity

Manual Gravity is user-directed weighting and arrangement.

The user should be able to conceptually:

- pin a node, edge, or cluster as central
- pull a node closer to a cluster
- lower the weight of a weak or noisy edge
- mark an edge as tentative
- keep a tension line visible even when a summary would prefer support
- exclude a node from a capsule while keeping it in the full constellation
- promote a next-move candidate into capsule preview
- add a user override explaining why a relation matters

Manual Gravity is not authority. It records user emphasis and correction for a
Perspective view. It does not mutate Augnes Core state, create evidence, alter
proof status, approve work, or execute agents.

## 12. Perspective Lock / Snapshot

A Perspective Lock freezes a selected view as a conceptual
`PerspectiveSnapshot`. It is a read-only design object in this PR.

Required snapshot semantics:

- `snapshot_id`
- `parent_snapshot_id`
- `created_at`
- `created_by`: `user | augnes | agent`
- `formation_mode`
- selected nodes
- selected edges
- node positions
- edge weights
- user overrides
- evidence pointers
- tensions
- next move candidates
- capsule refs
- conceptual rollback, diff, fork, and compare semantics

The snapshot should preserve:

- what was selected
- how it was arranged
- which evidence pointers were visible
- which tensions remained unresolved
- which next moves were candidates
- which boundaries or forbidden actions constrained the frame
- which capsules were compiled from it

This does not implement snapshot persistence, storage, database schema,
migrations, save buttons, rollback buttons, graph layout, or route behavior.

## 13. Rollback / Diff / Fork Semantics

Rollback, diff, fork, and compare are conceptual review semantics:

- rollback: inspect a prior perspective state and optionally use it as a human
  reference point
- diff: compare nodes, edges, weights, tensions, evidence pointers, and next
  moves between two snapshots
- fork: create a new perspective branch from a parent snapshot for exploration
- compare: place two snapshots or capsules side by side for review

These operations must remain read-only unless a future separately approved PR
implements persistence and user-approved mutation behavior. In v0.1 they do not
create durable records, update Core state, execute agents, mutate Cockpit,
change routes, or write proof/evidence/readiness data.

## 14. Perspective Capsule

A Perspective Capsule is a handoff-ready, bounded summary compiled from a
snapshot or selected scope.

Detailed Perspective Capsule / Handoff Capsule contract semantics are factored
into `docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md`. That contract is docs-only,
non-SSOT, contract/design-only, read-only, non-authoritative,
evidence-pointer-based, and handoff-preview-oriented. Project Constellation
v0.1 remains read-only, non-authoritative, evidence-pointer-based, and
handoff-preview-oriented.

Required capsule fields:

- `capsule_id`
- `source_snapshot_id`
- `scope`
- `thesis`
- relevant nodes
- relevant edges
- evidence pointers
- unresolved tensions
- boundaries
- forbidden actions
- next actions
- target agent
- handoff prompt

A capsule should make the selected perspective portable without flattening
authority boundaries. It should tell the target agent what to inspect, what not
to do, what evidence pointers matter, what remains unresolved, and which next
actions are candidates.

A capsule is a handoff preview. It does not launch the target agent, grant
execution authority, mutate project state, create evidence, or guarantee that a
target agent will accept the task.

## 15. Agent Handoff Adapters

Agent Handoff Adapters format a Perspective Capsule for a target surface while
preserving the same authority boundaries.

Initial adapters:

| adapter | Output expectation | Boundary |
| --- | --- | --- |
| Codex handoff | A repo, branch, scope, changed-file boundary, constraints, validation, and PR body packet. | Does not grant Codex continuation, execution, merge, or external-call authority. |
| ChatGPT review handoff | A review packet with thesis, evidence pointers, tensions, boundaries, and questions. | Does not mutate GitHub, approve, publish, or record proof. |
| documentation handoff | A docs/research writing packet with anchors, required sections, non-goals, and validation expectations. | Does not create SSOT unless separately approved. |
| research handoff | A bounded research prompt with sources, assumptions, open questions, and forbidden claims. | Does not produce runtime diagnostics or evidence records. |
| future agent handoff | A provider-neutral packet for later AI work-unit surfaces. | Must remain preview-oriented until separately approved. |

Adapters should produce explicit forbidden actions and boundary summaries. They
should not hide non-goals in prose.

## 16. Initial Use Case: Sidecar e_t Strategy C First Slice

The first sample constellation should use Sidecar e_t Strategy C first slice as
the initial Project Constellation use case.

Context:

- The first slice consists only of two synthetic fixtures, one manifest, and
  local fixture/manifest smokes.
- Strategy C should stop and observe after the closeout.
- The work does not authorize report, compare, suite, matrix, runtime Sidecar
  e_t computation, helper import, schema/API/Cockpit action changes,
  proof/evidence/readiness writes, QP evidence, `z_t` commits, CI enforcement,
  or AG Resume behavior.

Initial nodes:

- lab evidence baseline
- grounded/quiet probe
- first fixture subset
- manifest routing
- manifest hardening
- closeout decision
- AG Resume isolation constraint
- Project Constellation IA next direction

Initial edges:

| source | target | allowed edge type |
| --- | --- | --- |
| grounded/quiet probe | first fixture subset | derived_from or supports |
| first fixture subset | manifest routing | depends_on or refines |
| manifest routing | manifest hardening | validates or refines |
| manifest hardening | closeout decision | supports |
| AG Resume isolation constraint | Project Constellation IA | warns_against |
| closeout decision | Project Constellation IA | next_candidate |

The first fixture-backed sample for this use case is
`fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json`. It is
public-safe, `sample_fixture_only`, read-only, non-authoritative, and not graph
runtime behavior. `npm run smoke:project-constellation-sample-fixture` validates
the fixture shape, capsule preview, Codex execution authority preview, package
script pointer, and docs/index pointers with deterministic static reads only.

Example capsule thesis:

```text
Strategy C is safely stopped at the first fixture/manifest slice. Project
Constellation can use it as a sample symbolic map because the work is
docs-and-fixture bounded, has explicit forbidden paths, and needs a clearer
Perspective handoff model before any future implementation slice.
```

The capsule should preserve unresolved tensions:

- whether future Strategy C work should remain docs-only or add more fixture
  descriptors
- how to keep trace-pack review useful without implying runtime computation
- how to show AG Resume isolation as a visible constraint rather than a buried
  non-goal
- when a future UI should expose Evidence Rays, Tension Lines, and Next Move
  Beacon without creating action controls

## 17. ChatGPT Apps / MCP Surface Expectations

ChatGPT Apps and MCP surfaces should eventually be able to request, inspect,
and render Perspective Constellation material as read-only context.

Expected behavior:

- accept natural-language perspective requests
- normalize them into a common `PerspectiveRequest`
- return a read-only constellation, selected scope, snapshot preview, or capsule
  preview
- expose evidence pointers, unresolved tensions, boundaries, and forbidden
  actions plainly
- support review and handoff preparation without executing the handoff

Out of scope for this PR:

- new MCP tools
- Apps SDK resource changes
- bridge route changes
- external calls
- automatic agent routing
- write-capable tools
- proof/evidence/readiness writes
- hosted transfer, relay, or direct resume authority

## 18. Codex Handoff Expectations

Codex handoff should receive a capsule-shaped packet that is practical for a
repo task:

- repo and base branch
- working branch
- expected PR title
- task goal
- existing anchors
- files expected to change
- files forbidden to change
- hard constraints
- required checks
- browser/computer-use expectation
- PR body requirements
- final report requirements

The packet should also include:

- selected nodes and edges
- evidence pointers
- unresolved tensions
- boundary notes
- forbidden actions
- next action candidates

Codex remains an execution surface only when the user explicitly asks it to
perform work. The capsule itself does not grant continuation, merge, publish,
hosted transfer, direct resume, relay, external-call, or runtime authority.

## 19. UI/UX Constraints

Future UI should follow these constraints:

- symbolic node map, not decorative space UI
- practical node/edge/cluster map
- usable as a Perspective surface
- live naturally under Cockpit Perspective
- support Auto Constellation
- support Manual Gravity
- support Evidence Rays
- support Tension Lines
- support Next Move Beacon
- support Perspective Capsule preview
- keep authority boundaries visible
- keep evidence pointers inspectable
- keep unresolved tensions visible
- keep next moves clearly marked as candidates
- avoid write, execute, publish, retry, replay, merge, save/rollback, and
  automatic route controls in this PR

Project Constellation should feel like a workbench for forming and handing off
perspectives. It should not feel like a decorative star field, game map,
marketing hero, or autonomous control room.

## 20. Future Cockpit Panel Sketch

A future Cockpit Perspective panel could be arranged as:

```text
Perspective
  Frame
  Ledger Basis
  Evidence
  Tensions
  Boundary / Next
  Constellation
    Formation mode selector
    Scope selector
    Node/edge/cluster map
    Evidence Rays
    Tension Lines
    Next Move Beacon
    Manual Gravity controls
    Snapshot preview
    Perspective Capsule preview
```

Conceptual interactions:

- request whole perspective
- form from keyword
- form from work unit
- pin or unpin node
- adjust edge weight
- mark tension as visible
- preview capsule
- copy handoff prompt
- compare two conceptual snapshots

Not included:

- save snapshot button
- rollback button
- graph DB
- runtime graph engine
- write route
- Cockpit action mutation
- automatic agent launch
- external service call

This panel sketch is not implementation approval.

First read-only Cockpit preview:

- `components/augnes-cockpit.tsx` renders a Project Constellation read-only
  Cockpit preview inside the existing Perspective surface.
- The preview is anchored to
  `fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json`.
- It displays the static `sample_fixture_only`,
  `read_only_non_authoritative`, `work_unit_constellation` sample shape for
  Sidecar e_t Strategy C first slice review.
- It may show nodes, edges, evidence pointers, unresolved tensions, next
  action candidates, the Perspective Capsule preview, Codex handoff packet
  summary, and Codex execution authority preview fields.
- It must remain inspection-only: no action controls, no graph layout engine,
  no graph DB, no persistence, no proof/evidence/readiness writes, no AG
  Resume writer/helper/route behavior, no live SDK call, no provider
  implementation, and no runtime execution.

## 21. Validation and Smoke Plan

Validation for this docs/smoke/package-pointer PR should include:

```text
npm run typecheck
npm run build
npm run smoke:perspective-quality
npm run smoke:research-diagnostics-boundaries
npm run smoke:sidecar-et-runtime-boundaries
npm run smoke:cockpit-perspective-snapshot
npm run smoke:project-constellation-ia-boundaries
npm run smoke:project-constellation-sample-fixture
npm run smoke:project-constellation-cockpit-preview
git diff --check
git diff --cached --check
```

`npm run smoke:project-constellation-ia-boundaries` is a focused static
document/IA boundary guard. It checks required sections, concepts, boundary
phrases, non-goals, and index pointers for this document. It does not implement
Project Constellation runtime behavior, UI behavior, route/API behavior,
storage, persistence, graph computation, agent routing, evidence production, or
proof/evidence/readiness writes.

By default the smoke runs in scoped changed-file mode and enforces its allowed
changed-file boundary for direct Project Constellation IA edits. For cross-PR
content-only diagnostics, use:

```text
AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-ia-boundaries
```

Content-only mode is an explicit cross-PR regression diagnostic. It does not
replace scoped changed-file validation for direct edits and does not grant
runtime, UI, API, schema, MCP/App tool, persistence, proof/evidence, or agent
execution authority.

Browser/computer-use may be skipped for this docs/smoke/package-pointer PR
because the only `package.json` change is a static documentation-boundary smoke
script pointer. This PR does not touch UI, runtime, API, schema, fixture,
manifest JSON, Cockpit action behavior, AG Resume behavior, ChatGPT Apps/MCP
tools, or browser-facing files.

For the first sample fixture follow-up, browser/computer-use may still be
skipped because the work is fixture/smoke/docs/package-pointer only and does
not touch UI, runtime, API, schema, MCP/App tools, routes, browser-facing
files, external calls, or interactive behavior.

For the first Project Constellation read-only Cockpit preview follow-up,
browser/computer-use is required because the work touches the Cockpit
Perspective UI. The browser report should confirm the Perspective surface
loads, the fixture/source, nodes, edges, cluster, evidence pointers,
unresolved tensions, next action candidates, Perspective Capsule preview, and
Codex execution authority preview are visible, and no Project Constellation
action controls are present.

If future Project Constellation work touches UI or browser-facing files, it
must add browser/computer-use validation. If it touches runtime, APIs, schema,
storage, routes, fixtures, Cockpit action behavior, AG Resume, ChatGPT
Apps/MCP tools, agent routing, or package scripts that go beyond bounded
documentation-boundary/sample-fixture/read-only-Cockpit-preview smoke pointers
or imply implementation/runtime behavior, it needs a separate approved scope
and a stronger validation plan.

## 22. Non-Goals

Project Constellation v0.1 does not implement or authorize:

- runtime code
- UI components beyond the read-only Cockpit preview
- graph engine
- graph database
- API routes
- DB schema or migrations
- package scripts beyond bounded documentation, sample-fixture, or
  read-only-Cockpit-preview smoke pointers
- runtime/generated fixtures
- unbounded smokes or CI enforcement
- Cockpit action behavior
- Codex execution behavior
- ChatGPT Apps/MCP tool changes
- persistence
- save/rollback buttons
- automatic agent routing
- external calls
- report/compare/suite/matrix behavior
- runtime Sidecar e_t computation
- helper import
- proof/evidence/readiness writes
- QP evidence
- `z_t` commit
- CI enforcement
- approval/publish/retry/replay/merge authority
- Codex continuation authority
- hosted transfer, relay, or direct resume authority

Project Constellation v0.1 is a vocabulary and IA design for read-only
Perspective formation and handoff preview. Any implementation path must be a
separate PR with explicit scope, changed-file boundaries, validation, and
authority review.
