import type Database from "better-sqlite3";
import { NextResponse } from "next/server";
import { assertVNextLocalOperatorRequestBoundaryV01, authenticateVNextLocalOperatorSessionV01, openVNextLocalOperatorDatabaseV01, readBoundedVNextLocalOperatorBodyV01, readVNextLocalOperatorCredentialFromRequestV01, readVNextLocalOperatorPilotConfigV01, serializeVNextLocalOperatorSessionCookieV01, VNextLocalOperatorSessionErrorV01, type VNextLocalOperatorPilotConfigV01, type VNextLocalOperatorSecretSourceV01 } from "@/lib/vnext/runtime/local-operator-session";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import { WorkExpectationError } from "@/lib/vnext/work-expectation";
import { readWorkExpectationPreparation, recordWorkExpectationMaterial } from "@/lib/vnext/runtime/work-expectation";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache", "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Content-Security-Policy": "frame-ancestors 'none'" };
export function createWorkExpectationHandler(options: {
  environment?: NodeJS.ProcessEnv; clock?: VNextLocalRuntimeClockV01; secret_source?: VNextLocalOperatorSecretSourceV01;
  open_database?: (config: VNextLocalOperatorPilotConfigV01) => Database.Database;
} = {}) {
  return async function handle(request: Request) {
    let db: Database.Database | null = null;
    try {
      const mutating = request.method === "POST";
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, { mutating });
      if (url.search || !["GET", "POST"].includes(request.method)) throw new WorkExpectationError("expectation_request_invalid", 400);
      const config = readVNextLocalOperatorPilotConfigV01(options.environment ?? process.env);
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      db = (options.open_database ?? openVNextLocalOperatorDatabaseV01)(config);
      authenticateVNextLocalOperatorSessionV01(db, { config, credential, clock: options.clock });
      if (readActiveProjectSelectionV01(db, config.workspace_id)?.project_id !== config.project_id)
        throw new WorkExpectationError("expectation_selection_changed");
      if (!mutating) return NextResponse.json({ ok: true, ...readWorkExpectationPreparation(db, config) }, { headers });
      const result = recordWorkExpectationMaterial(db, { config, credential, request: await readBoundedVNextLocalOperatorBodyV01(request), clock: options.clock, secret_source: options.secret_source });
      return NextResponse.json({ ok: true, record: result.record, semantic_state_changed: false, execution_started: false }, {
        status: 201, headers: { ...headers, "Set-Cookie": serializeVNextLocalOperatorSessionCookieV01({
          value: result.session_admission.cookie_value, expires_at: result.session_admission.cookie_expires_at,
          max_age_seconds: result.session_admission.cookie_max_age_seconds, secure: url.protocol === "https:",
        }) },
      });
    } catch (error) {
      const known = error instanceof WorkExpectationError || error instanceof VNextLocalOperatorSessionErrorV01;
      return NextResponse.json({ ok: false, error_code: known ? error.code : "expectation_material_unavailable" }, { status: known ? error.status : 409, headers });
    } finally { db?.close(); }
  };
}
export const GET = createWorkExpectationHandler();
export const POST = createWorkExpectationHandler();
