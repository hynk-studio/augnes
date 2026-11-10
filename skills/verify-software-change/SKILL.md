---
name: verify-software-change
description: Verify a concrete installation, package-delivery, dependency or version change using the project's existing checks and a reproducible evidence handoff. Use when a user asks whether a specified software change works in a specified environment. Supports an honest blocked or source-only result when execution is unavailable.
---

# Verify a software change

Augnes Software Change Check · version 0.1.0 · free component preview.

Verify one actual change, environment and user path. Use existing project tests
and verifiers; preserve their acceptance rules. No Augnes runtime, account or
service is needed. Agensi delivery requires the consumer's Agensi connection;
the same files also work directly. Do not install dependencies or choose a
version change merely to create a demonstration.

1. Identify the requested behavior, exact baseline/candidate or installation
   artifact, intended destination, runtime and expected result. Separate the
   application/service root, target project and installed/cache location.
   Treat missing versions, permissions, dependencies or execution facilities as
   missing inputs. Read source-first when the question is only about source.
2. Inspect the actual delivery path. Check whether all required code/data reaches
   the consumer, whether relative imports survive, and whether the proposed
   commands use the delivered files or silently fall back to a checkout/cache.
   Determine whether the host provides a directory, individual temporary scripts,
   or read-only text. Package acceptance is not execution compatibility.
3. Choose the smallest existing check that discriminates the requested behavior,
   plus a relevant failure/non-use case. Use the same task, data and meaningful
   checks for before/after comparison where a baseline exists. If the baseline
   cannot run, report a one-sided observation; do not invent a passing baseline.
4. Run only authorized commands in a task-owned disposable location where that
   matches the delivery path. Record exact commands, environment, exit status,
   output and errors. Keep failed attempts. Do not borrow hidden dependencies,
   rewrite the delivered implementation to make it pass, or retry an unchanged
   failed deciding run contrary to the project's rules.
5. When file drift or later identification matters, use the standalone
   [input snapshot helper](scripts/snapshot_inputs.py) with explicit relative
   file names before and after a check. It reads files and emits JSON; it never
   executes the subject, scans a whole machine or validates software behavior.
   A changed baseline-to-candidate snapshot is expected in many upgrades. An
   unexpected within-run change makes the original result's basis uncertain.
6. Write the requested result using the fields in the
   [handoff reference](references/handoff.md). Separate source inspection,
   deterministic/isolated execution, installed-host execution and user benefit.
   Let a later worker identify the actual inputs, repeat a check, or refuse stale
   evidence. Preserve unresolved work and cleanup failures.

Use ordinary tools directly when they suffice. Do not add a registry, scheduler,
receipt authority or general deployment framework. A correct refusal or a useful
failure report can complete this investigation without declaring the software
compatible. A local hash establishes identity relative to supplied bytes, not
publisher authenticity or permission to distribute private inputs.

## Receive the material

Read the handoff reference when preparing the result. Fetch the snapshot helper
only when selected-file identity or drift matters. Keep the subject's existing
checks central; a matching snapshot does not establish working behavior.

- **Directory delivery:** use the files from the received Skill directory.
  Run the commands below from that directory, or use its actual absolute path.
- **Agensi / individual-file delivery:** read referenced text through the host's
  file loader. Fetch `scripts/snapshot_inputs.py`, write its exact received bytes
  to one task-owned temporary `.py` file, and replace `scripts/snapshot_inputs.py`
  in the commands below with that actual path. Do not recreate a package folder,
  import a checkout copy, or rewrite the script. Remove that temporary script
  after use. Snapshot JSON and the report are work outputs, not installed Skill
  files; retain them only where the task permits.
- **Reading-only host:** inspect the available sources and explain the concrete
  execution requirement. Mark commands not run; do not invent an executed result.

The [request and result example](examples/request-and-result.md) shows a bounded
delivery investigation, including a useful failure. Use it to understand the
report, not as evidence about a different package or today's environment.

## Input snapshots

Run the unchanged Python 3.9+ helper with the standard library:

    python3 -E -s -S -B scripts/snapshot_inputs.py snapshot /absolute/subject package.json package-lock.json > before.json
    python3 -E -s -S -B scripts/snapshot_inputs.py snapshot /absolute/subject package.json package-lock.json > after.json
    python3 -E -s -S -B scripts/snapshot_inputs.py compare before.json after.json

Choose files that actually determine the check: source/artifact, lockfile,
configuration or checker. Keep snapshots and outputs outside those inputs.
The helper needs no sibling files and can run unchanged from a temporary file.
It reports only the selected file set; it does not discover transitive
dependencies or establish an atomic whole-directory snapshot. Equal endpoint
snapshots cannot rule out an intervening change that was later restored.
Comparison exits 0 for equal selected bytes, 1 for differences and 2 for
invalid/unreadable input.
Review file names and logs before any external sharing.
