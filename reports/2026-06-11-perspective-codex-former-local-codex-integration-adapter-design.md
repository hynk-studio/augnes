# Perspective Codex Former Local Codex Integration Adapter Design

## Summary

Added a design-only contract for a future local Codex integration adapter.

The adapter is intended to convert bounded local Codex work/session context into source input and downstream review-surface material without turning Codex output into accepted Augnes state.

This PR adds no adapter implementation, CLI behavior, UI, route, browser-visible surface, provider/model call, Codex SDK call, GitHub API call, DB write, persistence, clipboard automation, accepted Augnes state, proof/evidence/readiness records, review decision records, accept/promote/reject actions, approval/merge/deploy/Core decision, live Codex capture, or runtime fixture mutation.

## Why Follows PR #507

PR #507 implemented the read-only Capture Review Inbox fixture route:

`/cockpit/perspective/codex-former/capture-review-inbox-fixture`

That completed the first fixture-backed surface set alongside the Session Panel and Constellation Preview. This design defines the future local adapter that can feed those surfaces through the existing prepare/validate workflow.

## Design Scope

Changed scope:

- design doc;
- report;
- smoke script;
- package script.

No app route, component, CSS, helper behavior, capture helper implementation, fixture JSON, preview data adapter behavior, projection builder behavior, DB schema, provider/model integration, Codex SDK integration, GitHub mutation code, Session Panel implementation, Capture Review Inbox implementation, or Constellation Preview implementation was changed.

## Relationship to Existing Workflow and Surfaces

The existing capture helper remains the source of prepare/validate behavior. The source input template remains the operator-facing input contract.

The local adapter is a future convenience bridge into that workflow.

Session Panel displays per-work/session status. Capture Review Inbox displays multiple adapter/capture review items. Constellation Preview displays graph relationships after validation/projection permits read-only handoff.

The adapter must not bypass the helper, accept material, persist material, mutate GitHub, or decide anything.

## Local Adapter Stages

Defined stages:

- Stage A. Local work context collection.
- Stage B. Source input assembly.
- Stage C. Prepare helper handoff.
- Stage D. Manual Codex return.
- Stage E. Validate helper handoff.
- Stage F. Surface projection.

The stages keep local context bounded, preserve hashes/provenance, route prepare/validate behavior through the existing helper, keep Codex return human/manual, and map downstream material to read-only surfaces only.

## Allowed and Disallowed Inputs

Allowed future inputs include operator-provided source input JSON, bounded adapter manifest JSON, local git metadata summaries, bounded check summaries, operator-supplied PR refs, prior helper metadata JSON, returned envelope file path, validation summary JSON, and existing committed fixture JSON for fixture mode only.

Disallowed inputs include raw diffs, raw logs, terminal dumps, raw transcripts, raw candidate payloads outside the required returned envelope, provider/model logs, hidden reasoning, tokens, cookies, credentials, private account data, browser page dumps, screenshots/images unless separately scoped, GitHub API calls, Codex SDK calls, and network calls.

## Adapter Modes

Defined future modes:

- Manifest-to-source-input mode.
- Source-input preflight mode.
- Prepare orchestration mode.
- Validate orchestration mode.
- Surface export mode.

The first implementation should likely be Manifest-to-source-input mode only.

## Manifest Shape

The design defines a bounded manifest shape with:

- `adapter_manifest_version`
- `adapter_source_kind`
- `generated_at`
- `scope`
- `work_id`
- `work_session_label`
- `codex_surface_label`
- `source_pr_refs`
- `changed_files`
- `changed_files_summary`
- `tests_checks_run`
- `skipped_checks`
- `unresolved_gaps`
- `readiness`
- `operator_notes_bounded`
- optional helper/return/validation paths

Each check, skipped check, unresolved gap, and readiness reason is bounded and sanitized.

## Output Contracts

Future outputs include source input JSON, adapter metadata JSON, prepare summary JSON, validate summary JSON, session panel snapshot JSON, capture review inbox item JSON, and constellation preview handoff reference.

Outputs are local files only, review-only, non-authorizing, provenance-bearing, and free of raw unsafe/private material.

## State Mapping to Surfaces

Not prepared maps to Session Panel Not prepared, Inbox Pending preparation / `not_ready`, and no Constellation handoff.

Waiting maps to Session Panel Waiting for candidate, Inbox `waiting`, and no Constellation handoff.

PASS with follow-up maps to Session Panel PASS with follow-up, Inbox `reviewable_with_follow_up`, read-only Constellation handoff, and `non_committed` candidate status.

BLOCKED maps to Session Panel BLOCKED, Inbox `blocked`, no usable Constellation candidate handoff, and visible blocked reasons.

Invalid data maps to a future Session Panel invalid data state, Inbox `invalid_data`, and no Constellation handoff.

## Error and Caveat Handling

The design covers missing manifest, invalid manifest JSON, unsupported manifest version, missing `work_id`/`scope`, missing `changed_files`, missing verification material, unsafe markers, missing prepare metadata, returned envelope missing, metadata mismatch, candidate count not exactly one, validation blocked, pointer warnings, `needs_review`, and `source_input_hash` mismatch.

Each error or caveat should map to a safe next action without implying system failure unless the data itself is invalid.

## Privacy/Redaction Handling

The adapter must use bounded summaries only.

It must not include raw diffs, raw logs, raw transcripts, raw candidate payloads except bounded returned envelope input for validation, provider logs, account/private data, credentials, or unsafe fields.

Public docs and reports must not echo raw unsafe/private marker literals.

## Authority Boundary

The design creates no accepted Augnes state, proof/evidence/readiness records, review decision records, accept/promote/reject actions, provider/model calls, Codex SDK calls, GitHub API calls, DB writes, clipboard automation, approval, merge, deploy, Core decision, live Codex capture, persistence, runtime fixture mutation, or hidden reasoning.

The first implementation should use local files only.

## Browser/Computer-Use Validation Plan

Browser/computer-use validation skipped: no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

Future CLI/docs/report/smoke-only adapter work may also skip browser validation with that reason. Future UI or surface-integration work must run browser validation.

## Verification

Passed verification:

- `npm run typecheck`
- `npm run smoke:perspective-codex-former-local-codex-integration-adapter-design`
- `git diff --check`
- `git diff --cached --check`

Relevant upstream smokes were run and failed only on older strict changed-file guards:

- `npm run smoke:perspective-codex-former-capture-review-inbox-fixture-surface-design` failed with `capture review inbox fixture surface design changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_LOCAL_CODEX_INTEGRATION_ADAPTER_DESIGN_V0_1.md`.
- `npm run smoke:perspective-codex-former-capture-review-inbox-fixture-surface-implementation` failed with `capture review inbox implementation changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_LOCAL_CODEX_INTEGRATION_ADAPTER_DESIGN_V0_1.md`.
- `npm run smoke:perspective-codex-former-session-perspective-panel-fixture-surface-implementation` failed with `session panel fixture implementation changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_LOCAL_CODEX_INTEGRATION_ADAPTER_DESIGN_V0_1.md`.
- `npm run smoke:perspective-codex-former-constellation-preview-fixture-surface-implementation` failed with `fixture surface implementation changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_LOCAL_CODEX_INTEGRATION_ADAPTER_DESIGN_V0_1.md`.

Those prior-stage guards were not widened because this PR is the next design stage, and the requested scope said not to spend time making unrelated historical changed-file guards accept this design PR unless they are clearly intended to track this exact stage.

## Skipped Checks With Reasons

Browser/computer-use validation skipped: no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

No provider/model, Codex SDK, DB, GitHub mutation, live capture, runtime fixture mutation, review decision, accept, promote, or reject checks were added beyond smoke/source boundary checks because those surfaces are intentionally absent.

## Recommended Next PR

Add local Codex adapter manifest-to-source-input implementation.

## What Codex Did Not Do

Codex did not implement an adapter, add CLI behavior, add UI, add a route, add a runtime browser surface, call Codex, integrate Codex SDK, call provider/model APIs, call GitHub APIs, add DB persistence, automate clipboard use, create accepted Augnes state, create proof/evidence/readiness records, create review decision records, add accept/promote/reject actions, approve, merge, deploy, make Core decisions, mutate fixtures, modify capture helpers, modify projection builders, modify preview data adapters, modify the Session Panel implementation, modify the Capture Review Inbox implementation, or modify the Constellation Preview implementation.
