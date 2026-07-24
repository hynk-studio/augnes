# Local Canonical verification policy

## Purpose

Augnes keeps its complete Canonical test capability in the repository.
GitHub remains source control, pull-request, review, and history infrastructure only.
GitHub Actions execution is intentionally absent. No pull request, push,
schedule, dispatch, reusable workflow, or other repository event may start
hosted verification compute.

Until a separately reviewed local receipt-publication mechanism exists, the
deciding verification evidence is a complete local run for the exact proposed
head. This policy does not claim that local evidence is inherently stronger
than hosted evidence. It identifies the actual execution environment and its
limitations so reviewers can judge the result accurately.

## Exact-head evidence

The pull request must record:

- exact repository identity;
- exact base SHA;
- exact head SHA;
- dirty-worktree status before and after verification;
- operating system and architecture;
- Node and npm versions;
- root and nested lockfile fingerprints;
- selected plan from the bounded change planner;
- each selected command and result;
- finite duration for each command;
- cleanup and remaining-process result;
- final pass or failure.

Evidence becomes stale when the head changes. A later commit requires a new
plan and every change-relevant command on that new exact head. A dirty
worktree must be reported and cannot be represented as exact-head evidence
unless every difference is deliberately included in the proposed commit.

Local verification runs on a shared local host rather than a fresh,
independently administered runner. The evidence must state the host operating
system and architecture, tool versions, dependency-lock fingerprints, and
cleanup result. It does not provide independent hosted reproduction,
repository-event isolation, or an external status-check identity.

## Plan selection

Run the bounded planner with the exact pull-request base and head:

```bash
node scripts/canonical-change-planner.mjs \
  --event pull_request \
  --base <exact-base-sha> \
  --head <exact-head-sha>
```

For `documentation-only`, run:

```bash
node scripts/validate-canonical-docs-change.mjs \
  --base <exact-base-sha> \
  --head <exact-head-sha>
```

For `full-canonical`, run the complete local surface:

```bash
npm run typecheck
npm run build
npm test
npm run test:authority
npm run test:integration
npm run test:operability
npm run test:e2e:core
npm run test:e2e:continuity
```

Focused integration and operability shards remain available:

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

Run process-owning, package, runtime, and browser lanes sequentially on a shared
local host. In particular, do not run the core and continuity browser lanes at
the same time. The repository-owned runner retains finite child timeouts,
environment isolation, secret filtering, owned-process termination and
cleanup, zero-network safeguards, package-history requirements, and exact E2E
responsibility ownership.

## Failure and cleanup

- A failed, timed-out, incomplete, or skipped selected command is not a pass.
- Record intermediate failures and fixes truthfully.
- Do not add automatic retries, arbitrary sleeps, or wider timeouts to obtain a
  passing receipt.
- Do not weaken assertions, network guards, process ownership, cleanup, package
  history, or exact-head checks.
- Confirm zero remaining owned processes, listeners, runtime state,
  disposable databases, browser profiles, and temporary roots after every
  process-owning lane.
- Run `git diff --check` and
  `git diff --check <exact-base-sha>...<exact-head-sha>`.

## Repository execution boundary

GitHub Actions execution must remain absent. `.github/workflows` must contain no
workflow file, and no reusable composite action may be retained solely for a
workflow consumer. Do not replace the removed execution surface with a dummy
check, another hosted CI provider, a self-hosted GitHub runner, or a background
host service.

The repository currently has no branch-protection or ruleset requirement for
the former hosted check. If repository settings change later, they must not be
worked around through a fabricated status. A future PR may add a bounded local
receipt format and deliberate publication mechanism after its identity,
anti-replay, secret-safety, and authority boundaries are reviewed. That later
work must not silently recreate hosted execution.
