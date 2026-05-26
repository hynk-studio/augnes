# Codex Completion Compatibility Warning Design

## Status

- docs-only inventory and warning design
- no runtime behavior change
- no helper behavior change
- no package script change
- no schema change
- no API route change
- no Cockpit UI change
- no bridge health behavior change
- no explicit state-marker helper added
- no legacy `external.*` migration
- no compatibility helper conversion
- no warning implementation added

## 1. Purpose

This design inventories where Codex completion compatibility helpers are still
referenced and proposes how Augnes should warn or steer users toward the
proof-only closeout path without changing current helper behavior.

The goal is to reduce accidental use of legacy state-marker helpers while
preserving compatibility for callers that still intentionally use
`codex:record-completion` or `codex:record-result`.

## 2. Current Compatibility Policy

`docs/CODEX_COMPLETION_COMPATIBILITY_TRANSITION_PLAN.md` is the source policy:

- keep `codex:record-completion` as legacy compatibility for now
- keep `codex:record-result` as low-level legacy compatibility for now
- treat `codex:record-completion-proof` as the preferred/default Codex
  closeout proof path
- do not migrate legacy `external.*` records yet
- do not add an explicit state-marker helper yet
- do not convert `codex:record-completion` to proof-only yet
- defer behavior-changing compatibility migration until a separate explicit
  decision

The preferred proof path is `codex:record-completion-proof`, which uses
`/api/actions/record-proof`, creates proof-only `action_records` with
`state_key: null`, links `work_events`, and records coordination trace without
new committed `external.*` state markers.

## 3. Inventory Of Legacy Helper References

Inventory command:

```bash
rg "codex:record-completion|codex:record-result|codex:record-completion-proof|/api/actions/record|/api/actions/record-proof|external\.|legacy compatibility|preferred closeout proof" .
```

Script entry points:

- `package.json` exposes root `codex:record-completion` and
  `codex:record-completion-proof`.
- `apps/augnes_apps/package.json` exposes `codex:record-result`,
  `codex:record-completion`, and `codex:record-completion-proof`.
- `apps/augnes_apps/scripts/codex-record-result.ts` posts to
  `/api/actions/record` and prints the Temporal State Graph
  `external.<action>_recorded` confirmation.
- `apps/augnes_apps/scripts/codex-record-completion.ts` calls
  `recordActionResult`, so it uses the same legacy `/api/actions/record` path,
  then records `/api/work/{work_id}/events`.
- `apps/augnes_apps/scripts/codex-record-completion-proof.ts` uses the
  proof-only `/api/actions/record-proof` path.

Policy and taxonomy references:

- `docs/DECISION_PROOF_VS_STATE_BOUNDARY_V0_1.md` records the accepted Option C
  direction and lists unresolved migration decisions.
- `docs/CODEX_HELPER_COMMAND_TAXONOMY.md` classifies
  `codex:record-completion` and `codex:record-result` as compatibility proof
  helpers.
- `docs/CODEX_COMPLETION_COMPATIBILITY_TRANSITION_PLAN.md` contains the
  current compatibility policy and future migration requirements.

Workflow and runbook references:

- `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md` recommends
  `codex:record-completion-proof` and keeps `codex:record-completion` as a
  compatibility path.
- `docs/CODEX_HANDOFF_PACKET.md` lists the proof helper as preferred and says
  to use `codex:record-completion` only as compatibility behavior.
- `apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md` recommends
  proof-only completion, then documents compatibility completion behavior.
- `README.md` still points readers to the Codex Session Adapter workflow and
  names `codex:record-completion` without naming the proof-only helper.
- `.github/pull_request_template.md` still tells users to record Augnes proof
  with `npm run codex:record-completion`.
- `docs/EXECUTION_SURFACE_RECORD.md` still mentions recording completion
  through `npm run codex:record-completion`.
- `docs/PHASE_2_HANDOFF_REVIEW_INTEGRATION_RUNBOOK.md` lists
  `npm run codex:record-completion` as a proof recording option.
- `apps/augnes_apps/docs/CODEX_HANDOFF_DEMO.md` remains a legacy
  `codex:record-result` demo and instructs users to check for
  `external.<action_name>_recorded`.

Read-model and smoke references:

- `lib/state/brief.ts` already steers Codex closeout proof toward
  `/api/actions/record-proof` or `codex:record-completion-proof`.
- `lib/evidence-pack.ts` labels legacy committed marker action records as
  compatibility markers.
- `scripts/smoke-codex-helper-taxonomy.mjs` enforces that only the documented
  compatibility helpers use the legacy action-record path.
- `scripts/smoke-codex-record-completion-follow-up-refs.mjs` still exercises
  `codex:record-completion`.
- `scripts/smoke-codex-scope-env-consistency.mjs` still exercises
  `codex:record-result`.
- `scripts/smoke-codex-record-completion-proof-helper.mjs` blocks proof-only
  closeout from calling `/api/actions/record`.

Historical artifacts:

- Dogfood reports under `reports/dogfood/` intentionally preserve historical
  observations and should not be edited to rewrite history.
- `screenshots/README.md` references old screenshots showing legacy
  `external.*` completion proof. This is historical artifact documentation,
  not current closeout guidance.

## 4. Inventory Of Preferred Proof Helper References

Preferred proof helper references are already present in:

- `package.json`
- `apps/augnes_apps/package.json`
- `apps/augnes_apps/scripts/codex-record-completion-proof.ts`
- `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md`
- `docs/CODEX_HANDOFF_PACKET.md`
- `apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md`
- `docs/CODEX_COMPLETION_COMPATIBILITY_TRANSITION_PLAN.md`
- `docs/CODEX_HELPER_COMMAND_TAXONOMY.md`
- `docs/AUTHORITY_MATRIX.md`
- `lib/state/brief.ts`
- `scripts/smoke-codex-closeout-docs.mjs`
- `scripts/smoke-codex-helper-taxonomy.mjs`
- `scripts/smoke-codex-record-completion-proof-helper.mjs`
- recent dogfood reports from PR #223, PR #226, and PR #228

The strongest current guidance appears in the Session Adapter workflow,
handoff packet, completion protocol, state brief instructions, helper taxonomy,
and transition plan.

## 5. Places Already Steering Users To `codex:record-completion-proof`

These surfaces already steer new workflows toward the proof-only helper:

- `docs/CODEX_COMPLETION_COMPATIBILITY_TRANSITION_PLAN.md`: states
  `codex:record-completion-proof` is preferred/default closeout proof.
- `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md`: uses proof-only completion in
  the closeout flow and labels `codex:record-completion` compatibility.
- `docs/CODEX_HANDOFF_PACKET.md`: lists the preferred completion command as
  `codex:record-completion-proof`.
- `apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md`: says to prefer
  proof-only completion recording and to use compatibility behavior only when
  explicitly understood.
- `lib/state/brief.ts`: tells agents to prefer `/api/actions/record-proof` or
  `codex:record-completion-proof` so proof remains separate from committed
  state.
- `scripts/smoke-codex-record-completion-proof-helper.mjs`: proves the
  proof-only helper avoids legacy action-record posts and `external.*`
  markers.

## 6. Places Where Legacy Helper Wording May Still Be Confusing

These references may still steer users toward legacy helper behavior without
enough context:

- `.github/pull_request_template.md`: completion reminder names
  `npm run codex:record-completion` rather than the proof-only helper.
- `README.md`: Codex-side usage mentions `codex:record-completion` but not
  `codex:record-completion-proof`.
- `docs/EXECUTION_SURFACE_RECORD.md`: completion recording example names
  `codex:record-completion`.
- `docs/PHASE_2_HANDOFF_REVIEW_INTEGRATION_RUNBOOK.md`: proof may be recorded
  with `npm run codex:record-completion`.
- `apps/augnes_apps/docs/CODEX_HANDOFF_DEMO.md`: demo centers
  `codex:record-result` and `external.<action_name>_recorded`; this is useful
  as a legacy demo but should be labeled as such before new users rely on it.
- `apps/augnes_apps/scripts/codex-record-completion.ts`: stdout says the
  helper records "completion proof and trace notes only"; it does not mention
  the legacy committed `external.*` marker side effect.
- `apps/augnes_apps/scripts/codex-record-result.ts`: stdout clearly mentions
  the `external.<action>_recorded` graph marker, but it does not label itself
  as legacy compatibility or point to `codex:record-completion-proof`.

This design does not edit those files. It identifies them as candidates for a
future docs-only steering PR or an approved warning implementation PR.

## 7. Proposed Warning Strategy For `codex:record-completion`

Keep behavior unchanged unless a separate implementation PR is approved.

Recommended warning content:

```text
Compatibility warning: codex:record-completion uses the legacy /api/actions/record path and may create an external.<action>_recorded committed state marker. For default Codex closeout proof, prefer codex:record-completion-proof.
```

Recommended placement if approved:

- print near the start of the helper before POSTing to `/api/actions/record`
- print again in the closeout summary only if the action record succeeds
- keep stdout warning non-fatal
- keep exit codes unchanged
- do not require interactive confirmation
- do not suppress legacy marker behavior

Recommended operator wording:

- "compatibility warning" rather than "deprecated" until deprecation is
  explicitly approved
- "may create" if the runtime behavior can vary across older branches
- "prefer" rather than "must use" because compatibility remains supported

Do not make this warning conditional on environment variables in the first
implementation. A bypass flag would add policy surface before the team has
approved a deprecation path.

## 8. Proposed Warning Strategy For `codex:record-result`

Keep behavior unchanged unless a separate implementation PR is approved.

Recommended warning content:

```text
Compatibility warning: codex:record-result is the low-level legacy action-record helper. It posts to /api/actions/record and may create an external.<action>_recorded committed state marker. For Codex closeout proof, prefer codex:record-completion-proof.
```

Recommended placement if approved:

- print before POSTing to `/api/actions/record`
- keep the existing Temporal State Graph confirmation because it remains true
  for the legacy path
- add a proof-only alternative in the summary output
- keep stdout warning non-fatal
- keep exit codes unchanged

The warning should make clear that `codex:record-result` is lower-level than
`codex:record-completion` and should not be advertised as a new proof-only
pattern.

## 9. Warning Form Decision

Recommended now: docs-only and smoke-enforced documentation warnings.

Recommended later, if approved: CLI stdout warnings.

Do not add structured JSON warning fields yet.

Do not add staged deprecation notices yet.

### Docs-Only Warnings

Docs-only steering should happen first because it has no runtime blast radius.
The first docs-only follow-up could update the PR template, README,
`docs/EXECUTION_SURFACE_RECORD.md`, and
`docs/PHASE_2_HANDOFF_REVIEW_INTEGRATION_RUNBOOK.md` to name
`codex:record-completion-proof` first and label legacy helper use as
compatibility behavior.

### CLI Stdout Warnings

CLI stdout warnings are the smallest future runtime implementation if warning
behavior is approved. They are visible to human operators, easy to smoke test,
and do not change API payloads, response shapes, or exit codes.

### Structured JSON Warning Fields

Structured fields should be deferred. Adding fields to helper output or API
responses can affect parsers and snapshots. It also risks looking like a route
contract change rather than a human-facing warning.

### Smoke-Enforced Documentation Warnings

Smoke enforcement is appropriate for docs-only steering. A future smoke can
assert that the PR template and closeout docs mention
`codex:record-completion-proof` before `codex:record-completion`, and that
legacy helpers are labeled compatibility behavior.

### Staged Deprecation Notices

Deprecation language should wait. The current policy keeps compatibility
helpers available and does not decide migration timing, alias behavior, or
legacy `external.*` treatment.

## 10. Recommended First Implementation Step

If warning behavior is approved, the smallest future implementation PR should
add non-breaking CLI stdout warnings to:

- `apps/augnes_apps/scripts/codex-record-completion.ts`
- `apps/augnes_apps/scripts/codex-record-result.ts`

The PR should also add focused smoke assertions that:

- both helpers still call `/api/actions/record`
- both helpers keep current exit-code behavior
- both helpers still create or expect the legacy marker path as today
- warning text points to `codex:record-completion-proof`
- proof-only helper output remains free of legacy `external.*` marker language

No implementation should be added until this warning design is reviewed and
approved.

Recommended first non-runtime step:

- update stale docs and templates to steer default closeout proof toward
  `codex:record-completion-proof`
- keep historical dogfood reports and screenshots unchanged
- add a docs smoke that enforces proof-only default wording in current closeout
  docs/templates

## 11. Risks Of Adding Runtime Warnings Too Early

Risks:

- users may interpret "warning" as deprecation even though compatibility
  lifetime is unresolved
- scripts that compare exact stdout could need updates
- noisy output may obscure action IDs or work event IDs during closeout
- warnings could create pressure to migrate before deciding the future of
  `external.*` state markers
- adding warnings without docs cleanup leaves mixed guidance across repo
- adding structured warning fields could accidentally become an API/output
  contract

Mitigation:

- start with docs-only steering
- keep any later CLI warning plain, non-fatal, and stdout-only
- avoid "deprecated" wording until a deprecation decision exists
- keep behavior, exit codes, and response shapes unchanged

## 12. Risks Of Never Warning

Risks:

- users may keep using `codex:record-completion` by habit even when proof-only
  closeout is the preferred path
- new closeout proof may continue to create committed `external.*` state
  markers unintentionally
- reviewers may over-read legacy `external.*` markers as accepted project
  facts
- adoption of Work Brief, Evidence Pack, State Brief `recent_action_visibility`,
  and Session Trace `work_linked_proof_actions[]` may be slower
- future migration could be harder because legacy helper use remains invisible

Mitigation:

- fix current docs/templates first
- use non-breaking helper warnings only after approval
- keep taxonomy smoke coverage constraining the legacy path to documented
  compatibility helpers

## 13. Compatibility Constraints

Any future warning implementation must preserve these constraints:

- no migration of legacy `external.*` records
- no conversion of `codex:record-completion` to proof-only
- no conversion or removal of `codex:record-result`
- no new explicit state-marker helper
- no route/schema/package/UI changes
- no Cockpit or bridge health changes
- no changed exit codes unless explicitly approved
- no changed request payloads or API response shapes
- no auto-created sessions
- no auto-bound sessions
- no `source_session_id` behavior change
- no change to proof-only closeout marker guardrails

## 14. What Remains Unresolved

These decisions remain open:

- whether `codex:record-completion` should eventually become proof-only
- whether `codex:record-completion` should warn forever, warn temporarily, or
  remain silent
- how long `codex:record-result` remains a low-level legacy compatibility
  helper
- whether an explicit state-marker helper is needed
- whether `external.*` remains active committed state, moves to a proof lane,
  or is treated only as historical compatibility data
- whether historical `external.*` records are ever migrated, hidden, or
  reclassified
- which review surface is primary for product documentation outside Codex
  closeout
- whether CLI warnings should be stdout-only or also machine-readable later

This design intentionally does not resolve those migration decisions.

## 15. Suggested Acceptance Checks For A Future Implementation PR

For a docs-only steering PR:

- `npm run smoke:codex-closeout-docs`
- `npm run smoke:codex-session-adapter-v2`
- `npm run smoke:codex-helper-taxonomy`
- assert current closeout templates mention `codex:record-completion-proof`
  before compatibility helpers
- assert legacy helper mentions include "compatibility"

For a CLI warning PR:

- `npm run smoke:codex-helper-taxonomy`
- `npm run smoke:codex-record-completion-follow-up-refs`
- `npm run smoke:codex-scope-env-consistency`
- `npm run smoke:codex-record-completion-proof-helper`
- assert `codex:record-completion` warning text is present and non-fatal
- assert `codex:record-result` warning text is present and non-fatal
- assert `codex:record-completion-proof` still does not mention or create
  `external.*` markers
- assert legacy helpers still use `/api/actions/record`
- assert proof-only helper still uses `/api/actions/record-proof`
- assert marker guardrails remain unchanged for proof-only closeout:
  `state_entries_delta: 0`, `state_transitions_delta: 0`,
  `external_state_entries_delta: 0`, `proof_action_record_state_key: null`,
  and `legacy_action_record_posts: 0`
