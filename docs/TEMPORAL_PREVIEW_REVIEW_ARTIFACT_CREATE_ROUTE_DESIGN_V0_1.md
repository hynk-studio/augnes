# TemporalPreviewReviewArtifact Create Route Design v0.1

## Executive summary

This document began as route design. The first narrow public/non-Cockpit
implementation now adds only:

```text
POST /api/temporal-interpretation/review-artifacts/capture
```

The route creates bounded `TemporalPreviewReviewArtifact` rows only. It reuses
the internal capture helper, the private idempotent insert helper, and the
forbidden-persistence fixture corpus. It must not call OpenAI, and it must not
approve, publish, replay, commit state, infer readiness, or create durable
`PerspectiveSnapshot` or `RawEpisodeBundle` runtime records.

The route is a capture contract: it accepts bounded Temporal Preview output
plus manual review metadata, converts it through
`buildTemporalPreviewReviewArtifactInputFromRouteCapture`, validates the same
forbidden-field and ref-separation boundaries as current internal helpers, and
persists only the resulting bounded review artifact through
`insertTemporalPreviewReviewArtifactWithIdempotency`.
It must not call the GitHub publication adapter.

Implementation status: the private non-smoke
`insertTemporalPreviewReviewArtifact` helper now exists and reuses the same
validation and insertion path as `insertTemporalPreviewReviewArtifactForSmoke`.
Idempotency foundation status: a separate internal
`temporal_preview_review_artifact_idempotency` table and
`insertTemporalPreviewReviewArtifactWithIdempotency` helper now support
same-key replay, same-key conflict detection, and conservative duplicate
`source_ref` plus `preview_hash` plus `work_id` conflict detection. Raw
idempotency keys, raw payloads, and raw request bodies are not stored. First
public route implementation status: `POST
/api/temporal-interpretation/review-artifacts/capture` is implemented with
route-level payload bounds and smoke coverage in
`smoke:temporal-capture-route`. Cockpit write controls, ChatGPT App create
tools, Evidence Pack write behavior, OpenAI calls, GitHub publication adapter
calls, replay, publish, approval, state mutation, `PerspectiveSnapshot`
runtime, and `RawEpisodeBundle` runtime remain absent. Cockpit now has a
separate read-only browser over existing GET artifact routes only.

## Route candidates

Recommended route:

```text
POST /api/temporal-interpretation/review-artifacts/capture
```

The `/capture` suffix is safer than a generic create route because it makes
artifact creation explicitly tied to captured preview/review output, avoids
sounding like arbitrary artifact insertion, and keeps create semantics narrow.
The route name should remind callers that this endpoint records bounded
review context, not authority, publication, replay, approval, or durable memory
state.

Rejected or deferred alternative:

```text
POST /api/temporal-interpretation/review-artifacts
```

This route is shorter, but it reads like generic row insertion. That weaker
shape is easier to misuse for arbitrary artifacts, future UI write buttons, or
payloads that did not originate from a bounded route capture. If used later, it
should only happen after the `/capture` contract has proven too narrow.

## Request contract

Conceptual input shape:

```json
{
  "scope": "project:augnes",
  "work_id": "AG-TEMPORAL-INTERPRETATION",
  "source_route": "/api/temporal-interpretation/preview",
  "source_surface": "local_runtime",
  "source_ref": "docs/or/report/path",
  "preview_response": {},
  "manual_review": {
    "reviewer_verdict": "pass",
    "reviewer_notes": "Bounded manual review notes.",
    "manual_review_report_path": "docs/REPORT.md"
  },
  "links": {
    "linked_evidence_record_ids": ["evidence:id"],
    "linked_session_id": "session:id",
    "linked_pr_url": "https://github.com/Aurna-code/augnes/pull/000"
  },
  "capture": {
    "capture_mode": "route_capture",
    "redaction_status": "bounded",
    "created_by": "route-client",
    "source_ref": "optional-capture-source-ref"
  },
  "idempotency_key": "client-generated-required-key"
}
```

Required conceptual fields:

- `source_ref`: source document/report/path for the captured preview.
- `source_surface`: bounded surface label, such as `local_runtime`.
- `preview_response`: bounded Temporal Preview response object.
- `manual_review.reviewer_verdict`: one of `pass`, `pass_with_notes`, or
  `fail`. The public route rejects `not_reviewed`.
- `capture.created_by`: non-empty actor or helper identifier.
- `idempotency_key`: required for the public route.

Optional conceptual fields:

- `scope`, defaulting to `project:augnes`.
- `work_id`, defaulting to `AG-TEMPORAL-INTERPRETATION` unless a future
  reviewed Temporal work anchor is designed.
- `source_route`, defaulting to `/api/temporal-interpretation/preview`.
- `capture.capture_mode`, defaulting to `route_capture`.
- `capture.redaction_status`, defaulting to `bounded`.
- `capture.source_ref`, which overrides top-level `source_ref`.
- `manual_review.reviewer_notes`.
- `manual_review.manual_review_report_path`.
- `links.linked_evidence_record_ids`.
- `links.linked_session_id`.
- `links.linked_pr_url`.

Public route forbidden policy: client-supplied `capture.artifact_id` and
top-level `artifact_id` are rejected. The server/helper generates
`artifact_id`.

Forbidden request fields, at any depth:

- `raw_openai_response`
- `secret_material`
- `approval_status`
- `publish_status`
- `replay_status`
- `commit_status`
- `memory_admission_status`
- `safe_next_step_instruction`
- `summary_only_ref_as_evidence`
- `cockpit_dom_as_truth`
- `durable_perspective_snapshot_id`
- `user_preference_as_readiness`

The route must reject raw full model responses, secrets, authority fields,
summary-as-evidence fields, Cockpit DOM truth claims, and durable snapshot
identifiers before helper conversion or persistence.

## Response contract

Success, first creation:

```json
{
  "runtime": "augnes",
  "scope": "project:augnes",
  "created": true,
  "idempotent_replay": false,
  "artifact": {},
  "boundaries": [
    "Creates bounded TemporalPreviewReviewArtifact only.",
    "Does not call OpenAI.",
    "Does not call GitHub or GitHub publication adapter.",
    "Does not approve, publish, replay, or commit state.",
    "Does not create PerspectiveSnapshot or RawEpisodeBundle runtime.",
    "Does not update Evidence Pack directly."
  ],
  "gaps": []
}
```

Same idempotency key and same payload replay:

```json
{
  "runtime": "augnes",
  "scope": "project:augnes",
  "created": false,
  "idempotent_replay": true,
  "artifact": {},
  "boundaries": [
    "Creates bounded TemporalPreviewReviewArtifact only.",
    "Does not call OpenAI.",
    "Does not call GitHub or GitHub publication adapter.",
    "Does not approve, publish, replay, or commit state.",
    "Does not create PerspectiveSnapshot or RawEpisodeBundle runtime.",
    "Does not update Evidence Pack directly."
  ],
  "gaps": []
}
```

Validation failure, `400`:

- Forbidden field.
- Invalid `reviewer_verdict`.
- Missing `preview_response`.
- Raw full response rejected.
- Summary ref used as an evidence anchor.
- Invalid `capture_mode` or `redaction_status`.
- Missing required idempotency key.
- Payload exceeds the configured 128 KiB size bound.

Conflict, `409`:

- Duplicate artifact without the same idempotency key.
- Same idempotency key with a mismatched payload hash.
- Duplicate `source_ref` plus `preview_hash` plus `work_id` under the initial
  conservative policy.

Linked session or evidence record validation failures return `400`; the route
does not create missing session or evidence rows.

## Idempotency design

The public route should require `idempotency_key`. The server should compute an
artifact hash from the canonical bounded preview JSON plus manual review
metadata that affects the artifact row. A separate idempotency payload hash
should cover the route request fields that determine the artifact, after
normalization and redaction checks.

Policy:

- Same idempotency key plus same payload hash returns the existing artifact
  with `200`, `created: false`, and `idempotent_replay: true`.
- Same idempotency key plus different payload hash returns `409`.
- Different idempotency key plus same `source_ref`, `preview_hash`, and
  `work_id` should initially return `409`.
- Different idempotency key plus genuinely different bounded preview hash can
  create a new artifact.

Recommendation: start conservative. Duplicate `source_ref` plus
`preview_hash` plus `work_id` should return `409`. Keep that behavior unless a
later design adds an explicit duplicate policy. Do not add `allow_duplicate` in
the first implementation.

If idempotency data is stored, store only a hash of the idempotency key, not the
raw key.

Implementation note: the idempotency foundation stores route/protocol metadata
in `temporal_preview_review_artifact_idempotency` instead of adding
idempotency columns to the artifact table. Duplicate `source_ref` plus
`preview_hash` plus `work_id` is enforced in helper logic for now rather than a
partial unique index, so the existing artifact insert helper remains unchanged
and the future route can map the typed conflict to `409`.

## Authority boundary

The route must:

- Persist a bounded review artifact only.
- Reuse existing validation and forbidden-field checks.
- Return boundaries and gaps as review metadata.
- Preserve `reviewer_verdict` as manual review metadata only.

The route must not:

- Call OpenAI.
- Call GitHub.
- Call the GitHub publication adapter.
- Execute replay, publish, approval, or commit behavior.
- Commit or mutate Augnes state.
- Create `PerspectiveSnapshot` runtime.
- Create `RawEpisodeBundle` runtime.
- Infer readiness from preview text, guardrail pass, or reviewer verdict.
- Treat `reviewer_verdict` as approval.
- Write Evidence Pack rows itself.
- Mutate source preview, session, work, or evidence records.
- Treat Cockpit DOM as source of truth.

## Helper usage

The route must use:

- `buildTemporalPreviewReviewArtifactInputFromRouteCapture` for converting
  bounded route capture payloads into `TemporalPreviewReviewArtifactInput`.
- `insertTemporalPreviewReviewArtifactWithIdempotency` for persistence,
  replay, idempotency conflict, and duplicate source/hash conflict behavior.
- `TEMPORAL_REVIEW_ARTIFACT_FORBIDDEN_PERSISTENCE_FIXTURES` in tests.

It must not bypass:

- Forbidden field rejection.
- Raw full model response rejection.
- Summary/evidence separation.
- Linked evidence/session validation.
- `work_id` anchor validation.
- Capture mode, redaction status, and reviewer verdict enums.

## Helper Prerequisite Status

The private non-smoke insert helper exists:

```text
insertTemporalPreviewReviewArtifact
```

It must be separate from:

```text
insertTemporalPreviewReviewArtifactForSmoke
```

The helper exists and should continue to:

- Reuse the same validation and parsing path as the smoke insert helper.
- Enforce work, session, evidence, summary/evidence, forbidden-field, and enum
  validation.
- Remain usable by internal callers.
- Avoid exposing additional routes by itself.
- Stay tested alongside the public capture route.
- Keep current read-only list/get behavior unchanged.

The public route uses the idempotent wrapper, not the raw insert helper,
because the public contract requires same-key replay and conflict handling.

## Route Smoke Coverage

`smoke:temporal-capture-route` now covers:

- Valid route capture creates an artifact.
- Same idempotency key replay returns the existing artifact.
- Same idempotency key with different payload returns `409`.
- Duplicate `source_ref` plus `preview_hash` plus `work_id` is rejected.
- Representative forbidden fixture cases are rejected through the route.
- `raw_openai_response` is rejected.
- `approval_status` is rejected.
- `safe_next_step_instruction` is rejected.
- Summary refs as evidence anchors are rejected.
- `reviewer_verdict=approved` and `reviewer_verdict=not_reviewed` are
  rejected.
- Client-supplied `capture.artifact_id` is rejected.
- Missing linked evidence/session rows are rejected when strict validation
  requires them.
- Invalid JSON returns `400`.
- Payloads over 128 KiB return `413`.
- No OpenAI, GitHub, or `fetch` calls occur.
- No authority rows are mutated.
- Read-only list/get shows the created artifact.
- Evidence Pack is not auto-updated.

## Security and Redaction

The request body must be bounded before persistence. Raw full OpenAI responses
must be rejected. Secret material must be rejected. `.env` content must never
be accepted, stored, or logged. The route must not log raw request bodies.

Logging should include only bounded operational metadata:

- `artifact_id`
- `preview_hash`
- request status
- validation failure class
- created/replayed/conflict status

The first implementation must define a large-payload size bound. Screenshot
dumps, DOM dumps, browser storage dumps, raw route captures, and raw model
payloads should be rejected unless a future redaction policy explicitly designs
safe bounded fields for them.

## Observability

Future telemetry, if added, should record only bounded metadata:

- `artifact_id`
- `source_route`
- `source_surface`
- `source_ref`
- `preview_hash`
- `capture_mode`
- `reviewer_verdict`
- `created_by`
- `created_at`
- idempotency key hash, if stored

It must not record:

- Raw idempotency key.
- Raw full request.
- Raw full model response.
- Secrets.
- `.env` content.
- Raw screenshots or DOM dumps.

## Relationship to Evidence Pack

The route does not update Evidence Pack directly. It creates only the bounded
review artifact row.

Evidence Pack read-only awareness now reads artifacts by
`work_id=AG-TEMPORAL-INTERPRETATION` and displays:

- Artifact count.
- Latest verdict.
- Latest guardrail result.
- Linked evidence IDs.
- Gaps.

Evidence Pack still does not call this route or write artifact rows. It must
not infer approval, publish readiness, replay status, committed state, memory
admission, proof publication, PerspectiveSnapshot authority, or
RawEpisodeBundle authority from artifact presence or `reviewer_verdict`.

## Relationship to Cockpit and ChatGPT App

No Cockpit write button should be added in the first implementation. No
ChatGPT App create tool should be added. Future UI should remain read-only
until the route has separate approval and route-level tests prove that capture
does not mutate authority state.

Cockpit now browses artifacts read-only through existing GET routes, but it
must not treat Cockpit DOM state as truth and must not become the source of
artifact creation without a separate reviewed design.

## Implementation Sequence

Implementation sequence:

1. Add the private non-smoke insert helper,
   `insertTemporalPreviewReviewArtifact`. Complete.
2. Add idempotency storage/design if needed. Complete as internal foundation.
3. Implement the route. Complete for `POST
   /api/temporal-interpretation/review-artifacts/capture`.
4. Add route smoke. Complete as `smoke:temporal-capture-route`.
5. Add Evidence Pack read-only awareness. Complete as
   `temporal_review_artifact_trace`.
6. Add Cockpit read-only browser. Complete.
7. Only later, consider an optional controlled UI create action.

Do not combine these steps with approval, publish, replay, durable
`PerspectiveSnapshot`, `RawEpisodeBundle`, Evidence Pack write integration,
Cockpit write controls, ChatGPT App tools, OpenAI calls, or GitHub publication
adapter calls.

## Resolved First-Route Decisions

- Idempotency key hashes and payload hashes are stored in
  `temporal_preview_review_artifact_idempotency`.
- Duplicate `source_ref` plus `preview_hash` plus `work_id` returns `409`.
- `reviewer_verdict=not_reviewed` is rejected on the public route.
- Linked evidence/session rows are optional, but supplied IDs must resolve.
- The first payload bound is 128 KiB.
- `artifact_id` is server/helper-generated for the public route.
