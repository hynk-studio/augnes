# One workflow-cost verification contribution (#1509)

This request asks one question: can a first recipient use the fixed public
workflow-cost package and an existing Python environment to reproduce one
ordinary file calculation, and report missing steps, failures or unclear
applicability? It serves the participation/usage-guidance maintainer in
[#1447](https://github.com/hynk-studio/augnes/issues/1447); checked use and feedback
belong to [#1443](https://github.com/hynk-studio/augnes/issues/1443).

This Markdown is the same request for a human or an agent. Save its exact bytes
as `request.md`, record its SHA-256 and commit-pinned URL (or the exact saved-file
identity when explicitly relayed), and include both with the return. The
request identifier is **1509-file-python-r1**; a matching label alone is not a
revision check. Read [#1509](https://github.com/hynk-studio/augnes/issues/1509) for
the current disposition before doing work. This is one bounded contribution,
not an invitation to repeat runs, contact other people or start a model study.

## Fixed material and permitted work

| Identity | Required value |
|---|---|
| Component / immutable method | workflow-cost Skill/plugin **0.1.0** / **1.0.0** |
| Release | [augnes-workflow-cost-v0.1.0](https://github.com/hynk-studio/augnes/releases/tag/augnes-workflow-cost-v0.1.0), ID **417998957** |
| Asset | `augnes-workflow-cost-0.1.0.zip`, ID **658260615**, **38254 bytes** |
| ZIP SHA-256 | `082789624f70a1feaca11c4e4fa852f8d6a505caf45d3e2e572df5f40fa8c59d` |
| Frozen release source | `d51b73b447780c1c1d3f795515dfbd5f9d24468d` |
| Method content ID | `sha256:88706b91f4889b4e62a1a42b217be9c79ad61292bb31197f0677c7a21507b8d2` |

Use one already available host with Python 3.9+, `curl`, `shasum` and `unzip`.
Record actual OS, architecture and Python versions. Reading and ordinary local
file execution need no Augnes account, private origin notes, checkout, plugin
installation, new profile, Companion, API credential or model conversation.
Only run code under your existing local authority. If a prerequisite is missing,
return that limitation; installing or changing authentication is outside this
request. Inspect the public bundled usage reference and method README before
execution. Python isolation flags restrict imports/bytecode, not execution safety.

The **controlled test scenario** has these stipulated inputs in one additive
work unit: attempt **7**, mandatory verification **2**, repair after failure
**3**, direct success probability **2/3**, inspection **2**, inspected success
probability **3/4**. Rates and costs remain fixed across retries. Optional
inspection occurs before **every** inspected attempt, including retries; both
routes always perform verification. These are assumptions, not observed rates
or measured savings. Do not substitute the release's worked example.

Do not apply the CLI to missing costs/probabilities, changing or history-dependent
rates, one-time inspection, parallel scheduling or deadline guarantees. Its
general callable is limited to 1–8 transient states with a path to completion
from every state. An expectation does not establish a deadline probability.
Unpriced mandatory verification is unknown, not zero. A direct renewal
calculation or justified non-use remains a useful answer.

## Runnable file entry

Run this POSIX shell block once. It creates only a fresh receiving directory,
verified working copy and separate output directory. Keep the printed path to
assemble the return. Stop and preserve the failure if any command fails; do not
copy missing files from a checkout, rebuild the ZIP or change the fixed target.

```sh
set -eu
task_dir=$(mktemp -d "${TMPDIR:-/tmp}/augnes-1509.XXXXXX")
task_dir=$(cd "$task_dir" && pwd -P)
printf 'Task directory: %s\n' "$task_dir"
cd "$task_dir"
mkdir received work output
uname -srm > output/os.txt
python3 -E -s -S -B -c 'import platform, sys; print(platform.platform()); print(sys.version); assert sys.version_info >= (3, 9)' > output/python.txt
curl --disable --fail --location --max-time 60 \
  --output received/augnes-workflow-cost-0.1.0.zip \
  https://github.com/hynk-studio/augnes/releases/download/augnes-workflow-cost-v0.1.0/augnes-workflow-cost-0.1.0.zip
test "$(wc -c < received/augnes-workflow-cost-0.1.0.zip | tr -d ' ')" = 38254
printf '%s  %s\n' \
  082789624f70a1feaca11c4e4fa852f8d6a505caf45d3e2e572df5f40fa8c59d \
  received/augnes-workflow-cost-0.1.0.zip | shasum -a 256 -c -
unzip -q received/augnes-workflow-cost-0.1.0.zip -d received/bundle
skill_dir="$task_dir/received/bundle/plugins/augnes-workflow-cost/skills/stationary-retry-work"
cat "$skill_dir/references/usage.md" "$skill_dir/assets/workflow-cost-v1/README.md"
python3 -E -s -S -B "$skill_dir/scripts/verify_material.py" \
  "$skill_dir/assets/workflow-cost-v1" > output/material-received.json
cp -R "$skill_dir/assets/workflow-cost-v1" work/material
python3 -E -s -S -B "$skill_dir/scripts/verify_material.py" \
  "$task_dir/work/material" > output/material-work.json
cd work/material
python3 -E -s -S -B workflow_cost.py \
  --attempt 7 --verification 2 --repair 3 \
  --direct-success 2/3 --inspection 2 --inspected-success 3/4 \
  > "$task_dir/output/calculation.json"
cd "$task_dir"
python3 -E -s -S -B "$skill_dir/scripts/verify_material.py" \
  "$task_dir/work/material" > output/material-after.json
cat output/calculation.json
```

The expected **form**, without an internal answer key, is JSON containing exact
rational direct/inspected expected work, their difference and comparison. A
successful return includes passing received/copy/final material checks and an
explanation of applicability. A failed command, unclear instruction or justified
non-use is also useful: include the failing step and unknowns instead of a PASS.
Keep outputs outside the five-file immutable material directory; an added result
file there correctly makes its inventory check fail.

## Return and origin responsibilities

Return through a comment on #1509 **only if separately permitted to post**, or
give the saved files to the assigning maintainer by the already authorized file
relay. No new account or public disclosure is required. A local return remains
local until explicitly relayed; a hash alone is not delivery. The maintainer
records the received file identity or comment URL/revision and keeps the original
bytes. Feedback uses that same route. Do not include secrets, private paths,
private raw logs or personal data in a public comment. No licensing or identity
rights are inferred from public access.

Use these fields in a Markdown or JSON return; no Augnes-specific record is needed:

- Request identifier, exact request file SHA-256 and URL/revision; all fixed
  component/release/asset/source/method identities above and observed ZIP digest.
- Actual actor/program, OS/architecture/Python, procedure, exact commands, exit
  codes and elapsed times. Disclose preparation help, shared context and supplied
  answers. A fresh subprocess is not an independent human or model participant.
- All six inputs and units, material-check outputs and calculator output (or
  the precise failing step), with the saved files' SHA-256 values.
- Missing steps, ambiguity, failures, unsupported conditions and untested scope;
  proposed instruction/check to change or retain, with a reason.
- Permission/destination for feedback and the next check the contribution can
  support. Retain a local copy if ending participation.

The #1447 maintainer then performs this explicit checklist before using a return:

1. Freeze the original return and its attachments. Treat manual/Issue material as
   externally sourced and unverified; origin interpretation goes in a separate
   decision file/comment. Do not mint a native `request_ref`, material-read witness
   or #1508 status. Native scoped review requires its actual configured connection.
2. Compare exact request bytes/revision, ZIP bytes/hash, component and method
   versions, release/asset IDs, source and content ID against this request. Check
   that all six inputs, actual commands, check outputs and limitations are present.
   A different version or incomplete return is **DEFER**, even if its arithmetic
   passes. Preserve it as historical material, state what is missing and request
   only the applicable next check; do not silently label it current work.
3. Check the result independently of the package: for attempt cost `a`, mandatory
   verification `v`, repair `r` and success `p`, solve
   `E = a + v + (1-p)(r + E)`. For inspected work add inspection cost before
   every attempt and use its stipulated success probability. Use exact fractions,
   compare both expectations and their difference, and inspect applicability.
   Independent arithmetic checks a result, not actor authenticity or field rates.
4. Choose **use, partial-use, retain, defer or non-use** with reasons and unresolved
   obligations. Actually edit a specific #1447 instruction/check, or identify its
   exact retained revision and why the return supports retaining it. Link this
   downstream artifact to the checked original; saving a PASS alone is insufficient.
5. Deliver permitted feedback: original identity, scoped checks, disposition,
   reason, changed/retained instruction and next-check conditions. Save its exact
   identity and verify that a fresh reader can retrieve request, original return,
   decision/feedback and downstream instruction through the chosen route. If any
   item is missing or mismatched, report re-entry unavailable rather than recover
   it from a producer's memory. With manual relay, delivery and readback are manual.

Preserve relevant failures and uncertainty. Reconsider on a new requested version,
changed public instructions or applicability, a missing prerequisite or a concrete
failure report. Do not schedule a repeat or expand participation automatically.
Once the retained return and feedback are readable, remove only your own disposable
receiving/work directories; keep the selected original artifacts for review.

The bounded completion claim is one prepared and mechanically verified
request/return/use/feedback path. Independent external participation, organic
discovery, semantic understanding, comparative benefit and full W1/W2 remain
separate observations. The controlled #1509 result and current review disposition
are recorded in its issue, not inferred from this reusable request.
