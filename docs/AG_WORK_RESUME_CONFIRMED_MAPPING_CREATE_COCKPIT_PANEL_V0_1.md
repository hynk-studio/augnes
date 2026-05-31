# AG Work Resume Confirmed Mapping Create Cockpit Panel v0.1

## Purpose

The Cockpit Operator tab exposes an AG Resume Confirmed Mapping Create panel
for bounded creation of Stage C confirmed mapping identity association rows.

The panel calls the existing create route:

`POST /api/ag-work-resume/confirmed-mappings`

Confirmed mapping remains one foreign work identity associated with one
existing local work identity after user/Core confirmation. It is not import,
not imported resume context, not proof/evidence authorization, not session
binding, not Codex execution authority, and not approval, publish, retry,
replay, or merge authority.

## Relationship To Existing Pieces

- Stage C record contract:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md` defines the
  confirmed mapping record as identity metadata only.
- Stage C writer:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md` documents the shared
  writer core used by the route. This panel does not add writer behavior.
- Stage C route:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md` documents the existing
  JSON `POST` create route called by this panel.
- Stage C reader and read panel:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md` and
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_COCKPIT_PANEL_V0_1.md` document
  read-only access. This create panel does not call the `GET` read route.
- Mapping/import authority gate:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md` keeps proposal
  records, confirmed mappings, imports, imported context, proof/evidence,
  session binding, and Codex continuation separate.
- Stage D imported context record design:
  `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md` documents the
  future imported resume context review metadata record. This create panel does
  not create or mutate imported context.

## Cockpit Location

The panel lives in the Cockpit Operator tab after the AG Resume Mapping
Proposal Lifecycle Actions panel and before the read-only AG Resume Confirmed
Mapping Review panel.

## Inputs

Required:

- `source_proposal_id`
- `confirmed_by`
- `confirmation_reason`

Optional:

- `foreign_scope`
- `foreign_work_id`
- `local_scope`
- `local_work_id`
- `packet_id`
- `packet_hash`
- `source_runtime_instance_id`
- `confirmed_at`

Local validation before the route call:

- `source_proposal_id` is required.
- `confirmed_by` is required.
- `confirmation_reason` is required.
- `confirmed_at`, when supplied, must be an ISO UTC timestamp with millisecond
  precision.
- Optional tuple-ish identity fields may be supplied independently, but the
  route/core remains the canonical validator and must verify supplied values
  match the reviewed proposal.

The panel does not send `db`, `now`, or unknown fields.

## Fixture Buttons

- `Load safe proposed create fixture`
- `Load safe matching identity fixture`
- `Load safe needs_review create fixture`
- `Load safe local work missing fixture`
- `Clear confirmed mapping create inputs`
- `Create confirmed mapping`

Fixture buttons load synthetic public-safe create values into local React state
only. They do not call routes, create rows, update rows, delete rows, record
proof/evidence, bind sessions, execute Codex, use persistence APIs, or mutate
Augnes state.

## Request Behavior

The panel sends only a JSON `POST` request to:

`/api/ag-work-resume/confirmed-mappings`

The request uses `content-type: application/json` and a JSON body built only
from supported route fields:

- `source_proposal_id`
- `foreign_scope`
- `foreign_work_id`
- `local_scope`
- `local_work_id`
- `packet_id`
- `packet_hash`
- `source_runtime_instance_id`
- `confirmed_by`
- `confirmation_reason`
- `confirmed_at`

The panel does not call `GET /api/ag-work-resume/confirmed-mappings`. It does
not call proposal writer/read/lifecycle routes, import routes, work mutation
routes, evidence/proof routes, session routes, Codex routes, bridge routes,
MCP/App routes, publication routes, approval routes, Direct Resume Code routes,
or relay routes.

## Output

The result section is labelled `Confirmed mapping create result` and renders:

- HTTP status.
- Route `ok`.
- Writer status.
- `mapping_id`.
- `source_proposal_id`.
- Submitted create fields.
- Confirmed mapping record card with foreign/local identities, packet id/hash,
  status, confirmation metadata, and record authority boundary.
- Create authority boundary.
- Warnings and failures.

Visible copy states that confirmed mapping creation is a foreign/local identity
association only and is not import, imported resume context, proof/evidence
authorization, session binding, Codex execution authority, approval, publish,
retry, replay, or merge authority.

## Error Behavior

- Missing required fields fail locally before any route call.
- Malformed `confirmed_at` fails locally before any route call.
- Route failures such as `proposal_not_found`, `proposal_not_active`,
  `local_work_not_found`, `proposal_mismatch`, `duplicate_active_mapping`,
  `invalid_input`, and `db_error` render the JSON result and a
  `Confirmed mapping create route error: ...` alert.
- Clear resets inputs, local errors, route errors, busy state, and result
  state.

## Accessibility Behavior

- All text inputs and the confirmation reason textarea use real `label` /
  `htmlFor` associations.
- Helper text is linked with `aria-describedby`.
- Local and route errors use `role="alert"`.
- The result section uses `aria-live="polite"` and a stable labelled heading.
- Fixture controls, create inputs, and create controls are grouped with
  accessible labels.
- Controls are native buttons, input, and textarea elements.
- The panel adds no `role="button"` div/span controls and no custom keyboard
  shortcuts.

## Authority Boundary

- Creates only confirmed mapping identity association rows through the existing
  route.
- No schema or migration.
- No route implementation change.
- No writer/helper behavior change.
- No read route call from the create panel.
- No confirmed mapping update/delete.
- No lifecycle mutation.
- No proposal record creation or update.
- No import or imported resume context creation.
- No work item or work event creation.
- No proof/evidence recording.
- No session binding.
- No Codex execution or Codex continuation.
- No ChatGPT App cards.
- No MCP/App schema changes.
- No bridge tools.
- No telemetry or analytics.
- No localStorage, sessionStorage, or indexedDB persistence.
- No merge, publish, retry, replay, approval, external posting, auto-merge, or
  committed-state mutation.

Durable approval remains user/Core gated.

## Non-Goals

This panel does not add schema/migration, import persistence, imported resume
context, work item creation, work event creation, proof/evidence recording,
session binding, Codex execution controls, approval, publish, retry, replay,
external posting, merge, Direct Resume Code behavior, relay behavior, route
changes, database/schema changes, MCP/App tool schema changes, bridge tools,
ChatGPT App cards, hooks, plugins, skills, secret-handling changes,
telemetry, analytics, or committed-state mutation beyond the existing confirmed
mapping create route.

## Browser Verification Requirement

Because this slice changes rendered Cockpit UI and calls the existing POST
route, browser verification should open the Cockpit Operator tab with an
isolated temp DB and verify:

- create from a proposed proposal.
- create from a needs_review proposal.
- missing required local validation.
- malformed `confirmed_at` local validation.
- duplicate active mapping route error.
- local work missing route error.
- clear after success and error.
- network proof that the create panel calls only
  `POST /api/ag-work-resume/confirmed-mappings` with JSON content type,
  supported body fields only, and no GET read route.
- DB proof that confirmed mapping rows are created only on successful creates,
  source proposal rows and local work rows remain unchanged, and no
  work_events, action_records, verification_evidence_records, sessions,
  imports, imported context, proof/evidence, or Codex side effects are created.

The browser report for this slice is:

`reports/browser/2026-06-01-ag-work-resume-confirmed-mapping-create-cockpit-panel-verification.md`

## Future Note

Read-only review, imported resume context as documented in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md`, lifecycle
mutation, proof/evidence recording, session binding, Codex continuation,
approval, publish, retry, replay, and merge remain separate user/Core-gated
designs.
