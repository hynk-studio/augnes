# Local Codex Adapter Operator Flow v0.1

## Purpose

`/cockpit/perspective/codex-former/local-adapter-operator-flow` is a local-only operator shell for the manual Augnes / Codex loop. It lets a user see the current source and prepare references, copy a bounded Codex-ready handoff packet into a separate user-started Codex session, paste or load one returned envelope, run real local validation, inspect bounded candidate review material, choose a local draft next action, manage a small bounded local candidate draft list, and queue a selected local candidate draft for local perspective-memory review from one route.

The route is product-facing, but it remains non-authoritative. It does not call a provider/model, Codex SDK, GitHub, database, Core runtime, or clipboard API. It does not create accepted state, review decisions, product readiness, mergeability, runtime handoff, persistence to a product DB, or automatic promotion.

## Route and Fixtures

- Route: `/cockpit/perspective/codex-former/local-adapter-operator-flow`
- Local validation bridge: `/api/perspective/codex-former/local-adapter-operator-flow/validate`
- Storage namespace: `augnes.codexFormer.localAdapterOperatorFlow.v0.1`
- Candidate draft list storage namespace: `augnes.codexFormer.localAdapterAcceptedCandidateDraftList.v0.1`
- Candidate draft list schema version: `codex_former_local_adapter_candidate_draft_list.v0.1`
- Legacy single candidate draft namespace migrated when valid: `augnes.codexFormer.localAdapterAcceptedCandidateDrafts.v0.1`
- Accepted-candidate draft schema version: `codex_former_local_adapter_accepted_candidate_draft.v0.1`
- Local memory review queue route: `/cockpit/perspective/memory-review-queue/local`
- Local memory review queue storage namespace: `augnes.perspectiveMemory.localReviewQueue.v0.1`
- Local memory review queue schema version: `perspective_memory_local_review_queue.v0.1`
- Source input fixtures:
  - `reports/fixtures/2026-06-12-codex-former-local-adapter-source-input-pass.json`
  - `reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json`
- Prepare summary fixtures:
  - `reports/fixtures/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass.json`
  - `reports/fixtures/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass-with-follow-up.json`
- Returned envelope fixtures:
  - `reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-pass.txt`
  - `reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-ready.txt`
  - `reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-blocked.txt`
- Validate summary fixtures used for the secondary fixture preview:
  - `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass.json`
  - `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass-with-follow-up.json`
  - `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-blocked.json`

## User Flow

1. Open the route and review the source input and prepare summary refs.
2. Review the bounded Codex-ready Copy For Codex handoff packet.
3. Start Codex separately, outside this route, using the bounded packet.
4. Paste a returned envelope, or load PASS, PASS with follow-up, or BLOCKED fixtures.
5. Select `Run local validation`.
6. Review `validation_source`, `result_state`, `execution_result`, `failure_kind`, candidate count, warnings, pointer warnings, blocked reasons, `next_safe_action`, `candidate_compatible_review_material`, `worker_facing_guidance_status`, candidate basis/authority, hashes, and authority flags.
7. Inspect bounded candidate review material when available.
8. Choose one local draft action.
9. Select `Create local perspective candidate draft`, `Create local memory rejection draft`, or `Create local supersede draft` when the selected action is eligible.
10. Select, replace, clear selected, or clear all items in the Local Candidate Draft List.
11. Select `Queue for perspective-memory review` for an eligible selected draft, then open the local memory review queue route.

`Preview fixture result` remains available as a secondary aid, and is visibly marked with `fixture_preview`. The primary action posts the selected source/prepare refs and current textarea content to the local bridge and displays `real_local_validate_execution` when the existing validate orchestration execution path runs. Invalid bridge inputs are returned as `blocked_before_execution`.

## Candidate Actions

The visible action choices are:

- `keep_review_only`
- `accept_as_perspective_candidate`
- `reject_from_memory_candidate`
- `supersede_previous_candidate`

These controls are intentionally local draft only user-intent choices. They do not create accepted Augnes state, review decisions, memory decisions, persistence to a product DB, Core decisions, runtime handoff, readiness, mergeability, or automatic promotion.

## Local Accepted-Candidate Drafts

An accepted-candidate draft is a local user-intent record that says the current validated candidate should be carried forward as a perspective candidate draft. A rejected-memory candidate draft says the candidate should not be carried forward into memory. A superseded-candidate draft says the current candidate should supersede a previous local candidate draft.

Draft records are stored as a bounded list in `augnes.codexFormer.localAdapterAcceptedCandidateDraftList.v0.1` with `list_version=codex_former_local_adapter_candidate_draft_list.v0.1`. Each draft keeps `draft_version=codex_former_local_adapter_accepted_candidate_draft.v0.1`. A valid legacy single record in `augnes.codexFormer.localAdapterAcceptedCandidateDrafts.v0.1` is migrated into the list on load; invalid or unsafe legacy records are ignored and the route shows an ignored-invalid note.

The list stores bounded refs, hashes, counts, warnings, pointer warnings, `next_safe_action`, review summary, candidate authority/basis quality labels, local status, and local user intent. It does not store raw returned envelope text, raw prompt text, raw source packet, raw candidate payload, hidden reasoning, provider logs, tokens, secrets, raw diffs, raw review payloads, browser dumps, or private material.

`Create local perspective candidate draft` is enabled only after a `real_local_validate_execution` result with `PASS` or `PASS with follow-up`, `candidate_count=1`, candidate-compatible review material, non-committed candidate authority, false authority flags, and explicit `accept_as_perspective_candidate` selection.

`Create local memory rejection draft` is available after a `real_local_validate_execution` result when the user explicitly selects `reject_from_memory_candidate`. This includes `BLOCKED` validation, so BLOCKED remains rejection-only and cannot create an accepted-candidate draft.

`Create local supersede draft` requires `real_local_validate_execution`, `PASS` or `PASS with follow-up`, explicit `supersede_previous_candidate`, and a non-empty `supersede_previous_candidate_ref`.

Creating any draft appends a new item without overwriting older drafts. The list is sorted newest first, deduped by `draft_id`, and capped at 20 drafts. `Replace selected draft with current candidate draft` is explicit and preserves the selected draft id while updating the selected record from the current eligible candidate action.

For each draft, the UI compares `validation_summary_hash`, `source_input_hash`, `prepare_execution_summary_hash`, and `returned_envelope_hash` against the current real local validation. Matching drafts show `current_local_candidate_draft`; differing drafts show `stale_local_candidate_draft`; if there is no current real local validation, drafts show `no_current_validation`. Stored drafts are never silently updated when validation changes.

## Local Perspective-Memory Review Queue

The Local Candidate Draft List now has a Perspective-Memory Review Queue panel. A selected local candidate draft can be queued with `Queue for perspective-memory review` when it is a current `draft_candidate` or `supersedes_previous_candidate`, came from `real_local_validate_execution`, has `PASS` or `PASS with follow-up`, and still matches the current validation hashes.

The queue action creates a local queue item in `augnes.perspectiveMemory.localReviewQueue.v0.1`; it does not remove or overwrite the local candidate draft. The panel shows queue item id, queue status, active queue item count, whether the selected draft is already queued, blocked reasons, and an `Open local memory review queue` route reference.

Rejected memory candidates remain visible in the draft list but are not queue-eligible for memory write review. A `PASS with follow-up` draft can be queued, but the queue preview carries a warning caveat.

Clearing the local operator draft does not clear the candidate draft list or the local memory review queue. Clearing the local candidate draft list does not clear the local memory review queue. Queue management is explicit in `/cockpit/perspective/memory-review-queue/local`.

## Copy For Codex Packet

The Copy For Codex panel is a bounded Codex-ready handoff packet, not only a list of file refs. It includes enough concise context for an external Codex session to produce exactly one `CodexPerspectiveCandidateDraft` returned candidate envelope without making the user manually stitch together source fixtures, prepare summaries, validation docs, and route state.

Included bounded context:

- task statement to produce exactly one `CodexPerspectiveCandidateDraft`;
- `work_id`, `changed_files_summary`, `changed_files`, `source_pr_refs`, readiness status/reasons, bounded test/check summaries, skipped-check summary, and unresolved-gap summary;
- source input and prepare summary path/hash refs;
- former input packet ref, manual copy packet ref, and source prompt/provenance hash when available;
- output contract with `draft_version`, `draft_kind`, and required candidate fields;
- authority/privacy boundary and returned envelope instructions;
- next user step to paste the returned envelope and select `Run local validation`.

Path/hash refs remain included as provenance, but the copied packet also carries enough bounded source summary and output-contract context to reduce user glue work. It still avoids raw source packet JSON, raw returned candidate payloads, private material, hidden reasoning, provider logs, token material, browser dumps, raw diffs, and raw review payloads.

## Local Storage

The route stores bounded draft metadata in `augnes.codexFormer.localAdapterOperatorFlow.v0.1`.

Persisted fields:

- `draft_id`
- `generated_at`
- `updated_at`
- `selected_source_input_ref`
- `selected_prepare_summary_ref`
- `active_step`
- `selected_returned_envelope_fixture_key`
- `returned_envelope_draft_saved_explicitly`
- `validation_result_state`
- `validation_result_source`
- `validation_summary_hash` after real local validation
- `source_input_hash` after real local validation
- `prepare_execution_summary_hash` after real local validation
- `returned_envelope_hash` after real local validation
- `candidate_action_choice`
- `supersede_previous_candidate_ref`
- `returned_envelope_text` only when the user explicitly selects Save draft locally

Local candidate draft records persist separately in `augnes.codexFormer.localAdapterAcceptedCandidateDraftList.v0.1`. `Clear local draft` resets operator-flow metadata but does not clear the candidate draft list. `Clear selected local candidate draft` removes only the selected list item. `Clear all local candidate drafts` clears the list namespace and the legacy single-record namespace.

Local memory review queue items persist separately in `augnes.perspectiveMemory.localReviewQueue.v0.1`. Queue items store bounded refs, hashes, counts, review summaries, deterministic memory candidate previews, queue status, review-only controls, and authority boundary flags. They do not store raw returned envelope text, raw source packets, raw prompts, raw candidate payloads, private/provider/token/browser material, raw diffs, or raw review payloads.

Not persisted by default:

- hidden reasoning
- provider logs
- tokens
- secrets
- raw private material
- raw source packet
- browser dumps
- raw diffs
- raw review payloads
- raw candidate payloads

## Implementation Notes

- `lib/perspective-ingest/codex-former-local-adapter-operator-flow.ts` owns route constants, scenario view-model construction, validation preview mapping, and safe localStorage parse/save/reset helpers.
- `lib/perspective-ingest/codex-former-local-adapter-operator-flow-local-validate.ts` owns the local validation bridge helper. It reads only committed source/prepare fixtures selected by ref, uses the returned envelope textarea content, calls `buildCodexFormerLocalAdapterValidateExecutionSummary` directly, and returns a bounded summary.
- `lib/perspective-ingest/codex-former-local-adapter-accepted-candidate-draft.ts` owns the bounded local accepted-candidate draft model, eligibility checks, staleness checks, unsafe marker rejection, and legacy single-record localStorage helpers.
- `lib/perspective-ingest/codex-former-local-adapter-candidate-draft-list.ts` owns the list payload, migration from the legacy single draft slot, append/replace/remove/clear helpers, max-list bound, dedupe, and current/stale status checks.
- `lib/perspective-ingest/perspective-memory-local-review-queue.ts` owns the local memory review queue payload, queue item builder, deterministic bounded memory candidate preview, append/remove/status helpers, max-list bound, dedupe, unsafe marker rejection, and source draft current/stale/missing checks.
- `app/api/perspective/codex-former/local-adapter-operator-flow/validate/route.ts` exposes the same-origin Node route for the browser surface.
- `app/cockpit/perspective/memory-review-queue/local/page.tsx` exposes the local queue inspection route.
- `operator-flow-surface.tsx` keeps UI state local and writes only bounded metadata automatically.
- Returned envelope text is loaded into the textarea only through user action or explicit saved local draft restore.
- The route avoids clipboard APIs. The Copy For Codex panel is a selectable bounded handoff preview.
- The local validation bridge does not write product DB state, accepted state, review decisions, Core decisions, proof/evidence/readiness records, or runtime handoff material.

## Verification

- Static smoke: `npm run smoke:perspective-codex-former-local-adapter-operator-flow`
- Browser report smoke: `npm run browser:perspective-codex-former-local-adapter-operator-flow`
- Browser route: `http://127.0.0.1:3000/cockpit/perspective/codex-former/local-adapter-operator-flow`
