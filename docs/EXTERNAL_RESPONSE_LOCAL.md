# Scoped external experience and local response continuity (#1453)

The supported entry is the Operator MCP tool `augnes_external_repository_work`.
It uses the verified Companion and the authenticated foreground route
`POST /api/augnes/external-response?scope=repository:local`. Start with `read`
and your registered `repository_root`. Responses distinguish `available`,
`saved`, `exact_replay`, `refused` and `unavailable`; retain the reason and
persistence field. There is no background dispatch or model invocation.

This source increment connects deliberate workspace sharing to actual local
requests, returned bytes, checking, output use and successor reconstruction.
It does not activate the installed Companion, Events, public distribution or a
provider. Existing direct work, executable reuse and bounded review remain valid.

## Reused and added responsibilities

| Responsibility | Owner |
|---|---|
| Project identity, physical root, current purpose and sources | Existing native project registry, ordinary source/preview/save tools and `readReviewMaterial` |
| Foreground host discovery and authentication | Existing verified Companion proxy, runtime identity and loopback channel |
| Selected cross-project experience and correction | New immutable adapter journal plus explicit, withdrawable workspace share edges |
| Exact complete bytes and integrity | New project-scoped material owner; immutable manifests and bounded transactional BLOBs |
| Permitted destination and aggregate work | Operator-owned private configuration plus durable envelope consumption; neither journal nor copied config metadata grants authority |
| Request/reply and receipt query | Explicit local HTTP adapter; task-owned deterministic processor with a unique live incarnation |
| Independent check and downstream output | Ordinary consumer; the example uses a separate decimal BigInt oracle then calculates from returned totals |
| Interruption and recovery | Journal reads and same-request receipt query; existing staged backup/restore, with restored envelopes suspended |

The earlier selected-note execution-choice profile preserves one choice and
assessment. Bounded review preserves review text. Neither is repurposed into a
file transport or a general commitment store. The additive owner exists for
this concrete consumer, not a new Core kind or universal actor registry.

## Operator setup and access

Use a task-owned local runtime with its existing database, listener, process and
lease owners. Ordinary database reads never migrate. The supervisor explicitly
passes `AUGNES_EXTERNAL_CONFIG_FILE` to its UI process; recovery removes it.
The existing `augnes_resume_repository` response supplies each project's
`repository_resolution.project_key`. Register/define the two projects through
normal project and initial-work entries before configuring this adapter.

An operator creates a private **absolute**, regular, single-link, same-user
0600 JSON file. Do not put it in a repository or send its contents to a model.
Its shape is:

```text
{
  version: "augnes.external-response.v1",
  projects: [{ repository_root, project_key, share_to: [target_project_key] }],
  envelopes: [{
    id, project_keys: [permitted_project_key],
    endpoint: "http://127.0.0.1:<owned-port>", instance,
    secret: <fresh 32-byte base64url synthetic bearer>, expires_at: <UTC ISO>,
    max_calls: 64, max_amendments: 2, max_input_bytes: 1048576,
    timeout_ms: 1000, input_sha256: [<explicitly permitted content SHA-256>]
  }]
}
```

This is a shape description, not literal JSON containing usable credentials.
Create the secret in the owning process with `randomBytes(32).toString('base64url')`;
never print it. `createLocalProcessor` in
[`scripts/external-response-counterpart.mjs`](../scripts/external-response-counterpart.mjs)
is the supported owned example adapter. It returns `server`, a newly generated
`instance`, `setConditions` and a non-secret receipt/effect `snapshot`. The caller
owns a loopback-only listener, finite lifetime and `closeTrackedServer` settlement.
Use its returned instance and actual bound port in the private envelope. Its
state accepts JSON/JSONL, a finite row bound and an accepting/not-accepting flag;
`setConditions` changes that real controlled state. It is a deterministic service,
not an independently reasoning or negotiating agent. It retains at most 64
receipts for its lifetime; restarting creates a different incarnation and cannot
resolve the old incarnation's unknown effects as absent.

The configuration authorizes only enumerated roots and keys, explicit share
pairs, the `aggregate` operation, one exact local destination/incarnation and
listed input content hashes. The example uses a ten-minute lifetime. Each HTTP
attempt, including a query, consumes one call before egress; sends also consume
input bytes. The limits apply across projects using that workspace/envelope.
The adapter accepts at most 64 calls, three amendments per work, one MiB sent,
ten seconds per call, 64 KiB per complete material and eight MiB of workspace
material. Work has at most 64 journal events; workspace history has 2,048 records.
An exhausted limit refuses further work. Withdrawal remains possible at the
history limit. A changed binding never resets an existing envelope's counters.
A new grant is an explicit operator decision, not something identity correction
or a tool argument can mint.

The current file is checked at discovery, reads, writes and effect boundaries.
Withdrawing a share denies new metadata/byte reads. It cannot recall bytes already
copied into another legitimate scope. Removing configuration or a project denies
new access; removing or changing an envelope blocks effects. Recovery suspends
restored envelopes even if an old configuration file remains. Re-enabling an old
journal grant is unsupported; preserve reconciliation obligations and obtain a
separate operator decision, never edit counters or deserialize ownership tokens.

## Ordinary workflow

All calls take `repository_root`, `action`, and optionally `data` and
`expected_material_ref`. Read first and use the returned current `material_basis`
for mutations; wrong/stale work does not silently rebase. References are complete
`sha256:<64 hex>` strings. Operation keys are caller-chosen, bounded idempotency
keys. Preserve them for retry. Stream operations also require the last observed
`expected_head` so concurrent changes refuse without partial material publication.

| Action | `data` and result |
|---|---|
| `read` | Empty for current native purpose/sources, own locators, unfinished work and safe envelope/budget projection; `{work_ref}` for original terms, all events, available corrections, unresolved effects and currently meaningful next action |
| `put_material` | `{metadata, base64}` with exact full bytes. Metadata: `name`, `media_type`, `version`, `source`, `applicability`, `dependencies`, `sha256`, `size`. Returns immutable `material_ref` |
| `publish` | `{key,title,source_refs,conditions,association,assessment,materials,targets}`; select current disclosed source bindings and own material refs. Association separately records `endpoint`, `account`, `operator`, `confidence`. No grant travels with the observation |
| `discover` | `{query}` matches only currently readable selected experience. No hidden source titles/snippets are projected |
| `read_experience` | `{ref}` reads currently permitted experience/correction. Original source/time/conditions and association uncertainty remain visible; `affected_work` lists direct dependent work in this authorized project |
| `material` | `{ref}` for own declared material; `{ref,experience_ref}` for selected shared material. Success returns metadata and complete base64 bytes; a locator alone is not successful delivery |
| `withdraw` | `{ref,target_key}` permanently withdraws that share edge; repeat is exact replay. New publication is needed for a later deliberate share |
| `prepare` | `{key,purpose,experience_refs,envelope_id,input_ref,terms,expectation,reconsider_when,owners}`. Owners separately name `receive`, `check`, `use`. Terms are `{operation:"aggregate",format:"json" or "jsonl",population:"success" or "all",deadline,max_rows}`. `experience_refs` contains experience records only; corrections are read separately. Creates an initial attempt, no dispatch |
| `act` | `{key,work_ref,expected_head,mode:"send" or "reconcile"}`. Reserves a sent/query record and budget, then makes one actual call. Repeat the exact key/head/mode to read the committed result without repeating the effect |
| `amend` | `{key,work_ref,expected_head,proposal_ref,input_ref,terms}` after actual format feedback. May only select a proposed supported format and permitted bytes within the original population/deadline/row terms and amendment bound. Prepared amended terms are not counterpart acceptance |
| `check` | `{key,work_ref,expected_head,response_ref,material_ref,checker,verdict:"pass" or "fail",checks,limitations}`. Read/check actual bytes first. This is attributable consumer evidence, not an automatic correctness oracle |
| `use` | `{key,work_ref,expected_head,check_ref,output_ref,description}` after a current passing check. The actual output manifest must depend on the checked material. The journal attributes a consumer declaration; inspect output bytes to establish actual use |
| `correct` | `{key,target_ref,topic,statement,source_refs,targets}` adds a sourced correction to the producer's experience without rewriting it |
| `reconsider` | `{key,work_ref,expected_head,dependency_binding,decision:"retain" or "stop",reason}` records current applicability. Inaccessible dependencies cannot be declared unchanged. A late result or changed work basis needs deliberate review before check/use |
| `close` | `{key,work_ref,expected_head,reason}` records logical closure, retaining unresolved effects. It does not cancel external work, withdraw credentials or create semantic acceptance |

`read`, `discover`, `read_experience`, `material`, `withdraw`, `act` and `close`
do not require `expected_material_ref`; their own current access, work, envelope
and concurrency checks still apply. All other actions require it. Read-only access
is transactional but does not mutate. Native note hashes, review seals, grants
and supported earlier paths keep their original meaning.

Keep prepared, sent, accepted terms, returned, independently checked, used and
closed facts separate. The receipt query can report exact returned material,
accepted-but-unfinished, unknown, or authoritative absence for the same live
incarnation. Never repeat a possibly effective request before reconciliation.
Only confirmed absence allows deliberate retransmission of that same request
identity with a new local effect key. A failure after commit reports uncertainty;
read current work and use exact replay/query, rather than guessing absence.
Complete response bytes and their journal attribution commit together. Failed
response writes or competing heads leave the original sent record unresolved,
with no orphaned published material. Late bytes keep their original identity.

A readable correction in `prepare.experience_refs` is invalid input. Missing,
wrong-workspace, withheld and withdrawn references keep the same access refusal;
record kind is checked only after access. Refusal commits no work, attempt,
envelope row/counter or operation key, so a corrected request may use its unused
key. Empty lists, duplicate refusal and exact/conflicting replay retain their
existing behavior. Use `read_experience` and explicit `reconsider` for corrections;
the correction does not share its target. Existing invalid historical state is
refused by recovery, never silently rewritten by this admission correction.

## Report example, fresh process and evidence

A's release dashboard requests **successful** build worker time. B's capacity
report needs **all attempts**, including failures. They are distinct purposes,
inputs and projects. A publishes its checked observation and output deliberately
to B. B discovers it through the ordinary entry, reads the shared bytes, retains
uncertain operator association and checks its own conditions. The example reads a
condition summary `{schema:"build-events.v1",formats:["json"],population:"success"}`
from the selected observation, matches the exact observed service incarnation to
a currently permitted envelope and chooses its initial format from that summary.
B retains its own `all` population. Ambiguous work or input versions refuse.
When the processor
has changed from JSON to JSONL, its actual proposal causes B to re-encode the
same event population and send a second, bounded request. The unchanged JSON
control retains its initial action and completes with one send.

[`scripts/external-response-report.mjs`](../scripts/external-response-report.mjs)
is a reusable **scripted** ordinary consumer. A selected native note at
`note-ref:external-report-contract` supplies JSON `{population,input_name,output}`;
upload the named input through `put_material`. Run from a new writable directory
with only the project root argument and the authorized Companion discovery
environment. It does not take a case label, expected result, database path,
evaluator summary or predecessor directory. It reconstructs work, fetches bytes
from the durable owner, reconciles unknown effects, chooses from actual feedback,
checks the service arithmetic using an independent integer oracle, computes the
failed-time fraction from **returned** totals and stores/reads the actual report.
It inspects existing work before preparing a request. An unresolved effect takes
priority even when the native purpose or basis has changed; the successor first
queries its receipt, then stops for deliberate applicability review. Multiple
unresolved entries require an explicit work choice rather than another effect.
A fresh process is a reconstruction test, not an independent agent.

Run the registered integration under the repository's admitted development
resource owners and supported toolchain:

```sh
node --import tsx scripts/test-external-response.ts
```

An optional new absolute final argument exports the original synthetic report
bytes and a scoped integration record. No database, access file, bearer,
operational log or model prompt is exported. Private exact-source qualification
receipts and their separate validator result belong to the candidate's review
handoff, not this public document.

The positive B report has 7,500 total worker milliseconds, 3,250 failed worker
milliseconds and a reduced fraction 13/30. The service uses numeric aggregation;
the checker separately deduplicates and sums decimal durations with BigInt.
Report construction consumes checked returned values, and its manifest records
that exact result dependency. Failure/partial responses produce separately
attributed direct fallback, never fabricated external use. Independent evidence
still supports this report after an operator-association correction; unrelated
corrections leave the control unchanged. Withheld corrections produce an honest
inspection limitation, not a claim that nothing changed.

| #1453 criterion | Executable evidence |
|---|---|
| 1 — producers/owners/consumers | A and B native initial/source writers; explicit sharing; ordinary proxy/HTTP; actual controlled processor and report consumer |
| 2 — basis/identity/conditions/commitments | Original native packet, immutable selected experience and attempt terms, uncertain association, accepted terms and unresolved query obligations |
| 3 — feedback and unchanged control | JSON rejection/proposal → new JSONL bytes and request; unchanged JSON → one original request |
| 4 — verified material and real use | Complete byte read/hash check, independent BigInt oracle, output calculation from returned totals; truthful refusal/partial/fallback and damaged/missing material |
| 5 — fresh executor | First consumer exits after service effect/lost acknowledgement; a fresh PID and separate writable workspace acquires via ordinary entry, queries receipt and finishes without a duplicate effect |
| 6 — corrections and preservation | Relevant/irrelevant/withheld correction, withdrawal, wrong project/workspace, replay/conflict, concurrent amendments/results, stale basis/authority, deadlines, budgets, rollback, nonempty predecessor migration and suspended recovery |
| 7 — calibrated evidence and next decision | Source/mechanism and controlled behavior only; actual human/model consumption and installed/hosted adoption NOT_RUN; intervention effect/comparative usefulness NOT_EVALUATED |

The test records actual durations, calls and cleanup. These are development
burden observations, not a comparison with a direct implementation. Failed
local development attempts remain in the private review evidence.

A smallest **later, separately authorized** live exercise would give one model
consumer B's ordinary registered project entry and the selected report contract,
A's shared exact success-report bytes, and B's exact build-events input. Allow
only the existing read/discover/material/prepare/act/amend/check/use tools, one
ten-minute loopback envelope, two sends, at most two receipt queries, one format
amendment, the explicit input hashes and one report file. End its first invocation
after the first send; a second fresh invocation must read/reconcile and complete
or report a preserved unknown state. Stop on changed scope, unavailable permission,
unresolvable receipt or a limit. That would test actual consumption and successor
behavior, not comparative benefit. **Neither invocation is authorized or run by
this implementation assignment.** b02 remains CLOSED/PARTIAL and e01 remains
CLOSED/NO_OBSERVED_ADVANTAGE; their allowances and non-adopted instructions are
not used here.

## Selective correction in a later reporting task (P3.1 / P5.2)

[`external-response-selective-report.mjs`](../scripts/external-response-selective-report.mjs)
is a deterministic ordinary consumer for one declared A → B → C case, with
independent invoice D. The earlier report consumer stops at a required current
applicability review; it does not interpret an intermediate report's upstream
replacement or calculate a later report. Existing `discover`, `read_experience`,
`material`, `put_material` and `publish` already suffice to carry this bounded
lineage. This example adds their concrete consumption, without changing adapter
actions, persistence, direct `affected_work`, Core semantics or grants.

The producer prepares the following **content profiles through ordinary writers**.
They are selected material, not new protocol record kinds:

1. A publishes complete `build-events.v1` bytes with an explicit version, source,
   applicability period and initially empty dependencies. B reads those bytes
   through the share, retains an attributable input copy depending on A's
   material, and runs the existing report consumer. Its original returned
   aggregate, passing check and report remain immutable.
2. B publishes its input, returned aggregate and report together. Its `conditions`
   JSON is `{version:"worker-report-lineage.v1",period,population:"all",
   upstream:{experience_ref,material_ref,version,sha256},input_ref,result_ref,
   report_ref}`. References are exact; B explicitly identifies A instead of
   relying on a global dependency search. C must independently have access to A.
3. D publishes independent invoice bytes
   `{version:"reservation-invoice.v1",period,units,unit_cents}` with no declared
   dependency, and conditions `{version:"reservation-invoice.v1",material_ref,
   period}`. In this synthetic case that invoice alone is sufficient for C's
   reservation fee, not its build estimate or a general business conclusion.
4. C selects an ordinary note at `note-ref:selective-report-contract`, containing
   `{version:"selective-worker-report.v1",intermediate_query,independent_query,
   repetitions,period,output}`. Each query must resolve to one matching profile;
   the consumer does not guess the latest version. `repetitions` is 1–1000 and
   `output` is a simple lowercase JSON filename. Source period must match.

Run the consumer from a new writable directory with only the registered project
root as its argument, using the normal authorized Companion connection:

```bash
node /path/to/augnes/scripts/external-response-selective-report.mjs /registered/project
```

This command does not start a Companion. The integration test uses disposable
authenticated proxy/HTTP routes and an owned loopback processor, leaving the
installed service alone. C has no effect envelope and makes no processor call.
The test command below belongs inside an admitted checkout/resource owner:

```bash
node --import tsx scripts/test-external-response-selective.ts
```

For a correction, A publishes a new complete material and experience first, then
uses `correct` on the original experience with a current selected source and
statement JSON `{version:"worker-input-replacement.v1",previous_material_ref,
replacement_experience_ref,replacement_material_ref,replacement_version,
replacement_sha256}`. The replacement manifest depends exactly on its predecessor.
Publication of a correction grants no access to either source. The fresh C
process discovers B and D through its selected contract, obtains A from B's
declaration, reads A's current corrections and follows at most eight explicitly
linked replacements. Missing, withdrawn, ambiguous, unsupported or
inspection-limited input stops this consumer as unknown. It never crawls a
workspace, infers truth from a path, or inherits an execution envelope.

C independently checks original B against A's complete original events with the
existing decimal BigInt oracle. A relevant change creates a separately attributed
rechecked intermediate and a new actual JSON report. The report multiplies that
total by the selected repetitions and separately calculates D's reservation fee.
Only the optional top-level `annotation` is outside the event calculation;
unknown fields are refused. Equal event bytes can reuse this profile's earlier
output and attributable applicability material without repeating the sum.
Historical source/check references stay in that output; the new applicability
material separately records current input and correction references.

The consumer rechecks the bounded experience observations and native work basis
before writing. A detected change refuses the stale observation. This is a
read-time observation, **not an atomic transaction across projects**: a later
correction can require the next invocation to reconsider again. Publication and
material storage retain their existing individual transactions and exact replay;
a failure after a successful material write can leave an unadvertised immutable
material for reconciliation. A cached material name alone is insufficient for
reuse: the consumer requires the prior attributable applicability publication.
An explicit correction to that prior judgment requires review before reuse.
Without that publication, a later explicit invocation independently checks the
inputs again and can complete the same output; the failed call does not retry.
These records describe scripted checking and use, not semantic acceptance.

The frozen [arithmetic expectations](../scripts/fixtures/experience-use/selective-expectations.json)
are evaluator-only and are never supplied to the consumer. Deduplicated A/B
worker time is 7,500 ms; correcting one event from 500 to 1,500 ms gives 8,500 ms.
C's three-batch estimate changes from 22,500 to 25,500 ms. D's four reservations
at 3,000 cents remain 12,000 cents. The metadata-only replacement preserves the
corrected report's exact bytes and avoids a new aggregate calculation. Each
consumer is a new process with its own writable directory and receives no
correction locator or expected answer. Actual output files, hashes, original B
history, replay, write rollback, changed basis, version mismatch, read races and
withdrawal are inspected. The existing `test-external-response.ts` retains the
unchanged stale-reconsideration, grant, replay and staged recovery matrix.

Setup includes source registration, deliberate shares, complete material,
lineage declaration and the selected report contract. Repeated use includes
bounded discovery, complete reads, consistency checks, a prior-output lookup or
calculation, and attributable publication. These are development/setup and
repeated-use steps, not measured user savings. This exposed scripted case is
neither live-model judgment nor a new evaluation campaign; b02 PARTIAL and e01
NO_OBSERVED_ADVANTAGE retain their original scope.
