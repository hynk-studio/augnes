# Cockpit Route Removal v0.1

## Status And Scope

Cockpit Route Removal v0.1 is the explicit deletion PR after Cockpit Route
Removal Readiness v0.1 (`docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md`)
verified:

- `unique_useful_cockpit_capability_count: 0`
- `zero_count_verified: true`
- `status: ready_for_route_removal`

This PR removes Legacy Cockpit as a product surface. It does not add any
provider, GitHub, Codex, runner, product database, proof/evidence, durable
memory, Perspective, delta apply, or local-storage authority.

## Why This Follows PR #942

PR #942 proved that useful Cockpit-only capability count reached 0. The
readiness model classified remaining legacy capabilities as migrated to Blank
State, migrated to Workplane, migrated to Workplane State Proposal Review,
migrated to Manual Controls Migration review rows, blocked until a separate
authority contract, obsolete-delete, or forbidden-delete.

Because the zero count is verified, `/cockpit` no longer needs to remain as a
compatibility product route.

## Deletion Performed

- `/cockpit` route removed by deleting `app/cockpit/page.tsx`.
- `components/augnes-cockpit.tsx` removed.
- `components/workplane/legacy-cockpit-compatibility-panel.tsx` removed.
- `LegacyCockpitCompatibilityPanel` import/render was removed from
  `components/workplane/agent-workplane.tsx`.
- `legacy_cockpit_compatibility` was removed from active Workplane
  panel/node registries.

## Migrated Capability Preservation

The deletion does not remove migrated native capability surfaces:

- Blank State keeps the seven human-facing review entry cards.
- Agent Workplane keeps operational context, source refs, runner/DeltaBatch
  visibility, handoff prep, debug context, trace diagnostics, review queue, and
  validation context.
- Workplane State Proposal Review
  (`docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md`) keeps field-level diffs,
  before/after previews, impact review, memory proposal review, Perspective lens
  review, local draft review, manual previews, stale/fallback warnings,
  authority boundary review, and proposal status history.
- Cockpit Manual Controls Migration rows
  (`docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md`) keep safe manual
  preview/copy review context visible in State Proposal Review.
- Local-write/apply/commit/reject controls remain blocked until a separate
  authority contract exists.
- Obsolete external execution and duplicate Cockpit shell/copy controls remain
  deleted or forbidden-delete candidates, not migration targets.

## Runtime Expectations

- `/workbench` returns 200.
- `/workbench` contains native Workplane State Proposal Review and Manual
  Controls Migration markers.
- `/workbench` does not contain `legacy_cockpit_compatibility`,
  `data-workplane-legacy-cockpit-shrink`,
  `data-workplane-legacy-cockpit-route="/cockpit"`, `href="/cockpit"`,
  `six-tab-cockpit`, `cockpit-shell`, or `AugnesCockpit`.
- `/cockpit` returns 404 or the framework default not-found response.
- `/cockpit` does not render Legacy Cockpit, `AugnesCockpit`, `cockpit-shell`,
  `six-tab-cockpit`, compatibility route copy, or retained compatibility route
  copy.

## Authority Boundary

The route-removal readiness model remains read-only and reports:

- `removal_completed: true`
- `cockpit_route_present: false`
- `augnes_cockpit_component_present: false`
- `legacy_workplane_compatibility_panel_present: false`
- `route_removal_allowed: false`
- `component_removal_allowed: false`

`route_removal_allowed` and `component_removal_allowed` remain false because the
model does not grant runtime deletion authority. This PR deletes source files
through normal repository change control only.

## Validation

Required validation:

- `npm run typecheck`
- `npm run smoke:cockpit-route-removal-v0-1`
- `npm run smoke:cockpit-route-removal-readiness-v0-1`
- `npm run smoke:cockpit-manual-controls-migration-v0-1`
- `npm run smoke:workplane-state-proposal-review-v0-1`
- `npm run smoke:legacy-cockpit-remaining-capability-migration-v0-1`
- `npm run smoke:agent-workplane-legacy-cockpit-shrink-v0-1`
- `npm run smoke:agent-workplane-node-contract-v0-1`
- `npm run smoke:agent-workplane-panels-v0-1`
- `npm run smoke:agent-workplane-cockpit-inheritance-v0-1`
- `npm run smoke:blank-state-review-entry-absorption-v0-1`
- `git diff --check`
- `git diff --cached --check`

Runtime validation, when a local dev server is available:

- `npm run runtime:cockpit-route-removal-check-v0-1`

## Follow-Up Cleanup

No migrated Blank State, Workplane, State Proposal Review, or Manual Controls
Migration capability should be removed as part of Cockpit deletion. Future
cleanup can remove stale historical planning smokes or docs only under a
separate explicit cleanup scope.
