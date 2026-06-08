# Perspective Ingress Admission Observatory Summary Browser Validation

Date: 2026-06-08

## Branch

`codex/perspective-ingress-admission-observatory-summary-v0-1`

## Commit

Pending final commit.

## Preflight Result

PASS. PR #451, "Prototype local manual ingress admission preview", is merged
into `main` at merge commit `3fc403181b4b347b8d7adb6e1237f9b1d49f25a4`.
`origin/main` contains optional `ingress_admission` response metadata, local
manual pasted-text preview responses attaching `ingress_admission`,
`docs/PERSPECTIVE_LOCAL_MANUAL_INGRESS_ADMISSION_PREVIEW_V0_1.md`, and
`scripts/smoke-perspective-local-manual-ingress-admission-preview.mjs`.

## Files Changed

- `components/augnes-cockpit.tsx`
- `app/globals.css`
- `docs/PERSPECTIVE_INGRESS_ADMISSION_OBSERVATORY_SUMMARY_V0_1.md`
- `scripts/smoke-cockpit-perspective-ingress-admission-observatory-summary.mjs`
- `reports/browser/2026-06-07-perspective-ingress-admission-observatory-summary.md`
- `package.json`
- Existing Perspective smoke allowlists:
  - `scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs`
  - `scripts/smoke-perspective-agent-brief-read-surface.mjs`
  - `scripts/smoke-perspective-ingress-admission-model.mjs`
  - `scripts/smoke-perspective-local-manual-ingress-admission-preview.mjs`
  - `scripts/smoke-perspective-temporal-spatial-projection-builders.mjs`

## Browser Validation Setup

```sh
AUGNES_DB_PATH=/tmp/augnes-perspective-ingress-admission-summary.db npm run db:reset
AUGNES_DB_PATH=/tmp/augnes-perspective-ingress-admission-summary.db npm run db:migrate
AUGNES_DB_PATH=/tmp/augnes-perspective-ingress-admission-summary.db npm run demo:seed
AUGNES_DB_PATH=/tmp/augnes-perspective-ingress-admission-summary.db npx next dev -H 127.0.0.1 -p 3000
```

Port 3000 was free before startup. The dev server was stopped after validation.

## Browser Findings

- PASS: Perspective opened as the default active surface.
- PASS: Default Human Workbench remained compact with the primary workbench hook
  and `workbench-temporal-underlay` view.
- PASS: Default first view did not show the Ingress admission summary.
- PASS: Default sample fixture view showed 7 nodes, 8 edges, and 2 tensions.
- PASS: Default starmap did not show all edge labels/summaries.
- PASS: Temporal Underlay rendered after the async preview load.
- PASS: Opening Observatory details on the sample fixture did not show a
  misleading ingress admission summary.
- PASS: Manual pasted-text preview loaded through the existing UI inside
  Advanced diagnostics.
- PASS: Before opening Observatory details, the manual preview still did not
  show the ingress admission summary.
- PASS: Opening Observatory details after manual preview showed the compact
  Ingress admission summary.
- PASS: Summary showed manual pasted text, user provided local, episode
  candidate, accepted for preview, preview ready, local / read-only, no
  persistence, no graph DB, no Codex, and no GitHub.
- PASS: Summary did not show the raw pasted-text line used for validation.
- PASS: Summary did not show raw JSON shape, `ingress_admission`, or
  `input_text`.
- PASS: Summary did not contain a textarea.
- PASS: Summary data attributes were categorical only and did not include
  candidate id, source ref, bounded summary, pointer refs, actor refs, consent
  refs, raw text, token, API, model, billing, or prompt data.
- PASS: Packet preview textarea remained absent before opening packet preview.
- PASS: Full Event Rail remained reachable behind Temporal details with
  `data-augnes-event-rail-view="node-edge"` and the PR passive reference node.
- PASS: Manual Gravity remained behind closed Advanced preview controls.
- PASS: At a 390px viewport, the page and summary had no horizontal overflow.
- PASS: Browser console warnings/errors: none.
- PASS: Dev-server traffic stayed local to app/read endpoints plus the existing
  local manual preview POST.
- PASS: No provider/model/GitHub/Codex/OpenAI/external/billing traffic was
  observed.

## Tests Run

Recorded in the PR body after final validation.

## Skipped Checks

None for browser validation.

## Blockers / Risks

No blockers. Risk is limited to UI copy/contract drift for the compact summary;
the smoke test checks hooks, gating, no raw JSON rendering, no forbidden data
attributes, and no route/DB/provider surface changes.

## Next Suggested Implementation PR

Add local manual ingress admission to Agent Brief context.
