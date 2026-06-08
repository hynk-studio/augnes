# Perspective Agent Brief Handoff Copy Refine

Date: 2026-06-08

## Branch

`codex/perspective-agent-brief-handoff-copy-refine-v0-1`

## Commit

Pending final commit. The PR body records the final branch commit SHA.

## Preflight Result

PASS. PR #455, “Evaluate manual Agent Brief handoff packet in Codex review loop”, is merged into `main`.

Verified PR #455 merge commit:

`3ec159a5f33370028b4594fe51cfb5d32cdbfdb0`

Verified `origin/main` contains:

- `scripts/dogfood-perspective-manual-agent-brief-codex-review-loop.mjs`
- `reports/dogfood/2026-06-07-perspective-manual-agent-brief-codex-review-loop-packet.md`
- `reports/2026-06-07-perspective-manual-agent-brief-codex-review-loop-eval.md`
- `docs/PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_EVAL_V0_1.md`

## Files Changed

- `lib/perspective-ingest/perspective-agent-brief-handoff-packet.ts`
- `docs/PERSPECTIVE_AGENT_BRIEF_HANDOFF_COPY_REFINE_V0_1.md`
- `scripts/smoke-perspective-agent-brief-handoff-copy-refine.mjs`
- `reports/2026-06-07-perspective-agent-brief-handoff-copy-refine.md`
- `reports/dogfood/2026-06-07-perspective-manual-agent-brief-codex-review-loop-packet.md`
- `reports/2026-06-07-perspective-manual-agent-brief-codex-review-loop-eval.md`
- `docs/PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_EVAL_V0_1.md`
- `scripts/dogfood-perspective-manual-agent-brief-codex-review-loop.mjs`
- `scripts/smoke-perspective-manual-agent-brief-codex-review-loop-eval.mjs`
- `scripts/smoke-perspective-manual-agent-brief-handoff-dogfood.mjs`
- `package.json`
- Existing Perspective smoke allowlists, if required by the changed-file boundary.

## Dogfood Finding Addressed

The previous `codex_handoff` packet said “Do not execute Codex.” That was safe but ambiguous for a packet intended to be used inside a user-approved Codex PR workflow.

This PR changes the meaning from “Codex can never act” to “this packet does not grant authority by itself.” Codex code/test/open-PR work now requires a surrounding user-approved prompt that explicitly scopes the task.

## Copy Changes Summary

- `codex_handoff` purpose now says it is for a user-approved Codex PR workflow.
- `codex_handoff` purpose says Codex may code, test, and open a PR only when the surrounding prompt explicitly scopes that task.
- Handoff constraints now forbid merge, deploy, publish, approval, provider/model/API calls, raw source inference, and Formation authority.
- Handoff constraints now state ChatGPT reviews the PR and the user decides whether to merge.
- Authority now states packet authority is context only.
- Authority now states user-approved PR workflow is required for Codex code/test/open-PR work.
- Authority now states the packet does not grant Codex execution authority by itself.
- `chatgpt_review` and `agent_context` purposes now use audience-specific review/context language.

## Packet Artifact Update

Regenerated:

`reports/dogfood/2026-06-07-perspective-manual-agent-brief-codex-review-loop-packet.md`

The artifact now includes the refined Codex PR workflow language and no longer includes the standalone confusing instruction “Do not execute Codex.”

## Tests Run

- `npm run typecheck`: PASS
- `npm run dogfood:perspective-manual-agent-brief-codex-review-loop`: PASS
- `npm run smoke:perspective-agent-brief-handoff-copy-refine`: PASS
- `npm run smoke:perspective-manual-agent-brief-codex-review-loop-eval`: PASS
- `npm run smoke:perspective-manual-agent-brief-handoff-dogfood`: PASS
- `npm run smoke:perspective-agent-brief-manual-ingress-context`: PASS
- `npm run smoke:perspective-agent-brief-read-surface`: PASS
- `npm run smoke:perspective-local-manual-ingress-admission-preview`: PASS
- `npm run smoke:perspective-ingress-admission-model`: PASS
- `npm run smoke:perspective-temporal-spatial-projection-builders`: PASS
- `npm run smoke:cockpit-perspective-workbench-temporal-underlay`: PASS
- `npm run smoke:perspective-ingest-constellation-preview`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- `git diff --cached --check`: PASS

## Skipped Checks

- Browser validation skipped because this is a builder/copy/report-only slice with no UI or route changes.
- `npm run lint` skipped because `package.json` does not define a `lint` script.
- `npm test` skipped because `package.json` does not define a `test` script.

## Blockers / Risks

No blockers.

Risk is limited to copy interpretation. The smoke checks cover the refined Codex workflow wording, raw-value exclusions, packet section order, route/UI non-exposure, and changed-file boundaries.

## Next Suggested Implementation PR

`Add reviewed manual Agent Brief packet template for Codex prompts`
