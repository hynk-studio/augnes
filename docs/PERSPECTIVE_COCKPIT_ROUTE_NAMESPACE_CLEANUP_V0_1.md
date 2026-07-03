# Perspective Cockpit Route Namespace Cleanup v0.1

## Status And Scope

Status: narrow route namespace cleanup after Cockpit Route Removal v0.1,
Cockpit Post-Removal Cleanup v0.1, and the public-facing docs refresh.

This cleanup moves remaining live `app/cockpit/perspective/**` routes into the
current `/perspective/...` namespace. It does not redesign the product, delete
Perspective Memory functionality, add authority, or revive Legacy Cockpit.

## Why This Follows Route Removal

Cockpit Route Removal v0.1 had already removed the Legacy Cockpit root product
surface:

- `/cockpit`
- `components/augnes-cockpit.tsx`
- `components/workplane/legacy-cockpit-compatibility-panel.tsx`
- active `legacy_cockpit_compatibility` Workplane panel/node identity

Cockpit Post-Removal Cleanup v0.1 then retired retained-route smokes. PR #946
refreshed public-facing docs around the current structure: Blank State, Agent
Workplane, GuideBrief, and the Provider / Runner / Tool Layer.

The remaining `app/cockpit/perspective/**` subroutes could still make repo
readers think Cockpit remained a live product namespace. These routes are
Perspective surfaces, so their current route home is `/perspective/...`.

## Routes Moved

Live route files moved from `app/cockpit/perspective/**` to
`app/perspective/**`:

- `/perspective/memory-items`
- `/perspective/memory-items/search`
- `/perspective/memory-items/review`
- `/perspective/memory-items/reuse`
- `/perspective/memory-boundary-review-inbox`
- `/perspective/memory-review-queue/local`
- `/perspective/codex-former/local-adapter-operator-flow`
- `/perspective/codex-former/capture-review-inbox-fixture`
- `/perspective/codex-former/constellation-preview-fixture`
- `/perspective/codex-former/local-adapter-snapshot-fixture`
- `/perspective/codex-former/local-adapter-validate-result-fixture`
- `/perspective/codex-former/session-perspective-panel-fixture`

Colocated surface modules and CSS files moved with their route pages where they
existed.

## Functionality Preserved

Perspective Memory functionality remains intact:

- memory item dashboard
- search workspace
- review workspace
- reuse workspace
- memory boundary review inbox
- local memory review queue
- Codex-former local adapter operator flow
- related fixture/readback surfaces

Existing API routes and persistence semantics are unchanged.

## Historical Path Handling

Old `/cockpit/perspective/...` paths are historical/legacy references only.
Live product source should use `/perspective/...` and should not import from
`app/cockpit/perspective/**`.

Historical docs and reports may still mention old Cockpit paths when they are
clearly labeled as historical, removed, or legacy.

## Authority Boundary

This cleanup adds no API route, API write route, server action, provider/OpenAI
call, GitHub call, GitHub actuation, Codex execution, runner execution, runner
tick, runner recovery, runner scheduling, product DB write, proof/evidence
write, durable memory apply, Perspective apply, delta auto-apply,
localStorage/sessionStorage write, merge, publish, retry, replay, or deploy
authority.

Legacy Cockpit remains removed as a product surface.

## Validation

Required validation:

- `npm run typecheck`
- `npm run smoke:perspective-cockpit-route-namespace-cleanup-v0-1`
- `npm run smoke:cockpit-route-removal-v0-1`
- `npm run smoke:cockpit-post-removal-cleanup-v0-1`
- `npm run smoke:cockpit-route-removal-readiness-v0-1`
- `npm run smoke:workplane-state-proposal-review-v0-1`
- `npm run smoke:blank-state-review-entry-absorption-v0-1`
- `npm run smoke:agent-workplane-panels-v0-1`
- `npm run smoke:agent-workplane-node-contract-v0-1`
- `git diff --check`
- `git diff --cached --check`
