# Codex Augnes Plugin v0.1

## Purpose

Codex Augnes Plugin v0.1 is the lightweight distribution/onboarding wrapper for
the Augnes Codex Skill v0.1. The skill remains the workflow authoring unit. The
plugin is the installable/distribution unit that packages the skill for local
Codex discovery and testing.

## Skill And Plugin Roles

The Skill is the workflow authoring unit. It tells Codex how to respond to
natural-language prompts such as `Codex야 Augnes 설치해줘`,
`Codex야 Augnes 쓰자`, `Augnes memory 보고 시작해`, and `Augnes reuse 켜줘`.

The Plugin is the installable/distribution unit. This plugin packages the
Augnes Codex Skill v0.1 at:

```text
plugins/augnes-codex/skills/augnes-codex/SKILL.md
```

## Hook Installer Relationship

The hook installer remains an implementation detail, not the user-facing UX. The
existing user-level installer remains the recommended hook setup path for now:

```bash
npm run codex:install-augnes-reuse-hook -- --dry-run
```

Installer flow stays dry-run first. Real user-level writes require explicit
approval plus `--yes`:

```bash
npm run codex:install-augnes-reuse-hook -- --yes
```

Rollback remains available when the installer exists:

```bash
npm run codex:uninstall-augnes-reuse-hook -- --yes
```

## Trust Caveat

`/hooks` review/trust remains manual and required for non-managed hooks.
Installing or enabling the plugin does not automatically prove hook trust or
real hook loading.

Smoke tests verify plugin files, manifest linkage, skill packaging, docs, and
marketplace metadata only. Smoke tests do not prove real hook loading or trust.

## Fallback

If hook automation is unavailable, missing, disabled, or not trusted, use
Perspective Memory Reuse Intake manually:

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```

The resulting Codex Memory Brief is task-start context. It is not permission to
mutate unrelated systems.

## Marketplace

The repo-local marketplace entry in `.agents/plugins/marketplace.json` exposes
`augnes-codex` for local testing and discovery. It points to:

```text
./plugins/augnes-codex
```

This does not publish the plugin publicly.

## Non-Goals

This slice does not add:

- no managed hook behavior
- no plugin-bundled runtime hook behavior
- no MCP server configuration
- no provider/model calls
- no OpenAI provider configuration
- no storage/persistence
- no Codex SDK execution
- no GitHub mutation behavior
- no automatic Augnes memory item creation
- no real `~/.codex` writes in smoke
- no claim that `/hooks` trust is automated
- no claim that smoke proves real hook loading or trust

## Boundary

This plugin packages an instruction-only skill. It does not add runtime
behavior, new hook plumbing, managed hooks, MCP servers, provider/model calls,
OpenAI config, storage, persistence, Codex SDK usage, GitHub mutation behavior,
proof/evidence writes, automatic memory item creation, or Augnes state
commit/reject authority.
