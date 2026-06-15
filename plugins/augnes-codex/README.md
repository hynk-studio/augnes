# Augnes Codex Plugin

This repo-local plugin packages the Augnes Codex Skill v0.1 so Codex can route
natural-language Augnes setup and memory-reuse prompts to the existing Augnes
workflow guidance.

## Starter Prompts

- `Use Augnes for this task`
- `Set up Augnes in Codex`
- `Start with Augnes memory`
- `Review this PR with Augnes context`
- `Enable Augnes reuse`
- `Use Augnes context before editing`
- `Codex야 Augnes 설치해줘`
- `Codex야 Augnes 쓰자`
- `Augnes memory 보고 시작해`
- `Augnes reuse 켜줘`
- `Augnes context 붙여서 작업해줘`
- `아그네스 설치해줘`
- `아그네스 쓰자`

## What The Plugin Does

The plugin packages the skill. The skill guides Codex through Augnes
install/use/diagnose prompts, including installer dry-runs, explicit install
approval, `/hooks` review/trust caveats, and Perspective Memory Reuse Intake
fallback.

The existing user-level hook installer remains the setup mechanism. Dry-run
should happen first:

```bash
npm run codex:install-augnes-reuse-hook -- --dry-run
```

Real install requires explicit approval plus `--yes`:

```bash
npm run codex:install-augnes-reuse-hook -- --yes
```

## Default Constraints

Default constraints are intentionally conservative Augnes defaults.

Augnes Codex starts conservatively by default:

- installer guidance stays dry-run first
- real install requires explicit `--yes` or equivalent user authorization
- no real `~/.codex` write happens unless explicitly authorized
- memory reuse runs as a read-only/context-only brief by default
- no automatic memory item creation happens by default
- no storage/persistence/provider/model/OpenAI config/MCP/Codex SDK/GitHub
  mutation work happens unless explicitly scoped
- no plugin-bundled hook implementation is included by default

## User-Liftable Constraints

The user can explicitly lift Augnes defaults for a scoped task. Examples:

- The user can explicitly authorize real install with `--yes`.
- explicitly allow real `~/.codex` write for hook install
- real ~/.codex write remains blocked unless explicitly authorized
- include storage/persistence changes in a PR
- include provider/model/OpenAI config changes in a PR
- include MCP/Codex SDK integration in a PR
- include GitHub mutation behavior in an explicitly scoped PR
- explicitly scope storage/persistence/provider/model/OpenAI config/MCP/Codex
  SDK/GitHub mutation work into a PR
- create or update Augnes memory items when an existing repo-supported command
  exists, or ask Codex to propose or implement that capability in a scoped PR

Lifted defaults are not Codex policy bypasses. Codex must keep the work scoped
to the user's explicit request.

## Non-Liftable Codex Constraints

Augnes cannot automate away Codex/platform constraints:

- `/hooks` review/trust cannot be automated away by Augnes
- Plugin install does not prove real hook loading or trust
- plugin install does not prove real hook loading or trust
- static smoke does not prove real hook loading or trust
- Codex command approvals and platform safety behavior remain in force
- plugin-bundled hooks, if added later, would still be non-managed hooks that
  require review/trust
- normal Augnes UX must not use `--dangerously-bypass-hook-trust`

## What It Does Not Do

The plugin does not install hooks by itself, automate `/hooks` review/trust,
prove real hook loading, mutate `~/.codex`, inject Augnes memory automatically,
or add MCP, provider/model, storage, persistence, Codex SDK, GitHub mutation,
or automatic Augnes memory item creation behavior.

## Validation Notes

`/hooks` review/trust remains manual before a non-managed hook can actually run.
Static smoke does not prove real hook loading or trust.

If hook automation is unavailable, use the manual fallback:

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```
