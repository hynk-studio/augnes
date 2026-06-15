# Codex Augnes Plugin Validation

## Static Validation

Run the static, read-only checks for this plugin slice:

```bash
npm run smoke:codex-augnes-plugin-v0-1
npm run smoke:codex-augnes-skill-v0-1
git diff --check
```

These checks verify plugin files, manifest linkage, packaged skill content,
docs, marketplace metadata, and install-surface caveats. Static smoke does not
prove real hook loading or trust.

## Optional External Validators

Codex plugin creator `validate_plugin.py` and skill creator
`quick_validate.py` can provide extra local checks when available. They may
require a local Python environment with `yaml` / PyYAML installed.

If `yaml` / PyYAML is unavailable, record the skipped check instead of treating
that as a plugin runtime failure. Do not add a new project-wide Python
dependency unless this repository already has a clear Python dependency
management convention for it.

## Manual Codex App Validation

After marketplace or plugin metadata changes, restart Codex so local discovery
can refresh. Then:

1. Open the plugin directory or repo-local marketplace surface.
2. Confirm `augnes-codex` appears.
3. Confirm starter prompts are visible if the surface supports default prompts.
4. Try a prompt such as `Codex야 Augnes 설치해줘`.
5. Confirm Codex references the Augnes skill or follows its install/use flow.
6. Confirm Codex does not claim `/hooks` trust is automated.

This validation is interactive and should be captured separately from static
smoke output.

## Manual Hook Validation Caveat

`/hooks` review/trust must be checked interactively for non-managed hooks. Static
smoke does not prove real hook loading/trust, and installing or enabling this
plugin does not replace that manual trust step.

Do not write to real `~/.codex` during automated validation. Automated checks in
this slice must stay deterministic and read-only.

## Fallback Command

If hook automation is unavailable, missing, disabled, or not trusted, run
Perspective Memory Reuse Intake manually:

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```
