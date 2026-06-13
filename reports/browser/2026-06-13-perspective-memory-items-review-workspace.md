# Perspective Memory Items Review Workspace Browser Validation

Route: `/cockpit/perspective/memory-items/review`

Dev server:
- `AUGNES_DB_PATH=/tmp/augnes-memory-items-review-browser/augnes.db npm run dev -- -H 127.0.0.1 -p 3000`

## Result

The perspective-memory items review workspace route loads successfully and renders a packet-first read-only workbench over persisted perspective-memory items from the same-origin API and SQLite backend.

Persistence backend marker: `sqlite:lib/db.ts`.

## Checks

- route loads successfully
- No console warnings/errors
- No unexpected external traffic beyond same-origin app/API routes
- read-only boundary visible
- item list visible
- select item works
- selected count updates
- review packet panel visible
- status_counts visible
- validation_result_counts visible
- content summary visible
- source/evidence refs visible
- risk notes visible
- unresolved tensions visible
- carry-forward questions visible
- relationship summary visible
- review guidance visible
- selected item detail visible
- clear selection works
- select all visible works
- filters work
- refresh preserves persisted items through API/SQLite
- no status mutation controls
- no create memory item controls
- no boundary creation controls
- no enabled Core/runtime/provider/GitHub controls
- core_decision_created false visible
- automatic_runtime_injection_created false visible
- provider_model_call_created false visible
- github_mutation_created false visible
- 390px viewport had no horizontal overflow
- 768px viewport had no horizontal overflow
- desktop viewport had no horizontal overflow
- no clipboard automation
- no raw returned envelope/private/provider/token/browser/source/candidate material visible outside returned envelope textarea

## Related Route Checks

- `/cockpit/perspective/codex-former/local-adapter-operator-flow` route loads successfully
- `/cockpit/perspective/memory-review-queue/local` route loads successfully
- `/cockpit/perspective/memory-boundary-review-inbox` route loads successfully
- `/cockpit/perspective/memory-items` route loads successfully and shows link to review workspace visible
- `/cockpit/perspective/memory-items/search` route loads successfully, item searchable, and link to review workspace visible

## Aggregation Coverage

Browser validation covers the single-item product flow. Multi-item aggregation, duplicate titles, shared source refs, repeated questions, PASS with follow-up caution lists, and retracted/deprecated/superseded relationship summaries are covered by `npm run smoke:perspective-memory-items-review-workspace`.

## Boundary

The review workspace is read-only review packet generation. It does not expose enabled item status mutation, Create persisted perspective-memory item, create boundary record, Write to memory, Commit memory, Send to Core, Create Core decision, Auto inject runtime, runtime injection, Auto promote, provider/model synthesis, GitHub mutation, Commit state entry, Deploy, runtime handoff, saved review workspaces, persisted review packet table, vector search, or embeddings behavior.
