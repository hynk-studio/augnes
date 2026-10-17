# Explicit selected-source retrieval

This #1468 increment supplies complete selected source context to a new task
through a shared zero-model reader. It is Draft implementation material;
installed adoption and deciding Canonical qualification are outside this task.

## Source owners and gap

| Stage | Owner |
| --- | --- |
| Admission | Existing native work writers and `selected-work-source-comparison.ts`: explicit selected notes and provenance |
| Persistence | Existing `external-response.ts` `put_material`, `publish`, `correct` and `external-response-store.mjs`: immutable bytes, source links, retries and history |
| Corpus | An explicitly stored immutable JSON material listing experience references and supplied context; no new table |
| Reader | New `inspect_corpus`/`retrieve_sources` on the existing private external route/tool, using existing project/share/material/dependency checks |
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
   a fresh process under the same corpus. Selecting an unrelated new experience
   or excluding one requires deliberately saving/selecting a new manifest.
   Old manifests remain historical and subject to current access.

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

Matching spans each group's title, conditions, assessment, corrections and
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

## Focused evidence

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
Retain this small reader for review; favor direct reading for tiny corpora and
defer indexing/experiments until an observed need. The
[02 contract](vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md#135-explicit-selected-source-corpus-projection-1468)
owns meaning; 03/04 retain implementation/evidence status and prior conclusions.
