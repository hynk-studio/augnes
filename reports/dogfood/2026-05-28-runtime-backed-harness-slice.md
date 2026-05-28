# Dogfood AI surface episode: Runtime-backed Augnes harness slice

## Episode Metadata

- Run ID: runtime-backed-harness-slice
- Date: 2026-05-28
- Outcome: completed, pending final proof refs until draft PR exists.
- Runtime mode: ephemeral demo runtime mode.
- Demo DB: `AUGNES_DB_PATH=/tmp/augnes-runtime-dogfood.db`
- Runtime base URL: `http://127.0.0.1:3000`
- Scope: `project:augnes`
- Work ID: `AG-004`
- Workflow: Codex read Augnes brief -> made one tiny docs-only change -> ran verification -> recorded evidence -> opened draft PR -> records proof-only closeout after PR URL is available.
- This capture preserves raw anchors before summaries. Summaries are review aids, not replacements for raw anchors.

Authority boundaries:

- Dogfood notes are evaluation material, not committed state.
- Ephemeral demo runtime refs are not production/current Augnes state refs.
- Proof is not approval.
- Evidence is not approval.
- PR is not merge authority.
- Durable approval remains user/Core gated.
- Codex does not commit/reject Augnes state.
- Codex does not merge PRs.

## User Request Raw Anchor

```text
Run the first runtime-backed Augnes harness dogfood slice.
If no local Augnes runtime is already available, bootstrap an ephemeral local
demo runtime yourself using a temporary DB, then proceed with a seeded work item.
```

```text
Known repo facts:
- Demo seed includes seeded work item `AG-004`, title `Codex completion protocol`.
- For demo bootstrap mode, use:
  - `AUGNES_DB_PATH=/tmp/augnes-runtime-dogfood.db`
  - `AUGNES_API_BASE_URL=http://127.0.0.1:3000`
  - `CODEX_SCOPE=project:augnes`
  - `CODEX_WORK_ID=AG-004`
```

- Missing / partial / skipped anchor reason: full chat prompt is not stored in repo history; this report preserves the relevant task excerpts.

## ChatGPT Planning Prompt Raw Anchor

This episode followed the existing PR9 dogfood capture instructions and the runtime-backed correction from the user task. Stable local planning anchors:

```text
docs/DOGFOOD_AI_SURFACE_EPISODE_CAPTURE_V0_1.md
docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md
reports/dogfood/2026-05-28-ai-surface-harness-pr0-9.md
```

- Missing / partial / skipped anchor reason: no separate ChatGPT planning prompt was available outside this conversation.

## Codex Prompt Raw Anchor

```text
Primary goal:
Reach a real runtime-backed loop:
Codex reads Augnes brief -> makes one tiny docs-only change -> verifies ->
records evidence if possible -> opens draft PR -> records proof-only closeout
if possible -> creates dogfood report.
```

```text
Preferred change:
Add a short section to `docs/DOGFOOD_AI_SURFACE_EPISODE_CAPTURE_V0_1.md`
titled:
`## Ephemeral Demo Runtime Mode`
```

- Missing / partial / skipped anchor reason: exact transient tool outputs are summarized below with concrete command anchors and returned IDs.

## Work ID / Handoff ID / Session ID

- Work ID: `AG-004`
- Work title from read brief: `Codex completion protocol`
- Work status from read brief: `in_progress`
- Handoff ID: none supplied.
- Session ID: none supplied.
- Missing IDs and concrete reasons: no `CODEX_SESSION_ID` was supplied, and Session Adapter v0.2 does not create sessions automatically.
- IDs are trace anchors only; they are not committed state authority.

## Expected Scope

- Expected files: one tiny docs clarification plus this dogfood report.
- Expected behavior or documentation outcome: document ephemeral demo runtime mode for runtime-backed dogfood and capture the run.
- Expected checks: typecheck, targeted dogfood/browser/card/MCP/plugin smoke checks, closeout preflight, and `git diff --check`.
- Forbidden changes: runtime behavior, DB/schema, API routes, MCP/App tool schemas, active MCP config, plugin MCP config, app mappings, hooks, ChatGPT App UI, browser automation, screenshot capture, secret handling, dependencies, OpenAI calls, external publication, GitHub comments, approval/publish/retry/replay, merge/auto-merge, Augnes commit/reject, fabricated refs, or committed temp DB/log/PID files.
- Failed / partial / skipped scope notes: no forbidden files were intentionally touched.

## Runtime Read Brief

Single-shell lifecycle diagnostic succeeded after an initial not-ready attempt:

```text
Augnes state brief
runtime: augnes
scope: project:augnes
active_state count: 3
pending_proposals count: 0
recent_actions count: 0
open_tensions count: 1

Augnes work brief
work_id: AG-004
scope: project:augnes
title: Codex completion protocol
status: in_progress
next_action: Implement the helper and runbook, then record the completion
against this trace anchor after PR work is complete.
related_state_keys:
- integration.chatgpt_app
- implementation.stack
```

Runtime limitation: this read brief came from `/tmp/augnes-runtime-dogfood.db`, an ephemeral demo DB seeded by `npm run demo:seed`. Its refs must not be mixed with production/current Augnes state.

## Commands Run

```text
git status --short
git branch --show-current
test -d node_modules
test -d apps/augnes_apps/node_modules
AUGNES_DB_PATH=/tmp/augnes-runtime-dogfood.db npm run db:reset
AUGNES_DB_PATH=/tmp/augnes-runtime-dogfood.db npm run db:migrate
AUGNES_DB_PATH=/tmp/augnes-runtime-dogfood.db npm run demo:seed
single-shell npm run dev -- --port 3000 plus npm run codex:read-brief
npm run typecheck
npm run smoke:dogfood-episode-template
npm run smoke:browser-verification-report-template
npm run smoke:chatgpt-work-contract-card
npm run smoke:codex-mcp-augnes-bridge-docs
npm run smoke:augnes-operator-plugin-scaffold
npm run smoke:augnes-operator-plugin-hooks
git diff --check
single-shell runtime evidence recording for typecheck, dogfood smoke, and closeout preflight
npm run dogfood:create-episode -- --run-id runtime-backed-harness-slice --title "Runtime-backed Augnes harness slice" --work-id AG-004 --outcome completed
```

- Commands not run and concrete reasons: no browser/computer-use verification was run because this docs-only change has no rendered UI surface.

## Files Changed

- Expected files changed:
  - `docs/DOGFOOD_AI_SURFACE_EPISODE_CAPTURE_V0_1.md`
  - `reports/dogfood/2026-05-28-runtime-backed-harness-slice.md`
- Actual files changed: same as expected before PR creation.
- Diff scope check: pending final pre-commit check.
- Unexpected files: none at report creation time.
- Generated files intentionally not committed: `/tmp/augnes-runtime-dogfood.db`, `/tmp/augnes-runtime-dogfood-single-shell.log`, `/tmp/augnes-runtime-dogfood-evidence.log`, and transient read-brief stdout/stderr files.

## Tests And Verification

- `npm run typecheck`: passed.
- `npm run smoke:dogfood-episode-template`: passed.
- `npm run smoke:browser-verification-report-template`: passed.
- `npm run smoke:chatgpt-work-contract-card`: passed.
- `npm run smoke:codex-mcp-augnes-bridge-docs`: passed.
- `npm run smoke:augnes-operator-plugin-scaffold`: passed.
- `npm run smoke:augnes-operator-plugin-hooks`: passed.
- `git diff --check`: passed.
- Closeout preflight: passed in advisory mode with `CODEX_WORK_ID=AG-004` present.
- Failed checks: none.
- Partial checks: proof-only closeout pending until the draft PR URL exists.

## Browser / Computer-Use Checks

- Browser/computer-use report refs if relevant: none.
- Views or surfaces checked: none.
- UI loads: skipped.
- Target view/card renders: skipped.
- Missing-data state renders: skipped.
- Unauthorized controls visible: skipped.
- Skipped reason: docs-only runtime-backed dogfood note and report; no rendered UI changed.

## Skipped Checks And Concrete Reasons

- Check: browser/computer-use verification.
  - Concrete reason: docs-only change with no rendered UI surface.
  - Impact on review: no UI screenshot/report artifact is expected.
  - Follow-up if needed: use the browser verification runbook for a future UI/operator-surface slice.
- Check: session binding.
  - Concrete reason: missing `CODEX_SESSION_ID`; Session Adapter v0.2 does not create sessions automatically.
  - Impact on review: no session trace ref is claimed.
  - Follow-up if needed: bind an existing session in a future work item.

## PR Link

- PR: pending at report creation time; update after draft PR is opened.
- Branch: `codex/runtime-backed-harness-dogfood`
- Commit: pending at report creation time.
- Paste exact PR title/body excerpts when relevant: pending.

## Codex Result Summary

- Result status: completed through evidence recording; proof closeout pending until PR URL exists.
- Summary: Codex validated the demo runtime-backed loop, added a small docs section for ephemeral demo runtime mode, ran requested checks, and recorded evidence rows against `AG-004`.
- What Codex completed: read brief, docs update, verification, evidence recording, and dogfood report creation.
- What Codex skipped: browser/computer-use verification and session binding with concrete reasons.
- What Codex reported as failed, partial, or blocked: no failed checks; proof-only closeout remains pending until the draft PR exists.

## ChatGPT Review Findings

- Review status: placeholder, pending user/ChatGPT review.
- Expected scope vs actual: expected docs-only guidance and one report; actual matches before PR creation.
- Expected checks vs actual: expected checks passed before PR creation.
- Authority boundary review: no authority expansion intended.
- Missing evidence, proof, action, work event, or session refs: proof/action/work-event refs pending after PR creation; session refs unavailable because no session ID was supplied.
- Findings: placeholder for post-PR review.

## User Merge / Approval Decision

- User merge decision: pending.
- User approval decision: pending.
- Durable Core approval recorded separately: no.
- Decision anchor or exact excerpt if available: none yet.

## Evidence / Proof / Action / Work Event / Session Refs

- Evidence IDs:
  - `evidence:8d7fab71-7ec3-4c95-9aa9-586888fcc722` for `npm run typecheck`.
  - `evidence:9dea1238-5c7b-4b8e-a45b-ac47b7e8eb52` for `npm run smoke:dogfood-episode-template`.
  - `evidence:19449260-0829-4c99-870e-79a48d847f1f` for `npm run codex:closeout-preflight`.
- Proof/action IDs: pending after draft PR URL exists.
- Work event IDs: pending after draft PR URL exists.
- Session trace refs: none; missing `CODEX_SESSION_ID`.
- Browser/computer-use report refs: none; docs-only no rendered UI.
- Missing refs and concrete reasons: proof-only closeout is intentionally deferred until the draft PR URL can be included.
- Dogfood notes do not create evidence, proof, action, work event, session, or committed state records by themselves.

## Context Preserved

- Request constraints preserved: runtime-backed loop, demo DB mode, `AG-004`, and docs-only scope.
- Authority boundaries preserved: proof/evidence/PR are not approval or merge authority.
- Verification context preserved: command list, evidence IDs, read-brief summary, and skipped reasons.
- Raw anchors preserved: user prompt excerpts and returned runtime/evidence IDs.

## Context Lost

- Missing raw anchors: full chat transcript and full command stdout for every smoke check.
- Missing commands or outputs: detailed server logs were not preserved in the report because the successful single-shell lifecycle used only readiness output; temp logs are not committed.
- Missing IDs: session ID and proof/action/work event IDs pending at report creation time.
- Ambiguous user/Core decision state: user merge approval is pending.
- Impact: none for docs change; proof and PR fields must be updated after draft PR/proof closeout.

## Context Repaired

- Repair action: diagnosed previous empty-log background server failure by running server startup, readiness polling, and cleanup in one shell invocation.
- Source used for repair: single-shell lifecycle diagnostic output with `READ_BRIEF_READY`.
- Remaining uncertainty: cross-command background process persistence in this Codex shell environment remains unreliable.
- Follow-up needed: use single-shell lifecycle for future runtime-backed demo dogfood evidence/proof attempts unless a persistent runtime is supplied.

## Remaining Gaps

- Gap: proof/action/work-event IDs not yet recorded at report creation time.
  - Reason: proof-only closeout needs draft PR URL.
  - Impact: report requires follow-up update after PR opens.
  - Owner or next review surface: Codex closeout after draft PR creation.
- Gap: session trace not bound.
  - Reason: missing `CODEX_SESSION_ID`.
  - Impact: no session-specific trace visibility.
  - Owner or next review surface: future work item with an existing session ID.

## Follow-Up Backlog

- Follow-up: record proof-only closeout after draft PR URL exists.
  - Priority: high.
  - Blocking condition: draft PR URL required.
  - Proposed next PR or work item: this PR closeout.
- Follow-up: run a real non-demo runtime-backed dogfood item.
  - Priority: medium.
  - Blocking condition: production/current runtime work ID supplied by user/Core.
  - Proposed next PR or work item: future runtime-backed harness validation.

## Final Outcome

- Outcome: completed through evidence recording, with proof closeout pending.
- Successful parts: demo runtime read brief, docs change, verification, evidence recording, dogfood report.
- Failed parts: none.
- Partial parts: proof/action/work-event IDs pending.
- Skipped parts: browser verification and session binding, both with concrete reasons.
- Final user/Core/GitHub state if known: no GitHub PR or Core approval yet at report creation time.

## Notes

- Additional raw anchors: evidence helper output stated that it records observation evidence only and does not call GitHub/OpenAI, execute replay, publish, approve, or mutate state authority rows.
- Additional review notes: ephemeral demo refs in this report are useful for dogfood validation but are not production/current Augnes state.
- Secret handling note: no tokens, private keys, local `.env` values, tunnel credentials, or hidden provider/debug identifiers were pasted.
- Dogfood notes are research/evaluation material unless Augnes Core separately records a durable decision.
