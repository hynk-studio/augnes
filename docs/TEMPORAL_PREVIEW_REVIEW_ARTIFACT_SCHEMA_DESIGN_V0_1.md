# TemporalPreviewReviewArtifact Schema Design v0.1

## Executive summary

`TemporalPreviewReviewArtifact` is a future bounded review artifact for
captured Temporal Preview outputs. It is not committed state, not
`PerspectiveSnapshot` persistence, not `RawEpisodeBundle` runtime, and not
approval, publish, replay, or state-commit authority.

When implemented, review artifacts must bind to
`work_id=AG-TEMPORAL-INTERPRETATION` when that seeded demo/runtime work item is
available, or to a reviewed future Temporal work anchor if the project
explicitly creates one later.

This document is schema design only. It is no implementation: no DB schema,
migrations, API routes, runtime persistence, Cockpit code, ChatGPT App tools,
OpenAI calls, GitHub publication adapter calls, replay, publish, approval, or
state mutation are added here.

Implementation status: the first narrow read-model slice now exists after this
design. It adds the `temporal_preview_review_artifacts` table, validation/read
helper, and read-only list/get APIs. It does not add create/capture routes,
Cockpit rendering, Evidence Pack integration, ChatGPT App tools, OpenAI calls,
GitHub publication adapter calls, replay, publish, approval, state mutation,
`PerspectiveSnapshot` runtime, or `RawEpisodeBundle` runtime.

Forbidden-persistence fixture status: a reusable fixture corpus now exists at
`lib/temporal-review-artifact-fixtures.ts`, with a dedicated smoke at
`scripts/smoke-temporal-forbidden-persistence-fixtures.mjs`. This is a gate
before any future capture helper or create route. It exercises the current
smoke-only insert helper and does not add create/capture routes, Cockpit code,
Evidence Pack integration, ChatGPT App tools, OpenAI calls, GitHub publication
adapter calls, replay, publish, approval, or state mutation.

Internal capture helper status: a non-public helper now exists at
`lib/temporal-review-artifact-capture.ts`, with smoke coverage at
`scripts/smoke-temporal-review-artifact-capture-helper.mjs`. It converts a
bounded Temporal Preview response plus manual review metadata into a
`TemporalPreviewReviewArtifactInput` for existing validation. It does not add a
public create/capture route, Cockpit code, Evidence Pack integration, ChatGPT
App tools, OpenAI calls, GitHub publication adapter calls, replay, publish,
approval, state mutation, `PerspectiveSnapshot` runtime, or
`RawEpisodeBundle` runtime.

This design builds on:

- `docs/TEMPORAL_INTERPRETATION_PERSISTENCE_DESIGN_V0_1.md`
- `docs/TEMPORAL_INTERPRETATION_WORK_AND_EVIDENCE_BINDING.md`
- `docs/TEMPORAL_INTERPRETATION_V0_2_STATUS_AND_ROADMAP.md`
- `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md`
- `docs/TEMPORAL_INTERPRETATION_COCKPIT_SCREENSHOT_VALIDATION.md`
- `docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md`

## Artifact purpose

The artifact exists to preserve bounded review context for captured Temporal
Preview output:

- Captured preview metadata.
- Bounded preview output.
- Guardrail result.
- Manual review verdict.
- Source, evidence, counterexample, and residual tension refs.
- Admission decisions.
- Links to structured evidence records.
- Links to session, work, and PR context.

It supports review, audit, comparison, and future schema evolution. It does not
support durable memory admission, committed state, approval, publication,
replay, routing authority, or proof authority.

## Non-authority boundary

Persisting a future `TemporalPreviewReviewArtifact` must not:

- Commit or reject Augnes state.
- Approve a `PerspectiveSnapshot`.
- Publish proof.
- Replay delivery.
- Create or ingest a `RawEpisodeBundle`.
- Treat OpenAI output as source of truth.
- Treat Cockpit DOM state as truth.
- Convert summary-only refs into evidence anchors.
- Convert `guardrail_passed` into approval.
- Convert `reviewer_verdict` into approval.
- Convert `active_context_admission.decisions` into automatic memory admission.

Review artifacts can say what was captured, what guardrails reported, and what a
manual reviewer concluded. They cannot decide what is durable.

## Proposed table: temporal_preview_review_artifacts

This table is conceptual only and may change before migration. It is not a DB
contract in this PR.

| Field | Conceptual type | Notes |
| --- | --- | --- |
| `artifact_id` | `TEXT PRIMARY KEY` | Stable artifact identity. |
| `scope` | `TEXT NOT NULL DEFAULT project:augnes` | Scope, normally `project:augnes`. |
| `work_id` | `TEXT NOT NULL` | Must bind to `AG-TEMPORAL-INTERPRETATION` or a reviewed future Temporal work anchor. |
| `source_route` | `TEXT NOT NULL` | Route string such as `/api/temporal-interpretation/preview`; not an invocation action. |
| `source_surface` | `TEXT NOT NULL` | Capture surface such as `local_runtime`, `cockpit`, `docs`, or `codex`. |
| `source_ref` | `TEXT` | Optional source pointer, report path, or target ref. |
| `generator` | `TEXT NOT NULL` | Observed generator, such as `mock`, `openai`, or `mock_fallback`. |
| `model` | `TEXT` | Safe model name when present. |
| `as_of` | `TEXT NOT NULL` | Preview as-of timestamp. |
| `capture_mode` | `TEXT NOT NULL` | Allowed: `mock`, `openai`, `mock_fallback`, `route_capture`, `cockpit_capture`. |
| `preview_excerpt` | `TEXT NOT NULL` | Bounded human-readable excerpt. |
| `bounded_preview_json` | `TEXT NOT NULL` | Bounded/redacted structured preview subset. |
| `preview_hash` | `TEXT` | Optional hash of bounded preview payload for comparison. |
| `source_refs` | `TEXT NOT NULL DEFAULT []` | JSON array of source refs. |
| `evidence_anchor_refs` | `TEXT NOT NULL DEFAULT []` | JSON array of evidence anchors only. |
| `summary_refs` | `TEXT NOT NULL DEFAULT []` | JSON array of summary-only refs only. |
| `counterexample_refs` | `TEXT NOT NULL DEFAULT []` | JSON array of counterexample refs. |
| `residual_tension_refs` | `TEXT NOT NULL DEFAULT []` | JSON array of residual tension refs. |
| `admission_decisions_json` | `TEXT NOT NULL DEFAULT []` | Bounded admission decisions from preview output. |
| `guardrail_passed` | `INTEGER NOT NULL` | Boolean-shaped result from deterministic guardrails. |
| `guardrail_warnings_json` | `TEXT NOT NULL DEFAULT []` | JSON array of bounded warnings. |
| `reviewer_verdict` | `TEXT NOT NULL` | Allowed: `pass`, `pass_with_notes`, `fail`, `not_reviewed`. |
| `reviewer_notes` | `TEXT` | Optional bounded human notes. |
| `manual_review_report_path` | `TEXT` | Optional committed report path. |
| `linked_evidence_record_ids` | `TEXT NOT NULL DEFAULT []` | JSON array of structured evidence IDs. |
| `linked_session_id` | `TEXT` | Optional existing session row ID. |
| `linked_pr_url` | `TEXT` | Optional PR URL. |
| `redaction_status` | `TEXT NOT NULL` | Allowed: `redacted`, `bounded`, `raw_disallowed`. |
| `created_by` | `TEXT NOT NULL` | Capturing actor or helper. |
| `created_at` | `TEXT NOT NULL` | Creation timestamp. |
| `updated_at` | `TEXT NOT NULL` | Last update timestamp. |

## Field authority classification

Identity fields:

- `artifact_id`
- `scope`
- `work_id`

Source/capture metadata:

- `source_route`
- `source_surface`
- `source_ref`
- `generator`
- `model`
- `as_of`
- `capture_mode`
- `created_by`
- `created_at`
- `updated_at`

Bounded preview fields:

- `preview_excerpt`
- `bounded_preview_json`
- `preview_hash`

Refs fields:

- `source_refs`
- `evidence_anchor_refs`
- `summary_refs`
- `counterexample_refs`
- `residual_tension_refs`
- `admission_decisions_json`

Guardrail fields:

- `guardrail_passed`
- `guardrail_warnings_json`

Review fields:

- `reviewer_verdict`
- `reviewer_notes`
- `manual_review_report_path`

Linkage fields:

- `linked_evidence_record_ids`
- `linked_session_id`
- `linked_pr_url`

Redaction fields:

- `redaction_status`

Prohibited authority fields are forbidden fields and must not be added to this
table. If future work needs approval, publication, replay, commit, or memory
admission authority, it belongs in a separate approval-gated design.

## Required constraints and validation

Future implementation must validate:

- `work_id` must be `AG-TEMPORAL-INTERPRETATION` or a reviewed future Temporal
  work anchor.
- `bounded_preview_json` must be bounded and redacted before persistence.
- Raw full OpenAI response must not be stored.
- `summary_refs` must not be stored as `evidence_anchor_refs`.
- `reviewer_verdict` must not equal approval and must not be interpreted as
  approval.
- `guardrail_passed` must not equal state commit, readiness, approval, publish,
  or replay authority.
- `linked_evidence_record_ids` must refer to structured evidence records if
  persisted.
- `linked_session_id` is optional and must reference an existing session row if
  used.
- `source_route` must be a route string, not an invocation action or command.
- `capture_mode` must be explicit and one of the allowed values.
- `redaction_status` must be explicit and one of the allowed values.
- `source_refs`, `evidence_anchor_refs`, `summary_refs`,
  `counterexample_refs`, `residual_tension_refs`,
  `admission_decisions_json`, `guardrail_warnings_json`, and
  `linked_evidence_record_ids` must parse as bounded JSON arrays.
- `manual_review_report_path`, when present, must point to a committed bounded
  report path, not a raw capture under `/tmp`.

## Forbidden persisted content

Forbidden fields:

- `approval_status`
- `publish_status`
- `replay_status`
- `commit_status`
- `memory_admission_status`
- `durable_perspective_snapshot_id`
- `raw_openai_response`
- `secret_material`
- `cockpit_dom_as_truth`
- `safe_next_step_instruction`
- `user_preference_as_readiness`
- `summary_only_ref_as_evidence`

These fields belong either nowhere, or in future separate approval-gated
designs. In particular:

- `raw_openai_response` forbidden means full model responses are never stored in
  this review artifact table.
- `approval_status` forbidden and `publish_status` forbidden keep review
  artifacts separate from Core-gated approval/publication.
- `memory_admission_status` forbidden keeps preview review separate from
  durable memory admission.
- `safe_next_step_instruction` forbidden keeps generated next-step language as
  review text only, not instruction authority.

## Redaction and bounding policy

Future capture must store the smallest bounded subset needed for review:

- Prefer `preview_excerpt` plus `bounded_preview_json`.
- Store refs as typed arrays, not raw surrounding payloads.
- Store guardrail warnings as bounded strings/objects.
- Store manual notes as bounded review notes.
- Store report paths only when the report is committed and intentionally
  redacted.
- Do not store raw route capture files from `/tmp`.
- Do not store API keys, `.env` content, local tunnel URLs, private browser
  data, raw screenshots, raw DOM dumps, or raw full model responses.

`redaction_status` must be explicit:

- `redacted`: sensitive or raw-only fields were removed.
- `bounded`: the capture source was already bounded to the reviewed shape.
- `raw_disallowed`: raw source existed but was intentionally not stored.

## Work, evidence, session, and PR linkage

The default work linkage is:

```text
work_id=AG-TEMPORAL-INTERPRETATION
scope=project:augnes
```

Future rows should link to structured evidence by
`linked_evidence_record_ids`, not by summary-only text. Evidence records remain
bounded observation records and do not grant review artifacts authority.

`linked_session_id` is optional. When present, it must reference an existing
session row and must not create a session automatically.

`linked_pr_url` is optional and should be a human review link to the PR that
captured, reviewed, or introduced the artifact. A PR link is not proof
publication authority and is not a GitHub publication adapter call.

Manual reports can be linked with `manual_review_report_path`, such as
`docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md`.

## Read APIs

Read-only list/get APIs:

```text
GET /api/temporal-interpretation/review-artifacts?scope=...&work_id=...
GET /api/temporal-interpretation/review-artifacts/{artifact_id}
```

Read APIs must:

- Return bounded artifacts only.
- Support list/get review and comparison.
- Surface gaps when no artifacts exist.
- Not create artifacts.
- Not call OpenAI.
- Not call GitHub.
- Not approve, publish, replay, commit, or mutate state.
- Not treat an artifact as `PerspectiveSnapshot` runtime.

## Future create/capture workflow

Future create/capture APIs, conceptual only:

```text
POST /api/temporal-interpretation/review-artifacts
POST /api/temporal-interpretation/preview/{preview_id}/review-artifact
```

Do not implement now.

The current non-public capture helper is an internal conversion step only. It
builds bounded artifact input and leaves persistence to existing internal smoke
validation or a future reviewed private/public insert path. It is not a route
and does not grant write authority to any external surface.

Future create/capture must:

- Persist only a bounded review artifact after validation.
- Require explicit `capture_mode`.
- Require explicit `redaction_status`.
- Reject raw full OpenAI response.
- Reject forbidden fields.
- Validate summary/evidence separation.
- Validate work/evidence/session refs.
- Preserve manual review verdict without turning it into approval.

Future create/capture must not:

- Call OpenAI by itself unless separately approved.
- Approve, publish, replay, or commit state.
- Create `PerspectiveSnapshot` runtime.
- Create `RawEpisodeBundle` runtime.
- Create Cockpit write authority.
- Add ChatGPT App write tools.

## Indexing and query needs

Conceptual indexes:

- `(scope, work_id, created_at DESC)`
- `(scope, generator, created_at DESC)`
- `(scope, reviewer_verdict, created_at DESC)`
- `(scope, guardrail_passed, created_at DESC)`
- `(scope, linked_session_id, created_at DESC)`
- `(scope, linked_pr_url, created_at DESC)`

Query use cases:

- List recent artifacts for `AG-TEMPORAL-INTERPRETATION`.
- Compare mock vs OpenAI captures.
- Find failed or warning-bearing artifacts.
- Fetch artifacts linked to a session or PR.
- Show artifacts in Evidence Pack.

## Evidence Pack integration design

Future Evidence Pack should show:

- Review artifact count.
- Latest artifact verdict.
- Latest guardrail status.
- Linked evidence IDs.
- Linked manual review report path.
- Gaps if no artifacts exist.
- No automatic authority inference.

Evidence Pack integration must remain read-only. It may summarize matching
review artifacts for `AG-TEMPORAL-INTERPRETATION`, but it must not infer
approval, publication readiness, replay status, committed state, or memory
admission from artifact presence.

## Cockpit design

Future Cockpit should eventually:

- List review artifacts read-only.
- Show latest artifact summary.
- Show linked reports.
- Show gaps.
- Not create, approve, commit, replay, publish, or mutate artifacts.
- Not treat artifacts as `PerspectiveSnapshot`.
- Not treat Cockpit DOM as source of truth.

## Migration strategy

Implementation sequence status:

1. Schema migration PR for `temporal_preview_review_artifacts` only. Complete.
2. Type/library helper. Complete for validation/read/list and smoke-only insert.
3. Read-only list/get APIs. Complete.
4. Smoke with temp DB. Complete.
5. Forbidden-persistence fixture corpus and smoke. Complete.
6. Non-public capture helper and smoke. Complete.
7. Evidence Pack read-only integration.
8. Cockpit read-only browser.

Do not combine with:

- `PerspectiveSnapshotCandidate`.
- `RawEpisodeBundleRef`.
- Approval commit flow.
- OpenAI corpus expansion.
- ChatGPT App tools.
- Cockpit write controls.

Rollback/export note for the future migration PR:

- Include a rollback plan for the new table.
- Include an export shape for bounded artifacts before destructive rollback.
- Keep raw captures outside the table so rollback does not need secret cleanup.

## Smoke and test requirements

Before implementation, design smoke should verify this document exists and
includes the conceptual table name, artifact name, work anchor, forbidden
fields, bounded preview fields, reviewer fields, linkage fields, Evidence Pack
integration, read-only list/get APIs, and no implementation boundary.

Read-model implementation smoke uses a temporary DB outside the repo and
confirms:

- Migration creates only `temporal_preview_review_artifacts`.
- Insert helper rejects forbidden fields.
- Insert helper rejects `raw_openai_response`.
- Insert helper rejects summary-only refs in evidence anchors.
- Read-only list/get returns bounded rows.
- Protected authority rows are not mutated.
- No OpenAI calls occur.
- No GitHub publication adapter calls occur.
- No replay, publish, approval, or state commit occurs.

Forbidden-persistence fixture smoke uses a temporary DB outside the repo and
confirms:

- The valid fixture inserts once against `AG-TEMPORAL-INTERPRETATION`.
- Top-level forbidden fields are rejected.
- Nested forbidden fields in bounded preview, admission decisions, and
  guardrail warnings are rejected.
- Summary/evidence separation fixtures are rejected.
- Authority-confusion values are rejected.
- Missing session and evidence links are rejected.
- Route/source validation fixtures are rejected.
- No forbidden fixture creates a row.
- Protected authority rows are not mutated.
- No fetch, OpenAI, GitHub publication adapter, replay, publish, or approval
  behavior occurs.

Capture-helper smoke uses a temporary DB outside the repo and confirms:

- A bounded mock Temporal Preview response converts into valid artifact input.
- The pure helper does not write to the DB by default.
- Existing insert validation accepts the returned input.
- Bounded preview JSON, active-context admission decisions, guardrail result,
  refs, and manual review metadata are preserved.
- Capture-specific forbidden cases are rejected.
- The reusable forbidden-persistence corpus remains rejected through capture
  output.
- Read-only list/get APIs still read the inserted artifact.
- No POST route, public write surface, protected authority row mutation, fetch,
  OpenAI call, GitHub publication adapter call, replay, publish, or approval
  behavior is added.

## Acceptance gates before implementation

Required gates:

- `AG-TEMPORAL-INTERPRETATION` seeded.
- Persistence design merged.
- Work/evidence binding merged.
- Route review report exists.
- Cockpit validation exists.
- OpenAI validation exists.
- No-secret policy confirmed.
- Forbidden-persistence fixtures added.
- Non-public capture helper added.
- Migration rollback/export note planned.
- No automatic commit smoke plan.
- Explicit decision to implement review artifacts only, not
  `PerspectiveSnapshotCandidate`, `RawEpisodeBundleRef`, approval commit flow,
  or OpenAI corpus expansion.

## Recommended next step

Preferred next PR: review whether to add a future private insert helper or
broaden capture fixtures. Do not expose a create route until capture
validation, redaction checks, and authority-boundary smoke are reviewed.
