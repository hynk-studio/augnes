# Feedback Controls Expansion Runtime Completion v0.1

## Purpose

This slice implements `feedback_controls_expansion_runtime_completion_v0_1` as
the runtime/UI completion for original Phase 5.6 feedback controls
requirements.

This slice closes the original Phase 5.6 feedback controls runtime gap.

The earlier Feedback Controls Expansion v0.1 remains compatible as
callback-only UI intent. It was not the full runtime completion because it did
not persist feedback events through a same-origin route.

The earlier callback-only controls remain compatible but were not full runtime completion.

This completion adds bounded feedback event persistence through explicit
operator action. Feedback controls write bounded feedback events only after an
operator clicks a control.

Feedback controls write bounded feedback events only after explicit operator action.

Feedback is not truth.
Pin is not promotion.
Dismiss is not delete.
Invalidate is not source suppression.
Correct does not mutate parser or rules.
Scope-overreach creates review signal only.
Needs more evidence creates review signal only.

## Relationship to the roadmap

`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` defines Phase 5.6
as feedback controls expansion after feedback event aggregation. This slice
closes the original Phase 5.6 feedback controls runtime gap.

The roadmap guide is not SSOT. Runtime authority remains with this route,
helper, smoke, and fixtures.

## Relationship to earlier Feedback Controls Expansion v0.1

The earlier callback-only controls remain supported through
`persistenceMode: "callback_only"`. That mode emits bounded local intent
payloads and preserves the old no-route/no-DB behavior.

The runtime completion adds `persistenceMode: "route_backed"`. In that mode the
component calls `POST /api/research-candidate/feedback-events` and does not use
the aggregation route as a write route.

## Relationship to Feedback Event Aggregation Runtime Completion

Feedback event aggregation reads persisted/caller-injected feedback event
records. This slice writes bounded feedback events into the same feedback event
table so aggregation can read them. It does not execute aggregation as a side
effect of writing feedback.

## Write Route Policy

Route: `POST /api/research-candidate/feedback-events`

Runtime completion requests use:

- `route_version: feedback_controls_expansion_runtime_completion_route.v0.1`
- `scope: project:augnes`
- `action: create_feedback_event`
- `db_path`
- `input`

The route requires same-origin POST, JSON object input, and a safe allowlisted
SQLite DB path. It ensures schema on write and inserts one bounded feedback
event. It returns bounded status/error codes and never echoes unsafe raw values.

## UI Route-Backed Mode

The active route-backed mode supports:

- Pin
- Dismiss
- Correct
- Invalidate
- Needs more evidence
- Scope overreach
- Not relevant now
- Mark useful
- Mark wrong

The UI shows bounded route status/error codes, the advisory-only boundary, and
the product-write parked boundary.

## Callback Compatibility Mode

Callback mode remains compatibility-only. It emits the original bounded intent
payload and does not call routes or write DB.

## DB Path Policy

Only relative paths under these roots are allowed:

- `tmp/feedback-event-aggregation/`
- `.tmp/feedback-event-aggregation/`

DB paths must end in `.sqlite` or `.db`. Absolute paths, `..`, backslashes, null
bytes, URLs, private/local user paths, and token/secret-looking paths are
rejected. Unsafe `db_path` values are not echoed.

## Idempotency and Conflict Policy

The write helper validates `feedback_event_id` and `idempotency_key`.

An identical repeated event returns `idempotent_existing`. A reused
idempotency key or event id with different payload returns
`conflict_existing_feedback_event` and writes no partial row.

## Feedback Kind Policy

Supported feedback kinds are:

- `pin`
- `dismiss`
- `correct`
- `invalidate`
- `needs_more_evidence`
- `scope_overreach`
- `not_relevant_now`
- `mark_useful`
- `mark_wrong`

`correct` and `mark_wrong` require bounded correction text. Dismiss,
invalidate, needs-more-evidence, scope-overreach, and not-relevant-now require a
bounded reason.

## Advisory-Only Policy

Feedback is not truth. Pin is not promotion. Dismiss is not delete. Invalidate
is not source suppression. Correct does not mutate parser or rules.
Scope-overreach creates review signal only. Needs more evidence creates review
signal only. Rule failure candidate is not rule mutation.

## Forbidden Mutation Policy

This slice does not mutate rules. This slice does not mutate parsers. This
slice does not mutate prompts. This slice does not mutate ranking. This slice
does not mutate surfacing. This slice does not suppress sources. This slice
does not delete candidates.

This slice does not create proof/evidence. This slice does not write
claim/evidence records. This slice does not create work items. This slice does
not promote Perspective. This slice does not write/apply durable Perspective
state. This slice does not write Formation Receipts.

This slice does not call providers. This slice does not send prompts. This
slice does not fetch sources. This slice does not execute retrieval/RAG. This
slice does not write retrieval indexes. This slice does not generate RAG
answers.

This slice does not execute Git/GitHub. This slice does not execute Codex. This
slice does not product-write. This slice does not allocate product IDs.
Product-write remains parked by #686.

This slice does not product-write.

## Privacy and Redaction

Feedback events use public-safe symbolic refs and bounded summaries only. The
write helper recursively blocks private/raw markers and forbidden authority
claims across the whole payload, not only `authority_boundary`.

Forbidden content includes real secrets, provider IDs, connector IDs,
uploaded-file IDs, private URLs, local paths, raw source bodies, raw provider
outputs, raw retrieval outputs, raw DB rows, raw conversations, hidden
reasoning, telemetry dumps, real GitHub payloads, raw diffs, and terminal logs.

## Authority Boundary

Allowed true fields:

- `feedback_controls_runtime_completion_now`
- `explicit_operator_feedback_action_only`
- `same_origin_post_route_now`
- `caller_injected_db_only`
- `feedback_event_write_now`
- `feedback_event_persistence_now`
- `advisory_signal_only`
- `callback_compatibility_preserved`

Forbidden false fields include automatic/hidden feedback writes, feedback as
truth, pin as promotion, dismiss as delete, invalidate as source suppression,
rule/parser/prompt/ranking/surfacing mutation, source suppression, candidate
delete, proof/evidence writes, work item writes, promotion, durable state
writes/apply, Formation Receipt writes, provider calls, prompt sending, source
fetch, retrieval/RAG, retrieval index writes, RAG answer generation,
Git/GitHub/Codex execution, product-write, product ID allocation, and
product-write authority.

Smoke/CI pass is not truth.

## Fixture Policy

`fixtures/feedback-controls-expansion-runtime-completion.sample.v0.1.json`
contains public-safe route-backed UI and write-route examples. Safe marker
placeholders appear only inside blocked examples.

## Verification Expectations

The smoke verifies the helper exports, same-origin route, DB-backed write,
idempotency, conflict, recursive authority blocking, private/raw blocking,
component route-backed mode, callback compatibility mode, aggregation read
compatibility, docs, fixture, package script, and latest-index pointer.

## Deferred Surfacing Application

Feedback-influenced surfacing application is deferred. This slice writes
bounded feedback events only. It does not apply priority hints, mutate
surfacing, suppress sources, delete candidates, or create proof/promotion
state.
