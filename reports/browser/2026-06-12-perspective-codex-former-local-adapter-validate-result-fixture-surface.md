# Perspective Codex Former Local Adapter Validate Result Fixture Surface Browser Validation

Date: 2026-06-12

Route:

`http://127.0.0.1:3000/cockpit/perspective/codex-former/local-adapter-validate-result-fixture`

Path:

`/cockpit/perspective/codex-former/local-adapter-validate-result-fixture`

## Environment

- Command: `npm run dev -- -H 127.0.0.1 -p 3000`
- Browser: Codex in-app browser
- Surface marker: `data-augnes-surface="codex-former-local-adapter-validate-result-fixture"`

## Route Health

- PASS: route loads successfully.
- PASS: default scenario is `PASS with follow-up`.
- PASS: default selected inbox item is `local-adapter-validation-pass-with-follow-up`.
- PASS: No console warnings/errors.
- PASS: No unexpected external traffic. Observed external resource list was empty.
- PASS: page rendered zero anchors, so safe links are availability text only and not clickable external navigation.
- PASS: route uses local fixture state only; scenario/filter/item interactions did not mutate the URL.
- PASS: no clipboard automation was exercised.

## Scenario Matrix

| Scenario | Visible | Switch Result |
| --- | --- | --- |
| `validation-pass` | PASS scenario visible | PASS: selecting it rendered `PASS` and pressed `validation-pass`. |
| `validation-pass-with-follow-up` | PASS with follow-up scenario visible | PASS: selecting it rendered `PASS with follow-up` and pressed `validation-pass-with-follow-up`. |
| `validation-blocked` | BLOCKED scenario visible | PASS: selecting it rendered `BLOCKED` and pressed `validation-blocked`. |

scenario switching works.

## Inbox Filter Matrix

| Filter | Result |
| --- | --- |
| `all` | PASS: inbox filter all works and showed all three items. |
| `reviewable` | PASS: inbox filter reviewable works and showed `local-adapter-validation-pass`. |
| `reviewable_with_follow_up` | PASS: inbox filter reviewable_with_follow_up works and showed `local-adapter-validation-pass-with-follow-up`. |
| `blocked` | PASS: inbox filter blocked works and showed `local-adapter-validation-blocked`. |

item selection works: selecting `local-adapter-validation-blocked` and then `local-adapter-validation-pass-with-follow-up` updated the selected item marker.

## Expanded Details

- PASS: expanded details render path/hash/authority fields.
- PASS: `validation_summary_path` and `validation_summary_hash` appeared in expanded details.
- PASS: `source_input_hash`, `prepare_execution_summary_hash`, and `returned_envelope_hash` appeared in expanded details.
- PASS: authority details rendered `false / non-authorizing`.
- PASS: safe links are availability text only. `validation_summary href` rendered `null`; no anchor elements were present.

## Copy And Authority

- PASS: PASS does not imply accepted/approved/product-ready/mergeable/Core decision.
- PASS: PASS with follow-up remains review-only.
- PASS: PASS with follow-up remains review material only.
- PASS: BLOCKED is not automated rejection.
- PASS: No Accept/Approve/Promote/Reject/Merge/Deploy/Persist/Export/Run Codex/Call Provider controls were present.
- PASS: The denylist wording appears only inside the policy disclosure as non-executable text.
- PASS: accepted state false, review decision false, product readiness false, Constellation handoff false, and runtime handoff false remained visible.

## Keyboard

- PASS: Keyboard traversal covered scenario buttons, filter buttons, item selection, and details via native focusable-order inspection. The focusable order included all scenario buttons, the two Session Panel details summaries, all four filter buttons, all three item buttons, the inbox details summaries, the summary authority disclosure, and the policy disclosure.
- NOTE: the in-app browser wrapper's synthetic Tab dispatch stayed on `<body>`/the focused button during this run, so the report uses native focusable-order inspection plus native element types rather than claiming a successful synthetic Tab walk.
- PASS: all scenario/filter/item controls are native buttons with `aria-pressed`; all expanded detail controls are native `summary` elements.

## Viewports

| Viewport | Result |
| --- | --- |
| 390px | PASS: 390px viewport had no horizontal overflow. `scrollWidth=390`, `clientWidth=390`. |
| 768px | PASS: 768px viewport had no horizontal overflow. `scrollWidth=768`, `clientWidth=768`. |
| Desktop 1280px | PASS: desktop viewport had no horizontal overflow. `scrollWidth=1280`, `clientWidth=1280`. |

## Local-Only Boundary

- PASS: No unexpected external traffic.
- PASS: no provider/model, GitHub, Codex, DB, persistence, runtime handoff, accepted-state, review-decision, product-readiness, export, or clipboard control was rendered.
- PASS: no raw returned candidate content, raw prompt text, raw source packet, hidden reasoning, provider logs, secrets, browser dumps, raw diffs, raw review payloads, raw source payloads, raw candidate payloads, private markers, or unsafe marker values were visible in the UI surface.
