# Local Canonical verification policy

## Purpose and authority

Augnes keeps its complete Canonical test capability in the repository. GitHub
remains source control, pull-request, review, and history infrastructure only.
GitHub Actions execution is intentionally absent. No pull request, push,
schedule, dispatch, reusable workflow, status fabrication, or other repository
event may start or impersonate verification compute.

For executable, data, enforced authority, packaging, or other runtime
behavior-affecting changes, the deciding surface is one completed local run for
the exact proposed head on the authorized shared Mac. Pure documentation-only
changes are exempt from Local Canonical deciding execution and receipt
requirements after source/consumer review establishes their explanatory
responsibility. Markdown extensions alone do not establish that responsibility.
They still require
ordinary source review and any lightweight static documentation checks warranted
by the edited content. This policy records the Canonical environment and its
limitations. It does not claim that local evidence is stronger than independent
reproduction. Local Canonical does not publish evidence or write GitHub state;
any separately authorized repository action remains outside verification.

The receipt preserves the established evidence vocabulary:

- exact repository identity
- exact base SHA
- authenticated current integration-base observation and base-to-head ancestry
- exact head SHA
- dirty-worktree status
- operating system and architecture
- Node and npm versions
- root, Apps and web-planning lockfile fingerprints
- selected plan
- selected responsibility owners and bounded phase inventory, when targeted
- each selected command and result
- finite duration
- cleanup and remaining-process result
- final pass or failure

This is a shared local host and does not provide independent hosted reproduction.
GitHub remains source control, pull-request, review, and history infrastructure only.

Explicitly user-authorized isolated Codex Cloud checkouts may inspect source,
implement changes, run focused development tests and static documentation
checks, and create branches, commits, pushes, and Draft pull requests within
task scope. These are development feedback, not actual Mac integration evidence
or a Mac Local Canonical receipt. The actual Mac installed runtime and Local
Canonical host remain rooted at `/Users/hynk/code/augnes`. The default executor
still requires that fixed checkout. Explicitly admitted linked worktrees on the
same authorized Mac may use the verification-only entry below. This does not
change installed-production identity or grant installation/adoption authority.

## Repository-owned entry points

Use the stable executor commands for behavior-affecting changes. The
documentation validator remains available as optional feedback for ordinary
prose. Authority/contracts and dispositions use the relevant static checks
below; none require a Local Canonical receipt:

```bash
npm run verify:local:quick
npm run verify:local:changed -- \
  --base <exact-40-character-base-sha> \
  --head <exact-40-character-head-sha>
npm run verify:local:full -- \
  --base <exact-40-character-base-sha> \
  --head <exact-40-character-head-sha>
```

The executor first requires the authorized verification context and exact authorized
`origin`. The default context retains the exact fixed local root. It verifies that base and head are lowercase 40-character commit
identities available locally. `changed` and `full` additionally require:

- the requested base equals the current `main` observed through the existing
  read-only authenticated GitHub main-branch transport for `hynk-studio/augnes`;
- that base is an ancestor of the exact requested head;
- current `HEAD` equals the requested head;
- the worktree is clean before and after execution;
- the current host satisfies the Canonical platform and resource policy;
- the exact Canonical Node version is active through both the running process
  and `PATH`;
- every selected phase completes successfully with finite duration, complete
  cleanup, and zero remaining owned processes.

It never silently tests another commit. It never stashes, resets, cleans,
discards, or moves user source changes.

The ordinary PR lane observes `main` before responsibility planning through
`scripts/github-main-branch-transport.mjs`: a bounded authenticated `gh api`
GET, pinned to `github.com`, the canonical repository and `main`, without a
cached-response request. Local tracking refs do not substitute for an unavailable
or invalid remote response. Wrong/stale bases and unproven ancestry produce a
failed receipt with no planner classification or deciding phases. No automatic
fetch, source integration, retry, or GitHub write is performed.

Admission and later receipt validation are observations at recorded times.
Validation re-observes current `main` and rechecks ancestry. Neither read reserves
the base or proves the eventual GitHub merge result: `main` may move after the
last read, and the later merge-time TOCTOU boundary remains unclosed here.

## Isolated verification on the authorized Mac

Create a task-owned Git worktree registered to `/Users/hynk/code/augnes` from
the intended candidate, then invoke its own executor from that checkout:

```bash
npm run verify:local:changed -- --checkout-context isolated-worktree \
  --base <exact-40-character-base-sha> --head <exact-40-character-head-sha>
```

The same explicit context option is supported by Quick, Full and receipt
validation. There is no caller-supplied canonical anchor or arbitrary path
qualification. Admission resolves the physical checkout, exact origin, common
Git directory, registered worktree entry and backlink to the authorized Mac
checkout. Nested roots, path aliases, unregistered clones and non-Mac isolated
contexts fail closed. Exact clean head, authenticated current base, ancestry,
Canonical Node, host policy and the unchanged planner remain mandatory for
qualification. The context is rechecked before each phase and after execution.

Each lane owns its checkout and its three installed dependency trees, generated
build state, logs and receipts. Before mutation, the executor refuses aliased
mutable roots, external symbolic links, hard links not fully contained in audited mutable paths, and local
`.env` overrides (the checked-in `.env.example` remains allowed). Internal npm
binary symbolic links and fully accounted native-binary hard links within the lane
are permitted. The outer invocation receives a
private HOME, temp root, npm download/node-gyp caches, disposable database and
runtime state through the existing child-resource owner. Child tests retain their
own nested resources, browser profiles, loopback listeners and verified process
trees. On macOS the outer resource owner uses the system short temporary root,
keeping nested Unix-domain IPC paths within the existing platform limit. No
writable dependency or build tree is borrowed from another lane.

When the authority phase is selected, the executor copies only its five existing
migrated historical runs and their two authorization-consumption directories
from the accepted checkout's archive.
Copies have their own files and read-only permissions at the existing historical
reader paths. The original archive is read only; neither active state nor old
receipts are copied. An existing destination archive, aliases or missing inputs
refuse preparation. The existing resource owner removes only this invocation's
copy after child settlement. Receipts bind its source and content fingerprints,
invocation, unchanged before/after contents and cleanup. Historical assertions
and input provenance remain unchanged; this is fixture provision, not runtime
adoption or new historical evidence.

The isolated executor only observes the accepted Companion through its supported
read-only inspector before and after the run. Its private HOME prevents nested
build/suite wrappers from discovering or maintaining the installed service. An
isolated lane never pauses, restarts, reconfigures or adopts that service. A
changed observed service identity/lifecycle refuses successful qualification.
The inspector is loaded from the admitted accepted checkout, whose identity is
bracketed by that observation. Candidate-only source files and runtime floors
therefore do not require an installed adoption merely to inspect preservation.
The isolated inspector brackets one health/ownership probe round with the same
scoped service materials and loaded-job identity. Only the manager heartbeat
update timestamp is excluded from coherence comparison. Lifecycle, process,
runtime generation/instance, ownership and configuration changes remain refusals;
there is no retry, favorable-sample selection or grace period. A non-secret
observation diagnostic accompanies each lifecycle projection in the receipt.
Invalid/unavailable or incoherent evidence cannot establish preservation, even
when the coarse service fingerprint matches. Original receipts remain immutable;
new observations and a new candidate's complete run do not repair earlier runs.
The default canonical path retains supported maintenance/restoration for actual
installed-checkout mutation. Cooperating tasks must still coordinate production
handoffs and other shared mutable targets; this is not hostile same-user sandboxing.

Git objects/worktree registration, the read-only Canonical Node and browser
executables, operating-system resources and the host capacity directory remain
shared. Worktree creation, source integration and installed adoption are outside
the executor. No shared writable npm cache, browser profile, generated tree or
production database is a phase input. Never remove another task's checkout or
owner artifact to gain capacity.

## Node and platform policy

Exact deciding evidence uses Node.js 24.22.1 on macOS arm64. `.node-version`
is the single repository version marker. The supported source-compatibility
range is the maintained even LTS lines `^22.23.4 || ^24.22.1`, with npm 10 or
11. Compatibility does not equal Canonical identity:

- Node 24.22.1 may produce deciding evidence when all other gates pass.
- Node 22.23.4 or later within Node 22 may be used for compatibility checks but is not the exact Canonical
  runtime.
- Node 25 and other versions produce an explicit mismatch. Quick mode may still
  run as non-deciding feedback; changed and full fail before long phases.

The policy does not install a version manager, switch the system runtime,
invoke Homebrew, or modify global settings. Linux and Windows remain separate
compatibility surfaces rather than substitutes for the current local Canonical
host.

The compatibility evaluator enforces each line's security floor; it does not
accept every release in those majors. Companion selects only Node 24.22.1 or
later within Node 24 and retains its exact resolved path and v-prefixed version
binding. Node's bundled Undici is separate from npm-installed dependencies:
the minimum Node 24 bundles 7.30.1, while the minimum Node 22 bundles 6.29.1.
The deciding npm baseline remains exactly 11.16.0 and is checked independently
of Node. Task-owned binaries may be selected through PATH; global replacement
and installed Companion adoption require separate authority.

## Mode selection

### Quick

`quick` is rapid Codex/developer feedback. It uses the installed dependency
trees and runs:

- typecheck;
- local executor identity/scheduling contracts;
- local receipt integrity/staleness contracts;
- the existing local Canonical lifecycle contract.

It does not install dependencies or run build, package, runtime, integration,
operability, or browser lanes. It may run on a dirty tree or noncanonical Node,
but its receipt is always `deciding=false` and `transferable=false`.
Typecheck runs `next typegen`, which writes shared generated state and consumes
installed dependencies. Quick therefore owns the same checkout boundary for its
phase sequence; it does not acquire production Companion maintenance or remove
the generated build tree. Read-only receipt validation and dependency-light
documentation/operating-policy phases do not acquire this checkout owner.

### Changed

`changed` invokes the existing planner with the exact pull-request base and
head:

```bash
node scripts/canonical-change-planner.mjs \
  --event pull_request \
  --base <exact-base-sha> \
  --head <exact-head-sha>
```

A `documentation-only` planner result requires no Local Canonical deciding
run and no receipt. Review the exact diff and run only content-appropriate
lightweight checks when useful (for example Markdown/link/private-path
validation). The existing validator remains available for optional feedback:

```bash
node scripts/validate-canonical-docs-change.mjs \
  --base <exact-base-sha> \
  --head <exact-head-sha>
```

It does not install dependencies or run unrelated runtime suites. A planner
classification failure or ambiguous/unsupported change is not documentation-only
and fails closed to the applicable behavior-affecting verification surface.

Document responsibilities are distinct from runtime qualification:

| Responsibility | Selected scope and review |
|---|---|
| Ordinary explanatory documentation | `documentation-only`; exact diff and content review, optional standalone validator, no deciding run or receipt. Source search is a refusal screen, not proof of absent consumers. |
| Authority/contract documentation | `operating-policy-only`; exact-tree references and actual machine-consumed interfaces. Review material authority changes explicitly. No runtime Full Canonical merely for wording, file count, or delegation from another document. |
| Proven documentation disposition (path or anchor) | Incoming-reference validation against the proposed tree, plus owner/consumer/retention review. An anchor removal is reported even in an otherwise ordinary edit. No runtime PASS is claimed. |
| Unknown or unsupported consumers/disposition | No cheap exemption. Preserve the conservative plan and resolve the material obligation in review; Full Canonical alone cannot prove safe deletion. |

The existing change-owner manifest records audited documentation consumers and
one reference-safe supporting-analysis disposition family. Root `AGENTS.md`,
README, verification/reduction policy, and PR-template combinations retain
reference and interface checks. The root agent-instruction marker has real
hook/installer consumers and must remain intact. Document wording, heading style,
historical identifiers, and template length are not machine contracts. Tests
must exercise implemented security and authority behavior rather than assert
that explanatory prose contains prescribed phrases. vNext owners, including
the architecture owner, retain meaning review and reference checks.
An in-place edit to a document delegated by an authority owner receives static
authority-documentation review even without a separate manifest entry. This
does not exempt executable readers, package inputs, or unknown consumers.
Nested agent instructions, executable/package Markdown, unknown test consumers,
unsafe modes/statuses and unregistered path dispositions remain conservative.

For an authority/contract edit, run the standalone validator with
`--plan operating-policy-only`. It reads the exact Git tree and checks links,
anchors, private-path additions, and the documented commands and instruction
marker with actual consumers. Document meaning remains a review responsibility.
Do not require the repository-wide verification-code contract or unrelated
runtime tests for this static document edit. These checks need neither dependency
installation nor canonical-machine availability. If the optional Local Canonical
operating-policy executor is explicitly invoked, it runs only this document
validator. Its receipt describes static document feedback, not product runtime
qualification. Tests of the planner, executor, receipt, and verification code
remain in their own behavioral verification owners.

For a `documentation-only` path/anchor disposition, run the standalone validator
and record the owner/consumer findings. It checks unchanged incoming Markdown
links (including relative/reference-style links and anchors), changed outgoing
links, and private-path additions using exact Git trees. Unrelated pre-existing
broken links are reported separately. Locally available commit-pinned historical
links are checked at their pinned tree; unavailable pinned commits are reported
unverified, never rewritten to current source. Remote availability, unsupported
reference syntax, semantic correctness, dynamic use and retained external
consumers remain review questions. Unresolved material obligations block the
exemption; absence of a text match is insufficient. No permanent audit report,
new approval ritual, dependency install or runtime suite is required for this
reference proof.

An `owner-targeted` result is available only when every non-documentation
change matches a checked-in responsibility owner in
[`scripts/local-canonical-change-owners.v1.json`](../scripts/local-canonical-change-owners.v1.json).
That manifest may select only a fixed ordered subset of existing Canonical
phases. The plan always begins with an exact-base/head validator that recomputes
the planner result, runs `git diff --check`, and validates any changed Markdown;
the executor then replaces all three installed dependency trees through the same
sequential root, Apps and web-planning `npm ci` preparation used by Full Canonical before it
runs the manifest-selected typecheck, unit or named unit checks, authority, integration, operability,
or Browser owners sequentially. Callers cannot supply tests or phases.

The six exact files registered to the explicit reuse-hook and operator-plugin
setup owners select three named checks: `codex-companion-discovery`,
`augnes-operator-plugin-setup`, and `codex-user-hook-migration`. These reuse the
complete existing unit children, including Apps SDK discovery/parsing and the
plugin test's hook consumers, through the same isolated runner and cleanup.
Each check has its own phase and receipt row; this is not an aggregate unit
PASS. All three clean dependency installations remain required. Full unit
retains all of these checks; a mixed owner requiring unit subsumes the named
checks. Shared hooks/configuration, MCP implementation, package changes,
renames, deletions, unmatched paths and verification machinery retain their
broader classification. Changes to this selection itself require Full.

The manifest is intentionally a narrow admission list, not an inference engine.
A top-level `scripts/`, `lib/`, `app/`, `components/`, `tests/`, or `fixtures/`
path does not by itself select either targeted or full verification. Known
single-owner product changes include the corresponding detailed Browser owner;
multiple Browser owners, shared composition, or unknown Browser ownership fail
closed to `full-canonical`. Documentation may accompany a targeted owner
without dropping its behavioral phases; the exact-change validator retains the
affected Markdown/reference and machine-interface checks. A runtime
receipt does not replace those focused checks. Full plans retain the same focused
documentation obligations in addition to runtime qualification.

For changed-mode Full plans, Browser selection uses the remaining changes after
the exact-tree responsibility classifier has admitted documentation. An admitted
document does not add unrelated Browser owners; its static checks and semantic
review obligations remain. A path or Markdown extension alone grants no
exclusion: unknown or unsafe documents and documents whose executable consumers
are not covered by an admitted responsibility retain conservative selection.
All nine non-Browser Full phases remain required. Both pull-request and push
planner entry points classify their exact base-to-head delta; push does not
implicitly expand a documentation change. Explicit `verify:local:full` still
selects every permanent Browser phase.

The exact project-experience verification family has a separate targeted owner:
its Browser executable, private fixture builder, keyed result contract,
hydration boundary, and their focused tests. It retains typecheck, unit,
**authority**, and `e2e-project-experience` after the fixed validator and all three
clean dependency installations. Authority remains necessary because its
verification-policy contract consumes the Browser executable and enforces
fixture and lifecycle boundaries. This admission does not cover arbitrary
Browser scripts, shared fixture/lifecycle helpers, or owner manifests. The
[verification architecture audit](../docs/verification/VERIFICATION_OWNERSHIP_AUDIT.md)
records consumers, exclusions, comparative plans, and retained responsibilities.

The audited `hypothesis-cache-study` research family has a separate exact-path
owner. It retains the exact-change validator, all three clean installations,
typecheck, complete unit and authority suites. Its unit child uses the unchanged
10-second natural-exit bound and existing resource/cleanup owner. The data file
`scripts/canonical-research-tests.v1.json` may only enable reviewed test IDs;
it cannot choose commands, arguments, phases, resource requirements or deadlines.
The shared loader and owner mapping are verification integrity implementation:
changing either still requires Full Canonical.

Narrow registration requires valid, canonical data in both exact trees, no
removed or replaced IDs, no duplicate/unknown IDs, and the complete regular-file
source/test inventory. Any source in this family requires its registration and
test even in Full. Deletion, rename, mode changes, unregistered helpers, missing
or conflicting registration and unknown consumers remain conservative. Existing
suite children cannot be replaced. This is one source-reviewed family, not a
research-directory or generic test-addition exemption. Its initial registration
is empty until that separate implementation enables it. The original #1429
runner/guard diff still requires Full; this policy does not qualify that PR.

Before this policy is on main, execution of a representative future registration
is development evaluation only. It must record the actual source/base/head,
selected and completed checks, failures, elapsed time and cleanup separately
from the introducing policy PR's required exact-head Full qualification. Never
substitute a hypothetical integration base or a development report for a receipt.

Deletion is classified by the responsibility being removed. The audited pure-doc
disposition path above is separate from executable deletion. Only an explicitly
registered owner whose manifest deletion policy is `targeted` may use the
bounded path; this version admits that behavior only for the dedicated Local
Canonical owner-contract fixture namespace. Renames, copies, deletions with
public/runtime/data/compatibility/security responsibility or unproven
consumers, and all unmatched ownership select `full-canonical`. Filename, age,
static import reachability, and absence of navigation are not consumer proof.

Invalid or unavailable SHAs and identical base/head are identity failures, not
permission to run another plan.

### Full

`full` invokes the exact planner for recorded context and deliberately selects
`full-canonical` even if the planner reports a narrower plan. It runs:

```bash
npm ci --no-audit --no-fund
npm --prefix apps/augnes_apps ci --no-audit --no-fund
npm --prefix apps/web_planning ci --no-audit --no-fund
npm run typecheck
npm run build
npm test
npm run test:authority
npm run test:integration
npm run test:operability
npm run test:e2e:project-experience
npm run test:e2e:operator-execution
npm run test:e2e:continuity
npm run test:e2e:golden
npm run test:e2e
```

The executor represents each nested install by running npm with that app as its
working directory. The web-planning lock isolates Miniflare and workerd from the
native application's graph and historical package-reuse fixture. Its dedicated
dependency phase runs before consumers under the same checkout/maintenance
owner, has a finite bound, and is included in exact lock/receipt validation.
Existing test deadlines and historical fixture inputs remain unchanged.

Core/protocol, schema/migration/current-data, security/credentials/authority/
process-isolation, shared native-host/runtime, package/build/distribution,
compatibility, broad product composition, and unknown responsibilities remain
full. Changes to the planner, owner manifests, executor, receipt, evidence
projection, or their integrity contracts also remain full: a new narrow policy
cannot approve its own implementation.

Focused integration and operability commands remain available:

```bash
npm run test:integration:operator
npm run test:integration:supporting
npm run test:operability:fast
npm run test:operability:recovery-validator
npm run test:operability:recovery-storage
npm run test:operability:supervisor
npm run test:operability:runtime-reconciliation
npm run test:operability:package
```

## Dependency and generated-state policy

The Next configuration explicitly disables `experimental.agentUpgrade`. Next
16.4 otherwise starts an advisory request during development startup even with
telemetry disabled. Managed source runtime startup retains its zero-network
behavior; dependency maintenance and agent invocation remain separately
authorized actions. Recovery and package checks keep their network guards and
zero-attempt assertions intact.

Package builds set `AUGNES_PACKAGE_BUILD=1` for the Next build only. The serialized
standalone config disables `experimental.isrFlushToDisk`, preserving Next's
bounded memory cache without promoting route seeds into the immutable package
inventory. Ordinary source builds retain their default cache behavior. Package
Start/recovery/Stop and handoff checks still require the complete file inventory;
runtime-generated route-cache files are not excluded from integrity validation.

### Historical package dependency preparation

Before a package handoff or a Full containing operability, run
`npm run prepare:historical-package-dependencies` in the task-owned checkout
under the exact Canonical Node/npm. This separate, bounded preparation installs
the merged #1118 root and Apps dependencies from four byte-pinned Git source
files. It retains an isolated historical artifact in
`.augnes-local-verification/fixtures/merged-r8a-dependencies/`; an existing
destination refuses instead of being overwritten. npm download/node-gyp caches,
HOME and children are disposable. A temporary npm configuration records exact
approvals for the historical install-script packages; historical source and
locks are never edited.

Full also includes the distinct durable-work predecessor `d9b6b56`. Prepare its
exact root graph with `npm run prepare:historical-work-dependencies` under the
same Canonical Node/npm. Its two original source hashes and original tree are
fixed separately in `.augnes-local-verification/fixtures/durable-work-dependencies/`.
This is neither the R8A graph nor a current dependency superset. The historical
producer uses an independently copied, exact-lock view, with its own source and
installed-material checks before and after execution. Its provision manifest is
also an executor/stock execution input. Both preparation commands refuse an
existing destination; neither historical lock or product source is rewritten.
The executor reuses the provision readers after acquiring its checkout owner and
before service/build mutation or attempt reservation: R8A for unit/operability,
durable-work for integration. Missing or invalid preparation refuses without
starting phases or consuming an attempt; it never triggers automatic installation.

The R8A provision manifest binds the original commit/tree, four source hashes,
actual Node/npm/platform/ABI and complete installed-file identities. The
executor and separate stock reader bind this manifest as an execution input.
The package scenario revalidates source bytes, installed resolution, native
platform material, bins and file identities before copying disjoint historical
dependencies and again after the historical package build. The later genuine
old-to-current handoff separately validates the produced package and runtime.
No current package is relabelled as historical. The original strict normalizer and single-leaf
reuse rule remain unchanged; arbitrary supersets still refuse.

Package building and handoff retain their zero-network guards and existing
timeouts/assertions. Preparation is not handoff evidence. The generated artifact
is retained with the task's review checkout and original receipt while stock
validation needs it; it is not committed, uploaded or adopted. Remove it only
after its consumers settle and the corresponding review retention is released.

Current graphs record exact approvals for their currently resolved install-script
packages in `allowScripts`, including SQLite, esbuild and workerd. npm 11.16.0
does not default-deny unlisted scripts unless `strict-allow-scripts` is enabled;
this maintenance does not enable it. The Apps graph's versions remain unchanged;
its explicit approvals follow the same rule.

Before Quick, owner-targeted, Full, or any isolated-context phases, the executor atomically acquires
`.augnes-local-verification/checkout-owner.json` with exclusive creation. This
checkout owner is independent of Companion installed/live/stopped/absent state.
It spans dependency use/replacement, generated-state cleanup, and Companion
restoration. Companion maintenance still owns service pause/restoration and is
not the checkout exclusion mechanism.

Authoritative generated-state baselines are observed only after checkout
acquisition and, for canonical owner-targeted/Full, successful Companion maintenance
admission. Isolated contexts acquire private outer resources instead. The maintenance owner's own `before` observation defines the lifecycle
to restore. Root `.next` and generated Windows-helper cleanup use these in-owner
observations; unobserved/refused baselines remain `null`, not an asserted absence.
Both generated-state cleanup steps precede service restoration, and final shared
state is captured before checkout release.

The owner records only the contract, repository identity, opaque physical-checkout
fingerprint, random invocation identity, PID, hashed process birth identity, and
acquisition time. The executor retains an open file identity and a process-local
capability. Each phase and shared-state removal must still own that exact file;
finally cleanup verifies ownership before unlinking it. A contender cannot remove
another invocation's build state or lock, and failed acquisition remains failure
evidence. No broad process signalling, daemon, global machine lock, or path supplied
by lock metadata is used. Symlink, non-regular, redirected, replaced, oversized,
malformed, foreign-checkout, or unverifiable ownership artifacts fail closed.

A live owner's second invocation is refused immediately. Stale ownership is also
refused and retained for explicit bounded inspection/recovery; age or a missing/
reused parent PID alone cannot prove that all its children have stopped. There is
no automatic stale deletion or takeover. This is cooperative local exclusion,
not isolation against a hostile same-user process replacing filesystem entries.
Ordinary phase failure still releases ownership after bounded child settlement
and cleanup. If child settlement is unproven, generated state and the lock
artifact are retained, Companion maintenance is not released, and checkout
release is reported failed; a successor cannot replace
the inputs of possibly surviving children. Concurrent attempts use distinct
random-suffixed receipt/log names, including failed acquisitions.

Quick treats installed dependencies as feedback inputs only. Documentation-only
changes require no Local Canonical execution. Operating-policy-only changed
execution does not consult or replace installed dependencies.
Owner-targeted and Full Canonical execution replace all three installed
`node_modules` trees through sequential `npm ci` operations bound to the exact
committed root, Apps and web-planning lockfiles. The clean preparation phases precede every
dependency-consuming targeted owner, are recorded in the fixed planner phase
inventory, and must pass for the receipt to be deciding. A stale, foreign,
locally polluted, reused, incomplete, reordered, or unattested installed tree
is not deciding input. Package, build, distribution, dependency, or lockfile
responsibility remains `full-canonical`; clean targeted preparation does not
make those responsibilities narrow.

Canonical-checkout npm download-cache reuse is permitted to avoid unnecessary transfer;
isolated invocations use private disposable caches. Neither caches nor pre-existing
installed trees are deciding authority. Dependency
preparation failure is a verification failure. Root and nested lockfile SHA-256
fingerprints are recorded in every receipt.

The ignored root `.next` directory is repository-owned generated build state,
not exact-head source evidence. Before both Full Canonical and owner-targeted
execution, the executor accepts only the exact bounded root `.next` directory
and removes any pre-existing entry before a deciding phase runs. A symlink,
non-directory entry, or path outside that boundary fails closed without
following or modifying the external target. After phases and before Companion
maintenance release, the executor removes any newly generated `.next` while it
still owns the checkout and applicable runtime-maintenance boundaries and verifies that the path is absent
at that execution-cleanup boundary. Removal failure or residual state makes the
run non-deciding and invalidates its receipt. The executor then restores the
exact prior Companion lifecycle. A previously live or starting exact-checkout
Companion may create fresh exact-head runtime `.next` state after successful
restoration to `live`; the receipt records that final observation separately,
and it is not input to or
residue from a deciding phase. Optional documentation validation and
operating-policy-only execution remain dependency-light and do not touch
`.next`. The executor never
uses broad `git clean` or deletes unrelated files. Existing Canonical children
continue to own their bounded OS-temporary resources; the executor does not
create another checkout or Git working copy.

Next.js also owns the ignored root `next-env.d.ts`. `npm run typecheck` runs
`next typegen` before `tsc --noEmit`, so a fresh tree receives the required
generated declarations. Development and production generation may refer to
different internal route-type paths under `.next/dev/types` and `.next/types`;
both remain included by `tsconfig.json`. The generated declaration is not
exact-head source evidence and is not committed. This does not relax identity
checking: any unrelated tracked mutation still makes deciding verification
fail after execution.

The distributable-package compatibility guard compares the root and nested
dependency graphs with their merged baseline. At `packages[""]`, it retains an
explicit allowlist of dependency-bearing declarations, including dependencies,
development/optional/peer dependency declarations and metadata, bundled
dependencies, and workspaces. Root application version and unrelated root
toolchain-policy metadata such as `engines` are not dependency-graph identity.
All non-root package entries—including resolved versions, integrity,
optionality, and platform metadata—remain exact.

## Shared-Mac scheduling and resources

The Mac is a shared development and verification host. Independent admitted
checkouts may overlap; within each invocation the existing scheduling remains:

- all outer phases run sequentially;
- dependency, build, database, package, recovery, supervisor, runtime
  reconciliation, listener-port, process, and browser ownership never overlaps
  on the same mutable target;
- core and continuity E2E never run concurrently within one invocation;
- the existing integration runner alone retains its proven maximum-two isolated
  groups, `operator-process` and `supporting-serial`;
- after an observed child acceptance failure or runner error, integration admits
  no further child or group. Already-started work settles under its existing
  deadlines and cleanup owners, retaining secondary failures. The group log and
  failure inventory distinguish selected, started, settled, completed, failed,
  and unstarted children; unstarted children are never successful results.
  Completed means a structurally complete returned result, not accepted success
  or complete cleanup. Rejection proves settlement only. Every selected child
  must complete and pass the shared acceptance owner for a successful run;
- each Canonical child keeps its own HOME, temp root, database, and runtime
  state;
- existing measured child timeouts, heartbeats, zero-network guards, process
  tree termination, stream closure, and exact cleanup assertions remain owned
  by the current runners.

Full and owner-targeted invocations on the Mac acquire a bounded host-capacity
slot before publishing their physical-checkout owner, so a refused contender
cannot briefly disrupt existing lanes as an unaccounted canonical owner. At least 10 logical CPUs and
24 GiB physical memory admit at most two heavy lanes; smaller supported hosts
admit one. Current free disk must cover the existing 15 GiB budget per admitted
lane. The slot uses the same exclusive file, physical identity and process-birth
owner as checkout exclusion; it is not a queue or a throughput guarantee. Busy
capacity refuses immediately. Stale, replaced or unsettled owners remain refused
and retained. A canonical-checkout owner not accounted for by a capacity slot
(such as an older executor or a runtime handoff) also refuses concurrent admission.
Quick and static feedback do not consume a heavy slot, but still obey applicable
checkout ownership. Uncontrolled outside host load can still fail fixed timing
gates; no deadline or assertion changes are permitted to obtain a parallel pass.

SIGINT/SIGTERM cancellation stops new phase admission and invokes existing bounded
verified-process-tree settlement for the current phase. A cancelled run stays
failed. Its cleanup cannot touch another checkout, capacity slot or child resource.
Unknown settlement retains resource and ownership artifacts and records failed
cleanup; a successor must not infer release from process age or disappearance.

Browser preferred-port allocation is a bounded loopback probe, not a runtime
reservation. It keeps at most 20 probes and three distinct role ports within
the supervisor's accepted preferred-port range. When the OS returns one of the
upper 20 ports, the next probe explicitly binds that candidate minus 20; merely
transforming an unprobed number does not establish availability. That probe
consumes the same budget. An occupied fallback remains unavailable; independent
probe and cleanup errors fail closed. Every probe closes before launch, and the
existing supervisor still owns later runtime collisions. No delay, Browser retry
or enlarged search budget is introduced.

The sanitized `browser_port_allocation.v1` diagnostic retains probe order,
requested/observed port numbers, selection or rejection reason, failure stage,
allowlisted error codes and cleanup outcomes. It excludes raw errors, paths and
environment material. Allocator-owned evidence survives initialization failure
before a lifecycle is returned, including in navigation-diagnostic child output.
Secondary cleanup failure must not replace the primary failure or be reported
as complete cleanup. Allocation failure remains distinct from navigation or
later launch failure. A new local reproduction or deterministic control does not
reconstruct an unavailable historical candidate sequence.

The full surface and every owner-targeted plan require
at least two logical CPUs, 8 GiB physical memory, and 15 GiB free
repository-volume disk before dependency or long phases. Quick,
documentation-only, and operating-policy-only execution require at least 1 GiB.
The receipt records
logical CPUs, physical and observed free memory, and disk before and after.
Resource, thermal, process, memory, disk, or cleanup failure is not suppressed.

macOS `caffeinate` availability is recorded, but this version does not invoke
it. No background service or global sleep setting is created.

## Local receipts and logs

Every mode writes a JSON receipt under:

```text
.augnes-local-verification/receipts/
```

Detailed phase logs remain local under:

```text
.augnes-local-verification/logs/
```

Both locations are gitignored. Phase logs are limited to 2 MiB each; ordinarily
five log-run directories and twenty receipt files are retained. Active runs and
explicitly pinned review evidence are exceptions to these ordinary bounds and
are never evicted to make room. Every deciding attempt family pins its original
run. Pinning is checkout-owned and records only a run identifier and reason;
unsafe pin files or aliases refuse pruning. Pins are not an archival service or
permission to remove historical evidence. The harness
creates only real directories inside the authorized repository and refuses
symlink redirection. Generated receipts and logs are not committed because
they are execution artifacts, may become stale, and are not source authority.
Retention pruning runs only while holding the checkout owner; refused contenders
and dependency-light feedback never prune an active owner's artifacts. The next
checkout-owned invocation applies the existing retention bounds.
The current run's log directory is explicitly protected regardless of mtime and
counts toward the five-directory bound; only the remaining slots use newest-first
retention. Refused checkout acquisition creates no phase-log directory and still
writes a failed-attempt receipt.

The public-safe receipt includes:

- schema and receipt version;
- receipt version 4 verification context (canonical or admitted isolated worktree),
  physical checkout/anchor/common-Git fingerprints, invocation-bound phases,
  capacity ownership and private-resource cleanup;
- integration-base admission: requested base/tested head,
  authenticated repository/branch/SHA observation, observation/check times,
  equality/ancestry results, and refusal reason;
- checkout ownership requirement, acquisition/release results and times, opaque
  checkout/invocation identities, and failure reason;
- repository identity, exact origin, base/head, branch or detached state, and
  clean/dirty state before and after;
- selected mode, planner event/result, selected plan, responsibility owners,
  targeted and Browser phase inventories, and deciding/transferability state;
- macOS version/build, architecture, Node/npm policy and actual versions;
- a random local pseudonymous machine fingerprint stored independently of
  hostname, username, serial number, hardware UUID, or account path; isolated
  contexts use the authorized anchor's machine identity, not a newly invented host;
- bounded CPU, memory, disk, browser-availability, and sleep-prevention facts;
- root, Apps and web-planning lockfile SHA-256 fingerprints and dependency policy;
- executor version, source-file inventory, and source SHA-256 fingerprint;
- versioned execution-input classification, source tree and selected-input
  bindings, bounded observations, first fault and separate outcome dimensions;
- append-only attempt lineage and any substantiated infrastructure repair;
- actual Browser executable identity at launch/settlement and agreeing owned
  HTTP/CDP runtime version for every actual consumer, including integration and
  nested navigation controls; exact counts are frozen and availability is not use evidence;
- every selected phase, public command, start/finish timestamps, finite
  duration, exit status, timeout state, cleanup state, and remaining owned
  process count;
- final cleanup, result, reason codes, and limitations.

It excludes absolute private paths, usernames, hostnames, serial numbers,
hardware UUIDs, environment dumps, credentials, tokens, prompts, model output,
raw command output, database contents, provider material, and hidden reasoning.

The receipt is serialized with recursively sorted JSON keys. SHA-256 over the
receipt excluding its `integrity` member provides a deterministic content
fingerprint. This proves content integrity for the local artifact and binds its
claimed local provenance. It is not a signature and provides no independent
trust or third-party attestation.

## Validation and staleness

### Classified inputs and outcome dimensions (receipt version 4)

The [consumer map](../docs/LOCAL_CANONICAL_INPUT_CONTRACT.md) identifies the
controller, authenticated transport, dependency, suite, native-fixture and
Browser boundaries. The executor freezes `augnes.local-canonical-inputs.v3`
before the first phase. Its fingerprint binds declared source/tree, executor,
selected environment and phase inventory. Isolated children still use the
existing strict environment filter and private HOME/temp/cache/database/runtime.
Neither private HOME nor a configuration key's name alone establishes exclusion.

Execution inputs, safety resources, proven non-consumed ambient context and
unknown relevance have different dispositions. On the audited isolated
model-free path, the shared developer `~/.codex/config.toml` is observed but
not consumed by the selected controller, phases or descendants. Version 3
therefore binds its location, presence, regular-file/single-link resolution,
device, mode, owner/group and ACL/file-flag/extended-attribute identity; its
content hash, size, inode and timestamps remain diagnostic observations. This
includes non-preference remainder changes: no lost historical edit or writer
is inferred. Preparation/admission, monitoring and stock reconstruction use the
same effective identity, including the existing incidental executable metadata
rule. The complete raw observations remain separately bound in each receipt.
No other ambient or unknown resource receives this exclusion. Consuming and
unknown paths remain conservative; task-owned configuration, instructions,
credentials, transport, source, tools, workload, Browser and Companion protections
remain binding. Source changes introducing a consumer require renewed review
of the consumer map and its controls. No rule authorizes writing preferences,
copying credentials, launching a model or changing installed services.

For the audited isolated inventory, a newly declared `git-config` resource may
carry `gitTracking.policy = isolated-current-branches-v1`. This versioned role
binds both actual checkout branches and all remaining configuration bytes while
excluding only a complete, unique foreign branch section containing the two
plain upstream-tracking entries. All remotes, current/anchor branch settings,
credentials/transport, hooks/filters and mixed changes remain protected. Actual
effective configuration origins and both branches are reobserved; external
system/global inputs and path/permission identity remain binding. An existing
worktreeConfig extension additionally binds each checkout's complete worktree
configuration, including absence; this reader never enables or edits it. Includes,
conditional includes, unknown extensions, environment overrides, ambiguous
syntax/origins or incomplete observations cannot acquire the projection. The
consumer map defines its finite tested scope; broad/unknown consumers retain
whole-file protection. Earlier declarations without this resource marker keep
their original comparison and recorded failures. This adds neither a retry nor
a proof kind, and never authorizes changing the shared configuration.

Version 2 material retains its original raw preparation/admission hash and
preference-only comparison (leading `model`, `model_reasoning_effort` and
`service_tier` values; remainder changes refuse). Version 3 never reinterprets
an old refusal, receipt, proof or consumed allowance as successful. The version
is an interpretation discriminator, not an input-ignore option or new proof kind.

Configuration contents are hashed in memory. Receipts contain safe identities
(and the historical version 2 preference projection), never complete configuration or credential
contents. Auth locations are observed through metadata only. Excluded-file
content-equivalent replacement may be recorded without cancellation; changed
type, permissions, ownership, unsafe aliases or relevant input identity refuse.
An existing read-only Browser executable may have shared hard links. Its
resolved location, device/inode, mode, owner/group, ACL/file-flag fingerprint, size, mtime and content remain
bound. Complete observations differing only in link count/ctime are recorded as
incidental executable metadata; a changed metadata hint forces a content read.
Missing/incoherent evidence, unsafe resolution, content or consumed/safety
identity changes still refuse. The observer, Browser-use reader and stock reader
share this role rule. It is never a write or cleanup target. This does not relax the single-link requirement
for configuration, mutable resources, evidence or cleanup paths.
Integer nanosecond metadata stays exact. Observation intervals are not exact
write times, writer attribution is separate, and polling cannot prove absence
of transient writes between observations. Large executables use exact metadata
as a polling hint and are rehashed at closeout. This is cooperative same-user
resource protection, not a hostile-user sandbox.

The first relevant fault latches. The executor aborts through its existing
controller and owned-child settlement path, never by a foreign PID. Observer
failure, source/input invalidation, safety faults, cancellation, missing coverage
and incomplete cleanup cannot yield PASS. Raw phase statuses remain intact.
Receipt inspection reports execution/coverage, historical integrity, evidence
validity, safety and current merge applicability separately. Later main movement
blocks current applicability without rewriting the historical receipt. The
unchanged exact-head/current-main/context gates still apply to deciding use.

### Attempt families and bounded operational recovery

A task starts an append-only family at the authorized anchor,
keyed by repository and branch, not by wrapper PID, checkout or commit. It
consumes one initial complete invocation only after admission. A pre-admission
refusal records no executed coverage. A started but unsettled attempt blocks
further admission. Original attempt and completion records are never overwritten.

At most one explicit recovery invocation is available for the same frozen
head/tree, only after a substantiated infrastructure cause is corrected and a
task-owned focused probe demonstrates the remedy. This increment admits the
directly observed child-spawn failure class (`ENOENT`, `EAGAIN`, `EMFILE`,
`ENFILE`, `ENOSPC`), with immutable prior receipt linkage, cause, remedy and proof
identities. It does not automatically classify network/assertion failures or
timeouts as infrastructure. Use `--recovery-proof` with a repository-relative
local repair record only after that evidence exists; there is no automatic retry.
Product/unknown/safety failures, cosmetic commits, wrapper restart and a third
same-candidate attempt refuse. A genuinely changed reviewed candidate uses an
explicit `--source-correction-proof` record, not an infrastructure recovery or
branch-family reset. Legacy source-correction v1 records retain their original
interpretation. Candidate succession v2 additionally retains the original
receipt, exact source-review delta/path inventory and one immutable successor
reservation on the latest settled predecessor.

The v2 source-module paths additionally admit exactly the repository-relative
`next.config.ts` and `components/blank-state/blank-state-client.tsx`; v1 retains
its existing scripts-only interpretation. Other root files, alternate
configuration names, manifests/locks and other `components/` paths gain no
exemption, including `components/project-settings-link.tsx`. The exact component
path supports the demonstrated Current project return correction; it does not
extend the verifier-correction module allowlist or change any regression,
source-review, predecessor or successor requirement.

For v2 `source_revision` only, also admit exactly
`components/workbench/semantic-review/selected-work-source-editor.tsx` for the
demonstrated Native pending-selection correction (#1599). This is a one-path
admission-scope expansion, not a generic component rule. Compare the literal
repository-relative path without normalization; siblings, case/extension changes,
backup suffixes, aliases, traversal and alternate separators remain excluded.
The v1 interpretation and verifier-correction allowlist remain unchanged. The
same retained chronological RED/GREEN, complete delta/path review, latest settled
predecessor, exclusive successor, ownership, cleanup and stock checks still apply.
Disposable exact-path fixtures test admission; actual Native Browser observations
support product behavior and retain their original source/driver/runtime binding.

For v2 `source_revision`, the four raw JavaScript modules that the Web planning
handler serves together as `/client.js` also qualify: `apps/web_planning/src/client.js.txt`,
`apps/web_planning/src/exchange-client.js.txt`, `apps/web_planning/src/history-client.js.txt`
and `apps/web_planning/src/search-client.js.txt`. The reader compares these literal
repository-relative paths without normalization. Other text assets, unregistered
siblings and aliases remain outside this addition. Stock validation for receipts
of these four source revisions reads the existing machine identity. A missing
or unsafe identity refuses validation without creating a file or repairing permissions.

A meaningful revision after PASS or an ordinary product/cancelled result requires
the same retained deterministic regression failing on the prior Git source and
passing on the corrected source, under the same environment and Canonical Node.
Both observed children must exit naturally with complete cleanup after the
predecessor settles. A proved verifier correction after a safety/input stop also
requires the prior original fault, matching disposition and an allowlisted
verification owner; it does not relabel that stop as infrastructure. A necessary
accepted-main integration after PASS instead binds the freshly admitted main,
exact two parents and the read-only recomputed non-overlapping tree-entry union. An unrelated merge
is not a claimed repair, and overlapping/resolved source requires correction proof.

For the legacy v1/v2 routes, unchanged head/tree, cosmetic source, changed or missing proof, unsettled owner,
unknown/timeout predecessor, older-attempt selection and multiple successors
refuse. A superseded candidate cannot consume its old recovery slot. Each
ordinary admitted candidate still has one initial and at most one substantiated
infrastructure recovery. These records bind reviewable source/evidence and scope;
they neither authenticate an independent reviewer nor grant execution authority.
Independent review and behavior-based adversarial controls remain required;
changed hashes or the candidate's ability to admit itself are insufficient.

Phase retries, partial-run stitching and favorable-sample selection remain
forbidden. Two-lane integration concurrency is unchanged. Bounds limit hangs and
settlement within supported CPU/memory/disk conditions; a timeout is not
automatically a performance regression or an infrastructure diagnosis. Historical
settled-expired-successor runs retain their 30,000 ms bound. Its separately
authorized prospective aggregate change to 45,000 ms remains adopted; its
historical authorization is preserved at the pinned Git revision in
[Retired qualification routes](#retired-qualification-routes). No other
child/phase bound changes.

### Reviewed source and execution-input revision (source-correction v7)

`reviewed_revision` uses the existing `--source-correction-proof`, authenticated
GitHub authority transport, exclusive predecessor edge, append-only attempt
records and separate stock reader. It represents a materially revised source
or execution-input target after the latest settled failed predecessor, including
a predecessor whose earlier grant is terminal. It does not renew that grant,
rewrite its record or change the interpretation of any legacy route.

The proof binds the accepted source/review, a separate prospective commission,
the actual source delta, immutable runtime inputs, retained original receipt,
attempt, completion and separate stock, and applicable focused evidence.
Implementation-owner final-source checks remain distinct from the receiving
reviewer's independent audit. An older predecessor, wrong authority/source/input,
unsettled cleanup or unchanged candidate refuses before consumption. Accepted
focused evidence may be reused with its original source/input attribution; it
never supplies unexecuted phase coverage.

One commission permits at most two deciding invocations across its entire
exclusive successor chain: the initial complete invocation and at most one
complete invocation after a demonstrated directly implicated defect or input
problem has been materially corrected and supported by focused checks. Source,
proof, branch, checkout or family changes cannot reset this ceiling. No unchanged
retry or additional recovery is available. Reservation is consumption, including
interruption before attempt append. The second slot requires the first receipt
and separate fresh-process stock before candidate revision. Without a supported
remedy, or after the second invocation, finish diagnosis and cleanup and report
the precise blocker.

A genuinely new authenticated v7 commission may follow a spent v7 commission at
its latest settled tip. A settled v10 ordinal-two Full with a naturally failed
phase can also supply that tip. Its original commission, grants, false stock,
receipts and exclusive edges remain spent and reconstructible. This boundary
requires a material change to implicated source and the full protected input
inventory, including shared Git configuration. Run the same behavioral script
and arguments on the settled predecessor and on the candidate. Bind both Git
blobs, runtime identities, exit results and output originals. The predecessor
must fail and the candidate must pass naturally with clean settlement. The test
driver may stay unchanged when it exercises the corrected source. A successful
syntax check on both sides of a comment-only change refuses preparation. Preparation reads the physical tip and installed Companion
observation before independent review. It cannot reserve or issue authority.

For this continuation, the published source review begins with
`Source review decision: ACCEPT / RETAIN for prospective qualification.` and
binds head, tree, base, predecessor and preparation commitment. The unedited
maintainer grant begins with `Authorize a NEW prospective v7 reviewed_revision
commission.` and gives the existing prospective terms, exact initial target,
source-review URL and operative task-delegation URL. Read current maintainer
permission. If ordinal one fails, retain that initial acceptance and grant for
accounting. A new commit-anchored contract review on the same PR binds the
second candidate and its preparation commitment. The same readers check its
material repair, current inventory, predecessor and exclusive reservation.

#### Prospective acquisition correction after a spent basic-v7 observation race

An inventory-bound v7 proof may explicitly select
`commission.input_acquisition = coherent-git-file-acquisition-v1`. This is a new
prospective commission, not recovery or restoration of an invalid historical
window. Its immediate predecessor must be the latest settled basic v7 ordinal
two of two, with no inventory successor or settlement route. Its sole fault is
the Git configuration metadata-consistency observation race; exactly one later
complete ambient Git observation has equal protected projection, scope and
permissions but changed raw bytes. The failed sample and writer remain UNKNOWN.
All recorded events, phase order, cancellation, original false stock, released
owners and coherent Companion preservation must be accounted for. Only the
cancelled phase may lack Browser coverage, and only with an explicit empty
Browser-use list. Invalid observed Browser records, other faults, changed
protected inputs, incomplete cleanup and ambiguous lineage refuse.

The corrected target must materially change `scripts/local-canonical-inputs.mjs`
and retain the same substantive final regression driver/arguments in both
witnesses. The RED witness explicitly uses the final driver over the exact prior
input owner; the GREEN witness uses the final driver and corrected owner. Bind
both owner blobs, final driver bytes, real runtime, command, natural exit, output
and complete cleanup, after the prior completion. This evidence supports the
acquisition correction; it does not reconstruct or validate the old failed sample.
Full source deltas, protected inventory and current live admission still apply.

Use the existing non-reserving preparation and authenticated authority readers.
The new independent acceptance must bind the concrete published target and
preparation commitment. Both acceptance and the genuinely new subsequent grant
must state: `Historical window remains UNKNOWN; old false stock and both spent
ordinals remain unchanged.` The unedited grant starts with `Authorize a NEW
prospective v7 reviewed_revision commission for a Git acquisition correction.`
and retains the existing operative task-delegation, target, review, stock,
independent audit and at-most-two-invocations scope. A generic approval, old spent
grant, quoted template, preparation or synthetic control creates no authority.

The exclusive edge keeps both old ordinals and grant IDs reconstructible. A new
ordinal one consumes on reservation, including interruption. Ordinal two requires
the existing material-correction, independent review, natural-failure and focused
support conditions; it retains this discriminator and the initial new commission.
There is no reset, third ordinal, unchanged-target retry, recovery allowance or
re-entry from this inventory-bound edge, except the separately authorized reusable
material-source correction below. Complete unchanged planner-selected Full,
fresh-process stock and owned-resource cleanup remain mandatory if later admitted.

#### Terminal reviewed-revision workload correction

Historical only. The completed #1594 route
`spent-acquisition-reviewed-workload-v1` is retired from current admission,
stock/export and default controls. Its original contract, incident predicates and
consumed history remain at the pinned reader in [Retired qualification routes](#retired-qualification-routes).

#### Exceptional post-terminal Git-successor workload correction

Historical only. The completed #1594 route
`spent-terminal-git-successor-workload-v1` and its task-specific delegation are
retired with the earlier workload route. The [original proposal](../docs/verification/1593_GIT_SUCCESSOR_QUALIFICATION_PROPOSAL.md)
retains its failure and authority history. Use the pinned historical reader;
neither route can supply a current successor or new execution authority.

#### Prospective serial aggregate budget correction from v2

`commission.route = serial-aggregate-budget-v1` is a narrow v7
`reviewed_revision` variant. It explicitly follows a latest settled ordinary v2
`source_revision` with no consumed reviewed-v7 commission. It does not broaden
the ordinary timeout disposition list. No issue, branch, receipt, or maintainer
identity is built into the discriminator. A different candidate-family hash
preserves the existing logical root and the exclusive immediate predecessor
edge; it does not reset the task or manufacture spent v7 ordinals.

The sole eligible incident is the existing serial project-experience parent
deadline interrupting the third child while it still had individual execution
allowance. The first two children must have naturally passed and settled; any
observed third-child exit, assertion failure, timeout, or settlement refuses.
The third outcome remains UNKNOWN. The reader checks original receipt integrity,
physical attempt/completion and original log bytes, recorded source and phase
inventory, every executed environment binding, every present Browser record,
and genuine following NOT_RUN placeholders. Only those proven missing records
may explain false stock. Other input, Browser, stock, cleanup, or preservation
invalidity refuses. Original results, false stock and earlier lineage stay
unchanged. Full local incident evaluation needs the original files and physical
anchor; exported digests do not prove causal history or the latest physical tip.

For an original phase capped at 2097152 bytes, the reader additionally requires
the complete original wrapper capture (at most 8 MiB), its exact physical
regular-file identity, and a matching copy. Only unique parent spawn/result
boundaries and validated parent lifecycle rows delimit the phase. The capped
bytes must be its exact prefix; the complete phase and wrapper Browser records
must match the respective original receipt records. Missing suffixes, duplicate
boundaries, changed originals, unexpected lifecycle rows, and any interrupted
or following-child completion/start refuse. Original truncation and timeout
fields remain unchanged. Physical capture paths stay private and are excluded
from sanitized exports.

The shared owner `scripts/project-experience-serial-budget.mjs` retains the
four children in order with the same commands, requirements, assertions,
natural-exit requirements, and individual limits: 360000, 60000, 180000 and
60000 ms. The fourth child is the separate Web draft-safety matrix. The derived
execution envelope is 730000 ms: 660000 child execution, 40000 conservative
natural-child settlement (10000 per child), and 30000 coordinator time. These
are disjoint intervals. Each child pays its `--import tsx` startup from its own
execution limit and cannot borrow unused time from another child.

The Full Browser parent invokes Node directly. Suite startup/imports,
preparation, between-child work, finalization, resource settlement and output
drain belong to coordinator time. Both the suite and the parent enforce that
30000 ms allowance independently of the outer 730000 ms guard. Early child
completion cannot subsidize excessive coordination. Parent post-exit settlement
is separately reported; forced terminal cleanup is separately identified and
always fails. Total observed phase duration can exceed the execution envelope.
Budget failure still settles owned process/resource cleanup and preservation.

This suite may observe a no-lease state or join an existing ancestor lease. It
cannot acquire a new maintenance lease. The actual Companion owner rejects that
acquisition before mutation, so the coordinator allowance never silently cuts
an owned 90000 ms restoration obligation. Other suites retain their maintenance
ownership, phase limits and concurrency. Commands/inventory disagreement or
unapproved override refuses. Existing input machinery freezes the shared owner
and binds the phase inventory and envelope commitment.

A successor must materially connect the changed orchestration owner and retain
all useful child code and limits. Focused evidence binds the actual reusable
serial-owner control driver, source blobs, exact command, runtime inputs,
natural exit, output and cleanup. It demonstrates controlled old aggregate
interruption, corrected serial completion, and refusal of child failure,
individual timeout, forced cleanup, incomplete cleanup, excessive coordinator
time, inventory disagreement, and borrowed child/settlement allowances. An
unrelated PASS, unused export or cosmetic source change is insufficient.
Synthetic controls prove their mechanisms, not the old child's unknown result.

`scripts/prepare-local-canonical-serial-aggregate.mjs <material.json>` performs
read-only preparation from the admitted isolated Mac checkout. It checks the
current published Draft PR head/base, exact clean source, original physical tip,
runtime and full input inventory, and fresh Companion preservation. It obtains
no capacity or maintenance lease, authorization capability or reservation.
Its commitment binds discriminator, original predecessor, source, focused and
incident material, inventory/envelope, and the single issued limit. Source and
preparation must then receive independent exact-target review before a separate
authenticated prospective grant. The review starts with
`Source review decision: ACCEPT / RETAIN for prospective qualification.`
The subsequent unedited grant starts with
`Authorize one prospective serial-aggregate-budget-v1 invocation.`
Both bind the exact preparation commitment, source, predecessor, inventory and
envelope and state:
`Original timeout, false stock, interrupted child UNKNOWN and all earlier lineage remain unchanged.`
The grant links the accepted review and explicitly states:
`Exactly one admitted deciding invocation total; no ordinal two, recovery or unchanged-target retry.`
`Reservation/interruption consumes the single grant.`
`Separate fresh-process stock and independent decision remain required.`
Existing authenticated maintainer permissions, body hashes, target and temporal
checks remain mandatory. Preparation or an implementation authorization cannot
substitute for this grant.

The actual exclusive edge reserves only that single invocation. Duplicate or
interrupted reservations remain consumed; no automatic second ordinal,
recovery, generic-v7 continuation or route downgrade follows it. A separately
delegated material-source correction may follow only under the explicit
exhausted-serial transition below; it does not extend this grant. Ordinary
admission, planner-selected complete Full, resource policy and fresh-process
stock still apply to any separately authorized deciding invocation. Receipt and
stock additionally validate disjoint serial accounting. Historical physical
replay uses recorded source/input/authority identities; live published-head
checks belong to current preparation, admission and applicability. Sanitized
export retains the variant and incident/proof bindings, but validates structure
only and always reports `deciding=false` and `independent_attestation=false`.

#### Reusable prospective material-source correction

A newly delegated `commission.source_revision = material-source-correction-v1`
uses the existing inventory-bound v7 proof, authenticated transport, preparation,
physical ledger, stock and export owners. It admits the latest settled physical
predecessor only after that predecessor has consumed its own issued maximum and
has an intact, completely settled natural product failure and separate false
stock. Existing phase, input, Browser, preservation and cleanup checks remain
mandatory. Observer cancellations, safety violations, successful receipts,
interruption and incomplete settlement are not material-source incidents. The
older dependency/restoration exceptions are not widened.

The new commission has ordinal one and maximum one for one exact accepted target
and preparation commitment. Reservation or interruption consumes it. A further
in-scope material correction requires another complete proof, separate independent
acceptance and genuinely new authenticated delegation and commission. There is no
unchanged-target retry, recovery or ordinal two under any such grant. Each old
commission retains its original limits and consumed count. Reconstruction follows
the physical append-only edges, detects cycles and is bounded by the physical
family inventory; it does not reset a root or impose a new cross-commission quota.
A material-source descendant cannot fall back into a legacy route.

The supported incoming predecessor also includes a completely settled, exhausted
`serial-aggregate-budget-v1` commission with a natural product failure. Its actual
latest receipt, original v2 incident, consumed authority and exclusive history
remain mandatory. Serial provenance is not globally Git-observation provenance.
The first material descendant records `commission.inherited_serial`: original
serial route and envelope commitment plus origin family, number, attempt and
receipt. Every later material descendant must retain it exactly. Omission,
alteration, unrelated insertion and legacy downgrade refuse. Serial predecessors
genuinely lack a delegation role; no historical delegation is fabricated. The
new real delegation must follow completion and cannot reuse the old grant.

The inherited commitment retains four ordered children and their existing
commands, assertions, natural exits and 360000/60000/180000/60000 ms limits,
660000 ms execution + 40000 ms natural child settlement + independent 30000 ms
coordinator = 730000 ms, with parent post-exit settlement separate. Maintenance
ownership, phase-five/full-workload-twenty Browser records, terminal IPC fault
retention and synthetic-output quarantine remain unchanged. The proof target,
commission identity, authenticated review/grant scope, physical replay, receipt,
fresh stock and sanitized export retain and enforce the inherited obligation.
Both review and grant state `Inherited serial envelope: <exact commitment>` and
bind its origin and the original serial history boundary. Export remains
structural, non-deciding and not independent attestation.

`input_acquisition` is preserved exactly when inherited. It describes acquisition
provenance, not the new product incident. Current incoming edges require a fully
supported physical lineage. A retired workload marker anywhere in that chain
refuses; the original #1594 mixed chain remains readable only through its pinned
historical reader. The reusable source-revision discriminator supplies prospective
authority under a new task, never unused historical permission.

Material proof uses `verifyGitSourceRepair`: actual implicated executable Git
bytes, complete source/input inventories, the same bounded behavioral command and
runtime, natural before-failure/after-pass and owned cleanup. Web `.js.txt` client
modules count as executable source. A new hash, whitespace change, changed
assertion or import/setup failure alone proves no product correction. Independent
source judgment must connect the observation to the correction and unchanged
substantive assertions. The existing `--import tsx` loader is the only optional
Node argument pair; arbitrary preloads or assertion-disabling flags refuse.
Witnesses bind their original tested heads, clean source, environment, implicated
modules and consumed source files. A later documentation-only target under `docs/`
may retain the after witness only with the complete exact Git delta and identical
consumed bytes; executable changes require relevant new evidence. Witness originals
are never relabeled.

For a compiler defect, the bounded `repository-typecheck-v1` alternative records
the unchanged `npm run typecheck` (`npm run typegen && tsc --noEmit`) with actual
natural RED exit 2 and GREEN exit 0. It binds exact clean Git heads/trees and tree
inventories, unchanged package/lock/tsconfig, compiler version and executable
hashes, actual npm/tsc/next launchers, exact PATH Node identity, no preload or
script-shell override, runtime/environment, both configured generated type roots
including explicit absence, complete raw diagnostics,
source stability, and cleanup. Both runs begin without an incremental cache;
cached diagnostic exit 1 is retained separately, never relabeled. Typegen/setup
failure, a wrapper substituted for the compiler, sparse or changed bindings,
altered diagnostics and a merely cosmetic source delta refuse. This alternative
has no new historical driver and does not weaken existing behavioral witnesses.

For the extracted registration consumer, `repository-pure-contracts-v1` binds
the existing `node --import tsx scripts/test-vnext-operator-pure-contracts-v0-1.ts`
command and a natural unit failure. It is not a generic TS-driver admission or
the compiler alternative. RED exit 1 must identify the original registration
assertion in the exact prior source; GREEN exit 0 must report every unchanged
responsibility exactly once. Setup failures and substituted wrappers refuse.
Independent source review must establish that the corrected assertion retains
the real inventory and suite/parent connection, not merely a passing string.

This witness commits the complete Git tree, including binary file identities,
sizes and modes, and compares all physical tracked bytes before and after each
clean run. It does not enlarge the generic witness's 256-entry declaration cap.
The fixed command's app/components/lib/scripts/types and Native source/public
scopes refuse untracked or ignored shadow files, nested modules, links and path
aliases. Root script/config shadows refuse; generated `next-env.d.ts` is bound
separately, including absence. Exact package/lock/tsconfig, the real tsx loader,
complete root prepared dependencies, Node/runtime, environment, raw diagnostics,
ordering after predecessor completion and natural owned settlement are bound.
The run uses a closed environment and hashes every effective child variable.
`NODE_OPTIONS`, `NODE_PATH`, `TSX_TSCONFIG_PATH`, `ESBUILD_BINARY_PATH`,
`NODE_COMPILE_CACHE` and `NODE_V8_COVERAGE` overrides refuse; tsx and Node compile
caches are disabled. Other ambient transformer settings are not forwarded.
The existing Git tree reader supplies complete identities; replacement refs
refuse, and physical reads are bounded to 10000 entries, 128 MiB total and the
existing 8 MiB per-blob bound. Current preparation
rereads the physical source closure, loader and dependency inventory. Historical
proof replay validates the saved observations against their original Git heads;
it does not claim a current host observation. No incident eligibility, inherited
serial obligation, authority role, issued limit or spent-grant rule changes.

For a registered development fixture aggregate, the explicit
`registered-fixture-aggregate-budget-v1` evidence kind represents a measured
prospective allowance judgment. It is neither a demonstrated cure of an unknown
historical delay nor qualification PASS. Ordinary natural RED/GREEN, compiler
and pure-contract evidence retain their own strict discriminators and checks;
missing legacy bindings never fall through into this kind.

The original receipt, stock and completion must still satisfy the natural
product-failure and complete-settlement reader. Its untruncated physical
authority log must identify exactly one registered aggregate overrun, its
bounded inner termination and natural outer failure, with complete owned
cleanup. The exact original path, size and bytes are reread at preparation,
admission and replay. A top-level infrastructure timeout, assertion failure,
unrelated phase, missing registration or ambiguous interval is ineligible.
The original classification, cause UNKNOWN and false stock remain unchanged.
Intermediate exit, signal and settlement observations must agree with the final
result; a passing summary cannot hide a failed or forced intermediate exit.

The witness parses the existing finite reviewed-fixture registration grammar;
it never executes historical source. Only the selected aggregate's inner and
outer allowances may change. Other groups, commands, assertions, child limits,
the lifecycle owner and product source remain intact. The source partition
separately commits the exact budget delta and the closed set of evidence-owner
and control changes for independent review. Version 1 admits newly dedicated
allowances and freezes existing shared constants. The initial supported owner
is the `serial-aggregate` reviewed-fixture group, with its substantive completion
and complete measurement-stage grammar. Both limits remain finite within
the existing 300-second child-owner bound. The parent leaves the existing
8-second TERM and 5-second KILL grace plus an explicit remaining allowance.
This accounting is not a universal wall-clock guarantee or an automatic rule
that another unexplained timeout deserves another increase.

Clean old-source PASS observations are retained with their actual limitations;
no new RED is required or sought. The existing diagnostic measurement binds its
collector, observer, raw output, timing-only patch and original Git preimages.
Every stage from import start through final cleanup must be present in order;
overlapping I/O costs are not added to the complete elapsed interval. A separate
explicit development capture runs
the final published direct control and actual registered parent. Each retains
collector bytes, exact command/loader, all Git and physical tracked source,
JSON/config inputs, prepared dependencies, runtime and complete effective
environment before/after, raw final-tail output, lifecycle and owned cleanup.
Both observations also bind the complete current production input inventory.
The actual parent inventory is derived from source. A changed final source/input
closure needs a new observation. Neither witness readers nor preparation run
these commands, collect authority or reserve an invocation. Controlled checker
fixtures may replay synthetic records; they are not historical incidents,
product Browser evidence or substitutes for the final real captures.

Material and observations precede successful read-only preparation. That exact
published source, general evidence semantics, measured allowance, current input
commitment and physical lineage then require independent acceptance. Both the
authenticated review and separate prospective grant bind the explicit evidence
kind and its limited claim. The kind remains committed through commission
identity, original proof replay, receipt/stock and the sanitized export, whose
structural status still supplies no independent attestation or deciding stock.
Inherited serial accounting, exclusive successor and one-shot consumption are
unchanged. No acceptance/grant is required to produce a non-reserving target.

The production reader owns the four-paragraph material-source delegation. It must
be unedited, genuinely new and later than the physical predecessor's completion.
Real non-reserving preparation precedes separate independent acceptance of the
published source and commitment. Only then may the authorized operator faithfully
record that judgment and publish a separate commission beginning:
`Authorize one NEW prospective v7 reviewed_revision commission for a material source correction.`
Acceptance and commission retain:
`Historical windows remain UNKNOWN; all prior commissions, issued limits, consumed invocations, receipts and false stock remain unchanged.`
The grant binds source, predecessor, delegation, review, commitment and exactly one
admitted deciding invocation, with reservation/interruption consumption, zero
unchanged-target retry/extra recovery, separate fresh-process stock and independent
result audit. Preparation, source acceptance and synthetic controls grant no
execution authority. Fresh current-main, published-source, runtime/header,
complete input, Companion, ownership and capacity admission still precede Full.

`node scripts/prepare-local-canonical-material-source.mjs <material.json>` is a
thin read-only caller of the existing preparation owner. It checks the current
authenticated Draft PR, genuine unedited conditional delegation and permission,
completion ordering, physical latest tip, source/runtime/inventory, Companion
and current compiler bytes when applicable. Its material has no execution
authorization or accepted-review field; it acquires no capability, lease,
reservation, successor or consumption.

Rollback removes prospective admission; it never deletes historical proofs,
markers, grant identities, consumed reservations or failed receipts. Older readers
may refuse the new discriminator. Retain each admitted reader and originals for
historical reconstruction instead of editing receipts or claiming compatible stock.

##### Measured external-response integration allowance

`registered-integration-child-budget-v1` is a distinct evidence kind in the
one-use, inventory-bound material-source lineage. It covers the registered
external-response child in the integration supporting lane. The exhausted
predecessor must have a settled natural integration-parent failure and separate
false stock. Its original untruncated physical log must show the registered
child's sole bounded timeout, a completed withdrawal checkpoint, no recovery
completion, and settled owned cleanup. The other integration lane must have
settled naturally before that child started. Earlier outcomes and the historical
UNKNOWN cause are retained.

The explicit development collector runs
`npm run test:integration -- --external-response-only` through the existing
registration, child environment, resource ownership and concurrent-group
runner. That selection reports one focused child. Complete integration still
selects all registered children with both lanes. The old-bound and final
observations bind complete clean Git and physical source, the real loader,
prepared dependency identities, runtime, isolated environment, owned lifecycle
and both complete input inventories. The original diagnostic observation
reports the fixture size, monotonic operation intervals and main-thread CPU,
completed canonical inspections, journal progress, startup and cleanup.
The complete original parent log and all raw observations are retained.

The selected child's new deadline is the old deadline plus one measured
recovery interval, rounded up to the next 10 seconds, within 300 seconds.
The parent phase bound remains fixed and must retain the existing 8-second TERM
and 5-second KILL settlement allowance beyond the adjusted child at the
observed historical prefix. The final focused capture must pass naturally.
The exact accepted external-response test bytes are restored after diagnostic
capture. No other suite registration or parent executor can change between
measurement and final capture, apart from the selected deadline and separately
reviewed evidence owners. Before measurement, changes outside that closure
must match adopted main entries or reproduce a conflict-free three-way merge
of regular blobs from the accepted source, common ancestor and adopted main.
A later adopted prose-only main delta may carry forward the original measurement
without relabeling it. Execution changes require a new measurement. The final
focused capture and preparation still bind the complete current target.
This decision records measured progress in development and leaves the complete
planner-selected qualification to the subsequently authorized invocation.

For this kind the owner reads the visible cohesive external-response completion
delegation format with an accepted starting point, an operative finite
workload allowance, conditional publication of one prospective commission,
and preserved physical predecessor and consumed authority. It authenticates
the linked receiving review of the starting source, exact worktree, unedited
delegation, maintainer permissions and order. The product-defect delegation
format remains separate. Non-reserving preparation checks the final source,
inventory and current prepared inputs before independent review. The subsequent
review and grant bind the exact repository, branch, proof schema, source,
commitment, inventory, runtime, predecessor, delegation and explicit measured
claim. The distinct grant begins
`Authorize one NEW prospective v7 reviewed_revision commission for the measured registered integration allowance.`
It permits one invocation and retains the same reservation, settlement,
authentication, freshness, history, separate fresh-process stock and independent
result audit requirements. Reservation or interruption consumes that invocation.

##### Generated declaration stock lifecycle correction

The registered source witnesses freeze the complete focused source, including
`next-env.d.ts`. Preparation and reservation still require that exact current
source, loader and prepared dependencies. Stock first replays the immutable
witness and physical attempt. Its live source comparison keeps tracked bytes,
loader, prepared dependencies and effective inputs fixed. A changed
`next-env.d.ts` can be accepted as generated output only when its complete
bytes are a supported Next build or dev declaration and its modification and
change times fall inside a naturally settled registered root typecheck/typegen,
build or project-experience dev phase in the receipt. Typegen and build produce
the build form; only project-experience owns the dev writer window. Exact
command, root scope, invocation, input environment, source and run interval
must agree. An expected nonzero, naturally settled phase may leave valid
generated bytes; timeout, cancellation, unknown termination and incomplete
settlement cannot supply a writer window. The attempt reader verifies the canonical receipt
fingerprint before using these time windows. File ownership, permissions, link count and read stability are
checked. Missing, unexpected, linked, unsafe and out-of-window files refuse.
Stock leaves the file and the original receipt untouched.

`generated-stock-lifecycle-repair-v1` is a separate material-source evidence
kind. It requires an independently corroborated stock-reader defect on a
settled predecessor with the exact registered first-Browser failure prefix.
The reader matches the physical log, completed children, serial bounds, four
actual Browser consumers and original false stock issue set. A retained
attempt-inspection comparison must show the difference on the same original
source, receipt, inventory and authority using the exact corrected reader.
A stock replay must retain all failure and incomplete coverage issues. A
later observation cannot identify the historical internal exception, touch
subtype, generated-file writer or underlying Browser cause.

The actual final-source development capture must exercise the real D1 history
touch path with both command acknowledgements, same-document and viewport
checks, original assertions, unchanged root and Web Planning prepared inputs,
and owned natural cleanup. The typed delegation
binds the receiving review and both spent commissions. Preparation
authenticates these records without reserving. Independent exact-source and
preparation acceptance must precede a separate grant that begins
`Authorize one NEW prospective v7 reviewed_revision commission for the generated stock lifecycle correction.`
The new commission permits one deciding invocation through the existing
ownership, freshness and reservation checks. Full and fresh-process stock
still require complete Browser and phase coverage. The historical partial
Browser record and false stock remain evidence of the failed predecessor.

##### Focused prerequisites and registered dependency preparation

An installed focused prerequisite is not automatically the output of a later
clean installation. For a reviewed witness that binds prepared dependencies,
the admitted attempt retains those observations privately. After each registered
dependency child settles successfully, the input owner records its actual output
and compares it with that prerequisite before the next consumer can enter.
Content, package sources, location, layout and security identities remain strict.
A refusal preserves the successful child result and both input observations;
it does not claim npm failed. Later prepared-before/after/current comparisons
remain required. Neither matching lockfiles nor successful installation excuses
an unexplained difference. Evidence files use explicit creation modes rather
than changing the workload process's umask.

`prepared-dependency-eligibility-repair-v1` is a separate material-source evidence
kind. It retains a settled work-expectation Browser failure after a generated-stock
correction, the exact false stock and authenticated receiving revision decision.
Both original focused root/Web prerequisites must demonstrably differ from their
corresponding stable actual prepared outputs while retaining original package
sources and locations. The narrowly accounted stock comparison permits only the
retained attempt-reader and stale-base issues in addition to the ordinary strict
failed-phase issues. It neither identifies the historical swallowed exception
nor alters historical validity or applicability. Additional faults refuse.

The new evidence binds the actual final-source Browser journey, full source and
input inventory, original Node/headers, current Browser, loader, root/Web clean
preparation, process umask and natural cleanup. Bounded control diagnostics record
selectors, call sites and structural readiness, never field values or credentials.
Fast successful waits remain observable. The development controls exercise the
real input owner and sequential runner, including genuine predecessor owner
bytes, independent root/Web refusals before consumer entry, later mutation and
fresh-process stock with the existing generated-declaration writer window.
Structural fixtures are not deciding runs or reconstructed historical causes.

The distinct visible delegation binds the receiving decision and physical
predecessor. Preparation authenticates that decision and the predecessor's
review, grant and delegation. A later independent final-source/preparation
acceptance must precede a distinct grant beginning
`Authorize one NEW prospective v7 reviewed_revision commission for the prepared dependency eligibility correction.`
The existing v7 material-source commission retains all spent lineage and permits
exactly one new deciding invocation. Reservation or interruption consumes it;
there is no ordinal two, recovery or unchanged-target retry. Publication, exact
source and inventory, authority chronology, ownership, exclusive successor,
freshness, full planner workload and separate fresh-process stock still apply.
This evidence kind does not change the meaning of an older recorded kind.

##### Verifier lifecycle correction

`verifier-lifecycle-repair-v1` is a bounded evidence kind within the same v7
material-source commission. It follows a settled authority-fixture failure
whose prepared prerequisites remained eligible and whose generated declaration
has a corroborated typecheck writer-window defect. The strict historical
failure reader remains required. Only the specifically demonstrated extra
`receipt_attempt_records_unverified` issue is excluded in a local comparison
view; stored stock, UNKNOWN writer/exception and all spent history are unchanged.
Unexplained additional faults refuse.

The final-source capture runs the complete registered reviewed-revision fixture
and real clean preparation, Next dev setup, registered typecheck and build.
A separate stopped-after-typecheck path must leave build unexecuted. Fresh
processes inspect the actual generated bytes using both genuine predecessor
predicate bytes and the candidate reader, with explicit source-overlay identity.
Development receipts remain non-deciding; physical attempt/completion controls
separately establish authentic binding. Full source/catalogue, effective input
inventory, runtime, loader, root/Web dependencies, launch umask and owned cleanup
are retained. Preparation/admission keeps the early prerequisite gate and later
integrity checks. Naturally passing measurements stay PASS and do not identify
a historical timeout cause or justify an arbitrary allowance increase.

The visible verifier delegation is distinct from the product-defect format.
Its raw authenticated observation remains immutable, including literal display
line separators. A new independent exact-source/preparation acceptance must
precede a separate grant beginning
`Authorize one NEW prospective v7 reviewed_revision commission for the verifier lifecycle correction.`
It binds the full inventory and latest settled predecessor through the existing
single-use commission. Reservation or interruption consumes the one invocation;
no ordinal two, recovery, unchanged-target retry or failure-driven replacement
commission is implied. Full planner coverage, fresh separate stock and independent
result acceptance remain separate obligations.

An inventory-bound ordinal two may also follow a settled ordinal one whose Full
and Browser phases all passed naturally but whose only fault occurred in the final
Web dependency observation. The v2 Web record must have the cache-safety error
and a missing after-state. All other dependency observations, the phase and
Browser records, runtime inventory, released owners, Companion preservation,
physical completion and false stock must agree. No historical observation is
filled in. A later identical command runs each Git version of the input reader on
the retained physical tree. It must refuse the old exact-mode condition and
accept only a proven empty, more restrictive `.vite-temp` with the original
content, layout, security and package identities. Preparation and reservation
reread the retained tree. Physical replay and stock read the bound originals;
the new run establishes its own before and after observations.

This edge requires an unedited forward decision from a current maintainer on
the same PR for this exact predecessor, original commission and delegation. Its
operative section authorizes the second candidate for this final input fault.
The forward decision's opening delegation and assignment paragraphs bind the
delegation and branch/PR. Its unique `Exact historical boundary and existing
authority` section binds each labeled source, attempt, receipt, commission,
acceptance and grant field exactly once, before the bounded correction and
explicit continuation sections. Missing, conflicting or nonoperative fields
refuse before reservation. Historical appendices may describe other targets;
their prose, quotations, code and comments cannot supply an operative binding.
The subsequent source review links that decision and binds the resulting
preparation commitment. The initial acceptance, grant and two-invocation
accounting do not change. An ordinary failed phase still uses its original path.

The remaining inventory-bound v7 ordinal two may also follow its actual settled
ordinal-one PASS after an independently demonstrated material defect. This is
not a failed historical phase or a recovery invocation. The complete positive
receipt, all planned natural phase and Browser passes, unchanged prepared inputs,
settled ownership/Companion and true fresh-process stock must remain intact.
Preparation and physical replay validate those originals and the same retained
behavioral driver: natural RED on the actual predecessor's Git modules, natural
GREEN on the final Git modules, matching controlled runtime, exact driver/module
identities, output originals and complete cleanup. Cosmetic or nondiscriminating
evidence does not acquire the remaining invocation.

An unedited authenticated post-PASS forward decision must bind the operative
positive predecessor, initial source acceptance, original grant, root receipt,
commission and remaining ordinal. Its introduction must identify an operative
approved proposal, and its first complete target record cannot be
completed by later examples or history. The reviewed correction's head and base
must be ancestors of the eventual candidate and current base, respectively. After independent
final-source review, the existing subsequent contract review records an exact
plain target record: final source/base, preparation commitment, full inventory,
runtime, positive predecessor, original grant/commission, ordinal and forward
decision, immediately followed by its explicit bounded recording/authorization
paragraph. Intervening prose or examples cannot supply that permission.
This is conditional maintainer recording, not self-approval or a new commission.
The production authenticated transport supplies the capability. Admission requires
that capability's positive-tip scope to agree with the material reader; the
exclusive append and cold physical stock replay retain the original success and
one prior consumption. Reservation/interruption consumes ordinal two with zero
unchanged-target retry or extra recovery. Existing failed/spent-boundary rules
retain their independent scope; this amendment is not unlimited post-PASS authority.

Reviewed-revision controls run as serial authority registrations. Each requires
a natural exit within 30 seconds with one 15-second nested fixture. Git,
commission and successor cases pass their synthetic checkout and ledger between
registrations in the suite's private physical resource root. Each registration
retains its own environment; the suite owns the handoff until consumers settle.
The final-input case forks the unreserved synthetic first ordinal and checks
the refused predecessor and passing successor through independent stock processes.
Three subsequent registrations fork the same unreserved fixture for a positive
predecessor, material/authority controls and its successor. They retain these bounds
and cleanup owners; the additional negative controls do not enlarge a deadline.
`node scripts/run-canonical-test-suite.mjs authority
--reviewed-revision-only` selects these actual registrations with their normal
resource and cleanup owners. The aggregate has no additional registration.
The serial-material registration additionally executes three actual compiler
children and serial incident/lineage controls in its own disposable root. Its
60-second nested owner and 75-second outer natural-exit limit are focused-test
bounds only; all production serial limits and other registrations stay fixed.

The new commission's initial ordinal binds its latest tip as its root. All old
grant IDs and consumption are reconstructed from the existing exclusive chain.
An old grant, edited grant, older tip, competing edge or new root within the same
commission cannot reset consumption. Historical accepted source evidence retains
its exact scope; the new commission must postdate settlement and is not source
acceptance of later code.

A specifically authorized prospective correction may follow a blocked legacy
prepared-dependency layout/security observation. Its original classification,
receipt and separate stock remain unchanged, including missing historical
observations. This requires complete reconstructible old observations, unchanged
dependency content/package sources, a corrected input owner, applicable focused
checks and fresh safe v2 preparation checked again before reservation. Content
equality does not certify historical permissions. Unavailable observations or a
current safety/ownership fault refuse admission.

A new commission may explicitly authorize continuation after a fully accounted-for
external installed-service incident. The v7 proof then retains the original
false/blocked/invalid receipt, completion and stock, and separately binds the
responsible owner's start, settled consumers, supported restoration and independent
restoration observation to the same installed identity and new source/input target.
An authenticated receiving audit accepts that incident evidence within its stated
scope; it does not replace the earlier accepted source review or approve later code.
Only the known installed-service event with all owned resources settled is eligible.
Additional faults, missing or altered originals, ambiguous cleanup and foreign
consumers refuse. Fresh stopped/exact observations and existing checkout/capacity
owners are checked before reservation and again by separate stock. This read-only
owner check does not create a global service lock: the operator must schedule a
service-stable window through final stock/cleanup and never reclaim foreign owners.
The exclusive edge preserves the spent commission and interrupted consumption;
reconstruction requires the bound settlement originals. Old stock stays invalid.

This route requires the final clean published source, authenticated current-main
and ancestry, admitted Mac worktree, pinned Node/npm, ownership/capacity,
immutable inputs and coherent installed-state preservation. The inventory-bound
v7 continuation observes the same live/exact or stopped/exact service through
the isolated read-only owner at admission, cleanup and stock. The separate
external-restoration path above requires its stopped/exact observation. It executes the
unchanged planner-complete Full, including every dedicated Browser owner, with
unchanged assertions, deadlines, ordering, concurrency and cleanup. Stock
reconstructs the original records, authority and current inputs without writes.
Every selected phase must pass with valid stock and completed cleanup before
qualification is complete; independent merge judgment remains separate.

#### Settled ordinary browser input (source-correction v8)

A v8 `reviewed_revision` uses the same exclusive family, Full and stock owners.
It admits only an ordinary blocked v4 receipt with an observed replacement of
the selected browser executable: different bytes and inode, with the same
device, mode, owner and permissions. Recompute every recorded event. Only the
one replacement may be a fault; the observed cancellation must fall inside the
interrupted phase. Earlier phases settled, remaining phases never ran, and all
ownership, isolated resources and installed-service preservation must agree.
Original attempt, completion, receipt and separate invalid stock remain bound.
An updater's initiating actor is not necessary. This is neither a successful
old receipt nor an enumerated spawn recovery. V7 and retired routes keep their
original interpretations.

Select the new task-owned physical launcher explicitly. Its complete Mac app
and enclosing version directory must have verified user-immutable flags.
Bind content, internal links, inventory, security, location and launcher to
runtime-inputs v2. Confirm the bundle's declared executable and version and
compare the path/type/size/content/link manifest to the retained focused installation
record (an explicit JSON field, exact bytes and entry count), and retain original
structured HTTP/CDP output for the interrupted phase's browser
consumers (or a covered browser phase if interrupted outside a browser owner).
A source edit, reformatted evidence, fallback selection or an unchanged location
cannot substitute for the remedy. Managed children keep their ordinary isolated
profiles and v2 launch records; each must match the selected binary and runtime
version. Inventory and protection are monitored during execution. Admission,
phase boundaries, final settlement and fresh stock read the complete installation.
This is a cooperative safeguard, not protection against a hostile same-user actor.

The accepted product review and the independent contract review are separate
authenticated commit-anchored PR reviews. The latter may be on a linked PR
in this repository. It records `ACCEPT / RETAIN browser execution-input`,
the exact combined head/tree/base and the opaque `browserReviewTarget` commitment
to the originals, source and focused evidence and runtime inputs. A **new,
unedited** subsequent commission on the original draft PR uses the existing
bounded reviewed source/execution-input revision scope and also names the v8
schema, exact combined source, commitment and contract review URL. No parser
output or PR creation grants authority. Check the original PR's exact published
head, branch, current main and existing family before reserving; a stacked
review branch alone is not the deciding target. Both sources must be present in
the single clean integrated candidate. Run the complete planner-selected Full
and validate its original receipt in a separate process. V8 accepts coherent,
unchanged live/exact or stopped/exact preservation of the same installed
service; it never requests a lifecycle transition.
Each v8 preservation read uses the accepted checkout's observer once in a
fresh worker thread, with its own HTTP connections. The executor continues
checking input and ownership while that read is in flight. After a refusal,
the original receipt retains the rejected admission sample's comparison
results, probe availability and evaluation time separately from the initial and
cleanup observations. This diagnostic grants no execution or retry authority.

#### Source correction after the first reviewed browser execution (source-correction v9)

V8 retains its original meaning at ordinal one. V9 is ordinal two of that same
commission. The original browser interruption is the commission root. The
immediate predecessor must be its first reviewed Full with a naturally exiting
failed child, clean settlement, unchanged protected runtime-inputs v2, and
separate non-deciding stock. The existing reader replays both exclusive edges
and their original receipt, attempt, completion and stock materials. A material
source change, a diagnosis of the failed phase, and focused evidence for the
new head are required. The original browser remedy and its actual-consumer
evidence remain bound through the first edge. The executor and separate stock
still observe the selected installation and current service on the new target.

Keep the root and maximum of two in `commission`. At ordinal two its
`initial_authorization` is the first proof's exact authorization object. It
preserves the accounting identity while the new proof's `authorization` binds
the new candidate. The v9 `browserReviewTarget` also commits to this link, the
original PR, and the immediate predecessor. A preparation without prospective
authorization uses the same material, Git, preservation and ledger readers and
does not reserve. The new commit-anchored review uses the existing browser
acceptance wording and binds the new base/head/tree and target. A subsequent
new, unedited grant on the original Draft PR must satisfy the existing bounded
scope, name the v9 schema and new review URL, link the original grant's exact
comment URL, name both receipt fingerprints, and authorize the **second and
final deciding invocation**. Both grant IDs remain in the chain. After that
reservation there is no further browser successor or recovery under this commission.

The selected task Node and matching sibling headers are immutable inputs.
Header content, topology, permissions and ownership are checked at admission,
phase boundaries, final settlement and stock; expensive tree scans do not run
inside a timed child. Their bound selection reaches dependency preparation and
suite descendants through the filtered environment. Normal sequential `npm ci`
still creates the three dependency trees from unchanged package/lock inputs.
Pre-install dependency output is not frozen as an immutable input. After each
successful preparation, the input owner records the produced tree and compares
its content, topology, permissions, ownership and package/lock sources at final
settlement and fresh stock. Prepared-dependency v2 separately records raw presence,
metadata and security for only physical empty top-level `.cache` and `.vite-temp`
directories. Each must belong to the task user, match its still-bound physical
parent's uid, gid, device, directory type, special bits, owner permissions and
complete ACL, flags and attributes, and remain empty throughout the coherent
observation. Group and other permission bits may only be removed from the
parent's mode. Both recorded modes are validated as decimal directory modes;
the original values remain observable. Safe appearance/disappearance leaves
dependency code identity unchanged. Nonempty known generated directories refuse;
unknown directories remain binding. Unsafe links, permission changes and failed
observations refuse. Legacy v1 receipts retain their original interpretation,
including exact mode equality for a normalized empty `.cache` and binding `.vite-temp`. These bounded observations do not prove absence
of transient changes between their observation windows.

#### Corrected source after a protected Git observation interruption (source-correction v10)

An ordinary isolated Full can settle after the Git metadata reader raced and a
later sample measured a changed protected branch configuration. V10 accepts
that ordered pair only. The first fault remains `unknown_relevance`. The
retained hashes identify two observations without reconstructing the intervening
settings or their writer. Keep the complete original receipt, attempt,
completion and false separate stock. Check full phase order, the cancelled
child, released ownership, isolated cleanup and coherent installed-service
preservation. Other unknown faults and changes in scope or permissions refuse.

Use the existing `reviewed_revision` commission and exclusive successor of the
latest settled attempt. Review the complete predecessor-to-candidate and
current-main-to-candidate Git deltas. Bind the corrected production module and
the same retained regression on both sides to Git bytes, execution environment,
command, exit and output. The pre-correction run must fail on the product
behavior and the final-source run must pass. The independent reviewer examines
that distinction, the verifier change and its refusal controls. Earlier focused
work keeps its original attribution. Only the new invocation can execute the
outstanding canonical phases.

Finish publishing the candidate and configuring its upstream before taking the
current input inventory. Preparation, admission and separate stock read the
executor's entire declared resource set using its existing policies. They
additionally bind the complete shared Git configuration observation, including
its protected projection. The normal monitor, current-head, ownership and
capacity checks apply throughout. The read-only preparation
`inspectGitRevisionPreparation` returns the `gitReviewTarget` commitment before
any authority exists. It checks the latest ledger tip, current main, clean
branch, source, witnesses and fresh stable inputs without reserving an attempt.

Preparation, admission and separate stock finish immutable material and physical
lineage validation before acquiring their final current observation. One call may
reuse its exact validated material only within that operation: bind every read
to its bytes, file identity, safe path/permissions and physical lineage entries,
and reject mutation before use. No reusable validation token, cross-call cache,
new authority or accounting allowance is created. Admission freshly authenticates
authority, then uses the production observer's complete input inventories around
the coherent Companion read. Current publication, source, dependencies, input
faults, cancellation and ownership checks still apply. Evaluate the unchanged
60,000ms real-clock preservation bound after all remaining blocking checks,
immediately before exclusive successor append. Missing, future, stale or
incoherent observations refuse without a reservation. Preparation remains
non-reserving; stock independently rereads current inputs and repository identity
and checks freshness at its final assessment boundary. Delayed validation never
renews an observation or repairs an earlier refused receipt.

The authenticated commit-anchored review covers the **published corrected
source**, commitment and predecessor fingerprint. It starts with the standalone
line `Source review decision: ACCEPT / RETAIN for prospective qualification.`
An unedited prospective commission on the same Draft PR follows that review and
starts with the standalone line `Authorize prospective Mac qualification of this
reviewed Git-observation successor.` Include the schema, branch, current base,
head, tree, predecessor fingerprint, commitment, exact review URL, separate
fresh-process stock and independent audit scope. Reuse v7's authenticated
maintainer-level reader, existing commission consumption and append-only ledger.
The implementation owner's preparation, a negative predecessor review or a
reservation alone confers no authority. Run the unchanged planner-complete Full
and validate the resulting receipt with separate stock under the same inputs.

If that first reviewed Full settles with a natural child failure, ordinal two
can qualify a material source repair. Retain both failed receipts, both false
stock results, the physical attempts, completions and first proof. Replay the
first edge and require the latest receipt's full phase order, accounted stock,
stable input binding, released ownership and preserved Companion. The second
proof takes its accounting identity from the initial accepted source and
authorization, the same commission root and its original maximum of two.
Current source acceptance and execution authority refer to the new target.

Run the implicated executable test on the first and corrected source with
the same command and canonical runtime. Bind both Git blobs, the failing and
passing child results and their output, the diagnosed phase and the complete
Git deltas. Non-reserving preparation checks the new inventory, the physical
tip and its single consumed ordinal. A different commit with the same tree,
a whitespace-only edit, stale materials or a competing reservation refuses.

After independent source review of the published target, a separate unedited
grant starts with the standalone line `Authorize ordinal two of the original
reviewed Git-observation commission.` Include the original accounting
identity and root receipt alongside the new candidate, predecessor, commitment
and review required above. Link the initial grant, the task delegation and the
new review. Record reviewer and submitter provenance when recording the decision
or grant under delegation. The delegation opens by authorizing the correction
and qualification assignment for its issue, branch and Draft PR. Its operative
paragraph under `Delegated recording after independent review` expressly
delegates publication through the maintainer identity after independent
acceptance of the published source. Use visible prose, headings and links.
Raw HTML, quoted or fenced examples, investigation-only scope and a file-mode
change without a material source change refuse.
The authenticated reader checks current maintainer
permission and the original review and grant references. The physical
successor consumes the remaining ordinal on reservation; replay through
separate fresh-process stock is read-only.

#### Proposed stable protected Git-input target within v10

Proposed v10 TS compatibility (requires separate adoption): a naturally settled
failed phase may retain partial Browser records only for its declared consumers,
within their count ceilings and with valid unchanged identities. Passing phases
still need full coverage, NOT_RUN phases stay empty, and exact false stock must
account for every missing record. No timeout, input fault or unsettled child is
made eligible.

An ordinal-two source remedy may use the existing project-client Canonical TS
command with exactly `node --import tsx scripts/test-project-client-browser.ts`
and no other arguments. Use the explicit regression attribution
`candidate-driver-prior-implicated-source`. The candidate driver and controlled
fixture stay identical in both runs; only named existing, materially changed
implicated scripts use predecessor bytes for RED. Bind the entire effective
tracked-file catalogue (path, mode, byte size and SHA-256) through a separate
existing artifact reference in each witness's `source_files`, read with the
existing 2 MiB explicit evidence bound. Keep each witness within its existing
512 KiB bound; never inline the full repository catalogue. Bind exact driver
source, fixture paths/digest, implicated modules, environment, existing runtime
identity, natural exit/streams/cleanup, timestamps and stdout. This attribution
must never be described as an untouched predecessor checkout.

The literal loader name and lockfile are not installed dependency identity.
Use the existing v2 `observePreparedDependencyInputs` owner for root dependencies
immediately before and after each focused child, after attributable successful
clean preparation. All four retained `prepared_dependencies.before/after`
observations must have the same validated identity, exact current repository
node_modules location and Git-bound package/lockfile sources. This binds tsx,
esbuild, React and the complete installed root tree, permissions and links.
Existing safe generated-directory equivalence remains; missing observations,
changed loader bytes, moved roots, unsafe layouts or a substituted snapshot
refuse. Capture these observations at execution time, never reconstruct them
from a later scan or just from a recorded lockfile. Existing current input and
preparation/stock checks remain separate. The unchanged canonical environment
owner must exclude ambient preloads, NODE_OPTIONS and module-path overrides.

Independent exact-target review must inspect the complete driver, fixture and
implicated delta, response hold/release and original assertions, real dependency
observations and natural causal failure. Diagnostic changes alone, unrelated
edits or a wrapper that manufactures RED are insufficient. Structural witness
validation cannot establish causation on its own. The existing current review/
grant, immutable history, full inventory, physical successor, settlement and
finite accounting still apply. Old mjs witnesses keep their original predicates.
Old readers refuse the new attribution; no proof may be relabelled for rollback.
Focused correction evidence is not automatically an admissible witness or grant.



The optional commission discriminator
`input_revision: "stable-protected-git-input-v1"` proposes an input correction
alternative for the **first** v10 ordinal. Its development and fixture validation
do not adopt new execution authority or authorize renewal of an existing PR.
Adoption and the exact prospective execution grant remain separate decisions.
In particular, #1612 remains SOURCE ACCEPT / RETAIN and qualification HOLD until
a separately authorized complete qualification and separate stock succeed.

This alternative retains the same ordered metadata-consistency observation
failure followed by protected Git input invalidation, complete historical
receipt/stock checks and settled physical predecessor. The first window remains
UNKNOWN. Operator attribution does not reconstruct its contents or prove that
no other transient change occurred. Additional unexplained faults, changed
permissions or scope, unsafe files, incomplete cleanup, unsettled owners and
unsupported lineage still refuse.

The material difference is between the original frozen protected input and the
prospective stable input, not a manufactured product failure. The current Git
resource must have the original location, protected branches, scope and safe
permission identity, and its protected projection must equal the recorded later
observation while differing from the original freeze. Current origin must match
the original repository; the branch must track its own origin branch, whose
published tracking ref names the candidate head. Complete publishing and
upstream configuration before the new inventory. Touching a file, relabeling a
proof, moving the checkout or changing a runtime label cannot establish this
remedy. The original Node path and content remain fixed.

Reuse the existing v3 input snapshot as `focused.input_inventory`, with
`input_remedy_resources: ["git-config"]`, an empty `implicated_paths` array and
no product RED/GREEN `regression`. Its fingerprint and complete inventory
commitment must agree with the actual executor inventory. The existing
`observeGitRevisionTarget` returns that snapshot and observes the complete
inventory twice around the fresh Companion read. Preparation, authenticated
admission, in-flight monitoring, commit/settlement and separate stock keep their
existing checks. No old phase pass contributes to a new deciding PASS.
Current publication checks belong to preparation, admission and current stock.
Historical lineage replay checks retained proofs and original physical records;
publishing a later legitimate source correction must not invalidate an earlier
edge merely because the tracking ref now names the successor.

The predecessor-to-candidate Git delta must leave product sources unchanged.
Only the existing verification admission, input, receipt/export, executor,
regression/suite registration and corresponding policy/03/04 documentation
owners enumerated in the reader may differ. Their complete Git delta identifies
the verifier implementation independently of the retained product source.
The current head/tree may equal the product candidate when the applicable
verifier is already present. The complete candidate and current-main delta,
actual natural focused results, original invalid evidence and new inventory
are independently reviewed; a fixture or preparation is not that review.

Use the existing commit-anchored ACCEPT / RETAIN review and subsequent
authenticated, unedited execution grant. The first grant line is
`Authorize prospective Mac qualification of this stable Git-input target.`
Both operative records include the discriminator and the explicit boundary:
`Historical window remains UNKNOWN; original false stock and consumed invocation remain unchanged.`
They retain the normal exact repository/branch/base/head/tree, predecessor,
target commitment, review link, fresh stock and independent audit requirements.
Missing current authority, stale review/inputs or a quoted example refuse.

The discriminator participates in the existing commission identity and cannot
be added, removed or changed between ordinals. The same exclusive successor
reservation consumes an invocation before execution; competing processes,
replay, interruption, a new label or checkout cannot reset it. No ledger,
wrapper, extra retry or new quota is introduced. Any second ordinal still
requires v10's natural failed first Full, material source repair, causal
RED/GREEN and fresh independent acceptance and execution authority.

Unmarked v10 records retain their production-source correction predicate;
ordinary qualification, source corrections, supported recovery and retired
routes retain their meanings. Existing receipts and false stock are immutable.
Rollback to a reader without this discriminator refuses new marked proofs;
preserve them with their verifier revision rather than removing the marker or
reinterpreting them as old v10. The maintenance proposal qualifies through the
current ordinary planner/authority, never by granting itself this alternative.

### Completed source-correction routes v3-v6

The task-specific observer repair, corrected timeout, condition requalification
and GuideBrief correction routes are retired. Their original policy and results
remain historical; see [Retired qualification routes](#retired-qualification-routes)
for the pinned reader and current refusal behavior. Product regression coverage
for the corresponding fixes remains in its existing owners.

### Completed Browser input replacement (receipt version 5)

The task-bound Browser replacement route for #1545/#1546 and its strict
source-correction v2 continuation are retired. Their receipt version 5 and
private export version 2 remain historical evidence. Current admission, stock,
export and lineage readers refuse that lane, including downgraded schemas and
false/null Browser authority or consumption markers. The retired CLI option
refuses before admission; it cannot become an ordinary attempt.

Use the reader at `b057069e2ebbafe36acaa84736e9742b19c32547` to interpret
unchanged historical originals in a separate read-only review context. That
source grants no fresh execution. The shared Browser input, bundle and actual
launch guards remain with their existing owners; their presence grants no
replacement authority. Ordinary receipt v3/v4 and live `reviewed_revision`
continue through their existing current rules. See
[Retired qualification routes](#retired-qualification-routes).

### Private review export

The sanitized `augnes.local-canonical-private-review.v1` derivative links the
original local receipt fingerprint, schema/policy, source and input identities,
actual toolchain/Browser observations, phases, attempt lineage, cleanup and
limitations. It excludes configuration projections, environment values and raw
logs. Its own fingerprint detects modification, not authorship. Off-host
structural review is not local qualification or independent attestation. The
original context-bound stock validator remains required; legacy receipt bytes
and dispositions are preserved.

Create that private derivative with `npm run verify:local:export -- --receipt
.augnes-local-verification/receipts/<receipt>.json`. It writes a new file in
`.augnes-local-verification/review/` without overwriting an existing export or
making a deciding claim. The stock local validator also checks the immutable
attempt/completion records and current declared inputs; an export cannot replace
those records or be copied back as an original receipt.

For verifier-integrity changes, freeze the accepted-base Full phase inventory
and acceptance conditions, run the integrated disposable adversarial controls,
and compare old/new behavior before freezing the candidate. Those controls do
not replace the accepted Full workload or independent source/evidence review.
The candidate cannot exempt its own tests. Existing historical failures,
cancellations and preservation exceptions are never promoted by this contract.

Validate a receipt against the current repository:

```bash
npm run verify:local:receipt -- \
  --receipt .augnes-local-verification/receipts/<receipt>.json
```

For an isolated receipt, include `--checkout-context isolated-worktree` and run
validation from its original admitted checkout. Copying a receipt to another lane
cannot qualify that lane, even when source commits match.

Validation exits nonzero unless the receipt is currently valid deciding
evidence. It rejects or marks non-deciding a receipt when:

- current `HEAD`, origin, branch/detached state, worktree cleanliness, or environment identity differs;
- the fresh authenticated `main` observation is unavailable or differs from the
  recorded base, or current ancestry cannot be established;
- integration-base provenance is missing, inconsistent, wrongly timed, or
  tampered; historical version 1/2 receipts remain historical and are not upgraded
  into newer evidence; version 3 keeps its original interpretation and is never
  rewritten or promoted into version 4;
- required checkout ownership was not acquired/released for the phase lifetime,
  failed, or belongs to another physical checkout;
- the admitted context, physical checkout, receipt filename/run identity,
  invocation, capacity lifetime or isolated-resource cleanup differs or is invalid;
- isolated evidence acquired production maintenance or observed a changed service;
- any lockfile fingerprint differs;
- executor source fingerprint or selected plan differs;
- content integrity or required fields are invalid;
- a selected phase is missing, skipped, failed, timed out, non-finite, or has
  incomplete cleanup or remaining owned processes;
- the final result is not pass;
- the canonical Node policy does not match;
- the receipt is quick/dirty/non-transferable.

When deciding execution is required, a later commit requires a new exact-head
receipt. Earlier receipts never transfer to another head. Ordinary documentation
and bounded static documentation checks require no receipt; an optional
`documentation-only` executor receipt is always non-deciding.

## Pull-request evidence

For changes requiring deciding execution, the Draft PR records the exact
repository, base/head,
branch, origin check, Node policy and actual Node, lock fingerprints, selected
plan, every command/result/duration, intermediate failure and correction,
cleanup, zero remaining owned processes, repository-relative final receipt
path, fingerprint, and successful receipt validation. It also states:

- each deciding execution occurred once for its exact target on the shared local Mac;
- the verification context and any observed concurrent capacity/cleanup limits;
- no generated receipt or raw log was committed or uploaded;
- no GitHub Actions or other hosted/self-hosted CI ran;
- no status check or independent attestation was fabricated;
- which task-owned verification checkouts were used and how unrelated work and
  installed state were preserved.

For exempt prose or static documentation responsibilities, record the exact diff,
responsibility/consumer findings, applicable focused results, unresolved limits,
and why deciding execution is not applicable. No fabricated planner result,
runtime PASS, environment qualification, or receipt is required.

The PR body is review material, not a machine-published status. Local Canonical
has no pull-request comment, status, check-run, deployment, review, label,
merge, Ready, auto-merge, or repository-setting write path.

## Repository execution and transfer boundary

`.github/workflows` must remain empty. Do not add a dummy workflow, reusable
action solely for hosted execution, GitLab or another CI provider, a
self-hosted GitHub runner, launchd service, Docker/VM requirement, background
automation, or automatic publication.

The repository is a temporary development location. Harness commits use Augnes
product names, repository-relative source paths, ordinary Git history, and no
repository-specific product identity. This keeps the history suitable for a
later separately authorized transfer. The current hard repository root/origin
gate must be deliberately reviewed in separate work for the eventual
destination; this repository does not contact or modify that destination.

## Retired qualification routes

The completed #1594 workload routes `spent-acquisition-reviewed-workload-v1` and
`spent-terminal-git-successor-workload-v1`, their two dedicated fixtures and the
unregistered `local-canonical-authority-scope.mjs` probe are retired. Their exact
source and complete historical reader are pinned at
`d72c0f3dc5b224c02a44033d9ed83eb3eb5af3fb`. Use that revision's attempts, receipt
and review-export owners in a separate read-only historical review context.
Retain original proofs, receipts, logs, reviews, consumed grants and physical
edges byte-for-byte; source rollback does not reopen any consumed allowance.

Current admission, preparation, receipt/stock/export and physical reconstruction
refuse the `commission.reviewed_workload` field, including false/null markers,
and schema downgrades. Preparation, admission and physical stock reconstruction
also refuse mixed chains with a later otherwise supported tip. A structural
private export does not traverse physical ancestry and cannot establish that a
retired predecessor is absent. There is no current-code fallback or copied
controller archive. The merged #1594 r13
Full/Browser PASS and separate valid stock retain their original attribution;
this cleanup does not revalidate or rewrite them. Normal v7, Browser v8/v9,
Git v10, acquisition and reusable material-source controls remain current. The
material-source fixture now spends a supported acquisition predecessor directly;
its real production readers, natural behavioral failure/correction, authority
refusals, preservation and exclusive/interrupted consumption remain covered.
Scope-parser refusals remain in the registered Git-observation fixture. Fixed
budgets, scoped synthetic clocks and tracked child ownership are retained.

The completed #1559 closeout and the `companion_readiness_timeout` v7 route are retired
from current admission, stock/export dispatch, and default regression execution.
Their exact historical source and policy remain in Git at
`f9581878dc36d189c48edcdd494cc500f91f1b30` (merged by
`ebb1d8f075a28e78c985f27787ee31650af8dd33`). Retain original receipts, proofs,
failures, reviews and consumed edges without rewriting or deleting them.

The completed #1561 `operating_profile_efficiency` and
`settled_successor_budget` routes and their dedicated fixtures are also retired.
Their last accepted source and policy are archived in Git at
`df920cd3f5c35774ad2743500a6f3657e4ecb95e`. Current admission, receipt inspection,
stock and export refuse their schemas, kinds and authority/consumption markers,
even on downgraded or malformed records. Reconstructing a chain containing either
route deliberately fails with `qualification_route_retired`, including a later
`reviewed_revision` tip. It does not skip retired edges or reinterpret them as
ordinary attempts. Other branches sharing the anchor remain independently readable.

For that mixed history, inspect the unchanged originals with the reader from
`df920cd3f5c35774ad2743500a6f3657e4ecb95e` in a separate review context: the
`local-canonical-receipt.mjs`, `local-canonical-attempts.mjs` and
`local-canonical-review-export.mjs` owners at that commit retain its interpretation.
Git supplies the source archive; there is no copied controller archive or fallback
in current code. This is historical reading only, never execution, renewed
authority or new deciding stock. The accepted #1562 r11 receipt and separate
stock remain complete original evidence and are not revalidated by this cleanup.

The completed observer-repair v3 (#1548), corrected-timeout v4 (#1556),
condition-requalification v5 and GuideBrief-correction v6 (#1558) controllers,
their four dedicated fixture files, and their shared dispatch and registrations
are retired together. Their last current source and complete historical reader
are pinned at `b057069e2ebbafe36acaa84736e9742b19c32547`. Current proof admission,
receipt/stock/export inspection and lineage reconstruction refuse all four
schemas, their kinds, and their authority/consumption markers, including false
or null markers and schema downgrades. A mixed chain containing one of these
routes also refuses with `qualification_route_retired`; use that pinned Git
reader to inspect the unchanged original records, never to renew execution.
Shared observer diagnostics, source/input binding, Browser input safeguards,
ordinary source correction and `reviewed_revision` remain current. The live v7
controls use a settled ordinary predecessor and continue to verify rejection of
mixed retired chains. Removed explicit control flags refuse rather than run the
default suite. There is no new controller, archive copy or fallback.

The Browser replacement controller, dedicated replacement fixture, fixed
#1546 GitHub authorizer and strict source-correction v2 continuation are also
retired at the same `b057069e2ebbafe36acaa84736e9742b19c32547` reader. Receipt
version 5 refuses before current Browser-path or machine-identity observation;
unchanged originals and consumed successor edges are never rewritten or reset.
The unchanged Mac Full phase inventory used by the live v7 route now belongs to
`local-canonical-attempts.mjs`. Generic Browser selection, bundle/identity checks,
guard lifecycle, wrapped network sandbox construction and their focused owners
remain supported. No replacement authorizer or execution allowance is introduced.

Current tooling refuses retired markers on recovery proofs, earlier attempts in
a recovery pair, and Browser-use records even on downgraded receipts. Neither
stock validation nor private export can turn them into current evidence. Retirement creates no
new attempt, grant, retry, recovery, or permission to reset an existing lineage.
Schema v7 alone is not a retirement marker: the parallel `reviewed_revision`
contract uses the same schema. Its complete proof, authority, input and lineage
validation remain intact. Its revision and settlement controls are registered
independently through `--reviewed-revision-controls`. Unknown contracts
and malformed records cannot fall through to ordinary admission or legacy
receipt/export handling; a changed kind or removed marker is not validation.
An independent ordinary branch follows the unchanged ordinary admission rules.
For historical interpretation or export, use the original source revision in a
separate read-only review context; old authority does not permit new execution.
An intact historical receipt is not current deciding evidence for a changed head.

Product behavior, product regression tests, Companion fixture repairs, the
execution-versus-cleanup accounting fix, and the fixed shared auxiliary budgets
remain. The shared budget file is retained because other current harnesses use
it; its name is historical provenance, not continuing #1559 authority.

This retirement does not exempt executable changes from the existing planner or
claim Mac qualification from cloud checks. Use directly affected focused checks
for development feedback; report deciding verification separately when applicable.
Do not reconstruct historical failures or rerun unrelated product benchmarks
merely to retire a completed route. Do not import or reset a concurrent owner's
unmerged source, records, or consumed permissions.
