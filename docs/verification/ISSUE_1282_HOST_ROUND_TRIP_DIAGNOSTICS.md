# Host-round-trip diagnostic boundary (#1282)

The original #1282 contract below remains historical. The final section records
the separately authorized prospective #1316 acceptance expansion.

This is diagnostic evidence, with no acceptance authority. The request-verdict
owner, `expectedFailedRequest`, deadlines, polling, navigation, phase order and
request-quiet policy are unchanged. An unmarked abort still fails with
`probe_marker_absent`.

## Source-owner audit

- `use-delegated-codex-work-v0-1.ts` owns the automatic initial GET, subsequent
  refresh/poll GETs, their controllers and effect cleanup. Its existing cleanup
  aborts on dependency change as well as unmount. It awaits JSON independently
  of CDP's response and loading notifications.
- `semantic-review-surface.tsx` enables that hook when authenticated without a
  proposal selection. Its session-state setter can disable it after a refused
  private-view response. A requested session-state change and a committed effect
  lifecycle are recorded separately; neither is inferred from HTTP status.
- The marked `browserFetchJson` invocation is the other known GET owner. The
  direct host action component issues POST, not GET.
- `project-experience-request-verdict-v1.mjs` remains the sole failure acceptance
  owner. The existing diagnostic collector owns only sanitized observations.

#1281 retained an unmarked GET/404/cancellation but could not identify its
consumer, body settlement or effect. Its one supporting run did not reproduce
the failure. Historical #1257 also did not establish the abort's cause. These
observations do not establish flakiness, repair or harmlessness.

## Instrumentation boundary

CDP cannot observe the hook's JSON await or React cleanup directly. Minimal
production-source seams are therefore necessary. They require development mode
**and** the disposable Browser owner's injected CDP binding and portal.
Production builds and ordinary development sessions receive no observer. The
application never installs the portal. No runtime-environment allowlist changes
are needed.

The browser-created invocation calls the existing `window.fetch` synchronously,
with identical arguments, and returns the identical Promise. It adds no header,
body, handler to that Promise, wait, retry, cancellation or timer. Existing
awaits and the existing `abort()` remain in their original order. The explicit
probe's host-side diagnostic completion occurs after the unchanged verdict
completion, without an additional browser action.

Ownership requires both a private per-invocation generated frame and the actual
known synchronous call-site frame in CDP, on the same connection/session. URL,
marker, arbitrary owner labels and async ancestors cannot establish ownership.
Multiple matches, missing call-site frames or reused identity produce unknown
or ambiguous evidence. This trusts the owned disposable page and CDP; it is not
an attestation against hostile scripts that control that page or debugger.

## Bounded projection

`host_round_trip_pinned_diagnostics.v1` pins at most 32 requests starting on the
host-round-trip route in `companion_first_work_access`, independently of the
general rings. It retains request/connection/session aliases, start phase and
sequence, method, marker class, response/status, completion/failure/cancellation,
before-failure flags, and failure phase/sequence. No decisive pin is evicted.

At most 32 consumers and 32 generations retain up to 64 events each. Each
document has at most four consumer capabilities, 32 generations and 1,024 normal
transport observations plus one overflow signal. Pin, lifecycle, consumer and
transport loss are explicit. These limits never change Browser acceptance.

Known owner enums distinguish the marked probe, delegated initial read and
delegated refresh/poll; other traffic stays unknown. Generation/controller
aliases join fetch start, headers, body start/completion/failure and consumer
return with effect activation, disposal, cleanup and the exact signal abort.
No missing body completion is inferred. An unknown body settlement marks that
pin and the aggregate evidence incomplete, even if no retention loss occurred.
A successful JSON read is distinct from CDP `loadingFinished`.

Cleanup brackets the existing abort call with observations. A positive
`cleanup_signal_abort_proven` requires that generation's signal event inside
that synchronous bracket and no diagnostic loss. False means unproven, not
harmless. A following effect with changed enabled state identifies
`enabled_changed`; the dedicated disposal observer identifies `unmount` unless
the lifecycle is replayed. Otherwise the reason is unknown. No supersession or
explicit-other reason is invented from temporal proximity.

Auth observations allow only authenticated, locked_or_refused, unavailable and
unknown. The auth observation follows the existing session-state setter; it
does not claim React has committed the corresponding effect yet. A fresh empty
object identifies the consumer; no private guard or session object crosses the
seam. Only the state enum is observed. Aliases, fixed enums, booleans,
bounded sequences and HTTP statuses enter snapshots. Request/response bodies,
raw protocol IDs, generated transport tokens, source URLs/stacks, user/project
IDs, cookies, credentials and private paths do not.

## Verification and remaining qualification

The existing result-contract entry point includes the new synthetic tests.
They cover eviction, overflow, forged labels/callers, distinct probe/read
identity, missing body settlement, controller mismatch, late external abort,
transport gaps, safe auth enums and redaction. The actual hook is exercised with
diagnostics present and absent, including pending-body cleanup. Request arguments,
Promise identity and UI state agree. Existing tests preserve request/response/
failure ledgers and verdicts, and refuse reporting failures as success.

The nine Browser phase/action calls and navigation, quiet, phase and acceptance
owners are checked against the pre-change source, excluding only explicit
diagnostic annotations. Existing result fields and markers remain unchanged.

Exact-head planner, execution and cleanup results belong in the Draft PR and its
local receipt. A synthetic test pass alone is not Browser qualification. A
Browser pass without recurrence proves instrumentation noninterference only;
it does not establish the historical cause. No behavior correction is included.
After this change is qualified and separately merged, #1280 needs a rebase and
its own new exact-head planner and deciding run. No old receipt transfers, and
#1277 remains a separate Draft qualification target.

## Prospective session-refusal cancellation contract (#1316)

The private verdict owner now has two separate outcomes. The completed marked
unavailable-execution probe keeps its exact request, marker, 404 and explicit
probe/body-completion requirements. The new
`expected_session_refusal_cleanup_cancellation` outcome does not mean completed
body, successful retrieval, completed probe or accepted semantic state.

Only the existing `companion_first_work_access` / `session_refused` case can
arm the new path. It brands the exact synthetic semantic-review 401 Response
with a fresh private scenario token; the actual current-read consumer records
delivery after JSON parsing and its current-read guard. This tests a refused
client view, not revocation of a real server credential. Ordinary requests get
no probe marker, changed headers, retries or timing changes.

An authentic private handle connects the verdict owner to bounded live pins.
The owner validates the same protocol connection/session/request, document,
consumer, initial-read effect/generation and native controller, with an observed
404 before canceled `net::ERR_ABORTED`. It requires exact-once refusal delivery,
authenticated-to-locked and enabled-to-disabled transitions, and ordered
cleanup, abort request, signal and abort return before the request failure.
Scenario completion is sealed only after the existing locked/hidden UI and
no-write/authority assertions. Missing, ambiguous, reused, foreign, overflowing,
contradictory or independently failed evidence refuses. Polls, navigation,
unmount and other routes/statuses/errors cannot use this path.

Cancellation completeness is separate from body completeness. Unknown body
settlement stays unknown; a body rejected by the same abort remains explicitly
failed. Completed-body/terminal contradictions or an independent read failure
are not erased by cleanup. Host collection sequence is used for relative
observations; protocol timestamps are not compared with the host clock. Public
snapshots and `cleanup_signal_abort_proven` remain explanatory and are never
verdict input; their existing body-incompleteness meaning is preserved.

Deterministic private-owner regressions and a controlled pending-fetch hook
test are distinct from the disposable Browser run. The latter uses the normal
consumer/authentication scenario without forcing an intermittent abort; absence
of cancellation is non-observation. Historical failures remain failed under
their original contract. This expansion neither repairs the older HTTP 500
nor establishes installed current-source restoration within its 10s deadline.
