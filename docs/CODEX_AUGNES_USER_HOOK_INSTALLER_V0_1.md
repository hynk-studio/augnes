# Codex Augnes user-level explicit-reuse hook migration

## Role

The user-level installer is an optional, dry-run-first path for operators who
explicitly want hook-assisted Augnes memory/reuse prompts. It is not the normal
repository workflow, and the repository itself registers no
`UserPromptSubmit` hook.

The installed hook activates only for explicit memory/reuse intent. Generic
source-first work does not activate it.

## Install or update

Dry-run shows the exact target files and whether an older recognized Augnes
entry will be added, updated, or left unchanged:

```bash
npm run codex:install-augnes-reuse-hook -- --dry-run
```

A real user-level write requires exact authorization:

```bash
npm run codex:install-augnes-reuse-hook -- --yes
```

Re-running the installer is the migration path for a previously installed broad
Augnes reuse hook. It backs up `~/.codex/hooks.json`, preserves unrelated
hooks, replaces only the recognized Augnes entry, and writes:

- `~/.codex/augnes/augnes-reuse-intake-user-prompt-submit.mjs`
- `~/.codex/augnes/metadata.json`

The source checkout must be the current `hynk-studio/augnes` repository.

## Uninstall

Dry-run:

```bash
npm run codex:uninstall-augnes-reuse-hook
```

Authorized removal:

```bash
npm run codex:uninstall-augnes-reuse-hook -- --yes
```

The uninstaller removes only recognized Augnes hook entries. It removes the
copied script and metadata only when matching installer metadata proves their
ownership. Unrelated hooks and `~/.codex` remain.

After install, update, or uninstall, the operator must review the effective
configuration through Codex `/hooks`. Static tests do not prove hook trust or
live loading.

## Explicit no-hook alternative

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```

## Verification

`npm run test:codex-user-hook-migration` uses a temporary home to prove
dry-run behavior, older-entry update, explicit-only matching, unrelated-hook
preservation, installer-owned file removal, and no real user-home mutation.
