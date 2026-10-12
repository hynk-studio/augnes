# Is optional inspection worth the work?

## Decide whether optional inspection is worth its cost

Compare total expected work for retrying a task with and without optional inspection. You supply stationary costs and success probabilities. Mandatory verification remains part of every attempt; this calculation never authorizes skipping a required check.

Read, download and leave with a result. You need Python 3.9 or later, its standard library, and permission to execute code in your own harness. No Augnes installation, repository clone, account, project, Companion, package installation or private-work upload is required.

## Inputs and units

Supply all six CLI inputs as integers or rational fractions such as 2/5, not decimal floats. Reduced numerators and denominators must fit in 64 bits; CLI numeric components have at most 20 digits. Costs are nonnegative and use one consistent additive unit, for example seconds of serial work or cost units. Results use that same unit; they are expectations, not latency percentiles or deadlines.

--attempt: cost of each attempt. --verification: cost of mandatory verification after every attempt. --repair: cost after each failed verification, before retry. --inspection: optional cost before EVERY inspected attempt, including retries. --direct-success and --inspected-success: respective completion probabilities in [0, 1]. Inspection does not otherwise change the supplied attempt, verification or repair costs.

Probabilities and costs are stipulated assumptions, not learned rates, observed improvements or causal effects of inspection. Defaults are constructed examples, not estimates for your work. Do not choose probabilities to obtain a preferred answer.

## Applicability and when to decline

The CLI models attempt, mandatory verification, then completion or repair and retry. Optional inspection precedes each attempt. The same costs and probabilities apply on every visit; completed work has zero remaining cost. Use it only when that stationary retry model fits your question.

History-dependent or changing probabilities, one-time-only inspection, parallel scheduling, negative rewards, infinite-state models and larger numerical problems are outside this method. History dependence is a caller-side applicability judgment: the CLI receives no history-dependence flag and cannot programmatically detect it.

The lower-level expected_work callable accepts a finite stationary substochastic transition matrix with nonnegative per-visit costs and 1–8 states. Every supplied state must have a positive-probability path to completion, even if unreachable from a preferred start. The exact solver refuses invalid shapes/numbers and singular systems. This is a bounded calculator, not a numerical toolkit or an execution sandbox.

## Download and check before execution

Method workflow-cost 1.0.0; content identity sha256:88706b91f4889b4e62a1a42b217be9c79ad61292bb31197f0677c7a21507b8d2. Download manifest.json and all four files it lists into a new directory. Keep workflow_cost.py and exact_linear.py together under those exact names. README.md is the equivalent readable entry; index.html requires no JavaScript.

Start at this entry URL, follow its manifest link, check the method/version/content identity, then verify every listed byte count and SHA-256 digest before running anything. Missing, tampered or mixed-version files mean stop and obtain a consistent release. Never fill a gap with a local checkout copy or an unrelated installed module. Preserve the manifest and input values with your result.

The manifest binds both code files and both readable forms. Its publication digest covers the manifest without that digest field; the content identity hashes the exact JSON release descriptor (two-space indentation and one trailing newline). No manifest includes its own bytes as a member. Hashes establish consistency, not publisher authentication or permission to execute. Obtain the entry from a source you trust.

## Run in your own harness

After integrity checks, run this command from the download directory. Only Python standard-library modules and the downloaded exact_linear.py are needed. -E ignores Python environment overrides, -s excludes user site packages, and -B prevents bytecode files; these flags do not sandbox the process.

```sh
python3 -E -s -B workflow_cost.py --attempt 10 --verification 2 --repair 4 --direct-success 2/5 --inspection 1 --inspected-success 4/5
```

## Interpret the result and choose the next action

JSON stdout retains the inputs, exact rational expected_work values, inspection_minus_direct, and comparison. This constructed example returns direct 36, inspected 69/4, difference -75/4, and inspection_reduces_work. Under these assumptions, inspection is the lower-work option. With --inspection 20 instead, inspected work is 41, the difference is 5, and inspection_adds_work: decline optional inspection under those inputs. Keep mandatory verification in either case.

A valid zero success probability reports non_completing, a null expected_work and not_comparable (exit 0). Decline a finite completion-cost comparison; even a zero-cost closed loop is non-completing. Invalid inputs, such as --repair -1 or --direct-success 2, exit 2 with an error instead of a result. Non-completion is not successful completion of the workflow.

An independent renewal calculation for p > 0 is (attempt + verification + inspection + (1-p)*repair)/p, with inspection = 0 for the direct workflow. It is a strong simple alternative for this CLI domain. The package is not evidence of superiority over direct reasoning, independent demand, autonomous learning or actual savings.

## Callable and source history

An independently authorized Python harness can import compare_workflows or expected_work from workflow_cost after the same checks, using integers or fractions.Fraction rather than floats. workflow_cost imports exact_linear.solve_exact; neither file needs Augnes runtime code or the original private research script.

The two exact source files are pinned in hynk-studio/augnes at repository revision ab4d2bdb86c8284d7d7843f7fafa189c8ca9cca1, with source paths and hashes in the manifest. The bounded callable and independent renewal/property tests were introduced in PR #1376 for Issue #1375; exact_linear retains the qualified elimination segment from #1366. This publication reuses that implementation unchanged. It does not republish private research files or reinterpret the separate fictional public case as evidence.

Qualification covers developer-authored, exposed correctness cases. Local HTTP download and execution prove functional delivery only, not live public deployment, another operating system, independent customer use or general capability growth.

## Optional: retain your observation in existing work

In an already-authorized Augnes task, use the loaded augnes_resume_repository and augnes_read_repository_work_sources tools, then augnes_preview_repository_work_revision and augnes_save_repository_work_revision with the same request and returned preview binding. Fresh Resume/source readback uses the new binding. Retain method/version/content identity, inputs and observed output as imported_unverified; label applicability or non-use judgments derived_interpretation. Preserve unmentioned notes and complete attribution within the existing limits (2,000 Unicode code points per note, eight notes, 32,000 native packaged bytes). Read back an uncertain save before another decision. This optional path grants no managed execution or semantic acceptance. Public reading never creates or selects work.

## Release files

- [Download manifest](manifest.json)

- [Readable Markdown](README.md)

- [Python CLI](workflow_cost.py)

- [Required Python dependency](exact_linear.py)
