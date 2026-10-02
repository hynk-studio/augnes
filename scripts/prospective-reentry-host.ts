import { ProspectiveReentryHost } from "../lib/vnext/runtime/prospective-reentry";
import { readVNextLocalOperatorPilotConfigV01 } from "../lib/vnext/runtime/local-operator-session";

async function main() {
  const [agendaRef, duration] = process.argv.slice(2);
  if (process.argv.length !== 4 || !/^sha256:[a-f0-9]{64}$/u.test(agendaRef ?? "") || !/^\d+$/u.test(duration ?? "") ||
    process.platform !== "darwin" || process.arch !== "arm64") throw new Error("prospective_host_arguments_or_platform_invalid");
  const host = new ProspectiveReentryHost({ config: readVNextLocalOperatorPilotConfigV01(process.env), agenda_ref: agendaRef! });
  const stop = new AbortController();
  const cancel = () => stop.abort();
  process.once("SIGINT", cancel); process.once("SIGTERM", cancel);
  try {
    const result = await host.runFor(Number(duration), stop.signal);
    console.log(JSON.stringify({ status: result.status, phase: result.state?.phase, model_calls: 0, broader_activation: false }));
  } finally { process.removeListener("SIGINT", cancel); process.removeListener("SIGTERM", cancel); }
}
void main().catch(() => { console.error("prospective_host_refused_or_interrupted; inspect the persisted agenda and run before retrying"); process.exitCode = 1; });
