# Feedback Influenced Surfacing Preview Runtime Completion v0.1

## Purpose

This slice implements `feedback_influenced_surfacing_preview_runtime_completion_v0_1`
as the runtime completion for original Phase 5.7 feedback-influenced surfacing
preview requirements.

It reads DB-backed feedback aggregation output and produces advisory surfacing
previews only. It does not apply surfacing, mutate ranking, suppress sources,
delete candidates, or grant product-write authority.

## Relationship to the integrated roadmap guide v0.2.1 FULL

This slice follows `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`
Phase 5.7. The roadmap guide is not SSOT; this document, the helper, route,
fixture, and smoke define the bounded implementation.

## Relationship to earlier Feedback Influenced Surfacing Preview v0.1

The earlier surfacing preview remains compatible but was not DB-backed
aggregation runtime completion. It used caller-provided feedback aggregates and
static preview data.

This slice closes the original Phase 5.7 feedback-influenced surfacing preview
gap by reading DB-backed feedback aggregation results.

## Relationship to Feedback Event Aggregation Runtime Completion

The route calls the feedback event aggregation runtime completion over persisted
feedback events in `research_candidate_feedback_events`. Aggregation remains
advisory only, and surfacing preview consumes that advisory result without
writing DB rows.

## Relationship to Feedback Controls Expansion Runtime Completion

Feedback controls can persist bounded feedback events. This slice reads the
resulting aggregation output and returns preview-only surfacing hints.

## Runtime request shape

Requests include request, preview, and aggregation versions; `scope:
project:augnes`; a safe allowlisted feedback DB path; target filters; surfacing
policy; limit; `include_blocked`; authority boundary; and reason codes.

## Result shape

Results include surfaced items, source visibility warnings, rule failure
candidates, candidate/durable boundary notes, priority hint summary, advisory
flags, no-mutation flags, and authority boundary.

## Priority hint policy

Positive feedback can create `raise_for_review` or `keep_visible` preview
buckets. Negative feedback can create `lower_but_visible`. More-evidence and
operator-review signals get explicit review buckets.

Feedback is not truth.

Priority hint is not ranking mutation.

Surfacing preview is not surfacing mutation.

## Source visibility policy

Pin is not promotion.

Dismiss is not delete.

Invalidate is not source suppression.

Invalid/dismiss feedback cannot hide sources silently; it creates source
visibility warnings for operator review.

## Candidate/durable boundary policy

Candidate and durable-state targets remain distinct. Feedback on durable state
is a review signal only and does not mutate durable Perspective state.

## Rule failure candidate policy

Rule failure candidates are review-only and are not rule mutation.

## Route policy

`POST /api/research-candidate/feedback-events/surfacing-preview` is same-origin
only, accepts JSON objects, validates input before DB checks, opens the DB
read-only, requires existing schema, calls the aggregation runtime, and returns
bounded JSON.

The route creates no DB file, creates no schema, writes no DB rows, and echoes
no raw unsafe values.

## DB path policy

DB paths must be relative and under `tmp/feedback-event-aggregation/` or
`.tmp/feedback-event-aggregation/`, must end in `.sqlite` or `.db`, and must not
contain absolute paths, `..`, backslashes, null bytes, URLs, private/local user
paths, or secret-looking values.

## No-mutation policy

This slice creates surfacing previews only.

This slice does not mutate rules. This slice does not mutate parsers. This slice
does not mutate prompts. This slice does not mutate ranking. This slice does not
mutate surfacing. This slice does not suppress sources. This slice does not
delete candidates. This slice does not create proof/evidence. This slice does
not write claim/evidence records. This slice does not create work items. This
slice does not promote Perspective. This slice does not write/apply durable
Perspective state. This slice does not write Formation Receipts. This slice does
not call providers. This slice does not send prompts. This slice does not fetch
sources. This slice does not execute retrieval/RAG. This slice does not write
retrieval indexes. This slice does not generate RAG answers. This slice does not
execute Git/GitHub. This slice does not execute Codex. This slice does not
product-write. This slice does not allocate product IDs.

Product-write remains parked by #686.

## Privacy/redaction policy

Inputs and fixtures use public-safe symbolic refs and bounded summaries only.
Private/raw markers, secrets, raw source bodies, raw provider output, raw
retrieval output, raw DB rows, hidden reasoning, telemetry dumps, and raw diffs
are blocked.

## Authority boundary

Allowed true fields:

- `feedback_influenced_surfacing_preview_runtime_now`
- `db_backed_feedback_aggregation_read_now`
- `explicit_operator_preview_only`
- `same_origin_preview_route_now`
- `advisory_preview_only`
- `source_visibility_preserved`
- `candidate_durable_boundary_visible`
- `rule_failure_candidates_review_only`

Forbidden false fields include rule/parser/prompt/ranking/surfacing mutation,
source suppression, candidate deletion, proof/evidence writes, work item writes,
promotion, durable state writes/applies, Formation Receipt writes, providers,
prompts, source fetch, retrieval/RAG, retrieval index writes, product-write,
product ID allocation, Git/GitHub, Codex, and truth/proof implications.

Feedback is not truth. Smoke/CI pass is not truth.

## Fixture policy

`fixtures/feedback-influenced-surfacing-preview-runtime-completion.sample.v0.1.json`
uses public-safe symbolic refs and safe markers only inside blocked examples.

## Verification expectations

The completion smoke verifies the helper, route, fixture, docs, package script,
latest-index pointer, DB-backed aggregation read, missing DB/schema behavior,
priority buckets, source visibility warnings, candidate/durable notes, no raw
unsafe echo, authority boundary, and compatibility with the earlier surfacing
preview, feedback controls, and aggregation smokes.

## Deferred surfacing application

Durable surfacing/ranking application remains deferred. This slice is a preview
runtime only.
