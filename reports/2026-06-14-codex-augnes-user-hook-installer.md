# Codex Augnes User-Level Reuse Hook Installer v0.1 Report

## Summary

This slice adds a dry-run-first installer and uninstaller for a user-level
Codex Augnes reuse hook. It does not claim end-to-end hook automation works.
Static feasibility only; real Codex hook trust/loading remains unverified in
this environment.

## Environment facts from feasibility probe

- Codex CLI exists at `/Users/hynk/.local/bin/codex`.
- Codex CLI version observed: `codex-cli 0.137.0`.
- The `hooks` feature is stable and enabled.
- User-level hooks are documented for `~/.codex/hooks.json` and
  `~/.codex/config.toml`.
- `~/.codex/config.toml` exists.
- `~/.codex/hooks.json` was not present during the feasibility probe.
- Non-managed command hooks still require `/hooks` review/trust by exact hook
  definition hash.
- This Desktop agent/tool context could not operate the interactive `/hooks`
  UI.

## Why user-level/global hook installer is the next direction

The project-local hook works as repo code and through direct fixture
validation, but trusted-session dogfood was blocked by project-root and
interactive `/hooks` visibility friction. A user-level hook avoids
project-local `.codex` trust friction while retaining strong Augnes repo
filtering.

The tradeoff remains explicit: user-level hooks still require normal
non-managed hook trust before they run.

## Files changed

- `scripts/codex-install-augnes-reuse-hook.mjs`
- `scripts/codex-uninstall-augnes-reuse-hook.mjs`
- `scripts/lib/codex-augnes-user-hook-installer-common.mjs`
- `scripts/smoke-codex-augnes-user-hook-installer.mjs`
- `docs/CODEX_AUGNES_USER_HOOK_INSTALLER_V0_1.md`
- `reports/2026-06-14-codex-augnes-user-hook-installer.md`
- `package.json`

## Installer behavior

- Default mode is dry-run.
- Real writes require `--yes`.
- `--target-home` supports temp-home smoke and manual rehearsal.
- `--repo-root` can point at the Augnes checkout.
- Existing `~/.codex/hooks.json` is backed up before real writes.
- Unrelated hooks are preserved.
- Exactly one Augnes `UserPromptSubmit` hook entry is added, updated, or left
  unchanged.
- The copied script is installed at
  `~/.codex/augnes/augnes-reuse-intake-user-prompt-submit.mjs`.
- Metadata is written at `~/.codex/augnes/metadata.json`.

## Uninstaller behavior

- Default mode is dry-run.
- Real writes require `--yes`.
- Only the Augnes hook entry is removed.
- Unrelated hooks are preserved.
- The copied script and metadata are removed only when metadata shows this
  installer owns them.
- `~/.codex` itself is not removed.

## Temp-home smoke behavior

The smoke uses only a temporary `--target-home`.

It verifies:

- install dry-run performs no writes
- install `--yes --target-home <temp>` writes temp `hooks.json`, copied script,
  and metadata
- unrelated hooks are preserved
- reinstall does not duplicate the Augnes hook
- uninstall dry-run performs no writes
- uninstall `--yes --target-home <temp>` removes only the Augnes hook and
  installer-owned script/metadata
- installed hook direct fixture execution exits `0`
- outside-Augnes, opt-out, casual, and malformed JSON prompts fail open

The direct hook execution is fixture-only and is not real Codex
trusted-session validation.

## Hook placement decision

The installer uses option B from the feasibility probe: copy a stable script
under `~/.codex/augnes/...`.

This isolates the trusted user-level hook from later repo edits and gives the
uninstaller clear metadata. If the Augnes repo moves, the copied hook still
resolves the active task `cwd` with git root detection instead of relying on a
project-local `.codex` relative path. The copied hook verifies Augnes markers
with `package.json`, `AGENTS.md`, `perspective:memory-reuse-intake`, and
`git remote -v`.

## Trust behavior caveat

User-level hook installation does not prove the hook will run. The operator
must open `/hooks` in an interactive Codex CLI/TUI session and trust the exact
non-managed hook definition. Smoke coverage does not operate that UI.

## Boundary

This PR only adds dry-run-first user-level Codex hook install/uninstall
tooling, docs, report, and temp-home smoke coverage.

It adds no runtime authority, DB schema changes, migrations, setup/prepare
polish, provider/model calls, OpenAI API calls, Codex SDK execution, MCP tool
calls, GitHub mutation from scripts, proof/evidence writes, perspective-memory
persistence writes, reuse packet persistence, return binding persistence,
quality review persistence, product boundary creation, automatic synthesis,
automatic memory creation, default/user DB writes during smoke, hidden
background daemons, or Augnes state commit/reject authority.

## Verification

- PASS: `npm run smoke:codex-augnes-user-hook-installer`
- PASS: `npm run smoke:codex-augnes-reuse-hook`
- PASS: `npm run smoke:codex-augnes-reuse-hook-dogfood-report`
- PASS: `npm run smoke:perspective-memory-reuse-intake`
- PASS: `npm run smoke:perspective-memory-reuse-intake-dogfood-report`
- PASS: `npm run smoke:perspective-memory-items`
- PASS: `npm run smoke:perspective-memory-items-search`
- PASS: `npm run smoke:perspective-memory-items-review-workspace`
- PASS: `npm run smoke:perspective-memory-items-reuse-packet`
- PASS: `npm run smoke:perspective-memory-reuse-quality-review`
- PASS: `npm run smoke:perspective-memory-reuse-quality-review-dogfood-report`
- PASS: `npm run smoke:perspective-memory-reuse-return-binding`
- PASS: `npm run smoke:perspective-memory-reuse-return-binding-dogfood-report`
- PASS: `npm run smoke:perspective-memory-reuse-live-data-dogfood-report`
- PASS: `npm run smoke:perspective-memory-reuse-live-data-dogfood-seed`
- PASS: `npm run smoke:perspective-memory-reuse-live-data-dogfood-harness-rerun-report`
- PASS: `npm run smoke:perspective-memory-reuse-quality-review-panel-dogfood-report`
- PASS: `npm run smoke:augnes-codex-bootstrap`
- PASS: `npm run smoke:augnes-codex-doctor`
- PASS: `npm run smoke:augnes-codex-prepare`
- PASS: `npm run smoke:augnes-operator-plugin-scaffold`
- PASS: `npm run smoke:augnes-operator-plugin-hooks`
- PASS: `npm run typecheck`
- PASS: `git diff --check`
- PASS: `git diff --cached --check`

## Skipped checks with concrete reasons

- Real `~/.codex` install skipped: requires manual operator approval.
- Interactive `/hooks` trust review skipped: this Desktop agent/tool context
  cannot operate the interactive Codex CLI/TUI hook browser.
- Real Codex hook loading/trust skipped: requires manual `/hooks` trust.
- Runtime startup skipped: no runtime behavior changed and task forbids runtime
  startup.
- MCP bridge startup skipped: no MCP bridge behavior changed and task forbids
  bridge startup.
- Provider/model/OpenAI API checks skipped: scripts must not call providers or
  OpenAI APIs.
- GitHub mutation from scripts skipped: scripts must not mutate GitHub.
- Proof/evidence recording skipped: no `CODEX_WORK_ID` was supplied and this
  slice must not write proof/evidence.

## Next recommended PR

Dogfood the installer with a real user-level install only after manual operator
approval.
