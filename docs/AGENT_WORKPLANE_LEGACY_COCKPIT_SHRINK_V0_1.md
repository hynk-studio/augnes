# Agent Workplane Legacy Cockpit Shrink v0.1

## Status

Status: real shrink implemented by route split.

This PR performs the Legacy Cockpit Shrink v0.1 that prior plan, regression,
inventory, dogfood, and metrics slices prepared but did not execute.
The browser regression context remains documented in
`docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md`.

## Route Split

- /workbench no longer mounts full AugnesCockpit.
- /workbench keeps a compact `LegacyCockpitCompatibilityPanel` pointer/status
  panel with `data-workplane-panel-id="legacy_cockpit_compatibility"`.
- /cockpit preserves full Legacy Cockpit compatibility.
- `app/cockpit/page.tsx` imports and renders `AugnesCockpit`.
- `components/augnes-cockpit.tsx` remains present.

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
- Validation/smoke visibility through Trace / Diagnostics, Evidence/Handoff,
  Workplane Inspector, metrics, and source-backed docs/smoke refs.

## Retained Compatibility

Retained compatibility remains explicit rather than embedded in the primary
surface:

- detailed legacy Cockpit local UI controls
- local-write/manual/local-draft controls
- controls that still require a separate authority contract before native
  absorption
- full six-tab Cockpit shell, now only at /cockpit

Retained local-write/manual/local-draft controls remain reachable through
/cockpit until separately absorbed under a future authority contract.

## Runtime Verification

Runtime verification proves the route split through a live local Next server.
It only performs HTTP GET checks against the rendered routes and adds no
authority changes, mutation route, runner behavior, or product write path.
No authority changes are introduced by this runtime verification helper.

### Required Commands

Start a local dev server:

```bash
AUGNES_DB_PATH=/tmp/augnes-runtime-check.db npm run dev -- --port 3000
```

Then run the route checker:

```bash
npm run runtime:agent-workplane-legacy-cockpit-check-v0-1
```

Static coverage for this runtime helper is checked with:

```bash
npm run smoke:agent-workplane-legacy-cockpit-runtime-check-v0-1
```

### Expected Output

The runtime checker prints JSON with `pass: true`, HTTP 200 status for
`/workbench` and `/cockpit`, and these route facts:

- `/workbench` contains
  `data-workplane-legacy-cockpit-shrink="workbench_full_mount_removed"`.
- `/workbench` contains `data-workplane-legacy-cockpit-route="/cockpit"`.
- `/workbench` contains the compact Legacy Cockpit compatibility panel.
- `/workbench` does not contain full Cockpit shell markers.
- `/cockpit` contains the Legacy Cockpit page heading.
- `/cockpit` contains the retained AugnesCockpit shell markers.
- `/cockpit` contains the existing six-tab shell marker or current equivalent.

The final line should be:

```text
PASS runtime:agent-workplane-legacy-cockpit-runtime-check-v0-1
```

### Failure Conditions

The runtime checker fails if any of these conditions are observed:

- /workbench returns any status other than HTTP 200.
- /cockpit returns any status other than HTTP 200.
- /workbench is missing the shrink marker.
- /workbench is missing the retained `/cockpit` route pointer.
- /workbench is missing the compact Legacy Cockpit compatibility panel.
- /workbench still contains the full six-tab Cockpit shell.
- /workbench still contains embedded AugnesCockpit compatibility island markers.
- /cockpit is missing the Legacy Cockpit page heading.
- /cockpit is missing AugnesCockpit shell markers.
- /cockpit is missing the six-tab shell marker or current equivalent.
- /cockpit no longer proves the retained compatibility route exists.

## Deprecated Or Blocked

External execution controls remain forbidden. Publish, merge, retry, replay,
deploy, provider/OpenAI execution, GitHub actuation, Codex launch/execution,
runner execution, proof/evidence writes, durable memory apply, Perspective
apply, and delta auto-apply remain absent unless separately authorized.

This shrink adds no API route, API write route, server action, provider call,
OpenAI call, GitHub call, Codex execution, runner execution, runner tick,
runner recovery, runner scheduling, product DB write, proof/evidence write,
durable memory apply, Perspective apply, delta apply, publish, merge, retry,
replay, or deploy authority.

## No Hidden Feature Loss

No hidden feature loss is introduced by the route split.

No useful retained capability is silently lost:

- retained controls are reachable at /cockpit
- no source component is deleted
- rollback is route-based: /cockpit remains available

The shrink removes the full Legacy Cockpit island from /workbench while keeping
the retained compatibility path explicit and reviewable.
