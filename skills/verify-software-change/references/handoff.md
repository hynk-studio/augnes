# Reproducible handoff

Use a short Markdown report or equivalent structured output. Include only what
the next consumer needs; a schema or Augnes record is not required.

| Field | Record |
| --- | --- |
| Question | Exact change, intended consumer and user-visible behavior being checked. |
| Basis | Baseline/candidate revision or artifact identity, actual selected files and dependencies, and why this is the right material. Unknown identity stays unknown. |
| Environment | Actual OS/architecture/runtime and delivery mode. Separate application checkout, target project and installed copy without publishing private paths. |
| Procedure | Exact commands, working-directory meaning, inputs, expected outcomes and checks. Note any preparation help or supplied answer. |
| Observation | Exit status, original output/error, failed or interrupted attempts, input drift and elapsed time when measured. Keep original evidence with the report through a permitted route. |
| Assessment | PASS/FAIL/BLOCKED/NOT_RUN for each check, actual coverage, uncertainty and difference from baseline. A checker PASS does not make an unexecuted user path PASS. |
| Next use | Concrete next consumer/action and conditions requiring rechecking: changed source, package, runtime, configuration, input or missing evidence. |
| Cleanup | Owned temporary material/process disposition and any unresolved effects. |

For a source-only review, state which operations did not run and why. For a
historical result, retain its original revision and observation date; do not
relabel it as a current test. A supplied candidate, a simulated receiving mode
and an independently arriving user are different origins.

Do not compare skill versus no-skill performance from one successful run. For a
later benefit comparison, give the ordinary-tool baseline the same accessible
source, tests, inputs and resource limits, and count preparation, execution,
verification, repair and human explanation burden. Internal reuse may justify
keeping the candidate even when external demand is unknown.
