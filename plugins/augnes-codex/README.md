# Augnes Codex Plugin

This repo-local plugin packages the Augnes Codex Skill v0.1 so Codex can route
natural-language Augnes setup and memory-reuse prompts to the existing Augnes
workflow guidance.

## Starter Prompts

- `Codex야 Augnes 설치해줘`
- `Codex야 Augnes 쓰자`
- `Augnes memory 보고 시작해`
- `Augnes reuse 켜줘`
- `Augnes context 붙여서 작업해줘`
- `아그네스 설치`
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
