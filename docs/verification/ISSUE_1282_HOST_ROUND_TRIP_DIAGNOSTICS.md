# Host-round-trip diagnostic boundary (#1282)

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
No missing body completion is inferred. A successful JSON read is distinct from
CDP `loadingFinished`.

Cleanup brackets the existing abort call with observations. A positive
`cleanup_signal_abort_proven` requires that generation's signal event inside
that synchronous bracket and no diagnostic loss. False means unproven, not
harmless. A following effect with changed enabled state identifies
`enabled_changed`; the dedicated disposal observer identifies `unmount` unless
the lifecycle is replayed. Otherwise the reason is unknown. No supersession or
explicit-other reason is invented from temporal proximity.

Auth observations allow only authenticated, locked_or_refused, unavailable and
unknown. Only the state enum crosses the seam. Aliases, fixed enums, booleans,
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
