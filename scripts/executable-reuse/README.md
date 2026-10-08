# Source-derived workflow-cost calculation (#1375)

This standalone Python tool answers a small planning question: under **stipulated**
costs and success probabilities, does optional inspection reduce total expected
work in a retry/repair workflow? Mandatory verification happens on every attempt.
The calculation cannot authorize skipping any required check.

Run from the repository root with Python 3.9 or later (standard library only):

```sh
python3 -E -s -B scripts/executable-reuse/workflow_cost.py
python3 -E -s -B scripts/executable-reuse/workflow_cost.py --inspection 8 --inspected-success 3/5
python3 -E -s -B scripts/executable-reuse/workflow_cost.py --direct-success 0
python3 -E -s -B scripts/executable-reuse/test_workflow_cost.py
```

All six CLI inputs accept bounded integers or rational fractions, such as `3/4`.
`--help` lists them. JSON on stdout retains inputs, exact expected work, the
inspection-minus-direct difference and its conditional comparison. Invalid
inputs exit with code 2; a valid but non-completing workflow returns
`non_completing`, a null value and no finite comparison. It is a supported
non-use result, not successful completion of that workflow. There are no network
calls, file writes, packages to install, model calls or shared-runtime consumers.
`-B` prevents Python bytecode files. The existing Canonical unit runner includes
these tests as a 10-second bounded child with its ordinary isolation/cleanup;
Python 3 must be available on that host, and absence is a failure, not a skip.

## Public static delivery

The [project-free entry](../../publications/workflow-cost-v1/README.md) and its
[HTML form](../../publications/workflow-cost-v1/index.html) explain inputs,
conditions and non-use before source history. The checked-in publication also
contains a manifest and exact inert copies of `workflow_cost.py` and
`exact_linear.py`; these are generated output, never a second maintained solver.
An agent starts with the entry URL and retrieves all listed files into its own
fresh directory. Only Python 3.9+, HTTP reading and independently authorized
execution remain prerequisites. The optional ordinary-work recipe is separate.

Publication maintenance uses one explicit
[release allowlist](workflow-cost-release.v1.json) with fixed names, source
paths, byte counts and SHA-256 pins. It refuses source drift; do not update a
published code version in place. A reviewed code change needs a new release and
directory. Both readable forms come from one authored representation in the
[generator](../build-workflow-cost-publication.mjs); member hashes bind those
forms and code to the manifest. Digests establish consistency, not publisher
authentication. The source revision identifies the reused code, not a test of
the later publication commit.

From the repository, maintainers can check or regenerate the five shipped files:

```sh
node scripts/build-workflow-cost-publication.mjs --check
node scripts/build-workflow-cost-publication.mjs --write
node scripts/test-workflow-cost-publication.mjs
```

Copy `publications/workflow-cost-v1` as a unit to an ordinary static host; no
application route, database or Companion is involved. For a deliberately started
local preview, `python3 -m http.server 8080 --bind 127.0.0.1 --directory publications`
serves `http://127.0.0.1:8080/workflow-cost-v1/index.html`. Stop that owned preview
when finished. This instruction does not deploy the public Site or private Worker.

The focused test serves the actual shipped bytes over credential-free loopback
HTTP, starts a Python consumer with only that entry URL in a fresh non-repository
directory, and downloads every required file before execution. It checks actual
CLI/dependency paths, exact renewal results, non-completion, invalid inputs,
missing/tampered/constructed mixed-version material, unsafe names, deterministic
generation and source drift. Integrity failure prevents execution in that test
consumer; arbitrary external clients are not controlled by this publication.
These are developer-authored delivery/correctness checks, not independent demand,
comparative superiority, autonomous learning or live deployment. The separate
fictional public case retains its original schema, labels, routes and bytes.

## Source and actual consumer

The privately retained original from completed [#1366](https://github.com/hynk-studio/augnes/issues/1366)
is `analysis.py`, 12,601 bytes, SHA-256
`568f7cc4d15234dfa120496697bc804572928bdf8d6b2fa0734b3163dcdcf90d`.
Source inspection revalidated those identities without importing or executing
the research script. Its `solve` at lines 52–65 has source-segment SHA-256
`330f62e836bc0af7f9239aaec1c9107e21de3b057599b025d8262d2274994541`
(UTF-8, no trailing newline).

[`exact_linear.py`](exact_linear.py) retains that algorithm as `_solve_source`:
only the function name changed. A regression check restores that name and checks
the original segment hash. `solve_exact` and its admission/error handling are new.
[`workflow_cost.py`](workflow_cost.py) imports and actually calls `solve_exact`
on `(I-Q)v=c`; it does not import the original script or use a stored answer.
No four-state, three-action, reward-weight or discount assumptions were copied.
The original research outputs, exports and full source package remain private.

Task A computed successor features / reward-transfer values. Task B computes
undiscounted completion work for a cyclic retry workflow, with a different goal,
state graph, inputs and applicability question. The issue's B question was already
exposed. The commissioning probe ZIP was unavailable at implementation intake;
the delivered attachment contained only the handoff text. The verified original
source supported the explicitly permitted fallback. These newly authored cases
are not a reproduction of the probe's reported inputs, 14 assertions or numbers.

## Qualified domain and failures

- `solve_exact`: 1–8 square equations, matching vector, integer or `Fraction`
  elements with numerator and denominator at most 64 bits. Floats, booleans,
  empty/nonsquare systems and over-bound inputs are refused. Inputs are copied;
  the result is a tuple of exact fractions. Singular systems raise
  `SingularSystem`, including inconsistent and underdetermined systems.
- `expected_work`: a stationary finite transient-state matrix `Q` with
  nonnegative probabilities, row sums at most one, and nonnegative per-visit
  costs. Missing row mass completes the task with zero remaining cost. Every
  supplied state must have a positive-probability path to an exit. In a finite
  stationary chain this implies almost-sure completion and finite expected work.
  Even a disconnected closed class is refused because the API returns all state
  values. A zero-cost closed loop is non-completing; it is not labeled infinite
  accumulated cost.
- The CLI uses attempt → mandatory verification → completion, or repair → retry.
  Inspection, when selected, happens before **each** attempt. Its success
  probability is stipulated independently; no observed or causal improvement
  in real success rates is asserted. Variable/history-dependent probabilities,
  negative rewards, infinite-state models and larger numerical problems are
  outside this slice. The small dimension and input-bit limits bound arithmetic
  for this local consumer; this is not a numerical toolkit or service sandbox.

## Development results and feedback decision

For attempt cost 7, verification cost 2, repair cost 3 and direct success `1/2`,
the actual CLI executions produced:

| Stipulated alternative | Direct work | Inspected work | Difference |
|---|---:|---:|---:|
| Inspection 2, success `3/4` | 21 | `47/3` | `-16/3` |
| Inspection 8, success `3/5` | 21 | `91/3` | `28/3` |
| Direct success changed to 0; inspection 2, success `3/4` | non-completing | `47/3` | not comparable |

Independent renewal counting gives expected attempts `1/p` and failures
`(1-p)/p`, hence `(attempt + verification + inspection + (1-p)*repair)/p`
for `p > 0`. Ten focused tests passed, including 16 exact comparisons to this
formula, a separately derived five-state example, equation residuals, coordinate
permutation, cost scaling, pivoting, source identity and the admission/failure
boundaries. These oracles do not call the retained solver. The original
nonsquare truncation and unexplained singular failure are qualification gaps
outside A's internally constructed domain, not new findings against A's results.

**Decision: retain the elimination method; narrow its reusable domain and revise
its admission/failure behavior.** The observed calculations support this bounded
callable path. For the high-cost alternative, decline the optional inspection
under those inputs. For a non-completing workflow, decline a finite completion-cost
answer. Keep these source-bound conditions with the callable; no learned updater
or automatic selector is claimed. Next, review this qualified standalone slice;
do not expand its domain or activate it in a product without a concrete consumer.

This is developer-authored, constructed, exposed correctness evidence. ChatGPT
manually selected the original candidate/question and interpreted its probe;
Codex inspected the source, authored guards, cases and reference checks, and
retained this decision. Different formulas provide an implementation-independent
correctness check, not a blind evaluator or independent transfer/usefulness study.
The simple renewal formula itself is a strong direct alternative for the CLI
cases. That standalone qualification establishes no comparative savings,
autonomous extraction/learning, product integration, hosted delivery or automatic
future-agent discovery. Setup involved
one missing-probe lookup and direct original-source inspection; the first focused
execution passed. Total human/prior-probe preparation time is unknown. Exact-head
repository verification is reported separately in the PR; these results are not
a Canonical receipt. Historical studies, allocations and Web ownership are unchanged.
