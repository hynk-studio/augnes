# AG Work Resume Mapping Proposal Preview Route v0.1

## Purpose

`POST /api/ag-work-resume/mapping-proposal-preview` is a read-only route for
running Stage A AG Resume mapping proposal preview over an already built AG
Resume Packet and explicitly supplied Local B candidate work items.

The route returns proposal-only review metadata for user/Core judgment. It is
not mapping confirmation, not import authorization, not proof/evidence
authorization, not Codex execution authority, and not merge/publish authority.

## Relationship To Existing Pieces

- Mapping/import authority gate design:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md` defines future
  gated mapping/import stages. This route remains Stage A preview-only and
  adds no mapping/import authority.
- Pure mapping proposal preview helper:
  `lib/ag-work-resume-mapping-proposal-preview.ts` produces the deterministic
  `AgWorkResumeMappingProposalPreview` object. The route only validates the
  request shape and calls that pure helper.
- Local mapping proposal preview helper:
  `scripts/ag-work-resume-mapping-proposal-preview.mjs` remains the local
  env/file/stdin helper. The route exposes the same read-only proposal
  semantics through a JSON POST handler.
- Packet preflight:
  `ag:resume-preflight` should already have run before this route is used. The
  route does not run packet preflight in this slice. Unsafe packet policy still
  fails closed through the pure mapping proposal preview helper.
- Target preview route:
  `POST /api/ag-work-resume/target-preview` previews broader Local B
  runtime/repo/mapping context. This route narrows the question to explicit
  candidate work item comparison.
- Cockpit copied-packet validation:
  Cockpit copied-packet validation remains a read-only packet/local-context
  validation surface. This route does not add Cockpit UI or operator controls.

## Route

`POST /api/ag-work-resume/mapping-proposal-preview`

The route accepts JSON request bodies only.

Request body shape:

```json
{
  "packet": {
    "schema": "augnes.ag_work_resume_packet.v0_2"
  },
  "candidates": [
    {
      "candidate_id": "local-candidate-1",
      "local_scope": "project:augnes",
      "local_work_id": "AG-LOCAL-1",
      "title": "Local work title",
      "status": "in_progress",
      "next_action": "Review mapping proposal",
      "related_state_keys": []
    }
  ],
  "selected_candidate_id": "local-candidate-1",
  "strict": false,
  "source": {
    "reviewed_by_surface": "route",
    "reviewed_at": "2026-05-31T00:00:00.000Z"
  }
}
```

Validation rules:

- `packet` is required and must be an object.
- `candidates` may be omitted and defaults to `[]`; when supplied, it must be
  an array.
- `selected_candidate_id` may be a string, `null`, or omitted.
- `strict` may be supplied only as a boolean.
- `source` may be an object or omitted.
- Non-JSON request bodies fail with HTTP 400.

The route validates only the request shape before calling the pure helper. It
does not duplicate packet preflight.

## Response Body

Successful non-blocking previews return:

```json
{
  "ok": true,
  "route": "ag_work_resume_mapping_proposal_preview.v0_1",
  "strict": false,
  "preview": {
    "status": "candidate_review"
  },
  "recommended_next_step": "User/Core should review whether the foreign work maps to the selected local work item. Do not create a mapping record or import context from this route output."
}
```

`ok: true` means the route produced a non-blocking preview. It does not mean
mapping is confirmed, import is allowed, proof/evidence may be recorded,
sessions may be bound, or Codex can execute. `preview.ok_for_user_core_review`
means review only.

## HTTP Status Codes

- 400: invalid JSON request body.
- 400: missing `packet`.
- 400: invalid `candidates` shape.
- 400: invalid `selected_candidate_id` shape.
- 400: invalid `strict` or `source` shape.
- 422: mapping proposal preview status is `blocked`.
- 409: mapping proposal preview status is `conflict`.
- 200: mapping proposal preview status is `needs_candidate`.
- 200: mapping proposal preview status is `candidate_review`.

## Local Workflow

1. Obtain or build an AG Resume Packet.
2. Run or confirm packet preflight.
3. Prepare explicit Local B candidate work item JSON.
4. Call the read-only mapping proposal preview route.
5. Inspect proposal preview gaps, conflicts, questions, foreign refs, and
   authority boundary.
6. User/Core decides whether any future mapping confirmation should be
   designed.

## Examples

Plain request:

```text
POST /api/ag-work-resume/mapping-proposal-preview
Content-Type: application/json

{
  "packet": { "...": "AG Resume Packet v0.2" },
  "candidates": [
    {
      "candidate_id": "local-candidate-1",
      "local_scope": "project:augnes",
      "local_work_id": "AG-LOCAL-1",
      "title": "Local work title",
      "status": "in_progress",
      "next_action": "Review mapping proposal",
      "related_state_keys": []
    }
  ],
  "selected_candidate_id": "local-candidate-1",
  "strict": false
}
```

Candidate review result:

```text
200 { "ok": true, "preview": { "status": "candidate_review" } }
```

Needs candidate result:

```text
200 { "ok": true, "preview": { "status": "needs_candidate" } }
```

Conflict result:

```text
409 { "ok": false, "preview": { "status": "conflict" } }
```

Blocked result:

```text
422 { "ok": false, "preview": { "status": "blocked" } }
```

Invalid request result:

```text
400 { "ok": false, "error": "Invalid JSON request body: ..." }
```

## Authority Boundary

- The route is read-only.
- Proposal-only.
- No DB/schema changes.
- No runtime discovery.
- No runtime state writes.
- No route-side DB reads.
- No persistence.
- No import.
- No mapping record creation.
- No import record creation.
- No work item creation.
- No proof/evidence recording.
- No session binding.
- No Direct Resume Code route.
- No relay.
- No Codex execution.
- No approval, publish, retry, replay, external posting, merge, auto-merge, or
  committed-state mutation.
- No localStorage, sessionStorage, indexedDB persistence.
- No telemetry or analytics.

Foreign refs remain foreign. The route does not convert packet action,
evidence, evidence-pack, proof, or session refs into local records.

Durable approval remains user/Core gated.

## Non-Goals

This route does not add database/schema changes, migrations, runtime discovery,
runtime state writes, route-side DB reads, route writes, MCP/App tool schema
changes, bridge tools, ChatGPT App cards, Cockpit UI changes, persistent
import, Direct Resume Code create/resolve routes, relay behavior,
proof/evidence recording, work event creation, session binding, work item
creation, mapping record creation, import record creation, approval, publish,
retry, replay, external posting, merge, auto-merge, Codex execution controls,
local storage persistence, telemetry, analytics, or committed-state mutation.

## Future Note

`docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_COCKPIT_PANEL_V0_1.md` documents
the Cockpit Operator tab read-only panel over this route.

Any persistence, import, mapping confirmation, proof/evidence recording,
session binding, or Codex continuation remains future-only and separately
gated.

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-mapping-proposal-preview-route
npm run smoke:ag-work-resume-mapping-proposal-preview-helper
npm run smoke:ag-work-resume-mapping-proposal-preview
npm run smoke:ag-work-resume-mapping-import-authority-gate
node --check scripts/smoke-ag-work-resume-mapping-proposal-preview-route.mjs
git diff --check
```

Browser verification is skipped for this slice with:

```text
browser verification skipped: no rendered UI/operator surface changed in this read-only route/docs/smoke slice
```
