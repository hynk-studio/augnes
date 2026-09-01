# Local Canonical verification policy

## Purpose and authority

Augnes keeps its complete Canonical test capability in the repository. GitHub
remains source control, pull-request, review, and history infrastructure only.
GitHub Actions execution is intentionally absent. No pull request, push,
schedule, dispatch, reusable workflow, status fabrication, or other repository
event may start or impersonate verification compute.

The deciding surface is one completed local run for the exact proposed head on
the authorized shared Mac. This policy records that environment and its
limitations. It does not claim that local evidence is stronger than independent
reproduction. Local Canonical does not publish evidence or write GitHub state;
any separately authorized repository action remains outside verification.

The receipt preserves the established evidence vocabulary:

- exact repository identity
- exact base SHA
- exact head SHA
- dirty-worktree status
- operating system and architecture
- Node and npm versions
- root and nested lockfile fingerprints
- selected plan
- selected responsibility owners and bounded phase inventory, when targeted
- each selected command and result
- finite duration
- cleanup and remaining-process result
- final pass or failure

This is a shared local host and does not provide independent hosted reproduction.
GitHub remains source control, pull-request, review, and history infrastructure only.

## Repository-owned entry points

Use the stable executor commands:

```bash
npm run verify:local:quick
npm run verify:local:changed -- \
  --base <exact-40-character-base-sha> \
  --head <exact-40-character-head-sha>
npm run verify:local:full -- \
  --base <exact-40-character-base-sha> \
  --head <exact-40-character-head-sha>
```

The executor first requires the exact authorized local root and exact authorized
`origin`. It verifies that base and head are lowercase 40-character commit
identities available locally. `changed` and `full` additionally require:

- current `HEAD` equals the requested head;
- the worktree is clean before and after execution;
- the current host satisfies the Canonical platform and resource policy;
- the exact Canonical Node version is active through both the running process
  and `PATH`;
- every selected phase completes successfully with finite duration, complete
  cleanup, and zero remaining owned processes.

It never silently tests another commit. It never stashes, resets, cleans,
discards, or moves user source changes.

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

### Changed

`changed` invokes the existing planner with the exact pull-request base and
head:

```bash
node scripts/canonical-change-planner.mjs \
  --event pull_request \
  --base <exact-base-sha> \
  --head <exact-head-sha>
```

A `documentation-only` result runs only:

```bash
node scripts/validate-canonical-docs-change.mjs \
  --base <exact-base-sha> \
  --head <exact-head-sha>
```

It does not install dependencies or run unrelated runtime suites. A planner
classification failure or ambiguous/unsupported change fails closed to the
complete surface.

An `operating-policy-only` result is available only for one safe regular-file
modification of the root `AGENTS.md`. It runs the exact-head Markdown/private-
path/link validator plus the planner, local executor, receipt, and repository
verification-policy contracts. It installs no dependencies, acquires no
production Companion maintenance, and runs no product runtime, integration,
operability, package, provider, or browser qualification. `AGENTS.md` combined
with any other path, or an `AGENTS.md` deletion, rename, copy, mode change,
nested path, or unsafe/unknown status, selects `full-canonical`.

An `owner-targeted` result is available only when every non-documentation
change matches a checked-in responsibility owner in
[`scripts/local-canonical-change-owners.v1.json`](../scripts/local-canonical-change-owners.v1.json).
That manifest may select only a fixed ordered subset of existing Canonical
phases. The plan always begins with an exact-base/head validator that recomputes
the planner result, runs `git diff --check`, and validates any changed Markdown;
the executor then replaces both installed dependency trees through the same
sequential root and nested `npm ci` preparation used by Full Canonical before it
runs the manifest-selected typecheck, unit, authority, integration, operability,
or Browser owners sequentially. Callers cannot supply tests or phases.

The manifest is intentionally a narrow admission list, not an inference engine.
A top-level `scripts/`, `lib/`, `app/`, `components/`, `tests/`, or `fixtures/`
path does not by itself select either targeted or full verification. Known
single-owner product changes include the corresponding detailed Browser owner;
multiple Browser owners, shared composition, or unknown Browser ownership fail
closed to `full-canonical`. Documentation may accompany a targeted owner
without adding an unrelated phase.

Deletion is classified by the responsibility being removed. Only an explicitly
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

The executor represents the nested install by running npm with the nested app
as its working directory; the resulting dependency contract is equivalent to
the explicit command shown above.

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

Quick treats installed dependencies as feedback inputs only. Documentation-only
and operating-policy-only changed execution do not consult or replace them.
Owner-targeted and Full Canonical execution replace both installed
`node_modules` trees through sequential `npm ci` operations bound to the exact
committed root and nested lockfiles. The clean preparation phases precede every
dependency-consuming targeted owner, are recorded in the fixed planner phase
inventory, and must pass for the receipt to be deciding. A stale, foreign,
locally polluted, reused, incomplete, reordered, or unattested installed tree
is not deciding input. Package, build, distribution, dependency, or lockfile
responsibility remains `full-canonical`; clean targeted preparation does not
make those responsibilities narrow.

npm download-cache reuse is permitted to avoid unnecessary transfer, but the
cache and pre-existing installed trees are not deciding authority. Dependency
preparation failure is a verification failure. Root and nested lockfile SHA-256
fingerprints are recorded in every receipt.

The ignored root `.next` directory is repository-owned generated build state,
not exact-head source evidence. Before both Full Canonical and owner-targeted
execution, the executor accepts only the exact bounded root `.next` directory
and removes any pre-existing entry before a deciding phase runs. A symlink,
non-directory entry, or path outside that boundary fails closed without
following or modifying the external target. After phases and before Companion
maintenance release, the executor removes any newly generated `.next` while it
still owns the runtime-maintenance boundary and verifies that the path is absent
at that execution-cleanup boundary. Removal failure or residual state makes the
run non-deciding and invalidates its receipt. The executor then restores the
exact prior Companion lifecycle. A previously live or starting exact-checkout
Companion may create fresh exact-head runtime `.next` state after successful
restoration to `live`; the receipt records that final observation separately,
and it is not input to or
residue from a deciding phase. Documentation-only and operating-policy-only
execution remain dependency-light and do not touch `.next`. The executor never
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

The Mac is a shared development and verification host. The executor favors
deterministic ownership over throughput:

- all outer phases run sequentially;
- dependency, build, database, package, recovery, supervisor, runtime
  reconciliation, listener-port, process, and browser ownership never overlaps;
- core and continuity E2E never run concurrently;
- the existing integration runner alone retains its proven maximum-two isolated
  groups, `operator-process` and `supporting-serial`;
- each Canonical child keeps its own HOME, temp root, database, and runtime
  state;
- existing measured child timeouts, heartbeats, zero-network guards, process
  tree termination, stream closure, and exact cleanup assertions remain owned
  by the current runners.

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

The public-safe receipt includes:

- schema and receipt version;
- repository identity, exact origin, base/head, branch or detached state, and
  clean/dirty state before and after;
- selected mode, planner event/result, selected plan, responsibility owners,
  targeted and Browser phase inventories, and deciding/transferability state;
- macOS version/build, architecture, Node/npm policy and actual versions;
- a random local pseudonymous machine fingerprint stored independently of
  hostname, username, serial number, hardware UUID, or account path;
- bounded CPU, memory, disk, browser-availability, and sleep-prevention facts;
- root and nested lockfile SHA-256 fingerprints and dependency policy;
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

Validation exits nonzero unless the receipt is currently valid deciding
evidence. It rejects or marks non-deciding a receipt when:

- current `HEAD`, origin, branch/detached state, worktree cleanliness, or environment identity differs;
- either lockfile fingerprint differs;
- executor source fingerprint or selected plan differs;
- content integrity or required fields are invalid;
- a selected phase is missing, skipped, failed, timed out, non-finite, or has
  incomplete cleanup or remaining owned processes;
- the final result is not pass;
- the canonical Node policy does not match;
- the receipt is quick/dirty/non-transferable.

A later commit always requires a new exact-head receipt.

## Pull-request evidence

The Draft PR records the exact repository, base/head,
branch, origin check, Node policy and actual Node, lock fingerprints, selected
plan, every command/result/duration, intermediate failure and correction,
cleanup, zero remaining owned processes, repository-relative final receipt
path, fingerprint, and successful receipt validation. It also states:

- the execution occurred once on a shared local Mac;
- no generated receipt or raw log was committed or uploaded;
- no GitHub Actions or other hosted/self-hosted CI ran;
- no status check or independent attestation was fabricated;
- no other repository or project directory was inspected or modified.

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
