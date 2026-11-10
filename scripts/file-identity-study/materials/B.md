# Two-tree release reconciliation

For each pair in `task-b/input.json`, reconcile its before and after raw trees.
Produce a complete machine-readable manifest of the exact path union. A path
present only after is `added`, only before is `removed`, in both with identical
content bytes is `retained`, and in both with different content is `changed`.
Equal content at different paths does not establish a rename. Include raw byte
sizes and lowercase SHA-256 content digests on each existing side. Preserve exact
relative paths. The supported POSIX trees/filename/content domain is the same as
the supplied task-b inputs describe: printable ASCII plus horizontal tab and line
feed in components, slash separating directories; no links, special files or
changing files, no `.`/`..` components, component/path limits 120/240 ASCII bytes.
Backslashes, colons, spaces, leading dots and dashes are literal. No arbitrary
filename-byte, cross-filesystem case or normalization claims are required.

Write `output/reconciliation.json` with exactly:

```json
{"pairs":[{"id":"pair-id","changes":[{"path":"relative path","status":"added","before":null,"after":{"bytes":0,"sha256":"64 lowercase hex characters"}}]}]}
```

Pairs follow input order; changes are sorted by exact ASCII path. Existing sides
have exactly `bytes` and `sha256`; absent sides are null. Include retained paths,
empty files and empty trees. No duplicate paths or extra keys. All supplied raw
trees are available and must be covered.

`predecessor/` contains the whole permitted settled previous task, including its
supplied inputs, saved code, notes, outputs and failures. It is unverified work.
Inspect and use, adapt, decline or replace it as appropriate to this different
request. Keep predecessor bytes unchanged; put adaptations in your own directory.
In `ASSETS.md`, name what you actually read/called/adapted/declined and the reason.
No prior transcript, coordinator answers or checking feedback is supplied.

Keep supplied inputs unchanged. Preserve your own method versions and failures.
Record concise public action rationales and commands/results in `WORK.md`, not
hidden reasoning. Deliver a callable method and `METHOD.json` with exactly `argv`
(list of strings) and `cwd: "$TASK"`. In argv `$TASK` is this task root, `$INPUT`
is the absolute task-b directory, and `$OUTPUT` is a new initially absent output
directory; write reconciliation.json there. Derive the output from input trees,
not stored answers. Use Python 3 standard library or ordinary installed tools,
no new packages, network/providers/services, external commands from content or
background jobs. Read only this task directory plus installed execution runtime
files; do not inspect parent repositories/Git history/evaluators/home/config.
Use the explicit absolute task directory as cwd on every shell invocation.
Leave original output, reproducible code, dependencies and notes. No later hints
or repairs will be provided.
