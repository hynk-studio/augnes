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
reproduction. Publication never occurs automatically; an explicitly authorized
user may publish only a bounded projection of a current deciding receipt under
the separate
[Local Canonical pull-request evidence policy](LOCAL_CANONICAL_PR_EVIDENCE.md).

The receipt preserves the established evidence vocabulary:

- exact repository identity
- exact base SHA
- exact head SHA
- dirty-worktree status
- operating system and architecture
- Node and npm versions
- root and nested lockfile fingerprints
- selected plan
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
- Local Canonical PR evidence projection and fixed-transport contracts;
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
complete surface. Invalid or unavailable SHAs and identical base/head are
identity failures, not permission to run another plan.

### Full

`full` invokes the exact planner for recorded context and deliberately selects
`full-canonical` even if the planner reports documentation-only. It runs:

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
changed execution does not consult or replace them. A full surface replaces
both installed `node_modules` trees through sequential `npm ci` operations
bound to the committed lockfiles.

npm download-cache reuse is permitted to avoid unnecessary transfer, but the
cache and pre-existing installed trees are not deciding authority. Dependency
preparation failure is a verification failure. Root and nested lockfile SHA-256
fingerprints are recorded in every receipt.

The ignored root `.next` directory is bounded generated build state. Before a
full execution, the executor removes only that path and records whether it was
present and removed. It removes state generated by the run during final
cleanup. It does not use broad `git clean` or delete unrelated files. Existing
Canonical children continue to own their bounded OS-temporary resources; the
executor does not create another checkout or Git working copy.

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

The full surface requires at least two logical CPUs, 8 GiB physical memory, and
15 GiB free repository-volume disk before long phases. Quick and
documentation-only execution require at least 1 GiB. The receipt records
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
- selected mode, planner event/result, selected plan, and deciding/
  transferability state;
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

The Draft PR records the exact repository, authorized local path, base/head,
branch, origin check, Node policy and actual Node, lock fingerprints, selected
plan, every command/result/duration, intermediate failure and correction,
cleanup, zero remaining owned processes, repository-relative final receipt
path, fingerprint, and successful receipt validation. It also states:

- the execution occurred once on a shared local Mac;
- no generated receipt or raw log was committed or uploaded;
- no GitHub Actions or other hosted/self-hosted CI ran;
- no status check or independent attestation was fabricated;
- no other repository or project directory was inspected or modified.

Optional publication uses:

```bash
npm run verify:local:evidence:prepare -- \
  --pr <positive-pr-number> \
  --receipt .augnes-local-verification/receipts/<receipt>.json
npm run verify:local:evidence:publish -- \
  --pr <positive-pr-number> \
  --receipt .augnes-local-verification/receipts/<receipt>.json \
  --confirm-publish
npm run verify:local:evidence:verify -- --pr <positive-pr-number>
npm run verify:local:evidence:verify -- \
  --pr <positive-pr-number> \
  --receipt .augnes-local-verification/receipts/<receipt>.json
```

`prepare` is read-only with respect to GitHub. `publish` repeats every exact
identity and deciding-receipt gate immediately before the one authorized
comment write. It publishes neither the full receipt nor logs. Remote-only
verification checks the current comment projection; local-linked verification
also proves that projection matches the current local receipt. Neither is a
signature, status check, hosted reproduction, or independent attestation.
Generated publication artifacts and records remain ignored.

## Repository execution and transfer boundary

`.github/workflows` must remain empty. Do not add a dummy workflow, reusable
action solely for hosted execution, GitLab or another CI provider, a
self-hosted GitHub runner, launchd service, Docker/VM requirement, background
automation, or automatic publication. Local Canonical PR evidence is an
explicit foreground comment write only; it does not restore hosted compute or
add a background publication path.

The repository is a temporary development location. Harness commits use Augnes
product names, repository-relative source paths, ordinary Git history, and no
repository-specific product identity. This keeps the history suitable for a
later separately authorized transfer. The current hard repository root/origin
gate and the current publication authority must be deliberately reviewed in
separate work for the eventual destination; this PR does not contact or modify
that repository.
