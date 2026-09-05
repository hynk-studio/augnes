# Codex rolling stable candidates v0.1

Phase 5 of CDX4 is a manual, bounded candidate pipeline. Its owner is
`lib/vnext/native-host/codex-rolling-stable-candidate.ts`; its entry point is
`scripts/run-codex-rolling-stable-candidate.ts`. It is separate from the
checked-in qualified-runtime registry and production selection.

## Run boundary

Use the canonical clean checkout on a task branch, with local `main` equal to
the authorized exact base, on macOS arm64 with repository-pinned Node 24.18.0:

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

The later invocation uses only official ordinary AuthManager access through
the ordinary credential-owner directory. Augnes does not read or project
credentials. HOME, SQLite, temporary state, and the empty execution root are
private and disposable; PATH is controlled. Exact CLI/user-agent identity,
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
