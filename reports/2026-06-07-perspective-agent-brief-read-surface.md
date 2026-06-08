# Perspective Agent Brief Read Surface Validation

Date: 2026-06-08

Branch: `codex/perspective-agent-brief-read-surface-v0-1`

Commit: `0ce8e73fb91f4488d80ab96a43739dbdc994ef79`

## Preflight Result

PASS. PR #448, "Simplify Perspective workbench with Temporal Underlay projection", is merged into `main` with merged timestamp `2026-06-08T00:38:58Z`.

`main` was fast-forwarded before branch creation and contains:

- projection builders from PR #447
- Perspective workbench / Temporal Underlay UI from PR #448
- `components/augnes-cockpit.tsx` using `buildPerspectiveWorkbenchProjection`
- conditional packet preview rendering from PR #448

## Files Changed

- `types/perspective-agent-brief.ts`
- `lib/readonly-api/perspective-agent-brief.ts`
- `app/api/augnes/read/perspective-agent-brief/route.ts`
- `docs/PERSPECTIVE_AGENT_BRIEF_READ_SURFACE_V0_1.md`
- `scripts/smoke-perspective-agent-brief-read-surface.mjs`
- `package.json`
- `reports/2026-06-07-perspective-agent-brief-read-surface.md`
- Existing smoke allowlists for the exact new read-only route:
  - `scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs`
  - `scripts/smoke-perspective-capsule-contract.mjs`
  - `scripts/smoke-perspective-temporal-spatial-projection-builders.mjs`
  - `scripts/smoke-readonly-api-route-access-guard.mjs`
  - `scripts/smoke-readonly-api-route-auth-scope-adapter-boundary.mjs`
  - `scripts/smoke-readonly-api-route-auth-source-selection.mjs`
  - `scripts/smoke-readonly-api-route-response-shape-boundary.mjs`

## Route Summary

Added:

`GET /api/augnes/read/perspective-agent-brief`

Supported query params:

- `scope=project:augnes`
- `source=sample:chatgpt | sample:codex`
- `selected_node_id=<existing preview node id>` optional

The route requires:

- `x-augnes-local-readonly: perspective-agent-brief-v0.1`

Unsupported source values fail closed with `400 unsupported_source`.

Unknown selected node ids fail closed with `400 unknown_selected_node`.

## Response Shape Summary

Success responses include:

- `response_version: perspective_agent_brief_read.v0.1`
- `boundary_class: read_only_local_perspective_agent_brief`
- `meta` with route id, route family, scope refs, source query, selected node id, and read-only authority flags
- `brief` from `buildPerspectiveAgentBrief`
- bounded fixture `source_refs`
- local read authority boundary notes

The brief excludes full packet text, raw source text, packet textarea content, full diagnostics, FormationReceipt body, provider/model outputs, API keys, tokens, and billing data.

## API Validation

Setup:

- `AUGNES_DB_PATH=/tmp/augnes-perspective-agent-brief.db npm run db:reset`
- `AUGNES_DB_PATH=/tmp/augnes-perspective-agent-brief.db npm run db:migrate`
- `AUGNES_DB_PATH=/tmp/augnes-perspective-agent-brief.db npm run demo:seed`
- `AUGNES_DB_PATH=/tmp/augnes-perspective-agent-brief.db npx next dev -H 127.0.0.1 -p 3000`

Results:

- `sample:chatgpt` whole constellation: PASS, 200, 7 nodes, 8 edges
- `sample:chatgpt` selected `node.sample_chatgpt.product_concept`: PASS, 200, related temporal nodes `decision`, `current_view`
- `sample:codex` whole constellation: PASS, 200, 7 nodes, 8 edges
- unsupported source: PASS, 400 `unsupported_source`
- unknown selected node: PASS, 400 `unknown_selected_node`
- forbidden payload token scan: PASS, no full packet text, raw source text, packet textarea marker, `packet_text`, GitHub/OpenAI endpoints, env/token markers

Browser validation:

- Local app root opened in the in-app browser at `http://127.0.0.1:3000/`: PASS
- Browser console warnings/errors on app root: PASS, none
- Direct in-app browser navigation to the API route was blocked by the browser client with `net::ERR_BLOCKED_BY_CLIENT`; API route validation was completed through local GET requests with the required marker header.

Console/traffic summary:

- Dev-server traffic observed was local app/API GET traffic only.
- No provider/model/GitHub/OpenAI/external/billing traffic was observed.

## Tests Run

- `npm run typecheck` PASS
- `npm run smoke:perspective-ingest-constellation-preview` PASS
- `npm run smoke:perspective-temporal-spatial-projection-builders` PASS
- `npm run smoke:cockpit-perspective-workbench-temporal-underlay` PASS
- `npm run smoke:perspective-agent-brief-read-surface` PASS
- `npm run smoke:perspective-capsule-contract` PASS
- `npm run smoke:readonly-api-route-access-guard` PASS
- `npm run smoke:readonly-api-route-response-shape-boundary` PASS
- `npm run smoke:readonly-api-route-auth-scope-adapter-boundary` PASS
- `npm run smoke:readonly-api-route-auth-source-selection` PASS
- `npm run build` PASS
- `git diff --check` PASS
- `git diff --cached --check` PASS

## Skipped Checks

- `npm run lint`: skipped because `package.json` does not define a `lint` script.
- `npm test`: skipped because `package.json` does not define a `test` script.

## Blockers

None.

## Next Suggested Implementation PR

`Design Perspective ingress admission model for external/OAuth sources`
