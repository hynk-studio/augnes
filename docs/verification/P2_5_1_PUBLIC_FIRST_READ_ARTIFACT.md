# P2.5.1 public first-read artifact and local qualification

Task: [#1276](https://github.com/hynk-studio/augnes/issues/1276), parent
[#1212](https://github.com/hynk-studio/augnes/issues/1212). Qualification date:
2026-09-18. Main was refreshed by fast-forward before source changes to
`7597ed20e41f8ca9641eb3b0e08d0612b6a0d89a`, tree
`8ec95432fee952f648c66213a9b30a29480e3522`, including merged PR #1275.

Disposition: **IMPLEMENTED_QUALIFIED_LOCAL** for the focused artifact checks
below. Repository review/merge follows the roadmap phase-state rule. This
record does not complete P2.5 or authorize public deployment.

## Current-owner audit and architecture

1. The existing non-Core adapter family is the narrowest suitable owner.
   [The private hosted adapter](../../lib/vnext/adapters/hosted-research-projection.ts)
   carries workspace/project identity, packet binding and selected excerpts;
   neither it nor its private fixture is a public artifact. A sibling
   [pure adapter](../../lib/vnext/adapters/public-first-read.ts) admits only a
   closed fictional-case DTO. No retained-work exporter or project reader is
   connected to it.
2. The installed Next.js 16.2.4 App Router supports ordinary `Response` bodies
   and static route generation. The new
   [route](../../app/public-cases/[artifact]/route.ts) uses `force-static`,
   `generateStaticParams` and `dynamicParams = false` for exactly three artifact
   names. Build output confirms all three bodies are prerendered. It bypasses
   page hydration and the application layout; HTML contains no script, fetched
   asset, form or client data fetch. Existing recovery-mode proxy behavior stays
   intact; ordinary mode was qualified. Title, description and viewport metadata
   use the same content, with no invented public canonical URL or SEO subsystem.
   See the [Next route reference](https://nextjs.org/docs/app/api-reference/file-conventions/route).
3. Existing canonical JSON, strict timestamp, public-path and privacy-guard
   utilities are reused. There is no shared HTML/Markdown serializer suitable
   for this DTO; small literal-text renderers escape markup and build links
   solely from validated source slugs. No Markdown/HTML input is interpreted.
4. No new database, schema migration, semantic record, approval system or
   runtime owner is needed. Source, review labels, accepted state and authority
   remain distinct under the existing architecture/protocol owner.
5. One [committed fictional case](../../fixtures/public-first-read-tool-library.v0.1.json)
   supplies every representation. The adapter adds fixed public boundary and
   state-definition text, visible in all three. The JSON DTO is constructed
   field by field, not serialized from a private record and then redacted.

## Case and paths

The fictional tool-library note asks whether staggered pickup windows could
reduce an opening queue. Four findings distinguish nominal capacity, an opening
backlog bound, an untested intervention and a rejected inference from quiet late
arrivals. Three original fictional source documents are included in full, with
ordinary same-document source links. They are explicitly invented, not external
studies, private selected excerpts or observations from a real organization.

Review states are exactly `confirmed`, `unconfirmed`, `rejected`. They are
authored classifications, never inferred from citations. The unconfirmed claim
has three references; removing references does not change a claim's state.
Unknown waiting times, service variability and access outcomes remain explicit.
The fixed reviewed-at time is `2026-09-18T00:00:00.000Z`; schema is
`augnes.public-first-read.v0.1`.

Locally qualified path shapes, with no public-reachability claim:

- HTML: `/public-cases/fictional-tool-library-pickup-queue`
- Markdown: `/public-cases/fictional-tool-library-pickup-queue.md`
- JSON: `/public-cases/fictional-tool-library-pickup-queue.json`

## Privacy and local evidence

`node --import tsx scripts/test-public-first-read.ts` passed under Node 24.18.0
and npm 11.16.0; it is also registered in the existing Canonical unit suite.

- Every JSON semantic value is recoverable from HTML body text and standalone
  Markdown: title, question, summary, reviewed-at, all four claims and their
  states/review notes, every source/reference, unknowns, format and boundary.
  Per-claim source links resolve to the corresponding embedded source material.
  No richer JSON-only or Markdown-only meaning is present.
- Cloned content and reversed input object-key order produce identical outputs.
  The bodies have no acquired clock, randomness or generated metadata. Ordinary
  HTTP transport headers are outside the deterministic artifact bytes.
- 77 malformed/private/over-budget candidates fail closed with the same bounded
  error. Coverage includes extra fields at root/claim/source levels, wrong
  types/prototypes/accessors, invalid time/state/reference, duplicates, count
  limits, per-field limits, combined UTF-8 budget, paths, credentials and account
  identifiers. Literal hostile markup is escaped in both readable formats.
- The DTO caps JSON at 16,000 UTF-8 bytes, eight claims, six sources, eight
  unknowns and 2,000 characters per prose field; titles/identifiers are smaller.
  Source URLs cannot carry private query parameters: references are generated
  same-document anchors, not input URLs.
- A closed transitive import-graph check permits only this route, fixture,
  adapter and existing pure utilities. External imports are only `node:crypto`
  and `node:path`: no filesystem reader, persistence/session owner, environment
  loader, transport, provider or model. The route ignores query, cookies,
  authorization and body; only its exact artifact-name map is selectable.
- Publication safety comes from the single committed fictional input and absence
  of a private-data path. Lexical guards do not claim to identify arbitrary
  private prose. Replacing the fixture with retained material would require a
  separate privacy/publication authorization; this is not a publish-project API.

`npm run typecheck` and `npm run build` passed. The build used the repository's
isolated DB/cleanup owner, left its injected default DB guard unchanged and
restored Companion maintenance to live/exact. The existing Turbopack NFT warning
traces through the selected-session-digest route and `next.config.ts`; it did
not prevent build success and was not broadened into this change.

`node --import tsx scripts/test-public-first-read-http.mjs` then passed against
a disposable copy of that actual production build. No browser JavaScript was
executed: Node read the actual HTTP response bodies. All three responses matched
both the qualified renderer bytes and Next's generated `.body` files. Repeated
reads with disposable cookie/auth/query inputs were identical.

| Accounting boundary | Observed result |
| --- | --- |
| Artifact HTTP requests | Eight loopback requests: six repeated representation reads, one ignored POST, one subsequent HTML read |
| External/provider/model attempts | Zero under the existing network guard in the test and Next server; source references need no fetch |
| Disposable production-schema DB and runtime/session guard | Zero changed bytes and zero changed table record counts across the requests |
| Setup | Existing migrations plus one fictional private sentinel row, temporary runtime guard and build copy, all before the read baseline |
| Retained data | No retained DB/project/history/session opened or published by the artifact path |
| Cleanup | Zero remaining owned processes; temporary application, database and runtime root removed |

Next 16.2.4 serves the existing prerendered body for POST on this static route
with status 200. An initial exploratory assertion expecting 405 failed, with
complete cleanup. The corrected qualification asserts the actual invariant:
submitted bytes are ignored, the returned and subsequently read artifact is
unchanged, and no state is written. There is no body parser, upload endpoint or
mutation handler. This observation is not claimed as method-level rejection.

Actual HTTP body SHA-256 values:

- HTML: `020f5fa96751d910eae641cbb93f5b19ba08bac0207759a3d5e1a36e4df818e6`
- Markdown: `9002182e7a0b712abd1b74b47fa7fd0ceee995c6b25e5493167ca178aba1fe61`
- JSON: `bc161448d077e19d3efdfb3360916d640834b5a7882012f60e472bd8ae4025a9`

## Deciding verification and deferred work

The final clean head must use the exact-base/head Canonical planner and the
selected executor scope without narrowing it for a static feature. The Draft PR
records that head/tree, selected plan, final local receipt, receipt validation
and cleanup separately from these focused observations. No failed exact-head
deciding run may be retried for a pass. A receipt is local review evidence,
not hosted CI, independent attestation, publication or merge authority.

P2.5.2 remains separately authorized work: any approved public deployment,
stable public URL/readback, public no-JS/Markdown/JSON retrieval, exact deployed
byte privacy audit, search/indexing/ranking/discovery observation and independent
readership/utility/selection evaluation. None occurred here. Connector/global
registration is unchanged; #1273 is not resumed, and its evaluation cases are
not used. No anonymous upload, model inference or retained-data publication is
introduced. P2.5 and parent #1212 remain incomplete.
