# Augnes Codex Plugin

This plugin packages one user-facing skill for explicit Augnes continuity,
setup, and memory-reuse requests.

First-time setup requires an Augnes source checkout. In that checkout, follow
[public setup and first continuation](../../docs/CODEX_MCP_AUGNES_BRIDGE_USAGE_V0_1.md#public-setup-and-first-continuation).
The guide and npm setup commands are not bundled in an installed plugin copy;
obtain the matching source from the [Augnes repository](https://github.com/hynk-studio/augnes).
Version 0.2.1 distinguishes the Augnes application/service checkout from the
intended project's registered root. This routing package alone installs neither
the Operator nor the Companion; the public workflow-cost calculator is separate.

## Current routes

- Resume, continue, recovery, and current-state requests delegate to the
  reviewed `augnes-operator` Companion lifecycle and repository-continuity
  owner.
- An already-running packaged runtime may be read explicitly with
  `npm run codex:current-continuity` from the application checkout. This reads
  the current project selection, not a supplied project root. It defaults to
  `http://localhost:3000`; set `AUGNES_API_BASE_URL` to another verified local
  runtime address when needed.
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
