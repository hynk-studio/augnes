---
name: stationary-retry-work
description: Calculate expected total work for repeated attempts with fixed supplied probabilities and costs, or compare optional inspection before every retry. Supports a finite stationary process with at most eight states. Use for an expected-work question, not parallel scheduling, deadline guarantees, learning success rates, or one-time inspection.
---

Use the existing workflow-cost 1.0.0 public asset when its assumptions fit the
user's task. Direct reasoning is a strong alternative, especially for a single
retry loop. User instructions and execution permissions control this work.

1. Identify the needed judgment, supplied inputs and their units. Separate
   observed facts, stipulated assumptions and derived values. Do not infer
   probabilities or an inspection benefit from a few observed successes/failures.
2. Read [usage and material](references/usage.md) and the bundled
   [method README](assets/workflow-cost-v1/README.md). Check applicability before
   computing. Missing inputs remain unknown; the CLI's example defaults are not
   estimates. A reading-only host can explain the method but cannot claim execution.
3. With Python 3.9+ and authorized local execution, verify **all** bundled material
   using the command in the usage reference. Refuse missing, changed or mixed
   files before importing code. Use only the delivered implementation/dependency;
   never fill a gap from a checkout or an installed module.
4. Run the applicable CLI or callable in a task-owned working directory. Keep
   mandatory checks. Check meaningful results against an independent recurrence
   or renewal calculation where practical. Do not use this expectation as a
   deadline, a general scheduler or evidence of actual savings.
5. Write the requested result with ordinary source/version references, actual
   inputs, their status, original result, judgment-time basis, unresolved limits
   and reconsideration conditions. The reference explains what a later worker
   needs; no Augnes project or branded format is required.

For later use, read the inherited output and reassess its assumptions against
the new task. Retain valid results, revise derived judgments or decline use.
Recheck public review/source history only when needed; an unavailable source is
unknown, and a pinned release or recent read does not establish current fitness.
