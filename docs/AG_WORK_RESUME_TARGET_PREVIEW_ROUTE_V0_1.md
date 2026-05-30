# AG Work Resume Target Preview Route v0.1

## Purpose

`POST /api/ag-work-resume/target-preview` is a read-only local route for
running an AG Resume Target Preview over an already built AG Resume Packet and
explicitly supplied Local B runtime, repo, and mapping context.

The route exists to make the packet preflight and target preview contract
available as deterministic JSON for local/operator review. It is not an import
path, not a Direct Resume Code route, not a relay, not a bridge tool, not a UI
control, not Codex execution authority, and not approval.

## Relationship To Existing Pieces

- Packet preflight: `ag:resume-preflight` remains the validation contract for
  AG Resume Packet v0.2. This route runs strict packet preflight by default
  before relying on the supplied packet.
- Packet builder preview:
  `docs/AG_WORK_RESUME_PACKET_BUILDER_PREVIEW_V0_1.md` describes the pure
  builder that can create sanitized packet previews from explicit Local A
  inputs. This route does not build packets.
- Target preview pure checker:
  `lib/ag-work-resume-target-preview.ts` compares a validated packet with
  explicit Local B context. This route calls that checker and does not discover
  local context on its own.
- Local helper:
  `scripts/ag-work-resume-target-preview.mjs` remains a local CLI helper for
  file, environment, and stdin workflows. This route provides the same
  read-only review surface as a JSON POST handler.

## Route

`POST /api/ag-work-resume/target-preview`

The route accepts JSON request bodies only. Callers must provide the packet and
must provide Local B context explicitly when they want more than a
`context_only` preview.

Request body shape:

```json
{
  "packet": {
    "schema": "augnes.ag_work_resume_packet.v0_2"
  },
  "local": {
    "runtime": {
      "runtime_available": true
    },
    "repo": {
      "repo_available": true
    },
    "known_local_work_mappings": []
  },
  "strict": false,
  "skip_preflight": false
}
```

Validation rules:

- `packet` is required and must be an object.
- `local` may be an object, `null`, or omitted.
- `strict` may be supplied only as a boolean.
- `skip_preflight` may be supplied only as a boolean.
- non-JSON request bodies fail with HTTP 400.

## Response Body

Successful non-blocking previews return:

```json
{
  "ok": true,
  "route": "ag_work_resume_target_preview.v0_1",
  "strict": false,
  "preflight": {
    "ran": true,
    "ok": true,
    "strict": true,
    "status": "pass",
    "warnings": [],
    "failures": []
  },
  "preview": {
    "status": "ready_for_user_core_review"
  },
  "recommended_next_step": "User/Core should review and confirm the local mapping and authority choices before any Codex start."
}
```

`ok: true` means the route completed and produced a non-blocking read-only
preview. It does not mean Codex can execute. `preview.ok_to_continue` means
continue to user/Core review, not implementation.

Error and blocking responses keep the same route identifier and use
`ok: false`. Packet preflight failures return `preview: null` because the route
does not rely on a packet that failed strict preflight.

## HTTP Status Codes

- 400: invalid JSON request body.
- 400: missing `packet`.
- 400: `local` has the wrong shape.
- 400: `strict` or `skip_preflight` has the wrong shape.
- 422: strict packet preflight failed.
- 422: target preview status is `blocked`.
- 409: target preview status is `conflict`.
- 200: target preview status is `needs_mapping`.
- 200: target preview status is `context_only`.
- 200: target preview status is `ready_for_user_core_review`.

## Skip Preflight

`skip_preflight: true` is accepted only for local/operator debugging and
fixtures. It returns:

```json
{
  "preflight": {
    "ran": false,
    "ok": null,
    "strict": true,
    "status": "skipped",
    "warnings": [
      "Packet preflight was skipped; run ag:resume-preflight before relying on this target preview."
    ],
    "failures": []
  }
}
```

When preflight is skipped, `recommended_next_step` includes:

`Run ag:resume-preflight before relying on this target preview.`

## Local B Workflow

1. Obtain or build an AG Resume Packet.
2. Provide explicit Local B runtime, repo, and mapping context in the request
   body.
3. Let the route run strict packet preflight by default.
4. Inspect the returned target preview.
5. User/Core reviews gaps, conflicts, warnings, and recommendations.
6. Only later run `codex:read-brief` after confirmed local mapping.

## Authority Boundary

- Route is read-only.
- No DB/schema changes.
- No runtime discovery.
- No route-side DB reads.
- No persistence.
- No import.
- No work item creation.
- No mapping record creation.
- No proof/evidence recording.
- No session binding.
- No Direct Resume Code route.
- No relay.
- No Codex execution.
- No approval, publish, retry, replay, external posting, merge, auto-merge, or
  committed-state mutation.

Target previews are review aids. They are not approval, not proof/evidence
authorization, not Codex execution authority, and not merge/publish authority.
Durable approval remains user/Core gated.

## Non-Goals

- No DB/schema changes.
- No runtime state writes.
- No runtime discovery.
- No route-side DB reads.
- No MCP/App tool schema changes.
- No bridge tools.
- No UI controls.
- No Cockpit panels.
- No ChatGPT App cards.
- No persistent import.
- No Direct Resume Code create or resolve routes.
- No relay behavior.
- No proof/evidence recording.
- No work event creation.
- No work item creation.
- No mapping record creation.
- No session binding.
- No approval, publish, retry, replay, external posting, merge, auto-merge, or
  committed-state mutation.
- No Codex execution controls.

Future work may wire this read-only route into Cockpit or ChatGPT App
read-only surfaces only after user/Core scopes that surface.

## Examples

Plain request shape:

`POST /api/ag-work-resume/target-preview`

`Content-Type: application/json`

`{ "packet": { "...": "AG Resume Packet v0.2" }, "local": null, "strict": false }`

Ready preview result:

`200 { "ok": true, "preview": { "status": "ready_for_user_core_review" } }`

Needs mapping result:

`200 { "ok": true, "preview": { "status": "needs_mapping" } }`

Conflict result:

`409 { "ok": false, "preview": { "status": "conflict" } }`

Preflight failure result:

`422 { "ok": false, "preflight": { "status": "fail" }, "preview": null }`

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-target-preview-route
npm run smoke:ag-work-resume-target-preview-helper
npm run smoke:ag-work-resume-target-preview
npm run smoke:ag-work-resume-packet-builder-preview
npm run smoke:ag-work-resume-packet-preflight
git diff --check
```

Browser verification is skipped for this slice with:

`browser verification skipped: no rendered UI/operator surface changed in this read-only route slice`
