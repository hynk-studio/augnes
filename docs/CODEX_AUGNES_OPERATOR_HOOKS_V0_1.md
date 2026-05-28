# Codex Augnes Operator Hooks v0.1

## Purpose

The `augnes-operator` plugin hooks add local guardrails around Codex workflow
habits. They remind Codex to read Augnes instructions, catch clear authority
boundary violations before tool use, review verification output after tool
use, and request a complete PR closeout before stopping.

Hooks are command handlers. They are guardrails, not complete security
enforcement, and they do not create new authority.

## Files Added

- `plugins/augnes-operator/hooks/hooks.json`
- `plugins/augnes-operator/hooks/session_start.mjs`
- `plugins/augnes-operator/hooks/pre_tool_use_policy.mjs`
- `plugins/augnes-operator/hooks/post_tool_use_review.mjs`
- `plugins/augnes-operator/hooks/stop_closeout_guard.mjs`
- `scripts/smoke-augnes-operator-plugin-hooks.mjs`

## Hook Config Shape

`plugins/augnes-operator/hooks/hooks.json` configures command handlers for:

- `SessionStart` with matcher `startup|resume`
- `PreToolUse` with matcher `Bash|apply_patch|Edit|Write|mcp__.*`
- `PostToolUse` with matcher `Bash|apply_patch|Edit|Write|mcp__.*`
- `Stop` without a matcher

Each handler uses a git-root-resolved command, for example:

```json
"node \"$(git rev-parse --show-toplevel)/plugins/augnes-operator/hooks/session_start.mjs\""
```

This keeps the hook path stable when Codex starts from a repository
subdirectory.

## Hook Behavior

### SessionStart

`session_start.mjs` returns `hookSpecificOutput.additionalContext` that
reminds Codex to:

- read `AGENTS.md`
- use `npm run codex:read-brief` when local runtime is available
- preserve skipped reasons
- prefer proof-only closeout
- edit files and open PRs without claiming merge authority
- remember that proof is not approval

Malformed input returns a safe system message instead of crashing. Startup is
not blocked, and the reminder is still returned through
`hookSpecificOutput.additionalContext`.

### PreToolUse

`pre_tool_use_policy.mjs` inspects tool name and tool input text. It denies
clear forbidden actions, including:

- `gh pr merge`
- GitHub API merge or auto-merge mutations
- force pushes
- positive auto-merge enablement; safe negated boundary text such as
  `Codex must never enable auto-merge` is not denied merely for naming the
  boundary
- remote merge, publish, approval, retry, or replay calls without explicit
  future Core-gated scope
- legacy `npm run codex:record-completion` unless explicitly allowed by
  `AUGNES_ALLOW_LEGACY_CODEX_COMPLETION=true`
- approval/publication/retry/replay commands unless
  `AUGNES_ALLOW_CORE_GATED_ACTUATION=true`
- direct secret reads such as `cat .env` or `printenv GITHUB_TOKEN`
- proof/evidence recording commands when `CODEX_WORK_ID` is absent from both
  the environment and an inline Bash assignment, except dry-run or preflight
  paths

It allows local checks such as `npm run typecheck`, `npm run smoke:*`, and
`npm run codex:closeout-preflight`. It allows proof-only closeout and evidence
recording commands when `CODEX_WORK_ID` is present in the hook environment or
as an inline command assignment such as `CODEX_WORK_ID=AG-123 npm run
codex:record-completion-proof`, but the hook does not record proof or evidence
itself. Non-deny reminders are returned through
`hookSpecificOutput.additionalContext`.

### PostToolUse

`post_tool_use_review.mjs` inspects command output defensively. If a Bash check
such as `npm run typecheck` or `npm run smoke:*` appears to pass, it returns
context through `hookSpecificOutput.additionalContext` suggesting evidence
recording only when runtime and `CODEX_WORK_ID` are available. If output
suggests failure, it asks Codex to summarize the failure in Verification or
Skipped checks.

It does not record evidence automatically.

### Stop

`stop_closeout_guard.mjs` inspects the last assistant message. It asks for a
continuation when closeout sections are missing, when the message claims merge
authority, or when proof-only closeout status/skipped reason is missing.
Continuation requests use the documented top-level `decision: "block"` and
`reason` fields.

If `stop_hook_active` is true, it does not request another continuation loop.
It does not require proof recording when runtime or `CODEX_WORK_ID` is
unavailable.

## Guardrail Limitations

Hooks inspect command text and message text. They are not complete enforcement,
not runtime policy, not a sandbox, and not a replacement for review. A user,
GitHub permissions, Augnes Core gates, and code review remain the real
authority boundaries.

## Relationship To AGENTS.md

`AGENTS.md` remains the root operating contract. These hooks reinforce its
rules locally by reminding Codex about context intake, skipped reasons,
proof-only closeout, and merge/approval/state boundaries.

## Relationship To Repo-Local Skills

The hooks support the same workflows packaged as skills:

- `augnes-read-brief`
- `augnes-implementation-slice`
- `augnes-record-evidence`
- `augnes-closeout-proof`
- `augnes-authority-audit`

They do not replace the skills and do not add runtime authority.

## Relationship To Plugin Scaffold

`docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_1.md` describes PR 4, which packaged the
approved skills and local marketplace metadata. This PR 5 slice adds hook
guardrails after the scaffold exists. It still does not add MCP config or app
mappings.

## Relationship To Closeout Preflight

`scripts/codex-closeout-preflight.mjs` remains the deterministic local
closeout checklist. The Stop hook nudges Codex toward the same closeout
sections, while the preflight helper remains the explicit JSON review aid.

## Relationship To Authority Matrix

`docs/AUTHORITY_MATRIX.md` defines the authority boundaries these hooks
protect:

- Codex may edit repo files and open PRs.
- Codex does not commit/reject Augnes state.
- Codex does not approve, publish, retry, replay, externally post, merge, or
  enable auto-merge.
- Durable approval remains user/Core gated.

## Canonical Roadmap Placement

`docs/CODEX_AGENT_HARNESS_ROADMAP_V0_1.md` defines this as PR 5: local,
deterministic, non-authoritative plugin hooks. PR 6 remains the future Codex
MCP / Augnes bridge usage docs slice.

## How To Test

Run:

```bash
npm run smoke:augnes-operator-plugin-hooks
npm run smoke:augnes-operator-plugin-scaffold
npm run codex:closeout-preflight
```

The closeout preflight should be run with PR-specific `CODEX_*` environment
variables in advisory mode unless a task explicitly asks for `--strict`.

## Non-Goals And Forbidden Changes

This hooks slice does not add:

- runtime behavior changes
- database/schema changes
- API route changes
- MCP/App tool schema changes
- MCP config
- app mappings
- ChatGPT App UI/operator cards
- browser/computer-use runbooks
- dogfood episode helpers
- secret handling changes
- dependencies
- ChatGPT direct Codex execution
- Codex Augnes commit/reject authority
- Codex merge authority
- approve/publish/retry/replay/external posting automation
- OpenAI, GitHub, Augnes runtime, or network calls
- evidence recording
- proof recording
- external publication
- committed-state mutation
- auto-merge enablement

Proof is not approval. A PR is not merge authority. Hooks do not execute Codex
from ChatGPT and do not grant Codex merge, approval, publish, or state
authority.
