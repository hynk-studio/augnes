# First Run Validation

This checklist is for the first clean run after setup or after changes to the app surface.

## Commands

Run all local checks:

```bash
npm run typecheck
npm run smoke
npm run invariants
```

Expected results:

- TypeScript exits cleanly.
- Smoke checks pass for config, sanitizer, mock adapter reads, public tool names, and HTTP adapter unavailable errors.
- Invariants confirm the registered tool surface is exactly the intended nine read-only tools.

## Read-Only Contract

Confirm every public tool has:

- `readOnlyHint: true`
- `destructiveHint: false`
- `openWorldHint: false`
- task/job execution forbidden

The app must not add write, commit, action, automation, job, promote, apply, create, update, or delete tools.

## Sanitizer Contract

Confirm provider/session/auth/debug keys are stripped from returned payloads while Augnes IDs are preserved, including:

- `evidenceId`
- `claimId`
- `boundaryId`
- `casefileId`
- `snapshotId`
- `repoNodeId`
- `augnesId`
- `continuityId`

## Manual First Run

1. Start the app with `npm run dev`.
2. Open `http://localhost:8787/healthz`.
3. Confirm `readOnly` is `true`.
4. Connect Developer Mode to the HTTPS tunnel `/mcp` endpoint.
5. Call all nine tools and confirm each response is review-safe.

If any step exposes raw provider/session/auth/debug data or an unexpected tool, treat the run as failed.
