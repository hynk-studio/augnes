# Local Codex Adapter Validate Result Fixture Surface v0.1

## Purpose

Read-only local Codex adapter validate result fixture surface.

This slice adds a read-only local Codex adapter validate result fixture surface for the committed PR #525 validate result snapshots.

Route:

`/cockpit/perspective/codex-former/local-adapter-validate-result-fixture`

The surface is browser-visible and fixture-backed. It does not create runtime state, product state, accepted Augnes state, review decisions, proof/evidence/readiness records, persistence, surface exports, provider/model calls, Codex calls, GitHub mutations, DB writes, network calls, clipboard behavior, or Core decisions.

## Fixture Inputs

The route imports these committed fixtures directly:

- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass-with-follow-up.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-blocked.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass-with-follow-up.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-blocked.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-snapshot-summary.json`

There is no dynamic user-path loading. The route passes the imported fixtures through `validateCodexFormerLocalAdapterValidateResultFixtureSurface` before rendering.

## Session Panel Preview

The Session Panel preview renders all three validate result scenarios:

- `validation-pass` with `PASS, review-only`
- `validation-pass-with-follow-up` with `PASS with follow-up, review-only`
- `validation-blocked` with `BLOCKED, review-only finding`

The default scenario is `PASS with follow-up` because it shows warning pressure without implying acceptance.

The preview renders caveat text, `next_safe_action`, `candidate_count`, `candidate_shape_status`, `contract_fit_status`, `direct_validation_status`, `candidate_compatible_review_material`, `candidate_authority`, `candidate_basis_quality`, `worker_facing_guidance_status`, `worker_facing_guidance_advisory_only`, `warning_count`, `pointer_warning_count`, and `blocked_reason_count`.

`validation_summary_path` and `validation_summary_hash` render only inside expanded details. validation_summary_path and validation_summary_hash render only inside expanded details. `source_input_hash`, `prepare_execution_summary_hash`, and `returned_envelope_hash` also render only inside expanded details.

Authority flags are displayed as readable false/non-authorizing fields. `review_only` remains true, while `accepted_state`, `review_decision_created`, `product_readiness_created`, `constellation_handoff_available`, and `runtime_handoff_available` remain false.

## Capture Review Inbox Preview

The Capture Review Inbox preview renders:

- `local-adapter-validation-pass`
- `local-adapter-validation-pass-with-follow-up`
- `local-adapter-validation-blocked`

Filters:

- `all`
- `reviewable`
- `reviewable_with_follow_up`
- `blocked`

The default selected item is `PASS with follow-up`. Item selection uses local React state only. The selected item renders title, stage, reviewability, badges, `summary_line`, caveat, `next_safe_action`, counts, authority tags, and false authority flags.

Safe links are availability text only. The validation summary safe link shows local path/hash in expanded details, but `href` remains null and there is no clickable external navigation.

## Snapshot Summary / Readiness

The summary section renders:

- `mode: validate-result-snapshots`
- covered result states
- covered surfaces
- `candidate_count_by_state`
- `warning_count_by_state`
- `blocked_reason_count_by_state`
- authority boundary
- `future_ui_path`
- `browser_validation_requirement`

The summary copy is explicit that the current UI is a fixture surface and not runtime/product state.

## Result Semantics

PASS is review-only and not approval. It does not mean accepted, approved, persisted, product-ready, mergeable, runtime-ready, or Core-decided.

PASS with follow-up remains review material only. It is not acceptance, persistence, product readiness, or a review decision.

BLOCKED is a validation result, not automated rejection. It is not a reject action, retry command, runtime handoff, product decision, or review decision.

## Interaction And Accessibility

The surface uses native buttons for scenario switching, inbox filters, and item selection. Selection state is exposed with `aria-pressed`. Path/hash/authority details use native `details` and `summary` disclosures.

All visible status differences are textual. The layout uses responsive grids, visible focus states, and overflow wrapping for long hashes. The 390px viewport is expected to have no horizontal overflow.

## Security And Privacy Boundary

The surface renders bounded statuses, counts, labels, caveats, refs, paths, hashes, authority tags, and false authority flags only. It does not render raw returned candidate content, raw prompt text, raw source packet content, hidden reasoning, provider logs, secrets, tokens, cookies, browser dumps, raw diffs, raw review payloads, raw source payloads, raw candidate payloads, private markers, or unsafe marker values.

The source does not use browser persistence APIs, clipboard APIs, app-side network calls, DB access, provider/model APIs, Codex SDK calls, GitHub APIs, runtime fixture mutation, accepted-state creation, review decision creation, proof/evidence/readiness record creation, surface export, automatic promotion, or Core decision behavior.

## Validation

Static smoke:

`npm run smoke:perspective-codex-former-local-adapter-validate-result-fixture-surface`

Browser report smoke:

`npm run browser:perspective-codex-former-local-adapter-validate-result-fixture-surface`

Browser validation uses the actual route:

`http://127.0.0.1:3000/cockpit/perspective/codex-former/local-adapter-validate-result-fixture`

The browser report records route load, console state, local-only traffic, scenario switching, inbox filters, item selection, expanded details, safe-link non-navigation, authority copy, keyboard traversal, and desktop/768px/390px overflow checks.
