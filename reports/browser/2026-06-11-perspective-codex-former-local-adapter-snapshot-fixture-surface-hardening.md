# Perspective Codex Former Local Adapter Snapshot Fixture Surface Hardening Browser Validation

## Date

2026-06-11 Asia/Seoul

## Branch

`codex/perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening-v0-1`

## Route

`/cockpit/perspective/codex-former/local-adapter-snapshot-fixture`

Validated URL:

`http://127.0.0.1:3000/cockpit/perspective/codex-former/local-adapter-snapshot-fixture`

## Setup command

`npm run dev -- -H 127.0.0.1 -p 3000`

## Browser / tool used

Codex in-app Browser against the local Next.js dev server, with Playwright DOM
snapshots/evaluation, DOM CUA checks, viewport overrides, and console log reads.

## Route load observations

The route loaded with document title `Augnes` and the expected local URL. The
page rendered `Local Adapter Snapshot Fixture Surface`, the fixture boundary
chips, Session Panel Preview, Capture Review Inbox Preview, and Integration
Readiness.

Default scenario selector was prepared. The prepared default showed the prepared
state, inbox all filter, and prepared inbox item as pressed local controls.

No raw prompt/source/packet/private marker text was visible. The browser check
looked for common raw/private markers such as fenced raw blocks, API key marker
text, and token marker text; none were present.

## Session Panel scenario observations

Switched to not_ready. The not_ready scenario button became pressed and the
status card rendered accepted state false, review-only true, validation
available false, Constellation available false, returned candidate available
false, review candidate available false, and prepare_helper_executed false.

Switched to waiting. The waiting scenario button became pressed and preserved the
same non-authorizing boundary: accepted state false, review-only true,
validation unavailable visible, Constellation unavailable visible, returned
candidate unavailable visible, and no review candidate.

Switched to prepared. The prepared scenario button became pressed and the
prepared note rendered: local snapshot inspection only, not approved, not
reviewable, not validated, and not a graph handoff.

Prepared status/caveat/next action visible. The prepared card showed
`Prepared, waiting for Codex return`, `Manual Codex return has not been
captured.`, and the next safe action requiring a separate user-started Codex
session and exactly one returned candidate envelope.

accepted state false visible. review-only visible.
prepare_helper_executed operational provenance only visible. Constellation
unavailable visible. validation unavailable visible. returned candidate
unavailable visible.

The Local Snapshot / Handoff Boundary section rendered local snapshot inspection
as visible while graph/review handoff, runtime/product navigation, and
validation handoff rendered unavailable.

## Inbox filter and selection observations

all filter showed 3 items.

not_ready filter showed the not_ready item.

waiting filter included the waiting and prepared items.

prepared filter showed only the prepared item.

selected prepared item shows reviewability waiting.

selected prepared item shows not reviewable.

selected prepared item shows candidate count 0.

selected prepared item shows blocked count 0.

reviewable count 0 visible.

The selected prepared item also showed accepted state false, validation
unavailable true, Constellation unavailable true, and review candidate
unavailable true.

no anchors or controls for unavailable safe links. The main app surface had zero
anchors. The local snapshot/handoff availability rows rendered unavailable
handoffs as inert text, not links or action controls.

## Integration Readiness observations

ready_for_ui_implementation was framed as implementation readiness only. The
copy explicitly said it was not product readiness, validation, acceptance, or
runtime handoff.

Authority rows rendered provider_model_calls false, codex_sdk_calls false,
github_api_calls false, network_calls false, db_writes false,
clipboard_automation false, validate_helper_executed false, and core_decision
false. prepare_helper_executed rendered only as operational provenance.

## Denylist/action-control observations

denylist terms only in policy section. The policy section displayed Accept,
Approve, Promote, Reject, Merge, Deploy, Validate, Run Codex, PASS, and BLOCKED
as non-interactive policy badges/list content.

0 forbidden action buttons/links/aria-labels. Runtime inspection of main-surface
buttons, links, inputs, selects, textareas, role=button elements, and tabindex
elements found no exact denylisted action labels in visible control text or
aria-labels.

The inbox item controls use neutral `hold reason count` wording so the BLOCKED
denylist term is not carried by interactive control text. The selected item
summary still records `blocked_reason_count 0` as non-control detail.

## Keyboard traversal observations

Focusable-order evidence from the browser DOM showed scenario buttons first,
then Session Panel summary controls, inbox filters, inbox item selection buttons,
inbox summary controls, and readiness summary controls.

Tab traversal reached scenario selector: the first focusable app controls are
the scenario selector buttons, each with an explicit local-only aria-label and
aria-pressed state.

Tab traversal reached inbox filters: the DOM focus order includes all,
not_ready, waiting, and prepared filter buttons after the Session Panel details
summaries.

Tab traversal reached item selection: the DOM focus order includes all three
inbox item selection buttons with local-selection-only aria labels and no action
labels.

Tab traversal reached details/summary controls: the DOM focus order includes
Evidence Cards, Authority Details, Evidence Summary, Authority Summary, Browser
Validation Matrix, and Prohibited Control Copy / Denylist summary controls.

Browser limitation: attempted synthetic Tab traversal through CUA, DOM CUA, and
Playwright keypress APIs stayed pinned to the focused not_ready scenario button
in the in-app Browser runtime. This report therefore treats the keyboard result
as DOM focusability/order evidence plus successful click activation, not as a
successful synthetic Tab-key walk.

## Responsive/layout observations

desktop width had no horizontal overflow. At 1280px, document scroll width and
body scroll width were 1280px, and the H1, prepared copy, boundary, inbox, and
readiness sections were present.

768px viewport had no horizontal overflow. At 768px, document scroll width and
body scroll width were 768px, and the H1, prepared copy, boundary, inbox, and
readiness sections were present.

390px viewport had no horizontal overflow. At 390px, document scroll width and
body scroll width were 390px, and the H1, prepared copy, boundary, inbox, and
readiness sections were present.

## Local-only/runtime observations

No console warnings/errors. The in-app Browser console read returned no warning
or error entries.

No provider/model/GitHub/Codex/OpenAI/external traffic was observed. Runtime
resource inspection found no cross-origin resources. No provider, model,
GitHub, Codex, OpenAI, or external endpoints appeared during route load or local
interactions.

No fetch/XMLHttpRequest route behavior observed. Runtime resource inspection
found no fetch or XMLHttpRequest entries for the route interactions.

No localStorage/sessionStorage/clipboard path was exercised. The app surface did
not expose or trigger storage or clipboard behavior during validation; storage
reads from the Browser's read-only evaluation context were unavailable, and no
clipboard API was invoked.

## Details toggles

Evidence Cards summary opened and closed successfully. The Prohibited Control
Copy / Denylist details remained open as expected so the policy-only denylist
badges stayed visible.

## Result

PASS
