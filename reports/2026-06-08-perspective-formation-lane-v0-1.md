# Perspective Formation Lane v0.1

Date: 2026-06-08

## Summary

This report closes a docs/report/smoke/package-only slice that defines
Perspective Formation Lane v0.1. The lane separates `codex_worker` repo
execution from a read-only `codex_perspective_former` formation lane and keeps
Augnes Core plus the user as the durable authority surfaces.

## Why This Follows Current Repo Direction

- `AGENTS.md` keeps Codex in the repo worker role and keeps durable decisions
  outside Codex authority.
- `docs/AUTHORITY_MATRIX.md` keeps Augnes Core as the source-of-truth authority
  for committed state, gates, proof/state routes, and validation.
- `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md` already treats work traces,
  evidence rows, proof-only action records, session traces, skipped reasons,
  and PR refs as reviewable continuity material.
- `docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md` already defines
  Perspective/Handoff Capsules as evidence-pointer-based,
  non-authoritative review material.
- The reviewed Codex template promotion path already approves only explicitly
  scoped docs/report/smoke/package-only PR work, with ChatGPT review and user
  merge decision preserved.

## Files Changed

- `docs/PERSPECTIVE_FORMATION_LANE_V0_1.md`
- `reports/2026-06-08-perspective-formation-lane-v0-1.md`
- `scripts/smoke-perspective-formation-lane-v0-1.mjs`
- `package.json`
- `scripts/smoke-perspective-reviewed-codex-template-promotion-path.mjs`
- `scripts/smoke-perspective-reviewed-manual-agent-brief-codex-template.mjs`
- `scripts/smoke-perspective-agent-brief-read-surface.mjs`
- `scripts/smoke-perspective-temporal-spatial-projection-builders.mjs`

The existing smoke edits are narrow allowlist-only updates required by the
requested validation bundle.

## Authority Boundary

This slice defines a lane only. It adds no runtime route, no `app/api` change,
no DB schema or migration, no persistence, no graph DB behavior, no source
ingress, no OAuth, no provider/model/API calls, no proof/evidence/readiness
writes, no ChatGPT Apps integration, no Codex plugin integration, no Codex SDK
execution, no product UI, and no browser-facing behavior.

Codex codes/tests/opens PR only when explicitly scoped. ChatGPT reviews. The
user decides accept, reject, supersede, and merge. Augnes Core remains the
durable authority for committed state, gates, proof/state routes, and decision
validation.

## Validation Plan

- `npm run typecheck`
- `npm run smoke:perspective-formation-lane-v0-1`
- `npm run smoke:perspective-reviewed-codex-template-promotion-path`
- `npm run smoke:perspective-reviewed-manual-agent-brief-codex-template`
- `npm run smoke:perspective-agent-brief-read-surface`
- `npm run smoke:perspective-temporal-spatial-projection-builders`
- `npm run smoke:perspective-ingest-constellation-preview`
- `git diff --check`
- `git diff --cached --check`
- `npm run build`

Browser validation may be skipped because this is docs/report/smoke/package-only
with no UI or route changes.

`npm run lint` may be skipped because `package.json` does not define a lint
script. `npm test` may be skipped because `package.json` does not define a test
script.

## What Is Not Implemented

- No Formation Input Bundle runtime builder.
- No Perspective Candidate runtime builder.
- No route, API, DB, migration, persistence, graph DB, or source ingress.
- No OAuth, provider/model/API calls, or GitHub mutation beyond scoped PR
  workflow.
- No ChatGPT Apps implementation, Codex plugin implementation, or Codex SDK
  execution.
- No proof/evidence/readiness writes.
- No Core-gated accept/reject/supersede route.
- No product UI, Cockpit behavior, Agent Brief route behavior, local manual
  preview route behavior, packet section order, Event Rail, graph topology,
  node id/type, or edge id/type change.

## Next Recommended PR Title

Add pure local Perspective Formation Input Bundle builder
