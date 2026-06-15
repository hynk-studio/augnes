# Codex Augnes Plugin Manual Validation Capture

## Summary

This slice adds a manual validation capture checklist for the `augnes-codex`
Codex app/plugin surface. The checklist covers local plugin discovery, visible
metadata, starter/default prompt exposure, Augnes Codex Skill routing,
dry-run-first installer guidance, explicit `--yes` before real install,
manual `/hooks` trust caveats, and Perspective Memory Reuse Intake fallback.

The change is docs/report/static-smoke only. It does not add runtime behavior,
plugin-bundled hooks, managed hooks, MCP, provider/model calls, OpenAI config,
storage, persistence, Codex SDK usage, GitHub mutation behavior, automatic
memory item creation, real installer commands, or real `~/.codex` writes.

## Files Changed

- `docs/CODEX_AUGNES_PLUGIN_MANUAL_VALIDATION.md`
- `reports/2026-06-15-codex-augnes-plugin-manual-validation-capture.md`
- `scripts/smoke-codex-augnes-plugin-manual-validation.mjs`
- `package.json`

## Validation Checklist Added

`docs/CODEX_AUGNES_PLUGIN_MANUAL_VALIDATION.md` adds manual validation sections
for:

- Purpose
- Prerequisites
- Static checks before manual validation
- Codex restart/discovery steps
- Plugin surface checks
- Starter prompt checks
- Skill routing checks
- Installer dry-run behavior checks
- `/hooks` trust caveat checks
- Memory fallback checks
- Pass/fail capture template
- Known limitations
- Non-goals

The checklist includes these prompts:

- `Codex야 Augnes 설치해줘`
- `Codex야 Augnes 쓰자`
- `Augnes memory 보고 시작해`
- `Augnes reuse 켜줘`
- `Augnes context 붙여서 작업해줘`
- `아그네스 설치해줘`
- `아그네스 쓰자`

## Expected Manual Validation Result Format

Manual capture should record:

- Codex build/app surface under test.
- Repo path, branch, and commit.
- Whether local plugin discovery was available.
- Whether Codex restart/discovery was performed.
- Whether `augnes-codex` appeared in the plugin surface.
- Which metadata fields were visible or not exposed by the surface.
- Whether starter/default prompts were visible.
- Per-prompt routing results for install, use, memory, reuse, and context
  prompts.
- Whether dry-run guidance appeared before any real install path.
- Whether explicit `--yes` was required before real install.
- Whether `/hooks review/trust` remained manual.
- Whether Codex avoided claiming plugin install proves real hook loading or
  trust.
- Whether fallback to
  `npm run perspective:memory-reuse-intake -- --task "<task>" --brief`
  appeared when hook automation was unavailable.
- Concrete friction, screenshots, transcript refs, and an overall pass/fail.

## Verification

Executed verification for this PR:

- `npm run smoke:codex-augnes-plugin-manual-validation`: passed.
- `npm run smoke:codex-augnes-plugin-v0-1`: passed.
- `npm run smoke:codex-augnes-skill-v0-1`: passed.
- `git diff --check`: passed.

## Skipped Checks

- Manual Codex app/plugin-surface validation: skipped in this static capture
  PR because it requires interactive Codex restart/discovery.
- Manual `/hooks` review/trust validation: skipped because it is interactive
  and cannot be proven by static smoke.
- Real installer commands: skipped because this validation must not require or
  run real installer commands.
- Real `~/.codex` writes: skipped because this validation must not mutate the
  user's real Codex home.
- Runtime-backed `codex:read-brief`: skipped because the local runtime was
  unavailable during preflight.
- Proof-only closeout: skipped because `CODEX_WORK_ID` is missing.

## Remaining Caveats

- Static smoke does not prove real hook loading or trust.
- Codex app/plugin metadata exposure may vary by build.
- Codex restart may be required before local plugin discovery refreshes.
- Starter/default prompts may be absent from a surface even when manifest
  metadata contains them.
- Manual validation should capture concrete friction before changing hook
  packaging or trust behavior.

## Next Recommended PR

Only fix concrete friction found during manual Codex app validation. Do not
start plugin-bundled hook work until manual validation shows that hook
discovery/review is the actual bottleneck.

## Authority Boundary

This PR is docs/report/static-smoke only. It does not add runtime behavior,
route changes, schema changes, MCP/App tool schema changes, plugin-bundled
hooks, managed hooks, provider/model calls, OpenAI config, storage,
persistence, Codex SDK usage, GitHub mutation behavior, automatic memory item
creation, real installer commands, real `~/.codex` writes, proof/evidence
writes, or Augnes state commit/reject authority.
