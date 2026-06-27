# Authority Boundary Regression CI v0.1

## Purpose

`authority_boundary_regression_ci_v0_1` adds a static authority-boundary
regression smoke and a read-only GitHub Actions workflow that runs that smoke.
This slice is static-smoke-only and diagnostic-only.

The smoke watches for wording drift that could make candidates, provider
outputs, retrieval results, feedback, layout coordinates, Codex handoffs, PR
bodies, CI pass, smoke pass, Git refs, GitHub PRs, or product-write appear more
authoritative than they are.

## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md

This implements `authority_boundary_regression_ci_v0_1` from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It remains an operational roadmap, sequencing
guide, and authority-boundary checklist. Repo-local contracts, runtime slices,
and explicit authority boundaries remain authoritative.

## Relationship to Privacy Redaction Runtime Guard and Local Data Export/Import Policy

This slice follows `privacy_redaction_runtime_guard_v0_1` and
`local_data_export_import_policy_v0_1`.

Privacy Redaction Runtime Guard v0.1 blocks private, raw, provider, runtime,
URL, local path, secret-like, and opaque identifiers from becoming canonical
labels or public-safe export payloads.

Local Data Export/Import Policy v0.1 keeps export/import policy preview-only
and contract-only, blocks raw/private payloads, and blocks automatic import
actions such as auto-promote, auto-product-write, auto-proof/evidence-write,
auto-durable-state-apply, auto-provider-call, auto-retrieval, and
auto-Git/GitHub.

This CI smoke does not implement either runtime. It only checks repo-local text
for authority-boundary drift.

## Regression Categories

The smoke classifies positive authority claims across these families:

- candidate wording that promotes candidates into proof, fact, or accepted evidence
- evidence-candidate wording that promotes candidate material into accepted evidence
- Perspective delta candidate wording that promotes candidate material into committed state
- provider output wording that promotes output into truth, proof, or evidence
- provider confidence wording that promotes confidence into promotion readiness
- retrieval result wording that promotes retrieval into evidence or authority
- retrieval score wording that promotes scores into truth scores or promotion readiness
- RAG context wording that promotes context into truth
- feedback wording that promotes feedback into truth
- dismiss wording that promotes dismissal into deletion
- pin wording that promotes pinning into promotion
- layout coordinate wording that promotes coordinates into truth or authority
- salience score wording that promotes salience into a truth score
- Codex handoff draft wording that promotes a draft into execution approval
- Codex result report wording that promotes a report into proof, evidence, or state
- PR-body wording that promotes a PR body into authority
- CI-pass wording that promotes CI into proof, truth, or approval
- smoke-pass wording that promotes smoke into proof, truth, or approval
- Git commit/ref/tag/branch wording that promotes Git refs into approval, durable state, Core decision, or promotion
- GitHub branch/commit/PR wording that promotes GitHub surfaces into Core decision or automatic execution authority
- product-write wording that implies availability before explicit reentry
- product ID allocation wording that implies availability before explicit product-write contract
- raw/private/provider/thread/run/session/private URL/local path marker wording that allows canonical-label use
- export/import wording that allows auto-promote, auto-product-write, auto-proof/evidence-write, auto-durable-state-apply, auto-provider-call, auto-retrieval, or auto-Git/GitHub

## Static Smoke Behavior

The smoke is deterministic and static. It reads repo-local text files from
selected docs, types, fixtures, scripts, components, app, and lib surfaces while
skipping vendor directories, build artifacts, binary-like files, lockfiles, and
the roadmap guide. The roadmap guide is skipped by the scanner because it is an
operational checklist that may intentionally contain bad-claim examples.

The smoke has fixture-backed blocked examples and allowed negated-boundary
examples. It allows phrases such as:

- Candidate is not proof.
- Provider output is candidate-only.
- Retrieval result is not evidence.
- Feedback is not truth.
- Smoke pass is not truth.
- PR body is not authority.
- Git ref is not authority.
- Product-write remains parked by #686.

## GitHub Actions Workflow Boundary

`.github/workflows/authority-boundary-smoke.yml` runs only:

```bash
npm run smoke:authority-boundary-regression-v0-1
```

The workflow has `contents: read`, uses checkout and Node setup, installs with
`npm ci`, and runs the static smoke. It has no write permissions, no provider
or API secrets, no deployment, no GitHub mutation command, and no Git write
command.

CI pass is not truth, proof, approval, promotion, merge approval, release
approval, product-write authority, or durable state. CI failure is diagnostic,
not automatic rejection. Smoke pass is not truth. PR body is not authority. Git
ref is not authority. GitHub PR is not Core decision.

## Authority Boundary

Allowed true fields:

- `authority_boundary_regression_static_smoke_now`
- `github_actions_static_smoke_now`
- `diagnostic_only`
- `caller_provided_repo_text_only`

Forbidden false fields:

- `runtime_state_mutation_now`
- `db_query_or_write_now`
- `route_now`
- `ui_now`
- `provider_openai_call_now`
- `prompt_sent_now`
- `source_fetch_now`
- `retrieval_execution_now`
- `rag_answer_generation_now`
- `export_import_runtime_now`
- `git_ledger_export_runtime_now`
- `git_write_now`
- `github_api_call_now`
- `github_branch_create_now`
- `github_commit_create_now`
- `github_pr_create_now`
- `github_merge_now`
- `repository_file_write_now`
- `proof_or_evidence_record_now`
- `claim_or_evidence_write_now`
- `promotion_execution_now`
- `durable_state_write_now`
- `durable_state_apply_now`
- `formation_receipt_write_now`
- `product_write_now`
- `product_id_allocation_now`
- `codex_execution_authority`
- `github_automation_authority`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`
- `ci_pass_is_approval`
- `ci_failure_is_rejection`
- `pr_body_is_authority`
- `git_ref_is_authority`

It does not add runtime routes or UI. It does not query/write DB. It does not
call providers. It does not fetch sources. It does not execute retrieval/RAG. It
does not create proof/evidence. It does not promote Perspective. It does not
write/apply durable Perspective state. It does not write Formation Receipts. It
does not execute Git Ledger export. It does not call GitHub APIs for mutation.
It does not execute Git writes. It does not execute Codex. It does not
product-write or allocate product IDs.

Product-write remains parked by #686.

## Fixture Policy

`fixtures/authority-boundary-regression-baseline.sample.v0.1.json` is a
public-safe baseline fixture. It contains fixture versions, scanned surface
examples, classifier pattern names, allowed boundary phrases, expected blocked
examples, expected allowed examples, an authority boundary, and reason codes.

The fixture uses safe placeholder examples only. It must not include real
secrets, real provider IDs, real connector IDs, real uploaded-file IDs, real
private URLs, real local paths, raw source bodies, raw provider outputs, raw DB
rows, raw conversations, or hidden reasoning.

## What Is Allowed

- Static scanning of repo-local text.
- Diagnostic-only CI execution of the static smoke.
- Negated boundary phrases that explicitly deny authority.
- Safe placeholder markers inside blocked fixture examples.
- Read-only GitHub Actions permissions.

## What Is Forbidden

- Runtime state mutation.
- DB query/write.
- Routes or UI.
- Provider/OpenAI calls or prompt sending.
- Source fetch.
- Retrieval/RAG execution.
- Export/import runtime.
- Git Ledger export runtime.
- Git writes.
- GitHub mutation APIs.
- Proof/evidence or claim/evidence writes.
- Promotion execution.
- Durable Perspective state write/apply.
- Formation Receipt writes.
- Codex execution.
- Product-write or product ID allocation.
- Treating CI pass, smoke pass, PR body, Git ref, or GitHub PR as authority.

## Verification Expectations

Expected checks:

- `node --check scripts/smoke-authority-boundary-regression-v0-1.mjs`
- `npm run smoke:authority-boundary-regression-v0-1`
- `npm run smoke:privacy-redaction-guard-v0-1`
- `npm run smoke:local-data-export-policy-v0-1`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`
- `npm run smoke:release-postmerge-observer-notes-v0-1`

The smoke verifies docs, fixture, package script, workflow, latest-index
pointer, roadmap entry, authority boundary, classifier blocked/allowed fixture
examples, workflow read-only behavior, no real-looking private examples,
selected repo text scan, and narrow slice file scope.

## Deferred Work

Deferred work requires a future explicit roadmap slice and operator gate:

- runtime authority-boundary service
- UI reporting for regression findings
- DB-backed scan history
- provider-backed linting
- retrieval/RAG-backed analysis
- export/import runtime
- Git Ledger export runtime
- Git/GitHub mutation
- Codex execution
- product-write or product ID allocation
