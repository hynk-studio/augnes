import { runDirectionInspection } from "@/lib/vnext/runtime/project-direction-execution";
import { NextResponse } from "next/server";
import type Database from "better-sqlite3";
import { readProjectDirection, ProjectDirectionError } from "@/lib/vnext/persistence/project-direction-store";
import { mutateHumanDirection } from "@/lib/vnext/runtime/project-direction";
import { prepareDirectionAgenda } from "@/lib/vnext/runtime/project-direction-preparation";
import { assertVNextLocalOperatorRequestBoundaryV01, readBoundedVNextLocalOperatorBodyV01, readVNextLocalOperatorCredentialFromRequestV01,
  resolveVNextLocalReviewConfigV01, authenticateVNextLocalOperatorSessionV01, openVNextLocalOperatorDatabaseV01,
  serializeVNextLocalOperatorSessionCookieV01, VNextLocalOperatorSessionErrorV01 } from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
export function createProjectDirectionHandler(options: { environment?: NodeJS.ProcessEnv; clock?: VNextLocalRuntimeClockV01 } = {}) {
  return async (request: Request) => {
    let db: Database.Database | null = null;
    try {
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, { mutating: request.method === "POST" });
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      const config = resolveVNextLocalReviewConfigV01({ environment: options.environment ?? process.env, credential, clock: options.clock });
      if ([...url.searchParams.keys()].some(k => k !== "project_id") || url.searchParams.get("project_id") !== config.project_id) throw new ProjectDirectionError("project_direction_session_scope", 403);
      db = openVNextLocalOperatorDatabaseV01(config);
      authenticateVNextLocalOperatorSessionV01(db, { config, credential, clock: options.clock });
      if (request.method === "GET") return NextResponse.json({ ok: true, state: readProjectDirection(db, config, options.clock?.now() ?? new Date().toISOString()) }, { headers });
      if (request.method !== "POST") throw new ProjectDirectionError("project_direction_method", 405);
      const body = await readBoundedVNextLocalOperatorBodyV01(request);
      const input = { config, credential, request: body, clock: options.clock };
      const result = body.action === "run_inspection" ? await runDirectionInspection(db, { ...input, signal: request.signal })
        : body.action === "prepare_inspection" ? prepareDirectionAgenda(db, input) : mutateHumanDirection(db, input);
      const { session_admission: admission, ...publicResult } = result;
      return NextResponse.json({ ok: true, ...publicResult }, { headers: { ...headers, "Set-Cookie": serializeVNextLocalOperatorSessionCookieV01({
        value: admission.cookie_value, expires_at: admission.cookie_expires_at, max_age_seconds: admission.cookie_max_age_seconds, secure: url.protocol === "https:" }) } });
    } catch (error) {
      const code = error instanceof ProjectDirectionError || error instanceof VNextLocalOperatorSessionErrorV01 ? error.code : "project_direction_request_refused";
      return NextResponse.json({ ok: false, error: code }, { status: error instanceof ProjectDirectionError || error instanceof VNextLocalOperatorSessionErrorV01 ? error.status : 409, headers });
    } finally { db?.close(); }
  };
}
export const GET = createProjectDirectionHandler();
export const POST = createProjectDirectionHandler();
