# Select economical regression checks for new releases

The release engineer needs a test-selection plan for each case in `input.json`.
Determine the potential impact of its before/after source change using the
definitions in `CONTRACT.md`, then select the least-total-cost set of listed tests
covering every definitely impacted entry. Costs are stipulated units, not measured
runtime. A test covers only the entries explicitly listed in `covers`; unrelated
entries need no test. Unresolved entries must be reported separately and cannot
be certified by a test-selection label. If no definite impacts exist, select no
tests at cost zero. All definitely impacted entries have listed coverage.

Add exactly this `selection` object to each case's JSON: `{"tests":["test-id"],
"cost":0,"unresolved_targets":["module:entry"]}`. Sort selected IDs and unresolved
entry symbols. For equal minimum cost choose the lexicographically smallest
sorted ID list. The remaining schema and callable replay convention are in
`CONTRACT.md`. Write the actual plan to `output/result.json` and a consistent
`output/report.md`.

`predecessor/` contains the complete permitted settled files of another worker's
different report task, including earlier attempts/failures. You may read, reuse,
adapt, replace or decline these assets. Before substantive processing, briefly
record which predecessor assets you inspected, their applicability to this goal,
and any limitations or omissions. Keep the original predecessor and `task-b/`
unchanged; save your procedure and revisions elsewhere. Preserve actual commands
and invocation/derivation evidence. Correct output alone does not show asset use.

No predecessor conversation, evaluator feedback or expected answer is supplied.
Use only this task's files, permitted standard-library tools and your own work;
do not inspect the parent repository/history, other tasks, evaluator or network.
