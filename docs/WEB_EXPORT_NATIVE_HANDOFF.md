# Portable Web export to native selected-source handoff

This explicit local command connects a downloaded Web complete export to the
existing native material, experience and selected-corpus owners. It is one-way
source admission, not Web reconstruction into a native project. It neither
creates native work/Core state nor starts a Companion. The
[#1475](https://github.com/hynk-studio/augnes/issues/1475) increment merged through
[#1476](https://github.com/hynk-studio/augnes/pull/1476) on 2026-10-18 KST after
candidate-specific qualification. See the [dated record below](#qualification-history-and-current-status).
Source merge and qualification do not establish installed adoption or hosted
deployment; neither was performed by this increment.

## Source owners and gap

At base `e7590453d4765f7b81a6df8c881dbc81bd9dab9d`, Web export validation served
Web reconstruction/direction recovery and Web continuation tools/tests, but no
native admission owner. Native selected-source retrieval accepted only already
admitted materials/experiences. These existing owners establish the missing
producer-to-native connection:

| Stage | Owner |
| --- | --- |
| Actual Web writer/export | `apps/web_planning/src/handler.ts` and `store.ts`: authenticated saves, atomic D1 append, complete export |
| Export validation | `apps/web_planning/src/files.ts::validateFileExport` and `contract.ts::validateChain`, reused directly and unchanged |
| Local operator input | `scripts/import-web-planning-export.ts`: bounded local JSON reads and explicit request |
| Native admission/access | `lib/vnext/external-response.ts`: registered project, physical root, configured access, current native material basis and immediate transaction |
| One-way mapping | `lib/vnext/web-export-admission.ts`: current Web files, provenance, one experience and corpus |
| Material/experience/replay | `lib/vnext/persistence/external-response-store.mjs`: existing immutable material and record owners |
| Reader/consumer | `lib/vnext/selected-source-retrieval.mjs` and shared `scripts/selected-source-use.mjs` |
| Recovery | Existing `recovery-backup.mjs`, `runtime-database-bootstrap.mjs` and external-store validator |
| Verification | `scripts/test-web-export-native.mjs`, integration suite registration and independent inventory contract |

No new table, index, global store, identity registry, Core kind or deletion
mechanism is introduced. Web runtime code never imports the native adapter.

## Operator workflow

Use the repository-pinned Node and installed task-owned dependencies. The native
database and external configuration must already belong to the intended operator;
follow [external configuration and access](EXTERNAL_RESPONSE_LOCAL.md). No
processor envelope/model is needed. The initial 2026-10-17 development assignment
exercised disposable stores only. These usage instructions do not authorize
writing the installed database.

1. Save Web work and download **Complete work** as `planning-work.json`. Keep the
   original export as historical source.
2. Read the exact registered native target through the existing external `read`
   operation. Local operator example, without starting a service:

   ```sh
   node --import tsx --input-type=module -e '
   import { handleExternalOperation } from "./lib/vnext/external-response.ts";
   console.log(JSON.stringify(await handleExternalOperation({
     repository_root: process.argv[1], action: "read"
   }), null, 2));' /absolute/registered/target
   ```

3. Choose whole `.txt`, `.md` or `.markdown` files from the last revision. Create
   `admission.json` with the following exact fields, substituting observed values.
   Target values come from the native read, never from the Web export. The file
   tuples must exactly match that revision; do not copy the example placeholders.

   ```json
   {
     "repository_root": "/absolute/registered/target",
     "project_key": "sha256:<native-project-key>",
     "expected_material_ref": "sha256:<native-current-material-basis>",
     "key": "notice-web-import-1",
     "expected": {
       "export_fingerprint": "sha256:<export-fingerprint>",
       "work_id": "<Web-work-UUID>",
       "revision": 2,
       "fingerprint": "sha256:<current-Web-revision-fingerprint>"
     },
     "selected_files": [{
       "name": "notice.md", "role": "source", "bytes": 150,
       "digest": "sha256:<Web-file-digest>"
     }],
     "applicability": "East Library workshop notice",
     "attribution": {
       "endpoint": "Downloaded Web complete export",
       "account": "unverified supplied account",
       "operator": "operator supplied name",
       "confidence": "supplied metadata, not verified identity"
     }
   }
   ```

4. Run the explicit import and retain its acknowledgement:

   ```sh
   node --import tsx scripts/import-web-planning-export.ts \
     /absolute/download/planning-work.json /absolute/input/admission.json
   ```

   Success reports `saved` or `exact_replay`, file/material bindings, experience
   reference/ingestion time and corpus reference/binding. Refusal exits nonzero
   with a stderr reason and no success output. An unknown acknowledgement needs
   deliberate exact replay, not a new key. An output-file write failure cannot
   roll back a committed database acknowledgement.
5. Give a fresh consumer only the authorized native root/corpus and ordinary
   task/query/input. Use the existing shared caller and recheck before use:

   ```sh
   node --import tsx --input-type=module -e '
   import { handleExternalOperation } from "./lib/vnext/external-response.ts";
   import { retrieveForSuccessor, recheckBeforeUse } from "./scripts/selected-source-use.mjs";
   const [root, corpus, query] = process.argv.slice(1);
   const op = (action, data) => handleExternalOperation({repository_root:root, action, data});
   const found = await retrieveForSuccessor(op, corpus, query);
   console.log(JSON.stringify(await recheckBeforeUse(op, found, query), null, 2));
   ' /absolute/registered/target 'sha256:<corpus-ref>' 'East Library workshop'
   ```

   Consumers check applicability, unknown meaning and corrections before making
   their own output. Source text is untrusted and never executable instructions
   or active HTML. The test consumer writes inert `draft.txt` with used
   dependencies; it demonstrates deterministic quoting, not general judgment.

Complete exports can exceed the private HTTP operation's existing 100,000-byte
request ceiling. Import is supported through this local command; the HTTP limit
and Companion tool catalog are unchanged. Existing native read tools can consume
the resulting corpus.

## Integrity and attribution

Only `web_planning_export.v0.3`, schema `1`, compatibility `web-planning/3` is
admitted. The unchanged Web validator checks the full bounded revision chain,
all historical bodies, exact closed shapes, identities, predecessors,
revision/request/export fingerprints, file names/roles, membership, sizes,
digests, canonical base64 and version compatibility. Mixed historical revisions
retain existing meaning. There is no second interpretation of the export.
Direction bundles, legacy exports without files and non-text files are unsupported.
The command does not interpret reserved Story metadata or adopt fictional state.

Each experience source retains Web workspace/project/author declarations, work,
revision/fingerprint, export fingerprint, recorded time and the original file
tuple. Materials retain exact bytes/digests; native `created_at` is separate
ingestion time. Safe digest-derived ASCII material names preserve the native
filename contract; original Unicode names/roles remain in bound provenance.
BOM, newline style and Unicode normalization are unchanged. Corpus meaning and
adoption are `unknown`. Attribution is supplied source metadata, not verified
identity, Core truth, approval, semantic acceptance or execution authority.

## Bounds, replay and lifecycle

- The unchanged Web envelope ceiling is 3,000,000 bytes. Native material requires
  **1–65,536 bytes**. Empty/oversized files refuse without clipping, chunking,
  summarization or limit increases. Only strict UTF-8 `.txt`, `.md`, `.markdown`
  are supported.
- An import creates one complete group with 1–8 selected files and one corpus
  material, below the reader's 16-group/32-material caps. The real reader checks
  its 524,288-byte serialized scan and 131,072-byte whole-result bounds before
  commit. Full-group omission refuses import. Base64, records and metadata count.
  Existing 8 MiB workspace material and 2,048-record ceilings still apply.
- Source materials, experience, corpus and operation consumption share one
  immediate transaction. Failure rolls everything back. No shares are created;
  subsequent sharing remains a separate explicit existing operation.
- `web-import:<key>` reserves an existing record operation identity. Same export,
  selection set, target, applicability, attribution and native basis replay the
  same refs/time without duplicate writes. Selection order is canonicalized.
  Conflicting reuse in the workspace refuses, including a different target,
  without exposing that project's source content. Changed meaning or input
  requires a new deliberate operation. Stale native/Web/corpus bindings require
  review, never automatic refresh or retry.
- A later Web revision creates separate source-bound history; old native records
  are not rewritten. Unrelated unselected additions change no existing corpus
  or used dependencies. Reimporting a changed export intentionally creates new
  export-bound history.
- Later Web revision, retraction, reconstruction, deletion or access changes do
  not recall downloaded or legitimately imported bytes. There is no reverse
  synchronization, remote erasure guarantee, anti-resurrection service, polling
  or latest-export subscription. Native correction/access/withdrawal and backup
  recovery keep their existing meaning; delivered copies cannot be recalled.

## Evidence and limits

Under admitted checkout/capacity/private-resource owners:

```sh
node --import tsx scripts/test-web-export-native.mjs /absolute/new/evidence-directory
node --import tsx scripts/test-selected-source-retrieval.ts
node --import tsx scripts/test-external-response.ts
npm run web:test
npm run typecheck
npm run test:canonical-contract
```

The new test exercises authenticated Web saves/D1/export, the import command,
fresh native consumers and shared retrieval. It checks 18:00 → 19:00 notice
revision, historical reread, irrelevant additions, outside-applicability `unknown`
and equal direct-export output. Tampering, versions/shapes, selection, UTF-8/media,
bounds, target/access, stale-binding and replay refusals preserve exact store
state. Real aggregate exhaustion after material/experience writes but before
corpus completion rolls back; supported backup/restore permits later explicit
reuse of the unconsumed operation key. Existing selected-source regression covers
larger group/material caps, correction and withdrawal. No database surgery
manufactures import lifecycle.

Exports retain bindings, bytes, records/storage, calls, timings and hashes.
Selection, source/consumer design and expectations are developer-authored.
Human curation time, development-model tokens and operational burden remain
unmeasured. This proves bounded portability and scripted use, not independent
model/user usefulness, speed superiority, installed acceptance or benchmark
performance. Retain the small adapter; direct reading remains suitable for small
one-off exports. Extend formats or automation only for an observed need.

## Qualification history and current status

- **2026-10-17, initial assignment:** deciding qualification was
  **NOT_RUN — explicit initial-assignment boundary**. Later integration and
  candidate-specific qualification required explicit continuation. This remains
  the original allocation, not the current status or an instruction to repeat it.
- **2026-10-17, preservation intake:** the
  [HOLD](https://github.com/hynk-studio/augnes/pull/1476#issuecomment-6230667898)
  stopped before deciding execution because the installed recovery record could
  not establish preservation. Earlier focused evidence remained historical.
- **2026-10-17 UTC, final qualification:** the
  [source-bound handoff](https://github.com/hynk-studio/augnes/pull/1476#issuecomment-6235178561)
  records base `a4b8d8393e99b6b336ed6081faee180d77b33ea3` and head
  `c0f09ea07c39c8f36a3c11177aa3b7d98d1bc4f2`: a new Full Canonical run passed
  16/16 phases, followed by separate receipt validation with
  `valid_deciding_evidence=true`, `status=valid`, `issues=[]`. Earlier candidates,
  failures and artifacts were retained. The original intermittent
  `Invalid InterceptionId.` CDP failure remains unexplained; observability
  hardening and later passes do not establish its permanent absence.
- **2026-10-18 KST, source merge:** #1476 merged at
  `8b4dd38b895825885558d454d18323337411c67b`. The qualification above belongs to
  its exact reviewed candidate; it is not new evidence for another head.
  Installed adoption and hosted deployment were not performed. The later merged
  #1478/#1479 [collection workflow](SELECTED_SOURCE_RETRIEVAL.md#incremental-collection-and-ordinary-questions-1478)
  reuses this admission owner, with its own qualification and retain/stop decision.

No integration or deciding run remains pending merely because the initial
Draft/NOT_RUN wording survives in historical reports. A future source change
uses the then-current verification policy and its own authority; this history
does not start a runtime, installation, deployment or follow-on task.
