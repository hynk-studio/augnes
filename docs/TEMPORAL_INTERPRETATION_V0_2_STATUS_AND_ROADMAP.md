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
- Browser/Cockpit screenshot validation for the read-only Temporal Preview
  panel.
- Persistence boundary design v0.1 as design guidance for future
  authority-bearing work.
- Work/evidence binding convention and seeded work anchor.
- TemporalPreviewReviewArtifact v0.1 complete as a bounded
  review-artifact capture/read/surface chain.
- TemporalPreviewReviewArtifact schema design v0.1.
- TemporalPreviewReviewArtifact read model v0.1 with table, helper, read-only
  list/get APIs, and smoke coverage.
- TemporalPreviewReviewArtifact forbidden-persistence fixture corpus with a
  dedicated smoke.
- TemporalPreviewReviewArtifact non-public capture helper with dedicated smoke.
- TemporalPreviewReviewArtifact private insert helper, idempotency storage,
  duplicate source/hash policy, and public bounded capture route.
- Evidence Pack read-only awareness for bounded
  `TemporalPreviewReviewArtifact` rows.
- Cockpit read-only Temporal review artifact browser.

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

### Cockpit screenshot validation

`docs/TEMPORAL_INTERPRETATION_COCKPIT_SCREENSHOT_VALIDATION.md` captures the
browser/Cockpit validation result for the read-only Temporal Interpretation
Preview panel. The recorded pass used a seeded local runtime with
`OPENAI_API_KEY` unset, observed `generator=mock`, saw guardrails pass, and
confirmed structured `active_context_admission.decisions` rendered with
candidate, category, source authority, reason, evidence refs, counterexample
refs, residual tension refs, admission note, hidden fallback text, and no write
controls in the panel.

### Persistence boundary design

`docs/TEMPORAL_INTERPRETATION_PERSISTENCE_DESIGN_V0_1.md` defines future
Temporal Interpretation persistence boundaries before any DB schema, API route,
runtime persistence, Cockpit code, or ChatGPT App tool exists for this area. It
separates possible future review artifacts, PerspectiveSnapshot candidates,
RawEpisodeBundle refs, and admission decision records while keeping current
Temporal Preview read-only and non-authoritative.

### Work/evidence binding convention

`docs/TEMPORAL_INTERPRETATION_WORK_AND_EVIDENCE_BINDING.md` defines the
dedicated Temporal Interpretation work/evidence binding convention for future
review artifact persistence work. `AG-TEMPORAL-INTERPRETATION` now exists as a
seeded demo/runtime work item through `scripts/demo-seed.mjs`, and canonical
`target_ref` / `source_ref` usage remains available for historical rows and
unseeded runtimes.

### Review artifact schema design

`TemporalPreviewReviewArtifact` v0.1 is complete and closed as a bounded
review-artifact capture/read/surface chain. The closeout summary lives at
`docs/TEMPORAL_PREVIEW_REVIEW_ARTIFACT_V0_1_CLOSEOUT.md`. The completed chain
includes the seeded `AG-TEMPORAL-INTERPRETATION` work anchor, schema/read
model, read-only GET list/get APIs, forbidden fixture corpus, non-public
capture helper, private insert helper, idempotency storage and duplicate
source/hash policy, public bounded capture route, Evidence Pack read-only
awareness, and Cockpit read-only browser.

The schema design remains documented at
`docs/TEMPORAL_PREVIEW_REVIEW_ARTIFACT_SCHEMA_DESIGN_V0_1.md`. Evidence Pack
reads artifacts through the helper and exposes `temporal_review_artifact_trace`
for the canonical Temporal work anchor. The Cockpit browser loads the GET list
API and keeps artifact selection local to the UI. These completed surfaces do
not add Cockpit write controls, ChatGPT App tools, OpenAI calls, GitHub
publication adapter calls, replay, publish, approval, state mutation,
PerspectiveSnapshot runtime, RawEpisodeBundle runtime, or artifact-derived
authority. `reviewer_verdict` remains review metadata, not approval, and
`guardrail_passed` remains guardrail output, not readiness or state commit
authority.

The forbidden-persistence fixture corpus now centralizes cases for top-level
forbidden fields, nested forbidden fields, summary/evidence separation,
authority confusion, link validation, and route/source validation in
`lib/temporal-review-artifact-fixtures.ts`. The
`smoke:temporal-forbidden-persistence-fixtures` gate runs those fixtures
through the current smoke-only insert helper, inserts only one valid bounded
artifact, and does not add capture/create routes or new runtime authority.

The non-public capture helper at `lib/temporal-review-artifact-capture.ts`
converts a bounded Temporal Preview response plus manual review metadata into
`TemporalPreviewReviewArtifactInput`. Its smoke validates bounded preview JSON,
active-context admission decisions, guardrails, refs, manual review metadata,
capture-specific forbidden cases, reusable forbidden fixtures through capture
output, and read-only list/get behavior. It does not add a public create route
or new runtime authority.

### Smoke coverage

Current smoke coverage includes:

- `smoke:temporal-preview`
- `smoke:temporal-hardening`
- `smoke:temporal-manual-review-report`
- `smoke:temporal-route-review-report`
- `smoke:cockpit-temporal-admission`
- `smoke:temporal-cockpit-screenshot-validation`
- `smoke:temporal-openai-validation-docs`
- `smoke:temporal-v02-status-roadmap`
- `smoke:temporal-persistence-design`
- `smoke:temporal-work-binding`
- `smoke:temporal-work-seed`
- `smoke:temporal-review-artifact-schema-design`
- `smoke:temporal-review-artifact-read-model`
- `smoke:temporal-forbidden-persistence-fixtures`
- `smoke:temporal-review-artifact-capture-helper`
- `smoke:temporal-review-artifact-evidence-pack`
- `smoke:cockpit-temporal-review-artifacts`
- `smoke:temporal-review-artifact-v01-closeout`

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
| `smoke:temporal-cockpit-screenshot-validation` | Confirms the browser/Cockpit screenshot validation report exists and records mock generator, guardrails, structured admission decisions, visible decision fields, read-only boundary, and no write controls. | Complete | `scripts/smoke-temporal-cockpit-screenshot-validation.mjs` |
| `smoke:temporal-openai-validation-docs` | Confirms the OpenAI-path validation harness/report exist and normal smoke does not require OpenAI. | Complete | `scripts/smoke-temporal-openai-validation-docs.mjs` |
| `smoke:temporal-v02-status-roadmap` | Confirms the v0.2 status/roadmap doc exists and is indexed from README/onboarding. | Complete | `scripts/smoke-temporal-v02-status-roadmap.mjs` |
| `smoke:temporal-persistence-design` | Confirms the persistence design doc exists, defines review-artifact and future-candidate boundaries, references the v0.2 validation artifacts, and is indexed from README/onboarding. | Complete | `scripts/smoke-temporal-persistence-design.mjs` |
| `smoke:temporal-work-binding` | Confirms the work/evidence binding doc exists, defines the canonical work anchor, target/source refs, AG-004 misuse warning, session boundary, future artifact linkage, and related doc references. | Complete | `scripts/smoke-temporal-work-binding.mjs` |
| `smoke:temporal-work-seed` | Confirms `AG-TEMPORAL-INTERPRETATION` exists in a seeded temp runtime and can bind bounded evidence while protected authority rows remain unchanged. | Complete | `scripts/smoke-temporal-work-seed.mjs` |
| `smoke:temporal-review-artifact-schema-design` | Confirms the review artifact schema design doc exists, defines the conceptual table, required fields, forbidden fields, Evidence Pack integration, read-only list/get API design, and no-implementation boundary. | Complete | `scripts/smoke-temporal-review-artifact-schema-design.mjs` |
| `smoke:temporal-review-artifact-read-model` | Confirms the table, validation/read helper, read-only list/get APIs, forbidden-field rejection, summary/evidence separation, AG-TEMPORAL-INTERPRETATION binding, and no-authority boundary with a temp DB. | Complete | `scripts/smoke-temporal-review-artifact-read-model.mjs` |
| `smoke:temporal-forbidden-persistence-fixtures` | Confirms the reusable fixture corpus rejects top-level forbidden fields, nested forbidden fields, summary/evidence confusion, authority confusion, missing links, and invalid route/source shape while inserting only one valid artifact. | Complete | `scripts/smoke-temporal-forbidden-persistence-fixtures.mjs` |
| `smoke:temporal-review-artifact-capture-helper` | Confirms the internal capture helper builds bounded artifact input from a mock preview response, rejects capture-specific forbidden cases, keeps reusable forbidden fixtures rejected through capture output, and preserves no-authority boundaries. | Complete | `scripts/smoke-temporal-review-artifact-capture-helper.mjs` |
| `smoke:temporal-review-artifact-evidence-pack` | Confirms Evidence Pack reports no-artifact gaps and latest-artifact summaries without calling capture, fetch, OpenAI, GitHub, or mutating protected authority rows. | Complete | `scripts/smoke-temporal-review-artifact-evidence-pack.mjs` |
| `smoke:cockpit-temporal-review-artifacts` | Confirms the Cockpit read-only Temporal Review Artifacts browser, GET-only list loading, no-artifact gaps, artifact-present detail fields, linked evidence/session/PR visibility, no capture route use, and no protected authority row mutation. | Complete | `scripts/smoke-cockpit-temporal-review-artifacts.mjs` |
| `smoke:temporal-review-artifact-v01-closeout` | Confirms docs mark TemporalPreviewReviewArtifact v0.1 complete, Evidence Pack and Cockpit awareness complete, and future authority-bearing work out of scope. | Complete | `scripts/smoke-temporal-review-artifact-v01-closeout.mjs` |
| `validate:temporal-openai-path` | Opt-in live OpenAI-path schema and guardrail validation. | Complete for one fixture pass | `scripts/validate-temporal-openai-path.mjs` and `docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md` |
| `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_MOCK_PREVIEW_V0_1.md` | Filled manual review of deterministic mock preview output. | Complete | Passing report with preserved counterexample and residual tension refs |
| `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md` | Filled manual review of real route output captured in mock mode. | Complete | Passing report with `generator: mock`, zero warnings, preserved counterexample and residual tension refs |
| `docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md` | Redacted OpenAI-path validation report. | Complete | `generator=openai`, one OpenAI call, seven decisions, zero warnings, no secrets |
| Cockpit Temporal Preview rendering | Reviewer-visible read-only rendering for admission decisions. | Complete at source/smoke/browser-validation level | `smoke:cockpit-temporal-admission`; `docs/TEMPORAL_INTERPRETATION_COCKPIT_SCREENSHOT_VALIDATION.md` |

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
- Cockpit rendering has one mock-mode browser screenshot/DOM validation pass,
  not a cross-browser visual regression suite.
- Persistence v0.1 is design only, not schema or runtime persistence.
- Work/evidence binding v0.1 has a seeded demo/runtime work anchor; it is not
  state authority.
- No durable `PerspectiveSnapshot` persistence.
- No `RawEpisodeBundle` linkage.
- No learned temporal routing policy.
- No active context retrieval/admission algorithm over a real historical corpus
  yet.

## Roadmap options

| Option | Value | Risk | Prerequisites | Recommended priority |
| --- | --- | --- | --- | --- |
| A. Route-captured manual review report | Confirms the manual review process works against an actual route response, not only fixture construction. | May expose route/demo context gaps that require fixture updates. | Running local route and a bounded review capture. | complete |
| B. Browser/Cockpit screenshot validation | Confirms reviewer-visible rendering works in the real browser surface. | Screenshot tests can be brittle if UI layout is still moving. | Stable local Cockpit startup and deterministic preview output. | complete |
| C. OpenAI validation corpus expansion | Tests more semantic cases and model variability. | Costs API calls and may blur the opt-in boundary if not documented tightly. | More fixtures, redaction discipline, explicit key-provided runs. | soon |
| D. Temporal Interpretation persistence boundary design | Defines what could be persisted later, what remains forbidden, and how review artifacts differ from durable state. | Could be mistaken for implementation if not kept explicitly design-only. | Route-captured review, Cockpit validation, OpenAI-path validation, manual review template. | complete |
| E. Dedicated Temporal Interpretation work item / evidence binding | Gives this slice durable project traceability without changing preview authority. | Could be mistaken for preview-created evidence if wording is loose. | Existing work/evidence binding conventions and explicit non-authority language. | complete with seeded demo/runtime work item |
| E2. TemporalPreviewReviewArtifact schema design | Defines the bounded review artifact schema before any migration or route exists. | Could be mistaken for implementation if wording is loose. | Persistence design, work/evidence binding, seeded work anchor, route review, Cockpit validation, OpenAI validation. | complete |
| E3. TemporalPreviewReviewArtifact read model | Adds the bounded artifact table, helper, and read-only list/get APIs without create/capture authority. | Future callers could mistake read availability for approval or memory admission if boundaries are omitted. | Schema design, seeded work anchor, forbidden-field validation, temp DB smoke. | complete |
| E4. TemporalPreviewReviewArtifact forbidden-persistence fixtures | Centralizes reusable invalid persistence cases before capture/create work. | Fixture drift could hide future create-route regressions if not reused by later helpers. | Read-model helper validation and seeded work anchor. | complete |
| E5. TemporalPreviewReviewArtifact non-public capture helper | Converts bounded preview responses plus manual review metadata into artifact input without exposing a route. | Future route work could over-broaden capture unless it reuses helper validation and fixture gates. | Forbidden fixture corpus, read-model helper validation, seeded work anchor. | complete |
| E6. TemporalPreviewReviewArtifact v0.1 closeout | Marks the bounded review-artifact capture/read/surface chain complete and stops v0.1 expansion before authority-bearing work. | Loose wording could invite extra capture/write controls under v0.1. | PR #132 Evidence Pack awareness and PR #133 Cockpit browser merged. | complete |
| F. RawEpisodeBundle-derived refs design | Defines how future raw episode references could feed interpretation. | Premature runtime design could overfit current fixtures. | Stable route/Cockpit review artifacts and authority model. | later |
| G. PerspectiveSnapshot persistence design | Defines durable snapshot boundaries before implementation. | High authority risk if persistence starts before review semantics settle. | Route-captured review, UI validation, broader guardrail confidence. | later |
| H. Active context retrieval/admission algorithm | Moves beyond fixture/simple-context admission toward real corpus selection. | Retrieval mistakes could make stale or summary-only context look authoritative. | Corpus model, source authority taxonomy, evaluation fixtures. | later |
| I. Temporal routing / learned policy research | Explores whether interpretation should guide future routing decisions. | Significant authority and autonomy risk. | Strong evidence model, human review gates, retrieval evaluation. | defer |
| J. ChatGPT App read-only Temporal Preview tool | Exposes preview inspection to another read-only surface when appropriate. | Surface confusion if users infer write authority or approval power. | Stable API contract, auth/surface role design, route/Cockpit validation. | defer |

## Recommended next step

Stop expanding `TemporalPreviewReviewArtifact` v0.1 after the closeout. Return
to the broader productization roadmap. Preferred next productization options
are GitHub App/token management or Cockpit product UI / Core-gated
write-control design.

Reason:

- The bounded review-artifact chain now has work anchoring, schema/read model,
  read-only APIs, forbidden fixtures, capture helper, private insert helper,
  idempotency, public bounded capture route, Evidence Pack awareness, Cockpit
  browsing, and closeout smoke coverage.
- Adding more to v0.1 risks blurring review context with authority-bearing
  runtime work.
- Durable `PerspectiveSnapshot`, `RawEpisodeBundle`, approval-gated
  interpretation commit, broader OpenAI validation corpus, Cockpit
  capture/write controls, and ChatGPT App write/create tools should remain
  separate future designs.

## Appendix: relevant docs and scripts

- `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT.md`
- `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_MOCK_PREVIEW_V0_1.md`
- `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md`
- `docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md`
- `docs/TEMPORAL_INTERPRETATION_PERSISTENCE_DESIGN_V0_1.md`
- `docs/TEMPORAL_INTERPRETATION_WORK_AND_EVIDENCE_BINDING.md`
- `docs/TEMPORAL_PREVIEW_REVIEW_ARTIFACT_SCHEMA_DESIGN_V0_1.md`
- `docs/TEMPORAL_PREVIEW_REVIEW_ARTIFACT_V0_1_CLOSEOUT.md`
- `lib/temporal-interpretation/admission.ts`
- `lib/temporal-interpretation/fixtures.ts`
- `lib/temporal-interpretation/guardrails.ts`
- `lib/temporal-review-artifact-fixtures.ts`
- `lib/temporal-review-artifact-capture.ts`
- `scripts/smoke-temporal-preview.mjs`
- `scripts/smoke-temporal-hardening.mjs`
- `scripts/smoke-temporal-manual-review-report.mjs`
- `scripts/smoke-temporal-route-review-report.mjs`
- `scripts/smoke-cockpit-temporal-admission.mjs`
- `scripts/smoke-temporal-cockpit-screenshot-validation.mjs`
- `scripts/smoke-temporal-openai-validation-docs.mjs`
- `scripts/smoke-temporal-v02-status-roadmap.mjs`
- `scripts/smoke-temporal-persistence-design.mjs`
- `scripts/smoke-temporal-work-binding.mjs`
- `scripts/smoke-temporal-work-seed.mjs`
- `scripts/smoke-temporal-review-artifact-schema-design.mjs`
- `scripts/smoke-temporal-review-artifact-read-model.mjs`
- `scripts/smoke-temporal-forbidden-persistence-fixtures.mjs`
- `scripts/smoke-temporal-review-artifact-capture-helper.mjs`
- `scripts/smoke-temporal-review-artifact-v01-closeout.mjs`
- `scripts/validate-temporal-openai-path.mjs`
