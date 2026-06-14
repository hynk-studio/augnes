# Codex Augnes Reuse Hook v0.1 Report

## Summary

Added Codex Augnes Reuse Hook v0.1: repository guidance plus a project-local `UserPromptSubmit` hook that runs existing Augnes Perspective Memory Reuse Intake at task start and injects the resulting context through `additionalContext`.

The implementation is a deterministic read-only wrapper around the existing intake command. It does not add storage or persistence.

## Files changed

- `AGENTS.md`
- `.codex/hooks.json`
- `.codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs`
- `scripts/smoke-codex-augnes-reuse-hook.mjs`
- `docs/CODEX_AUGNES_REUSE_HOOK_V0_1.md`
- `reports/2026-06-14-codex-augnes-reuse-hook.md`
- `package.json`

## User-facing goal

An operator can start Codex in the Augnes repo and give a normal development task prompt. After hook trust review, Codex should automatically receive Augnes reuse context before coding without the operator remembering to run:

```bash
npm run perspective:memory-reuse-intake -- --task "..." --brief
```

## Hook behavior

The project-local hook reads stdin JSON for `UserPromptSubmit`, takes `input.prompt` as the task string, confirms the current working directory appears to be the Augnes repo, and runs:

```bash
npm run --silent perspective:memory-reuse-intake -- --task "<prompt>" --json
```

It injects `Codex Augnes Reuse Context` through `hookSpecificOutput.additionalContext`, including task text, generated Codex Memory Brief, selected memory IDs, `why_selected`, `reuse_boundary`, `quality_review_preview_summary`, warnings, no-match guidance, authority boundary, boundary reminders, and closeout expectations.

Filtering happens inside the script because `UserPromptSubmit` matcher behavior is not used for this hook. The hook skips empty prompts, non-Augnes cwd, missing intake command, casual/non-development prompts, explicit opt-out phrases, and prompts that already contain a reuse brief marker.

## AGENTS.md behavior

`AGENTS.md` now tells Codex to use Perspective Memory Reuse Intake before implementing Augnes code/docs/scripts, use the resulting Codex Memory Brief as task-start context, preserve `why_selected` and `reuse_boundary`, treat quality review warnings as operator-review signals, keep the storage/provider/runtime/GitHub/Codex SDK boundaries closed unless explicitly scoped, and report changed files, verification, skipped checks, and remaining friction.

## Trust/review note

Project-local hooks require Codex hook trust review before they run. Operators may need to use `/hooks` to inspect and trust `.codex/hooks.json` and the hook script. Hooks may also be disabled by config.

## Failure behavior

The hook is fail-open. It exits 0 for malformed input, skipped prompts, intake failure, timeouts, and invalid intake output. It never blocks the prompt. When intake fails in an Augnes development task, it may inject a concise warning so Codex can report that task-start reuse was unavailable.

## Boundary

No storage or persistence is added. This PR only adds project-local Codex guidance and a deterministic read-only `UserPromptSubmit` hook around existing Augnes reuse intake.

It does not add runtime authority, DB schema changes, migrations, setup/prepare polish, provider/model calls, OpenAI API calls, Codex SDK execution, MCP tool calls, GitHub mutation from scripts, proof/evidence writes, perspective-memory persistence writes, reuse packet persistence, return binding persistence, quality review persistence, product boundary creation, automatic synthesis, automatic memory creation, default/user DB writes, hidden background daemons, or Augnes state commit/reject authority.

## Verification

Passed verification:

- `npm run smoke:codex-augnes-reuse-hook`
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

## Skipped checks with concrete reasons

No requested verification checks were skipped. Browser/runtime validation was not run because there is no browser-visible route, UI surface, runtime startup path, or clipboard flow change.

## Next recommended PR

Dogfood the hook in a real Codex session after trusting the project-local hook. Only tune hook filters, copy, or compaction if dogfood shows concrete friction. Do not recommend storage/persistence without a concrete product reason.
