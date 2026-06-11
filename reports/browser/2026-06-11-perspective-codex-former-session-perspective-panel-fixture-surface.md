# Perspective Codex Former Session Perspective Panel Fixture Surface Browser Validation

Date: 2026-06-11 Asia/Seoul
Branch: `codex/perspective-codex-former-session-panel-fixture-surface-v0-1`
Local target route: `http://127.0.0.1:3000/cockpit/perspective/codex-former/session-perspective-panel-fixture`

## Setup Command

- Started local app with `npm run dev -- -H 127.0.0.1 -p 3000`.
- Opened route: `/cockpit/perspective/codex-former/session-perspective-panel-fixture`.
- Browser validation used DOM inspection, scenario click interactions, authority expansion, viewport override, console log inspection, and local resource inspection.
- No committed screenshot artifact was added; the matching PR #503 browser report uses markdown observations without committed images.

## Not prepared observations

- Not prepared scenario rendered by default.
- Scenario tab `Not prepared` was selected.
- Session Header appeared with read-only / review-only boundary, `Not prepared`, and accepted Augnes state false.
- Formation Timeline appeared with all seven steps `not_started`.
- Status Card appeared with caveat `Source input and prepare packet are not ready.`
- Evidence / Provenance Strip appeared with local deterministic in-code fixture path and no raw payload.
- Warning / Blocking Summary appeared open with pending prerequisites, not red/error treatment.
- Authority Boundary Box appeared and was collapsed by default.
- Action Guidance appeared as guidance copy only.
- Constellation Handoff Preview appeared with `Not ready`.

## Waiting for candidate observations

- Waiting for candidate scenario rendered after selecting its tab.
- Source input and prepare packet timeline steps were `complete`.
- Separate Codex session and returned candidate timeline steps were `waiting`.
- Validation, review candidate, and Constellation handoff were `not_started`.
- Status Card appeared with caveat `Returned Codex candidate envelope is missing.`
- Constellation Handoff Preview showed `Not ready`.
- No accepted-state implication appeared.
- No UI implied Augnes calls Codex, provider/model APIs, or Codex SDK.

## PASS with follow-up observations

- PASS with follow-up scenario rendered after selecting its tab.
- Status Card appeared with `PASS with follow-up` and `needs_review / pointer warning pressure`.
- Formation Timeline showed source input, prepare packet, separate Codex session, and returned candidate complete; validation and review candidate `needs_review`; Constellation handoff `ready`.
- Warning / Blocking Summary appeared with warning pressure and no blocked treatment.
- Authority Boundary Box expanded and showed compact tags including `no_accepted_state` and `no_db_write`.
- PASS scenario had read-only Constellation handoff available.
- Handoff link text was `Open read-only Constellation Preview`.
- Handoff href was `/cockpit/perspective/codex-former/constellation-preview-fixture`.
- No accepted-state implication in any scenario.

## BLOCKED observations

- BLOCKED scenario rendered after selecting its tab.
- Status Card appeared with `BLOCKED` and `blocked validation / provenance or candidate-count issue`.
- Formation Timeline showed validation, review candidate, and Constellation handoff as `blocked`.
- Warning / Blocking Summary appeared open/prominent by default.
- Blocking reasons were visible as bounded examples.
- Constellation Handoff Preview showed `Not available as usable review candidate`.
- BLOCKED scenario had no usable handoff.
- BLOCKED read as a stopped review result, not a system failure.

## Switching behavior

- Switching between all four scenarios worked.
- Selected tab state updated through `aria-selected`.
- Region set stayed stable across switches: Session Header, Formation Timeline, Status Card, Evidence / Provenance Strip, Warning / Blocking Summary, Authority Boundary Box, Action Guidance, and Constellation Handoff Preview.
- Not prepared and Waiting scenarios showed Not ready handoff.
- PASS showed the only read-only navigation link.
- BLOCKED showed no usable handoff link.
- No executable prepare/validate/Codex/GitHub/DB controls were present; the only buttons were the four scenario selector tabs.

## Accessibility / keyboard notes

- Session Header appeared.
- Formation Timeline appeared.
- Status Card appeared.
- Evidence / Provenance Strip appeared.
- Warning / Blocking Summary appeared.
- Authority Boundary Box appeared.
- Action Guidance appeared.
- Constellation Handoff Preview appeared.
- Scenario selector controls are native buttons with `role="tab"` and `aria-selected`.
- Warning / Blocking Summary and Authority Boundary Box use native `details` / `summary` controls with expanded/collapsed state.
- Keyboard traversal and focus basics worked at the focus-target and semantic-control level: four scenario tab buttons and two native summary controls were present and focusable in DOM order, and visible `:focus-visible` styling is defined.
- In-app browser direct Tab-key probing stayed on the current `summary` control after focus changed, so the report does not claim a complete sequential Tab walk as evidence.
- Warning and blocked indicators were not color-only: visible status labels, timeline status text, warning summary labels, blocked reason copy, and left-border shape treatment were present.

## Responsive / layout notes

- 390px viewport had no horizontal overflow.
- `window.innerWidth`: 390.
- `document.documentElement.scrollWidth`: 390.
- `document.body.scrollWidth`: 390.
- Overflowing element count: 0.
- Required regions remained present at 390px width.

## Console and traffic notes

- No raw unsafe/private markers appeared in page text.
- No console warnings/errors.
- Browser resource inspection reported zero external resources for the route after local load.
- No provider/model/GitHub/Codex/OpenAI/external traffic was observed.
- No localStorage/sessionStorage/clipboard path was exercised.
- No runtime fixture mutation, DB path, capture helper path, or live Codex session capture path was exercised.

## Result

PASS. The fixture-backed Codex Session Perspective Panel route rendered all four scenarios as a read-only, local/static/deterministic, non-persistent, non-authorizing surface. Browser validation caveat: direct sequential Tab traversal was limited by the in-app browser focus behavior described above, so keyboard evidence is based on semantic focus targets, native controls, visible focus styles, and bounded DOM inspection.
