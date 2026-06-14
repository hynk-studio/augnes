# Codex Augnes Skill v0.1

## Purpose

Codex Augnes Skill v0.1 gives users a natural-language entrypoint for Augnes
setup and use in Codex. It maps prompts like `Codex야 Augnes 설치해줘`,
`Codex야 Augnes 쓰자`, `Augnes memory 보고 시작해`, and `Augnes reuse 켜줘`
to the existing Augnes Codex hook installer and Perspective Memory Reuse Intake
workflow.

## User-Facing Entry Point

Skill / Plugin should be the first thing the user feels.

- Skill: the v0.1 entrypoint in `.agents/skills/augnes-codex/SKILL.md`.
- Plugin: the likely future packaging layer for easier distribution and
  discovery.
- Hook / Installer: the hidden implementation layer for optional automated
  task-start reuse context.
- Perspective Memory Reuse Intake: the memory brief engine that builds the
  Codex Memory Brief.

The skill does not replace the hook installer. It tells Codex how to use the
installer safely, how to fall back to manual intake, and how to report trust
and setup caveats honestly.

## Why Skill Only In This PR

This first slice adds only a repo-local skill because the existing repository
already supports `.agents/skills` and the user-facing problem is discovery and
instruction routing. Plugin packaging is deliberately deferred so this PR does
not mix user-facing onboarding with distribution packaging, managed hook
questions, or broader plugin metadata.

No plugin packaging is added in this PR.

## Install Flow

For prompts such as `Codex야 Augnes 설치해줘`, `Augnes reuse 켜줘`, or
`아그네스 설치해줘`, Codex should first confirm that the current checkout is
Augnes or contains the Augnes installer scripts.

Then check `package.json` for:

- `codex:install-augnes-reuse-hook`
- `codex:uninstall-augnes-reuse-hook`

Dry-run is first:

```bash
npm run codex:install-augnes-reuse-hook -- --dry-run
```

Codex should summarize what the dry-run would change before asking for
approval. Real user-level writes require explicit approval plus `--yes`:

```bash
npm run codex:install-augnes-reuse-hook -- --yes
```

If the installer exists, rollback is available through:

```bash
npm run codex:uninstall-augnes-reuse-hook -- --yes
```

## Trust Caveat

The installer can place the user-level hook files, but `/hooks` review/trust
remains necessary before a non-managed hook can actually run. The skill must
not claim that `/hooks` trust is automated.

Smoke tests can verify files, docs, scripts, package wiring, and temp-home
installer behavior. Smoke tests do not prove real Codex hook loading or
`/hooks` trust.

## Use And Fallback Flow

For prompts such as `Codex야 Augnes 쓰자`, `Augnes memory 보고 시작해`, or
`Augnes context 붙여서 작업해줘`, Codex should diagnose whether hook automation
appears available and warn that `/hooks` trust may still be required.

If hook automation is unavailable, missing, disabled, or not trusted, Codex
should run Perspective Memory Reuse Intake manually:

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```

The resulting Codex Memory Brief is task-start context. It is not permission to
mutate unrelated systems.

When available, Codex should preserve selected memory IDs, `why_selected`,
`reuse_boundary`, and `quality_review_preview_summary`.

## Non-Goals

This slice does not add:

- plugin packaging
- managed hook behavior
- real `~/.codex` writes in smoke
- any claim that `/hooks` trust is automated
- automatic memory item creation
- provider/model calls
- OpenAI provider configuration
- MCP tool calls or MCP config
- Codex SDK execution
- GitHub mutation
- storage or persistence work
- runtime behavior changes
- large hook filter rewrites

## Closeout Expectations

Augnes-assisted work using this skill should report:

- changed files
- verification commands run
- skipped checks and why
- remaining friction or trust/setup caveats
- whether memory reuse intake was used
- whether hook automation was actually used or only documented/fallbacked
