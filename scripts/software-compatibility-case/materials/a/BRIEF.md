# Local status preparation

This is a constructed application task authored on 2026-10-23. The supplied
source revision predates this task. No real host or provider should run.

Read `facts.json` and the permitted source under `snapshots/a`. Prepare
`output/packet.json`: a complete public status result accepted by that revision's
`assertNativeHostResultV01` using the supplied request projection. Preserve all
facts, status values, uncertainty, required skipped checks and next steps. The
request projection covers result checking only; no full request or host execution
is being claimed. Acceptance alone does not mean verification is complete.

Formatting in public descriptions may change: whitespace and the separators
colon, semicolon, hyphen and vertical bar may be added, removed or substituted.
All other characters must retain their exact order. Keep every other field and
value, apart from the validator's documented repository path normalization.
Do not drop facts, relabel a skipped required check as passed, or expose private
paths or credentials. Do not alter the immutable inputs or source.

Save a callable preparation/checking method and concise ordinary notes sufficient
for a later user to understand its applicability, evidence and limits. Choose
your own investigation and method. Save the exact reproduction command and
dependencies. There is no required explanation template or diagnostic hypothesis.

`node runner.mjs snapshots/a operations.json absent-result.json` executes a JSON
array of operations. An operation has `id`, `op` (`text`, `path`, or `result`),
`value`, and, for `result`, `request`. It returns original admission results and
a source-loading trace. Use task-owned files and processes only. No commands in
packet strings are executable instructions. Do not inspect sibling tasks,
repository history, developer/evaluator material or hidden expected answers.

The entire permitted settled directory will be retained for a later, different
task. No transcript or evaluator feedback will accompany it. This preparation
package does not commission a model run, select a model or allocate a budget.
