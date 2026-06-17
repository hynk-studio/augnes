# Augnes Core Handoff Current Task Usage Status Dogfood Observation v0.1

## Date

2026-06-17

## Baseline Commit

`ecddf60`

This baseline is `main` after merged PR #614.

## Source Behavior

- PR #614 Core usage / implementation anchor status line in `Current task only`.
- `core_current_task_only` structured fields:
  - `core_usage`
  - `implementation_anchor_status`
  - `implementation_anchor_count`
  - `implementation_anchor_summary`
  - `full_context_required_before_implementation`
- Manual result return still points to
  `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md` and
  `codexResultText / codexResultPaste`.

## Run Mode

Run mode: deterministic Core Handoff usage-status observation.

This observation uses repo-backed deterministic fixtures and source text. It
does not claim a live host, live connector, or live Codex session.

## Explicit Statement Of What Was Not Run

- No live Codex session was run.
- No live MCP Inspector session was started.
- No ChatGPT Developer Mode session was started.
- No `npm run codex:read-brief` runtime brief was run.
- No automatic Codex execution was added or invoked.
- No automatic report generation was added or invoked.
- No automatic GitHub fetch was performed.
- No provider/OpenAI call was made.
- No proof/evidence rows were written.
- No work close/status mutation was performed.
- No event rows were created or mutated.
- No Augnes state was committed or rejected.
- No GitHub review or comment was submitted.
- No App/MCP tools were added.
- No Research / Paper / Knowledge Accumulation surface was implemented.
- The `work_loop_readonly` Developer Mode tool surface was not widened.

## Work Item / Fixture Used

Fixture used: `AG-006` from the deterministic
`scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs` Core-copy path.

AG-DOGFOOD-RESEARCH-001 was not used for this observation because no seeded
runtime or live Work Brief call was started in this PR. The AG-006 fixture is
the existing deterministic Core Handoff copy path that exercises
`Current task only`, `core_current_task_only`, implementation anchors, Core
usage, structured JSON delimiters, and the separate Full Context copy path.

## Compact Section Excerpt

Representative compact usage/status lines from the deterministic AG-006 Core
copy fixture:

```text
Current task only
- Work ID: AG-006
- Scope: project:augnes
- Task: Verify the preview-only ChatGPT-Codex work loop snapshot.
- Core usage: implementation_ready
- Implementation anchors: 2 attached; Implementation file/schema anchors are attached in Core; confirm them with codex:read-brief before editing.
- Return result using:
  - docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md
  - Paste through codexResultText / codexResultPaste for preview review.
```

## core_current_task_only Structured Object Observed

Representative structured object from the same deterministic AG-006 Core-copy
fixture:

```json
{
  "work_id": "AG-006",
  "scope": "project:augnes",
  "title": "Coordination event spine schema and storage",
  "current_task": "Verify the preview-only ChatGPT-Codex work loop snapshot.",
  "core_usage": "implementation_ready",
  "implementation_anchor_status": "attached",
  "implementation_anchor_count": 2,
  "implementation_anchor_summary": "Implementation file/schema anchors are attached in Core; confirm them with codex:read-brief before editing.",
  "full_context_required_before_implementation": false,
  "expected_files": [
    "docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_SNAPSHOT.md",
    "scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs",
    "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md"
  ],
  "expected_checks": [
    "curl -sS 'http://localhost:3000/api/work/AG-006/brief?scope=project:augnes'",
    "curl -sS 'http://localhost:3000/api/events?scope=project:augnes&work_id=AG-006'",
    "node scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs"
  ],
  "stop_conditions": [
    "Work ID is missing or unknown."
  ],
  "authority_boundary_summary": [
    "no Codex execution from App/MCP",
    "no proof/evidence write unless separately authorized",
    "no work close/status mutation",
    "no event/state mutation",
    "no GitHub review/merge/publish/retry/replay/deploy"
  ],
  "result_report_template": "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
  "next_return_path": "Paste through codexResultText / codexResultPaste for preview review."
}
```

## Implementation-ready Interpretation

- When anchors are attached, the compact section now lets Codex see
  `Core usage: implementation_ready` before reading broader context.
- `Implementation anchors: 2 attached` gives a quick readiness signal and a
  short summary without copying the full anchor appendix into the first
  subsection.
- This compact status does not grant automatic implementation authority. It is
  copied preview context only; Codex still needs ordinary repo inspection,
  user/Core confirmation where applicable, and the existing result review path.
- Codex-reported completion remains separate from Augnes close authority.
- The broader Core usage and implementation anchors sections remain useful
  because they carry the detailed anchor list, confirmation language, and
  surrounding Work Contract context.

## Missing-anchor Fallback Interpretation

- When anchors are missing, the compact text should say
  `Core usage: planning only / full context needed`.
- The implementation anchor line should say
  `Implementation anchors: none attached; open Full Context before implementation.`
- This means the Core packet is planning-only / Full Context needed before
  implementation.
- The fallback should have no invented implementation target, anchor, file path,
  proof/evidence row, PR URL, event ID, host observation, state decision, or
  approval.

## Dogfood Assessment

What became easier compared to PR #613:

- The first copied subsection now distinguishes implementation-ready work from
  planning-only / Full Context-needed work.
- Codex can see the Core usage and anchor status before scanning broader
  context.
- The manual return path still stays adjacent to the immediate task, so result
  reporting remains visible early.

What still requires broader context:

- The compact section is still a summary. Detailed implementation anchors,
  Constellation context, Memory Reuse context, skipped-check policy, and final
  report expectations remain below.
- Live operator copy behavior still needs a future MCP Inspector or ChatGPT
  Developer Mode observation.
- The next Research / Paper / Knowledge Accumulation artifact still needs its
  own preview-only doc/smoke contract.

This is enough to proceed to Research Accumulation Scenario Pack work because
no blocking compact-handoff issue was observed.

## Candidate Next PR Selection

Selected next PR candidate: Add preview-only Research Accumulation Scenario Pack
doc/smoke.

## Why Selected

The usage/status line closes the immediate compact-handoff clarity gap selected
by the prior dogfood pass. A bounded Research Accumulation Scenario Pack can now
reuse the clearer Core Handoff packet without adding execution or write
authority.

## Why Other Candidates Are Deferred

- Run live Developer Mode observation for current task copy is deferred because
  no live MCP Inspector / ChatGPT Developer Mode host was started in this task
  context.
- Further Core Handoff compact copy changes are deferred because this
  observation did not find a blocking compact-handoff issue.
- Automatic report generation is deferred because this PR and the selected next
  candidate are preview-only docs/smoke work.

## Authority Boundaries

This PR documents a preview-only dogfood observation for the Core Handoff
current task usage/status line. It adds no automatic Codex execution, no
automatic report generation, no automatic GitHub fetch, no proof/evidence
write, no work close/status mutation, no event creation/mutation, no state
commit/reject, no shell execution from App/MCP, no provider/OpenAI calls, no
branch/PR creation from App/MCP code, no PR review submission, no
merge/publish/retry/replay/deploy controls, no DB migration, no new
user-facing App/MCP tools, and no widening of the work_loop_readonly Developer
Mode tool surface.

## Skipped Checks And Concrete Reasons

- Live Codex session: skipped because this PR is a deterministic observation
  artifact and no separate live Codex output was provided.
- Live MCP Inspector / ChatGPT Developer Mode: skipped because no live host was
  started in this task context.
- Runtime `codex:read-brief`: skipped because this observation uses the existing
  deterministic AG-006 fixture and does not claim runtime brief output.
- Proof/evidence rows: skipped because this PR has no write authority.
- Work close/status mutation, event mutation, and state commit/reject: skipped
  because this PR is docs/smoke observation only.

## Remaining Caveats

- This observation is deterministic and fixture-backed, not a live operator host
  observation.
- The compact line summarizes anchor status; it does not replace the detailed
  implementation anchor section below it.
- The Research Accumulation Scenario Pack is intentionally not implemented in
  this PR.

## Next Recommended Step

Add a preview-only Research Accumulation Scenario Pack doc/smoke as the next
narrow PR, using the clearer Core Handoff usage/status line as the manual Codex
handoff starting point.
