# P2.5.2 public deployment and external retrieval/discovery qualification

Owner: [#1288](https://github.com/hynk-studio/augnes/issues/1288), parent
[#1212](https://github.com/hynk-studio/augnes/issues/1212), coordination
[#1209](https://github.com/hynk-studio/augnes/issues/1209). Observed 2026-09-18 UTC.

Disposition: **DEPLOYED_QUALIFIED / DISCOVERY_NOT_YET_OBSERVED /
INDEPENDENT_UTILITY_UNESTABLISHED** within the bounded observations below.
Repository closeout remains Current pending review and merge. P2.5 overall is
incomplete. This is one phase, not separate deployment/discovery/utility issues.

## Identity and authorization

Current main was fetched and independently confirmed before implementation:
`650101e035abccdfb5e088f3495714d9b7c01d70`, tree
`0a0866265a629c2f7bf0d8639ad3298986b82e1e`, including merged PR #1287.
It remained the remote main at the final source check. Repository:
`hynk-studio/augnes`; branch `codex/1288-p2-5-2-public-qualification`.
Open/closed issue and PR searches found no equivalent active P2.5.2 owner before
#1288 was created. No new Site was created.

The user authorized publication of the existing fictional/synthetic Workbench
and exact committed fictional P2.5.1 case, after a current-source safety audit.
No retained real project, private source, local database/session, credential,
receipt, log or arbitrary upload was authorized for publication.

| Identity | Before | After |
| --- | --- | --- |
| Site | `appgprj_6aa987f3cda08191a794adaeb6e019ec`, Augnes Research Workbench v0 | Same Site, reused |
| Saved version | Version 2: `appgprj_6aa987f3cda08191a794adaeb6e019ec~appgver_e900ffd58e988191b5985e2686a771ff` | Version 3: `appgprj_6aa987f3cda08191a794adaeb6e019ec~appgver_0577e317b910819188294e38033760c3` |
| Site source commit | `c4ad01b20ae7f48a51677c3e6c5737e4023c6cf6` | `148d1e05e92fe1f6fc02c145e42782d8c8c301fa` |
| Site source tree | `33326e62716702b3b3a799580133c642918fa3eb` | `6d4539d086695f65bbf8b01167fe7c36395b59db` |
| Deployment | `appgdep_6aab579964ac8191a2fa88fe45131ce4`, publish/succeeded | `appgdep_6aad45d5ef788191a892a6d08ce9197c`, publish/succeeded at `2026-09-18T14:08:34.931392+00:00` |
| Audience | custom revision 1, exactly one owner, no groups/external visitors | public revision 2 at `2026-09-18T14:08:58.809611+00:00`; existing owner and empty group/external lists preserved |
| Environment | revision 3, one secret entry named `OPENAI_API_KEY` | revision 3 unchanged; value not inspected or printed |

Production URL: [Augnes Research Workbench v0](https://augnes-research-workbench-v0.hynk1240.chatgpt.site).
The Site connector subsequently confirmed latest version 3 and public revision 2.
Versions 1 and 2 were preserved without relabeling their historical qualification.
The prior records remain historical:
[P2.4.2](P2_4_2_PRIVATE_SITE_IMPORTER_QUALIFICATION.md),
[P2.4.3](P2_4_3_EXPLICIT_LOCAL_HOSTED_EXPORT.md), and
[P2.4 closeout](P2_4_BOUNDED_PRIVATE_HOSTED_CLOSEOUT.md).

## Current-source audit and minimum integration

The actual Site Git source was inspected at its recorded Version 2 checkpoint.
It was still a static exported Workbench: `next.config.ts` uses `output: "export"`;
`.openai/hosting.json` selects only `dist/client`, with D1 and R2 null. The source
checkpoint, version inventory, deployment, access and environment matched the
recorded qualification. Owner-only access was a historical qualification state,
not an architectural requirement for this static application.

| Public safety property | Evidence and bounded result |
| --- | --- |
| No semantic/execution authority | Existing projection admission, literal rendering, draft exports and authority banners remain unchanged; negative admission and actual rendering checks pass. |
| Imports and notes transient | `app/page.tsx` keeps snapshot/notes in React state; file input reads `File.text()` locally. No storage API, application network call, server import action or persistence owner is connected. |
| Reload returns synthetic state | Production UI loaded only the committed disposable v0.2 Observatory fixture, accepted a disposable note, then reloaded to bundled Aster with empty notes. |
| No retained project or local operator state | Only static output is packaged. No local database, session, project reader, operator/auth endpoint, tunnel, cloud database or retained-data dependency is shipped. |
| Secret non-exposure | No secret consumer exists in the application; no secret value was read. Built files, anonymous HTML/JSON/Markdown and six initial browser assets had no credential markers or private local paths. Deployed assets matched the audited files. |
| No privileged anonymous secret use | Static-only manifest/package has no Worker, server action or API handler that could consume the configured secret. Anonymous POSTs to root and case JSON returned 405. |
| No provider/model/source fetch on viewing | Source import closure has no such call; production browser observations showed static loads only, with zero requests during fixture admission/drafting. Source locators remain literal displayed text. |
| No server persistence of visitor imports | Source inspection, offline import/draft checks, zero import/draft network requests and reload behavior agree. This does not claim absence of hosting-provider access/security logs. |
| No acceptance or write-back | Public access, reading, import and notes create no canonical state, ReviewDecision, Transition, execution grant or automatic return path. |

The Site source change consists only of three static files, one root-page link,
index/follow metadata and a README provenance note. The files are the exact
outputs of the existing [pure renderer](../../lib/vnext/adapters/public-first-read.ts)
and [committed fictional fixture](../../fixtures/public-first-read-tool-library.v0.1.json)
at the Augnes main identity above. No Augnes runtime source changed. The
[local qualification](P2_5_1_PUBLIC_FIRST_READ_ARTIFACT.md) remains the semantic
owner for the artifact. Its existing local route was inspected, not deployed as
a full Augnes server.

The Site source was committed/pushed, then `git rev-parse --verify HEAD` confirmed
the full saved checkpoint. The validated package contains `.openai/hosting.json`
and static build output only: 22 files, 808960-byte tar, SHA-256
`f9465172b74f017c43bb720538550aa42c85681a6555be0a73e656b403706d20`.
The connector returned that same archive hash for Version 3. It was deployed
while owner-private; audience changed only after source/build safety checks and
successful deployment. No secret/environment value changed.

## Actual anonymous production readback

A fresh HTTP client sent no Cookie or Authorization headers. The production
origin was neither localhost, preview nor tunnel. All four GETs returned 200:

| Surface | UTC timestamp | Content type | Body result |
| --- | --- | --- | --- |
| Workbench `/` | `14:09:20.240478` | `text/html` | Synthetic Workbench, non-authority banner and public reading link; 32143 bytes |
| [HTML case](https://augnes-research-workbench-v0.hynk1240.chatgpt.site/public-cases/fictional-tool-library-pickup-queue) | `14:09:22.594261` | `text/html` | Complete meaningful reading content without executing JavaScript; 9608 bytes |
| [Markdown case](https://augnes-research-workbench-v0.hynk1240.chatgpt.site/public-cases/fictional-tool-library-pickup-queue.md) | `14:09:22.932488` | `text/markdown` | Exact local bytes, 6522 bytes |
| [JSON case](https://augnes-research-workbench-v0.hynk1240.chatgpt.site/public-cases/fictional-tool-library-pickup-queue.json) | `14:09:23.312911` | `application/json` | Exact local bytes, 5826 bytes |

Local HTML SHA-256:
`020f5fa96751d910eae641cbb93f5b19ba08bac0207759a3d5e1a36e4df818e6`.
Observed deployed HTML SHA-256:
`ea588e518488f0bb1856aa3afed062b5785769ee44028d026dcb3b12e12ad9ad`.
Markdown SHA-256:
`9002182e7a0b712abd1b74b47fa7fd0ceee995c6b25e5493167ca178aba1fe61`.
JSON SHA-256:
`bc161448d077e19d3efdfb3360916d640834b5a7882012f60e472bd8ae4025a9`.

HTML is **not byte-identical**. The host inserted one Cloudflare challenge script
referencing `/cdn-cgi/challenge-platform/scripts/jsd/main.js`. Removing only that
identified insertion yielded exactly the local 8670-byte artifact; the same
comparison passed for the Workbench HTML. No authored content changed. Transport
headers are also hosting-owned rather than the local Next route headers.
Challenge markup/parameters are not deterministic artifact semantics. This
qualification does not establish universal crawler access through hosting controls.

All four claims, `confirmed`/`unconfirmed`/`rejected` meanings, three original
fictional sources, separate review labels, explicit unknowns, non-authoritative
boundary and reviewed-at `2026-09-18T00:00:00.000Z` are preserved. No JavaScript
execution is needed to obtain them. Determinism applies to the authored content.

At `14:12:54.826777+00:00`, all six initial CSS/JS assets fetched anonymously
using the same explicit qualification User-Agent matched local build bytes and
passed credential/private-path checks. Anonymous root/case-JSON POST probes
returned 405. A preliminary asset request with the HTTP library's default
User-Agent returned 403; it is retained as a failed non-deciding probe, not
silently promoted to success. The later explicitly identified client result is
bounded to that request configuration, not proof of unrestricted bot access.

Production Chrome UI checks separately confirmed rendering, transient v0.2
import/notes, zero network requests during admission/drafting, reload reset, and
no observed console warnings/errors. That Chrome profile was already signed in;
it is not claimed as an independent anonymous browser identity. Anonymous body
and asset evidence comes from the separate credential-free HTTP client. No
fresh unauthenticated browser profile was available through the selected tool.

## One bounded discovery observation

| Surface | Query and time (UTC, 2026-09-18) | URL returned? | Prior URL knowledge and limit |
| --- | --- | --- | --- |
| Direct HTTP retrieval | Exact production URLs above, `14:09:20`–`14:09:23` | Yes, 200 | URL explicitly supplied/known; retrieval, not discovery |
| Ordinary Google web search in Chrome | `Augnes "tool library" "pickup"`, observed within `14:11:31`–`14:12:13` | No Site or case result on the returned first result page | Evaluator knew URL; query did not supply it. Existing signed-in/personalized search surface; no independent-selection claim |
| Fresh independent ChatGPT web search | Not run; no suitable fresh independent evaluator used | Unobserved | No query or result fabricated; current task already knows URL and expected answer |
| Account-specific Site visibility | Exact-ID `get_site` lookup, reconfirmed by `14:14:01` | Existing Site returned | Owner/account-specific known-ID lookup, not public discovery or a catalog-selection experiment |

Result: **DISCOVERY_NOT_YET_OBSERVED**. No indefinite indexing wait, second query
campaign, search-driven content tuning or substitute local evaluator was used.
Publishing, root-page linking, index/follow permission, crawler accessibility and
successful GETs do not establish discovery.

**INDEPENDENT_READERSHIP_UNESTABLISHED**;
**SELECTION_UNESTABLISHED**; **UTILITY_UNESTABLISHED**.
The combined reporting label is **INDEPENDENT_UTILITY_UNESTABLISHED**. No reader
encountered/used this artifact independently of the supplied URL and case in this
qualification. No utility claim follows from public availability.

## Verification, failures and cleanup

Under Node 24.18.0/npm 11.16.0, with the inherited provider key removed from test
and build environments:

- `node --import tsx scripts/test-public-first-read.ts`: PASS, three formats,
  semantic parity/determinism, 77 refusals, zero external/provider/model attempts,
  zero persistence/session imports and zero disposable-state byte changes.
- Site `npx --yes pnpm@11.25.0 install --frozen-lockfile`: PASS, lock unchanged.
- Site `npm run build`: PASS, static export; no deployed server/Worker.
- Site `node scripts/check-projection.mjs`: PASS after its required build;
  v0.1/v0.2 round trips, 46 v0.2 negative admissions, four negative drafts,
  actual bounded comparison rendering, source escaping and authority checks.
- Site `node node_modules/typescript/bin/tsc --noEmit`: PASS.
- Site `git diff --check`, static package inventory, credential-marker/private-path
  scan and expected-versus-built artifact comparisons: PASS.
- Initial `check-projection.mjs` invocation before building failed because
  `dist/client/index.html` did not exist. That preliminary invocation was not an
  exact-head deciding run. Its failure remains part of this record.
- Raw CDP `Network.enable` was unsupported. The supported request-event reader
  supplied the actual browser observations; no unsupported call is counted as
  evidence. No browser security control was disabled.
- Local Augnes `test-public-first-read-http.mjs` was inspected but not rerun:
  it requires a full local Next build, while this change deploys static renderer
  outputs in the separate existing Site. Actual production no-JS/format readback
  and the focused pure test cover this publication; local HTTP evidence from
  P2.5.1 is historical, not relabeled as a new run.

Repository deciding verification uses the current exact-base/head planner and
its selected plan under the [Local Canonical policy](../../.github/LOCAL_CANONICAL_VERIFICATION.md).
The Draft PR binds the final documentation head/tree, selected commands/results,
receipt path/fingerprint and receipt validation. This record does not substitute
for that receipt or claim independent hosted CI. Generated receipts/logs and
private deployment metadata are excluded from commits.

The Site build process exited and its temporary prerender listener was absent.
No persistent local runtime, database, tunnel or provider process was started.
Task browser imports/notes were discarded by reload. Task-owned browser tabs and temporary source/package resources were removed;
the temporary keep-awake lease was stopped. Existing user tabs and Companion
state were preserved.

## Authority and remaining claims

P2.4 remains completed_bounded; P2.5.1 remains Completed within its local bounded
scope. P2.5 and parent/coordination issues #1212/#1209 remain open. Discovery,
ranking, general agent selection, independent readership, utility, continuous
freshness and unrestricted crawler compatibility are not established.
[#1273](https://github.com/hynk-studio/augnes/issues/1273) remains open/stopped.
No R/N/STALE case or direct ChatGPT desktop Site-tool campaign was started or
consumed; post-fix direct-host evidence remains unobserved. No retained real data,
auth/session behavior, Browser acceptance, Codex runtime qualification,
WebMCP descriptor, semantic/execution authority or Augnes product runtime changed.
No repository merge, Ready transition, auto-merge or release is authorized.
