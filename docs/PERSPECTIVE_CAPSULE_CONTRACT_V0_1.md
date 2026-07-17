# Perspective Capsule Contract v0.1

> Historical design record. The native-host manual capsule/copy workflow and
> its instruction-only consumption skill were retired in R5. This document is
> retained only to interpret historical planning and compatibility fields; its
> commands and workflow are not current operator instructions.

## 1. Status and Scope

This document is docs-only, non-SSOT, contract/design-only, read-only,
non-authoritative, evidence-pointer-based, not evidence-producing, and
handoff-preview-oriented, not agent-executing.

This contract adds no runtime schema, no API route, no MCP/App tool changes,
no plugin runtime action, no graph DB, no persistence, no proof/evidence write,
and no Codex task launch.

`AGENTS.md` remains the root Codex operating contract. This document does not
override `AUTHORITY_MATRIX.md`, Augnes Core gates, Project Constellation
boundaries, or the Augnes Operator plugin authority limits.

## 2. Purpose

Perspective Capsule / Handoff Capsule is the shared semantic object that lets
Augnes carry a selected perspective from user-facing surfaces into repo-facing
work guidance without granting execution or write authority.

It lets a ChatGPT App/MCP-facing Perspective surface, Cockpit Perspective
review surface, Codex Plugin/Skills workflow surface, or future
documentation/research/review agent surface point to the same bounded frame:
what is selected, why it matters, what evidence pointers are relevant, which
tensions remain unresolved, which boundaries apply, and which next actions are
candidates.

The capsule is a review and handoff unit. It is not runtime schema authority,
not a database object, not an API payload contract, not an MCP/App tool schema,
not a proof/evidence record, and not approval.

## 3. Existing Repo Anchors

Repo-local anchors:

- `docs/PROJECT_CONSTELLATION_IA_V0_1.md`: defines Project Constellation v0.1
  as read-only, non-authoritative, evidence-pointer-based, and
  handoff-preview-oriented.
- `docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md`: aligns the local Augnes
  Operator Codex plugin with adjacent ChatGPT Apps and Codex Plugin surfaces.
- `plugins/augnes-operator/skills/augnes-codex-surface-ops/SKILL.md`: gives
  instruction-only guidance for Queue, Steer, `/side`, Remote/SSH, Sites,
  diff/review, skipped reasons, and final reports.
- `docs/AUTHORITY_MATRIX.md`: defines actor and authority boundaries.
- `AGENTS.md`: remains the root Codex operating contract.

These anchors do not make this document SSOT. They provide boundary context for
the capsule vocabulary.

## 4. Surface Model

### ChatGPT App/MCP Surface

The ChatGPT App/MCP surface is user-facing perspective review and decision
support. It may conceptually show Project Constellation, evidence, tensions,
boundaries, and next-action review. It does not execute the handoff, write
proof/evidence/readiness, publish, approve, retry, replay, merge, or mutate
external systems.

### Cockpit Perspective Surface

The Cockpit Perspective surface is local read-only inspection of frame, basis,
evidence, tensions, boundary, and next candidates. It may preview selected
perspective material. It does not create runtime Project Constellation behavior,
graph DB state, persistence, action controls, or proof/evidence writes.

### Codex Plugin/Skills Surface

The Codex Plugin/Skills surface is repo-facing workflow guidance. It can help
shape task scoping, verification, skipped reasons, PR body fields, final report
fields, and authority audit language. It does not add plugin runtime action,
GitHub/OpenAI/Augnes runtime calls, network calls, MCP/App writes, Sites
deployment authority, proof/evidence writes, or merge/publish authority.

### Future Agent Surface

A future agent surface is provider-neutral handoff preview only. It may receive
a bounded Handoff Capsule for review or planning, but it does not receive
execution, continuation, approval, write, or external-posting authority from
this contract.

## 5. Capsule Vocabulary

Both names are useful:

- Perspective Capsule: the user/perspective-facing semantic object.
- Handoff Capsule: the target-surface rendering of the Perspective Capsule for
  a concrete work or review surface.

The terms can be used together as Perspective Capsule / Handoff Capsule when
the same bounded perspective is being carried across surfaces.

This vocabulary is conceptual. It does not define TypeScript fields, runtime
schema, API contract, DB schema, MCP/App tool schema, persistence status, or
agent routing behavior.

## 6. Required Fields

The following are required conceptual fields, not TypeScript/schema fields:

- `capsule_id`
- `capsule_version`
- `source_surface`
- `source_scope`
- `source_snapshot_ref`
- `source_constellation_ref`
- `formation_mode`
- `thesis`
- `selected_nodes`
- `selected_edges`
- `evidence_pointers`
- `unresolved_tensions`
- `boundaries`
- `forbidden_actions`
- `next_action_candidates`
- `target_surface`
- `chatgpt_rendering_notes`
- `codex_handoff_packet`
- `required_checks`
- `skipped_check_policy`
- `browser_computer_use_expectation`
- `proof_only_closeout_status_or_skip`
- `final_report_requirements`
- `user_pm_judgment_questions`
- `assumptions`
- `blockers_or_risks`

Required means a complete handoff should account for each concept. It does not
mean Augnes stores, validates, serializes, or routes these concepts at runtime.

## 7. Source Surfaces

Allowed conceptual source surfaces:

- `project_constellation`
- `whole_perspective`
- `cockpit_perspective`
- `chatgpt_app`
- `mcp_bridge`
- `codex_plugin`
- `manual_user_selection`
- `future_agent_surface`

A source surface identifies where the selected perspective came from. It does
not grant that source write authority.

## 8. Target Surfaces

Allowed conceptual target surfaces:

- `chatgpt_review`
- `codex_handoff`
- `documentation_handoff`
- `research_handoff`
- `cockpit_preview`
- `future_agent_handoff`

A target surface identifies how the perspective is rendered for review or
handoff. It does not execute, approve, publish, merge, or persist the handoff.

## 9. ChatGPT Rendering Notes

ChatGPT rendering notes should help a user inspect the capsule without turning
it into an action surface. Useful rendering notes include:

- visible thesis
- selected nodes and selected edges
- evidence pointers with source labels
- unresolved tensions kept separate from support
- boundaries and forbidden actions near the next-action candidates
- questions requiring user/PM judgment
- skipped-check policy

ChatGPT rendering notes must not hide non-goals, imply approval, post to
GitHub, call tools, record proof, record evidence, or grant merge authority.

## 10. Codex Handoff Packet

The conceptual `codex_handoff_packet` should include:

- repo
- base branch
- working branch suggestion
- expected PR title
- task goal
- context anchors
- expected changed files
- forbidden changed files
- hard constraints
- required checks
- skipped check policy
- browser/computer-use expectation
- PR body requirements
- final report requirements
- blockers/risks
- assumptions
- questions requiring user/PM judgment
- next suggested goal

The packet guides repo work. It does not launch Codex, continue a Codex thread,
approve a plan, merge a PR, post externally, or record proof/evidence.

## 11. Evidence Pointers

Evidence pointers are pointers only. They do not create proof, evidence,
readiness, or approval.

An evidence pointer may reference a doc, command result, source file, PR,
review comment, runtime read result, screenshot reference, or external note
when separately allowed. It must preserve whether the pointer was verified,
skipped, stale, partial, or unresolved.

Evidence pointers must not be promoted into proof/evidence/readiness writes,
QP evidence, `z_t` commits, Gate/SRF inputs, Claim confidence, publication
readiness, proposal scoring, or commit/reject input.

## 12. Unresolved Tensions

Unresolved tensions must remain visible and must not be collapsed into support.
They can block or qualify a next action candidate.

A tension may describe conflicting evidence pointers, missing context, unclear
scope, authority uncertainty, runtime temptation, UI ambiguity, or an
implementation/readiness gap.

The capsule should keep tensions separate from thesis and evidence so a target
surface can review what still needs user/PM judgment.

## 13. Boundaries and Forbidden Actions

Every capsule must include boundaries and forbidden actions. Forbidden action
examples include:

- runtime behavior
- API route behavior
- DB schema/migration
- MCP/App tool change
- plugin hook
- plugin app mapping
- plugin MCP config
- graph DB
- persistence
- proof/evidence/readiness write
- QP evidence
- `z_t` commit
- Codex continuation authority
- Sites deployment authority
- approval/publish/retry/replay/merge authority
- external posting
- Direct Resume Code / relay / hosted transfer authority

Boundaries should be written plainly enough for ChatGPT review, Codex handoff,
and future agent handoff surfaces to preserve them without inference.

## 14. Next Action Candidates

Next action candidates are candidates only. They may include:

- docs-only follow-up
- smoke-only follow-up
- review task
- validation task
- research note
- scope clarification
- future implementation proposal

A next action candidate must include its boundaries, required checks, skipped
check policy, expected changed files, forbidden changed files, and questions
requiring user/PM judgment when relevant.

## 15. Validation and Final Report Requirements

A capsule intended for Codex handoff should state validation and final report
requirements before work begins.

Validation requirements should name exact commands when known and should state
when a check is supplemental diagnostic only. Final reports should include:

- changed files
- tests run with results
- blockers
- repo/task mismatches
- scope risks
- assumptions
- questions requiring user/PM judgment
- next suggested goal

Skipped checks must include concrete reasons. Do not report `skipped`, `N/A`,
or `not needed` without the specific reason.

## 16. Lifecycle States

Lifecycle states are conceptual only:

- `draft`
- `previewed`
- `copied`
- `superseded`
- `rejected_for_scope`
- `deferred`
- `archived`

These states do not define persistence, runtime status, DB rows, API state,
MCP/App tool state, plugin runtime state, proof state, evidence state, or
readiness state.

## 17. Non-Authority Semantics

A Perspective Capsule / Handoff Capsule is non-authoritative. It may organize
context, but it does not:

- become source of truth
- prove readiness
- approve work
- record proof
- record evidence
- write Core state
- commit or reject Augnes state
- execute agents
- continue Codex work
- launch Codex tasks
- publish, retry, replay, externally post, merge, or enable auto-merge

The user and Augnes Core gates remain the durable decision authorities.

## 18. Examples

### Example 1: Project Constellation To Codex Docs-Only Handoff

Source: Project Constellation / Sidecar Strategy C first slice.

Target: Codex handoff.

Thesis: Strategy C is stopped at fixture/manifest closeout; next task should
remain docs/smoke bounded.

Selected nodes:

- lab evidence baseline
- first fixture subset
- manifest routing
- closeout decision
- AG Resume isolation constraint

Forbidden actions:

- runtime `sidecar_e_t`
- proof/evidence writes
- AG Resume route/helper
- QP evidence
- `z_t` commit

Candidate next action: add or refine a docs-only/smoke-only boundary pointer
with explicit validation and no runtime implementation.

The first fixture-backed capsule preview for this example lives in
`fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json`. That
preview is conceptual, non-authoritative, and fixture-backed only; it does not
create runtime capsule behavior, schema, persistence, graph DB, proof/evidence
writes, Codex task launch, or AG Resume behavior.

The first Perspective Capsule / Handoff Capsule copyable handoff preview lives
inside the Project Constellation read-only Cockpit preview. It renders readonly
selectable `codex_handoff` text from the static capsule/handoff sample so a
human can manually inspect or select it for review workflows. It adds no copy
control, no clipboard integration, no live SDK call, no provider
implementation, no runtime execution, no proof/evidence writes, and no
approval/publish/merge authority. The static guard is
`npm run smoke:perspective-capsule-copyable-handoff-preview`.

The former instruction-only Codex Plugin consumption skill was removed with
the manual native-host transport. Historical capsule fields remain
non-authoritative compatibility material and are not an active intake path.

### Example 2: ChatGPT App/MCP Review To Codex Plugin Workflow

Source: ChatGPT App/MCP whole perspective review.

Target: Codex Plugin skill-guided task.

Thesis: A user-facing whole-perspective review found a repo-facing docs task
that Codex can handle through plugin skill guidance while preserving Augnes
authority boundaries.

Optional context:

- Queue can hold after-completion follow-up, verification, closeout, or
  next-task handling.
- Steer can correct the current scoped task while it is still active.
- `/side` can investigate scope, diagnose errors, explain context, or recap
  status without mutating the main task.
- Remote/SSH notes should preserve host provenance, approval context, skipped
  reason, and verification path.
- Sites saved versions may be demo/review artifact pointers, while Sites
  deployment URLs remain production deployment and are not Augnes readiness,
  proof, publication, approval, or merge authority.

This example does not create execution authority, plugin runtime action, MCP/App
tool changes, proof/evidence writes, Sites deployment behavior, or merge
authority.

## 19. Validation and Smoke Plan

Historical checks used when this document was introduced (not current package
commands):

```text
npm run typecheck
npm run smoke:perspective-capsule-contract
npm run smoke:perspective-capsule-copyable-handoff-preview
npm run smoke:augnes-capsule-handoff-skill
git diff --check
git diff --cached --check
```

`npm run smoke:perspective-capsule-contract` runs in scoped changed-file mode
by default and enforces the contract PR's allowed changed-file boundary. For
cross-PR content-only diagnostics, use:

```text
AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:perspective-capsule-contract
```

Content-only mode is an explicit cross-PR regression diagnostic. It skips the
changed-file allowlist but still checks the contract sections, conceptual
fields, source surfaces, target surfaces, Codex handoff packet fields,
non-authority phrases, pointers, and package script. It is not an
implementation/runtime authority and not a substitute for scoped changed-file
validation in direct contract PRs.

Related boundary smokes can also be run in explicit content-only mode for
unrelated PRs:

```text
AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-ia-boundaries
AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:augnes-operator-plugin-v2
AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:perspective-capsule-copyable-handoff-preview
```

Legacy `AUGNES_CHANGED_FILES_BASE_REF=HEAD` diagnostics are superseded by
`AUGNES_BOUNDARY_SMOKE_MODE=content-only` for cross-PR content checks.

Browser/computer-use may be skipped because this PR is docs/smoke/package-pointer
only and should not touch UI, runtime, API, schema, MCP/App tools, routes,
browser-facing files, or external calls.

Proof-only closeout may be skipped when no runtime/work ID context exists and
this PR must not record proof/evidence writes.

## 20. Non-Goals

This contract does not add or authorize:

- no runtime schema
- no DB schema
- no API route
- no MCP/App tool change
- no plugin runtime action
- no plugin hook
- no graph DB
- no persistence
- no UI implementation
- no Project Constellation runtime behavior
- no proof/evidence write
- no Codex task launch
- no GitHub/OpenAI/Augnes runtime/network calls
- no Sites deployment behavior
- no approval/publish/retry/replay/merge authority
