# Experience-revised work explanations (#1464)

This contained filesystem prototype supplies a runnable constructed local CLI
case and an independent evaluator. It adds no product backend, reader, writer,
MCP, Core or persistence contract. Ordinary files and consumer-authored code are
sufficient for this question. Installed Augnes integration and comparative
usefulness are separate claims.

Run the bounded, model-free development checks:

```sh
python3 -B scripts/work-explanation-study/test_study.py -v
```

Create a new A workspace; the target must not exist:

```sh
python3 -B scripts/work-explanation-study/prepare.py a /tmp/my-meter-case
cd /tmp/my-meter-case
python3 -B legacy_meter.py task-a/meter.json output-a.json
```

The original CLI is deliberately retained from the constructed predecessor.
The last command is an observation, not a promised correct solution. A consumer
reads `TASK.md` and the preserved advice/actual execution basis, authors an
explanation and forecast, then creates an effective method and checked output.
No correct-cause list, adaptation or completed explanation is provided.

Only after A has settled and its original assets have been preserved, add B:

```sh
python3 -B scripts/work-explanation-study/prepare.py b /tmp/my-meter-case
```

Fresh B reads its own arm's saved files and `TASK-B.md`. It must produce a new
recurring multi-period portfolio batch, including per-site import-limit
judgments. It receives neither A's transcript nor the other arm's work. Mixed
units, signed energy, gross imports versus net energy, exact representation and
the strict threshold matter; convenient rescaling or file existence is not enough.

Evaluator commands (keep the evaluator source and expected answers outside
consumer access during a fixed comparison):

```sh
python3 -B scripts/work-explanation-study/checker.py a /tmp/my-meter-case /tmp/my-meter-case/output-a.json
python3 -B scripts/work-explanation-study/checker.py b /tmp/my-meter-case /tmp/my-meter-case/output-b
```

The checker uses string/integer arithmetic independent of the supplied CLI's
Decimal calculation. It checks declared meaning, units, event/site coverage,
all per-period limits and complete output format. It provides no consumer
feedback in the fixed observation and never repairs an output. Development
controls exercise an actually successful historical cleanup, its current
insufficiency, correct A/B artifacts and invalid/missing/misscaled outputs.
These exposed scripted controls establish mechanics, not consumer discovery.

## Comparison procedure and attribution

**Candidate additional procedure:** before a consequential command, preserve a
source-linked provisional explanation and discriminating artifact forecast,
then append the observed result and justified explanation/applicability update
without replacing the original version.

The strong adaptive memo/code reference has the same task requirements, raw
files/advice, source/tools, model settings, total resource ceiling and freedom
to invent explanations, choose observations, write/revise code and retain
structured notes. It chooses its own organization. Both author forecasts;
the candidate additionally prescribes explicit versioned explanation/action
bindings. This is a small procedure comparison, not an informational advantage
or a new model capability. Acquired observations may differ.

Freeze source/input bytes, independent checks, complete prompts, the above
procedure/update rule, access/exposure boundaries, order, model/tool settings,
accounting and stops after development and before the first consumer. Each
arm's explanations and code may evolve only from its permitted observations;
preserve their versions. The existing included native client is the permitted
route; no API key, alternate launcher, replacement pair or auth/config repair
is authorized here. An unavailable route leaves actual use NOT_RUN.

The current commission allows at most four primary task messages: candidate A,
fresh candidate B, reference A, fresh reference B; one experimental worker at a
time, at most 600 seconds per worker and 2,400 seconds aggregate including owned
settlement. Failed launches count. This README creates no new allocation.
Count internal tool/inference calls separately where observable. Consumers may
use only their own task directory; this is declared protocol separation on a
shared-user filesystem, not hostile OS isolation. Current configuration,
residual memory, developer exposure and coordinator assistance must be reported.

Judge mechanism availability, actual consumer outcome, incremental usefulness
and product integration separately. A single constructed comparison establishes
neither general superiority nor statistical equivalence. Preserve #1465's
completed tie/SIMPLIFY and #1493's PARTIAL/ENDED/unused-slot/UNKNOWN disposition.
Do not automatically proceed to later software-investigation or retention work.
