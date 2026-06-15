# Work Contract Card Runbook

## Purpose

The Work Contract Card is the first ChatGPT App operator card for Augnes work
context. It gives a human operator a compact read-only view of the contract a
Codex worker is expected to honor before implementation and closeout.

The card is decision support only. It does not create authority, record proof,
record evidence, mutate runtime state, or dispatch execution.

## Codex Handoff Preview

The Codex Handoff Preview is a read-only section inside the Work Contract Card.
It turns the current Augnes work item into a copy-friendly handoff packet so a
normal user can review the scope without filling raw templates or thinking in
database paths.

The preview relates to
`docs/CURRENT_RUNTIME_CODEX_HANDOFF_CONTRACT_V0_1.md`: it shows the same
current-runtime handoff fields, but it is generated from the existing work
brief / card context. It can help a user/Core reviewer confirm what Codex
would receive before a separate Codex session starts.

The preview auto-fills, when available:

- readiness status and reasons
- work item scope, work ID, title, status, and next action
- current runtime label as `provided by current Augnes runtime` unless an
  endpoint label is already present
- task profile
- related state keys
- expected files
- expected checks
- evidence, proof-only closeout, and browser verification recommendations
- forbidden actions
- stop conditions
- a copyable handoff packet preview with human-readable text plus a structured
  JSON block

User/Core still confirms the current runtime endpoint, the work item, whether
the work is safe for implementation, evidence recording authorization,
proof-only closeout authorization, browser verification expectations, and any
future publication/approval/retry/replay/external-posting decision. Raw DB
paths are local-dev fallback only and should not be normal user-facing input.

The preview is not a handoff execution surface. It cannot execute Codex, record
evidence, record proof, commit or reject Augnes state, approve, publish, retry,
replay, externally post, merge, or enable auto-merge. Evidence is not approval.
Proof is not approval. A PR is not merge authority. Durable approval remains
user/Core gated.

## Project Constellation Preview Card

The Project Constellation Preview Card is the first read-only ChatGPT App/MCP
contact surface for the existing local Project Constellation preview. The
callable tool is:

```text
augnes_get_project_constellation_preview
```

The tool reads the existing local route:

```text
GET /api/augnes/read/constellation-preview?scope=project:augnes
```

through the bridge adapter with the same local read marker used by the route:

```text
x-augnes-local-readonly: constellation-preview-v0.1
```

The card returns model-useful `structuredContent` with:

- `project_constellation_preview`
- `project_constellation`
- `evidence_pointers`
- `unresolved_tensions`
- `next_action_candidates`
- `copyable_handoff_seed`
- `missing_data_fallbacks`

The widget renders the compact thesis, bounded node/edge/cluster summaries,
pointer-only evidence refs, unresolved tensions, advisory next action
candidates, and the copyable handoff seed. The copy control is local
browser/DOM convenience only. It copies visible preview text; it does not call
runtime write routes, execute Codex, record proof or evidence, approve,
publish, retry, replay, externally post, create branches or PRs, merge, enable
auto-merge, or commit/reject Augnes state.

The tool accepts optional `selected_candidate_id`. When omitted, the first
advisory next action remains the default handoff seed candidate. When provided,
a matching advisory candidate is selected for the returned handoff seed; a
missing requested candidate falls back to the default candidate with explicit
selection fallback metadata. In the widget, each advisory candidate has a local
`Use for handoff` control. Choosing one only updates the visible selected
candidate marker and copyable handoff seed text in the card.

If the local route or runtime is unavailable, the tool returns an explicit
unavailable preview with empty node/edge/cluster/evidence/tension/action
families plus fallback text. It does not invent missing Project Constellation
context.

## Work Contract / Constellation Context Bridge

The Work Contract Card may render an optional `Project Constellation context`
section when the existing structured content already includes a compact
`work_contract_constellation_context`, `constellation_context`, or compatible
`project_constellation_preview` object. This bridge is display-only. It shows
the selected Constellation thesis, selected advisory candidate, selection
status, pointer-only evidence refs, unresolved tensions, advisory next action
summary, and source refs when those fields are attached.

When no Constellation context is attached, the card renders the explicit
fallback: `No Project Constellation context is attached to this work contract.`
The Codex Handoff Preview packet carries the same bounded context or fallback
text so copied packets preserve what the user saw. The bridge does not fetch
the Constellation route from the work brief tool, does not require
Constellation context to render the Work Contract Card, and does not invent
missing selected candidates, evidence refs, tensions, or source refs.

## Final Codex Handoff Auto-Compose And Preflight

The Work Contract Card also derives a `final_codex_handoff_packet` from the
existing Work Contract Card, Codex Handoff Preview, and optional Project
Constellation context. When no Constellation context is attached, the final
packet carries the explicit fallback:
`No Project Constellation context is attached to this work contract.`

The final packet is still read-only preparation text. It includes work scope,
work ID, title, status, current/next step, expected files, expected checks,
related state keys, proof/evidence expectations, skipped-check policy, browser
verification expectation, forbidden actions, stop conditions, authority
boundaries, final report requirements, and the existing structured JSON block
delimiters. The existing `Copy Codex Handoff` control copies this final packet
text with the same local fallback layers: Clipboard API, then `execCommand`,
then visible packet text selection when the host blocks clipboard writes.

The surface also derives a local `final_handoff_preflight` object. This
preflight is pure display validation over the generated packet shape and
authority text. It does not spawn shell commands, run npm, call the runtime,
call GitHub/OpenAI/providers, record proof/evidence, mutate Augnes state, or
execute Codex. It checks that packet text exists, work ID or explicit
missing-work fallback exists, authority boundaries and forbidden-action
boundaries exist, skipped-check policy and closeout expectations exist,
Constellation context is attached or explicitly absent, no execution/write
control labels are present, and the structured JSON block is parseable.

The card also shows a compact `final_handoff_readiness_summary` so the
operator can read three statuses separately:

- pre-run handoff readiness: whether the final handoff packet itself is ready
  for a separate user-started Codex session.
- post-run result review readiness: whether a Codex final report or structured
  result payload is attached for later human review.
- overall local preflight status: the unchanged local preflight result,
  including any warning caused by missing post-run result input.

When the result review packet is `needs_result_input` / `not_provided`, the
overall preflight can warn even though pre-run handoff readiness is ready. That
expected no-result state means result review is waiting for Codex output; it
does not mean the pre-run handoff packet is broken. When result input is
attached and the packet is `preview_ready`, post-run result review readiness
shows that the review packet is ready for human review.

This readiness summary is display-only. It does not change local preflight
semantics, run commands, call GitHub/OpenAI/providers, create branches or PRs,
submit reviews, record proof/evidence, mutate Augnes state, execute Codex,
publish, merge, retry, replay, deploy, or add any write authority.

The surface also derives an `execution_request_preview` /
`codex_execution_request_preview` object from the final handoff packet. This is
not a launch control. It is a compact request-shape preview for a possible
later user-confirmed Codex run. It shows the source final handoff packet,
work ID, scope, selected Project Constellation context status, Memory Reuse
status, expected files, expected checks, PR body checklist presence, closeout
skeleton presence, and that a result review packet is expected after any later
run. It also lists the explicit confirmation fields a user would need to
provide later.

The widget renders this as `Codex execution request preview` with three compact
sections: what would be handed to Codex, what the user would need to confirm
later, and what the preview does not do. The required boundary wording is:
`This preview does not execute Codex. It only prepares the request shape for later explicit user-confirmed execution.`

The preview status is `preview_only`, with `confirmation_status:
awaiting_user_confirmation`; `unavailable` is reserved for malformed or missing
payloads. The object is preview-only metadata and does not alter the existing
`Copy Codex Handoff` behavior or copied packet text. It does not execute
Codex, spawn shell commands, use Node process spawning, create branches or PRs,
call GitHub/OpenAI/providers, write proof/evidence, write DB rows, persist
anything, mutate Augnes state, submit reviews, approve, publish, merge, retry,
replay, or deploy.

The `memory_reuse_attachment` slot is now activated as a read-only Memory
Reuse attachment proposal preview when final handoff text is composed. The
proposal can report:

- `proposed`: selected persisted memory IDs were attached by existing
  structured context.
- `no_match`: no persisted memory items were selected. This is a valid state,
  not a failure.
- `unavailable`: proposal data is not available in the current payload.
- `not_configured`: proposal data is not configured for the current payload.

In the normal no-match case, the card shows a fallback brief explaining that no
persisted perspective-memory items were selected and no memory IDs,
`why_selected`, or `reuse_boundary` entries were invented. When selected memory
items are attached, the proposal shows the selected memory IDs, why they were
selected, reuse boundaries, selection guidance, warnings, and boundary text.
The final handoff packet includes the same `Memory Reuse attachment` section,
and the local preflight checks whether that state is explicit and bounded.
Treat `no_match` as a valid state: it means no persisted memory item was
selected, not that the Work Contract Card failed.

This proposal preview does not run Perspective Memory Reuse Intake, create
memory items, persist memory, record proof/evidence, mutate Augnes state,
execute Codex, create branches or PRs, call providers, or publish/merge
anything.

The `pr_body_checklist` slot is now activated as a preview-only PR body
checklist and closeout skeleton. It is generated from the Work Contract, final
handoff packet, local preflight state, optional Constellation context, Memory
Reuse attachment status, authority boundaries, verification expectations, and
skipped-check policy. The skeleton contains placeholders for the eventual PR
body and closeout. Expected checks may be listed as commands to run later, but
the skeleton must not claim that any check passed unless a Codex worker actually
ran it and reports the result. Skipped checks must have concrete reasons; do
not write `N/A` or treat skipped checks as passing.

The closeout skeleton includes sections for Summary, User-facing path added or
changed, Files changed, Verification, Skipped checks and caveats, Memory Reuse
attachment status, Project Constellation context status, Final handoff
preflight status, Authority boundary statement, Remaining caveats, and Next
recommended step. The existing `Copy Codex Handoff` control copies the final
packet text including the preview-only PR body checklist and closeout skeleton.
This does not create or update a GitHub PR, create a branch, execute Codex,
record proof/evidence, mutate Augnes state, call providers, publish, merge,
retry, replay, or deploy.

The `codex_result_review_packet` slot is now activated as a preview-only Codex
result review packet. When no Codex result is attached, the card shows an
explicit `needs_result_input` / `not_provided` state and lists the exact input
needed for a later human review: final report text or structured result
payload, changed files, verification commands and results, skipped checks with
concrete reasons, authority boundary statement, and remaining caveats. It must
not invent changed files, verification results, PR URLs, screenshots, proof
IDs, evidence IDs, review findings, or host observations.

When already-present structured result payload is attached, the packet can
compare reported files, verification results, skipped checks, Memory Reuse
status, Project Constellation context status, final preflight status, PR body
checklist references, and authority boundary text against the final handoff
expectations. This comparison is bounded review preparation for a human. No
GitHub PR data is fetched from the App/MCP server, and no GitHub review is
submitted. The packet does not post comments, approve or request changes,
record proof/evidence, execute Codex, mutate Augnes state, call providers,
publish, merge, retry, replay, or deploy.

## Copy Codex Handoff Affordance

The Codex Handoff Preview includes a single `Copy Codex Handoff` control near
the visible packet text. With final handoff auto-compose enabled, the control
copies the generated final handoff packet from
`final_codex_handoff_packet.copyable_handoff_text` so the user can paste it
into a separate Codex session. Older preview payloads may still fall back to
`preview.copyable_handoff_text`.

The copied packet includes the existing human-readable sections and a delimited
structured JSON block:

```text
BEGIN_AUGNES_CODEX_HANDOFF_JSON
...
END_AUGNES_CODEX_HANDOFF_JSON
```

The JSON block uses schema `augnes.codex_handoff_preview.v0_1` and carries the
same conservative handoff fields as the visible text. It is included so
`codex:handoff-preflight` can validate structured fields before falling back to
text heuristics. Users should not edit the JSON block unless they intentionally
know what they are changing; copy the whole packet as-is whenever possible.

The copy control is local browser/DOM convenience only. It does not execute
Codex, call runtime write routes, record evidence, record proof, approve,
publish, retry, replay, externally post, merge, enable auto-merge, or
commit/reject Augnes state. Copying the packet does not mutate Augnes state and
does not turn the preview into a Codex execution surface.

If clipboard copy is unavailable or fails, the widget tries the local
`execCommand` copy fallback, then selects the still-visible packet text for
manual copy when the host blocks clipboard writes. Raw DB paths remain
local-dev fallback only and should not be normal user-facing input.

The widget may show a local text hint that copied packets can be validated with
`codex:handoff-preflight` before a separate Codex session starts. The hint is
text only; it does not add a command button, run a command, call the runtime,
call Codex, call GitHub or OpenAI, record proof or evidence, mutate state,
approve, publish, retry, replay, externally post, merge, or enable auto-merge.

## Handoff Packet Preflight

After copying the packet, a user/operator may run
`npm run codex:handoff-preflight` before using it in a separate Codex session.
The preflight reads the structured JSON block first when it is present, then
falls back to the existing text heuristics when no JSON block is present. It
validates copied packet context, stop conditions, and authority boundaries
only. It does not execute Codex, call the runtime, record proof, record
evidence, or mutate Augnes state.

## Data Source

The card is rendered from existing `augnes_get_work_brief` structured content.
The tool still returns the original `structuredContent.brief` payload, and the
server adds a derived `structuredContent.work_contract_card` object, a derived
`structuredContent.codex_handoff_preview` object, and widget panel metadata.

No new bridge write tool is added. No new API route, database schema, MCP
configuration, hook, plugin behavior, dependency, secret handling, or external
service call is added for this card.

## Card Fields

When available, the card displays:

- `scope`
- `work_id`
- work title
- work status
- priority
- current or next step
- expected files
- expected checks
- related state keys
- recent events count
- linked proof/action ID count
- linked PR and doc reference counts
- proof/evidence expectation summary
- skipped-check expectation summary
- authority boundary text

The Codex Handoff Preview displays:

- readiness: ready, blocked, or needs user/Core input
- work item: scope, work ID, title, status, and next action
- current runtime label
- authorization recommendations for evidence recording, proof-only closeout,
  and browser verification
- expected files, expected checks, and related state keys
- forbidden actions
- stop conditions
- copyable handoff packet text
- structured JSON block inside the copyable handoff packet
- preview authority boundary text

Expected checks are derived from work brief Codex handoff fields such as
`suggested_verification` when present. Expected files are displayed only when
the work brief or future compatible handoff shape includes them.

## Missing Data Behavior

Optional fields render explicit fallback text instead of throwing or inventing
context.

Fallback examples:

- No expected files are listed in the work brief.
- No expected checks are listed in the work brief.
- No related state keys are listed in the work brief.
- No proof/evidence expectation is listed in the work brief; proof and evidence
  remain separate from approval.
- Skipped checks must be reported with concrete reasons; no per-check skipped
  expectation is listed in the work brief.
- Evidence/proof/browser choices need user/Core confirmation.
- The current runtime is shown as provided by current Augnes runtime.

The card does not reconstruct missing Augnes runtime output, fabricate IDs, or
turn absent handoff fields into implied project facts.

## Authority Boundaries

The visible card boundary text includes:

- Work ID is a trace anchor, not committed state authority.
- This card is read-only.
- This card cannot execute Codex.
- This card cannot commit or reject Augnes state.
- This card cannot approve, publish, retry, replay, externally post, merge, or enable auto-merge.
- Proof is not approval.
- A PR is not merge authority.
- Durable approval remains user/Core gated.

The visible Codex Handoff Preview boundary text includes:

- This preview is read-only.
- This preview cannot execute Codex.
- This preview cannot record evidence.
- This preview cannot record proof.
- This preview cannot commit or reject Augnes state.
- This preview cannot approve, publish, retry, replay, or externally post.
- This preview cannot merge or enable auto-merge.
- Evidence is not approval.
- Proof is not approval.
- A PR is not merge authority.
- Durable approval remains user/Core gated.
- Raw DB paths are local-dev fallback only and should not be normal user-facing input.

The widget renderer adds no form or action affordance for execution, approval,
publication, retry, replay, external posting, state commit/reject, proof
recording, evidence recording, merge, or auto-merge. The only button in the
Codex Handoff Preview is the local `Copy Codex Handoff` convenience control,
which copies packet text and does not call runtime write routes.

## ChatGPT App Bridge Tools

The card is attached to `augnes_get_work_brief`, which remains a read-only work
read tool. Its annotations stay read-only, non-destructive, and open-world
because it reads the local Augnes runtime through the existing bridge adapter.

The card does not change existing bridge write tools:

- `augnes_observe`
- `augnes_record_action_result`
- `augnes_record_work_event`
- `augnes_generate_codex_handoff_draft`
- `augnes_review_codex_result_draft`

Those tools keep their existing boundaries. The Work Contract Card does not use
them and does not broaden them.

## Codex Handoff And Review

The card is a human-facing summary of the work contract. It can help a user or
reviewer see the work ID, expected checks, related state keys, proof links, and
authority limits before handing work to Codex or reviewing a Codex result.

The preview adds the next UX layer: current Augnes work item to Codex handoff
preview to user/Core scope and authority confirmation to a separate structured
Codex packet. It is not a handoff delivery mechanism and is not a result-review
record. Codex still performs repo work in its own session, reports changed
files and checks, and opens PRs through normal GitHub workflow without gaining
merge authority.

## Closeout Preflight And Plugin Hooks

The card complements the closeout preflight helper and local plugin hooks by
making expectations visible earlier:

- `npm run codex:closeout-preflight` remains the deterministic PR closeout
  packet check.
- Plugin hooks remain local guardrails and do not become runtime authority.
- The card does not call closeout helpers, record proof, record evidence, or
  change hook behavior.

## How To Test

Run:

```bash
npm run typecheck
npm --prefix apps/augnes_apps run typecheck
npm run smoke:chatgpt-work-contract-card
npm run smoke:current-runtime-codex-handoff-contract
npm run smoke:current-runtime-dogfood-readiness
npm run smoke:codex-closeout-preflight
npm run smoke:codex-record-completion-proof-helper
npm run smoke:dogfood-episode-template
git diff --check
```

When a cheap app-level regression is appropriate, also run:

```bash
npm --prefix apps/augnes_apps run smoke
```

Run closeout preflight in advisory mode with PR-specific `CODEX_*` fields:

```bash
npm run codex:closeout-preflight
```

## Browser Verification

Rendered widget behavior changed, so browser/computer-use verification should
be performed when a browser or ChatGPT Developer Mode surface is available. Use
`docs/templates/codex-browser-verification-report.md` and confirm that the Work
Contract Card and Codex Handoff Preview render, missing-data fallback text is
visible, boundary text is visible, the copyable handoff packet is inspectable,
the copy affordance is visible, clicking it only changes local copy/status
behavior, and no unauthorized controls are visible.

If no browser/computer-use surface is available, report a concrete skipped
reason such as `browser verification skipped: no browser runtime available` or
`browser verification skipped: no ChatGPT Developer Mode tunnel/session
available`. Do not fabricate screenshots, browser observations, evidence IDs,
or proof IDs.

## Non-Goals And Forbidden Changes

This card does not add:

- direct Codex execution controls
- commit/reject controls
- approval, publication, retry, replay, external-posting, merge, or auto-merge
  controls
- runtime state mutation
- database/schema changes
- API route changes
- MCP/App tool schema authority expansion
- bridge write authority
- hooks
- MCP config
- plugin changes
- browser/computer-use runbook implementation
- dogfood episode helper implementation
- secret handling changes
- dependencies
- OpenAI calls
- GitHub calls from the widget or card code
- proof or evidence recording
- external publishing
- committed-state mutation
