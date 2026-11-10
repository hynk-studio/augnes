# Task B: recurring portfolio batch

Read the retained files from your own predecessor workspace. This is a fresh
task with a different deliverable: produce an executable repeatable batch for
all manifests in `task-b/`, then create `output-b/monthly.csv` and
`output-b/portfolio.json`. Preserve A's original output, explanation versions
and code before any B adaptation. Use Python standard library only.

Each manifest defines its own period, CSV, raw unit (Wh or kWh) and site import
limits in kWh. Rows are independent signed energy events at exact whole-Wh
precision; positive is imported, negative is exported. Evaluate each site's
import limit separately per period, using imported energy before subtracting
exports. Equality is within limit; exceedance means strictly greater.

CSV columns, in order: `period,site,net_kwh,import_kwh,export_kwh,events,over_import_limit`.
Sort rows by period then site, with one row per period/site. All energy values
are exact kWh strings with three decimal digits, events are integers written
in decimal, and the limit field is lowercase `true`/`false`.

Portfolio JSON has exactly: `unit` (`kWh`), sorted unique `periods`, `net_kwh`,
`import_kwh`, `export_kwh`, and `highest_import_site` across the whole batch
(lexical site order breaks a tie). Energy values have three fractional digits.
The batch must derive values from these new inputs, not reuse A's scalar answer.

Before material action, author a source-bound judgment about which retained
explanation/method applies, what needs rechecking, and what should not carry
over. Save an inspectable forecast of command outcomes or artifact values, then
act, compare the actual result, and justify revision/retention. State which
retained files you actually read and used or declined and why. Preserve original
versions and unresolved historical limitations. Save the repeatable command.

Your available source/tool access and writing freedom are the same as A's.
Use only this arm's workspace and the new request; no predecessor transcript,
other arm, repository, evaluator, network, API, global configuration or installed
runtime. You may freely invent explanations, observations, code and notes.
