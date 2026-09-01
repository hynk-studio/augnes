# Canonical Browser verification ownership v1

This document defines the permanent Browser verification architecture. The
machine owner is
[`scripts/browser-verification-owners.v1.json`](../scripts/browser-verification-owners.v1.json).
It binds focused commands, Canonical phase IDs, executable sources, detailed
result fields, semantic markers, and conservative changed-file selection.

## Permanent owners

### Project experience

`npm run test:e2e:project-experience` runs `e2e-project-experience`.

It answers whether a user can connect, identify, recover, and navigate a
project correctly. It owns folder onboarding and naming, Project Home lifecycle
presentation, ProductShell and locked entry, retired-route safety, and the
complete responsive presentation matrix.

Rendered operator or continuity records are immutable presentation inputs. The
child copies them into its own writable database and reads them through the
production application. It does not borrow a live operator or continuity
runtime.

### Operator and execution

`npm run test:e2e:operator-execution` is a focused developer convenience that
runs three independent Canonical children sequentially:

- `e2e-operator-review-control` owns authenticated review, Inspector,
  project-control, refusal/recovery, ReviewDecision, and Transition separation.
- `e2e-operator-native-host-execution` owns first-work activation, direct and
  managed deterministic native-host execution, approval/cancel/resume and
  bounded automation.
- `e2e-operator-multi-candidate` owns candidate selection, preview freshness,
  mutation locking, candidate-scoped GuideBrief, and exact decision/Transition
  targeting.

Each child has a distinct fixture profile, database, runtime, browser, profile,
operator credentials, signals, transport counters, and cleanup evidence. A
child may create only the exact effects declared by its profile.

### Continuity

`npm run test:e2e:continuity` runs the independent `e2e-continuity` child.

It owns portability and import, restart, recovery and reconciliation, imported
and persistent lineage, Personal Perspective continuity, and long-lived
project isolation. It does not own multi-candidate operator behavior.

The child builds an immutable source fixture, copies it to its own writable
database, starts its own runtime and Browser resources, and proves continuity
without relying on another Browser phase having run first.

### Thin cross-boundary golden path

`npm run test:e2e:golden` runs `e2e-golden` and proves only:

1. project connection;
2. first-work definition;
3. explicit deterministic local native-host start;
4. one admitted result receipt;
5. one proposal visible for review.

It uses production routes and persistence owners with a deterministic local
host seam. It does not repeat onboarding, responsive, approval lifecycle,
Inspector, decision/Transition, multi-candidate, portability, restart, or broad
refusal matrices. It makes no provider or external-network request.

## Aggregate Browser surface

`npm run test:e2e` runs these six phases and no legacy shadow:

1. `e2e-project-experience`
2. `e2e-operator-review-control`
3. `e2e-operator-native-host-execution`
4. `e2e-operator-multi-candidate`
5. `e2e-continuity`
6. `e2e-golden`

The operator parent command is not a nested receipt phase. Local Canonical
records its three children directly so timing, cleanup, and failures remain
attributable.

## Resource and lifecycle contract

Every Browser child independently owns:

- an immutable fixture copy and writable database;
- runtime-state and temporary roots;
- the runtime supervisor and complete process tree;
- application, bridge, and debug ports;
- Chrome, CDP, profile, and downloads;
- project roots and child-local credentials;
- any signals and deterministic transport state;
- request, response, console, page-error, and stream ledgers;
- shutdown, cleanup, and residue evidence.

No live writable database, runtime, listener, browser, CDP session, profile,
active-project selection, operator session, credential, signal, transport
counter, or mutable fixture directory is shared between children.

A successful child requires exact keyed field and marker completion, valid
field values, no unowned authority or execution effect, no unexpected external
request or Browser failure, credential/private-material safety, completed
shutdown, settled streams, and zero process/listener/file residue. `ok` remains
false until cleanup evidence is final.

The Canonical outer runner additionally requires exit code 0, natural and
observed exit, closed stdout/stderr, completed cleanup, no descendant cleanup,
and zero owned processes. A timeout or lifecycle defect is a failure.

## Authority and exact effects

Runtime contracts preserve these separations:

- assessment is not decision;
- decision is not Transition;
- result review is not semantic authority;
- a run receipt is not task success;
- automation configuration is not execution authorization;
- fixture state is not approval;
- a local session is not provider authority.

Operator children take public-safe exact state snapshots before and after
execution. Stable row identity and canonical row hashes keep insertions,
updates, and deletions distinct. Profile-local predicates bind permitted effects
to the exact project, root, packet, run, result, proposal, candidate, decision,
gate, Transition, and event ordering.

Delete-and-replace, in-place payload changes, wrong-project/root/lineage
changes, event substitution, memory or Perspective mutation, external effects,
and any extra session or control mutation fail even when aggregate counts are
unchanged. Successful results expose only the contract version, before/after
and exact-diff fingerprints, bounded operation counts, and zero-unowned-effect
evidence. Bounded public-safe row material is emitted only on failure.

## Permanent completion manifest

The owner manifest retains exact detailed field and marker sets because runtime
completion contracts consume them. It intentionally omits historical source
locations, source hashes, legacy anchors, shadow status, migration sequencing,
and legacy/new equivalence mappings.

At runtime each owner rejects missing, duplicate, or foreign fields and
markers. The manifest contract rejects duplicate ownership, missing command or
suite bindings, missing resource/lifecycle declarations, and incomplete
operator child unions. Source-code parsing is not part of permanent ownership.

## Changed-file selection

The Browser manifest remains the semantic owner map; the Local Canonical change
owner manifest decides whether that Browser ownership is narrow enough for an
`owner-targeted` plan. The planner applies both manifests conservatively:

- project entry, lifecycle, ProductShell, responsive, and presentation changes
  select project experience;
- operator session, review, native-host, automation, semantic decision, and
  candidate changes select the relevant operator children;
- portability, recovery, reconciliation, persistent lineage, and Perspective
  continuity changes select continuity;
- a known single detailed Browser owner may join typecheck and unit in an
  `owner-targeted` deciding plan after the fixed clean root and nested
  dependency preparation;
- first-work-to-result composition changes select golden plus affected detailed
  owners and therefore require `full-canonical` in the current planner;
- shared runtime, fixture, lifecycle, planner, executor, receipt, or ambiguous
  cross-owner changes select all six phases through `full-canonical`;
- multiple detailed Browser owners require `full-canonical`; a targeted plan
  cannot omit their cross-boundary proof;
- unknown or ambiguous verification ownership selects all six phases through
  `full-canonical`;
- full-canonical selects all six phases.

Documentation-only changes remain eligible for the existing bounded
documentation selection when their paths and links validate. Browser/product
deletion is not targeted in this version. Renames, executable-mode changes,
unknown paths, or invalid planner inputs fail closed.

## Deciding Local Canonical receipt

The planner writes the selected Browser phase IDs into its plan. Every selected
phase is bound to the exact receipt base and head and must appear exactly once.
For each required Browser phase, deciding evidence requires:

- pass status and exit code 0;
- exact base/head binding;
- natural and observed exit;
- closed streams and completed cleanup;
- zero owned-process and listener residue;
- no timeout, omission, skip, or stale result.

An absent, unrun, failed, timed-out, stale, or cleanup-incomplete selected phase
makes the aggregate receipt non-deciding. A focused owner result is deciding
only when the exact planner selected it inside an owner-complete exact-head
receipt; an arbitrary standalone focused run is diagnostic evidence, not a
substitute for that receipt.

## Timing policy

Responsibility boundaries determine the phases; duration does not. Timing
reports distinguish fixture construction, runtime and Browser startup,
semantic phases, navigation and bounded waits, request quiet, host barriers,
runtime and Browser shutdown, global cleanup, stream settlement, and total
duration.

Timeout is failure containment, not expected successful termination. The
architecture forbids pass-chasing retries, arbitrary sleeps, automatic timeout
widening, assertion removal, and equal-duration partitioning. Each owner must
retain meaningful normal-operation headroom and natural cleanup.

## Non-goals

This architecture does not change product, API, Core, protocol, schema,
authority, native-host, provider, or UI behavior. It does not create hosted
evidence, publish Local Canonical artifacts, dispatch workflows, or grant merge
authority.
