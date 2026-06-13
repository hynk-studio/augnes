# Local Codex Adapter Operator Flow Report

## Summary

This PR follows PR #532 by improving usability after local candidate draft creation. The route at `/cockpit/perspective/codex-former/local-adapter-operator-flow` now connects the local candidate draft list to a local perspective-memory review queue.

The validation bridge remains the input source. Candidate drafts can be appended or explicitly used to replace a selected draft only from a current `real_local_validate_execution` result and explicit user action; fixture preview, not-run, stale, or blocked accept paths cannot create an accepted-candidate draft. A selected current PASS or PASS with follow-up local candidate draft can now be queued for local perspective-memory review without product DB persistence or accepted memory creation.

## Changed Files

- `app/cockpit/perspective/codex-former/local-adapter-operator-flow/page.tsx`
- `app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.tsx`
- `app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.module.css`
- `app/cockpit/perspective/memory-review-queue/local/page.tsx`
- `app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.tsx`
- `app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.module.css`
- `app/api/perspective/codex-former/local-adapter-operator-flow/validate/route.ts`
- `lib/perspective-ingest/codex-former-local-adapter-accepted-candidate-draft.ts`
- `lib/perspective-ingest/codex-former-local-adapter-candidate-draft-list.ts`
- `lib/perspective-ingest/perspective-memory-local-review-queue.ts`
- `lib/perspective-ingest/codex-former-local-adapter-operator-flow.ts`
- `lib/perspective-ingest/codex-former-local-adapter-operator-flow-local-validate.ts`
- `scripts/smoke-perspective-codex-former-local-adapter-operator-flow.mjs`
- `scripts/smoke-perspective-memory-local-review-queue.mjs`
- `scripts/browser-smoke-perspective-codex-former-local-adapter-operator-flow.mjs`
- `scripts/browser-smoke-perspective-memory-local-review-queue.mjs`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_V0_1.md`
- `docs/PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_V0_1.md`
- `reports/2026-06-12-perspective-codex-former-local-adapter-operator-flow.md`
- `reports/2026-06-13-perspective-memory-local-review-queue.md`
- `reports/browser/2026-06-12-perspective-codex-former-local-adapter-operator-flow.md`
- `reports/browser/2026-06-13-perspective-memory-local-review-queue.md`

## Bridge Behavior

`Run local validation` runs the real local validate execution path through `buildCodexFormerLocalAdapterValidateExecutionSummary`. It renders `result_state`, `execution_result`, `failure_kind`, candidate count, warnings, pointer warnings, blocked reasons, next safe action, candidate-compatible review material, worker-facing guidance status, candidate basis/authority, source/prepare/returned-envelope hashes, local validation summary hash, and authority flags.

The PASS / PASS with follow-up / BLOCKED committed returned-envelope fixtures validate through the same bridge as PASS, PASS with follow-up, and BLOCKED. Malformed textarea content returns a visible BLOCKED result with blocked reasons instead of crashing the route.

## Local Candidate Draft List Behavior

The local candidate draft list stores `list_version=codex_former_local_adapter_candidate_draft_list.v0.1` in `augnes.codexFormer.localAdapterAcceptedCandidateDraftList.v0.1`. It keeps each item as the existing `codex_former_local_adapter_accepted_candidate_draft.v0.1` draft shape.

A valid legacy single-record draft from `augnes.codexFormer.localAdapterAcceptedCandidateDrafts.v0.1` is migrated into the list on load. Invalid or unsafe legacy records are ignored with a visible ignored-invalid note.

`Create local perspective candidate draft` requires `real_local_validate_execution`, PASS or PASS with follow-up, one candidate, candidate-compatible review material, non-committed candidate authority, false authority flags, and explicit `accept_as_perspective_candidate`.

`Create local memory rejection draft` supports real local PASS, PASS with follow-up, or BLOCKED when the user explicitly selects `reject_from_memory_candidate`. This keeps BLOCKED rejection-only.

`Create local supersede draft` requires a real local non-blocked validation result, explicit `supersede_previous_candidate`, and a non-empty previous draft id.

The record stores refs, hashes, counts, warning arrays, pointer warning arrays, next safe action, review summary, candidate basis/authority labels, local status, and the non-authorizing boundary. It does not store raw returned envelope text, raw prompt text, raw source packet, raw candidate payload, hidden reasoning, provider logs, tokens, browser dumps, raw diffs, or raw review payloads.

New drafts append without overwriting older drafts. The list is sorted newest first, deduped by `draft_id`, and capped at 20 drafts. The UI supports selecting a draft, clearing only the selected draft, clearing all local candidate drafts, and explicitly replacing the selected draft with the current eligible candidate draft.

Each row shows `current_local_candidate_draft`, `stale_local_candidate_draft`, or `no_current_validation` based on the current real local validation hashes. Stored drafts are not silently updated when validation changes.

## Perspective-Memory Review Queue Behavior

The Local Candidate Draft List panel now includes a perspective-memory review queue section. The user can select a candidate draft, see whether it is queue-eligible, click `Queue for perspective-memory review`, see the queue item id/status, and open `/cockpit/perspective/memory-review-queue/local`.

The queue helper stores `queue_version=perspective_memory_local_review_queue.v0.1` in `augnes.perspectiveMemory.localReviewQueue.v0.1`. Queueing appends a bounded local item without overwriting the draft list. Items are deduped by `queue_item_id`, sorted newest first, and capped at 50.

Queue eligibility requires a selected local candidate draft with `draft_candidate` or `supersedes_previous_candidate`, `PASS` or `PASS with follow-up`, `real_local_validate_execution`, current validation hashes, and a local-only/non-authorizing authority boundary. `rejected_memory_candidate` remains visible but is not queue-eligible for memory write review by default.

The queue item stores bounded refs, hashes, counts, source PR refs, changed file count, review summary, deterministic bounded memory candidate preview, queue status, review-only action flags, and authority boundary. It does not store raw returned envelope text, raw prompt/source packet/candidate payload, hidden reasoning, provider logs, tokens, browser dumps, raw diffs, or raw review payloads.

The local queue route renders a visible local review queue, item filters, selected item detail, bounded memory candidate preview, source refs/hashes, warning counts, stale/missing source state, authority boundary, and local review-only actions. `can_create_memory_write` is false.

## Preview Boundary

`Preview fixture result` remains as a secondary aid and is visibly marked `fixture_preview`. It is not the primary path and does not replace local validation execution.

## Local-Only Boundary

The bridge is local-only and non-authorizing. It does not call provider/model APIs, Codex, Codex SDK, GitHub, product DB, Core, or external network services. It creates no accepted Augnes state, no review decision, no proof/evidence/readiness records, no runtime handoff, no product handoff, and no automatic promotion.

Returned envelope text is still saved only after explicit `Save draft locally`. Automatic localStorage updates persist bounded operator metadata, including `validation_result_state`, `validation_result_source`, and validation/source/prepare/returned-envelope hashes after real local validation, but do not store raw returned envelope text by default.

Candidate drafts persist separately from the operator-flow draft. `Clear local draft` does not clear the candidate draft list. `Clear selected local candidate draft` removes only the selected item. `Clear all local candidate drafts` clears the list namespace and the legacy single-record namespace. The local perspective-memory review queue persists separately from both operator metadata and the candidate draft list.

## Browser Validation

Browser validation covers route load, no console warnings/errors, no unexpected external traffic, textarea visibility, PASS/PASS with follow-up/BLOCKED fixture loading, `Run local validation` results, accepted draft append, queue selected draft, queue item id display, queue route reference, second draft append, PASS with follow-up queue caveat, rejected BLOCKED draft append, rejection draft not queue-eligible for memory write review, supersede ref gating and relation display, list selection, clear selected, clear all, refresh restore, clear-local-draft separation, clear-candidate-list/queue separation, stale/current markers, malformed envelope BLOCKED handling, and 390px / 768px / desktop overflow checks.

## Next Recommended PR

Add explicit “create local perspective-memory write proposal” from a selected queue item, still local-only and user-confirmed; or design the minimal product persistence boundary for perspective-memory queue items if the product decision is ready.
