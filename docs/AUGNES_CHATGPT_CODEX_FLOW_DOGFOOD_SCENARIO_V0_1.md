# Augnes ChatGPT-Augnes-Codex Flow Dogfood Scenario v0.1

## Purpose

This document defines one repo-backed dogfood scenario for exercising the
preview-only ChatGPT-Augnes-Codex work loop end to end:

```text
Work Picker -> Work Brief / Work Contract Card -> Core / Full Codex Handoff -> Codex result paste/import review -> Work Event Spine / Inspector -> Result Closure / Follow-up Recommendation
```

The scenario is operator-led. It does not build the future Research / Paper /
Knowledge Accumulation product surface. It gives a bounded work item and result
fixture so a human can test whether the existing loop can carry a research
accumulation docs/smoke task, accept a pasted Codex final report, and keep
closure conservative when skipped-check/caveat lines are ambiguous.

## Scenario ID

`CHATGPT_AUGNES_CODEX_RESEARCH_DOGFOOD_V0_1`

## Work Item ID

`AG-DOGFOOD-RESEARCH-001`

## What This Scenario Tests

- Work Picker can show the dogfood work item without replacing AG-006 as the
  first recommended active production/demo work item.
- Work Brief / Work Contract Card can show the research accumulation scenario,
  expected files, expected checks, related state keys, linked docs, and
  authority boundaries.
- Core Codex Handoff gives a separate Codex session enough context to perform a
  bounded docs/smoke task.
- Codex result report text can be pasted back through `codexResultText` or
  `codexResultPaste`.
- The paste normalizer extracts changed files, verification, skipped checks,
  remaining caveats, authority boundary statement, and result status.
- Result review and result closure remain conservative until human review is
  satisfied.
- Ambiguous skipped-check/caveat combined lines stay in
  `ambiguous_combined_section_lines` and are not duplicated into
  `skipped_checks` or `remaining_caveats`.

## Operator Path

1. Start local runtime with a seeded DB.
2. Start the App/MCP bridge with `AUGNES_APP_TOOL_SURFACE=work_loop_readonly`.
3. Use ChatGPT Developer Mode connector or MCP Inspector.
4. Call `augnes_list_work_items` for `project:augnes`.
5. Open `AG-DOGFOOD-RESEARCH-001` with `augnes_get_work_brief`.
6. Copy Core Codex Handoff.
7. Paste the Core handoff into a separate Codex session.
8. Codex performs the bounded docs/smoke task for the preview-only Research
   Accumulation Scenario Pack.
9. Paste Codex final report text back through `codexResultText` or
   `codexResultPaste`.
10. Review the paste normalizer, result review, Work Event Spine / Inspector,
    and Result Closure recommendation.

## Expected Visible Surfaces

- Work Picker
- Work Contract Card
- Core Handoff
- Codex result paste helper
- Work result review
- Work Event Spine / Inspector
- Result Closure

## Codex Task Payload

The copied handoff should steer Codex toward a bounded, preview-only Research
Accumulation Scenario Pack. The expected task is:

```text
Work ID: AG-DOGFOOD-RESEARCH-001
Scope: project:augnes
Task: Prepare the first docs/smoke scenario pack for a future Research / Paper / Knowledge Accumulation surface.

Expected files:
- docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md
- scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs
- package.json
- apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md

Expected checks:
- node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs
- git diff --check

Boundaries:
- preview-only docs/smoke contract work
- no automatic research ingestion
- no provider/OpenAI calls from App/MCP
- no automatic GitHub fetch
- no proof/evidence writes
- no event creation/mutation
- no work close/status mutation
- no state commit/reject
- no Codex execution from App/MCP
- no shell execution from App/MCP
- no branch/PR creation from App/MCP code
- no PR review submission
- no merge/publish/retry/replay/deploy controls
- no new user-facing App/MCP tools
- no widening of the `work_loop_readonly` Developer Mode tool surface
```

The scenario pack should describe how future operators might accumulate
research questions, paper references, reading notes, extracted claims, and
knowledge gaps as preview contracts. It must not implement ingestion,
retrieval, provider calls, paper fetching, database schema, or durable state
writes.

## Sample Codex Final Report Text

The following sample is intentionally shaped to exercise the PR #602/#603
paste normalizer behavior.

```text
Summary
Prepared the preview-only Research Accumulation Scenario Pack for the
ChatGPT-Augnes-Codex dogfood loop.

Work ID: AG-DOGFOOD-RESEARCH-001
Scope: project:augnes
Result status: completed

Files changed
- docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md
- scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs
- package.json
- apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md

Verification
- node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs passed
- git diff --check passed

Skipped checks and caveats
- Live ChatGPT Developer Mode Work Contract Card observation skipped because no tunnel/session was available.
- Parser output remains a candidate only and needs human review.
- Operator follow-up noted in transcript.

Authority boundary statement
This result is preview-only docs/smoke work. It adds no automatic research
ingestion, no provider/OpenAI calls, no automatic GitHub fetch, no
proof/evidence writes, no work close/status mutation, no event
creation/mutation, no state commit/reject, no Codex execution from App/MCP, no
shell execution from App/MCP, no branch/PR creation from App/MCP code, no PR
review submission, and no merge/publish/retry/replay/deploy controls.

Next recommended step
Paste this report through codexResultText or codexResultPaste, review
ambiguous_combined_section_lines, and keep closure conservative until a human
classifies the ambiguous line.
```

## Expected Normalizer Outcome

- The line `Live ChatGPT Developer Mode Work Contract Card observation skipped
  because no tunnel/session was available.` goes to `skipped_checks`.
- The line `Parser output remains a candidate only and needs human review.`
  goes to `remaining_caveats`.
- The line `Operator follow-up noted in transcript.` goes to
  `ambiguous_combined_section_lines`.
- No combined-section line is duplicated into both `skipped_checks` and
  `remaining_caveats`.
- Changed files and verification results are extracted only from explicit
  sample text.
- The normalizer does not invent verification, proof/evidence rows, PR URLs,
  host observations, event IDs, close status, or durable state decisions.

## Authority Boundaries

This scenario is preview-only and dogfood-oriented. It adds no automatic
GitHub fetch, no proof/evidence write, no work close/status mutation, no event
creation/mutation, no state commit/reject, no Codex execution from App/MCP, no
shell execution from App/MCP, no provider/OpenAI calls from App/MCP, no branch
or PR creation from App/MCP code, no PR review submission, no
merge/publish/retry/replay/deploy controls, no DB migration beyond existing
demo seed non-schema data, no new user-facing App/MCP tools, and no widening of
the `work_loop_readonly` Developer Mode tool surface.

## Skipped Checks Policy

Skipped checks must use concrete reasons. Do not write `N/A` and do not treat
skipped checks as passing.

If a live MCP Inspector or ChatGPT Developer Mode session is not started, the
final report must explicitly say that live Work Contract Card observation was
skipped and why.

If `npm run codex:read-brief` is unavailable, the final report must use
`CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE` instead of implying the brief was read
through that command.

Do not claim proof/evidence rows, event rows, status changes, state commits,
GitHub review submissions, or provider calls unless they actually happened.

## What This Scenario Does Not Test

- Full research ingestion.
- Paper fetching, crawling, indexing, or metadata normalization.
- Provider/OpenAI calls.
- RAG, embeddings, vector search, or citation ranking.
- New database schema or migrations.
- Proof/evidence recording.
- Work status closure or automatic follow-up work creation.
- GitHub fetch, PR review submission, merge, publish, retry, replay, or deploy.
- A new ChatGPT/App/MCP tool surface.

## Follow-up Scenario

A later PR should add a Codex self-opinion dogfood scenario where Codex reviews
the ChatGPT-Augnes-Codex loop from its own worker perspective after using the
research accumulation scenario. That follow-up should be a separate scenario
and is intentionally not implemented here.
