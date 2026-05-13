# Temporal Interpretation v0.2 Status and Roadmap

## Executive summary

Temporal Interpretation v0.2 is a read-only, non-authoritative interpretation
preview layer. It helps reviewers inspect how current project/demo context,
summary refs, evidence anchors, counterexamples, residual tensions, authority
boundaries, and safe next steps are being interpreted before any durable runtime
productization exists.

The v0.2 slice includes:

- Active context admission rubric.
- Optional `active_context_admission` output with structured decisions.
- Semantic fidelity fixtures.
- Guardrail hardening.
- Manual review report template and filled mock review report.
- Route-captured mock-mode manual review report.
- Cockpit read-only rendering for admission decisions.
- OpenAI-path validation for the strict preview shape.

It is not:

- Durable `PerspectiveSnapshot` runtime.
- `RawEpisodeBundle` runtime.
- Approval authority.
- Proof publication authority.
- State commit/reject authority.
- Autonomous routing policy.
- Memory storage system.

## Completed components

### API / Preview route

`POST /api/temporal-interpretation/preview` can return a read-only
PerspectiveSnapshot-like preview for current project/demo context. The route
preserves evidence anchors, summary refs, source authority profile,
counterexamples, residual tensions, transition relation, active context
admission rationale, active context admission decisions, suppressed
alternatives, temporal hierarchy, memory lifecycle, interpretive drivers,
`safe_next_step`, and a non-authority boundary.

The route does not commit state, approve work, publish proof, replay delivery,
call the GitHub publication adapter, persist `PerspectiveSnapshot` data, create
`RawEpisodeBundle` data, or grant Cockpit write authority.

### Mock path

The deterministic mock path remains the normal local fallback. If
`OPENAI_API_KEY` is unset, the preview generator reports `mock`. If an OpenAI
call fails in the opt-in path, the route can return `mock_fallback` with a
warning. The mock output is bounded by fixtures and deterministic guardrails so
smoke checks do not depend on network or credentials.

### OpenAI path

The OpenAI path is validated by `scripts/validate-temporal-openai-path.mjs` and
documented in `docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md`. The
recorded validation pass observed:

- `generator=openai`
- OpenAI call count `1`
- `active_context_admission` generated
- Decision count `7`
- Guardrails passed
- Warning count `0`
- Counterexamples preserved
- Residual tensions preserved
- Summary/evidence separation confirmed
- `safe_next_step` non-authority confirmed
- No secrets committed or logged

This path is explicit opt-in validation/generation only. It is not part of
normal smoke coverage and does not make `OPENAI_API_KEY` required for local
checks.

### active_context_admission

`active_context_admission` adds reviewer-visible admission decisions for
candidate context. Decisions distinguish committed or trace-backed active
context, recallable bounded context, summary-only context, active residual
tensions, active boundary/counterexample context, stale readiness candidates,
duplicates, and out-of-scope context.

These decisions are deterministic review hints only. They do not admit memory
automatically, create evidence, commit state, approve work, publish proof,
route agents, or replace evidence refs.

### Guardrails

The guardrails check structural and fixture-aware conditions around:

- Summary-only refs not becoming evidence anchors.
- Required counterexample preservation.
- Required residual tension preservation.
- User preference not becoming factual readiness or approval.
- Unsafe authority language in `safe_next_step`.
- P4 readiness overclaiming.
- Stale readiness candidates not being treated as active authority.
- Duplicate and out-of-scope context admission handling.

Guardrails can fail the preview or emit warnings, depending on the condition.
They are local deterministic checks, not full semantic truth verification.

### Fixtures

`lib/temporal-interpretation/fixtures.ts` defines bounded semantic fidelity
fixtures, including the valid review fixture used by mock and OpenAI-path
validation. Fixtures encode expected evidence anchors, summary-only refs,
counterexample refs, residual tension refs, and admission expectations.

### Manual review report

`docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT.md` defines the manual review
template. It asks reviewers to inspect preview input/output, source refs,
admission decisions, counterexamples, residual tensions, summary/evidence
separation, authority boundary checks, safe-next-step language, verdict, notes,
and follow-up action.

`docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_MOCK_PREVIEW_V0_1.md` is the
filled deterministic mock review report for
`TEMPORAL_HARDENING_FIXTURES[0]` / `valid_review_bounded_preview`.

`docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md` is
the filled mock-mode route-captured review report for a real
`POST /api/temporal-interpretation/preview` response with `OPENAI_API_KEY`
unset.

### Cockpit rendering

The Runtime Cockpit Temporal Interpretation Preview panel renders
`active_context_admission.decisions` read-only when present. This makes
admission categories, reasons, source authority, evidence refs,
counterexample refs, and residual tension refs visible to reviewers without
adding Cockpit write controls or browser-side authority.

### OpenAI validation report

`docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md` captures the opt-in
OpenAI-backed validation result for the strict
`active_context_admission` schema. It is a validation artifact only and records
the non-authority boundary, guardrail result, preserved counterexamples,
preserved residual tensions, summary/evidence separation, `safe_next_step`
review, and no-secret handling.

### Smoke coverage

Current smoke coverage includes:

- `smoke:temporal-preview`
- `smoke:temporal-hardening`
- `smoke:temporal-manual-review-report`
- `smoke:temporal-route-review-report`
- `smoke:cockpit-temporal-admission`
- `smoke:temporal-openai-validation-docs`
- `smoke:temporal-v02-status-roadmap`

`validate:temporal-openai-path` is intentionally separate opt-in validation,
not normal smoke.

## Validation matrix

| Artifact / check | Purpose | Status | Evidence |
| --- | --- | --- | --- |
| `smoke:temporal-preview` | Confirms the preview route returns a bounded read-only Temporal Interpretation Preview. | Complete | `scripts/smoke-temporal-preview.mjs` |
| `smoke:temporal-hardening` | Confirms fixture-aware guardrails catch drift and preserve required semantic refs. | Complete | `scripts/smoke-temporal-hardening.mjs` |
| `smoke:temporal-manual-review-report` | Confirms the manual review template and filled mock review report exist and contain required review fields. | Complete | `scripts/smoke-temporal-manual-review-report.mjs` |
| `smoke:temporal-route-review-report` | Confirms the route-captured mock-mode manual review report exists and records route endpoint, mock generator, admission decisions, refs, authority checks, and raw JSON boundary. | Complete | `scripts/smoke-temporal-route-review-report.mjs` |
| `smoke:cockpit-temporal-admission` | Confirms Cockpit source renders structured `active_context_admission.decisions` read-only. | Complete | `scripts/smoke-cockpit-temporal-admission.mjs` |
| `validate:temporal-openai-path` | Opt-in live OpenAI-path schema and guardrail validation. | Complete for one fixture pass | `scripts/validate-temporal-openai-path.mjs` and `docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md` |
| `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_MOCK_PREVIEW_V0_1.md` | Filled manual review of deterministic mock preview output. | Complete | Passing report with preserved counterexample and residual tension refs |
| `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md` | Filled manual review of real route output captured in mock mode. | Complete | Passing report with `generator: mock`, zero warnings, preserved counterexample and residual tension refs |
| `docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md` | Redacted OpenAI-path validation report. | Complete | `generator=openai`, one OpenAI call, seven decisions, zero warnings, no secrets |
| Cockpit Temporal Preview rendering | Reviewer-visible read-only rendering for admission decisions. | Complete at source/smoke level | `smoke:cockpit-temporal-admission`; no browser screenshot validation yet |

## Guarded failure modes

| Failure mode | Current mitigation |
| --- | --- |
| Summary-only evidence misuse | Fixtures include summary-only refs; guardrails reject or warn if summary refs become evidence anchors; manual review checks summary/evidence separation. |
| Missing counterexamples | Fixtures define expected counterexample refs; guardrails verify preservation; manual review confirms visible counterexample refs; Cockpit rendering exposes decision refs when present. |
| Residual tension omission | Fixtures define expected residual tension refs; guardrails verify preservation; manual review confirms visible residual tensions; Cockpit rendering exposes residual tension refs when present. |
| User preference treated as factual readiness | Admission rubric marks preference as recallable or bounded context, not factual readiness; guardrails and manual review check that preference does not become approval/readiness. |
| Overconfident `safe_next_step` | Guardrails scan for unsafe authority language; manual review checks whether the next step stays non-authoritative. |
| P4 readiness overclaiming | Guardrails reject claims that the preview is durable `PerspectiveSnapshot` or full P4 runtime readiness; manual review checks authority boundaries. |
| Stale readiness treated as active authority | Admission rubric distinguishes stale or pending readiness from active evidence; fixtures/guardrails cover stale readiness handling. |
| Duplicate/out-of-scope context mishandling | Admission rubric includes duplicate and out-of-scope categories; fixture coverage and guardrails check that these candidates are not promoted as active authority. |

## Current authority boundary

Temporal Interpretation v0.2 is:

- Read-only.
- Non-authoritative.
- No state mutation.
- No approval, publish, or replay.
- No durable `PerspectiveSnapshot`.
- No `RawEpisodeBundle`.
- No evidence creation by Temporal Preview.
- No GitHub publication adapter.
- OpenAI path only in explicit opt-in validation/generation, not normal smoke.

## Known limitations

- Admission rubric is deterministic and fixture/simple-context driven, not a
  retrieval engine.
- Guardrails are structural plus fixture-aware, not full semantic truth
  verification.
- Manual review currently has one filled mock/fixture report and one
  route-captured mock-mode report, not a large corpus.
- OpenAI validation is one pass on the fixture context, not exhaustive.
- Cockpit rendering is static/read-only and not browser-screenshot validated.
- No durable `PerspectiveSnapshot` persistence.
- No `RawEpisodeBundle` linkage.
- No learned temporal routing policy.
- No active context retrieval/admission algorithm over a real historical corpus
  yet.

## Roadmap options

| Option | Value | Risk | Prerequisites | Recommended priority |
| --- | --- | --- | --- | --- |
| A. Route-captured manual review report | Confirms the manual review process works against an actual route response, not only fixture construction. | May expose route/demo context gaps that require fixture updates. | Running local route and a bounded review capture. | complete |
| B. Browser/Cockpit screenshot validation | Confirms reviewer-visible rendering works in the real browser surface. | Screenshot tests can be brittle if UI layout is still moving. | Stable local Cockpit startup and deterministic preview output. | now |
| C. OpenAI validation corpus expansion | Tests more semantic cases and model variability. | Costs API calls and may blur the opt-in boundary if not documented tightly. | More fixtures, redaction discipline, explicit key-provided runs. | soon |
| D. Dedicated Temporal Interpretation work item / evidence binding | Gives this slice durable project traceability without changing preview authority. | Could be mistaken for preview-created evidence if wording is loose. | Existing work/evidence binding conventions and explicit non-authority language. | soon |
| E. RawEpisodeBundle-derived refs design | Defines how future raw episode references could feed interpretation. | Premature runtime design could overfit current fixtures. | Stable route/Cockpit review artifacts and authority model. | later |
| F. PerspectiveSnapshot persistence design | Defines durable snapshot boundaries before implementation. | High authority risk if persistence starts before review semantics settle. | Route-captured review, UI validation, broader guardrail confidence. | later |
| G. Active context retrieval/admission algorithm | Moves beyond fixture/simple-context admission toward real corpus selection. | Retrieval mistakes could make stale or summary-only context look authoritative. | Corpus model, source authority taxonomy, evaluation fixtures. | later |
| H. Temporal routing / learned policy research | Explores whether interpretation should guide future routing decisions. | Significant authority and autonomy risk. | Strong evidence model, human review gates, retrieval evaluation. | defer |
| I. ChatGPT App read-only Temporal Preview tool | Exposes preview inspection to another read-only surface when appropriate. | Surface confusion if users infer write authority or approval power. | Stable API contract, auth/surface role design, route/Cockpit validation. | defer |

## Recommended next step

Next should be browser/Cockpit screenshot validation, not durable persistence
yet.

Reason:

- v0.2 has API/mock/OpenAI/schema/fixture/UI validation.
- The project has now observed one real route output and confirmed the manual
  review process still works.
- Before persistence, the project should confirm the same reviewer-visible
  state in the Cockpit/browser surface.
- Durable `PerspectiveSnapshot` or `RawEpisodeBundle` runtime should wait until
  route/Cockpit review artifacts are stable.

## Appendix: relevant docs and scripts

- `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT.md`
- `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_MOCK_PREVIEW_V0_1.md`
- `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md`
- `docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md`
- `lib/temporal-interpretation/admission.ts`
- `lib/temporal-interpretation/fixtures.ts`
- `lib/temporal-interpretation/guardrails.ts`
- `scripts/smoke-temporal-preview.mjs`
- `scripts/smoke-temporal-hardening.mjs`
- `scripts/smoke-temporal-manual-review-report.mjs`
- `scripts/smoke-temporal-route-review-report.mjs`
- `scripts/smoke-cockpit-temporal-admission.mjs`
- `scripts/validate-temporal-openai-path.mjs`
