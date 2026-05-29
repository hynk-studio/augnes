# Title

- Work title:
- Intake owner:
- Date:
- Purpose: prepare a future current-runtime Augnes dogfood work item before
  Codex touches the current runtime.

## Runtime Environment

- `AUGNES_API_BASE_URL`:
- Runtime kind: production/current local, current remote, or explicitly named
  current environment:
- Current runtime confirmation: this is not an ephemeral demo DB.
- Demo DB refs excluded: `/tmp/augnes-runtime-dogfood.db` and
  `/tmp/augnes-browser-verification.db` refs must not be used as current
  runtime refs.

## Work Item

- `CODEX_SCOPE`:
- `CODEX_WORK_ID`:
- Work title:
- Work status:
- Work next action:
- Related state keys:
- Work item safe for Codex implementation: yes/no:

## Session Context

- `CODEX_SESSION_ID`:
- `CODEX_SESSION_ID` available: yes/no:
- Existing session only; no automatic session creation:
- Handoff, Evidence Pack, or related trace refs supplied:

## User/Core Authorization

- Evidence recording allowed: yes/no:
- Proof-only closeout allowed: yes/no:
- Browser verification required: yes/no:
- Publication/approval/retry/replay/external posting allowed: no by default:
- Publication/approval/retry/replay/external posting requires explicit
  user/Core approval before that exact action: yes/no:
- Merge authority: no:
- User/Core approval notes:

## Expected Scope

- Expected change scope:
- Expected files:
- Expected checks:
- Related docs or report templates:
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
- ChatGPT App UI/operator card implementation allowed: no unless explicitly
  scoped:
- Browser automation or screenshot capture implementation allowed: no:
- Secret handling changes allowed: no:
- Dependencies allowed: no:

## Verification Plan

- Expected verification commands:
- Typecheck command:
- Targeted smoke commands:
- Browser/computer-use command or skipped reason:
- External checks and concrete skipped reasons:

## Evidence Recording Plan

- Evidence recording allowed: yes/no:
- Required current runtime available: yes/no:
- Required `CODEX_WORK_ID` available: yes/no:
- Evidence helper command to run only if allowed:
- Evidence IDs to report only if returned by helper:
- Concrete skipped reason if not allowed or unavailable:
- Evidence is not approval:

## Proof-Only Closeout Plan

- Proof-only closeout allowed: yes/no:
- Required current runtime available: yes/no:
- Required `CODEX_WORK_ID` available: yes/no:
- Planned `CODEX_RESULT_KIND`: documentation/verification/other accepted
  helper kind:
- Proof helper command to run only if allowed:
- Proof/action IDs and work-event IDs to report only if returned by helper:
- Concrete skipped reason if not allowed or unavailable:
- Proof is not approval:

## Browser / Computer-Use Verification Plan

- Browser verification required: yes/no:
- UI/operator surfaces changed: yes/no:
- Use `docs/templates/codex-browser-verification-report.md`: yes/no:
- Browser runtime or Developer Mode availability:
- Screenshot artifact expected: no unless explicitly scoped:
- Concrete skipped reason if not applicable:

## Dogfood Capture Plan

- Dogfood report expected after the future run: yes/no:
- Runtime mode label:
- Current-runtime refs to include only if returned by current runtime:
- Prior demo reports referenced for background only:
- Generated report path, if later created:

## Authority Boundaries

- ChatGPT does not execute Codex.
- Codex does not commit/reject Augnes state.
- Codex does not approve, publish, retry, replay, externally post, merge, or
  enable auto-merge.
- Proof is not approval.
- Evidence is not approval.
- PR is not merge authority.
- Durable approval remains user/Core gated.
- Merge authority: no.

## Start Gate

Exact start command:

```bash
git status --short
AUGNES_API_BASE_URL=<provided> CODEX_SCOPE=<provided> CODEX_WORK_ID=<provided> npm run codex:read-brief
```

- Proceed only if `codex:read-brief` succeeds for the supplied current runtime
  and work item.
- Proceed only within the provided work brief and user/Core scope.

## Stop Conditions

- Concrete blocked reason: missing `AUGNES_API_BASE_URL`.
- Concrete blocked reason: missing `CODEX_SCOPE`.
- Concrete blocked reason: missing `CODEX_WORK_ID`.
- Concrete blocked reason: unknown work ID in provided current runtime.
- Concrete blocked reason: `codex:read-brief` failed.
- Concrete blocked reason: work item not confirmed safe for Codex
  implementation.
- Concrete blocked reason: expected scope or forbidden surfaces are ambiguous.
- Concrete blocked reason: evidence recording requested without explicit
  user/Core authorization.
- Concrete blocked reason: proof-only closeout requested without explicit
  user/Core authorization.
- Concrete blocked reason: publication, approval, retry, replay, or external
  posting requested without explicit user/Core approval.

## Supplied Values

- `AUGNES_API_BASE_URL`:
- `CODEX_SCOPE`:
- `CODEX_WORK_ID`:
- `CODEX_SESSION_ID`:
- Work title:
- Work status:
- Work next action:
- Related state keys:
- Expected files:
- Expected checks:
- Evidence recording allowed: yes/no:
- Proof-only closeout allowed: yes/no:
- Browser verification required: yes/no:
- Publication/approval/retry/replay/external posting allowed: no by default:
- Merge authority: no:
- Exact start command:
- Concrete blocked reasons:

## Open Questions

- What current environment is this work item bound to?
- Is the work item safe for Codex implementation now?
- Are evidence recording and proof-only closeout explicitly allowed?
- Is browser/computer-use verification required?
- Are any files, routes, schemas, tools, hooks, plugins, app mappings, reports,
  or secret-handling surfaces forbidden beyond the defaults above?
- Does any publication, approval, retry, replay, or external posting require a
  separate user/Core decision before the future run proceeds?
