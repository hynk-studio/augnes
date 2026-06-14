# Perspective Memory Reuse Return Binding v0.1

## Summary

This PR adds Perspective Memory Reuse Return Binding v0.1 as a deterministic
local preview layer.

The helper links:

`reuse_packet_id -> codex_run_ref -> returned_envelope_ref -> follow-up
candidate memory`

It does not persist the link or create the follow-up candidate memory. The goal
is to make the return relationship inspectable and testable before any storage
or product authority is added.

## Files Changed

- `lib/perspective-ingest/perspective-memory-reuse-return-binding.ts`
- `docs/PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_V0_1.md`
- `reports/2026-06-14-perspective-memory-reuse-return-binding.md`
- `scripts/smoke-perspective-memory-reuse-return-binding.mjs`
- `package.json`

## Product Goal

PR #550 introduced the reuse packet and Codex Memory Brief.

PR #551 dogfooded that loop and found that the brief constrained the work,
prevented repeating closed setup/prepare work, preserved Augnes direction, and
identified Return Binding as the next implementation slice. PR #551 also found
that `/tmp/augnes-demo.db` had the `perspective_memory_items` table but zero
persisted memory rows, so live-data browser/runtime dogfood remains future work.

PR #551 finding marker: `/tmp/augnes-demo.db` had zero persisted memory rows.

This PR creates the first bounded read-only/local structure for connecting a
reuse packet to a later Codex return envelope reference.

## Return Binding Behavior

The helper builds `perspective_memory_reuse_return_binding.v0.1` with:

- deterministic `binding_id`
- `reuse_packet_id`
- `codex_run_ref`
- `returned_envelope_ref`
- `returned_at`
- deduped `changed_files`
- preserved `verification`
- preserved `skipped_checks` with concrete reasons
- preserved `remaining_friction`
- `follow_up_candidate_memory_preview`
- `return_quality_summary`
- authority boundary flags

The follow-up candidate memory preview uses
`perspective_memory_reuse_return_binding_preview.v0.1`.

The helper also builds a short human-readable return binding summary.

`return_quality_summary` reports whether the return is complete enough for
future memory review and lists missing return sections when it is not.

Quality marker: complete enough for future memory review.

## Follow-Up Candidate Memory Preview Behavior

The follow-up candidate memory preview is preview-only.

It can carry a title, summary, source refs, risk notes, carry-forward questions,
and suggested next review action, but it does not create a memory item, product
boundary record, persistence write, Core decision, Core memory, runtime
injection, or automatic synthesis.

Preview-only markers: no memory item created; no product boundary record created; no persistence write; no Core decision; no Core memory; no runtime injection; no automatic synthesis.

## Boundary

This PR only adds deterministic local Return Binding preview/helper/docs/report
and smoke coverage.

It does not add runtime authority, DB schema changes, migrations, setup/prepare
polish, provider/model calls, OpenAI API calls, Codex SDK execution, MCP tool
calls, GitHub mutation from scripts, proof/evidence writes,
perspective-memory persistence writes, reuse packet persistence, return binding
persistence, product boundary creation, automatic synthesis, automatic memory
creation, default/user DB writes, hidden background daemons, or Augnes state
commit/reject authority.

Boundary marker: no runtime authority, DB schema changes, migrations, setup/prepare polish, provider/model calls, OpenAI API calls, Codex SDK execution, MCP tool calls, GitHub mutation from scripts, proof/evidence writes, perspective-memory persistence writes, reuse packet persistence, return binding persistence, product boundary creation, automatic synthesis, automatic memory creation, default/user DB writes, hidden background daemons, or Augnes state commit/reject authority.

## Verification

Passed locally:

- `npm run smoke:perspective-memory-items`
- `npm run smoke:perspective-memory-items-search`
- `npm run smoke:perspective-memory-items-review-workspace`
- `npm run smoke:perspective-memory-items-reuse-packet`
- `npm run smoke:perspective-memory-reuse-return-binding`
- `npm run smoke:augnes-codex-bootstrap`
- `npm run smoke:augnes-codex-doctor`
- `npm run smoke:augnes-codex-prepare`
- `npm run smoke:augnes-operator-plugin-scaffold`
- `npm run smoke:augnes-operator-plugin-hooks`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## Skipped Checks

Runtime/browser validation is not part of this PR because the slice is a
deterministic local helper/docs/report/smoke preview and no runtime route is
added.

MCP bridge startup, MCP tool calls, provider/model checks, OpenAI API calls,
Codex SDK execution, setup execution, and secret/config reads are skipped
because they are outside the boundary of this preview layer.

## Next Recommended PR

Dogfood Return Binding with the PR #551/#552 loop and decide whether the next
slice should be:

1. live-data browser/runtime reuse dogfood with seeded persisted memory rows
2. persisted return binding table, only if explicitly decided
