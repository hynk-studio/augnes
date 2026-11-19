import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { CODEX_APP_SERVER_ADAPTER_VERSION_V01 } from "../lib/vnext/native-host/codex-app-server-adapter";
import { createDeterministicCodexAdapterV01 } from "../lib/vnext/native-host/deterministic-codex-adapter";
import { deriveContextUseReviewPresentationProvenanceV01 } from "../lib/vnext/context-use-review";
import { runDirectNativeHostRoundTripV01 } from "../lib/vnext/runtime/direct-native-host-round-trip";
import type { VNextLocalOperatorPilotConfigV01 } from "../lib/vnext/runtime/local-operator-session";
import { readProjectRunResultDetailV01, readProjectRunResultSourceBindingV01 } from "../lib/vnext/runtime/project-run-result-read-model";
import type { NativeHostAdapterV01, NativeHostResultV01 } from "../types/vnext/native-host-adapter";

const now = () => "2026-08-01T00:00:05.000Z";
type Scenario = "managed" | "renamed" | "local" | "undelivered" | "unconnected" | "missing-destination" | "legacy-delivery" | "no-reporter" | "wrong-version" | "wrong-capability" | "rejected";

function reportingAdapter(scenario: Scenario): NativeHostAdapterV01 {
  const local = createDeterministicCodexAdapterV01({ now });
  const managed = scenario !== "local";
  const adapterVersion = scenario === "legacy-delivery" ? CODEX_APP_SERVER_ADAPTER_VERSION_V01 : "fixture_receipt_adapter.v1";
  return {
    ...local,
    adapter_version: adapterVersion,
    execution_profile: managed ? "native_host_managed_model" : "deterministic_zero_model",
    provider_egress: managed ? "native_host_managed" : "forbidden",
    invoke(request, control) {
      if (scenario === "rejected") throw new Error("Fixture did not start");
      const invocation = local.invoke(request, control);
      const result = invocation.result.then((base): NativeHostResultV01 => {
        const host = { ...base.host_refs[0]!, ref_type: "native_host_session", external_id: "fixture-session" };
        if (scenario === "missing-destination" || scenario === "legacy-delivery" || scenario === "unconnected") {
          return {
            ...base, adapter_version: adapterVersion, outcome: "unavailable", public_stop_reason: "fixture_unavailable",
            host_refs: [], commands: [], changed_files: [], artifacts: [],
            checks: scenario === "legacy-delivery"
              ? [{ check_id: "validated_packet_delivery", required: true, status: "passed", summary: "Legacy transport acknowledgement." }]
              : [],
            observed_actions: [], skipped_checks: [], capability_coverage: [],
            adapter_extension: { ...base.adapter_extension, bounded_metadata: { packet_delivery_initiated: scenario === "missing-destination" } },
          };
        }
        return {
          ...base,
          adapter_version: scenario === "wrong-version" ? "different_adapter.v1" : adapterVersion,
          capability_version: scenario === "wrong-capability" ? "different_capability.v1" : local.capability_version,
          host_refs: scenario === "no-reporter" ? [] : [host, {
            ...host, ref_type: " native_host_adapter_version ", external_id: "aaa-reported-version",
          }, {
            ...host, ref_type: "native_host_capability_version", external_id: "aaa-reported-capability",
          }],
          adapter_extension: {
            ...base.adapter_extension,
            adapter_kind: scenario === "local" || scenario === "renamed" ? "codex_app_server" : "alternate_host",
            bounded_metadata: { packet_delivery_initiated: managed && scenario !== "undelivered" },
          },
          observed_actions: ["inspected_fixture"],
          commands: [{ command_id: "fixture-command", summary: "Inspected fixture.", command_fingerprint: null,
            started_at: now(), finished_at: now(), exit_code: 0, status: "completed" }],
          changed_files: [{ repository_relative_path: "edited.txt", change_kind: "modified", before_hash: null, after_hash: null }],
          artifacts: [{ artifact_ref: { ...host, ref_type: "repository_relative_artifact", external_id: "report.txt" }, summary: "Fixture report." }],
          checks: [
            { check_id: "fixture-check", required: false, status: "passed", summary: "Fixture check passed." },
            ...base.checks,
          ],
          skipped_checks: [{ check_id: "host-skip", required: false, reason: "Reporter omitted the optional check." }],
          capability_coverage: [{ capability: "fixture-work", coverage: "enforced", source_ref: host, notes: ["Reporter declaration."] }],
        };
      });
      return { ...invocation, result };
    },
  };
}

export async function assertReceiptProvenance(seed: Buffer, config: VNextLocalOperatorPilotConfigV01, directory: string) {
  for (const scenario of ["managed", "renamed", "local", "undelivered", "unconnected", "missing-destination", "legacy-delivery", "no-reporter", "wrong-version", "wrong-capability", "rejected"] as const) {
    const databasePath = path.join(directory, `receipt-${scenario}.db`);
    writeFileSync(databasePath, seed);
    const scope = { ...config, database_path: databasePath };
    const db = new Database(databasePath);
    let receiptId: string;
    try {
      const run = await runDirectNativeHostRoundTripV01(db, { config: scope, mode: "interactive" }, { adapter: reportingAdapter(scenario), now });
      receiptId = run.receipt.receipt_id;
    } finally { db.close(); }

    const reader = new Database(databasePath, { readonly: true });
    try {
      const selection = { ...scope, receipt_id: receiptId };
      const { receipt } = readProjectRunResultSourceBindingV01(reader, selection);
      const detail = readProjectRunResultDetailV01(reader, selection);
      const adapter = reportingAdapter(scenario);
      assert.equal(detail.identity.adapter_ref?.external_id, adapter.adapter_version);
      assert.equal(detail.identity.capability_ref?.external_id, adapter.capability_version);
      assert.equal(receipt.external_refs.filter(ref => ref.ref_type === "native_host_adapter_version").length, 1);
      assert.equal(receipt.external_refs.filter(ref => ref.ref_type === "native_host_capability_version").length, 1);
      if (scenario === "unconnected") {
        assert.equal(receipt.result_summary.outcome, "unavailable");
        assert.equal(receipt.host_ref, null);
        assert.equal(receipt.privacy_egress.egress_status, "did_not_occur");
        assert(receipt.observations.some(o => o.observation_kind === "structured_host_result_received"));
        continue;
      }
      if (["rejected", "wrong-version", "wrong-capability", "no-reporter", "missing-destination", "legacy-delivery"].includes(scenario)) {
        const reason = scenario === "rejected" ? "native_host_adapter_failed"
          : scenario === "wrong-version" || scenario === "wrong-capability" ? "native_host_result_adapter_binding_mismatch"
          : "native_host_task_report_source_missing";
        assert(receipt.blockers.some(blocker => blocker.code === reason), scenario);
        assert(receipt.observations.some(o => o.observation_kind === "local_terminal_result_constructed"));
        assert(!receipt.observations.some(o => o.observation_kind === "structured_host_result_received"));
        assert.equal(receipt.privacy_egress.egress_status, scenario === "rejected" ? "did_not_occur" : "occurred");
        if (scenario === "missing-destination" || scenario === "legacy-delivery") assert(receipt.privacy_egress.destination_refs.length > 0);
        assert.equal(receipt.execution.status, "failed", scenario);
        assert.equal(receipt.execution.basis, "observed");
        assert.deepEqual(detail.actions.map(a => [a.summary, a.basis]), [["host_boundary_terminal_control_applied", "observed"]]);
        assert.deepEqual(detail.commands, []);
        assert.equal(receipt.skipped_checks.every(check => check.basis === "observed"), true);
        assert.equal(receipt.verification.required_check_ids.includes("validated_packet_delivery"), true);
        continue;
      }
      assert(receipt.observations.some(o => o.observation_kind === "structured_host_result_received"));
      const local = scenario === "local";
      const basis = local ? "observed" : "attested";
      assert.equal(receipt.host_ref?.external_id, "fixture-session");
      assert.equal(detail.commands[0]?.basis, basis, `${scenario} command source`);
      assert.deepEqual(detail.actions.map(a => [a.summary, a.basis]), [["inspected_fixture", local ? "observed" : "host_attested"]]);
      assert.equal(detail.artifacts.length, 2);
      assert(detail.artifacts.every(a => a.basis === basis && a.artifact_ref.trust_class === (local ? "direct_local_observation" : "host_attestation")));
      assert.equal(detail.checks.find(c => c.check_id === "fixture-check")?.basis, basis);
      assert.equal(detail.checks.find(c => c.check_id === "deterministic_packet_delivery")?.basis, basis);
      assert.equal(detail.skipped_checks.find(c => c.check_id === "host-skip")?.basis, basis);
      assert.equal(receipt.capability_coverage.find(c => c.capability === "fixture-work")?.coverage_level, local ? "enforced" : "advisory");
      assert.equal(receipt.execution.basis, local ? "observed" : "mixed");
      assert.equal(receipt.verification.basis, local ? "observed" : "mixed");
      assert(receipt.verification.required_check_ids.includes(local ? "deterministic_packet_delivery" : "validated_packet_delivery"));
      assert(!receipt.verification.required_check_ids.includes(local ? "validated_packet_delivery" : "deterministic_packet_delivery"));
      const binding = receipt.observations.find(o => o.observation_kind === "validated_packet_and_root_binding")!;
      assert.equal(binding.trust_class, "direct_local_observation");
      assert.equal(binding.related_check_ids.includes("deterministic_packet_delivery"), local);
      if (scenario === "undelivered") {
        assert.equal(detail.skipped_checks.find(c => c.check_id === "validated_packet_delivery")?.basis, "observed");
        assert.equal(deriveContextUseReviewPresentationProvenanceV01(receipt).provenance.basis, "host_attestation");
        assert.equal(receipt.privacy_egress.egress_status, "did_not_occur");
      } else {
        assert.equal(detail.checks.find(c => c.check_id === "validated_packet_delivery")?.basis, "observed");
        assert.equal(receipt.privacy_egress.egress_status, local ? "did_not_occur" : "occurred");
      }
    } finally { reader.close(); }
  }
  const db = new Database(seed);
  try {
    const adapter = reportingAdapter("managed");
    for (const profile of ["deterministic_zero_model", undefined] as const) {
      let invoked = false;
      await assert.rejects(runDirectNativeHostRoundTripV01(db, { config, mode: "interactive" }, {
        now, adapter: { ...adapter, execution_profile: profile, invoke() { invoked = true; throw new Error(); } } as NativeHostAdapterV01,
      }), /native_host_delivery_contract_inconsistent/);
      assert.equal(invoked, false);
      assert.equal(db.prepare("SELECT count(*) FROM autonomy_runs").pluck().get(), 0);
    }
  } finally { db.close(); }
}
