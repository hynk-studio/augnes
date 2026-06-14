# Codex Augnes Skill v0.1 Report

## Summary

This slice adds `augnes-codex`, a lightweight repo-local Codex skill for
natural-language Augnes install/use onboarding. The skill routes phrases such
as `Codex야 Augnes 설치해줘`, `Codex야 Augnes 쓰자`,
`Augnes memory 보고 시작해`, and `Augnes reuse 켜줘` to the existing user-level
hook installer and Perspective Memory Reuse Intake fallback.

The implementation is instruction-only. It does not replace the installer or
hook work, and it does not add plugin packaging.

## Files Changed

- `.agents/skills/augnes-codex/SKILL.md`
- `docs/CODEX_AUGNES_SKILL_V0_1.md`
- `reports/2026-06-15-codex-augnes-skill-v0-1.md`
- `scripts/smoke-codex-augnes-skill-v0-1.mjs`
- `package.json`

## Trigger Phrases Covered

- `Augnes install`
- `Augnes setup`
- `Augnes use`
- `Augnes memory`
- `Augnes reuse`
- `Augnes context`
- `Augnes 설치`
- `Augnes 쓰자`
- `Augnes 기억`
- `Augnes 컨텍스트`
- `Augnes 보고 시작`
- `아그네스 설치`
- `아그네스 쓰자`
- `Codex야 Augnes 설치해줘`
- `Codex야 Augnes 쓰자`
- `Augnes memory 보고 시작해`
- `Augnes reuse 켜줘`

## Installer Dependency

This skill depends on PR #570 or equivalent user-level hook installer scripts
being present:

- `codex:install-augnes-reuse-hook`
- `codex:uninstall-augnes-reuse-hook`
- `perspective:memory-reuse-intake`

`gh pr view 570 --json number,state,mergedAt,headRefName,title,url` reported
PR #570 merged on `2026-06-14T22:45:12Z` with title
`Add Codex Augnes user-level hook installer`.

## Verification

Executed verification:

- `npm run smoke:codex-augnes-skill-v0-1`: passed.
- `npm run smoke:codex-augnes-user-hook-installer`: passed.
- `npm run smoke:codex-augnes-reuse-hook`: passed.
- `npm run smoke:perspective-memory-reuse-intake`: passed.

## Skipped Checks

- Real `/hooks` trust/loading check skipped: no interactive Codex `/hooks`
  trust surface is available to this smoke.
- Real `~/.codex` write check skipped: smoke must not mutate the user's real
  home directory.
- Browser/computer-use skipped: this is a skill/docs/report/smoke/package
  slice with no browser-visible UI.
- Runtime-backed `codex:read-brief` skipped: local runtime reported
  `CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE`.
- Proof-only closeout skipped: no `CODEX_WORK_ID` was provided for this slice.

## Remaining Caveats

- `/hooks` review/trust remains necessary before a non-managed hook can
  actually run.
- Smoke tests can verify files, docs, scripts, package wiring, and temp-home
  installer behavior, but smoke does not prove real Codex hook loading or
  `/hooks` trust.
- Hook automation may be unavailable, disabled, or not trusted; manual
  fallback remains:

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```

## Authority Boundary

No runtime behavior, storage, persistence, provider/model calls, OpenAI
provider configuration, MCP tool calls or MCP config, Codex SDK execution,
GitHub mutation, automatic Augnes memory item creation, managed enterprise
hooks, large hook filter rewrites, plugin packaging, proof/evidence writes, or
Augnes state commit/reject authority are added.

## Next Recommended PR

Augnes Codex Plugin v0.1.
