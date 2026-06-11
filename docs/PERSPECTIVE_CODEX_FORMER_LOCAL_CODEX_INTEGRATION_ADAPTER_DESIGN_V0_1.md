# Perspective Codex Former Local Codex Integration Adapter Design v0.1

## Purpose

This design defines the future local Codex integration adapter.

The local Codex integration adapter is the future local-only bridge that turns bounded Codex work/session context into Augnes Codex Former capture inputs and downstream review-surface material.

This PR is design-only. It adds no adapter implementation, no CLI behavior, no UI implementation, no route, no runtime browser surface, no provider/model call, no Codex SDK call, no GitHub API call, no DB write, no persistence, no clipboard automation, no accepted Augnes state, no proof/evidence/readiness creation, no review decision records, no accept/promote/reject actions, no approval/merge/deploy/Core decision, no live Codex capture, and no runtime fixture mutation.

## Why Follows PR #507

PR #507 implemented the read-only Capture Review Inbox fixture route:

`/cockpit/perspective/codex-former/capture-review-inbox-fixture`

That joined the existing read-only fixture-backed surfaces:

- Session Panel: `/cockpit/perspective/codex-former/session-perspective-panel-fixture`
- Constellation Preview: `/cockpit/perspective/codex-former/constellation-preview-fixture`

Now that the three fixture-backed surfaces exist, the next design step is to define the local adapter that can eventually feed them with bounded local Codex work/session material.

## Product Thesis

The local Codex integration adapter should make Codex work/session context easy to convert into Augnes Codex Former capture material without turning Codex output into accepted Augnes state.

It should:

- collect bounded local work/session metadata;
- generate or prepare bounded source input for the existing capture helper;
- preserve provenance and hashes;
- keep unsafe/private/raw material out;
- make prepare/validate status visible to the Session Panel;
- make reviewable/blocked/pending state visible to the Capture Review Inbox;
- make validated candidate graph material available to the Constellation Preview;
- remain local, review-only, and non-authorizing.

## Relationship To Existing Workflow And Surfaces

This design is grounded in:

- `docs/PERSPECTIVE_CODEX_FORMER_MANUAL_WORKFLOW_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_SOURCE_INPUT_TEMPLATE_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_WORKFLOW_CLOSEOUT_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_SESSION_PERSPECTIVE_PANEL_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_REVIEW_INBOX_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PREVIEW_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md`

The existing capture helper remains the source of prepare/validate behavior. The source input template remains the operator-facing input contract. The local adapter is a future convenience bridge into that workflow.

Session Panel displays per-work/session adapter status. Capture Review Inbox displays multiple adapter/capture review items. Constellation Preview displays graph relationships after successful validation/projection.

The adapter should not bypass the prepare/validate helper. It should not decide, accept, persist, merge, approve, deploy, or mutate GitHub. Any future runtime/live integration requires a separate explicit authority gate.

## Local Adapter Stages

### Stage A. Local Work Context Collection

The operator provides, or the future adapter reads, a bounded local manifest.

Allowed bounded collection includes:

- optional work/session labels;
- optional source PR refs;
- changed file paths only, not raw diffs;
- test/check command summaries only, not raw logs;
- skipped check summaries;
- unresolved gaps;
- readiness/caveat summary.

The collection stage excludes provider logs, tokens, hidden reasoning, raw transcript, raw candidate payload, raw page dumps, screenshots, and images unless a later PR separately scopes redacted handling.

### Stage B. Source Input Assembly

The future adapter produces bounded source input JSON compatible with `docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_SOURCE_INPUT_TEMPLATE_V0_1.md`.

It may include `generated_at`, `scope`, `work_id`, `source_pr_refs`, `changed_files`, checks, skipped checks, unresolved gaps, and readiness summary.

It should compute a deterministic `source_input_hash`, preserve generated-at override semantics from the helper design, and avoid unsafe marker leakage.

### Stage C. Prepare Helper Handoff

A future implementation may call or instruct the existing prepare helper.

The prepare helper remains responsible for outputting the copyable prompt, return envelope template, and metadata. Augnes does not call Codex, does not automate clipboard transfer, and does not call provider/model APIs.

### Stage D. Manual Codex Return

The human uses a separate user-started Codex session and returns exactly one candidate envelope.

A future adapter may track waiting state locally, but this design does not add live session capture.

### Stage E. Validate Helper Handoff

A future implementation may run the existing validate helper.

Validation must enforce metadata match, enforce the exactly-one-candidate invariant, surface PASS / PASS with follow-up / BLOCKED, and preserve `non_committed`, `needs_review`, and pointer warning status.

### Stage F. Surface Projection

Session Panel receives status and stage view. Capture Review Inbox receives review item summary. Constellation Preview receives projection/preview data when validation permits.

All downstream material remains review-only.

## Allowed Input Sources

Allowed future local inputs:

- explicit operator-provided source input JSON;
- bounded adapter manifest JSON;
- local git metadata summaries such as branch name, changed file paths, commit SHA, and worktree clean/dirty state;
- test/check command, status, and bounded result summary;
- source PR refs as strings supplied by operator or local manifest;
- prior helper metadata JSON;
- returned envelope file path;
- validation summary JSON;
- existing committed fixture JSON for fixture mode only.

## Disallowed Input Sources

Disallowed inputs:

- raw diffs;
- raw logs;
- raw terminal dumps;
- raw transcripts;
- raw candidate payloads outside the required returned envelope;
- provider/model logs;
- hidden reasoning;
- tokens;
- cookies;
- credentials;
- private account data;
- browser page dumps;
- screenshots or images unless a later PR scopes redacted handling;
- GitHub API calls in this design;
- Codex SDK calls in this design;
- network calls in this design.

## Adapter Modes

### Mode A. Manifest-to-source-input mode

Consumes a bounded adapter manifest and writes source input JSON.

This is the likely first implementation target.

### Mode B. Source-input preflight mode

Validates source input before prepare helper.

It reports missing fields, unsafe material, and likely false positives.

### Mode C. Prepare orchestration mode

Wraps the existing capture helper prepare command and emits paths plus metadata summary.

It does not call Codex.

### Mode D. Validate orchestration mode

Wraps the existing validate helper command and emits review item summary.

It does not create accepted state.

### Mode E. Surface export mode

Writes Session Panel / Inbox / Constellation-compatible local JSON snapshots.

The snapshots are fixture-like, read-only, and deterministic.

The first implementation should likely be Manifest-to-source-input mode only, not all modes at once. Humanity has suffered enough from "just one orchestration script" becoming a second operating system.

## Adapter Manifest Shape

Future bounded manifest shape, design-only:

```json
{
  "adapter_manifest_version": "codex_former_local_adapter_manifest.v0.1",
  "adapter_source_kind": "local_bounded_manifest",
  "generated_at": "2026-06-11T00:00:00.000Z",
  "scope": "project:augnes",
  "work_id": "AG-example-local-adapter",
  "work_session_label": "Codex local work session example",
  "codex_surface_label": "separate user-started Codex session",
  "source_pr_refs": ["pr:hynk-studio/augnes#507"],
  "changed_files": ["docs/example.md"],
  "changed_files_summary": "Bounded summary of file paths and intent.",
  "tests_checks_run": [
    {
      "check_id": "check:typecheck",
      "command": "npm run typecheck",
      "status": "passed",
      "result_summary": "Typecheck passed."
    }
  ],
  "skipped_checks": [
    {
      "check_id": "check:browser",
      "skipped_reason": "No UI was added.",
      "result_summary": "Browser validation not required for this local manifest example."
    }
  ],
  "unresolved_gaps": [
    {
      "gap_id": "gap:pointer-review",
      "summary": "Pointer caveats remain review work."
    }
  ],
  "readiness": {
    "status": "needs_review",
    "reasons": ["Review-only local adapter design."]
  },
  "operator_notes_bounded": "Bounded operator note.",
  "existing_helper_metadata_path": null,
  "returned_envelope_path": null,
  "validation_summary_path": null
}
```

Each `tests_checks_run` item includes `check_id`, `command`, `status`, and `result_summary`.

Each `skipped_checks` item includes `check_id`, `skipped_reason`, and optional `result_summary`.

Each `unresolved_gaps` item includes `gap_id` and `summary`.

Readiness includes a status such as `not_ready`, `waiting`, `needs_review`, `blocked`, or `reviewable_with_follow_up`, plus reasons.

All strings must be bounded and sanitized.

## Output Contracts

Future local outputs:

- source input JSON;
- adapter metadata JSON;
- prepare summary JSON;
- validate summary JSON;
- session panel snapshot JSON;
- capture review inbox item JSON;
- constellation preview handoff reference.

Outputs are local files only. Outputs are review-only. Outputs do not create accepted state. Outputs should include hashes and provenance refs. Outputs must never include raw unsafe/private material.

## State Mapping To Product Surfaces

### Not prepared

Source input is absent or invalid.

- Session Panel: Not prepared.
- Capture Review Inbox: Pending preparation / `not_ready`.
- Constellation Preview: no handoff.

### Waiting

Source input and prepare metadata exist, but returned envelope is missing.

- Session Panel: Waiting for candidate.
- Capture Review Inbox: `waiting`.
- Constellation Preview: no handoff.

### PASS with follow-up

Validate summary permits review-compatible material with caveats.

- Session Panel: PASS with follow-up.
- Capture Review Inbox: `reviewable_with_follow_up`.
- Constellation Preview: read-only handoff available.
- Candidate remains `non_committed`.

### BLOCKED

Validate summary blocks usable review material.

- Session Panel: BLOCKED.
- Capture Review Inbox: `blocked`.
- Constellation Preview: no usable candidate handoff.
- Blocked reasons remain visible.

### Invalid data

Manifest, source input, or metadata is malformed.

- Session Panel: invalid data state in future.
- Capture Review Inbox: `invalid_data`.
- Constellation Preview: no handoff.

## Authority And Safety Boundaries

The design creates no accepted Augnes state, no proof/evidence/readiness creation, no review decision records, no accept/promote/reject actions, no provider/model calls, no Codex SDK calls, no GitHub API calls, no DB writes, no clipboard automation, no approval/merge/deploy/Core decision, no live Codex capture, no hidden reasoning, and no raw unsafe/private material.

The first implementation should use local files only.

## Privacy/Redaction

The adapter must use bounded summaries only.

It must not include raw diffs, raw logs, raw transcripts, raw candidate payloads except bounded returned envelope input for validation, provider logs, account/private data, credentials, or unsafe fields.

Public docs and reports must not echo raw unsafe/private marker literals.

## Error And Caveat Handling

Design-only error and caveat cases:

- missing manifest;
- invalid manifest JSON;
- unsupported manifest version;
- missing `work_id` or `scope`;
- missing `changed_files`;
- no verification material;
- unsafe markers;
- prepare metadata missing;
- returned envelope missing;
- metadata mismatch;
- candidate count not exactly one;
- validation blocked;
- pointer warnings;
- `needs_review`;
- `source_input_hash` mismatch.

Each error or caveat should map to a safe next action without implying system failure unless the data itself is invalid.

## Browser/Computer-Use Validation Plan

This PR is design-only and adds no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture, so browser validation should be skipped.

If the first adapter implementation is CLI/docs/report/smoke only, browser validation may be skipped with that reason.

If a future adapter implementation updates Session Panel, Capture Review Inbox, or Constellation Preview UI, browser validation is required.

If it writes surface snapshot fixtures consumed by existing UI, smoke plus targeted browser validation should be considered.

## Future Implementation Sequence

Recommended sequence:

1. Add local Codex adapter manifest-to-source-input implementation.
2. Add adapter fixture snapshots for Session Panel / Inbox states.
3. Add adapter prepare/validate orchestration only after manifest path is stable.
4. Add read-only surface integration for adapter snapshots.
5. Design review decision layer separately.
6. Only later consider live Codex SDK / provider / GitHub / persistence integration with explicit authority gates.

Immediate next PR:

Add local Codex adapter manifest-to-source-input implementation.

## Conclusion

PASS with follow-up

Meaning:

- local Codex adapter design is defined;
- no adapter has been implemented;
- first implementation should be narrow and local-only;
- accepted-state automation and live integrations remain out of scope.
