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
- `Strict target preview`: boolean checkbox passed through as `strict`.
  Help copy: `Treat dirty worktree / repo gaps more conservatively.`
- `Skip packet preflight`: boolean checkbox passed through as
  `skip_preflight`. Help copy:
  `Debug only; not recommended before relying on a preview.`
  When checked, the panel also warns:
  `Debug only; run ag:resume-preflight before relying on this preview.`

## Copied Packet Validation

The panel includes a read-only copied-packet validation affordance:

- `Validate pasted packet only`

This button parses only `AG Resume Packet JSON` in local React/browser state.
It does not require or parse `Explicit Local B context JSON`.

It calls the existing read-only route:

`POST /api/ag-work-resume/target-preview`

The validation request always sends:

```json
{
  "packet": {},
  "local": null,
  "strict": true,
  "skip_preflight": false
}
```

Copied-packet validation always runs strict preflight. It ignores the
skip-preflight checkbox. `context_only` is expected for packet-only validation
when the packet passes and `local: null` is sent.

The validation result section is visually distinct from the full target preview
result and displays:

- HTTP status
- route `ok`
- preflight `ran`, `ok`, `status`, warnings, and failures
- route `recommended_next_step`
- `preview.status`, when returned
- text that `context_only` is expected for packet-only validation because
  Local B context is sent as null
- text that validation is read-only packet review, not mapping, import,
  persistence, or execution authority

Copied-packet validation is read-only packet review only. It does not map,
import, persist, create work items, create mapping records, record
proof/evidence, bind sessions, execute Codex, approve, publish, retry, replay,
merge, mutate state, call Direct Resume Code routes, or relay packet data.

## Safe Example Fixtures

The panel includes local UI affordances for public-safe examples:

- `Load safe example packet`
- `Load safe example Local B context`
- `Clear AG resume inputs`

The fixture buttons update local React state only. They do not call routes,
write to runtime state, import or persist packets, create work items, create
mapping records, record proof/evidence, bind sessions, or store anything in
`localStorage`, `sessionStorage`, or `indexedDB`.

The fixtures are synthetic, public-safe, and not persisted. They must contain
no secrets, local absolute paths, raw DB paths, tunnel URLs, real tokens,
screenshots/media, or raw OpenAI responses. When both fixtures are loaded, the
preview remains a read-only route call through the normal preview button.

Loading the safe example packet may clear old copied-packet validation and full
preview results. Loading the safe Local B context may clear old full-preview
results. Clearing AG resume inputs clears packet and Local B textareas,
copied-packet validation result/error state, full-preview result/error state,
and local checkbox state. These controls do not call routes or persistence.

The request shape is:

```json
{
  "packet": {},
  "local": null,
  "strict": false,
  "skip_preflight": false
}
```

## Error-State Fixtures

The panel includes local-only error-state fixtures:

- `Load malformed packet JSON`
- `Load malformed Local B context JSON`
- `Load preflight-failing packet example`

Error fixtures are synthetic, public-safe, local UI state only, and not
persisted. Error fixture buttons do not call routes, write runtime state,
import or persist packets, create work items, create mapping records, record
proof/evidence, bind sessions, or store anything in `localStorage`,
`sessionStorage`, or `indexedDB`.

`Load malformed packet JSON` populates the AG Resume Packet textarea with
deliberately malformed JSON. Copied-packet validation and full preview both
fail locally before any route call when this fixture is submitted.

`Load malformed Local B context JSON` populates the Local B context textarea
with deliberately malformed JSON. Full preview fails locally before the route
call when the packet is valid and the Local B context fixture is malformed.
Copied-packet validation ignores Local B context and still sends `local: null`,
`strict: true`, and `skip_preflight: false`.

`Load preflight-failing packet example` populates the packet textarea with valid
JSON that is public-safe but fails strict packet preflight through safe
policy/redaction/schema failure conditions, not through fake secrets, fake
tokens, raw DB paths, local absolute paths, tunnel URLs, raw OpenAI response
text, or screenshots/media references.

Packet validation failures are read-only packet review results. They do not
imply mapping, import, persistence, work item creation, mapping record
creation, proof/evidence recording, session binding, Codex execution,
approval, publish, retry, replay, external posting, merge, or state mutation
authority.

## Display Contract

The panel displays:

- route HTTP status and `ok`
- Preview status, with raw `preview.status` meaning still visible
- OK to continue, with raw `preview.ok_to_continue` meaning still visible and
  visible text:
  `OK only for user/Core review. This is not Codex execution authority.`
- `recommended_next_step`
- preflight `ran`, `ok`, `status`, warnings, and failures
- preview gaps, conflicts, warnings, and recommendations
- `authority_boundary.boundaries`
- `packet_summary.foreign_refs`

Foreign refs remain foreign until user/Core confirms mapping and separate
authority choices.

The existing full preview button remains:

- `Run read-only target preview`

It is the only workflow in this panel that uses explicit Local B context. It
continues to send the pasted packet, parsed Local B context or `local: null`,
the `strict` checkbox value, and the `skip_preflight` checkbox value exactly as
the target preview workflow requires.

## Authority Boundary

- Read-only Operator tab surface.
- Uses an already built packet and explicit Local B context.
- Safe fixture buttons are synthetic, public-safe, local state only, and not
  persisted.
- Safe fixture buttons do not call routes.
- The read-only copied-packet validation button and the read-only full preview
  button call only `/api/ag-work-resume/target-preview`.
- Copied-packet validation sends `local: null`, `strict: true`, and
  `skip_preflight: false`.
- Copied-packet validation always runs strict preflight and ignores the
  skip-preflight checkbox.
- Error fixture buttons are synthetic, public-safe, local state only, and not
  persisted.
- Error fixture buttons do not call routes.
- Malformed packet JSON and malformed Local B context JSON fail in local
  browser parsing before route calls.
- Preflight-failing packet examples are valid JSON and fail as read-only
  validation results without granting authority.
- No DB/schema changes.
- No runtime discovery.
- No route-side DB reads.
- No import/persist/work item/mapping/proof/evidence/session/Codex
  execution/approval/publish/retry/replay/merge/state mutation.
- No Direct Resume Code route.
- No relay.
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
