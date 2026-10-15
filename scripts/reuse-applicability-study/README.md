# Executable reuse applicability, #1459

Contained, constructed research for [#1459](https://github.com/hynk-studio/augnes/issues/1459)
and [#1426](https://github.com/hynk-studio/augnes/issues/1426). The complete path is
executed calibration experience → contrasting outcomes → induced equality guards
→ counterexample revision → fresh-process service report. No Web, Core, database,
Companion, provider, installed host or historical trial is modified.

Read [the task contract](CONTRACT.md) for result identity, validity, permissible
observations, missing-information behavior and the three non-compensable conditions.
The later report requires totals/peaks, unit-normalized grouped subtotals and
budget judgments; it is different work from diagnosing the calibration derivations.
All tasks are constructed and coordinator-exposed. No blind/customer claim is made.

## What is learned

`learn.mjs` selects nearest positive/negative pairs by differences in observed
field equality, fits a minimum consistent conjunction, then replays all permitted
records and adds a counterexample if the selected subset overfits. The field
language includes irrelevant caption, whole-input, dependency-label, tool-release
and report fields. The six final guards are induced from labels and execution
records, not embedded in the learner. Versions retain selected IDs, contrast
pairs, parent hash, previous failures and public attribution.

Stage 1 distinguishes changed readings from a display-only edit. Stage 2 adds
calibration, normalization semantics, entity identity and total/peak differences.
Stage 3's unit counterexample revises the method; stage 4's changed report goal
does not. Each archived program is actually replayed into result files. Initial
unsafe choices and checker rescues remain visible: final guarded correctness
does not turn an original unsafe decision into learning success.

The reference consumes all the same records and fits ordinary memo/code without
contrast selection; it may also use the supplied learner. The deterministic
reference is an algorithmically populated adaptive memo, not a second autonomous
learner. Native method acquisition/use, when performed, is separately attributed
in the consolidated delivery and uses the actual saved worker artifacts.

`model.mjs`, filesystem operations, transformation, missing-observation routing,
result/delivery accounting and reporting are developer-supplied scaffolding.
`oracle.mjs` implements independent arithmetic and contract checks without using
the learner or candidate's planning logic. It shares authorship, so it is not an
independent organization/evaluator. The interpreter's common checks can refuse
an unsafe reuse and recompute or leave work incomplete; those interventions are
counted separately. There is no claim of learned transformation or identity logic.

## Runnable walkthrough

Use repository-supported Node 24.18.0 and a **new physical absolute directory**
whose parent already exists. On macOS resolve `/tmp` to `/private/tmp` first.
These commands need no npm installation, model credential or runtime service:

```sh
node scripts/reuse-applicability-study/study.mjs develop /absolute/evidence/development
node scripts/reuse-applicability-study/study.mjs freeze /absolute/evidence/confirmation \
  /absolute/evidence/development/candidate/program-4.json \
  /absolute/evidence/development/reference/program-4.json
node scripts/reuse-applicability-study/study.mjs confirm /absolute/evidence/confirmation candidate complete-inputs
node scripts/reuse-applicability-study/study.mjs confirm /absolute/evidence/confirmation reference complete-inputs
node scripts/reuse-applicability-study/study.mjs confirm /absolute/evidence/confirmation candidate incomplete-inputs
node scripts/reuse-applicability-study/study.mjs confirm /absolute/evidence/confirmation reference incomplete-inputs
node scripts/reuse-applicability-study/study.mjs confirm /absolute/evidence/confirmation recompute complete-inputs
node scripts/reuse-applicability-study/study.mjs confirm /absolute/evidence/confirmation refuse complete-inputs
node scripts/test-reuse-applicability-study.mjs
```

`freeze` fixes actual method bytes, complete input/evaluator inventories and rules
before observation. `confirm` refuses changed methods/materials and existing output
directories, including failures. Every command is a fresh Node process loading
method and file references. Reproduction in a new directory is development
feedback; it is not permission to replace a failed fixed study or deciding run.

Inspect `experience.json`, `candidate/version-*.json`, `reference/memo-*.md`, each
`candidate-replay-*/ledger.json`, and the final `confirmation-contract.json`.
The later outputs contain `results/*.json`, `report.json`, readable `report.md`,
the actual copied method, `ledger.json` and independent `check.json`. Ledger
entries retain original decisions, exact observation requests, common refusals,
fallbacks, result lineage and every delivery. `evaluator.json` is coordinator-only
for native later consumers; delivery packaging must exclude it. Raw inputs and
prior results/provenance remain real files, not mocked tool responses.

For a worker-authored method, the ordinary CLI is `cli.mjs learn`, `run` or `check`;
the same operations are available to either arm. `run INPUTS METHOD OUTPUT`
accepts a versioned JSON program or pure trusted CommonJS `plan(view)` code. Use
separate immutable output paths for development revisions. The module's VM is a
timeout mechanism, not hostile-worker isolation or an autonomous model client.

## Evidence and scope

The final deterministic program produces the expected 11 valid results: five
reuses and six necessary computations, with one precise unread-provenance request,
zero unsafe decisions and zero unnecessary computations. Twelve deliveries still
mean eleven completed results; equal-content distinct identities remain separate.
The report subtotals are 72, 92 and 46 mWh. The unavailable-input/provenance variant
keeps eleven of twelve obligations valid and marks the affected rollup incomplete
with unknown budget status. Always recomputing adds five unnecessary computations;
always refusing produces no completed work. These are development observations,
not a general benefit claim or substitute for the separately fixed comparison.

The source uses the existing #1428 hash/immutable-write/pure-call helpers and the
repository resource/process cleanup owners. Its old fixture, answers, scripted
repair, runs, stopped pilot and budgets are unchanged. This new namespace is
registered directly in the complete unit suite; it does **not** extend the old
audited family's narrow planner coverage. Final deciding verification must use
the unchanged exact-base/head planner and the admitted Mac context.

No deployment, installation, public release, trained model, skill bank or automatic
next topic follows from this prototype. The consolidated report owns actual
native observation, fixed comparison, exact-head qualification and next decision.
