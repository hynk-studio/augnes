# Perspective Memory Reuse Live-Data Harness Rerun Browser Validation

## Summary

Result: PASS with follow-up.

Using the PR #558 opt-in seed harness made live-data route validation
repeatable and operator-friendly. The harness removed the manual seed friction
found in PR #557: without hand-writing rows or using helper-only fixtures, it
created the two deterministic persisted perspective-memory rows, printed the
seeded item IDs, printed the runtime command, and printed the route to open.

The route `/cockpit/perspective/memory-items/reuse` remained usable against the
explicit temp DB:

`/tmp/augnes-perspective-memory-reuse-harness-rerun/augnes.db`

No product/helper code changed. No route blocker was found.

Next recommended PR: compact Codex Memory Brief metadata or a selected-count /
length hint. This rerun did not produce a concrete product reason for a
persisted return binding table.

## Environment

- Date: 2026-06-14
- Repository: `hynk-studio/augnes`
- Prerequisite: PR #558 was merged into `main`.
- Target route: `/cockpit/perspective/memory-items/reuse`
- Explicit temp DB path:
  `/tmp/augnes-perspective-memory-reuse-harness-rerun/augnes.db`
- Seed harness command:
  `npm run perspective:memory-reuse-live-data-dogfood-seed -- --yes --db-path /tmp/augnes-perspective-memory-reuse-harness-rerun/augnes.db`
- Runtime command:
  `env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-perspective-memory-reuse-harness-rerun/augnes.db npm run dev -- --port 3000`
- Browser validation tool: isolated temp Playwright install against local
  Google Chrome.
- Runtime URL: `http://localhost:3000`

## Harness Checks

- `--yes` refusal check: passed. Running the harness without `--yes` exited
  `1` before seeding, printed the explicit temp DB path, printed the next
  runtime command, and did not reset or seed.
- `--yes` seed check: passed. Running the harness with `--yes` seeded the
  explicit temp DB and printed both seeded item IDs.
- symlink/path safety boundary: preserved by the PR #558 harness. The rerun
  used the hardened harness with lstat/realpath checks for DB path, SQLite
  artifact symlinks, and real parent containment under the temp root.
- default/user DB paths: not used.
- runtime start: not started by the harness; started manually only for browser
  validation with the explicit temp DB path.

## Seeded Persisted Memory Rows

Seeded rows confirmed in SQLite and through the live runtime API:

- `perspective-memory-item:reuse-live-data-accepted`
  - title: `Return Binding dogfood keeps next step bounded`
  - validation: `PASS`
- `perspective-memory-item:reuse-live-data-follow-up`
  - title: `Persisted rows are required for route-level reuse confidence`
  - validation: `PASS with follow-up`

## Browser Flow Validated

- route loads: yes
- seeded rows visible: yes
- selected count 2: yes
- task title entered: `Harness rerun live-data reuse dogfood`
- task description entered:
  `Rerun route-level Perspective Memory Reuse validation using the PR #558 opt-in temp-DB-safe seed harness.`
- why_selected entered for both rows: yes
- reuse_boundary entered for both rows: yes
- structured packet JSON generated: yes
- structured packet JSON included both seeded item IDs: yes
- packet JSON had `missing_memory_item_ids: []`
- Codex Memory Brief generated: yes
- Codex Memory Brief length: 3,461 characters for two selected rows
- copy buttons present: yes
- forbidden-control absence: yes
- no unexpected external requests: yes
- responsive sanity: 1280px, 768px, and 390px viewports had no horizontal
  overflow

One generic non-blocking 404 browser console resource message appeared during
page load, matching the prior live-data report pattern. It did not block route
load, API reads, packet JSON generation, brief generation, copy buttons, or
responsive sanity.

## Packet And Brief Result

The structured packet JSON included:

- `perspective-memory-item:reuse-live-data-accepted`
- `perspective-memory-item:reuse-live-data-follow-up`
- `missing_memory_item_ids: []`

The Codex Memory Brief remained usable. It included the task title, task
description, both seeded memory titles, why relevant notes, boundary notes,
Reuse Instructions, Return Expectations, and Authority Boundary.

The brief is still long enough at two rows that larger selections should get a
compact metadata affordance before storage work. A selected-count / length hint
or compact brief metadata still looks like the smallest thin UX fix.

## Forbidden-Control Absence

The route exposed no status mutation / create memory / persistence write / Core
/ runtime injection / provider / MCP / GitHub mutation controls for this reuse
flow.

Validated absent selectors:

- `data-augnes-create-perspective-memory-item`
- `data-augnes-send-to-core`
- `data-augnes-create-core-decision`
- `data-augnes-auto-inject-runtime`
- `data-augnes-auto-promote`
- `data-augnes-provider-model-enrich`
- `data-augnes-github-mutation`
- `data-augnes-commit-state-entry`

## Findings

- Did the harness remove the manual seed friction from PR #557? Yes. The
  repeatable command seeded the expected rows and printed the operator's next
  command and route.
- Did the harness preserve temp DB safety boundaries? Yes. The rerun used an
  explicit `/tmp` DB path, required `--yes`, preserved the PR #558 symlink/path
  safety boundary, and did not touch default/user DB paths.
- Were seeded rows correct? Yes. The accepted and PASS-with-follow-up rows were
  present with the expected IDs and titles.
- Was route validation easier to repeat? Yes. The harness reduced setup to one
  guarded seed command plus the printed runtime command.
- Did the Codex Memory Brief remain usable? Yes, for two rows.
- Did larger brief metadata still look like the next thin UX fix? Yes.
- Did this produce any concrete product reason for a persisted return binding
  table? No.
- Should next PR be compact brief metadata, harness polish, or storage?
  Compact brief metadata or selected-count / length hint. Not storage.

## Verification

Passed during live browser/runtime validation:

- no-`--yes` refusal check exited `1` before seeding
- `env -u OPENAI_API_KEY npm run perspective:memory-reuse-live-data-dogfood-seed -- --yes --db-path /tmp/augnes-perspective-memory-reuse-harness-rerun/augnes.db`
- SQLite row check for both seeded item IDs
- `curl -sS 'http://localhost:3000/api/perspective/memory/items?limit=10'`
- `curl -sI http://localhost:3000/cockpit/perspective/memory-items/reuse`
- `env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-perspective-memory-reuse-harness-rerun/augnes.db npm run dev -- --port 3000`
- isolated Playwright route interaction against
  `http://localhost:3000/cockpit/perspective/memory-items/reuse`

Required repository verification for this PR:

- `npm run smoke:perspective-memory-items`
- `npm run smoke:perspective-memory-items-search`
- `npm run smoke:perspective-memory-items-review-workspace`
- `npm run smoke:perspective-memory-items-reuse-packet`
- `npm run smoke:perspective-memory-reuse-return-binding`
- `npm run smoke:perspective-memory-reuse-return-binding-dogfood-report`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-report`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-seed`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-harness-rerun-report`
- `npm run smoke:augnes-codex-bootstrap`
- `npm run smoke:augnes-codex-doctor`
- `npm run smoke:augnes-codex-prepare`
- `npm run smoke:augnes-operator-plugin-scaffold`
- `npm run smoke:augnes-operator-plugin-hooks`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## Skipped Checks With Concrete Reasons

- Default/user DB validation skipped because this PR must not use default/user
  DB paths.
- Symlink escape mutation checks skipped in this rerun because PR #558 already
  added and verified the hardened seed harness; this run exercised that harness
  on the explicit temp DB path.
- MCP bridge startup skipped because route reuse validation did not need bridge
  behavior.
- MCP tool calls skipped because no MCP bridge was started and no product MCP
  behavior changed.
- Provider/model checks skipped because the boundary prohibits provider/model
  calls.
- OpenAI API calls skipped because the boundary prohibits OpenAI API calls.
- Codex SDK execution skipped because the boundary prohibits Codex SDK
  execution.
- GitHub mutation from scripts skipped because scripts must not mutate GitHub.
- Setup/prepare polish skipped because no setup/prepare behavior changed.
- Secrets and `~/.codex/config.toml` reads skipped because no credentialed
  behavior was needed.

## Cleanup Status

- Runtime stopped: yes.
- No listener status: no process remained listening on TCP port 3000 after
  cleanup.
- MCP bridge stopped: not applicable; no MCP bridge was started.
- Temp Playwright install removed: yes.
- Temp DB remains for audit: yes,
  `/tmp/augnes-perspective-memory-reuse-harness-rerun/augnes.db`.
- Temp DB size after validation: 778,240 bytes.
- No default/user DB path was read or written.

## Boundary

This PR started local runtime only for browser validation against an explicit
temp DB path and stopped it afterward.

This PR does not add runtime authority, DB schema changes, migrations beyond
existing setup/seed paths, setup/prepare polish, provider/model calls, OpenAI
API calls, Codex SDK execution, MCP tool calls, GitHub mutation from scripts,
proof/evidence writes, perspective-memory persistence writes outside explicit
temp DB seed dogfood setup, reuse packet persistence, return binding
persistence, product boundary creation beyond deterministic seed fixture
requirements, automatic synthesis, automatic memory creation outside explicit
seed setup, default/user DB writes, hidden background daemons, or Augnes state
commit/reject authority.

No product/helper code changed because report/browser validation was sufficient
and no blocker was found.

## Next Recommended PR

Prefer compact Codex Memory Brief metadata or a selected-count / length hint.
Only discuss persisted return binding storage if repeated live-data dogfood
produces a concrete product reason.
