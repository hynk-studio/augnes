# Work Contract Card Runbook

## Purpose

The Work Contract Card is the first ChatGPT App operator card for Augnes work
context. It gives a human operator a compact read-only view of the contract a
Codex worker is expected to honor before implementation and closeout.

The card is decision support only. It does not create authority, record proof,
record evidence, mutate runtime state, or dispatch execution.

For the integrated post-PR #596 dogfood closeout snapshot, see
`docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_SNAPSHOT.md`.

For the repo-backed research accumulation dogfood scenario that exercises this
loop through a selectable Work Picker item and pasted Codex final report, see
`docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md`. That scenario is
preview-only and operator-led. It adds no new App/MCP tool surface, no Codex or
shell execution from App/MCP, no provider/OpenAI calls, no automatic GitHub
fetch, no proof/evidence write, no event creation/mutation, no work
close/status mutation, no state commit/reject, and no
merge/publish/retry/replay/deploy controls.

For the first deterministic local observation pass against that scenario, see
`docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_OBSERVATION_V0_1.md`. It records the
Work Picker visibility check, no-result Work Contract state, sample
`codexResultText` paste normalizer outcome, conservative closure result, and
live MCP Inspector / ChatGPT Developer Mode skipped reasons.

For a preview-only Codex worker-perspective review contract, see
`docs/AUGNES_CODEX_SELF_OPINION_DOGFOOD_SCENARIO_V0_1.md`. That self-opinion
scenario is advisory review input only. It does not run Codex, add App/MCP
tools, submit GitHub reviews, write proof/evidence, mutate state, or widen the
`work_loop_readonly` surface.

For the first deterministic sample-run observation of that self-opinion
scenario, see
`docs/AUGNES_CODEX_SELF_OPINION_DOGFOOD_RUN_OBSERVATION_V0_1.md`. It records
that no live Codex self-opinion session was run, uses only the scenario sample
report, and selects a reusable Codex result report template as the next narrow
PR candidate without implementing it.

For the reusable manual Codex closeout report shape, see
`docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`. It is a preview-only
template for result return through `codexResultText` / `codexResultPaste` and
does not add automatic Codex execution, proof/evidence writes, state mutation,
GitHub automation, App/MCP tools, or result-review authority.

## Work Picker Entry Surface

The Work Picker Entry Surface is the scope-only first-entry path for a user
who knows the project scope, such as `project:augnes`, but does not already
know a `workId`.

The callable entry tool is:

```text
augnes_list_work_items
```

For the ChatGPT/App handoff flow, the tool returns a visible
`work_picker_card` panel plus model-readable fields:

- `work_picker_card`
- `work_candidates`
- `recommended_work_id`
- `selection_reason`
- `next_action_hint`
- `handoff_tool_hint`

The card shows practical selection context first: scope, candidate count,
recommended work, selection reason, each candidate title, status, priority,
`Work ID`, summary, `Next step`, expected file/check counts, linked docs, and
the exact follow-up instruction:

```text
Open this work with augnes_get_work_brief using workId: <workId>.
```

The normal user path is:

```text
project scope -> visible work candidates -> recommended work -> augnes_get_work_brief with the selected workId -> Work Contract Card / final handoff packet
```

`workId` is therefore still required by `augnes_get_work_brief`, but it is no
longer required as first-entry knowledge. A scope-only user can discover the
recommended work item through `augnes_list_work_items`, then open the existing
handoff card with the selected or recommended work ID. The picker does not
auto-call the brief tool and does not change the brief schema.

If no items are found, the card renders the empty state:

```text
No work items found for this scope. Check the scope or select/create a work item elsewhere.
```

The Work Picker is read-only. It does not execute Codex, create branches or
PRs, call GitHub, make provider/OpenAI calls, record proof, record evidence,
mutate Augnes state, persist a selection, approve, publish, merge, retry,
replay, or deploy.

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

## Work Event Spine Timeline / Inspector

The Work Event Spine Timeline / Inspector is a compact read-only section inside
the Work Contract Card. It gives the operator temporal context for the opened
work item by rendering already-attached coordination events from the work brief.

Data Source:

```text
structuredContent.brief.coordination_events
```

The `augnes_get_work_brief` response also exposes the derived model-readable
objects:

- `work_event_spine_timeline`
- `coordination_event_timeline`
- `event_spine_timeline`
- `event_spine_inspector`

The timeline sorts attached events by `created_at_ascending` and makes the sort
order visible as `Created at ascending`. Each event summary and inspector keeps
bounded fields from the attached coordination event record: event ID, event
type, scope, work ID, actor, target, source surface, authority level, state
keys, causal parent, payload ref, result status, created at, and payload
summary when one is already attached and safe to show.

If no `coordination_events` are attached, the card renders:

```text
No coordination events are attached to this work item yet.
```

That empty state must not invent event IDs, actors, payload refs, result
statuses, state keys, proof IDs, evidence IDs, host observations, or GitHub
review findings. Missing fields on attached events remain explicit missing
fields in the inspector instead of being backfilled.

The section is visibility only. It is not broader event instrumentation, not a
result import/write path, not proof/evidence recording, and not state
commit/reject. It does not fetch `/api/events`, call GitHub, call
OpenAI/providers, execute Codex, create or mutate events, write database rows,
persist selections, publish, merge, retry, replay, or deploy.

## Result Review Closure Preview

The Result Review Closure Preview is a compact read-only section inside the
Work Contract Card. It helps the operator decide what should happen after a
Codex result import/review without closing work, creating follow-up work, or
performing any write.

Data sources:

```text
finalCodexHandoffPacket.codex_result_review_packet_preview
work_event_spine_timeline
existing work contract / handoff context
```

The `augnes_get_work_brief` response exposes the derived model-readable
closure object through these aliases:

- `result_review_closure_preview`
- `work_result_closure_preview`
- `next_action_closure`
- `followup_closure_preview`

The closure preview maps the existing result review packet into one bounded
recommendation category: `needs_result_input`, `close_ready`,
`additional_verification_needed`, `follow_up_fix_needed`,
`new_handoff_needed`, `result_incomplete_or_blocked`, or
`human_decision_needed`. It preserves the result review packet's
`suggested_next_action`, but derives its own closure recommendation from the
review status, source, result status, alignments, missing input fields,
authority boundary issues, skipped-check handling, caveats, review questions,
and timeline availability. When the data is ambiguous, it chooses
`human_decision_needed` instead of treating the result as close-ready.

The visible section shows `Result closure`, `Next action`,
`Closure recommendation`, `Why this recommendation`, `Follow-up seed`,
`Missing before close`, `Verification still needed`,
`Human decision needed`, and `What this screen does not do`. The follow-up
seed is preview-only text that can help a human start the next Codex or human
step manually. It is not a created work item, handoff record, mailbox item,
event, proof row, or evidence row.

If no Codex result input is attached, the closure preview explicitly recommends
`needs_result_input`. It must not invent changed files, verification results,
PR URLs, proof IDs, evidence IDs, event IDs, close status, or human approval.

This surface is not durable lifecycle closure and not follow-up automation. It
does not close work, update work status, create or mutate coordination events,
record proof/evidence, commit or reject Augnes state, execute Codex, fetch
GitHub, submit PR reviews, create branches or PRs, call OpenAI/providers,
publish, merge, retry, replay, or deploy.

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

The widget intentionally maps internal status and packet labels to shorter
operator-facing language in the main visible card. For example, the visible UI
uses labels such as `Codex handoff package`, `Handoff prep`, `Result review`,
`Overall check`, `Reference memory`, `Related perspective`, `PR writing
checklist`, `Work report outline`, `What will be handed to Codex`, `What the
user confirms later`, and `What this screen does not do`. Raw enum values such
as `preview_only`, `needs_result_input`, `awaiting_user_confirmation`,
`no_match`, and `explicitly_absent` remain available in structuredContent and
copied packet text where model/tool contracts need them, but the main visible
surface renders them as plain labels such as `Preview only`, `Needs result
input`, `Needs user confirmation`, `No matching memory`, and `Not attached`.
Long authority and packet details stay available in collapsed technical
sections so the first screen is not dominated by internal control terminology.

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
result review packet and the existing `augnes_get_work_brief` call accepts an
optional read-only `codexResult` / `codexResultInput` / `codex_result` object.
That import object is user-provided only. Its supported shape is:

- `work_id`
- `scope`
- `final_report_text`
- `pr_url` or `pr_number` (optional, not fetched)
- `changed_files`
- `verification_commands`
- `verification_results`
- `skipped_checks`
- `remaining_caveats`
- `authority_boundary_statement`
- `result_status`

The same tool also accepts a preview-only raw paste helper for Codex final
report text, PR body text, or closeout text. The top-level paste aliases are:

- `codexResultText`
- `codex_result_text`
- `codexResultPaste`
- `codex_result_paste`

The structured `codexResult` / `codexResultInput` / `codex_result` object may
also carry raw text aliases:

- `raw_result_text`
- `rawResultText`
- `pasted_result_text`
- `pastedResultText`
- `pr_body_text`
- `prBodyText`
- `closeout_text`
- `closeoutText`

The paste helper is deterministic and local. It looks for explicit labels such
as `Work ID`, `work_id`, `CODEX_WORK_ID`, `Scope`, `CODEX_SCOPE`, and
`result_status`; obvious GitHub pull-request URLs or `PR #...` references; and
headed sections such as `Files changed`, `Verification`, `Skipped checks`,
`Remaining caveats`, and `Authority boundary statement`. Parser output is a
candidate only. It fills missing structured fields conservatively and leaves
missing fields as warnings or review questions.

Combined closeout sections such as `Skipped checks and caveats`,
`Skipped validation and caveats`, `Skipped checks / remaining caveats`,
`Caveats and skipped checks`, and `Limitations / skipped checks` are split
conservatively. Lines that clearly describe skipped or unavailable validation
become `skipped_checks`; lines that clearly describe residual limitations,
future work, manual review, or candidate-only behavior become
`remaining_caveats`. Ambiguous combined-section lines are not duplicated into
both fields. They remain human-review warnings and are exposed as
`ambiguous_combined_section_lines` in the paste normalizer preview. Explicit
none-skipped and none-remaining signals are still preserved.

Explicit structured fields override parsed fields. If structured input and
paste extraction disagree, the structured value is preserved and the
`codex_result_paste_normalizer_preview` exposes conflict warnings. The raw
pasted text is preserved as `final_report_text` for review input when no
explicit structured final report field is already present. Partial extraction
remains partial and must surface missing fields instead of inventing pass
results, changed files, verification output, skipped-check reasons, caveats, or
authority statements.

The tool exposes the paste helper through model-readable aliases:

- `codex_result_paste_normalizer_preview`
- `codex_result_normalizer_preview`
- `normalized_codex_result_candidate`

The widget renders the helper in the result-review area with labels including
`Codex result paste helper`, `Normalized result candidate`, `Detected fields`,
`Needs human review`, `Ambiguous combined lines`, and `What this helper does
not do`. The helper does not fetch GitHub, write proof/evidence, close work,
mutate state, execute Codex, spawn shell commands, create events, create
branches or PRs, submit PR reviews, create or merge PRs, call providers/OpenAI,
publish, retry, replay, or deploy.

When no Codex result is attached, the card shows an explicit
`needs_result_input` / `not_provided` state and lists the exact input needed for
a later human review: final report text or structured result payload, changed
files, verification commands and results, skipped checks with concrete reasons
or an explicit none-skipped statement, authority boundary statement, and
remaining caveats or an explicit none-remaining statement. It must not invent
changed files, verification results, PR URLs, screenshots, proof IDs, evidence
IDs, review findings, or host observations.

When user-provided or already-present structured result payload is attached, the
packet can compare reported files, verification commands/results, skipped
checks, remaining caveats, optional PR reference, Memory Reuse status, Project
Constellation context status, final preflight status, PR body checklist
references, and authority boundary text against the final handoff expectations.
The widget renders compact sections labeled `Codex result import`,
`What was provided`, `Missing result input`, `Expected vs actual`,
`Verification review`, `Skipped checks`, `Remaining caveats`,
`Suggested next action`, and `What this screen does not do`.

Partial result input is reviewable but remains partial: missing changed files,
missing verification results, missing caveats, or skipped checks without
concrete reasons are warnings and review questions, not invented pass results.
Structured `skipped_checks` objects preserve concrete reasons, so
`{ check, reason }` is rendered as readable review text instead of dropping the
reason. `suggested_result_status` is Augnes's review-derived status and does
not blindly accept a Codex-reported `completed` status when verification or
review gaps remain.
The packet may suggest a bounded result status and next-action category such as
close / done, follow-up fix needed, additional verification needed, new handoff
needed, result incomplete / blocked, or human decision needed. These categories
are advisory only.

This comparison is bounded review preparation for a human. No GitHub PR data is
fetched from the App/MCP server, and no GitHub review is submitted. The packet
does not post comments, approve or request changes, record proof/evidence,
execute Codex, mutate Augnes state, call providers, publish, merge, retry,
replay, or deploy.

## Copy Codex Handoff Affordance

The Codex Handoff Preview now separates the default Core Handoff copy from the
full appendices.

The primary visible control is:

```text
Copy Codex Handoff
```

It copies the Core Handoff packet from `core_codex_handoff_packet` /
`copyable_core_handoff_text`. This is the shorter packet for starting Codex
work. It keeps the immediate task context near the top: work ID, scope, title,
user-facing goal, status, next step, Core usage state, implementation anchors
when available, expected files/checks, relevant Constellation summary, Memory
Reuse summary, PR checklist summary, closeout/report expectations,
skipped-check policy, stop conditions, concise authority boundary, final report
requirements, and a compact structured JSON block.

The Core packet exposes `core_handoff_usage` so a separate Codex session can
distinguish planning from implementation:

- `implementation_ready`: Core includes concise implementation anchors, such
  as expected file or schema paths, and can be used with `codex:read-brief`
  before implementation.
- `implementation_requires_full_context`: Core is useful for orientation and
  planning, but no implementation file/schema anchors are attached. The packet
  must explicitly say: `No implementation file/schema anchors are attached in
  Core. Use Core for planning only, or open Full Context before implementation.`
- `planning_only`: reserved for future handoff sources that intentionally mark
  Core as planning-only even when some implementation context exists.

Core must not invent implementation anchors. When the work brief or source
packet lists expected files, target files, schema paths, storage module refs,
or equivalent implementation anchors, Core carries those concise anchors in an
`Implementation anchors` section. When no anchors are attached, Core keeps the
immediate task context near the top but requires Full Context before
implementation.

Read-only verification commands should be labeled as expected read-only checks
when they are non-mutating checks such as local GET/curl commands piped into
`jq`. Skipped-check policy remains unchanged.

The visible copy area includes a compact `Codex handoff recommendation` panel
near the Core and Full copy controls. The panel is user decision guidance, not
a permission gate. Its primary labels are:

- `What to copy`
- `For planning`
- `For implementation`
- `Core Handoff`
- `Full Context`
- `Why this recommendation`
- `What the user confirms`

The recommendation is derived from the Core Handoff contract:

- When Core has `core_handoff_usage: implementation_requires_full_context`,
  the panel recommends `Copy Codex Handoff` for planning and `Copy Full
  Context` for implementation. The visible reason is: `Core is enough for
  planning. Full Context is required before implementation because
  implementation file/schema anchors are missing.`
- When Core has `core_handoff_usage: implementation_ready`, the panel
  recommends `Copy Codex Handoff` for planning and implementation planning,
  with the reminder: `Core includes implementation anchors. Confirm anchors
  before editing.`
- When Core is `planning_only`, the panel recommends Core for planning and
  Full Context or supplied implementation anchors before implementation.
- When recommendation data is unavailable, the panel shows an unavailable state
  and does not infer implementation readiness.

The model-readable structured content exposes the same guidance as
`codex_handoff_decision` / `codex_handoff_recommendation`, including the Core
usage state, implementation anchor count, planning and implementation
recommendations, recommendation reason, practical user confirmation items, and
read-only boundary text. The primary visible UI should keep raw enum labels and
technical aliases out of the main decision panel.

The secondary visible control is:

```text
Copy Full Context
```

It copies the Full Handoff packet from `full_codex_handoff_packet` /
`copyable_full_handoff_text`, which aliases the existing
`final_codex_handoff_packet.copyable_handoff_text`. Use it when a worker needs
full context and appendices.

Full Context also carries an `Implementation anchors` section when concrete
anchors can be derived from already-present work metadata, linked docs,
related state keys, or existing source-contract mappings. These anchors may
include source docs, schema/table refs, storage modules, read route handlers,
and relevant smoke scripts. For example, AG-006 can identify the coordination
event spine roadmap, `coordination_events` schema, coordination-event storage
module, read routes, work brief routes, seed source, and authority smoke refs.
Core may still say `implementation_requires_full_context` when those anchors
are not concise expected files in Core; implementation should then use Full
Context and verify the listed anchors before editing.

If Full Context cannot derive anchors, it must say:
`Implementation anchors could not be derived from current work metadata. Run
codex:read-brief/repo inspection before implementation.` It must not invent
target files, schemas, storage modules, API handlers, or tests.

Core Handoff intentionally does not include the execution request preview
metadata, full technical appendix, raw internal alias dumps, full Constellation
evidence/tension dumps, full PR body checklist text, full closeout skeleton,
result review packet details, or repeated fallback/status prose by default.
Full Handoff preserves those richer details and the existing fallback
semantics.

Older preview payloads may still fall back to `preview.copyable_handoff_text`.
In those cases the widget composes a Core fallback locally from the full packet
and keeps the full packet available as a secondary copy.

Both copied packets include human-readable sections and a delimited structured
JSON block:

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

The first-entry Work Picker is rendered from existing `augnes_list_work_items`
structured content. It adds a derived `structuredContent.work_picker_card`
object, candidate summaries, a recommended work ID, selection reason, and
handoff tool guidance.

The Work Contract Card is rendered from existing `augnes_get_work_brief`
structured content. The brief tool still returns the original
`structuredContent.brief` payload, and the server adds a derived
`structuredContent.work_contract_card` object, a derived
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
