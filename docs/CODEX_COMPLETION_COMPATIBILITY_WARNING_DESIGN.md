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
- warning implementation now exists for the legacy helper commands:
  `codex:record-completion` and `codex:record-result` print stderr-only
  compatibility warnings on successful legacy writes

## 1. Purpose

This design inventories where Codex completion compatibility helpers are still
referenced and records the warning strategy used to steer users toward the
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
  `/api/actions/record`, prints the Temporal State Graph
  `external.<action>_recorded` confirmation, and emits a stderr compatibility
  warning on successful legacy writes.
- `apps/augnes_apps/scripts/codex-record-completion.ts` calls
  `recordActionResult`, so it uses the same legacy `/api/actions/record` path,
  then records `/api/work/{work_id}/events`, and emits a stderr compatibility
  warning on successful legacy writes.
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
- `README.md` points readers to the Session Adapter workflow, names
  `codex:record-completion-proof` as the preferred proof-only closeout path,
  and frames `codex:record-completion` plus `codex:record-result` as legacy
  compatibility.
- `.github/pull_request_template.md` tells users to record Augnes proof with
  `npm run codex:record-completion-proof` when possible and frames
  `codex:record-completion` as legacy compatibility.
- `docs/EXECUTION_SURFACE_RECORD.md` recommends
  `codex:record-completion-proof` for closeout proof and frames
  `codex:record-completion` as legacy compatibility.
- `docs/PHASE_2_HANDOFF_REVIEW_INTEGRATION_RUNBOOK.md` lists
  `npm run codex:record-completion-proof` as preferred proof-only closeout and
  frames `codex:record-completion` plus `codex:record-result` as legacy
  compatibility.
- `apps/augnes_apps/docs/CODEX_HANDOFF_DEMO.md` is a legacy
  `codex:record-result` demo and labels that helper as low-level legacy
  compatibility before instructing users to check for
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
- recent dogfood reports from PR #223, PR #226, PR #228, and PR #234

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

## 6. Remaining Legacy Helper Wording Boundaries

Current closeout docs and templates should name
`codex:record-completion-proof` first, label `codex:record-completion` and
`codex:record-result` as compatibility helpers, and keep legacy `external.*`
marker behavior framed as unresolved compatibility material.

Historical design memos, dogfood reports, and screenshots may still mention
older `external.*` marker observations. Those artifacts should not be edited
to rewrite history. Current runbooks should instead point new Codex closeouts
to `codex:record-completion-proof` and describe legacy helper warnings when a
compatibility path is intentionally used.

## 7. Warning Strategy For `codex:record-completion`

Keep behavior unchanged while warning operators on successful legacy writes.

Implemented warning content:

```text
Compatibility warning: codex:record-completion uses the legacy /api/actions/record path and may create external.* marker state. Prefer codex:record-completion-proof for proof-only closeout.
```

Implemented placement:

- print to stderr only after the successful legacy action-record and work-event
  write path
- do not print the compatibility warning on failure paths
- keep stdout free of warning text so existing stdout parsing remains stable
- keep exit codes unchanged
- do not require interactive confirmation
- do not suppress legacy marker behavior

Recommended operator wording:

- "compatibility warning" rather than "deprecated" until deprecation is
  explicitly approved
- "may create" if the runtime behavior can vary across older branches
- "prefer" rather than "must use" because compatibility remains supported

Do not make this warning conditional on environment variables. A bypass flag
would add policy surface before the team has approved a deprecation path.

## 8. Warning Strategy For `codex:record-result`

Keep behavior unchanged while warning operators on successful legacy writes.

Implemented warning content:

```text
Compatibility warning: codex:record-result is a low-level legacy compatibility helper for /api/actions/record and may create external.* marker state. Prefer codex:record-completion-proof for Codex closeout proof.
```

Implemented placement:

- print to stderr only after the successful legacy `/api/actions/record` write
- do not print the compatibility warning on failure paths
- keep stdout free of warning text so existing stdout parsing remains stable
- keep the existing Temporal State Graph confirmation because it remains true
  for the legacy path
- keep exit codes unchanged

The warning should make clear that `codex:record-result` is lower-level than
`codex:record-completion` and should not be advertised as a new proof-only
pattern.

## 9. Warning Form Decision

Current form: docs steering plus stderr-only CLI warnings on successful legacy
helper writes.

Do not add structured JSON warning fields yet.

Do not add staged deprecation notices yet.

### Docs-Only Warnings

Docs-only steering should happen first because it has no runtime blast radius.
The first docs-only follow-up could update the PR template, README,
`docs/EXECUTION_SURFACE_RECORD.md`, and
`docs/PHASE_2_HANDOFF_REVIEW_INTEGRATION_RUNBOOK.md` to name
`codex:record-completion-proof` first and label legacy helper use as
compatibility behavior.

### CLI Stderr Warnings

CLI stderr warnings are the implemented non-breaking runtime surface. They are
visible to human operators, easy to smoke test, and do not change stdout
payloads, API payloads, response shapes, or exit codes.

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

## 10. Implemented Warning And Docs Cleanup Path

PR #233 added non-breaking stderr-only compatibility warnings to:

- `apps/augnes_apps/scripts/codex-record-completion.ts`
- `apps/augnes_apps/scripts/codex-record-result.ts`

PR #234 dogfooded those warnings and found:

- warnings appear only on stderr
- warnings appear on successful legacy helper writes
- warnings do not appear in stdout
- stdout JSON-bearing lines remain parseable
- failure paths do not print compatibility warning text
- exit codes remain compatible
- legacy helpers retain `external.*` marker behavior
- `codex:record-completion-proof` remains unchanged and warning-free

Recommended current non-runtime step:

- update stale docs and templates to steer default closeout proof toward
  `codex:record-completion-proof`
- keep historical dogfood reports and screenshots unchanged
- keep docs smokes enforcing proof-only default wording in current closeout
  docs/templates

## 11. Risks Of Runtime Warnings

Risks:

- users may interpret "warning" as deprecation even though compatibility
  lifetime is unresolved
- scripts that compare exact stderr could need updates
- noisy output may obscure action IDs or work event IDs during closeout
- warnings could create pressure to migrate before deciding the future of
  `external.*` state markers
- adding warnings without docs cleanup leaves mixed guidance across repo
- adding structured warning fields could accidentally become an API/output
  contract

Mitigation:

- keep docs and templates aligned with the implemented warning behavior
- keep CLI warnings plain, non-fatal, and stderr-only
- avoid "deprecated" wording until a deprecation decision exists
- keep behavior, exit codes, and response shapes unchanged

## 12. Risks Addressed By Warning

The implemented warnings reduce these risks:

- users may keep using `codex:record-completion` by habit even when proof-only
  closeout is the preferred path
- new closeout proof may continue to create committed `external.*` state
  markers unintentionally
- reviewers may over-read legacy `external.*` markers as accepted project
  facts
- adoption of Work Brief, Evidence Pack, State Brief `recent_action_visibility`,
  and Session Trace `work_linked_proof_actions[]` may be slower
- future migration could be harder because legacy helper use remains invisible

Ongoing mitigation:

- fix current docs/templates first
- keep non-breaking helper warnings constrained to documented compatibility
  helpers
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
  later move behind another migration shape
- how long `codex:record-result` remains a low-level legacy compatibility
  helper
- whether an explicit state-marker helper is needed
- whether `external.*` remains active committed state, moves to a proof lane,
  or is treated only as historical compatibility data
- whether historical `external.*` records are ever migrated, hidden, or
  reclassified
- which review surface is primary for product documentation outside Codex
  closeout
- whether CLI warnings should remain stderr-only or become machine-readable
  later

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
