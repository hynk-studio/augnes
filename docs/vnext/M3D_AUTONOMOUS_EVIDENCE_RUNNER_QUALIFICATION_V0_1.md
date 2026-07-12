# M3D Autonomous Evidence Runner Qualification v0.1

## Purpose and classification

`vnext_m3d_evidence_runner_qualification.v0.1` is a deterministic local gate
for the environment that may later host an M3D autonomous evidence runner. It
is classified as **Lab / verification infrastructure**.

The gate does not implement or start the evidence runner. It does not execute
an evidence chain, allocate a chain ID, start Augnes, open a database, create an
operator session, or write proof, Evidence, Perspective, memory, semantic
state, or work closure. Its public-safe JSON receipt is a local verification
artifact, not an Augnes semantic record or durable product contract.

The v0.1 gate supports macOS and Linux. It does not claim Windows support.
It requires Node.js 22 or newer.

## Separate namespace

This qualification gate is separate from the existing
`autonomy_runner_preflight.v0.1` product compatibility contract. The existing
preflight describes preview/readiness semantics. This gate qualifies local
dependencies, paths, loopback behavior, and an optional browser executable.
Neither contract is renamed or repurposed by the other.

## Provisioning and dependency boundaries

Qualification never installs or repairs dependencies. Provision both package
boundaries first:

```bash
npm ci
npm --prefix apps/augnes_apps ci
```

The gate requires the root and nested `package.json`, `package-lock.json`, and
`node_modules` entries. Root and nested `node_modules` directories must not be
symlinked. Root `.bin/tsx`, `.bin/tsc`, and `.bin/next`, plus nested `.bin/tsx`
and `.bin/tsc`, must resolve to executable regular files inside their own
dependency trees and complete bounded direct version probes. A bounded Node
load probe resolves `better-sqlite3` from a `createRequire` boundary anchored at
the execution repository's root `package.json`. The canonical resolved module
must be a regular file inside that repository's root `node_modules`, and the
probe loads that exact resolved path. The probe child receives no `NODE_PATH`
or `NODE_OPTIONS`; a parent/global dependency, external override, or local
package symlink that resolves outside the repository fails with
`root_native_dependency_unavailable`. Loading the module does not construct a
database or open a database path. The gate does not use `npm install`, `npx`, a
global executable, or dependency material borrowed by symlink from another
checkout.

The execution repository must be a clean Git checkout. Exact
`git status --porcelain --untracked-files=all` output must be empty, so tracked
modifications and untracked application files both invalidate qualification.
The recorded application commit therefore describes the exact qualified source
material rather than only the repository's current `HEAD` pointer.

The receipt records SHA-256 identities for both lockfiles. It never reads or
reports `.npmrc`, tokens, registry credentials, or an environment dump.

## Canonical path model

Every path is validated as a non-empty absolute path without NUL or control
characters. Existing paths are resolved with the platform realpath primitive.
Containment is then evaluated only between canonical identities with
`path.relative`:

- an empty relative value means the candidate equals the root and is allowed;
- an absolute relative value is rejected;
- `..` or `..` followed by the platform separator is rejected;
- every other relative value is within the root.

String prefix comparison is not used. Consequently a sibling such as
`run-evil` is not treated as a child of `run`.

Lexical aliases are not replaced by an operating-system-specific exception.
For example, when macOS maps `/tmp` to `/private/tmp`, both the allowed root and
candidate are independently canonicalized before comparison. The permanent
smoke also creates a symlink alias on every supported platform, so Linux does
not depend on having a built-in temporary-directory alias.

## Prospective paths and root derivation

For a path that does not exist, the gate walks upward to the nearest existing
ancestor, canonicalizes that ancestor, and appends the normalized missing
segments. Empty, `.` and `..` missing-segment ambiguity is refused. Once a
path is created, it can be requalified as an existing path; an identity change
is a failure.

Callers must canonicalize a received or created run root before deriving
children:

```text
lexical run root
  -> canonical run root
     -> runtime root
     -> evidence root
     -> working database path under runtime
```

Runtime and evidence roots must be separate. Both must be outside and
non-overlapping with the canonical product checkout. The prospective working
database must be strictly inside the canonical runtime root and outside the
checkout. The execution repository is also an execution root: it must be a
disposable clone that is separate from the canonical checkout, runtime,
evidence, and working-database path in both containment directions. This also
forbids storage below ignored paths such as the execution repository's
`node_modules`. Repository overlap fails with the stable
`execution_repository_checkout_overlap`,
`execution_repository_runtime_overlap`,
`execution_repository_evidence_overlap`, or
`execution_repository_working_db_overlap` reason. Lexical aliases that resolve
to one canonical identity do not bypass these checks.

## Symlink policy

Existing symlinks are inspected with `lstat` semantics before resolution. A
dangling leaf or intermediate symlink fails with `dangling_symlink`; it is not
treated as an ordinary missing prospective segment. An existing alias may
resolve only when its canonical target remains safely contained. A symlink
below an allowed root that targets outside fails with `symlink_escape`, and a
working-DB leaf may not already be any symlink. The working DB must be a missing
prospective leaf when qualification runs. Equality with runtime, an existing
directory, regular file, old SQLite file, symlink, dangling symlink, or other
filesystem object fails closed with `working_db_path_exists`,
`working_db_path_invalid_type`, `symlink_escape`, or `dangling_symlink` as
applicable. Existing DB-shaped bytes are neither opened nor inspected. A caller
must requalify after creating a prospective path so that a newly introduced
symlink cannot silently change its identity.

The qualifier creates only a bounded path-policy fixture below the supplied
runtime root. That fixture checks prospective identity and symlink escape, and
is removed before the qualifier returns. The prospective working database is
never created.

## Structural default-database exclusion

The canonical checkout directory may be canonicalized to enforce isolation.
The default database leaf is not inspected: the qualifier does not stat,
lstat, realpath, checksum, open, query, or search for it. Runtime, evidence,
and working-database candidates that overlap the checkout are rejected before
any fixture is created.

Every receipt therefore reports:

```json
{
  "database_opened": false,
  "default_database_inspected": false
}
```

These fields describe the qualifier's structural behavior, not an observation
of the product database.

## Loopback qualification

Portable and local-full modes use Node's `net` API to bind an ephemeral server
to `127.0.0.1` with port `0`. The gate verifies the assigned address is IPv4
loopback, closes the server, and verifies the released port no longer accepts a
connection. It does not use `lsof`, `0.0.0.0`, a LAN interface, or a public
interface, and it leaves no listener running.

Failure of the IPv4 loopback probe makes the result unqualified.

## Modes

### `portable`

Portable mode is the CI and pure-runner gate. It checks:

- supported platform and Node version;
- root and nested dependency boundaries and lockfile hashes;
- canonical and prospective path handling;
- symlink escape and structural checkout isolation;
- working-database placement;
- loopback allocation and release;
- public-safe receipt behavior.

Browser qualification is `not_applicable` and `browser_qualified` is `null`.

### `local_full`

Local-full mode includes every portable check and discovers the browser
executable in the same order as the existing M3D Chrome/CDP harness:

1. `AUGNES_BROWSER_EXECUTABLE_PATH` or explicit CLI override;
2. macOS Google Chrome;
3. macOS Chromium;
4. macOS Microsoft Edge;
5. Linux `google-chrome`;
6. Linux `google-chrome-stable`;
7. Linux `chromium`;
8. Linux `chromium-browser`.

The selected path must resolve to an executable regular file. The exact binary
is invoked once with only `--version`, bounded output, and a five-second
timeout. No profile or page is created, no CDP connection is opened, and the
probe performs no configured network action. The synchronous probe must finish
before the receipt is emitted. Its public identity includes only the executable
basename, SHA-256, and bounded version summary.

## CLI

Both modes require explicit repository, runtime, evidence, working-database,
and canonical-checkout roots. Storage never defaults into the repository.

```bash
CANONICAL_CHECKOUT="$PWD"
QUAL_ROOT="$(mktemp -d)"
trap 'rm -rf "$QUAL_ROOT"' EXIT
CANONICAL_QUAL_ROOT="$(cd "$QUAL_ROOT" && pwd -P)"
git clone --local --no-hardlinks \
  "$CANONICAL_CHECKOUT" \
  "$CANONICAL_QUAL_ROOT/execution-repo"
npm --prefix "$CANONICAL_QUAL_ROOT/execution-repo" ci
npm --prefix "$CANONICAL_QUAL_ROOT/execution-repo/apps/augnes_apps" ci

node "$CANONICAL_QUAL_ROOT/execution-repo/scripts/qualify-vnext-m3d-evidence-runner-v0-1.mjs" \
  --mode portable \
  --repo-root "$CANONICAL_QUAL_ROOT/execution-repo" \
  --runtime-root "$CANONICAL_QUAL_ROOT/runtime" \
  --evidence-root "$CANONICAL_QUAL_ROOT/evidence" \
  --working-db-path "$CANONICAL_QUAL_ROOT/runtime/rehearsal.db" \
  --canonical-checkout-root "$CANONICAL_CHECKOUT" \
  --output "$CANONICAL_QUAL_ROOT/evidence/qualification.json" \
  --json
```

Use `--mode local_full` for the bounded executable probe. An explicit
`--browser-executable <absolute path>` has the same first-candidate role as the
environment override. `--output <absolute path>` exclusively creates a new
owner-only (`0600`) public receipt strictly below the canonical evidence root.
It refuses existing files, symlink or dangling-symlink leaves, parents that
escape evidence, runtime/checkout locations, the working-DB path, and every
location overlapping the execution repository. The last case reports
`qualification_output_inside_execution_repository`. Nested evidence directories
may be created with owner-only intent. The created file is canonicalized again
and removed if final containment or write validation fails.

Exit behavior is stable:

- `0`: `status=qualified`;
- `1`: `status=unqualified`;
- `2`: malformed invocation or unsupported platform.

Failures are emitted as structured, public-safe JSON or a bounded summary.
Private paths and stack traces are not the only failure output.

## Receipt and invalidation

The receipt includes the qualification version and mode, exact application
commit, platform, architecture, Node version and major, both lockfile hashes,
bounded check results and reason codes, redacted root basenames, dependency,
path, loopback, and browser status, plus all-false semantic/database/credential
execution fields.

A receipt is invalid after any change to:

- application commit;
- qualification code version;
- Node major version;
- platform or architecture;
- either package-lock hash;
- selected browser executable identity or browser version in local-full mode.

A future Chain 6 consumer must run both modes in the intended environment and
recheck these identities immediately before execution. That consumer and the
autonomous runner are not implemented here.

## Failure classification

The gate returns only `qualified` or `unqualified`. It does not return `HOLD`,
`COMPLETE_AUTONOMOUS_REHEARSAL`, or `M3_COMPLETE`. A future wrapper may map an
unqualified result to:

```text
ABORTED
PHASE: RUNNER_QUALIFICATION
```

`HOLD` remains reserved for a product evidence chain that already passed
qualification and later encountered a product or safety stop. Missing nested
dependencies, path-policy regression, browser absence, loopback failure, or an
invalid root are runner qualification failures and are not product evidence.

## Historical relationship and maturity

Chains 1 and 2 exposed product integration defects later corrected in PRs
#1064 and #1065. Chains 3 through 5 did not evaluate the product path: they
ended on default-DB scope discipline, the missing nested dependency boundary,
and lexical-versus-canonical temporary-root identity respectively. Their
historical reports remain under the contracts active at the time; this gate
does not rewrite those verdicts.

The qualification gate does not start Chain 6 and does not advance M3
maturity. A passing receipt establishes only that this versioned local runner
environment gate passed in the recorded environment.

## CI

`.github/workflows/m3d-evidence-runner-qualification.yml` runs on pull requests
and pushes to `main` with `contents: read`. A Node 22 matrix covers
`ubuntu-latest` and `macos-latest`, provisions both dependency boundaries, runs
the permanent smoke, and runs portable qualification under a canonical
temporary root. It does not start Augnes, a browser, CDP, or an evidence chain,
and it does not open a database.

The CI command uses the clean checked-out workspace as its execution repository
and an explicit synthetic canonical-checkout fixture under the temporary root.
The permanent smoke independently proves checkout equality, parent/child
overlap, execution-repository storage overlap (including `node_modules`), fresh
working-DB leaf enforcement, repo-local native dependency resolution, and
receipt-output isolation. This CI self-test is not a Chain 6 qualification
receipt and does not weaken the disposable execution-repository rule.
