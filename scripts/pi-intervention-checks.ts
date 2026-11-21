import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import Database from "better-sqlite3";
import { GET as readRunResult } from "../app/api/vnext/operator/run-results/route";
import { observedNativeHostTransportCoverageV01 } from "../lib/vnext/native-host/native-host-contract";
import { LiveNativeHostRunServiceV01 } from "../lib/vnext/runtime/live-native-host-run-service";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01,
  type VNextLocalOperatorPilotConfigV01, type VNextLocalOperatorSessionCredentialV01 } from "../lib/vnext/runtime/local-operator-session";
import type { ProjectRunResultDetailV01 } from "../types/vnext/project-run-result";
import { NATIVE_HOST_RESULT_VERSION_V01, type NativeHostAdapterV01, type NativeHostResultV01 } from "../types/vnext/native-host-adapter";
import { exercisePiIntervention, type InterventionCase } from "./pi-intervention-worker";

type Case = InterventionCase | "witness_control" | "wrong_envelope";
const now = () => "2026-08-01T00:00:05.000Z";
const version = "pi_intervention_fixture.v1";
const dispositions = {
  inspect_file: "Pi returned the first file contents.",
  reread_file: "The steering instruction produced a second read with the revised file contents.",
  summarized: "Pi processed the follow-up once after the current check finished.",
  follow_up_recovered: "The follow-up was recovered from the pending queue before abort.",
};
type Disposition = keyof typeof dispositions;

async function reopenResult(config: VNextLocalOperatorPilotConfigV01, receiptId: string, oldSessionId: string) {
  const environment = { AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: config.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: config.project_id, AUGNES_VNEXT_OPERATOR_ID: config.operator_id, AUGNES_DB_PATH: config.database_path };
  const previous = Object.keys(environment).map(key => [key, process.env[key]] as const);
  const fresh = new Database(config.database_path, { fileMustExist: true });
  try {
    Object.assign(process.env, environment);
    const token = issueVNextLocalOperatorBootstrapV01(fresh, { config });
    const session = consumeVNextLocalOperatorBootstrapV01(fresh, { config, bootstrap_token: token.bootstrap_token });
    assert.notEqual(session.session.session_id, oldSessionId);
    const host = "127.0.0.1:3000";
    const url = new URL("http://" + host + "/api/vnext/operator/run-results");
    url.searchParams.set("receipt_ref", receiptId);
    const response = await readRunResult(new Request(url, { headers: { host,
      cookie: VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "=" + session.cookie_value } }));
    const body = await response.json();
    assert.equal(response.status, 200, body.error_code);
    return body.result as ProjectRunResultDetailV01;
  } finally {
    fresh.close();
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

export async function checkPiIntervention(input: {
  config: VNextLocalOperatorPilotConfigV01;
  credential: VNextLocalOperatorSessionCredentialV01;
  readCredential: (cookie: string) => VNextLocalOperatorSessionCredentialV01;
  executable?: string;
  scenario: Case;
}) {
  const { config, scenario } = input;
  const portable = scenario === "witness_control" || scenario === "wrong_envelope";
  const cancel = portable || scenario === "cancel";
  let cancelRequested = false, cancelSent = false;
  let workerError: unknown;
  let observedSession: string | undefined;
  let turns: { checked?: number; summary?: number } | undefined;
  let trace: string[] = [];
  const ready = () => { cancelRequested = true; };
  const adapter: NativeHostAdapterV01 = {
    adapter_version: version, capability_version: version,
    execution_profile: "native_host_managed_model", provider_egress: "native_host_managed",
    invoke(request, control) {
      async function run(): Promise<NativeHostResultV01> {
        let session: string;
        if (scenario === "witness_control" || scenario === "wrong_envelope") {
          // Portable owner test. No Pi events are claimed by these two cases.
          session = "portable-cancel-control";
          ready();
          if (!control.cancellation_signal.aborted) await new Promise<void>(resolve => {
            control.cancellation_signal.addEventListener("abort", () => resolve(), { once: true });
          });
        } else {
          assert(input.executable);
          const actual = await exercisePiIntervention(input.executable, scenario, control.cancellation_signal, ready);
          session = actual.session;
          trace = actual.trace;
          turns = { checked: actual.checkedTurn, summary: actual.summaryTurn };
        }
        observedSession = session;
        const host = { ref_version: "external_ref.v0.1" as const, ref_type: "native_host_session",
          external_id: session, trust_class: "host_attestation" as const, observed_at: now(), compatibility_namespace: version };
        const coverage = trace.filter((key): key is Disposition => Object.hasOwn(dispositions, key)).map(key =>
          observedNativeHostTransportCoverageV01(request.request_id, { capability: "pi_intervention_" + key,
            source_ref: host, notes: [dispositions[key]] }, "retain_on_settled_cancellation"));
        if (portable) {
          const sample = { capability: "portable_witness", source_ref: { ...host }, notes: ["Synthetic transport control."] };
          coverage.push(observedNativeHostTransportCoverageV01(request.request_id, sample, "retain_on_settled_cancellation"),
            { ...observedNativeHostTransportCoverageV01(request.request_id, { ...sample, capability: "serialized_claim" }, "retain_on_settled_cancellation") },
            observedNativeHostTransportCoverageV01("different-request", { ...sample, capability: "other_request" }, "retain_on_settled_cancellation"),
            observedNativeHostTransportCoverageV01(request.request_id, { ...sample, capability: "ordinary_witness" }));
          sample.notes[0] = "Changed after the observation.";
          sample.source_ref.external_id = "changed-session";
        }
        return {
          result_version: NATIVE_HOST_RESULT_VERSION_V01, request_id: request.request_id,
          run_id: scenario === "wrong_envelope" ? "other-run" : request.run_id,
          adapter_version: version, capability_version: version, started_at: now(), finished_at: now(),
          outcome: cancel ? "cancelled" : "blocked", public_stop_reason: cancel ? "pi_fixture_cancelled" : "pi_fixture_only",
          summary: "The isolated fixture did not dispatch the project packet.", host_refs: [host],
          artifacts: [], changed_files: [], commands: [], observed_actions: [], checks: [], skipped_checks: [],
          model_invocation_receipt_refs: [], uncertainty: [], gaps: [], proposed_next_steps: [], capability_coverage: coverage,
          adapter_extension: { adapter_kind: "pi_rpc_fixture", extension_version: version,
            bounded_metadata: { packet_delivery_initiated: false } },
        };
      }
      const result = run();
      result.catch(error => { workerError = error; });
      const settled = result.then(() => {});
      return { result, settled, request_stop: () => settled };
    },
  };
  const service = new LiveNativeHostRunServiceV01({ adapter_factory: () => adapter, now,
    timeout_ms: 25_000, stop_settle_timeout_ms: 3_000 });
  let receiptId: string;
  try {
    const start = await service.start({ config, mode: "interactive", operator_mutation: { credential: input.credential, clock: { now } } });
    let current = start.projection;
    const end = performance.now() + 30_000;
    while (!current.receipt) {
      if (workerError) throw workerError;
      assert(performance.now() < end && !current.reconciliation_required, "Pi intervention did not settle");
      if (cancelRequested && !cancelSent) {
        await service.cancel({ config, run_ref: current.run_ref!, control_revision: current.control_revision,
          credential: input.readCredential(start.session_admission!.cookie_value), clock: { now } });
        cancelSent = true;
      }
      await delay(10);
      current = service.read(config);
    }
    if (workerError) throw workerError;
    assert.equal(cancelSent, cancel);
    receiptId = current.receipt.receipt_ref;
  } finally { await service.shutdown(); }

  const detail = await reopenResult(config, receiptId, input.credential.session_id);
  assert.equal(detail.summary.outcome, cancel ? "cancelled" : "blocked");
  assert.equal(detail.privacy_egress.egress_status, "did_not_occur");
  assert.equal(detail.skipped_checks.some(c => c.check_id === "validated_packet_delivery"), true);
  const recorded = detail.capability_coverage.filter(row =>
    row.capability.startsWith("pi_intervention_") || ["portable_witness", "serialized_claim", "other_request", "ordinary_witness"].includes(row.capability));
  assert(recorded.every(row => row.coverage_level === "observed" && row.source_ref?.external_id === observedSession));
  const expected = {
    baseline: ["pi_intervention_inspect_file"],
    finish: ["pi_intervention_inspect_file", "pi_intervention_reread_file", "pi_intervention_summarized"],
    cancel: ["pi_intervention_inspect_file", "pi_intervention_reread_file", "pi_intervention_follow_up_recovered"],
    witness_control: ["portable_witness"], wrong_envelope: [],
  }[scenario];
  assert.deepEqual(recorded.map(row => row.capability).sort(), expected.slice().sort(),
    "fresh receipt must distinguish applied, recovered and unobserved instructions: " + scenario);
  if (scenario === "witness_control") assert(recorded[0]!.notes.includes("Synthetic transport control."));
  assert(!JSON.stringify(detail).includes("After this work, summarize"));
  console.log(JSON.stringify({ test: "pi-intervention", scenario, real_pi: !portable, trace, turns,
    receipt_outcome: detail.summary.outcome, fresh_http_status: 200, fresh_readback: recorded.map(row => row.capability) }));
}
