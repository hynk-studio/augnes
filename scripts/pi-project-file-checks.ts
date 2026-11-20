import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { POST } from "../app/api/vnext/operator/pi-file-patch/route";
import { GET as readRunResult } from "../app/api/vnext/operator/run-results/route";
import { createPiFilePatchAdapter, PI_FILE_PATCH_TIMEOUT } from "../lib/vnext/native-host/pi-file-patch-adapter";
import { runDirectNativeHostRoundTripV01 } from "../lib/vnext/runtime/direct-native-host-round-trip";
import {
  consumeVNextLocalOperatorBootstrapV01, issueVNextLocalOperatorBootstrapV01,
  VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01, type VNextLocalOperatorPilotConfigV01,
} from "../lib/vnext/runtime/local-operator-session";
import { readProjectRunResultSourceBindingV01 } from "../lib/vnext/runtime/project-run-result-read-model";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization";
import { readProjectWorkBindingV01 } from "../lib/vnext/runtime/project-work-binding";
import type { ProjectRunResultDetailV01 } from "../types/vnext/project-run-result";
import type { DefineInitialProjectWorkRequestV01 } from "../types/vnext/project-work-initialization";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";

const host = "127.0.0.1:3000";
const origin = `http://${host}`;
const fileName = "notes.txt";
const credentialShapedName = "sk-" + "x".repeat(24) + ".txt";
const privateMarker = "sandpiper-local-fixture";
const original = Buffer.from(`Café follow-up for ${privateMarker}`, "utf8");
const digest = (bytes: Buffer) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

function startSession(db: Database.Database, config: VNextLocalOperatorPilotConfigV01) {
  const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config });
  return consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: bootstrap.bootstrap_token });
}

function assertCheckedPatch(detail: ProjectRunResultDetailV01, file: string) {
  assert.equal(detail.summary.outcome, "completed", detail.blockers.map(entry => entry.code).join(", "));
  for (const [id, basis] of [["pi_staged_file_check", "attested"], ["pi_output_bytes", "observed"]]) {
    const check = detail.checks.find(entry => entry.check_id === id);
    assert(check, `missing check ${id}`);
    assert.equal(check.status, "passed");
    assert.equal(check.basis, basis);
  }
  const artifact = detail.artifacts.find(entry => entry.artifact_ref.ref_type === "checked_file_patch");
  assert(artifact?.summary, "the persisted result must supply a recoverable patch");
  assert.equal(artifact.basis, "observed");
  assert.equal(artifact.change_kind, null);
  const patch = JSON.parse(artifact.summary);
  assert.equal(patch.path, fileName);
  assert.equal(patch.offset, original.byteLength);
  assert.equal(patch.append_hex, "0a");
  const unchanged = readFileSync(file);
  assert.deepEqual(unchanged, original);
  assert.equal(patch.before_sha256, digest(unchanged));
  const recovered = Buffer.concat([unchanged, Buffer.from(patch.append_hex, "hex")]);
  assert.deepEqual(recovered, Buffer.concat([original, Buffer.from([0x0a])]));
  assert.equal(patch.after_sha256, digest(recovered));
}

export async function assertPiProjectFileChecks(
  { db, root, config }: { db: Database.Database; root: string; config: VNextLocalOperatorPilotConfigV01 },
  work: DefineInitialProjectWorkRequestV01,
  executable?: string,
): Promise<void> {
  const file = path.join(root, fileName);
  const otherFile = "other.txt";
  writeFileSync(file, original, { flag: "wx" });
  writeFileSync(path.join(root, otherFile), original, { flag: "wx" });
  writeFileSync(path.join(root, credentialShapedName), original, { flag: "wx" });
  const filesBefore = readdirSync(root).sort();
  const operator = startSession(db, config);
  const defined = defineInitialProjectWorkV01(db, { config, credential: operator.credential, request: work });
  const operatorCookie = { value: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${defined.session_admission.cookie_value}` };
  const countReceipts = db.prepare(`SELECT count(*) FROM vnext_core_records
    WHERE workspace_id = ? AND project_id = ? AND record_kind = 'run_receipt'`).pluck().bind(config.workspace_id, config.project_id);
  const claims = db.prepare(`SELECT run_id, status, json_extract(metadata_json, '$.adapter_execution_profile') AS profile
    FROM autonomy_runs WHERE scope = ? ORDER BY run_id`).bind(config.project_id);
  const environment = {
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: config.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: config.project_id, AUGNES_VNEXT_OPERATOR_ID: config.operator_id,
    AUGNES_DB_PATH: config.database_path, AUGNES_PI_OFFLINE_EXECUTABLE: path.join(root, "absent-pi"),
  };
  const previous = Object.keys(environment).map(key => [key, process.env[key]] as const);
  const network = installZeroNetworkGuard();
  async function post(body: object, session: { value: string } | null = operatorCookie) {
    const response = await POST(new Request(origin + "/api/vnext/operator/pi-file-patch", {
      method: "POST", headers: { host, origin, "content-type": "application/json", ...(session ? { cookie: session.value } : {}) },
      body: JSON.stringify(body),
    }));
    const setCookie = response.headers.getSetCookie().find(value => value.startsWith(VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "="));
    if (session && setCookie) session.value = setCookie.split(";")[0];
    const text = await response.text();
    assert(!text.includes(privateMarker), "a route response disclosed raw project text");
    assert(!text.includes(credentialShapedName), "a route response disclosed the refused filename");
    return { status: response.status, data: JSON.parse(text) };
  }
  async function refused(body: object, expectedStatus: number, errorCode: string, session: { value: string } | null = operatorCookie) {
    const { status, data } = await post(body, session);
    assert.equal(status, expectedStatus, data.error_code);
    assert.equal(data.ok, false);
    assert.equal(data.error_code, errorCode);
    assert.equal(countReceipts.get(), 0, "refused preparation wrote a receipt");
    assert.deepEqual(claims.all(), [], "refused preparation claimed a run");
  }
  async function preview(selectedPath: string, session = operatorCookie) {
    const { status, data } = await post({ action: "preview", path: selectedPath }, session);
    assert.equal(status, 200, data.error_code);
    assert.equal(data.ok, true);
    assert(data.binding);
    assert.equal(data.selection.path, selectedPath);
    assert.equal(data.selection.before_sha256, digest(original));
    return data.binding;
  }
  try {
    Object.assign(process.env, environment);
    const prepare = { action: "prepare", path: fileName };
    const binding = await preview(fileName);
    await refused({ action: "preview", path: credentialShapedName }, 400, "pi_patch_text_path_required");
    await refused({ ...prepare, binding }, 401, "operator_session_cookie_missing", null);
    await refused(prepare, 400, "pi_patch_request_invalid");
    const wrongPathBinding = await preview(otherFile);
    assert.notDeepEqual(wrongPathBinding, binding, "equal bytes in different files must bind the selected path");
    await refused({ ...prepare, binding: wrongPathBinding }, 409, "pi_patch_approval_mismatch");
    const edited = Buffer.concat([original.subarray(0, -1), Buffer.from("!")]);
    writeFileSync(file, edited);
    await refused({ ...prepare, binding }, 409, "pi_patch_approval_mismatch");
    assert.deepEqual(readFileSync(file), edited, "a stale selection must preserve the intervening edit");
    writeFileSync(file, original);

    if (executable) {
      process.env.AUGNES_PI_OFFLINE_EXECUTABLE = executable;
      const request = { ...prepare, binding: await preview(fileName) };
      const peer = startSession(db, config);
      assert.notEqual(peer.session.session_id, operator.session.session_id);
      const peerCookie = { value: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${peer.cookie_value}` };
      const peerBinding = await preview(otherFile, peerCookie);
      const whileClaimed: unknown[] = [];
      const first = await runDirectNativeHostRoundTripV01(db, {
        config, mode: "interactive", operator_mutation: { credential: peer.credential },
      }, {
        adapter: createPiFilePatchAdapter({ executable, selectedPath: otherFile, approvedBinding: peerBinding,
          assertCurrent() {
            const workBinding = readProjectWorkBindingV01(db, config);
            assert(workBinding);
            return workBinding;
          },
        }),
        resolve_packet_selection: () => ({ packet_id: defined.packet.packet_id, packet_fingerprint: defined.packet.integrity.fingerprint }),
        timeout_ms: PI_FILE_PATCH_TIMEOUT, stop_settle_timeout_ms: 3_000,
        // The first transaction has committed. The second route opens its own database connection.
        async before_adapter_invoke() {
          const before = claims.all();
          const { status, data } = await post(request);
          whileClaimed.push({ before, after: claims.all(), receipts: countReceipts.get(),
            status, ok: data.ok, error: data.error_code });
        },
      });
      const activeClaim = [{ run_id: first.run_id, status: "running", profile: "offline_file_patch" }];
      assert.deepEqual(whileClaimed, [{ before: activeClaim, after: activeClaim, receipts: 0,
        status: 409, ok: false, error: "pi_patch_worker_busy" }]);
      assert.equal(first.status, "inserted");
      assert.equal(first.receipt.result_summary.outcome, "completed", first.receipt.blockers.map(b => b.code).join(", "));
      assert.deepEqual(readFileSync(path.join(root, otherFile)), original);
      assert.equal(countReceipts.get(), 1);

      const inserted = await post(request);
      assert.equal(inserted.status, 201, inserted.data.error_code);
      assert.equal(inserted.data.ok, true);
      assert.equal(inserted.data.status, "inserted");
      const receiptId = inserted.data.receipt_id;
      assert.match(receiptId, /^run-receipt:[a-f0-9]{24}$/u);
      assert.notEqual(receiptId, first.receipt.receipt_id, "distinct file approvals have distinct receipts");
      assert.deepEqual(readFileSync(file), original);
      const replay = await post(request);
      assert.equal(replay.status, 200, replay.data.error_code);
      assert.equal(replay.data.ok, true);
      assert.equal(replay.data.status, "exact_replay");
      assert.equal(replay.data.receipt_id, receiptId);
      assert.equal(countReceipts.get(), 2, "two file approvals and an exact replay must produce two receipts");

      assert(first.session_admission);
      const url = new URL("/api/vnext/operator/run-results", origin);
      url.searchParams.set("receipt_ref", receiptId);
      const response = await readRunResult(new Request(url, {
        headers: { host, cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${first.session_admission.cookie_value}` },
      }));
      const readback = await response.json();
      assert.equal(response.status, 200, readback.error_code);
      assert.equal(readback.ok, true);
      const detail: ProjectRunResultDetailV01 = readback.result;
      assert.equal(detail.project_id, config.project_id);
      assert.equal(detail.identity.receipt_ref, receiptId);
      assert.deepEqual(detail.model_invocations.map(entry => entry.state), ["none"]);
      assertCheckedPatch(detail, file);
      const fresh = new Database(config.database_path, { readonly: true, fileMustExist: true });
      try {
        const { receipt } = readProjectRunResultSourceBindingV01(fresh, { ...config, receipt_id: receiptId });
        assert.equal(detail.identity.receipt_fingerprint, receipt.integrity.fingerprint);
        assert.deepEqual(receipt.changed_artifacts, []);
        assert.deepEqual(receipt.model_invocations, []);
        assert.equal(receipt.privacy_egress.egress_status, "occurred");
        assert(receipt.host_ref);
        assert.deepEqual(receipt.privacy_egress.destination_refs, [receipt.host_ref]);
        assert.match(receipt.privacy_egress.notes.join(" "), /isolated local worker/iu);
        assert.equal(receipt.privacy_egress.raw_output_persisted, false);
        assert(!fresh.serialize().includes(Buffer.from(privateMarker)), "the canonical database retained raw selected text");
      } finally { fresh.close(); }
    }
    assert.deepEqual(readFileSync(file), original);
    assert.deepEqual(readFileSync(path.join(root, otherFile)), original);
    assert.deepEqual(readFileSync(path.join(root, credentialShapedName)), original);
    assert.deepEqual(readdirSync(root).sort(), filesBefore);
    assert.equal(network.attempts.length, 0);
    console.log(JSON.stringify({ test: "pi-project-file", binding_refusals: true, filename_refused: true,
      busy_then_prepared: Boolean(executable), unauthenticated_refused: true,
      real_pi: Boolean(executable), exact_replay: Boolean(executable), fresh_result_read: Boolean(executable) }));
  } finally {
    network.restore();
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}
