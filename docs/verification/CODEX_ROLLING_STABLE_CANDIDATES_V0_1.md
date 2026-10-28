# Codex rolling stable candidates v0.1

Phase 5 of CDX4 is a manual, bounded candidate pipeline. Its owner is
`lib/vnext/native-host/codex-rolling-stable-candidate.ts`; its entry point is
`scripts/run-codex-rolling-stable-candidate.ts`. It is separate from the
checked-in qualified-runtime registry and production selection.

## Run boundary

Use the canonical clean checkout on a task branch, with local `main` equal to
the authorized exact base, on macOS arm64 with repository-pinned Node 24.22.1:

```sh
node --import tsx scripts/run-codex-rolling-stable-candidate.ts \
  --follow-stable --base <exact-main-commit>
```

`latest` is discovery input only. `discoverCodexRollingStableV01()` reads it
exactly once at cycle start, resolves the selected release's exact tuple, and
freezes both the tuple and its asset object. The cycle continues against that
tuple even if a newer stable appears. Before acquisition, revalidation reads
only the frozen release ID, tag, peeled source and asset metadata; it never
rereads `latest`. Changes to the frozen identity fail closed. A newer stable
is eligible for a later cycle without requiring a patch-specific code change.
There is no scheduler, global Codex import, or automatic production adoption.

The skip policy uses the highest version already present for this platform in
the reviewed registry or local rolling evidence, regardless of lane outcome.
It does not retry a registry candidate, older release, or locally attempted
release. The existing record for the same version returns its original evidence
without another archive acquisition or runtime attempt. Unreadable or conflicting
records fail closed. Inventory is bounded at 1,000 previous local records;
reaching that bound needs separate evidence-retention review, not deletion to
reset an attempt budget.

Discovery cross-checks latest and exact release metadata, the annotated tag,
its peeled source commit/tree, and the one standalone CLI tarball's asset ID,
size, URL and official SHA-256. Unsupported tag shapes or missing/ambiguous
identity fail closed. No upstream macOS signature is claimed. Downloaded bytes
must match the frozen size/digest before the managed-store owner's bounded tar
parser checks a single regular native member. The native SHA-256, file mode,
Mach-O architecture and CLI version bind the isolated provider-free probe.
The CLI version check executes inside that probe's disposable environment.

The pipeline borrows the existing candidate isolation/config policy and exact
app-server probe. It exercises only `--version`, `initialize`, `initialized`,
`account/read` with refresh disabled, and `config/read`. It does not load the
user's Codex home or use their globally installed binary. No authenticated
canary, thread, turn, provider request, production registry mutation, or Strict
Agent Identity operation is available through the rolling cycle command.

## Separately authorized ordinary candidate canary binding

Synthetic tests resolve the fixed `scripts/fixtures/fake-codex-app-server.mjs`
through the source-owned fixture validator. Its exact canonical path, regular
single-link file, reviewed byte digest, Node executable, explicit test mode and
single permitted prefix are required. Isolated-auth prefix admission and the
private broker's spawn boundary use the same identity check. A copied fixture,
matching basename, alias, changed bytes or extra argument is not eligible.
The ordinary canary's test-only serialization scan validates the complete fixed
argument sequence before representing that one proven locator symbolically;
every other launch field still passes through the unchanged credential-shape
detector. Embedded synthetic credential rejection and source-home non-leakage
remain tested. This does not grant execution or broaden production launch input.
The fixture's own isolated-auth argv observation uses the same fixed identity
check and a source-owned digest of the exact isolated-auth argument sequence;
the contract test binds that digest to the existing override constants. Only
the proven locator is symbolized, with the executable and all other arguments
still scanned. Extra arguments fail closed.

`prepareCodexCandidateCanaryV01` prepares an opaque single-use adapter binding.
It requires the persisted Phase 5 receipt, a run-scoped
`COMPATIBLE_PROFILE_REUSE_SUPPORTED` decision bound to that receipt and its
profile/config fingerprints, and the exact standalone archive bytes. It
revalidates only frozen official release/tag/source/asset metadata, never
`latest`. The existing managed-store extractor checks archive/native identity
in private qualification-only staging; nothing is published to production.

The adapter's `candidate_canary` option is mutually exclusive with ordinary
launch overrides and Strict Agent Identity. Compatibility semantics still come
from the current implemented qualified profile, while the candidate artifact
is never represented as a qualified selection. Consumption burns both the
in-memory token and an exclusive `.ordinary-canary-claimed` marker beside the
receipt before execution. Do not remove or relocate evidence to renew a budget.
An unused preparation can be disposed without invoking the adapter.

The historical/default invocation uses the #1207 ordinary credential broker to validate a
selected ordinary AuthDotJson and reconstruct only its required TokenData
and optional refresh timestamp inside a private home. Credential values never
leave that owner and refreshed child credentials are not written back. The
source home, configuration and history are not copied. HOME, SQLite, temporary
state, and the empty execution root are private and disposable; PATH is
controlled. Exact CLI/user-agent identity,
ordinary account availability, and `observeCandidateConfigPolicyV01` must pass
before thread creation. The existing candidate overrides, including
`features.shell_snapshot_v2=false`, remain mandatory.
Ambient custom provider definitions and SQLite redirection also fail closed.

Only an ephemeral fresh thread with the exact root, read-only sandbox,
approval policy, and no instruction sources may receive one fixed non-tool
canary prompt. Resume and all server requests are refused. Unexpected effect
items/results fail closed through the existing adapter/transport owners.
Callers must await both result and settlement; cleanup failure is HOLD, even
if a terminal result arrived. Unsettled children retain disposable state for
separate cleanup rather than claiming successful removal. Neither preparation
nor a future successful canary qualifies or adopts a runtime. Actual
authenticated execution always requires separate authority.

## Explicit reviewed re-entry under #1234

`runCodexReviewedCandidateReentryV01` is a trusted local entry in the same
candidate owner. It requires an explicit issue-comment authorization, the exact
historical receipt and failed canary-result fingerprints, a consumed historical
claim, settled cleanup and the same candidate tuple. It does not discover a
different release or change `follow_stable`. It exclusively reserves a new
directory next to the historical receipt, then uses the existing acquisition,
extraction, provider-free gates, source comparison and cleanup. Verified local
archive bytes avoid another download; frozen official metadata is still
revalidated. Interrupted reservations cannot be retried or moved to renew them.

The new receipt retains its predecessor and authorization references. It binds
the fixed `gpt-6-astra` / `max` request to the canary's thread configuration and
turn parameters, with provider fallback disabled and contradictory exposed
model/effort values refused. Unexposed backend identity remains unknown. This
does not change historical/default canary settings, its fixed non-tool prompt,
result schema, read-only policy, exclusive claim or terminal/settlement owners.
The existing smaller execution ceiling is **60,000 ms**, with the existing
10,000 ms RPC and stop-settlement limits; the 180,000 ms authorization does not
increase it. Historical/default candidate canaries cannot combine `scoped_task`,
incident hooks, launch overrides or Strict-lane authority. The native profile
below admits the reviewed local incident hook through its genuine candidate
binding; it does not admit a scoped-task grant or a launch override.

`readCodexCandidateOrdinaryAuthAvailabilityV01` uses the same source resolver
and validator as provisioning. It returns only a closed availability/reason,
route and broker-profile fingerprint. Availability reads the selected source
but is not a grant. Preparation binds opaque source/physical/configuration
metadata; consumption revalidates it and the ordinary material before creating
a private snapshot. No credential-content hash is made.

### Superseded unmerged reader experiment

The original file-only observation remains historical. The earlier follow-up under
[PR #1239 review](https://github.com/hynk-studio/augnes/pull/1239#pullrequestreview-5154321040)
attempted the selected macOS Direct keyring source. Pinned source
`3d2ee51ca2d5db578f328aa75e20aa22c0197c9a` selects this backend when
`features.secret_auth_storage` is false (the macOS default). It uses service
`Codex Auth`, the canonical-home-derived store key, and the User-domain
keychain selected by pinned keyring 3.6.3. A short-lived source-owned native
reader uses the same Security.framework lookup with interaction disabled;
`/usr/bin/security` cannot enforce that no-prompt requirement. Compilation and
read each have a 10-second bound. The reader and all its output remain private
to the broker and are removed before it returns. This does not use Strict
Agent Identity, create/delete keychain entries or expose a public getter.

File selection never queries keyring; keyring selection never falls back to a
stale file. Secrets, auto fallback, ephemeral, selected profiles, custom auth
routes, managed configuration and nonempty workspace restrictions remain
explicit prelaunch refusals. The bounded route does not drop workspace rules
when private AuthManager refreshes. No real source configuration or storage
mode is changed. The old file profile/fingerprints are unchanged; Direct
keyring has a distinct profile. Locked/denied/unavailable reads return a closed
refusal without waiting for OS interaction. No different source is tried.

Only minimum validated ordinary TokenData/optional last_refresh is written to
the owner-only candidate snapshot. Normal child refresh remains private;
source no-writeback, integrity checks, rollback removal and the existing
single-use claim remained mandatory. Its real source prerequisite refused before
consumption. The later native-auth dispatch supersedes this unmerged reader;
its implementation has been removed from this PR. These paragraphs describe the
historical experiment, not a current product prerequisite or setup instruction.

The exact 0.153.4 archive/native passed the scoped credential-free sandbox,
configuration and command-environment checks. The native-profile authenticated
canary subsequently completed as recorded in the execution card. Registry and
managed adoption still require review; the default selection remains 0.152.1.
The old 0.153.4 HOLD and consumed claim remain historical. The retained
post-adoption diagnostic is a distinct, unexecuted allowance.

## Bounded outcomes

| Disposition | Meaning |
| --- | --- |
| `NO_NEWER_STABLE` | Official stable is not newer than a registered or locally recorded release; no archive or runtime gate runs. |
| `CANDIDATE_STAGED_GATE_PENDING` | Frozen archive/native bytes have been staged; evidence is incomplete. |
| `HOLD_PROVIDER_FREE_CONTRACT` | First gate and its one identical confirmation both failed. No source diagnosis follows. |
| `HOLD_NONDETERMINISTIC_GATE` | First gate failed and confirmation passed. The candidate remains HOLD. |
| `HOLD_CLEANUP` | Process/stream settlement or disposable cleanup was incomplete. Confirmation is suppressed after failed settlement. |
| `HOLD_INTERRUPTED_OR_INCOMPLETE` | Acquisition, identity, or invocation did not complete. No automatic retry. |
| `HOLD_EXPLICIT_SEMANTIC_REVIEW_REQUIRED` | Runtime gate passed, but exact upstream runtime source changed. |
| `HOLD_INCOMPATIBLE_OR_UNCLEAR_DELTA` | Runtime gate passed, but schema, removed source, unknown scope, incomplete source coverage, or unavailable comparison needs review. |
| `AUTHENTICATED_CANARY_REQUIRED` | Runtime gate passed and complete exact trees establish compatible irrelevant differences. Candidate evidence is ready for review; a separately authorized ordinary canary is required before qualification. |

The first successful provider-free attempt proceeds without repetition. A first
failure permits at most one unchanged confirmation with fresh isolated state.
There are no request-ID experiments, environment variations, child sampling,
release-specific workarounds, or forensic diagnosis.

Only after a first-attempt PASS does the owner compare complete exact upstream
Git-tree identities against the selected qualified runtime and bind the unchanged
compatibility-profile fingerprint. The comparison covers app-server dispatch,
consumed protocol/schema, account/auth, core thread/turn and effect semantics,
process/lifecycle utilities, and standalone native CLI/build dependencies.
Unrelated documentation and JS SDK/Node-launcher changes are irrelevant to the
standalone native route. Unknown scope still fails closed. This is bounded
change classification; it fetches no exhaustive upstream history or source bodies. A protocol-schema change is conservatively
unclear; merely calling it additive does not establish that it is unused,
bounded, or non-authoritative. This version automatically accepts only proven
irrelevant differences. Review can separately establish safe additive
compatibility; this pipeline does not weaken a profile or accept an external
review assertion as qualification authority. Relevant runtime differences go
to review; unclassified differences, removals and incomplete trees fail closed.
An authenticated ordinary canary remains separately authorized review work
once the provider-free/source gates permit it.

## Evidence and lifecycle

Local records live in `.augnes-local-verification/codex-rolling-candidates/`,
keyed by release tag/platform/architecture and bound to the frozen tuple.
A changed tuple for that same release cannot create another attempt budget. Exclusive creation happens before
acquisition. Atomic updates bind the exact Augnes base/head/tree, registry and
profile fingerprints, archive/native identity, bounded probe results, source
classification, and cleanup. A record prevents a new invocation from granting
the same candidate another attempt budget, including after interruption.
Repeated invocations return existing evidence with its original source binding;
they do not requalify it for a new head. Mismatched registry/evidence fails
closed. A record is local integrity evidence, not signed attestation or a
production adoption grant. Do not delete records to retry a failing release.

Artifacts use a private OS-temporary root and are removed after settlement.
They are not placed in production's immutable managed-store directories.
The existing transport owns bounded shutdown, stream closure and process-tree
settlement. Failed candidates therefore leave the last qualified managed
runtime available. The registry and selection owners remain unchanged.

The historical 0.153.2 registry candidate is not a rolling work queue. Its
terminal-HOLD normalization, if desired, is a separate reviewed change. Phase 5
does not retry it, alter its evidence, or modify historical PR #1206.

## Verification ownership

Synthetic tests cover one-time freeze, later latest drift, frozen identity
conflicts, supported acquisition,
archive safety, first-pass/two-failure/fail-pass outcomes, cleanup refusal,
replay budgets, conservative source classification, and production isolation.
The rolling test also invokes `scripts/test-codex-candidate-canary-binding.ts`
for synthetic candidate admission, pre-thread gates, refusal, replay, and
descendant cleanup. Its fixture substitution is test-only and cannot select an
arbitrary executable or access ordinary authentication state.
They acquire no upstream runtime and cannot produce live qualification.
The existing candidate responsibility owner includes the rolling files; the
new process-owning integration child uses the existing bounded Canonical
runner. The manual live candidate command is never called by Canonical.
Changes to Canonical registration itself still select full Canonical under the
[existing policy](../../.github/LOCAL_CANONICAL_VERIFICATION.md).


## Prospective native ordinary-context profile (#1239)

Explicit `native_auth` preparation selects a new `native_ordinary_context_canary.v0.1`
profile, not an exemption to the historical private-home profile. It uses official
Codex AuthManager with the normal adapter's bounded environment and the existing
coherent native home/SQLite context; no Augnes credential reader or snapshot runs.
The exact 0.153.4 artifact and reviewed re-entry are required. Account availability
is checked natively during the single counted startup, never as an authenticated
rehearsal. Missing native login, policy drift or settlement failure remains HOLD.

Shared restriction projection suppresses ambient sources before launch and validates
named permissions, source-bound instructions, auth-policy readback and the closed
command environment. The candidate task root is empty; no prior thread or history
is replayed. Native token refresh and compatible incidental state/cache writes are
host-owned effects. Cleanup does not roll them back or remove the ordinary home.
No cold-isolation or Strict qualification is claimed. See the
[execution-card connection](P51_SCOPED_NATIVE_HOST_EXECUTION_CARD.md#pr-1239-prospective-native-auth-canary-connection)
for capture and adoption boundaries. Historical claims, profile fingerprints and
receipts are not rewritten or reused.
