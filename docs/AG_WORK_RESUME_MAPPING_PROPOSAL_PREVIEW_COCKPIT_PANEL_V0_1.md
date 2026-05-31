# AG Work Resume Mapping Proposal Preview Cockpit Panel v0.1

## Purpose

The Cockpit Operator tab exposes an AG Resume Mapping Proposal Preview panel for
read-only Local B review. The panel lets an operator paste an already built and
preflighted AG Resume Packet, paste explicit Local B candidate work item JSON,
optionally choose `selected_candidate_id`, choose strict mode, and call the
existing read-only route:

`POST /api/ag-work-resume/mapping-proposal-preview`

The panel is proposal-only. It is not mapping confirmation, not import
authorization, not persistence, not proof/evidence authorization, not Codex
execution authority, and not merge/publish authority.

## Relationship To Existing Pieces

- Mapping/import authority gate:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md` defines the
  future gated mapping/import stages. This panel remains Stage A preview-only.
- Pure mapping proposal preview:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_V0_1.md` documents the pure
  deterministic proposal helper that returns review metadata only.
- Local helper:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_HELPER_V0_1.md` documents the
  local env/file/stdin helper. The Cockpit panel uses the route surface instead.
- Read-only route:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_ROUTE_V0_1.md` documents the
  route this panel calls. The panel does not change route behavior.
- Target preview Cockpit panel:
  `docs/AG_WORK_RESUME_TARGET_PREVIEW_COCKPIT_PANEL_V0_1.md` established the
  Cockpit Operator tab pattern for local parse failures, safe fixtures,
  error-state fixtures, accessibility grouping, browser verification, and
  static smoke coverage.

## Cockpit Location

The panel lives in the Cockpit Operator tab near the existing AG Resume Target
Preview panel.

## Inputs

- `Mapping proposal packet JSON`: a required AG Resume Packet JSON textarea.
  The packet should already have been built and preflighted. This panel does
  not run packet preflight.
- `Local B candidate work items JSON`: an optional textarea whose value must be
  an array when present. Empty input sends `candidates: []`. The panel does not
  discover local work items.
- `Selected candidate id`: optional text input. Empty sends
  `selected_candidate_id: null`; multiple candidates without a selected id
  should return `needs_candidate`.
- `Strict mapping proposal preview`: checkbox sent as the route field
  `strict`. Strict mode treats repo gaps such as dirty worktree or missing
  expected files more conservatively.

## Fixture Buttons

- `Load safe mapping example packet`: loads a synthetic public-safe packet.
- `Load safe mapping example candidates`: loads a synthetic public-safe
  candidate array and matching selected candidate id.
- `Load no-candidate example`: loads a valid packet, clears candidates, and
  clears selected candidate id so the route returns `needs_candidate`.
- `Load conflicting candidate example`: loads a valid packet plus a conflicting
  candidate so the route returns `conflict`.
- `Load preflight-failing mapping packet`: loads a valid JSON packet that fails
  safely through target policy, such as `may_execute_codex: true`, so the route
  returns `blocked`.
- `Clear mapping proposal inputs`: clears packet, candidates, selected
  candidate id, strict mode, errors, result state, and busy state.

Fixture buttons update local React state only. They do not call routes, do not
use `localStorage`, `sessionStorage`, or `indexedDB`, and do not persist data.
Fixtures are synthetic and public-safe: no secrets, no fake tokens, no local
absolute paths, no raw database paths, no tunnel URLs, no private key markers,
no raw OpenAI responses, and no screenshot/media references.

## Request Behavior

The panel parses packet JSON and candidate JSON locally before any route call.
If packet parsing fails, no route call is made. If candidate parsing or shape
validation fails, no route call is made. Empty candidate input is treated as
`[]`; empty selected candidate id is treated as `null`.

The panel sends only this route:

`/api/ag-work-resume/mapping-proposal-preview`

The route body is:

```json
{
  "packet": {},
  "candidates": [],
  "selected_candidate_id": null,
  "strict": false,
  "source": {
    "reviewed_by_surface": "cockpit",
    "reviewed_at": "browser ISO timestamp"
  }
}
```

The timestamp is generated with `new Date().toISOString()` in the browser and
is not persisted.

## Output

The result section is labelled `Mapping proposal preview result` and displays:

- HTTP status.
- Route `ok`.
- `preview.status`.
- `preview.ok_for_user_core_review`.
- `recommended_next_step`.
- Match confidence label.
- Selected candidate summary.
- Comparison, including field labels, related state key overlap, and repo
  comparison.
- Gaps.
- Conflicts.
- Questions.
- Recommendations.
- Foreign refs summary.
- Authority boundary.

Visible safety copy states that `ok_for_user_core_review` means review only,
that foreign refs remain foreign, and that the panel creates no mapping,
import, work, proof/evidence, session, or Codex execution records.

## Error Behavior

- Packet JSON parse failure renders `Mapping packet error: ...`, marks the
  packet textarea with `aria-invalid`, and uses `role="alert"`.
- Candidate JSON parse or shape failure renders `Mapping candidates error: ...`,
  marks the candidate textarea with `aria-invalid`, and uses `role="alert"`.
- Route or non-JSON response failure renders `Mapping proposal route error: ...`
  and uses `role="alert"`.
- Blocked unsafe policy results and conflict results are still displayed as
  read-only route preview results when the route returns JSON.

## Accessibility Behavior

- The packet textarea, candidate textarea, selected candidate id input, and
  strict checkbox use real `label` / `htmlFor` associations.
- Helper text is linked with `aria-describedby`.
- Local parse errors use `role="alert"` and set `aria-invalid`.
- The result section uses `aria-live="polite"` and a stable labelled heading.
- Safe fixture controls, error/edge fixture controls, mapping proposal input
  controls, mapping proposal options, and mapping proposal action controls are
  grouped with accessible labels.
- Controls are native buttons, input, checkbox, and textarea elements.
- The panel adds no `role="button"` div/span controls and no custom keyboard
  shortcuts.

## Authority Boundary

- Read-only.
- Proposal-only.
- No DB/schema changes.
- No runtime discovery.
- No route-side DB reads.
- No persistence.
- No import.
- No mapping record creation.
- No import record creation.
- No work item creation.
- No proof/evidence recording.
- No session binding.
- No Direct Resume Code route.
- No relay.
- No Codex execution.
- No approval, publish, retry, replay, external posting, merge, auto-merge, or
  committed-state mutation.
- No localStorage, sessionStorage, indexedDB persistence.
- No telemetry or analytics.

Durable approval remains user/Core gated. Foreign refs remain foreign until a
separate reconciliation authority gate exists.

## Non-Goals

This panel does not add mapping confirmation, mapping persistence, import
persistence, work item creation, proof/evidence recording, session binding,
Codex execution controls, approval, publish, retry, replay, external posting,
merge, Direct Resume Code create/resolve routes, relay behavior, route changes,
database/schema changes, MCP/App tool schema changes, bridge tools, ChatGPT App
cards, hooks, plugins, skills, package runtime wiring beyond the smoke script,
secret-handling changes, telemetry, analytics, or committed-state mutation.

## Browser Verification Requirement

Because this slice changes rendered Cockpit UI, browser verification should
open the Cockpit Operator tab and verify safe candidate review, no-candidate,
conflict, blocked unsafe policy, local parse error, accessibility/keyboard
behavior, and absence of unauthorized controls.

The browser report for this slice is:

`reports/browser/2026-05-31-ag-work-resume-mapping-proposal-cockpit-panel-verification.md`

## Future Note

Mapping confirmation and persistence remain a separately gated future design.
This panel output is review metadata only and does not authorize any later
mapping/import/proof/evidence/session/Codex continuation stage.
