# Local Codex Adapter Operator Flow Report

## Summary

This PR follows PR #529 by reducing user work inside the existing operator flow instead of adding another closeout or hardening layer. The route at `/cockpit/perspective/codex-former/local-adapter-operator-flow` now has a primary `Run local validation` action that posts the selected source/prepare refs plus the returned envelope textarea content to a local Node bridge.

The bridge at `/api/perspective/codex-former/local-adapter-operator-flow/validate` calls the existing validate orchestration execution library directly and returns a bounded result marked `real_local_validate_execution`.

## Changed Files

- `app/cockpit/perspective/codex-former/local-adapter-operator-flow/page.tsx`
- `app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.tsx`
- `app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.module.css`
- `app/api/perspective/codex-former/local-adapter-operator-flow/validate/route.ts`
- `lib/perspective-ingest/codex-former-local-adapter-operator-flow.ts`
- `lib/perspective-ingest/codex-former-local-adapter-operator-flow-local-validate.ts`
- `scripts/smoke-perspective-codex-former-local-adapter-operator-flow.mjs`
- `scripts/browser-smoke-perspective-codex-former-local-adapter-operator-flow.mjs`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_V0_1.md`
- `reports/2026-06-12-perspective-codex-former-local-adapter-operator-flow.md`
- `reports/browser/2026-06-12-perspective-codex-former-local-adapter-operator-flow.md`

## Bridge Behavior

`Run local validation` runs the real local validate execution path through `buildCodexFormerLocalAdapterValidateExecutionSummary`. It renders `result_state`, `execution_result`, `failure_kind`, candidate count, warnings, pointer warnings, blocked reasons, next safe action, candidate-compatible review material, worker-facing guidance status, candidate basis/authority, source/prepare/returned-envelope hashes, local validation summary hash, and authority flags.

The PASS / PASS with follow-up / BLOCKED committed returned-envelope fixtures validate through the same bridge as PASS, PASS with follow-up, and BLOCKED. Malformed textarea content returns a visible BLOCKED result with blocked reasons instead of crashing the route.

## Preview Boundary

`Preview fixture result` remains as a secondary aid and is visibly marked `fixture_preview`. It is not the primary path and does not replace local validation execution.

## Local-Only Boundary

The bridge is local-only and non-authorizing. It does not call provider/model APIs, Codex, Codex SDK, GitHub, product DB, Core, or external network services. It creates no accepted Augnes state, no review decision, no proof/evidence/readiness records, no runtime handoff, no product handoff, and no automatic promotion.

Returned envelope text is still saved only after explicit `Save draft locally`. Automatic localStorage updates persist bounded metadata, including `validation_result_state` and `validation_result_source`, but do not store raw returned envelope text by default.

## Browser Validation

Browser validation covers route load, no console warnings/errors, no unexpected external traffic, textarea visibility, PASS/PASS with follow-up/BLOCKED fixture loading, `Run local validation` results, malformed envelope BLOCKED handling, `real_local_validate_execution` source display, localStorage metadata updates, candidate action selection after PASS validation, refresh/clear draft behavior, and 390px / 768px / desktop overflow checks.

## Next Recommended PR

Add local accepted-candidate draft model and persistence boundary inside the operator flow, using the actual validation result as input.
