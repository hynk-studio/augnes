# Perspective Memory Reuse Packet v0.1

## Summary

This PR adds a deterministic local reuse workspace that turns selected persisted
perspective-memory items into a structured reuse packet and copyable Codex
Memory Brief.

The behavior is intentionally not automated behavior. It reads existing items,
lets the user add task-local reuse context, and produces local text artifacts
only.

## Files Changed

- `lib/perspective-ingest/perspective-memory-item-reuse-packet.ts`
- `app/cockpit/perspective/memory-items/reuse/page.tsx`
- `app/cockpit/perspective/memory-items/reuse/perspective-memory-item-reuse-workspace-surface.tsx`
- `app/cockpit/perspective/memory-items/reuse/perspective-memory-item-reuse-workspace-surface.module.css`
- `app/cockpit/perspective/memory-items/perspective-memory-items-surface.tsx`
- `app/cockpit/perspective/memory-items/search/perspective-memory-item-search-surface.tsx`
- `app/cockpit/perspective/memory-items/review/perspective-memory-item-review-workspace-surface.tsx`
- `scripts/smoke-perspective-memory-items-reuse-packet.mjs`
- `docs/PERSPECTIVE_MEMORY_REUSE_PACKET_V0_1.md`
- `reports/2026-06-14-perspective-memory-reuse-packet.md`
- `package.json`

## Product Goal

The target loop is:

persisted perspective-memory item -> selected/retrieved memory -> reuse packet
-> Codex Memory Brief -> later Codex output returns with changed files,
verification, skipped checks, and remaining friction.

This PR implements the reuse packet and brief portion of that loop.

## Reuse Packet Behavior

The helper builds `perspective_memory_reuse_packet.v0.1` with:

- packet metadata
- task title and task description
- `target_mode: codex`
- selected persisted memory items
- derived tags from existing item fields only
- source refs
- per-item `why_selected`
- per-item `reuse_boundary`
- missing item IDs
- reuse instructions
- known boundaries
- return expectations
- authority boundary flags

The packet is deterministic for a given item list, selection, task input,
timestamp, and optional packet ID.

## Codex Memory Brief Behavior

The brief is copyable markdown for a Codex worker. It includes Task, Relevant
Augnes Perspective Memory, why each item is relevant, each item boundary, reuse
instructions, return expectations, and authority boundary language.

The brief explicitly tells Codex to use the selected memories to avoid repeating
closed work, preserve Augnes direction, identify the next implementation slice,
and report back changed files, verification, skipped checks, and remaining
friction.

## Boundary

No new authority is introduced.

This PR does not add runtime authority, DB schema changes, migrations,
provider/model calls, OpenAI API calls, Codex SDK execution, MCP tool calls, automatic
synthesis, automatic memory creation, perspective-memory persistence writes,
reuse packet persistence, product boundary creation, proof/evidence writes,
Augnes state commit/reject authority, GitHub mutation, runtime startup, MCP
bridge startup, or hidden background daemons.

## Verification

Passed locally:

- `npm run smoke:perspective-memory-items`
- `npm run smoke:perspective-memory-items-search`
- `npm run smoke:perspective-memory-items-review-workspace`
- `npm run smoke:perspective-memory-items-reuse-packet`
- `npm run smoke:augnes-codex-bootstrap`
- `npm run smoke:augnes-codex-doctor`
- `npm run smoke:augnes-codex-prepare`
- `npm run smoke:augnes-operator-plugin-scaffold`
- `npm run smoke:augnes-operator-plugin-hooks`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## Skipped Checks

Browser/runtime validation is not part of this PR because the request explicitly
does not start runtime or MCP bridge processes. Coverage is static and helper
behavior based.

## Next recommended PR

Dogfood the reuse packet with a real Codex task and report whether it prevented
repeated work, preserved Augnes direction, or exposed stale or misleading
memory.
