# Perspective Memory Items Review Workspace V0.1

This follows PR #539. Search made persisted perspective-memory items retrievable; this slice makes selected items useful for review by producing a deterministic read-only review packet.

Routes:
- `/cockpit/perspective/memory-items`
- `/cockpit/perspective/memory-items/search`
- `/cockpit/perspective/memory-items/review`

API used:
- `GET /api/perspective/memory/items`

Persistence backend:
- `sqlite:lib/db.ts`
- table: `perspective_memory_items`

## Product Meaning

The review workspace lets a user select persisted perspective-memory items, compare bounded content/source/risk/tension/question fields, inspect source traces, and generate a deterministic review packet for manual review preparation.

The word synthesis here means deterministic local aggregation and review preparation only. This is no provider/model synthesis, no vector search, no embeddings, no Core promotion, no runtime injection, no runtime prompt injection, and no automatic promotion.

## Dashboard, Search, And Review Workspace

The memory item dashboard manages item visibility and status. It can update `item_status` only.

The search route retrieves items by bounded title, summary, refs, hashes, risks, tensions, questions, and source lineage.

The review workspace is packet-first. It selects one or more persisted items and renders `perspective_memory_item_review_packet.v0.1` with deterministic counts, unions, relationship summaries, and guidance. It does not persist the selection or packet.

## Deterministic Review Packet

The packet includes:
- `status_counts`
- `validation_result_counts`
- `memory_kind_counts`
- `source_boundary_record_ids`
- `source_candidate_draft_ids`
- `source_refs`
- `evidence_refs`
- `risk_notes`
- `unresolved_tensions`
- `carry_forward_questions`
- `suggested_next_review_actions`
- `content_summaries`
- `relationship_summary`
- `review_guidance`
- `authority_boundary`

The helper versions are:
- `perspective_memory_item_review_workspace.v0.1`
- `perspective_memory_item_review_packet.v0.1`
- `perspective_memory_item_review_selection_summary.v0.1`
- `perspective_memory_item_review_guidance.v0.1`

## Relationship Summary

The relationship summary is deterministic and local:
- `shared_source_refs`
- `duplicate_titles`
- `repeated_questions`
- `retracted_or_deprecated_items`
- `superseded_items`
- `pass_with_follow_up_items`

## Read-Only Boundary

The route has selection controls, filters, reload, navigation links, and a packet panel. It does not expose item status mutation controls, Create persisted perspective-memory item, boundary creation, Write to memory, Commit memory, Send to Core, Create Core decision, Auto inject runtime, Auto promote, provider/model enrich, GitHub mutation, Commit state entry, Deploy, runtime handoff, saved workspaces, or a persisted review packet table.

The packet authority boundary keeps:
- `read_only_review_packet: true`
- `memory_item_created: false`
- `memory_item_mutated: false`
- `core_decision_created: false`
- `core_memory_created: false`
- `state_entry_created: false`
- `runtime_handoff_created: false`
- `automatic_runtime_injection_created: false`
- `automatic_promotion_created: false`
- `provider_model_call_created: false`
- `github_mutation_created: false`

## Excluded Material

The packet does not include raw returned envelope text, raw prompt/source packet, raw candidate payload, hidden reasoning, provider logs, tokens, browser dumps, raw diffs, private material, or raw review payloads.

## Browser Validation

Browser validation uses:

```bash
AUGNES_DB_PATH=/tmp/augnes-memory-items-review-browser/augnes.db npm run dev -- -H 127.0.0.1 -p 3000
```

Validation covers the operator route, local memory review queue, boundary inbox, dashboard, search route, and review workspace. The review route is checked for item selection, selected count updates, packet panels, counts, source/evidence refs, risk/tension/question aggregation, relationship summary, guidance, selected detail, filters, clear selection, select all visible, read-only authority flags, API/SQLite refresh persistence, no enabled mutation controls, and responsive behavior.

## Out Of Scope

No saved review workspaces, persisted review packet table, provider/model synthesis, embeddings, vector DB, Core promotion, Core memory, Core decision, runtime prompt injection, runtime handoff, state entry writes, automatic promotion, or checklist layer is added.

## Next Recommended PR

After this PR:
1. Add saved local review workspaces if users need repeated manual review sessions.
2. Or add a persisted review packet table only if product decision is explicit.
3. Or design Core-facing promotion from perspective-memory items only if separately and explicitly decided.
