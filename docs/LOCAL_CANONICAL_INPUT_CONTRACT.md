# Local Canonical execution-input contract

This is the implemented design/source map for #1530. The Local Canonical policy owns
admission and acceptance. This document records the consumers and regression
obligations; it does not grant execution, provider, lifecycle or merge authority.

## Scope and consumer map

| Boundary | Existing owner and actual consumption | Evidence/control |
| --- | --- | --- |
| Parent/controller | `run-local-canonical-verification.mjs` enters `local-canonical-selected-execution.mjs` before isolated repository, planner and tool reads | Bind exact resolved tools, source/lock/executor identities, selected plan, generated inputs and the audited source-consumer inventory; refuse changed or unclassified selection |
| Source Git reads | `local-canonical-selected-git.mjs` supplies the source repository's private config, HEAD/refs and index with shared read-only objects | Recheck live origin, registration, source HEAD/index and safety; disable inherited config, hooks, replacements and external helpers; retain separate disposable-repository operations |
| Authenticated base read | `github-main-branch-transport.mjs` invokes the selected `gh api` GET using the explicit live transport environment | Preserve authenticated current-main gate; credentials remain live and are neither retained nor forwarded to phases; transport failure and unsafe live input changes refuse |
| Isolated phase | `local-canonical-isolated-resources.mjs` and `canonical-test-environment.mjs` select private HOME, temp, npm cache, database/runtime and filtered environment | Bind selected environment and physical isolation; positive/negative disposable controls prove actual consumption, not HOME assignment alone |
| Suite child/native fixture | `run-canonical-test-suite.mjs`, `canonical-child-runner.mjs`, `test-harness-process-lifecycle.mjs` | Retain bounded process ownership/settlement, two integration lanes, original assertions and deadlines; native/model tests use existing disposable fake adapters |
| Dependency preparation | Root/nested/Web `npm ci`, lockfiles and package lifecycle scripts | Select Node plus the npm CLI and its bounded package tree, empty user/global npm config, a fixed script shell and private caches; admit only source-owned npm argument sets; repository npm config and package scripts remain source inputs |
| Browser | Project-experience, continuity, project-client and Web-planning launchers; shared operator lifecycle including golden and four navigation controls; integration durable/cumulative surfaces | Reuse process owners; record selected executable at actual launch/settlement and agreeing HTTP/CDP runtime versions. Freeze exact consumer counts for every consuming phase, including integration; forward nested evidence and refuse missing records |
| Installed Companion | Supported preservation observer and existing context owner | Coherent before/after identity, no lifecycle in isolated context; observation/ownership failure remains blocking |
| Shared Codex preferences | No selected isolated controller/phase launches the developer Codex client or uses its model selection | Only narrowly recognized top-level model/effort/tier values may be excluded on this audited path; remainder and metadata safety checks remain conservative |
| Hooks and authority | Git reads do not dispatch checkout/commit hooks; canonical suites use private fake clients and runtime roots | No live client/model launch from this contract; source changes introducing a consumer require renewed classification and tests |

The machine-readable `local-canonical-selected-consumers.v1.json` binds the
reviewed owners and bounded repository source inventory, including dynamic and
extensionless consumers. Execution and stock readers check it without refreshing
it. Missing owners, stale inventory or an unclassified selected-tool command
refuse. Updating the manifest requires source review; a matching inventory hash
does not itself prove that every possible runtime read has been isolated.

The orchestration conversation's running model is outside the deterministic
qualification process. Its effective settings and historical configuration
writers are not established by this contract. A consuming path cannot claim the
isolated path's exclusion. Inherited PATH, explicit paths, transport, package
scripts and descendant launchers remain inputs even with a private HOME.

## Selected execution and remaining live boundaries

The isolated entry is a direct invocation of the policy's exact Node executable
and `scripts/run-local-canonical-verification.mjs`. Starting through an ambient
npm lifecycle is refused: npm has already consumed configuration before Node
loads the selector. A preloaded Node hook also runs before repository code can
inspect it. The selector refuses detected `NODE_OPTIONS` and loader/preload
arguments, but cannot undo their earlier execution. The initiating shell, Node
bootstrap, operating-system loader/libraries and fixed system helpers remain
explicit platform trust boundaries; this is not a general sandbox.

After bootstrap, the controller selects physical executable paths, creates
read-only generated dispatchers and forwards a hash-bound manifest through the
existing canonical and supervised-runtime environment owners. Nested children
reconstruct only selected keys from that manifest. npm dispatch uses the selected
Node and CLI, a closed argument set and the selected package shell. The selected
package-shell owner rebuilds npm's executable search at the actual lifecycle
boundary: selected dispatchers, source-contained package `.bin` directories,
the selected npm node-gyp helper and fixed system directories. It excludes
ancestor package bins outside the source checkout and removes shell/Node loader
overrides. The package shell uses the existing asynchronous child owner.
Selected Node headers and fixed native-helper executables are declared inputs;
their SDKs and operating-system libraries remain platform dependencies. The selected
Python launcher uses `-E -s -S` to exclude environment, user-site and site startup
configuration. Its source-owned dispatcher preserves that selection when
node-gyp or a Python child discovers and reuses `sys.executable`; audited Python
command shapes and script roots are bounded and unsupported arguments refuse.
The nested `npm run typegen` used by typecheck is explicitly selected. Browser
minimal environments also forward the validated selection and child ledger.
These selectors do not replace package source review, dependency
lockfiles, native libraries or the source-owned test adapters.

The source Git view does not copy account Git configuration. It authors a small
config and freezes source HEAD/refs/index while reading objects from the admitted
repository. Includes and unsupported repository/object layouts refuse. Source
reads cannot enable external diffs, text conversion, replacement objects, hooks
or caller-selected Git directories. Fixture Git operations remain confined to
the existing disposable roots instead of receiving a global source `GIT_DIR`.
The real origin, physical registration, source identity and config safety remain
live checks. This permits a non-consumed ordinary Git preference to vary only
when the selected read view and all live authority checks still agree.

Selected source reads and disposable Git operations use the current consumers'
command-specific option forms. Unknown options, abbreviations and external
file-bearing operands refuse before native dispatch, including attached and
separate grep pattern-file, diff order-file and ls-files exclude-file forms.
Authored pattern/message text and paths after `--` retain their distinct meanings;
this bounded selector is not a general Git argument parser.

Authenticated GitHub transport remains live: the selected `gh` receives only its
explicit transport environment, including required credentials and proxy inputs.
Host credentials are not copied into generated configs or retained evidence.
Host-file metadata, transport config and a selected certificate file are observed;
an unclassified certificate directory refuses. Current-main authentication,
installed Companion preservation, managed policy, instruction/auth safety and
checkout/capacity ownership remain independent blocking boundaries. A frozen
execution config cannot authorize a changed origin or hide revoked authority.

The native scope owner shares its configuration-path enumerator with the
selector. It includes both original source and snapshot ancestry, system Codex
configuration, managed policy and instruction sources. On the selected path,
every external source must be declared before the native reader hashes or parses
it. The ordinary controls' private temporary roots are identity-bound mutable
fixtures; their external ancestors and system sources remain live safety inputs.
A new path outside this set refuses. Nested selection retains the parent's
external inventory and cannot convert those files into mutable fixtures.

External native inputs bind absence or presence, regular-file content and
metadata, and the identity of existing ancestors, including fixed platform
aliases. Unsafe configuration aliases and ambiguous observations refuse.
Directory content timestamps are not authority identity. The outer monitor and
fresh current-state reader use the same observation role after a scoped launch's
own assertion and after fixture cleanup. Retained manifests contain only source
identities and hash/safety observations for these live files, never their TOML
contents or credentials. Historical integrity remains distinct from current
applicability; the native per-launch assertion is retained.

The optional `readOnlyTree` execution role inventories the npm installation's
complete physical package directory, including internal symlink target identities.
It admits at most 10,000 entries, 100 MiB of regular-file bytes and depth 64.
External symlinks, aliases, hard-linked regular files, unsupported file types,
cross-device paths, missing files and observation races refuse. Content and
mode/owner/group identities are bound; only hashes and counts enter observations.
Every observation rehashes the tree, including forced closeout. This role creates
no ambient exclusion and does not alter unflagged input-contract v2 resources.

## Retained selected inputs and child settlement

The observer performs its final forced read before private execution inputs are
removed. The checkout-owned retention owner exclusively creates read-only copies
of the allowed generated inputs, their original execution-byte hashes and their
logical source recipes under the run's log directory. It binds exact source,
executor, plan and consumer-map identities. These are local non-secret execution
artifacts; generated paths may occur in their original bytes. Receipts and review
exports carry safe descriptors and hashes, not raw config or private paths.

A fresh stock process reads the retained files and complete inventory, verifies
physical ownership/mode and hashes, and independently derives the current logical
selection. Runtime-path differences do not erase the original execution-byte
binding. Missing, replaced, aliased or tampered retained files refuse; recreating
an equivalent missing file is not evidence. Current source, live authority,
toolchain, context and authenticated main must still satisfy their own gates.
Historical integrity and current applicability remain separate outcomes.

The existing child owner writes attributable start and settled-or-UNKNOWN events
to a task-owned append-only file independent of bounded stdout logs. The file is
limited to 64 MiB and 131,072 child registrations to account for repeated bounded
source/tool observations; overflow refuses instead of truncating. It is retained before cleanup and
checked by the same cold reader. A missing terminal, malformed/conflicting event,
ambiguous process observation or incomplete cleanup cannot pass. Post-spawn
callback failure still enters the existing bounded settlement path. Deliberate
negative fixtures preserve their own UNKNOWN evidence while the actual harness
child must settle in the enclosing inventory.

Settlement is checked from the original selected ledger on every controller
exit, including failed acquisition and preservation before input freeze. An
attempted cleanup is not settlement. UNKNOWN, missing or unreadable terminal
evidence and lost ownership latch preservation of private evidence and owner
state. Post-execution observations and historical-input cleanup are included
before final lifecycle retention and private disposal; a later successful
observation never rewrites an original UNKNOWN event.

The inventory covers existing `registerOwnedChild` consumers, the outer phase
callback and selected synchronous Git/tool-version/transport, permission-reader
and supported ownership/Companion-observation dispatch. Audited suite and
historical-fixture synchronous launch sites explicitly use adapters in that
same lifecycle owner; native Node exports are not monkey-patched. Synchronous
calls register before dispatch, retain their supplied finite timeout (30 seconds
when absent), use a detached POSIX group and record the original result. A timeout
kills the direct child. After the direct wait, a signal-zero probe of that detached
group may prove absence through `ESRCH`, avoiding a process snapshot. A successful
probe still requires the existing bounded `/bin/ps` snapshot; `EPERM`, other probe
errors and ambiguous snapshots are UNKNOWN. A remaining group records UNKNOWN
and refuses without signaling unverified processes. A failed spawn without a
confirmed PID is also UNKNOWN, not a claim that a child ran. The fixed bounded
`/bin/ps` observation primitive, including checkout birth/ownership inspection,
is executable-bound and is not recursively registered. The asynchronous
ownership and cleanup path is unchanged.

The ledger cannot establish an unregistered arbitrary spawn, a process escaping
the observed group, or erase the asynchronous spawn-to-registration interval.
Source audit must review those boundaries. No child deadline, phase workload,
integration concurrency or assertion is relaxed.

Selected PATH includes an exact `tar` dispatcher for historical source extraction.
Fixed `chmod`, `ls`, `stat`, and (on macOS) `xattr` permission helpers are observed
execution inputs alongside the existing native build helpers. Source-bound test
adapters retain their existing arguments, output/throw semantics and supplied
deadlines; an absent synchronous deadline receives the owner's 30-second bound.

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
- `local-canonical-evidence-retention.mjs` protects active and explicitly pinned
  evidence. Unsafe aliases and ambiguous ownership refuse cleanup.
- `test-local-canonical-classification.mjs` and `test-local-canonical-review-corrections.mjs` exercise real classification,
  sequencing, child lifecycle and receipt validation. Keep accepted Full phase
  inventory and every existing child bound, including 30 seconds for the
  settled-expired-successor child. Register new controls in authority coverage.

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

The #1530 implementation slice supplies source review and disposable development
controls only. Production admission/reservation, deciding execution and production
stock validation are NOT_RUN here. The held #1536 observer family remains
exhausted; no legacy interpretation, wrapper restart or new input selection grants
another attempt. A later lawful qualification requires separate authority and a
coordinated bounded window against current accepted main. Neither this contract
nor a successful control reserves that window or grants merge authority.

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
not acquire a successor through this bounded path. Every family retains one
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

Permission readers use the same synchronous lifecycle ledger. A bounded in-memory
cache reuses their fingerprint only for the identical physical path, device/inode,
mode, owner/group, link count, size and exact mtime/ctime. Any metadata difference
causes real probes; forced closeout probes before and after the content read even
when metadata matches. This shares the existing cooperative polling limit and
cannot exclude a hostile metadata-restoration attack. It grants no permission
exemption and adds no process outside the ledger except the fixed `/bin/ps`
settlement observation primitive.
