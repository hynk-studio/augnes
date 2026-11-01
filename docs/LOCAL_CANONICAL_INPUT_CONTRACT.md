# Local Canonical execution-input contract

This is the implemented design/source map for #1530. The Local Canonical policy owns
admission and acceptance. This document records the consumers and regression
obligations; it does not grant execution, provider, lifecycle or merge authority.

## Scope and consumer map

| Boundary | Existing owner and actual consumption | Evidence/control |
| --- | --- | --- |
| Parent/controller | `run-local-canonical-verification.mjs`, `local-canonical-environment.mjs`, Git identity/planner reads, Node/npm selected through PATH | Exact tree, source/lock/executor identities, selected plan, Node/npm and environment bindings; changes invalidate inputs |
| Authenticated base read | `github-main-branch-transport.mjs` invokes `gh api` GET using parent transport credentials | Preserve authenticated read and current-main gate; transport failure is admission refusal, credentials are neither exported nor forwarded to phases |
| Isolated phase | `local-canonical-isolated-resources.mjs` and `canonical-test-environment.mjs` select private HOME, temp, npm cache, database/runtime and filtered environment | Bind selected environment and physical isolation; positive/negative disposable controls prove actual consumption, not HOME assignment alone |
| Suite child/native fixture | `run-canonical-test-suite.mjs`, `canonical-child-runner.mjs`, `test-harness-process-lifecycle.mjs` | Retain bounded process ownership/settlement, two integration lanes, original assertions and deadlines; native/model tests use existing disposable fake adapters |
| Dependency preparation | Root/nested/Web `npm ci`, lockfiles and package lifecycle scripts | Existing clean-install authority retained; private npm configuration/cache; package and lock changes are source inputs, installed trees are not reusable proof |
| Browser | Project-experience, continuity, project-client and Web-planning launchers; shared operator lifecycle including golden and four navigation controls; integration durable/cumulative surfaces | Reuse process owners; record selected executable at actual launch/settlement and agreeing HTTP/CDP runtime versions. Freeze exact consumer counts for every consuming phase, including integration; forward nested evidence and refuse missing records |
| Installed Companion | Supported preservation observer and existing context owner | Coherent before/after identity, no lifecycle in isolated context; observation/ownership failure remains blocking |
| Shared Codex configuration | No selected isolated controller/phase launches the developer Codex client or consumes its shared configuration; native fixture consumers select private configuration and temporary source roots | v3 treats content and replacement metadata as observations only for this fixed resource/path; presence, resolution, single link, mode, ownership, device, ACL/flags/attributes remain bound. v2 retains preference-only exclusion and its original raw binding |
| Shared Git configuration | Controller identity/planner and historical readers use current branches, explicit refs and origin; installed-hook checks also read all remotes. Branch switching/configuration enumeration in tests uses disposable repositories | The versioned `gitTracking` role below protects both actual checkout branches, all remotes and every remaining byte. It is unavailable on broad/unknown consumers and does not modify Git settings |
| Hooks and authority | Git reads do not dispatch checkout/commit hooks; canonical suites use private fake clients and runtime roots | No live client/model launch from this contract; source changes introducing a consumer require renewed classification and tests |

The orchestration conversation's running model is outside the deterministic
qualification process. Its effective settings and historical configuration
writers are not established by this contract. A consuming path cannot claim the
isolated path's exclusion. Inherited PATH, explicit paths, transport, package
scripts and descendant launchers remain inputs even with a private HOME.

### Effective input equivalence (v3)

The parent uses Git, Node/npm, the planner, the authenticated `gh` transport and
the supported Companion preservation inspector. Its only shared Codex-config
read is the input observer. Git reads do not launch Codex or dispatch commit/
checkout hooks. `phaseEnvironment` takes the owned isolated-resource capability;
`prepareInvocationInputs` refuses a context/resource mismatch. The outer owner
uses `buildCanonicalChildEnvironment`, and `run-canonical-test-suite` applies
that same filter again for every child. Neither layer forwards `CODEX_HOME`,
provider credentials, `NODE_OPTIONS`, or live-provider opt-ins. Explicit tool
paths and the existing private npm cache/configuration behavior remain unchanged.

The native consumers need more than HOME reasoning: `codex-credential-broker`
selects CODEX_HOME or homedir, while `codex-scoped-task` also inspects source-root
ancestors and managed policy. Their selected model-free tests use synthetic
Codex homes and temporary stage/source roots (`test-codex-candidate-canary-binding`,
`test-codex-app-server-sandbox-projection`, `test-codex-scoped-code-mode`). They
retain fake-adapter or fixed-loopback native fixtures and existing managed-policy
refusals. Browser owners retain their canonical no-provider fixture route.
No exemption is granted to managed policy, a new explicit shared path, a live
client, or a different/unknown consumer. The host agent's own permission policy
is outside these disposable controls and is never edited by them.

`effectiveInputObservation` is the single projection used by comparison and
`commonInputResources`; stock reconstructs the same versioned rule. Only the fixed
v3 isolated `codex-preferences` resource receives non-consumption treatment.
Full raw observations still enter declaration fingerprints and events. Missing
security metadata refuses, even with equal content. The existing shared
read-only executable projection removes only link-count/ctime observations.
Other resources retain their complete effective inputs except the explicitly
versioned Git role below. Old v2 common hashes
and remainder refusals remain byte-for-byte interpretable under their old rule.

The routine classification controls compare unchanged, preference, replacement
metadata and non-preference remainder observations across preparation, monitoring
and a fresh reconstruction process. Actual phase/suite environment construction
and a launched descendant select private inputs; an explicit consuming control
observes the same shared sentinel and refuses change. Unknown paths, permission/
ownership/attribute changes, missing observations and unsafe aliases refuse.
The existing replacement controls exercise actual admission with the new common
hash and prove a relevant mismatch creates neither attempt nor successor. These
are disposable source controls, not production Full, Browser or model evidence.

### Selected Node and matching compiler headers

The reviewed source/input-revision route binds the actual running Node executable
and its physical sibling `include/node` directory through
`observeCanonicalRuntimeInputs`. `node_version.h` must identify the running
Node version, and `node_api.h` must be present. The `nodeHeaders` resource role
reuses the complete bounded tree reader for content, topology, modes, ownership,
ACLs, flags and attributes. The receipt stores aggregate identities; it does not
copy all header source. Missing, unsafe, changed or failed observations refuse.
Existing declarations without this marker keep their original interpretation.

The executor sets `AUGNES_CANONICAL_NODE_HEADERS` and its observed fingerprint.
The canonical child-environment owner rechecks the physical Node/header pair and
version before deriving `npm_config_nodedir`; arbitrary ambient npm settings and
credentials remain excluded. These values reach normal dependency preparation
and filtered descendants. Node remains the actual selected executable, rather
than a version label used to excuse a different path or content.

Header trees are fully checked at admission, phase boundaries, final settlement
and fresh stock. They are not recursively scanned by the one-second monitor
while a timed child is running. A boundary fault latches through the same input
owner and cannot yield a deciding PASS. This is bounded observation, not a claim
that every transient write can be detected.

The three ordinary clean `npm ci` phases still produce their installed dependency
trees from the pinned package/lock sources. Those outputs are not immutable
pre-install runtime input: preparation can legitimately replace them. Existing
mutable-resource alias checks, dependency consumers and exact lock/preparation
provenance remain required. The new route captures each tree only after its own
successful preparation through `observePreparedDependencyInputs`, then checks
the retained identity through the executor and fresh stock. The small aggregate
binds actual file content, mode/owner, contained links, package/lock sources,
ACLs, flags and attributes. Complete per-read filesystem identity detects races;
cross-observation identity excludes install-produced inode/timestamp values.

Only a physical, empty top-level `node_modules/.cache` with the dependency root's
exact mode/owner/device, ACL, flags and attributes can be equivalent to absence.
The parent remains fully bound. This accommodates protected inherited platform
attributes without exempting any attribute name or differing security state.
Its observed presence remains diagnostic. A nonempty directory remains fully
binding; unsafe links, changed permissions, unknown or failed observations
refuse. There is no general cache ignore list or dependency-content exemption.

The existing classification owner tests a real same-byte Node child/grandchild
environment, fresh header reconstruction, mutations, wrong versions/roles,
legacy refusal, unsafe links and permissions. Dependency controls reconstruct
fresh outputs, prove empty-cache disappearance equivalence and retain nonempty
cache/content/source/permission changes. These controls do not substitute
for actual new preparation or qualification phase coverage.

### Git tracking projection for the isolated inventory

The optional resource marker `gitTracking.policy = isolated-current-branches-v1`
is the interpretation discriminator. Earlier v2/v3 declarations without it keep
their whole-file comparison and original invalidation. It is selected only by
the fixed isolated invocation composition, not by an environment ignore list.
The marker binds hashes of the candidate and installed anchor's actual symbolic
branches. Their ordered physical roots and branches are reobserved before and
after every configuration read; the anchor branch is not assumed to be covered
by the candidate source guard. Private root paths stay in the reader closure.

Only a complete, unique, unescaped foreign branch section with exactly one plain
`remote` and one `merge = refs/heads/...` entry can be omitted from the effective
hash. The current/anchor branches, every remote section, credential/transport,
hook/filter settings and all other bytes remain binding. Unsupported syntax,
duplicate branch sections, continuations, malformed UTF-8 and mixed relevant
changes do not acquire an exclusion. No file is edited or reconstructed by this
reader. Full raw hashes and metadata remain in the immutable observations.

The reader checks Git's actual effective key scopes/origins. Any include or
includeIf, unknown repository extension, Git configuration or repository
environment override, unknown origin or failed observation disables the
projection. An already enabled `extensions.worktreeConfig` is supported only
with complete per-root `config.worktree` observations, including absence and
every byte; it is never enabled or changed here. Both roots' effective origins
are inspected in that case. System/global files and Apple Git's file-backed
`unknown` default scope are likewise fully bound into the scope fingerprint;
no values from those files receive an exclusion. Their values and paths are not
exported. Presence, exact path resolution, single
link, mode, owner/group, device, ACL, flags and attributes remain protected.
Configurations with includes retain the existing conservative whole-file path;
this change does not claim a new recursive include-target inventory for it.

Finite source inspection found no foreign-upstream consumer on the selected
real-root path: Git identity/currentness uses exact refs/current branches,
historical dependency and distributable readers use exact tree/show/archive,
and hook verification uses root/origin/remote reads. Broader configuration and
branch operations are in owned disposable fixtures. Next's potential telemetry
Git consumer reads `remote.origin.url` and the build disables telemetry. This is
source/behavior evidence, not exhaustive syscall tracing of Git, gh or native
fallbacks; a newly introduced broad or foreign-tracking consumer requires renewed
classification and must retain whole-file protection.

The existing classification suite exercises real linked worktrees and a bounded
Git child across an actual tracking append, preparation/common-input binding,
monitoring and fresh-process reconstruction. Broad configuration/branch readers
demonstrate the changed output and remain on the conservative path. Relevant
origin/current/anchor branch changes, authority settings, includes, unsupported
syntax, unsafe aliases, permission changes and branch drift remain refusals.
The same retained fixture fails on the prior input owner and passes on its
correction; these controls do not replace complete deciding qualification.

## Implementation mapping

- The executor uses a frozen, versioned input classification, a latched
  observer and its existing AbortSignal/owned-child cleanup path. Preserve raw
  cancellation/timeout/failure and never admit another phase after a fault.
- The receipt owner supplies separate execution, validity, safety and current
  applicability decisions, strict final conjunction, Browser provenance and a
  sanitized derived review export. Preserve legacy receipt interpretation.
- `local-canonical-attempts.mjs` owns an append-only attempt family: one initial invocation and
  one explicit recovery only with substantiated infrastructure cause and verified
  remedy. Family identity survives wrapper restart and cosmetic commits.
  A genuinely revised candidate uses one immutable predecessor/successor binding,
  retained exact-delta source review and original receipt. Meaningful revision after
  PASS uses identical fail/pass regression evidence. A verifier correction after a
  safety stop additionally binds the original fault and an allowlisted verifier
  owner. A necessary accepted-main integration binds the freshly admitted main,
  exact two parents and independently recomputed tree-entry union. None recasts old
  outcomes as infrastructure, resets an unchanged target or grants permission.
  Its v7 `reviewed_revision` discriminator also binds a new prospective commission
  to the latest settled failed/terminal tip, accepted source evidence and actual
  source/runtime-input differences. The same exclusive edge carries the root
  commission and ordinal; at most two complete invocations are possible, and the
  second requires a materially corrected demonstrated problem plus focused
  evidence and prior fresh stock. Interrupted reservations consume their slot.
  Original records remain unchanged; retired-route interpretation uses its Git-pinned reader. No new incident
  controller, approval ledger, unchanged retry or recovery allowance is added.
- `local-canonical-evidence-retention.mjs` protects active and explicitly pinned
  evidence. Unsafe aliases and ambiguous ownership refuse cleanup.
- Completed observer-repair, corrected-timeout, condition-requalification, Guide
  correction, operating-profile and successor-budget qualification routes have no
  current admission, stock or export dispatch. Their markers and mixed lineages
  refuse explicitly; the unchanged originals use the Git-pinned historical
  reader described in the Local Canonical policy. Live `reviewed_revision`
  admission and settlement controls run through their own direct suite entry.
- `test-local-canonical-classification.mjs` and `test-local-canonical-review-corrections.mjs` exercise real classification,
  sequencing, child lifecycle and receipt validation. Keep accepted Full phase
  inventory and child bounds, with only the separately authorized outer
  settled-expired-successor aggregate budget changed from 30 to 45 seconds.
  Register new controls in existing authority coverage; preserve timeout latching.

## Required contrasts and limits

Controls cover excluded preferences versus the same values on a consuming path;
mixed unknown/permission/trust changes; relevant input/browser mutation; missing
evidence/coverage; observer failure and first-fault latching; exit-zero after
cancellation/timeout; owner replacement; one repaired infrastructure recovery
versus product/unknown/evasion refusal; stale main versus historical integrity;
export privacy/tamper; pinned versus disposable retention. No synthetic change
is made to protected live configuration.

Polling observes intervals, not every possible transient write. Integer file
timestamps retain their precision but are not exact observed write times.
Cooperative same-user ownership is not a hostile-user sandbox. An excluded
change has unknown authorship unless separately established; exclusion gives the
task no authority to write it. Missing or ambiguous comparison fails closed.

The accepted-base phase inventory is retained separately before implementation.
The redesign's own Full uses the accepted workload, adversarial controls and
separate stock validation; a green self-test is not independent attestation.
Historical #1430/#1524/#1529 failures and exceptions are not promoted or retried.

## Shared executable role and actual consumers

Input contract v2 retains link count and ctime as observations for a declared
read-only shared executable. Its consumed identity still binds content SHA-256,
size, mtime, device/inode and resolved location; its safety identity binds mode,
owner/group, ACL/file-flag fingerprint and executable regular-file resolution. Only an otherwise identical,
complete observation may classify changed link count/ctime as
`incidental_executable_metadata`. It records the event without cancelling.
Missing hashes, replacement, byte changes (including writes through an alias),
unsafe paths and changed permissions/ownership refuse. Metadata changes trigger
a fresh hash and closeout always rehashes. Mutable resources, configuration,
evidence and cleanup retain their single-link protections. No task writes the
installed Browser. This prospective rule does not explain the historical
585-to-586 observation or identify its writer.

Browser-use v2 binds each launch's consumer, selected file and actual runtime
version from both the owned HTTP endpoint and CDP. The frozen Mac workload has
five integration launches (three durable, two cumulative), four project-experience
launches (one main, two project-client, one Web), five review-control launches
(including the four deliberate navigation-failure controls), and one in each
remaining named Browser phase. Counts are checked by executor and stock reader;
wrong executable, differing version, missing/extra records, content mutation or
unsettled cleanup cannot pass. NOT_RUN records never claim Browser use. The
separate development-only web-planning-continuation harness is not in this
selected Full inventory and supplies no qualification evidence here.

Candidate succession v2 remains local cooperative evidence, not a general
approval or scheduling system. A source review binds its authority reference,
exact predecessor/current trees, complete delta and changed-path inventory.
The same deterministic regression must fail before and pass after a source
revision; empty/comment-only changes cannot satisfy behavior-based controls.
A pure accepted-main merge is checked against the stock authenticated base and
the read-only recomputed non-overlapping tree-entry union; overlapping or resolved source requires a substantive
source-correction proof instead. Unsettled, unknown or timeout predecessors do
not acquire a successor through this bounded path. Every ordinary v1/v2 family retains one
initial invocation and at most one proved infrastructure recovery. Changed proof,
older attempt selection, wrapper restart, superseded candidate recovery and a
second successor refuse. Legacy v1 records keep their original interpretation.
Source review and fixtures remain inspectable; a local claim is not independent
attestation or permission to run outside the commissioned scope.

The Mac executable permission projection uses fixed read-only `/bin/ls -lde`,
`/usr/bin/stat -f %f` and `/usr/bin/xattr -lx` readers. These OS tools are also
declared read-only shared executable inputs, with the same complete identity
and safety checks. ACL entries, file flags and extended attributes are hashed
in memory, never copied to evidence. Linux disposable controls admit mode-only
files and conservatively refuse an ACL/security-context marker they cannot
resolve. Other admitted hosts retain complete metadata equality and receive no
new incidental-metadata exemption. Polling remains bounded and cannot prove
absence of transient changes between observations; every observed native
permission/flag/attribute difference remains a hard fault.

### Read-window coherence and bounded failure diagnostics

The shared-executable reader applies the same fixed role to observations inside
one read window. Every initial, descriptor and named-file sample must agree on
type, device/inode, mode, owner/group, size and mtime. Native permission identities
must agree before and after each complete read. A link-count/ctime difference
inside that window requires exactly one additional complete read of the same
identity: both byte sequences, their lengths and every consumed/safety sample
must agree. No failed read is retried, no later sample replaces an earlier one,
and a second-window failure refuses. Configuration and mutable resources retain
complete metadata equality and single-link checks. This is not a blanket ctime
exclusion or proof that the historical #1548 exception was a metadata race.

Caught input-monitor failures now carry the optional
`augnes.input-observation-failure.v1` diagnostic: only `contract`, a fixed `stage`
and an allowlisted `code`. Filesystem stages distinguish initial/named/descriptor
stat, resolution, open, read, consistency and close; permission readers distinguish
ACL, flags and attributes. An unknown external code becomes `unclassified_error`;
a helper's nonzero status becomes `helper_exit_nonzero`. No exception message,
stack, path, command output, credential or environment value enters this record.
The first failure remains latched; event identities bind diagnostic differences.
Receipt validation checks the exact diagnostic shape and event/fault linkage.
The private export retains these bounded fields and rejects malformed diagnostics.
An explained observer failure still blocks acceptance and remains
`unknown_relevance`; diagnostics do not confer recovery or succession eligibility.

Diagnostic-free events and original receipts retain their existing identity and
interpretation. Missing historical error information is never filled in. The
existing classification and review-corrections owners cover deterministic
within-read alias changes, content/replacement/permission/ownership adversity,
filesystem/helper failures, cancellation, first-fault latching, strict diagnostic
validation, private export and legacy compatibility. The fixture can import the
retained earlier input module for identical before/after controls. These focused
checks do not execute a deciding Full or authorize a new attempt.

## Strict task-owned Browser input safeguards

`local-canonical-browser-input.mjs`, `local-canonical-browser-bundle.mjs` and
`local-canonical-browser-identity.mjs` retain the shared selection, observation
and actual-launch guards. These helpers grant no new Local Canonical execution.
The task-bound #1545/#1546 replacement route, its strict v2 continuation, receipt
version 5 and export version 2 are retired. The complete historical reader and
policy remain at `b057069e2ebbafe36acaa84736e9742b19c32547`; current qualification
readers fail closed on their records rather than renewing or resetting lineage.

| Consumer | Retained strict behavior |
| --- | --- |
| Isolated phase and nested suite | Bounded environment carries exact binding/path/fingerprint; the checkout-owned active sentinel catches stripping |
| Project, continuity, operator lifecycle, project-client, Web-planning, durable/cumulative | Shared selector and actual-launch assertion bind the whole bundle and CLI/HTTP/CDP identity; all 19 launch records remain |
| Bundle observer and guard | Physical root and entry identities, permissions, ACLs/flags/attributes, relative internal links, bounded race-safe reads and forced final observation remain checked |
| Wrapped launch owners | Seven Darwin launches retain the exact outer network policy plus `--no-sandbox`; twelve direct launches retain their existing sandbox behavior |
| Ordinary receipt and reviewed revision | Existing v3/v4 receipt interpretation, ordinary source correction and live v7 authority remain; receipt v5 refuses before Browser-path or machine-identity access |

`test-local-canonical-browser-input.mjs` retains bounded controls for missing or
stripped selection, link/content/permission/root races and nested environment
composition. The bundle reference inventory includes the app root itself;
counts differ by one from historical descendant-only inventories. Limits remain
4,096 entries, 1 GiB, 8 MiB security output and 15 seconds per observation.
Monitoring is bounded cooperative observation, not whole-host attestation or
proof that no transient mutation occurred between polls. Local hashes do not
establish publisher trust; launch success cannot override a negative signature
or Gatekeeper assessment. No unsigned-artifact exemption is introduced.

The durable/cumulative caller retains its historical nullish default: only an
absent explicit Browser path selects the shared default outside the strict lane.
An empty or missing explicit path refuses. Other legacy candidate-list owners
retain their existing fallback behavior. Focused controls execute the actual
durable selection/refusal and cumulative nested-environment composition against
disposable inputs; the strict binding and stripping refusals remain unchanged.

The existing `test-browser-verification-owners.mjs` unit child performs bounded
Node syntax-only checks on complete Browser entry points and shared selection
owners before product Browser phases. A complete malformed-file negative
control must propagate the syntax child failure. Syntax checks do not launch
product workloads or establish Browser lifecycle, artifact trust or qualification.

The two wrapped launch constructions pass their complete spawn tuple through
`strictNetworkSandboxLaunch`; caller labels alone do not retain the argument.
Controls parse both complete TS entry files, execute pre-Browser entry refusals,
and exercise the actual construction with positive and altered/missing-wrapper,
profile, owner, platform and selection controls. No failure retries unwrapped.
This preserves the trusted-local baseline, without additional Chromium
filesystem/IPC isolation; the Local Canonical policy owns that tradeoff.

## Completed task-specific source-correction routes

Observer repair v3, corrected timeout v4, condition requalification v5 and Guide
correction v6 have completed their bounded work. Current admission, receipt,
stock, export and lineage owners reject their schemas, kinds and authority or
consumption markers, including downgraded, false and null variants. They do not
silently treat a mixed historical chain as ordinary or live v7 evidence.

The [retirement policy](../.github/LOCAL_CANONICAL_VERIFICATION.md#retired-qualification-routes)
pins their original reader and full policy at
`b057069e2ebbafe36acaa84736e9742b19c32547`. Original receipts, failures, proofs,
reviews and consumed edges remain unchanged. Historical review grants no fresh
execution authority. Current observer classification, fixed pragma regression,
Project Home readiness and Guide lifecycle/verdict coverage remain with their
product test owners; reusable `reviewed_revision` controls retain their direct
suite registration.
