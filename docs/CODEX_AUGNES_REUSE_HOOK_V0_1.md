# Codex Augnes explicit reuse hook

## Current status

Augnes no longer registers a project-default `UserPromptSubmit` memory hook.
Ordinary implementation, audit, review, investigation, script, and Codex
prompts therefore receive no hidden Perspective-memory context from
`.codex/hooks.json`.

The retained hook source exists only for the explicitly installed user-level
reuse option and its migration path. It activates only when the prompt begins
with explicit memory/reuse intent such as:

- `Use Augnes memory for this task`
- `Start with Augnes context`
- `Review this PR with Augnes context`
- `Augnes memory 보고 시작해`

Generic development words such as `fix`, `review`, `script`, `codex`,
`audit`, or `docs` do not activate it.

## Preferred explicit path

A user can request bounded reuse without installing a hook:

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```

The result is optional context. It is not source truth, product/Core state,
approval, execution authority, or permission to widen the task. No-match and
warning states remain visible.

## Optional user-level path

Operators who explicitly want hook-assisted reuse prompts can use the
dry-run-first installer:

```bash
npm run codex:install-augnes-reuse-hook -- --dry-run
npm run codex:install-augnes-reuse-hook -- --yes
```

Reinstalling replaces the recognized older Augnes entry and copied script with
the explicit-intent version while preserving unrelated hooks. Rollback remains:

```bash
npm run codex:uninstall-augnes-reuse-hook -- --yes
```

Hook trust review remains manual. The repository does not infer trust from
installation or static tests.

## Boundaries and verification

The intake and hook add no provider/model call, persistence, automatic memory
creation, MCP call, GitHub mutation, proof/evidence write, runtime start, or
Augnes state authority.

Focused owners:

```bash
npm run test:codex-user-hook-migration
npm run test:augnes-operator-plugin-setup
```
