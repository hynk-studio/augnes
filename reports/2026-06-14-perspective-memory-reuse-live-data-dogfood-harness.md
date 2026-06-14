# Perspective Memory Reuse Live-Data Dogfood Harness Report

## Summary

Result: PASS.

This PR adds a small opt-in, temp-DB-safe seed harness for Perspective Memory
Reuse live-data dogfood. PR #557 showed the route
`/cockpit/perspective/memory-items/reuse` is usable with seeded persisted rows,
but manual seed setup is friction and is easy to omit. The harness makes the
seed setup repeatable without adding product persistence features.

The default explicit temp DB path is:

`/tmp/augnes-perspective-memory-reuse-live-data-dogfood/augnes.db`

## Harness Behavior

Run:

```bash
npm run perspective:memory-reuse-live-data-dogfood-seed -- --yes
```

The script:

- requires `--yes` before reset/seed
- refuses DB paths outside `/tmp`
- resets only the explicit temp DB path
- seeds deterministic persisted perspective-memory rows through existing helper
  paths
- prints seeded item IDs
- prints the next runtime command
- prints the reuse route `/cockpit/perspective/memory-items/reuse`
- does not start runtime
- does not start MCP bridge
- does not call MCP tools
- does not run provider/model calls
- does not use OpenAI API
- does not use Codex SDK
- does not mutate GitHub from scripts
- does not use default/user DB paths
- does not add DB schema or migrations

Seeded helper path:

1. `createPerspectiveMemoryProductPersistenceBoundaryRecord`
2. `createPerspectiveMemoryItemFromBoundaryRecord`

Seeded item IDs:

- `perspective-memory-item:reuse-live-data-accepted`
- `perspective-memory-item:reuse-live-data-follow-up`

Next runtime command printed by the harness:

```bash
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-perspective-memory-reuse-live-data-dogfood/augnes.db npm run dev -- --port 3000
```

## Boundary

This PR adds only an opt-in temp-DB-safe dogfood seed harness and static
smoke/docs/report coverage. It does not add runtime authority, DB schema
changes, migrations, setup/prepare polish, provider/model calls, OpenAI API
calls, Codex SDK execution, MCP tool calls, GitHub mutation from scripts,
proof/evidence writes, perspective-memory persistence writes outside the
explicit temp DB dogfood seed, reuse packet persistence, return binding
persistence, product boundary creation beyond deterministic seed fixture
requirements, automatic synthesis, automatic memory creation outside explicit
seed setup, default/user DB writes, hidden background daemons, or Augnes state
commit/reject authority.

This does not justify a persisted return binding table. PR #557 already found
that the route is usable and that repeated live-data validation should happen
before storage work.

## Verification

Required verification for this PR:

- `npm run smoke:perspective-memory-items`
- `npm run smoke:perspective-memory-items-search`
- `npm run smoke:perspective-memory-items-review-workspace`
- `npm run smoke:perspective-memory-items-reuse-packet`
- `npm run smoke:perspective-memory-reuse-return-binding`
- `npm run smoke:perspective-memory-reuse-return-binding-dogfood-report`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-report`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-seed`
- `npm run smoke:augnes-codex-bootstrap`
- `npm run smoke:augnes-codex-doctor`
- `npm run smoke:augnes-codex-prepare`
- `npm run smoke:augnes-operator-plugin-scaffold`
- `npm run smoke:augnes-operator-plugin-hooks`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## Next Recommended PR

Rerun live-data browser/runtime reuse validation using the harness. Only
discuss persisted return binding storage if repeated live-data dogfood produces
a concrete product reason.
