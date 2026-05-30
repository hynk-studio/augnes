# Dogfood AI surface episode: Codex handoff UX feedback

## Episode Metadata

- Run ID: codex-handoff-ux-feedback
- Date: 2026-05-30
- Outcome: completed, report-only.
- Workflow: Work Contract Card / Codex Handoff Preview / Copy Codex Handoff / local `codex:handoff-preflight` dogfood.
- Episode status: completed.
- Repository branch: `codex/handoff-ux-dogfood-feedback`.
- Base: `origin/main` at `db9471c` after PR #277 merge.
- Local fixture files: `/tmp/augnes-codex-handoff-dogfood/*.txt`, not committed.
- Runtime status: no current Augnes runtime or real work item was supplied or called.
- This report preserves raw anchors before summaries. Summaries are review aids, not replacements for raw anchors.

## User Request Raw Anchor

Exact user-request excerpt preserved for this dogfood episode:

```text
Codex가 자체적으로 현재 개발 취지를 알고 직접 Augnes를 사용하면서 피드백을 주는 단계…
```

Task anchor excerpt:

```text
Dogfood the copied Codex Handoff packet UX from the perspective of a Codex user. Use the Work Contract Card / Codex Handoff Preview / Copy Codex Handoff / codex:handoff-preflight flow as a user would, then create one dogfood feedback report.
```

- Missing / partial / skipped anchor reason: the full prompt is available in the active task context, but this report keeps only short excerpts to preserve scope without turning transient chat history into project state.

## Handoff Packet Raw Anchor

Representative copied handoff packet excerpt used as the local-only fixture:

```text
Codex Handoff Preview
This is a preview/copy packet, not an execution action.

Readiness
- Status: ready

Current runtime
- AUGNES_API_BASE_URL: provided by current Augnes runtime
- CODEX_SCOPE: project:augnes
- CODEX_WORK_ID: AG-HANDOFF-DOGFOOD

Copyable start command preview
AUGNES_API_BASE_URL=<provided-current-runtime> CODEX_SCOPE=project:augnes CODEX_WORK_ID=AG-HANDOFF-DOGFOOD npm run codex:read-brief

Work item
- Title: Dogfood copied Codex handoff packet UX
- Status: ready
- Next action: Validate the copied handoff packet locally before a separate Codex session starts.

Authorization
- Evidence recording: no
- Proof-only closeout: no
- Browser verification: not_required

Expected scope
- Expected files:
  - reports/dogfood/2026-05-30-codex-handoff-ux-feedback.md
- Expected checks:
  - npm run codex:handoff-preflight -- --file <temp packet file>
  - npm run smoke:codex-handoff-preflight
  - npm run typecheck

Forbidden actions
  - No Codex execution from this card.
  - No commit/reject state.
  - No approve/publish/retry/replay/external posting.
  - No merge/auto-merge.
  - No proof/evidence recording controls.

Stop conditions
  - codex:read-brief fails.
  - Work ID is missing or unknown to the provided current runtime.
  - Scope is missing or ambiguous.

Authority boundaries
  - This preview is read-only.
  - This preview cannot execute Codex.
  - This preview cannot record evidence.
  - This preview cannot record proof.
  - Evidence is not approval.
  - Proof is not approval.
  - A PR is not merge authority.
  - Durable approval remains user/Core gated.
```

- Fixture note: `AG-HANDOFF-DOGFOOD` was a temporary parser fixture value only. It is not a real current-runtime work ID, evidence ID, proof/action ID, work-event ID, session ID, or Augnes state ref.
- Runtime note: no concrete `AUGNES_API_BASE_URL` was fabricated. The representative packet retained the current preview wording, `provided by current Augnes runtime`, so strict preflight stopped as expected.

## Commands Run

Repository sync and branch setup:

```text
git remote -v
git fetch origin main
git log --oneline --decorate -n 10 origin/main
git ls-tree -r --name-only origin/main scripts/codex-handoff-preflight.mjs scripts/smoke-codex-handoff-preflight.mjs docs/CODEX_HANDOFF_PREFLIGHT_V0_1.md
git checkout -B codex/handoff-ux-dogfood-feedback origin/main
```

Key sync result:

```text
db9471c (origin/main, origin/HEAD) Merge pull request #277 from hynk-studio/codex/handoff-packet-preflight
docs/CODEX_HANDOFF_PREFLIGHT_V0_1.md
scripts/codex-handoff-preflight.mjs
scripts/smoke-codex-handoff-preflight.mjs
```

Handoff preflight dogfood commands:

```text
npm run codex:handoff-preflight -- --file /tmp/augnes-codex-handoff-dogfood/codex-handoff-packet.txt
npm run codex:handoff-preflight -- --file /tmp/augnes-codex-handoff-dogfood/codex-handoff-packet.txt --strict
npm run codex:handoff-preflight -- --file /tmp/augnes-codex-handoff-dogfood/codex-handoff-missing-work-id.txt
npm run codex:handoff-preflight -- --file /tmp/augnes-codex-handoff-dogfood/codex-handoff-missing-work-id.txt --strict
npm run codex:handoff-preflight -- --file /tmp/augnes-codex-handoff-dogfood/codex-handoff-forbidden-labels.txt
```

Preflight result excerpts:

```text
default representative packet:
ok: true
runtime_reference: warn
recommended_next_step: Resolve warnings with user/Core confirmation before Codex starts implementation.

strict representative packet:
ok: false
runtime_reference: fail
recommended_next_step: Stop. Fix failed handoff packet checks before starting a separate Codex session.

missing CODEX_WORK_ID default:
ok: true
work_id: warn

missing CODEX_WORK_ID strict:
ok: false
work_id: fail

forbidden labels packet:
ok: false
forbidden_labels: fail
message: Forbidden UI/control labels detected: Run Codex, Merge PR
```

Verification commands:

```text
npm run typecheck
npm run smoke:codex-handoff-preflight
npm run smoke:chatgpt-work-contract-card
npm run smoke:current-runtime-codex-handoff-contract
npm run smoke:current-runtime-dogfood-readiness
npm run smoke:codex-closeout-preflight
npm run smoke:codex-record-completion-proof-helper
npm run smoke:dogfood-episode-template
git diff --check
```

## Files Changed

- Expected files changed: one dogfood feedback report.
- Actual files changed: `reports/dogfood/2026-05-30-codex-handoff-ux-feedback.md`.
- Package/script changes: none.
- Temporary local files intentionally not committed:
  - `/tmp/augnes-codex-handoff-dogfood/codex-handoff-packet.txt`
  - `/tmp/augnes-codex-handoff-dogfood/codex-handoff-missing-work-id.txt`
  - `/tmp/augnes-codex-handoff-dogfood/codex-handoff-forbidden-labels.txt`
- Unexpected files: none expected.

## Tests And Verification

- `npm run typecheck`: passed.
- `npm run smoke:codex-handoff-preflight`: passed. The smoke confirms complete packet default/strict behavior, missing work ID warning/failure behavior, forbidden `Run Codex` and merge labels, demo DB rejection, local-dev DB fallback labeling, secret-like token rejection, file input, stdin input, and absent helper runtime calls.
- `npm run smoke:chatgpt-work-contract-card`: passed. The smoke confirms handoff preview, stop conditions, copyable packet, local-only safe copy affordance, no forbidden controls, no direct network calls, and unchanged bridge write tools.
- `npm run smoke:current-runtime-codex-handoff-contract`: passed. The smoke confirms the current runtime endpoint plus work item abstraction, raw DB path fallback warning, required fields, authorization fields, stop conditions, and no runtime/OpenAI/GitHub network calls.
- `npm run smoke:current-runtime-dogfood-readiness`: passed. The smoke confirms current-vs-demo runtime documentation, required inputs, read-brief start gate, evidence/proof/browser policies, and no runtime/OpenAI/GitHub network calls.
- `npm run smoke:codex-closeout-preflight`: passed.
- `npm run smoke:codex-record-completion-proof-helper`: passed. The smoke uses local route-handler adapters and reported `github_calls: 0`, `openai_calls: 0`, and no external state-entry delta.
- `npm run smoke:dogfood-episode-template`: passed.
- `git diff --check`: passed.

## Skipped Checks And Concrete Reasons

- Check: `npm run codex:read-brief`.
  - Concrete reason: task explicitly states no real current runtime/work item is supplied and says not to run `codex:read-brief`.
  - Impact: no Work Brief, current-runtime work item, runtime validation, or real `CODEX_WORK_ID` can be claimed.

- Check: Augnes runtime calls.
  - Concrete reason: task explicitly forbids calling the Augnes runtime.
  - Impact: strict preflight cannot be resolved with a real current runtime endpoint in this episode.

- Check: evidence recording.
  - Concrete reason: task explicitly forbids recording evidence and no real current runtime/work item was supplied.
  - Impact: no evidence IDs exist for this report.

- Check: proof-only closeout recording.
  - Concrete reason: task explicitly forbids recording proof and no real current runtime/work item was supplied.
  - Impact: no proof/action IDs, work-event IDs, or proof closeout refs exist for this report.

- Check: live Work Contract Card / ChatGPT Developer Mode browser operation.
  - Concrete reason: this task forbids generated browser reports, screenshots/media artifacts, and runtime calls; the dogfood used the copied packet fixture and existing prior browser reports instead.
  - Impact: this report evaluates the copied packet/preflight UX, not a new live rendered widget session.

- Check: OpenAI calls.
  - Concrete reason: task explicitly forbids calling OpenAI.
  - Impact: none for local text preflight.

- Check: GitHub calls before normal PR publishing.
  - Concrete reason: task forbids GitHub calls except normal branch push / draft PR creation.
  - Impact: no GitHub issue/comment/review metadata was fetched for this report.

## Codex Result Summary

- Result status: completed, report-only.
- Summary: Codex dogfooded the copied handoff packet flow using local packet fixtures and the current `codex:handoff-preflight` helper, then recorded UX and safety findings in this report.
- What Codex completed:
  - Confirmed PR #277 files are present on `origin/main`.
  - Created a branch from `origin/main`.
  - Read the required authority, handoff, runbook, dogfood, browser verification, and package-script docs.
  - Created temporary local handoff packet fixtures.
  - Ran default and strict preflight on the representative packet.
  - Ran missing-work-ID and forbidden-label negative variants.
  - Ran the requested verification commands.
  - Created exactly one report under `reports/dogfood/`.
- What Codex skipped: runtime reads, proof recording, evidence recording, OpenAI calls, generated browser reports, screenshots/media artifacts, and runtime state mutation.
- What Codex reported as failed, partial, or blocked: strict preflight failed on the representative packet because no concrete current runtime endpoint was supplied. That is a safe stop condition for this no-runtime dogfood, not a repo test failure.

## ChatGPT Review Findings placeholder

- Review status: needs_review.
- Expected scope vs actual: pending ChatGPT/user review.
- Expected checks vs actual: pending ChatGPT/user review.
- Authority boundary review: pending ChatGPT/user review.
- Findings: none recorded yet.

## User Merge / Approval Decision placeholder

- User merge decision: unknown.
- User approval decision: unknown.
- Durable Core approval recorded separately: no.
- Decision anchor or exact excerpt if available: not available at report creation time.

## Context Preserved

- Request constraints preserved: report-only PR, one dogfood report, no runtime behavior changes, no UI controls, no runtime calls, no proof/evidence recording, no generated browser reports or media artifacts.
- Handoff context preserved: copied packet sections, start command preview, work item fields, authorization settings, expected scope, forbidden actions, stop conditions, and authority boundaries.
- Negative cases preserved: missing `CODEX_WORK_ID` and forbidden `Run Codex` / `Merge PR` labels.
- Verification context preserved: exact commands and pass/fail summaries.
- Prior browser context preserved: read existing Work Contract Card handoff preview and copy verification reports instead of creating new browser artifacts.

## Context Lost

- Live current-runtime context: no real runtime endpoint or work item was supplied.
- Real copied clipboard contents: no live ChatGPT Developer Mode widget session or clipboard operation was performed in this task.
- Runtime refs: no evidence IDs, proof/action IDs, work-event IDs, session IDs, or current-runtime work IDs exist for this episode.
- User/Core decision state: no merge or durable approval decision exists yet.
- Impact: this report can evaluate local packet clarity and preflight safety, but cannot validate real current-runtime lookup, real work item existence, or live widget-to-clipboard behavior.

## Context Repaired

- Repair action: used the current Work Contract Card runbook, current handoff contract, preflight doc, preflight smoke fixture shape, and prior browser verification reports to build a representative copied packet.
- Source used for repair: required docs and `scripts/smoke-codex-handoff-preflight.mjs`.
- Remaining uncertainty: whether a non-technical user will understand the difference between default advisory mode and strict ready-to-start mode without additional UI hinting.
- Follow-up needed: repeat with a real current runtime/work item and a live copied packet once user/Core supplies them.

## UX Findings

- Understandability: the copied packet is understandable for a Codex user. The section names map to the mental model Codex needs: readiness, runtime, scope, work item, authorization, expected scope, forbidden actions, stop conditions, and authority boundaries.
- Sufficiency: the packet is sufficient for local preflight and for deciding whether Codex should start. It is not sufficient for real implementation until a concrete current runtime endpoint and real work ID are supplied.
- Preflight clarity: `codex:handoff-preflight` explains missing or ambiguous fields clearly through stable check IDs, statuses, messages, and a recommended next step. The stderr warning/failure summary is especially useful for quick scanning.
- Stop-condition visibility: stop conditions are visible enough in the packet and are validated by preflight. They may still be too far down the packet for a hurried user; the start command area could benefit from a short nearby reminder that `codex:read-brief` must stop on failure.
- Evidence/proof/browser settings: `Evidence recording: no`, `Proof-only closeout: no`, and `Browser verification: not_required` are understandable to a Codex user. For less technical users, `no (not authorized)` and `not required for this slice` would be clearer than terse enum-like values.
- DB-path burden: the normal flow does not require the user to think in DB paths. The only DB-path text is framed as a local-dev fallback boundary, which is the right default.
- Flow length: the flow is acceptable for a high-authority handoff. It is longer than a normal copy/paste UX, but the length buys useful safety. The highest-friction part is saving clipboard text to a temp file before running `--file`.
- Smoothness: a small command hint next to `Copy Codex Handoff`, plus an optional structured JSON block in the copied packet, would reduce user/operator translation work.
- Strict-mode UX: strict mode correctly stopped on the placeholder runtime. The confusing part is that `provided by current Augnes runtime` sounds intentional in the preview, but strict mode treats it as unresolved. The UX should make clear that default mode is for copied-packet review and strict mode is for ready-to-start packets with concrete runtime confirmation.

## Safety Findings

- Codex execution controls: the packet avoids Codex execution controls. Existing smoke coverage confirms the copy affordance is local-only and forbidden execution/control text is absent.
- Forbidden labels: preflight catches forbidden `Run Codex` and `Merge PR` labels as failures in default mode.
- Missing work ID: preflight catches missing `CODEX_WORK_ID`; default mode warns and strict mode fails.
- Runtime calls: preflight avoids runtime calls. The helper is local text validation and smoke coverage reports helper runtime calls absent.
- OpenAI/GitHub calls: preflight does not call OpenAI or GitHub. This episode made no GitHub calls except the later normal PR publishing flow.
- Proof/evidence boundaries: packet and preflight preserve that proof and evidence are separate from approval and require explicit authorization before any recording.
- Approval/merge boundaries: packet and preflight preserve that PRs are not merge authority, proof is not approval, evidence is not approval, and durable approval remains user/Core gated.
- Runtime-state safety: no runtime state, DB schema, API route, MCP/App tool schema, plugin/hook behavior, package scripts, dependencies, or secret handling changed.

## Friction Points

- Users must know how to save copied packet text to a file or pipe it into the helper.
- The JSON output is precise but verbose; a non-JSON summary line before the object could help, while preserving JSON for tooling.
- The current runtime placeholder warning is correct, but strict-mode failure may surprise users when the Work Contract Card intentionally says `provided by current Augnes runtime`.
- Evidence/proof/browser authorization values are safe, but they read like internal enums.
- The packet repeats authority boundaries in several places. That helps safety, but makes the pasted handoff feel longer than the actual work scope.

## Follow-Up Backlog

- Add a small `Run handoff preflight` hint next to `Copy Codex Handoff`, including the `--file` and stdin forms.
- Add a structured JSON block alongside the plain text packet so preflight can parse less heuristically while humans still get readable text.
- Add live current-runtime validation once a real runtime/work item is available and explicitly scoped.
- Add Developer Mode verification later if scoped and a real tunnel/session is available.
- Tune warning language if users find it too noisy, especially the default-mode runtime placeholder warning.
- Consider friendlier display values for evidence/proof/browser settings, such as `no (not authorized for this handoff)` and `not required for this slice`.
- Add a short strict-mode explanation: default mode checks copied packets; strict mode requires concrete current-runtime confirmation before Codex starts.

## Final Outcome

- Outcome: completed.
- Successful parts: local copied-packet preflight flow, strict stop behavior, negative missing-work-ID case, negative forbidden-label case, requested smoke/typecheck verification, and report-only diff.
- Failed parts: none for the requested report-only task.
- Partial parts: strict representative packet failed because no concrete runtime endpoint was supplied; this is expected for the no-runtime dogfood and should be treated as safety behavior.
- Skipped parts: runtime calls, `codex:read-brief`, proof/evidence recording, live browser/Developer Mode operation, screenshots/media artifacts, OpenAI calls, and GitHub calls before normal PR creation.
- Final user/Core/GitHub state if known: no user merge or durable approval decision is known at report creation time.

## Authority Boundaries

- Dogfood report is evaluation material only.
- Handoff preflight is local text validation only.
- This PR does not execute Codex.
- This PR does not call runtime.
- This PR does not record proof/evidence.
- This PR does not create or edit runtime state.
- This PR does not add runtime behavior, routes, schema changes, MCP/App tool schema changes, hooks, plugin changes, package-script changes, dependencies, secret handling changes, UI controls, browser automation, screenshot capture, or generated browser/media artifacts.
- Proof is not approval.
- Evidence is not approval.
- PR is not merge authority.
- Durable approval remains user/Core gated.
