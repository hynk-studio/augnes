import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type Database from "better-sqlite3";
import { POST as piPatch } from "../app/api/vnext/operator/pi-file-patch/route";
import { POST as resultWork } from "../app/api/vnext/operator/project-continuity/route";
import { GET as readResult } from "../app/api/vnext/operator/run-results/route";
import { selectedWorkSourceInput } from "../lib/intake/selected-work-source-comparison";
import { createCodexAppServerAdapterV01 } from "../lib/vnext/native-host/codex-app-server-adapter";
import { runDirectNativeHostRoundTripV01 } from "../lib/vnext/runtime/direct-native-host-round-trip";
import {
  consumeVNextLocalOperatorBootstrapV01, issueVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01,
  VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01, type VNextLocalOperatorPilotConfigV01,
} from "../lib/vnext/runtime/local-operator-session";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization";
import { readProjectRunResultSourceBindingV01 } from "../lib/vnext/runtime/project-run-result-read-model";
import type { DefineInitialProjectWorkRequestV01 } from "../types/vnext/project-work-initialization";
import type { ProjectRunResultDetailV01 } from "../types/vnext/project-run-result";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";

const host = "127.0.0.1:3000";
const origin = "http://" + host;
const operatorRoot = origin + "/api/vnext/operator/";
const fileName = "codex-notes.txt";
const sha256 = (bytes: Buffer) => "sha256:" + createHash("sha256").update(bytes).digest("hex");

function startSession(db: Database.Database, config: VNextLocalOperatorPilotConfigV01) {
  const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config });
  return consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: bootstrap.bootstrap_token });
}

export async function assertPiSuccessorChecks(
  { db, config, root }: { db: Database.Database; config: VNextLocalOperatorPilotConfigV01; root: string },
  work: DefineInitialProjectWorkRequestV01, scenario: "available" | "other_check" | "omitted_report", executable?: string,
) {
  const home = root + "-scripted-codex-home";
  mkdirSync(home);
  const networkFile = path.join(home, "network-count");
  const cleanupFile = path.join(home, "settled");
  const environment = {
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: config.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: config.project_id, AUGNES_VNEXT_OPERATOR_ID: config.operator_id,
    AUGNES_DB_PATH: config.database_path, AUGNES_PI_OFFLINE_EXECUTABLE: executable ?? "",
  };
  const previous = Object.keys(environment).map(key => [key, process.env[key]] as const);
  const network = installZeroNetworkGuard();
  try {
    Object.assign(process.env, environment);
    const author = startSession(db, config);
    const defined = defineInitialProjectWorkV01(db, { config, credential: author.credential, request: work });
    const credential = readVNextLocalOperatorCredentialFromRequestV01(new Request(operatorRoot + "host-round-trip", {
      headers: { cookie: VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "=" + defined.session_admission.cookie_value },
    }));
    const first = await runDirectNativeHostRoundTripV01(db, {
      config, mode: "interactive", operator_mutation: { credential },
    }, {
      adapter: createCodexAppServerAdapterV01({ launch: {
        command: process.execPath, prefix_args: [path.resolve("scripts/fixtures/fake-codex-app-server.mjs")],
        environment: { NODE_ENV: "test", HOME: home, CODEX_HOME: home, TMPDIR: home, PATH: process.env.PATH,
          FAKE_CODEX_SCENARIO: "pi_file_successor", FAKE_CODEX_RESULT_CASE: scenario,
          FAKE_CODEX_NETWORK_COUNT_PATH: networkFile, FAKE_CODEX_CLEANUP_MARKER_PATH: cleanupFile },
      } }),
      lifecycle_mode: "managed_live", live_host_egress_authorized: true, timeout_ms: 10_000, stop_settle_timeout_ms: 3_000,
    });
    assert.equal(first.receipt.execution.status, "completed", first.host_result?.public_stop_reason ?? undefined);
    assert.equal(readFileSync(networkFile, "utf8"), "0\n");
    assert.equal(readFileSync(cleanupFile, "utf8"), "settled\n");
    const sourcePath = path.join(root, fileName);
    const original = readFileSync(sourcePath);
    assert(original.length && original.at(-1) !== 10);
    assert.deepEqual(first.receipt.changed_artifacts.map(a => [a.artifact_ref.external_id, a.after_hash, a.basis]),
      [[fileName, sha256(original), "attested"]]);
    assert(first.receipt.checks.some(c => c.check_id === "written_content" && c.status === "passed" && c.basis === "attested"));
    const openCheck = scenario === "other_check" ? "line_width" : "final_newline";
    assert(first.receipt.skipped_checks.some(c => c.check_id === openCheck && c.required && c.basis === "attested"));
    assert(first.session_admission);
    let cookie = VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "=" + first.session_admission.cookie_value;
    async function post(route: "project-continuity" | "pi-file-patch", body: object) {
      const handler = route === "project-continuity" ? resultWork : piPatch;
      const response = await handler(new Request(operatorRoot + route, {
        method: "POST", headers: { host, origin, cookie, "content-type": "application/json" }, body: JSON.stringify(body),
      }));
      const setCookie = response.headers.getSetCookie().find(v => v.startsWith(VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "="));
      if (setCookie) cookie = setCookie.split(";")[0]!;
      const text = await response.text();
      assert(!text.includes(original.toString("utf8")), "the route exposed the predecessor file contents");
      return { status: response.status, data: JSON.parse(text) };
    }
    async function prepareWork(body: object) {
      const { status, data } = await post("project-continuity", body);
      assert.equal(data.ok, true, "result-work " + status + " " + (data.error_code ?? data.error));
      return data;
    }
    const receiptId = first.receipt.receipt_id;
    const basis = { receipt_id: receiptId, receipt_fingerprint: first.receipt.integrity.fingerprint, check_id: "final_newline" };
    const runs = db.prepare("SELECT run_id FROM autonomy_runs WHERE scope = ? ORDER BY run_id").pluck().bind(config.project_id);
    const receipts = db.prepare("SELECT count(*) FROM vnext_core_records WHERE project_id = ? AND record_kind = 'run_receipt'").pluck().bind(config.project_id);
    const preview = { action: "preview", source: "predecessor" };
    async function mustRefuse(body: object, reason: string, expectedStatus?: number) {
      const { data, status } = await post("pi-file-patch", body);
      assert(status >= 400 && status < 500 && data.ok === false, "expected admission refusal, received " + status);
      assert.equal(data.error_code, reason);
      if (expectedStatus) assert.equal(status, expectedStatus);
      assert.deepEqual(runs.all(), [first.run_id], "a refused successor reserved a run");
      assert.equal(receipts.get(), 1, "a refused successor produced a receipt");
    }
    await mustRefuse(preview, "pi_patch_predecessor_ineligible");
    const prep = await prepareWork({ action: "read_result_work_preparation", receipt_id: receiptId });
    assert(prep.result_source);
    const note = selectedWorkSourceInput(prep.result_source);
    assert.equal(note.source, receiptId + " " + basis.receipt_fingerprint);
    const retained = scenario === "omitted_report" ? { ...note, source: "Transcribed note from another source" } : note;
    const { comparison } = await prepareWork({ action: "compare_result_work_sources", binding: prep.binding, notes: [retained] });
    const definition = { goal: "Prepare the missing newline patch on the reported text file.",
      success_criteria: ["Recover the checked patch.", "Review the note's wording separately."], non_goals: [] };
    const successor = await prepareWork({ action: "preview_result_work", binding: prep.binding, definition,
      selected_sources: { selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint, omitted_sources: [] } });
    const saved = await prepareWork({ action: "prepare_result_work", request: successor.request });
    assert.equal(saved.execution_authority_granted, false);
    assert.notEqual(saved.packet_id, defined.packet.packet_id);
    assert.deepEqual(runs.all(), [first.run_id]);
    if (scenario !== "available") {
      await mustRefuse(preview, "pi_patch_predecessor_ineligible");
      assert.deepEqual(readFileSync(sourcePath), original);
      return;
    }

    const { status, data } = await post("pi-file-patch", preview);
    assert.equal(status, 200, data.error_code);
    assert.deepEqual(data.predecessor, basis);
    assert.equal(data.selection.path, fileName);
    assert.equal(data.selection.before_sha256, sha256(original));
    assert(data.binding);
    const prepare = { action: "prepare", source: "predecessor", binding: data.binding };
    const manual = await post("pi-file-patch", { action: "preview", path: fileName });
    assert.equal(manual.status, 200, manual.data.error_code);
    assert.notEqual(manual.data.binding, data.binding);
    await mustRefuse({ ...prepare, binding: manual.data.binding }, "pi_patch_approval_mismatch");
    const decoy = path.join(root, "another.txt");
    copyFileSync(sourcePath, decoy);
    await mustRefuse({ ...prepare, path: path.basename(decoy) }, "pi_patch_request_invalid");
    await mustRefuse({ ...prepare, receipt_id: receiptId }, "pi_patch_request_invalid");
    const moved = path.join(root, "moved.txt");
    renameSync(sourcePath, moved);
    await mustRefuse(prepare, "pi_patch_source_unavailable"); // Identical bytes still exist at other paths.
    renameSync(moved, sourcePath);
    const revised = Buffer.from(original);
    revised[0] ^= 1;
    writeFileSync(sourcePath, revised);
    await mustRefuse(prepare, "pi_patch_predecessor_bytes_changed");
    assert.deepEqual(readFileSync(sourcePath), revised, "stale approval changed the intervening edit");
    writeFileSync(sourcePath, original);
    const filesBefore = readdirSync(root).sort();
    async function revise(packet: { packet_id: string; packet_fingerprint: string }, non_goals: string[]) {
      const revision = await prepareWork({ action: "revise_pre_execution_project_work", workspace_id: config.workspace_id,
        project_id: config.project_id, expected_active_project_id: config.project_id,
        expected_active_selection_revision: prep.binding.expected_active_selection_revision,
        expected_project_work_binding: prep.binding.expected_project_work_binding,
        expected_current_packet_id: packet.packet_id, expected_current_packet_fingerprint: packet.packet_fingerprint,
        expected_current_lineage_kind: "authored_successor_task", ...definition, non_goals });
      assert.deepEqual(revision.work_initialization.selected_source_context, [prep.result_source]);
      return revision.work_initialization.current_packet;
    }
    const restricted = await revise(saved, ["Do not prepare a newline patch."]);
    await mustRefuse({ action: "preview", path: fileName }, "pi_patch_work_scope_unsupported", 403);
    await mustRefuse(preview, "pi_patch_work_scope_unsupported", 403);
    await mustRefuse(prepare, "pi_patch_work_scope_unsupported", 403);
    const current = await revise(restricted, []);
    const renewed = await post("pi-file-patch", preview);
    assert.equal(renewed.status, 200, renewed.data.error_code);
    assert.deepEqual(renewed.data.predecessor, basis);
    assert.notEqual(renewed.data.binding, data.binding);
    await mustRefuse(prepare, "pi_patch_approval_mismatch");
    if (executable) {
      const prepared = await post("pi-file-patch", { ...prepare, binding: renewed.data.binding });
      assert.equal(prepared.status, 201, prepared.data.error_code);
      assert.notEqual(prepared.data.receipt_id, receiptId);
      const fresh = startSession(db, config);
      assert.notEqual(fresh.session.session_id, author.session.session_id);
      const readback = await readResult(new Request(operatorRoot + "run-results?receipt_ref=" + encodeURIComponent(prepared.data.receipt_id), {
        headers: { host, cookie: VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "=" + fresh.cookie_value },
      }));
      const body = await readback.json();
      assert.equal(readback.status, 200, body.error_code);
      const result: ProjectRunResultDetailV01 = body.result;
      assert.equal(result.summary.outcome, "completed", result.blockers.map(b => b.code).join(", "));
      assert.equal(result.identity.packet_ref?.external_id, current.packet_id);
      assert.notEqual(result.identity.run_ref, first.run_id);
      assert.equal(result.summary.verification_status, "partial");
      assert(result.skipped_checks.some(c => c.check_id === "criterion_2" && c.required));
      assert(result.checks.some(c => c.check_id === "pi_staged_file_check" && c.status === "passed" && c.basis === "attested"));
      assert(result.checks.some(c => c.check_id === "pi_output_bytes" && c.status === "passed" && c.basis === "observed"));
      const artifact = result.artifacts.find(a => a.artifact_ref.ref_type === "checked_file_patch");
      assert(artifact?.summary && artifact.basis === "observed");
      const patch = JSON.parse(artifact.summary);
      assert.deepEqual(patch.predecessor, basis);
      assert.equal(patch.path, fileName);
      assert.equal(patch.before_sha256, sha256(original));
      assert.equal(patch.offset, original.length);
      assert.equal(patch.append_hex, "0a");
      assert.equal(patch.after_sha256, sha256(Buffer.concat([original, Buffer.from([10])])));
      assert.deepEqual(result.model_invocations.map(i => i.state), ["none"]);
      assert.equal(receipts.get(), 2);
      assert.deepEqual(readProjectRunResultSourceBindingV01(db, { ...config, receipt_id: receiptId }).receipt, first.receipt);
    }
    assert.deepEqual(readdirSync(root).sort(), filesBefore);
    assert.deepEqual(readFileSync(sourcePath), original);
    assert.deepEqual(readFileSync(decoy), original);
  } finally {
    network.restore();
    for (const [key, old] of previous) {
      if (old === undefined) delete process.env[key]; else process.env[key] = old;
    }
    assert.equal(network.attempts.length, 0);
  }
}
