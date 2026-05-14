# Temporal Interpretation Work and Evidence Binding

## Executive summary

Temporal Interpretation needs a stable trace anchor before persistence. The
current validation chain has strong docs and smoke coverage, and
`AG-TEMPORAL-INTERPRETATION` now exists as a seeded demo/runtime work item for
future Temporal Interpretation evidence and review-artifact persistence prep.
Historical structured evidence that used `target_ref` / `source_ref` remains
valid.

This document defines binding conventions only. It does not create durable
preview persistence, add DB schema, add API routes, add runtime persistence,
add Cockpit code, add ChatGPT App tools, call OpenAI, call the GitHub
publication adapter, replay, publish, approve, or mutate state.

This document also does not grant state authority. Work IDs, evidence records,
session refs, PR refs, and future `TemporalPreviewReviewArtifact` rows are
trace and review links. They are not proof publication, approval, memory
admission, committed state, or durable `PerspectiveSnapshot` authority.

## Dedicated work anchor

Option chosen in v0.1: A, documentation-only work anchor convention. Follow-up
seed slice result: `AG-TEMPORAL-INTERPRETATION` now exists in the demo/runtime
seed data.

Canonical work ID / work anchor label:

```text
AG-TEMPORAL-INTERPRETATION
```

Human title:

```text
Temporal Interpretation validation and persistence preparation
```

Scope:

```text
project:augnes
```

Purpose:

- Anchor Temporal Interpretation validation, review artifacts, persistence
  design, and future review-artifact persistence preparation.
- Keep Temporal Interpretation evidence separate from generic Codex workflow
  evidence and unrelated work trace anchors.
- Provide a stable linkage target for future `TemporalPreviewReviewArtifact`
  rows.

Owner / surface convention:

- `user` or Core authority owns durable work-item creation.
- `codex` may use the convention in docs, PR bodies, and evidence rows.
- `local_runtime` may record bounded observation evidence when the evidence API
  is available.
- `cockpit` may remain a read-only review surface.
- `chatgpt_developer_mode` may remain a read-only validation surface when
  applicable.

Lifecycle stage:

```text
design/validation/persistence-prep
```

Relation to PR #114-#121:

- PR #114 hardened Temporal Interpretation v0.2.
- PR #115 added the mock fixture manual review report.
- PR #116 rendered `active_context_admission.decisions` read-only in Cockpit.
- PR #117 recorded the OpenAI-path validation pass.
- PR #118 added the Temporal v0.2 status/roadmap.
- PR #119 added the route-captured Temporal Preview manual review report.
- PR #120 added browser/Cockpit screenshot/DOM validation.
- PR #121 added the Temporal Interpretation persistence boundary design.

Runtime seed status: `AG-TEMPORAL-INTERPRETATION` is seeded through the existing
demo work item seed path in `scripts/demo-seed.mjs`. It is demo/development
trace data only. It is not production authority, committed state, proof
publication, approval, replay, durable `PerspectiveSnapshot` runtime, or
RawEpisodeBundle runtime.

## Evidence binding rules

Prefer `work_id=AG-TEMPORAL-INTERPRETATION` for future Temporal Interpretation
evidence when the seeded demo/runtime work item is available. If a local
runtime has not been seeded or the work item is unavailable, use `target_ref`
and `source_ref` with the canonical strings below. Do not invent `work_id` in
helpers, PR bodies, or evidence rows just to make a closeout look complete.
Plain-language rule: do not invent work_id values.

Do not attach unrelated Temporal evidence to `AG-004` or any generic Codex work
anchor. `AG-004` is the Codex completion protocol anchor; future Temporal
Interpretation evidence belongs to the dedicated Temporal anchor or to
canonical `target_ref` / `source_ref` strings when the seeded anchor is
unavailable.

Preserve `source_surface` and `source_ref` on every evidence row so reviewers
can tell whether the observation came from local runtime, docs, Cockpit,
ChatGPT Developer Mode, or a PR closeout.

Suggested canonical `target_surface` values:

- `local_runtime`
- `cockpit`
- `chatgpt_developer_mode`
- `github_pr`
- `docs`

Suggested canonical `target_ref` values:

- `temporal:v0.2:hardening`
- `temporal:v0.2:route-review`
- `temporal:v0.2:cockpit-validation`
- `temporal:v0.2:openai-validation`
- `temporal:persistence-design:v0.1`
- `temporal:work-binding:v0.1`

Evidence kind guidance:

| Evidence kind | Binding rule |
| --- | --- |
| `command_run` | Record the exact command and result. Use `work_id=AG-TEMPORAL-INTERPRETATION` when available; otherwise use `target_ref` and `source_ref`. |
| `check_passed` | Record concrete passed checks, such as doc smoke or route smoke results. Preserve generator, guardrail, and warning facts when relevant. |
| `check_failed` | Preserve the exact failure and environment setup. Do not convert a failed route or validation check into a generic note. |
| `check_skipped` | Record a concrete skipped reason, such as missing local runtime, missing Developer Mode access, or absent `OPENAI_API_KEY` for opt-in validation. |
| OpenAI validation | Record only the redacted validation report path, command, generator/model metadata that is safe to disclose, and no-secret confirmation. Do not bind a raw OpenAI response. |
| Route-captured review | Bind to `target_ref=temporal:v0.2:route-review` and the review report path. The raw full JSON capture remains uncommitted. |
| Cockpit screenshot/DOM validation | Bind to `target_ref=temporal:v0.2:cockpit-validation` and the validation doc. Screenshots remain local unless explicitly approved for committed proof assets. |
| Future persistence schema checks | Bind to `target_ref=temporal:persistence-design:v0.1` or the future schema-design target ref until the dedicated work item exists. |

## Session binding rules

- Use an existing `session_id` only.
- No automatic session creation.
- Bind a session to `AG-TEMPORAL-INTERPRETATION` only when both the session row
  and the seeded work item exist in that runtime.
- If either the session or work item is missing, report the exact skipped
  reason instead of creating replacement records.
- `evidence_pack_ref` should be a string ref, not an invocation of the Evidence
  Pack endpoint.
- Session Trace remains read-only. It does not create sessions, bind missing
  sessions, execute Codex, call OpenAI, call GitHub, approve, publish, replay,
  or mutate state authority rows.

If a runtime has not been seeded with the work item, session closeouts should
use `target_ref` and `source_ref` to connect the PR/session context to the
Temporal Interpretation artifact. They should not fabricate a `CODEX_WORK_ID`.

## PR binding rules

- PRs should mention `AG-TEMPORAL-INTERPRETATION` or explain why the seeded
  runtime work item was unavailable.
- PR bodies must include structured evidence IDs, or the exact skipped reason
  when evidence rows were not created.
- PR bodies should include related artifact docs, including route review,
  Cockpit validation, OpenAI validation, persistence design, and this binding
  doc when relevant.
- PR closeout should list whether the work item exists, whether `work_id` was
  used, and which `target_ref` / `source_ref` values were used instead.
- Normal git push and draft PR creation are allowed for code review.
- No GitHub publication adapter. Do not use the GitHub publication adapter,
  publish live GitHub comments,
  execute replay, attempt duplicate publish, or treat a PR body as proof
  publication authority.

## TemporalPreviewReviewArtifact future linkage

Future `TemporalPreviewReviewArtifact` rows should link to:

- `work_id=AG-TEMPORAL-INTERPRETATION` when the seeded work item is available.
- `evidence_record_ids`.
- Optional `session_id`.
- `source_route`.
- `source_refs`.
- `manual_review_report_path`.
- PR URL.
- Guardrail status.
- Generator.

Future review artifact rows should not include authority fields. They should
not include approval status, commit status, proof publication status, memory
admission status, or durable `PerspectiveSnapshot` state. If a future design
needs approval-gated commit fields, those belong to a separate
`PerspectiveSnapshotCandidate` or commit design, not the preview review
artifact.

## What not to bind

Do not bind or promote:

- Raw OpenAI response.
- Secrets.
- Summary-only refs as evidence.
- User preference as factual readiness.
- Preview output as state.
- Cockpit visual state as truth.
- Unrelated work item.
- Unreviewed `safe_next_step` as instruction.
- Admission decision as automatic memory write.
- OpenAI output as source of truth.
- RawEpisodeBundle generated from summaries only.

## Historical evidence handling

Prior evidence rows without `work_id` remain valid historical evidence. They
should not be rewritten casually. Historical rows that used `target_ref` and
`source_ref` documented the available trace shape at the time.

Future Evidence Pack behavior may discover new Temporal Interpretation evidence
by `work_id=AG-TEMPORAL-INTERPRETATION` when the seeded work item is available,
or by `target_ref` / `source_ref` for historical rows and unseeded runtimes.
Optional migration or backfill of historical evidence to the dedicated work
item must be a separate reviewed slice. It must preserve the original source
refs, avoid invented evidence IDs, and report whether each row was linked,
skipped, or left unchanged.

## Acceptance gates before persistence implementation

Before implementing `TemporalPreviewReviewArtifact` schema or runtime
persistence, these gates must pass:

- This binding doc merged.
- Dedicated work item exists or explicit decision to stay target_ref-only.
- Evidence closeout uses canonical refs.
- Route validation artifact linked.
- Cockpit validation artifact linked.
- OpenAI validation artifact linked.
- No-secret policy confirmed.
- No automatic state commit smoke.
- Review artifact schema design reviewed.

These gates are prerequisites for preview review artifact persistence only.
They do not authorize durable `PerspectiveSnapshot` persistence,
RawEpisodeBundle runtime, approval, publish, replay, or state mutation.

## Recommended next step

The next productization step should be `TemporalPreviewReviewArtifact` schema
design. That schema design should link review artifacts to
work/evidence/session/PR refs without adding approval, publish, replay, durable
`PerspectiveSnapshot`, or RawEpisodeBundle runtime.

## Related artifacts

- `docs/TEMPORAL_INTERPRETATION_PERSISTENCE_DESIGN_V0_1.md`
- `docs/TEMPORAL_INTERPRETATION_V0_2_STATUS_AND_ROADMAP.md`
- `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md`
- `docs/TEMPORAL_INTERPRETATION_COCKPIT_SCREENSHOT_VALIDATION.md`
- `docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md`
- `docs/VERIFICATION_EVIDENCE_PACK.md`
- `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md`
