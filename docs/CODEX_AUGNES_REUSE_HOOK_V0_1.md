# Codex Augnes Reuse Hook v0.1

Codex Augnes Reuse Hook v0.1 makes Augnes Perspective Memory Reuse Intake the default task-start behavior for Codex work in this repository.

When an operator starts Codex in the Augnes repo and gives a normal development task, the project-local `UserPromptSubmit` hook reads that prompt before the task is sent onward. If the prompt looks like Augnes development work, the hook runs:

```bash
npm run perspective:memory-reuse-intake -- --task "..." --json
```

The hook then injects the generated Codex Memory Brief and quality warning summary through `hookSpecificOutput.additionalContext`. The `additionalContext` field is the developer-context payload Codex receives before implementation, without requiring the operator to manually run the intake command every time.

The hook resolves the Augnes repo root with `git rev-parse --show-toplevel` from the hook input cwd first. If git root detection is unavailable, it falls back to scanning ancestors for Augnes root markers. This lets Codex be started from a subdirectory or nested package inside the repo without silently skipping reuse intake.

## Relationship To Perspective Memory Reuse Intake

The hook is a thin project-local wrapper around the existing `perspective:memory-reuse-intake` CLI. The intake command remains the source of ranking, no-match guidance, selected memory IDs, `why_selected`, `reuse_boundary`, the Codex Memory Brief, and quality review preview summary.

The hook does not replace explicit operator review. Quality review warnings are operator-review signals, not semantic truth.

## Trust Review

Project-local hooks require Codex hook trust review before they run. An operator may need to use `/hooks` in Codex to inspect and trust `.codex/hooks.json` and `.codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs`.

Hooks may also be disabled by local Codex configuration. If hooks are disabled or not trusted, Codex can still run the intake manually:

```bash
npm run perspective:memory-reuse-intake -- --task "..." --brief
```

## Opt Out

The hook skips memory reuse when the prompt includes one of these phrases:

- `no augnes memory`
- `skip augnes reuse`
- `skip memory intake`
- `do not run reuse intake`

It also skips empty prompts, casual/non-development prompts, prompts outside the Augnes repo, prompts that already contain an Augnes reuse brief marker, and repos where `perspective:memory-reuse-intake` is unavailable.

## Failure And No-Match Behavior

The hook is fail-open. It never blocks the prompt. If intake fails, times out, or returns invalid JSON, Codex continues. When useful, the hook injects a concise warning so the worker can report that task-start memory reuse was unavailable.

No-match output can still be useful. When the intake finds no selected items but emits no-match guidance, the hook injects that guidance so Codex can continue with an honest explanation rather than pretending memory context existed.

## Boundary

No storage or persistence is added. The hook is read-only and does not mutate files, DB rows, memory items, reuse packets, quality reviews, proof/evidence records, or Augnes state.

The hook preserves this boundary:

- No provider/model calls
- No OpenAI API calls
- No MCP tool calls
- No Codex SDK execution
- No GitHub mutation
- No DB schema changes or migrations
- No runtime startup
- No hidden background daemons
- No automatic synthesis
- No automatic memory creation
- No return binding persistence
- No quality review persistence
- No Augnes state commit/reject authority

## Verification

Use:

```bash
npm run smoke:codex-augnes-reuse-hook
```

The smoke verifies project guidance, project-local hook config, hook filtering, fail-open behavior, max-context compaction markers, docs/report coverage, package wiring, and static boundaries against provider/model/API/MCP/Codex SDK/GitHub/storage/persistence behavior.
