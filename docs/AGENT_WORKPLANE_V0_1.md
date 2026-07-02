# Agent Workplane v0.1

## 1. Status and Scope

Status: Phase 5A Agent Workplane Shell, Phase 5B Agent Workplane Panels,
Phase 5C Agent Workplane Projection / Handoff / Postmortem Skeletons, and
Phase 5D Agent Workplane Cleanup / Responsive Hardening, plus Agent Workplane
Node / Panel Contract v0.1, Recovered Runner DeltaBatch Integration v0.1, and
GuideBrief Workplane Debug Context v0.1.

Scope: `/workbench` is reframed as Agent Workplane: a backend work surface for agent/operator traces, projection candidates, handoff context, evidence pointers, validation context, and existing Cockpit compatibility content.

Phase 5A adds a read-only Workplane shell, header, overview cards, boundary card, compatibility panel, a thin workplane context read helper, this document, and a focused static smoke. It preserves the existing Cockpit content instead of deleting or replacing it.

Phase 5B extracts focused read-only Agent Workplane panels for work queue, Current Perspective, Delta Projection, Review Queue, Evidence/Handoff, and inspector context. It does not redo the shell, remove Cockpit compatibility, add writes, add route changes, execute agents, launch Codex, or apply deltas.

Phase 5C adds read-only / preview-only skeleton panels for Projection
Candidates, Delta Batch, Handoff Builder preview, Run Postmortem, and Trace /
Diagnostics. It does not add execution, send, apply, approve, reject,
persistence, proof/evidence writes, DB writes, provider calls, GitHub
actuation, Codex execution, hidden authority, Phase 5D cleanup, or Phase 6
GuideBrief behavior.

Phase 5D adds cleanup, responsive hardening, old-label cleanup, accessibility /
semantics hardening, source/fallback visibility hardening, boundary-copy
consistency, this closeout update, and a focused static smoke. It does not add
new panels, new data sources, new routes, execution, send, apply, approve,
reject, persistence, proof/evidence writes, DB writes, provider calls, GitHub
actuation, Codex execution, hidden authority, or Phase 6 GuideBrief behavior.

Agent Workplane Node / Panel Contract v0.1 adds stable panel/node IDs, typed
read-context metadata, a read-only node context helper, and `data-workplane-*`
attributes on key existing panels. It prepares the surface for later
GuideBrief Workplane Debug Context and GuideBrief Intent Projection without
adding GuideBrief debug behavior, intent projection, routes, writes, execution,
runner ledger reads, Runner / DeltaBatch Workplane integration, durable memory
apply, Perspective apply, or legacy Cockpit deletion.

Recovered Runner DeltaBatch Integration v0.1 is documented in
`docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md`. It reads existing
recovered runner DeltaBatches from the runner ledger as read-only Workplane
review context. It does not add new runner execution, recovery writes from
Workplane reads, scheduled behavior, GuideBrief debug, intent projection,
provider/OpenAI/GitHub/Codex execution, DB writes from Workplane reads,
proof/evidence writes, durable memory apply, Perspective apply, delta
auto-apply, or legacy Cockpit deletion.

GuideBrief Workplane Debug Context v0.1 is documented in
`docs/GUIDEBRIEF_WORKPLANE_DEBUG_CONTEXT_V0_1.md`. `/workbench` now renders a
read-only GuideBrief debug panel for a deterministic default selection:
`workplane_inspector / source_ref_bridge`. The helper can also distinguish
`delta_projection / perspective_delta`, `projected_delta_batch /
perspective_delta`, and `delta_batch / runner_delta_batch`. It preserves
Observed/Inferred/Suggested/Needs user judgment separation and adds no
GuideBrief intent projection, Workplane intent mode, route, write, execution,
runner behavior, external authority, durable memory apply, Perspective apply,
delta auto-apply, or legacy Cockpit deletion.

## 2. Surface Model

The route model remains:

```text
/ = Human Surface home
/perspective = Perspective Human Timeline
/workbench = Agent Workplane
```

The Human Surface remains the human-facing entry. Perspective remains the human review timeline. Workbench becomes the backend/operator work surface.

Agent Workplane renders:

- `Agent Workplane` header
- links to `/` and `/perspective`
- read-only boundary copy
- Current Working Perspective compact summary
- Augnes Delta Projection compact summary
- Trace context summary
- review queue counts
- source/fallback status
- work queue/context scope summary
- pointer-only inspector for handoff, Codex result, evidence, and latest delta refs
- focused read-only panels for Work Queue, Current Perspective, Delta Projection,
  Review Queue, Evidence/Handoff, and Workplane Inspector context
- read-only preview skeletons for Projection Candidates, Delta Batch, Handoff
  Builder preview, Run Postmortem, and Trace / Diagnostics
- read-only recovered runner DeltaBatch review context when existing runner
  ledger readback is available
- read-only GuideBrief Workplane Debug Context for selected panel/node/ref
  explanation
- stable `data-workplane-panel-id`, `data-workplane-node-id`,
  `data-workplane-node-kind`, and `data-workplane-node-status` metadata on key
  native panels and the legacy compatibility path
- existing Cockpit compatibility content

## 3. Existing Cockpit Preservation

Phase 5A keeps `AugnesCockpit` mounted inside `LegacyCockpitCompatibilityPanel`.

This preserves existing Work Brief, Handoff, Perspective, Bridge, Operator, trace, and diagnostic visibility while the surrounding information architecture moves from Cockpit-as-main-human-product-surface to Agent-Workplane-as-backend/operator-surface.

Phase 5B adds focused Agent Workplane panels around the existing compatibility
content. Phase 5C adds preview skeleton panels after those panels. Phase 5D
contains the legacy compatibility body so wide legacy content does not redefine
the Workplane layout. No Phase 5 slice deep-extracts or deletes Cockpit
functionality.

## 4. Data Sources and Fallback

Agent Workplane uses `lib/workplane/read-workplane-context.ts` as a thin alias/aggregator over the Phase 4 read-only helpers:

```text
readCurrentPerspectiveForHumanSurface()
readDeltaProjectionForHumanSurface()
readRunnerDeltaBatchesForWorkplane()
```

Preferred Current Working Perspective source:

```text
GET /api/perspective/current?scope=project:augnes
x-augnes-local-readonly: current-working-perspective-v0.1
```

Fallback source:

```text
fixtures/current-working-perspective.sample.v0.1.json
```

Preferred Delta Projection source:

```text
GET /api/augnes/read/deltas?scope=project:augnes
x-augnes-local-readonly: augnes-delta-projection-v0.1
```

Fallback source:

```text
fixtures/augnes-delta-projection.sample.v0.1.json
```

The Agent Workplane UI exposes source status and fallback reason. Fixture fallback is disclosed and is not presented as live runtime state.

Recovered runner DeltaBatch readback uses the existing runner ledger. The
default Workplane read opens the configured app DB read-only and returns an
explicit empty state if the runner ledger or schema is absent. Temp-ledger
smoke setup may write fixture runner records before reading them back, but
normal Workplane reads do not write runner ledger records.

## 5. Overview Semantics

The Workplane overview shows:

- current thesis
- active goals count
- open questions count
- active risks count
- research pressure
- projected delta count
- Delta Batch count
- recovered runner DeltaBatch count
- recovered runner DeltaBatch latest run id and latest batch id
- projection gap count
- evidence pointer count
- review queue counts for needs-review, blocked, manual-review, and validation-required delta refs
- source/fallback status
- staleness status

Projected deltas remain read-model inputs. Delta status, review hints, evidence pointers, artifact pointers, handoff refs, and Codex result refs are inspection context only.

## 6. Authority Boundary

This PR adds read-only Agent Workplane UI/IA only. It does not add DB schema/migration, DB writes, MCP/App tools, provider/OpenAI calls, GitHub actuation, Codex execution, proof/evidence writes, durable Perspective state apply, memory mutation, product-write, scheduler/autonomy runner, merge/publish/retry/replay/deploy behavior, or external side effects.

Agent Workplane cannot:

- write DB rows
- create or update work
- run agents
- launch Codex
- call providers or OpenAI
- call GitHub
- write proof or evidence
- mutate memory
- apply durable Perspective state
- approve or apply deltas
- publish externally
- merge
- retry, replay, or deploy
- schedule hidden automation

No approve, apply, reject, send, launch, publish, retry, replay, deploy, or persistence controls are added in Phase 5A.

## 7. Fallback and Empty States

Required visible states:

- Current Working Perspective unavailable: fixture fallback is disclosed.
- Delta Projection unavailable: fixture fallback is disclosed.
- No projected deltas: the overview and inspector say no projected deltas are materialized.
- No active goals: the work queue panel says no active work goals are materialized.
- No review queue refs: the review queue card says no review queue delta refs are materialized.
- No handoff/Codex/evidence refs: the inspector shows pointer counts as zero.
- No handoff refs: the inspector says no handoff refs materialized yet.
- No run/postmortem source: the inspector says run postmortem source is not
  materialized yet.

No fixture is silently presented as runtime data.

## 8. Phase 5B Panels

Phase 5B extracts focused read-only panels without redoing the shell:

- Work Queue panel
- Current Perspective Workplane panel
- Delta Projection Workplane panel
- Review Queue panel
- Evidence/Handoff panel
- Workplane Inspector

Panel semantics:

- Work Queue shows active goals, active work ids, and next candidate counts as
  read-only queue hints.
- Current Perspective shows thesis, frame summary, open questions, source
  status, staleness, and research pressure without exposing raw diagnostics by
  default.
- Delta Projection shows projected deltas, Delta Batch count, gaps, evidence
  pointers, and latest delta titles as read-model inputs only.
- Review Queue shows needs-review, blocked, manual-review, validation,
  Project Perspective, durable-memory, and user-decision delta refs as operator
  attention hints only.
- Evidence/Handoff shows pointer-only evidence, handoff, artifact, and Codex
  result refs. It does not create evidence, send handoffs, or launch Codex.
- Workplane Inspector shows compact pointer, merge-policy, non-goal, and
  boundary context for projected deltas. It does not add approve, apply, send,
  launch, publish, merge, retry, replay, deploy, save, reset, rollback, or
  persistence controls.

Phase 5B preserves the same no-write, no-execution, no-hidden-authority boundary.

## 9. Phase 5C Projection / Handoff / Postmortem Skeletons

Phase 5C adds preview-only Agent Workplane panels:

- Projection Candidates panel
- Delta Batch panel
- Handoff Builder preview panel
- Run Postmortem skeleton panel
- Trace / Diagnostics panel

Projection Candidates shows Current Working Perspective next candidates,
candidate-like projected deltas, review queue pressure, and source/fallback
status. Projection candidates are read-only preview context. No apply, approve,
reject, or persistence controls are available there.

Projected Delta Batch shows projected batch title, summary, delta count,
validation summary status, snapshot ref count, diagnostic ref count, and
compact authority boundary summary from the Delta Projection read model. It is
not recovered runner output. It has no transaction semantics, batch apply
behavior, batch approval, runner recovery, or persistence behavior.
Its stable panel identity is `projected_delta_batch` with node
`perspective_delta`, intentionally separate from the native `delta_projection`
panel and from recovered runner `delta_batch` / `runner_delta_batch` readback
so GuideBrief debug selection can be unambiguous.

Recovered Runner DeltaBatch shows existing recovered runner DeltaBatch ledger
readback: latest run id, batch id, delta count, validation status, source ref
count, related step/event/delta refs, and authority boundary notes. It has no
apply, approve, reject, execute, recover, tick, schedule, send, launch, proof
write, evidence write, provider/OpenAI/GitHub/Codex execution, durable memory
apply, Perspective apply, delta auto-apply, or runner behavior.
Its stable panel identity remains `delta_batch` with node
`runner_delta_batch`.

Handoff Builder preview shows pointer-only handoff refs from top-level
`source_refs.handoff_refs` and per-delta `handoff_refs`, plus artifact pointer
and Codex result ref counts. Handoff Capsule is not implemented in Phase 5C.
Future handoff build/send behavior requires separate explicit authority. Phase
5C adds no copy button, send button, Codex launch, PR creation, GitHub call,
provider call, proof/evidence write, external send, or local persistence.

Run Postmortem reserves skeleton fields for goal, context loaded, major
decisions, tools used, failed attempts, validation, outputs, generated deltas,
and unresolved issues. Because no structured run source is materialized in
Phase 5C, each field says `not materialized yet`. The panel creates no proof
write, evidence write, completion record, work closeout, or runtime execution.

Trace / Diagnostics shows bounded projection gaps, diagnostic refs, validation
summary statuses, review notes, non-goals, and source/fallback status. It is
bounded trace context, not a raw unbounded diagnostics dump. It does not add a
runtime trace collector, hidden scheduler, provider call, DB read/write,
proof/evidence write, or external side effect.

## 10. Phase 5D Cleanup / Responsive Hardening

Phase 5D is cleanup and hardening only. It keeps the route model unchanged:

```text
/ = Human Surface home
/perspective = Perspective Human Timeline
/workbench = Agent Workplane backend/operator surface
```

Cleanup includes:

- responsive hardening for desktop, tablet-ish, and narrow mobile widths around
  390px
- safe wrapping for long delta ids, pointer refs, gaps, diagnostics, and
  fallback text
- containment for legacy Cockpit compatibility content without deleting it
- old-label cleanup so `/workbench` is not framed as the primary human product
  surface
- accessibility / semantics cleanup for headings, sections, nav anchors, lists,
  and panel labels
- source/fallback visibility hardening so fixture fallback is not presented as
  live runtime state
- boundary-copy consistency across Phase 5A/B/C panels
- smoke hardening for Phase 5D changed-file boundaries and no-authority checks

Boundary copy remains explicit: Agent Workplane is read-only and preview-only
where relevant. It adds no apply, approve, reject, send, launch Codex,
GitHub/provider calls, proof/evidence write, DB schema/write, memory mutation,
scheduler/autonomy runner, product-write, merge, publish, retry, replay,
deploy, or external side effect behavior.

Phase 5 v0.1 is ready for the next phase only when:

- Agent Workplane remains distinct from Human Surface and Perspective Human
  Timeline
- Cockpit compatibility content remains reachable
- source/fallback status remains visible
- trace/diagnostics remain bounded rather than raw dumps
- no hidden execution authority or write/apply controls are introduced
- Phase 5A/B/C/D smokes and the required upstream smokes pass

Phase 6 GuideBrief / Cross-Surface Guide Core can start only after those
criteria remain true and no authority drift is found.

## 11. Node / Panel Contract

`docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md` defines the stable node/panel
context contract for Agent Workplane.

The contract includes:

- `panel_id`, `node_id`, `kind`, `title`, `summary`, `status`, `created_at`,
  `updated_at`, `source_refs`, related run/step/event/batch/delta/handoff
  refs, `authority_boundary`, `validation_summary`, `staleness`,
  `fallback_status`, and `debug_notes`
- stable panel IDs for Work Queue, Current Perspective, Delta Projection,
  Review Queue, Evidence/Handoff, Workplane Inspector, Projection Candidates,
  Delta Batch, Handoff Builder preview, Run Postmortem, Trace / Diagnostics,
  and legacy Cockpit compatibility
- stable absorption target IDs for Current Objective, Handoff Context,
  Perspective Delta, Source Ref Bridge, Trace Bridge, Authority / Validation /
  Debug, Runner State, runner DeltaBatch, Run Postmortem, and Trace Diagnostics
- node kinds for native, preview, compatibility, debug context, handoff
  context, runner context, and trace context sources
- conservative statuses for ready, partial, preview-only, compatibility-only,
  not-materialized, stale, and fallback context

`lib/workplane/workplane-node-context.ts` builds a read-only
`AgentWorkplaneNodeContextRead` packet from existing `readWorkplaneContext()`
output. It derives source refs from Current Working Perspective, Augnes Delta
Projection, and recovered runner DeltaBatch reads, preserves
source/fallback/staleness disclosure, names relevant smoke coverage, and
represents missing runner/postmortem sources as empty or not materialized. It
does not add a route, DB write, persistence, runner execution, runner recovery
write, scheduler behavior, provider/OpenAI/GitHub/Codex execution, durable
memory apply, Perspective apply, delta auto-apply, or external side effect.

Recovered runner DeltaBatch node/panel integration is documented in
`docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md`.

Legacy Cockpit compatibility remains explicit through
`legacy_cockpit_compatibility` with `compatibility_panel` /
`compatibility_only` metadata. Legacy Cockpit must not be removed until native
replacement and validation exist.

## 12. Smoke Plan

`npm run smoke:agent-workplane-shell-v0-1` checks:

- package script pointer exists
- `/workbench` route still exists
- `/workbench` renders `AgentWorkplane`
- Agent Workplane shell/header/overview/boundary/compatibility components exist
- links to `/` and `/perspective` exist
- visible copy includes `Agent Workplane`
- visible copy includes read-only/no hidden execution authority boundary
- existing `AugnesCockpit` compatibility content remains reachable
- Workplane context uses Current Working Perspective and Delta Projection read helpers
- no mutating HTTP method, provider/OpenAI/GitHub/Codex execution, proof/evidence write, scheduler/autonomy runner, or route/write behavior is introduced in the new Workplane files

`npm run smoke:agent-workplane-panels-v0-1` checks:

- package script pointer exists
- `/workbench` still routes through `AgentWorkplane`
- shell/header/overview/boundary/legacy compatibility content remain reachable
- Work Queue, Current Perspective, Delta Projection, Review Queue,
  Evidence/Handoff, and Workplane Inspector panel components exist
- panel copy includes read-only, pointer-only, source/fallback, and no hidden
  execution authority boundaries
- panel files use `WorkplaneContextRead` and existing read-only context
  summaries
- no route, DB schema/migration, DB write, MCP/App tool, provider/OpenAI/GitHub
  runtime call, Codex execution, proof/evidence write, scheduler/autonomy
  runner, merge/publish/retry/replay/deploy behavior, or external side effect is
  introduced

`npm run smoke:agent-workplane-projection-handoff-v0-1` checks:

- package script pointer exists
- `/workbench` still renders `AgentWorkplane`
- Phase 5B panels still compose
- Projection Candidates, Delta Batch, Handoff Builder preview, Run Postmortem,
  and Trace / Diagnostics panel components exist and are composed
- required preview/empty-state/boundary copy exists
- no apply, approve, reject, send, launch, proof/evidence, persistence, merge,
  deploy, mutating HTTP method, route, DB schema/migration, DB write,
  MCP/App tool, provider/OpenAI/GitHub runtime call, Codex execution,
  scheduler/autonomy runner, raw unbounded diagnostics dump, or external side
  effect is introduced

`npm run smoke:agent-workplane-cleanup-hardening-v0-1` checks:

- package script pointer exists
- `/workbench` still renders `AgentWorkplane`
- Phase 5A shell, Phase 5B panels, and Phase 5C preview panels still compose
- legacy `AugnesCockpit` compatibility remains reachable
- visible copy keeps `Agent Workplane`, `Backend work surface`, `Read-only
  operator view`, `No hidden execution authority`, `legacy Cockpit
  compatibility content`, and source/fallback status
- route model, Human Surface, Perspective Human Timeline, and API routes are not
  changed
- no DB schema/migration, DB write, MCP/App tool, provider/OpenAI/GitHub runtime
  call, Codex execution, proof/evidence write, scheduler/autonomy runner,
  product-write, durable Perspective apply, memory mutation,
  merge/publish/retry/replay/deploy behavior, button/form write control, broad
  Cockpit deletion, raw unbounded diagnostics dump, or external side effect is
  introduced
- old-label cleanup keeps Cockpit references limited to explicit legacy
  compatibility or historical context

`npm run smoke:agent-workplane-node-contract-v0-1` checks:

- package script pointer exists
- node contract types, read helper, docs, index pointer, and Workplane doc
  pointer exist
- required fields, stable panel IDs, absorption target IDs, node kinds, and
  statuses are present
- `WorkplanePanelShell` accepts and renders stable data attributes
- required native panels and legacy compatibility expose stable metadata
- the node context helper exports a stable registry/read model and preserves
  source/fallback/staleness/authority/validation language
- no GuideBrief debug panel, intent projection, route, Runner / DeltaBatch
  execution behavior, recovery write, DB write, provider/OpenAI/GitHub/Codex
  execution, durable memory apply, Perspective apply, broad source deletion, or
  legacy Cockpit deletion is introduced

`npm run smoke:workplane-runner-deltabatch-integration-v0-1` checks:

- package script pointer exists
- runner DeltaBatch reader, Workplane panel, docs, and index pointers exist
- `runner_delta_batch_read` is present in Workplane context
- node/panel context includes recovered runner run/batch/delta refs
- Agent Workplane renders `RunnerDeltaBatchPanel`
- projected Delta Projection batches and recovered runner DeltaBatches are
  distinguished in code and docs
- `delta_projection`, `projected_delta_batch`, and `delta_batch` are distinct
  stable panel identities
- empty state is represented without throwing
- a temp-ledger fixture can create a run, tick to completion, recover a
  DeltaBatch through existing runner APIs, and read it back through the
  Workplane reader
- no route, legacy Cockpit deletion, new runner behavior, Workplane recovery
  write, scheduled behavior, provider/OpenAI/GitHub/Codex execution, DB write
  from Workplane reads, proof/evidence write, durable memory apply,
  Perspective apply, or delta auto-apply is introduced

## 13. Validation

Minimum validation for Phase 5D:

```bash
npm run typecheck
npm run smoke:augnes-delta-contract-v0-1
npm run smoke:augnes-delta-projection-v0-1
npm run smoke:augnes-delta-projection-route-v0-1
npm run smoke:current-working-perspective-v0-1
npm run smoke:current-working-perspective-route-v0-1
npm run smoke:human-surface-home-v0-1
npm run smoke:perspective-human-timeline-v0-1
npm run smoke:agent-workplane-shell-v0-1
npm run smoke:agent-workplane-panels-v0-1
npm run smoke:agent-workplane-projection-handoff-v0-1
npm run smoke:agent-workplane-cleanup-hardening-v0-1
npm run smoke:agent-workplane-node-contract-v0-1
git diff --check
```

If files are staged, also run:

```bash
git diff --cached --check
```
