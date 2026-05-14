# TemporalPreviewReviewArtifact Create Route Design v0.1

## Executive summary

This is route design only. It is not implementation and does not add a POST
route, API route file, DB schema, migration, runtime behavior, Cockpit code,
Evidence Pack integration, ChatGPT App tool, OpenAI call, GitHub publication
adapter call, replay, publish, approval, state mutation,
`PerspectiveSnapshot` runtime, or `RawEpisodeBundle` runtime.

A future public/non-Cockpit route would create bounded
`TemporalPreviewReviewArtifact` rows only. It must reuse the current internal
capture helper and the reusable forbidden-persistence fixture corpus. It must
not call OpenAI by itself, and it must not approve, publish, replay, commit
state, infer readiness, or create durable `PerspectiveSnapshot` or
`RawEpisodeBundle` runtime records.

The route is a capture contract: it accepts bounded Temporal Preview output
plus manual review metadata, converts it through
`buildTemporalPreviewReviewArtifactInputFromRouteCapture`, validates the same
forbidden-field and ref-separation boundaries as current internal helpers, and
persists only the resulting bounded review artifact through a future private
non-smoke insert helper.
It must not call the GitHub publication adapter.

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
    "artifact_id": "temporal-review:optional-client-id",
    "source_ref": "optional-capture-source-ref"
  },
  "idempotency_key": "client-generated-required-key"
}
```

Required conceptual fields:

- `source_route`: route string for the source capture route.
- `source_surface`: bounded surface label, such as `local_runtime`.
- `preview_response`: bounded Temporal Preview response object.
- `manual_review.reviewer_verdict`: one of `pass`, `pass_with_notes`, `fail`,
  or `not_reviewed`.
- `capture.capture_mode`: one of `route_capture`, `cockpit_capture`, `mock`,
  `openai`, or `mock_fallback`.
- `capture.redaction_status`: one of `redacted`, `bounded`, or
  `raw_disallowed`.
- `capture.created_by`: non-empty actor or helper identifier.
- `idempotency_key`: required for the public route.

Optional conceptual fields:

- `scope`, defaulting to `project:augnes`.
- `work_id`, defaulting to `AG-TEMPORAL-INTERPRETATION` unless a future
  reviewed Temporal work anchor is designed.
- `source_ref`, `capture.source_ref`, and `capture.artifact_id`.
- `manual_review.reviewer_notes`.
- `manual_review.manual_review_report_path`.
- `links.linked_evidence_record_ids`.
- `links.linked_session_id`.
- `links.linked_pr_url`.

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
  "artifact": {},
  "boundaries": [
    "Created bounded TemporalPreviewReviewArtifact only.",
    "No OpenAI, GitHub publication adapter, approval, publish, replay, or state mutation occurred."
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
    "Returned existing bounded TemporalPreviewReviewArtifact for matching idempotency key and payload hash."
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
- Payload exceeds the configured size bound.

Conflict, `409`:

- Duplicate artifact without the same idempotency key.
- Same idempotency key with a mismatched payload hash.
- Duplicate `source_ref` plus `preview_hash` plus `work_id` under the initial
  conservative policy.
- Linked session or evidence record is missing when strict mode requires those
  links to resolve.

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
- `insertTemporalPreviewReviewArtifact`, a future private non-smoke insert
  helper.
- `TEMPORAL_REVIEW_ARTIFACT_FORBIDDEN_PERSISTENCE_FIXTURES` in tests.

It must not bypass:

- Forbidden field rejection.
- Raw full model response rejection.
- Summary/evidence separation.
- Linked evidence/session validation.
- `work_id` anchor validation.
- Capture mode, redaction status, and reviewer verdict enums.

## Required New Helper Before Implementation

Before any public route implementation, add a private non-smoke insert helper:

```text
insertTemporalPreviewReviewArtifact
```

It must be separate from:

```text
insertTemporalPreviewReviewArtifactForSmoke
```

The helper should:

- Reuse the same validation and parsing path as the smoke insert helper.
- Enforce work, session, evidence, summary/evidence, forbidden-field, and enum
  validation.
- Be suitable for the future public route.
- Avoid exposing a route by itself.
- Be tested before adding any public POST route.
- Keep current read-only list/get behavior unchanged.

## Required Tests Before Route Implementation

Before route implementation, add tests or smokes for:

- Valid route capture creates an artifact.
- Same idempotency key replay returns the existing artifact.
- Same idempotency key with different payload returns `409`.
- Duplicate `source_ref` plus `preview_hash` is rejected.
- Forbidden fields are rejected using the full forbidden fixture corpus.
- `raw_openai_response` is rejected.
- Summary refs as evidence anchors are rejected.
- Invalid `reviewer_verdict` is rejected.
- Missing linked evidence/session rows are rejected when strict validation
  requires them.
- No OpenAI, GitHub, or `fetch` calls occur.
- No authority rows are mutated.
- Read-only list/get shows the created artifact.
- Evidence Pack is not auto-updated unless a later integration exists.

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

Future route telemetry should record:

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

Future Evidence Pack read-only awareness may read artifacts by `work_id` and
display:

- Artifact count.
- Latest verdict.
- Latest guardrail result.
- Linked evidence IDs.
- Gaps.

Evidence Pack must not infer approval, publish readiness, replay status,
committed state, or memory admission from artifact presence or
`reviewer_verdict`.

## Relationship to Cockpit and ChatGPT App

No Cockpit write button should be added in the first implementation. No
ChatGPT App create tool should be added. Future UI should remain read-only
until the route has separate approval and route-level tests prove that capture
does not mutate authority state.

Cockpit may later browse artifacts read-only, but it must not treat Cockpit DOM
state as truth and must not become the source of artifact creation without a
separate reviewed design.

## Implementation Sequence

Recommended sequence:

1. Add the private non-smoke insert helper,
   `insertTemporalPreviewReviewArtifact`.
2. Add idempotency storage/design if needed.
3. Implement the route.
4. Add route smoke.
5. Add Evidence Pack read-only awareness.
6. Add Cockpit read-only browser.
7. Only later, consider an optional controlled UI create action.

Do not combine these steps with approval, publish, replay, durable
`PerspectiveSnapshot`, `RawEpisodeBundle`, Evidence Pack write integration,
Cockpit write controls, ChatGPT App tools, OpenAI calls, or GitHub publication
adapter calls.

## Open Questions

- Where should idempotency key hashes and payload hashes be stored?
- Should duplicate `source_ref` plus `preview_hash` always return `409`, or
  should some source surfaces allow repeat capture later?
- Should `reviewer_verdict=not_reviewed` be allowed on a public capture route,
  or only through internal/test capture paths?
- Should linked evidence/session rows be strictly required or optional?
- What payload size bound is appropriate for bounded preview captures?
- Should `artifact_id` be client-provided, server-generated only, or
  client-provided only for internal trusted callers?
