import { BoundedAutomationCycleErrorV01 } from "@/lib/vnext/runtime/bounded-automation-cycle";
import { NextResponse } from "next/server";
import { ProspectiveReentryHost, prospectiveHostFingerprint } from "@/lib/vnext/runtime/prospective-reentry";
import {
  assertVNextLocalOperatorRequestBoundaryV01, readBoundedVNextLocalOperatorBodyV01,
  readVNextLocalOperatorCredentialFromRequestV01, readVNextLocalOperatorPilotConfigV01,
  serializeVNextLocalOperatorSessionCookieV01, VNextLocalOperatorSessionErrorV01,
  authenticateVNextLocalOperatorSessionV01, openVNextLocalOperatorDatabaseV01,
} from "@/lib/vnext/runtime/local-operator-session";
import { readReentry } from "@/lib/vnext/persistence/prospective-reentry-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let db: ReturnType<typeof openVNextLocalOperatorDatabaseV01> | null = null;
  try {
    const url = assertVNextLocalOperatorRequestBoundaryV01(request, { mutating: false });
    const agendaRef = url.searchParams.get("agenda_ref");
    if ([...url.searchParams.keys()].join() !== "agenda_ref" || !agendaRef || !/^sha256:[a-f0-9]{64}$/u.test(agendaRef)) throw new Error("prospective_request_invalid");
    const config = readVNextLocalOperatorPilotConfigV01(process.env);
    db = openVNextLocalOperatorDatabaseV01(config);
    authenticateVNextLocalOperatorSessionV01(db, { config, credential: readVNextLocalOperatorCredentialFromRequestV01(request) });
    return NextResponse.json({ ok: true, state: readReentry(db, { ...config, agenda_ref: agendaRef }), read_only: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof VNextLocalOperatorSessionErrorV01 ? error.code : "prospective_read_refused" }, { status: error instanceof VNextLocalOperatorSessionErrorV01 ? error.status : 409, headers: { "Cache-Control": "no-store" } });
  } finally { db?.close(); }
}

/** Explicit opt-in/cancel only. HTTP never installs or starts a host loop. */
export async function POST(request: Request) {
  let host: ProspectiveReentryHost | null = null;
  try {
    const url = assertVNextLocalOperatorRequestBoundaryV01(request, { mutating: true });
    if (url.search || process.env.AUGNES_VNEXT_OPERATOR_PILOT_ENABLED !== "1" || process.platform !== "darwin" || process.arch !== "arm64") throw new Error("prospective_qualified_local_route_required");
    const body = await readBoundedVNextLocalOperatorBodyV01(request);
    if (Object.keys(body).sort().join() !== "action,agenda_ref" || !["arm", "cancel"].includes(String(body.action)) || typeof body.agenda_ref !== "string" || !/^sha256:[a-f0-9]{64}$/u.test(body.agenda_ref)) throw new Error("prospective_request_invalid");
    const config = readVNextLocalOperatorPilotConfigV01(process.env);
    const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
    host = new ProspectiveReentryHost({ config, agenda_ref: body.agenda_ref });
    const admission = body.action === "arm"
      ? host.cycle.queueCurrentTask({ config, credential, preparation: { host_fingerprint: prospectiveHostFingerprint(), agenda_ref: body.agenda_ref } }).session_admission
      : host.cancel({ credential });
    const headers = { "Cache-Control": "no-store", "Set-Cookie": serializeVNextLocalOperatorSessionCookieV01({ value: admission.cookie_value, expires_at: admission.cookie_expires_at, max_age_seconds: admission.cookie_max_age_seconds, secure: url.protocol === "https:" }) };
    return NextResponse.json({ ok: true, state: host.read(), host_started: false, model_calls: 0 }, { headers });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof VNextLocalOperatorSessionErrorV01 || error instanceof BoundedAutomationCycleErrorV01 ? error.code : error instanceof Error && /^prospective_[a-z_]+$/u.test(error.message) ? error.message : "prospective_request_refused" }, { status: error instanceof VNextLocalOperatorSessionErrorV01 ? error.status : 409, headers: { "Cache-Control": "no-store" } });
  } finally { await host?.live.shutdown(); }
}
