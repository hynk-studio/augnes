# Hypotheses, executable models and shared caching

Contained research implementation for [#1428](https://github.com/hynk-studio/augnes/issues/1428)
under the [local assignment](https://github.com/hynk-studio/augnes/issues/1428#issuecomment-6075185110)
and [#1426](https://github.com/hynk-studio/augnes/issues/1426).
No production consumer, Core record, service, provider call or permanent registry
is added. Results are derived research material, without execution or semantic
authority. Development worktrees do not become the installed or Canonical host.

## Question and source gap

A diagnoses observed anomalies and prepares an executable adapter plus retained
explanations. B has a different deliverable: process a predeclared eight-job
batch, write all results and choose reuse or recomputation. B is neither another
diagnosis nor a new wording of A. Both remain constructed tasks in one small
domain; this does not establish independent real-world demand or general transfer.

The existing [conditional-procedure study](../conditional-procedure-learning/method.ts)
provided the useful patterns of evidence-linked versions, retained uncertainty,
an adaptive memo, fixed observation opportunities and honest exposure. Its
[native worker](../conditional-procedure-learning/native-turn.ts) is explicitly
read-only and returns diagnosis text; it cannot author this executable adapter or
deliver B result files. Strategy-composition types describe candidate relations,
not execution of a shared cache. Extending either would add unrelated runtime
coupling. This implementation uses Node's standard library and reuses the
repository's [temporary-resource cleanup owner](../canonical-test-environment.mjs)
in its tests. It does not change those historical studies or copy paper code.

## Frozen task and operations

`fixtures.json` declares A, B, literal independently calculated reference answers,
toolchain factors, action prices, observation order and resource ceilings before
either scripted A artifact runs. The simulator computes raw sums with factors
v1=1 and v2=2; the worker projects a sum or mean. Cache keys are caller-selected.
Reuse returns the stored value without guaranteeing applicability. Inspection
exposes every current cache entry, its producer input/version, all executions
and all telemetry deliveries. Each arm has an independent identical environment;
jobs within an arm share its cache.

| A observation | Distinction and scripted response |
| --- | --- |
| Symptom | Mean 4 disagrees with required 6. Retain arithmetic/stale-input alternatives provisionally. |
| Fresh | One isolated execution produces raw 12 from [4,8]. Correct the worker's division by length+1 to length. |
| Grouping | Isolated operations give 6 and 12, but coarse reuse gives 5 and 6. Match full values and toolchain; retain the operations. |
| History | Both dashboards say idle/one slot. Exposed prior producers differ; the same next coarse reuse yields 5 versus 12. Full inspection/history is available to both arms. |
| Delivery | Two identical deliveries describe one execution producing 8. Deduplicate counting; retain the causal model/cache. |

An observation is never deleted when an explanation is rejected. A revisions
contain original received observations, notes, unresolved questions, exact code,
parent hash, source-manifest hash and separate causal/telemetry function hashes.
The checker replays frozen probes against each archived adapter to show when
mistakes persist. Those verification probes are not new experience fed to A.

B reference outputs, in b1–b8 order: **12, 6, 12, 48, 24, 15, 5, 5**.
The batch changes toolchain, aliases input names, uses both sums and means, and
returns to an old still-valid input. The optimum for these declared operations
is three computes, five reuses and eight inspections. A reset can remove an
entry that would have been useful later.

Prices are **simulated units**: inspect=1, compute=10, reuse=1, reset=3, refuse=0.
They are developer choices, not measured latency or money. Seed creation is
reported separately: seven A executions and two initial B executions per path.
The checker reports both recomputation when a matching entry was still present
and excess computation relative to the independent whole-batch lower bound.
Cost comparisons are invalid for incomplete/incorrect batches.

## Run and inspect actual files

Use Node 24.18.0 from the repository-supported toolchain. No npm installation,
Companion, server, database or model credential is needed for these commands.
From the checkout root, select a **new** absolute output directory:

```sh
node scripts/hypothesis-cache-study/study.mjs prepare /absolute/task-owned/study
node scripts/hypothesis-cache-study/study.mjs scripted /absolute/task-owned/study
node scripts/hypothesis-cache-study/check.mjs /absolute/task-owned/study candidate
node scripts/hypothesis-cache-study/check.mjs /absolute/task-owned/study reference
node scripts/test-hypothesis-cache-study.mjs
node scripts/test-local-canonical-verification-contract.mjs
```

The parent directory must exist. `prepare` refuses an existing study directory.
`run` refuses an existing B attempt, including a failed attempt. Deliberate
development iterations use new directories and retain prior failure reports;
this is not permission to rerun an unchanged deciding evaluation.

Inspect `manifest.json`, `observations.json`, `preparation.json`, each arm's
`revisions/0.json` through `5.json`, and `B/results/b1.json` through `b8.json`.
`B/ledger.json` preserves actual actions, cache/execution provenance and complete
normal inspections. `B/receipt.json` binds code, lineage and output hashes, costs,
measured batch time and evidence kind. This research receipt is **not a Local
Canonical receipt**. `B/check.json` records independent arithmetic and ledger
checks. `controls/{unchanged,reset,refuse}/` contains actual control results and
ledgers. Raw outputs stay local; no generated evidence needs committing.

The checker does not score agreement with the other arm. It recomputes the
reference arithmetic separately and replays the action ledger without calling
the simulator. Hashes detect changes relative to the frozen manifest; they are
not signatures or independent attestation. The checker and fixtures share a
developer, which limits independence. Tests additionally corrupt output files,
producer versions, costs, history and result lineage to exercise refusal.

## Reusable candidate and strong memo path

For actual supported local Codex work, run `prepare` once, then give each worker
its arm's `TASK.md`. Use the ordinary filesystem interface; no new agent
controller or automated campaign is required. The normal sequence is:

```sh
node scripts/hypothesis-cache-study/study.mjs packet /absolute/task-owned/study candidate
# Worker edits only candidate/working/adapter.cjs and candidate/working/notes.json.
node scripts/hypothesis-cache-study/study.mjs record /absolute/task-owned/study candidate
# Repeat packet/edit/record for all five observations, then:
node scripts/hypothesis-cache-study/study.mjs run /absolute/task-owned/study candidate
node scripts/hypothesis-cache-study/check.mjs /absolute/task-owned/study candidate
```

Substitute `reference` for the strong adaptive-memo path. Both have identical
source access, starting code, observations/order, operations, inputs/history,
16 KiB adapter and note limits, and a 500 ms limit per adapter call. Both may
invent hypotheses, revise notes/code and construct equivalent methods. The
candidate instruction asks to retain provisional hypotheses alongside code;
the reference asks for the strongest free-form adaptive memo. Neither limits
the reference to fixed notes or an inferior executable. Extra note fields are
free in both arms; only provenance and public-rationale fields are required.

The adapter is ordinary pure CommonJS JavaScript exporting `plan(job, view)`,
`project(job, raw)` and `countExecutions(deliveries)`. A plan returns `compute`
with a key, `reuse` with an entry ID, `reset-compute` with a key, or `refuse` with
a reason. Each call gets a fresh JSON copy of public state, with no host APIs,
imports, asynchronous work or external effects. B follows the declared job
order, with one plan and one projection per completed job. Worker code can
change grouping, applicability and transformation. It cannot change simulator
truth, reference answers, another arm, or archived versions within this task's
rules. Node VM provides a timeout, **not a hostile-code security boundary**;
use only trusted local worker-authored code. No extra sandbox claim is made.

The CLI delivers cumulative observation prefixes and archives what was supplied.
This exposed development pack also makes all fixture/oracle/scripted bytes
inspectable equally. It does not prove which files a worker read or enforce a
blind temporal information boundary. Record any additional reads/assistance.

## Observed development behavior and limits

The scripted paths both pass all eight outputs with three computations, five
reuses, 43 simulated units and no unnecessary causal revision on duplicate
delivery. They receive identical developer-supplied fixes and finish with the
same executable. Their equality does **not** compare two autonomous learners.
Reset-all gives correct outputs with eight computations/eight resets and 112
units, including five excess computations. Refuse-all does not complete B.
Unchanged code retains wrong transformations and unsafe reuse.

The implementation's focused tests pass, including bounded timeout/failure
retention and complete owned-temp cleanup. One development test initially
expected the low-level JSON helper to reject a non-finite value; that assertion
failed. The corrected test exercises the batch's existing finite-result refusal.
This was a test correction, not a hidden successful retry of a deciding target.

`preparation.json`, `scripted-accounting.json`, per-arm receipts and check files
separate measured elapsed milliseconds from simulated work. Record artifact
sizes and all A code/note revisions as preparation overhead. No new model/API
calls occur inside the fixture runner. The implementing Codex session supplied
cases, expected answers, hypotheses, solutions and corrections; its model usage,
development time, user effort and billing are unmeasured, not zero. Tests use
temporary owned directories and start no processes/services. User-requested
output directories are retained as deliverables; remove only those exact paths
after review. Crash/power-loss recovery and hostile-worker isolation are NOT_RUN.

**Live model comparison, autonomous discovery, learned improvement, comparative
usefulness and TNDP-style active observation selection: NOT_RUN.**

## Later fixed comparison and next decision

Before any separately authorized fixed worker comparison, pin and record:

- Exact source/fixture/oracle hashes, constructed case origins, independent B
  allocation and any new cases. Seal B answers before A; never choose B after
  seeing a successful artifact. This exposed pack cannot become blind merely
  by using a new session.
- The same actual model/version, configuration/reasoning settings, supported
  worker interface, permitted source/observation/history access and authority
  for both arms. These identities are currently unselected, not presumed.
- Equal relevant total resources: worker turns/tokens/time, code/note budgets,
  all preparation, verification, corrections and recovery. A possible bounded
  protocol is five fixed A observation turns and one B delivery turn per arm;
  concrete time/token ceilings require declaration before execution.
- The permitted update rule: either arm may revise its own notes and code after
  each fixed observation, with no other-arm/evaluator feedback. Preserve every
  version and failed output. Keep the same observation schedule initially.
- Scoring: correct completed outputs, unsafe reuse, stale assumptions,
  unnecessary revision, resets/recomputation, artifact preparation and measured
  worker/human burden. Always-refuse fails; correct but expensive completion
  remains visible. Equal results and higher candidate overhead are valid.
- Stop after the declared allocation, with no favorable replacement runs.
  Invalid/failed outputs remain data; resource, source or cleanup failure stops
  dependent work. Publish no success claim for unrun slots.

Retain this small executable comparison path and **narrow the next question to
whether live workers gain anything over the adaptive memo**. Current evidence
supports mechanics and distinct B correctness, with no candidate advantage.
Do not expand to a world-model service or active observation selector. If an
equally resourced fixed comparison remains equal or costlier, prefer the simpler
adaptive memo plus code.

## Repository verification

The focused test is registered once in the existing bounded `unit` suite, with
a 10-second natural-exit ceiling and filesystem/immutable-fixture requirements;
the existing static contract checks that registration. No dependency or planner
policy is relaxed. At the final exact base/head use the actual planner and its
selected verification on the supported host. An occupied #1427 canonical lane
leaves that shared step pending/NOT_RUN while the independent implementation and
Draft PR proceed. Focused worktree checks do not substitute for that evidence.
