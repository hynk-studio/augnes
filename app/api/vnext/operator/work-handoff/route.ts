import { prepareMaterial } from "@/lib/vnext/runtime/stateless-source-review";
import { NextResponse } from "next/server";
import { exportWorkHandoff, previewReceivedWork } from "@/lib/vnext/runtime/work-handoff";
import { readCurrentProjectWorkPacketLineageV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import { readWorkHandoff, handoffHash, handoffCheck } from "@/lib/vnext/work-handoff";
import { defineInitialProjectWorkV01 } from "@/lib/vnext/runtime/project-work-initialization";
import { assertVNextLocalOperatorRequestBoundaryV01, readBoundedVNextLocalOperatorBodyV01, readVNextLocalOperatorCredentialFromRequestV01, resolveVNextLocalReviewConfigV01,
  openVNextLocalOperatorDatabaseV01, authenticateVNextLocalOperatorSessionV01, serializeVNextLocalOperatorSessionCookieV01, VNextLocalOperatorSessionErrorV01 } from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
export function createWorkHandoffHandler(options: { environment?: NodeJS.ProcessEnv; clock?: VNextLocalRuntimeClockV01 } = {}) {
  return async (request: Request) => {
    let db: ReturnType<typeof openVNextLocalOperatorDatabaseV01> | null = null;
    try {
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, { mutating: request.method !== "GET" });
      handoffCheck(["GET", "POST"].includes(request.method), "method_refused");
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request), config = resolveVNextLocalReviewConfigV01({ credential, environment: options.environment ?? process.env, clock: options.clock });
      db = openVNextLocalOperatorDatabaseV01(config); authenticateVNextLocalOperatorSessionV01(db, { config, credential, clock: options.clock });
      handoffCheck([...url.searchParams.keys()].join() === "project_id" && url.searchParams.get("project_id") === config.project_id, "project_mismatch");
      const at = options.clock?.now() ?? new Date().toISOString();
      if (request.method === "GET") {
        const packet = readCurrentProjectWorkPacketLineageV01(db, config)?.packet ?? null;
        return NextResponse.json({ ok: true, packet, handoff: packet ? readWorkHandoff(packet) : null }, { headers });
      }
      const body = await readBoundedVNextLocalOperatorBodyV01(request, 64_000);
      if (body.action === "verify_material") {
        handoffCheck(Object.keys(body).sort().join() === "action,expected_packet_fingerprint", "request_invalid");
        const packet = readCurrentProjectWorkPacketLineageV01(db, config)?.packet, handoff = packet ? readWorkHandoff(packet) : null;
        handoffCheck(packet && handoff && packet.integrity.fingerprint === body.expected_packet_fingerprint, "current_work_changed");
        const observed = prepareMaterial(db, config, { question: "Compare transferred historical bytes with explicitly reacquired current local material.", files: handoff.evidence.observation.sources.map(({ path, start_line, end_line }) => ({ path, start_line, end_line })) }, at).observed;
        return NextResponse.json({ ok: true, historical_observation: handoff.evidence.observation_fingerprint, current_observation: observed,
          matches_historical_material: observed.sources.length === handoff.evidence.observation.sources.length && observed.sources.every((s, i) => s.digest === handoff.evidence.observation.sources[i]!.digest && s.excerpt_digest === handoff.evidence.observation.sources[i]!.excerpt_digest), execution_authority_granted: false }, { headers });
      }
      if (body.action === "export") {
        handoffCheck(Object.keys(body).sort().join() === "action,expected" && body.expected && typeof body.expected === "object" && Object.keys(body.expected).sort().join() === "packet_fingerprint,packet_id,receipt_id", "request_invalid");
        return NextResponse.json({ ok: true, handoff: db.transaction(() => exportWorkHandoff(db!, config, body.expected as Parameters<typeof exportWorkHandoff>[2], at))() }, { headers });
      }
      if (body.action === "preview") {
        handoffCheck(Object.keys(body).sort().join() === "action,handoff", "request_invalid");
        return NextResponse.json({ ok: true, preview: db.transaction(() => previewReceivedWork(db!, config, body.handoff, at))() }, { headers });
      }
      handoffCheck(body.action === "receive" && Object.keys(body).sort().join() === "action,expected_preview,request" && handoffHash(body.request) === body.expected_preview, "preview_changed");
      const req = body.request as { handoff?: unknown; action?: string };
      handoffCheck(req?.handoff && req.action === "define_initial_project_work", "request_invalid");
      const saved = defineInitialProjectWorkV01(db, { config, credential, request: body.request, clock: options.clock });
      return NextResponse.json({ ok: true, status: saved.status, packet: saved.packet, execution_authority_granted: false }, { status: saved.status === "inserted" ? 201 : 200,
        headers: { ...headers, "Set-Cookie": serializeVNextLocalOperatorSessionCookieV01({ request, value: saved.session_admission.cookie_value, expires_at: saved.session_admission.cookie_expires_at, max_age_seconds: saved.session_admission.cookie_max_age_seconds, secure: url.protocol === "https:" }) } });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof VNextLocalOperatorSessionErrorV01 ? error.code : error instanceof Error && /^work_handoff_[a-z_]+$/.test(error.message) ? error.message : "work_handoff_refused" }, { status: error instanceof VNextLocalOperatorSessionErrorV01 ? error.status : 409, headers });
    } finally { db?.close(); }
  };
}
export const GET = createWorkHandoffHandler();
export const POST = createWorkHandoffHandler();
