# P2.3.1a invocation-signal compatibility

Task: [#1274](https://github.com/hynk-studio/augnes/issues/1274). Base main:
`9b0d3f2b57fa387e6887b8e3e4f8ecc139bb12e0`, tree
`f7710946c61f5bdbe5b01c667ec41951d7cd6460`. Qualification date: 2026-09-18.

## Correction boundary

The first direct desktop attempt under
[#1273](https://github.com/hynk-studio/augnes/issues/1273) selected the current-work
tool but failed with `Cannot read properties of undefined (reading 'aborted')`.
Its correct fallback answer was not a successful Site-tool result. Diagnostics
reproduced the message with missing `options.signal`; the desktop callback
arguments themselves were not observed.

Only invocation cancellation changes. The adapter normalizes once, preserving
a genuine supplied AbortSignal by identity. Absent options or absent/undefined
signal creates a fresh non-aborted signal for that invocation. The native
AbortSignal getter checks the brand rather than trusting an `aborted` property
or a prototype impostor. Present malformed signals/options return the existing
`current_work_read_refused` result before any read.

The normalized signal is used before the GET, by fetch, after the response,
and when classifying read errors. A missing host signal means host cancellation
is unavailable; the fallback cannot recreate it. Registration still owns its
separate AbortController, including disposal and stale late-result refusal.

The name, title, description, closed input schema, annotations, authenticated
GET, projector, source admission, stale binding and authority fields are
unchanged. There is no new public status, retry, refresh, write, source fetch,
provider call, export or execution permission.

## Focused and native evidence

| Surface | Observation | Boundary |
| --- | --- | --- |
| Fake registration/authenticated owner | `node --import tsx scripts/test-vnext-project-work-initialization.ts --webmcp-only` passed under Node 24.18.0/npm 11.16.0. Eight authenticated reads preserved the serialized SQLite image, including session rows. | Real authenticated GET handler and production-shaped disposable database; fake modelContext, not native qualification. |
| Invocation variants | Valid signal identity; empty options; explicit undefined options; omitted options; undefined signal; eight malformed signal values; malformed options; single signal-property read; distinct non-aborted fallbacks passed. | Missing cancellation is tolerated, not promoted to authority. |
| Refusal/lifecycle | Already-aborted, in-flight and post-read cancellation; disposal before invocation and during fallback read; stale project/packet and replacement; authentication, invalid JSON and unrelated read errors passed. | No automatic reconciliation or retry. |
| Result boundaries | Exact work/packet, two literal sources, known/null observation time, unknown currentness, untrusted material, labels as context, unresolved not projected and both authority flags false passed. | No project-wide completeness or authenticity inference. |
| Network guard | The focused run additionally loaded the existing zero-network guard: 20 guarded entry points, zero attempts. | Handler-level test; no model/provider call. |
| Native Chrome | Chrome 153.0.8010.48 on macOS arm64, isolated visible profile, `--enable-features=WebMCP`. Native `getTools` found exactly the unchanged descriptor; `executeTool` returned the expected bound two-source result through one authenticated GET with zero database-byte changes. | Chrome native execution, not ChatGPT desktop compatibility or model selection. |
| Native lifecycle | Stale refusal, reload, same-document binding replacement, navigation/unload and return passed with one current registration and no duplicates. | Disposable setup/revision writes are separate from read accounting. |
| Ordinary Chrome | Without the WebMCP testing feature, API absent and ordinary current-work UI intact. | Graceful degradation only. |
| Cleanup | Both browser scenarios left zero owned processes/listeners, removed profiles/runtime state, and recorded zero external requests, page errors or failed requests. Existing bootstrap 401 and favicon 404 console messages were identified separately. Companion maintenance restored live/exact. | No installed Companion source/configuration change or retained-data fixture. |

Production build and its TypeScript checks passed. Native qualification reused
the existing operator Browser fixture and lifecycle owners. Exact-head deciding
verification and its local receipt are recorded in the Draft PR, separately
from these focused observations; local receipt integrity is not independent
attestation.

## Direct desktop smoke and evaluation disposition

**Direct ChatGPT desktop compatibility remains pending human-assisted smoke.**
Prepare a separate fresh disposable project/runtime from the corrected source.
After normal local-review unlock, record a database baseline before invoking
the explicitly requested `Read current Augnes work` action. Require the unchanged
descriptor, a successful bounded tool result without the former exception, and
unchanged product/canonical/session database state attributable to that read.
Authentication/bootstrap setup writes are accounted separately.

This explicit compatibility smoke is not model-selection evidence. No fixed
R1-R4, N1-N4 or STALE prompt is used. The original #1273 campaign stays stopped,
its failed R1 remains unchanged, and its frozen fixture is not modified. A later
evaluation needs separate authorization, a fresh fixture/runtime and fresh case
allocation. P2.3 remains incomplete; P2.4 remains completed_bounded; P2.5 is Later.
