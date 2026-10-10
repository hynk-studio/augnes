import type Database from "better-sqlite3";
import { NextResponse } from "next/server";
import { BoundedAutomationCycleErrorV01 } from "@/lib/vnext/runtime/bounded-automation-cycle";
import { ProspectiveReentryHost, prospectiveHostFingerprint } from "@/lib/vnext/runtime/prospective-reentry";
import { authorizeProspectiveInspection, prospectiveAuthorizationPreview } from "@/lib/vnext/runtime/prospective-authorization";
import type { ProspectiveAuthorizationRef } from "@/lib/vnext/persistence/prospective-authorization";
import {
  assertVNextLocalOperatorRequestBoundaryV01, readBoundedVNextLocalOperatorBodyV01,
  readVNextLocalOperatorCredentialFromRequestV01, resolveVNextLocalReviewConfigV01,
  serializeVNextLocalOperatorSessionCookieV01, VNextLocalOperatorSessionErrorV01,
  authenticateVNextLocalOperatorSessionV01, openVNextLocalOperatorDatabaseV01,
  type VNextLocalOperatorPilotConfigV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import { readReentry } from "@/lib/vnext/persistence/prospective-reentry-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
const sha = (value: unknown): value is string => typeof value === "string" && /^sha256:[a-f0-9]{64}$/u.test(value);

/** Authenticated preview -> explicit authorization -> arm/cancel. HTTP never
 * installs or starts a host loop; each mutation consumes the normal action nonce. */
export function createProspectiveReentryHandler(options: {
  environment?: NodeJS.ProcessEnv; clock?: VNextLocalRuntimeClockV01;
  open_database?: (config: VNextLocalOperatorPilotConfigV01) => Database.Database;
} = {}) {
  return async function handle(request: Request) {
    let db: Database.Database | null = null;
    let host: ProspectiveReentryHost | null = null;
    try {
      const mutating = request.method === "POST";
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, { mutating });
      if (!["GET", "POST"].includes(request.method) || (mutating || url.searchParams.has("preview")) && (process.platform !== "darwin" || process.arch !== "arm64")) throw new Error("prospective_qualified_local_route_required");
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      const config = resolveVNextLocalReviewConfigV01({ environment: options.environment ?? process.env, credential, clock: options.clock });
      const open = options.open_database ?? openVNextLocalOperatorDatabaseV01;
      const now = options.clock?.now ?? (() => new Date().toISOString());
      db = open(config);
      authenticateVNextLocalOperatorSessionV01(db, { config, credential, clock: options.clock });
      if (!mutating) {
        const agendaRef = url.searchParams.get("agenda_ref");
        const preview = url.searchParams.get("preview") === "authorization";
        if ([...url.searchParams.keys()].sort().join() !== (preview ? "agenda_ref,preview" : "agenda_ref") || !sha(agendaRef)) throw new Error("prospective_request_invalid");
        return NextResponse.json({ ok: true, state: readReentry(db, { ...config, agenda_ref: agendaRef }), read_only: true,
          ...(preview ? { authorization_preview: prospectiveAuthorizationPreview(db, { config, agenda_ref: agendaRef, host_fingerprint: prospectiveHostFingerprint(), at: now() }) } : {}) }, { headers });
      }
      if (url.search) throw new Error("prospective_request_invalid");
      const body = await readBoundedVNextLocalOperatorBodyV01(request);
      let authorization = null;
      let admission;
      if (body.action === "authorize" && Object.keys(body).sort().join() === "action,authorization") {
        const result = authorizeProspectiveInspection(db, { config, credential, request: body.authorization, host_fingerprint: prospectiveHostFingerprint(), clock: options.clock });
        authorization = result.grant;
        admission = result.session_admission;
      } else {
        const keys = Object.keys(body).sort().join();
        if (!sha(body.agenda_ref) || !["arm", "cancel"].includes(String(body.action)) ||
          !(keys === "action,agenda_ref" || body.action === "arm" && keys === "action,agenda_ref,authorization_ref")) throw new Error("prospective_request_invalid");
        const ref = body.authorization_ref as ProspectiveAuthorizationRef | undefined;
        if (ref !== undefined && (!ref || Object.keys(ref).sort().join() !== "grant_fingerprint,grant_id" || typeof ref.grant_id !== "string" || !sha(ref.grant_fingerprint))) throw new Error("prospective_request_invalid");
        host = new ProspectiveReentryHost({ config, agenda_ref: body.agenda_ref, now, open_database: open });
        admission = body.action === "arm"
          ? host.cycle.queueCurrentTask({ config, credential, clock: options.clock, preparation: { host_fingerprint: prospectiveHostFingerprint(), agenda_ref: body.agenda_ref, authorization_ref: ref } }).session_admission
          : host.cancel({ credential, clock: options.clock });
      }
      return NextResponse.json({ ok: true, authorization, state: host?.read() ?? null, host_started: false, model_calls: 0 }, {
        headers: { ...headers, "Set-Cookie": serializeVNextLocalOperatorSessionCookieV01({ request, value: admission.cookie_value, expires_at: admission.cookie_expires_at, max_age_seconds: admission.cookie_max_age_seconds, secure: url.protocol === "https:" }) },
      });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof VNextLocalOperatorSessionErrorV01 || error instanceof BoundedAutomationCycleErrorV01 ? error.code : error instanceof Error && /^prospective_[a-z_]+$/u.test(error.message) ? error.message : "prospective_request_refused" }, { status: error instanceof VNextLocalOperatorSessionErrorV01 ? error.status : 409, headers });
    } finally { db?.close(); await host?.live.shutdown(); }
  };
}
export const GET = createProspectiveReentryHandler();
export const POST = createProspectiveReentryHandler();
