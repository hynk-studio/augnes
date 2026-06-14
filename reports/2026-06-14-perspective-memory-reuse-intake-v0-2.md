# Perspective Memory Reuse Intake v0.2 Report

## Summary

Added a narrow deterministic v0.2 improvement to Perspective Memory Reuse
Intake. This is ranking/copy guidance only: the command remains local,
read-only, and deterministic.

The v0.2 polish addresses the three follow-up frictions from the PR #566
dogfood report:

- exact-task/entity match boost for intake-command memories
- clearer no-match copy for readable DB with no active matches and only inactive
  candidates
- actionable `compact_brief_recommended` guidance that tells Codex what to
  preserve and what to trim

No storage or persistence is added.

## Changed Files

- `lib/perspective-ingest/perspective-memory-reuse-intake.ts`
- `scripts/smoke-perspective-memory-reuse-intake.mjs`
- `docs/PERSPECTIVE_MEMORY_REUSE_INTAKE_V0_1.md`
- `reports/2026-06-14-perspective-memory-reuse-intake-v0-2.md`

`package.json` was not changed because the existing
`smoke:perspective-memory-reuse-intake` script now covers v0.2 behavior.

## Ranking

The intake now applies a deterministic exact-task/entity match boost when the
task directly names the intake command, such as `Perspective Memory Reuse
Intake`, `reuse intake`, or `intake command`.

When that condition is true, memory items whose title, summary, source refs, or
evidence refs strongly identify the intake command receive the boost and should
outrank broader compact-brief metadata items.

This remains mechanical string matching. It does not add model ranking,
embeddings, FTS, external search, provider/model calls, OpenAI API calls, MCP
tool calls, or Codex SDK execution.

## No-Match Copy

The structured output now includes `selection_guidance.no_match_state` and
`selection_guidance.no_match_message`.

The copy distinguishes:

- DB path missing / no store read performed
- store read succeeded but zero persisted perspective-memory items were
  available
- persisted items existed but no accepted/reviewing items matched the task
- only inactive candidates matched, meaning only
  inactive/deprecated/retracted/superseded items matched

The human and `--brief` output include the no-match state and message in the
Quality Review Warning Summary so Codex can tell whether it should seed or point
to a DB, broaden task terms, select a current item manually, or continue without
reuse.

## Compact Guidance

When `compact_brief_recommended` is true, human and `--brief` output now include
`compact_brief_guidance`:

- Preserve selected memory IDs.
- Preserve `why_selected`.
- Preserve `reuse_boundary`.
- Preserve Return Expectations.
- Preserve the authority boundary.
- Trim repeated summaries, long source refs, and repeated warnings first.

This keeps `--brief` paste-ready while giving Codex actionable guidance for
large selections.

## Boundary

This v0.2 change does not add:

- No provider/model calls
- No OpenAI API calls
- No MCP tool calls
- No Codex SDK execution
- No GitHub mutation
- No persistence writes
- No perspective-memory persistence writes
- No reuse packet persistence
- No return binding persistence
- No quality review persistence
- No DB schema
- No migrations
- No runtime authority
- No setup/prepare polish
- No product boundary creation
- No proof/evidence writes
- No automatic synthesis
- No automatic memory creation
- No memory item mutation
- No default/user DB writes
- No hidden background daemons
- No Augnes state commit/reject authority

## Verification

Passed verification for this PR:

- `npm run smoke:perspective-memory-reuse-intake`
- `npm run smoke:perspective-memory-reuse-intake-dogfood-report`
- `npm run smoke:perspective-memory-items`
- `npm run smoke:perspective-memory-items-search`
- `npm run smoke:perspective-memory-items-review-workspace`
- `npm run smoke:perspective-memory-items-reuse-packet`
- `npm run smoke:perspective-memory-reuse-quality-review`
- `npm run smoke:perspective-memory-reuse-quality-review-dogfood-report`
- `npm run smoke:perspective-memory-reuse-return-binding`
- `npm run smoke:perspective-memory-reuse-return-binding-dogfood-report`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-report`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-seed`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-harness-rerun-report`
- `npm run smoke:perspective-memory-reuse-quality-review-panel-dogfood-report`
- `npm run smoke:augnes-codex-bootstrap`
- `npm run smoke:augnes-codex-doctor`
- `npm run smoke:augnes-codex-prepare`
- `npm run smoke:augnes-operator-plugin-scaffold`
- `npm run smoke:augnes-operator-plugin-hooks`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

Skipped checks: browser/runtime validation is skipped because this PR changes
only local CLI/helper ranking and copy guidance; no browser-visible route or
runtime surface changed.

## Next Recommended PR

Dogfood v0.2 against a real next Codex task. Continue code tuning only if that
dogfood shows concrete friction. Do not recommend storage/persistence without a
concrete product reason.
