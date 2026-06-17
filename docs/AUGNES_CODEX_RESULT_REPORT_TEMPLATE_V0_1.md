# Augnes Codex Result Report Template v0.1

## Purpose

This document provides a reusable preview-only Codex result report template for
manual result return through `codexResultText` or `codexResultPaste`.

The template gives Codex a stable field-first closeout shape so the Augnes
paste normalizer can extract changed files, verification, skipped checks,
remaining caveats, ambiguous combined-section lines, authority boundaries, and
Codex-reported status without inventing missing facts.

This is a reporting template only. It does not add automatic report
generation, automatic Codex execution, write authority, App/MCP tools, GitHub
automation, provider calls, or Research / Paper / Knowledge Accumulation
product behavior.

## When To Use

Use this template when a human asks Codex to report the result of a bounded
Augnes task and intends to paste the final report back through
`codexResultText` or `codexResultPaste`.

Use it for preview-only dogfood closeouts, docs/smoke work, Work Contract Card
review, and other tasks where Augnes should review Codex-reported facts without
treating the report as proof, evidence, approval, state, or closure.

Do not use this template to claim checks, host observations, proof/evidence
rows, GitHub URLs, state changes, or work closure that did not actually happen.

## Required Report Sections

The report should include these required fields or sections:

- `summary`
- `work_id`
- `scope`
- `result_status`
- `changed_files`
- `verification_commands`
- `verification_results`
- `skipped_checks`
- `remaining_caveats`
- `ambiguous_combined_section_lines`
- `authority_boundary_statement`
- `next_recommended_step`

The current paste normalizer recognizes parser-friendly section headings such
as `Changed files`, `Verification`, `Skipped checks`, `Remaining caveats`,
`Skipped checks and caveats`, `Authority boundary statement`, and
`Next recommended step`. The snake_case names above are the review fields the
report is meant to populate.

## Optional Fields

Include these optional fields when relevant:

- `pr_url`
- `pr_number`
- `live_host_observation`
- `proof_evidence_rows_written`
- `event_rows_created_or_mutated`
- `work_status_changed`
- `state_committed_or_rejected`

If an optional field is not applicable, prefer an explicit negative statement
over silence.

## Copyable Template

```text
Summary
<One short paragraph describing what Codex completed or why it stopped.>

work_id: <AG-...>
scope: <project:...>
result_status: <completed | partial | blocked | needs_revision>
pr_url: <URL, or "not opened">
pr_number: <number, or "not opened">
live_host_observation: not run - <reason, or actual observed host path>
proof_evidence_rows_written: No proof/evidence rows written.
event_rows_created_or_mutated: No event rows created or mutated.
work_status_changed: No work close/status mutation.
state_committed_or_rejected: No state commit/reject.
ambiguous_combined_section_lines: <list below, or "No ambiguous combined-section lines.">

Changed files
- <path>

Verification
- <command> <observed result>

Skipped checks
- <concrete skipped check reason, or "No skipped checks.">

Remaining caveats
- <remaining caveat, or "No remaining caveats.">

Skipped checks and caveats
- <combined-section line that may require human classification, or "No ambiguous combined-section lines.">

Authority boundary statement
<State the preview-only authority boundary and any writes or automation that did not happen.>

Next recommended step
<One conservative next step for the human/operator.>
```

Do not put nested code fences inside the report body when pasting it back to
Augnes.

## Field Definitions

- `summary`: A concise result summary. It should not replace the structured
  fields below it.
- `work_id`: The Augnes work item or scenario identifier.
- `scope`: The Augnes scope, such as `project:augnes`.
- `result_status`: Codex-reported only. Augnes review may still derive
  `partial`, `needs_revision`, or a conservative closure recommendation later.
- `pr_url`: Optional. Use `not opened` unless a PR was actually opened.
- `pr_number`: Optional. Use `not opened` unless a PR was actually opened.
- `changed_files`: A list of changed file paths. Do not include files that were
  not changed.
- `verification_commands`: Commands that were actually run.
- `verification_results`: Observed command results. Do not claim a command
  passed unless it actually ran and passed.
- `skipped_checks`: An explicit list or `No skipped checks.`
- `remaining_caveats`: An explicit list or `No remaining caveats.`
- `ambiguous_combined_section_lines`: An explicit list or
  `No ambiguous combined-section lines.`
- `live_host_observation`: Use `not run - <reason>` unless a live host was
  actually observed.
- `proof_evidence_rows_written`: Use `No proof/evidence rows written.` unless
  rows were actually written through a separately authorized path.
- `event_rows_created_or_mutated`: Use `No event rows created or mutated.`
  unless a separately authorized path actually did so.
- `work_status_changed`: Use `No work close/status mutation.` unless a
  separately authorized path actually changed work status.
- `state_committed_or_rejected`: Use `No state commit/reject.` unless a
  separately authorized path actually committed or rejected state.
- `authority_boundary_statement`: The explicit authority limits for this
  result.
- `next_recommended_step`: A conservative human/operator next step.

## Examples

### No Skipped Checks Or Caveats

When there are no skipped checks or remaining caveats, write the fields
explicitly:

```text
Skipped checks
- No skipped checks.

Remaining caveats
- No remaining caveats.

Skipped checks and caveats
- No ambiguous combined-section lines.
```

### Filled Sample Report For AG-DOGFOOD-RESEARCH-001

This sample is intentionally parseable by the current preview normalizer. It
includes a skipped live-host observation, a remaining caveat, and one ambiguous
combined-section line so review can stay conservative.

```text
Summary
Completed a preview-only Research Accumulation Scenario Pack docs/smoke slice
for the ChatGPT-Augnes-Codex dogfood loop. The result is ready for human
preview, but Augnes review may remain conservative if ambiguity exists.

work_id: AG-DOGFOOD-RESEARCH-001
scope: project:augnes
result_status: completed
pr_url: not opened
pr_number: not opened
live_host_observation: not run - no live MCP Inspector or ChatGPT Developer Mode session was started
proof_evidence_rows_written: No proof/evidence rows written.
event_rows_created_or_mutated: No event rows created or mutated.
work_status_changed: No work close/status mutation.
state_committed_or_rejected: No state commit/reject.
ambiguous_combined_section_lines: Operator follow-up noted in transcript.

Changed files
- docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md
- scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs
- package.json
- apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md

Verification
- node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs passed
- git diff --check passed

Skipped checks
- Live host observation skipped because no live MCP Inspector or ChatGPT Developer Mode session was started.

Remaining caveats
- Augnes review may remain conservative because one combined skipped-check/caveat line requires human classification.

Skipped checks and caveats
- Operator follow-up noted in transcript.

Authority boundary statement
This PR adds a reusable preview-only Codex result report template for manual
result-return through codexResultText/codexResultPaste. It adds no automatic
Codex execution, no automatic GitHub fetch, no proof/evidence write, no work
close/status mutation, no event creation/mutation, no state commit/reject, no
shell execution from App/MCP, no provider/OpenAI calls, no branch/PR creation
from App/MCP code, no PR review submission, no merge/publish/retry/replay/deploy
controls, no DB migration, no new user-facing App/MCP tools, and no widening of
the work_loop_readonly Developer Mode tool surface.

Next recommended step
Paste this report through codexResultText or codexResultPaste for preview
review. Treat the report as candidate input only, not proof/evidence, product
truth, state, work closure, or merge approval.
```

## Expected Paste Normalizer Behavior

The current PR #602 / PR #603 paste normalizer should extract these fields from
the filled sample report:

- `work_id`
- `scope`
- `result_status`
- `changed_files`
- `verification_commands`
- `verification_results`
- `skipped_checks`
- `remaining_caveats`
- `ambiguous_combined_section_lines`
- `authority_boundary_statement`

The normalizer may expose `ambiguous_combined_section_lines` as a review warning
instead of assigning the line to `skipped_checks` or `remaining_caveats`.

Augnes must not invent:

- verification
- proof/evidence rows
- PR URLs
- host observations
- event IDs
- close status
- state decisions

## Authority Boundary Statement

This template is preview-only and supports manual result return through
`codexResultText` / `codexResultPaste`.

It adds no automatic Codex execution, no automatic GitHub fetch, no
proof/evidence write, no work close/status mutation, no event
creation/mutation, no state commit/reject, no shell execution from App/MCP, no
provider/OpenAI calls, no branch/PR creation from App/MCP code, no PR review
submission, no merge/publish/retry/replay/deploy controls, no DB migration, no
new user-facing App/MCP tools, and no widening of the work_loop_readonly
Developer Mode tool surface.

## Skipped Checks Policy

`skipped_checks` must be an explicit list or `No skipped checks.`

Every skipped check must include a concrete reason. Prefer
`<check> skipped because <reason>` or `not run - <reason>` over vague text.

`live_host_observation` should be `not run - <reason>` unless MCP Inspector,
ChatGPT Developer Mode, or another live host was actually observed.

Do not claim verification passed unless the command actually ran. Do not claim
proof/evidence rows were written unless a separately authorized write path
actually wrote them.

## What This Template Does Not Authorize

- automatic report generation
- automatic Codex execution
- live Codex runner creation
- automatic GitHub fetch
- provider/OpenAI calls
- proof/evidence writes
- work close/status mutation
- event creation/mutation
- state commit/reject
- GitHub review/comment submission
- branch/PR creation from App/MCP code
- merge/publish/retry/replay/deploy controls
- DB migration
- new user-facing App/MCP tools
- widening of the work_loop_readonly Developer Mode tool surface
- Research / Paper / Knowledge Accumulation product implementation

## Next Recommended Step

Use this template in the next manual Codex closeout that returns through
`codexResultText` or `codexResultPaste`, then observe whether the normalized
candidate is easier for a human to review without adding automatic execution or
write authority.
