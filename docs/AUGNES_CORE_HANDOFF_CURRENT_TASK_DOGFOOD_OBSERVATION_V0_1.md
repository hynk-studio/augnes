# Augnes Core Handoff Current Task Dogfood Observation v0.1

## Date

2026-06-17

## Baseline Commit

`d49a3ce`

This baseline is `main` after merged PR #612.

## Source Behavior

- Core Handoff current task only compact subsection from PR #612.
- `core_current_task_only` structured content from the Core Handoff packet.
- `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md` for manual Codex result
  return.

## Run Mode

Run mode: deterministic Core Handoff copy observation.

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
the existing deterministic Core Handoff copy path that already exercises
`Current task only`, `core_current_task_only`, implementation anchors, Core
usage, structured JSON delimiters, and the separate Full Context copy path.

## Core Handoff Text Used

Representative extracted compact section from the deterministic AG-006 Core
copy fixture:

```text
Current task only
- Work ID: AG-006
- Scope: project:augnes
- Task: Verify the preview-only ChatGPT-Codex work loop snapshot.
- Expected files:
  - apps/augnes_apps/src/server.ts
- Expected checks:
  - npm run smoke:chatgpt-work-contract-card
- Stop if:
  - Work ID is missing or unknown.
- Authority boundary:
  - no Codex execution from App/MCP
  - no proof/evidence write unless separately authorized
  - no work close/status mutation
  - no event/state mutation
  - no GitHub review/merge/publish/retry/replay/deploy
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

## Compact Subsection Checks

- Work ID: present as `AG-006`.
- Scope: present as `project:augnes`.
- Task: present before broader context.
- Expected files: present before broader context.
- Expected checks: present before broader context.
- Stop if: present before broader context.
- Authority boundary: present before broader context.
- Return result using: present before broader context.
- `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`: present.
- `codexResultText / codexResultPaste`: present.

## Broader Context Preservation

- Immediate task context still appears below the compact subsection.
- Core usage still appears below the compact subsection.
- Implementation anchors still appear below the compact subsection.
- The deterministic AG-006 fixture includes implementation anchors:
  `lib/coordination-events.ts` and `app/api/work/[work_id]/brief/route.ts`.
- The explicit fallback remains in source for Core packets without anchors:
  `No implementation file/schema anchors are attached in Core. Use Core for
  planning only, or open Full Context before implementation.`
- Structured JSON delimiters are still present:
  `BEGIN_AUGNES_CODEX_HANDOFF_JSON` and `END_AUGNES_CODEX_HANDOFF_JSON`.
- The Full Context copy path remains separate through `Copy Full Context`,
  `full_codex_handoff_packet`, and `copyable_full_handoff_text`.

## Dogfood Assessment

What became easier for Codex to start from:

- The immediate task is visible within the first few lines of the copied Core
  packet.
- The manual result-return path is explicit without scanning the closeout
  sections.
- Expected files, expected checks, stop conditions, and the authority boundary
  are grouped before the broader Work Contract context.

What still requires broader context:

- Whether Core is `implementation_ready` or planning-only still requires reading
  the `Core usage` section below the compact subsection.
- The implementation anchor list still requires reading the `Implementation
  anchors` section below the compact subsection.
- The broader Work Contract context is still needed for Constellation summary,
  Memory Reuse summary, PR checklist summary, closeout expectations, skipped
  check policy, and final report requirements.

Template or label assessment:

- The reusable result report template reference is in the compact subsection and
  does not need a label change.
- The compact section would be more self-sufficient if it carried one additional
  line for Core usage / implementation anchor status.

## Candidate Next PR Selection

Selected next PR candidate: add Core usage / implementation anchor status line
to Current task only.

## Why Selected

This observation shows that the compact subsection gives Codex the immediate
task quickly, but a worker still has to scan below it to learn whether Core is
implementation-ready or planning-only. Adding a single compact status line would
make the first section a better start point without copying the full anchor
appendix into it.

## Why Other Candidates Are Deferred

- Add preview-only Research Accumulation Scenario Pack doc/smoke is deferred
  because this PR is observing Core Handoff copy clarity, not implementing the
  next research surface artifact.
- Run live Developer Mode observation for current task copy is deferred because
  no live MCP Inspector / ChatGPT Developer Mode host was available in this
  task context.

## Authority Boundaries

This PR documents a preview-only dogfood observation for the Core Handoff
current task compact subsection. It adds no automatic Codex execution, no
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
- The representative compact text fixture lists a smaller visible file/check
  subset than the full `core_current_task_only` object; the structured object is
  the better source for model-readable expected files/checks.
- Live copy behavior should still be observed in a future Developer Mode or MCP
  Inspector pass before treating the operator path as fully dogfooded.

## Next Recommended Step

Add one preview-only Core usage / implementation anchor status line to the
`Current task only` subsection, then dogfood whether a separate Codex session
can decide between implementation-ready and planning-only from the compact
section alone.
