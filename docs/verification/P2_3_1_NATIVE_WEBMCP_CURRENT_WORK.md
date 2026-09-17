# P2.3.1 native WebMCP current-work read

Task: [#1271](https://github.com/hynk-studio/augnes/issues/1271). Qualification
date: 2026-09-17. Base main `05db2b942718e85b661422342865129c99e39141`,
tree `890e03fd8875bec20c3a511ee47b4a291aa341f8`.
Source and bounded browser/client qualification succeeded; review/merge status
follows the linked Draft PR. Exact-head deciding evidence belongs to that PR's
Local Canonical receipt, separately from these focused observations.

## Support gates before implementation

The [15 September WebMCP draft](https://webmachinelearning.github.io/webmcp/),
[current Chrome API documentation](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
and [local testing instructions](https://developer.chrome.com/docs/ai/webmcp)
were checked before source edits. The native entry is `document.modelContext`;
registration ownership is an AbortSignal. No polyfill was installed.

The qualified browser was **Google Chrome 153.0.8010.47**, macOS arm64, visible
window, isolated temporary profile. Ordinary launch exposed neither document nor
navigator modelContext. Testing launch used `--enable-features=WebMCP`, the
feature mapped from the documented `chrome://flags/#enable-webmcp-testing` in
[the matching Chromium source](https://chromium.googlesource.com/chromium/src/+/refs/tags/153.0.8010.47/chrome/browser/about_flags.cc).
Launch also used a task-owned user-data-dir, loopback-only remote debugging,
no-first-run/default-browser prompts, and disabled background networking,
component updates, default apps, extensions and sync. No normal browser profile,
global flag, origin-trial account registration or permanent extension changed.

On a disposable origin-isolated localhost page, native registerTool/getTools/
executeTool succeeded and abort removed the tool. The callback received an
AbortSignal; the fixed result was delivered. Chrome 153 uses JSON-string input
and reports inputSchema as a JSON string. Current Chrome documentation identifies
the later object-input change at Chrome 155. This qualification uses the actual
153 shape. Its native annotations expose readOnlyHint and untrustedContentHint;
the newer draft's consequentialHint was not exposed. The product uses only the
two observed hints and explicitly describes non-consequential read semantics.

The [official pinned client](https://github.com/ChromeDevTools/chrome-devtools-mcp/releases/tag/chrome-devtools-mcp-v1.9.0)
was **chrome-devtools-mcp 1.9.0**, installed only in a task-owned temporary npm
prefix/cache/config. A deterministic stdio MCP client used `--browserUrl` for
that isolated browser and `--categoryExperimentalWebmcp=true`. Usage statistics,
update checks, CrUX and source maps were disabled. `list_pages`,
`list_webmcp_tools` and `execute_webmcp_tool` found and executed the disposable
tool before the implementation branch was created. No global installation,
Augnes dependency, backend registration or model call was involved.

## Owner and data boundary

`SemanticReviewSurface` displays work_initialization supplied by the existing
semantic-review read. `CurrentWorkWebMcp` owns one native registration while
authenticated exact current-work material is displayed. Its effect aborts on
binding/session replacement or unmount. Unsupported browsers render the same
UI, register nothing and make no WebMCP request.

The only tool is **augnes_get_current_work_context**, titled **Read current
Augnes work**, with `{type: "object", properties: {}, additionalProperties:
false}`. It accepts no identifiers. Invocation makes one
`GET /api/vnext/operator/project-continuity`, with same-origin credentials,
no-store, redirect refusal and the native invocation signal.

The existing route now groups authentication, continuity and initialization
reads in one SQLite read transaction. `readProjectWorkInitializationV01` still
owns active selection, unique valid packet/lineage and selected-source
admission. `normalizeSelectedWorkSources` still owns eight entries, 2,000 code
points per excerpt and the 12,000 canonical UTF-8 byte budget before projection.
The browser projector checks bounded observable shape; it is not another
currentness reader, source admission engine or authority owner.

The adapter compares workspace/project, selection revision, initialization
state/reason, packet ID/fingerprint, generation time and lineage against the
displayed registration. Changed unseen work yields
`refresh_current_work_required`; absent work, authentication failure, malformed
payload, cancellation and other read refusals remain bounded unavailable
results. No mutation or automatic refresh reconciles a mismatch.

The allowlist returns work goal/criteria/non-goals, the current binding and
selected source identity/reference, literal excerpt, label, provenance,
observation time and currentness. An omitted source observation remains unknown
and is presented as null. Source locators and unrelated route/session/root
internals are omitted. Labels are display context, not accepted state. Empty
selection describes only this packet; project-wide unresolved state is
`not_projected`. Source text is untrusted work material. Fingerprints bind content,
not future freshness or authenticity. Both authority flags are false.

Existing App/MCP `augnes_list_work_items` and `augnes_get_work_brief` remain
unchanged state-runtime compatibility reads; they do not select the active
Browser project's strict current work. PUBLIC_TOOL_NAMES, bridge enablement,
Developer Mode and global MCP configuration were untouched.

## Evidence separation

| Evidence | Observation | Limit |
| --- | --- | --- |
| Deterministic fake API | `node --import tsx scripts/test-vnext-project-work-initialization.ts --webmcp-only`: pass. Absent API/no binding, exact single descriptor, signal disposal/replacement, delayed registration, in-flight cancellation, literal/known/null sources, bounds, malformed/auth/unavailable/stale refusals and allowlist covered. | Fake registration is source test evidence only. |
| Authenticated owner | Three tool invocations use the actual GET over disposable production-shaped SQLite data; full serialized database contents, including session rows, remain identical. Full `test-vnext-project-work-initialization.ts` also passed. | Fixture creation and explicit revisions are separate setup writes. |
| Native discovery | Exactly one intended tool, correct title/description/closed schema and two supported annotations on `/workbench/semantic-review`. | Chrome 153 testing feature only. |
| Native execution | Correct displayed project and packet; exactly two selected sources; markup/imperative text remains literal, known time and null/unknown preserved, unresolved omitted. One intended GET per invocation. | Fresh matching read, no continuous freshness. |
| External discovery/invocation | Pinned 1.9.0 lists the exact page/tool and returns Completed with the same bounded result. | Deterministic orchestration, not model choice. |
| Refusal | Native and external client both return refresh_current_work_required after a separately authored disposable packet revision; refusal changes no database bytes. | No retained project was used. |
| Lifecycle | Reload, normal navigation/unload and return leave no duplicate/stale registration. A normal UI work revision in the same document replaces the binding; only the new packet is returned. | Normal ProductShell anchors perform document navigation, not SPA navigation. Unit tests separately cover the component disposer. |
| Unsupported ordinary launch | API absent; normal authenticated current-work goal still renders; source text does not execute. | Graceful degradation, not WebMCP support. |
| Runtime and cleanup | Zero unexpected external requests, page errors or failed requests. Only identified existing bootstrap 401 and favicon 404 console messages occurred. Zero owned processes/listeners; profiles, runtime state and temporary databases removed. Prior live exact-checkout Companion restored. | No arbitrary browser/client/account support claim. |

Browser qualification reused `buildOperatorExecutionBrowserFixtureV1` and
`createOperatorExecutionBrowserLifecycleV1`, the current operator Browser
fixture/auth/runtime/cleanup owners, with a task-owned visible-Chrome launcher.
No retained database was opened. Production build/typecheck and diff checks
passed. The first focused source check exposed omitted unknown observation
time; the projector was corrected before qualification. Early task-owned
Browser probe attempts exposed evidence-correlation, SPA-navigation and form
selector assumptions; these probe errors and their failed logs remain local.
They did not require product changes, timeout increases, weakened assertions,
planner/receipt changes or a deciding-run retry.

No P2.3.1 read creates product/canonical/session rows, proposals, ReviewDecisions,
Transitions, Start/Resume, execution grants, exports, uploads or source fetches.
No Site source/version/audience, secret, App tool list or provider configuration
changed. No provider/model inference was called. Local receipts are content
integrity evidence on the shared Mac, not independent hosted attestation.

**Model selection: NOT TESTED IN P2.3.1.** Correct selection/non-selection,
argument choice, result use, downstream usefulness and operator burden remain
unproven. P2.3 remains open. The smallest separately authorized next question is
P2.3.2 connected agent/model selection versus correct non-selection and result
use; no such evaluation ran. P2.4 remains completed_bounded, P2.5 Later, and
parent #1212 and coordination #1209 remain open.
