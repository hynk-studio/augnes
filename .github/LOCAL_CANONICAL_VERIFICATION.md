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

The isolated executor only observes the accepted Companion through its supported
read-only inspector before and after the run. Its private HOME prevents nested
build/suite wrappers from discovering or maintaining the installed service. An
isolated lane never pauses, restarts, reconfigures or adopts that service. A
changed observed service identity/lifecycle refuses successful qualification.
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

Exact deciding evidence uses Node.js 24.18.0 on macOS arm64. `.node-version`
is the single repository version marker. The supported source-compatibility
range is the maintained even LTS lines `^22.0.0 || ^24.0.0`, with npm 10 or
11. Compatibility does not equal Canonical identity:

- Node 24.18.0 may produce deciding evidence when all other gates pass.
- Node 22 may be used for compatibility checks but is not the exact Canonical
  runtime.
- Node 25 and other versions produce an explicit mismatch. Quick mode may still
  run as non-deciding feedback; changed and full fail before long phases.

The policy does not install a version manager, switch the system runtime,
invoke Homebrew, or modify global settings. Linux and Windows remain separate
compatibility surfaces rather than substitutes for the current local Canonical
host.

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

Both locations are gitignored. Phase logs are limited to 2 MiB each; at most
five log-run directories and twenty receipt files are retained. The harness
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
- receipt version 3 verification context (canonical or admitted isolated worktree),
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
  into version 3 evidence;
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
