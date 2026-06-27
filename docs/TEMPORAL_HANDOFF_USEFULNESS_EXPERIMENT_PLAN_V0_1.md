# Temporal Handoff Usefulness Experiment Plan v0.1

## Purpose

`temporal_handoff_usefulness_experiment_v0_1` defines a public-safe static
experiment plan for evaluating whether Temporal Perspective enhanced handoffs
improve Codex/human implementation quality compared with ordinary prompts and
existing Perspective/Handoff Capsule prompts.

This slice is experiment-plan-only and fixture-only. It defines comparison
groups, scenario design, scoring rubric, and operator review protocol. It does
not execute the experiment and does not store results.

## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md

This slice implements `temporal_handoff_usefulness_experiment_v0_1` from the
integrated roadmap guide. The roadmap guide is not SSOT. Existing repo-local
contracts and runtime slices remain authority for fields, behavior, and
runtime boundaries.

## Relationship to Temporal Handoff Diagnostic Sections

Temporal Handoff Diagnostic Sections v0.1 already describe diagnostic preview
fields for expected/observed deltas, decision holds, not-done classification,
source coverage, unresolved tensions, review cues, and authority boundaries.
This experiment plan uses those sections as review vocabulary only. It does not
build new diagnostic runtime, execute handoffs, or mutate work.

## Relationship to Codex Result Report Ingestion

Codex Result Report Ingestion v0.1 normalizes caller-provided Codex result
reports as candidate-only dogfooding input. Codex result report is candidate
input only. PR body is not authority. This experiment plan can later reference
normalized result-report records as review cues, but this slice does not ingest
new reports or write dogfooding records.

## Relationship to Authority Boundary Regression CI

Authority Boundary Regression CI v0.1 is the static guard for positive
authority drift. This plan uses match-local non-authority wording and keeps
experiment outputs diagnostic only. CI pass is not truth. Smoke pass is not
truth. PR body is not authority. GitHub refs are references only, not
authority.

## Relationship to Privacy Redaction Runtime Guard

Privacy Redaction Runtime Guard v0.1 is required before any future experiment
runtime stores, exports, or publishes report material. This plan and fixture
use public-safe symbolic refs and bounded summaries only. Raw/private payloads,
private URLs, local paths, secrets, raw conversations, and hidden reasoning are
out of scope.

## Relationship to Local Data Export/Import Policy

Local Data Export/Import Policy v0.1 remains policy-only and contract-only.
This plan does not implement export/import runtime. Any future export of
experiment review material must remain public-safe and must pass the privacy
guard before operator-gated runtime work is approved.

## Experiment Groups

The comparison groups are:

- `ordinary_codex_prompt`: ordinary Codex prompt from the current user request
  and repo instructions.
- `existing_perspective_handoff_capsule`: existing Perspective/Handoff Capsule
  prompt with current bounded context.
- `temporal_perspective_enhanced_handoff`: Temporal Perspective enhanced
  handoff that preserves expected/observed deltas, decision holds, not-done
  classification, unresolved tensions, source refs, and authority warnings.

## Scenario Design

The first scenario is a synthetic public-safe Augnes maintenance task with
expected docs, fixtures, scripts, package/index pointers, validation commands,
and a strict no-runtime boundary. The scenario intentionally includes:

- an omitted expected file risk
- a skipped validation command requiring a reason
- an unresolved tension about whether a past slice is actually complete
- a not-done item that must stay visible
- an expected/observed delta
- a decision hold when source refs are incomplete
- an overconfident narrative warning
- a product-write stopline check

The same scenario should be presented to all three groups. The experiment
operator records bounded summaries only. Experiment result is not truth.

## Evaluation Dimensions

Required dimensions:

- `expected_files_missing_detection`
- `expected_checks_missing_detection`
- `unresolved_tension_preservation`
- `authority_boundary_clarity`
- `source_refs_coverage`
- `not_done_classification_quality`
- `overconfident_narrative_warning_quality`
- `expected_observed_delta_clarity`
- `decision_hold_classification_quality`
- `single_event_baseline_rewrite_prevention`
- `privacy_boundary_preservation`
- `product_write_stopline_clarity`

## Scoring Rubric

Each dimension is scored as an operator review note, not as proof:

| Score | Meaning |
| --- | --- |
| `0_missing` | The group omitted the dimension or collapsed it into narrative confidence. |
| `1_weak` | The group mentioned the dimension but missed concrete refs or stoplines. |
| `2_adequate` | The group preserved the dimension with bounded public-safe refs. |
| `3_strong` | The group preserved the dimension, named review risk, and avoided authority drift. |
| `blocked` | The comparison cannot be scored without a missing operator-provided input. |

Handoff score is not proof. Better score is not approval. Worse score is not
rejection.

## Operator Review Protocol

1. Select one public-safe scenario packet.
2. Confirm all scenario refs are symbolic and bounded.
3. Run the three groups manually in separate future operator-approved sessions.
4. Record expected files, observed files, expected checks, observed checks,
   skipped checks, not-done items, unresolved tensions, warnings, and decision
   holds as bounded summaries.
5. Compare outputs with the scoring rubric.
6. Preserve ambiguity instead of forcing a winner.
7. Route any Codex result report through Codex Result Report Ingestion v0.1
   before future dogfooding ingestion work.

This slice does not call Codex and does not run validation commands.

## Expected/Observed Delta Capture Policy

Expected/observed deltas are review cues only. Missing expected files, missing
checks, unexpected files, skipped checks, and changed scope must be recorded as
public-safe symbolic refs. A delta can create a decision hold, but it cannot
create proof, approval, rejection, promotion, durable state, or product-write
authority.

## Not-Done Classification Policy

Not-done items must be classified without hiding them in a success narrative:

- `not_started`
- `partial`
- `blocked`
- `out_of_scope`
- `needs_operator_review`
- `complete`
- `unknown`

Not-done classification is review context only.

## Decision Hold Classification Policy

Decision holds preserve uncertainty and operator judgment:

- `none`
- `reactive_repair`
- `anticipatory_stop`
- `bounded_continue`
- `operator_decision_required`

A decision hold is not rejection. Absence of a hold is not approval.

## Privacy/Redaction Policy

The fixture and future operator packets must use public-safe symbolic refs only.
They must not include real GitHub API payloads, real PR payload dumps, real
terminal logs, real secrets, real provider IDs, real connector IDs, real
uploaded-file IDs, real private URLs, real local paths, raw source bodies, raw
provider outputs, raw retrieval outputs, raw DB rows, raw conversations,
hidden reasoning, or telemetry dumps.

Privacy guard coverage is required before any future runtime execution or
export/import work.

## Authority Boundary

Allowed now:

- `temporal_handoff_usefulness_experiment_plan_now`
- `fixture_only`
- `diagnostic_only`
- `future_operator_experiment_only`
- `caller_provided_scenario_only`

Forbidden now:

- experiment runtime execution
- telemetry ingestion
- analytics DB writes
- Codex execution
- GitHub API calls or GitHub mutation
- branch, commit, PR, or merge creation
- Git writes
- repository file writes as runtime behavior
- runtime state mutation
- DB query/write
- routes
- UI
- provider/OpenAI calls
- prompt sending
- source fetch
- retrieval/RAG execution
- proof/evidence or claim/evidence writes
- Perspective promotion
- durable Perspective state write/apply
- Formation Receipt writes
- Git Ledger export runtime
- export/import runtime
- product-write or product ID allocation

This slice does not execute experiments. This slice does not call providers.
This slice does not call Codex. This slice does not call GitHub. This slice
does not create branches, commits, PRs, or merges. This slice does not run
validation commands. This slice does not read or write files as runtime
behavior. This slice does not query/write DB. This slice does not add routes
or UI. This slice does not ingest telemetry. This slice does not execute
retrieval/RAG. This slice does not create proof/evidence. This slice does not
promote Perspective. This slice does not write/apply durable Perspective state.
This slice does not write Formation Receipts. This slice does not execute Git
Ledger export. This slice does not product-write or allocate product IDs.

Experiment result is not truth. Handoff score is not proof. Better score is not
approval. Worse score is not rejection. Product-write remains parked by #686.

## Fixture Policy

The fixture is a public-safe scenario sample. It uses synthetic project/task
examples, symbolic PR refs such as `pr-ref:sample-temporal-handoff`, symbolic
source refs, and placeholder file paths under `docs/`, `lib/`, `fixtures/`,
`scripts/`, and `components/`. It uses bounded summaries only.

Safe privacy placeholders may appear only inside explicit blocked/privacy
examples in future fixture work. This v0.1 fixture does not need blocked
privacy examples.

## Verification Expectations

Expected checks:

- `node --check scripts/smoke-temporal-handoff-usefulness-experiment-plan-v0-1.mjs`
- `npm run smoke:temporal-handoff-usefulness-experiment-plan-v0-1`
- `npm run smoke:codex-result-report-ingestion-v0-1`
- `npm run smoke:authority-boundary-regression-v0-1`
- `npm run smoke:privacy-redaction-guard-v0-1`
- `npm run smoke:local-data-export-policy-v0-1`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

Smoke/CI pass is not truth.

## Deferred Work

- Future operator-approved experiment execution.
- Future telemetry or analytics design, if explicitly approved.
- Future dogfooding ingestion of reviewed result summaries.
- Future export/import policy integration.
- Any runtime, route, UI, DB, provider, retrieval/RAG, Git/GitHub, Codex,
  proof/evidence, durable state, Formation Receipt, Git Ledger, product-write,
  or product ID allocation behavior.
