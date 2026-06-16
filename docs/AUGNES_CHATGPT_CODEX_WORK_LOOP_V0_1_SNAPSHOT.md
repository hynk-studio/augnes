# Augnes ChatGPT-Codex Work Loop v0.1 Snapshot

## Summary

Date: 2026-06-16

This snapshot closes the preview-only ChatGPT-Augnes-Codex work progression
loop added across PR #594, PR #595, and PR #596. The loop now gives an
operator a read-only path from project work selection through Work Contract
review, Core / Full Codex handoff packet selection, user-provided Codex result
import, event timeline inspection, and closure / follow-up recommendation.

## Baseline

- Repository: `hynk-studio/augnes`
- Baseline commit: `89f920e`
- Baseline PRs:
  - PR #594: Codex Result Import / Review Surface
  - PR #595: Work Event Spine Timeline / Inspector
  - PR #596: Result Review -> Next Action / Follow-up Closure Preview
- Snapshot scope: docs and deterministic smoke only.

## Loop

```text
Work Picker
-> Work Brief / Work Contract Card
-> Core / Full Codex handoff
-> Codex result import / review
-> Work Event Spine Timeline / Inspector
-> Result Closure / Follow-up Recommendation
```

## Verified User/Operator Path

The snapshot smoke verifies the structuredContent path expected from:

1. `augnes_list_work_items(scope=project:augnes)`
2. `augnes_get_work_brief(scope=project:augnes, workId=AG-006)`
3. `augnes_get_work_brief` with no `codexResult`
4. `augnes_get_work_brief` with a completed but partially verified result
5. `augnes_get_work_brief` with an aligned completed result
6. `augnes_get_work_brief` with a blocked result

AG-006 is used because the demo seed attaches coordination event data to it.
When the seeded runtime is available, the AG-006 event timeline should contain
at least one event. The deterministic smoke also covers the no-event empty
state so the UI path cannot invent event IDs or payload refs.

## Structured Surfaces

### Work Picker

Checked fields:

- `work_picker_card`
- `work_candidates`
- `recommended_work_id`
- `selection_reason`
- `next_action_hint`
- `handoff_tool_hint`

Expected behavior: AG-006 is recommended or appears as a candidate, and the
picker remains read-only.

### Work Contract Card

Checked fields:

- `work_contract_card`
- expected files or explicit no-expected-files fallback
- expected checks or explicit no-expected-checks fallback
- Core / Full handoff fields
- final readiness summary

### Core / Full Handoff

Checked fields:

- `core_codex_handoff_packet`
- `copyable_core_handoff_text`
- `full_codex_handoff_packet`
- `copyable_full_handoff_text`
- `codex_handoff_recommendation`
- `codex_handoff_decision`

The Core / Full recommendation is explicit. The handoff remains preview/copy
only and does not execute Codex.

### Result Import / Review

Checked fields:

- `codex_result_review_packet_preview`
- `final_handoff_codex_result_review_packet`
- `codex_pr_review_packet_preview`
- `codex_result_import_input_shape`
- `codex_result_import_review_surface`

No result input maps to `needs_result_input` and does not invent changed files,
verification results, PR URLs, proof IDs, evidence IDs, screenshots, findings,
or host observations.

A completed result that does not cover expected AG-006 curl checks maps to
conservative additional verification guidance, not close-ready completion.

An aligned completed result can reach ready-for-human-review / close-ready
preview guidance.

### Event Spine Timeline / Inspector

Checked fields:

- `work_event_spine_timeline`
- `coordination_event_timeline`
- `event_spine_timeline`
- `event_spine_inspector`

The timeline uses explicit `created_at_ascending` sort order. The empty state
is explicit and must not invent events. The timeline remains read-only and
does not create or mutate events.

### Result Closure / Follow-up Recommendation

Checked fields:

- `result_review_closure_preview`
- `work_result_closure_preview`
- `next_action_closure`
- `followup_closure_preview`

Scenario mappings:

- No result input -> `needs_result_input`
- Missing expected verification -> `additional_verification_needed`
- Aligned completed result -> `close_ready`
- Blocked result -> `result_incomplete_or_blocked`

The `follow_up_seed` is preview-only text. It is not a created work item,
handoff, event, proof row, evidence row, branch, PR, or review submission.

## Dogfood Scenarios

### No Result Input

Expected status:

- result review: `needs_result_input`
- closure: `needs_result_input`

No changed files, verification results, PR URL, proof ID, evidence ID,
screenshot, finding, host observation, close status, or approval is invented.

### Partially Verified Completed Result

Expected status:

- Codex may report `completed`
- Augnes review remains conservative if expected AG-006 curl checks are not
  covered
- closure recommendation: `additional_verification_needed`

### Aligned Completed Result

Expected status:

- result review: `ready_for_human_review`
- suggested result status: `completed`
- suggested next action: `close_done`
- closure recommendation: `close_ready`

This is still advisory preview guidance. Human review and merge decisions stay
outside this surface.

### Blocked Result

Expected status:

- suggested result status: `blocked`
- suggested next action: `result_incomplete_blocked`
- closure recommendation: `result_incomplete_or_blocked`

## Authority Boundaries

This snapshot explicitly asserts:

- no Codex execution
- no App/MCP shell execution
- no GitHub API calls from product/App/MCP code
- no provider/OpenAI calls
- no proof/evidence writes
- no event creation/mutation
- no work close/status update
- no state commit/reject
- no branch/PR creation
- no PR review submission
- no merge/publish/retry/replay/deploy controls
- no durable lifecycle automation

## Verification

Snapshot smoke:

```bash
node scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs
```

Recommended PR validation bundle:

```bash
npm run typecheck
npm --prefix apps/augnes_apps run typecheck
npm run smoke:chatgpt-work-contract-card
npm run smoke:codex-operator-review-packet
npm run smoke:codex-handoff-preflight
npm run smoke:codex-closeout-preflight
node scripts/smoke-codex-result-import-review-surface.mjs
node scripts/smoke-work-event-spine-timeline.mjs
node scripts/smoke-result-review-followup-closure.mjs
node scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs
git diff --check
git diff --cached --check
```

## Skipped Checks

- Runtime-backed dogfood: skipped in this snapshot PR because
  `npm run codex:read-brief` returned `CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE`
  at task intake, and this PR intentionally uses deterministic source/fixture
  smoke coverage instead of starting a temp DB, Next runtime, or MCP bridge.
- Live ChatGPT Developer Mode / MCP Inspector host observation: skipped
  because no Developer Mode or Inspector session was run for this docs/smoke
  closeout snapshot.
- Proof/evidence recording: skipped because this PR does not request
  proof/evidence writes and no `CODEX_WORK_ID` was provided for proof-only
  closeout.

## Remaining Caveats

- This snapshot proves the committed structuredContent and widget-normalizer
  path with deterministic fixtures. It does not claim a live ChatGPT host,
  MCP Inspector, browser screenshot, or clipboard observation.
- The result closure surface is advisory preview guidance only. It does not
  durably close work, create follow-up work, or create lifecycle records.
- GitHub PR metadata is user-provided result input only for this App/MCP path;
  the product/App/MCP code does not fetch GitHub.

## Next Recommended Steps

- Run live ChatGPT Developer Mode / MCP Inspector host observation.
- Apply small UX polish only if the host reveals layout or copy issues.
- Then decide whether to move toward semi-automation gates or toward
  research/paper/knowledge accumulation surfaces.
