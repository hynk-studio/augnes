# Augnes Codex Plugin

This plugin packages one user-facing skill for explicit Augnes continuity,
setup, and memory-reuse requests.

## Current routes

- Resume, continue, recovery, and current-state requests delegate to the
  reviewed `augnes-operator` Companion lifecycle and repository-continuity
  owner.
- An already-running packaged runtime may be read explicitly with
  `npm run codex:current-continuity`.
- Explicit memory/reuse requests use:

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```

Ordinary implementation, audit, review, investigation, script, or Codex prompts
do not imply continuity or Perspective-memory reuse.

## Optional user-level hook

The repository does not register a project-default `UserPromptSubmit` memory
hook. An operator may explicitly install the user-level hook after a dry run:

```bash
npm run codex:install-augnes-reuse-hook -- --dry-run
npm run codex:install-augnes-reuse-hook -- --yes
```

The installed hook handles only explicit memory/reuse intent. Reinstall updates
an older Augnes entry and copied script. Rollback remains:

```bash
npm run codex:uninstall-augnes-reuse-hook -- --yes
```

Installation never proves hook trust; `/hooks` review remains manual. The
plugin itself does not install hooks, start runtime, write user configuration,
call a provider, or create authority.
