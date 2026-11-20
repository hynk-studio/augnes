import path from "node:path";
import { NextResponse } from "next/server";
import { assertPacketDirectionCurrent } from "@/lib/vnext/persistence/project-direction-store";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import { PiFilePatchError, PI_FILE_PATCH_TIMEOUT, createPiFilePatchAdapter, readPiPatchSelection } from "@/lib/vnext/native-host/pi-file-patch-adapter";
import { admitPersistedHostTaskContextPacketV01, DirectNativeHostRoundTripErrorV01, runDirectNativeHostRoundTripV01 } from "@/lib/vnext/runtime/direct-native-host-round-trip";
import {
  assertVNextLocalOperatorRequestBoundaryV01, authenticateVNextLocalOperatorCurrentCredentialV01,
  openVNextLocalOperatorDatabaseV01, readBoundedVNextLocalOperatorBodyV01, readVNextLocalOperatorCredentialFromRequestV01,
  resolveVNextLocalReviewConfigV01, serializeVNextLocalOperatorSessionCookieV01,
  type VNextLocalOperatorSessionMutationAdmissionV01, VNextLocalOperatorSessionErrorV01,
} from "@/lib/vnext/runtime/local-operator-session";
import { readProjectWorkBindingV01 } from "@/lib/vnext/runtime/project-work-binding";
import { readProjectWorkInitializationSnapshotV01 } from "@/lib/vnext/runtime/project-work-initialization";
import { readProjectRunResultDetailV01 } from "@/lib/vnext/runtime/project-run-result-read-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Local operator approval is for one exact staged patch. The executable,
 * commands, source root, output location and limits cannot be chosen by HTTP. */
export async function POST(request: Request): Promise<NextResponse> {
  let database: ReturnType<typeof openVNextLocalOperatorDatabaseV01> | undefined;
  const headers = new Headers({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" });
  try {
    const url = assertVNextLocalOperatorRequestBoundaryV01(request, { mutating: true });
    if (url.search) throw new PiFilePatchError("pi_patch_query_forbidden", 400);
    const body = await readBoundedVNextLocalOperatorBodyV01(request);
    const preview = body.action === "preview";
    const keys = preview ? ["action", "path"] : ["action", "path", "binding"];
    if ((!preview && body.action !== "prepare") || Object.keys(body).length !== keys.length ||
        !keys.every(key => Object.hasOwn(body, key)) || typeof body.path !== "string") {
      throw new PiFilePatchError("pi_patch_request_invalid", 400);
    }
    let credential = readVNextLocalOperatorCredentialFromRequestV01(request);
    const config = resolveVNextLocalReviewConfigV01({ environment: process.env, credential });
    database = openVNextLocalOperatorDatabaseV01(config);
    const db = database;
    authenticateVNextLocalOperatorCurrentCredentialV01(db, { config, credential });
    const { packet } = readProjectWorkInitializationSnapshotV01(db, config);
    const work = readProjectWorkBindingV01(db, config);
    if (!packet || !work) throw new PiFilePatchError("pi_patch_current_work_required");
    const identity = { packet_id: packet.packet_id, packet_fingerprint: packet.integrity.fingerprint };
    const admitted = await admitPersistedHostTaskContextPacketV01(db, {
      config, ...identity, evaluated_at: new Date().toISOString(), require_active_project: false,
    });
    function assertCurrent() {
      authenticateVNextLocalOperatorCurrentCredentialV01(db, { config, credential });
      const current = readProjectWorkInitializationSnapshotV01(db, config).packet;
      const currentBinding = readProjectWorkBindingV01(db, config);
      const at = new Date().toISOString();
      if (request.signal.aborted || !currentBinding || currentBinding !== work || current?.packet_id !== identity.packet_id ||
          current.integrity.fingerprint !== identity.packet_fingerprint || validateTaskContextPacketV01(current, { evaluated_at: at }).status !== "valid") {
        throw new PiFilePatchError("pi_patch_work_changed");
      }
      try { assertPacketDirectionCurrent(db, current, at); }
      catch { throw new PiFilePatchError("pi_patch_work_changed"); }
      return currentBinding;
    }
    const { selection, binding } = readPiPatchSelection(packet, admitted.root_scope, body.path, assertCurrent());
    if (preview) return NextResponse.json({ ok: true, binding, selection, ...identity,
      operation: "Append one LF to an isolated copy, check it, and return a patch. The source file is read-only.",
      project_id: config.project_id, goal: packet.task.goal }, { headers });
    if (body.binding !== binding) throw new PiFilePatchError("pi_patch_approval_mismatch");
    const executable = process.env.AUGNES_PI_OFFLINE_EXECUTABLE;
    if (process.platform !== "linux" || process.arch !== "x64" || !executable || !path.isAbsolute(executable)) {
      throw new PiFilePatchError("pi_patch_worker_unavailable", 503);
    }
    const rotate = (admission: VNextLocalOperatorSessionMutationAdmissionV01 | null) => {
      if (!admission) return;
      credential = admission.credential;
      headers.set("Set-Cookie", serializeVNextLocalOperatorSessionCookieV01({ request, value: admission.cookie_value,
        expires_at: admission.cookie_expires_at, max_age_seconds: admission.cookie_max_age_seconds, secure: url.protocol === "https:" }));
    };
    const result = await runDirectNativeHostRoundTripV01(db, { config, mode: "interactive", operator_mutation: { credential } }, {
      adapter: createPiFilePatchAdapter({ executable, selectedPath: selection.path, approvedBinding: binding, assertCurrent }),
      timeout_ms: PI_FILE_PATCH_TIMEOUT, stop_settle_timeout_ms: 3_000, cancellation_signal: request.signal,
      resolve_packet_selection: () => identity,
      on_invocation_admitted: ({ session_admission }) => rotate(session_admission),
    });
    rotate(result.session_admission);
    const receipt_id = result.receipt.receipt_id;
    return NextResponse.json({ ok: true, status: result.status, receipt_id,
      result: readProjectRunResultDetailV01(db, { ...config, receipt_id }) }, { status: result.status === "inserted" ? 201 : 200, headers });
  } catch (error) {
    const known = error instanceof PiFilePatchError || error instanceof VNextLocalOperatorSessionErrorV01 ||
      error instanceof DirectNativeHostRoundTripErrorV01;
    return NextResponse.json({ ok: false, error_code: known ? error.code : "pi_patch_unavailable" },
      { status: known ? error.status : 500, headers });
  } finally { database?.close(); }
}
