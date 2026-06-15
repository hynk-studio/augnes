# Codex Augnes Skill v0.1

## Purpose

Codex Augnes Skill v0.1 gives users a natural-language entrypoint for Augnes
setup and use in Codex. It maps prompts like `Use Augnes for this task`,
`Start with Augnes memory`, `Review this PR with Augnes context`,
`Codex야 Augnes 설치해줘`, `Codex야 Augnes 쓰자`,
`Augnes memory 보고 시작해`, and `Augnes reuse 켜줘` to the existing Augnes
Codex hook installer and Perspective Memory Reuse Intake workflow.

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

## English General-Request Triggers

The Skill should also trigger for ordinary English Augnes requests, not only
Korean or implementation-specific prompts:

- `Use Augnes`
- `Use Augnes for this task`
- `Set up Augnes`
- `Set up Augnes in Codex`
- `Install Augnes`
- `Enable Augnes reuse`
- `Start with Augnes memory`
- `Start from Augnes memories`
- `Use Augnes memory`
- `Use Augnes context`
- `Use Augnes context before editing`
- `Review this PR with Augnes context`
- `Work with Augnes memory`
- `Start this task with Augnes`

Existing Korean prompts remain supported:

- `Codex야 Augnes 설치해줘`
- `Codex야 Augnes 쓰자`
- `Augnes memory 보고 시작해`
- `Augnes reuse 켜줘`
- `Augnes context 붙여서 작업해줘`
- `아그네스 설치해줘`
- `아그네스 쓰자`

## Default Constraints And User-Liftable Limits

At Augnes use start, Codex should briefly disclose two categories.

User-liftable Augnes default constraints:

- dry-run-first installer behavior
- real install requires explicit `--yes` or equivalent authorization
- no real `~/.codex` write unless explicitly authorized
- real ~/.codex write remains blocked unless explicitly authorized
- memory brief is read-only/context-only by default
- no automatic memory item creation by default
- no storage/persistence/provider/model/OpenAI config/MCP/Codex SDK/GitHub
  mutation unless explicitly scoped
- no plugin-bundled hook implementation by default

Non-liftable Codex/platform constraints:

- `/hooks review/trust remains manual`
- plugin install does not prove hook trust
- plugin install does not prove real hook loading
- static smoke cannot prove real hook loading or trust
- Codex command approvals and safety behavior remain in force

Codex may lift user-liftable defaults only within explicit user scope. For real
hook install, Codex may run:

```bash
npm run codex:install-augnes-reuse-hook -- --yes
```

only when the user explicitly asks for real install, asks to skip dry-run, or
allows real `~/.codex` writes. Storage/persistence/provider/model/OpenAI
config/MCP/Codex SDK/GitHub mutation work belongs in an explicitly scoped PR,
not hidden setup. Automatic memory item creation may use existing
repo-supported commands if present; otherwise Codex should propose or implement
a scoped PR for that feature.

Codex must not present lifted Augnes defaults as Codex policy bypasses, must
not claim it can remove `/hooks` trust, and must not use
`--dangerously-bypass-hook-trust` as normal UX.
Codex must not use --dangerously-bypass-hook-trust as normal UX.

User-facing wording should be compact: disclose defaults, state which defaults
can be lifted by explicit scope, then proceed according to the user's chosen
scope. Do not repeatedly nag once the mode is established unless a new risky
action is requested.

## Why Skill Only In This PR

Historical note: this first slice adds only a repo-local skill because the existing repository
already supports `.agents/skills` and the user-facing problem is discovery and
instruction routing. Plugin packaging is deliberately deferred so this PR does
not mix user-facing onboarding with distribution packaging, managed hook
questions, or broader plugin metadata.

No plugin packaging is added in this PR.

## Install Flow

For prompts such as `Set up Augnes`, `Install Augnes`,
`Codex야 Augnes 설치해줘`, `Augnes reuse 켜줘`, or `아그네스 설치해줘`,
Codex should first confirm that the current checkout is Augnes or contains the
Augnes installer scripts.

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

For prompts such as `Use Augnes for this task`, `Start with Augnes memory`,
`Start from Augnes memories`, `Use Augnes context`,
`Review this PR with Augnes context`, `Codex야 Augnes 쓰자`,
`Augnes memory 보고 시작해`, or `Augnes context 붙여서 작업해줘`, Codex should
diagnose whether hook automation appears available and warn that `/hooks` trust
may still be required.

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
- any claim that plugin install proves real hook loading or trust
- normal use of `--dangerously-bypass-hook-trust`
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
