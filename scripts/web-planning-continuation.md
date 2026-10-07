# Development-only Web Planning continuation

D1 selection from main `b73e5012c699f85a9e3b643b6cba82f8f195d3ce`.
No experimental tree is an executable dependency.

| Capability/source | Disposition | Dependencies | Checks |
|---|---|---|---|
| Opened Saved-context note/ref/attribution/file extraction; C1 `f5282c9c` | Integrate only parameterized extraction and field diagnostics | Main `page.ts` rendering contract | Collapsed/expanded, escaping/whitespace, missing/swapped fields |
| Stable checkpoint and external assessment binding; C1 | Integrate parameterized contract | Main `contract.ts` canonical/hash; `files.ts` export validator | Two work/revision/input identities, stale/tampered/mismatched bundles |
| Authentication, reconstruction, save, history, files/export | Reuse existing main | Synthetic `web-planning-local-runtime.mjs`, normal product routes | One seed/read/save smoke, exact history and downloaded bytes |
| Existing private Web Planning CDP adapter | Reuse verbatim through one shared module | Node WebSocket, existing Chromium | Adapter source equality, bounded owning runner; same Browser validator import |
| Child/resource/browser cleanup | Reuse existing main owners unchanged | Canonical runner/resources; test-harness process lifecycle | Incomplete cleanup refuses complete checkpoint; non-overwrite; owned disposal |
| Qualified Python solver already on main | Reuse existing; no new calculations | None added | Source diff remains empty |
| A/B/C1 exports, failures, inventories, Git payloads | Retain only at immutable experimental commits | Reference links only | Candidate import closure; no archive copy |

Source attribution: main's `scripts/browser-validate-web-planning.mjs` supplies
its existing CDP implementation, lifted verbatim so the validator and this helper
share one adapter. Its browser/process lifecycle behavior is unchanged. The new
helper composes the existing ownership APIs rather than adding a process owner.
C1's pure extraction functions are selectively adapted from
`f5282c9ca41fcdaa88d5feccd30133ae0967fc47:scripts/executable-reuse/cloud-reuse-pilot-01/c1-judgment.mjs`.

## Runnable development composition

Use Node with the root's prepared, locked dependencies (`tsx`, `esbuild`) and
the isolated `apps/web_planning` dependencies (Miniflare, Drizzle and Wrangler).
Chrome/Chromium must be installed; the existing main fixture supplies the
synthetic scope. Nothing installs dependencies or launches a production store.
Every operation uses a new owned disposable synthetic Worker/store and ordinary
local login/reconstruction routes. Read returns only after owned cleanup; save
reconstructs the same declared input into a different empty fixture, rechecks
the checkpoint and saves one successor. It never writes to an existing store.

```sh
node --import tsx scripts/web-planning-continuation.mjs read read-spec.json
# Author an assessment after read has returned, then explicitly invoke save:
node --import tsx scripts/web-planning-continuation.mjs save save-spec.json
```

`read-spec.json` has exactly `input_export`, `bundle`, `expected`. Paths resolve
relative to that spec file. `save-spec.json` adds `assessment_file`. `expected`
has exactly `work_id`, `revision`, `fingerprint`, `bytes`, `digest`, where bytes
and SHA-256 digest describe the actual input-export file, and work/revision/
fingerprint describe its head. Only existing `web_planning_export.v0.3` with the
fixture's unchanged scope is admitted. The bundle must be a regular directory;
each operation and checkpoint refuse overwriting earlier output.

The externally authored assessment JSON has:

```json
{
  "format": "web_planning_development_assessment.v1",
  "input": {"work_id": "<declared UUID>", "revision": 2,
    "fingerprint": "sha256:<head hex>", "bytes": 123,
    "digest": "sha256:<input-file hex>"},
  "checkpoint_hash": "sha256:<returned binding hex>",
  "bundle_id": "<returned checkpoint bundle_id>",
  "conclusion": "insufficient-context",
  "reasons": ["Caller-authored reason"],
  "recovered_refs": ["sha256:<source ref observed in checkpoint>"],
  "authored_at": "<ISO timestamp after checkpoint observation>",
  "attribution": {"author": "Caller"},
  "exposure_limits": {"synthetic": true}
}
```

Validation treats `reuse`, `non-use` and `insufficient-context` neutrally.
Timestamps and hashes bind declared data; they do not attest to a model read or
reasoning. Neither input attachments nor the assessment are executed. Read
keeps authenticated structured history and authenticated DOM provenance
separate. Field presence/byte/digest diagnostics are written before rejection.
Save preserves prior definitions, notes, relations, selected files, history and
original bodies, and verifies exact assessment bytes through the authenticated
product request owner. Exports use the authenticated export JSON response,
serialized once to the retained file; this is not an OS download-manager test.

Browser sandboxing is the default. The existing narrowly authorized
`--allow-unsandboxed-synthetic-pilot` flag adds only the browser's `--no-sandbox`
for owned synthetic loopback fixtures. Actual commands still need supported
execution permissions where applicable. No prior permission grant is assumed.
There is no Linux `/proc` requirement; cleanup proves owned exit/stream closure,
Worker disposal, closed debug listener and resource removal. It makes no claim
about arbitrary unregistered descendants.

```sh
node --import tsx scripts/test-web-planning-continuation.mjs NEW_FOCUSED_OUTPUT
node --import tsx scripts/smoke-web-planning-continuation.mjs NEW_CAMPAIGN_BUNDLE
```

The smoke supplies explicitly synthetic test data after a separate read has
completed. It is not a fresh B3/C1 judgment. The current D1 record is retained
once in `web-planning-continuation-evidence/d1-01`; later runs must use new paths.

## Immutable experimental record and later Mac handoff

- [A/#1413 retained source and evidence](https://github.com/hynk-studio/augnes/tree/d3f9f0d538078b33c7db892666d50755a71337bf/scripts/executable-reuse/cloud-reuse-pilot-01)
- [B/#1414 retained comparison and partial-B limits](https://github.com/hynk-studio/augnes/tree/4a1d2137d126247645f8598df842d9b5e2bbc61b/scripts/executable-reuse/cloud-reuse-pilot-01)
- [C1/#1415 completed continuation and archive](https://github.com/hynk-studio/augnes/tree/f5282c9ca41fcdaa88d5feccd30133ae0967fc47/scripts/executable-reuse/cloud-reuse-pilot-01)

The historical inline-marker failures, permission diagnostics, scripted-B3
boundary and execution-versus-retention identities remain in those archives.
They are not replaced by D1's observations or copied into this candidate.

Mac deciding verification is **NOT RUN; integration pending**. A director must
select the later exact-head window. Before that run, verify current main and
candidate ancestry, acquire the existing checkout/runtime ownership, prepare
locked dependencies and browser prerequisites, run the real exact-base/head
planner, then its selected canonical checks and these focused/synthetic smoke
commands on fresh output paths with default browser sandboxing. Retain the
actual cleanup and exact-head receipt under the unchanged policy. Cloud
feedback grants no current-main reservation, integration approval or Mac PASS.

## D1 observed Cloud result

64 focused controls passed for two synthetic identities (revision 1 and 2),
including the positive and refusal cases above. One smoke campaign passed
without a helper correction or second campaign. It used two ordinary seed
saves, two normal reconstructions and one assessment successor save (revision
3), with no unknown-outcome resolution. The assessment was 987 bytes, digest
`sha256:180b35a9ddc7a72be0972fc367708890b13fbbdaebc6deaf82458330cf0ef65b`;
the complete successor export was 15,320 bytes, digest
`sha256:32fd6b836b645287778dc487ce47ce02ec93c227bcb351d419d5497fbdf3d0ed`.
All four owned fixtures disposed their Worker, observed browser exit and stream
closure, closed their debug listener and removed their canonical temporary root.

The adapter equality check and transitive source/dependency audit passed. The
audit's initial esbuild invocation selected CJS and rejected top-level await;
explicit ESM matched the actual loader and passed, with no candidate source
change. This setup failure is retained in `dependency-closure.json`. Runtime
imports resolve from 20 main/candidate repository inputs plus the unchanged
declared prepared dependencies. No historical helper is imported at runtime.

Active implementation/validation lasted 623 seconds (10m 23s); cleanup and
retention are separately recorded in `summary.json` and the fixture reports.
Two actual command profiles used supported permissions, with no denial, no user
clarification question and no provider expenditure. Manual approval clicks are
not observable. These observations show this composition's synthetic behavior;
they do not establish measured efficiency gains or transfer old pilot PASS.
