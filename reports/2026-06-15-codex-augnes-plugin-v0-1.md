# Codex Augnes Plugin v0.1 Report

## Summary

This slice adds `augnes-codex`, a lightweight repo-local Codex plugin that
packages the Augnes Codex Skill v0.1 for natural-language install/use
onboarding. It keeps the existing user-level hook installer and `/hooks` trust
flow explicit.

## Files Changed

- `plugins/augnes-codex/.codex-plugin/plugin.json`
- `plugins/augnes-codex/skills/augnes-codex/SKILL.md`
- `plugins/augnes-codex/README.md`
- `.agents/plugins/marketplace.json`
- `docs/CODEX_AUGNES_PLUGIN_V0_1.md`
- `reports/2026-06-15-codex-augnes-plugin-v0-1.md`
- `scripts/smoke-codex-augnes-plugin-v0-1.mjs`
- `package.json`

## Why Plugin Follows Skill v0.1

The skill is the workflow authoring unit and already defines trigger phrases,
dry-run-first installer behavior, `/hooks` trust caveats, fallback memory
reuse intake, boundaries, and closeout expectations. The plugin is only the
installable/distribution wrapper around that skill.

## Repo Convention Used

The repository already uses:

- plugin root under `plugins/<plugin-name>`
- manifest at `plugins/<plugin-name>/.codex-plugin/plugin.json`
- packaged skills under `plugins/<plugin-name>/skills/<skill-name>/SKILL.md`
- repo-local marketplace at `.agents/plugins/marketplace.json`

This PR follows that observed convention and keeps only `plugin.json` inside
`.codex-plugin`.

## Marketplace Behavior

The existing `.agents/plugins/marketplace.json` root is preserved as
`augnes-local`. A new local entry exposes `augnes-codex` and points
`source.path` at `./plugins/augnes-codex` with `policy.installation:
AVAILABLE`, `policy.authentication: ON_INSTALL`, and `category: Productivity`.

This is local/repo marketplace metadata for testing and discovery. It does not
publish the plugin publicly.

## Verification

Executed verification:

- `npm run smoke:codex-augnes-plugin-v0-1`: passed.
- `npm run smoke:codex-augnes-skill-v0-1`: passed.
- `npm run smoke:augnes-operator-plugin-scaffold`: passed.
- `npm run smoke:codex-augnes-user-hook-installer`: passed.
- `npm run smoke:codex-augnes-reuse-hook`: passed.
- `git diff --check`: passed.

## Skipped Checks

- Real `/hooks` trust/loading check skipped: no interactive Codex `/hooks`
  trust surface is available to this smoke.
- Real `~/.codex` write check skipped: smoke must not mutate the user's real
  home directory.
- Real installer commands skipped: smoke must not run installer commands.
- Plugin validator skipped after attempted run: local Python environment is
  missing the `yaml` module required by
  `/Users/hynk/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py`.
- Skill quick validator skipped after attempted run: local Python environment
  is missing the `yaml` module required by
  `/Users/hynk/.codex/skills/.system/skill-creator/scripts/quick_validate.py`.
- Browser/computer-use skipped: this is a docs/metadata/skill/smoke/package
  slice with no browser-visible UI.
- Runtime-backed `codex:read-brief` skipped: local runtime reported
  `CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE`.
- Proof-only closeout skipped: no `CODEX_WORK_ID` was provided for this slice.

## Remaining Caveats

- `/hooks` review/trust remains manual and required for non-managed hooks.
- Installing or enabling the plugin does not automatically prove hook trust or
  real hook loading.
- Smoke verifies plugin files, manifest linkage, skill packaging, docs, and
  marketplace metadata only.
- Fallback remains:

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```

## Authority Boundary

No managed hooks, plugin-bundled runtime hooks, new hook plumbing, MCP servers,
provider/model calls, OpenAI provider configuration, storage, persistence,
Codex SDK execution, GitHub mutation behavior, proof/evidence writes,
automatic Augnes memory item creation, or Augnes state commit/reject authority
are added.

## Next Recommended PR

Dogfood the plugin in a fresh Codex thread and capture any wording or discovery
friction before considering a managed hook or broader distribution slice.
