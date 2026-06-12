# Local Codex Adapter Validate Result Fixture Surface Report

Date: 2026-06-12

## Summary

This PR adds a read-only local Codex adapter validate result fixture surface for the committed PR #525 validate result snapshots.

Route:

`/cockpit/perspective/codex-former/local-adapter-validate-result-fixture`

The UI consumes committed fixtures only and renders a validate result Session Panel preview, Capture Review Inbox preview, and snapshot readiness/authority summary. It does not create runtime/product state, accepted state, review decisions, proof/evidence/readiness records, persistence, surface exports, provider/model calls, Codex calls, GitHub mutations, DB writes, network calls, clipboard behavior, or Core decisions.

## Implemented Files

- `app/cockpit/perspective/codex-former/local-adapter-validate-result-fixture/page.tsx`
- `app/cockpit/perspective/codex-former/local-adapter-validate-result-fixture/validate-result-fixture-surface.tsx`
- `app/cockpit/perspective/codex-former/local-adapter-validate-result-fixture/validate-result-fixture-surface.module.css`
- `lib/perspective-ingest/codex-former-local-adapter-validate-result-fixture-surface.ts`
- `scripts/smoke-perspective-codex-former-local-adapter-validate-result-fixture-surface.mjs`
- `scripts/browser-smoke-perspective-codex-former-local-adapter-validate-result-fixture-surface.mjs`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_FIXTURE_SURFACE_V0_1.md`
- `reports/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface.md`
- `reports/browser/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface.md`
- `package.json`

The changed-file boundary stays inside route/component/CSS/lib/scripts/docs/report/package scope.

## Fixture Inputs

The route imports these committed PR #525 fixtures:

- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass-with-follow-up.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-blocked.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass-with-follow-up.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-blocked.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-snapshot-summary.json`

No dynamic path loading, user path input, browser storage, network request, DB access, provider/model API, Codex SDK, GitHub API, runtime fixture mutation, or persistence path is added.

## Session Panel Preview

The Session Panel preview renders:

- `validation-pass`: `PASS, review-only`
- `validation-pass-with-follow-up`: `PASS with follow-up, review-only`
- `validation-blocked`: `BLOCKED, review-only finding`

The default scenario is `PASS with follow-up`.

The preview renders caveat text, `next_safe_action`, `candidate_count`, `candidate_shape_status`, `contract_fit_status`, `direct_validation_status`, `candidate_compatible_review_material`, `candidate_authority`, `candidate_basis_quality`, `worker_facing_guidance_status`, `worker_facing_guidance_advisory_only`, `warning_count`, `pointer_warning_count`, and `blocked_reason_count`.

`validation_summary_path` and `validation_summary_hash` render only inside expanded details. `source_input_hash`, `prepare_execution_summary_hash`, and `returned_envelope_hash` also render only inside expanded details.

Authority fields render as readable false/non-authorizing values. `review_only` renders true as a review-only boundary. `accepted_state`, `review_decision_created`, `product_readiness_created`, `constellation_handoff_available`, and `runtime_handoff_available` render false.

## Capture Review Inbox Preview

The inbox preview renders:

- `local-adapter-validation-pass`
- `local-adapter-validation-pass-with-follow-up`
- `local-adapter-validation-blocked`

Filters:

- `all`
- `reviewable`
- `reviewable_with_follow_up`
- `blocked`

Item selection is local React state only. The selected item renders title, stage, reviewability, badges, `summary_line`, caveat, `next_safe_action`, counts, compact authority tags, safe-link availability text, and false authority fields.

Safe links are availability text only. The validation summary safe-link path/hash are visible inside expanded details, `href` remains null, and no clickable external navigation is rendered.

## Snapshot Readiness Summary

The summary renders:

- `mode: validate-result-snapshots`
- covered result states
- covered surfaces
- `candidate_count_by_state`
- `warning_count_by_state`
- `blocked_reason_count_by_state`
- authority boundary
- `future_ui_path`
- `browser_validation_requirement`

The copy states that this is a fixture surface and not runtime/product state.

## Copy And Authority Semantics

PASS is review-only and not approval. PASS does not imply accepted/approved/product-ready/mergeable/Core decision, persistence, review decision, runtime handoff, or product readiness.

PASS with follow-up remains review material only and keeps warning pressure visible.

BLOCKED is a validation result, not automated rejection.

The page has no executable controls labeled Accept, Approve, Promote, Reject, Merge, Deploy, Persist, Export, Run Codex, Call Codex, Call provider/model, Create review decision, Create accepted state, or Handoff to runtime. Those terms appear only in the policy disclosure as non-executable boundary text.

## Accessibility

The route uses semantic headings, native buttons for scenario/filter/item selection, `aria-pressed` on selectable controls, visible focus states, native `details`/`summary` disclosures for expanded path/hash/authority details, and textual status labels for PASS, PASS with follow-up, and BLOCKED.

The CSS uses responsive grids and overflow wrapping for long hashes and paths. The browser report covers 390px, 768px, and desktop overflow checks.

## Validation Commands

Planned and required validation:

```bash
npm run smoke:perspective-codex-former-local-adapter-validate-result-fixture-surface
npm run browser:perspective-codex-former-local-adapter-validate-result-fixture-surface
npm run typecheck
npm run build
```

Browser validation is recorded in:

`reports/browser/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface.md`
