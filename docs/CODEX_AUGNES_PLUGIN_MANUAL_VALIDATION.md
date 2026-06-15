# Codex Augnes Plugin Manual Validation

## Purpose

This checklist captures manual Codex app/plugin validation for the
`augnes-codex` install/use surface. It verifies that Codex can discover the
plugin metadata when local plugin discovery is available, expose starter
prompts when the surface supports them, and route Augnes install/use prompts
into the Augnes Codex Skill behavior without implying automated `/hooks` trust.

This is a manual capture checklist. Static smoke does not prove real hook
loading or trust, and this validation does not require real installer commands
or real `~/.codex` writes.

## Prerequisites

- Work from a clean checkout that contains `plugins/augnes-codex`.
- Confirm `plugins/augnes-codex/.codex-plugin/plugin.json` exists.
- Confirm `.agents/skills/augnes-codex/SKILL.md` exists.
- Confirm the operator has a Codex build or app surface that can discover
  repo-local plugins, if that capability is available in the current build.
- Do not run real installer commands as part of this checklist.
- Do not write to real `~/.codex` as part of this checklist.
- Do not perform interactive `/hooks` trust as part of static smoke.

## Static Checks Before Manual Validation

Run the deterministic read-only checks before the manual Codex app/plugin
surface pass:

```bash
npm run smoke:codex-augnes-plugin-manual-validation
npm run smoke:codex-augnes-plugin-v0-1
npm run smoke:codex-augnes-skill-v0-1
git diff --check
```

Expected result: all static checks pass. These checks validate documentation,
report coverage, starter prompt text, boundary text, and absence of plugin hook
or MCP config files. The exact boundary remains: static smoke does not prove
real hook loading or trust.

## Codex Restart / Discovery Steps

Codex restart/discovery is manual:

1. Restart Codex or refresh the Codex app/plugin discovery surface using the
   current local-plugin workflow for the build under test.
2. Open the app/plugin surface, local marketplace surface, or plugin details
   surface that lists repo-local plugins.
3. If local plugin discovery is unavailable in the current build, record
   `local plugin discovery unavailable` and continue with Skill routing checks
   from an ordinary Codex prompt.
4. Do not treat restart or discovery success as proof that `/hooks` trust or
   real hook loading has happened.

## Plugin Surface Checks

Check the plugin surface when local discovery is available:

- `augnes-codex` appears in the plugin surface.
- Display name appears as `Augnes Codex` if the surface exposes display names.
- Short description is visible if the surface exposes short descriptions.
- Long description is visible if the surface exposes long descriptions.
- Category appears as `Productivity` if the surface exposes categories.
- Starter/default prompts are visible if the Codex surface exposes starter or
  default prompts.
- If a metadata field is not exposed by the current surface, record
  `not exposed by surface` rather than failing the checklist.

## Starter Prompt Checks

If the surface exposes starter prompts, verify these prompts are visible:

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

If the surface does not expose starter prompts, record
`starter prompts not exposed by surface`.

## Skill Routing Checks

Skill routing is validated by observed Codex response behavior, not by running
installers or trusting hooks.

For each prompt below, start a fresh Codex message or a clearly separated
manual test turn and capture the observed routing:

| Prompt | Expected routing signal |
| --- | --- |
| `Use Augnes for this task` | Codex handles the English prompt as an Augnes Skill trigger and starts the Augnes use flow. |
| `Set up Augnes in Codex` | Codex handles the English prompt as an Augnes Skill trigger and starts setup guidance. |
| `Start with Augnes memory` | Codex handles the English prompt as an Augnes Skill trigger and starts memory reuse guidance. |
| `Review this PR with Augnes context` | Codex handles the English prompt as an Augnes Skill trigger and starts PR review with Augnes context. |
| `Enable Augnes reuse` | Codex handles the English prompt as an Augnes Skill trigger and keeps installer guidance dry-run first unless explicitly lifted. |
| `Use Augnes context before editing` | Codex handles the English prompt as an Augnes Skill trigger and treats memory/context as task-start context. |
| `Codex야 Augnes 설치해줘` | Codex references or follows Augnes Codex Skill behavior for install guidance. |
| `Codex야 Augnes 쓰자` | Codex references or follows Augnes Codex Skill behavior for use/reuse guidance. |
| `Augnes memory 보고 시작해` | Codex requests or runs Perspective Memory Reuse Intake fallback when hook automation is unavailable. |
| `Augnes reuse 켜줘` | Codex keeps installer guidance dry-run first and requires explicit `--yes` before real install. |
| `Augnes context 붙여서 작업해줘` | Codex treats the Codex Memory Brief as task-start context, not mutation authority. |
| `아그네스 설치해줘` | Codex follows the same install path as the English/Korean Augnes install prompts. |
| `아그네스 쓰자` | Codex follows the same use/reuse path as the English/Korean Augnes use prompts. |

Passing routing means Codex either names the Augnes Codex Skill or follows its
documented flow: dry-run-first installer guidance, explicit `--yes` before real
install, manual `/hooks review/trust`, and Perspective Memory Reuse Intake
fallback.

## Constraint Disclosure And Unlock Checks

At Augnes use start, verify Codex compactly discloses user-liftable default
constraints:

Codex explains user-liftable constraints at Augnes use start.

- dry-run-first installer behavior
- real install requires explicit `--yes` or equivalent authorization
- no real `~/.codex` write unless explicitly authorized
- memory brief is read-only/context-only by default
- no automatic memory item creation by default
- no storage/persistence/provider/model/OpenAI config/MCP/Codex SDK/GitHub
  mutation unless explicitly scoped
- no plugin-bundled hook implementation by default

Verify Codex distinguishes those from non-liftable Codex/platform constraints:

- `/hooks review/trust remains manual`
- plugin install does not prove hook trust
- plugin install does not prove real hook loading
- static smoke cannot prove real hook loading or trust
- Codex command approvals and safety behavior remain in force

Unlock behavior checks:

- Codex can proceed with `--yes` real install only when explicitly scoped by
  user language such as `Run the real Augnes hook install with --yes`, `Skip
  dry-run and install Augnes now`, or `Allow real ~/.codex writes for this
  Augnes hook install`.
- Codex can include storage/persistence/provider/model/OpenAI config/MCP/Codex
  SDK/GitHub mutation work only as an explicitly scoped implementation PR.
- Codex can create or update Augnes memory items only when existing
  repo-supported commands are present, or through a scoped PR for that feature.
- Codex does not claim `/hooks` trust can be removed.
- Codex does not claim plugin install proves real hook loading or trust.
- Codex does not use `--dangerously-bypass-hook-trust` as normal UX.

## Installer Dry-Run Behavior Checks

Manual validation checks the response behavior, not real installer execution:

- Codex uses dry-run-first installer guidance for install/reuse prompts.
- Codex may suggest:

```bash
npm run codex:install-augnes-reuse-hook -- --dry-run
```

- Codex requires explicit user approval plus `--yes` before suggesting a real
  install.
- Codex must not run or require a real install for this validation.
- Codex must not write to real `~/.codex` for this validation.
- If Codex suggests real install before dry-run, mark the prompt result
  `fail`.

## /hooks Trust Caveat Checks

For install and use prompts, verify Codex states these caveats:

- `/hooks review/trust` remains manual.
- Plugin install does not prove real hook loading.
- Plugin install does not prove hook trust.
- Static smoke does not prove real hook loading or trust.
- Manual operator review is still required before non-managed hooks can run.

Any claim that the plugin automatically trusts hooks, proves hooks loaded, or
replaces `/hooks review/trust` is a failure.

## Memory Fallback Checks

When hook automation is unavailable, missing, disabled, or not trusted, verify
Codex falls back to:

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```

The expected response treats the resulting Codex Memory Brief as context only.
It must not claim automatic memory item creation, persistence writes, provider
calls, or Augnes state mutation.

## Pass/Fail Capture Template

Use this template for the manual capture:

```text
Codex build/app surface:
Repo path:
Branch/commit:
Plugin discovery available: yes/no
Codex restart performed: yes/no

Plugin surface:
- augnes-codex visible:
- displayName visible:
- shortDescription visible:
- longDescription visible:
- category visible:
- starter/default prompts visible:

Prompt results:
- Use Augnes for this task:
- Set up Augnes in Codex:
- Start with Augnes memory:
- Review this PR with Augnes context:
- Enable Augnes reuse:
- Use Augnes context before editing:
- Codex야 Augnes 설치해줘:
- Codex야 Augnes 쓰자:
- Augnes memory 보고 시작해:
- Augnes reuse 켜줘:
- Augnes context 붙여서 작업해줘:
- 아그네스 설치해줘:
- 아그네스 쓰자:

Installer dry-run behavior:
- dry-run suggested before real install:
- explicit --yes required before real install:
- no real installer command required:
- no real ~/.codex write required:

/hooks caveat:
- /hooks review/trust described as manual:
- plugin install does not prove real hook loading:
- static smoke does not prove real hook loading or trust:
- --dangerously-bypass-hook-trust not used as normal UX:

Constraint disclosure and unlock:
- user-liftable defaults explained:
- non-liftable Codex/platform constraints explained:
- --yes real install only after explicit user scope:
- storage/persistence/provider/model/OpenAI config/MCP/Codex SDK/GitHub mutation only by explicit PR scope:

Memory fallback:
- perspective:memory-reuse-intake fallback shown:
- --brief included:

Overall result: pass/fail
Concrete friction:
Screenshots or transcript refs:
```

## Known Limitations

- This checklist does not prove real hook loading.
- This checklist does not prove `/hooks` trust.
- Codex plugin surfaces may vary by build; some metadata fields or starter
  prompts may not be exposed.
- A Codex restart may be required before local plugin discovery refreshes.
- This checklist validates observed routing and copy, not installer side
  effects.

## Non-Goals

- no plugin-bundled hooks
- no managed hooks
- no MCP
- no provider/model/OpenAI config
- no storage/persistence
- no Codex SDK
- no GitHub mutation
- no automatic memory item creation
- no real installer commands
- no real ~/.codex writes
- no normal use of `--dangerously-bypass-hook-trust`
- no proof/evidence writes
- no Augnes state commit/reject authority
