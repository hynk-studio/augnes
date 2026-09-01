# Repository retention and reduction policy

## Role

This is the durable, phase-neutral policy for classifying current repository
material during an explicitly authorized retention, reduction, absorption, or
deletion task.

It does not own product doctrine, Core/protocol semantics, implementation
status, research claims, or cleanup sequencing. Those topics remain with the
[authority map](./vnext/00_AUGNES_VNEXT_DOCUMENT_INDEX.md) and its active
owners. This policy supplies classification and proof requirements only; it
never authorizes a disposition by itself.

[Issue #1170](https://github.com/hynk-studio/augnes/issues/1170) is the current,
temporary authorization to begin proof-backed C9 and repository cleanup. C9 is
authorized and current under that program, but it is not complete. Issue #1170
is not blanket deletion authority: every removal or replacement still needs an
exact reviewable scope and the proof required below. Current status belongs to
the [roadmap](./vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md), and the temporary
C9 boundary remains with the
[correction charter](./vnext/07_AUGNES_POST_BUILD_WEEK_PRODUCT_UX_CORRECTION_CHARTER.md)
until its separately reviewed closeout.

## Governing rules

- Current responsibility, consumers, data, safety, authority, and replacement
  evidence decide whether material remains in current source.
- A name, directory, age, phase label, lack of navigation, static-import result,
  or historical origin is not enough to keep or delete anything.
- Git history is the primary archive. Historical value alone does not require a
  current executable or default-authority copy when no current consumer,
  retention requirement, or support obligation remains.
- Unknown consumers, data effects, authority effects, or rollback behavior
  block removal. Unknown is not evidence of obsolescence.
- Preserve current user data, behavior, compatibility, and recovery until an
  explicitly authorized replacement proves parity and rollback.
- Classification does not override an active owner or expand product,
  semantic, execution, external-effect, publication, or merge authority.

## Responsibility classes

Every in-scope path or coherent family must receive one or more of these
classifications:

| Class | Meaning |
|---|---|
| `KEEP_RUNTIME` | Used by the current product runtime, supported host path, route, API, package, or integration. Record the exact owner and consumer. |
| `KEEP_DATA` | Required for current data, schema compatibility, migration, export/import, backup, restore, recovery, replay, or portable history. |
| `KEEP_SAFETY` | Enforces security, credential containment, project isolation, authority separation, idempotency, stale/replay refusal, process ownership, rollback, or another current safety invariant. |
| `KEEP_RESEARCH_ACTIVE` | Required by research that the sequencing owner still classifies as active or current, including its bounded method, data, harness, or review obligation. Research presence creates no product or runtime authority. |
| `KEEP_TOOLBOX` | Has a current authority-documentation, product-entry, developer, operator, verification, test, build, package, licensing, or maintenance consumer without being product runtime. |
| `ABSORB` | Contains a durable responsibility that must move to the active owner or canonical consumer before the original material can retire. |
| `RETIRE_HISTORY` | Serves only historical, closeout, or superseded-program use and may leave current source after consumer, data, retention, and reference proof. Git history or a bounded historical pointer remains the archive. |
| `DELETE_WITH_REPLACEMENT` | Provides current behavior or compatibility that may be removed only in the same reviewed change as a proven replacement, migration path where needed, and rollback. |

Multiple keep classes may apply. The most protective applicable class controls
until a reviewed change proves that responsibility has moved or ended.
`RETIRE_HISTORY` and `DELETE_WITH_REPLACEMENT` are candidate dispositions,
not permission to delete.

## Required disposition proof

Before removing, absorbing, redirecting, demoting, or replacing current
material, the reviewable change must provide:

1. **Exact scope and identity** — repository, base, head, changed paths, and the
   exact path or compatibility family being dispositioned.
2. **Active owner** — the current product, protocol, sequencing, evaluation,
   implementation-contract, research, data, safety, or toolbox owner.
3. **Consumer proof** — production imports, dynamic or string-addressed use,
   routes and deep links, package commands, hosts, MCP/App tools, fixtures,
   documentation links, archived evaluation use, and known external consumers.
4. **Data proof** — population, readers and writers, schema/migration effects,
   export/import, backup, restore, recovery, replay, and historical readability.
5. **Authority proof** — semantic, execution, external-effect, publication, and
   merge authority remain unchanged; projections, candidates, recommendations,
   results, and research output do not gain accepted-state meaning.
6. **Safety proof** — security, credentials, project isolation, idempotency,
   stale/replay refusal, process ownership, cleanup, and failure containment
   remain owned.
7. **Replacement parity** — the exact current responsibility and supported user
   or operator path that absorbs the behavior, including compatibility and
   failure semantics.
8. **Rollback proof** — how a failed migration or replacement is refused,
   reversed, restored, or otherwise recovered without losing current state.
9. **Verification proof** — focused owner checks plus the repository-owned
   planner's deciding verification for the clean exact final head.

If a proof category is genuinely inapplicable, record why. Silence is not an
inapplicability finding.

## Command-backed manifest

An implementation deletion or replacement PR must carry a command-backed
manifest sufficient to review at least:

```text
path_or_family
classification
active_owner
current_consumers
runtime_route_host_or_package_use
dynamic_string_deep_link_or_external_use
data_migration_export_backup_restore_or_replay_effect
authority_and_safety_effect
replacement
rollback
verification
unresolved_unknowns
```

The manifest may live in the issue, pull request, or another explicitly owned
review artifact. This policy does not require a permanent repository report
when the evidence is reviewable without one.

## Disposition rules

### Keep

Material classified `KEEP_RUNTIME`, `KEEP_DATA`, `KEEP_SAFETY`,
`KEEP_RESEARCH_ACTIVE`, or `KEEP_TOOLBOX` remains until the relevant owner
and consumers are removed, replaced, or reclassified with proof. A current
responsibility may be simplified or consolidated, but its behavior and
authority obligations remain.

### Absorb

`ABSORB` requires the active owner or canonical consumer to receive the
durable responsibility before, or atomically with, retirement of the original
material. Moving words without moving ownership, tests, or behavior is not
absorption.

### Retire history

`RETIRE_HISTORY` requires proof that no current runtime, data, safety,
research, toolbox, compatibility, support, or known external consumer depends
on the current copy. Update active links and owner maps in the same reviewed
scope. Preserve exact historical claims rather than relabeling incomplete,
blocked, failed, inconclusive, or `not_tested` work as completed.

### Delete with replacement

`DELETE_WITH_REPLACEMENT` requires current-behavior parity, consumer and data
proof, failure and rollback coverage, and exact-head verification in the same
reviewed scope. Current route names, APIs, schemas, packages, types, deep links,
and compatibility behavior remain until that proof exists.

## Durable boundaries

- Product and Core responsibilities remain with `01` and `02`; cleanup does
  not redesign them.
- Current sequencing and research classification remain with `03`; a cleanup
  task does not activate, reinterpret, or complete research.
- The temporary C9 proof boundary remains with `07` while C9 is current.
- Data-bearing or recovery material cannot retire from reachability alone.
- Safety and authority enforcement cannot retire because a happy-path consumer
  is absent.
- Historical repositories, plans, milestones, and closeouts provide provenance,
  not current execution or deletion authority.
- One cleanup issue may coordinate reviewed slices, but it cannot pre-approve
  the contents of a later deletion PR.

## Historical framing

Earlier R1–R8 destinations, Perspective-lab lanes, merged C2–C7 implementation
instructions, M3D narration, and PR-specific exclusions remain available in Git
history and the bounded historical owners that still need them. They do not
classify current source or define a new cleanup roadmap here.
