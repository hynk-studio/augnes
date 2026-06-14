# Augnes Codex Plugin

This repo-local plugin packages the Augnes Codex Skill v0.1 so Codex can route
natural-language Augnes setup and memory-reuse prompts to the existing Augnes
workflow guidance.

Example prompts:

- `Codex야 Augnes 설치해줘`
- `Codex야 Augnes 쓰자`
- `Augnes memory 보고 시작해`
- `Augnes reuse 켜줘`
- `아그네스 설치`
- `아그네스 쓰자`

The plugin does not install hooks by itself. It documents the existing
dry-run-first user-level hook installer:

```bash
npm run codex:install-augnes-reuse-hook -- --dry-run
```

Real installer writes still require explicit approval plus `--yes`, and
`/hooks` review/trust remains manual before a non-managed hook can actually
run. Installing or enabling this plugin does not prove real hook loading or
trust.

If hook automation is unavailable, use the manual fallback:

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```
