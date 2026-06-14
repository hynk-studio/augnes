# Perspective Memory Reuse Return Binding v0.1

## Status

Perspective Memory Reuse Return Binding v0.1 adds a deterministic local preview
helper for connecting a copied reuse packet to a later Codex return envelope
reference.

Target relationship:

`reuse_packet_id -> codex_run_ref -> returned_envelope_ref -> follow-up
candidate memory`

This is a preview-only design layer. It does not persist return bindings, reuse
packets, follow-up candidate memory, perspective-memory items, product boundary
records, proof/evidence rows, or Augnes state.

## Context

PR #550 added Perspective Memory Reuse Packet v0.1.

PR #551 dogfooded the reuse packet and found that the packet and Codex Memory
Brief constrained the work, prevented repeating closed setup/prepare work,
preserved Augnes direction, and identified Return Binding as the next
implementation slice. PR #551 also found that `/tmp/augnes-demo.db` had the
`perspective_memory_items` table but zero persisted memory rows, so its dogfood
used deterministic fixture memory items.

## Helper

The helper is:

`lib/perspective-ingest/perspective-memory-reuse-return-binding.ts`

Constants:

- `PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_VERSION`
- `PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_PREVIEW_VERSION`

Versions:

- `perspective_memory_reuse_return_binding.v0.1`
- `perspective_memory_reuse_return_binding_preview.v0.1`

## Input Shape

The helper accepts:

- `reuse_packet_id`
- `codex_run_ref`
- `returned_envelope_ref`
- `returned_at`
- `changed_files`
- `verification`
- `skipped_checks`
- `remaining_friction`
- `follow_up_candidate_memory_preview`
- `operator_notes`
- `nowIso`
- optional `bindingId`

## Output Shape

The helper returns:

- `binding`
- `return_binding_summary`

The binding includes:

- `binding_version`
- `binding_id`
- `created_at`
- `reuse_packet_id`
- `codex_run_ref`
- `returned_envelope_ref`
- `returned_at`
- `changed_files`
- `verification`
- `skipped_checks`
- `remaining_friction`
- `follow_up_candidate_memory_preview`
- `operator_notes`
- `return_quality_summary`
- `authority_boundary`

## Behavior

The helper:

- bounds strings and arrays
- dedupes changed files
- preserves verification entries
- preserves skipped checks with concrete reasons
- preserves remaining friction
- preserves operator notes
- generates a deterministic `binding_id` when packet, run, and envelope refs
  are provided
- identifies missing return sections
- identifies whether the return is complete enough for future memory review
- builds a short human-readable return binding summary

Completeness is intentionally mechanical. A return is complete enough for future
memory review when it includes refs, returned time, changed files, verification,
skipped checks, remaining friction, and a titled/summarized follow-up candidate
memory preview.

Quality marker: complete enough for future memory review.

## Follow-Up Candidate Memory Preview

The follow-up candidate memory preview is preview-only. It may describe a
possible future memory candidate, but it does not create or persist anything.

Preview-only boundary:

- no memory item created
- no product boundary record created
- no persistence write
- no Core decision
- no Core memory
- no runtime injection
- no automatic synthesis

## Authority Boundary

This PR only adds deterministic local Return Binding preview/helper/docs/report
and smoke coverage.

It does not add:

- runtime authority
- DB schema changes
- migrations
- setup/prepare polish
- provider/model calls
- OpenAI API calls
- Codex SDK execution
- MCP tool calls
- GitHub mutation from scripts
- proof/evidence writes
- perspective-memory persistence writes
- reuse packet persistence
- return binding persistence
- product boundary creation
- automatic synthesis
- automatic memory creation
- default/user DB writes
- hidden background daemons
- Augnes state commit/reject authority

Boundary marker: no runtime authority, DB schema changes, migrations, setup/prepare polish, provider/model calls, OpenAI API calls, Codex SDK execution, MCP tool calls, GitHub mutation from scripts, proof/evidence writes, perspective-memory persistence writes, reuse packet persistence, return binding persistence, product boundary creation, automatic synthesis, automatic memory creation, default/user DB writes, hidden background daemons, or Augnes state commit/reject authority.

## Next Recommended PR

Dogfood Return Binding with the PR #551/#552 loop and decide whether the next
slice should be:

1. live-data browser/runtime reuse dogfood with seeded persisted memory rows
2. persisted return binding table, only if explicitly decided
