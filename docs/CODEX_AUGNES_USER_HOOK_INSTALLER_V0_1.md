# Codex Augnes User-Level Reuse Hook Installer v0.1

## Purpose

Codex Augnes User-Level Reuse Hook Installer v0.1 installs or removes an
opt-in user-level Codex `UserPromptSubmit` hook that prepares Augnes reuse
context before Augnes repo implementation tasks.

The installer is dry-run-first. It is designed to preserve existing user-level
Codex hook configuration and to make rollback explicit.

## Why User-Level Instead Of Project-Local

The project-local `.codex/hooks.json` path works as repo code and through
direct fixture validation, but trusted-session dogfood is blocked when the
active Codex Desktop agent/tool context cannot expose the interactive `/hooks`
trust UI or is not rooted at the Augnes project layer.

The user-level hook path uses `~/.codex/hooks.json`, which avoids
project-local `.codex` trust friction. It does not avoid the normal
non-managed hook trust requirement: the operator still must open `/hooks` in
an interactive Codex CLI/TUI session and trust the exact hook definition before
the hook runs.

real Codex hook loading/trust remains unverified by smoke. The smoke validates
only temp-home install/uninstall behavior plus direct fixture execution of the
copied hook script.

## Install

Dry-run is the default:

```bash
npm run codex:install-augnes-reuse-hook
```

The explicit `--dry-run` flag is also accepted:

```bash
npm run codex:install-augnes-reuse-hook -- --dry-run
```

Real user-level writes require `--yes`:

```bash
npm run codex:install-augnes-reuse-hook -- --yes
```

Use `--repo-root` when running the installer from outside the Augnes checkout:

```bash
npm run codex:install-augnes-reuse-hook -- --repo-root /Users/hynk/Documents/augnes
```

Use `--target-home` for smoke tests or manual dry-run rehearsal:

```bash
npm run codex:install-augnes-reuse-hook -- --target-home /tmp/augnes-hook-test-home
```

## Written Files

When `--yes` is provided, the installer writes only:

- `~/.codex/hooks.json`
- `~/.codex/augnes/augnes-reuse-intake-user-prompt-submit.mjs`
- `~/.codex/augnes/metadata.json`

If `~/.codex/hooks.json` already exists, the installer backs it up before the
real write. Unrelated hooks are preserved. The installer adds or updates only
one Augnes `UserPromptSubmit` hook entry.

The installed command points to the copied script under `~/.codex/augnes/...`.
That script resolves the active `cwd` to the Augnes repo root with
`git rev-parse --show-toplevel`, verifies Augnes repo markers including
`git remote -v`, and then runs:

```bash
npm run --silent perspective:memory-reuse-intake -- --task "<prompt>" --json
```

## Uninstall

Dry-run is the default:

```bash
npm run codex:uninstall-augnes-reuse-hook
```

Real user-level writes require `--yes`:

```bash
npm run codex:uninstall-augnes-reuse-hook -- --yes
```

The uninstaller removes only the Augnes hook entry and preserves unrelated
hooks. It removes the copied hook script and metadata only when the metadata
shows they were installed by this installer. It does not remove `~/.codex`
itself.

## Hook Behavior

The copied hook:

- reads Codex hook JSON from stdin
- handles only `UserPromptSubmit`
- fails open and exits `0`
- skips outside Augnes repos
- skips casual prompts and opt-out prompts
- skips prompts that already include `Codex Augnes Reuse Context`
- removes `OPENAI_API_KEY`, `GITHUB_TOKEN`, and `GH_TOKEN` from the child
  environment before running intake
- limits injected context size
- injects `additionalContext` with the task, generated Codex Memory Brief or
  no-match guidance, selected memory IDs, `why_selected`, `reuse_boundary`,
  `quality_review_preview_summary`, warnings, authority boundary, and closeout
  expectations

## Boundary

This installer adds dry-run-first user-level Codex hook install/uninstall
tooling, docs, report, and temp-home smoke coverage only.

It adds no runtime authority, DB schema changes, migrations, setup/prepare
polish, provider/model calls, OpenAI API calls, Codex SDK execution, MCP tool
calls, GitHub mutation from scripts, proof/evidence writes, perspective-memory
persistence writes, reuse packet persistence, return binding persistence,
quality review persistence, product boundary creation, automatic synthesis,
automatic memory creation, default/user DB writes during smoke, hidden
background daemons, or Augnes state commit/reject authority.

## Rollback

Run the uninstaller:

```bash
npm run codex:uninstall-augnes-reuse-hook -- --yes
```

Then open `/hooks` in an interactive Codex CLI/TUI session to confirm no stale
Augnes user-level hook remains trusted or enabled.
