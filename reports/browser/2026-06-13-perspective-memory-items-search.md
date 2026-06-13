# Perspective Memory Items Search Browser Validation

Route: `/cockpit/perspective/memory-items/search`

Dev server:
- `AUGNES_DB_PATH=/tmp/augnes-memory-items-search-browser/augnes.db npm run dev -- -H 127.0.0.1 -p 3000`

## Result

The perspective-memory items search route loads successfully and renders read-only retrieval over persisted perspective-memory items from the same-origin API and SQLite backend.

Persistence backend marker: `sqlite:lib/db.ts`.

## Checks

- route loads successfully
- No console warnings/errors
- No unexpected external traffic beyond same-origin app/API routes
- search input visible
- filters visible
- read-only boundary visible
- search by title term returns item
- search by summary term returns item
- search by source boundary id returns item
- search by returned envelope hash returns item
- search by risk/carry-forward term returns item
- multi-token search works
- no-result query shows empty state
- clear search resets result list
- select result works
- selected item detail visible
- matched fields/snippets visible
- content title/summary visible
- source boundary trace visible
- availability visible
- authority boundary visible
- core_decision_created false visible
- automatic_runtime_injection_created false visible
- provider_model_call_created false visible
- github_mutation_created false visible
- search route has no enabled status mutation controls
- search route has no create memory item controls
- search route has no enabled Core/runtime/provider/GitHub controls
- refresh preserves persisted item results through API/SQLite
- link to review workspace visible at `/cockpit/perspective/memory-items/review`
- 390px viewport had no horizontal overflow
- 768px viewport had no horizontal overflow
- desktop viewport had no horizontal overflow
- no clipboard automation
- no raw returned envelope/private/provider/token/browser/source/candidate material visible outside returned envelope textarea

## Related Route Checks

- `/cockpit/perspective/codex-former/local-adapter-operator-flow` route loads successfully
- `/cockpit/perspective/memory-review-queue/local` route loads successfully
- `/cockpit/perspective/memory-boundary-review-inbox` route loads successfully
- `/cockpit/perspective/memory-items` route loads successfully and shows link to read-only search route visible

## Boundary

The search route is read-only retrieval. It does not expose enabled item status mutation, create memory item, create boundary record, Write to memory, Commit memory, Send to Core, Create Core decision, Auto inject runtime, runtime injection, Auto promote, provider/model enrich, GitHub mutation, Commit state entry, Deploy, runtime handoff, vector search, or embeddings behavior.

Search results can link selected persisted perspective-memory items into the read-only review packet workspace. That link only preselects item ids and does not create review packet persistence, Core decisions, runtime injection, provider/model synthesis, or GitHub mutation.
