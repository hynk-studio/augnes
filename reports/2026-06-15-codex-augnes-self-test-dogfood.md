# Codex Augnes Self-Test Dogfood

## Summary

This self-test dogfooded the current Augnes Codex Skill and Plugin flow from
ordinary English and Korean use prompts. Static validation passed, Perspective
Memory Reuse Intake fallback returned usable task-start briefs in the valid
zero persisted-item state, and the inspected skill/plugin wording correctly
separates user-liftable constraints from non-liftable Codex/platform
constraints.

One concrete wording friction was found and fixed: `아그네스 쓰자` appeared in
the trigger and starter-prompt surfaces but was missing from the use-flow
example text in the source skill, packaged skill, and skill doc.

## Base Branch And Dependency On #574

- Base branch: `main`.
- Base commit when branched: `577d785`.
- PR #571, #572, #573, and #574 were all merged before this branch was created.
- Dependency on #574: included through `main`; this self-test includes the
  English trigger and user-liftable/non-liftable constraint-disclosure work.

## Files Inspected

- `AGENTS.md`
- `README.md`
- `docs/AUTHORITY_MATRIX.md`
- `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md`
- `docs/CANONICAL_REPO_OWNER_NOTE_V0_1.md`
- `package.json`
- `.agents/skills/augnes-codex/SKILL.md`
- `plugins/augnes-codex/skills/augnes-codex/SKILL.md`
- `plugins/augnes-codex/.codex-plugin/plugin.json`
- `plugins/augnes-codex/README.md`
- `docs/CODEX_AUGNES_SKILL_V0_1.md`
- `docs/CODEX_AUGNES_PLUGIN_V0_1.md`
- `docs/CODEX_AUGNES_PLUGIN_VALIDATION.md`
- `docs/CODEX_AUGNES_PLUGIN_MANUAL_VALIDATION.md`
- `reports/2026-06-15-codex-augnes-english-triggers-liftable-constraints.md`

## Static Verification Results

- `npm run smoke:codex-augnes-english-triggers-liftable-constraints`: passed.
- `npm run smoke:codex-augnes-plugin-manual-validation`: passed.
- `npm run smoke:codex-augnes-plugin-v0-1`: passed.
- `npm run smoke:codex-augnes-skill-v0-1`: passed.
- `npm run smoke:codex-augnes-user-hook-installer`: passed.
- `npm run smoke:codex-augnes-reuse-hook`: passed.
- `git diff --check`: passed before edits.

All requested static scripts were available because #574 had merged into
`main` before this branch was created.

## Perspective Memory Reuse Intake Fallback Results

Command 1:

```bash
npm run perspective:memory-reuse-intake -- --task "Use Augnes for this task. Run a Codex self-test of Augnes English/Korean trigger routing, constraint disclosure, and memory fallback behavior." --brief
```

Result:

- persisted memory items selected: no.
- No persisted perspective-memory items selected.
- selected memory IDs: none.
- `why_selected`: unavailable because no persisted items were selected.
- `reuse_boundary`: unavailable because no persisted items were selected.
- `quality_review_preview_summary`: available as `Quality Review Warning
  Summary`.
- no-match guidance: `store_read_zero_items`; store read succeeded, but zero
  persisted perspective-memory items were available.
- brief usability: usable as task-start context because it preserved the task,
  return expectations, no-match state, and authority boundary.

Command 2:

```bash
npm run perspective:memory-reuse-intake -- --task "Codex야 Augnes 쓰자. Augnes memory 보고 시작하고 영어/한국어 trigger와 제한사항 설명 UX를 셀프 테스트해." --brief
```

Result:

- persisted memory items selected: no.
- No persisted perspective-memory items selected.
- selected memory IDs: none.
- `why_selected`: unavailable because no persisted items were selected.
- `reuse_boundary`: unavailable because no persisted items were selected.
- `quality_review_preview_summary`: available as `Quality Review Warning
  Summary`.
- no-match guidance: `store_read_zero_items`; store read succeeded, but zero
  persisted perspective-memory items were available.
- brief usability: usable as task-start context because it preserved the task,
  return expectations, no-match state, and authority boundary.

This self-test does not require success only when persisted items exist. The
zero persisted-item result is a valid self-test result.

## English Trigger Self-Test Results

The source skill, packaged skill, plugin manifest, plugin README, and validation
docs support ordinary English prompts, including:

- `Use Augnes for this task`
- `Set up Augnes in Codex`
- `Start with Augnes memory`
- `Review this PR with Augnes context`
- `Enable Augnes reuse`
- `Use Augnes context before editing`

The inspected use-start behavior routes English use prompts into the Augnes use
flow, discloses constraints, warns that `/hooks review/trust remains manual`,
and falls back to Perspective Memory Reuse Intake with `--brief` when hook
automation is unavailable, missing, disabled, or not trusted.

## Korean Trigger Self-Test Results

The source skill, packaged skill, plugin manifest, plugin README, and manual
validation checklist support Korean prompts, including:

- `Codex야 Augnes 설치해줘`
- `Codex야 Augnes 쓰자`
- `Augnes memory 보고 시작해`
- `Augnes reuse 켜줘`
- `Augnes context 붙여서 작업해줘`
- `아그네스 설치해줘`
- `아그네스 쓰자`

Friction found: `아그네스 쓰자` was present in top-level trigger/starter
surfaces but missing from the use-flow example text. This PR adds it to the
source skill, packaged skill, and skill doc use-flow examples.

## Constraint Disclosure Self-Test Results

The inspected skill/plugin flow requires Codex to disclose user-liftable
constraints separately from non-liftable Codex/platform constraints at Augnes
use start. It does not claim plugin install proves hook loading or trust, does
not claim static smoke can prove real hook loading or trust, does not claim
`/hooks` trust can be removed, and does not use
`--dangerously-bypass-hook-trust` as normal UX.

## User-Liftable Constraints Observed

- dry-run-first installer behavior.
- real install requires explicit `--yes` or equivalent user authorization.
- no real `~/.codex` write unless explicitly authorized.
- memory brief is read-only/context-only by default.
- no automatic memory item creation by default.
- no storage/persistence/provider/model/OpenAI config/MCP/Codex SDK/GitHub
  mutation unless explicitly scoped.
- no plugin-bundled hook implementation by default.

## Non-Liftable Constraints Observed

- `/hooks review/trust remains manual`.
- plugin install does not prove hook trust.
- plugin install does not prove real hook loading.
- static smoke cannot prove real hook loading or trust.
- Codex command approvals and safety behavior remain in force.

## Manual Codex App/Plugin Validation Result Or Unavailable Note

Manual Codex app/plugin validation unavailable in this environment.

The app/plugin discovery surface was not available from this shell-only PR
workflow, so this run did not restart Codex, inspect the live plugin surface,
or send live prompt turns through the app. This report does not fake that
validation.

## Fixes Made, If Any

- Added `아그네스 쓰자` to the source skill use-flow examples.
- Added `아그네스 쓰자` to the packaged plugin skill use-flow examples.
- Added `아그네스 쓰자` to the v0.1 skill doc use/fallback-flow examples.
- Added this validation capture report.
- Added a deterministic read-only smoke for this report.
- Added the `smoke:codex-augnes-self-test-dogfood` package script.

## Skipped Checks With Reasons

- Manual Codex app/plugin validation: skipped because no Codex app/plugin
  discovery surface was available in this environment.
- Interactive `/hooks` trust: skipped because `/hooks review/trust remains
  manual` and this self-test must not automate trust.
- Real installer commands: skipped because this task explicitly forbids real
  installer commands.
- Real `~/.codex` writes: skipped because this task explicitly forbids writes
  to the real Codex home.
- `--dangerously-bypass-hook-trust`: not used because normal Augnes UX must not
  use it.
- Runtime-backed `codex:read-brief`: skipped after
  `CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE`.
- Proof-only closeout: skipped because the local runtime was unavailable and
  `CODEX_WORK_ID` was not set.

## Remaining Caveats

- Static smoke cannot prove real hook loading or trust.
- Plugin install does not prove real hook loading or trust.
- This run did not validate a live Codex plugin surface or starter prompt UI.
- The valid zero persisted-item reuse-intake result proves fallback behavior
  and no-match guidance, not live persisted memory selection.
- This PR does not add plugin-bundled hooks, managed hooks, MCP, provider/model
  behavior, OpenAI config behavior, storage or persistence behavior, Codex SDK
  usage, GitHub mutation behavior beyond the normal PR workflow, automatic
  memory item creation, real installer commands, real `~/.codex` writes, or
  `/hooks` trust automation.

## Next Recommended PR

Run actual manual Codex app/plugin validation if unavailable here.
