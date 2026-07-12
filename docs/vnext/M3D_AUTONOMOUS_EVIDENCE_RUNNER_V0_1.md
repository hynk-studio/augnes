# M3D Autonomous Evidence Runner v0.1

## Status and classification

`vnext_m3d_autonomous_evidence_runner.v0.1` is **Lab / verification
infrastructure**. It is a versioned local orchestrator for qualifying and
mechanically rehearsing the M3D operator path. It is not Augnes Core, a Product
Surface, a semantic writer, an approval surface, or a scheduler.

The runner may produce a public-safe qualification receipt, runner report, and
manifest plus a separately identified private backup. These are local
verification artifacts. They are not Augnes Evidence records, proof records,
`RunReceipt` records, `ReviewDecision` records, semantic transitions,
Perspective memory, work closure, or merge authority.

## CLI modes

The canonical checkout and run root are always explicit absolute paths.

```bash
npm run vnext:m3d-autonomous-evidence-runner-v0-1 -- \
  --dry-run \
  --canonical-checkout-root "$PWD" \
  --run-root "<ABSOLUTE_PROSPECTIVE_RUN_ROOT>" \
  --json
```

`--dry-run` canonicalizes the proposed layout, applies the existing M3D path
policy, checks the absent working-DB leaf and overlap rules, and returns the
bounded command/resource plan. It does not create the run root, clone, install,
open a DB, create a session, start Augnes, start a browser, write a receipt, or
allocate a chain.

```bash
npm run vnext:m3d-autonomous-evidence-runner-v0-1 -- \
  --qualify-only \
  --canonical-checkout-root "$PWD" \
  --run-root "<ABSOLUTE_EMPTY_RUN_ROOT>" \
  --json
```

`--qualify-only` creates a no-hardlinks disposable clone, provisions root and
`apps/augnes_apps` with `npm ci`, invokes portable and local-full qualification,
independently validates both receipts, and removes the execution/runtime
resources. It never allocates a chain or starts product rehearsal. Browser
absence is an explicit unqualified result; portable qualification is not a
substitute for local-full qualification. Cleanup failure is also qualification
failure: the runner returns `ABORTED`, `chain_id: null`, and
`runner_cleanup_failed`, and the CLI exits `1`.

Without either flag, full mode runs the same qualification pair, locks and
rechecks its identities, then allocates one opaque chain and begins the isolated
mechanical rehearsal. Do not invoke full mode for implementation-PR validation
or against the real Chain 6. The post-merge real evidence run is a separate,
user-owned operation.

Exit behavior:

- `0`: dry-run valid, qualify-only qualified, or autonomous mechanical
  rehearsal complete;
- `1`: `ABORTED` or `HOLD`;
- `2`: malformed invocation.

## Phase and verdict state machine

The executable phase order is:

```text
CHECKPOINT
→ PLAN
→ CLONE
→ PROVISION_ROOT
→ PROVISION_NESTED
→ QUALIFY_PORTABLE
→ QUALIFY_LOCAL_FULL
→ LOCK_QUALIFICATION_IDENTITY
→ ALLOCATE_CHAIN
→ CREATE_WORKING_DATABASE
→ MIGRATE
→ BASELINE
→ MECHANICAL_REHEARSAL
→ EXACT_REPLAY
→ BROWSER_REHEARSAL
→ FINAL_DATABASE_AUDIT
→ BACKUP
→ CREDENTIAL_AUDIT
→ REPORT
→ CLEANUP
```

Before a qualified chain exists, any invalid path, dependency failure,
qualification failure, receipt mismatch, dirty execution repository, stale
identity, or browser drift returns:

```json
{
  "verdict": "ABORTED",
  "phase": "RUNNER_QUALIFICATION",
  "chain_id": null
}
```

After allocation, a product or safety stop returns `HOLD` at the exact phase.
Exact-replay duplication, unexpected mutation, browser drift, credential
material, and cleanup uncertainty cannot be repaired and continued within the
same chain.

`COMPLETE_AUTONOMOUS_REHEARSAL` is emitted only after qualification, mechanical
and browser rehearsal, DB integrity, backup, credential audit, report, and
cleanup succeed. It means mechanical rehearsal only. It does not mean actual
user authorization, a product/user semantic transition, Reviewed Reuse,
Outcome Improvement, or M3 completion.

## Path and storage model

The runner reuses
`scripts/lib/m3d-evidence-runner-path-policy-v0-1.mjs`; there is no second path
policy. The default layout is:

```text
canonical run root
├── execution-repo
├── runtime
│   └── m3d-autonomous-rehearsal.db
└── evidence
    ├── qualification-portable-v0-1.json
    ├── qualification-local-full-v0-1.json
    ├── m3d-autonomous-evidence-report-v0-1.json
    ├── m3d-autonomous-evidence-manifest-v0-1.json
    └── private
        └── m3d-autonomous-rehearsal-backup.db
```

Runtime and evidence are canonical siblings. Checkout, execution repository,
runtime, evidence, working DB, receipts, reports, manifest, and private backup
are checked for canonical containment and overlap. The working DB must be a
strictly contained absent prospective leaf before qualification. Directory,
file, old SQLite-shaped file, symlink, dangling symlink, and other filesystem
objects fail closed without alteration. The default product/user DB leaf is
excluded structurally and is not statted, lstatted, realpathed, hashed, opened,
queried, or searched.

Immediately before allocation, the runner performs the storage gate again. It
requires the same canonical run, execution, runtime, and evidence identities;
the still-missing working-DB leaf; still-missing report, manifest, and backup
leaves; and the original receipt bytes, SHA-256 values, owner-only modes, and
evidence containment. Any intervening file, symlink, parent-identity, mode, or
receipt mutation aborts before the allocator is called.

Runner directories use owner-only intent (`0700`). Qualification receipts,
public-safe report/manifest, and the private backup use owner-only file intent
(`0600`). The backup is explicitly private and is not part of the public-safe
report payload.

## Qualification receipt lock

The runner invokes
`scripts/qualify-vnext-m3d-evidence-runner-v0-1.mjs`; it does not reimplement
qualification. For portable and local-full it independently checks:

- process exit status;
- bounded valid JSON on stdout and in the receipt file;
- byte identity between stdout and the promised receipt bytes;
- exclusive owner-only receipt placement below evidence;
- qualified status and all required false safety fields;
- application commit, Node major, platform, architecture, and both lockfile
  SHA-256 identities;
- exact clean execution repository;
- local-full browser executable name, SHA-256, and bounded version identity.

Both receipt identities must match. Their exact serialized bytes and hashes are
locked in memory and re-read from owner-only regular receipt files immediately
before allocation. Repository, path, lockfile, runtime, and browser identities
are rechecked at that same boundary, and browser identity is checked again
immediately before browser spawn.

## Structural allocation gate

The qualification-pair verifier creates a private in-process qualified-context
object. The allocator rejects ordinary or caller-forged objects. Only that
locked context can reach the allocator. The implementation smoke injects a
synthetic allocator and asserts zero calls for every pre-lock failure and
exactly one call for the fully locked path. No durable chain-ID store, product
schema, migration, or Chain 6 allocation is added.

## Mechanical and browser rehearsal

The default full adapter creates and migrates the runner DB in the named
`CREATE_WORKING_DATABASE` and `MIGRATE` phases, records the pre-rehearsal
baseline in `BASELINE`, and then invokes the existing isolated operator-pilot
smoke with an exclusive machine-readable phase protocol. The protocol records
whether `MECHANICAL_REHEARSAL` and `EXACT_REPLAY` completed and identifies the
exact phase of a subprocess failure. A post-allocation subprocess failure is
therefore a phase-specific `HOLD`; it cannot fall back to
`RUNNER_QUALIFICATION`.

Runner-managed mode gives the operator smoke the already-created exact DB below
runtime and asks it to emit a manifest for the packet, transition, later result,
and context-use-review lineage produced in that DB. Browser rehearsal consumes
that same DB and manifest without copying or invoking a second operator fixture,
then checks Project Home, Workbench lineage, packet page/API, and 390/768/1440
viewports. The existing copied-fixture standalone operator and browser commands
remain unchanged. The runner consumes only bounded JSON summaries; it does not
persist raw command output, bootstrap tokens, cookies, action nonces,
environment dumps, prompts, transcripts, or private DB rows.

The mechanical path remains synthetic fixture material. Loopback-only
browser/server checks reuse the existing candidate order and CDP restrictions.
No provider/model call, GitHub mutation, external actuator, LAN exposure, CORS
widening, or remote-debugging exposure is enabled.

## Reporting, backup, and cleanup

The public-safe report and manifest contain version, verdict, phase, bounded
qualification identities and hashes, phase status, DB integrity, backup hash,
cleanup status, skipped reasons, and explicit all-false authority claims. They
contain no raw private paths or credential-shaped values. The SQLite backup is
separate private material and is referenced publicly only by basename and
SHA-256.

Each public JSON file uses an owner-only exclusive no-follow create. Its
evidence root, parent, and final regular-file identity are canonically
requalified around creation. Existing or dangling symlink leaves, escaping or
changed parents, concurrent leaf creation, and partial writes fail closed;
files partially created by the writer are removed best-effort before the error
is returned.

Execution clone, runtime DB, WAL/SHM, operator fixtures, browser profile,
listener, and other bounded runtime resources must be removed. A cleanup
failure prevents `COMPLETE_AUTONOMOUS_REHEARSAL`; it returns `HOLD` after
allocation or `ABORTED` in qualify-only mode.

## CI boundary

CI may install both dependency boundaries, run the qualification smoke, run the
deterministic autonomous-runner orchestration smoke, run `--dry-run`, and run
portable qualification on supported Node 22 macOS/Linux jobs. CI does not run
full mode, allocate the real Chain 6, open a product/user DB, start the real
operator pilot, claim local-full without a browser, write Augnes proof/Evidence/
Perspective/memory, or call providers and external actuators. Workflow
permission remains `contents: read`.

## Post-merge Chain 6 boundary and non-claims

Before any user-owned post-merge Chain 6 run, start from a current clean
canonical checkout, create a new empty run root, run `--qualify-only`, inspect
both receipt identities, and separately decide whether to invoke full mode.
Do not combine Chains 1 through 5, reuse their DBs, or rewrite their verdicts.
Any failed or held attempt requires a new isolated environment, DB, and chain.

This implementation and its permanent smoke do not allocate or execute the real
Chain 6. They do not create actual user authorization, actual product/user
semantic transition, Reviewed Reuse, Outcome Improvement, or M3 completion.
