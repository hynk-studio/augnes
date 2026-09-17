# P2.4.1 hosted snapshot projection contract

Local adapter/fixture slice under [#1259](https://github.com/hynk-studio/augnes/issues/1259),
parent [#1212](https://github.com/hynk-studio/augnes/issues/1212). Review material;
this does not complete P2.4 or P2.

## Existing owners and boundary

| Concern | Reused owner / treatment |
| --- | --- |
| Current work and selected notes | `readProjectWorkInitializationV01` and its strict reader in `lib/vnext/runtime/project-work-initialization.ts`; unavailable or ambiguous history cannot produce a projection. |
| Packet validity and lineage | `inspectVNextOperatorPilotPacketLineageV01` in `operator-pilot-project-continuity.ts`; no second lineage or database reader in the adapter. |
| Active scope/revision | `readActiveProjectSelectionV01` in `project-lifecycle-registry.ts`; exact selection revision must match the initialization read. |
| Project name/identity | `ProjectIdentityV01` from the canonical project identity registry; display name is metadata, not identity. No separate work-name owner is invented. |
| Selected-source identity/bounds | `normalizeSelectedWorkSources` in `lib/intake/selected-work-source-comparison.ts`; scoped fingerprints, currentness, trust, labels and original stored text remain authoritative for this mapping. |
| Continuity/currentness | Protected `/api/vnext/operator/project-continuity` already composes continuity and initialization reads. Packet expiry is carried and checked at capture; project-wide pending-review counts are not a packet-bound unresolved list and are omitted. |
| Canonicalization | `canonicalizeProtocolValueV01` / `createProtocolSha256V01`; existing `augnes-json-c14n-v0_1`. |
| Metadata privacy | Existing public-text path guard, privacy runtime findings and public-safe locator admission; narrow credential-header markers supplement metadata refusal. Excerpts are excluded from metadata redaction. |
| Canonical portable/recovery | `lib/vnext/portability/portable-project.ts` and `types/vnext/portable-project.ts` remain unchanged. Their `augnes.portable-project.v1` reconstruction package is distinct from this lossy adapter. |

The producer accepts validated, authenticated/scoped read material and an exact
caller-supplied capture clock. The future caller must acquire these reads at one
local capture boundary (the test uses the existing database transaction owner).
The adapter checks agreement of project/work, selection revision and exact
packet ID/fingerprint/time/lineage, then returns a value. If reads disagree,
refuse and reread through those owners; do not mix packets or infer currentness
from historical recency. Matching old objects alone cannot prove a later read
is current, and this pure adapter makes no such claim.

No database/file/network access, credential acquisition, project choice,
selection revision, session mutation or model interpretation occurs in the
producer. It is neither a Core record nor a canonical import format.

## Version and projected fields

`types/vnext/hosted-research-projection.ts` defines
`augnes.hosted-research-projection.v0.2`; the producer is
`lib/vnext/adapters/hosted-research-projection.ts`.

The task-supplied qualified external consumer is Workbench Site Version 1 /
logical v0.1, whose `augnes.hosted-research-projection.v0.1` is synthetic-only.
No Site was accessed to implement this slice. Actual local work cannot truthfully
use that contract's `data_kind: synthetic`. V0.2 therefore explicitly uses
`local_augnes_explicit_export`; it does not silently broaden v0.1 or establish
that Site Version 1 can import it.

The envelope hard-codes non-authoritative projection, no live sync, hosted local
currentness `not_verified`, no semantic/execution authority and no canonical
import. It carries:

- Exact capture time; workspace/project IDs and optional owned project name.
- Current work reference, goal, criteria and non-goals in stored normalized order.
  Work references retain identity/provenance fields; provider/host fields are omitted.
- Initialization version, active selection revision/selected time, packet ID,
  fingerprint, generation/expiry time, lineage and `locally_current_packet` at capture.
- Selected excerpt identity/fingerprint, exact text, why-included review label,
  trust class, observed time or null, admitted locator or explicit omission,
  original source currentness/reference and `untrusted_source_text` boundary.
- `unresolved: []` with `unresolved_scope: not_included`, explicit limitations,
  and a canonical fingerprint over the envelope excluding `integrity`.

Packet/source fingerprints identify captured content, not ongoing hosted truth
or export authorization. The local current packet is established at capture;
after externalization its currentness is **not continuously verified**. A source
whose currentness was unknown stays unknown. Review labels are not converted to
unresolved claims, accepted state, ReviewDecisions or Transitions.

## Bounds, omission and future egress

Selected sources retain the existing limits: eight entries, 2,000 Unicode code
points per stored excerpt, 12,000 canonical UTF-8 bytes over selected entries.
Duplicates, overflow and foreign source relations refuse; no truncation or new
selection system is introduced. Existing work-definition limits also apply.
Allowlisted metadata has an additional 24,000 canonical UTF-8 byte ceiling to
bound combined work/source-reference metadata; this never increases source limits.

No local roots/absolute paths, database locations, environment values,
credentials/cookies/native-host sessions, raw logs/reasoning, unrelated or
unselected history, arbitrary ledger rows, full continuity history or project-wide
unresolved state are projected. Unknown input fields are ignored by the explicit
output allowlist. Unsafe metadata refuses; unsafe or unsupported source locators
are omitted with a status. These lexical checks are conservative, not a general
sensitive-content classifier.

Literal selected text (including markup, imperatives and text mentioning paths)
is preserved as untrusted user work material, never executed or broadly redacted.
**A future explicit user-approved export is the egress decision.** This slice has
no export button, route, user CLI, automatic file creation, upload, write-back or
sync. It does not inspect or transfer retained user material.

## Synthetic cross-system fixture and verification

`fixtures/hosted-research-projection.sample.v0.2.json` is wholly fictional. Its
local-export discriminant exercises the real adapter contract over disposable
synthetic inputs; it is not an export of a retained user project. The test creates
an in-memory database through existing migrations, registry, authenticated
initial/revision writers and strict current readers, then compares the producer's
JSON to the committed bytes. There is no production fixture-writing path.

- File: 5,938 bytes; SHA-256 `03d96fbfe4c2291658f6aeec4030ed84128d719d114c81509f9b32d6a3359821`.
- Canonical content fingerprint: `sha256:97aed29f24743940969a59063ca99e8bd9344f44687994698ef52d3be4d70edd`.
- Focused command: `node --import tsx scripts/test-hosted-research-projection.ts`;
  also registered in the existing Canonical unit owner.
- Cases cover missing/ambiguous/current/foreign/stale/mixed reads, selection drift,
  zero/eight sources, count/character/byte refusal, duplicate/foreign relations,
  literal markup, unknown time/currentness, hard-coded authority boundaries,
  metadata privacy, unchanged input/database state and portable-import refusal.
- Early focused runs exposed an expected-order mismatch against the existing
  work normalizer, an over-broad locator guard matching packet IDs, a refusal-code
  mismatch on mixed reads, and the not-yet-generated fixture. These were corrected;
  the focused fixture now passes with zero fetch calls. No deciding run was retried.

Use repository Node 24.18.0/npm 11.16.0 with `OPENAI_API_KEY` excluded. The Draft
PR records focused results and the exact clean base/head planner-selected
deciding receipt; this document does not substitute for that receipt.

## Next separately authorized step

Supply **only this committed fictional v0.2 fixture** to a Site importer
compatibility update. Preserve v0.1 synthetic-only admission, explicitly validate
v0.2 authority/currentness/bounds and literal source rendering, then privately
qualify that consumer version. Only after consumer qualification should a
separate local task expose an explicit export UI/download. Site Version 1 is
unchanged by this local PR.
