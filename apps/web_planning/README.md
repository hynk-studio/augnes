# Web Augnes planning workspace

By default, one configured owner keeps independent planning work, its attributed context and
explicitly selected small files. An optional admitted-principal entry also supports
private continuing projects, as described below. Web work neither reads the installed Augnes
database nor creates native work, results or accepted state.

An explicitly downloaded complete export can be admitted by the separate native
[local selected-source handoff](../../docs/WEB_EXPORT_NATIVE_HANDOFF.md). It
requires selected current-revision text and an exact authorized native target;
Web/native stores and Web reconstruction remain independent.

## Independent private projects (opt-in)

With `PROJECT_ENTRY_MODE=admitted-private-v1` and `PROJECT_ADMITTED_EMAILS` set to
a JSON array of at most 100 verified-ingress email addresses, `/projects` (also
the unselected `/` entry) lets each admitted sign-in create and select its own
private projects. The configured owner remains admitted. Authentication still
comes from the existing verified Sites or Cloudflare Access ingress; headers,
project IDs, links and task setup files do not authenticate a caller. This is an
invited-cohort mechanism, not anonymous signup, an identity registry or billing.
Activation requires a separately authorized ingress/audience/configuration change;
the checked-in default does not enable it or invite anyone.

Creating a project requires a name, continuing purpose, a current judgment and
its source attribution, unfinished work and the next meaningful action. The
mapping and an ordinary initial planning work commit atomically. Purpose is its
goal; the initial next action is its first success criterion. The selected notes
retain the authored interpretation/source, open question and next check. Opening
the project opens this work, and **Open project continuation** reopens its current
head. Continue through the ordinary editor, source-selection/history, ticket,
save and resolve operations. Standalone tasks within the project remain supported.
There is no second mutable summary or dashboard truth. Retained interpretation is
authored context, not verified source content, native Core accepted state, project
completion or an execution grant. If this work is erased, its continuation is
explicitly unavailable; a fresh session does not recreate it.

`GET /api/projects` lists only the caller's projects, in bounded 20-item pages
(`cursor` is the returned `next`). `POST /api/projects` uses an entry-page CSRF
session and the exact fields `request_key`, `name`, `purpose`, `judgment`
(`text`, `source`), `unfinished`, `next_action`. Retain the exact request and UUID
key until acknowledged: identical replay returns the same project and first
revision; altered replay refuses. An uncertain browser creation freezes its form
for exact retry and offers list refresh; do not blindly create a replacement.

`GET /?project=PROJECT_ID` selects an owned project. Every browser API call binds
that page's fixed `X-Web-Planning-Project` header. The same header selects a project
for authenticated clients; `/api/project` returns its name, scope, stable author
reference and `continuation_work_id`, and `/api/project/continuation` reads the
ordinary current work. Scope is reauthorized server-side on every operation,
including files, search, history, exports, erasure and recovery. CSRF tokens and
signed work tickets bind the exact project. Switching projects cannot retarget a
prepared write. Entry, project and recipient CSRF cookies have separate scopes;
opening another project or the project chooser does not invalidate a pending
write in the original tab. Different tabs never imply shared write authority.

Each project retains a randomly assigned stable author reference. A fresh browser
or client using the same currently admitted authenticated principal can continue
without rewriting prior authors. Email control does not identify a particular
human, model or executor. A different principal's delegation/succession is not
implemented by this entry. W1 requests still derive scope from their exact grant
and authenticated recipient, independently of the recipient's own project.
Grant IDs are globally unique for their existing unscoped request URLs; a second
project cannot reuse an ID to make the original recipient's entry ambiguous.
Declining a return cannot erase or govern its contributor's independent project.
Removing entry admission stops own-project access; existing W1 access remains
governed by its separate grant/expiry/revocation boundary.

The ordinary local client exposes `openFileProjects(origin).list(cursor)`,
`.create(exactRequest)` and `.open(projectId)`. `openFileProject(origin, projectId)`
adds `.continuation()` to the existing scoped task/search operations. Downloaded
task setups select their recorded project, never an ambient browser selection.
The same existing Access session mechanism applies; credentials are not exported.

```sh
FILE_CLIENT=apps/augnes_apps/scripts/file-exchange.mjs
node "$FILE_CLIENT" projects
node "$FILE_CLIENT" create-project ./exact-project-request.json
node "$FILE_CLIENT" continue-project PROJECT_ID ./continuing-task.json
node "$FILE_CLIENT" ./continuing-task.json context
```

For project-level task discovery, set `AUGNES_WEB_PROJECT_ID` to a returned project
ID; task-bound operations always use their exact setup. After reading the current
continuation, the existing planning draft/ticket/save/resolve methods below record
the later step. No special agent or scene-specific state path is needed.

### Scoped work succession (#1628)

In admitted private project mode, open a saved work and choose **Delegate updates
to this saved work**. The owner deliberately shares that work's complete history,
attached files and reference metadata with one already admitted sign-in. The
`continue-work-v1` role permits reading that work and appending attributed reports
and next actions. It permits no changes to the owner's purpose or selected
material, other-work access, erasure, imports, subdelegation or external execution.
Choose the unresolved obligation, an expiry within 90 days and 1–20 saved updates.
The server enforces both expiry and the cumulative update limit; a fresh session
or model does not renew either. The owner can revoke the delegation in this page.
Creating a new grant is an explicit new owner decision, not automatic succession.

The recipient opens the returned `/continue/<grant-id>` link under their own
admitted sign-in. Read the current purpose, sources, earlier updates and unresolved
obligations before saving an update. Neither a link nor a downloaded setup is a
credential. A lost save acknowledgement leaves an operation locator; use **Check
the pending save** before preparing another update. Reconciliation reads existing
effects and never resubmits. Expired/revoked access also stops reconciliation;
the owner retains the complete history. A pending grant creation also retains
only its operation key. Its read-only check either finds the existing grant or
unlocks the form while retaining that same key; reloading requires another check.
Checking never creates or renews access, and stores no recipient or private text.

`GET /api/work/<work-id>/continuation` lists owner grants (opaque ID cursor).
Owner `POST .../create` takes `grant_id`, exact `expected`, `recipient`, `obligation`,
`expires` (Unix milliseconds), `max_updates`, and
`confirm: "share-this-work-history"`; `POST .../revoke` and the read-only
`POST .../resolve` take `grant_id`.
All writes include the selected `workspace_id`/`project_id` and normal CSRF.
The recipient uses `GET /api/continuation/<grant-id>` for the complete one-work
context and `GET .../setup` for its setup. `POST .../save` takes `request_key`,
exact `expected`, `report` and `next_action`; `POST .../resolve` takes only
`request_key`. Identity and issuer attribution come from authentication and the
stored grant, never these inputs. Read/write refusal ends disclosure; an already
admitted save must still satisfy the atomic SQL revocation/expiry/budget gate.

For an ordinary supported agent client, import `openFileContinuation` from
`apps/augnes_apps/scripts/web-file-client.mjs`, open the downloaded setup, then
use `read()`, `save({request_key, expected, report, next_action})` and
`resolve(request_key)`. Use the recipient's own existing Access login and the
approved `AUGNES_WEB_ORIGIN`; do not copy the owner's session. `read()` must precede
new work. Original expected bindings and request keys are needed to reconcile
uncertain delivery; reading the fresh history does not create a new attempt grant.

Migration `0008_work_continuation.sql` advances schema 5 to 6 with writers
quiesced and a full backup. It adds operational grants without modifying existing
mapping, revision or file bytes. Old owner-only/schema-4 and admitted/schema-5
paths remain supported by this worker; succession itself requires schema 6.
A new attributed update uses revision/export v0.10 (`web-planning/10`). The stable
project `author_ref` and every older envelope remain unchanged; the update's
`continuation.principal_ref`, `issuer_ref`, `grant_id` and authentication class
identify its actual sign-in and authorization source. This records an attributed
report, not a model identity, verified result, acceptance or live execution grant.

Complete JSON and readable exports retain these reports and obligations.
Reconstruction preserves their exact bytes and revokes all current grants only
in the restored project; portable attribution never recreates live authority.
After a v0.10 record is written, retain a v0.10-compatible reader/writer for
rollback. No downmigration or data deletion is supplied. Owner changes to the
ordinary work remain separate. This first role does not permit rewriting the
work definition or its selected methods/files; other roles remain future scope.

### Project mapping migration and rollback

Migration `0007_independent_projects.sql` advances the operational schema from 4
to 5. Quiesce writers and retain a complete database backup before applying it
through the existing transactional migration owner. It replaces only the singleton
mapping table with multiple scoped mappings and nullable project-entry metadata;
the legacy row retains its exact scope/author/login hash. Revision, request-key,
file, erasure and W1 grant rows are not rewritten or resealed. The generated
Drizzle snapshot follows the same schema; deferred foreign-key checks keep existing
dependants enforced during replacement. A failed migration rolls back as a unit.

The current worker can still read schema 4 in default owner-only mode; enabling
project entry requires schema 5 or 6. Operational rollback disables project entry and
uses the current worker's legacy owner-only path, retaining new projects in storage.
Do not run an older schema-4 worker as a writer on schema 5, or downgrade/drop new
project mappings. A full pre-migration backup restores the old installation only
after separately preserving all later projects/exports and receiving authority
for that replacement; no automatic downmigration is supplied.

Existing complete-work exports keep their exact format/bytes and omit access
grants, credentials and the operational project directory. Recovery requires the
same independently retained project mapping/author identity in an authorized
replacement database and `RECONSTRUCTION_MODE=quiesced-empty-store`. Only the
selected project's revision/file/erasure rows must be empty. The atomic guard
cannot resurrect erased work; reconstruction revokes only that project's retained
W1 grants. Other projects may remain populated and their data/history/access are
not inspected by this guard or revoked. Erasure remains deliberately work-scoped,
not a project/account deletion operation. New project creation is not recovery and
must not mint replacement identities for an old export.

Focused fixture tests distinguish two controlled principals, a fresh ordinary
client, a separate W1 contribution declined by its owner, current-work continuation,
negative scope/ticket tests, scoped reconstruction/erasure and legacy export-byte
parity. They do not establish hosted independent-user adoption, delegated succession,
whole-W2 completion, comparative usefulness or Local Canonical acceptance.

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

## Find a task to continue

In **Your work**, each saved title opens that exact task. Its version and save
time describe the observed work. Expand the file counts to see which requests
are awaiting a return, which files came back, and what the workspace author
recorded on each request or return. For example, a poetry shortlist can still
await permission for one translation after another poem has been returned.
A next action belongs to its recorded version; a returned file does not mean
that someone approved it or that the whole task is finished.

**Refresh work list** reads the first page again without changing the editor or
its save base. **More work** continues by task identity. Opening a request or
return reads the selected task again and focuses its exact version; later replies
can already be present. An unavailable list is labelled as such, and loss of
access clears private content.

The authenticated `GET /api/works` and the project client's `tasks` command
provide the same additive `overview` per item. It counts unanswered requests,
return versions and returned file entries. It includes the first two unanswered
requests and the two most recent returns with their original requests, exact
version references, stored author references, file descriptors and recorded
text. The full exchange reader remains available for the selected task.
Attribution is to the saved workspace author; there is no per-person read or
notification state.

On the existing scoped index, discovery seeks up to eleven task IDs and reads
one bounded metadata observation for each of at most ten displayed works.
It checks the seals of the head and exchange records that supply the displayed
facts, prior revision links, scope, completeness, and stored file membership.
Other historical planning rows supply metadata only. It does not reconstruct
their notes or comparisons, load scene or attachment bodies, or write state.
The ordinary task, download, history and recovery readers retain their full
validation. No storage format, migration or new status record is required.


## Use saved notes in your current work

### Find work from a remembered phrase

In **Your work → Find work by a phrase**, enter part of a saved goal/title or
current selected note. Matching is literal and case-sensitive, including spaces
and Unicode; surrounding query whitespace is trimmed. Queries accept up to
256 UTF-8 bytes without control characters. Search does not inspect past-only
text, source labels, attachments or unsaved drafts.

Each result identifies its work, observed revision, fingerprint, save time and
matching field or note reference. Goals and excerpts are abbreviated to 160
Unicode codepoints; **Inspect matched revision/note** opens the complete saved
notes through the existing history reader. Identical titles remain distinct.
Inspection preserves the open editor and its save base. With an existing
destination open, use the ordinary explicit note selection or adaptation
controls. **Open current work** deliberately reopens that work with the existing
unsaved-edit guard and current-head checks. If it advanced, inspection keeps the
observed basis and explains the newer revision. Erasure makes that basis
unavailable; a result never restores it or grants write authority.

Each search request visits at most ten work IDs in index order and reads only
their current sealed planning envelopes (at most 128 KiB each). It does not
reconstruct prior planning revisions, exchange catalogues or file bodies.
Responses are bounded to 96 KiB. **Continue search** visits the next unsearched
IDs, even if the first page had no matches. The response distinguishes `more`
from `exhausted`; a refused, incomplete or failed read is an error, never a
completed no-match. An unreadable or oversized head refuses that whole page.
The ordinary ten-item work list retains its own behavior and cost.

This is an ordered traversal of heads observed on each request, not a project
snapshot. Work created or changed behind the cursor needs a new search. A
completed no-match applies to that traversal. Continuation binds the query and
authenticated owner/selected project; it cannot be reused for another phrase or scope.
Search and inspection create no work records, revisions, requests or returns.

The authenticated project-owner client uses the same routes and can choose
returned results without a browser setup or a guessed work ID:

```sh
FILE_CLIENT=apps/augnes_apps/scripts/file-exchange.mjs
node "$FILE_CLIENT" search "remembered phrase"
node "$FILE_CLIENT" search "remembered phrase" "RETURNED_NEXT"
node "$FILE_CLIENT" inspect-match "RETURNED_SELECTION"
node "$FILE_CLIENT" select-match "RETURNED_SELECTION" ./chosen-task.json
node "$FILE_CLIENT" ./chosen-task.json context
```

`search` returns a `selection` for each hit. `inspect-match` returns its exact
`observed` notes, current binding, matching references and `current`/`advanced`
status; erased or unavailable bases refuse. `select-match` verifies that basis
before creating a new private task setup. `context` explicitly reads the current
save base; use the existing planning draft/ticket/save methods below to continue.
The same methods are available as `openFileProject().search(query, cursor)` and
`.inspectMatch(selection)`, and on a task client's `planning` object. The tokens
are read locators, not authentication or permission to write. The task-bound
file reviewer keeps its existing three tools and gains no project search.

The HTTP routes are `GET /api/works/search?q=...&cursor=...` and
`GET /api/works/match?selection=...`. Omit the cursor for a new search. Unknown
or duplicate parameters refuse; selected-project authentication is required
on every call. Ordinary exact-title `select` remains available; ambiguous
titles now point to the deliberate search selection path.

### Inspect and reuse selected notes

Open the destination work. Under **History, export and erasure**, choose
**Read history** for an earlier version of this work, or **Choose notes from
another work** for an independent work in this private project. Choose a
revision to see its whole notes, source descriptions, observation times,
required notes and exact saved references. Each note says whether its text and
attribution match the current draft. Only the chosen revision's notes are
expanded; the history reader does not download attached file bodies. The picker
starts at the version you chose from the list, even if the source has advanced.
**Inspect recorded source note** follows one exact earlier relationship on demand,
including from the latest saved version in a conflict comparison. Inspecting it
leaves your draft and its base unchanged. If matching text comes from another
occurrence, **Use this source occurrence** records the version you chose. A
compatible note used only as a prerequisite keeps its own recorded source.

Choose **Use unchanged note**, or **Write an adaptation** and enter your
interpretation. The editor adds the chosen note and any required notes that
are missing. It keeps the current goal, files and other draft edits. An exact
note already in the selection is not duplicated or relabelled. To link a
manually retyped draft note to history, remove that row and choose the saved
note. If an existing selection has incompatible required context, review it
before trying again. **Review changes before saving** and the capacity display
show the proposal; **Save** appends against the reviewed current version.

An unchanged copy retains its original text, source attribution, trust class
and observation time. An adaptation is a new interpretation attributed to the
current project's stored author. Neither choice renews the source or grants
approval or execution authority. Both use the existing material `from` link
to the chosen work, revision, fingerprint and note reference. The linked
revision retains its own origin and earlier adaptation links. B owns its saved
note text, attribution, represented conditions and references. Its export does
not archive A’s unselected notes or its history. If A is erased, its original
can no longer be inspected; B still opens, exports, restores and continues.
No branch, file exchange, or native import is created by selecting notes. No new storage
format or migration is needed. Capacity remains 12,000 bytes for normalized
Web selected notes; relation, file and cumulative history limits are separate.

### Read and prepare the same draft from a local client

Use the existing [authenticated task setup](#connect-a-local-or-hosted-assistant).
The task CLI's `context`, `history` and `history VERSION` commands read the
current revision, revision list and exact saved contents. For a draft, use
the task client's ordinary capacity, signed ticket, save and resolve methods:

```js
import { openFileTask } from './apps/augnes_apps/scripts/web-file-client.mjs';
import { planningDraft, selectHistoricalNote } from './apps/augnes_apps/scripts/planning-notes.mjs';

const { planning } = await openFileTask(setupPath);
const current = await planning.current();
const expected = { revision: current.revision, fingerprint: current.fingerprint };
// planning.tasks(cursor) pages through the same authenticated project.
const history = await planning.history(chosenWorkId); // omit the ID for this work
const earlier = history.find(r => r.revision === chosenRevision && r.fingerprint === chosenFingerprint);
if (!earlier) throw Error('Chosen revision unavailable');
// Inspect earlier.sources and earlier.relations?.materials, including dependencies.
const draft = selectHistoricalNote(planningDraft(current), current, earlier, chosenSourceRef);
// Pass your new text as the last argument to adapt instead. Review any other
// draft edits and the capacity result before preparing this exact request.
const capacity = await planning.capacity(expected, draft);
if (!capacity.fits) throw Error(JSON.stringify(capacity.issues));
const pending = await planning.prepare(expected, draft);
// Keep pending privately until acknowledged. After an uncertain response use
// planning.resolve(pending); a retry uses the same pending request.
const result = await planning.save(pending);
```

An earlier occurrence of a repeated note remains selectable by its exact
revision. The server checks the immutable source in the authenticated project;
a matching label or revision number from another work is not proof. The
destination head must still match. A source advance leaves the chosen revision
usable; erasure before a new save refuses the whole selection and its files.
For a draft selecting another work, use a material-bound ticket. Keep the exact
pending draft: its signed input and the saved destination revision can resolve
a lost response even after the source disappears. Reading a failed history request as an empty list is unsupported.

## Use a returned file in current or follow-on work

Open a saved work, find its answered request and choose **Inspect return and
decide** beside a particular file. Read or download the exact originals.
Compare the planning revision on which the request was made with the conditions
shown now. A return, a sender’s proposed next step and an owner’s reported
checks do not by themselves mean that any material was used.

Choose **Use unchanged bytes** or **Author an adaptation**, give the local
output a free filename, and record why, limits and the next action. An adaptation
is newly authored UTF-8 content, different from the original; unchanged use can
retain opaque bytes. Preview the saved effect on the original, another listed
work, or a new follow-on with an explicit goal, then save. Existing files and
notes are retained; a same-name file is never silently substituted or replaced.
**Defer** and **Do not use** instead preserve the reason and next action on the
original without creating new work. Each judgment is a separate saved revision.
Ordinary file limits still apply: eight names, 256 KiB per output, 512 KiB
together and the existing per-work history quotas. A larger return can still be
read/downloaded intact, or used as the basis of a smaller authored adaptation.

The original item lists decisions on that exact returned file (ten per page).
A destination’s **File requests and returns** also lists its recorded decisions
and the output bytes at the revision where they were saved. **Inspect recorded
return** follows the exact source. If it has been erased, the destination still
owns its saved bytes and recorded identity; it cannot recreate a missing source.
Reading history/export and quiesced recovery retain the destination independently.
Reconstruction is an imported attestation, not a new verification of its origin.

The authenticated owner CLI uses the same flow. Start with `tasks` / `select` or
`search` / `select-match`. Use the version and filename from `list`. An observation
and a pending file are new, private local files; preserve them until confirmed.

```sh
node "$FILE_CLIENT" "$TASK" list
node "$FILE_CLIENT" "$TASK" inspect-return 6 seat-plan.md ./observed.json
node "$FILE_CLIENT" "$TASK" read 6 seat-plan.md
node "$FILE_CLIENT" "$TASK" prepare-use ./observed.json ./choice.json new ./pending.json "Pack seating kits"
node "$FILE_CLIENT" "$TASK" commit-use ./pending.json
node "$FILE_CLIENT" "$TASK" check-use ./pending.json
```

For an existing destination, replace `new` with `current` or a separately
selected task setup and omit the new goal. A choice for the example is:

```json
{"decision":"adapted","name":"kit-order.md","text":"Pack six kits of four for 22 guests.","rationale":"The room now admits 24 including two staff.","limits":"Ground floor only","reported_check":"Compared with the venue update.","next_action":"Label six kits."}
```

Use `unchanged` without `text`, or `deferred` / `declined` with neither
`name` nor `text`. Preview returns the actual destination and its base without
saving work. Check after an ambiguous response; retry only the same pending
file. In the browser use **Check return save**; after a reload an exact retry
may require re-entering authored text. No file contents are stored in tab
storage. A changed source head or destination requires fresh assessment.
On a fresh destination setup, `list` shows the committed destination revision;
`read-saved REV NAME` returns verified output bytes and text when decodable.
`inspect-origin REV` and `read-origin REV` follow that recorded occurrence.
Use `more-decisions VERSION NAME 'CURSOR_JSON'` with a returned `next` cursor.
The owner task-bound reviewer tools remain unchanged; a participant setup adds the scoped feedback reader described below.

The v0.7 revision stores `return_use` only on the committing revision. Its
request basis, request, return, file position/manifest, reviewed source head,
decision and output are covered by the normal revision seal. Source and target
checks, destination bytes and revision commit in the existing transaction. The
source view reads these committed revisions through the additive
`0005_return_destination.sql` partial index; there is no second write or
cross-work receipt to repair. Earlier v0.1–v0.6 envelopes and exports retain
their existing bytes and compatibility; a history containing a judgment exports
as v0.7 and uses the existing exchange reconstruction route. The migration adds
only an index to schema 4. Apply it through the established migration owner
before activating this version; neither migration nor activation happens here.

## Reconsider an existing returned-file use (#1593)

Open the consuming work and choose **Reconsider current use** beside its saved
use. The original use, exact request basis/return, historical output and current
consumer context remain visible together. **List evidence work**, select a saved
revision/file (or a returned file), then **Read selected basis together**. Read or
download its exact bytes. A newer timestamp, filename or similarity does not
establish correction, supersession or applicability. Missing origins are labelled
unavailable; the consumer's own history and output remain readable. Unavailable
selected evidence cannot supply a new save observation.

Choose **Retain current use**, **Update output or context**, **Defer judgment** or
**End current use**. Supply current context, a reason, limits and a next action or
reconsideration condition. Reported checks are attribution, not verified success.
An update may replace the output of this exact use with newly authored text, or
leave both output fields blank and change only current context. A context-only
update must actually change context. Retention and deferral keep the current
output; ending removes only this use's currently selected output. Other files,
notes, definitions, dependencies, original decisions and historical bytes remain.
The original request owner's defer/decline still belongs to the original work.
A consumer judgment neither changes other consumers nor publishes new feedback.

**Preview current decision** is read-only. **Save current decision** appends one
consumer revision and any new bytes atomically. Normal entry, **Saved context**
and the task client's `list` show the latest judgment with `selected`, `ended`
or `no_longer_selected` output status. An ordinary later edit that removes or
replaces that output cannot leave it labelled current. Historical outputs remain
explicitly historical. Continue from the chosen saved result using ordinary work
editing; no successor or extra handoff record is required.

An untouched reconsideration panel is temporarily read-only while an ordinary
work change replaces the editor. If that save is unknown, use **Check save outcome** to
reconcile it before authoring a consumer decision. A failed check retains the
pending operation and the input lock. Edited or previewed consumer decisions
participate in the browser's existing reload/close warning; cancel navigation to
keep the draft. This warning is not durable tab-session recovery.

Ordinary **Import** recognizes complete v0.9 standalone exports and direction
bundles containing them, through the existing exchange/direction reconstruction
routes and bounded file limit (25,000,000 bytes). Older formats retain their
existing routes and limits. Restore requires the existing quiesced empty store;
complete historical bytes and direction lineage are retained without reviving
participation grants.

The supported authenticated owner client uses the same enforcing writer. Select
consumer and evidence task setups through the existing `tasks`/`select` or
search path, with the approved origin and your existing supported login. A
participant setup does not authorize private consumer reassessment.

```sh
node "$FILE_CLIENT" "$TASK" list
node "$FILE_CLIENT" "$TASK" inspect-use 4
node "$FILE_CLIENT" "$TASK" read-saved 4 route.md
node "$FILE_CLIENT" ./evidence-task.json read-saved 2 README.md
node "$FILE_CLIENT" "$TASK" inspect-use 4 ./evidence-task.json 2 README.md file ./observed-use.json
node "$FILE_CLIENT" "$TASK" prepare-reassessment ./observed-use.json ./judgment.json ./pending-use.json
node "$FILE_CLIENT" "$TASK" commit-reassessment ./pending-use.json
node "$FILE_CLIENT" "$TASK" check-reassessment ./pending-use.json
```

Use `return` instead of `file` for an exact returned-file occurrence. A judgment
such as `{"decision":"updated","context":"Recipient route chosen; activation still pending.","rationale":"The selected README now documents the supported recipient path.","limits":"No deployment authority","next_action":"Confirm the operational prerequisites."}`
changes context without manufacturing a file. Add `name` and `text` for an actual
output update. The module exposes `evidenceFile`, `inspectUse`,
`prepareReassessment` and `sendReassessment` on `openFileTask`; `savedFile` reads
and verifies any exact selected saved output. `list` is the current-use entry;
`context` retains its existing exact current-revision response.

After an unknown acknowledgement, **Check decision save** or `check-reassessment`
reconciles that exact operation. Retry only its unchanged pending body. Browser
recovery reuses the per-operation IndexedDB journal, scoped to the consuming
project/work, and retains full private draft bytes until confirmed or explicitly
released after a proven stale noncommit. Download them before release or loss of
access. CLI observation/pending files are private, exclusively created files and
are never overwritten or automatically deleted. Preserve and reconcile them before
preparing a replacement. A late acknowledgement only clears its own exact browser
operation. Previews and resolve calls change no work; a changed consumer or selected
evidence head refuses stale saves. Exact committed replay still works when the
original/evidence later becomes unavailable.

Only a new reassessment revision uses `web_planning_revision.v0.9` and
`web-planning/9`; a history containing one exports as `web_planning_export.v0.9`.
The record seals the original use, preceding consumer judgment, explicitly selected
evidence occurrence/manifest and observed head, reason/context/limits/next action,
and output selection. Earlier v0.1–v0.8 revision and export bytes stay unchanged.
No table, index, migration, grant, authentication adapter or Core record is added.
Existing bounded history, selected-file quotas, CAS, transactions and reconstruction
remain authoritative. Restore retains independent destination readability and
revokes retained operational grants; it never renews source access.

Before v0.9 records exist, the earlier binary can still read existing data.
Afterwards keep a v0.9-compatible reader/writer for rollback or recover a complete
quiesced export with compatible source; never strip the record or relabel history
for an older binary. Direction-pair recovery retains its existing larger budget
for these exchange-bearing histories. Existing participant activation still needs
migration 0006, v0.8-or-later support, the participation mode and verified ingress
under separate operational authority. Deploying this candidate is a separate act.

Access loss clears the private view and reports the original access denial. It
does not automatically resend a confirmed or uncertain operation. Reauthenticate
explicitly to read the saved result or reconcile the exact pending operation.
Reassessment fields stay locked while their durable journal write is pending;
late completion cannot restore a cleared view or send a save. The journal's exact
body remains available to the existing authenticated recovery controls.

## Request-scoped participants and shared feedback (#1589)

The optional participant path gives a separately authenticated recipient one
exact request, selected original files and an owner-written brief. Ordinary
project access remains private to its owner. This is a client of the Web store, not native
workspace access or Web/native synchronization.

After operational activation, open an existing file request and expand
**Participant access for this request**. Enter the recipient's email, select
which original files to disclose, edit the brief and return conditions, and
choose a finite duration (1–90 days). **Create participant link** saves the exact
selection; it does not contact anyone. The link is not a bearer credential.
The recipient signs in through the configured verified ingress using their own
identity. The owner can revisit these records and choose **End access**.

The participant page shows only that brief and those files. **Read** uses the
existing exact byte-position reader; downloads verify the recorded size and
SHA-256. Small Markdown/text files support the existing unique-passage edit,
including BOM and line-ending preservation. Alternatively upload returned files
or write `review.md`. Sending retains a private local recovery copy in IndexedDB
until the response is confirmed. Each pending operation keeps its own exact body;
another tab cannot overwrite it or clear it with a different acknowledgement or
release. The pending-return selector also exposes other retained operations for
this request. Existing grant-keyed recovery copies remain readable. A reload
resolves the selected submission before offering an exact retry. Keep a recovery
download when access may end. When access expires, is revoked,
or the source is erased, the same authenticated recipient can reopen a recovery-only
page to download an existing local pending draft. It reveals no server material or
save outcome and does not restore access. Disabling participation altogether also
disables this route; preserve recovery copies before an operational shutdown. A stale
unrecorded draft can be exported before releasing it; a failed read or unknown
acknowledgement is never permission to submit a replacement.

The original work receives the return through its ordinary request list. Use
**Inspect return and decide** to compare actual returned bytes with current
conditions, then use unchanged bytes, author an adaptation, defer or decline
through the existing workflow. For a participant return, the decision editor
also offers **Share this saved disposition and the following feedback**. Write
the explanation and next action intended for the participant there. Preview
shows exactly what will be shared; the ordinary save commits the output,
decision and disclosure together. Private rationale, checks, limits, destination
identity/title, selected notes and output files are not copied into feedback.
No separate approval step or second feedback write is needed.

A fresh participant session can reopen the same permitted request and read its
own return and explicitly shared committed decisions, including decisions saved
in another private work. The feedback cursor conceals destination identifiers.
No feedback means no shared committed decision is available, not rejection.
Feedback reading changes no use, readback, acceptance or execution state.

### Participant CLI and agent connection

Download **participant setup** from the participant page. Pin its origin using
`AUGNES_WEB_ORIGIN` and use the recipient's own existing `cloudflared access`
login. The setup contains scope and request identifiers, never credentials.
The CLI does not start login or borrow an owner's session. Sites email ingress
supports browser entry; this first local-client transport requires Cloudflare
Access. A headless agent needs an independently provisioned supported recipient
login; this task adds no service-token identity mapping.

```sh
export AUGNES_WEB_ORIGIN=https://your-approved-origin.example
node apps/augnes_apps/scripts/file-exchange.mjs ./participant.json list
node apps/augnes_apps/scripts/file-exchange.mjs ./participant.json read 2 notice.md
node apps/augnes_apps/scripts/file-exchange.mjs ./participant.json get 2 notice.md ./original.md
node apps/augnes_apps/scripts/file-exchange.mjs ./participant.json return 2 "Corrected arrival details" "Confirm the room" ./notice.md
node apps/augnes_apps/scripts/file-exchange.mjs ./participant.json check
node apps/augnes_apps/scripts/file-exchange.mjs ./participant.json feedback
```

The normal CLI journal preserves exact pending files after a refusal or unknown
response. Use `check`, then `retry` for the same submission, or
`recover NEW_DIRECTORY` after a confirmed stale noncommit. Access loss leaves
the journal intact; it cannot prove noncommit or authorize a new answer.
A permitted owner can reconcile the original request key in committed history.
The opt-in `file-review-stdio.mjs` accepts this same setup, retains its three
file tools and adds `read_participant_feedback`. Participant text returns also
retain private `.review-pending.<body-hash>.json` files alongside the setup.
Each immutable file belongs to one exact operation, so a delayed acknowledgement
from another SDK call or process cannot clear its bytes. Existing single
`.review-pending.json` records remain readable and clear only when their original
arguments reconcile as saved. Reuse those arguments with `check_only: true`;
changed arguments cannot replace an unknown submission. Preserve the recovery file when a stale/refused return needs human
reconciliation. The public App catalog and the owner task setup remain unchanged.

### Authorization, data and activation

`PARTICIPATION_MODE=verified-recipient-v1` is required and absent by default.
The owner explicitly authorizes a normalized verified email for one grant.
The production Cloudflare adapter still requires matching `ctx.access.aud`
and `getIdentity().email`; the Sites adapter still requires its verified-private
header overwrite/no-bypass contract. An arbitrary email header is not identity.
The ingress audience must separately admit the intended recipient before use.
Identifiers, setup editing and hidden tool menus grant no server access.
Origin/fetch-metadata checks, same-origin CSRF and private/no-store responses
remain enforced. Participant CSRF seals bind the authenticated recipient too.

Migration `0006_request_participation.sql` adds an operational grant table and
index without changing schema 4 or previous migration bytes. The grant freezes
request identity, observed save base, selected file occurrences, brief, recipient
and expiry. Later work revisions do not retarget disclosure: original reads
remain historical; a new return against a changed save base refuses. The
existing one-answer, exact replay, file quotas, digest validation and atomic
revision/file writer remain authoritative. Its INSERT additionally checks the
grant, recipient, disclosure fingerprint, expiry and revocation in SQL.

Storage `author_ref` still denotes the Web owner. A participant return separately
records grant ID, a hashed normalized email reference and whether its identity
came from verified ingress or the explicitly local fixture. That credential
establishes control of an admitted email identity, not a named human, model,
agent operator or independent reviewer. Return use retains this contributor
attestation even in another work. Only these new attributed records and their
shared-feedback decisions use revision/export v0.8. Existing v0.1–v0.7 bytes and
seals are unchanged. Imported attribution remains an attestation.

Expiry/revocation stops server reads, writes and feedback without deleting
committed history. Erasing the source makes its participant material unavailable;
a separate saved destination retains its own bytes and contributor/source
attribution. Erasing a destination removes its available feedback; absence is
not rewritten as a rejection. Work exports contain no grant table, recipient
login, token, cookie or server secret. Supported empty-store reconstruction
atomically revokes that project's retained grants and never imports new ones. Restoring an
entire infrastructure/database backup is a separate operational procedure: keep
participation disabled and retire restored grants before enabling it.

Activation requires the additive migration through the existing migration owner,
a version supporting v0.8, a verified ingress/audience for the intended recipient,
and explicit deployment/audience authority. No live audience, sharing policy,
invitation or deployment is changed by this implementation. Disabling the mode
stops participant entry immediately. Before v0.8 data exists, the additive table
is compatible with the earlier owner-only binary on schema 4; afterwards retain
a compatible reader for rollback/recovery rather than rewriting or dropping
history. Schema 5 additionally follows the project-mapping rollback contract above.

## Ask for work on files and collect the return

Open your private project, select a task by title, or choose **New work** and save
its title and success criterion. Under **File requests and returns**, choose
**Request work on files**, select original files, describe the work and send.
The request shows its version, filenames and next action. A recipient with access
to that task can download those versions and choose **Return edited files**.
Include what changed and what remains to do. Reopen the task to find the original
and return together, including same-name files. A later task or ordinary save
does not retarget a pending request. The configured project can have a friendly
`PROJECT_NAME` in default owner-only mode. The optional project entry above
instead lets an admitted principal select its own named project. An assistant
can work within that same authenticated project scope.

Choose **Read text** beside a Markdown, text, log, JSON (`.json`), patch
(`.patch`) or JavaScript module (`.mjs`) file. Logs, JSON, patches, modules
and larger text documents open in pages. The reader shows the original text,
even with no MIME type; it does not format JSON, apply patches or run code.
Enter an original **byte** position or find a literal phrase from that
position. Each page identifies its exact version, digest and half-open byte
range, total bytes, and whether another page follows. A search miss means no
match from that offset. A final page can still be partial inspection. Pages
contain at most 8,192 bytes and end on a UTF-8 character boundary, even on very
long lines. Search is case-sensitive (up to 256 UTF-8 bytes). A position inside
a character is refused. BOM, line endings and terminal escapes remain inert;
malformed UTF-8 or non-text data is refused. Complete downloads always remain
available to an authorized reader, including opaque ZIPs.

For one unanswered small Markdown or text file (up to 32 KiB), **Edit this
text** replaces one unique passage and returns a new version with the original
filename. For a large or multi-file request, **Return edited files** also lets
you write a short review as `review.md` (32 KiB) or attach selected files.
Describe what changed and the next action. The original remains available at
its own revision.

The writer verifies the supplied length and SHA-256 against each uploaded body.
Each request or return appends one revision to this work. A return names the
exact original request and its whole selected file set. A second answer refuses.
File requests leave ordinary authored files, notes, branches and reviews in
place. File types, when supplied, are descriptive. Downloads are inert bytes.
Saved, downloaded, reviewed and applied are separate observations.

Before sending, the request text and chosen files stay in the tab. When the
browser shows a warning on refresh or exit, choose to stay to keep editing.
Closing the tab or losing the browser process can discard an unsent draft.
If sending fails, the form keeps its inputs. On an unknown outcome choose
**Check file save**, then retry the exact request only if absent. After reopening
the same tab, the task reconciles the pending request against server history.
Only form metadata is held in tab storage. Reselect local files if the request
was never received. A changed task requires reading the latest requests before
resubmitting. Expired access requires sign-in. After erasure, delayed writes
refuse. **Complete work** exports and reconstructs exchange history and bytes
in the existing quiesced empty replacement store. **Readable history** includes
the messages, basis and next action. Older readers refuse the v0.5 exchange
revision/export. Existing works without exchanges retain their original formats.

An exchange accepts 1–8 distinct filenames, up to **6 MiB per file and 7 MiB
together**. Empty files are allowed. A work with exchanges retains **16 unique
digests / 8 MiB** across all its ordinary and exchanged files; identical bytes
are counted once. Ordinary file selections retain their 256 KiB per file and
512 KiB selection budgets, and an ordinary-only work retains its 1 MiB history
budget. Planning notes and cumulative revision budgets are separate.

The save/resolve JSON is limited to 10,000,000 bytes. Each file is verified
before the existing atomic head check and write. Files over 256 KiB occupy
aligned 192 KiB slices in D1, all committed with the manifest in one transaction.
There are no pending server chunks to reserve or expire. A broken request has
no completed prefix. On an uncertain response, check the original request;
do not send a replacement. Work erasure removes the scoped files and their
slices. Every text read verifies the full retained file's digest and UTF-8,
then returns only the specified page; this is bounded by the per-file limit.

### Connect a local or hosted assistant

The browser follows ordinary private sign-in. For a terminal client serving the
same authorized owner, download **Connect an assistant to this task → Download
task setup** once. Keep that file in a private directory. The operator pins
`AUGNES_WEB_ORIGIN` to the intended private HTTPS project and signs in to its
existing Cloudflare Access application with `cloudflared access login` when
needed. The client reads the cached application token through `cloudflared
access token`; each operation rechecks the actual Web principal. The setup file
contains scope and an origin, never credentials. Select another task deliberately
by downloading its own setup. A fresh client uses the setup and the private
session to discover the permitted requests and versions.

From a checkout with the supported Node and dependencies, examples below use
`FILE_CLIENT=apps/augnes_apps/scripts/file-exchange.mjs` and `TASK` as the path
to the downloaded setup. Normal browser users do not need a checkout.

```sh
node "$FILE_CLIENT" tasks
node "$FILE_CLIENT" select "Autumn event plan" "$TASK"
node "$FILE_CLIENT" "$TASK" list
node "$FILE_CLIENT" "$TASK" request "Check the venue capacity" "행사 계획.md"
node "$FILE_CLIENT" "$TASK" get 2 "행사 계획.md" ./original.md
node "$FILE_CLIENT" "$TASK" return 2 "Updated table count" "Confirm the entrance layout" ./edited.md
node "$FILE_CLIENT" "$TASK" get 3 edited.md ./returned.md
```

The owner can use `tasks` and `select` to bind by exact task title instead of transferring a browser setup. For duplicate titles or a remembered note, use `search`, `inspect-match` and `select-match` as described above. The reviewer sees only the configured task. Use listed version numbers and filenames. Downloads create a new explicit path.
Sends keep an owner-only pending request beside the setup until confirmed.
The CLI checks the 500-character limit for the message and return next action
before keeping a pending request. If an older client kept text that the server
refuses, `check` identifies the invalid draft. Use `recover NEW_DIRECTORY` to
preserve the original text, request key, version and files before editing it.
Recovery does not send a request or return.
After a lost acknowledgement, `check` reads that same request and `retry`
resends it unchanged. For an unrecorded request whose task moved on, `check` preserves the message and files.
Use `recover NEW_DIRECTORY` to save its request as `request.json` and its original
bytes under `files/`; this does not send anything. Review the current task before a
new send. In the browser, reopening restores the text and asks you to review the
latest requests and reselect the files. A permanently refused input remains available
in the pending directory.
Keep the original files while working and remove the refused pending file only
after checking the outcome and correcting the inputs.

The optional [private file-review adapter](../augnes_apps/README.md#private-web-file-review)
uses the same Web history and authentication. The separate Native handoff still
admits explicitly selected ordinary current-revision material. Downloading a
return or applying it locally is an explicit later action. Actual activation of
a reviewed Web release, authentication from another device and a live ChatGPT
file round trip are separately evidenced operations.

## Story & Worldbuilding — Increment A (#1455)

The existing private Web workspace now offers **Story & Worldbuilding** beside
**New work**. Original writing opens in the common editor and saves through the
existing revision-bound file writer. No selected context note is required for
each save. Ordinary work, its definition, selected notes, attachments and access
continue to use the same owners. Native and Web stores remain independent.

### Walkthrough

1. In the private workspace, choose **Story & Worldbuilding**, give the work a
   useful title, and write the manuscript or setting in **Original text**. Keep
   distinctions such as fictional fact, official announcement, character belief
   and undecided author intention in the prose. Review the change summary and
   press **Save**. This is a draft save, not canon adoption or publication.
2. Revise that text and Save again. Each saved revision keeps its original file
   bytes. **Presentation → Ordinary work** removes only the presentation file
   from the next selection; changing it back retains work identity and history.
3. Leave and reopen the workspace in a fresh session. Select the work by title.
   A story reopens its exact `manuscript.txt` through authenticated revision-bound
   reads. **Text file → Open text** also opens saved UTF-8 `.txt`, `.md` and
   `.markdown` files in ordinary work. **File name → Add writing** adds a new
   source file. This does not import host conversations or generate summaries.
4. If another tab saved first, keep the refused draft. **Review latest saved
   version** shows the latest original text beside the retained draft. Deliberately
   choose **Use reviewed version as save base**, revise if needed, then Save.
   No automatic merge or retry occurs. Unknown-save recovery retains the original
   request; use **Check save outcome** before another write.
5. Under **History, export and erasure**, download both **Readable history**
   (`authored-work.html`) and **Complete work** (`planning-work.json`). The former
   contains every revision and exact UTF-8 source versions, safely escaped;
   repeated file bytes appear once with links from each revision. The latter
   contains all original bytes, including binary attachments, for recovery.
6. Quiesce the original writer. In a separate empty replacement store configured
   by the existing operator with the same workspace/project/author identity and
   `RECONSTRUCTION_MODE=quiesced-empty-store`, use **Reconstruct an empty
   workspace** to choose the complete JSON and import. Reopen the recovered work
   by title in a fresh session. Foreign identity, malformed/incompatible exports,
   nonempty stores and transactional failure refuse; no partial recovery is
   accepted. This is replacement recovery, not cross-project transfer.

For a disposable local walkthrough, use the repository's Canonical Node and
installed dependencies, then `npm run web:dev`. Open the loopback entry printed
by the existing runner; it uses a synthetic owner and temporary D1 only. The
30-minute bounded runner cleans its store on exit: download before stopping.
A second invocation supplies a separate empty destination with the same fixture
identity. This development entry is not production authentication or hosted
acceptance. `npm run web:test` and `npm run web:test:browser` exercise the full
producer/recovery consumer paths with owned disposable resources.

The first-party v1 presentation is an ordinary file named
`augnes-story-worldbuilding.v1.json`, role `other`, with exact UTF-8 contents
`{"format":"augnes_story_worldbuilding.v1","primary_file":"manuscript.txt"}`.
Its byte-validated reader recognizes only this version. Unknown or malformed
presentation material is unavailable, never silently upgraded. `manuscript.txt`
is an ordinary `source` file, not accepted Core state. Detachment retains all
originals in earlier revisions. Older Web readers can download/recover these
unchanged v0.3 files but do not supply this authoring presentation.

All existing bounds remain: 262,144 bytes/file, 8 selected files/524,288 bytes,
16 distinct historical bodies/1,048,576 bytes, and the complete-history operation
budgets below. The marker uses one selected slot and one historical body. Each
changed manuscript body uses another history slot; ordinary definition/context
edits that keep the same bytes do not. Capacity exhaustion retains the draft and
refuses the whole save; removing a current file does not free historical bodies.
No silent clipping, selected-note expansion or automatic history deletion occurs.
UTF-8 decoding is strict; Unicode normalization is not applied. Unchanged imports
retain their original bytes (including BOM/newlines); edits to a uniformly CRLF
file retain CRLF. Text is displayed inertly, never rendered as HTML or executed.

The deterministic fixture in `scripts/story-worldbuilding-fixture.mjs` retains
four distinct narrative statements and Korean/combining Unicode paragraphs.
Tests distinguish actual producer/readback/recovery from fault-injected negative
controls. They establish this bounded product path, not LLM understanding,
creative superiority, unlimited manuscript storage, hosted adoption, B/C scene
adoption or an automatic Native/Web synchronization path.

## Scene continuity — Increment B (#1455)

The same original-text editor now supports optional scenes. Original files remain
accessible through **Text file → Open text**, and ordinary projects need no scene
metadata or proposals. A scene Save records prose and proposed changes only. A
separate, grouped author review can adopt selected consequential material in this
work's single fictional scope. It does not create empirical Evidence, native Core
accepted state, a Transition, publication, execution or synchronization authority.

### Scene walkthrough

1. Save the original manuscript/setting using A's editor. Under **Scene continuity**,
   choose **Next scene**, give it a title and viewpoint, and choose fictional event
   and reveal positions. These are independent nonnegative ordered numbers in the
   author's own sequence; they are not real dates or revision numbers. Select the
   complete saved source files needed for this scene and **Prepare scene context**.
2. The preparation reads authenticated persisted originals at the exact saved
   revision, applicable adopted material, separately marked undecided/rejected
   proposals, and the previous applicable draft. The displayed text and **Download
   scene context** contain identical product-generated bytes and source identities.
   The original files remain masters. No server model or invented summary is used.
3. Write in **Manuscript or setting — original text**, the same editor used by A.
   Optionally add consequential proposals. Their meaning can be an author fact,
   character knowledge/experience, character belief, public/narrator assertion or
   author intention. Save normally, revise and Save again. Prose is unrestricted
   by proposal wording; no proposal is required for an ordinary draft.
4. After saving, choose **Adopt**, **Leave undecided** or **Reject** for the proposals
   together, give the review reason, and **Review selected changes**. The preview
   shows the exact saved scene and choices. **Adopt reviewed choices** commits one
   atomic revision. Character beliefs need not agree with author facts. Adopting
   an intention records an author plan, not that its contemplated event occurred.
5. A reviewed scene remains readable. Choose **Next scene** to continue, or reopen
   an unreviewed scene to revise its draft. After leaving, a fresh browser/process
   opens the latest created scene and its persisted dispositions. Preparation for
   an earlier event/reveal excludes later adopted events; knowledge and beliefs
   are selected for the named viewpoint. Author facts are explicitly labelled as
   author knowledge, never automatically assigned to the character.
6. **Readable history** includes original scene drafts, proposals, dispositions,
   reasons and attribution in human-readable sections, plus the exact notebook
   contents. Download **Complete work**, quiesce the producer, and reconstruct that
   file into a separate configured empty replacement store using A's supported
   recovery. Open the recovered work and scenes through the same surface.

Changing preparation inputs, sources or the active scene invalidates pending
preparation; a late response cannot become the displayed or downloadable context.
Changing review choices, reason, draft or saved basis similarly discards an
unsubmitted preview. Prepare or review again explicitly. Once adoption is sent,
the review controls remain locked and the exact original request is retained for
**Check review outcome** or the existing explicit same-request retry.

The synthetic emperor fixture starts with A's exact Korean originals and prior
revision. At the scene boundary the author adopts that the emperor is alive, the
court's contrary announcement, Harin's belief in it, and Harin's receipt of an
unopened sealed message. Public return stays undecided; immediate revelation is
rejected. A successor at a later position can use the received message without
turning its unknown contents into Harin's knowledge. An earlier preparation keeps
applicable earlier facts/beliefs but excludes the receipt. This is explicit
synthetic authorship, not automatic natural-language contradiction resolution.

### Scene integrity, capacity and compatibility

One reserved ordinary file, `augnes-scenes.v1.json` (role `other`, format
`augnes_scene_notebook.v1`), holds the compact scene notebook. It uses existing
v0.3 file bodies, revision envelopes, preview seals, atomic D1 append and recovery;
there is no schema migration or second store. Each draft binds its exact source
revision and complete source file identities. Each review binds the current
revision, scene/proposals, fictional work scope, configured author, choices and
reason. The containing revision supplies actual save time and immutable lineage.
Generic file uploads, replacement or removal cannot manufacture adoption or erase
this history. Presentation detach/reattach retains the notebook and originals.

All A storage limits remain unchanged. The notebook uses one selected slot and
one distinct historical body per changed draft/review, rather than one note/file
per fact. It additionally admits at most 32 scenes and 16 consequential proposals
per scene (4,000 UTF-8 bytes per proposal); its whole file still must fit 262,144
bytes and the shared 16-body/1,048,576-byte history. In practice that history budget
can be reached well before 32 scenes. Removing a current selection frees no history.
Preparation admits at most **16,384 UTF-8 bytes** of complete generated context;
oversize refuses explicitly, never clips. Select fewer complete sources or a
smaller work scope. Large originals still remain downloadable and recoverable.

Stale current heads, revised/removed source files, foreign scopes, unauthorized
requests and altered replays refuse. A changed source requires explicit draft
preparation/save before a new review. A committed review's duplicate request
returns that exact revision. A lost response retains the original request; use
**Check review outcome** (or the ordinary **Check save outcome**) before an explicit
same-request retry. Unknown is not proof of failure. Refused drafts and choices
stay in the tab; latest-version comparison never silently overwrites them. Already
reviewed scenes cannot be overwritten. C below adds an explicit attributed
reinterpretation path while retaining these earlier scenes and reviews.

Recovery validates every introduced notebook body, source/review binding and
allowed historical transition before the existing empty-store transaction.
Malformed/incompatible domain content cannot become partially imported state.
Imported authorship remains an attestation, not independently verified authority.
Older Web readers can preserve/download these v0.3 bytes but cannot supply B's
scene semantics; do not use an older writer to reinterpret the reserved notebook.
Unsupported versions remain unavailable. A's older exports continue to work.

Viewpoint filtering is a narrative aid for one owner, not confidentiality: that
owner/host can access full originals. Whole unstructured sources are explicitly
selected and not semantically time-filtered or silently summarized. Structured
proposal event/reveal positions drive selection. Author-supplied labels and choices
are assistance; correctness of stored structure alone does not establish creative
quality, model understanding, lower burden or superiority to a maintained Story
Bible. The candidate report separately records any bounded included-client use,
actual context delivery and saved output, intervention and unknown burden.

## Alternate continuation — Increment C (#1455)

This bounded flow supports a primary containing saved scenes and one direct
alternate in the same owner/project. Ordinary work and file-free planning branches
retain their existing behavior; ordinary files use the separate whole-file selection
path below. Nested story forks, shared worlds and automatic semantic merging remain unavailable.

1. Open the saved primary, inspect its original sources and reviewed scene, then
   choose **Continue another direction**. Give a reason, **Review starting material**,
   and **Save reviewed change**. The displayed saved revision is the fixed origin.
   Current file bytes are copied. Inherited scenes/reviews are read-only context,
   attributed to their original scope; creating the branch does not review them again.
2. In the alternate choose **Next scene** and write in the existing editor. Under a
   consequential proposal, open **Setting revision or required context**. Select
   the earlier decisions to reinterpret. For a retroactive reinterpretation use
   the same fictional event/reveal positions as those decisions. Save the draft,
   then use the existing grouped review with a reason and explicit dispositions.
   Prior prose and rejection/adoption remain historical. Normal Save adopts nothing.
3. Reopen the primary and choose **Compare a private branch**. The current heads,
   named origin, alternate local prose and reviewed proposals are shown. Select
   **Adopt this fictional change here**, **Leave undecided here** or **Reject here**
   per proposal, explain the selection, preview and save. Only adopted proposals
   from the source are eligible for target adoption. Alternate prose/manuscripts
   are not transferred. Existing target prose, selected notes and unrelated edits stay.
4. If either saved work changed, use **Refresh versions and compare again** and
   explicitly review again. Local edits, edit-then-revert, cancellation and work
   replacement discard unsubmitted results. Admission rereads both current heads
   after asynchronous comparison/preview; SQL checks both again at save. A sent
   request with an unknown result remains locked to its exact original identity:
   **Check change outcome** or an explicit **Retry same change** resolves it.
5. Reopen each scope freshly, choose **Next scene**, and prepare its persisted
   context. Superseded settings are labelled historical; current scoped knowledge,
   undecided intentions and rejected changes remain distinct. The previous draft
   and exact selected originals remain accessible. Save the resulting prose normally.
6. From a current primary comparison choose **Export both story directions**.
   Keep `story-directions.json` and both readable HTML copies. In an explicitly
   configured quiesced empty replacement store, use the existing reconstruction
   file picker. Reopen both works after restarting the disposable runtime/browser.

The synthetic example reinterprets the unopened letter at event 2 / reveal 1 in
an alternate, allowing Harin to open it and learn the emperor survived. The primary
keeps the unopened letter and its original rejection. A separate dawn-bell setting
is selected into primary; alternate revelation and prose are left unadopted there.
This is a retroactive author choice, not a later event silently inserted into history.

### Direction integrity, bounds and recovery

`augnes_scene_notebook.v2` uses the existing reserved notebook file and v0.3
revision envelope. It adds immutable inherited scenes, bounded `revises`/`requires`
proposal links (up to four each), and append-only target selections containing the
exact source units, dispositions, target basis, actor and reason. The source's
original review and the target's selection have distinct recorded attribution.
Reinterpretation links require earlier adopted/rejected decisions at matching
positions. Declared prerequisites and exact required original files must already
be present or travel with a selected proposal. Natural-language dependencies and
contradictions are not automatically detected. Leaving a unit undecided does not
revoke an earlier target adoption. Reviewed scenes still cannot be overwritten.

A fresh review can retain an exact, still-current adoption, including a setting
revision, without performing its earlier reinterpretation again. Content, original
review, source files and scope must match; prerequisites still apply. Retaining
that unit does not prevent adopting a new independent proposal alongside it.
Repeating the same source version, units, dispositions, reason and author is an
acknowledgement of the existing revision, with no new notebook or history entry.
Changed source versions or decisions remain new selections under the existing
contract. A superseded unit cannot be reactivated by selecting it again.

A branch keeps current original bytes locally, while historical source bytes and
review bases remain in the named primary chain. Complete preparation refuses if
that required history is unavailable; it never supplies an invented empty source.
Readable copies label inherited attribution and target decisions. The versioned
`web_planning_direction_export.v1` recovery file includes **both** full histories
and file bodies. The existing `/api/reconstruct-files` route validates all hashes,
domain transitions and required cross-work references before one atomic D1 batch.
A malformed second scope rolls back the first as well. Single-work recovery refuses
missing direction closure. Old A/B exports remain supported; B readers explicitly
refuse v2 notebook interpretation. No old row/hash is migrated or rewritten, and
no new database schema, authorization profile or Native state is introduced.

All existing byte, history, query and request limits remain. A notebook admits at
most 32 local scenes plus selection records, with at most 16 consequential units
per comparison. The entire two-work recovery request must fit the existing
3,000,000-byte route and combined 1,024-row / 1,400,000-byte history envelope budget.
Each work retains the same 8 selected files, 16 historical bodies and byte bounds.
A normal draft/review creates one compact notebook version; capacity can be reached
well before the scene-count bound. Refusal preserves saved state and the current
draft, never clips history or raises limits. This supports the measured small
workflow, not unlimited long-form writing.

## Cumulative saved history (#1397)

The local implementation integrated through [#1404](https://github.com/hynk-studio/augnes/pull/1404)
removes the Web revision-32 lifetime constraint. Hosted adoption remains with #1372.
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
Canonical evidence and cleanup remain attributed to their original candidates:
#1398's implementation was integrated through #1404, whose reported final run
qualified head `820249de35a27df5f25c99bdac9bde5873278724`. Prior failures remain
historical evidence. None of these results qualifies a later head or observes
the existing hosted store; see the dated records below.

## Revision-bound private files (#1372)

Implemented in merged [#1377](https://github.com/hynk-studio/augnes/pull/1377):
choose files in the ordinary editor, review
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
context. File handling does not infer file-to-note dependencies. Ordinary files
now support the direct branch and selective incorporation path below. The C
scene-direction flow continues to own reserved notebook inheritance and fictional
adoption; generic file choices cannot bypass it. File-free behavior is unchanged.

### Ordinary file branches and deliberate replacement (#1517)

1. Save an ordinary work with its selected notes and files. No note is required
   merely to carry a file. Choose **Continue another direction**, give the reason,
   **Review starting material**, and **Save reviewed change**. The independent
   alternate owns exact copies of the current selection, with the original work,
   revision, fingerprint and full file identities. It does not copy the original's
   full history, access credentials or execution authority. This path supports a
   direct alternate, not nested file branches.
2. Edit the alternative with the normal file picker or **Text file → Open text**,
   and Save. Return to the original and **Compare a private branch**. Target notes
   and files are kept by default. Explicitly retain or deselect each, and choose
   the branch notes and whole files to use. Partial use and non-use are valid.
3. For a same-name file with different content or role, deliberately uncheck the
   target version and select the branch version. Keeping both conflicting versions
   refuses the preview with a correction message. Equal bytes under different names
   or roles remain distinct selections; storage deduplicates only their bodies.
4. **Review selective incorporation** shows the complete result, file identities,
   copy attribution, additions and deselections before one **Save reviewed change**.
   Earlier bytes and revisions stay in each owning work. Whole-file transfer does
   not merge file meaning or infer dependencies on notes. Represented required-note
   context and existing disposition qualifications still apply.
5. Changed choices invalidate the preview. Either saved head changing or being
   erased refuses the actual Save. A correctable refusal retains the choices for
   explicit correction and a fresh preview. For an unknown response, **Check change
   outcome** resolves the original exact request; **Retry same change** preserves
   its identity. Access loss continues to clear private tab state.
6. Reopen **Saved context** and download the exact files. **Complete work** and
   **Readable history** retain all this work's revisions and bytes. Reconstruct the
   complete JSON through the existing file picker in an explicitly configured,
   empty disposable replacement store. Original and alternate are independently
   complete exports. A missing origin is labelled unavailable, never reconstructed
   as a hidden snapshot or treated as permission to read another work.

Ordinary file-copy attribution uses `web_planning_revision.v0.4` and
`web_planning_export.v0.4`, compatibility `web-planning/4`. The closed `relations`
adds ordered `file_materials` (full descriptor, authored/inherited/incorporated,
and exact source revision or null for authored material). A comparison review
adds `file_selection` with the exact retained target and selected source entries.
These fields participate in the existing relation-byte budget and request/revision
fingerprints. Normal edits retain attribution for unchanged identities and mark
new identities authored. Once introduced, this envelope cannot downgrade, even
when the current file selection becomes empty.

There is **no schema migration**: existing schema-3 revision envelopes and scoped
file BLOBs are sufficient. Legacy v0.1/v0.2/v0.3 rows, exports and fingerprints
remain unchanged. Old binaries explicitly refuse v0.4 work and recovery; code
rollback does not make newer work readable by an older writer. Preserve complete
exports and use a compatible reader/writer to roll forward. No marker reset,
production migration, deployment or installed adoption is part of this change.

The existing authenticated, signed-preview and atomic append owners bind both
reviewed heads through Save. Actual source and retained-target bytes are verified
before file-copy admission. Invalid choices, unavailable/corrupt bytes and any
existing file/history/request budget refuse without partial revisions or orphaned
bodies. Already saved copies survive origin erasure; erasing an owning work removes
all of its own revisions and bodies. Branching never compacts the original history.

The registered Web focused and Browser owners exercise the pinned-main intentional
refusal, normal zero-note/file and note/file flows, explicit same-name replacement,
full identity and budget controls, post-read head/erasure races, exact request
resolution, legacy code upgrade/refusal/roll-forward, actual downloads and independent
empty-store recovery. These are synthetic local correctness checks, not hosted
authentication, independent consumer use, semantic understanding or comparative
usefulness evidence.

| Quantity | Limit and accounting |
| --- | --- |
| File body | 262,144 actual bytes; zero bytes allowed; exact SHA-256 |
| Current selection | 8 unique names; sum of selected sizes ≤ 524,288 bytes, including duplicate-content selections |
| Work history | 16 distinct content digests; sum of their sizes ≤ 1,048,576 bytes, shared only within this work |
| Name / role | 160 UTF-8 name bytes; Unicode preserved, no path separators, controls, bidi overrides or malformed Unicode; report/source/results/other |
| Ordinary JSON request | Existing 1,500,000-byte streaming cap, including base64 uploads; old routes are not enlarged |
| File-export reconstruction | Only `POST /api/reconstruct-files`: 3,000,000-byte streaming cap for v0.3/v0.4 work exports or the bounded C pair |
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
2,000,000 bytes per row/value and 100 bound parameters per statement.
Ordinary BLOBs remain unchanged. Each large body slice is at most 262,144
base64 characters; batched inserts bind at most 59 parameters per statement.
Legacy file reconstruction retains its 3,000,000-byte route. Complete extended
work exports use `web_planning_export.v0.6` / `web-planning/6` when an
exchange exceeds the old per-selection limits or the work exceeds the old byte
budget. Individual extended exchange envelopes use v0.6; earlier versions
keep their seals. The complete export packages all bytes, once per digest.
The private import control chooses the bounded quiesced replacement route:
13,000,000 bytes for one extended work; 25,000,000 for an extended direction
pair (still subject to the existing combined history and query budgets).
Readable HTML identifies large originals and does not inline or claim to have
inspected their text. Older readers and Native do not import v0.6. Schema 4
requires the matching Worker; do not roll back a migrated store with an old
binary. These are finite local integration bounds, not hosted load measurements.

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

Historically, additive migration `0002_revision_files.sql` created the file
table/quotas and replaced the schema marker with version 2. Current code requires
schema 3 through the subsequent `0003_cumulative_history.sql`, including its
`web_planning_revision_positive` constraint; 0002 alone is insufficient.
The shipped 0000/0001 SQL and v0.1/v0.2 envelopes, fingerprints and artifact-free
exports remain byte-identical.
Empty file selection on legacy work does not promote its format; once v0.3 is
used, later revisions cannot downgrade. Saving v0.3 requires an explicit file
selection, so old request shapes cannot silently remove files. The schema-1
predecessor refuses schema 2/3, and the schema-2 predecessor refuses schema 3,
including lists, saves, exports and erasure. Current code refuses schema 1/2
with `incompatible_schema` / HTTP 503. A code-only downgrade cannot recover an
upgraded database. Quiesce old writers, preserve complete
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
injected response-loss recovery. The earlier Companion prerequisite and
Draft/HOLD were historical: #1377's integrated candidate
`51f37663ee711e292875734e7e9acef321fbd4d3` completed its reported 16-phase
Canonical run and receipt validation on 2026-10-01, before merge. That evidence
does not transfer to this documentation head or establish schema-3 hosted
adoption. #1372 remains open for the separately authorized existing-target
transition and actual hosted successor use described below.

## After an accumulated-history refusal (#1439)

`history_read_budget_exceeded` on Save means the proposed complete revision
array would exceed its row or canonical-byte budget. The preceding saved work
remains intact. Read Saved context, complete History and Export independently;
keep the unsaved draft separately. A successful ticket or Draft capacity check
does not reserve a revision. A fresh ticket, refreshed credentials, or export
reconstruction does not free history capacity.

For `file_history_count_exceeded` or `file_history_bytes_exceeded`, earlier
revisions retain their bodies. Reusing an existing content digest does not consume
another historical body; deselecting it does not release its historical charge.
Planning revisions or reuse can still fit while adding a new distinct body cannot.
Complete Export includes every retained body, and historical Download binds its
original revision, size and digest. Verify the actual post-refusal export before
treating it as preservation material.

Reconstruction into an explicitly enabled empty replacement store preserves the
exported revisions, request identities, predecessor hashes, selected material,
relations and bodies. It retains the exhausted budget and imported-attestation
status. It does not restore a referenced work absent from that export, external
files not retained by this work, access credentials or execution authority.

For ordinary work, explicit **Continue another direction** can create a separately
owned direct alternate from the current definition and selected notes/files, with
exact attribution. It does not copy or compact the original work's full history;
retain the original and its export. The scene-direction contract separately owns
creative inheritance and adoption. Do not drop required material merely to fit.
When an operation requires an exhausted history/body budget, retain the material:
there is no preserving capacity-release path for that same owning work.

These are current support boundaries, not a new runtime contract. Native project
and direction history use [different owners and recovery limits](../../docs/DATABASE_ACCESS_LIFECYCLE.md#accumulated-native-history-refusal-and-preservation-1439).

## Draft capacity and deliberate revision

**Success criteria** requires 1–12 distinct, nonblank entries; **Non-goals** is
optional (0–12). Both fields explain the 500-codepoint per-entry limit and the
existing trim, blank-line removal, deduplication and sorting on Save. Empty
criteria retain native browser validation. A server-refused criteria definition
also shows an associated field error and focuses that field after a deliberate
Save; raw draft input and selected context remain intact. Editing criteria or
loading another work clears the prior field error. Background capacity checks
do not move focus. Correction still saves through the existing server authority.

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
still requires the repository's exact Node 24.22.1/npm 11.16.0 toolchain.

The web source compatibility range is `^22.23.4 || ^24.22.1`. Its three
Miniflare paths use scoped overrides for sharp 0.35.5 and Undici 7.30.1.
The inspected stable parent releases still pin affected Undici, so this keeps
the existing Vite/Miniflare/Wrangler/workerd versions instead of introducing
unrelated parent or major changes. Verify all nested paths after installation;
Node's bundled HTTP client is a separate runtime dependency.

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

Development-only Saved-context checkpoint and external assessment-save commands
are documented in [the continuation helper](../../scripts/web-planning-continuation.md).
They use disposable synthetic fixtures and do not attest to model reasoning.

## Direct Cloudflare adapter (#1356)

The direct entry `src/cloudflare-worker.ts` shares the existing handler, UI,
store and envelope. It requires Cloudflare's platform `ctx.access`, an exact
64-hex `ACCESS_AUDIENCE`, and a verified `getIdentity().email`. The handler then
enforces the default `OWNER_EMAIL` boundary, or the explicitly enabled
project-admission/ownership and separately scoped W1 grant boundaries.
Missing context, audience mismatch or identity failure refuses before D1 access.
No request header, Sites mode, fixture cookie or JWT fallback authenticates this
entry. Only the configured owner at its ordinary entry can initialize the
reserved legacy mapping in an empty migrated scope; existing mappings and
nonempty unmapped scopes cannot rebind. New project mappings use the explicit
admitted-principal creation operation, not first-visitor bootstrap.

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

Direct D1 initialization and upgrades belong to pinned **Wrangler D1 migrations**,
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

1. **Bind the later approval.** Record the exact approved commit/tree, locked
   inputs, direct Worker artifact hash and compatible reader/writer/recovery
   versions. Current main and a historical receipt are not deployment approval.
   Readers must support schema 3, retained v0.1/v0.2/v0.3 envelopes and complete
   histories within current budgets, plus any retained story/scene formats.
   A binary that merely accepts the schema marker is not sufficient compatibility
   evidence for those later file semantics. Retain the preceding artifact and
   its actual compatibility limits privately.
2. **Bind the existing target and build separately.** Reconcile the retained
   account, Worker, active deployment/version and traffic, D1 binding/identity,
   Access application/audience/policy, protected origin and preview restrictions.
   Retain `OWNER_EMAIL`, `REQUEST_SECRET`, `WORKSPACE_ID`, `PROJECT_ID` and
   `AUTHOR_REF` through their existing private configuration owner; do not print
   secrets or replace that configuration with the unbound template. The local
   `npm run web:build:cloudflare` build needs installed locked dependencies, not
   a Cloudflare session. Record inputs, artifact and shipped SQL hashes; verify
   the retained private configuration resolves those exact artifacts. Remote
   operations separately use the established Wrangler 4.126.0 and CLI-managed
   Keychain session (`CLOUDFLARE_AUTH_USE_KEYRING=true`). An unavailable session
   is a separate access input, not a failed local build or authority to log in,
   refresh credentials, rotate secrets or change configuration during preparation.
3. **Select the migration path from actual state.** Read the schema, table SQL
   and established ledger using the bounded observations below. Current
   `src/access.ts` requires exactly one version-3 row and the revision constraint;
   schema-2 code plus 0002 is historical. Use the matrix below. Compare the
   ledger with the approved artifact's unchanged SQL, then review only genuinely
   pending 0002/0003 in order. Do not replay initialization, rewrite ledger rows,
   reset markers or mix direct Wrangler and Sites Drizzle histories.
4. **Quiesce and preserve before incompatible effects.** The existing operator
   must specify and confirm the separately approved method of stopping all
   browser/agent writers for the migration and code-switch window, settle
   in-flight/unknown saves through their existing outcome readers, and preserve
   unsaved drafts privately. Closing one tab or relying on schema refusal is not
   evidence of quiescence. With the currently compatible reader, inventory every
   saved work/current binding and retain validated complete exports and hashes;
   include required paired story-direction exports. Reuse a retained export only
   when its exact binding still matches. Record the provider recovery checkpoint,
   covered database/ledger/mapping/erasure state, retention window and supported
   restore owner. Missing export access or recovery coverage stops the transition
   for diagnosis; do not deploy a new reader just to probe an incompatible store.
5. **Apply the approved pending migrations and code within that window.** For
   this direct target, the existing pinned CLI's
   `d1 migrations apply DB --remote --config "$AUGNES_WEB_PRIVATE_CONFIG"`
   is the mutation owner, only after separate approval and verification that its
   resolved migration directory/ledger has exactly the reviewed pending set.
   The variable denotes the retained private configuration, never the generated
   placeholder. Schema 1 progresses through 0002 then 0003; schema 2 through
   0003; compatible schema 3 needs no migration. Each migration settles through
   that owner; do not assume a multi-file upgrade and deployment are one atomic
   operation. While writers remain quiesced, read back the ledger, sole schema
   marker and table constraints, then use the existing deployment owner for the
   exact approved artifact. Preserve Access, traffic restrictions, bindings,
   mapping, secrets and existing work. Unexpected pending SQL or state stops here.
6. **Resolve uncertainty before retrying or reopening writes.** Retain the
   original command/result and timestamp. Read actual deployment/version/traffic
   and D1 ledger/schema/table state; an interrupted command may have completed.
   Compare the active artifact and data to the approved target and preservation
   baseline. If the result is unknown, keep the transition stopped. Do not replay
   migrations or deploy again to manufacture certainty. With compatible code
   active, compare all pre-existing complete exports/bindings and verify the
   private configuration before a separately approved return of writers.
7. **Recover compatibly if needed.** If schema 3 is intact, use a reviewed
   schema-3-compatible artifact or roll forward with a reviewed correction.
   Schema-1/2 code cannot read an upgraded database, even below 33 revisions.
   If database recovery is required, retain the failed state and use only the
   separately approved provider recovery owner/checkpoint, then pair the recovered
   database with compatible code and verify the complete baseline before traffic
   resumes. Do not assume that an old code deployment also restores data. Never
   truncate history, delete files or reset the marker to simulate compatibility.

Complete work exports preserve authored history and file bodies; they are not a
whole-database backup of every work, owner mapping, migration ledger and erased-ID
guard. The existing `handler.ts` / `store.ts` reconstruction owner requires
`RECONSTRUCTION_MODE=quiesced-empty-store`, matching scope and an entirely empty
destination (including no erased IDs/files). It imports one work or the supported
story pair atomically. It cannot restore multiple independent exports by appending
them successively to one populated store or recover the target's deletion ledger.
Use it only for a separately approved replacement recovery within that scope;
do not clear the existing target, provision a replacement or enable reconstruction
as part of this preparation. Provider recovery availability remains an input to
review, not a capability demonstrated by local reconstruction tests.

### Existing-target compatibility matrix for the schema-3 baseline

These are source-supported conditional paths, not observations of the live D1.
"Coherent ledger" means the retained migration owner, ordered applied filenames
and actual tables/constraints agree with the shipped SQL and retained records.
The last known deployed source does not determine today's database schema.

| Observed existing state | Transition to the accepted schema-3 code |
| --- | --- |
| Schema 1 with a coherent established ledger | Review genuinely pending shipped `0002_revision_files.sql`, then `0003_cumulative_history.sql`, through that same owner, with writers quiesced and recovery retained. Do not replay 0000/0001. |
| Schema 2 with a coherent ledger | Review only pending `0003_cumulative_history.sql` through the established owner. Preserve file bodies and all prior history. |
| Compatible schema 3: one marker row, required positive safe-integer revision constraint, expected tables/quotas and coherent ledger | Do not infer that another migration is necessary. Review code/readers and preservation; leave the migration history intact. |
| Marker-only schema 3, inconsistent/mixed ledgers, missing/duplicate markers, unexpected tables or unknown state | Preserve evidence and stop for diagnosis. No initialization replay, ledger repair, inferred upgrade or code-only downgrade. |

### Bounded observations and retained evidence

For a later private target observation, use already authorized provider metadata
reads and explicit SQL `SELECT` through the established query owner. First inspect
`sqlite_master` for table/index/trigger definitions and ledger presence, then read
`web_planning_schema` and the existing ledger in order. Compare the actual
`web_planning_revision` SQL with shipped 0003, not only the marker. For the direct
owner the ledger is `d1_migrations`; `__drizzle_migrations` belongs to Sites.
Unexpected coexistence or a missing established ledger stops the transition for
diagnosis. Preserve scope/mapping comparisons and recovery material privately.
For example, these are SQL reads for the already authorized direct query owner,
not commands executed during preparation:

```sql
SELECT name, type, sql FROM sqlite_master
WHERE name LIKE 'web_planning_%'
   OR name IN ('d1_migrations', '__drizzle_migrations') ORDER BY type, name;
-- Only after the expected tables and direct ledger are confirmed present:
SELECT version FROM web_planning_schema ORDER BY version;
SELECT name FROM d1_migrations ORDER BY id;
```

Timestamp each observation and record its target/source privately. Check for
unexpected leftover migration tables as part of schema inspection; a valid
marker alone is not a complete migration observation.

Do **not** use `GET /` as a read-only probe: `authorize` may initialize an empty
store's owner mapping, and the page can issue a CSRF cookie. Pinned Wrangler
4.126.0's `d1 migrations list` calls its ledger initialization helper, so do not
use that command as a guaranteed non-mutating query either. For an already
mapped store and existing authorized session, `GET /api/works` and the exact
work/export/file GET routes in `handler.ts` do not initialize mapping; they still
require the deployed code's schema and access checks. No auth bypass or new
probe endpoint is implied. If observations require login/session maintenance,
new access or a configuration/operational change, leave the inputs NOT_OBSERVED
and obtain that specific authority separately.

The following records were re-read on **2026-10-18 UTC**. Historical reviews are
attributed reports, not fresh provider queries or re-executed tests:

| Date and source | Established observation and limit |
| --- | --- |
| 2026-09-29, [#1356 final review](https://github.com/hynk-studio/augnes/issues/1356#issuecomment-5897395431) | Reported one protected Worker/D1/owner Access target, schema 1 and two migrations applied once; private configuration and complete exports retained. This is the initial deployment record, not today's schema/traffic. |
| 2026-09-30, [#1371 reviewed disposition](https://github.com/hynk-studio/augnes/issues/1371) | Approved source `7d4320a4c6ebd08f2f8b4e530f5150d972a58ec1`; supplied records showed the same target, accepted-version traffic, unchanged schema/ledger/mapping and byte-identical exports for five pre-existing works. Sign-in repairs and security limits remain; this does not observe later schema-3 adoption. |
| 2026-10-01, [#1377 integrated candidate](https://github.com/hynk-studio/augnes/pull/1377) | Reported 16/16 Canonical phases and valid receipt for base `704e2865c3fe76b058bcbbcbb2940075c1cd4631`, head `51f37663ee711e292875734e7e9acef321fbd4d3`; merged at `2026-10-01T07:18:19Z`. Same-Mac synthetic downloaded-file continuation was bounded engineering evidence. Earlier HOLD/failures remain historical. |
| 2026-10-05, [#1404 integration](https://github.com/hynk-studio/augnes/pull/1404); 2026-10-06, [#1372 reconciliation](https://github.com/hynk-studio/augnes/issues/1372) | #1398's schema-3 implementation entered main through #1404; its reported 16/16 result belongs to base `5a47a9f32fde8e9d4cc65831fd9ef848c397b155`, head `820249de35a27df5f25c99bdac9bde5873278724`. Hosted adoption and successor-use obligations remain open in #1372. |
| 2026-10-18, source inspection at main `51410e43101be300a5ef7f08c873580728695ce4` and authenticated GitHub history | `access.ts` requires schema 3 plus the constraint; shipped 0003 upgrades schema 2; `buildCloudflarePlanning` includes SQL through 0003. Test sources cover direct artifact SQL parity, both migration owners, historical-byte preservation and old/new schema refusal. These are source-established contracts; no build, migration test, browser test or Canonical runtime run was executed by this documentation preparation. |

Current operational inputs remain **NOT_OBSERVED**: live Worker version/traffic
and artifact linkage; D1 identity, actual schema/constraints/ledger; current Access
and retained private configuration/session validity; complete current work/export
baseline; writer inventory/quiescence method; available provider recovery
checkpoint, coverage and retention. Historical GitHub/retained issue records were
available; no live target was queried or credential/session maintained here.
Keep private identifiers, configurations, exports and recovery records outside
public reports. The later approval must bind these inputs, exact artifacts,
pending migration set, maintenance window and recovery decision before effects.

### Later hosted successor acceptance (#1372)

**NOT_RUN in this preparation.** After separately approved transition and
preservation, conduct one bounded real successor task on one authorized supported
browser/agent host. Record the actual host/environment; neither both physical
Windows and Android nor a replay of the old #1366 study is required.

1. Through the existing protected hosted surface, reopen the intended saved work
   with its exact revision/fingerprint, qualifications and file manifest. Retrieve
   the actual report/source/result bytes through authenticated revision-bound
   downloads; verify names, sizes and hashes. A Mac path, source checkout or old
   conversation attachment must not be needed to retrieve the working material.
2. Have that consumer actually use those delivered files in the named successor
   task and retain its concrete new observation/output and input bindings. Record
   what the host could consume and any manual transfer, reattachment, login,
   context repair or failed operation. Download alone is not consumer use; a
   manual relay cannot be reported as meeting the no-relay product outcome.
3. Return the new observation or artifact through ordinary selected context/file
   Save, resolve uncertain outcomes before retrying, and freshly reopen the new
   revision and complete export. Verify the prior revision/file bytes remain
   intact and attribute any unrelated concurrent changes without overwriting them.

Report hosted delivery, actual use, returned result, preservation and operator
burden separately. One journey does not establish comparative usefulness,
independence or learning. #1372 stays open until its actual hosted and successor
outcome is reviewed. This preparation grants no deployment, remote migration,
traffic/configuration/authentication change, resource creation, provider study,
installed-runtime adoption, Ready/merge, auto-merge or Augnes Space write.

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
| `OWNER_EMAIL` | Deliberately configured legacy owner login, checked server-side; never first visitor. Also admitted when optional project entry is enabled. |
| `WORKSPACE_ID`, `PROJECT_ID`, `AUTHOR_REF` | Three stable UUID v4 values for the installation and its legacy private project/author. Keep them across code versions and reconstruction. New project/author IDs live in their mappings without replacing these values. None are Sites IDs or native Augnes IDs. |
| `REQUEST_SECRET` | Random server-only secret of at least 32 characters for scope-bound save/CSRF seals. Store through the separately authorized Sites secret owner, never in Git or prompts. Rotation invalidates outstanding seals and needs deliberate outcome reconciliation. |
| `SITES_INGRESS_MODE` | Leave unset until hosted trust checks pass. `verified-private-sites` enables the documented identity adapter; it is an operator assertion, not cryptographic verification or authentication by itself. |
| `RECONSTRUCTION_MODE` | Normally unset. `quiesced-empty-store` admits an explicitly requested reconstruction into the selected empty project scope, only after the old writer is quiesced. Other projects remain independent. |
| `PROJECT_ENTRY_MODE` | Normally unset (legacy owner-only). `admitted-private-v1` enables private project entry on schema 5 or 6. It does not alter the hosted audience. |
| `PROJECT_ADMITTED_EMAILS` | JSON array of up to 100 verified-ingress emails allowed to create/select their own projects when entry is enabled. It grants no access to another owner's project. |

Before real data, independently verify owner-private audience, authenticated
identity forwarding, missing/duplicate/wrong identity refusal, overwrite of
spoofed identity headers, and absence of a bypassing backend URL. A client can
forge that header on an unprotected Worker; the adapter is unsafe outside the
qualified Sites ingress. Default configuration denies it. Local synthetic
sessions establish application authorization only. They do not qualify this
platform boundary. Workspace admins/editors remain a platform trust boundary.

Normal top-level entry may follow Sites sign-in or an external link. Only a
supported entry navigation (`GET /`, exact `/?project=UUID`, enabled `/projects`,
or exact `/participate/UUID`) with `Sec-Fetch-Mode: navigate` and
`Sec-Fetch-Dest: document` is exempt from the cross-site/same-site Fetch Metadata refusal. Exact
`Request.url` origin and any present `Origin` must still match `APP_ORIGIN`;
identity, ingress, schema and applicable admission/mapping/grant checks still apply.
The exception admits only ordinary entry, never arbitrary first-visitor
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
JSON, revision bounds, scoped foreign keys and uniqueness constraints are
also exercised directly in D1. The original two migrations remain unchanged.
#1351 used schema 1 with only a JSON-envelope extension; #1372's file implementation
added 0002/schema 2, and #1397 added 0003/schema 3. The complete-originals
Worker requires at least 0004/schema 4; project entry requires 0007/schema 5,
and scoped work succession requires 0008/schema 6.
The 0004 migration copies the old file headers and
BLOBs, retains every revision, and adds scoped parts with cascading erasure.
Apply it only through the established migration owner in a separately approved
transition after a fresh backup. The local compatibility test owners cover nonempty
old-writer upgrades without resealing historical bytes; their presence is not
a new execution result. No live hosted migration or native schema change is
performed by this documentation preparation.

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

`src/contract.ts` and `src/files.ts` own the v0.1/v0.2/v0.3/v0.4 Web host envelopes;
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

The ordinary workspace HTML/assets/list/work/history/export and mutation paths
authorize the owner and selected scope. The separate participant routes above
authorize only the exact recipient/request/material/action grant. Writes and exact-context reads also require same
origin and a signed, owner-bound CSRF cookie/header. No wildcard CORS, private
cache, raw-error logging, remote source fetch, inference or active note HTML.
Source locators are inert text. Saved context performs a new primary read against
the displayed revision; a changed head withholds replacement notes until explicit
refresh. Access denial clears the private view; an old external observation
cannot be revoked retroactively. Sign-out and bfcache return discard/reload it.

Export includes the complete chain, format/schema/compatibility markers, original
scope, fingerprints, observations and recorded times, excluding login/secret/seals.
Reconstruction validates everything before an atomic D1 batch into an empty project scope;
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

For file-free selections and ordinary files (see the whole-file selection contract
above), the normal work-detail flow is **Continue another direction → Review starting
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

Review **Current notes in this work** alongside the proposed branch material.
Every current target note starts checked. Deliberately uncheck an obsolete
current instruction, or keep both old and new notes. Then choose `incorporated`,
`not_selected`, `deferred`, or `declined` for each whole branch unit.
Deferred/declined choices require a rationale. An incorporated item with no
optional rationale says only that none was supplied; non-selection still does
not mean rejection or refutation. Authored rationales are displayed unchanged
and escaped. The reviewed target keeps its own definition. Earlier source
bodies, revisions and attribution remain in history when a note is deselected.
Review the complete proposed selection, then **Save reviewed change** once.
**Saved context** reads that confirmed selection freshly from the server.

A note may appear in both works. Deselecting it in the target while choosing
`incorporated` in the branch visibly refuses with `target_selection_conflict`;
keep it in the target or change its branch disposition before previewing again.
No displayed deselection is silently reversed. Explicit dependency links are
entered with **Required context** in the note editor. Linked conditions must
already be selected in the target or travel with the selected material; an
incomplete or over-budget selection refuses in full. The validator cannot
discover every unstated natural-language dependency. New or edited notes have
their own attribution; editing an existing note in the UI produces a linked
`derived_interpretation`, not unchanged inherited evidence.
Historical adaptation/provenance links do not themselves require their original
note to remain currently selected. Explicit **Required context** links do: both
retained target notes and selected additions are checked against the complete
proposed selection. Missing required context refuses without a partial save.

`src/relations.ts` resolves originals, normalizes choices and builds the bounded
host metadata; `handler.ts` retains the existing authorization/CSRF gates;
`store.ts` persists through the same conditional revision INSERT. The signed
preview binds the source, target, normalized material, dispositions/rationale,
explicit target choices, request identity and 24-hour expiry. A single SQL statement checks both heads
and erasure guards at admission; there are no separately committed relation or
provenance rows. Two competing target writes cannot both advance the same head.
Exact replay acknowledges the original result; altered requests refuse. An
uncertain response retains the original request, reason and choices in the tab.
**Check change outcome** is read-only (including after expiry); **Retry same
change** is explicit and uses identical material. Drift requires **Refresh
versions and compare again**, retaining prior choices for review, followed by a
new preview. No automatic retry, rebase or latest-version substitution occurs.

If that refresh fails, the tab retains each whole-unit disposition and rationale,
each current target note's retain/deselect choice, the overall rationale and
unresolved question, the earlier source/target bindings, and the unsaved-work
warning. Currentness remains unconfirmed and the
old preview is invalidated. A complete explicit comparison must succeed before
a fresh preview: only exact source bindings retain their choices; removed or
changed units are shown for review. HTTP 401/403 instead clears private content
and draft state. These drafts are held only in the current tab's memory.
New target notes encountered during refresh start retained; a choice is carried
forward only for its exact source reference. Target-choice edits invalidate the
preview and its request snapshot. An unknown save locks those controls and
reconciles the exact original request, including its target selection.

The file-free incorporation intent accepts optional `target_selection`, an array
of up to eight unique source references from the exact reviewed target. Omission
retains every target note and preserves legacy intent/seal behavior. Malformed,
duplicate or foreign references refuse with `invalid_target_selection`.
The server validates choices on preview and save, within the existing exact
source/target binding. The saved `sources`/material selection and comparison's
target revision record the result through unchanged v0.2/v0.3 envelopes,
fingerprint algorithms and export/reconstruction consumers. No new schema,
store or automatic semantic supersession is introduced. Older servers reject
the new request field; refresh the client with its compatible server rather
than silently falling back to an intent that could retain deselected material.

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
platform trust dependency. #1356 separately accepted #1351's bounded direct-host
journey as recorded above. That historical acceptance does not establish #1372's
hosted schema-3 adoption, agent-host file consumption or separate successor-task
usefulness. No new hosted deployment, independent model interpretation or
comparative benefit is established by this preparation. It adds no
WebMCP, new transport, public discovery, inference or automatic execution.
