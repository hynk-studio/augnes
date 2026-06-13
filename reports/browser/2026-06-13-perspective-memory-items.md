# Perspective Memory Items Browser Validation

Route: `/cockpit/perspective/memory-items`

Dev server:
- `AUGNES_DB_PATH=/tmp/augnes-memory-items-browser/augnes.db npm run dev -- -H 127.0.0.1 -p 3000`

## Result

The perspective-memory items dashboard route loads successfully and renders persisted item list/detail state from the same-origin API and SQLite backend.

Persistence backend marker: `sqlite:lib/db.ts`.

## Checks

- route loads successfully
- No console warnings/errors
- No unexpected external traffic beyond same-origin app/API routes
- persisted item count visible
- item list visible
- select item works
- item detail visible
- content title/summary visible
- source boundary id visible
- source refs/hashes visible
- risk notes visible
- unresolved tensions visible
- carry-forward questions visible
- acceptance visible
- source_boundary_snapshot visible
- availability visible
- authority boundary visible
- core_decision_created false visible
- automatic_runtime_injection_created false visible
- provider_model_call_created false visible
- filters work
- status update to reviewing works
- status update to retracted works
- status update to superseded works
- status update to deprecated works
- status update back to accepted works
- refresh still shows persisted item through API/SQLite
- link back to boundary inbox visible
- link back to local queue route visible
- link to operator flow visible
- 390px viewport had no horizontal overflow
- 768px viewport had no horizontal overflow
- desktop viewport had no horizontal overflow
- no clipboard automation
- no provider/model/Codex SDK/GitHub/network behavior except same-origin app/API routes
- no Core decision behavior
- no automatic runtime injection behavior
- no raw returned envelope/private/provider/token/browser/source/candidate material visible outside returned envelope textarea

## Boundary

The dashboard shows persisted perspective-memory items as product-level durable memory items. It does not expose enabled Send to Core, Create Core decision, Auto inject into runtime, Auto promote, Provider/model enrich, GitHub mutation, Commit state entry, Deploy, runtime handoff, or automatic promotion controls.

The item remains not automatic promotion and not automatic runtime injection.
