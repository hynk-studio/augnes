# Web Augnes v0: durable private planning — Task A

Review proposal for [#1343](https://github.com/hynk-studio/augnes/issues/1343),
authored by Codex on 2026-09-27 against `e43651db9ed52d3ab3352b977d711220e534befe`.
This is the direct-session design outcome, not a native execution result.
[01](./01_AUGNES_VNEXT_MASTERPLAN.md), [02](./02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md)
and [04](./04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md) retain product, semantic
and evaluation authority; [03](./03_AUGNES_VNEXT_TRANSITION_ROADMAP.md) owns sequence.
Nothing here activates implementation, hosting, spending or Task B.

## Decision

Build a **private personal planning workspace on a new ChatGPT Site**, with
**D1 as the proposed durable store**, one authenticated owner, and text/links
only. Use a Sites-compatible frontend and a small server adapter. A saved web
work item is authoritative for what that user authored and selected in this
web workspace. It is not accepted knowledge, a native managed task, or approval.
The web workspace is independent of the local workspace and needs no running
Mac, Companion, tunnel or server-side model. There is no automatic synchronization.

D1 fits bounded structured definitions, attributed notes and atomic revisions;
browser storage and the bundled Workbench snapshot fail cross-session/server
durability, while a separate database service adds an unnecessary operator.
R2 adds nothing to this text-only slice. Choose D1 subject to the specific
hosting checks below, rather than promising that local SQLite code runs there.
If those checks fail, retain the local implementation candidate and return the
specific incompatibility for review; do not silently add infrastructure.

The minimum agent path is **an actual browser agent reading the authenticated
saved-work page**. This uses the same server read as the human view. WebMCP and
page-independent MCP are extensions, not dependencies of the first useful loop.

## Evidence and feasibility

Primary documentation was read on 2026-09-27. These are separate evidence lanes:

| Question | Documented capability | Current source / local support | Account observation and remaining condition |
|---|---|---|---|
| Hosting | [Sites guide](https://learn.chatgpt.com/docs/sites) separates local Codex editing from Sites management in ChatGPT web/desktop, and save-version from production deployment. | No Sites hosting manifest exists in this checkout; the full local Next/Companion runtime is not a hosted build. | Read-only Sites listing succeeds. A new private app and compatible artifact remain unprovisioned/unqualified. No invented Sites CLI command. |
| Persistence | The guide offers D1 for structured data and R2 for file content. [D1 API](https://developers.cloudflare.com/d1/worker-api/d1-database/) documents bound statements and transactional batch rollback. | Current work writers use synchronous `better-sqlite3`, `BEGIN IMMEDIATE`, filesystem roots and local operator sessions. | D1 binding, migration execution, quotas and exact Worker API compatibility for the new app are unknown. No storage was requested. |
| Identity | The guide documents forwarded `oai-authenticated-user-email`; [Sites access guidance](https://help.openai.com/en/articles/20001339-creating-and-managing-chatgpt-sites) separates audience from app authentication. | Local session/loopback authentication cannot be reused as hosted authentication. | Existing Workbench v3 is active and **public** in the account listing, regardless of its older private description. Its audience/data stay intact. New owner-private ingress and header integrity need qualification. |
| Agent access | [Chrome's comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp) describes WebMCP as live-page scoped, distinct from backend MCP. | `webmcp-current-work.ts` already does authenticated fresh reads, displayed-binding checks and unregister-on-navigation. That route is local, not a ready hosted adapter. | This session has browser-control tooling; no agent has read a new private Web Augnes page. That actual read is a B acceptance check, not inferred from registration. |
| Recovery | Sites code versions and D1 data have separate lifecycles. [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) describes database recovery. | Existing local portable/recovery owners preserve native records; hosted projections are not backups. | Account-level access to Sites-managed D1 recovery/retention is unknown. Do not promise Cloudflare dashboard/CLI access or rely on it as the only recovery path. |

P2.4's [closeout](../verification/P2_4_BOUNDED_PRIVATE_HOSTED_CLOSEOUT.md)
established export → transient draft → reload to sample. P2.5's public surface
does not change that persistence contract. Neither is evidence that web-native
durable work already exists. Sites beta limits can affect storage/availability;
current account capacity and cost are unknown, not zero.

## One user, one journey

The primary user is the project owner researching a development decision across
days and AI sessions. The work object is a **saved planning item**: goal,
success criteria, non-goals and explicitly selected, attributed context.
One web workspace contains one project in v0; it can list several work items.
Selecting one is navigation, not changing another task's canonical currentness.

1. Sign in and open the workspace. The empty state offers **New work**; a return
   visit lists saved items with their goal and last confirmed save. Select an
   item or start an unsaved draft. No repository path or protocol ID is requested.
2. Enter the definition and add text/link context with source attribution,
   a plain-language note type and known observation time (otherwise unknown).
   These map to existing provenance/review labels. Show corrections beside the
   material they qualify; never turn an authored label into verification.
3. Review the changed definition/selection inline and press **Save** once to
   commit deliberately. Unsaved edits remain local to the tab and visibly unsaved.
   The saved view shows the last confirmed revision/time and a short deterministic
   change summary, selected context and unresolved questions. Its next action is
   edit, reopen saved context, or ask the user's external agent to read it.
4. In a fresh signed-in session, reopen from the server. No bundled sample,
   browser cache or earlier assistant message supplies real work. Show what changed
   since the displayed revision when available; otherwise say that comparison is
   unknown. Source truth/currentness stays unknown unless separately verified.
5. Ask the configured browser-capable AI host to read **Saved context**. Expand
   the complete bounded definition and notes in semantic HTML with attribution,
   revision and observation time. The agent states the goal, one applicable
   constraint/correction and any selected unresolved question from that read,
   reporting absence when appropriate. It does not Save.

The default page answers what the work is, what was saved, what changed, and
what can happen next. Exact fingerprints, history and export live in details;
there is no model chat, protocol dashboard, run scheduler or approval engine.

## Durable meaning and write contract

**Proposed host envelope:** `web_planning_revision.v0.1`, containing stable
workspace/project/work IDs, revision number, predecessor fingerprint, normalized
definition, complete selected-source entries, author reference, recorded time,
schema version, content fingerprint and request identity. This is host-owned
planning data, not a new Core record kind. It must not claim `initial_user_defined`
native admission, a TaskContextPacket receipt, accepted state or execution eligibility.
Result and expectation fields are absent in this first slice.

Reuse definition normalization and selected-source representations/budgets:
2,000 goal characters; at most 12 criteria and 12 non-goals, 500 characters each;
12,000 definition bytes; eight whole notes, 2,000 characters each and 12,000
serialized source-entry bytes. Overflow refuses without clipping or silently
dropping an original/correction. Keep recorded time distinct from observation
time, and content binding distinct from source authenticity or future freshness.

The minimum D1 layout is a workspace/owner identity mapping plus an append-only
planning-revision relation (including a content-free erasure marker). Each
revision stores the whole bounded definition and selection in one row;
no independent note write or mutable current pointer
is needed. Human and agent reads reconstruct the same validated linear head.
The mapping is deployment/application identity, not a second semantic authority.
Bound v0 history to 32 revisions per item, with an explicit capacity refusal;
paginate the work list. Raising this limit needs bounded read/export evidence.

| Situation | Required behavior |
|---|---|
| First save | A server-issued draft identity and request key bind the authenticated workspace/project. One conditional insert creates revision 1; no first-save row exists before the explicit Save. |
| Later save | Bind exact workspace/project/work, expected revision **and** fingerprint, normalized payload and request key. A single conditional insert validates the current predecessor in SQL; uniqueness of `(workspace, project, work, revision)` prevents two successors. Reconstruct and validate before returning Saved. |
| Same request again | A unique scoped request key maps to one payload fingerprint/revision. Identical replay returns that saved revision; changed material with the same key refuses. This is product idempotency, not new authority. |
| Two tabs | The first different write wins; the other receives conflict with no inserted successor. Keep its unsaved text, show saved versus draft, and require a fresh reviewed Save. Never auto-merge or use last-write-wins. |
| Timeout / lost response | Show Save outcome unknown, retain draft/request key, then explicitly reread that request and head. Absence while a request may be in flight is not proof of failure. Any user-requested retry uses the same key/content; no automatic retry or replacement request. |
| Validation / storage failure | No partial definition/context/history is committed. A single-row save avoids cross-row partial writes; any future multi-row operation must use an atomic transaction and rollback test. A failed read is unavailable, not empty work. |
| Stale page / agent | A context read includes the displayed binding; changed head returns refresh-required without substitute notes. Refresh is explicit. Sign-out or access loss discards private displayed material and registration. |

Use primary reads for v0, with no application cache of private current state and
`Cache-Control: no-store`. D1's [replication contract](https://developers.cloudflare.com/d1/best-practices/read-replication/)
routes queries to primary without Sessions API replication. Replication/bookmark
support can follow only with equivalent currentness evidence. The conditional
insert and uniqueness behavior still need real D1-compatible tests in B; an
earlier JavaScript read followed by an unconditional insert is insufficient.

No local workspace is mirrored. A web ID is not a repository path, GitHub ID,
Sites project ID or local Augnes ID. Links to external work stay attributed
references. Separate web items do not complete prior work; results from an
external AI remain attributed reports until their relevant owner admits them.

## Identity, access, export and recovery

Create a new Site under the intended personal account with its narrowest private
audience, then bind the authenticated owner to one randomly assigned durable
workspace/project identity. Never claim the first arbitrary visitor as owner.
Use the platform-verified email only as an external login reference mapped on
the server; never as a client-supplied workspace selector or primary project ID.
Renaming the app or account does not rename/rebind durable work automatically.

Every HTML, JSON, history, export and mutation handler checks the same owner and
workspace/project scope. Missing/ambiguous identity denies access. Require same
origin and CSRF protection for writes; render context as inert text and do not
fetch supplied source URLs. No public data route, wildcard CORS or credentials
in source, prompts, URLs, exported content or logs. Verify that Sites ingress
overwrites spoofed identity headers and that no direct backend URL bypasses it
before real data enters. If that cannot be shown, private real-work release is
blocked; a header name by itself is not authentication.

Private audience is an outer visitor gate; application authorization is separate.
Sites operators/admins and editors are a platform trust boundary, not a promise
of owner-only encryption. Do not grant collaborators or public access for v0.
Public discovery of product information is optional and never indexes private
work; robots/noindex is not an access control.

**Export** is an explicit authenticated download of the complete work revision
chain plus format/schema versions, original scope, source bindings, timestamps,
fingerprints and code/schema compatibility marker. A saved-context view is not
a recovery package. Exclude credentials, local paths, execution grants and raw
model transcripts. Unknown provenance/currentness remains unknown after export.

**Reconstruction** validates envelopes, bounds, parent chain, unique head and
fingerprints in an empty disposable store, then compares definition/selection
readback. A live replacement requires explicit owner authorization, quiescing the
old writer and binding the replacement before reopening writes: one live authority
per workspace. Import never authorizes native execution or local-workspace merge.
Unverified imported authorship stays an attestation, not independently verified fact.

**Deletion** is explicit whole-work erasure, with export offered first and exact
head confirmation. Delete that work's entire revision/request history atomically,
not selected historical rows; a changed head refuses. A retained erased-ID marker
prevents delayed requests from recreating it and contains no work text. Disclose
that downloaded exports and provider backups are outside that deletion; do not
promise immediate backup erasure or timed retention not observed in this account.

**Code recovery** selects a compatible prior code version; it does not roll back
D1 data. Migrations must preserve readable earlier data or refuse unsafe rollback.
**Data recovery** uses a validated export/reconstruction, or a separately verified
provider recovery operation. Never delete a Site to reset data: Sites deletion is
documented as permanent. Test reconstruction before admitting irreplaceable work.

## Reuse and minimum adapters

| Existing owner | Use in B and boundary |
|---|---|
| `lib/vnext/runtime/initial-project-work-context.ts`, `types/vnext/project-work-initialization.ts` | Reuse/extract the exact definition normalizer and limits into a portable dependency surface. The current module imports local lineage/session readers; importing the whole module is not a Worker port. |
| `lib/intake/selected-work-source-comparison.ts`, `types/vnext/project-work-revision.ts` | Reuse note validation, attribution, labels, bindings and whole-note budgets. Preserve original versus corrected material. No historical `reviewed_outcome` identity may be manufactured for a web report. |
| `lib/vnext/protocol-primitives.ts` | Reuse canonical serialization/fingerprint meaning. Its `node:crypto` dependency needs Worker compatibility or an equivalent host hash adapter with byte-for-byte conformance checks. |
| `lib/vnext/runtime/project-work-initialization.ts`, `lib/vnext/runtime/project-work-revision.ts` | Reference existing admission, linear ancestry, replay/refusal and no-partial-write behavior. Do not copy the synchronous DB, root availability override, local session or managed-run admission into hosted code. |
| `lib/vnext/adapters/webmcp-current-work.ts`, `components/workbench/semantic-review/current-work-webmcp.tsx` | Reuse displayed-binding, authenticated read and disposal semantics when WebMCP is separately adapted. Existing tool schema expects native initialization and cannot certify the new envelope. |
| `lib/vnext/adapters/hosted-research-projection.ts` | Reuse privacy/currentness distinctions and presentation concepts; its bounded export is not the durable store or recovery format. |
| Existing expectation, result, review and Transition owners in 02 | Keep their authority intact. B stores no native forecast/result/receipt and exposes no Decide/Start controls. Later native integration needs its own admitted host profile and parity review. |

Only four new hosting responsibilities are needed: verified-identity mapping;
D1 revision persistence with atomic concurrency; authenticated saved-work
read/save/export/erase routes; and the compact human page consumed by an agent.
The host envelope is the deliberately smaller alternative to porting the entire
local Core/runtime now. It delivers durable authored planning, not full native
managed-work parity. That product limit must remain visible in B's review.

## Consumer paths

| Consumer | v0 contract and entry conditions |
|---|---|
| Human | Private Site access plus application owner authentication. Create/select, deliberate Save and server reopen; no AI required. |
| Browser agent — selected path | User authorizes the chosen host to use a signed-in tab, selects the work and opens Saved context. Agent reads the actual rendered complete bounded material and its revision. A plain external URL fetch cannot inherit that session. |
| Page-bound WebMCP | Optional later adapter, requiring an open authenticated page, supported browser API **and** a host that actually invokes it. [Tool hints](https://developer.chrome.com/docs/ai/webmcp/secure-tools) do not grant authentication or write authority. Registration, invocation and appropriate consumption are different observations. |
| Page-independent authenticated access | Deferred. Requires a separately reviewed token/OAuth/service transport and workspace authorization; the local connected-project reader still requires the Mac and is not this hosted solution. Browser cookies are never exported to make a headless client work. |
| Public discovery | No private-work discovery or anonymous read. Existing public demo/artifact remains separate. |

If the selected host cannot access the signed-in page, the fallback is explicit
user export/copy of selected context to that host, labeled manual transfer with
capture time and stale risk. This preserves useful work but does **not** pass B's
actual authenticated agent-read acceptance. Do not open the audience to pass it.

## Task B proposed for separate authorization

**Build one new private web planning slice:** create/select work → add attributed
context → confirm durable Save → fresh-session reopen → one actual browser-agent
read. Include the revision conflict, export/reconstruction and erasure safeguards
needed before retaining real work. Do not add R2, model inference, automatic
execution, local synchronization, generic MCP/OAuth, team editing or an approval
engine. No B work or canonical B preparation occurs during A.

Named prerequisites: review this scope/envelope limit; authorize B's local
implementation; choose the exact Sites account and owner; establish quota/budget
and separately authorize one new private Site/D1 before any provisioning or
deployment; prove trusted ingress and compatible artifact/migrations; choose a
browser-capable AI host with user-approved signed-in-page access; approve any
real content used in hosted acceptance. Synthetic local checks can precede
hosting authorization. Account gaps do not justify another generic investigation.

Acceptance checks, with exact source/version and workspace bindings:

1. Human creates a definition plus original context and an attributed open
   question (or a genuine correction when present); Save and a fresh
   browser/server session return the same full saved material. Browser storage
   cleared; no sample substitution.
2. Two tabs submit different saves from one head: exactly one successor, other
   draft preserved and refused. Identical replay keeps one revision; altered replay refuses.
   Inject commit failure/lost response and prove no partial/duplicate work.
3. Signed-out, wrong-owner, wrong-workspace/project, spoofed-header and cross-origin
   reads/writes/export/erase refuse without data leakage. An old displayed
   binding cannot return newly selected notes as if unchanged.
4. Export → empty disposable store → fresh reader reproduces the exact history
   and selected text/provenance. Unknown schema, missing parent, tampering and
   unsafe code rollback refuse. Erasure removes content and blocks delayed replay.
5. In an authorized private deployment, reopen with the local Augnes service
   unavailable from a separate client. One actual agent reads the saved page and
   cites its revision plus relevant constraint and uncertainty. Record host,
   page/session prerequisite, tool call, returned material and actual use; a
   screenshot or successful tool registration alone does not pass.

Stop B at its own review. A local-only pass cannot establish Mac-independent
hosted operation. If hosted authorization or agent access is unavailable, report
that exact untested acceptance item without inventing completion or broadening B.

## Actual A preparation and context use

The clean checkout moved from merged-work branch `codex/1339-reviewed-outcome-reuse`
at `f75c5c608142e7eda2f6b8f06166bcb37d05fe8b` to
`codex/1343-web-v0-contract` from authenticated reviewed main
`e43651db9ed52d3ab3352b977d711220e534befe`. There was one worktree.
[#1342](https://github.com/hynk-studio/augnes/pull/1342) was read at
`af4ca705dbc6a7264e5e39e9f6ee9066b6a494d1`; its three status corrections are
neither duplicated nor prerequisites. #1148/startup investigations were not reopened.

Normal installed lifecycle returned live/exact. Resume and selected-source read
confirmed the expected fresh, revision-eligible, unexecuted P2 preparation.
The existing installed different-task tool preview was inspected, then the
authenticated prepare returned `saved`, `work_preparation_created=true` and
`prior_work_marked_complete=false`. Complete #1343 goal, six criteria and three
non-goals were saved. The exact correction binding
`sha256:ac24ce6dd08aa08c888dc8de8705dfe575c821deb46d3f8c0bc18c5d88a2dc00`
was retained; the obsolete App question was omitted explicitly as outside A and
addressed by #1332, remaining in historical unexecuted preparation.

Both kickoff notes were authored at `2026-09-27T05:46:52.000Z`, with the issue's
exact source labels/text and distinct `user_declaration` / `derived_interpretation`
attribution. Fresh Resume and source read returned all three notes at snapshot
`sha256:8e12c5410b17f417b9207799dc86bd8c4f2feb4877771887906c1efdd5cf3ccb`
and packet `sha256:ac412d70144f99b77a535d40e6b73735a89c109c08d8dc350b92a5a0ddfeb589`.
The merged repository's `connected-project-reader.mjs`, invoked locally through
its normal handler, separately reread the persisted definition and selection
at that same binding (05:47:48 UTC). This was local reader use, not a ChatGPT
connection or fresh installed-plugin adoption. Projected source labels remained
withheld where the existing disclosure rule required it.

Managed Start was unavailable before and after save: **“The local managed-work
configuration is unavailable for this project.”** Current source maps that to
`operator_configuration_unavailable`, not a broken Companion or failed provider.
No attachment/grant/Start, fixture run, native result or completion was invented.
A therefore used **prepared-context/direct-session execution**. The installed
proxy differs from merged source in connected-reader support, but existing
preparation/read tools worked; no plugin update or service refresh was necessary
or performed. A future install still requires its real fresh-session boundary.

Actual use: the saved user note kept delivery primary; the hypothesis note framed
the durability/access decisions; the retained correction prevented treating open
P2 issues as missing implementation. Current source, official docs and account
readback supplied the decisions. The first material decision was independent
hosted authored context, because the local writer requires roots/sessions/SQLite.
The simpler browser-agent read avoids making WebMCP adoption or a tunnel a v0 gate.
Neither choice was pre-authored as a worker conclusion or measured as improvement.
No forecast was useful or authored. No additional human context repair was
observed during A; the kickoff framing and selected correction were exposed input,
not autonomous retrieval or independent evidence. B has not encountered A's outcome.

This note/PR preserves the attributed external outcome for review. Canonical A
remains prepared with no run/result/proposal. The only local product writes were
the supported preparation and its authentication bookkeeping; existing service,
configuration, data, receipts and diagnostics were otherwise left in place.
No Site/storage/access mutation, data upload, new credential, provider campaign,
temporary runtime or generated execution evidence was involved.
