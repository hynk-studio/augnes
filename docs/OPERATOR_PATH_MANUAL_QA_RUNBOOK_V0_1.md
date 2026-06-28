# Operator Path Manual QA Runbook v0.1

This slice implements `operator_path_manual_qa_runbook_v0_1`.

It documents manual QA only. It adds no runtime authority. It adds no API
routes, no UI behavior changes, no DB schema changes, no Review Memory writes
from UI, no provider calls, no prompt sending expansion, no retrieval
execution expansion, no source fetching, no retrieval index writes, no
promotion execution, no promotion decision writes/store usage, no proof or
evidence creation, no durable state writes, no Formation Receipt writes, no
product-write, no accepted evidence ref writes, no product IDs, no GitHub
actuation, and no release authority.

## Purpose

Give a human operator a safe, repeatable manual QA procedure for the already
merged route/browser-validated path:

`final RAG answer candidate -> Review Memory binding -> Review Memory read/display UI -> promotion readiness packet -> route-level E2E validation -> browser validation -> manual UI inspection`

This runbook follows the recommendation from PR #853
`final_rag_answer_review_memory_operator_path_usability_audit_v0_1`. It also
uses PR #851 route-level E2E validation and PR #852 browser validation as the
existing validation sources.

## Scope

Use this runbook to manually QA the already-validated operator path without
adding product authority or new behavior.

The runbook covers:

- command execution order
- browser validation artifact inspection
- manual UI page inspection
- seeded Review Memory DB path handling
- visible boundary-note checks
- pass/fail rules
- public-safe evidence collection
- explicit stop conditions

It does not authorize new implementation work.

## Preconditions

- `main` contains merged PR #853:
  `final_rag_answer_review_memory_operator_path_usability_audit_v0_1`.
- The operator is working from the Augnes repo root, represented here as
  `<AUGNES_REPO_ROOT>`.
- Dependencies are already installed for the local repo.
- The operator can run npm scripts locally.
- A system Chrome/Chromium browser is available if the browser validation step
  is chosen.
- No private production data is required.

## Authority boundary

This runbook creates no new runtime authority.

No new API routes are added. No UI behavior changes are added. No DB schema or
migration changes are added. No Review Memory writes from UI are added. No POST
calls from UI are added.

This runbook does not expand final answer generation, live provider calls,
prompt sending, retrieval execution, source fetching, or retrieval index
writes.

This runbook does not execute promotion, write promotion decision records, use
or write the promotion decision store, add promotion decision routes/UI, create
proof/evidence, write claim/evidence records, mutate durable Perspective state,
write Formation Receipts, product-write, write accepted evidence refs, allocate
product IDs, execute GitHub actuation, or execute release work.

Review Memory is not truth. Review Memory is not proof. Review Memory is not
accepted evidence. Review Memory is not durable Perspective state. Final answer
candidate remains candidate-only. Source refs are lineage pointers, not proof.
Readiness packet remains diagnostic only. Smoke/CI/browser pass is not truth.

## What this runbook validates

This runbook validates that a human operator can repeat the existing path:

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
7. manual UI inspection:
   `/research-retrieval/final-rag-answer/review-memory`

It validates operator repeatability, UI readability, expected boundary notes,
seeded Review Memory DB path handling, invalid DB path blocking, private/raw
filter blocking, copied bounded packet non-authority wording, and the browser
observed request boundary.

## What this runbook does not validate

- Long-lived operator data quality.
- Production data behavior.
- Server-side outbound network absence.
- Live provider behavior.
- Live retrieval expansion.
- Source fetching.
- Retrieval index writes.
- Promotion execution.
- Promotion decision write/store behavior.
- Proof/evidence creation.
- Durable state mutation.
- Formation Receipt writes.
- Product-write behavior.
- Accepted evidence ref writes.
- Product ID allocation.
- GitHub or release execution.

## Required local environment

- A clean local Augnes checkout.
- Node/npm available.
- Existing repo dependencies available.
- Optional but expected for browser validation: local Chrome/Chromium.
- A browser window for manual UI inspection.

Do not hardcode private local paths in collected evidence. Use placeholders
such as `<AUGNES_REPO_ROOT>`, `<DEV_SERVER_PORT>`,
`<SEE_BROWSER_VALIDATION_REPORT_FOR_SEEDED_DB_PATH>`, and
`<SEE_BROWSER_VALIDATION_REPORT_FOR_ARTIFACT_DIR>`.

## Setup

1. Start from `<AUGNES_REPO_ROOT>`.
2. Confirm the current branch and working tree before manual QA.
3. If manual UI inspection is not already backed by a running local dev server,
   start the existing dev server in a separate terminal and record only the
   public-safe port placeholder:

```bash
npm run dev
```

Open the manual browser page at:

`http://localhost:<DEV_SERVER_PORT>/research-retrieval/final-rag-answer/review-memory`

## Step 1: run static validation

Run the static/baseline command group:

```bash
node --check scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs
npm run smoke:operator-path-manual-qa-runbook-v0-1
npm run smoke:final-rag-answer-review-memory-operator-path-usability-audit-v0-1
npm run smoke:final-rag-answer-review-memory-end-to-end-operator-path-v0-1
npm run smoke:final-rag-answer-review-memory-operator-browser-validation-v0-1
```

All commands must exit 0.

## Step 2: run route-level E2E validation

Run:

```bash
npm run smoke:final-rag-answer-review-memory-end-to-end-operator-path-v0-1
```

Expected result: direct route-handler validation passes for final RAG answer
candidate, Review Memory binding, Review Memory GET read/display, and
promotion readiness packet. The readiness packet remains diagnostic only.

## Step 3: run browser validation

Browser validation does not need to be rerun for this PR, but a human operator
using this runbook should run it during manual QA:

```bash
npm run browser:validate-final-rag-answer-review-memory-operator-path-v0-1
```

Expected result: the command launches a real browser, drives the existing UI,
writes a public-safe report and screenshots under `/tmp`, and exits 0.

## Step 4: inspect browser artifacts

Inspect only the artifact locations and summary counts. Do not copy artifact
contents into the repo.

Symbolic artifact paths:

- `/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1/report.json`
- `/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1/desktop.png`
- `/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1/mobile-390.png`

Confirm:

- `final_status` is `pass`.
- Browser validation launched a real browser.
- Desktop and mobile screenshots exist under /tmp.
- Forbidden browser request count is 0.
- External browser request count is 0.
- Relevant console error count is 0.
- Page error count is 0.
- Failed request count is 0.
- The local favicon 404 console message, if present, is treated as known noise.

Do not embed screenshots in repo docs. Do not copy raw report contents into
repo docs. Do not include raw browser dumps.

## Step 5: open the UI manually

Open:

`http://localhost:<DEV_SERVER_PORT>/research-retrieval/final-rag-answer/review-memory`

Expected result:

- UI page loads.
- `FinalRagAnswerReviewMemoryPanel` renders.
- The page is read/display-only.
- No write, promotion, product-write, proof/evidence, provider, prompt,
  retrieval, source-fetch, GitHub, or release controls appear.

## Step 6: use seeded Review Memory DB path

Use the seeded DB path from the browser validation report:

`<SEE_BROWSER_VALIDATION_REPORT_FOR_SEEDED_DB_PATH>`

Enter that path into the Review Memory DB path field. Record the seeded DB path
only as the placeholder above or as a repo-safe relative `.tmp/...` path. Do
not record private absolute paths.

Expected result:

- The path is accepted by the UI path policy.
- The list/read action can be run.
- No raw DB rows are displayed.

## Step 7: verify visible boundary notes

Confirm these visible notes are present:

- Review Memory is not truth.
- Review Memory is not proof.
- Review Memory is not accepted evidence.
- Review Memory is not durable Perspective state.
- Final answer candidate remains candidate-only.
- Source refs are lineage pointers, not proof.
- This UI is read/display only.
- Smoke/CI pass is not truth.

## Step 8: list and inspect final answer candidate Review Memory record

Run the UI list action.

Expected result:

- List action completes.
- A final answer candidate Review Memory record is visible.
- Candidate refs are public-safe symbolic refs.
- Source refs are public-safe lineage refs.
- The selected record opens without raw/private data.

## Step 9: load activity history

Open the selected record and load activity history.

Expected result:

- Activity history loads.
- Activity summaries are bounded.
- No raw route responses, raw DB rows, raw provider output, raw prompt text,
  raw retrieval output, raw source bodies, hidden reasoning, private paths,
  secrets, provider IDs, product IDs, terminal logs, or browser session dumps
  are displayed.

## Step 10: check copied bounded packet

Use the existing copy bounded packet control.

Expected result:

- Copied bounded packet is non-authoritative.
- It does not describe Review Memory as truth, proof, accepted evidence, or
  durable Perspective state.
- It does not describe readiness as promotion, approval, proof, evidence, or
  product authority.
- It does not include raw/private data.

## Step 11: verify invalid DB path blocking

Enter an invalid DB path such as a parent traversal or absolute private path
placeholder.

Expected result:

- Invalid DB path is blocked before fetch.
- The UI shows bounded `invalid_db_path` status.
- The raw invalid value is not echoed.
- No network fetch is made for the invalid path attempt.

## Step 12: verify private/raw filter blocking

Enter a private/raw marker in the filter field.

Expected result:

- Private/raw filter is blocked before fetch.
- The UI shows a bounded blocked status.
- The raw private value is not echoed.
- No network fetch is made for the private/raw filter attempt.

## Step 13: verify no forbidden route calls

Use the browser validation report and, if manually inspecting browser network
events, confirm:

- Browser-observed forbidden request count is 0.
- Browser-observed external request count is 0.
- No UI POST calls are observed.
- No provider route calls are observed.
- No prompt route calls are observed.
- No retrieval route calls are observed.
- No source-fetch route calls are observed.
- No product-write route calls are observed.
- No promotion execution route calls are observed.
- No proof/evidence route calls are observed.
- No durable-state route calls are observed.
- No Formation Receipt route calls are observed.
- No GitHub route calls are observed.
- No release route calls are observed.

Browser validation observes browser/page requests only. It is not server-side
outbound network instrumentation.

## Step 14: verify promotion readiness packet remains diagnostic

Use the route-level E2E validation output and readiness packet smoke result as
the readiness evidence.

Expected result:

- Readiness packet remains diagnostic only.
- `ready_for_operator_promotion_review`, when present, means future human
  review readiness only.
- No promotion execution occurs.
- No promotion decision write/store usage occurs.
- No proof/evidence creation occurs.
- No durable state mutation occurs.
- No Formation Receipt write occurs.
- No product-write occurs.
- No accepted evidence ref write occurs.
- No product ID allocation occurs.

## Pass criteria

- Required commands exit 0.
- Browser validation final_status is pass.
- Browser validation launched a real browser.
- Desktop and mobile screenshots are created under /tmp.
- UI page loads.
- Panel renders.
- Boundary notes are visible.
- Seeded DB path can be entered.
- List action completes.
- Final answer candidate Review Memory record is visible.
- Selected record opens.
- Activity history loads.
- Copied bounded packet is non-authoritative.
- Invalid DB path is blocked before fetch.
- Private/raw filter is blocked before fetch.
- Browser-observed forbidden request count is 0.
- Browser-observed external request count is 0.
- No UI POST calls are observed.
- No provider/prompt/retrieval/source-fetch/product-write/promotion/proof/
  durable-state/Formation Receipt/GitHub/release route calls are observed.
- Readiness packet remains diagnostic only.
- No promotion decision write/store usage occurs.
- No proof/evidence creation occurs.
- No durable state mutation occurs.
- No Formation Receipt write occurs.
- No product-write / accepted evidence ref write / product ID allocation occurs.
- Smoke/CI/browser pass is not described as truth.

## Fail criteria

- Any command exits nonzero.
- Browser validation cannot launch a real browser.
- Browser validation report is missing.
- Screenshots are missing.
- UI does not load.
- Boundary notes are absent.
- Forbidden route count is greater than 0.
- External request count is greater than 0.
- UI makes POST calls.
- UI calls provider/prompt/retrieval/source-fetch/product-write/promotion/
  proof/durable-state/Formation Receipt/GitHub/release routes.
- Raw/private data is displayed or copied.
- Invalid DB path triggers fetch.
- Private/raw filter triggers fetch.
- Readiness is described as promotion, approval, proof, evidence, or product
  authority.
- Promotion decision write/store usage occurs.
- Product-write or accepted evidence ref write occurs.
- Smoke/CI/browser pass is described as truth.

## Evidence to collect

Collect public-safe evidence only:

- command names and pass/fail status
- browser report path
- screenshot paths
- seeded DB path as symbolic or repo-safe relative path only
- observed forbidden request count
- observed external request count
- short manual notes about readability/friction

Do not collect in repo:

- raw DB rows
- screenshots unless separately approved
- raw route responses
- raw browser reports
- raw browser dumps
- secrets
- private paths
- provider IDs
- product IDs
- browser session dumps
- terminal logs

## Known warnings

These existing warnings may appear from legacy smokes and do not fail manual QA
when exit codes remain 0:

- `MODULE_TYPELESS_PACKAGE_JSON`
- `ExperimentalWarning: stripTypeScriptTypes`
- local favicon 404 console noise in browser validation

## Troubleshooting

- Browser unavailable: install or expose a system Chrome/Chromium and rerun
  browser validation. Do not mark browser validation passed without a real
  browser.
- Dev server port conflict: use the available dev server port reported by the
  local run and record it as `<DEV_SERVER_PORT>`.
- Missing browser report: rerun browser validation and stop if the report is
  still missing.
- Seeded DB path not obvious: read only the `seeded_review_memory_db_path`
  summary field from the browser report and record it as
  `<SEE_BROWSER_VALIDATION_REPORT_FOR_SEEDED_DB_PATH>` or a repo-safe
  `.tmp/...` path.
- Empty record list: confirm the seeded DB path came from the same browser
  validation run and that the list action used the seeded path.
- Boundary notes missing: stop; the manual QA run failed.
- Invalid DB path block not visible: stop; the manual QA run failed.
- Private/raw filter block not visible: stop; the manual QA run failed.
- Favicon 404 noise: ignore only the known local favicon 404 console message;
  do not ignore other console errors.
- MODULE_TYPELESS_PACKAGE_JSON warning: known legacy Node warning when the
  command exits 0.
- ExperimentalWarning: stripTypeScriptTypes warning: known legacy Node warning
  when the command exits 0.

## Out-of-scope actions

- Adding API routes.
- Adding UI behavior changes.
- Adding component/page files.
- Adding runtime helper files.
- Adding type contract files.
- Adding DB migrations.
- Adding provider adapters.
- Expanding retrieval behavior.
- Adding source fetching.
- Writing retrieval indexes.
- Writing Review Memory from UI.
- Executing promotion.
- Writing promotion decision records.
- Using or writing the promotion decision store.
- Adding promotion decision routes/UI.
- Creating proof/evidence.
- Writing claim/evidence records.
- Writing/applying durable Perspective state.
- Writing Formation Receipts.
- Product-writing.
- Writing accepted evidence refs.
- Allocating product IDs.
- Executing GitHub actuation.
- Executing release work.

## Stop conditions

Stop manual QA and report if:

- Any required command exits nonzero.
- A browser cannot launch for browser validation.
- Browser report or screenshots are missing after browser validation.
- The UI does not load or the panel does not render.
- Required boundary notes are missing.
- Invalid DB path or private/raw filter attempts trigger fetches.
- Any forbidden browser route call is observed.
- Any external browser request is observed.
- Any UI POST call is observed.
- Raw/private data is displayed or copied.
- Readiness is described as promotion, approval, proof, evidence, or product
  authority.
- Promotion decision write/store usage occurs.
- Product-write, accepted evidence ref write, or product ID allocation occurs.
- Smoke/CI/browser pass is described as truth.

## Next recommendation after manual QA

After this runbook is merged, the next recommendation is
`manual_qa_execution_report_v0_1` only after a human actually runs the runbook.

Do not recommend promotion decision writes yet. Do not recommend promotion
readiness UI binding before the runbook has been executed and reviewed.

## Additional command groups

Existing focused smokes:

```bash
npm run smoke:promotion-readiness-packet-from-review-memory-v0-1
npm run smoke:final-answer-candidate-review-ui-binding-v0-1
npm run smoke:final-rag-answer-review-memory-binding-v0-1
npm run smoke:final-rag-answer-generation-candidate-review-v0-1
npm run smoke:research-candidate-review-memory-db-routes-runtime-v0-1
npm run smoke:research-candidate-review-memory-db-store-runtime-v0-1
npm run smoke:perspective-promotion-runtime-contract-v0-1
npm run smoke:perspective-promotion-decision-store-v0-1
npm run smoke:product-write-accepted-evidence-ref-runtime-v0-1
npm run smoke:privacy-redaction-guard-v0-1
npm run smoke:authority-boundary-regression-v0-1
npm run smoke:runtime-audit-panel-runtime-completion-v0-1
```

Browser validation:

```bash
npm run browser:validate-final-rag-answer-review-memory-operator-path-v0-1
```

Type/diff:

```bash
npm run typecheck
git diff --check
git diff --cached --check
```
