# Web Augnes planning workspace

Local implementation candidate for [#1345](https://github.com/hynk-studio/augnes/issues/1345),
following the [merged Task A contract](../../docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md#current-p2p5--web-augnes-v0-task-a-1343).
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

`web:dev` prints a loopback `/_local/login` URL. Enter the **synthetic workspace**,
create work, add attributed notes, Save, and reopen **Saved context**. This is a
25-minute disposable session, wrapped by the existing bounded child/resource
owners. Its D1 files are deleted at cleanup. It is not a daily-use local database.
Only synthetic data belongs here. The automated browser check clears browser
storage, restarts workerd against the same disposable D1 directory, then reopens.

`web:build` writes `dist/web-planning/worker.mjs`, `.openai/hosting.json`,
`migrations/0001.sql` and our `artifact.json` entry/compatibility description.
The deployment entry is `src/worker.ts`, an ESM Worker `fetch(request, env)`.
HTML, CSS and client JavaScript are served by that same authenticated Worker;
there is no separate public asset server or Next/Companion process.
The build rejects native runtime and test-ingress imports. Output contains no
Site ID, remote database ID, credentials or preloaded user data.

Miniflare **4.20260730.0**, locked in this app's development package, supplies
Cloudflare's workerd/D1 local runtime. esbuild, TypeScript and Chrome/CDP ownership
are reused. Its dependency graph is isolated from the root and existing Apps
graphs; historical package fixtures retain their exact original inputs. The
Canonical dependency owner cleanly installs all three locked trees and binds
the web lock in its receipt before tests. Local loading refuses a fallback to
root/global Miniflare. The new runtime's locked transitive dependencies include
sharp, workerd and their platform packages. No remote bindings, deploy commands
or provider credentials are used by these entry points.

## Production configuration and trust handoff

Current [Sites documentation](https://learn.chatgpt.com/docs/sites) supports
D1's `DB` binding, an unprovisioned manifest without `project_id`, and forwarded
`oai-authenticated-user-email`. The official
[Worker example](https://developers.openai.com/showcase/idea-intake) describes
Worker-compatible ESM builds. The read-only Sites tool schema accepts a Worker
artifact plus hosting metadata. Sites management is in ChatGPT web/desktop;
these repository scripts are local build/test commands, not Sites commands.

The concrete candidate is an ESM Worker with `nodejs_compat`, compatibility date
`2026-07-01`, and D1 binding `DB`. `artifact.json` describes this build; it is
**not** an invented Sites configuration schema. The exact Sites archive entry
recognition, compatibility flags, migration executor and D1 binding must be
qualified when a new private Site is separately authorized. No platform
incompatibility was observed locally; that does not prove Sites acceptance.
If Sites cannot admit this Worker/flags or privately isolate its backend,
return that precise incompatibility before adding an alternative service.

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

Apply the exact `migrations/0001.sql` to the new hosted store through the
separately authorized Sites migration owner, then deliberately insert the single
mapping row (bound parameters shown; no public setup route):

```sql
INSERT INTO web_planning_workspace
  (singleton, workspace_id, project_id, author_ref, owner_login_hash)
VALUES (1, ?, ?, ?, ?);
```

The parameters are the configured workspace/project/author UUIDs and
`sha256:` plus the hexadecimal SHA-256 of the lowercase configured owner email.
The local setup uses this same migration and mapping. No request creates or
rebinds an owner. Missing/mismatched mapping or unsupported schema denies access.
Do not run a remote Wrangler command to guess the Sites migration path.
Required account quota, cost, storage retention/recovery access and private
remote consumption remain unobserved. No Site, D1 or R2 was provisioned.

## Data and access contract

`src/contract.ts` owns the smaller `web_planning_revision.v0.1` host envelope;
it does not add a Core record type. The extracted definition normalizer remains
re-exported by its old native module. Selected entries and canonical fingerprints
reuse existing code; frozen vectors from merged `d7c8c326` and the local Worker
readback check bytes, UTC observations, attribution and unknown currentness.
No repository-root, SQLite session, native admission or reviewed-outcome identity
is imported. Native callers keep their original limits and error class.

A complete definition/selection is one immutable row. The INSERT itself checks
expected revision **and** fingerprint and the erased-ID guard; unique scoped
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
altered replay refuses. A timeout/storage failure retains the draft and original
request in the tab as **outcome unknown**. Check outcome explicitly; absence is
not proof of failure. Retry explicitly with the same key/content. The bound
outcome read remains possible after ticket expiry, but an expired ticket cannot
write. Closing the tab can lose an unacknowledged local draft; reopen the server
list to inspect committed work. There is no automatic browser-storage backup.

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
the schema or refuse. Existing exported copies are outside whole-work erasure.

Erasure confirms the exact saved head, atomically inserts a content-free erased-ID
guard and removes **all** work revisions/request history. Racing saves either
win first (stale erase refuses) or cannot recreate the erased work. Failed deletion
rolls back its marker too. The application promises no unobserved provider-backup
retention/erasure. Exporting and restoring elsewhere is a separate authorized
recovery operation, never automatic synchronization or a second live writer.

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

Remaining hosted acceptance: exact artifact/flag/schema admission, owner/account
and private ingress qualification, approved synthetic deployment, separate-client
reopen with the Mac unavailable, and an actual authenticated remote agent read.
Keep #1345 open until its required hosted checks are reviewed. This candidate
adds no WebMCP, headless transport, public discovery, inference or automatic phase.
