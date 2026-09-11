# P5.1 scoped native-host execution card amendment

**Current Draft #1241 contract:** trusted-local, source-bound read-only
snapshots, described in the final section below. It supersedes the proposed
immutable-mount/hardened-host requirement. Earlier sections preserve historical
preparation and execution dispositions; they do not grant a new attempt.
The post-adoption incident is consumed: native completed, task partial/blocked,
X unchecked, B unexposed, Y deferred. This Draft has no live-call authority.

**Issue #1234: BLOCKED / live study `not_run` / study model calls 0.**
This is the implementation amendment authorized by
[review 5582629291](https://github.com/hynk-studio/augnes/issues/1234#issuecomment-5582629291).
PR review and separate authorization of the exact retained card are still
required before the first live start. This document does not authorize it.

The shell-environment correction follows
[review 5590309782](https://github.com/hynk-studio/augnes/issues/1234#issuecomment-5590309782).
Merged #1235 remains accepted. The new correction has its own source/evidence
binding and Draft review; it does not reopen that acceptance or transfer its
receipt. The retained prepared DB, initial packet and packet-derived GuideBrief
are reused when current-source admission confirms them.

The original execution card, six frozen task artifacts, information cutoff,
evaluation criteria, preflight report, cleanup evidence, boundary design and
route freeze remain immutable. Their initial freeze is
`2026-09-08T08:28:00.830829+00:00`. Original card SHA-256:
`51df134c08edb0ac9163c79172dc07327d10559c80809d36e53582f9f3364129`;
original manifest:
`b809d2eec9cf1c37352a7fe198c50b5c62ba006aeec2d0943abdee264a6e24fb`;
boundary freeze:
`f932011819b2f034e9d185fcfe4450b98a989a21a3849f88158fb93174041586`.
Only changed route material and implementation evidence are appended locally.
The source head and selected deciding receipt belong to that append-only
inventory and the Draft PR; neither transfers to another head.

## Selected route and controls, redacted

| Boundary | Implemented opt-in and remaining limitation |
| --- | --- |
| Application | `hynk-studio/augnes`, canonical checkout. The shell correction uses `codex/p51-scoped-shell-environment`, base `66cd51c34f1e71ffce0eae1a005fbad14168054d`. Original branch/base and later instance bindings remain in the immutable local appendices. No historical checkout or reset is used. |
| Host identity | Existing managed, pinned Codex **0.152.1**, darwin-arm64, `ordinary_chatgpt_auth`; executable suffix `codex-rust-v0.152.1-darwin-arm64--19cd28a2d576036d4b3e6a59d99a37fad94378b76f17e89531db554ce906b052/bin/codex`, native SHA-256 `8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf`. The opt-in selects the existing installed artifact; it does not install, change login, renew qualification or update last-known-good evidence. |
| Compatibility | Pinned upstream protocol source `5adb68a49933ae446bf11935662c83dba55a0804`. The extension explicitly negotiates `initialize.capabilities.experimentalApi=true`. Named `permissions` is mandatory at both new thread and turn. No legacy `sandbox`/`sandboxPolicy` is sent with it, and no fallback or resume is available. Historical qualification remains an ordinary-route disposition, not extension attestation. |
| Caller → consumer | Trusted disposable operator → `createCodexScopedTaskV01` and one shared `createCodexFeasibilityWindowV01` → `LiveNativeHostRunServiceV01({scoped_task:{scope,window}})` → authenticated `start` → existing controller and `runDirectNativeHostRoundTripV01` admission/launch gate → branded `createCodexAppServerAdapterV01({scoped_task:scope})` → exact executable `app-server --stdio` → initialize/configuration/MCP checks → fixed model-free `command/exec` environment predicate → account check → fresh thread → structured turn. A supplied adapter factory must preserve the exact scope binding. No HTTP body, worker/browser profile, global setting or desktop Start control enables this option. |
| Model/auth | Explicit `gpt-6-astra`, effort `max`, built-in `openai`; observable configuration, thread/settings and identity contradictions refuse. `allowProviderModelFallback=false`. Actual backend serving identity remains **unknown**. Ordinary ChatGPT login, host HOME and child environment allowlist/exclusions are unchanged. `OPENAI_API_KEY` is excluded; there is no Responses executor or credential transfer. |
| Immutable data | An opaque, source-owned scope binds stage, admitted physical root, packet ID/fingerprint, GuideBrief fingerprint, exact flat file inventory and SHA-256 hashes, plus approved generic instruction hashes. No symlink, hard-link alias, directory, extra file, stale hash or arbitrary structural copy is admitted. The scope is consumed once and rechecked before spawn, thread and turn. Only the three original initial-worker files are staged for worker 1. Clarification, B, evaluator material, execution card and evidence stay outside its scope. |
| Successor data | After settlement and normal reviewed Transition, actual compiler/preparation produces a fresh packet. Add only the frozen B artifact to the same disposable physical task root. Create a new stage-2 scope over that exact inventory, fresh packet and fresh GuideBrief, using the **same window**. Stage 2 requires Transition lineage. The running stage-1 profile is never widened; the clarification reaches worker 2 through accepted source-bound successor preparation. |
| Host access versus task access | Host/auth/runtime files remain available to the ordinary host process where necessary. The worker's fixed named profile retains the pinned `:minimal` OS startup/syscall mechanics and system command/library/device reads, but explicitly denies its `/etc`, `/private/etc`, `/var/db`, `/private/var/db`, `/Library/Preferences`, NetFS plugin, Homebrew/local library and terminal data exceptions. Only exact approved synthetic task files are added. The unmodified preset is not the boundary. Generic host instructions and explicitly hash-approved host AGENTS instructions remain disclosed confounds. This is not cold isolation, a separate OS account or Strict support. Staged files must remain unchanged during execution. |
| Ambient suppression | CLI overrides exist before process startup. They disable memory use/generation and imports, Chronicle, host skill discovery/injection, local and orchestrator MCP, plugins/apps/connectors, web/browser/computer tools, subagents/goals, code-mode discovery/prewarm, shell snapshots/login-shell loading and unapproved background/discovery features. Every inherited MCP name is explicitly disabled; empty map overlays are not relied upon. Custom instruction/catalog/profile/provider/telemetry material or unknown managed/configuration provenance refuses. Configuration is hashed and checked, not copied into durable evidence. |
| Observable provenance | Strict configuration readback, selected permission profile, model/effort/root, zero callable MCP tools/resources, approved instruction-source paths and runtime notifications are checked. Disabled MCP entries may remain catalog rows with no runtime, tools or resources; absence of rows is not the proof. Known pinned null defaults are normalized; non-null policy additions and unknown fields still refuse. |
| Shell environment | The opt-in fixes `inherit=none`, default exclusions, `set.PATH=/usr/bin:/bin:/usr/sbin:/sbin`, final `include_only=["PATH"]`, `exclude=[]`, and `experimental_use_profile=false`. Pinned merge replaces the arrays and displaces inherited keyed filters. Other well-formed set entries may remain in private host configuration; the final filter removes them from commands after set application. No private value is copied into arguments, evidence, prompts or a replacement config. Source/effective `Path`/`path` aliases, unknown/malformed policy, broad effective filters and source drift refuse. Equivalent canonical keyed readback is accepted only for the exact closed filter. |
| Actual command check | Before account/thread/turn, the same App Server executes a fixed `/usr/bin/awk` predicate through `command/exec`, with the scope's named permission profile and cwd, no client env override, a 10,000 ms RPC/command bound and 128-byte output cap. It returns one constant success line or a generic refusal, never environment names/values. It checks fixed PATH and only specifically sourced optional sandbox/apply-patch runtime flags. Unknown metadata or ignored policy refuses; no `CODEX_*` wildcard or fallback exists. The existing execution/window/abort/settlement owners bound this extra model-free command; it is not a provider request or an added study host attempt. |
| Permissions and output | Read/check commands and native bounded JSON result only. Permission/escalation requests are refused (`approvalPolicy=never`) within this opt-in. Semantic user review is unchanged. File-change events or returned changed files/artifacts refuse; they cannot become a successful scoped result. The ordinary native result schema and its 128 KiB bound remain; existing command/check array bounds are 128. These are result/evidence bounds, not an independently metered provider-call/token budget. |
| Deadlines | Configured execution ceiling **180,000 ms**, retaining smaller service limits; RPC **10,000 ms**; stop settlement **10,000 ms**, retaining smaller settlement limits. One **600,000 ms** monotonic window starts at the first attempted start, before admission, and includes startup, review and settlement. Each active timer is capped by remaining window minus settlement reserve and the per-run ceiling. The existing scheduler/abort/stop owners enforce it. There is no second runtime timer system. |
| Expiration | At 589,999 ms with a 10,000 ms reserve, a second start can have at most 1 ms, and it is refused if that allowance expires during admission. At 590,000 ms it cannot start. Review does not reset the window. Snapshot reads expose remaining time; failure, cancellation or timeout closes further admission. At most two sequential attempts, no overlap, replay, retry, replacement, subagent or evaluator-model invocation. |
| Stop/cleanup | Existing direct round trip aborts and calls `request_stop`; existing RPC/transport and `stopOwnedProcessTreeV01` settle the child. Failed settlement retains paused/reconciliation outcomes and no fabricated terminal receipt. Disposable service `shutdown`, DB close and the existing disposable cleanup owner remain responsible even after the study window closes. Local cancellation does **not** prove remote generation or billing stopped. |
| Usage/billing | Ordinary subscription route; **$0 additional pay-as-you-go authorized**. No key, billing, purchase, quota reset or production configuration change. Retained quota observation (weekly 8% used/92% remaining, purchased credits 0) is historical/shared and not reserved. Record current read-only quota before authorization; stop for exhausted quota or paid continuation. Two host executions are not necessarily two provider requests: internal rounds/retries and exact provider usage/cost remain unobservable where the host does not expose them. |
| Burden | Proposed setup ≤15 minutes, live window ≤10 minutes including human review, cleanup target ≤5 minutes: ≤30 minutes planned total. Record actual setup, execution, inter-run review, settlement and cleanup separately without double counting review inside the live window. Cleanup failure remains work to reconcile, not permission to abandon owned resources or silently increase execution allowance. Implementation/test time is not live-study burden. |

## Exact proposed operator flow

1. After PR review, retain the original artifacts and verify their hashes. Reuse
   the existing disposable DB, root, initial work and selected synthetic notes
   through current-source admission and real local operator-session owners;
   do not repeat onboarding. Do not use the unauthenticated test option. Freeze the
   actual prepared packet, packet-derived GuideBrief and scope fingerprints
   before execution authorization; never invent runtime/run/proof identities.
   A fresh normal factory observation is new evidence, never reconstruction of
   the released handle's missing historical fingerprint.
2. Construct one window in the disposable caller. Construct stage 1 from the
   frozen initial manifest, actual physical root and prepared packet/GuideBrief.
   Supply it only through the service constructor shown above. Read the
   capability contract and the window snapshot; retain the smaller applicable
   limits. No production activation or desktop control is implied.
3. On separate exact-card authorization, call authenticated `service.start`
   once. Preserve actual X command/check observations and the normal returned
   result, RunReceipt and proposal. If execution or eligible proposal admission
   fails, stop. Do not create a substitute result, receipt or candidate.
4. Present the **new user-declared clarification** through normal source-bound
   candidate revision, human ReviewDecision, confirmation and Transition.
   Preserve the X observation, uncertainty and Y's deferred/untested meaning.
   If the first response was cautious, classify this as clarification; do not
   claim an error was corrected. Review time remains in the shared window.
5. Read/reconstruct through the existing compiler and fresh preparation owner.
   Require actual successor packet/Transition lineage. Expose only frozen B
   in the new stage-2 inventory, construct its fresh scope, and create a second
   disposable service using the same window. Check remaining time and source
   bindings, then submit at most once. Do not restart the window after a failure
   or re-create a service to evade its attempt count.
6. Require an actual completed B artifact read/check bound to the second native
   result/receipt. Expected wording alone is insufficient. Y remains untested;
   following the supplied B check is not autonomous discovery. The retained
   model-free/human evaluator applies the frozen criteria, outside worker 1's
   context, with no evaluator-model call. Shut down/settle and clean up through
   the existing owners; retain bounded evidence locally.

## Evaluation and compatibility evidence

Success requires the complete actual X → native result/proposal → reviewed
clarification/Transition → fresh preparation → actual B chain, retained meaning,
source binding and settled cleanup. Partial means a supported prefix completed
but a later step did not. Blocked means admission, policy, source, runtime or
eligible review prerequisites prevent that step. Stop includes deadline,
cancellation, quota/billing change, unauthorized data/capability, source drift,
contradictory effective model/policy or failed settlement. These classifications
do not create semantic acceptance or declare usefulness/causal benefit.

Focused model-free checks use the existing sandbox-projection fixture and
project-work native path. They cover default wire parity, named negotiation,
ignored/conflicting controls, scope/GuideBrief/root drift, tool/effect refusal,
cancellation, near-expiry/smaller clock allowances, normal authenticated native
receipt/proposal persistence and refusal without host/receipt/proposal effects.
The retained deterministic executed-reviewed-successor case checks the normal
review/Transition/compiler consumers; it is not a live model producer.

The explicit `--pinned-host-sandbox` check uses the managed executable with
synthetic HOME/config and a file-only empty credential store for the diagnostic
only. An outer macOS network denial encloses its initialize/configuration/MCP
readback; it sends no account, thread or turn RPC. Synthetic inherited MCP
startup markers remain absent. Its `command/exec` check exercises the actual
pinned environment constructor after both legacy-array and keyed-filter
inheritance, with synthetic set/PATH/secret-like/ordinary/profile sentinels.
Because macOS refuses nested seatbelt installation, this diagnostic alone
declares `externalSandbox` for that command and retains the already-installed
outer OS sandbox/network denial. Effective named configuration readback is
checked separately in the same binary. Production sends only the scoped named
profile and never adopts that diagnostic override. The initial nested-sandbox
exit-71 refusal is retained; no environment assertion was relaxed to pass it.
The actual Codex sandbox permits approved reads
and denies held reads, writes, command network and symlink escapes after policy
installation. The diagnostic does not support `--strict-config`; App Server
does, and that stricter launch is checked separately.

The pinned diagnostic canonicalizes a pre-existing selected-file symlink while
constructing its OS policy. Such a file is ineligible at the adapter's real
hash/identity gate; the after-installation OS test also denies an external swap.
This distinction and the development test-wiring failures are retained locally.
Removing the platform preset entirely prevented macOS command startup; its
necessary syscall/IPC mechanics are retained with explicit data-path denials.
Standard OS metadata, device and local logging IPC remain host confounds; the
tested network denial concerns command TCP access, not removal of all OS IPC.
There is no claim of protection from a malicious concurrent host administrator.

### Pinned environment consumer and evidence limits

At upstream `5adb68a49933ae446bf11935662c83dba55a0804`,
`protocol/src/shell_environment.rs` applies inheritance/exclusions, then set,
then case-insensitive final inclusion. `config/src/merge.rs` replaces arrays
and switches the keyed/legacy representation without merging their filters.
`app-server/src/request_processors/command_exec_processor.rs` calls that
constructor before sandbox selection. Its optional client env override occurs
later; the trusted adapter's fixed request contains no such field.

The model's local `exec_command` consumer in
`core/src/unified_exec/process_manager.rs` also starts with `create_env`.
It subsequently adds actual thread/session/profile identifiers and fixed
terminal/locale/pager metadata. `core/src/exec_env.rs` and the sandbox add
specific runtime flags. These are host-generated, not permissions or arbitrary
configured `CODEX_*` grants. The diagnostic has no thread/session and therefore
does not accept those identifiers as command-check exceptions. The final
worker process is not claimed to contain literally only PATH.

Unified execution can apply runtime-owned package/shell PATH prepends and
restore explicit set values after a shell snapshot. The selected standalone
managed host retains its runtime ownership; snapshots and login shells remain
disabled from launch, and profile use is now explicitly false. Shell startup
cannot obtain configured BASH_ENV/ENV/HOME values through the final filter;
the existing filesystem scope still applies to shell reads. No remote executor,
snapshot restoration, profile startup or client environment override is added.

The synthetic TypeScript tests prove adapter policy/refusal, default parity,
and absence of private-value propagation. Pinned-source inspection establishes
consumer order and later runtime metadata; it is not a Rust unit-test run.
Live-binary configuration readback and actual credential-free `command/exec`
predicate evidence are separate from the existing OS sandbox checks and from
any future authenticated worker execution. Original synthetic config/auth
files are byte-unchanged after the diagnostic. Real configuration/keyring are
not replaced or used by this test. Fresh production-shaped pre-launch hashes
may be observed model-free, but its account/thread/turn and effective command
readback remain unrun until separate execution authorization.

Final deciding verification uses the repository planner's selected owner set
for the clean exact base/head, once, including its existing lifecycle and
failed-settlement owners. Its receipt, cleanup and same-Companion restoration
must validate before closeout. No default Full Canonical, predecessor matrix,
qualification renewal or receipt transfer is requested by this card.

Default callers retain their existing launch, permissions, authentication,
resume and approval behavior. The opt-in adds no Core/wire schema, migration,
authority owner, API executor or persistent configuration. Rollback is to stop
using/revert the opt-in connection; this study then remains blocked. It must
never fall back to the broader default profile.

**Recommendation: review the bounded implementation; keep live execution
BLOCKED/not_run.** P1/P5.1a closeouts, #1209/#1215 open status, #1221,
qualification/HOLD, #1130/RW1B and CW1 dispositions remain unchanged.

## Prospective failed-terminal diagnostic (#1234)

The preparation and `not_run` language above is historical. The separately
authorized attempt is consumed and terminal: one submitted turn, a settled
`codex_turn_failed`, unknown backend usage, no completed X/B or Transition.
The accepted postmortem is C: specific error information was not retained.
This diagnostic connection neither reconstructs that error nor authorizes
another attempt or use of its unused second slot. Original local artifacts,
cutoff, receipts, terminal freeze and separate postmortem freeze stay unchanged.

The adapter projects only after `finishFromTerminal` accepts a failed terminal,
after the existing same-batch notification/conflict and stop checks. It carries
one `failed_terminal_diagnostic` on the existing final `settled` observation.
The earlier `terminal_observed` event is unchanged; it can precede a conflict
and must not be interpreted as accepted diagnosis. A diagnostic is not proof of
successful cleanup: `settlement_failed` and the actual settlement promise still
own that result. Completed/interrupted turns have no failed-terminal diagnostic.

Retained fields are:

- `phase=accepted_failed_terminal`; exact source `turn/completed`, `thread/read`
  or `thread/resume`, according to the existing terminal producer;
- the existing request source binding (request ID plus request, packet-ref,
  packet, physical-root-scope and operation-shape fingerprints), joined to the
  observer's actual run/process/thread/turn IDs and time;
- `error_field`: absent, null, object or malformed;
- `category_disposition`: unavailable, absent, null, recognized, unrecognized
  or malformed, with a closed recognized category or null;
- `http_status_disposition`: not_applicable, absent, null, valid or invalid,
  with an integer 100–599 only from a defined tagged HTTP variant, or null.

The source is pinned upstream `5adb68a49933ae446bf11935662c83dba55a0804`,
`app-server-protocol/schema/typescript/v2/TurnError.ts` and `CodexErrorInfo.ts`.
Both string and tagged-object categories are supported. For example, synthetic
`unauthorized` yields recognized/unauthorized and no HTTP status; synthetic
`{httpConnectionFailed:{httpStatusCode:429}}` yields recognized/
httpConnectionFailed and valid/429. These are host-reported categories, not
root-cause findings. Legitimate `other` remains recognized/other; an unknown
variant yields unrecognized/null without retaining its name. A string `"429"`
is invalid status, not coerced. Missing terminal error information says nothing
about whether an earlier standalone error notification occurred.

No error message, additionalDetails, misalignment explanation, payload, prompt,
stack, header, URL, credentials, arbitrary keys or hashes of discarded private
values enter the projection. Extraction failure produces only the separate
constant `failed_terminal_diagnostic_capture_failure=projection_failed`, with
no change to the accepted failure. Existing terminal fingerprints and generic
result/receipt, optional standalone error notifications, registry, qualification,
cancellation, settlement and retry semantics are unchanged.

### Local consumer connection and cleanup

The executed local operator's recorder used
`event('adapter', {stage, ...observation})` and synchronous JSONL append. Its
frozen script is historical evidence and is not edited. The reviewed reusable
connection is now `createRecordedCodexAppServerAdapterV01` in
`scripts/codex-app-server-observation-recorder.ts`. It connects that same
observation-to-JSONL shape directly to the adapter. It is an optional local
collector, not a new desktop Start control or automatic production activation.

For a separately authorized future disposable invocation, the existing service
factory supplies the actual scope to this connection:

```ts
adapter_factory: (actualScope) => {
  const capture = createRecordedCodexAppServerAdapterV01({
    directory: freshInvocationEvidenceDirectory,
    stage,
    adapter_options: {
      scoped_task: actualScope,
      observe: existingOperatorObservationHandler,
    },
  });
  captures.push(capture);
  return capture.adapter;
}
```

Use a fresh operator-owned capture directory per invocation, outside the worker
scope. Complete the existing service shutdown/settlement in `try/finally`, then
call `closeCapture()` even if shutdown failed. Include its returned status in
the local terminal report separately from host cleanup. Read back `events.jsonl`
and `adapter-capture-status.json` after shutdown; the recorder does not create
a run, authorize Start, close a DB or attest cleanup. No historical directory,
authorization or execution window can be reused by this example.

The collector retains at most 64 observations of at most 16 KiB each; the
diagnostic appears at most once per invocation. It creates files exclusively
and never overwrites an existing attempt. Create/write/size/count failures
stop capture with a closed public reason, not a private exception string.
Status-artifact write failure is returned explicitly and must be reported by
the caller; no artifact is claimed when writing failed. The operator's own
observer remains outside the recorder's I/O catch and keeps its existing policy.

Model-free evidence uses the existing fake host and finite adapter lifecycle:
projection → observer → this collector → settled shutdown → disk readback,
including secret-like exclusions and malformed/foreign/conflicting/duplicate
cases. The normal live-service test owner additionally exercises two synthetic
failures through persisted generic receipt, shutdown and capture readback. These
are repository tests, not authenticated study executions or reproductions of
the historical cause. Focused capture checks are available through
`test-codex-app-server-sandbox-projection.ts --failed-terminal-diagnostic-only`;
the default suite retains all its original sandbox responsibilities.

Compatibility is an additive internal observation field and optional local
recorder. No dependency, Core/wire schema, migration, auth/configuration,
runtime selection, sandbox, smol-toml or packaging change is involved. Rollback
removes this diagnostic/collector connection while preserving already written
local evidence; generic failed-turn behavior remains available. Missing,
unrecognized or `other` diagnostics can still leave the cause unresolved.
Any future live execution requires separate authorization and distinct evidence.

## Incident message connection (#1234)

Both live work-loop attempts are consumed and terminal. The later incident
inspection stopped before launch because no supported message observer existed;
its allowance was not consumed. This implementation does not resume that task,
recover either discarded message, or authorize a call. After review, an explicit
later dispatch can return to the already defined single-turn incident diagnostic.
It cannot use this connection to restart X → B, retry, change model/auth/runtime,
or expand the existing execution limits.

The default-off `incident_message` adapter option runs synchronously only in
`finishFromTerminal`'s accepted failed branch, after the existing identity,
duplicate/conflict, same-batch notification and stop checks. It is refused in
the isolated-auth and candidate-canary lanes. Ordinary default behavior and the
scoped permission/currentness checks are unchanged. There is no transport
export, RPC/standalone-error observation, remote flag, worker tool, UI control,
new receipt field or execution authority.

The callback receives detached, deeply frozen run/process/thread/turn/time
bindings, the existing closed diagnostic and request-source fingerprints, and
only the terminal's `error.message`. Its disposition distinguishes unavailable
error objects, absent messages, null, non-string and text. At most 8,192 UTF-8
bytes are supplied, without splitting a code point; a separate flag reports
truncation. No arbitrary error property, additionalDetails, request/terminal
object, prompt, stream or private-value hash crosses this boundary. The existing
terminal fingerprints and generic `codex_turn_failed` result remain unchanged.
New projection/hook failures produce only a closed incident capture status on
the settled observation. The general observer retains its original exception
policy. This trusted synchronous callback is not a sandbox or a preemptible
plugin; no watchdog or secure-erasure claim is made.

`scripts/codex-incident-message-recorder.ts` completes the optional local path.
`createIncidentRecordedCodexAppServerAdapterV01` composes the category recorder
with a synchronous incident sanitizer. Setup uses exclusive files and refuses
before returning an adapter if either capture cannot be created. Cache the
returned adapter for the exact supplied scope: service capability reads can
call the factory more than once without creating another invocation.

```ts
let capture: ReturnType<typeof createIncidentRecordedCodexAppServerAdapterV01>;
const service = new LiveNativeHostRunServiceV01({
  scoped_task: { scope, window }, // genuine fresh factory scope and existing clock
  timeout_ms: 180_000,
  stop_settle_timeout_ms: 10_000,
  adapter_factory(actualScope) {
    if (actualScope !== scope) throw new Error("incident_scope_conflict");
    capture ??= createIncidentRecordedCodexAppServerAdapterV01({
      directory: freshInvocationEvidenceDirectory, stage: 1,
      adapter_options: { scoped_task: actualScope, observe: existingOperatorObserver },
    });
    return capture.adapter;
  },
});
service.readCapabilityContractV01(); // capture setup only, no host/start/warm-up
// After separately authorized authenticated Start, follow normal settlement.
// In finally, even if shutdown fails:
try { await service.shutdown(); }
finally {
  capture?.closeCapture();
  capture?.closeIncidentCapture();
}
const readback = capture?.readIncidentCapture(); // actual artifact/status disk read
```

The ordinary Start, request/packet admission, invocation, deadline, cancellation
and shutdown owners remain required. This example is consumer wiring, not a
standalone executor or execution authorization. The incident ceiling is one
host attempt and one turn submission, with existing smaller deadlines and
settlement reserve retained. Capture closure does not attest host settlement,
remote generation/billing cessation or successful cleanup. Record those results
separately; never start a replacement to compensate for failed capture.

The sanitizer recognizes complete, narrow diagnostic sentence forms and emits
only fixed explanations with closed public parameter names. It never returns a
free-text substring after regex replacement. For example, synthetic category
`other` plus `Unsupported parameter: 'temperature'.` becomes “The host reports
that the temperature parameter is unsupported.” A recognized schema complaint
can retain the requirement for `additionalProperties=false`. These examples
are fixtures, not messages from either historical failure. Model/auth, effort,
context-window, rate-limit and overload sentence forms have similarly bounded
wording; their recognition is a host-report interpretation, not a root-cause
attestation or authority to retry.

Unknown names/suffixes, echoed request/configuration content, headers, account
identifiers, paths/URLs and other unrecognized free text are withheld. Truncated
input is always withheld, even when its prefix looks harmless. Missing/malformed
messages remain unavailable; sanitizer exceptions yield only `sanitizer_failed`.
This deliberately conservative vocabulary may withhold useful unfamiliar
messages and is not universal redaction. There is no model/network call,
asynchronous raw retention, console output, raw file or message hash. JavaScript
strings are released normally without a secure-erasure promise.

The consumer writes at most one `sanitized-incident.json` artifact, bounded to
16 KiB including provenance and at most 1,024 UTF-8 explanation bytes, plus
`incident-capture-status.json`. Raw text never enters category `events.jsonl`,
Core, receipts or the public observer. After ordinary shutdown and capture
closure, disk readback checks the exact sanitized artifact/status bytes and
reports a separate closed readback failure on corruption/missing material.
Empty artifacts and status distinguish no accepted failed terminal from capture
failure; they must not be reported as a diagnosis. Keep these files in a fresh
exclusive local evidence directory outside worker access.

Focused proof uses the existing sandbox/projection fake host and native-service
DB/lifecycle owner, including actual persisted generic failure, both capture
closures and artifact/status readback. Synthetic checks cover recognizable
`other`, excluded secret/header/account/path/URL/request/config values, unknown
and truncated text, UTF-8 bounds, missing/malformed messages, mutation attempts,
default/completed/interrupted/foreign/conflicting/duplicate parity and separate
hook/sanitizer/I/O failures. The general-observer exception test retains its
existing settlement failure, without declaring capture closure to be cleanup.
The focused projection entry is `--incident-message-only`; the default test
owner includes it as well. No authenticated diagnostic or study runs in these
tests. Rollback removes this opt-in hook/helper while preserving local evidence
and the prior category-only route. No dependency, auth/config/runtime selection,
sandbox, registry, qualification, packaging or Core/schema change is required.
# Managed-runtime candidate compatibility addendum (#1234)

The [reviewed 0.153.4 re-entry](https://github.com/hynk-studio/augnes/issues/1234#issuecomment-5600880587)
is separate from every historical study and the pending post-adoption incident.
The original task material, cutoff, packet/GuideBrief preparation and consumed
attempts are unchanged. No new scope, X result, successor or B exposure follows
from this addendum.

The scoped extension admits two closed artifact tuples, not a semver range:

| Version | Native SHA-256 | Tagged source |
| --- | --- | --- |
| 0.152.1 | `8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf` | `5adb68a49933ae446bf11935662c83dba55a0804` |
| 0.153.4 | `b973d440acac501fd2594a43e7ca9ce41e0a65b9dfb28d0d7a7837c99e1261e3` | `3d2ee51ca2d5db578f328aa75e20aa22c0197c9a` |

Both require the unchanged implemented compatibility profile
`sha256:a4cfb0e38fd6a2af0d29a467c2c5db2579cdc784e93a820f3482fa2c8a1d663a`.
The actual ordinary adapter must additionally select an eligible qualified
managed artifact through its existing owner. Extension compatibility does not
qualify a candidate or make a candidate grant usable as a scoped-task grant.
Thread readback must match the selected tuple's exact CLI version.

The 0.152.1 launch projection is unchanged. For 0.153.4 only, the two newly
introduced features `context_management` and `mcp_oauth_refresh_coordination`
are explicitly disabled before startup and checked in effective readback.
Upstream initialize/thread-start/turn-start/error/config-read schemas, shell
filter/merge/command-environment and macOS seatbelt files are unchanged at the
two source commits. Changed permission-context materialization and thread model
readback were reviewed; actual 0.153.4 credential-free checks covered named
permissions, final filtering, approved reads, denied held reads, symlink escape,
writes, command network and finite cleanup. This is not cold isolation, Strict
qualification or evidence of an actual scoped model task.

**Historical preparation disposition: HOLD / not_run.** On 2026-09-09 the candidate broker's
supported file-backed source was absent while ordinary storage was configured
as keyring. The new candidate canary and retained incident were not executed.
No new qualification or registry/production-selection change is prepared on
the strength of model-free checks alone. The separate authentication-contract
boundary must be reviewed before using that candidate allowance. Production
remains managed 0.152.1. Its retained rollback eligibility does not promise
restored Astra compatibility.

After the required candidate evidence and reviewed adoption, the pending
one-turn incident must bind the then-current exact source, managed executable,
configuration and fresh normal scope. It continues to request `gpt-6-astra` /
`max`, use the developer-readable incident consumer, and retain the 180,000 ms
ceiling, smaller RPC/settlement limits, no retry and no X-to-B progression.
This task does not execute or renew that allowance. No historical fingerprint
is rewritten or transferred to the new source.


### Historical PR #1239 ordinary-keyring and verification follow-up

The earlier unmerged candidate credential connection resolved the selected ordinary
source in the existing broker. Direct macOS keyring uses the pinned User-domain
lookup with interaction disabled, validates ordinary TokenData, and provisions
only a private owner-only candidate snapshot. Secrets/auto fallback, managed or
unrepresented account restrictions refuse. Historical file-profile meanings,
source configuration, source no-writeback, private refresh and cleanup remain.
Availability is not a grant; the genuine candidate preparation binds current
source metadata, and consumption revalidates that binding.

The 2026-09-09 real User-domain prerequisite returned a noninteractive read
refusal before any candidate claim, host or turn. OS lock/ACL/unavailability
were not individually diagnosed. The earlier preliminary search-list lookup
was not the pinned User-domain contract and is retained separately. No
credential, prompt, keychain mutation or provider operation resulted. The
canary remains unconsumed. No qualification, registry/selection adoption or
managed-store installation follows from this refusal; production stays 0.152.1.
The pending post-adoption incident is still unexecuted and must later use actual
reviewed managed/runtime/configuration bindings and a genuine fresh scope.

The verification executor now leaves shared generated state untouched when
preflight refuses or maintenance acquisition fails. Successful acquisition
retains normal partial/success cleanup and restoration. Existing receipt fields
report actual presence/removal; an untouched build is not reported as removed.
The prior failed receipt and later recovery remain separate historical evidence.


### PR #1239 prospective native-auth canary connection

The later user dispatch replaces the custom ordinary-Keychain reader prerequisite
with `native_ordinary_context_canary.v0.1`. The unmerged custom reader is removed;
the historical #1207 file broker, its profile, and Strict behavior are unchanged.
Prior refusals and receipts retain their original meaning. A helper's OSStatus
is not evidence that official Codex cannot use the ordinary login.

`prepareCodexCandidateCanaryV01({native_auth: {approved_instruction_files}, ...})`
binds a distinct profile fingerprint, existing native context, approved instruction
hashes and effective launch-policy fingerprint to the genuine candidate handle.
Only the exact reviewed 0.153.4 artifact may consume this mode. It remains
unqualified candidate evidence under the existing exclusive reviewed-reentry and
single-use claim owners. Neither an arbitrary launch nor a scoped-task grant can
substitute for that binding.

The candidate and normal production adapter use the same bounded child-environment
owner. Official AuthManager consumes the existing coherent HOME/CODEX_HOME and
SQLite context, chooses the configured credential backend, enforces login and
workspace restrictions, and owns ordinary refresh. Augnes does not retrieve,
copy, hash, or export credentials. Native refresh/cache writes are expected host
effects; no byte-identical-home or Strict/cold-isolation claim is made. The
candidate cleanup owns only its extracted artifact and empty execution directory,
not pre-existing native authentication, history, or databases. A separate fresh
private SQLite paired with real history is refused, as is configuration redirection.

The shared pre-launch restriction owner selects named permissions at initialization,
thread and turn boundaries; disables ambient memory/background generation, Chronicle,
MCP/plugins/connectors/discovery and shell tools; and verifies the final closed
command environment. Explicit auth-selection/restriction settings must match native
configuration readback; conflicting source layers refuse. Generic global instructions
must match approved file hashes. No prior transcript is replayed. The ephemeral
canary has no task-file grants; write/network permissions remain denied and any
unexpected task tool/effect stops the existing candidate contract.

`createRecordedCodexAppServerAdapterV01` may connect the already reviewed local
incident-message callback only for a genuine native-candidate handle. Category
recording, accepted-terminal ownership, cancellation and result semantics remain
unchanged. The finite operator closes captures after settlement and reads them
from disk; a missing/withheld message is not authority to retry.

The limit remains one fixed non-tool canary, requesting `gpt-6-astra` / `max`,
60,000 ms and existing smaller RPC/settlement bounds. Native account/configuration
checks occur inside that counted startup. The outcome and exact exercised source
are reported in the PR's local evidence appendix. Production stays on 0.152.1;
qualification/adoption require actual canary completion and settlement plus review.
The pending scoped incident remains unexecuted and requires post-adoption bindings.

### Native-auth canary outcome and adoption proposal (#1239)

At `2026-09-09T16:20:16.274Z`, the single authorized reviewed re-entry ran on
Augnes source `b843ddec19a6638af5b1909d9351517953968528`, tree
`7b34d6891b803dd58a1ead14ad81054c705907a8`. The exact official 0.153.4 native
completed `AUGNES_CANARY_OK`: one authenticated host, one confirmed fresh turn,
`gpt-6-astra` / `max`, no task tools/effects. Execution and settlement took
10,240.799 ms within 60,000 ms. Adapter settlement passed, category capture
closed/read back nine observations, and no failed-terminal incident hook was
expected or observed. Owned candidate directories were removed; the disposable
operator session was revoked and its separate preparation DB closed and retained.

The prospective native-auth profile fingerprint is
`sha256:0e88b70eda8ffd3957f47de7d3661830c4a00130fa68dea1c289abd3f2f291aa`.
The pre-outcome freeze is
`ad19a7469cb21db0d5f6ccc148be0faedea51b96fee37df44a9ccd975ff1b414`;
terminal outcome fingerprint is
`sha256:b2abd85cf69105484f07a3209f6e57d68cef0eaaf2a11f26d651fc3d6975dc9d`.
These bind the local candidate evidence, not a Core RunReceipt, scoped-task
execution, independent evaluation, backend identity or general P5.1 usefulness.
The new allowance is consumed. Earlier HOLDs, failures and claims are unchanged.
Provider rounds, tokens and cost were not observed; shared subscription quota
was unreserved and no additional PAYG was authorized.

The following is an **unapplied adoption proposal for review**. No registry
qualification or production-selection change is performed by this PR:

| Owner | Exact proposed action after review |
| --- | --- |
| Qualified registry | Add `codex-rust-v0.153.4-darwin-arm64`, source `3d2ee51ca2d5db578f328aa75e20aa22c0197c9a`, official release 383061770 / standalone asset 545043537. Preserve old entries and HOLD evidence. |
| Artifact | Archive SHA-256 `8cf911ea676523bfb2121ec561848d2aba564890ad536db4d8a3353f2b9850b1`, 87,323,149 bytes; native SHA-256 `b973d440acac501fd2594a43e7ca9ce41e0a65b9dfb28d0d7a7837c99e1261e3`, 220,584,000 bytes. Direct native only; no arbitrary PATH or Node-launcher admission. |
| Ordinary qualification | Use the existing `reviewed_exact_ordinary_qualified_v0_1` evidence shape after accepting source/schema review, focused model-free compatibility, this native-profile canary, and the PR's final exact-head deciding receipt. Preserve the distinction between the existing adapter compatibility profile and this prospective authentication/state profile. Strict remains HOLD. |
| Managed selection | After separate user adoption, stage through `ensurePinnedCodexManagedRuntimeV01` using the reviewed exact registry selection, then validate the immutable manifest/native bytes through normal selection. The retained verified archive is preparation evidence; candidate staging was removed and 0.153.4 is not yet present in the production store. |
| Rollback | Keep the existing eligible 0.152.1 entry and bytes. Read-only selection at `2026-09-09T16:27:30.701Z` verified native SHA-256 `8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf` and store manifest `sha256:75fbadaf3ccd237fc573af6096335a78b39b4eeca5c1faed34aac0a5699922c4`. Use existing last-known-good/retention owners at actual adoption; this observation does not create rollback state or promise Astra compatibility. |

Auth implementation files and all 52 SQL migrations are unchanged between the
pinned 0.152.1 and 0.153.4 sources. The reviewed state changes handle newly added
metadata records without a schema change; existing WAL/busy-timeout ownership
remains. Native AuthManager used the existing selected keyring context without
an Augnes secret read/copy, fresh private SQLite, transcript replay, or startup
rehearsal. Compatible incidental refresh/cache writes are host-owned effects;
the ordinary home is not claimed byte-identical. The same installed Companion
remained live after the canary; later deciding verification restoration is
separate evidence and need not retain its process generation.

After reviewed adoption, the pending single-turn scoped incident must freshly
bind the then-current source, managed artifact, configuration and genuine scope.
It was not executed here. No second canary, qualification transfer to changed
launch/auth code, or automatic diagnostic follows from this success.

### Exact 0.153.4 adoption implementation (#1234)

The adoption change registers the exact artifact above as ordinary-qualified
and changes the intended checked-in ordinary pin to
`codex-rust-v0.153.4-darwin-arm64`. This is a source change for review, not
activation of the live service. The prior two registry entries and historical
candidate HOLDs/claims are unchanged. Strict's frozen 0.152.1 profile and HOLD
now resolve their exact entry independently of the ordinary pin.

The existing `reviewed_exact_ordinary_qualified_v0_1` shape references the actual
rolling candidate receipt
`47ddc938886a5da308f9fa9d30330730ed4417f4e6b8731b84101591b13a40f5`.
That receipt's automatic delta HOLD remains historical; it is not itself a
successful authenticated completion. Separate typed evidence references retain
the accepted source/model-free review, actual native canary terminal outcome
`sha256:b2abd85cf69105484f07a3209f6e57d68cef0eaaf2a11f26d651fc3d6975dc9d`,
native-auth/state profile
`sha256:0e88b70eda8ffd3957f47de7d3661830c4a00130fa68dea1c289abd3f2f291aa`,
and #1239 application Canonical receipt
`244965ffd2c7ad9b3ee50e52a838a443e80c8e9ff3eec224647eeeb7ddb7d355`.
The application receipt is not substituted for candidate evidence. No historical
record is rewritten or new canary result created.

The production resolver admits the existing reviewed evidence shape without
requiring a legacy isolated-auth attestation: its internal legacy
`semantic_profile_fingerprint` is null for this entry. Adapter compatibility
remains the unchanged `sha256:a4cfb0e38fd6a2af0d29a467c2c5db2579cdc784e93a820f3482fa2c8a1d663a`,
distinct from the native-auth/state profile. Ordinary post-spawn user-agent
validation uses the existing version-bound parser after exact registry
currentness validation; it returns the selected observed version instead of
Strict's historical version label. Authentication, permission, source, result,
receipt, diagnostic, cancellation and settlement owners are otherwise unchanged.

Inactive staging uses `ensurePinnedCodexManagedRuntimeV01` with its optional
`reviewed_archive_bytes` input. Local bytes replace only acquisition; the same
exact archive size/digest, safe extraction, native size/hash/format/version,
atomic publication and sealed-manifest validation still apply. Invalid local
bytes refuse without downloading a replacement. Omitting the option preserves
the existing official download route. This does not change global configuration
or add a runtime-selection override.

On 2026-09-09, the retained official archive was installed into the separate
inactive managed store at
`<managed-root>/inactive-adoptions/codex-rust-v0.153.4-darwin-arm64`.
Actual production-owner readback verified the exact native hash above and
manifest `sha256:bb835e7cff0c791f840baedfc1f00a65818b5084d19c8f3e7358d93dfa2b9406`;
staging locks and temporary staging entries were empty. No host, thread or
turn was started. The current active store's 0.152.1 bytes and manifest
`sha256:75fbadaf3ccd237fc573af6096335a78b39b4eeca5c1faed34aac0a5699922c4`
were unchanged. No last-known-good invocation record was manufactured.
The inactive store is not passed to the installed service. This separation
also prevents the older registry's retention owner from encountering an
unregistered future artifact in its active `artifacts` directory.

After this adoption change is reviewed and merged, the remaining activation
procedure uses existing owners:

1. Verify the clean accepted merged source/root and stop the exact installed
   Companion through `augnes:service:stop` before changing its source checkout.
2. On the accepted adoption source, resolve the normal managed root through
   `resolveAugnesLocalPaths`. Call `ensurePinnedCodexManagedRuntimeV01` for that
   active root with the retained reviewed archive bytes. This validates and
   installs through the same owner; do not manually move binaries/manifests or
   point production at the inactive store. Read back the pin, manifest and native
   identity through normal selection/resolution.
3. Start the installed Companion through `augnes:service:start`, then verify
   exact lifecycle/UI/bridge/Core identity, existing-data continuity and the
   accepted-source runtime selection. Service activation is distinct from a
   worker/model invocation.

The existing qualified 0.152.1 entry and active-store bytes remain eligible
rollback material. Rollback requires a reviewed exact pin/source change through
the same owners; it neither promises Astra compatibility nor rolls back native
credentials/state. Existing last-known-good and retention semantics are not
redefined by staging.

The pending scoped incident remains **not_run**. After actual adoption it must
freshly bind the then-current source, managed 0.153.4 artifact, ordinary native
authentication/configuration, genuine stage-1 scope and reviewed capture. Its
single-turn limits and authorization boundary remain separate from registration,
staging, activation and the already consumed successful canary.
# Scoped code-mode snapshot draft (#1234 / #1241): HOLD for review

This prospective connection requires review. It does not activate a helper or
create another execution allowance. The historical post-adoption turn remains
native-completed, task-partial/blocked, X unchecked, B unexposed, and Y deferred.

The existing managed-store owner can explicitly install a separate paired view
with `ensurePinnedCodexScopedManagedRuntimeV01`, given both exact reviewed
archives. Its `codex_managed_scoped_runtime_store.v0.1` manifest binds the native,
helper and scoped configuration fingerprint. Old native-only manifests,
qualification records, pin, default selection and rollback evidence retain
their meaning. There is no fallback download or last-known-good invocation
fabrication. Production must not point at a disposable test store.

The native remains the reviewed 0.153.4 executable, SHA-256
`b973d440acac501fd2594a43e7ca9ce41e0a65b9dfb28d0d7a7837c99e1261e3`.
The official helper asset is `545043539`,
`codex-code-mode-host-aarch64-apple-darwin.tar.gz` (22,569,619 bytes), archive
SHA-256 `45a9b0fdf53b98b85a6bb91e175dd90e961328a7a14fb50a40902205199df1df`.
Its sole regular member is `codex-code-mode-host-aarch64-apple-darwin`, a
62,767,552-byte Mach-O arm64 executable, SHA-256
`d8a2222e017342718d16a5dbe092921c628961f812f62f42036b8d960e1ffe56`.
The verified upstream layout is `bin/codex` plus sibling
`bin/codex-code-mode-host`; no PATH lookup or unofficial rebuild is admitted.
These are release-digest, byte and source observations, not signed build
attestations.

Only a genuine scoped 0.153.4 task selects this paired view. The launch sets
`features.code_mode_host={enabled=true,disable_in_process_fallback=true}` while
retaining code-mode feature selection, prewarm and ambient suppression. Model
metadata still owns CodeMode/CodeModeOnly routing. The typed host readback must
match exactly. `agents.enabled=false` is also necessary: the pinned consumer
otherwise lets bundled model metadata select v2 despite disabled feature flags.
The non-tool native canary and historical 0.152.1 projection stay separate.
Managed artifact integrity is revalidated before thread and turn boundaries.
Missing helper/backend or contradictory settings refuse; configuration alone
does not attest a model-selected tool call.

The explicit model-free regression extends the existing sandbox fixture:

```sh
npm run test:codex-sandbox-projection -- --scoped-code-mode-native \
  <reviewed-native-archive> <reviewed-helper-archive>
```

It follows pinned upstream `app-server/tests/suite/v2/code_mode_host.rs`: fixed
loopback Responses events substitute only for the model. Private empty auth and
state replace the ordinary account context. The real native router, exact
stdio helper, nested ExecCommandHandler, environment projection and named OS
permission consumer execute. The local catalog returns an empty fixture;
bundled metadata remains effective. No credential, provider or evaluator call
is involved. This is not a native Augnes RunReceipt or live confirmation.

Allowed synthetic reads and held/outside reads, writes, apply_patch and command
network denials are exercised, along with absent process/require/fetch globals,
rejected imports, interruption and parent/helper/command settlement. The helper
itself is not spawned inside the task's OS sandbox: V8/import restrictions and
the permissions applied to nested commands are distinct boundaries. Native
input-request tools remain exposed and unexpected server requests still refuse;
collaboration and MCP tools must be absent. The outer 180,000 ms execution and
10,000 ms RPC/settlement ceilings and reserve are unchanged. Fixture limits are
smaller; helper defaults do not extend an outer invocation.

**Historical blocking negative at `3bfeb871`:** after admission, an external synthetic actor replaces an
approved file with a symlink before the next command's sandbox is compiled.
The exact native consumer reads the held target. Pinned
`sandboxing/src/seatbelt.rs` canonicalizes read roots when building each policy;
Augnes's existing source validator rejects such a replacement at admission but
does not run inside each native nested command. This is an observed fixture
failure, not evidence that the historical worker changed files or read B.
The original fixture and failure remain in history and its frozen evidence.
They are not relabeled passing. The revised contract below retains that source
replacement timing while changing the actual consumer root to an independently
validated snapshot. It does not claim to repair mutable-path authorization in
the native artifact itself.

## Persisted completed-X continuation (#1234)

The application-local `createPersistedCodexFeasibilityContinuationV01` in
`codex-scoped-task.ts` is the separate entry for an explicitly authorized
continuation after the original X runner and window have ended. The legacy
`createCodexFeasibilityWindowV01` same-window stage-1/stage-2 path is unchanged.
An ordinary fresh window still cannot start at stage 2.

The new coordinator reads the actual completed receipt, original automatically
produced proposal, recomputed assessment, run ledger, current packet and
registered physical root through existing result, review and admission owners.
It rechecks the original producer's persisted adapter/capability identity;
this implementation's source identity does not replace X provenance. Completed
execution with failed criterion verification is eligible predecessor evidence,
not semantic acceptance. Paused/unresolved state, mismatches and a later run
refuse. The unknown-operation original candidate remains non-transitionable.

This is a **same-task** continuation owner. Its task-equality rule is not a
blanket restriction on explicitly authored successor tasks. The retained live
continuation subsequently consumed its allowance while preserving an X-only
task; native completion did not establish B comparison. Do not replay this
sequence against that consumed disposition.

Trusted disposable same-task orchestration uses this sequence (no HTTP/worker flag):

1. Open the completed study DB through its normal lifecycle and call the
   factory with its real config, receipt ID and original proposal ID. This is
   read-only preparation. `window.snapshot().attempts` is zero; the historical
   predecessor is reported separately.
2. Call `coordinator.revise` with the authenticated normal revision request.
   It arms the monotonic 600,000 ms window immediately before that normal
   semantic mutation. Continue through `decide`, `preview`, `confirm`, and
   `apply`, using the actual returned bindings/cookies and inspecting preview
   effects. These call the existing authenticated owners; they neither choose
   semantic content nor create eligibility or nondelegable human authority.
   Every modifying call checks the same clock. There is no clock reset or
   automatic rollback of a committed semantic prefix.
3. Only after application, call `prepareStage2` with the separately authorized
   file/instruction hashes. It validates the full revised-proposal/Decision/
   gate/Transition relation and freshly admits the exact compiler-produced
   later packet and GuideBrief. Work/task and stable project/root lineage must
   remain the same. Only the root reference's producer-supported observation
   time refresh differs. Source and snapshot identities remain distinct.
4. Supply the returned genuine `{scope, window}` to the existing
   `LiveNativeHostRunServiceV01` and its scope-bound, cached recording adapter
   factory. `start` consumes the single new attempt via `window.begin`; before
   adapter invocation it revalidates the actual request and fresh admission.
   B is bounded by 180,000 ms, remaining window less settlement reserve, and
   all smaller existing service/RPC/settlement limits. No X replay is performed.
5. In `finally`, shut down the service, close/read captures, then call
   `coordinator.close`, revoke the disposable session and close the DB. The
   ordinary snapshot owner refuses release while consumers remain unsettled.

Before any semantic write, an exclusive owner-only, bounded disposition JSONL
is created beside the actual study DB, outside its task root. It records the
verified predecessor and bounded phase names, never credentials or semantic
payloads. Existing disposition means refusal, including after process loss;
it is retained as evidence, not read back as a renewed grant. Two prepared
coordinators cannot both acquire that file. In-process genuine handles, exact
scope binding and consumed attempt accounting prevent clone/replay renewal.
Failure to record a terminal disposition is reported separately by coordinator
cleanup; it does not replace an already persisted host result or receipt.
This is not a distributed budget service or cross-process exactly-once claim:
automatic restart, removal of the disposition, moving/copying a consumed DB,
or reconstruction of a lost coordinator is unsupported. Such cases require a
separate reconciliation/authorization decision. No Core schema changes.

The synthetic regression uses the existing bounded child runner, normal
persisted-result/revision/Transition/compiler owners and a fake App Server
through the real scoped adapter/service/receipt consumer. Its fixed command
events do not establish native file consumption. This change neither applies
the real frozen clarification nor runs X, B or Y. Historical failed checks,
attested reads, user-declaration boundaries and all original evidence remain
unchanged. Review/merge, deployment and a new explicit continuation dispatch
remain separate from this implementation and its model-free verification.

## Authored successor handoff after the consumed continuation (#1234)

The retained prefix is completed X, applied clarification, later packet,
completed B-intended/X-repeat run, and consumed continuation. No new clarification
or Transition is needed to author a successor. The old three-file/X-only task
and original TASK.md remain immutable historical evidence. Merely selecting
accepted context mentioning B or copying B into a snapshot is not a B handoff.

The prospective local sequence after review/merge and separate deployment is:

1. Read the actual current packet and latest settled receipt through normal
   owners, including their fingerprints, active selection and source/root
   binding. Never pick a different receipt to renew a consumed allowance.
2. With separate explicit task-authoring authority, call
   `defineAuthoredSuccessorTaskV01` using normal operator credentials. Author a
   calibration-B objective, comparison criteria/check IDs and stop conditions
   (retain clarified X scope/uncertainty, no X repeat, no Y). Declare B's exact
   task-data hash and the original files as historical material. The packet's
   task is the current instruction; historical TASK.md is not copied or edited.
   Do not supply the expected comparison outcome. Reference values belong in
   the artifact to be checked. Approved generic host-instruction hashes are
   separately bound; these must not contradict the reviewed task.
3. Inspect the returned definition and normal continuity readback. The owner
   appends a new work-definition/packet identity, retains accepted context and
   its actual Transition references, and links the latest result without
   accepting its proposal. Stale/duplicate authorship refuses. Existing
   semantic compilation remains a same-task context update.
   Consecutive authored tasks inherit revalidated semantic/context validity
   separately from task supersession. The newest exact successor can be current
   while its predecessor is historical; changed accepted context still makes
   the successor stale. The writer checks compiled currentness before commit.
4. `prepareAuthoredSuccessorHandoffV01` normally admits that exact packet and
   GuideBrief and creates a genuine source-bound snapshot of task data only.
   It rejects an old X-only packet, changed source/hash/root, or unbound
   instruction inventory before any Start or adapter invocation. It creates
   **no window or execution authority**. The old continuation remains consumed.
5. A later live dispatch must separately authorize one new bounded invocation.
   The existing authenticated `runDirectNativeHostRoundTripV01` consumer accepts
   this prepared scope with its genuine cached recording adapter; it refuses a
   missing scope, wrong adapter or resume before claiming a run. Its normal
   request, result and receipt owners remain in control. Do not pass the scope
   to the consumed coordinator, relabel it stage 1, or invent a window. Preserve
   the requested model/effort, existing execution/RPC/settlement limits and
   explicit single-attempt authorization. Always settle consumers before
   releasing the snapshot and closing the disposable session/DB.

Model-free coverage reproduces the X-only conflict through normal synthetic
revision/Transition and the real adapter/service consumer, then checks an
authored successor's exact serialized packet, GuideBrief, roles and snapshot
using the existing fixed fake App Server. Its X-only response deliberately
omits the calibration check; native completion remains separate from comparison
completion. The required-check list binds verification obligations; this
profile does not reuse the unrelated project-root criterion-verification plan.
Reported checks/file reads retain their actual evidence basis. Structural
consistency cannot detect every contradiction in authored prose or task data;
review the exact handoff rather than claiming automatic semantic validation.

One supporting-serial child covers this handoff with its own 30-second ceiling;
legacy initialization/continuation ceilings and cases are unchanged. This adds
30 seconds to aggregate permitted child time, not a speedup. No live runtime,
helper or study execution is part of this fixture. The change adds no dependency,
Core migration, allowance-renewal mechanism, or automatic recovery. Older source
does not understand the new lineage: preserve data and use the compatible
reader instead of deleting packets or deploying an older reader over them.

This amendment is prospective. It does not modify the real prefix, activate a
successor, grant a live attempt, accept the later proposal, or establish B/X/Y
success, stronger file attribution, or P5.1 usefulness.

## Trusted-local snapshot connection (#1241, revised product scope)

The supported input profile is `trusted_local_read_snapshot.v0.1`; the scoped
contract is `codex_synthetic_read_snapshot_scope.v0.2`. It implements the
[local snapshot semantics](../vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md#trusted-local-read-only-input-snapshots),
not the superseded OS-enforced immutable image/mount proposal. No mount, sealed
backing, hostile same-user-writer resistance or general isolation platform is
required or claimed. Controller, reviewed runtime/helper and OS are trusted;
worker commands, delegated tools, subprocesses and their accessible services
are not. chmod is hygiene; the native permission consumer denies worker writes
and out-of-scope reads. This does not support arbitrary independent host writers
or imply uninterrupted original-source currentness.

`createCodexScopedTaskV01` validates the exact approved flat regular-file
inventory, creates an exclusive controller-owned temporary directory, copies
bytes into independent files, closes write handles, and verifies the staged
hashes and inventory. No symlink, hardlink, extra hidden instruction or shared
writable source object is admitted. It observes a distinct execution physical
root and fingerprints the source-to-snapshot material. The original registered
root, packet/GuideBrief and cutoff remain unchanged. The three-file inventory
and held-material rules are P5.1 constraints, not universal product limits.

Authenticated `LiveNativeHostRunServiceV01.start` still runs normal persisted
packet/currentness admission. `runDirectNativeHostRoundTripV01` constructs the
original-source request and calls `bindCodexScopedRequestV01` before invocation.
This private binding covers the complete actual producing request and snapshot;
it cannot be supplied by a remote request or worker. The branded adapter then
uses the snapshot as process/thread/turn cwd and grants only its exact task
paths. Source/runtime/configuration/instruction checks remain at their existing
boundaries. The paired `codex_scoped_code_mode.v0.2` configuration fingerprint
now names this input profile; the managed owner selects a distinct paired
manifest/directory, without rewriting old native or paired manifests.

The real accepted result remains bound to the original request and admission.
After host settlement, snapshot integrity and source currentness are checked
separately. Snapshot corruption invalidates execution evidence. Observed source
drift blocks completion as current-source evidence while preserving bounded
observations about valid frozen inputs. The receipt's existing observation and
source-ref fields retain snapshot/request fingerprints and these dispositions;
no physical snapshot path is promoted to a portable project identity. These
checks detect observed drift, not instantaneous or transient hostile mutation.
`service.shutdown` settles consumers before releasing the scope. Failure to
settle, or a replaced cleanup root, retains the snapshot for reconciliation.
Capability-only preparation must also release its unused scope. No normal
writer updates a running snapshot and no mutable-source fallback exists.

The credential-free fixture verifies approved snapshot reads after original
symlink, same-path replacement and in-place changes, including delayed open
after dispatch. Separate worker negatives cover writes/replacement, source and
held/evaluator/outside access, permission escalation, nested session identity,
imports and network. A permitted controller request reaches the same loopback
endpoint before the sandboxed denial. The production nested-command consumer
and exact helper execute; fixed SSE replaces only model output. Independent
host mutation of a private snapshot is an excluded prevention claim, with
corruption detection and cleanup-root refusal tested separately. It is not
reassigned from worker-induced access or ordinary original-source drift.

Typed `features.code_mode` namespace/yield overrides and forced non-Only flags
must not survive the scoped scalar-false projection. Model metadata remains
native-owned: bundled CodeModeOnly is exercised by the real fixture; pure
projection tests cover unsupported forced routing and missing/contradictory
process backend refusal. They do not claim a cached/remote model catalog or
actual model-selected dispatch was observed. In the pinned consumer both
CodeMode and CodeModeOnly use this process provider when selected; disabled
fallback is derived from the validated typed host field. The exact optional
native configuration readback and file/canary routes retain separate evidence.

Added operational burden is one bounded copy/hash/validation pass, one private
directory per invocation, and teardown after settlement (at most eight files,
128 KiB each in this local implementation). Preparation/validation, fixture
execution and cleanup timings are recorded separately in local evidence. There
is no new dependency, mount privilege, daemon or platform-wide startup
requirement. The executed nested-command proof is for the exact macOS arm64
pair; other platforms gain no support claim.

After the boundary is resolved and deciding evidence accepted, a later explicit
activation may stage this exact pair through the owner in the actual service
store on reviewed source. A separately authorized single-turn confirmation
would then create fresh current scope/capture bindings and measure actual
model-selected dispatch. Neither step is performed by this implementation task.


## Completed-command snapshot cwd observation (#1234)

Completed `commandExecution` items validate cwd against the execution root of
the genuine scoped request/snapshot binding. The original registered source
root, physical identity and packet lineage remain unchanged. This check admits
an observation; it grants no filesystem access. Non-scoped observations and
permission/file-change consumers retain their existing original-root rules.
Checkpoint recording still precedes cwd validation, so rejected observations
retain potentially observed effects and the existing reconciliation disposition.

The production adapter/service fixture now sends explicit started/completed
command items with a distinct snapshot cwd and a bounded terminal result. It
checks normal receipt/proposal persistence and original-source plus snapshot
lineage; source cwd, unrelated and foreign snapshot paths, traversal, forged
bindings and conflicting replay refuse. Canonical aliases, relative cwd,
duplicate replay and the default route retain their existing behavior. The
fixture substitutes App Server protocol responses; it does not execute a model
or task command. The separate real native/helper fixture does not substitute for
this event-consumer coverage. Historical X remains unchecked, and its actual
triggering cwd was not retained; no historical result is rewritten by this fix.

The complete initialization fixture and its fifteen-case scoped adapter/service
matrix have separate `supporting-serial` Canonical children. Each has a 30,000 ms
ceiling; the combined child allowance is now 60,000 ms instead of 30,000 ms.
The default initialization entry no longer repeats the scoped matrix. This is
coverage scheduling, not a production timeout change or a claimed speedup.
The existing runner's `integration --project-work-only` focus executes both
registered owners with normal environment isolation and deadlines; it is not
deciding evidence or a complete integration suite.

Before launching each child, the parent records and owns its disposable root's
physical identity. Normal child cleanup still uses genuine scope/service owners.
After an interrupted child tree settles, the parent may reclaim its own test
root, restoring owner access only through checked directory descriptors. It
does not follow symlinks, accept a replaced root or remove an unsettled child's
resources. Independent cleanup attempts continue after a refusal, and execution
and cleanup failures are reported together. This test-only ownership neither
reconstructs a dead production scope nor changes snapshot lifetime semantics.
Expected interruption regressions require both a failed child result and actual
resource absence; cleanup cannot turn an unexpected deciding timeout into a pass.


## Public structured-result admission (#1234)

Public descriptions may use a single-letter prose label followed by horizontal
whitespace and a word or number, for example `B: comparison reported.` or
`Y: untested.`. The lexical rule applies to every letter. Bare drive tokens
(`C:`), drive-relative tokens without whitespace (`C:private.txt`), drive-absolute
paths, UNC paths, file URIs and the existing POSIX/root-disclosure patterns
remain refused. `C: notes` is lexically ambiguous and treated as prose; this is
not a general natural-language or filesystem-path detector. Filesystem/path
fields retain their strict canonicalization and do not use the label exception.
A label does not exempt a prohibited path or credential elsewhere in its text.

The public-text owner is used by the adapter parser, final `NativeHostResult`
validator, live-service lifecycle/approval text and strategic-transfer source
text. Their error and authority boundaries remain distinct. The directly
implicated `RunReceipt` reader shares the label rule only for its public prose
fields; identifiers and path references retain their previous treatment. No
receipt format, fingerprint algorithm, semantic acceptance rule or execution
grant changes. Existing records and historical outcomes are not rewritten.

The model-facing output schema descriptions and rendered output instructions
both require bounded descriptions and relative task filenames, excluding
absolute source/snapshot/home paths, file URIs, credentials, raw commands or
output, transcripts, hidden reasoning and environment dumps. Task content and
accepted context remain unchanged. This reminder supplements validation; it
neither proves compliance nor repairs rejected output.

The adapter records `result_admission_rejected` separately from native terminal
status. It distinguishes `structured_result_parsing` from
`native_result_validation`: the same final result validator is now also called
before adapter result publication while the invocation recorder is connected;
the normal direct consumer retains its independent validation. A closed
implementation-owned vocabulary carries the field category, rule family and
public error code, or `unknown`/`unclassified`/null where unavailable. Existing
run/thread/turn references link the observation to its invocation. Rejected
values, arbitrary JSON keys, answer snippets, raw errors and value-derived
fingerprints are excluded. This is an optional local observation, not a new
Core record or the failed-terminal incident-message channel.

The bounded category recorder retains the observation and reports
`result_admission_diagnostic_written` in its closed disk status. Observation and
byte ceilings are unchanged. Emission follows owned cleanup attempts; it does
not prove settlement. Recorder I/O failure stays explicit without changing the
result. A general observer exception still refuses settlement, while all
cleanup and the settled observation are attempted. No failure grants a retry.

Model-free coverage uses the fixed fake App Server through the production
adapter, direct executor and normal receipt/proposal producers. It covers
labeled and label-free admission, nested prose, private paths/credentials,
parser/final rejection categories, disk readback, absent required B checks,
attestation preservation and capture/observer failure. No real study state or
native/helper/model execution is used. The historical rejected field/value and
answer remain unknown; the reproduced label defect does not prove that it
triggered the historical attempt. That attempt remains consumed, with no
admitted B comparison. Review/merge, activation and any future live invocation
remain separate decisions.
