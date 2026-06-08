# Perspective Local Manual Ingress Admission Preview Validation

Date: 2026-06-08

## Branch

`codex/perspective-local-manual-ingress-admission-preview-v0-1`

## Commit

Pending final commit.

## Preflight Result

PASS. PR #450, "Design Perspective ingress admission model for external/OAuth
sources", is merged into `main` at `90e75875f6de9fd32c9324f58b34a24c6ae67b29`.
`origin/main` contains:

- `types/perspective-ingress-admission.ts`
- `lib/perspective-ingest/perspective-ingress-admission-model.ts`
- `docs/PERSPECTIVE_INGRESS_ADMISSION_MODEL_V0_1.md`
- `scripts/smoke-perspective-ingress-admission-model.mjs`

## Files Changed

- `types/perspective-ingest-constellation-preview.ts`
- `lib/readonly-api/perspective-ingest-local-preview.ts`
- `app/api/augnes/read/perspective-ingest-local-preview/route.ts`
- `docs/PERSPECTIVE_LOCAL_MANUAL_INGRESS_ADMISSION_PREVIEW_V0_1.md`
- `scripts/smoke-perspective-local-manual-ingress-admission-preview.mjs`
- `scripts/smoke-perspective-ingest-local-pasted-text-preview.mjs`
- `scripts/smoke-perspective-ingress-admission-model.mjs`
- `scripts/smoke-perspective-agent-brief-read-surface.mjs`
- `scripts/smoke-perspective-temporal-spatial-projection-builders.mjs`
- `scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs`
- `package.json`
- `reports/2026-06-07-perspective-local-manual-ingress-admission-preview.md`

## Model Summary

The existing local manual pasted-text preview now builds a bounded
`manual_pasted_text` ingress candidate from the already-bounded manual episode.
The candidate uses `user_provided_local` trust, `episode_candidate` admission
state, `not_applicable` redaction state, and the default local/read-only ingress
authority boundary.

The route admits the candidate to preview only when:

- `getPerspectiveIngressFormationReadiness(candidate).eligible_for_preview` is
  true.
- `buildPerspectiveIngressAdmissionDecision(... accepted_for_preview ...)`
  returns an allowed decision.

Successful manual preview responses now include optional `ingress_admission`
metadata with candidate projection, readiness, decision, and source summary.
Fixture sample preview responses are unchanged.

## Ingress / Preview / Formation Distinction

Manual pasted text is ingress material, not Formation authority. The new
metadata shows that the input became a bounded candidate before the existing
preview episode and constellation response were built. Augnes Formation remains
responsible for constellation construction, temporal placement, research
perspective, tensions, next actions, and projection generation.

## API Validation

Setup:

```sh
AUGNES_DB_PATH=/tmp/augnes-perspective-local-manual-ingress-admission-preview.db npm run db:reset
AUGNES_DB_PATH=/tmp/augnes-perspective-local-manual-ingress-admission-preview.db npm run db:migrate
AUGNES_DB_PATH=/tmp/augnes-perspective-local-manual-ingress-admission-preview.db npm run demo:seed
AUGNES_DB_PATH=/tmp/augnes-perspective-local-manual-ingress-admission-preview.db npx next dev -H 127.0.0.1 -p 3000
```

Results:

- PASS: safe manual pasted-text POST returned 200.
- PASS: response included `ingress_admission`.
- PASS: candidate was `manual_pasted_text` / `user_provided_local`.
- PASS: readiness returned `eligible_for_preview: true`.
- PASS: decision returned `allowed: true` and `to_state: "accepted_for_preview"`.
- PASS: `ingress_admission` did not include the raw `input_text` verbatim and
  did not include an `input_text` field.
- PASS: empty input failed closed with 400 / `missing_input_text`.
- PASS: secret-like input failed closed with 400 / `secret_like_input`.
- PASS: rejected error responses did not echo rejected raw input.
- PASS: dev-server log showed only three local POST requests to
  `/api/augnes/read/perspective-ingest-local-preview?scope=project:augnes`.

## Tests Run

- PASS: `npm run typecheck`
- PASS: `npm run smoke:perspective-local-manual-ingress-admission-preview`
- PASS: `npm run smoke:perspective-ingest-local-pasted-text-preview`
- PASS: `npm run smoke:perspective-ingress-admission-model`
- PASS: `npm run smoke:perspective-agent-brief-read-surface`
- PASS: `npm run smoke:perspective-temporal-spatial-projection-builders`
- PASS: `npm run smoke:cockpit-perspective-workbench-temporal-underlay`
- PASS: `npm run smoke:perspective-ingest-constellation-preview`
- PASS: `npm run build`

Final whitespace checks are recorded in the PR body after staging.

## Skipped Checks

- `npm run lint`: skipped because `package.json` has no `lint` script.
- `npm test`: skipped because `package.json` has no `test` script.
- Browser validation: skipped because this is a read-route response metadata
  slice with no Human Workbench UI changes. API validation was performed
  instead.

## Blockers / Risks

No blockers. Risk is limited to manual preview response contract drift; the new
metadata and existing preview behavior are covered by smoke tests and API
validation.

## Next Suggested Implementation PR

Add compact ingress admission summary to Observatory details.
