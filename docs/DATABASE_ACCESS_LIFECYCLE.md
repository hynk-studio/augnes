# Database access and lifecycle ownership

An ordinary main-store operation uses `lib/db.ts::openDatabase()` (or the
shared `lib/db/prepared-database.mjs::openPreparedDatabase(path)`). It connects
to the intended existing file, enables foreign keys for that connection, and
validates readiness in a read transaction. It never creates a directory or file,
runs migrations, or repairs schema. The returned connection remains writable;
its caller owns closure. Failed acquisition closes the constructed connection
before propagating the primary error. If closure also fails, both failures are
retained in an `AggregateError` with the primary failure as its cause.

Readiness uses the existing structural-schema inspector, migration ledger and
package-identity guard. The checked-in expected structural signature is compared
with canonical migration output by `scripts/test-database-access.ts`, registered
through the existing continuity-pins integration check. A schema change must
update that source signature and pass the parity regression. No path-level or
process-level readiness result is cached: each new connection checks its own
image, including after path changes and restore/replacement. This is connection
admission, not a substitute for recovery's full record/invariant validation.

| Consumer | Preparation owner and access boundary |
| --- | --- |
| UI/API reads and writes; CLI consumers of `lib/db.ts` | Ordinary access only. Canonical-store autonomy/research readers and writers, runner-ledger helpers, onboarding and native run helpers no longer prepare schema transitively. |
| Normal source startup and installed Companion | The existing supervisor calls `prepareRuntimeDatabase` before starting its application children. No additional user setup command is required. |
| Distributable installation, upgrade and restart | Existing launcher/supervisor and bootstrap owners retain staged migration, package identity, verification and publication/rollback. Shared inspection/ownership modules are included in package support files. |
| Backup, restore and interrupted recovery | Existing recovery and runtime-bootstrap owners retain exact schema admission, record validation, lock/journal ownership, selection invalidation and restart verification. Ordinary access never initiates recovery. |
| Explicit `db:init`, `db:migrate`, reset/demo and build fixtures | `db-common.mjs` owns explicit creation/configuration; `applyCanonicalDatabaseMigrations` remains the migration orchestrator. `initializeDatabase()` owns an internally opened handle until return; a supplied handle remains owned by its caller, including on failure. |
| Disposable test and dogfood fixtures | Their explicit builders prepare through the canonical migration/bootstrap owner before ordinary access, including runner-ledger path overrides. Tests needing an intentionally partial schema use their own raw, explicitly owned connection. |
| Separate temp-only research/prototype stores | Their explicit store-specific fixture/preparation functions remain separate. They are not accepted as prepared main stores and do not expand bootstrap recovery admission. |

Both explicit CLI initialization and supervised startup use
`scripts/canonical-database-migrations.mjs`. Its complete output already covers
the tables/indexes previously prepared by ordinary main-store access; the
duplicate lazy migrators have been removed. Startup adds staged publication,
record validation and recovery admission around that same orchestrator.
`scripts/augnes-runtime-supervisor-core.mjs` chooses preparation or restore
before launching children. Backup/restore continues through
`scripts/recovery-backup.mjs` and `scripts/runtime-database-bootstrap.mjs`.

`getDatabasePath()` retains the existing environment/default resolution and build
isolation guard. A missing intended store never redirects to a default store.
`database_missing`, `database_unprepared` (empty or recognized predecessor),
`database_incompatible` (unsupported schema or invalid ledger/identity metadata),
and `database_unavailable` (other connection/setup failures) remain distinct.
The continuity-pins boundary returns a safe 503 and an actionable bounded message,
never an empty successful collection, private path, or raw diagnostic cause.
Internal causes remain available for local diagnosis. Existing request/security
validation runs before storage access.

The raw Next.js child entry is not a lifecycle owner; normal use continues through
the supported supervisor/launcher. This change does not alter tables, record
formats, Core meaning, fingerprints, scoring, project isolation or authority.
Source qualification and installed-runtime adoption remain separate.
