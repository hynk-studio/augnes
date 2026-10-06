# Web Augnes planning workspace

One configured owner keeps independent planning work, its attributed context and
explicitly selected small files. Web work neither reads the installed Augnes
database nor creates native work, results or accepted state.

[#1351](https://github.com/hynk-studio/augnes/issues/1351) completed private
branching/incorporation through merged #1353; [#1356](https://github.com/hynk-studio/augnes/issues/1356)
accepted its bounded direct-Cloudflare hosted synthetic journey.
[#1364](https://github.com/hynk-studio/augnes/issues/1364) accepted a same-Worker
Saved-context navigation update and preservation report. Its anonymous HTTP 403
remains an unclassified refusal and its expected-302 assertion remains failed;
that review did not independently rehash the new Mac-local exports.
[#1366](https://github.com/hynk-studio/augnes/issues/1366) completed one assisted
research succession and return of reproducible results, not separate-task
transfer or comparative usefulness. Its original analysis, qualifications,
reconstructed failed requests and recovery burden remain intact.

[#1369](https://github.com/hynk-studio/augnes/issues/1369) completed capacity
feedback through merged #1370; [#1371](https://github.com/hynk-studio/augnes/issues/1371)
accepted its same-Worker rollout and actual private attachment review. One
synthetic work used 11,947 → 13,713 unsaved → 10,954 source bytes with two recovery
edits and no failed UI save. All five pre-existing works' actual complete exports
were byte-identical before/after. Sign-in and operator repairs, limited security
observations and lack of general time-saving evidence remain. #1354's separate
Sites rollout is deferred; its resources and evidence are untouched.

## Cumulative saved history (#1397)

The current local candidate removes the Web revision-32 lifetime constraint.
The same saved work can continue through ordinary edits and supported
incorporation. Revision identities are positive safe integers; envelopes,
request keys, predecessor fingerprints, provenance, judgments and file bodies
are unchanged. Saved work already has no expiry. The independent 24-hour save,
operation-ticket and CSRF seals remain unchanged, including read-only resolution
of an original request after its ticket expires. No credential, native grant,
execution, synchronization or automatic retry is added.

The existing primary SQL observation remains atomic. There is **no history
pagination**: the statement observes the erased-ID guard, ordered envelopes,
indexed identities, completeness counts/bytes and file metadata together. It
scans at most 1,025 envelope rows and 17 file metadata rows. A required summary
must agree with every returned row; missing, reordered, malformed, foreign or
oversized history refuses in full. Oversized data returns only its refusal
summary, never a valid-looking prefix. Validation visits each envelope once,
without recursive ancestry or repeated prefix reconstruction. Current Saved
context and complete export also recheck the exact head after dependent reads;
SQL append still owns both target/source head and erased-ID admission.

| Operation resource | Current bound |
| --- | --- |
| One complete history | 1,024 rows and 1,400,000 canonical UTF-8 envelope-array bytes |
| One authenticated request | 40 D1 statements, including authentication and each transactional batch statement |
| History validation across one request | 10,240 rows and 14,000,000 envelope bytes, permitting a ten-item page of maximum histories |
| Reconstruction chunk | At most 128 revisions or 200,000 canonical bytes; a single valid envelope fits below this byte bound |
| Reconstruction transaction | At most 16 revision chunks, one empty-store assertion and one optional body insert |

These are finite operation budgets, not unlimited-history claims. A new revision
must keep the complete history within the read budget. Exhaustion reports
`history_read_budget_exceeded`, distinct from a competing-head conflict; no row
is compacted or discarded. Draft capacity v0.2 describes planning-material fit
and discloses complete-history budgets, rather than promising 32 storage slots
or reserving space. Actual history/file admission remains on Save. The existing
note, definition, relation, file, ten-item list and ingress limits are unchanged.

The byte budget preserves the former maximum envelope, leaves room for the
existing 1,500,000-byte reconstruction request, and together with at most
1,398,144 base64 body bytes and bounded packaging stays below the separate
3,000,000-byte file reconstruction request. Each revision chunk is one bound
JSON array consumed with `json_each`, avoiding per-revision queries or a growing
SQL-parameter list. All chunks, the empty-store assertion (including erased
IDs) and bodies share one D1 transaction. No partial reconstruction is committed;
readback still validates the entire result. At most 22 statements are needed for
a maximal file reconstruction including authorization and readback.

These choices use the current primary [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
(50 queries on Free, 100 parameters, 2 MB string/row, 100 KB SQL, 30-second query
limit) and [D1 batch and primary-read contract](https://developers.cloudflare.com/d1/worker-api/d1-database/).
The code does not opt into read replicas. D1 preserves foreign keys during
[migrations](https://developers.cloudflare.com/d1/sql-api/foreign-keys/).
Local measurements are engineering checks, not hosted CPU, latency, throughput
or remaining-account-allowance qualification.

Forward migration `0003_cumulative_history.sql` requires schema 2 and copies
existing revision rows exactly into the replacement table with the positive
safe-integer constraint. It retains the primary/request uniqueness and workspace
foreign key, leaves owner mapping, file rows/quotas and erased IDs intact, and
writes schema 3 last. Use the existing transactional Drizzle/Sites or pinned
Wrangler migration owner with writers quiesced. Shipped migrations/snapshots
0000–0002 remain unchanged. The new binary refuses schema 2 and a schema-3 marker
without the new revision constraint; the schema-2 predecessor refuses schema 3
on every route. Envelope/export formats stay v0.1/v0.2/v0.3: historical exports
remain valid, while older export readers refuse chains beyond their old bound. A code-only rollback is incompatible even if a particular work
has fewer than 33 revisions. Preserve complete exports and provider recovery
material; roll forward with compatible code. Never reset the marker or truncate
history to simulate rollback. No live migration or rollout is commissioned.

Disposable real D1 checks retain old-writer v0.1/v0.2/v0.3 rows, bodies and
exports across both migration owners; reproduce revision-33 refusal before
upgrade; and continue through 33, restart, four-day clock advance and fresh
seals to 34. A separately labelled 260-row canonical fixture crosses three
reconstruction row chunks while its history remains one atomic read. Negative
controls cover lost observations, corruption, competing later-history heads,
resource exhaustion, later-chunk rollback and erase/copy boundaries. The owned
Chrome check uses ordinary editor saves, a fresh workerd process and fresh tab,
and the same private Saved context visible to authorized browser agents. It is
neither hosted/non-Mac acceptance nor actual live-agent adoption. Exact-head
Canonical evidence and cleanup belong to the Draft PR; prior failures remain
historical evidence. The retained real candidate and hosted stores are untouched.

## Revision-bound private files (#1372)

Current local implementation / Draft-HOLD: choose files in the ordinary editor, review
names, roles and sizes, then Save. Selection alone performs no upload. Saved
context exposes authenticated **Download** controls with exact revision, byte
count and SHA-256 identity. The browser checks returned size/hash before creating
an inert download; HTML/SVG, code and archives are never rendered, executed,
followed or expanded by Augnes. Files and filenames remain untrusted. A download
is byte delivery, not correctness, user consent to execute, or agent consumption.

Retained files appear in the next selection without fetching their bodies. An
addition/replacement/removal is explicit; replacing a filename requires removing
its previous selection and choosing the new bytes. Earlier revisions retain
the original selection and bodies. Removing from the next selection does not
free history capacity. A stale-base refusal retains the draft. If a retained
file is absent from a newly reviewed base, explicitly download/reselect its
original bytes or revise the selection; the server never substitutes the latest
file. Ordinary timeout/unknown-outcome recovery retains the exact pending file
payload in this tab, with explicit outcome read or identical retry. Closing the
tab can lose unsaved bytes; access loss clears them. There is no browser backup.

Keep necessary qualifications, dependencies and source attribution in selected
context. This slice does not infer file-to-note dependencies. Branch creation or
incorporation with files selected on either participating work refuses with
`file_branch_selection_unsupported`; comparison itself remains read-only.
No files are implicitly copied or dropped. For a genuinely independent task,
explicitly download and select its needed bytes with their attribution and
conditions; this is a separately owned copy, not a provenance-certified branch.
Do not remove required files merely to enable branching. File-free behavior
continues unchanged, including independent copies after source erasure.

| Quantity | Limit and accounting |
| --- | --- |
| File body | 262,144 actual bytes; zero bytes allowed; exact SHA-256 |
| Current selection | 8 unique names; sum of selected sizes ≤ 524,288 bytes, including duplicate-content selections |
| Work history | 16 distinct content digests; sum of their sizes ≤ 1,048,576 bytes, shared only within this work |
| Name / role | 160 UTF-8 name bytes; Unicode preserved, no path separators, controls, bidi overrides or malformed Unicode; report/source/results/other |
| Ordinary JSON request | Existing 1,500,000-byte streaming cap, including base64 uploads; old routes are not enlarged |
| File-export reconstruction | Only `POST /api/reconstruct-files`: 3,000,000-byte streaming cap for v0.3 complete exports |
| Planning material | Existing note, definition, relation and list-page limits remain; complete-history operation budgets are specified above |

The 69,216-byte representative bundle motivates small bounded outputs: the
per-file ceiling exceeds its largest 39,801-byte result by over six times, while
history can keep 16 distinct versions/bodies. Four wholly replaced four-file
bundles reach the count limit even before the byte limit; additional planning
revisions do not promise additional complete file replacements. Reused bytes are charged once in
history, never globally shared across works. Planning Draft capacity retains its
original meaning; file selection counts/sizes are separate and retained-history
admission is checked on Save. Refusals preserve edits and identify the limiting
quantity. The UI does not claim that a planning fit reserves file storage.

`files.ts` owns closed file descriptors and strict base64 decoding. v0.3 adds an
ordered `files` manifest to the fingerprinted Web revision/request. The body
itself is a scoped `web_planning_file` D1 BLOB keyed by work and digest. A
conditional revision INSERT and bounded body INSERT execute in one D1 batch;
a failed head gate cannot orphan uploads. Transaction-local quota triggers
settle concurrent history admission. Replays neither duplicate membership nor
charge twice. Normal work/list/context reads validate descriptors and bounded
body metadata, without loading file bodies. Downloads additionally bind the
historical revision/fingerprint/index and verify actual bytes. No identity is an
access capability; normal owner/origin gates apply and responses are private,
no-store, nosniff, attachment/octet-stream with safe UTF-8 names.

[Current D1 limits](https://developers.cloudflare.com/d1/platform/limits/) allow
2,000,000 bytes per BLOB/row and 100 bound parameters per statement. Each body
row stays below 263 KiB; the largest body INSERT uses 59 parameters for 16
bodies. Export reads at most 1 MiB of bodies; base64 is at most 1,398,144 bytes
including per-body padding. The original conservative 32-revision envelope
bound plus file descriptors/packaging was 2,691,682 bytes, below 3 MB. The current
complete-history byte budget and chunked reconstruction above preserve both
transport limits and the 50-query Free per-invocation ceiling. These are bounded design/local checks, not measured
hosted latency, load or remaining provider allowance.

`web_planning_export.v0.3` / `web-planning/3` carries all original revisions and
one byte-bearing base64 entry per distinct digest referenced anywhere in history.
Its checksum covers the entire package. Reconstruction validates exact membership,
sizes, digests, scope, predecessor chain and version before atomic insertion into
an explicitly enabled, quiesced empty replacement store. Missing, extra,
duplicate, truncated or corrupt bodies refuse; insertion faults roll back both
history and bodies. It never reconstructs a borrowed origin or establishes
independent authorship. Erasure atomically deletes every owned revision and body
and leaves the content-free tombstone. Delayed saves cannot resurrect it; private
exports, independent copies and provider backups remain outside that deletion.

Additive migration `0002_revision_files.sql` creates the file table/quotas and
replaces only the schema marker with version 2. The shipped 0000/0001 SQL and
v0.1/v0.2 envelopes, fingerprints and artifact-free exports remain byte-identical.
Empty file selection on legacy work does not promote its format; once v0.3 is
used, later revisions cannot downgrade. Saving v0.3 requires an explicit file
selection, so old request shapes cannot silently remove files. Old code's
schema-1 gate refuses the entire migrated store, including lists, saves, exports
and erasure. New code refuses unmigrated schema 1. A code-only rollback to that
old reader is therefore incompatible. Quiesce old writers, preserve complete
exports/provider recovery material and review migration/roll-forward together;
never erase files or reset the marker to simulate rollback. No live migration
or deployment is performed by #1372 development.

The real local Worker/D1 and browser owners use synthetic report (13,634 bytes),
source (12,601), results (39,801) and checks (3,180). A fresh browser tab downloads
them through Saved context; a bounded child executes only the downloaded
synthetic source/results, returning n=1,000, sum=499,500, mean=499.5. Its output
is selected and saved as revision 2, then reopened and exported with revision 1
unchanged. This is same-Mac engineering feasibility with local Access simulation,
not a non-Mac agent, hosted acceptance, blinded successor or general usefulness
claim. The checks record editing actions, deliberately refused selection and
injected response-loss recovery. Required exact-head Canonical qualification
remains blocked by the separately owned Companion recovery prerequisite; focused
checks do not replace it. Review the Draft before any separately authorized
hosted migration, rollout and actual Windows/Android/browser-agent continuation.

## Draft capacity and deliberate revision

[#1369](https://github.com/hynk-studio/augnes/issues/1369) adds a read-only
**Draft capacity** check to the ordinary editor. Edits invalidate old feedback
immediately. Checks wait 500 ms after input, allow one request in flight, and
coalesce subsequent changes. **Check current draft** also retries an unavailable
read. A response must match the current draft, work, saved binding and check ID;
invalid, failed, delayed or stale-head responses cannot show a successful fit.

The check shares admission's normalization, deduplication, canonical serialization
and UTF-8 accounting. It separates whole-note count, raw note codepoints, attribution
length (UTF-16 units), stored source bytes, definition bytes, relationship bytes
and saved-history capacity. A missing/invalid component has an unavailable size,
not an estimate. Per-note costs and the text/metadata split explain why a short
addition can overflow. Source-byte totals count identical notes once and include
array framing; per-note sizes exclude that shared framing. Stored text bytes
include JSON escapes; metadata includes attribution, provenance, identities,
currentness descriptions and structural framing.

An over-budget draft remains editable. The revision guide explains editing a
current note, preserving attribution and necessary context, and reviewing Required
context. Dependency labels follow text edits. Reading the draft is pure; an
explicit edit of a saved note retains the existing derived-interpretation and
adaptation-link behavior, now explained in Review changes. Earlier revisions
retain originals. No content is automatically shortened, removed or summarized.

`POST /api/capacity` and `POST /api/work/:id/capacity` use the normal private
identity, scope, origin and CSRF gates. Existing-work checks validate history and
recheck its head. They return quantities and bounded validation codes, not saved
revisions or tickets. One check validates the complete history within the operation budgets above and
performs a current-head query; there is no cache or write. This adds bounded
read/validation cost. It is not a hosted CPU/latency qualification. Final Save
still owns authorization, currentness, replay, admission and persistence. “Fits
storage limits” does not promise a write or bypass the separate 1,500,000-byte
request limit. The existing unknown-save-outcome recovery remains authoritative.

### Capacity decision and synthetic acceptance

The limit remains 12,000 source bytes, with eight whole notes and 2,000 raw
codepoints per note. The count and text bounds are independent ceilings, not a
promise that all eight maximum-length notes fit. Four notes in the synthetic
queue-study fixture use 11,947 bytes: 5,713 text and 6,234 metadata. A new
210-character result adds 1,769 bytes, reaching 13,716. Replacing redundant
detail in the existing result note yields 10,954 bytes: 4,702 text and 6,252
metadata, plus 1,045 separate relationship bytes. The question, assumptions,
oracle limitation, competing explanations, uncertainty and next judgment remain;
the result retains all three required source links and an exact adaptation link.

The browser example inspects the excess before Save, removes the attempted new
note, then edits the existing result note. These are two recovery edits and zero
unsuccessful save attempts. It saves revision 2, reopens Saved context, downloads
the actual complete export, validates it and compares revision 1 exactly. Separate
API checks deliberately attempt one refused save preparation and prove the prior
export remains unchanged. Fault tests also exercise malformed/503/late capacity
responses, stale heads, Unicode, metadata-heavy notes, missing dependencies,
separate relation/definition/request limits, full history and unchanged-save
acknowledgement. This is one constructed example with known redundant detail,
not evidence of general usability, less human labor or time savings. It is not a
rerun of #1366's analysis or a modification of its hosted research work.

This evidence supports feedback plus deliberate revision for this bounded slice;
it does not establish 12,000 as the correct long-term bound. A 16,000-byte Web
allowance would add at most 128,000 source bytes over 32 revisions. It remains a
plausible policy follow-up if necessary, irreducible context repeatedly cannot
fit. Current readers revalidate every saved revision and complete export through
admission, so raising the ceiling also affects history reads, reconstruction and
rollback to older readers (which refuse larger selections). Merely changing a
counter or stripping repeated provenance would not address those obligations.

The native 32,000-byte allowance is separate: its selected-entry owners, runtime
admission, reviewed-outcome reader and retained lookup scan bounds were updated
together; older 12,000-byte readers still refuse those larger native records.
The capacity change kept the note representation, fingerprints and formats;
the file extension is versioned separately above.
`capacityEnvelopeEstimates` in the synthetic fixture sizes a 32-revision export
request using component ceilings: about 1.175 MB at 12,000 source bytes,
1.303 MB at 16,000, and 1.815 MB at 32,000, against the existing 1.5 MB request
cap. These are conservative bounds, not proof that all maxima co-occur; the
32,000 allowance cannot simply be copied with a worst-case envelope guarantee.
That capacity change did not alter schema, storage, transport, import or deployment policy; #1372's separate file extension is specified above.

Reproduce with `npm run web:test` and `npm run web:test:browser`. Fixtures and
printed measurements are synthetic. Development exposed and corrected a test
wrapper prefix error, a handler type error, trailing-whitespace and unbalanced
fixture construction, a relation fixture that first hit the source ceiling,
and a browser test that clicked recovery before an asynchronous save settled.
These are development/assistance costs, distinct from the acceptance example;
failed local logs remain review evidence, not committed artifacts. That implementation and its separate hosted rollout were subsequently reviewed in #1369/#1371; their scope and limits are recorded above.

## Run and build

From the repository root with the supported Node toolchain and `npm ci` dependencies:

```sh
npm --prefix apps/web_planning ci --no-audit --no-fund
npm run web:dev
npm run web:build
npm run web:typecheck
npm run web:test
npm run web:test:browser
```

The Sites build dependencies require Node 22.13+ or 24; deciding verification
still requires the repository's exact Node 24.18.0/npm 11.16.0 toolchain.

`web:dev` prints a loopback `/_local/login` URL. Enter the **synthetic workspace**,
create work, add attributed notes, Save, and reopen **Saved context**. From a
saved work, **Continue another direction** previews its exact starting material.
Revise that independent branch, return to the parent, **Compare a private
branch**, choose whole units and dispositions, review and save, then reopen
**Saved context**. This is a
25-minute disposable session, wrapped by the existing bounded child/resource
owners. Its D1 files are deleted at cleanup. It is not a daily-use local database.
Only synthetic data belongs here. The automated browser check clears browser
storage, restarts workerd against the same disposable D1 directory, then reopens.

`web:build` runs the official Sites and Cloudflare Vite plugins with the Site
project rooted at `apps/web_planning`. Its artifact root is
`apps/web_planning/dist`, containing:

```text
server/index.js
server/wrangler.json
server/.vite/manifest.json
.openai/hosting.json
.openai/drizzle/0000_web_planning.sql
.openai/drizzle/0001_schema_version.sql
.openai/drizzle/0002_revision_files.sql
.openai/drizzle/0003_cumulative_history.sql
.openai/drizzle/meta/{_journal,0000_snapshot,0001_snapshot,0002_snapshot,0003_snapshot}.json
```

The deployment entry is `src/worker.ts`, an ESM Worker `fetch(request, env)`.
HTML, CSS and client JavaScript are served by that same authenticated Worker;
there is no client build, dummy asset, public asset server or Next/Companion
process. Cloudflare removes the unused assets binding. `server/wrangler.json`
is its generated deployment configuration; the old repository-defined
`artifact.json` is no longer produced or treated as a Sites input.
The build rejects native runtime/test-ingress imports and local environment
files. Output contains no Site ID, credentials or preloaded user data. The D1
ID `00000000-0000-4000-8000-000000000000` is the official starter's **local
placeholder**, not a provisioned ID. Sites owns the eventual `DB` binding.

Miniflare **4.20260730.0**, locked in this app's development package, supplies
Cloudflare's workerd/D1 local runtime. esbuild remains the local synthetic-ingress
bundler; TypeScript and Chrome/CDP ownership are reused. The locked Sites/Vite
build and Drizzle tools below are development dependencies in the same isolated
app package. Its dependency graph is isolated from the root and existing Apps
graphs; historical package fixtures retain their exact original inputs. The
Canonical dependency owner cleanly installs all three locked trees and binds
the web lock in its receipt before tests. Local loading refuses a fallback to
root/global Miniflare. The new runtime's locked transitive dependencies include
sharp, workerd and their platform packages. No remote bindings, deploy commands
or provider credentials are used by these entry points.

## Direct Cloudflare adapter (#1356)

The direct entry `src/cloudflare-worker.ts` shares the existing handler, UI,
store and envelope. It requires Cloudflare's platform `ctx.access`, an exact
64-hex `ACCESS_AUDIENCE`, and `getIdentity().email` matching `OWNER_EMAIL`.
Missing context, audience mismatch or identity failure refuses before D1 access.
No request header, Sites mode, fixture cookie or JWT fallback authenticates this
entry. Only the configured owner entering `GET /` can initialize an empty,
migrated store; existing mappings and nonempty unmapped stores cannot rebind.

The app pins **Wrangler 4.126.0**, whose locked runtime is **Miniflare
5.20260825.0-alpha / workerd 1.20260825.1**. Its published local Access
simulation is exercised through the same Miniflare conversion API Wrangler
uses. The older Sites/Vite and local-fixture pins remain separate. Wrangler
4.92.0 under the Sites plugin is not the direct CLI. See the
[platform identity and local simulation contract](https://developers.cloudflare.com/workers/configuration/cloudflare-access/).
Cloudflare does not propagate this context through its Static Assets router or
Service Bindings; the direct artifact uses neither.

```sh
npm run web:build:cloudflare
```

The existing esbuild owner emits `apps/web_planning/dist-cloudflare/worker.js`,
`wrangler.json`, and `migrations/{0000_web_planning,0001_schema_version,0002_revision_files,0003_cumulative_history}.sql`.
It rejects local environment files, native/test imports and bound production
configuration. The artifact has no development identity, real account/database
IDs, secrets, asset router or preview URL. Builds replace this generated folder;
keep deployment configuration in a separate private operator directory.
`wrangler.cloudflare.json` is an unbound template, not a usable cloud target.

Direct D1 initialization belongs exclusively to pinned **Wrangler D1 migrations**,
using the unchanged shipped SQL and its `d1_migrations` ledger. The existing
Sites path still owns its Drizzle journal. Do not mix those migration ledgers
on one database. The D1 owner invokes the actual pinned CLI with `--local` in an
isolated temporary HOME, then runs the built entry against that same local D1.

Sign out clears the tab immediately and visits `/cdn-cgi/access/logout`.
Cloudflare's [logout and AJAX contract](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/)
revokes the user's sessions across Access applications; previously issued
tokens may remain accepted for 20–30 seconds. This is not per-application logout.
The client sends the documented AJAX header, treats 401/403, login redirects and
unmarked successful responses as lost access, clears private drafts/bindings,
and refuses further requests until reload/sign-in. Ordinary transport/503
failures still preserve drafts and original uncertain requests. A response
marker distinguishes product data from a login page; it is not authentication.

### Repeatable post-merge deployment

These are post-review operator responsibilities, not deployment authority from
this documentation. #1356 established the existing protected target and #1364 /
#1371 exercised later-source updates. Resolve the exact private target/configuration
from those retained records; do not create resources or repeat initial setup.

1. Confirm the approved source/tree, actual active version, existing Worker/D1/
   Access identities and authenticated work/export baseline. Preserve all existing
   work and the original failed/limited observations. Current main is not automatic
   deployment approval.
2. Build from the approved source with the pinned Mac-side Wrangler 4.126.0 and
   retained Keychain-backed session (`CLOUDFLARE_AUTH_USE_KEYRING=true`). Retain
   artifact/input hashes privately. The unbound generated template must never
   replace the existing private target configuration or secrets.
3. Review data compatibility before any separately authorized migration. #1372
   requires new migration 0002 and schema-2 code together, with old writes quiesced;
   do not replay 0000/0001, mix Drizzle/Wrangler ledgers or use an incompatible
   code-only rollback. Preserve recovery exports and stop on ambiguous state.
4. Within separately approved scope, update only that target's reviewed code and
   any specifically approved migration. Reconcile unknown outcomes by reading
   actual deployment/traffic and migration state before retrying. Preserve Access,
   previews, bindings, mapping, secrets and all pre-existing works.
5. Verify the active source and run the authorized normal-browser acceptance,
   including actual byte download, complete export and preservation comparisons.
   Keep private deployment/work identifiers and exports in private review material.

Local owners test the compiled entry with platform Access simulation. #1356,
#1364 and #1371's reviewed hosted observations are dated, bounded evidence; they
do not qualify this file-delivery candidate or comprehensive security, expiry,
nonowner, load, physical-device or agent-host consumption. #1354 remains deferred.

## Production configuration and trust handoff

[#1347](https://github.com/hynk-studio/augnes/issues/1347) records the 2026-09-27
hosted attempt: the former custom build succeeded, but Sites required
`dist/server/index.js` and Drizzle journal material. No Site, D1, version or
secrets were created. This repair uses the primary contracts inspected on
2026-09-28:

- [OpenAI Sites source at `7eb9d4b9cf93ad7e64aebc8a5ca70e29ec2cfb94`](https://github.com/openai/sites/tree/7eb9d4b9cf93ad7e64aebc8a5ca70e29ec2cfb94):
  `@openai/create-sites` 0.3.0, `@openai/sites-vite-plugin` 0.2.0, and the starter's
  Vite 8.0.13 / Cloudflare Vite plugin 1.37.1 (Wrangler 4.92.0). The generator is
  inspected, not installed; no Vinext/React conversion is needed. The actual
  Sites plugin copies hosting metadata and `drizzle/**` into `dist/.openai`.
- The D1 addon pins `drizzle-orm` 0.45.2 and `drizzle-kit` 0.31.10, used here.
  `db/schema.ts` generates `drizzle/0000_web_planning.sql` and its snapshot;
  the explicit custom `0001_schema_version.sql` inserts only format version 1.
  Run `npm --prefix apps/web_planning run db:generate` after schema edits and
  review the resulting SQL/journal. There is no parallel legacy SQL definition.
- [Cloudflare's Worker-only build API](https://developers.cloudflare.com/workers/vite-plugin/reference/api/)
  supplies the `server` Vite environment and generated Wrangler configuration.
  It carries `nodejs_compat`, compatibility date `2026-07-01`, and `DB` through
  the supported build mechanism. No runtime settings live in custom metadata.
- The [official Sites guide](https://learn.chatgpt.com/docs/sites) supports `DB`,
  omission of an unprovisioned `project_id`, and forwarded
  `oai-authenticated-user-email`. Sites management remains in ChatGPT web/desktop.
  These repository commands only build/test locally.

The available `save_site_version` tool accepts an archive from the exact pushed
commit with `.openai/hosting.json` and a supported Worker entry. It has no
validation-only mode; no separate backend packager/validator was available.
The official plugins execute locally, and tests check the complete artifact,
staged migration parity and the generated entry/config in workerd. This build/test path establishes **local package/Worker qualification**.
The reviewed #1345 closeout separately accepted the v0 hosted artifact and
bounded synthetic journey; its residual ingress/session/bypass limitations
remain unchanged. The later direct-host #1351 journey was accepted in #1356; this does not complete the deferred Sites #1354 rollout or qualify #1372 file delivery.

| Runtime value | Meaning |
| --- | --- |
| `DB` | Sites-provisioned D1 binding; never the local canonical SQLite database. |
| `APP_ORIGIN` | Exact HTTPS browser/Worker origin, without trailing slash. No inferred Host trust. |
| `OWNER_EMAIL` | Deliberately configured owner login, checked server-side; never first visitor. |
| `WORKSPACE_ID`, `PROJECT_ID`, `AUTHOR_REF` | Three stable, newly generated UUID v4 values for this independent web workspace. Keep them across code versions and reconstruction. They are not Sites IDs or native Augnes IDs. |
| `REQUEST_SECRET` | Random server-only secret of at least 32 characters for scope-bound save/CSRF seals. Store through the separately authorized Sites secret owner, never in Git or prompts. Rotation invalidates outstanding seals and needs deliberate outcome reconciliation. |
| `SITES_INGRESS_MODE` | Leave unset until hosted trust checks pass. `verified-private-sites` enables the documented identity adapter; it is an operator assertion, not cryptographic verification or authentication by itself. |
| `RECONSTRUCTION_MODE` | Normally unset. `quiesced-empty-store` admits an explicitly requested reconstruction into an entirely empty store, only after the old writer is quiesced. |

Before real data, independently verify owner-private audience, authenticated
identity forwarding, missing/duplicate/wrong identity refusal, overwrite of
spoofed identity headers, and absence of a bypassing backend URL. A client can
forge that header on an unprotected Worker; the adapter is unsafe outside the
qualified Sites ingress. Default configuration denies it. Local synthetic
sessions establish application authorization only. They do not qualify this
platform boundary. Workspace admins/editors remain a platform trust boundary.

Normal top-level entry may follow Sites sign-in or an external link. Only a
query-free `GET /` with `Sec-Fetch-Mode: navigate` and `Sec-Fetch-Dest: document`
is exempt from the cross-site/same-site Fetch Metadata refusal. Exact
`Request.url` origin and any present `Origin` must still match `APP_ORIGIN`;
owner, ingress, schema and mapping checks still apply. The exception includes
only the existing configured-owner bootstrap, never arbitrary first-visitor
ownership. API reads, exports, context reads, subresources, frames and mutations
receive no exception; writes retain exact Origin, signed CSRF and request bindings.
See the [Fetch Metadata destination contract](https://w3c.github.io/webappsec-fetch-metadata/#sec-fetch-dest-header)
and [Sites sign-in/identity contract](https://learn.chatgpt.com/docs/sites).

A refused entry emits one `web_planning_entry_refused` warning with a fixed
`reason` classification only. `request_origin` means the URL seen inside the
Worker disagreed with configuration, regardless of the platform log's URL;
`origin_header` and `fetch_metadata` identify their separate checks.
`identity_absent`, `identity_invalid`, `ingress_disabled` and `owner_mismatch`
distinguish the adapter/owner refusals without exposing identity. Configuration,
transport/local-identity, schema and mapping refusals have separate classifications.
There are no request/environment values, headers, cookies, bodies or secrets in
these warnings, and no debug endpoint. A `Sec-Fetch-Site: none` 403 alone does
not identify its branch; collect the classification after reviewed deployment.
Local platform-shaped requests test the real Worker adapter and authorization,
not actual Sites identity forwarding or browser-level `ERR_BLOCKED_BY_CLIENT`.

Sites consumes `.openai/drizzle/**` from the build. The same journal and SQL run
through Drizzle's D1 migrator in the disposable real local D1 tests; snapshot
regeneration and negative drift controls prevent schema/SQL divergence. Version,
JSON, revision bounds, scoped foreign keys and both uniqueness constraints are
also exercised directly in D1. The original two migrations remain unchanged. #1351 used schema 1 with only a JSON-envelope extension. #1372 adds migration 0002 and schema 2 as specified above; local compatibility tests upgrade a nonempty old-writer store without resealing historical bytes. No live hosted migration or native schema change is performed.

The available Sites database tools are read-only, and the current documented
migration workflow supplies no dynamic, secret-aware seed write. Therefore the
issue-authorized fallback permits only a normal `GET /` with no query string
to initialize the mapping **after** configured-owner, exact HTTPS origin,
authenticated Sites principal, trusted ingress and schema checks. A conditional
SQL insert requires all workspace/revision/erasure tables to be empty, then an
exact reread must match all configured scope fields and the hashed owner login.
Concurrent identical requests converge on one row. Existing mismatches refuse;
there is no repair, ownership replacement, setup endpoint or setup credential URL.
Other requests and the synthetic local ingress cannot bootstrap. Local fixtures
explicitly seed their disposable mapping after the same migrations.
Missing/untrusted ingress still denies every private request. An origin-mismatched
direct-backend-style request is tested locally; actual Sites header integrity
and absence of a bypass remain hosted acceptance, not consequences of this code.
Do not use remote Wrangler commands to bypass the Sites migration owner.
The reviewed #1345 closeout owns the prior hosted admission and remote
consumption observations. Provider retention/recovery and the residual trust
limits remain outside this local evidence. This candidate provisions or changes
no Site, D1, R2, version, configuration, secret or audience.

## Data and access contract

`src/contract.ts` and `src/files.ts` own the v0.1/v0.2/v0.3 Web host envelopes;
it does not add a Core record type. The extracted definition normalizer remains
re-exported by its old native module. Selected entries and canonical fingerprints
reuse existing code; frozen vectors from merged `d7c8c326` and the local Worker
readback check bytes, UTC observations, attribution and unknown currentness.
No repository-root, SQLite session, native admission or reviewed-outcome identity
is imported. Native callers keep their original limits and error class.

A complete definition/selection is one immutable row. The INSERT itself checks
expected revision **and** fingerprint and the erased-ID guard; branch and
incorporation inserts also test source head/fingerprint and source erasure in
that same SQL statement; unique scoped
revision/request keys settle competing saves. The reader validates the full
bounded chain and its indexed columns. There is no mutable current pointer,
last-write-wins update, automatic merge or partial note write. Definition limits
are 2,000 goal codepoints, twelve 500-codepoint criteria/non-goals and 12,000
canonical UTF-8 bytes. Selection limits are eight 2,000-codepoint whole notes and
12,000 serialized source-entry bytes. Complete history uses the operation budgets
above; lists retain ten-item keyset pages. Normalization trims/deduplicates/sorts under the original
contract, without truncating overflowing material.

Save tickets bind server-issued work/request identity, scope and displayed
predecessor for 24 hours. Same key/material returns the original revision;
altered replay refuses. A save timeout/storage failure retains the draft and original
request in the tab as **outcome unknown**. Check outcome explicitly; absence is
not proof of failure. Retry explicitly with the same key/content. The bound
outcome read remains possible after ticket expiry, but an expired ticket cannot
write. Closing the tab can lose an unacknowledged local draft; reopen the server
list to inspect committed work. There is no automatic browser-storage backup.

Once a save or outcome read acknowledges the exact revision, a later work-list
failure retains that confirmed revision. **Refresh work list** retries only the
list read; it does not resubmit the saved request. Access denial still clears
private material. Change summaries compare trimmed, deduplicated/sorted definition
meaning, including empty lists; raw input remains subject to server validation.

All private HTML/assets/list/work/history/export and mutation paths authorize
owner and configured scope. Writes and exact-context reads also require same
origin and a signed, owner-bound CSRF cookie/header. No wildcard CORS, private
cache, raw-error logging, remote source fetch, inference or active note HTML.
Source locators are inert text. Saved context performs a new primary read against
the displayed revision; a changed head withholds replacement notes until explicit
refresh. Access denial clears the private view; an old external observation
cannot be revoked retroactively. Sign-out and bfcache return discard/reload it.

Export includes the complete chain, format/schema/compatibility markers, original
scope, fingerprints, observations and recorded times, excluding login/secret/seals.
Reconstruction validates everything before an atomic D1 batch into an empty store;
unknown versions, missing parents, altered entries and partial import failures
refuse/roll back. Hashes detect inconsistent content, not independent authorship
or a malicious party recomputing every hash. Imported authorship remains an
attestation. Code rollback does not roll back data; older code must understand
the schema or refuse. Existing exported copies are outside whole-work erasure. See the versioned
compatibility and independent-copy boundaries below.

Erasure confirms the exact saved head, atomically inserts a content-free erased-ID
guard and removes **all** work revisions/request history and owned file bodies. Racing saves either
win first (stale erase refuses) or cannot recreate the erased work. Failed deletion
rolls back its marker too. The application promises no unobserved provider-backup
retention/erasure. Exporting and restoring elsewhere is a separate authorized
recovery operation, never automatic synchronization or a second live writer.

## Private branches and selective incorporation

For file-free selections (see #1372's explicit file-bearing refusal above), the normal work-detail flow is **Continue another direction → Review starting
material → Save reviewed change**. The server resolves the complete saved
source definition and selection at the displayed exact revision. The first
branch deliberately inherits all of them, its last bounded planning judgment
and unresolved matter when present, with an explicit divergence reason. It
starts a separate work; use ordinary editing for subsequent changes. No source
history is embedded. Later source revisions never move the branch origin.

**Compare a private branch** selects one direct branch of the current work.
Both heads and the branch's exact origin are shown; definition differences and
note additions/removals are computed separately against that origin. The
comparison does not classify all differences as branch contributions or infer
semantic novelty. Parentless reconstructed branches remain readable; comparison
back to an unavailable parent is refused rather than inventing a baseline.

Choose `incorporated`, `not_selected`, `deferred`, or `declined` per whole unit.
Deferred/declined choices require a rationale. The reviewed target keeps its
own definition and unrelated selected material. Explicit dependency links are
entered with **Required context** in the note editor. Linked conditions must
already be selected in the target or travel with the selected material; an
incomplete or over-budget selection refuses in full. The validator cannot
discover every unstated natural-language dependency. New or edited notes have
their own attribution; editing an existing note in the UI produces a linked
`derived_interpretation`, not unchanged inherited evidence.

`src/relations.ts` resolves originals, normalizes choices and builds the bounded
host metadata; `handler.ts` retains the existing authorization/CSRF gates;
`store.ts` persists through the same conditional revision INSERT. The signed
preview binds the source, target, normalized material, dispositions/rationale,
request identity and 24-hour expiry. A single SQL statement checks both heads
and erasure guards at admission; there are no separately committed relation or
provenance rows. Two competing target writes cannot both advance the same head.
Exact replay acknowledges the original result; altered requests refuse. An
uncertain response retains the original request, reason and choices in the tab.
**Check change outcome** is read-only (including after expiry); **Retry same
change** is explicit and uses identical material. Drift requires **Refresh
versions and compare again**, retaining prior choices for review, followed by a
new preview. No automatic retry, rebase or latest-version substitution occurs.

If that refresh fails, the tab retains each whole-unit disposition and rationale,
the overall rationale and unresolved question, the earlier source/target
bindings, and the unsaved-work warning. Currentness remains unconfirmed and the
old preview is invalidated. A complete explicit comparison must succeed before
a fresh preview: only exact source bindings retain their choices; removed or
changed units are shown for review. HTTP 401/403 instead clears private content
and draft state. These drafts are held only in the current tab's memory.

The normal UI's ordinary save ticket also binds normalized material, refusing
an altered retry even when nothing was written. An unchanged v0.2 save using
that ticket, or repeated identical incorporation, acknowledges the same revision.
The older unbound v0 request shape remains supported with its existing append
behavior. No-op requests have no durable request row: outcome reads
can acknowledge the unchanged material only while the necessary exact heads
remain current; otherwise absence remains unknown. A changed disposition or
rationale is a real planning change even if no additional note is adopted.

The `.v0.2` / `web-planning/2` envelope adds closed, fingerprinted `relations`:
an immutable origin with its selected bindings and bounded starting judgment,
one provenance/dependency descriptor per selected unit, and the latest local
comparison judgment. Metadata is capped at 12,000 canonical UTF-8 bytes;
reason/rationale/question fields at 500 codepoints, with at most eight units
and seven dependencies each. Existing definition, source and
10-item list bounds remain; cumulative-history operation budgets are specified above. Saved context reads at most two direct referenced
works, never scans a transitive graph. Both human and browser-agent readers get
the same server-rendered exact-revision meaning, with progressive bindings and
honest source availability. Reading establishes delivery, not understanding.

Old v0.1 envelopes and exports keep their original bytes and fingerprints;
chains may advance from v0.1 to v0.2, never downgrade. Complete mixed/v0.2 chains
use `web_planning_export.v0.2`; pure v0.1 exports retain their old format. No
shipped migration or historical row is edited. Historically on schema 1, reviewed v0 code rejects a
v0.2 work/history/context/export (its closed-field reader reports
`invalid_fields`), and list pages containing it; it must not be used as a
rollback reader/writer for new work. On schema 2, the earlier schema gate instead refuses every old-code request. Code rollback is not data rollback. Keep
full exports and roll forward with a compatible reader; reconstruction into a
quiesced empty store validates the entire bounded chain and rolls back all rows
on failure. It imports only the selected work, never the referenced origin.
Fingerprints do not independently prove imported authorship or availability.

Whole-work erasure removes that work's complete envelope/request history,
including its owned provenance and judgments, and leaves only the content-free
ID guard. Independently saved branches and deliberately incorporated copies
have their own deletion scope, explained before confirmation. Erasing an origin
neither cascades to those copies nor leaves an extra hidden source snapshot.
Missing origin/review sources are labelled unavailable or unverified; the
saved copy, qualifications and own rationale remain readable and erasable.
Non-adoption does not imply refutation, and none of these operations grants
native acceptance, a ReviewDecision, Transition or execution authority.

## Evidence lanes

The D1 integration child and the independent Browser child are registered with
the current Canonical integration and project-experience owners. The latter
uses the same handlers/store/migration/serializers behind a separately built
`web-planning-local-ingress.ts`. Its synthetic cookie and login cannot enter the
production bundle. Tests cover faults with real D1 triggers, atomicity/replay,
response loss, multibyte limits, auth/scope/CSRF, inert content, stale bindings,
reconstruction, erasure races, browser storage clearing and server restart.

A separate Codex in-app-browser read on 2026-09-27 consumed the actual Saved
context after reload/select/fresh context read. Synthetic work
`f9608f60-fae2-43fc-8558-ea41819078a4`, revision 1, fingerprint
`sha256:8112c0d850b000ee0e083ccd748724fb133efee9981e5330a865a7f84e20c05f`,
saved at `2026-09-27T07:07:04.184Z`, exposed the reading-room goal, no booking/payment
constraint and unknown evening noise. The agent used them to identify measurement
as the next planning information needed. This is exposed synthetic local
consumption, not independent improvement, native execution, Sites ingress proof
or hosted acceptance. The temporary tab/runtime were closed and removed.

The [reviewed #1345 closeout](../../docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md#completed-p2p5--web-augnes-v0-hosted-slice-1345)
accepted the bounded hosted v0 slice and supersedes its earlier remaining-hosted
status. Isolated-session, final logged-out, identity-header/bypass and other
unperformed checks stay explicitly limited there; Sites identity remains a
platform trust dependency. The #1351 extension is locally tested only. No new
hosted deployment, independent model interpretation, separate successor-task
usefulness or comparative benefit is established. This candidate adds no
WebMCP, new transport, public discovery, inference or automatic execution.
