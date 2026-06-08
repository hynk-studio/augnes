# Perspective Ingress Admission Model Validation

Date: 2026-06-08

Branch: `codex/perspective-ingress-admission-model-v0-1`

Commit: pending final commit

## Preflight Result

PASS. PR #449, "Add Perspective Agent Brief read surface", is merged into `main` with merged timestamp `2026-06-08T02:34:06Z`.

`origin/main` contains:

- `types/perspective-agent-brief.ts`
- `lib/readonly-api/perspective-agent-brief.ts`
- `app/api/augnes/read/perspective-agent-brief/route.ts`
- `docs/PERSPECTIVE_AGENT_BRIEF_READ_SURFACE_V0_1.md`
- `scripts/smoke-perspective-agent-brief-read-surface.mjs`

## Files Changed

- `types/perspective-ingress-admission.ts`
- `lib/perspective-ingest/perspective-ingress-admission-model.ts`
- `docs/PERSPECTIVE_INGRESS_ADMISSION_MODEL_V0_1.md`
- `scripts/smoke-perspective-ingress-admission-model.mjs`
- `reports/2026-06-07-perspective-ingress-admission-model.md`
- `package.json`
- Narrow existing smoke allowlist updates:
  - `scripts/smoke-perspective-agent-brief-read-surface.mjs`
  - `scripts/smoke-perspective-temporal-spatial-projection-builders.mjs`
  - `scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs`
  - `scripts/smoke-perspective-capsule-contract.mjs`

## Model Summary

This slice adds type-only and pure helper definitions for Perspective ingress admission candidates.

The model includes:

- ingress kinds for fixture, manual pasted text, future ChatGPT/Codex exports, OAuth document/calendar/email candidates, browser capture candidates, agent-submitted artifacts, and external pointers
- trust levels that keep OAuth, agent-submitted, and pointer-only sources distinct from fixture and local user-provided material
- admission states from `raw_quarantined` through redacted/episode candidates, preview/archive acceptance, rejection, and supersession
- redaction states and artifact classes
- authority boundary fields that explicitly keep external calls, persistence, graph DB writes, proof/evidence/readiness writes, Codex execution, GitHub mutation, OAuth token storage, and raw private content storage false by default

## Ingress / Consumption / Formation Distinction

Ingress providers are future input surfaces. They create candidates only.

Agent consumption surfaces such as the Agent Brief read route consume already-formed Perspective context. They are not ingress.

Augnes Formation remains the authority boundary that accepts, rejects, redacts, summarizes, and forms constellation nodes, Event Rail placement, tensions, next actions, and research perspective.

Ingress is not Formation. Agent consumption is not Ingress.

## Validation Notes

The dedicated smoke verifies:

- all required ingress kinds, trust levels, admission states, redaction states, and artifact classes
- default authority boundary false flags
- exact admission transition table
- OAuth candidates cannot be accepted for preview by default and do not store OAuth tokens or raw private content
- agent-submitted artifacts are untrusted by default
- fixture/manual bounded candidates are preview-eligible only with bounded summaries
- raw/private or OAuth-token authority flags block preview readiness
- formation summaries return bounded summaries and pointers only
- the Agent Brief read surface and Human Workbench Temporal Underlay remain present and independent
- no route, DB, migration, persistence, provider/model/API call, GitHub mutation, Codex execution, or UI files are changed

## Browser Validation

Skipped. This is a type/model/doc-only slice with no UI or route changes.

## Tests Run

- `npm run smoke:perspective-ingress-admission-model` PASS
- `npm run typecheck` PASS
- `npm run smoke:perspective-agent-brief-read-surface` PASS
- `npm run smoke:perspective-temporal-spatial-projection-builders` PASS
- `npm run smoke:cockpit-perspective-workbench-temporal-underlay` PASS
- `npm run smoke:perspective-ingest-constellation-preview` PASS
- `npm run build` PASS
- `git diff --check` PASS
- `git diff --cached --check` PASS

## Skipped Checks

- `npm run lint`: skipped because `package.json` does not define a `lint` script.
- `npm test`: skipped because `package.json` does not define a `test` script.
- Browser validation: skipped because this PR has no UI or route changes.

## Blockers / Risks

None.

Risk is limited to normal type/model contract drift; the model is covered by a dedicated smoke and existing Perspective/Agent Brief/Workbench smokes.

## Next Suggested Implementation PR

`Prototype local manual ingress admission preview`
