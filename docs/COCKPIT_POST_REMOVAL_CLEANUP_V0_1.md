# Cockpit Post-Removal Cleanup v0.1

## Status And Scope

Status: narrow cleanup after Cockpit Route Removal v0.1.

Cockpit Post-Removal Cleanup v0.1 retires stale pre-removal smoke scripts and
stale route-split validation references that only existed while `/cockpit` was a
temporary retained compatibility route.

This cleanup does not change product UI, routes, components, data models,
provider calls, GitHub behavior, Codex behavior, runner behavior, proof/evidence
behavior, memory apply, Perspective apply, delta apply, or product-write
authority.

## Why This Follows PR #943

Cockpit Route Removal v0.1 removed:

- `/cockpit`
- `components/augnes-cockpit.tsx`
- `components/workplane/legacy-cockpit-compatibility-panel.tsx`
- active `legacy_cockpit_compatibility` Workplane panel/node identity

After that removal, retained-route smokes that expected `/cockpit` reachability
or a Workplane compatibility pointer became historical pre-removal checks. The
post-removal smoke set now verifies that Cockpit remains absent and native
surfaces preserve the migrated capability coverage.

## Retired Pre-Removal Smokes

The following retained-route scripts are retired:

- `scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs`
- `scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs`
- `scripts/smoke-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs`
- `scripts/run-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs`

They were temporary route-split checks for states that no longer exist:

- Legacy Cockpit reachable at `/cockpit`
- Workplane compatibility pointer to `/cockpit`
- `legacy_cockpit_compatibility` as an active Workplane panel/node
- retained-route runtime checks where `/cockpit` returned product content

## Authoritative Post-Removal Smokes

Post-removal validation is carried by:

- `smoke:cockpit-route-removal-v0-1`
- `smoke:cockpit-route-removal-readiness-v0-1`
- `smoke:cockpit-manual-controls-migration-v0-1`
- `smoke:workplane-state-proposal-review-v0-1`
- `smoke:legacy-cockpit-remaining-capability-migration-v0-1`
- `smoke:blank-state-review-entry-absorption-v0-1`
- `smoke:agent-workplane-node-contract-v0-1`
- `smoke:agent-workplane-panels-v0-1`

`smoke:cockpit-route-removal-v0-1` remains authoritative for the route,
component, and Workplane compatibility-pointer absence checks. The native
surface smokes remain authoritative for migrated Blank State, Agent Workplane,
State Proposal Review, and Manual Controls Migration coverage.

## Migrated Capability Preservation

No migrated capability is removed by this cleanup:

- Blank State keeps the seven human-facing entry cards.
- Agent Workplane keeps operational context and native panel contracts.
- Workplane State Proposal Review keeps research-critical proposal review.
- Cockpit Manual Controls Migration rows keep safe manual preview/copy review
  context visible in State Proposal Review.
- Blocked local-write/apply/commit/reject controls remain blocked until a
  separate authority contract exists.

## No Product Behavior Change

This cleanup changes only docs, package smoke registration, and obsolete smoke
files. It does not edit `app/*`, `components/*`, `lib/*`, `types/*`, database,
migration, provider, GitHub, Codex, runner, proof/evidence, memory apply,
Perspective apply, or delta apply paths.

`/cockpit`, `AugnesCockpit`, and `LegacyCockpitCompatibilityPanel` remain
deleted.

## No Authority Change

This cleanup adds no API route, API write route, server action, form, input,
provider/OpenAI call, GitHub call, GitHub actuation, Codex execution, runner
execution, runner tick, runner recovery, runner scheduling, product DB write,
proof/evidence write, durable memory apply, Perspective apply, delta auto-apply,
localStorage/sessionStorage write, merge, publish, retry, replay, or deploy
authority.

## Validation

Required validation:

- `npm run typecheck`
- `npm run smoke:cockpit-post-removal-cleanup-v0-1`
- `npm run smoke:cockpit-route-removal-v0-1`
- `npm run smoke:cockpit-route-removal-readiness-v0-1`
- `npm run smoke:cockpit-manual-controls-migration-v0-1`
- `npm run smoke:workplane-state-proposal-review-v0-1`
- `npm run smoke:legacy-cockpit-remaining-capability-migration-v0-1`
- `npm run smoke:blank-state-review-entry-absorption-v0-1`
- `npm run smoke:agent-workplane-node-contract-v0-1`
- `npm run smoke:agent-workplane-panels-v0-1`
- `git diff --check`
- `git diff --cached --check`

## Completion

Cockpit decomposition cleanup is complete unless future historical-doc archival
is desired. Route split and retained Cockpit smokes were temporary and are now
retired after route removal.
