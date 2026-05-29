# Title

- Work title:
- Handoff owner:
- Date:
- Purpose: provide Codex a work-item-centered current-runtime handoff without
  asking the user to manage raw DB paths.

## Current Runtime

- `AUGNES_API_BASE_URL`:
- Runtime kind: current remote, current local endpoint, or provided by local operator:
- Current runtime confirmation: this is not an ephemeral demo DB:
- Raw DB path fallback only if local operator explicitly supplies it:
- Local-current DB path, if explicitly supplied:
- Do not use demo DB refs as current runtime refs:
- Demo DB refs excluded: `/tmp/augnes-runtime-dogfood.db` and
  `/tmp/augnes-browser-verification.db`:

## Work Item

- `CODEX_SCOPE`:
- `CODEX_WORK_ID`:
- Work title:
- Work status:
- Work next action:
- Related state keys:
- Work item safe for Codex implementation: yes/no:

## Handoff Summary

- Human-readable handoff summary:
- Source of handoff: Augnes, Cockpit, ChatGPT context, Work Contract Card, or user/Core note:
- `CODEX_SESSION_ID`, if an existing session is supplied:
- Existing session only; no automatic session creation:
- Handoff, Evidence Pack, or related trace refs supplied:

## Expected Scope

- Expected change scope:
- Expected files:
- Expected checks:
- Typecheck command:
- Targeted smoke commands:
- Browser/computer-use command or skipped reason:
- External checks and concrete skipped reasons:
- Expected PR target:

## Forbidden Changes

- Forbidden files or surfaces:
- Runtime behavior changes allowed: no:
- Database/schema changes allowed: no:
- API route changes allowed: no:
- MCP/App tool schema changes allowed: no:
- Active MCP config changes allowed: no:
- Plugin MCP config changes allowed: no:
- App mappings allowed: no:
- Hooks allowed: no:
- ChatGPT App UI/operator card implementation allowed: no unless explicitly scoped:
- Browser automation or screenshot capture implementation allowed: no:
- Secret handling changes allowed: no:
- Dependencies allowed: no:
- Publication/approval/retry/replay/external posting allowed: no by default:
- Merge authority: no:

## Evidence Authorization

- Evidence recording allowed: yes/no:
- Required current runtime available: yes/no:
- Required `CODEX_WORK_ID` available: yes/no:
- Evidence helper command to run only if allowed:
- Evidence IDs to report only if returned by helper:
- Concrete skipped reason if not allowed or unavailable:
- Evidence is not approval:

## Proof-Only Closeout Authorization

- Proof-only closeout allowed: yes/no:
- Required current runtime available: yes/no:
- Required `CODEX_WORK_ID` available: yes/no:
- Planned `CODEX_RESULT_KIND`: implementation/verification/documentation/screenshot/handoff/review/other:
- Proof helper command to run only if allowed:
- Proof/action IDs and work-event IDs to report only if returned by helper:
- Concrete skipped reason if not allowed or unavailable:
- Proof is not approval:

## Browser Verification Requirement

- Browser verification required: yes/no:
- UI/operator surfaces changed: yes/no:
- Use `docs/templates/codex-browser-verification-report.md`: yes/no:
- Browser runtime or Developer Mode availability:
- Screenshot artifact expected: no unless explicitly scoped:
- Concrete skipped reason if not applicable:

## Start Command

Exact start command:

```bash
git status --short
AUGNES_API_BASE_URL=<provided> CODEX_SCOPE=<provided> CODEX_WORK_ID=<provided> npm run codex:read-brief
```

- Proceed only if `codex:read-brief` succeeds for the supplied current runtime
  and work item.
- Proceed only within the provided work brief and user/Core scope.
- If the runtime is provided by a local operator, use the operator-supplied
  current endpoint before running the command.

## Stop Conditions

- Concrete blocked reason: missing `AUGNES_API_BASE_URL` and no local operator supplied current endpoint.
- Concrete blocked reason: missing `CODEX_SCOPE`.
- Concrete blocked reason: missing `CODEX_WORK_ID`.
- Concrete blocked reason: unknown work ID in provided current runtime.
- Concrete blocked reason: `codex:read-brief` failed.
- Concrete blocked reason: work item not confirmed safe for Codex implementation.
- Concrete blocked reason: expected scope or forbidden surfaces are ambiguous.
- Concrete blocked reason: evidence recording requested without explicit user/Core authorization.
- Concrete blocked reason: proof-only closeout requested without explicit user/Core authorization.
- Concrete blocked reason: publication, approval, retry, replay, or external posting requested without explicit user/Core approval.
- Concrete blocked reason: local-current DB path requested from user outside local-dev fallback mode.
- Concrete blocked reason: demo DB refs offered as current-runtime refs.

## Authority Boundaries

- ChatGPT does not execute Codex.
- Codex does not commit/reject Augnes state.
- Codex does not approve, publish, retry, replay, externally post, merge, or
  enable auto-merge.
- Evidence is not approval.
- Proof is not approval.
- PR is not merge authority.
- Durable approval remains user/Core gated.
- Merge authority: no.

## User/Core Questions

- Which current work item should Codex use?
- What current runtime endpoint should Codex read?
- If no endpoint is already running, is a local operator providing a current
  local endpoint?
- Is this a local-dev fallback that explicitly supplies a local-current DB path?
- Is the work item safe for Codex implementation now?
- Are evidence recording and proof-only closeout explicitly allowed?
- Is browser/computer-use verification required?
- Are any files, routes, schemas, tools, hooks, plugins, app mappings, reports,
  or secret-handling surfaces forbidden beyond the defaults above?
- Does any publication, approval, retry, replay, or external posting require a
  separate user/Core decision before the future run proceeds?
