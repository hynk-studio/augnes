# Codex Augnes English Triggers And Liftable Constraints

## Summary

This slice expands the Augnes Codex Skill and Plugin documentation so ordinary
English requests such as `Use Augnes for this task`,
`Start with Augnes memory`, and `Review this PR with Augnes context` route into
the Augnes Codex usage flow. It also documents the startup disclosure model:
Codex should distinguish user-liftable Augnes defaults from non-liftable
Codex/platform constraints before proceeding with the user's chosen scope.

This is an instruction, documentation, plugin metadata, report, and static
smoke slice only. It adds no runtime behavior, plugin-bundled hooks, managed
hooks, MCP, provider/model/OpenAI config behavior, storage or persistence
behavior, Codex SDK usage, GitHub mutation behavior, automatic memory item
creation behavior, real installer commands, real `~/.codex` writes, or
interactive `/hooks` trust.

## Files Changed

- `.agents/skills/augnes-codex/SKILL.md`
- `plugins/augnes-codex/skills/augnes-codex/SKILL.md`
- `plugins/augnes-codex/.codex-plugin/plugin.json`
- `plugins/augnes-codex/README.md`
- `docs/CODEX_AUGNES_SKILL_V0_1.md`
- `docs/CODEX_AUGNES_PLUGIN_V0_1.md`
- `docs/CODEX_AUGNES_PLUGIN_VALIDATION.md`
- `docs/CODEX_AUGNES_PLUGIN_MANUAL_VALIDATION.md`
- `reports/2026-06-15-codex-augnes-english-triggers-liftable-constraints.md`
- `scripts/smoke-codex-augnes-english-triggers-liftable-constraints.mjs`
- `package.json`

## English Trigger Coverage

The source and packaged skills now include these English general-request
triggers:

- `Use Augnes`
- `Set up Augnes`
- `Install Augnes`
- `Enable Augnes reuse`
- `Start with Augnes memory`
- `Start from Augnes memories`
- `Use Augnes memory`
- `Use Augnes context`
- `Review this PR with Augnes context`
- `Work with Augnes memory`
- `Start this task with Augnes`

The plugin manifest starter prompts now include:

- `Use Augnes for this task`
- `Set up Augnes in Codex`
- `Start with Augnes memory`
- `Review this PR with Augnes context`
- `Enable Augnes reuse`
- `Use Augnes context before editing`

Existing Korean prompts remain covered.

## Constraint Disclosure Model

At Augnes use start, Codex should first disclose the intentionally conservative
defaults in compact language, then identify which ones are user-liftable by
explicit scope, then proceed according to that scope. Once the mode is
established, Codex should not repeatedly nag unless a new risky action is
requested.

Default constraints are intentionally conservative Augnes defaults.

Lifted defaults are not Codex policy bypasses. They remain scoped Augnes
workflow decisions under normal Codex command approvals and safety behavior,
and they require explicit user scope.

## User-Liftable Constraints

User-liftable Augnes default constraints are:

- dry-run-first installer behavior
- real install requires explicit `--yes` or equivalent user authorization
- no real `~/.codex` write unless explicitly authorized
- real ~/.codex write remains blocked unless explicitly authorized
- memory brief is read-only/context-only by default
- no automatic memory item creation by default
- no storage/persistence/provider/model/OpenAI config/MCP/Codex SDK/GitHub
  mutation unless explicitly scoped
- no plugin-bundled hook implementation by default

For real hook install, Codex may run:

```bash
npm run codex:install-augnes-reuse-hook -- --yes
```

only when the user explicitly asks for real install, asks to skip dry-run, or
allows real `~/.codex` writes.

Storage/persistence/provider/model/OpenAI config/MCP/Codex SDK/GitHub mutation
work may be included only as an explicitly scoped implementation PR, not as
hidden setup. Automatic memory item creation may use existing repo-supported
commands if present; otherwise Codex should propose or implement a scoped PR.

## Non-Liftable Codex/Platform Constraints

Non-liftable constraints remain:

- `/hooks review/trust remains manual`
- plugin install does not prove hook trust
- plugin install does not prove real hook loading
- static smoke cannot prove real hook loading or trust
- Codex command approvals and safety behavior remain in force
- plugin-bundled hooks, if added later, would still be non-managed hooks that
  require review/trust
- Augnes normal UX must not use `--dangerously-bypass-hook-trust`
- Augnes normal UX must not use --dangerously-bypass-hook-trust as normal UX

## Verification

Expected verification for this PR:

- `npm run smoke:codex-augnes-english-triggers-liftable-constraints`: passed.
- `npm run smoke:codex-augnes-plugin-manual-validation`: passed.
- `npm run smoke:codex-augnes-plugin-v0-1`: passed.
- `npm run smoke:codex-augnes-skill-v0-1`: passed.
- `git diff --check`: passed.
- `npm run smoke:codex-augnes-user-hook-installer`: passed.
- `npm run smoke:codex-augnes-reuse-hook`: passed.

## Skipped Checks

- Real installer commands: skipped because this PR must not run real installer
  commands.
- Real `~/.codex` writes: skipped because this PR must not mutate the user's
  real Codex home.
- Interactive `/hooks` trust: skipped because this PR must not attempt
  interactive trust and static smoke cannot prove trust.
- `--dangerously-bypass-hook-trust`: skipped because normal Augnes UX must not
  use it.
- Manual Codex app validation: skipped because this PR adds static validation
  and documentation; actual app validation requires interactive Codex restart
  and prompt testing.
- Runtime-backed `codex:read-brief`: skipped if local runtime is unavailable.
- Proof-only closeout: skipped if local runtime is unavailable or
  `CODEX_WORK_ID` is missing.

## Remaining Caveats

- Static smoke cannot prove real hook loading or trust.
- Codex app/plugin surfaces may expose starter prompts and metadata
  differently by build.
- English trigger routing still needs actual manual Codex app validation.
- Constraint disclosure and unlock behavior still need actual manual transcript
  capture before hook packaging work is considered.

## Next Recommended PR

Run actual manual Codex app validation for Korean and English Augnes prompts,
then fix concrete friction found in routing/disclosure/unlock behavior.

## Authority Boundary

No runtime behavior, route changes, schema changes, MCP/App tool schema
changes, plugin-bundled hooks, managed hooks, provider/model/OpenAI config
behavior, storage or persistence behavior, Codex SDK usage, GitHub mutation
behavior, automatic memory item creation behavior, real installer commands,
real `~/.codex` writes, proof/evidence writes, secret-handling changes, or
Augnes state commit/reject authority were added.
