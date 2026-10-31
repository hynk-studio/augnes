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
| Registered authority/contract documentation | `operating-policy-only`; exact-tree validator and the affected static policy contract. Review material authority changes explicitly. No runtime Full Canonical merely for wording or file count. |
| Proven documentation disposition (path or anchor) | Incoming-reference validation against the proposed tree, plus owner/consumer/retention review. An anchor removal is reported even in an otherwise ordinary edit. No runtime PASS is claimed. |
| Unknown or unsupported consumers/disposition | No cheap exemption. Preserve the conservative plan and resolve the material obligation in review; Full Canonical alone cannot prove safe deletion. |

The existing change-owner manifest records the audited documentation owners and
one reference-safe supporting-analysis disposition family. Root `AGENTS.md`,
README, verification/reduction policy, and PR-template combinations retain their
bounded static coverage. The root agent-instruction marker has real hook/installer
consumers and must remain intact; harmless headings are not machine contracts.
Registered vNext owners retain meaning review and reference checks. vNext `02`
remains excluded from this narrow admission because the managed-delegation
security test consumes it; no runtime or security consumer is silently exempted.
Nested agent instructions, executable/package Markdown, unknown test consumers,
unsafe modes/statuses and unregistered path dispositions remain conservative.

For a registered authority/contract edit, run the standalone validator with
`--plan operating-policy-only`; for the verification-policy family also run
`node scripts/test-local-canonical-verification-contract.mjs --head <exact-head-sha>`
(the documentation is read from that Git tree). This is bounded
static feedback, available without dependency installation or canonical-machine
availability. The existing optional Local Canonical operating-policy executor
still runs its five dependency-light contracts when explicitly invoked; its
receipt describes only those contracts, not product runtime qualification.

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
affected Markdown/reference checks. The planner and validator also report any
required static policy contract; run it separately for mixed changes. A runtime
receipt does not replace that focused check. Full plans retain the same focused
documentation obligations in addition to runtime qualification.

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
forbidden. Existing child/phase bounds and two-lane integration concurrency are
unchanged. Bounds limit hangs and settlement within supported CPU/memory/disk
conditions; a timeout is not automatically a performance regression or an
infrastructure diagnosis. In particular the historical settled-expired-successor
child remains one complete scenario under its existing 30,000 ms bound.

### Reviewed observer-repair succession (source-correction v3)

`augnes.local-canonical-source-correction.v3`, kind `observer_repair`, uses the
existing `--source-correction-proof` entry, append-only attempt families and
receipt version 4. It is a materially corrected observer candidate, not an
infrastructure retry or a general exception for UNKNOWN. Implementing this route,
a passing fixture, an implementation-owner statement or a repair-only review
**does not authorize execution**. No separate controller deployment or prerequisite
Full is required to prepare a candidate for independent exact-source audit.

Eligibility requires the retained original receipt, attempt and completion bytes
and their SHA-256 identities. The original must have a single undiagnosed
`browser-executable` observer failure, `unknown_relevance`/blocked outcome,
complete input inventory and preceding or subsequent independently valid
`incidental_executable_metadata` events for that same shared executable. Every
event is reconstructed; unrelated faults, secondary faults, diagnostic invention,
exhausted event inventory, timeouts, other phase failures and incomplete cleanup
refuse. The Full phase inventory must be complete, with a PASS prefix, one
observer-cancelled phase and only NOT_RUN afterward. No PASS phase transfers to
the successor. The original exception and historical cause remain UNKNOWN.
This predicate is intentionally narrower than all observer failures.

The proof binds the latest settled predecessor, complete predecessor-to-repair
and predecessor-to-final binary Git deltas and path inventories, exact reviewed
repair head/tree, final base/head/tree, original records and deterministic
before/after witnesses under one fixture, environment and Canonical Node. Common
source-correction witness checks still require natural child exits, expected
failure then success, time ordering and complete cleanup. The accepted observer
module, deterministic observer fixture and discovery correction must remain
byte-identical in the final candidate. Final task changes relative to the freshly
admitted main are limited to the existing observer/succession, transport,
receipt/export/executor, focused-test and policy owners enumerated by
`local-canonical-observer-succession.mjs`. Normal upstream movement is reconciled
by the exact base and reviewed final delta; this is no planner exemption.

Three remotely attributable records are required: the accepted repair review,
an independent review of the **final exact candidate and succession evidence**,
and a separate explicit execution grant posted on the same PR. A repair-only
review cannot double as the final review. The proof carries the PR number and
review/comment identities; no issue-specific bypass or grant is embedded in
source. The existing bounded authenticated GitHub GET transport reads each
record and current maintainer/admin permission. Expected author, body hash,
timestamp, source commit, destination, role and evidence binding must match.
Unavailable, edited, stale, reordered, mismatched or unprivileged records refuse.
There is no local approval flag, file or environment fallback. A detached local
proof is inspectable evidence only.

The final review and grant each contain exactly one
`augnes-observer-repair-authorization` fenced JSON record. Its common fields are
returned by `observerAuthorityBinding(proof)` (schema
`augnes.local-canonical-observer-authority.v1`, evidence fingerprint, final
base/head/tree, original UNKNOWN disposition/cause, Full workload, separate stock
validation, initial 1/recovery 0). Add `review_id` and the explicit role/decision:
`independent_review` / `accept_exact_observer_succession`, or
`execution_grant` / `authorize_one_full_zero_recovery`. Hashes bind the observed
metadata returned by `observerAuthorityObservation`, not an invented signature.
The grant cannot predate the final review; the accepted repair review must
postdate predecessor settlement. These are cooperative authenticated attribution
checks: a shared GitHub account does not cryptographically prove which human or
model performed a review. Independent exact-source audit remains a separate
responsibility, and a reviewer must not represent the implementation owner as
independent. Synthetic test transport responses never grant production authority.

After those checks, normal fresh Mac admission still requires exact clean source,
authenticated current main, registered isolated worktree, pinned runtime,
capacity and checkout ownership, preserved inputs/Companion and the unchanged
planner-selected Full workload. The predecessor's existing `correction-successor`
namespace admits one exclusive edge across all successor kinds. A reservation
interrupted before attempt creation remains consumed and blocks replay; it is
not rolled back automatically. Older, unsettled or superseded tips refuse.
The special successor has **one Full and zero automatic or explicit recovery
invocations** under this route. It is terminal for this grant even if it fails.
Changing branch/family, deleting records, returning to the original conditional
allowance, phase stitching and a second successor are forbidden.

The separate stock validator freshly reconstructs source, evidence, latest
lineage, immutable edge, original bytes and authenticated authority without
creating a reservation. Receipt/export carry bounded source/evidence and
attribution identities, never raw review bodies or original logs. Stock failure,
missing authority or stale environment cannot become acceptance from a local
hash. Legacy v1/v2 proofs, version 3/4/5 receipts and their original dispositions
retain their interpretation; readers unaware of v3 do not obtain a new allowance.
The original receipt is never rewritten. Focused disposable normal/refusal,
exclusive-owner race, interrupted-state and fresh-reader controls are owned by
`test-local-canonical-review-corrections.mjs` under its unchanged deadline.

### Reviewed corrected-timeout succession (source-correction v4)

`augnes.local-canonical-source-correction.v4`, kind `corrected_timeout`, permits
one materially corrected candidate after a completely settled nested Canonical
test timeout. It uses the existing `--source-correction-proof`, attempt,
receipt, stock and authenticated transport owners, with the bounded evidence
checks in `local-canonical-timeout-succession.mjs`. It is not an unchanged retry,
infrastructure recovery, general UNKNOWN exception or reinterpretation of legacy
v1/v2/v3 records. The original timeout and its historical cause remain UNKNOWN;
the outer phase's `product_failure` label alone never supplies eligibility.

Eligibility binds immutable original receipt, attempt, completion and complete
phase-log bytes and their hashes, including the receipt's original log-path,
byte-count and truncation binding. A later hash of retained log bytes must not be
represented as a hash recorded by the original receipt. The latest settled
predecessor must show one bounded nested test timeout, complete child/phase/run
settlement and cleanup, no remaining owned resources, and no unresolved input or
safety fault or other failed workload. Missing or ambiguous child evidence,
truncated logs, unknown cleanup and an older or superseded predecessor refuse.
The original full phase and child inventory is retained; no previous PASS is
reused as execution coverage for the successor.

The admitted defect is `fixed_pragma_statement_repreparation` in
`lib/db/structural-schema-contract.mjs`, on the affected nested integration path.
This is a bounded source predicate, not a loader or arbitrary corrected-timeout
override. The same deterministic fixture must naturally fail on the prior
Git source and pass on the independently reviewed corrected source under one
captured environment and Canonical Node, with actual timestamps, source/fixture
hashes and completed
cleanup. A bounded mechanism regression, including operation counts, can prove
the correction without reproducing or explaining the historical timeout. Original
assertions, workloads, registrations and deadlines remain unchanged; a weakened
assertion, removed workload or raised bound cannot satisfy this route.
The structural module and its `scripts/test-database-access.ts` regression
remain byte-identical from accepted repair to final source. The original
`scripts/test-request-bound-review.ts`,
`scripts/test-review-callback-enrollment.ts` and affected integration registration
retain their prior/reviewed/final content and unchanged timeout.

The proof binds the accepted correction review and a distinct explicit user
execution authorization on the same PR, using the `accepted_repair` and
`execution_grant` roles. Fresh authenticated reads must match their recorded
author, destination, source, body hash, time and scope; synthetic responses or a
local approval flag are not authority. Current maintainer/admin permission is
checked through the existing bounded GitHub transport. The grant must explicitly authorize the
bounded policy implementation, final complete qualification and one-Full/zero-
recovery budget. A recommendation or review alone does not grant execution.
The actual attributed prose supplies this scope; no new fenced approval record
or second final-source execution grant is required.
The reviewed correction remains unchanged in the final source. The proof also
binds final base/head/tree and complete predecessor-to-repair,
predecessor-to-final and repair-to-final deltas and path inventories. After
accepted-main reconciliation, subsequent task changes are restricted to the
route's existing policy, proof/attempt/receipt/stock, executor and focused-test
owners; unrelated product changes require separate authority. An owner-checked
final source record binds those subsequent deltas without claiming that the
implementation owner's check independently audited the new policy.

This explicit prospective authority does not require a separate policy-only
Full, prior deployment or another routine approval between implementation and
qualification. Focused normal/adverse/legacy controls, final clean published
source and normal fresh Mac admission remain required: current authenticated
main, registered worktree, pinned runtime, ownership/capacity, frozen inputs,
Companion preservation and the unchanged planner-selected complete workload.
Independent audit of the implemented policy and returned evidence remains a
post-completion decision; this route grants no Ready, merge or adoption authority.

The existing predecessor `correction-successor` namespace admits one exclusive
edge across successor kinds. Its explicit authority is consumed with that edge
and cannot renew through a different head, branch, worktree, proof, copied grant
or accepted-main integration. Interrupted reservations remain consumed; older
tip selection, deletion, family reset and successor chaining refuse. The entire
allowance is **one admitted Full and zero automatic or explicit recovery/retry**.
A failed successor is terminal for this authority. Pre-admission refusal records
no executed coverage and does not bypass ordinary ownership/capacity rules.

After the Full, the separate stock reader freshly reconstructs the original
evidence, final source, authenticated authority, immutable edge and latest
lineage without reserving another attempt. A usable failed receipt still receives
stock validation and cleanup, then returns with the failure preserved. Receipt
and supported private export retain bounded evidence/authority identities, not
raw logs or review bodies. Legacy receipts and exports keep their original
meaning; readers unaware of v4 gain no allowance. Raw historical records are
never rewritten, phase stitching remains forbidden, and a passing development
fixture or source hash alone is neither qualification nor independent approval.

### Prospective Companion readiness timeout succession (source proof v7)

`augnes.local-canonical-source-correction.v7` with kind
`companion_readiness_timeout` is a distinct route for the independently accepted
`owned_child_readiness_exit_without_setup_cleanup` fixture repair. It does not
extend ordinary v1/v2, observer v3, structural-schema v4, condition v5 or
GuideBrief v6 eligibility. The inadmissible d825 Companion v5 draft is retained
unchanged as historical material, not dispatched as main condition v5. Its
finite source profile is the prior and accepted bytes of
`scripts/test-companion-ownership-retirement.mjs` recorded by
`local-canonical-companion-timeout-succession.mjs`. The nine original scenarios,
three adverse cases, copied Companion owners, lifecycle owner, 60,000 ms child
bound and natural-exit acceptance remain unchanged.

The original must be the latest settled Full16 isolated-worktree predecessor:
five PASS, the unit phase's natural exit 1, ten NOT_RUN, preserved input/safety
flags, released leases and complete cleanup. The complete untruncated unit log
must show exactly one nested timeout: the Companion child, after eight scenario
action-PASS messages, with observed exit/closed streams and complete cleanup.
The outer unit timeout remains false; the nested child timeout remains true.
Unknown historical operation/cause and the original `product_failure` remain
unchanged. Missing, ambiguous, additional failed workloads, unresolved
input/safety faults, unknown cleanup and older/superseded predecessors refuse.

This route expressly accepts the retained diagnostic records' actual limits. One
bridge-readiness regression used identical fixture/launcher bytes and exact
prior/corrected source snapshots: prior natural FAIL and corrected natural PASS,
with complete cleanup; the final focused child covered nine original scenarios
and three adverse cases. Those executions preceded the accepted repair commit,
whose source bytes match the retained snapshot. Private HOME/temporary roots
differed, and no original per-run environment fingerprint exists. A later
environment observation is only that observation. These records are not
post-commit Git-archive executions and do not satisfy the different v2/v4
shared-environment witness contract. The initial manager supervisor-announcement
boundary remains unproved. None of this identifies the historical timeout cause.

A repository-relative proof binds original receipt/attempt/completion/full log,
all retained raw diagnostic records and their limits, exact accepted repair,
current base/final head/tree, and complete full-index native deltas and path
inventories for predecessor-to-repair, predecessor-to-final and repair-to-final.
The final delta is an implementation-owner binding, not independent policy
review. Only the listed route policy/proof/attempt/executor/receipt/export and
focused-test owners may change after the repair; other accepted task files and
existing workload registrations are preserved against the authenticated current
main plus the exact Companion control row. The accepted task inventory is
derived from the original receipt base through the accepted repair and includes
every path, even a path reverted to base or an accepted added file deleted from
the final diff. Each non-policy path retains accepted presence, mode and bytes.
Non-policy accepted-main changes must remain exact; divergent overlap with an
accepted task change refuses with a concrete reconciliation conflict. Identical
overlap is permitted. Current main must descend from the original base and be an
ancestor of the final candidate. Main advancement is never treated as new
review.

The actual accepted-repair attestation, independent review of the corrected
final policy source, and a distinct later prospective user grant must be
authenticated through the existing bounded GitHub record/permission transport.
Final policy review binds the exact final head/tree/base and complete deltas;
the a47 review and d825 audit cannot substitute for review of future code.
Preparation is staged: accepted-repair prose can be prepared without any remote
review ID, then the final policy review and execution-grant bindings use actual
returned references. Missing references never acquire placeholder IDs or
admission authority. Review and grant bind the repair, predecessor, defect,
retained fixture/launcher hashes and evidence limitations. The grant expressly
covers policy implementation, one complete planner-selected Full, separate stock
and zero recovery/retry. IDs, author, destination, source/body hashes,
timestamps and current admin/maintain authority are checked. A Page,
conversation approval, local JSON/flag or implementation-owner comment must not
be fabricated or relabeled as the required remote review/grant record. Missing
authenticated records block admission, not authorized source implementation or
focused tests.

The existing exclusive `correction-successor.json` namespace consumes this
entire grant once. An interrupted reservation remains consumed; duplicate,
concurrent, copied-proof/grant, changed head/branch/worktree, accepted-main
integration and successor-chain attempts cannot renew it. A failed successor is
terminal. Inspection, stock and export do not create or repair reservations.

After focused normal/adverse/legacy controls, the final clean published source
uses normal fresh Mac admission (authenticated main, registered checkout,
Canonical runtime, ownership/capacity, frozen inputs and Companion preservation)
and the unchanged planner's complete selected Full, including every selected
Browser owner. There is no policy-only Full or routine intermediate approval. A
usable failed receipt still gets separate stock validation and cleanup. Stock
freshly revalidates the evidence, authority and immutable latest lineage. The
private export retains bounded hashes/identities and limitations, never raw
logs. Independent audit of this implementation and returned evidence remains
required; this route grants no Ready, merge, release, deployment or adoption
authority.

### Authorized condition requalification (source-correction namespace v5)

`augnes.local-canonical-source-correction.v5`, kind
`condition_requalification`, is an explicit prospective interpretation for the
settled Project Home readiness condition failure. It reuses the existing proof
argument and exclusive successor owner. It is not a source-repair claim,
infrastructure recovery, or a general unknown-timeout retry route. No behavioral
prior-FAIL/new-PASS witness is required or accepted by this schema; the diagnosis
did not reproduce the historical state or establish a repaired cause.

Eligibility binds the actual latest settled isolated Full predecessor: original
receipt, attempt, completion, phase log and emitted child result. The complete
16-phase inventory must stop naturally at `e2e-operator-work-expectation`, with
the preceding 12 phases passing and the remaining three NOT_RUN. Its child must
have exited 1, without an outer timeout, for
`operator_condition_timeout:hydrated_expectation_project_home` in
`work_expectation_recording`. The exact active-and-hydrated Project Home selector,
45,000ms condition and 360,000ms child bounds are retained. Execution-input,
safety, settlement and cleanup faults refuse. Historical NOT_RUN environment
fields remain their original null values; they do not become executed coverage.

The retained result must equal the actual JSON emitted in the retained phase log.
The historical receipt records that log's location and byte length, not a hash.
A newly captured hash binds the preserved original available now and must never
be presented as a hash recorded by the historical receipt. The accepted private
diagnosis archive is bound by its bytes and an authenticated independent diagnosis
review. The historical missing predicate and cause remain UNKNOWN, including
after a successful future run. A standalone diagnostic pass is development
evidence only; earlier behavioral witnesses and passing phases cannot transfer.

The bounded authenticated GitHub transport reads the diagnosis review, explicit
prospective user-authorization comment, current author permissions, and the
published pull request. Exact identity, source, body observation hashes and
chronological order must match. A generic approval or local claim is insufficient.
The grant must identify the actual predecessor run/family/receipt, accepted
diagnosis archive and review, one Full/zero-recovery budget, implementation-owner
final-source binding and independent audit after completion. No separate policy
Full, prior deployment, routine intermediate independent review, or new final-head
grant is required by this prospective authority.

The final-source record truthfully uses
`implementation_owner_not_independent_review`; it binds base/head/tree, original
head/tree, both complete native predecessor-to-final and main-to-final Git binary
deltas, and sorted changed paths. The published candidate must be the exact open
Draft PR head and current main base, with auto-merge disabled and the expected
repository/branch. Changes are restricted to the closed policy/authority,
attempt/receipt/export/stock, necessary readiness-observation and focused-control
owners. Accepted migration-family and other task bytes remain unchanged. Compatible
accepted-main movement requires impact review and ordinary fresh admission; it
neither cancels nor renews authority.

The existing exclusive predecessor `correction-successor` edge consumes the
allowance once across all successor kinds, branches, worktrees, HEADs, proof or
grant copies. A crash after reservation remains consumed. The successor has one
initial Full and zero automatic or explicit recovery/retry; success, failure,
cancellation and interruption are terminal for this authority. Earlier tips,
unsettled attempts, competing claims, family resets and successor chaining refuse.
A pre-reservation capacity or admission refusal is not execution coverage and
does not consume an admitted Full, but grants no blind admission loop.

Normal current-main, registered isolated checkout, pinned toolchain, capacity,
checkout ownership, input and installed Companion preservation requirements apply.
The unchanged planner selects the complete Full, including all seven Browser
owners when reached, with stop-on-first-failure and existing deadlines/assertions.
Bounded observation records the original evaluation, never a favorable second
evaluation or altered DOM state. Raw diagnostic material stays private.

Separate fresh-process stock reconstructs original bytes, actual final source,
fresh authenticated authority, immutable edge and current lineage without creating
a reservation, including for a usable failed receipt. Receipt and private export
retain bounded identities and hashes rather than raw private logs or review prose.
Legacy schemas keep their meanings and gain no allowance. Implementation,
qualification, independent post-completion audit, Ready/merge and installed adoption
remain separate decisions. This route grants no merge or adoption authority.

### Reviewed GuideBrief correction after condition requalification (source-correction v6)

`augnes.local-canonical-source-correction.v6`, kind
`guide_cancellation_correction`, is a separately authorized meaningful correction
after the terminal v5 condition-requalification result. It does not renew the v5
grant, reopen its attempt, or admit an ordinary v2 successor. Without the new
evidence and authenticated authority, the existing terminal refusals remain.

The eligible predecessor is the actual latest settled isolated Full v5 attempt:
11 PASS phases, one natural exit-1 `e2e-operator-native-host-execution` failure at the final
unexpected-request-failure gate with count two, then four NOT_RUN phases. Its
complete receipt, attempt, completion and original log remain immutable. Input,
safety, outer timeout, unrelated failure and incomplete cleanup conditions refuse.
The private child-result derivative must be reconstructed from its original log
using the explicitly bound stderr range; no missing historical private request
pins or original refresh caller are inferred from that derivative.

The accepted repair is the closed GuideBrief cleanup/replay/refresh cancellation
verdict correction and its existing regression and explanatory ownership files.
The authenticated independent review must accept the exact repair head/tree,
three-path native delta and retained private packet. The original same-fixture
Mac prior-FAIL/corrected-PASS comparison must postdate predecessor settlement,
terminate naturally with complete cleanup, and retain its exact raw records,
source bytes and recorded dependency identities. Those records must match their
members in the hash-bound accepted packet. The earlier pre-spawn wrapper refusal
and separate inode-claim correction remain evidence; witnesses are not rewritten
or rerun for recency. This mechanism evidence does not establish original Browser
causation or retroactively qualify a historical result.

A later authenticated user execution grant on the same PR must explicitly bind
that repair, review, packet and settled predecessor, authorize the necessary
bounded succession implementation and one complete Full with zero recovery, and
require independent audit after completion. Existing bounded GET transport,
record identity/body observation, chronology and maintainer permission checks
apply. A local Boolean, arbitrary URL, repair-only review or synthetic response
is not production authority. The final published candidate remains an exact
open Draft PR head on the freshly authenticated current main, with auto-merge off.

The final-source record uses `implementation_owner_not_independent_review`.
It separately binds native predecessor-to-repair, repair-to-final,
predecessor-to-final and current-main-to-final bytes, lengths and sorted paths.
The reviewed repair's three files and recorded witness inputs stay byte-identical.
Additional task changes are limited to the closed succession, attempt, executor,
receipt/export, focused-test registration and policy owners. No input protection,
workload, deadline, product or verdict change is admitted by this route. Compatible
accepted-main changes retain provenance and normal admission requirements; they
cannot renew the allowance. Prospective implementation authority is not a claim
that the added final source was independently reviewed in advance.

The existing exclusive predecessor `correction-successor.json` consumes the new
authorization once, across competing candidates, branches, worktrees, proof copies
and successor kinds. The predecessor remains spent. A crash after reservation
does not release the claim, even if no attempt was subsequently appended. The
new successor has one initial invocation and zero recovery; success, failure,
cancellation and interruption are terminal for this new grant. No second v6 or
legacy successor is permitted. Older tips, unsettled predecessors and duplicate
claims refuse; a pre-reservation refusal grants no blind admission loop.

Normal exact-source, ancestry, pinned toolchain, registered checkout, host capacity,
frozen inputs and stopped/exact Companion preservation checks remain mandatory.
The unchanged planner and complete 16-phase Full with seven Browser owners run
with stop-on-first-failure. Separate fresh-process stock reconstructs the original
packet/source/authority and immutable live lineage read-only, including for a
usable failed receipt. No historical PASS is transferred and no stock issue is
suppressed. Implementation, qualification, independent audit, merge and installed
adoption remain distinct; this route grants no merge or adoption authority.

### Browser input replacement (receipt version 5)

`augnes.local-canonical-browser-replacement.v1` is a separate, narrowly
versioned route for a settled selected-Browser replacement safety stop. It is
neither infrastructure recovery nor a source correction. It preserves the
original disposition, every phase failure and NOT_RUN. Implementation of this
route is not an execution grant. A new proof requires independent review of
its exact verifier source, complete predecessor-to-final Git delta, current
base/head/tree, replacement artifact and execution inputs, followed by a
separate one-use execution authorization.

The production reader examines every retained input event and secondary fault,
reconstructs their classifications and checks the original receipt, latest
settled attempt/completion, unchanged permission boundary, complete cleanup and
phase stop. Only a replaced selected Browser executable with changed inode and
bytes qualifies. Other safety faults, credentials/ownership changes, unknown
relevance, independent product failures, truncated fault inventories and missing
records refuse. No earlier predecessor or old successful phase can substitute.

Use `--browser-replacement-proof <repository-relative-proof.json>` with Full
and the admitted isolated-worktree context. The proof binds the current executor,
complete workload, environment/common-input fingerprints, original diagnostic
material and exact task-owned Browser input. The existing source-correction
option and recovery option are mutually exclusive with this route. Its budget
is **initial=1, recovery=0**. Full16, Browser7 and all 19 actual Browser-use
records remain required. Unit remains bounded at 3,600 seconds and C8 at 30
seconds. No phase stitching, harness replacement or retry allowance is added.

All successor kinds use the predecessor's existing exclusive
`correction-successor.json` namespace. A Browser edge has the explicit
`augnes.local-canonical-successor.v2` kind; historical unversioned source edges
retain their interpretation. New admissions reconstruct the branch's complete
forward lineage from its original family. Duplicate/concurrent claims, cycles,
unknown records, partial claims after a crash and superseded recovery refuse.
An input successor cannot renew its budget by a recursive replacement, renamed
artifact/grant, unchanged source or a source-correction detour. A meaningful
`source_revision` may follow the latest settled strict `product_failure` through
the existing v2 source-correction proof. It retains that exact accepted Browser
binding, the consumed replacement state and **initial=1, recovery=0**. The complete
delta, same before/after regression, original receipt and settled cleanup remain
required. Fresh independent review of the exact new source and a later execution
grant must bind the existing strict-input authority record; the consumed review
and grant cannot be reused. Current source, environment, workload and inputs are
rechecked through the controller and separate stock reader. This path neither
replaces the Browser again nor falls back to legacy selection. Partial records
remain evidence; there is no automatic repair, deletion or family reset.

The Browser binding selects a complete physical mac-arm64 Chrome for Testing
app beneath the task checkout's ignored verification directory. It includes a
fixed official origin/version, locally computed archive/metadata digests,
retained codesign/spctl exit statuses and an immutable reference inventory.
Local hashes are not publisher attestation. A negative signature/Gatekeeper
assessment remains negative: a successful launch cannot change that fact.
Production acceptance must explicitly accept that exact artifact for trusted
local fixtures. There is no general unsigned-artifact exemption, re-signing,
quarantine removal, security bypass, personal profile or untrusted browsing.

The authenticated GitHub GET transport reads the exact PR #1546 review and
#1545 grant comment plus their repository-author permission. Each separately
attributable record contains a single `augnes-browser-input-authorization` JSON
block matching `browserReplacementAuthorityBinding(proof)`, its role, review
id and explicit decision. The independent review decision is
`accept_exact_source_and_artifact_for_trusted_local_fixtures`; the later grant
is `authorize_one_full_and_separate_stock`. Exact record hashes, source commit,
repository, author, timestamps and admin/maintain permission are rechecked.
Missing/dismissed/changed/unauthorized records refuse; an implementation-owner
Boolean, arbitrary URL or design approval cannot grant execution. This verifies
attribution to repository records, not the identity or independence of the
human/model behind an account. The user's actual authorization still governs.

Strict selection travels through the controller, isolated and nested children
and each launch owner. An active checkout-owned sentinel makes stripping all
binding environment keys a refusal, not legacy fallback. The sentinel and input
monitor remain active from before unit/integration through settlement. Every
launch and settlement observes the actual bundle and CLI/HTTP/CDP versions.
Missing or alternate selections and invalid versions refuse. Outside this
explicit lane, historical Browser and receipt interpretations remain intact.

For exactly the existing Darwin durable/cumulative five and project-client two
launches, the strict lane preserves the accepted-base outer network sandbox plus
`--no-sandbox`. The shared input helper validates the actual spawn tuple: the
fixed `/usr/bin/sandbox-exec`, exact existing loopback/Unix network profile,
selected executable and one retained argument for those owners. Missing or
altered protection, direct launch, unknown owner and non-Darwin strict use
refuse; spawn failure has no unwrapped fallback. The other twelve direct
launches retain their existing Chromium sandbox behavior.

These seven launches use reviewed deterministic local fixtures, disposable
profiles/databases and permitted local endpoints. The outer allow-default
network policy does not provide Chromium's additional filesystem/IPC
compartmentalization, equivalent dual-sandbox protection, or confinement of
all local services. This is a bounded baseline compatibility choice, not a
general sandbox opt-out or host-security change. Existing network/privacy and
functional assertions remain. Cleanup follows each existing process owner,
including supported normal SIGTERM; a diagnostic `Browser.close` response is
not a universal success condition. Crashes, timeouts, escalation and residue
retain their existing failure classification.

The bundle observer re-enumerates directories/files and relative internal links,
checks physical identities, ownership/mode, ACLs/flags/extended attributes and
bounded race-safe file reads. Escaping/cyclic/dangling links, hardlinks,
additions/deletions, root replacement and read-window changes refuse. A complete
metadata/security agreement may reuse content hashes during polling; initial,
launch, settlement and fresh-process stock observations rehash bytes. Limits
are 4,096 entries, 1 GiB, 8 MiB security output and 15 seconds per observation;
these limits do not extend any phase or child deadline. Monitoring remains
bounded cooperative observation, not whole-host/OS-library attestation, hostile
same-user isolation or proof that no transient mutation occurred between polls.

Version 5 receipts bind the selection, bundle observation, guard settlement and
new attempt/authority records; private export version 2 retains their bounded
identities. Fresh-process stock reconstructs them read-only from the original
admitted checkout, re-fetches the exact authority records and rehashes current
bundle bytes. Stock never reserves, repairs or rewrites an attempt, successor,
selection or machine identity. Unknown versions, incomplete records and downgrade
into legacy interpretation refuse. Failed usable receipts still require the
separate stock process after settlement. Development controls are not that run.

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

## Initial #1559 closeout after the exhausted Companion v7 attempt

The authenticated user scope in PR #1560 comment `6537722343`, posted at
`2026-10-31T02:21:00Z`, separately commissions completion of qualification and a
subsequent independent ChatGPT merge decision. It does not renew the earlier
v7 grant. The failed `9e7baa0042ead359745722caaa11c01ea1c8ddcc` attempt,
its consumed incoming edge, `product_failure`, nested service-contract timeout,
outer natural unit failure, stock findings, cleanup and UNKNOWN historical cause
remain immutable.

`scripts/local-canonical-1559-closeout.mjs` owns only the initial admission under
that new scope. Its distinct `augnes.local-canonical-closeout.v1` proof of kind
`issue_1559_closeout` is not a legacy source-correction witness or a generic
unknown-timeout exception. The owner binds the complete original receipt,
attempt, completion, incoming edge, untruncated unit log and separate stock by
fixed hashes. It binds accepted efficiency source
`fc46e56680100d130e7f61e948dd30447b0e609b`, its complete 27-path PR inventory,
two exact repair files, retained development/adverse/comparison evidence and
native deltas. Those retained comparisons naturally passed on both revisions;
they are not a fabricated prior failure or evidence of the historical timeout's
cause. The original 30-second child owner, all scenarios, identity and authority
assertions, cleanup, and existing acceptance semantics remain unchanged.

The actual receiving ChatGPT review completed at `2026-10-31T02:09:57Z`.
Its retained Page blocks are hash-bound provenance, not a cryptographic signature
or an invented GitHub review. The new authenticated scope explicitly attests the
accepted repair and commissions the final policy/source preparation; this initial
route does not require a fabricated additional pre-execution review. The final
source manifest states `implementation_owner_not_independent_review`. The
resulting policy, source and actual qualification evidence still require the
subsequent independent audit and merge decision.

The proof reader verifies accepted-task and current-main tree union identities,
including files omitted from a final diff because they were deleted or reverted.
Compatible authenticated main advancement is allowed; divergent nonpolicy
accepted-source overlap fails closed. Only the named closeout policy, attempt,
executor, receipt, export and focused-control owners may change. The accepted
fixture files and complete suite registration stay exact. Proof inspection,
export and separate stock validation are read-only and cannot reserve an attempt.
Fresh authentication re-reads the exact comment identity, content, timestamp,
current admin/maintain permission, and published Draft PR head/base with auto-merge
disabled. Locally asserted approval flags and copied or modified comments do not
satisfy this gate.

Normal checkout ownership, capacity, pinned runtime, frozen inputs, Companion
preservation and planner gates still apply. The exclusive successor namespace
allows one initial complete planner-selected Full for this proof, with no
unchanged retry or recovery under this initial route. An interrupted reservation
remains consumed; changing branch, worktree, proof or source does not renew that
initial allowance. Separate fresh-process stock must inspect the actual usable
receipt, including a failed receipt, and all original results must be retained.

This initial route does **not** declare the user's whole continuing closeout
assignment a terminal zero-recovery grant. Any later execution would require a
concrete relevant source correction or a policy-permitted environment remedy,
focused verification, and separately evidence-validated normal continuation.
No speculative continuation mechanism or automatic retry is introduced here.
The spent v7 authorization remains spent regardless of that later judgment.
Issue #1559 stays open and PR #1560 stays Draft with auto-merge disabled. Neither
this route, a passing result, nor the later merge decision performs or authorizes
an actual merge, Ready transition, release, deployment or installed adoption.

### One evidenced operational-validation correction in the same closeout

The initial closeout at `ac8d6f04eb272c3d2222f30dda26cec6d540d0a2`
settled as `product_failure`: Full 5 PASS / 1 FAIL / 10 NOT_RUN and separate
nondeciding stock with 15 issues. Its unit child, source-linked operational
continuation, reached the unchanged 45-second bound and settled with SIGTERM
at 45,107ms. The outer unit naturally exited 1 with `timed_out=false`.
Cleanup completed. The original blocked operation and timeout cause remain
UNKNOWN; another passing execution does not identify them.

The same authenticated comment `6537722343` explicitly commissions relevant
corrections and their focused verification before a further normal run. Its
original `2026-10-31T02:21:00Z` timestamp predates this failure and is retained.
It is continuing scope, not a later grant, an independent review of this new
source, renewal of the earlier v7 authorization, or an unchanged retry.

The existing closeout owner contains one finite additional profile:
`augnes.local-canonical-closeout-continuation.v1`, kind
`issue_1559_operational_validation_correction`. Its predecessor is only family
`cf31595ef308fe280f426ffc3a30321444ecc1459fae8b845c6c6937bedcc372`,
attempt `2026-10-31T03-27-52-978Z-full-ac8d6f04eb27-e3404ce46f8977b0`,
receipt `64d0e0855d829e32ab930d930a95e9f584102f4332d97888086f1675f3161cae`,
completed at `2026-10-31T03:31:49.212Z`. The exact receipt, attempt, completion,
incoming edge, unit log and separate stock remain hash-bound originals. The
initial closeout proof and all its older adjacent artifacts are revalidated
without changing their content or initial-profile meaning.

The demonstrated mechanism is repeated pure proposal validation within one
synchronous history read. A prior information-seeking diagnostic naturally
passed in 37.580 seconds. The corrected observation naturally passed in
19.528 seconds: proposal validations fell from 6,177 to 1,819 while exact
Decision/proposal relation checks remained 4,989. The observed history reads
and private snapshot factories were both 34; provenance and writer counts,
full workload assertions and cleanup remain retained. The two instrumenters
differ because the shared relation evaluator moved; their distinct bytes and
the common preload are bound, and reversing recorded insertions recovers
the exact uninstrumented source. Inclusive timing measurements overlap and
must not be summed. These single-host development observations establish the
bounded cost correction, not the historical timeout cause or a reliability
probability. Both observed samples passed; no prior failure is fabricated.

Only the exact corrected hashes of `lib/vnext/review-decision.ts`,
`lib/vnext/runtime/operator-pilot-review-material.ts`, and
`scripts/vnext-protocol-conformance/review-decision.ts` are eligible. The
prepared proposal belongs to one private immutable snapshot; every Decision,
relation and live provenance read remains validated. The complete operational
continuation child, suite/planner registrations, deadlines, lifecycle owners
and all other nonpolicy source stay exact. Necessary changes to the existing
named closeout policy/consumer/control owners are inventoried separately.
Accepted source paths that disappear through deletion or reversion, newly
introduced symlinks/gitlinks, and incompatible current-main overlap refuse.

The fixed retained focused evidence comprises the corrected observed and plain
whole child under 45 seconds, complete protocol conformance with 74 prepared
relation differential/adverse cases under its existing 300-second bound,
fresh-session semantic application under 30 seconds, and typecheck under
300 seconds. All naturally passed and fully cleaned up. Each actual source
snapshot and command remains bound; these were development overlays on ac8,
not invented post-commit executions of the future final policy source.

Normal fresh main, checkout, capacity, input, runtime and Companion checks still
apply. The sole new exclusive edge is from that settled initial closeout to
this exact evidenced correction. The initial and v7 consumed flags remain
consumed; an interrupted reservation, copied proof/comment, different branch
or worktree, cosmetic head, or another successor cannot renew this candidate.
Its attempt retains `{initial: 1, recovery: 0}`; no allowance or record in an
older family is reset. There is no generic UNKNOWN-timeout admission, generic
continuation loop, new infrastructure classification, or exception for a
future correction. A further unsupported case still requires its own concrete
evidence and applicable normal authority within the user's continuing scope.

Proof inspection and stock remain read-only. Fresh authentication re-reads
the unchanged scope comment, current permission and exact published Draft
head/base, with auto-merge disabled. The final source, this policy addition
and actual results await the commissioned independent final audit. All
16 phases and seven Browser owners still decide complete qualification;
separate fresh stock must inspect the actual resulting receipt, including
a failure. Merge, Ready, auto-merge, release, deployment and installed adoption
remain unauthorized.

### One evidenced source-scope precheck correction in the same closeout

The operational-validation candidate
`1d921d6adeedf52264485ae55480c25b0f05c53c` settled as `product_failure`:
Full 6 PASS / 1 authority FAIL / 9 NOT_RUN, with separate nondeciding stock
reporting 14 issues. Its six-second source-control child settled at 6,076ms
with SIGTERM and `timed_out=true`. The containing executor test settled at
9,993ms and authority phase at 59,896ms, both natural exit 1 with
`timed_out=false`. All cleanup completed. The log contains the positive
lineage check and four source-mutation refusals; the final weaker-bound
refusal did not appear. The original blocked operation and timeout cause
remain UNKNOWN.

Under the same unchanged authenticated continuing scope, the existing
`augnes.local-canonical-closeout-continuation.v1` schema recognizes the
separate kind `issue_1559_source_scope_precheck_correction`. It is limited to
family `2f6b8b2b065c50198d745438de42df410d1dc2032b231615ad4aca547abd3b82`,
attempt `2026-10-31T04-12-51-606Z-full-1d921d6adeed-d08a657b5d51e362`,
receipt `7d8875c0408b66125e54940133fcc0c8cf8dd3667009d9b9d6ff7767e83f2731`,
completed at `2026-10-31T04:24:59.337Z`. Its receipt, attempt, completion,
incoming edge, complete authority log and separate stock are fixed original
artifacts. Its predecessor proof is read through the unchanged first-kind
semantic checks, retaining the initial closeout and older v7 evidence.

The only mechanism correction checks the declared source inventory before
revalidating older evidence and invoking Git. A declaration already forbidden
by the existing source rules can fail immediately. A declaration that passes
this check still receives every original Git-derived inventory, native-delta,
evidence, authority and cleanup check. A masked declaration over changed Git
source must still refuse; declared inventory never becomes trusted source.
The actual bounded before/after observations, original output and settlement,
observer and fixture bytes, source snapshots and native mechanism delta are
retained. A passing prior sample is not relabeled as failure. The final owner
must retain the exact corrected reader function; final admission integration
and its focused controls are separately bound to the final source, not called
an independent source review.

The single baseline and corrected samples naturally passed in 5.428 and
3.994 seconds under the unchanged six-second child bound, with complete
cleanup. Across the same five adverse mutations, Git subprocess counts fell
from 66/67/66/67/67 to 22/23/22/23/23. The corrected sample also completed the
additional masked-declaration refusal using 66 Git calls, demonstrating that
the later source checks still run. The positive validation's Git-call count
was unchanged. These observations establish less redundant refusal work;
the baseline did not reproduce the historical timeout and neither sample
identifies its blocked operation or a host-load cause.

The full 32-path accepted task inventory is preserved, including all three
operational-validation source hashes, service-contract efficiency changes and
ownership-retirement fixture. Only the existing nine policy owners plus
`scripts/test-local-canonical-receipt.mjs` are available to this new kind;
the initial and first-kind path sets do not expand. The receipt test receives
bounded normal/adverse controls within its existing registration. Suite,
planner, lifecycle, deadlines and behavioral workload remain unchanged.

Only this exact settled first-kind predecessor can acquire the new exclusive
edge. All old consumed flags remain true, and the new case becomes terminal
after its one reservation, including interruption. It retains
`{initial: 1, recovery: 0}`. No old family is reset, no copied grant or cosmetic
candidate creates another allowance, and no generic timeout or continuation
exception is introduced. Normal fresh main, checkout, capacity, input,
authentication and published Draft-source gates still apply. Proof and stock
inspection remain read-only; all 16 phases, seven Browser owners and separate
fresh stock are still required for qualification. This policy does not grant
merge, Ready, auto-merge, release, deployment or installed-adoption authority.

### One explicitly authorized reporting-instruction input replacement

The source-scope candidate `69d09685566391034a2c8b48cddcbdfaebdd1ddc`
settled as `safety_violation` after the whole-file user-instructions guard
observed a real change. Its original Full result remains 5 PASS / 1 FAIL /
10 NOT_RUN, with separate nondeciding stock reporting 17 issues and complete
cleanup. The unit suite was cancelled, not timed out: 51 children naturally
passed and the 52nd had started without a final child verdict. No outcome is
invented for that interrupted child. The guard behaved according to policy;
this replacement is not a verifier correction or infrastructure reclassification.

The user then explicitly instructed Codex to resolve this instruction-input
blocker and continue the closeout. Authenticated comment
[`6539480565`](https://github.com/hynk-studio/augnes/pull/1560#issuecomment-6539480565),
created at `2026-10-31T05:18:33Z`, records the exact instruction and Codex's
publishing role. It supplements the original continuing scope; it is not an
independent source review. The production owner re-reads its actual author,
body, destination, timestamp, current permission and published Draft head/base.

The existing continuation schema recognizes only the additional kind
`issue_1559_instruction_input_replacement` for family
`36607e4013b3b3347621a2eee5cddc94e99d8383ea879b4ba1b0c9274cb83d45`,
attempt `2026-10-31T04-48-27-071Z-full-69d096855663-adb7a9586e65b27c`,
receipt `7e1476437852d22b3a2ae0703fbe801cee8eda1bbddd13f6a275dac1c704826d`,
completed at `2026-10-31T04:55:57.206Z`. Its complete originals, single
instruction fault, absence of secondary faults, cleanup, predecessor proof
and retained earlier evidence remain required. Another failed workload,
different input fault, ambiguous cleanup or older predecessor is ineligible.

The exact retained before/after instruction bytes are 11,769 / `d4289118…`
and 13,875 / `f6297360…`; their full hashes and provenance are fixed by the
owner. Byte comparison must show that only the Augnes Space reporting
exception changed. Other authority, execution and preservation instructions
remain exact. Filesystem-writer authentication is not claimed. The new
allowance comes from the later direct user instruction, not from the reporting
permission contained in the changed file.

The normal executor freezes the actual current inputs and passes that same
declaration to authorization and admission. Its fingerprint, candidate identity
and exact safety resource location, file identity, bytes and hash are checked
before reserving an edge. A separately read file or proof-supplied input does
not replace this frozen declaration. The attempt retains a bounded hash-only
footprint, also checked by receipt, fresh stock and private export. The live
whole-file monitor remains unchanged; a later instruction change still faults
and cancels normally. No global instruction file is restored or rewritten.

All 33 accepted task paths remain preserved against the settled candidate,
including paths absent from a later diff. Only the same ten named policy and
control owners may change, with the existing bounded current-main union rule.
Product semantics, service-contract efficiency, suite/planner registrations,
assertions, deadlines and lifecycle owners remain unchanged. The existing
exclusive successor namespace consumes this exact input replacement once,
with `{initial: 1, recovery: 0}`. Earlier consumed flags and historical records
stay intact. Interrupted reservation, copied proof or comment, another head,
branch or worktree, recovery and further chaining cannot renew it.

Focused controls cover evidence, authority, the real frozen-input handoff,
continued live cancellation, exclusive consumption and fresh stock/export
without reservation. Normal ownership, capacity, runtime, Companion, current
main and all other input checks still apply. Complete Full16 and Browser7 plus
separate fresh stock remain the qualification obligation. This prospective
policy and its results await the user's commissioned independent final audit;
merge, Ready, auto-merge, deployment and installed adoption remain unauthorized.

### One measured fixture-preparation correction after Full4

The instruction-replacement candidate `22842588d35b0679c7b851e9a2a503c52a4cadcc`
settled as `product_failure`: Full 6 PASS / 1 FAIL / 9 NOT_RUN, with complete
cleanup and separate nondeciding stock reporting 15 issues. All 68 unit children
passed. The authority phase naturally exited 1 at 80,528ms; its executor-contract
child reached the unchanged 30,000ms bound and settled at 30,074ms with SIGTERM.
All six continuation-control children had passed. The instruction-admission
child had started without a final result when its parent was terminated. Its
result is not invented. The original blocking operation and cause remain UNKNOWN.

The original authenticated continuing scope `6537722343` commissions relevant
source corrections, their focused verification and minimal admission
reconciliation. The instruction-specific allowance `6539480565` remains spent;
it is retained provenance, not authority for another instruction replacement.
The existing continuation schema adds only
`issue_1559_fixture_preparation_correction`, pinned to family
`38bee310216c09498824cc9f4b0a22fe5c60ea120ea8844658c51b1b0405c6b1`,
attempt `2026-10-31T05-40-58-047Z-full-22842588d35b-cf3af53326eed21e`,
receipt `e7c7bb60eb21c92f4b0877fd45eba623255ebd6a4cd49c12565eea9562720e17`,
completed at `2026-10-31T05:52:10.384Z`. Original receipt, attempt, completion,
incoming edge, authority log, stock and prior instruction proof stay hash-bound.

The correction removes redundant initial-route admission from explicitly
synthetic history preparation in the continuation controls. Initial-route
controls still perform actual admission, and each current continuation retains
its complete production proof read, authentication, admission, race, stock and
cleanup behavior. A new self-consistent, rehashed malformed historical-authority
control confirms that seeded history is still validated. The exact measured
fixture SHA-256 is
`c1c839ad3080fb25a1535f9fc36e4ecee9dde8f7342f8996f36ed140bd97d327`.

One planned baseline/candidate comparison of the whole executor entry naturally
passed in 27,074ms and 24,176ms under the same 30,000ms bound. All 92 prior named
controls remained; the candidate added one adverse control. Six continuation
groups totaled 20,795ms and 17,794ms; instruction admission was 5,393ms and
5,465ms. These single-host observations support the bounded preparation-cost
correction, not a reproduced historical timeout, a reliability estimate or an
environment-equality claim. Candidate main documentation reconciliation is
retained separately. Both original samples, commands, source snapshots, logs,
settlements and cleanup remain fixed evidence.

Only this exact correction may follow the valid, settled Full4 instruction
record. Its consumed flag and all earlier flags remain true. The same exclusive
edge permits one new Full and zero recovery; this correction is terminal, and
interruption, copied evidence, another head or a changed branch cannot renew it.
The complete 33-path accepted inventory, exact measured fixture, bounded
current-main union, frozen current-instruction identity and live monitor remain
required. Normal source, ownership, capacity, lifecycle and stock checks remain
active. No suite registration, workload, assertion or deadline is weakened.
The authenticated record retains its original timestamp and publishing role;
no new human text or independent review is invented. The commissioned final
independent audit still covers the policy, source and complete execution result.

### One measured issued-capability precheck correction after Full5

The fixture-preparation candidate `9e33dda83633cb80b97822b493ad3ed1343f4f50`
settled as `product_failure`: Full 6 PASS / 1 FAIL / 9 NOT_RUN, complete cleanup,
and separate nondeciding stock reporting 14 issues. All 68 unit children passed.
The authority phase naturally exited 1 at 79,650ms. Its executor child naturally
exited 1 at 29,124ms; the nested instruction-admission child exceeded its unchanged
6,000ms bound and settled at 6,104ms with SIGTERM. These lifecycle levels and the
original unknown blocking operation remain separate.

The existing continuation schema adds only
`issue_1559_capability_precheck_correction`, tied to family
`dedddb9849fcd307ddb8bd9e24c3ad6278d8d5b98250243fa10dbfe970e8d032`,
attempt `2026-10-31T06-17-03-197Z-full-9e33dda83633-daa3cdc31f1b11cc`,
receipt `c8acea3dd2eeae8d7393a160f58ff75fc5fcd8a80fd26290ddb1bf895d0b7149`,
and completion `2026-10-31T06:28:17.880Z`. It retains the original receipt,
attempt, completion, incoming edge, authority output, stock and complete prior
proof. The authenticated continuing scope remains comment `6537722343`; the
instruction-specific record and every earlier consumed allowance remain spent.

One information-seeking diagnostic naturally passed in 5,489ms and demonstrated
93 redundant Git calls before refusing a forged capability. A single corrected
observation naturally passed in 4,586ms under the same 6,000ms bound; that refusal
performed zero Git calls. A separate 3,340ms actual-owner control confirmed
null, forged, reconstructed and mismatched capability refusals without proof or
artifact reads. Genuine issued capabilities still reread the proof, reject a
disk mutation after authentication, and perform all fresh positive validation.
Both genuine race contenders retained 93 Git calls during admission. These are
PASS-to-PASS measurements, not reproduction of the original timeout or an
independent review. Observation overhead and differing private environment
roots remain limitations; concurrent Git elapsed sums are not wall time.

The early check only rejects capabilities absent from the owner's issuance
WeakMap or mismatched to their exact proof and observations. It does not issue
or repair authority, skip any valid-request proof read, or replace the full late
authority, input and ledger checks. A future request invalid in both authority
and disk evidence now reports the authority refusal first. Existing historical
failure ordering is unchanged. The complete two-owner development snapshots,
native delta, exact precheck and admission function, 37 retained artifacts and
actual bounded settlements are bound separately from final policy integration.
The measured `c1c839ad3080fb25a1535f9fc36e4ecee9dde8f7342f8996f36ed140bd97d327`
fixture remains byte-identical; no controls, workload or deadlines are removed.

Only this exact correction may follow the settled Full5 fixture record. All
old consumed flags remain true, and one exclusive successor edge allows one
Full with zero recovery. This new profile is terminal; copied proofs, grants,
branches, interruptions or another head do not renew it. Its accepted source
inventory is the 33-path Full5 delta against accepted main
`bbb7dee536817fe4b7f28f5353a1d88f56c7e44d`, with compatible current-main changes
preserved and only the existing ten policy paths eligible for reconciliation.
Every other accepted source path, the frozen current-instruction identity and
live input monitor remain required. Normal ownership, capacity, planning,
Full/Browser selection, cleanup and fresh stock gates still apply. Final source
and results await the commissioned independent audit; this implementation and
its retained evidence do not claim that audit or merge/adoption authority.

### One measured scope-fixture preparation correction after Full6

Candidate `168167204f4c6b66961f7bdbac730ce7bde444e8` settled as
`product_failure`: Full 6 PASS / 1 FAIL / 9 NOT_RUN, complete cleanup and
separate nondeciding stock with 14 issues. All 68 unit children passed. The
executor child naturally passed in 26,278ms, including instruction admission
at 5,388ms. The authority phase naturally failed in 87,853ms; its receipt child
naturally failed in 11,562ms after scope-correction admission exceeded its
6,000ms bound and settled at 6,072ms with SIGTERM. Preserve those distinct
lifecycle levels and the UNKNOWN historical blocking operation/cause.

The existing continuation schema adds only
`issue_1559_scope_fixture_preparation_correction`, bound to family
`65d35261679ffdcafdf6edcb86e86c3e8168b92bf6aae07c69a6c2c8e4acf7a9`,
attempt `2026-10-31T06-59-09-045Z-full-168167204f4c-3fab428373fcf10d`,
receipt `9929314dae211c24f891f9ba213bdf332e3b8688ddedbcafc62631d47350f244`,
and completion `2026-10-31T07:10:32.711Z`. The original seven artifacts and
complete prior capability proof remain hash-bound and are revalidated. The
original authenticated continuing scope remains comment `6537722343`; no new
user grant or completed independent review is invented.

One diagnostic naturally passed in 5,331ms and identified 168 redundant Git
calls, about 1,599ms, while re-admitting initial and operational synthetic
history during scope-fixture setup. The fixture now uses its existing history
seeding option for that preparation. Its current proof, authenticated authority,
admission, race, cold stock, source guards and cleanup still use the real owners.
The initial and operational admission controls remain independently exercised.
A self-consistent rehashed malformed seeded operational-authority control reaches
`closeout_scope_correction_original_binding_invalid`.

The one corrected observed child naturally passed in 3,791ms under the same
6,000ms bound. Historical setup replay calls fell from 168 to zero; the current
scope proof and each race contender's fresh admission retained 76 Git calls.
Separate existing bounded controls passed for scope evidence, scope stock,
initial admission and operational admission in 2,542ms, 4,266ms, 2,160ms and
2,823ms respectively. These are retained development observations, not a
reproduced historical timeout, an environment-equality claim or final-source
independent review. Observer overhead is unmeasured, and parallel elapsed Git
sums are not additive wall time. The exact corrected fixture SHA-256 is
`32c5fbeaf32438bf06b533e699c3bc24e9fb5f6534e670662576951f08058f63`.

The finite profile binds that whole fixture and its exact native delta, the
47 retained evidence artifacts and all five corrected controls. Its source
inspection preserves the production Git/tree reader and complete admission
body; the issued-capability guard only adds this distinct profile. No Git cache,
source-scope algorithm, registration, workload or deadline changes are admitted
by this correction. The complete accepted 33-path inventory against
`bbb7dee536817fe4b7f28f5353a1d88f56c7e44d`, bounded current-main reconciliation,
existing ten policy paths, frozen current instructions and live input guard
remain required.

Only the exact settled Full6 capability record may precede this correction.
All prior consumed flags remain true; one exclusive edge permits one Full and
zero recovery, then this profile is terminal. Interruption, copied authority,
proof/head/branch changes and successor chaining do not renew it. Normal
ownership, capacity, source, Full/Browser planning, cleanup and fresh stock
checks remain active. Final source and execution results still require the
commissioned independent audit; merge, Ready, auto-merge, deployment and
installed adoption remain unauthorized.


### Authenticated amendment of auxiliary closeout execution budgets

The user's supplemental instruction [6541370652](https://github.com/hynk-studio/augnes/pull/1560#issuecomment-6541370652), recorded on
2026-10-31 at 08:52:36Z, prospectively amends the auxiliary verifier execution
budgets under original closeout scope `6537722343`. It does not identify the
UNKNOWN cause of Full7, change its `product_failure` disposition, or approve
unseen source. Preserve Full7 head `9c6341bb208ca3f336d2c6a1c8c5ce6191d60571`,
receipt `4767544eaab4d6e8d2ff42073daa98ef90eee307e1d7d125ecf91cb2f644dcf8`,
its 6 PASS / 1 FAIL / 9 NOT_RUN, the nested instruction-stock timeout and outer
natural failures, complete cleanup and separate stock 14/nondeciding.

The finite values are frozen in `scripts/local-canonical-closeout-budgets.mjs`:

| Auxiliary execution owner | Previous bound | Amended bound |
| --- | ---: | ---: |
| Closeout control group | 6,000ms | 12,000ms |
| Nested closeout claim/cold-stock child | 4,000ms | 6,000ms |
| Enclosing executor controls | 30,000ms | 120,000ms |
| Enclosing receipt controls | 30,000ms | 90,000ms |
| Enclosing default review-correction controls | 30,000ms | 180,000ms |

The table lists the previous Canonical parent registrations. The direct quick
and operating-policy executor/receipt wrappers previously used 60,000ms; they
now consume the same amended executor/receipt budgets rather than a conflicting
second value.

These values cover cumulative setup, full fresh proof and authority validation,
real contention, cold-process inspection and cleanup, with finite headroom for
the supported host. The single instruction-stock diagnostic naturally passed in
5,312ms and observed 483 Git calls; four required fresh proof passes accounted
for 372 of them. Its PASS does not reproduce or explain Full7. Raising only a
leaf bound would leave enclosing suites unable to accommodate their selected
work. The values are fixed before deciding execution; no adaptive extension,
automatic retry or post-failure increase is authorized by this amendment.
Historical timing literals, deliberate timeout controls, product/protocol
bounds, authority expiry, natural-exit acceptance and lifecycle safeguards are
unchanged. No assertion, fresh reread, contention or cleanup moves outside its
owner's measured lifetime.

Normal admission recognizes a `scope_amendment` on the existing latest
closeout continuation packet. There is no new schema, kind, module ladder or
consumed flag. The modifier binds the actual supplemental comment and complete
owner observation; live authorization authenticates both original and amended
scope, current permission, and the exact published Draft PR/base/head. A local
record or this document is not a signature. The packet preserves Full7's exact
receipt, attempt, completion, incoming edge, authority log and separate stock,
and rereads its byte-identical predecessor proof using the historical reader.
Packets without the modifier keep their historical semantics.

The source inventory retains all 33 accepted paths against accepted base
`bbb7dee536817fe4b7f28f5353a1d88f56c7e44d`, compatible current-main content and
all unrelated source. The seven budget-definition/wiring files are pinned to
the frozen implementation bytes; the existing policy consumers contain only
necessary amendment handling. Exact native deltas bind the final tree. The
three affected parent controls must naturally pass with complete cleanup on
source bytes matching that tree, including explicit before/after source checks.
Development commit names are reported separately from final byte identity.

Only the exact settled Full7 tip can acquire one exclusive amended successor,
with one Full and zero recovery through normal ownership/capacity/planning.
Every old consumed flag stays true. The amended attempt has no automatic successor;
replaying the comment, copying a proof, changing head/branch, interruption or
adding another edge does not reset an allowance. The frozen instruction
footprint, live input guard, complete final-head Full/Browser plan and separate
fresh stock remain required. Final source and evidence await independent
judgment; this amendment grants no merge, Ready, auto-merge, release, deployment
or installed-adoption authority.

The same supplemental scope also expressly requires a substantive relevant
correction and focused evidence before any subsequent deciding execution. For
the demonstrated default-review output quarantine regression, the existing
amended packet may reference an ordinary v2 `source_revision` proof; this adds
no schema, kind, module or consumed flag. It is a prospective source correction,
not a replay of the budget allowance. The latest settled amended predecessor
must be a natural `product_failure`, with an intact receipt, complete authority
log showing the sole failing acceptance child, no input fault, complete cleanup
and separate nondeciding stock. A timeout, safety violation, incomplete log,
older tip, unchanged source or cosmetic delta does not satisfy this relation.

The ordinary owner validates the same unchanged complete regression on the
exact predecessor and final Git source: natural FAIL then natural PASS after
predecessor settlement, with matching fixture/environment bindings and complete
cleanup. Its candidate-review record records an actual implementation-owner
source check and the authenticated supplemental scope reference; it is neither
an independent audit nor an authorization signature. The original ordinary v2
review, witness, native-delta and source checks remain in force. The closeout
owner separately authenticates both existing comments and current authority.

This correction preserves the amended execution budgets and all 34 accepted
paths. Only removal of the demonstrated default closeout group's explicit
stdout/stderr passthrough and the necessary existing policy-consumer handling
may change; all other budget wiring, assertions, product source and lifecycle
owners remain exact. Complete final-byte parent checks, native deltas and the
fresh frozen instruction binding remain required. The same exclusive edge
namespace and one-Full/zero-recovery budget apply. Every historical packet,
receipt, disposition and consumed flag remains intact; stock inspection is
read-only and cannot reserve a successor. Independent final source/policy and
evidence judgment remains separate.
