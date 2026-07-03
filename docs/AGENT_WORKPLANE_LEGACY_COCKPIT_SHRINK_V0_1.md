# Agent Workplane Legacy Cockpit Shrink v0.1

## Status

Status: historical route split; Cockpit route removal completed later.

This PR performs the Legacy Cockpit Shrink v0.1 that prior plan, regression,
inventory, dogfood, and metrics slices prepared but did not execute.
The browser regression context remains documented in
`docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md`.

Remaining capability migration after this route split was mapped in
`docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md`. That map treats
`/cockpit` as temporary retained compatibility, not a long-term product
surface, and kept Cockpit route removal blocked until unique useful capability
count reached 0.

The PR 3 follow-on is documented in
`docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md`. It moves the
research-critical proposal review lane into native Agent Workplane while
leaving `/cockpit` retained compatibility unchanged at that stage.

The PR 4 follow-on is documented in
`docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md`. It moves safe manual
preview/copy controls into native Workplane State Proposal Review rows, keeps
local-write/apply/commit/reject controls blocked until a separate authority
contract, and classifies obsolete manual/execution residue as delete
candidates.

The PR 5 readiness follow-on is documented in
`docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md`. It verifies
`unique_useful_cockpit_capability_count: 0` and `zero_count_verified: true`,
while keeping `/cockpit` and `components/augnes-cockpit.tsx` unchanged for the
readiness-only PR.

The explicit deletion follow-on is documented in
`docs/COCKPIT_ROUTE_REMOVAL_V0_1.md`. It removed `/cockpit`,
`components/augnes-cockpit.tsx`, and the Workplane compatibility pointer after
zero-count readiness was verified.

The final cleanup follow-on is documented in
`docs/COCKPIT_POST_REMOVAL_CLEANUP_V0_1.md`. It retired stale retained-route
smokes that only verified the temporary `/cockpit` compatibility state.

## Route Split

- /workbench no longer mounts full AugnesCockpit.
- The former compact `LegacyCockpitCompatibilityPanel` pointer/status panel was
  removed in Cockpit Route Removal v0.1.
- /cockpit was removed in Cockpit Route Removal v0.1.
- `app/cockpit/page.tsx` was deleted.
- `components/augnes-cockpit.tsx` was deleted.

Native Agent Workplane panels remain the primary operational surface.

## Absorbed Capabilities

Agent Workplane already has native coverage for the useful operational
capabilities that Step 7 depends on:

- Work Brief through Work Queue, Current Perspective, Overview, and Inspector.
- Handoff visibility and preview/copy surfaces through Evidence/Handoff,
  Handoff Builder preview, Handoff Capsule preview, Codex launch card preview,
  and copy/export preview.
- Current Perspective / Delta Projection visibility through Current
  Perspective, Delta Projection, Projection Candidates, and Trace /
  Diagnostics.
- Source Ref Bridge / Trace Bridge read detail through Source Ref Bridge,
  Workplane Inspector, and Trace / Diagnostics.
- Work/run visibility through Runner DeltaBatch and Run Postmortem Detail.
- Review/memory proposal visibility through ReviewMemoryDetailPanel.
- Research-critical state proposal review through StateProposalReviewPanel,
  including field-level diffs, before/after preview, impact, memory proposal
  review, Perspective lens detail, local draft review, manual preview, manual
  gravity, formation basis, proposal status history, needs-user-judgment,
  stale/fallback warnings, and authority boundary review.
- Safe manual preview/copy controls through StateProposalReviewPanel manual
  controls migration rows, including manual preview, manual gravity, formation
  basis, local draft visibility, copy/export packet review, manual source refs,
  and preview gap review.
- Validation/smoke visibility through Trace / Diagnostics, Evidence/Handoff,
  Workplane Inspector, metrics, and source-backed docs/smoke refs.

## Compatibility Removal

The compatibility route and Workplane pointer are removed rather than embedded
in the primary surface:

- detailed legacy Cockpit local UI controls
- local-write/apply/commit/reject controls that still require a separate
  authority contract
- controls that still require a separate authority contract before native
  absorption
- full six-tab Cockpit shell, removed with `/cockpit`

Local-write/apply/commit/reject controls are not reachable through a retained
Cockpit product route. Their blocked status is represented in Workplane State
Proposal Review manual controls migration rows until a separate authority
contract exists. Safe manual preview/copy review rows are native in Workplane
State Proposal Review.

The route-removal readiness model verifies that those blocked controls do not
keep Cockpit alive as a product surface because their blocked status and
authority boundary are represented natively in Workplane review.

## Historical Runtime Verification

Runtime verification originally proved the route split through a live local Next server.
It only performs HTTP GET checks against the rendered routes and adds no
authority changes, mutation route, runner behavior, or product write path.
No authority changes are introduced by this runtime verification helper.

### Current Runtime Expectation

Cockpit Route Removal v0.1 supersedes the retained-route runtime expectation.
Current runtime validation belongs to
`npm run runtime:cockpit-route-removal-check-v0-1` and expects `/workbench` to
return 200 while `/cockpit` returns 404 or the framework default not-found
response with no Cockpit shell.

### Retired Historical Commands

Cockpit Post-Removal Cleanup v0.1 retires the old route-split runtime checker
and static smoke:

- `runtime:agent-workplane-legacy-cockpit-check-v0-1`
- `smoke:agent-workplane-legacy-cockpit-runtime-check-v0-1`

Those commands expected HTTP 200 for both `/workbench` and the temporary
retained `/cockpit` route. After Cockpit Route Removal v0.1, that retained-route
expectation is obsolete and must not be treated as current validation.

Current route/component absence is validated by:

- `npm run smoke:cockpit-route-removal-v0-1`
- `npm run runtime:cockpit-route-removal-check-v0-1`

### Failure Conditions

The current route-removal runtime checker fails if any of these conditions are
observed:

- /workbench returns any status other than HTTP 200.
- /workbench contains `legacy_cockpit_compatibility`.
- /workbench contains `href="/cockpit"`.
- /workbench contains full six-tab Cockpit shell markers.
- /workbench contains embedded AugnesCockpit compatibility island markers.
- /cockpit returns a product Cockpit route instead of 404/framework not-found.
- /cockpit renders AugnesCockpit, cockpit-shell, six-tab-cockpit, or retained
  compatibility route content.

## Deprecated Or Blocked

External execution controls remain forbidden. Publish, merge, retry, replay,
deploy, provider/OpenAI execution, GitHub actuation, Codex launch/execution,
runner execution, proof/evidence writes, durable memory apply, Perspective
apply, and delta auto-apply remain absent unless separately authorized.

This shrink and later route removal add no API route, API write route, server action, provider call,
OpenAI call, GitHub call, Codex execution, runner execution, runner tick,
runner recovery, runner scheduling, product DB write, proof/evidence write,
durable memory apply, Perspective apply, delta apply, publish, merge, retry,
replay, or deploy authority.

## No Hidden Feature Loss

No hidden feature loss is introduced by the route split or later route removal.

No useful retained capability is silently lost:

- migrated capabilities are represented in Blank State, Agent Workplane,
  Workplane State Proposal Review, and Manual Controls Migration rows
- blocked controls remain blocked until a separate authority contract
- obsolete shell/copy/execution residue is deleted or forbidden-delete

The shrink removed the full Legacy Cockpit island from /workbench. Cockpit Route
Removal v0.1 then removed the retained compatibility path after zero-count
readiness was verified.
