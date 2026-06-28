# Final RAG Answer Review Memory Operator Browser Validation v0.1

This slice implements
`final_rag_answer_review_memory_operator_browser_validation_v0_1`.

It validates browser/operator usability only. It adds no runtime authority. It
adds no API routes. It adds no UI behavior. It adds no DB schema.

The validation targets the already merged final answer candidate Review Memory
read/display UI at:

`/research-retrieval/final-rag-answer/review-memory`

## Purpose

The browser validation proves that an operator can load the existing final
answer candidate Review Memory UI against a temporary public-safe Review Memory
DB and inspect bounded records without opening any new authority.

The temporary seeded Review Memory DB is test setup only. The UI under
validation remains read/display-only and uses existing Review Memory GET routes
only.

## Relationship to Existing Surfaces

This validation is downstream of:

- `final_rag_answer_generation_candidate_review_v0_1`
- `final_rag_answer_candidate_review_memory_binding_v0_1`
- `final_answer_candidate_review_ui_binding_v0_1`
- `promotion_readiness_packet_from_review_memory_v0_1`
- `final_rag_answer_review_memory_end_to_end_operator_path_v0_1`

It validates the browser/operator-facing side of the path already covered at
route level by the end-to-end operator path smoke. It does not create a new
product surface.

## Browser Path

The browser validator:

1. Starts the existing Augnes dev server on a local available port.
2. Seeds a temporary public-safe Review Memory DB under `.tmp/` using existing
   Review Memory DB store helpers as test setup only.
3. Opens `/research-retrieval/final-rag-answer/review-memory`.
4. Verifies the existing `FinalRagAnswerReviewMemoryPanel` renders.
5. Verifies visible boundary notes:
   - Review Memory is not truth.
   - Review Memory is not proof.
   - Review Memory is not accepted evidence.
   - Review Memory is not durable Perspective state.
   - Final answer candidate remains candidate-only.
   - Source refs are lineage pointers, not proof.
   - This UI is read/display only.
   - Smoke/CI pass is not truth.
6. Enters the seeded Review Memory DB path.
7. Uses the existing list/read control.
8. Verifies a final answer candidate Review Memory record is displayed.
9. Opens the selected record.
10. Loads activity history.
11. Verifies candidate refs and source refs display as bounded public-safe refs.
12. Verifies the copied bounded packet is non-authoritative.
13. Verifies invalid DB paths are blocked before fetch.
14. Verifies private/raw filter text is blocked before fetch.
15. Verifies no POST route calls are made by the browser UI.
16. Verifies no provider, prompt, retrieval, source-fetch, product-write,
    promotion, proof/evidence, Formation Receipt, Git/GitHub, or release
    routes are called by the browser UI.
17. Captures desktop and narrow/mobile screenshots under `/tmp`.

## Route Boundary

Allowed browser-observed API requests are limited to:

- `GET /api/research-candidate-review/review-records`
- `GET /api/research-candidate-review/review-records/[review_record_id]`
- `GET /api/research-candidate-review/review-records/[review_record_id]/activity`

The browser validation fails if it observes:

- any POST route from the UI
- `/api/research-retrieval/final-rag-answer`
- `/api/research-retrieval/final-rag-answer/review-memory`
- `/api/perspective/promotion/readiness-packet`
- `/api/product-write`
- provider extraction routes
- retrieval rebuild/search routes
- source fetch routes
- GitHub routes
- release routes
- external non-localhost URLs

The network observation is browser/page network observation only. It is not
server-side outbound network instrumentation.

## Authority Boundary

This slice does not POST from the UI. It does not write Review Memory from the
UI. It does not generate final answers. It does not call providers. It does not
send prompts. It does not execute retrieval. It does not fetch sources. It does
not write retrieval indexes.

It does not create proof/evidence. It does not write claim/evidence records. It
does not promote Perspective. It does not write promotion decisions. It does
not use or write the promotion decision store. It does not use/write the
promotion decision store. It does not write Formation
Receipts. It does not write/apply durable state. It does not product-write. It
does not write accepted evidence refs. It does not allocate product IDs. It
does not execute Git/GitHub/release work.

Browser readiness is not truth, proof, evidence, accepted evidence, promotion,
approval, durable state, Formation Receipt, product-write, product authority,
or release authority. Smoke/CI/browser pass is not truth.

## Fixture Policy

The fixture uses public-safe symbolic refs only:

- `final-rag-answer-candidate:...`
- `review-memory:...`
- `source-ref:...`
- `rag-context-preview:...`
- `operator:...`

The fixture blocks real secrets, provider keys, private URLs, local private
paths, raw prompt payloads, raw provider outputs, raw retrieval outputs, raw
source bodies, raw DB rows, raw conversations, hidden reasoning,
chain-of-thought, telemetry dumps, raw diffs, terminal logs, GitHub payloads,
browser/session dumps, and smoke/CI/browser pass as truth.

## Artifacts

The browser validator writes artifacts outside the repo tree:

- `/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1/report.json`
- `/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1/desktop.png`
- `/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1/mobile-390.png`

The report includes the browser executable path, app URL, screenshot paths,
seeded Review Memory DB path, request/response summary, forbidden/external
request counts, console/page error counts, assertions, preserved boundaries,
and final status.

## Files

- `docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_BROWSER_VALIDATION_V0_1.md`
- `fixtures/final-rag-answer-review-memory-operator-browser-validation.sample.v0.1.json`
- `scripts/browser-validate-final-rag-answer-review-memory-operator-path-v0-1.mjs`
- `scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs`
- `package.json`
- `docs/00_INDEX_LATEST.md`

Existing changed-file guards may also receive exact compatibility allowlist
entries for this slice in:

- `scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs`
- `scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs`
- `scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs`
- `scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs`
- `scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs`
- `scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-6.mjs`

These compatibility entries are exact file allowlists only. They do not add
runtime behavior.

## Validation

Run:

```bash
node --check scripts/browser-validate-final-rag-answer-review-memory-operator-path-v0-1.mjs
node --check scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs
npm run smoke:final-rag-answer-review-memory-operator-browser-validation-v0-1
npm run browser:validate-final-rag-answer-review-memory-operator-path-v0-1
```

The browser validation must not be marked passed unless a real browser launches
and the report/screenshots are created. If browser validation is unavailable,
stop and report instead of fabricating success.
