# Augnes Codex Plugin

This plugin packages one user-facing skill for explicit Augnes continuity,
setup, and memory-reuse requests.

Shared Web work opens in an authenticated browser on any supported device.
First-time local Operator setup requires an Augnes source checkout. Follow
[public setup and first continuation](../../docs/CODEX_MCP_AUGNES_BRIDGE_USAGE_V0_1.md#public-setup-and-first-continuation).
The guide and npm setup commands are not bundled in an installed plugin copy;
obtain the matching source from the [Augnes repository](https://github.com/hynk-studio/augnes).
The routing package provides Codex guidance. Local Operator and Companion
installation are separate steps for registered local work.

## Current routes

- Open shared Web work through its Web entry and current grant. A recipient
  finds the task in **Shared with you**. A returning owner reads the report in
  work history. Both paths work with the local Companion stopped.
- Resume a registered local project through the reviewed `augnes-operator`
  Companion. Use the application checkout for service status and the intended
  project's root for Resume. An explicit local Resume can start one matching
  already-installed service when its lifecycle status permits it.
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
