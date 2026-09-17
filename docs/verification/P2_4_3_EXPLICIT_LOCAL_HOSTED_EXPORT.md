# P2.4.3 explicit local hosted snapshot export

Task owner: [#1266](https://github.com/hynk-studio/augnes/issues/1266).
Baseline main: `96e971000fbe257da5dec7afe4ed0882fe89b6ac`;
tree: `e32db917f636495e0e31898315f5a21d6bab984d`.
The implementation is review material until its Draft PR is reviewed and merged.
Exact-head deciding evidence belongs to that PR's Local Canonical receipt,
not the earlier #1260 or #1264 receipts.

## Source audit and capture boundary

| Responsibility | Existing owner / narrow composition |
| --- | --- |
| Normal user entry | Canonical `/` renders `BlankStateSurface`; current work is in `/workbench/semantic-review`, rendered by `SemanticReviewSurface` and `CurrentWorkDefinitionPanel`. The historical `VNextProjectContinuityCard` is not this normal current-work control. |
| Explicit action | `HostedSnapshotExport`: **Export hosted snapshot (.json)** beside the saved work definition and source notes. Nearby copy identifies selected/current context, non-authority, private Workbench compatibility and no live sync after export. |
| Local route | `POST /api/vnext/operator/project-continuity`, `action=export_hosted_snapshot`; exact request fields carry the displayed active project/selection revision and packet ID/fingerprint internally. Users enter none of these identifiers. |
| Authentication/scope | Existing loopback, same-origin POST, bounded body, enabled profile, cookie and immutable session-scope owners in `local-operator-session.ts`. No project selector supplied by the browser can retarget the authenticated scope. |
| Current reads | `readCanonicalProjectIdentityV01`, `readProjectWorkInitializationV01`, `readActiveProjectSelectionV01`, `inspectVNextOperatorPilotPacketLineageV01`. No second project/currentness reader. |
| Projection | Unchanged `buildHostedResearchProjectionV02`, types, canonicalizer and committed fictional fixture. |
| Download | Complete UTF-8 JSON plus terminal newline, `application/json; charset=utf-8`, `Content-Disposition: attachment`, fixed `augnes-hosted-research-projection.v0.2.json`, no-store headers. Browser blob/anchor mechanics follow the existing portability download pattern; portability semantics are not reused. Object URL is revoked and the temporary anchor removed. |

After the existing owner resolves immutable session scope, export authenticates
again and obtains every project/work/selection/lineage input inside one
synchronous SQLite read transaction. Capture time is acquired there. The route
compares the displayed binding with freshly acquired state; the producer checks
the readers' complete agreement and capture validity. Reads never mix database
snapshots. There is no partial reacquisition, retry-until-match, cached projection
or prior-file fallback. Currentness changes after that capture do not make the
download a live view.

No current work, malformed/ambiguous lineage, scope or selection drift, packet
drift, invalid capture time, unsafe metadata and producer-bound violations fail
closed. A refusal has a bounded JSON error and no download disposition or partial
projection. The client never creates a blob URL for a refused response.

The producer still owns eight sources, 2,000 Unicode code points per excerpt,
12,000 canonical UTF-8 bytes over **pre-projection** selected entries and its
existing metadata ceiling. The downloaded projection fingerprint is content
self-consistency, not a file-byte hash or authenticity signature. No wire-format
witness, new version, cap or canonicalization was added.

## Focused evidence

All data was disposable and production-shaped. No retained project/database was
opened as development evidence.

- `node --import tsx scripts/test-hosted-research-projection.ts`: the unchanged
  committed-fixture/fingerprint and producer bounds tests pass. Added route
  coverage proves exact direct-producer/file parity, UTF-8/newline/disposition,
  no-current-work refusal, stale project/selection/packet refusals, malformed
  packet refusal, invalid capture time, unsafe metadata, request shape,
  same-origin and authentication boundaries. Safe/omitted locators and literal
  imperative/markup source text survive. Every opened handle closes; serialized
  database contents remain identical on success and refusal.
- `npm run typecheck` and
  `node --import tsx scripts/test-vnext-decision-centered-workbench.tsx`: pass.
- `npm run test:e2e:project-experience`: pass through the existing repository
  Browser owner and disposable supervised profile. No export control exists
  before work is defined. The normal control fits 390, 768 and 1440 pixel
  widths. Page load, navigation, reads/polling and reload create no export.
  One click produces one completed local download, equal to the direct
  producer over the same unchanged database/capture inputs. Both selected
  source texts survive exactly. One object URL is created and revoked; no
  anchor or object URL remains. Reload creates no additional file or DB write.
  Console/page failures and unexpected network/request failures are zero;
  provider/external-network calls are false. Existing bounded negative probes
  retain their own verdicts. Owned runtime/process/temp cleanup completes and
  the previously live Companion is restored with the same service identity.

Early focused fixture wiring checks found missing test Host/NODE_ENV inputs;
these were corrected before the passing checks. After the passing Browser run,
a standalone typecheck encountered generated `.next/dev` route checks for
unchanged handler exports. The earlier typecheck passed; the deciding executor
owns generated-state cleanup under Companion maintenance before its checks.
These focused attempts are not deciding exact-head evidence. No verification
timeout, assertion, planner, receipt or coverage policy was weakened.

## Unchanged private consumer compatibility

The **actual disposable Browser download**, not a regenerated fixture, was
supplied through the existing Workbench local-file importer on 2026-09-17:

| Identity | Observation |
| --- | --- |
| Site | `appgprj_6aa987f3cda08191a794adaeb6e019ec` |
| Version | 2: `appgprj_6aa987f3cda08191a794adaeb6e019ec~appgver_e900ffd58e988191b5985e2686a771ff` |
| Source | `c4ad01b20ae7f48a51677c3e6c5737e4023c6cf6` |
| Publication | `appgdep_6aab579964ac8191a2fa88fe45131ce4`, publish/succeeded |
| Access | Owner-only custom, revision 1, one owner and no groups/external visitors |
| Downloaded file SHA-256 | `f4867059bc3320e68e2cb31aa96c702ebb4feb144d73da596ae088bb77725456` |
| Projection content fingerprint | `sha256:5b88bab2d72b961670929655e68ea39587d3759da9cf99b7448aeb596419de9b` |

[The existing private Workbench](https://augnes-research-workbench-v0.hynk1240.chatgpt.site)
admitted that file and displayed its exact projection fingerprint. Both sources
rendered in distinct text-only `pre` containers with zero descendants; markup
and imperative text stayed literal. Omitted locator, unknown source currentness,
locally-current-at-capture, hosted-currentness-not-verified, omitted unresolved
work and non-authority labels remained truthful. No warning/error console entry
was observed. Reload discarded the transient import and restored the bundled
synthetic v0.1 example. The temporary compatibility copy was removed.

Site inventory still contains only Versions 1 and 2. No Site source, saved
version, deployment, audience or configuration was changed. No secret was
inspected, changed or used.

## Write accounting, scope and next step

Export/refusal add **zero product/canonical or session-row writes**: no proposal,
ReviewDecision, Transition, packet, run, semantic state, execution grant, nonce
rotation, export record/history/table, sync or hosted state. Existing access
issuance before the action can create/consume authentication/session state; it
is distinct from export and is not described as a zero-write login. Existing
SQLite handle/pragma and HTTP/runtime housekeeping remain with their owners.
There is no server-side export file. The local browser file exists only after
the explicit user action.

No upload, automatic Site transfer, background export, source fetching, cloud
storage, live sync, write-back, canonical import, provider/model inference or
secret change was introduced. No real user material was published as evidence.
Code rollback and canonical database recovery remain separate from this
non-authoritative projection.

The three slices now provide contract, qualified private consumer, local explicit
download and disposable end-to-end compatibility/reload evidence for a bounded
P2.4 closeout review. Another reload test is not needed to establish this path.
Retained real-work usability and reduced operator burden are not established;
any such walkthrough requires separate explicit data/egress authorization.
P2.4, #1212 and #1209 remain open pending review. P2.3 remains separate; no next
step is executed here.
