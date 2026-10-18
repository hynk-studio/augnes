# Explicit selected-source retrieval

The #1468 reader supplies complete selected source context to a new task
through a shared zero-model path. As of 2026-10-18 KST, #1471's reader/use,
#1476's explicit Web-export admission and #1479's incremental collections with
optional lexical questions are merged. The
[roadmap](vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md#shared-source-grounded-retrieval--current-capability-and-conditional-direction-1468)
records their completed candidate qualification separately from source merge;
installed adoption and hosted deployment were not performed by those increments.
Retain this bounded path and stop expansion without a concrete new limitation.

## Source owners and gap

| Stage | Owner |
| --- | --- |
| Admission | Existing native work writers and `selected-work-source-comparison.ts`: explicit selected notes and provenance |
| Persistence | Existing `external-response.ts` `put_material`, `publish`, `correct` and `external-response-store.mjs`: immutable bytes, source links, retries and history |
| Corpus | An explicitly stored immutable JSON material listing experience references and supplied context; no new table |
| Reader | `inspect_corpus`/`retrieve_sources` on the existing private external route/tool, using existing project/share/material/dependency checks |
| Consumer | `scripts/selected-source-use.mjs`: shared inspection, retrieval and before-use binding check |
| Use evidence | Fresh deterministic coding/textual consumers write artifacts; generated coding output actually executes |

At base `fe2d1eb03ac19257477d083ba2219b3570e7c66e`, retained recall deliberately
stopped at the current-task chain. Reviewed-outcome reuse selected an exact
report pair. External discovery searched experience payloads and returned
locators; material reading required exact references. Those useful existing
paths did not themselves search a deliberately selected multi-work corpus's
material bytes and deliver complete correction context to a successor. The
extension leaves all their existing meanings intact.

## Ordinary workflow

Downloaded Web complete exports can enter this same reader through the explicit
[local Web-to-native handoff](WEB_EXPORT_NATIVE_HANDOFF.md). The operator selects
current-revision text and an authorized native target; the adapter validates the
original Web format and atomically creates existing materials, one experience
and a corpus. It creates no native current work or accepted state.

Use `augnes_external_repository_work` through an already authorized Companion.
No installation/start command is implied. Configuration may have `envelopes: []`;
reading requires project/share access, not a processor/model budget.

1. Select prior source notes with the existing work writer. Store selected
   artifacts using `put_material`, then `publish` each experience with its source
   bindings, conditions, materials and deliberately configured targets.
2. Store the manifest below using `put_material` in the consumer project. Pass
   its returned `material_ref` as the permitted corpus entry. Successors receive
   this entry and a task/query, not answer IDs or evaluator expectations.
3. Call `inspect_corpus` with `{corpus_ref}`. Call `retrieve_sources` with
   `{corpus_ref, query, expected_corpus_binding}` using the inspection's binding.
   Inspect `truncated`, conditions, corrections and complete source bytes.
4. Recheck the same binding before use. A refusal requires explicit fresh
   inspection; never silently retry against changed material. The caller owns
   applicability and output; retrieval grants no execution/semantic authority.
   Output may use existing material persistence with exact dependency references
   inside its existing bounds.
5. Add updates through `correct`. An acknowledged correction is discoverable in
   a fresh process under the same corpus. Adding a newly admitted experience
   can instead use the explicit collection below. Excluding a source requires
   deliberately selecting a new corpus/collection. Old selections remain
   historical and subject to current access.

Manifest JSON (references below are placeholders):

```json
{
  "version": "augnes.selected-source-corpus.v1",
  "project_key": "sha256:<consumer-project-key>",
  "groups": [{
    "experience_ref": "sha256:<selected-experience>",
    "source": {
      "identity": "source:chosen-artifact",
      "revision": "v1",
      "work": "prior-work-id",
      "session": null,
      "source_time": null,
      "event_time": null,
      "valid_from": null,
      "valid_until": null,
      "meaning": "unknown",
      "adoption": "unknown",
      "original_context": "excerpt_original_unavailable"
    }
  }]
}
```

Material metadata uses `media_type: application/json` and
`version: augnes.selected-source-corpus.v1`; existing hash/size checks bind bytes.
Source metadata is supplied attribution, not verified truth. Meaning is
`observation`, `claim`, `inference` or `unknown`; adoption is `proposed`, `adopted`
or `unknown`. `complete_selected_material` means the selected artifact is
available, not that an outside original is complete. The experience's
`created_at` is ingestion time, separate from source/event/valid times. Similarity
or recency never supersedes an original. Conditions and correction records remain
visible together; consumers must not ignore them after choosing a snippet.

## Bounds and lifecycle

| Resource | Ceiling |
| --- | --- |
| Existing material / workspace bodies | 65,536 bytes each / 8 MiB |
| Corpus | 16 unique groups; 32 material occurrences total |
| Corrections | Existing dependency owner: 32 per experience; inaccessible/overflow refuses |
| Scan | 524,288 serialized UTF-8 bytes including base64 and full records; not disk I/O/tokens |
| Query | 160 Unicode characters; 8 unique whitespace-separated literal terms; no controls |
| Output | 4 whole groups / 131,072 serialized result-array bytes; oversize groups omitted with `truncated: true` |
| Work | Up to 16 dependency reads over the existing 2,048-record workspace ceiling, plus 32 material reads; no network or indexing |

Default literal matching spans each group's title, conditions, assessment, corrections and
textual material. Locators are not searched. Ordering is stable exact identity,
not relevance optimization. Text/plain, text/markdown, text/javascript and
application/json are searched; binary bytes are delivered if another part
matches. Invalid UTF-8 in declared searchable material refuses. A bounded miss
or omission is not global absence. Missing/inaccessible selected context refuses
the whole inspection, even if the affected group would not match.

Every request reconstructs from authoritative owners; there is no index/cache
to resurrect withdrawn/deleted material. Existing share withdrawal or project
configuration removal stops new reads; earlier copies and outputs are not
recalled. Existing backup/restore retains exact material/history. The test's
disposable body-loss fault proves refusal, not a new product deletion policy.
Binding observations do not reserve permissions after delivery. Current-work
recall, withheld locators, full report groups and Resume retain their boundaries.

## Incremental collection and ordinary questions (#1478)

The demonstrated workflow is a staff-review workshop notice assembled from whole
Web-export notes. At intake main `510e6d088830af7ad1fcbc1e0a61bbbb89729c9e`, each
Web import created a new immutable corpus; a successor could not select one
collection and discover subsequently selected additions. The eight-word question
“What should visitors know about the library workshop?” also returned zero groups
under literal all-term matching, although the source described that workshop.
This justifies an explicit collection and optional lexical question interpretation,
without changing any existing corpus, material, scan, output or literal-query limit.

Use the existing importer to admit whole selected files and retain its `corpus_ref`.
Existing native `put_material`/`publish` corpora are accepted too. Select those
admitted references through `augnes_external_repository_work` or the same local
`handleExternalOperation` entry. A local runnable example follows; environment,
registered target and configured access are the existing external owner's inputs:

```sh
node --import tsx --input-type=module -e '
import { handleExternalOperation } from "./lib/vnext/external-response.ts";
const [root, corpus] = process.argv.slice(1);
const current = await handleExternalOperation({repository_root: root, action: "read"});
console.log(JSON.stringify(await handleExternalOperation({repository_root: root,
  expected_material_ref: current.material_basis, action: "collect_sources", data: {
    key: "workshop-selection-1", collection_ref: null, expected_head: null,
    name: "Workshop source folder", corpus_refs: [corpus]
  }}), null, 2));
' /absolute/registered/target 'sha256:<admitted-corpus>'
```

Retain the returned **collection_ref**. For each additional batch:

1. Admit whole selected material with its existing producer; retain its corpus ref.
2. `inspect_corpus {collection_ref}` returns `collection_name`, the current
   `collection_head` and binding.
3. Call `collect_sources` with a new operation `key`, the same collection ref/name,
   `expected_head: collection_head`, and only the newly selected `corpus_refs`.
   Supply the current native `expected_material_ref` from `read`.
4. Retain the acknowledgement. For an uncertain result, deliberately replay the
   identical request; do not replace its key or predecessor. The acknowledgement
   identifies that addition's historical head, not an implicitly current head.

One call accepts at most eight existing corpus refs. It merges whole groups into
a new immutable corpus with deduplication by experience identity. A different
source declaration for the same experience refuses. The same revision/attribution
can therefore never be silently rewritten. Exact replay retains identical evidence
and operation rows; conflicting replay or stale new writes roll back every change.
Re-selecting an already present source under a new key adds only a bounded history
entry, not duplicate evidence. The existing 64-event stream and workspace storage
bounds apply. Exhaustion refuses; there is no eviction, automatic reset or limit lift.
The collection history and snapshots use existing external records/materials;
there is no new table, index, background subscription or model dependency.

A successor receives only the authorized project/collection and its task question:

```sh
node --import tsx --input-type=module -e '
import { handleExternalOperation } from "./lib/vnext/external-response.ts";
import { retrieveCollectionForSuccessor, recheckBeforeUse } from "./scripts/selected-source-use.mjs";
const [root, collection, question] = process.argv.slice(1);
const op = (action, data) => handleExternalOperation({repository_root:root, action, data});
const found = await retrieveCollectionForSuccessor(op, collection, question);
console.log(JSON.stringify(await recheckBeforeUse(op, found, question), null, 2));
' /absolute/registered/target 'sha256:<collection-ref>' \
  'What should visitors know about the library workshop?'
```

Both reader actions accept exactly one of `corpus_ref` or `collection_ref`.
The latter explicitly selects current collection membership; immutable corpus
reads remain fixed. Collection head and live correction context participate in
the binding, so an intervening addition/correction refuses before-use rechecking.
Every read rechecks original permissions. Share withdrawal and configuration
removal still refuse, including via old collections. Recovery validates selection
history against its immutable input corpora and rebuilds the same projection.
Existing copies are not recalled. New membership grants no sharing or execution.

`retrieve_sources` defaults to the unchanged literal contract. Its optional
`query_mode: "question"` extracts Unicode letter/number words, removes a fixed
English function-word list, matches **any** remaining term, and orders by distinct
term overlap then exact identity. It reports the interpreted `query_terms`.
The same 160-character/eight-term bounds apply after interpretation; empty or
oversized term sets refuse. There are no aliases, stemming, embeddings or inferred
facts. Questions without shared vocabulary can miss; matches can be non-applicable.
Whole-group, four-result and byte bounds remain in force, with explicit omissions.
A miss is bounded, and neither ranking nor time establishes truth or supersession.

### Runnable workflow evidence and decision

Run the existing Web producer/import/use/recovery integration:

```sh
node --import tsx scripts/test-web-export-native.mjs /absolute/new/evidence-directory
node --import tsx scripts/test-selected-source-retrieval.ts
```

The first command exports `collection/summary.json`, original Web exports,
`collection-*/task.json`, `delivered.json`, `draft.txt`, and output/dependency records.
It exercises actual local Web saves/exports, native admission, a stable collection,
a relevant later revision, an explicitly selected garden addition, connected
corrections and a conflicting staff statement. Fresh consumers write a staff-review
draft quoting originals and corrections, preserve booking context, and leave the
conflict unresolved. Evaluator checks/answer locators are absent from task input.
The second integration covers shared-source/correction withdrawal and the private
HTTP reader using a collection. The existing small limits remain intentional.

The exposed development observation admitted three selected source groups. The
question delivered two relevant groups, with the garden retrievable for its own
question. Adding the garden left output bytes and used dependencies identical;
corrections changed actual output. Recovery retained the output and source bindings.
The direct read of the same permitted collection produced identical prose. This is
scripted lexical matching and quote assembly, **not observed model judgment**, a
held-out test, publishable resolution of conflicting times, or broad language use.

Preparation is three whole-file selections/imports, one collection creation and
two additions, plus explicitly authored correction statements. No per-question
manifest or fact mapping is supplied. The report records calls, delivered bytes,
storage and operation/consumer durations; human preparation time and development
model tokens are unmeasured. No source repair was needed in the successful path;
a development fixture initially used an unsupported note label and was corrected.
Retain the explicit collection capability; prefer direct reading for one-off tiny
inputs, and stop expansion here. No observed question warrants a second domain,
new index, capacity campaign, model dependency or AML participation.

## Earlier focused evidence

Under admitted resource owners and the repository toolchain:

```sh
node --import tsx scripts/test-selected-source-retrieval.ts
```

An optional new absolute directory argument exports `report.json`, frozen
expectations and each consumer's `delivered.json`, `output.json`, `audit.mjs`
or `bulletin.txt`. Disposable database/configuration and child resources use
existing bounded owners. Network is blocked; no installed Companion is started.

The coding successor generates and executes an audit from field rules. A units
correction changes the result while identity/deduplication survives. The textual
successor writes a workshop bulletin, later changing the time while retaining
booking context. An unrelated selected addition changes neither output nor used
dependencies. Outside declared applicability, the result is `unknown`. A direct
reader over the same corpus produces equal checked outputs. This is bounded
scripted use, not broad utility, reduced human burden, model judgment or an
independent held-out result.

Reports record actual setup calls, query/delivery bytes, operation/child latency,
storage and zero provider calls. Selection, typed rules, consumer construction
and expectations are developer-authored one-off costs; human time and
development-model token cost are unmeasured. Recurring reads rescan the corpus.
Retain this small reader; favor direct reading for tiny corpora and
defer indexing/experiments until an observed need. The
[02 contract](vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md#135-explicit-selected-source-corpus-projection-1468)
owns meaning; 03/04 retain implementation/evidence status and prior conclusions.
