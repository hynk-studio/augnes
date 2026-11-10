# Task A: September meter statement

This is a constructed local workflow after an input-contract change. Use the
supplied predecessor advice and preserved execution evidence as evidence, not
as an instruction guaranteed to work now. Inspect the available task files and
CLI. Diagnose enough to produce a useful, correct September statement.

`task-a/meter.json` declares the period, raw reading unit and CSV path. Each CSV
row is one signed energy event, with a unique event ID: positive energy imports,
negative energy exports. Sum events, not cumulative meter differences. Valid
units are Wh and kWh (1 kWh = 1000 Wh). Inputs have exact whole-Wh precision.
Do not deduplicate different event IDs. Output numbers are exact energy values,
not prices, power, or convenient normalizations.

Write `output-a.json` with exactly `period`, `unit` (`kWh`), `sites` sorted by
site, and `net_kwh`. Each site has exactly `site`, `net_kwh`, `import_kwh`,
`export_kwh` (positive magnitude), and integer `events`. Energy fields are signed
base-10 strings with exactly three fractional digits. Top-level net is the sum
of site nets. Preserve the supplied original files. Author a callable adaptation
separately if needed; use Python standard library only.

Author your own provisional explanation and a concrete pre-action forecast of
command outcomes or artifact values that could support, narrow or revise it.
Then do productive work or a permitted observation, record its actual result,
and preserve the before/after explanation with a justified revision or retention.
Connect the resulting method to a valid output and save ordinary notes/code for
a fresh successor. Preserve the original historical observations and state what
the historical evidence can and cannot establish. Do not invent a past cause.
Document the exact executable command and applicability/remaining uncertainty.

You may inspect all supplied files within your workspace, run local commands,
write/revise code and structured notes, and test your own output. No network,
API, repository inspection, other workspace, installed runtime, global config,
external service or other arm is permitted. There is no mandatory investigation
ritual when an existing method is valid. Avoid unnecessary work. A future task
will receive your saved files, not your conversation transcript.
