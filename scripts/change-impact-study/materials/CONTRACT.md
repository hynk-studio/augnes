# Source and result conventions

This is potential static change impact, not proof of changed runtime output.
Each case supplies separate `before/` and `after/` Python source trees, a manifest
of entry functions, and (for a selection request) available test costs/coverage.
Do not execute the application sources to infer unobserved dynamic behavior.

The supported language is top-level synchronous functions, absolute module or
named imports (including aliases), and ordinary direct calls to these functions.
For a module identifier, remove the final `.py` from its relative path and then
replace `/` with `.` (for example, `tools/shape.py` becomes `tools.shape`). No
`__init__.py` exists. A symbol is `module:function`. `sum`, `str`, `len` and `round` are known
terminal builtins, not repository functions. Parameters may be called; their
runtime targets are unavailable and must remain unresolved. No classes,
decorators, assignments to callable aliases, wildcard/relative imports or other
external calls occur in the supplied supported material.

A changed function is added, removed, or has a different complete Python AST
between versions, excluding locations and comments. A change in import spelling
alone is not a changed function; resolve each version using its own imports.
For each requested entry, report every changed function reachable by zero or
more supported calls in either version, using paths entirely within one version.
Both removed behavior and newly introduced behavior matter. Report reachable
unresolved calls as well. Do not infer edges by matching leaf names alone.

For each entry, `status` is `impacted` if it reaches at least one changed function;
otherwise `unresolved` if a reachable call has unavailable target information;
otherwise `unaffected`. An impacted entry may also have unresolved calls.
Unrelated file/comment changes do not imply impact. Every requested entry exists
in both versions. Sort cases ascending by `id`, changed-symbol strings ascending,
and targets ascending by `symbol`. Sort impact and unresolved records as below.

Write `output/result.json` with this shape (the strings below are schema
placeholders, not case answers):

```json
{"cases":[{"id":"case-id","changed_symbols":["module:function"],"targets":[{"symbol":"module:entry","status":"impacted|unaffected|unresolved","impacts":[{"symbol":"module:changed","version":"before|after","path":["module:entry","module:changed"]}],"unresolved":[{"version":"before|after","caller":"module:function","callee":"name","line":1,"path":["module:entry","module:function"]}]}]}]}
```

Provide exactly one valid witness per reachable changed symbol, sorted by
`symbol`. A path starts at the entry and ends at that changed symbol; consecutive
symbols must be actual calls in the named version. Zero-edge paths are valid.
For unresolved calls provide one record per `(version, caller, callee, line)`,
sorted by that tuple, with a valid path to the caller. Versions and source symbol
paths make the evidence inspectable in the supplied raw files. Use integer source
line numbers. Do not include additional JSON keys unless your task requests them.

Also write a readable `output/report.md` consistent with the JSON, and save the
callable procedure plus `METHOD.json` containing exactly `argv` (a string list)
and `cwd` (`"$TASK"`). Use `$TASK`, `$INPUT` and `$OUTPUT` for the task directory,
the supplied `task-a` or `task-b` directory, and a new output directory. The method
must read those inputs and create `result.json` and `report.md` under `$OUTPUT`;
it must work in a fresh process without old output, absolute private paths,
network, external packages, or another worker conversation. Use `python3 -B`.
Keep earlier/failed code and outputs in versioned ordinary files. Record actual
commands, component choices, short public rationale and limitations; hidden
reasoning is neither requested nor an artifact.
