# Agent Workplane Review Memory Detail v0.1

## Status And Scope

Status: Agent Workplane Review / Memory Proposal Native Detail Hardening v0.1.

Scope: native Agent Workplane review/memory proposal visibility for
`/workbench`. This slice adds a type contract, pure read-only helper, native
read-only Review Memory detail panel, docs, smoke coverage, node-context
registration, and browser-regression marker updates. It does not create a
Legacy Cockpit Shrink Candidate PR.

No Legacy Cockpit functionality is deleted, shrunk, hidden, or disabled.
Compatibility path remains rendered. Future deletion requires a separate PR.
Browser regression, metrics, and dogfood are evidence/signals, not shrink
authority.

## Why Review / Memory Detail Hardening Exists

Workplane Native Replacement Browser Regression v0.1 and the Bridge Trace
Detail v0.1 follow-on improved structural marker coverage, Source Ref Bridge,
Trace Bridge, validation summary, evidence refs, and diagnostic refs. The
Legacy Cockpit Shrink Plan still identified review/memory proposal visibility
as a native absorption gap.

This slice addresses that gap first. It makes Review Queue, durable memory
review candidates, Perspective review candidates, validation-required
candidates, user decision candidates, blocked candidates, candidate source
refs, needs user judgment, and no-apply boundaries explicit in native
Workplane without adding apply authority or weakening compatibility content.

## Shrink-Plan Gaps Addressed

This slice improves:

- Review / memory proposal visibility: `ReviewMemoryDetailPanel` renders
  proposal candidate lanes and candidate detail from Workplane review queue
  hints and projected deltas.
- Review Queue explainability: lane counts, empty lanes, candidate refs,
  merge policy summaries, validation status, non-goals, and source refs are
  visible without relying on Legacy Cockpit copy.
- Needs user judgment visibility: user decision and blocked lanes explicitly
  call out judgment needs and validation requirements.
- Durable memory review candidate visibility: durable memory candidates are
  distinguished from Perspective candidates and remain no-apply review
  context.
- Project Perspective review candidate visibility: Perspective review
  candidates are visible as review candidates only.

## Native Review / Memory Proposal Absorption

`types/workplane-review-memory-detail.ts` defines
`WORKPLANE_REVIEW_MEMORY_DETAIL_VERSION`,
`WorkplaneReviewMemoryDetailRead`, queue summary, candidate detail, decision
items, gap details, lanes, candidate kinds, statuses, and an authority boundary
with all mutation/execution/apply/shrink fields denied.

`lib/workplane/workplane-review-memory-detail.ts` builds detail from existing
`WorkplaneContextRead` and `AgentWorkplaneNodeContextRead`. It does not read
the runner ledger directly, call runner lifecycle helpers, call
`recoverDeltaBatchForRun`, call routes, fetch, write DB state, call
provider/OpenAI/GitHub/Codex, mutate state, apply memory, apply Perspective,
auto-apply deltas, or delete or hide Legacy Cockpit.

## Durable Memory Versus Perspective Candidates

The helper keeps candidate lanes separate:

- `durable_memory_review` becomes `durable_memory_candidate`.
- `project_perspective_review` becomes `perspective_update_candidate`.
- `validation_required` becomes `validation_candidate`.
- `user_decision` becomes `user_judgment_candidate`.
- `blocked` becomes `blocked_candidate`.

The panel visibly states no durable memory apply and no Perspective apply.
Candidate details are visibility only and do not become approvals, applies,
state commits, proof/evidence writes, or product writes.

## No-Apply Boundaries

Boundary phrase: review/memory detail is visibility only, not apply authority.
It can show durable memory review candidates, Perspective review candidates,
validation required lanes, user decision lanes, and blocked candidates, but it
cannot approve, reject, commit, apply durable memory, apply Perspective, or
auto-apply deltas.

## UI Panel Behavior

`ReviewMemoryDetailPanel` renders inside `/workbench` near Review Queue,
Workplane Inspector, and Source Ref Bridge. It exposes:

- `data-workplane-review-memory-detail-panel="v0.1"`
- `data-workplane-panel-id="review_memory_detail"`
- `data-workplane-node-id="authority_validation_debug"`
- `data-workplane-node-kind="debug_context_source"`
- `data-workplane-node-status` based on the read status

The panel renders Review / memory proposal detail, Queue summary, Durable
memory review candidates, Perspective update candidates, Validation-required
candidates, User decision candidates, Blocked candidates, Candidate source
refs, Gap details, and Authority boundary.

Visible copy includes Review / memory proposal detail, durable memory review,
Perspective review, validation required, needs user judgment, source refs, no
durable memory apply, no Perspective apply, and legacy compatibility retained.

The panel is read-only review/memory proposal visibility, not apply authority
and not shrink authority. It renders no buttons, no forms, no textarea, no
input, no `onClick`, and no `formAction`.

## GuideBrief Debug Explainability

The node context now registers `review_memory_detail` with
`authority_validation_debug` so GuideBrief Workplane Debug Context can explain
why the native review/memory panel appears, which source refs support it, what
candidate lanes are empty or materialized, which validation smoke applies, and
what still needs user judgment.

GuideBrief debug remains read-only explanation. It does not execute, apply,
send, mutate, run validation, write evidence, write durable memory, apply
Perspective, or auto-apply deltas.

## Browser Regression Expectations

`lib/workplane/workplane-browser-regression.ts` now recognizes:

- `data-workplane-review-memory-detail-panel="v0.1"`
- `data-workplane-panel-id="review_memory_detail"`
- Review / memory proposal detail
- durable memory review
- Perspective review
- validation required
- needs user judgment
- no durable memory apply
- no Perspective apply

Browser regression can move Review / memory proposal visibility from
`needs_review` toward partial native evidence while still keeping the overall
recommendation gated when dogfood, metrics, source-backed Run Postmortem,
rollback, or human approval remain incomplete.

Follow-on Run Postmortem Detail v0.1 is documented in
`docs/AGENT_WORKPLANE_RUN_POSTMORTEM_DETAIL_V0_1.md`.

## Remaining Gaps

The following gaps intentionally remain:

- direct runner event payload detail and richer postmortem timeline detail
  after source-backed Run Postmortem detail;
- richer proposal diff detail if future review shows it is needed;
- legacy local UI control classification;
- repeated metrics/dogfood baselines for review burden and resume latency;
- explicit rollback and human approval before any deletion PR.

## Authority Boundary

Boundary phrase: review/memory detail is visibility only, not apply authority.

This slice adds no route, no API write route, no server action, no chat
composer, no provider/OpenAI/GitHub/Codex execution, no Codex launch, branch
creation, PR creation, merge, publish, retry, replay, or deploy, no runner
execution, no runner tick, no runner recovery write, no scheduled runner
behavior, no product DB write or persistence, no proof/evidence write, no
durable memory apply, no Perspective apply, no delta auto-apply, no
localStorage/sessionStorage durable view mode, and no product UI action
authority.

No Legacy Cockpit deletion, shrink, hiding, disabling, or compatibility-path
removal is implemented here.

## Validation

Primary smoke:

```bash
npm run smoke:agent-workplane-review-memory-detail-v0-1
```

Related browser regression:

```bash
npm run browser:workplane-native-regression-v0-1
```

The browser regression requires an already-running dev server and remains
evidence, not shrink authority.

## Not Implemented Yet

This slice intentionally does not implement:

- Legacy Cockpit shrink or deletion;
- durable memory apply;
- Perspective apply;
- delta auto-apply;
- proposal approve/reject/commit controls;
- direct runner event payload detail and richer postmortem timeline detail;
- rich proposal diff UI;
- product route or API write route;
- server action or chat composer;
- provider/OpenAI/GitHub/Codex execution;
- runner execution, tick, recovery write, or scheduled behavior;
- proof/evidence write;
- product DB write or persistence;
- localStorage/sessionStorage durable view mode;
- product UI action authority.

## Recommended Next Phase

Recommended next phase: legacy local UI control classification or repeated
dogfood/metrics baseline. Do not proceed to Legacy Cockpit deletion yet.
