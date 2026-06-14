# Perspective Memory Reuse Live-Data Dogfood Harness v0.1

## Purpose

PR #557 validated `/cockpit/perspective/memory-items/reuse` with seeded
persisted perspective-memory rows in an explicit temp DB. The route was usable,
but manual seed setup is friction and is easy to omit. This harness makes the
seed step repeatable without adding product persistence features.

## Command

The default explicit temp DB path is:

`/tmp/augnes-perspective-memory-reuse-live-data-dogfood/augnes.db`

Seed the temp DB:

```bash
npm run perspective:memory-reuse-live-data-dogfood-seed -- --yes
```

The script requires `--yes` before it resets or seeds the temp DB. It refuses
paths outside `/tmp`.

After seeding, the script prints the seeded item IDs, the next runtime command,
and the reuse route:

```bash
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-perspective-memory-reuse-live-data-dogfood/augnes.db npm run dev -- --port 3000
```

Open:

`/cockpit/perspective/memory-items/reuse`

## Seeded Rows

The harness seeds deterministic persisted perspective-memory rows through
existing helper paths:

1. `createPerspectiveMemoryProductPersistenceBoundaryRecord`
2. `createPerspectiveMemoryItemFromBoundaryRecord`

Seeded item IDs:

- `perspective-memory-item:reuse-live-data-accepted`
- `perspective-memory-item:reuse-live-data-follow-up`

The seeded rows preserve an accepted item, a PASS-with-follow-up warning-ish
item, source refs, risk notes, carry-forward questions, useful titles, and
summaries.

## Boundary

This harness does not start runtime, does not start MCP bridge, does not call
MCP tools, does not run provider/model calls, does not use OpenAI API, does not
use Codex SDK, does not mutate GitHub from scripts, does not use default/user
DB paths, and does not add DB schema or migrations.

It only creates deterministic dogfood seed rows inside the explicit temp DB
after opt-in. It does not create reuse packet persistence, return binding
persistence, product persistence features, automatic synthesis, automatic
memory creation outside explicit seed setup, proof/evidence writes, hidden
background daemons, or Augnes state commit/reject authority.

This harness does not justify a persisted return binding table. After the
harness exists, the next PR should rerun live-data browser/runtime reuse
validation using the harness. Only discuss persisted return binding storage if
repeated live-data dogfood produces a concrete product reason.
