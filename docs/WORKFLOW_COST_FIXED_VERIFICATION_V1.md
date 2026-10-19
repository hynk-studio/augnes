# Fixed local workflow-cost report verification

`GET` and `POST /api/vnext/operator/workflow-cost-verification` provide one
authenticated local operator path for an explicitly selected workflow-cost
1.0.0 JSON report and a separately selected authoritative numeric basis.
The trusted verifier runs in process. It needs no Codex executable, Codex login,
model, provider, compiler, package installer, shell command or network request.
Normal Augnes application dependencies and local operator authentication still
apply. This is trusted local execution, not a malicious-code sandbox.

## Ordinary explicit invocation

Open the intended local project through the existing authenticated project
review flow. Define initial work, or an explicit authored successor, before
selecting files. Selection is an ordinary revision of unstarted work; a work
item already executed cannot be silently rewritten. Place two distinct regular
JSON files inside that registered project root. Select the numeric basis from
the authoritative source independently of the candidate report. Copying its
echoed `inputs` into the basis would defeat that independence.

The basis has exactly these six string fields; integer or rational strings are
accepted. This example stipulates values, not measured probabilities:

```json
{"attempt":"10","verification":"2","repair":"4","direct_success":"2/5","inspection":"1","inspected_success":"4/5"}
```

The candidate uses the unchanged released JSON format documented in
[`publications/workflow-cost-v1/README.md`](../publications/workflow-cost-v1/README.md).
It is read as inert text. Accompanying project code is never imported or executed.

An authenticated same-origin HTTP client can use the handler directly. For
example, in the existing local review browser context, the following calls use
its HttpOnly operator cookie without exposing it. Each stage is explicit:

```js
const endpoint = '/api/vnext/operator/workflow-cost-verification';
const read = async response => {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error_code);
  return body;
};
const post = body => fetch(endpoint, {
  method: 'POST', credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
}).then(read);

// Read and inspect the exact project, goal, work and physical root first.
const context = await fetch(endpoint).then(read);
const selectedPaths = { ...context.identity,
  basis_path: 'basis.json', report_path: 'report.json' };
const preview = await post({ action: 'preview', ...selectedPaths });
// Inspect preview.selection, its digests, six values, verifier and criteria.

const selected = await post({ action: 'select', ...selectedPaths,
  preview_binding: preview.preview_binding });
// Selection saved through ordinary source revision; execution has not begun.

const request = { action: 'verify', packet_id: selected.packet_id,
  packet_fingerprint: selected.packet_fingerprint,
  root_fingerprint: selected.root_fingerprint,
  selection_binding: selected.selection_binding,
  criteria_binding: selected.criteria_binding, verifier_source: selected.verifier_source };
const verified = await post(request);
const restored = await fetch('/api/vnext/operator/run-results?receipt_ref=' +
  encodeURIComponent(verified.result.identity.receipt_ref)).then(read);
```

Review the preview before sending `select`, and the saved selection before
sending `verify`. No stage schedules another stage. A revoked session requires
the existing explicit local authentication flow. After an uncertain response,
read current work/run results before deciding any further action.

## Binding and verification meaning

Profile `workflow_cost_report_verification.v1` uses verifier
`workflow_cost_renewal_verifier.v1` and adapter
`workflow_cost_verification_adapter.v1`. Its selected-source descriptor binds
both relative paths and SHA-256 byte digests, normalized authoritative values,
physical root fingerprint, verifier source digest and fixed criterion digest.
The ordinary packet fingerprint and NativeHost request bind the exact
workspace/project/work, current source lineage and root before invocation.
The fixed checklist is server owned; the report cannot supply or remove checks.
Selection and execution separately re-read the same two files. Duplicate
delivery also checks the selected bytes before returning a historical receipt.

The verifier independently computes, using exact reduced rational arithmetic:

```text
direct = (attempt + verification + (1 - direct_success) * repair) / direct_success
inspected = (attempt + verification + inspection
             + (1 - inspected_success) * repair) / inspected_success
difference = inspected - direct
```

Mandatory verification remains in both alternatives. Zero success probability
means `non_completing`, null expected work and `not_comparable`, including an
all-zero-cost closed loop. Producer exit status cannot change that meaning.
Fixed checks cover source binding, report schema, equality to the authoritative
inputs, both expected values, difference, statuses/comparison, and read-only
operation. Expected output strings use the release's canonical reduced format.

The normal NativeHost/RunReceipt writer stores execution and check outcomes;
the ordinary result reader freshly validates their source bindings. A completed
verifier can reject the report. An arithmetically consistent report establishes
neither empirical probabilities, stationary applicability, deadline guarantees,
causal benefit nor semantic acceptance. Existing task criteria may remain
unknown or skipped. Review proposals remain proposals. No Decision, applied
Transition, scheduler, external effect or new execution grant is created here.

The historical `criterion_verification_plan.v0.1` root-verification profile,
root-manifest adapter and agenda literal-inspection meanings are unchanged.
This compatible receipt-check path does not reinterpret their criteria. The
`deterministic_zero_model` command ban and Canonical test-only activation remain
unchanged. No new store or migration is introduced.

## Limits and interruption

Each file-reading stage admits exactly two distinct regular files with at most
65,536 combined input bytes. Paths are relative JSON paths, at most 160
characters and eight segments; symlinks, hard links and aliases are refused.
The reader checks root/file identity and change during reading. Parsing permits
only bounded objects, strings and null: depth four, 32 members and 2,048 encoded
characters per string; duplicate keys, arrays, numbers and booleans are refused.
Input rational components have at most 20 digits and reduce to at most 64 bits.
Arithmetic intermediates are capped at 1,024 bits; result output at 16,384 bytes.
Admission/execution use a 10-second elapsed-time guard; the existing NativeHost
lifecycle has a 10-second execution timeout and 10-second stop-settlement limit.
Blocking I/O cannot be represented as confirmed settlement merely by timeout.

Authority/root binding is checked during reads; exact packet admission is
checked at execution boundaries. Changed bytes, criteria, work or project are
refused. The existing run identity and receipt writer make duplicate delivery
idempotent. A process lost after run claim but before atomic result storage
leaves an unresolved run; another request is refused as `direct_host_run_conflict`.
There is no automatic rerun or fabricated success. Read the existing ledger and
keep the unresolved outcome for explicit review. Loss after commit restores the
same receipt. Ordinary cancellation/timeout writes a terminal receipt only after
the existing lifecycle confirms settlement.

## Engineered continuation evidence

With development dependencies already prepared, the focused check is:

```bash
node --import tsx scripts/test-workflow-cost-verification.ts
```

Run through the repository's admitted development resource owners. This focused
check supplements the unchanged Canonical suite inventory and exact-head planner.
An optional `--evidence-dir .augnes-local-verification/<private-directory>` saves
synthetic results/artifacts and process observations, excluding credentials and
disposable databases. The test compiles trusted application code before starting
fresh evidence processes; the product verifier never compiles or installs.

Fresh processes use private HOME/config state, an empty PATH, explicit scoped
environment, and blocked Node subprocess/network APIs. They observe absence of
Codex on PATH, Codex authentication in that HOME, and provider configuration.
This does not claim that a hostile same-user process cannot access the host.

The producer calls the real exported handler, normal source/work owners and
ordinary result reader. Each producer exits before a fresh deterministic
consumer reads only authenticated persisted work, selected sources and receipts.
The consumer emits a conditional workflow-plan Markdown artifact. It changes
under a relevant input correction, preserves independent material under an
unrelated edit, traverses bounded receipt lineage to retain the original rejected
claim, and carries unresolved applicability forward. Negative test-only I/O and
result-removal faults exercise boundaries; the public handler exposes no fault
or adapter injection. Actual human/model semantic-use observation and comparative
usefulness remain **NOT_RUN**. This evidence does not close the broader P5.3 phase.

Refs: [#1483](https://github.com/hynk-studio/augnes/issues/1483),
[#1215](https://github.com/hynk-studio/augnes/issues/1215),
[#1426](https://github.com/hynk-studio/augnes/issues/1426).
