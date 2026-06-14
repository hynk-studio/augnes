# Perspective Memory Reuse Live-Data Dogfood Browser Validation

## Summary

Result: PASS with follow-up.

The live route `/cockpit/perspective/memory-items/reuse` was usable with
seeded persisted memory rows in the explicit temp DB path
`/tmp/augnes-perspective-memory-reuse-live-data-dogfood/augnes.db`.

The route avoided the fixture-backed limitation found in PR #551 and PR #556:
the UI loaded persisted rows through the runtime API, selected seeded rows,
accepted task title/description, accepted why_selected and reuse_boundary
notes, generated structured packet JSON, and generated a Codex Memory Brief.

No product/helper code changed. No route blocker was found.

Next recommended PR: do not add a persisted return binding table yet. Do the
smallest thin UX/data fix first: add an opt-in, temp-DB-safe seeded live-data
reuse dogfood harness or compact brief metadata so future route validation is
repeatable without manual seed setup.

## Environment

- Date: 2026-06-14
- Repository: `hynk-studio/augnes`
- Prerequisite: PR #556 was merged into `main`.
- Target route: `/cockpit/perspective/memory-items/reuse`
- Explicit temp DB path:
  `/tmp/augnes-perspective-memory-reuse-live-data-dogfood/augnes.db`
- Runtime command:
  `env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-perspective-memory-reuse-live-data-dogfood/augnes.db npm run dev -- --port 3000`
- Browser validation tool: isolated Playwright fallback against local Google
  Chrome. The in-app Browser connection was unavailable during this run.
- Runtime URL: `http://localhost:3000`

## Seeded Persisted Memory Rows

The temp DB was reset with `npm run db:reset`, then seeded through existing
product helper paths:

1. Insert deterministic
   `perspective_memory_product_persistence_boundary_records` rows into the
   explicit temp DB.
2. Call the existing
   `createPerspectiveMemoryItemFromBoundaryRecord` store helper.
3. Read rows through the existing `/api/perspective/memory/items?limit=100`
   API route from the live runtime.

Seeded rows visible in API and route:

- `perspective-memory-item:reuse-live-data-accepted`
  - title: `Return Binding dogfood keeps next step bounded`
  - validation: `PASS`
  - source refs include `pr:556`, `report:return-binding-dogfood`, and
    `seed:accepted`
  - risk notes include `0 warnings` and
    `do not skip live persisted-row validation`
  - carry-forward question:
    `Does the live reuse route produce a usable Codex Memory Brief?`
- `perspective-memory-item:reuse-live-data-follow-up`
  - title: `Persisted rows are required for route-level reuse confidence`
  - validation: `PASS with follow-up`
  - source refs include `pr:556`, `report:return-binding-dogfood`, and
    `seed:follow-up`
  - risk notes include
    `PASS with follow-up caveat: fixture-backed validation can over-claim route usability`
    and `warning-ish item should remain visible in reuse packet`
  - carry-forward question:
    `Should the next PR be a thin UX/data fix instead of return binding persistence?`

## Browser Flow Validated

- route loads: yes
- seeded rows visible: yes, both seeded persisted memory rows appeared
- select seeded memory items: yes, selected count reached 2
- task title entered: `Live-data reuse dogfood with seeded memory rows`
- task description entered:
  `Validate the route-level reuse workflow using persisted perspective-memory rows in an explicit temp DB before considering return binding persistence.`
- why_selected entered for each selected item: yes
- reuse_boundary entered for each selected item: yes
- structured packet JSON generated: yes
- structured packet JSON includes selected seeded item IDs: yes
- structured packet JSON had `missing_memory_item_ids: []`
- Codex Memory Brief generated: yes
- Codex Memory Brief includes task title: yes
- Codex Memory Brief includes memory titles: yes
- Codex Memory Brief includes why relevant notes derived from why_selected: yes
- Codex Memory Brief includes boundary notes derived from reuse_boundary: yes
- Codex Memory Brief includes Return Expectations: yes
- Codex Memory Brief length: 3,473 characters for two selected rows
- copy buttons present: yes, packet JSON and brief copy buttons were present
- responsive sanity: 1280px, 768px, and 390px viewports had no horizontal
  overflow

## Structured Packet JSON Result

The generated packet selected both seeded memory items:

- `perspective-memory-item:reuse-live-data-accepted`
- `perspective-memory-item:reuse-live-data-follow-up`

The selected items preserved:

- memory title
- source refs
- risk notes
- carry-forward questions
- why_selected
- reuse_boundary
- `validation:PASS`
- `validation:PASS with follow-up`

The generated packet authority boundary kept:

- `deterministic_local_builder: true`
- `memory_items_read: true`
- `reuse_packet_created: true`
- `codex_memory_brief_created: true`
- `memory_item_created: false`
- `memory_item_mutated: false`
- `perspective_memory_persistence_write_created: false`
- `reuse_packet_persisted: false`
- `db_schema_changed: false`
- `product_boundary_record_created: false`
- `proof_evidence_written: false`
- `augnes_state_commit_reject_created: false`
- `provider_model_call_created: false`
- `openai_api_call_created: false`
- `codex_sdk_execution_created: false`
- `mcp_tool_call_created: false`
- `github_mutation_created: false`
- `runtime_started: false`
- `mcp_bridge_started: false`
- `hidden_background_daemon_created: false`
- `automatic_synthesis_created: false`

## Codex Memory Brief Result

The Codex Memory Brief was usable for operator review. It included the task
title, task description, both memory titles, memory summaries, derived tags,
why relevant notes, boundary notes, Reuse Instructions, Return Expectations,
and Authority Boundary.

The brief stayed short enough for a two-row handoff. Remaining friction: it is
already 3,473 characters with two selected rows, so future larger selections
may need compact brief metadata, a selected-count/length hint, or an optional
compact mode.

Forbidden authority did not appear as enabled behavior. The brief explicitly
said no automatic synthesis, no automatic memory creation, no
perspective-memory persistence writes, no DB schema or migration, no reuse
packet persistence table, no product boundary record creation, no
proof/evidence writes, no Augnes state commit/reject, no runtime startup, no
MCP bridge startup, no MCP tool calls, no provider/model calls, no OpenAI API
calls, no Codex SDK execution, no GitHub API mutation from scripts, and no
hidden background daemon.

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

- Did seeded live data make the route usable? Yes. The route-level workflow was
  usable against persisted rows in the explicit temp DB.
- Did the route avoid the fixture-backed limitation found in PR #551/#556? Yes.
  The route loaded real persisted rows through the runtime API instead of
  relying on helper-only fixtures.
- Was why_selected still essential? Yes. Without why_selected, selected memory
  would be attached without task-specific justification. With it, the Codex
  Memory Brief explained why each memory belonged in the handoff.
- Did reuse_boundary prevent over-application? Yes. The boundary text carried
  explicit limits into the packet and brief, including no runtime authority,
  memory creation, or persistence beyond explicit temp seed rows.
- Was the Codex Memory Brief short enough to use? Yes for two rows, with
  follow-up friction around larger selections.
- Did the route expose any stale/misleading memory issue? No stale memory issue
  appeared. The PASS-with-follow-up row stayed visibly caveated.
- Did browser/runtime validation reveal a blocker? No product blocker was
  found. One generic 404 browser console resource message appeared during page
  load but did not block the route, API, packet, or brief. No unexpected
  external requests were observed.
- Should the next PR be persisted return binding table or another thin UX/data
  fix? Another thin UX/data fix. This dogfood did not produce a concrete
  product reason for return binding persistence now.

## Verification

Passed during live browser/runtime validation:

- `env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-perspective-memory-reuse-live-data-dogfood/augnes.db npm run db:reset`
- seeded persisted perspective-memory rows through existing
  `createPerspectiveMemoryItemFromBoundaryRecord` helper path
- `curl -sS 'http://localhost:3000/api/perspective/memory/items?limit=10'`
- `curl -sI http://localhost:3000/cockpit/perspective/memory-items/reuse`
- `env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-perspective-memory-reuse-live-data-dogfood/augnes.db npm run dev -- --port 3000`
- isolated Playwright fallback route interaction against
  `http://localhost:3000/cockpit/perspective/memory-items/reuse`

Passed repository verification:

- `npm run browser:perspective-memory-reuse-live-data-dogfood`
- `npm run smoke:perspective-memory-items`
- `npm run smoke:perspective-memory-items-search`
- `npm run smoke:perspective-memory-items-review-workspace`
- `npm run smoke:perspective-memory-items-reuse-packet`
- `npm run smoke:perspective-memory-reuse-return-binding`
- `npm run smoke:perspective-memory-reuse-return-binding-dogfood-report`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-report`
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
- MCP bridge startup skipped because route reuse validation did not need bridge
  behavior.
- Augnes MCP tool calls skipped because no Augnes MCP bridge was started and no
  product MCP behavior changed.
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
- Temp Playwright fallback install removed: yes.
- Temp DB remains for audit: yes,
  `/tmp/augnes-perspective-memory-reuse-live-data-dogfood/augnes.db`.
- Temp DB size after validation: 778,240 bytes.
- No default/user DB path was read or written.

## Remaining Friction

- The live route is usable, but future validation still needs repeatable
  seeded-row setup. Manual seeding is too easy to omit.
- The Codex Memory Brief was usable at two rows, but larger selections may need
  compact brief metadata or an optional compact mode.
- One non-blocking generic browser console 404 resource message appeared during
  page load and should be watched if it repeats in future browser reports.
- The route did not reveal a concrete product reason for a persisted return
  binding table.

## Boundary

This PR may start local runtime only for browser validation against an explicit
temp DB path and must stop it afterward.

This PR does not add runtime authority, DB schema changes, migrations beyond
existing setup/seed paths, setup/prepare polish, provider/model calls, OpenAI
API calls, Codex SDK execution, Augnes MCP tool calls, GitHub mutation from
scripts, proof/evidence writes, perspective-memory persistence writes outside
the explicit seeded temp DB dogfood setup, reuse packet persistence, return
binding persistence, product boundary creation beyond fixture/seed
requirements, automatic synthesis, automatic memory creation outside the
explicit seed setup, default/user DB writes, hidden background daemons, or
Augnes state commit/reject authority.

No product/helper code changed because report/browser validation was sufficient
and no route blocker was found.

## Next Recommended PR

Do not add a persisted return binding table yet.

Next recommended PR: the smallest thin UX/data fix revealed by live route
dogfood. Prefer an opt-in, temp-DB-safe seeded live-data reuse dogfood harness
or compact brief metadata so future route validation is repeatable and
operator-friendly before storage work.
