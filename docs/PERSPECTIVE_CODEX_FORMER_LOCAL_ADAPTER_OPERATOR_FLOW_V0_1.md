# Local Codex Adapter Operator Flow v0.1

## Purpose

`/cockpit/perspective/codex-former/local-adapter-operator-flow` is a local-only operator shell for the manual Augnes / Codex loop. It lets a user see the current source and prepare references, copy a bounded Codex-ready handoff packet into a separate user-started Codex session, paste or load one returned envelope, preview local validation, inspect bounded candidate review material, and choose a local draft next action from one route.

The route is product-facing, but it remains non-authoritative. It does not call a provider/model, Codex SDK, GitHub, database, Core runtime, or clipboard API. It does not create accepted state, review decisions, product readiness, mergeability, runtime handoff, persistence to a product DB, or automatic promotion.

## Route and Fixtures

- Route: `/cockpit/perspective/codex-former/local-adapter-operator-flow`
- Storage namespace: `augnes.codexFormer.localAdapterOperatorFlow.v0.1`
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
- Validate summary fixtures:
  - `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass.json`
  - `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass-with-follow-up.json`
  - `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-blocked.json`

## User Flow

1. Open the route and review the source input and prepare summary refs.
2. Review the bounded Codex-ready Copy For Codex handoff packet.
3. Start Codex separately, outside this route, using the bounded packet.
4. Paste a returned envelope, or load PASS, PASS with follow-up, or BLOCKED fixtures.
5. Select `Validate locally / Preview validation result`.
6. Review `result_state`, candidate count, warnings, pointer warnings, blocked reasons, `next_safe_action`, `candidate_compatible_review_material`, and `worker_facing_guidance_status`.
7. Inspect bounded candidate review material when available.
8. Choose one local draft action.

## Candidate Actions

The visible action choices are:

- `keep_review_only`
- `accept_as_perspective_candidate`
- `reject_from_memory_candidate`
- `supersede_previous_candidate`

These controls are intentionally local draft only user-intent choices. They do not create accepted Augnes state, review decisions, memory decisions, persistence to a product DB, Core decisions, runtime handoff, readiness, mergeability, or automatic promotion.

## Copy For Codex Packet

The Copy For Codex panel is a bounded Codex-ready handoff packet, not only a list of file refs. It includes enough concise context for an external Codex session to produce exactly one `CodexPerspectiveCandidateDraft` returned candidate envelope without making the user manually stitch together source fixtures, prepare summaries, validation docs, and route state.

Included bounded context:

- task statement to produce exactly one `CodexPerspectiveCandidateDraft`;
- `work_id`, `changed_files_summary`, `changed_files`, `source_pr_refs`, readiness status/reasons, bounded test/check summaries, skipped-check summary, and unresolved-gap summary;
- source input and prepare summary path/hash refs;
- former input packet ref, manual copy packet ref, and source prompt/provenance hash when available;
- output contract with `draft_version`, `draft_kind`, and required candidate fields;
- authority/privacy boundary and returned envelope instructions;
- next user step to paste the returned envelope and select `Validate locally / Preview validation result`.

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
- `candidate_action_choice`
- `supersede_previous_candidate_ref`
- `returned_envelope_text` only when the user explicitly selects Save draft locally

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
- `operator-flow-surface.tsx` keeps UI state local and writes only bounded metadata automatically.
- Returned envelope text is loaded into the textarea only through user action or explicit saved local draft restore.
- The route avoids clipboard APIs. The Copy For Codex panel is a selectable bounded handoff preview.

## Verification

- Static smoke: `npm run smoke:perspective-codex-former-local-adapter-operator-flow`
- Browser report smoke: `npm run browser:perspective-codex-former-local-adapter-operator-flow`
- Browser route: `http://127.0.0.1:3000/cockpit/perspective/codex-former/local-adapter-operator-flow`
