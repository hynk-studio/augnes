# Constructed meter applicability contract, #1459

This prototype is a file computation, not an Augnes runtime capability. Calibration
derivation is the acquisition task: learn when old scalar results remain valid.
The later deliverable is a service-prioritization report: satisfy multiple current
total/peak obligations, normalize units into group subtotals, compare the declared
budgets, and expose any unfilled obligations. A saved derivation alone is not that
report. Development records and coordinator-created tasks are exposed.

`model.mjs` owns supplied transformation mechanics: run a source-bound meter tool,
multiply each signed or clamped reading by the calibration multiplier, take total
or peak, then express mWh or uWh. `meter-1.1` differs from `meter-1` only by its
comment; its normalized implementation is identical. `meter-2` clamps negatives.
Compatibility is justified by these finite, inspectable sources, not arbitrary
version labels or a learned assumption about future releases. Inputs are integer
readings (1–32 entries, absolute value at most 1,000,000), multiplier 1–100.

Raw file observations include entity, reading hash, display caption, whole-input
hash, dependency fields, version/source/normalized-tool bytes, measurement request
and report goal. These are available equally to both methods. The generic learner
compares **every** observed leaf; no hidden relevance or correct-answer feature is
given. Its bounded hypothesis language is conjunctions of equal observed fields.
That language, nearest contrasting-pair selector, repair loop and execution helper
are developer-supplied scaffolding. Selected fields are induced from executed,
labelled experience; this establishes algorithmic mechanism evidence only.

Task validity is stricter than accidental equality of numeric outputs. An old
result must have the same entity and reading sequence, calibration multiplier,
normalization semantics, requested metric and unit. Display caption, release
diagnostics and report presentation do not change that derivation. The independent
checker implements this contract and separate arithmetic. Common authorship and
the fact that this contract explains the task are explicit limitations. Neither
checker nor feedback is supplied preferentially to the candidate.

Every job is a separately required `work_id`. Its result ID binds task, work,
observed basis and actual result source. Several deliveries of that result count
once. Distinct work/result identities remain distinct when value bytes match.
Reports may say complete only after every required job has a valid result; each
rollup separately needs all of its members. An incomplete subtotal has unknown
budget status, never a guessed pass or fail.

A method is either `reuse-equalities.v1` JSON interpreted by `plan(program, view)`
or a trusted local CommonJS file exporting `plan(view)`. A view contains current
observations, prior IDs and provenance states, a work ID and permitted compute
availability. Return one of:

- `{action:'reuse', result_id}` for a specific prior result.
- `{action:'recompute', work_id}` for the current obligation.
- `{action:'observe', result_id, reference}` for an exact unread provenance file.
- `{action:'incomplete', reason}` when evidence/work cannot be obtained.

`unread` means the named file can be obtained; `unavailable` means no such provenance
file exists in this allocation. Missing input files also make computation genuinely
unavailable even when the requested input digest is known. No network lookup or
invented observation is allowed. The common interpreter supplies this protocol;
learning selects applicability conditions. The engine records every original
decision before common-checker refusals and recompute/incomplete fallbacks. A
rescued unsafe decision is an unsafe decision. Observe requests have a finite
one-per-prior ceiling, CommonJS calls a 200 ms ceiling and 32 KiB code ceiling.
The VM timeout is not a hostile-code security boundary.

The ordinary reference may inspect exactly the same raw experience, source and
checks, author/revise ordinary memo and code, or use the generic learner. It is
not restricted to static prose. Separate acquisition, actual later use, guarded
correctness and comparative usefulness. Retain earlier versions and failures.

Before fixed confirmation, bind method bytes and task/material hashes, equal
resource ceilings, permitted updates and stopping rules. Run each allocation once;
no edits or replacement runs after seeing its outcome. Report original decisions,
refusals, valid work, reuse, necessary/unnecessary computation, observation requests,
versions, measured acquisition/use time, recovery and human assistance. Unmeasured
model/coordinator cost is unknown. Identical correct actions favor the simpler
reference; one constructed comparison cannot show general superiority.
