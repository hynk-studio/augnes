# P2.4.2 private Site importer qualification

External consumer outcome for [#1263](https://github.com/hynk-studio/augnes/issues/1263),
observed 2026-09-17. **Implemented and qualified** within the existing private
Workbench importer scope. This record supplies review evidence; it does not
approve the Draft PR or complete broader P2.4/P2.

## Exact baseline and qualified version

| Field | Observed value |
| --- | --- |
| Augnes repository | `hynk-studio/augnes` |
| Main at resume and repository closeout start | `02844ba620dba7a4e374ba113a1eb9c2983ead0e` |
| Main tree | `f9ca69bbb00d489e24593e3bbcc4c33460c4b6e0` |
| Existing Site | `appgprj_6aa987f3cda08191a794adaeb6e019ec` — Augnes Research Workbench v0 |
| Prior sole saved version | Version 1: `appgprj_6aa987f3cda08191a794adaeb6e019ec~appgver_e4719628cf508191a665c5429ac7a8d7` |
| Prior source checkpoint | `d623a91841c12b9ff6daafa24bf7ba48a7a31b83` |
| Qualified version | Version 2: `appgprj_6aa987f3cda08191a794adaeb6e019ec~appgver_e900ffd58e988191b5985e2686a771ff` |
| Qualified source checkpoint / tree | `c4ad01b20ae7f48a51677c3e6c5737e4023c6cf6` / `33326e62716702b3b3a799580133c642918fa3eb` |
| Deployment | `appgdep_6aab579964ac8191a2fa88fe45131ce4`, `type=publish`, `status=succeeded` |
| Access before and after | `custom`, policy revision 1; exactly one owner, no editors, groups or external visitors |
| Configuration | One pre-existing runtime secret left untouched; values never inspected or used. Environment revision remained 3. No D1/R2 or tunnel binding added. |
| Saved-version inventory after publication | Exactly Versions 1 and 2; one new version created |

The qualified deployment is the existing
[private Workbench](https://augnes-research-workbench-v0.hynk1240.chatgpt.site).
The source was inspected and updated through its supported source repository;
preview served that Site's built static assets. No substitute Site or mock was
created. The earlier blocked attempt made no Site/repository changes or new
version. The resumed baseline identity and access were unchanged.

## Contract and implementation

The controlling [byte-budget clarification](https://github.com/hynk-studio/augnes/issues/1263#issuecomment-5707483269)
keeps the local 12,000 canonical UTF-8 byte selected-entry budget with
`normalizeSelectedWorkSources` over pre-projection packet entries. Lossy v0.2
cannot reconstruct that measurement. The importer makes no such claim, changes
no v0.2 field, adds no witness, and does not reopen P2.4.1.

Only the committed [fictional fixture](../../fixtures/hosted-research-projection.sample.v0.2.json)
was used for the new local-export-shaped path. Its exact bytes were verified
before supplying them to the Site:

- File: 5,938 bytes; SHA-256 `03d96fbfe4c2291658f6aeec4030ed84128d719d114c81509f9b32d6a3359821`.
- Content fingerprint: `sha256:97aed29f24743940969a59063ca99e8bd9344f44687994698ef52d3be4d70edd`.
- All negative/boundary v0.2 inputs were deterministic in-memory mutations of
  that fixture. The existing bundled v0.1 synthetic sample supplied regression
  coverage. No retained project or production/local database was inspected.

The Site source changes are limited to:

- `lib/projection-v02.ts`: strict v0.2 projection/draft admission, observable
  bounds, locator/status and identity/reference consistency, capture-time
  consistency, and asynchronous integrity validation.
- `lib/protocol-c14n.ts`: browser port of the current Augnes canonicalizer and
  strict timestamp parser; Web Crypto SHA-256 over canonical UTF-8 material
  excluding `integrity`. Key ordering uses the producer's code-unit sort.
- `lib/projection.ts`: explicit version dispatch retaining the existing
  synthetic-only v0.1 schemas. V0.2 snapshots stay intact inside distinct
  `augnes.hosted-research-draft.v0.2` envelopes; imports never repair or truncate.
- `app/page.tsx` and `app/layout.tsx`: truthful origin/currentness/unresolved
  labels, literal source text and metadata, and the existing explicit draft
  export/re-import controls adapted for v0.2.
- `scripts/check-projection.mjs` and the byte-identical fixture copy: extend
  the existing small deterministic admission/rendering test layer.

Admission enforces eight sources, 2,000 Unicode code points per excerpt, the
existing 200,000-byte Workbench raw import cap, existing work-definition bounds,
and the producer's observable 24,000-byte metadata calculation (`project`,
`work`, `source_binding`, and source entries excluding `excerpt_text`). It does
not apply a projected-source byte proxy for the local producer budget.

The fingerprint establishes content self-consistency, not authenticity or proof
that arbitrary imported JSON came from a trusted local Augnes instance. Source
fingerprints/references and review labels remain carried context. Import grants
no authenticated/canonical local state or semantic/execution authority.

## Qualification evidence

The exact source passed `node node_modules/typescript/bin/tsc --noEmit`,
`npm run build`, and `node scripts/check-projection.mjs` before saving Version 2.
The static preview and the exact published Version 2 were then exercised in the
existing signed-in Chrome environment. Published assets included the same
`page-D5u-XoYc.js` chunk as the qualified preview. Publication was observed as
`succeeded` before the deployed checks.

| Area | Deciding observation for this consumer |
| --- | --- |
| V0.1 regression | Bundled synthetic rendering, explicit v0.1 draft re-import, and two-source comparison remained functional in preview and Version 2. A third selection stayed disabled; the existing deterministic handler guard also passed. |
| V0.2 admission | Exact committed fixture admitted in preview through the existing local-file control and in Version 2 through paste. Exactly two distinct sources rendered; no third source appeared. |
| Negative admission | 46 deterministic projection negatives and four draft negatives passed. Coverage includes schema/version, envelope/data kind, all authority/sync/currentness flags, canonical import, unresolved scope/content, required structures, times, references, duplicates, count/code-point/metadata/work bounds, and malformed/mismatched integrity. |
| Browser refusals | Eight cases repeated separately in preview and Version 2: integrity, schema, data kind, authority, hosted currentness, canonical import, source-text authority and unresolved scope. Each refused with a bounded message and preserved the prior snapshot and notes. |
| Integrity | Browser admission and exported JSON carried the exact expected content fingerprint. Offline canonicalization covered Unicode/code-unit ordering; mismatch, canonicalization and scope contradictions refused. |
| Semantic rendering | V0.1 says synthetic; v0.2 says local-export-shaped and origin not authenticated. Packet currentness at capture is distinct from hosted currentness not verified. Empty unresolved with `not_included` renders omitted work, never an assertion of no unresolved work. |
| Source rendering | Known observed time and null/unknown source remained distinct. Provenance, labels, locator/status, identity/fingerprint and currentness references survived. The imperative/markup excerpt matched literal text, with zero child elements or injected markup; source cards contained zero links. Locator omission was also tested by an in-memory mutation. |
| Round-trip | The actual JSON export fallback and re-import restored the snapshot, notes, both comparison IDs and comparison notes in preview and Version 2. Exported v0.2 snapshot JSON matched the original fixture object exactly, including all semantic fields and nulls. |
| Transient state | Notes stayed draft-only; comparison notes retained their original source binding. No acceptance, ReviewDecision, Transition or execution permission was created. |
| Refresh/reload | Preview and Version 2 discarded imported fixture and notes, returning to Aster Signal Lab, synthetic v0.1, empty draft and zero selected comparisons. |
| Network/runtime | Preview: 26 observed GETs. Published window: 29 GETs, statuses 200/304, only same-Site static delivery and the browser extension cursor image. No fetch/XHR/model/provider request, source-locator fetch, failed request or app runtime exception. Warning/error console observations were empty. |
| Storage/authority | Both origins had zero localStorage/sessionStorage entries, IndexedDB databases and service workers. Static source adds no storage, external runtime service, model call, secret consumption, sync or write-back. Explicit user-requested JSON downloads remain the existing round-trip mechanism. |

Dependency/build/preview tooling used Node 25.9.0, permitted by the existing Site
engine range, with pinned pnpm 11.25.0 and unchanged dependencies/lockfile. The
Linux-only install wrapper could not run on this Mac; normal frozen-lockfile
pnpm installation succeeded. An early TypeScript union-index diagnostic was
corrected before the passing build/checks. A browser diagnostic expression and
two archive-path inspection assumptions failed; corrected read-only diagnostics
and archive validation succeeded. These were not app failures or qualification
passes. The first archive contained macOS metadata; the final package excluded
it and matched preview assets before the sole save. No trial version was saved.

This is bounded private consumer qualification, not a retained real-project
walkthrough, provider usefulness result or runtime qualification program. Site
application source stays in the Site repository. The Augnes Draft PR separately
records its exact clean base/head, planner-selected deciding verification and
validated local receipt; Site checks and #1260 evidence do not substitute for
that new-head receipt.

## Remaining boundary and next step

Local user-facing export remains inactive: no export button/download route,
ordinary export CLI or automatic local file writer was added. No real data was
transferred. There is no live sync, write-back, hosted canonical state/import,
second authority database, semantic/execution grant, model/provider call,
runtime-secret use, Companion/native-host/worker tunneling, or access widening.
P2.4 remains open; P2.3 remains separate. #1212 and #1209 remain open.

The smallest next step requires separate authorization: activate a bounded
explicit local export path using the existing producer/current-read owners and
an explicit user egress decision. It was not executed here. #1263 remains the
owner of this consumer outcome; repository phase completion follows the
[roadmap lifecycle](../vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md#phase-state-rule).
