# P2.4 bounded private hosted workbench closeout

Disposition: **completed_bounded** for the merged P2.4.1–P2.4.3 implementation.
This documentation/evidence review belongs to
[#1268](https://github.com/hynk-studio/augnes/issues/1268); its
[clarification](https://github.com/hynk-studio/augnes/issues/1268#issuecomment-5709867310)
requires all nine areas below. It reconciles the hosted exit criterion in
[P2 #1212](https://github.com/hynk-studio/augnes/issues/1212), not the entire P2
phase. This record's own review/merge lifecycle follows the
[roadmap rule](../vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md#phase-state-rule).

Reviewed remote main on 2026-09-17:
`0a5928e27a0564d4da692de3bbe0a1628ca27cc6`, tree
`071bb7ab1389efe4eb087ccee78f830bcab3c237`. All three implementation merges are
ancestors of that main: [#1260](https://github.com/hynk-studio/augnes/pull/1260),
[#1264](https://github.com/hynk-studio/augnes/pull/1264) and
[#1267](https://github.com/hynk-studio/augnes/pull/1267). Current route, UI,
producer and types agree with the recorded boundaries. Earlier slice records'
inactive-export and pending-closeout statements describe their historical scope.

## Completed scope

P2.4 is complete within the scope of an owner-only private hosted reading/draft
workbench over an explicitly exported, bounded, non-authoritative current-work
projection, with truthful currentness and authority limitations and no sync,
write-back or canonical import. Local Augnes retains canonical ownership; the
qualified consumer is Augnes Research Workbench v0 Version 2. Completion covers
the recorded fictional/disposable producer, import, rendering, draft round-trip,
explicit Browser download and reload chain. It does not establish retained
real-work usefulness, shared editing or general Sites/platform support.

## Qualified consumer identity

These are the published observations recorded by P2.4.2 and reconfirmed during
P2.4.3 compatibility, not a new Site inspection or deployment in this closeout.

| Field | Qualified observation |
| --- | --- |
| Consumer | Augnes Research Workbench v0 |
| Site | `appgprj_6aa987f3cda08191a794adaeb6e019ec` |
| Version | 2: `appgprj_6aa987f3cda08191a794adaeb6e019ec~appgver_e900ffd58e988191b5985e2686a771ff` |
| Source / tree | `c4ad01b20ae7f48a51677c3e6c5737e4023c6cf6` / `33326e62716702b3b3a799580133c642918fa3eb` |
| Deployment | `appgdep_6aab579964ac8191a2fa88fe45131ce4`, publish/succeeded |
| Audience | Owner-only `custom`, policy revision 1; one owner, no editors, groups or external visitors |

## Nine-area closeout matrix

| Area | Evidence and bounded conclusion | Limitation |
| --- | --- | --- |
| 1. Hosted feasibility / supported consumer | [P2.4.2 qualification](P2_4_2_PRIVATE_SITE_IMPORTER_QUALIFICATION.md#qualification-evidence) exercised static preview and the exact published Version 2 in the signed-in Chrome environment. Published observations: 29 GETs for same-Site static delivery and the extension cursor image; no fetch/XHR, locator fetch, failed request or app exception; empty warning/error console observations and zero browser storage/service-worker counts. | This one consumer/account/browser/version was qualified. No generic Sites capability, platform-internal storage/network audit, uptime or other-account support is established. |
| 2. Approved data / egress | [Producer contract](P2_4_1_HOSTED_SNAPSHOT_PROJECTION_CONTRACT.md) and [local export](P2_4_3_EXPLICIT_LOCAL_HOSTED_EXPORT.md#source-audit-and-capture-boundary): local canonical/current-work owners → non-authoritative v0.2 projection → explicit user-triggered local JSON file → manual private Workbench transient import/draft. The ordinary control is **Export hosted snapshot (.json)**. | Qualification used the committed fictional fixture and disposable production-shaped work only. No retained user material was transferred; no automatic upload or hosted canonical ownership. |
| 3. Audience | [Exact qualification identity](P2_4_2_PRIVATE_SITE_IMPORTER_QUALIFICATION.md#exact-baseline-and-qualified-version) and [unchanged compatibility](P2_4_3_EXPLICIT_LOCAL_HOSTED_EXPORT.md#unchanged-private-consumer-compatibility) record owner-only custom access without additional viewers/editors/groups/public access. | No multi-user collaboration, private-team sharing or shared editing claim. |
| 4. Cost / runtime | [Consumer storage/runtime observations](P2_4_2_PRIVATE_SITE_IMPORTER_QUALIFICATION.md#qualification-evidence) and [export accounting](P2_4_3_EXPLICIT_LOCAL_HOSTED_EXPORT.md#write-accounting-scope-and-next-step) establish no added Workbench server-side or local-export model/provider inference, new API-key use, or new cloud DB/relay/storage service. The pre-existing Site secret remained unused and untouched. | Subscription, Sites/hosting, human management and total operational costs were not independently quantified; they remain unmeasured, not zero. |
| 5. Offline / currentness / staleness | [Capture/refusal owner](P2_4_3_EXPLICIT_LOCAL_HOSTED_EXPORT.md#source-audit-and-capture-boundary) obtains one coherent local read and refuses stale displayed project/selection/packet bindings and mismatched lineage. [Consumer rendering](P2_4_2_PRIVATE_SITE_IMPORTER_QUALIFICATION.md#qualification-evidence) distinguishes `locally_current_packet` at capture from hosted `local_augnes_currentness: not_verified`; null observation and unknown source currentness survive. | No continuous freshness or sync after export, including while local Augnes is unavailable. Cold offline loading/PWA operation was not qualified. `unresolved: []` with `not_included` means omitted work, not zero unresolved work. |
| 6. Export / reload / bounded reconstruction | [Browser evidence and compatibility](P2_4_3_EXPLICIT_LOCAL_HOSTED_EXPORT.md): current local read → unchanged producer → explicit JSON download → unchanged qualified importer → render/draft → reload restores the bundled synthetic v0.1 sample. [P2.4.2 round-trip](P2_4_2_PRIVATE_SITE_IMPORTER_QUALIFICATION.md#qualification-evidence) preserves the v0.2 snapshot and draft notes/comparison through explicit JSON export/re-import. | Reconstruction means the bounded hosted reading view, never canonical Augnes state. Drafts are transient; reload discards imports/notes. A manually retained file is the explicit round-trip mechanism. |
| 7. Code rollback / data recovery | [Version history](P2_4_2_PRIVATE_SITE_IMPORTER_QUALIFICATION.md#exact-baseline-and-qualified-version) is separate from the [producer's portable/recovery boundary](P2_4_1_HOSTED_SNAPSHOT_PROJECTION_CONTRACT.md#existing-owners-and-boundary). `canonical_import_supported` remains false; `augnes.portable-project.v1` remains the distinct portability/recovery contract. | This projection is neither a backup nor a recovery package. Reverting Site/app code does not recover local canonical data. No additional rollback or canonical recovery exercise was performed here. |
| 8. Authority | [V0.2 contract](../../types/vnext/hosted-research-projection.ts), [literal consumer rendering](P2_4_2_PRIVATE_SITE_IMPORTER_QUALIFICATION.md#qualification-evidence) and [write accounting](P2_4_3_EXPLICIT_LOCAL_HOSTED_EXPORT.md#write-accounting-scope-and-next-step) preserve non-authority: no semantic acceptance, ReviewDecision, Transition, execution permission, hosted canonical state, sync or write-back. Source text stays literal/untrusted; review labels remain context. | Fingerprints establish projection self-consistency, not authenticated origin. Export/refusal create zero product/canonical/session-row writes; prior access issuance and SQLite/HTTP housekeeping are separate. |
| 9. Verification / evidence state | [P2.4.1 producer tests](P2_4_1_HOSTED_SNAPSHOT_PROJECTION_CONTRACT.md#synthetic-cross-system-fixture-and-verification), [P2.4.2 private qualification](P2_4_2_PRIVATE_SITE_IMPORTER_QUALIFICATION.md#qualification-evidence), [P2.4.3 Browser/compatibility](P2_4_3_EXPLICIT_LOCAL_HOSTED_EXPORT.md#focused-evidence), and the three merged PR verification records establish separate layers. P2.4.3's preserved failure and authorized fresh pass are recorded below. | Historical receipts bind their original exact heads/environments. They are inputs to this review, not deciding evidence for its new documentation head or independent/hosted attestation. |

## Contract and evidence distinctions

The committed fictional fixture still has file SHA-256
`03d96fbfe4c2291658f6aeec4030ed84128d719d114c81509f9b32d6a3359821` and declared
projection fingerprint
`sha256:97aed29f24743940969a59063ca99e8bd9344f44687994698ef52d3be4d70edd`.
P2.4.3 separately qualified the actual disposable Browser download against the
unchanged Version 2 importer; its file/content identities are in that record.
File hashes and canonical projection fingerprints are distinct measurements.

The [#1263 byte-budget clarification](https://github.com/hynk-studio/augnes/issues/1263#issuecomment-5707483269)
keeps the 12,000 canonical UTF-8 byte limit with local
`normalizeSelectedWorkSources` over pre-projection entries. Lossy v0.2 does not
permit reconstruction of that measurement. The hosted importer enforces eight
sources, 2,000 Unicode code points per excerpt, observable metadata/work bounds
and its existing 200,000-byte raw import cap; it adds no witness or projected-byte
proxy. Distinct synthetic-only v0.1 and local-export-shaped v0.2 admission remain.

Repository verification is separate from consumer qualification:

- [#1260](https://github.com/hynk-studio/augnes/pull/1260) records the integrated
  producer head's Full Canonical pass, fingerprint
  `c1df361d7057723d46b6c8c9dab3ea8bfbc3d28707554af7364511ce8c445073`.
- [#1264](https://github.com/hynk-studio/augnes/pull/1264) records its two-file
  documentation-only pass, fingerprint
  `032f6f9e605c9a45376c2cff86c14ae91f212bea223bf395cab63c455c08b71e`.
- [#1267](https://github.com/hynk-studio/augnes/pull/1267) records both attempts
  for base `96e971000fbe257da5dec7afe4ed0882fe89b6ac`, head
  `4ccdc5e2bca0b1019fbf2dff084143779645cc39`, tree
  `071bb7ab1389efe4eb087ccee78f830bcab3c237`. Its merged main has the same tree;
  merge identity does not create a new merge-head verification result.

The first P2.4.3 Full Canonical attempt failed in the unchanged Companion fixture
because the active Node distribution lacked sibling `include/node/node_api.h`.
Receipt
`.augnes-local-verification/receipts/2026-09-17T04-21-01-760Z-changed-4ccdc5e2bca0.json`,
fingerprint `b4391c2715428245ffb488e60ee44568c0c641101d778ee6a4ee365990b75116`,
remains failed/non-deciding. No source, test or policy change avoided that failure.

The [#1266 clarification](https://github.com/hynk-studio/augnes/issues/1266#issuecomment-5708618541)
separately authorized the official full Node v24.18.0 macOS arm64 distribution
with bundled npm 11.16.0. Its archive hash/layout and exact compile-only header
probe passed before one fresh Full Canonical attempt. All 15 selected phases
passed, including cleanup and prior Companion restoration. Receipt
`.augnes-local-verification/receipts/2026-09-17T04-50-55-310Z-changed-4ccdc5e2bca0.json`,
fingerprint `23bdc94595d17dd4e2b6e109c2495a06b997993812e1f51ca1ed1c1684694104`,
validated `valid_deciding_evidence=true`, `issues=[]` on that exact head. No
earlier phase credit was reused; the first failure was preserved unchanged.
Local receipt integrity is not independent or hosted attestation.

This closeout's new documentation head receives its own current planner-selected
run and validated receipt in its Draft PR. Historical campaigns and Site checks
are not rerun or promoted to that head.

## Residuals and sequencing

Retained real-work usefulness, reduced operator burden and superiority over good
manual notes/handoff remain unproven. Any retained-work walkthrough requires
separate explicit data/egress authorization; it is not a missing transport or
compatibility criterion for this bounded completion. Other residuals are
multi-user collaboration/shared editing, automatic upload, sync/write-back,
hosted canonical state, continuous freshness, arbitrary providers/clients,
authenticity/signing, platform-internal guarantees and measured operating cost.
None was implemented or evaluated in this closeout.

P2 parent #1212 and coordination #1209 remain open; P2 overall is incomplete.
P2.3 remains the separate Next feasibility/interface candidate. P2.5 remains
Later public-first-read/discovery work. No retained-work walkthrough, product
change, Site access/mutation, secret/model/provider action or later step was
performed for this documentation review.
