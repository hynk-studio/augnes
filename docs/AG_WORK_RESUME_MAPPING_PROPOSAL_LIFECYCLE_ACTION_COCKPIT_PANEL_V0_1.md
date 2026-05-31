# AG Work Resume Mapping Proposal Lifecycle Action Cockpit Panel v0.1

## Purpose

The Cockpit Operator tab exposes bounded controls for applying lifecycle
actions to existing Stage B AG Resume mapping proposal records.

The panel calls only:

`POST /api/ag-work-resume/mapping-proposal-records/lifecycle-actions`

Lifecycle actions update proposal lifecycle and review metadata only. They are
not mapping confirmation, not import authorization, not proof/evidence
authorization, not session binding, not Codex execution authority, and not
approval, publish, retry, replay, or merge authority.

## Relationship To Existing Pieces

- Stage B proposal writer:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md` creates
  proposal-only records. This panel does not call the writer and does not
  create proposals.
- Stage B proposal reader:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md` documents the
  read helper and route used by the adjacent record review panel. This panel
  does not call the read route for lifecycle actions.
- Read-only Cockpit review panel:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_COCKPIT_PANEL_V0_1.md`
  documents the adjacent read-only proposal record review panel.
- Lifecycle action design:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTIONS_DESIGN_V0_1.md`
  defines the Stage B lifecycle semantics and authority boundary.
- Lifecycle action helper:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1.md`
  documents the shared core and local helper.
- Lifecycle action route:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_ROUTE_V0_1.md`
  documents the JSON route this panel calls.
- Mapping/import authority gate:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md` keeps proposal
  lifecycle metadata, confirmed mappings, imports, proof/evidence, session
  binding, Codex continuation, approval, publish, retry, replay, and merge as
  separate authority boundaries.

## Cockpit Location

The panel lives in the Cockpit Operator tab after the AG Resume Mapping
Proposal Record Review panel.

## Inputs

- `proposal_id`: required existing proposal record id.
- `action`: required lifecycle action, one of `withdraw`, `reject`,
  `supersede`, or `expire`.
- `reviewed_by`: required reviewer actor string.
- `review_note`: required human-readable review metadata.
- `reviewed_at`: optional ISO UTC timestamp with millisecond precision.
- `replacement_proposal_id`: optional for `supersede` only.

The panel performs local validation before calling the route:

- `proposal_id` is required.
- `action` is required and must be `withdraw`, `reject`, `supersede`, or
  `expire`.
- `reviewed_by` is required.
- `review_note` is required.
- `replacement_proposal_id` is rejected unless `action` is `supersede`.
- `reviewed_at`, when supplied, must be an ISO UTC timestamp with millisecond
  precision.

The route remains the canonical input contract.

## Fixture Buttons

- `Load safe withdraw action`
- `Load safe reject action`
- `Load safe supersede action`
- `Load safe expire action`
- `Clear lifecycle action inputs`

Fixture buttons load synthetic public-safe values into local React state only.
They do not call routes, create rows, update rows, delete rows, record
proof/evidence, bind sessions, execute Codex, use persistence APIs, or mutate
Augnes state.

## Request Behavior

The panel sends only `POST` requests to:

`/api/ag-work-resume/mapping-proposal-records/lifecycle-actions`

The request uses JSON and includes only supported lifecycle route fields:

- `proposal_id`
- `action`
- `reviewed_by`
- `review_note`
- `reviewed_at`, when supplied
- `replacement_proposal_id`, when supplied for `supersede`

The panel does not call proposal writer routes, proposal read routes, import
routes, work routes, evidence/proof routes, session routes, Codex routes,
bridge routes, MCP/App routes, publication routes, approval routes, Direct
Resume Code routes, or relay routes.

## Output

The result section is labelled `Mapping proposal lifecycle action result` and
renders:

- HTTP status.
- Route `ok`.
- Lifecycle status.
- Action.
- Proposal id.
- Before/after status.
- `updated_fields`.
- Warnings and failures.
- Route and lifecycle recommended next steps.
- Lifecycle authority boundary.
- Before and after proposal record snapshots for lifecycle review metadata.

Visible copy states that lifecycle action results are proposal review metadata
only and are not confirmed mappings, imports, proof/evidence authorization,
session bindings, Codex execution authority, approval, publish, retry, replay,
or merge authority.

## Error Behavior

- Missing local fields fail locally before any route call.
- Unsupported action values fail locally before any route call.
- `replacement_proposal_id` combined with a non-`supersede` action fails
  locally before any route call.
- Malformed `reviewed_at` fails locally before any route call.
- Route errors render `Mapping proposal lifecycle action route error: ...`
  with `role="alert"`.
- `not_found`, `not_active`, `replacement_not_found`, `invalid_input`, and DB
  errors are rendered as lifecycle results when the route returns JSON.

## Accessibility Behavior

- All inputs, menus, and textareas use real `label` / `htmlFor`
  associations.
- Helper text is linked with `aria-describedby`.
- Local and route errors use `role="alert"`.
- The result section uses `aria-live="polite"` and a stable labelled heading.
- Fixture controls, lifecycle inputs, and action controls are grouped with
  accessible labels.
- Controls are native buttons, input, select, and textarea elements.
- The panel adds no `role="button"` div/span controls and no custom keyboard
  shortcuts.

## Authority Boundary

- Existing proposal lifecycle/review metadata update only.
- No proposal creation.
- No replacement proposal creation.
- No replacement proposal row update.
- No same-tuple transactional replacement creation.
- No confirmed mapping.
- No import.
- No imported context.
- No work item or work event creation.
- No proof/evidence recording.
- No proof/evidence authorization.
- No session binding.
- No Codex execution or Codex continuation.
- No ChatGPT App cards.
- No MCP/App schema changes.
- No bridge tools.
- No Direct Resume Code.
- No relay.
- No telemetry or analytics.
- No localStorage, sessionStorage, or indexedDB persistence.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

Durable approval remains user/Core gated.

## Non-Goals

This panel does not add proposal creation, replacement proposal creation,
same-tuple transactional replacement, mapping confirmation, mapping
persistence, import persistence, imported context, work item creation, work
event creation, proof/evidence recording, session binding, Codex execution
controls, approval, publish, retry, replay, external posting, merge, Direct
Resume Code behavior, relay behavior, route changes, database/schema changes,
MCP/App tool schema changes, bridge tools, ChatGPT App cards, hooks, plugins,
skills, secret-handling changes, telemetry, analytics, or committed-state
mutation.

## Browser Verification Requirement

Because this slice changes rendered Cockpit UI and calls the existing lifecycle
route, browser verification should use an isolated temp DB, seed synthetic
proposal records through the existing writer before opening Cockpit, and then
exercise withdraw, reject, expire, and supersede on separate proposals.

The verification should also cover not-active route handling, missing local
field validation, network inspection proving only the lifecycle POST route was
called with JSON, and DB proof that proposal row count is unchanged, only
intended target lifecycle fields changed, replacement rows are unchanged, and
protected work, session, action, proof/evidence, confirmed mapping, import, and
imported-context surfaces remain untouched or absent.

The browser report for this slice is:

`reports/browser/2026-05-31-ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel-verification.md`

## Stage C Design Pointer

This Cockpit lifecycle panel slice itself added no confirmed mapping design or
implementation. The separate Stage C confirmed mapping record design is
documented in
`docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md`; it is
design-only and adds no schema, migration, writer, helper, route, UI, import,
proof/evidence, session, Codex, approval, publish, retry, replay, or merge
authority.
