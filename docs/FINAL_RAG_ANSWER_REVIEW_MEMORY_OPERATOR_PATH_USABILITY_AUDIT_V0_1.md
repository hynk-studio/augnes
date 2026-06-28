# Final RAG Answer Review Memory Operator Path Usability Audit v0.1

This slice implements
`final_rag_answer_review_memory_operator_path_usability_audit_v0_1`.

It audits usability only. It adds no runtime authority. It adds no API routes.
It adds no UI behavior changes. It adds no DB schema, migrations, Review
Memory writes, promotion writes, proof/evidence writes, durable state writes,
Formation Receipt writes, product-write, accepted evidence ref writes, product
IDs, GitHub actuation, or release authority.

## Purpose

Produce a repo-grounded, public-safe usability/friction audit for the already
validated final RAG answer candidate -> Review Memory -> UI -> promotion
readiness operator path.

The audit uses the merged route-level E2E validation and browser validation as
evidence. It does not rerun live provider validation, does not copy browser
artifacts into the repo, and does not convert validation pass into truth.
Smoke/CI/browser pass is not truth.

## Relationship to PR #851 route-level E2E validation

PR #851 added
`final_rag_answer_review_memory_end_to_end_operator_path_v0_1`.

That validation proves the direct route-handler composition of existing
surfaces:

1. `final_rag_answer_generation_candidate_review_v0_1`
2. `final_rag_answer_candidate_review_memory_binding_v0_1`
3. `final_answer_candidate_review_ui_binding_v0_1`
4. `promotion_readiness_packet_from_review_memory_v0_1`

The route-level E2E smoke seeds only temporary fixture DBs, calls the existing
final answer candidate route in deterministic mock-provider mode, binds the
candidate into Review Memory, reads it through the Review Memory GET surface,
and builds a diagnostic promotion readiness packet. It confirms the path stays
candidate/review/readiness-only and that `ready_for_operator_promotion_review`
means future human review readiness only.

## Relationship to PR #852 browser validation

PR #852 added
`final_rag_answer_review_memory_operator_browser_validation_v0_1`.

That validation proves the browser/operator-facing side of the existing
read/display UI at `/research-retrieval/final-rag-answer/review-memory` against
a temporary public-safe seeded Review Memory DB.

The browser validation passed only for browser-observed request boundaries. It
confirmed zero forbidden browser route calls, zero external browser requests,
zero relevant console errors, zero page errors, and zero failed requests, while
ignoring one local favicon 404 console message. Browser validation is not
server-side outbound network instrumentation.

Screenshots/report artifacts remain outside repo under `/tmp`:

- `/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1/report.json`
- `/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1/desktop.png`
- `/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1/mobile-390.png`

This audit does not embed screenshots, raw browser artifacts, raw route
responses, raw DB rows, raw provider output, raw prompt text, raw retrieval
output, source bodies, hidden reasoning, terminal logs, private paths, browser
session dumps, secrets, provider IDs, product IDs, or GitHub payloads.

## Current operator path

Current validated operator sequence:

1. final RAG answer candidate:
   `final_rag_answer_generation_candidate_review_v0_1`
2. Review Memory binding:
   `final_rag_answer_candidate_review_memory_binding_v0_1`
3. Review Memory read/display UI:
   `final_answer_candidate_review_ui_binding_v0_1`
4. promotion readiness packet:
   `promotion_readiness_packet_from_review_memory_v0_1`
5. route-level E2E validation:
   `final_rag_answer_review_memory_end_to_end_operator_path_v0_1`
6. browser validation:
   `final_rag_answer_review_memory_operator_browser_validation_v0_1`

Human path in practice:

`final RAG answer candidate -> Review Memory binding -> Review Memory read/display UI -> promotion readiness packet -> browser validation evidence`

## What is validated

- Route-level composition across the candidate, Review Memory binding, Review
  Memory GET read/display, and readiness packet stages.
- Deterministic mock-provider candidate generation for the route-level E2E
  path.
- Bounded Review Memory `candidate_review_snapshot` creation in a temporary DB
  during route-level validation.
- Existing Review Memory GET read path used by the UI.
- Diagnostic readiness packet generation from the same temporary Review Memory
  DB.
- Existing read/display UI loads in a real browser against a seeded
  public-safe Review Memory DB.
- Browser-observed allowed GET routes are limited to Review Memory list,
  detail, and activity reads.
- Browser-observed forbidden POST, provider, prompt, retrieval, source-fetch,
  product-write, promotion, proof/evidence, Formation Receipt, Git/GitHub, and
  release routes are not called by the UI.
- Browser-observed external non-localhost requests are zero.
- Boundary text remains visible in the UI: Review Memory is not truth, proof,
  accepted evidence, or durable Perspective state; final answer candidate
  remains candidate-only; source refs are lineage pointers, not proof; the UI
  is read/display only; Smoke/CI pass is not truth.

## What is not validated

- Long-lived operator Review Memory data is not validated; browser validation
  uses a seeded temporary public-safe DB.
- A human operator's full repeatability is not validated; browser validation is
  scripted.
- Full server-side outbound absence is not proven; browser validation is not
  server-side outbound network instrumentation.
- Live provider behavior is not revalidated by this audit.
- Live retrieval execution, source fetching, retrieval index writes, and
  provider calls are not exercised by this audit.
- Promotion execution, promotion decision writes, promotion decision store
  writes, proof/evidence creation, durable Perspective state mutation,
  Formation Receipt writes, product-write, accepted evidence ref writes, and
  product ID allocation are not validated because they remain forbidden.
- Readiness packet output is not visible in the current UI.
- The current UI does not support fixing, annotating, discarding, promoting, or
  writing Review Memory records from the page.
- Browser visual validation is limited to generated screenshots and scripted
  assertions, not a full human UX review.

## Operator friction points

| Classification | Friction | Impact | Current handling |
|---|---|---|---|
| blocking | Broad dogfood repeatability is blocked until a manual QA runbook exists. | Operators can inspect the path, but repeating it safely still depends on knowing which command/page/output belongs to which stage. | Recommend `operator_path_manual_qa_runbook_v0_1`. |
| high | Promotion readiness packet is not visible in the UI yet. | The operator must inspect readiness output outside the UI, which makes the path feel split. | Keep UI unchanged in this slice; defer UI binding unless separately approved. |
| high | Operator may need to jump between page, route validation, and readiness packet output. | Context switching increases the chance of misreading readiness as authority or losing the exact DB path. | Capture the manual sequence before adding more UI behavior. |
| medium | DB path entry is still manual. | A human can mistype the local/dev path or choose the wrong temp DB. | UI blocks invalid paths before fetch, but the workflow still needs runbook precision. |
| medium | Browser validation uses seeded temp DB, not long-lived operator data. | It proves UI behavior on public-safe fixture data, not repeatability over a real operator DB. | Manual QA should explicitly separate fixture DB, temp DB, and operator DB handling. |
| medium | Browser validation confirms no forbidden route calls, but does not prove full server-side outbound network absence. | A browser pass should not be treated as a complete network proof. | Audit keeps this limitation explicit. |
| medium | Browser visual validation is screenshot/script based, not a full human UX review. | Layout and state coverage can pass while still feeling awkward to an operator. | Manual QA should add human read-through observations without adding runtime. |
| low | UI is read/display-only and cannot fix or annotate records. | This is inconvenient, but it is intentional and authority-preserving. | Keep writes outside UI unless separately approved. |
| low | Review Memory write path exists elsewhere, but UI intentionally does not write. | Operators must understand that binding and display are separate surfaces. | Boundary notes and a runbook should make the split explicit. |
| deferred | No promotion decision write is available, intentionally. | The path cannot complete a promotion, but that is an authority boundary, not a defect. | Defer until explicit promotion decision approval. |

## UX risk register

| Classification | Risk | Mitigation in current path | Residual risk |
|---|---|---|---|
| high | Operator mistakes readiness packet output for promotion authority. | Docs and smokes state readiness is diagnostic only. | A runbook should repeat the stopline at the exact readiness step. |
| high | Operator loses stage context while moving between UI and command output. | Route/browser docs name the validated sequence. | Current path is still not polished as a single operator workflow. |
| medium | Wrong DB path causes empty, stale, or invalid reads. | UI validates path shape before fetch and avoids unsafe echo. | Manual entry remains error-prone. |
| medium | Browser validation is overinterpreted as network proof. | Browser docs state it is browser/page observation only. | Server-side outbound absence remains outside this validation. |
| medium | Fixture success is mistaken for long-lived operator data success. | Fixture policy marks temp seeded data as public-safe setup only. | Manual QA should call out fixture-vs-operator data explicitly. |
| low | Read/display-only UI feels incomplete because records cannot be fixed there. | No write controls prevents accidental authority expansion. | Future annotation/write behavior requires separate approval. |
| deferred | Operator wants one-click promotion after readiness. | No promotion controls or decision writes exist. | Any promotion flow remains approval-gated. |

## Authority boundary

This audit creates no new runtime authority.

It adds no API routes, no UI behavior changes, no DB schema, no migrations, no
Review Memory writes, no POST calls from UI, no final answer generation, no
provider calls, no prompt sending, no retrieval execution, no source fetching,
no retrieval index writes, no promotion execution, no promotion decision write,
no promotion decision store write, no proof/evidence creation, no
claim/evidence writes, no durable Perspective state write/apply, no Formation
Receipt write, no product-write, no accepted evidence ref write, no product ID
allocation, no GitHub actuation, and no release execution.

Readiness remains diagnostic only. Review Memory remains not truth, not proof,
not accepted evidence, and not durable Perspective state. Final answer
candidates remain candidate-only. Source refs remain lineage pointers, not
proof. Smoke/CI/browser pass is not truth.

## Privacy/redaction boundary

The audit and fixture stay public-safe. They use symbolic refs and summary
counts only. They do not include raw browser dumps, raw route responses, raw DB
rows, raw provider output, raw prompt text, raw retrieval output, raw source
bodies, hidden reasoning, terminal logs, private paths, browser session dumps,
screenshots embedded in repo, local `/tmp` artifact contents copied into repo,
real secrets, real provider IDs, or real product IDs.

The only browser artifact references are symbolic paths under `/tmp`; the
artifacts are not copied into this repository.

## Manual QA recommendation

The current path is safe enough for bounded manual QA by an informed operator.

Manual QA should not require new runtime, UI behavior, API routes, DB schema,
or writes. The next useful work is a docs/fixture/smoke runbook that tells a
human exactly how to repeat the existing path, which DB path to use, where to
look in the UI, where readiness output lives, what counts as pass/fail, and
which stoplines remain hard.

## Dogfood readiness recommendation

The current path is not yet a polished dogfood operator workflow.

It is suitable for narrow manual QA and tightly supervised dogfood rehearsal,
but broad dogfood should wait for a repeatable manual QA runbook. The risk is
not missing runtime capability; the risk is human friction and stage confusion.

## Next implementation slice recommendation

Recommended next slice: `operator_path_manual_qa_runbook_v0_1`.

Choose Option A: a docs/fixture/smoke slice that gives a human a safe manual QA
runbook for the existing operator path. No new runtime. No UI changes.

This should come before a readiness-packet UI read/display slice because the
operator path is already browser-validated but not easy enough for a human to
repeat without explicit instructions.

`promotion_readiness_packet_ui_read_display_binding_v0_1` remains a plausible
later Option B, but it requires separate explicit approval and must remain
read/display-only if approved. `none_without_explicit_approval` is not the
current recommendation because one concrete useful non-runtime slice is visible.

## Explicitly deferred items

- Manual QA runbook implementation beyond this audit.
- Promotion readiness packet UI binding.
- New UI behavior.
- Review Memory writes from UI.
- POST calls from UI.
- Final answer generation expansion.
- Provider calls.
- Prompt sending expansion.
- Retrieval execution expansion.
- Source fetching.
- Retrieval index writes.
- Promotion execution.
- Promotion decision record writes.
- Promotion decision store writes.
- Promotion decision routes/UI.
- Proof/evidence creation.
- Claim/evidence writes.
- Durable Perspective state apply.
- Formation Receipt writes.
- Product-write.
- Accepted evidence ref write from final answer.
- Product ID allocation.
- Product-write adapter enablement.
- Broad product persistence.
- GitHub actuation.
- Release execution.
- Live provider validation.
- Automatic answer-to-product conversion.
- Broad provider/retrieval/product persistence.

## Fixture policy

The fixture for this audit is public-safe and summary-only. It records:

- validated path names
- route validation summary
- browser validation summary counts
- operator friction points
- UX risks
- no-authority boundaries
- still-forbidden capabilities
- the single next recommended slice
- public-safe fixture policy

It does not copy raw browser reports, screenshots, route responses, DB rows,
provider output, prompt text, retrieval output, source bodies, terminal logs,
private paths, secrets, provider IDs, product IDs, or GitHub payloads.

## Verification expectations

Run:

```bash
node --check scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs
npm run smoke:final-rag-answer-review-memory-operator-path-usability-audit-v0-1
npm run smoke:final-rag-answer-review-memory-operator-browser-validation-v0-1
npm run smoke:final-rag-answer-review-memory-end-to-end-operator-path-v0-1
npm run smoke:promotion-readiness-packet-from-review-memory-v0-1
npm run smoke:final-answer-candidate-review-ui-binding-v0-1
npm run smoke:final-rag-answer-review-memory-binding-v0-1
npm run smoke:final-rag-answer-generation-candidate-review-v0-1
npm run smoke:research-candidate-review-memory-db-routes-runtime-v0-1
npm run smoke:research-candidate-review-memory-db-store-runtime-v0-1
npm run smoke:perspective-promotion-runtime-contract-v0-1
npm run smoke:perspective-promotion-decision-store-v0-1
npm run smoke:v0-2-1-remaining-runtime-gap-audit-v0-6
npm run smoke:product-write-accepted-evidence-ref-runtime-v0-1
npm run smoke:privacy-redaction-guard-v0-1
npm run smoke:authority-boundary-regression-v0-1
npm run smoke:runtime-audit-panel-runtime-completion-v0-1
npm run typecheck
git diff --check
git diff --cached --check
```

Browser visual validation does not need to rerun for this audit slice. This
slice analyzes the already merged browser validation references and artifacts.
Do not re-run live provider validation for this audit slice.
