# Perspective Codex Former Constellation Preview Fixture Surface Browser Validation

Date: 2026-06-11 Asia/Seoul
Branch: `codex/perspective-codex-former-constellation-preview-fixture-surface-v0-1`
Local target: `http://127.0.0.1:3000/cockpit/perspective/codex-former/constellation-preview-fixture`

## Setup

- Started local app with `npm run dev -- -H 127.0.0.1 -p 3000`.
- Visited route: `/cockpit/perspective/codex-former/constellation-preview-fixture`.
- Browser validation used DOM inspection, click interactions, viewport override, console log inspection, and a visual screenshot captured in-session for layout review.
- No committed screenshot artifact was added; existing repo browser reports commonly use markdown observations without committed images.

## PASS Fixture Default View

- PASS fixture default view rendered.
- `PASS with follow-up` tab was selected by default.
- Summary Strip appeared with `PASS with follow-up`, review-only `true`, and accepted Augnes state `false`.
- Graph Canvas appeared with 11 nodes and 10 edges.
- PASS graph included `Review candidate`, `Worker guidance`, and `Next action 1`.
- Warning Panel appeared and was collapsed by default while still showing pointer warning pressure.
- Authority Lens existed and was collapsed by default.
- Legend appeared as a collapsed details region.
- No accepted-state implication in PASS view.
- At most two badges per node.
- No raw unsafe/private markers appeared in page text.

## PASS Interactions

- Authority Lens expanded.
- Node detail selected for `Review candidate`; Detail Panel showed `Review candidate details`.
- Edge detail selected for `Review candidate -> Worker guidance`; Detail Panel showed `informs edge details`.
- Legend expanded.
- Browser console warnings/errors: none.

## BLOCKED Fixture View

- BLOCKED fixture view rendered after selecting the `BLOCKED` tab.
- Summary Strip appeared with `BLOCKED`, review-only `true`, and accepted Augnes state `false`.
- Graph Canvas appeared with 9 nodes and 8 edges.
- Warning Panel appeared and was open by default.
- Authority Lens existed and reset to collapsed by default after fixture switch.
- BLOCKED view did not show review_candidate / worker_guidance / next_action as usable material.
- Blocking validation reasons were visible.
- Blocked and warning indicators were not color-only: visible text labels, status chips, dashed/dotted/blocked line style labels, and left-border shape treatments were present.
- At most two badges per node.
- No raw unsafe/private markers appeared in page text.

## Responsive / Layout

- Desktop summary strip had no overlap after inspection.
- Mobile viewport `390 x 900` rendered Summary Strip and Graph Canvas.
- `window.innerWidth`: 390.
- `documentElement.scrollWidth`: 390.
- `body.scrollWidth`: 390.
- Overflowing element count: 0.

## Console And Traffic

- Browser console warnings/errors: none.
- Dev server traffic observed only local route requests:
  - `GET /cockpit/perspective/codex-former/constellation-preview-fixture`
- No provider/model/GitHub/Codex/OpenAI/external traffic was observed.
- No DB, capture-helper, runtime-ingestion, localStorage, sessionStorage, or clipboard path was exercised.

## Result

PASS. The fixture surface renders PASS with follow-up and BLOCKED adapted preview data as a read-only, fixture-backed, non-persistent, non-authorizing Cockpit/Perspective surface.
