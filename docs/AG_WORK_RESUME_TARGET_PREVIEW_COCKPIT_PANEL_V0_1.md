# AG Work Resume Target Preview Cockpit Panel v0.1

## Purpose

The Cockpit Operator tab exposes an AG Resume Target Preview panel for local
operator review. The panel lets a human paste an already built AG Resume Packet
JSON object and explicit Local B context JSON, then calls the read-only target
preview route:

`POST /api/ag-work-resume/target-preview`

The panel does not build packets, discover runtime context, import packets,
persist data, create work items, create mapping records, record proof/evidence,
bind sessions, start Codex, approve, publish, retry, replay, merge, or mutate
state.

## Inputs

- `AG Resume Packet JSON`: required JSON object. Invalid JSON is rejected in
  the browser before any route call.
- `Explicit Local B context JSON`: optional JSON object. Empty input sends
  `local: null`.
- `strict`: boolean checkbox passed through as `strict`.
- `skip_preflight`: boolean checkbox passed through as `skip_preflight`.

The request shape is:

```json
{
  "packet": {},
  "local": null,
  "strict": false,
  "skip_preflight": false
}
```

## Display Contract

The panel displays:

- route HTTP status and `ok`
- `preview.status`
- `preview.ok_to_continue` with visible text:
  `OK only for user/Core review. This is not Codex execution authority.`
- `recommended_next_step`
- preflight `ran`, `ok`, `status`, warnings, and failures
- preview gaps, conflicts, warnings, and recommendations
- `authority_boundary.boundaries`
- `packet_summary.foreign_refs`

Foreign refs remain foreign until user/Core confirms mapping and separate
authority choices.

## Authority Boundary

- Read-only Operator tab surface.
- Uses an already built packet and explicit Local B context.
- No import/persist/work item/mapping/proof/evidence/session/Codex
  execution/approval/publish/retry/replay/merge/state mutation.
- `ok_to_continue` means user/Core review only.
- Copy or display controls, if added later, may copy only displayed data and
  must not call write routes.

## Implementation Notes

- The panel is implemented in `components/augnes-cockpit.tsx`.
- The route remains the existing read-only
  `/api/ag-work-resume/target-preview` route.
- This slice does not modify route behavior, database/schema behavior,
  MCP/App tool schema, bridge behavior, ChatGPT widgets, hooks, plugins,
  skills, package runtime wiring, or secret handling.

## Verification

Expected checks for this slice:

```bash
npm run typecheck
npm run smoke:ag-work-resume-target-preview-cockpit-panel
npm run smoke:ag-work-resume-target-preview-route
npm run smoke:ag-work-resume-target-preview-helper
npm run smoke:ag-work-resume-target-preview
npm run smoke:ag-work-resume-packet-builder-preview
npm run smoke:ag-work-resume-packet-preflight
npm run smoke:codex-handoff-preflight
npm run smoke:chatgpt-work-contract-card
npm run smoke:current-runtime-codex-handoff-contract
npm run smoke:current-runtime-dogfood-readiness
node --check scripts/smoke-ag-work-resume-target-preview-cockpit-panel.mjs
git diff --check
```

Browser verification should open the Cockpit Operator tab, use a safe synthetic
fixture, confirm the visible inputs, result sections, boundary text, and confirm
no unauthorized controls or write actions appear in the panel.
