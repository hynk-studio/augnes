# Legacy Helper Warning Dogfood

Date: 2026-05-26

## 1. Scope

Dogfooded the stderr-only compatibility warnings added after PR #233 for:

- `codex:record-completion`
- `codex:record-result`

Also rechecked the preferred proof-only path:

- `codex:record-completion-proof`

This was report-only validation. No runtime behavior, helper behavior, schemas,
API routes, Cockpit UI, bridge health behavior, explicit state-marker helper,
legacy `external.*` migration, or helper conversion was changed.

## 2. Runtime setup

Branch: `codex/dogfood-legacy-helper-warnings`, created fresh from
`origin/main` after `git fetch origin`.

Temp runtime:

- DB path: `/tmp/augnes-legacy-warning-dogfood-3ESlsR/augnes.db`
- Init commands:
  - `AUGNES_DB_PATH=/tmp/augnes-legacy-warning-dogfood-3ESlsR/augnes.db npm run db:reset`
  - `AUGNES_DB_PATH=/tmp/augnes-legacy-warning-dogfood-3ESlsR/augnes.db npm run db:migrate`
  - `AUGNES_DB_PATH=/tmp/augnes-legacy-warning-dogfood-3ESlsR/augnes.db npm run demo:seed`
- Runtime command:
  - `AUGNES_DB_PATH=/tmp/augnes-legacy-warning-dogfood-3ESlsR/augnes.db npm run dev -- --port 3210 --webpack`
- Runtime URL: `http://127.0.0.1:3210`

The runtime used a temp SQLite DB outside the repository. No DB files,
screenshots, secrets, or tunnel URLs were committed.

## 3. Commands run

Repository checks:

- `npm run smoke:codex-record-completion-follow-up-refs` - passed
- `npm run smoke:codex-scope-env-consistency` - passed
- `npm run smoke:codex-closeout-docs` - passed
- `npm run smoke:codex-session-adapter-v2` - passed
- `npm run smoke:codex-helper-taxonomy` - passed
- `npm run smoke:codex-record-completion-proof-helper` - passed
- `npm run typecheck` - passed
- `npm --prefix apps/augnes_apps run typecheck` - passed

Runtime helper checks:

- `npm run codex:record-completion` against `AG-004` - helper exit code `0`
- `npm --prefix apps/augnes_apps run codex:record-result` - helper exit code `0`
- `npm run codex:record-completion-proof` against `AG-004` - helper exit code `0`
- `npm run codex:record-completion` with unknown `CODEX_WORK_ID` - helper exit code `1`
- `npm --prefix apps/augnes_apps run codex:record-result` with invalid `CODEX_RESULT_STATUS` - helper exit code `1`

Readback checks:

- Parsed stdout JSON payload lines from helper output.
- Queried the temp DB for dogfood `action_records`, `state_entries`,
  `state_transitions`, and `work_events`.
- Queried Work Brief, Evidence Pack, and State Brief from the temp runtime.

## 4. `codex:record-completion` stdout/stderr/exit-code findings

Command:

```bash
AUGNES_API_BASE_URL=http://127.0.0.1:3210 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-004 \
CODEX_SOURCE_AGENT_ID=agent:codex \
CODEX_ACTION_NAME=codex_legacy_warning_completion_dogfood \
CODEX_RESULT_SUMMARY="Dogfood legacy codex:record-completion stderr-only compatibility warning." \
CODEX_FILES_CHANGED="reports/dogfood/2026-05-26-legacy-helper-warning-dogfood.md" \
CODEX_RESULT_STATUS=completed \
CODEX_RESULT_KIND=verification \
CODEX_RELATED_STATE_KEYS="verification.legacy_helper_warnings" \
npm run codex:record-completion
```

Findings:

- Exit code: `0`
- stdout line count: `29`
- stderr line count: `1`
- stdout contained the normal npm banners and helper summary:
  - `Augnes Codex completion recorded`
  - `related_action_id: action:c53f193c-594b-4059-bb28-26825f6b98d8`
  - `work_event_id: work-event:adede2ad-a50a-49ac-9dd2-64aca1bf95ba`
  - `action_record_response: {...}`
  - `work_event_response: {...}`
- stderr contained exactly:

```text
Compatibility warning: codex:record-completion uses the legacy /api/actions/record path and may create external.* marker state. Prefer codex:record-completion-proof for proof-only closeout.
```

- `Compatibility warning:` did not appear in stdout.
- The action response retained the legacy committed marker:
  `external.codex_legacy_warning_completion_dogfood_recorded`.

## 5. `codex:record-result` stdout/stderr/exit-code findings

Command:

```bash
AUGNES_API_BASE_URL=http://127.0.0.1:3210 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-004 \
CODEX_SOURCE_AGENT_ID=agent:codex \
CODEX_ACTION_NAME=codex_legacy_warning_result_dogfood \
CODEX_RESULT_SUMMARY="Dogfood legacy codex:record-result stderr-only compatibility warning." \
CODEX_FILES_CHANGED="reports/dogfood/2026-05-26-legacy-helper-warning-dogfood.md" \
CODEX_RESULT_STATUS=completed \
CODEX_RESULT_KIND=verification \
npm --prefix apps/augnes_apps run codex:record-result
```

Findings:

- Exit code: `0`
- stdout line count: `14`
- stderr line count: `1`
- stdout contained the normal npm banner and helper summary:
  - `Augnes action record result`
  - `scope: project:augnes`
  - `action_name: codex_legacy_warning_result_dogfood`
  - `ids: {...}`
  - `raw_result: {...}`
- stderr contained exactly:

```text
Compatibility warning: codex:record-result is a low-level legacy compatibility helper for /api/actions/record and may create external.* marker state. Prefer codex:record-completion-proof for Codex closeout proof.
```

- `Compatibility warning:` did not appear in stdout.
- The action response retained the legacy committed marker:
  `external.codex_legacy_warning_result_dogfood_recorded`.

Note: `CODEX_WORK_ID` is not read by `codex:record-result` in this path. That
matches its current lower-level compatibility helper behavior.

## 6. Failure-path warning findings

`codex:record-completion` unknown work ID:

- Helper exit code: `1`
- stderr:

```text
CODEX_RECORD_COMPLETION_UNKNOWN_WORK_ID work_id=AG-DOES-NOT-EXIST scope=project:augnes body={"error":"Unknown work_id AG-DOES-NOT-EXIST for scope project:augnes."}
```

- No `Compatibility warning:` text appeared.
- Failure occurred after work preflight and before legacy action-record or work-event mutation.

`codex:record-result` invalid status:

- Helper exit code: `1`
- stderr:

```text
Invalid CODEX_RESULT_STATUS: not_a_status
```

- No `Compatibility warning:` text appeared.
- Failure occurred during local env validation before route calls.

The warning appears only on successful legacy helper write paths in these
checks.

## 7. Stdout parseability findings

The warning remains stderr-only and did not pollute stdout for either legacy
helper. A small Node parser successfully extracted and parsed stdout JSON
payload lines:

- `codex:record-completion`: parsed `action_record_response` and
  `work_event_response`.
- `codex:record-result`: parsed `raw_result`.
- `codex:record-completion-proof`: parsed `action_proof_response` and
  `work_event_response`.

Root `npm run` commands still include npm banner lines on stdout. Existing
line-oriented parsers that look for helper prefixes remain compatible because
the compatibility warning is not inserted into stdout.

## 8. Proof-only helper regression findings

Command:

```bash
AUGNES_API_BASE_URL=http://127.0.0.1:3210 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-004 \
CODEX_SOURCE_AGENT_ID=agent:codex \
CODEX_ACTION_NAME=codex_legacy_warning_proof_dogfood \
CODEX_RESULT_SUMMARY="Dogfood proof-only helper remains preferred and unchanged while legacy warnings exist." \
CODEX_FILES_CHANGED="reports/dogfood/2026-05-26-legacy-helper-warning-dogfood.md" \
CODEX_RESULT_STATUS=completed \
CODEX_RESULT_KIND=verification \
CODEX_RELATED_STATE_KEYS="verification.legacy_helper_warnings" \
npm run codex:record-completion-proof
```

Findings:

- Exit code: `0`
- stdout line count: `30`
- stderr line count: `0`
- stdout contained `Augnes Codex completion proof recorded`.
- stdout contained no `external.` marker text.
- stdout ended with the existing proof-only note:
  `This helper records proof-native action and work trace only; it does not use the legacy action-record state-marker path.`
- Created proof action:
  `action:3e1ef196-e3a9-487c-b91f-3f18f0b03a5b`
- Created linked work event:
  `work-event:99093212-de38-4b48-8b72-e88eee368e7a`

Temp DB readback:

- Proof action `state_key`: `null`
- Proof action `source_session_id`: `null`
- Linked work event `related_action_id` matched the proof action ID.
- No `external.codex_legacy_warning_proof_dogfood_recorded` state entry or
  transition was created.

## 9. Marker behavior findings

Dogfood action records in the temp DB:

- `codex_legacy_warning_completion_dogfood`
  - `state_key`: `external.codex_legacy_warning_completion_dogfood_recorded`
- `codex_legacy_warning_result_dogfood`
  - `state_key`: `external.codex_legacy_warning_result_dogfood_recorded`
- `codex_legacy_warning_proof_dogfood`
  - `state_key`: `null`

Dogfood `external.*` state entries and transitions existed only for the two
legacy helper actions. The proof-only helper did not create committed
`external.*` marker state.

State Brief readback showed the proof-only action in `recent_actions` with
`state_key: null` and listed it in
`recent_action_visibility.proof_only_action_ids`.

Work Brief readback showed the proof-only action in
`related_proof.action_records[]` with:

- `state_key: null`
- `proof_marker_type: proof_only`
- linked work event ID `work-event:99093212-de38-4b48-8b72-e88eee368e7a`

Evidence Pack readback showed:

- proof-only action ID included in
  `verification_trace.proof_visibility.proof_only_action_ids`
- linked work event ID included in
  `verification_trace.proof_visibility.linked_work_event_ids`
- committed marker action IDs included only the two legacy helper actions
  created during this dogfood run

## 10. Warning clarity assessment

The warnings are clear enough for the current compatibility phase.

- They clearly say the helpers are legacy or compatibility helpers.
- They clearly recommend `codex:record-completion-proof`.
- They do not say the legacy helpers are removed or deprecated.
- They do not imply migration has already happened.
- They do not require interactivity and do not change exit codes.
- Noise level felt acceptable: one stderr line per successful legacy helper
  invocation. The line is noticeable during closeout without interfering with
  stdout parsing.

Minor wording note for future consideration only: the warnings say
`external.* marker state`, while the design document proposed
`external.<action>_recorded committed state marker`. The implemented wording is
shorter and still accurate enough for non-breaking dogfood. I do not recommend
changing it in this report-only pass.

## 11. Non-breaking acceptability

The warnings are acceptable as non-breaking compatibility warnings.

Observed behavior stayed compatible:

- success exit codes remained `0`
- failure exit codes remained non-zero
- stdout shape remained stable enough for line-oriented parsing
- warning text stayed on stderr
- failure paths did not print compatibility warning text
- legacy helpers retained their legacy marker behavior
- proof-only helper retained proof-only behavior and emitted no warning

## 12. Compatibility migration deferral

Compatibility migration should still be deferred.

This dogfood run supports the PR #230 policy:

- keep `codex:record-completion` as legacy compatibility for now
- keep `codex:record-result` as low-level legacy compatibility for now
- keep `codex:record-completion-proof` as the preferred/default closeout proof
  path
- do not migrate legacy `external.*` records yet
- do not add an explicit state-marker helper yet
- do not convert legacy helpers to proof-only yet

The warnings give operators enough steering without changing committed-state
semantics under an existing helper name.

## 13. Recommended next step

Keep PR #233's stderr-only warning behavior as-is.

Recommended next goal: use the report findings to decide whether any remaining
docs that mention legacy helpers should add explicit compatibility context, but
do not combine that with helper behavior changes or `external.*` migration.

## 14. Skipped checks with concrete reasons

- Browser/Cockpit UI screenshot checks were skipped because this task was
  helper/runtime dogfood and explicitly forbade Cockpit UI changes. Runtime
  verification used helper commands plus read-only Work Brief, Evidence Pack,
  State Brief, and DB readback instead.
- ChatGPT Developer Mode and tunnel checks were skipped because this task did
  not require external Developer Mode validation and explicitly forbade secrets
  or tunnel URLs.
- A manual Session Trace bind against the temp runtime was skipped because
  `npm run smoke:codex-record-completion-proof-helper` already covered explicit
  binding and canonical `work_linked_proof_actions[]` visibility with the real
  route handlers. The runtime dogfood focused on warning compatibility and
  proof-only marker behavior.
- No draft PR was opened during this report-only dogfood pass; branch scope was
  kept local until the report artifact and final branch-scope checks completed.
