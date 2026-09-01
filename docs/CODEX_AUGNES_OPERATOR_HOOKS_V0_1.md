# Codex Augnes repository hooks

## Current ownership

The reviewed `augnes-operator` plugin bundles skills and the Companion MCP
proxy, but no auto-discovered lifecycle hook configuration. The trusted checkout
owns three project-local hooks in `.codex/hooks.json`:

- `SessionStart` loads a compact repository operating reminder.
- Bash-only `PreToolUse` refuses a narrow set of direct high-confidence
  authority and secret-read violations.
- Bash-only `PostToolUse` reports structured pass/failure status for known
  verification commands.

No `Stop` hook is registered. No project-default `UserPromptSubmit` hook is
registered.

## Source-first and continuity boundary

The SessionStart reminder preserves the durable distinction:

- ordinary audit, review, investigation, verification, and implementation begin
  from current source without continuity or memory priming;
- explicit resume, continue, recovery, or current-state intent delegates to the
  reviewed Companion lifecycle and repository-continuity owner;
- exact repository identity, unrelated user work, skipped reasons, and
  planner-selected exact-head verification remain visible.

The hooks do not run Perspective-memory intake, GuideBrief/Work Brief intake,
proof closeout, evidence recording, provider/model calls, MCP tools, GitHub
writes, runtime startup, or repository commands.

## Skill ownership

`AGENTS.md` owns general repository scope, authority, safety, verification,
and PR rules. The repository-local skill surface contains only the user-facing
`augnes-codex` router. Specialized Companion continuity, GuideBrief handoff,
evidence, proof, and surface-operation procedures remain with the reviewed
operator plugin or their command/contract owner.

This avoids maintaining duplicate generic authority and implementation-slice
skills while preserving the specialized commands themselves.

## Verification

```bash
npm run test:augnes-operator-plugin-setup
npm run test:codex-user-hook-migration
npm run test:canonical-contract
```

The plugin setup test verifies that the plugin contributes no default hook
configuration, the checkout registers exactly the three current hook events,
generic source-first prompts receive no reuse context, the reviewed plugin cache
matches version `0.5.0`, and stale cache versions fail closed.

Hooks are guardrails, not complete enforcement or authority. They do not grant
approval, publication, execution, state, or merge authority.
