# Web Augnes planning workspace

Private branching/incorporation candidate for [#1351](https://github.com/hynk-studio/augnes/issues/1351),
extending the accepted bounded one-owner synthetic hosted v0 slice ([reviewed #1345 closeout](../../docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md#completed-p2p5--web-augnes-v0-hosted-slice-1345)) and the [merged Task A contract](../../docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md#current-p2p5--web-augnes-v0-task-a-1343).
One configured owner keeps independent, text/link planning items. It neither
reads the installed Augnes database nor creates native work, results or accepted state.

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
.openai/drizzle/meta/{_journal,0000_snapshot,0001_snapshot}.json
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
remain unchanged. The #1351 extension has no hosted acceptance or deployment.
A later rollout of this candidate needs separate review and authority.

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
also exercised directly in D1. The two shipped migrations initialize an **empty store** and are unchanged.
#1351 retains D1 schema version 1 and extends only the versioned JSON envelope
in the existing revision rows; no DDL upgrade is necessary. Local compatibility
tests open a nonempty store created through the reviewed v0 writer. No live
hosted migration or native schema change is performed.

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

`src/contract.ts` owns the `web_planning_revision.v0.1` and `.v0.2` host envelopes;
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
12,000 serialized source-entry bytes. History is at most 32 revisions; lists use
ten-item keyset pages. Normalization trims/deduplicates/sorts under the original
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
guard and removes **all** work revisions/request history. Racing saves either
win first (stale erase refuses) or cannot recreate the erased work. Failed deletion
rolls back its marker too. The application promises no unobserved provider-backup
retention/erasure. Exporting and restoring elsewhere is a separate authorized
recovery operation, never automatic synchronization or a second live writer.

## Private branches and selective incorporation

The normal work-detail flow is **Continue another direction → Review starting
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
and seven dependencies each. Existing definition, source, 32-revision and
10-item list bounds remain. Saved context reads at most two direct referenced
works, never scans a transitive graph. Both human and browser-agent readers get
the same server-rendered exact-revision meaning, with progressive bindings and
honest source availability. Reading establishes delivery, not understanding.

Old v0.1 envelopes and exports keep their original bytes and fingerprints;
chains may advance from v0.1 to v0.2, never downgrade. Complete mixed/v0.2 chains
use `web_planning_export.v0.2`; pure v0.1 exports retain their old format. No
shipped migration or historical row is edited. Reviewed v0 code rejects a
v0.2 work/history/context/export (its closed-field reader reports
`invalid_fields`), and list pages containing it; it must not be used as a
rollback reader/writer for new work. Code rollback is not data rollback. Keep
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
