# Codex Augnes Plugin Install Surface Polish

## Summary

This slice polishes the Augnes Codex Plugin v0.1 install surface without
changing runtime behavior. It enriches manifest interface metadata, adds
user-facing README sections, documents static and manual validation paths, and
extends read-only smoke coverage for the install-surface caveats.

## Files Changed

- `plugins/augnes-codex/.codex-plugin/plugin.json`
- `plugins/augnes-codex/README.md`
- `docs/CODEX_AUGNES_PLUGIN_VALIDATION.md`
- `reports/2026-06-15-codex-augnes-plugin-install-surface-polish.md`
- `scripts/smoke-codex-augnes-plugin-v0-1.mjs`

## Manifest Metadata Added

- `interface.displayName`
- `interface.shortDescription`
- `interface.longDescription`
- `interface.developerName`
- `interface.category`
- `interface.capabilities`
- `interface.defaultPrompt`

The default prompts include English/Korean Augnes install, use, memory, reuse,
and context starter prompts. Manifest copy keeps `/hooks` trust manual and does
not claim plugin install mutates `~/.codex`, bundles hooks, automates trust, or
adds MCP/provider/model/storage/persistence behavior.

## Validation Doc Added

`docs/CODEX_AUGNES_PLUGIN_VALIDATION.md` documents:

- static validation commands
- optional external Python validator caveats for `yaml` / PyYAML
- manual Codex app validation steps
- manual `/hooks` trust caveats
- read-only automated validation boundaries
- manual Perspective Memory Reuse Intake fallback

## Verification

- `npm run smoke:codex-augnes-plugin-v0-1`: passed.
- `npm run smoke:codex-augnes-skill-v0-1`: passed.
- `git diff --check`: passed.
- `npm run smoke:codex-augnes-user-hook-installer`: passed.
- `npm run smoke:codex-augnes-reuse-hook`: passed.
- `python3 -c "import yaml; print('PyYAML available')"`: failed because the
  local Python environment does not have `yaml` / PyYAML installed.

## Skipped Checks

- Plugin creator `validate_plugin.py`: skipped because local Python lacks
  `yaml` / PyYAML, and this slice does not add project-wide Python
  dependencies.
- Skill creator `quick_validate.py`: skipped because local Python lacks `yaml`
  / PyYAML, and this slice does not add project-wide Python dependencies.
- Manual Codex app/plugin-surface validation: skipped because it requires
  interactive Codex restart/discovery.
- Manual `/hooks` review/trust validation: skipped because it is interactive
  and cannot be proven by static smoke.
- Real installer commands: skipped to avoid real user-level hook writes and
  real `~/.codex` mutation.

## Remaining Caveats

- Static smoke does not prove real Codex hook loading or `/hooks` trust.
- Manual Codex app/plugin-surface validation still requires an interactive
  Codex restart/discovery pass.
- Manual hook trust validation still requires interactive `/hooks` review.
- This slice does not run real installer commands or write to real `~/.codex`.

## Next Recommended PR

Manual Codex app validation capture: verify the local marketplace/plugin surface
after restarting Codex, capture whether starter prompts are visible, and record
whether a prompt such as `Codex야 Augnes 설치해줘` routes through the Augnes
Codex Skill flow without claiming automated `/hooks` trust.

## Authority Boundary

This PR is docs/manifest/smoke/report polish only. It does not add runtime
behavior, hook plumbing, plugin-bundled hooks, managed hooks, MCP servers,
provider/model calls, OpenAI configuration, storage, persistence, Codex SDK
usage, GitHub mutation behavior, automatic Augnes memory item creation,
proof/evidence writes, or Augnes state commit/reject authority.
