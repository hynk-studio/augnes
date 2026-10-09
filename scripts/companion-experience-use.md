# Ordinary experience use: a different goal and a changed contract

This runnable, developer-exposed example for [#1427](https://github.com/hynk-studio/augnes/issues/1427)
produces three actual JSON files using Node's builtins. It connects normal
authenticated Companion tools to consumer-owned execution in fresh directories
outside the checkout. No backend, DTO, store, selector or writer was added.
The optional task archive was not used: fixtures were reconstructed from the
[complete assignment](https://github.com/hynk-studio/augnes/issues/1427#issuecomment-6073639283).

## Run and inspect

Use the repository's prepared supported Node/dependencies and the normal checkout
and maintenance owners when required by the current development lane:

```sh
node --import tsx scripts/test-companion-experience-use.ts
```

To retain the synthetic outputs, delivered code, manifests, complete tool
requests/results, execution observations and adaptive-memo arrangement, supply
one **new absolute** output directory as the final argument. Without it all
temporary files are removed. The explicit export copies only synthetic evidence;
it never copies the disposable database, runtime access files or credentials.
The report records actual execution paths before cleanup; exported copies are
not misrepresented as those original locations. Retained output directories are
caller-owned evidence to keep or remove deliberately.

The entry creates one disposable migrated database and project through the normal
identity/selection owners. Initial task, revisions, retained lookup and different
task preparation go through the actual proxy → loopback HTTP → authenticated
production routes, with fixture-only runtime identity/access material. This is
production-shaped development evidence, **not installed-client or live-service
adoption**. Read, preview and refusal paths are checked for no database mutation.
The listener, DB handle, child streams/processes and temporary root are settled.
Canonical projects, active selection, installed plugin and public release are not
inputs or mutation targets.

## Inputs and output contracts

The [fixtures](fixtures/experience-use/) are synthetic tables, not production logs.
Input JSON, worker code and evaluator-only answers are separate files. Workers
receive only their one input, explicitly delivered method files and `assets.json`;
the evaluator file is never delivered. The manifest deterministically binds a
fixed file inventory, lengths, SHA-256 hashes and an identity over that inventory.
The dependency-free callable is separate from each report's population filter.

- **A** consumes `a.json` / `build-events.v1` and writes
  `success-latency.json`: input/unique/duplicate counts, excluded failure count,
  successful attempts and event-ID-sorted successful rows, total/max integer ms,
  input hash and method identity. It uses success-only filtering for its dashboard.
- **B** consumes `b.json` / v1 and writes `capacity-audit.json`: every unique
  attempt including failures and retries, success/failure counts and times, total
  time, rows, per-job attempt/time/failure totals and source/method identities.
  It calls A's exact normalization bytes delivered to B's directory. A's dashboard
  filter and alphabetical display preference do not govern this different goal.
- **C**, a changed-condition control of B, consumes `c.json` / v2 and writes
  `capacity-audit-v2.json` with the same audit contract. The original v1 callable
  first refuses v2 without output. A separately identified v2 adapter maps
  `outcome` and already-integer `elapsed_ms`; original v1 remains unchanged.

V1 accepts exact `event_id`, `job_id`, positive integer `attempt`, `status`
(`ok`/`failed`) and unsigned decimal-string `duration_s` with at most three
fraction digits. Conversion is exact integer arithmetic. V2 instead requires
`outcome` (`passed`/`failed`) and nonnegative safe integer `elapsed_ms`, not Boolean.
Unknown/missing fields, versions, units or conflicting duplicate IDs refuse.
Identical repeated events are duplicate delivery; distinct attempts under one job
remain genuine retries. JSON integer overflow refuses rather than rounding.
Totals measure **worker time**, not elapsed makespan, savings or empirical benefit.
Validation finishes before writing the output; a conflict preserves a previous
complete file. The fixture CLI is bounded pure-data code, not a general sandbox.

Each retained worker directory can run its delivered CLI without a repository:

```sh
node process-events.mjs capacity v1 b.json capacity-audit.json
```

For C use `capacity v2 c.json capacity-audit-v2.json`; for A use
`success v1 a.json success-latency.json`. The output observation identifies the
actual executed/imported paths, runtime, cwd and output hash. There is no import
override or checkout fallback. Missing/tampered dependencies refuse before import.

## Reusable caller sequence

[`ordinaryExperienceUse(call, repositoryRoot)`](companion-experience-use.mjs)
accepts the harness's normal MCP `call(name, arguments)` seam. It is a thin caller,
not a policy or selector. A real consumer supplies authorized definitions,
source choices, omission reasons and complete attributed notes. It does not
receive evaluator-only packet data. Source text remains untrusted context.

1. `read()` obtains Resume plus selected sources with the exact fresh binding.
   Complete A externally and save the actual report, callable identities and
   qualifications using `write("revise", current, changes)`.
2. If relevant A material was deselected, `lookup(current, explicitQuery)` while
   A remains current. Inspect the returned note/occurrence/cutoff, then reselect
   the exact `source` via `retained_source_refs`. Do not reconstruct notes from
   sanitized source projections. Read fresh current bindings.
3. Against B's declared goal, separate unchanged support from recheck conditions
   and irrelevant/A-specific advice. Persist the current-goal interpretation
   separately with provenance `derived_interpretation`.
4. `write("different", current, completeChanges)` explicitly supplies goal,
   criteria, non-goals, `sources.keep`, every omission reason and optional added
   interpretation. It previews/saves with complete bindings and independent
   authentication, then reads again. A is not marked complete. Historical lookup
   after this edge covers B's suffix; resolve A omissions before crossing it.
5. Check the fresh goal/support/interpretation **before processing B**. Verify
   and execute the delivered assets in independently authorized local scope.
   Save the observed output as `imported_unverified` and interpretation separately.
6. If a condition changes, retain the refusal, explicitly qualify an adaptation
   or alternative, preserve the original bytes/behavior, revise and read back.
   Unknown/uncertain saves stop; deliberately read to reconcile before another
   decision. There is no automatic replacement save or permission expansion.

The example's source-selection choices are scripted and exposed. It deliberately
deselects/reselects A's asset note to exercise the historical boundary, rather
than claiming that step is necessary every time. All notes fit 2,000 Unicode code
points, eight selected notes and the native packaged limit. No managed RunReceipt,
effective direction change, learned probability or semantic acceptance is created.
The retry-inspection outlook is inapplicable to these exact ledger calculations.

## Evidence and comparison limits

The evaluator checks actual output files against the issue's isolated answers and
an independent rational sum. Controls cover success-only harmful transfer,
conflicting duplicate IDs, missing/tampered asset bytes, version/unit change,
irrelevant display advice, source cutoff, old packet reconstruction and unchanged
v1 output. Expected refusals remain in the trace; they are not failed producer
attempts invented as learning history.

`adaptive-memo-reference.json` preserves B's goal, the same raw A source bindings,
cutoff, callable inventory, input identity and tool/resource access. This strong
reference may reason, inspect sources, edit/revise code and synthesize equivalent
guidance. Blind replay of A's success-only filter is a harmful-transfer negative
control, **not that baseline**. A fixed live-model comparison is NOT_RUN. The
developer sees all tables, evaluator answers and controls; no autonomous selection,
independent demand, learned superiority or general transfer advantage follows.
The justified narrow decision is to retain v1 for v1, reuse normalization rather
than A's filter for B, and retain a separately qualified v2 adaptation for C.
