# Perspective Memory Reuse Packet v0.1 Dogfood

## Summary

This dogfood validates the Perspective Memory Reuse Packet v0.1 capability
merged in PR #550. The goal was to see whether selected Perspective Memory can
guide a concrete Codex task without reopening closed setup/prepare work or
adding new authority.

Result: the reuse packet and Codex Memory Brief were useful for keeping this PR
bounded to report, smoke, and package wiring. The largest friction was data
availability: `/tmp/augnes-demo.db` had the `perspective_memory_items` table but
zero persisted memory rows, so this run used deterministic fixture memory items
through the merged helper instead of live persisted memory.

## Environment

- Repo: `hynk-studio/augnes`
- Date: 2026-06-14
- Branch: `codex/perspective-memory-reuse-packet-dogfood`
- Prerequisite confirmed: PR #550 is merged into `main`
- Temp DB checked: `/tmp/augnes-demo.db`
- Live persisted memory item count in temp DB: 0
- Setup/prepare layer touched: no
- Runtime started: no
- MCP bridge started: no

## Dogfood Task

Task title:

Dogfood Perspective Memory Reuse Packet v0.1.

Task description:

Dogfood Perspective Memory Reuse Packet v0.1 and report whether it prevents
repeated setup/prepare work, preserves Augnes direction, identifies the next
implementation slice, and exposes stale or misleading memory.

Concrete dogfood task: Dogfood Perspective Memory Reuse Packet v0.1 and report whether it prevents repeated setup/prepare work, preserves Augnes direction, identifies the next implementation slice, and exposes stale or misleading memory.

## Reuse Packet / Brief Used

Live persisted memory items were unavailable in the allowed temp DB, so the
merged helper was dogfooded with deterministic fixture memory items. This was a
bounded fallback and is recorded as friction.

Selected fixture memory item IDs:

- `fixture-memory:setup-prepare-closed`
- `fixture-memory:reuse-return-contract`

Fixture item 1 `why_selected`:

Prevents repeating the closed setup/prepare dogfood and prepare usability work.

Fixture item 1 `reuse_boundary`:

Do not polish augnes:prepare, doctor, setup-local-demo, dogfood wording, or
lockfile guidance unless a real blocker appears.

Fixture item 2 `why_selected`:

Keeps the reuse loop focused on Codex return expectations instead of broad
architecture or persistence.

Fixture item 2 `reuse_boundary`:

Report-only validation unless dogfood reveals a real blocker; do not start
Return Binding, ranking, persistence, or runtime authority in this PR.

Structured packet JSON generated: yes.

Codex Memory Brief generated: yes.

Codex Memory Brief pasteability: acceptable. The fixture-backed brief was short
enough to paste into Codex and was more useful than the full packet JSON for
steering the work.

## Findings

The brief changed and constrained the work. It kept the PR shape to a dogfood
report, smoke coverage, and package script wiring. It also made the skipped
checks obvious: runtime, MCP bridge, provider/model checks, setup execution, and
browser/runtime validation were not needed for this report-only validation.

It prevented repeating closed setup/prepare work. The selected memory boundary
made it clear that setup/prepare was done enough and should not be polished in
this PR unless it blocked the dogfood, which it did not.

It preserved Augnes direction. The reuse loop stayed on the intended product
path: persisted perspective-memory item -> selected/retrieved memory -> reuse
packet -> Codex Memory Brief -> Codex output reports files, verification,
skipped checks, and remaining friction.

It identified the next implementation slice. Since no blocking reuse UX issue
was found in helper/static dogfood, the next recommended PR should be Return
Binding: `reuse_packet_id -> codex_run_ref -> returned_envelope_ref ->
follow-up candidate memory`.

It did not expose stale or misleading memory in the fixture-backed packet. It
did expose a practical gap: local dogfood did not have live persisted
perspective-memory seed data, so fixture-level validation was necessary.

## User-Facing Friction

- The route appears usable from static inspection, with task fields, item
  selection, per-item `why_selected`, per-item `reuse_boundary`, packet JSON,
  and Codex Memory Brief outputs.
- `why_selected` is essential. Without it, the brief can carry memory forward
  without enough task-specific justification.
- why_selected is essential for making the selected memory actionable rather
  than merely attached.
- The boundary fields prevented over-application of memory; they made it easier
  to avoid setup/prepare polish and runtime expansion.
- The demo/temp DB lacking live persisted memory items is the biggest practical
  friction. A future browser/runtime dogfood should use explicit temp seed data
  or a manual seed flow so the route can be validated with real persisted rows.
- Fixture-level dogfood is enough for this report/smoke PR, but not enough to
  prove the full route UX under live persisted data.

## Changed Files

- `reports/dogfood/2026-06-14-perspective-memory-reuse-packet-dogfood.md`
- `scripts/smoke-perspective-memory-reuse-packet-dogfood-report.mjs`
- `package.json`

## Verification

Passed locally:

- `npm run smoke:perspective-memory-items`
- `npm run smoke:perspective-memory-items-search`
- `npm run smoke:perspective-memory-items-review-workspace`
- `npm run smoke:perspective-memory-items-reuse-packet`
- `npm run smoke:perspective-memory-reuse-packet-dogfood-report`
- `npm run smoke:augnes-codex-bootstrap`
- `npm run smoke:augnes-codex-doctor`
- `npm run smoke:augnes-codex-prepare`
- `npm run smoke:augnes-operator-plugin-scaffold`
- `npm run smoke:augnes-operator-plugin-hooks`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## Skipped Checks With Concrete Reasons

- Runtime/browser validation skipped because this dogfood can be validated
  through helper/static checks and report structure; starting runtime was
  optional and not necessary.
- MCP bridge startup skipped because this dogfood does not need bridge behavior.
- MCP tools were not called because the boundary prohibits MCP tool calls.
- Provider/model checks were not run because the boundary prohibits
  provider/model and OpenAI API calls.
- Codex SDK was not used because the boundary prohibits Codex SDK execution.
- Setup execution and `npm run augnes:prepare -- --yes` were not run because
  this PR does not change setup/prepare behavior.
- Secrets and `~/.codex/config.toml` were not read or written because no
  credentialed behavior is needed.
- Default/user DB paths were not used; only `/tmp/augnes-demo.db` was inspected.

## Cleanup Status

No runtime process was started, so no runtime process needed to be stopped. No
MCP bridge process was started, so no bridge process needed to be stopped. The
temp DB was inspected read-only for persisted memory item availability. No
setup-generated changes were created.

## Remaining Friction

- The allowed temp DB had zero live persisted perspective-memory items, forcing
  fixture-backed dogfood.
- The route still needs a live-data browser/runtime dogfood before claiming the
  full user-facing flow is proven.
- The brief is useful, but its quality depends heavily on user-authored
  `why_selected` and `reuse_boundary` values.
- There is no Return Binding yet, so the reuse loop cannot link a packet to a
  later Codex run and returned envelope.

## Boundary

No setup/prepare polish was performed.

This PR does not add runtime authority, DB schema changes, migrations,
setup/prepare polish, provider/model calls, OpenAI API calls, Codex SDK
execution, MCP tool calls, GitHub mutation from scripts, proof/evidence writes,
perspective-memory persistence writes, reuse packet persistence, product
boundary creation, automatic synthesis, automatic memory creation, default/user
DB writes, hidden background daemons, or Augnes state commit/reject authority.

Boundary marker: no runtime authority, DB schema changes, migrations, setup/prepare polish, provider/model calls, OpenAI API calls, Codex SDK execution, MCP tool calls, GitHub mutation from scripts, proof/evidence writes, perspective-memory persistence writes, reuse packet persistence, product boundary creation, automatic synthesis, automatic memory creation, default/user DB writes, hidden background daemons, or Augnes state commit/reject authority.

## Next Recommended PR

If this dogfood passes verification, start Return Binding:

`reuse_packet_id -> codex_run_ref -> returned_envelope_ref -> follow-up
candidate memory`.

Return Binding chain: reuse_packet_id -> codex_run_ref -> returned_envelope_ref -> follow-up candidate memory.

If later live-data route dogfood finds a blocking reuse UX issue, do one thin
reuse UX fix before Return Binding.
