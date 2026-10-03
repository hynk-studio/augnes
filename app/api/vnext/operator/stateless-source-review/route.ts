import { NextResponse } from "next/server";
import { StatelessSourceReviewHost, prepareStatelessReview, prepareStatelessReplacement, readPreparedStatelessWork, previewStatelessReview, authorizeStatelessReview } from "@/lib/vnext/runtime/stateless-source-review";
import { endStatelessReviewWork } from "@/lib/vnext/runtime/stateless-review-disposition";
import { assertVNextLocalOperatorRequestBoundaryV01, readBoundedVNextLocalOperatorBodyV01, readVNextLocalOperatorCredentialFromRequestV01, resolveVNextLocalReviewConfigV01,
  openVNextLocalOperatorDatabaseV01, authenticateVNextLocalOperatorSessionV01, admitVNextLocalOperatorMutationInsideTransactionV01, serializeVNextLocalOperatorSessionCookieV01, VNextLocalOperatorSessionErrorV01 } from "@/lib/vnext/runtime/local-operator-session";
import { reviewObject, reviewText, reviewSha, type StatelessGrantRequest } from "@/lib/vnext/stateless-work";
import type { ModelAdapterV01 } from "@/lib/vnext/model-gateway/contracts";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };

export function createStatelessSourceReviewHandler(options: { environment?: NodeJS.ProcessEnv; clock?: VNextLocalRuntimeClockV01; adapter?: ModelAdapterV01 } = {}) {
  return async (request: Request) => {
    let db: ReturnType<typeof openVNextLocalOperatorDatabaseV01> | null = null;
    try {
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, { mutating: request.method === "POST" });
      if (!["GET", "POST"].includes(request.method) || process.platform !== "darwin" || process.arch !== "arm64") throw new Error("stateless_review_qualified_local_host_required");
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      const config = resolveVNextLocalReviewConfigV01({ credential, environment: options.environment ?? process.env, clock: options.clock });
      db = openVNextLocalOperatorDatabaseV01(config);
      authenticateVNextLocalOperatorSessionV01(db, { config, credential, clock: options.clock });
      if ([...url.searchParams.keys()].join() !== "project_id" || url.searchParams.get("project_id") !== config.project_id) throw new Error("stateless_review_project_mismatch");
      const hostOptions = { config, now: options.clock?.now ?? (() => new Date().toISOString()), adapter: options.adapter };
      if (request.method === "GET") {
        const rows = db.prepare("SELECT run_id FROM autonomy_runs WHERE scope=? AND json_extract(metadata_json,'$.stateless_review.version')='stateless_source_review.v0.1' ORDER BY created_at DESC LIMIT 20").all(config.project_id) as Array<{ run_id: string }>;
        return NextResponse.json({ ok: true, read_only: true, preparation: readPreparedStatelessWork(db, config, hostOptions.now()), reviews: rows.map(r => new StatelessSourceReviewHost(hostOptions, r.run_id).read()) }, { headers });
      }
      const body = await readBoundedVNextLocalOperatorBodyV01(request);
      let admission; let result: unknown;
      if (body.action === "prepare") {
        reviewObject(body, ["action", "material"]);
        const prepared = prepareStatelessReview(db, { config, credential, request: body.material, now: hostOptions.now });
        admission = prepared.session_admission; const { session_admission: _session, ...publicResult } = prepared; result = publicResult;
      } else if (body.action === "end_work") {
        reviewObject(body, ["action", "binding"]);
        const ended = endStatelessReviewWork(db, { config, credential, binding: body.binding, now: hostOptions.now });
        admission = ended.session_admission;
        result = new StatelessSourceReviewHost(hostOptions, ended.disposition.binding.run_id).read();
      } else if (body.action === "prepare_linked_work") {
        reviewObject(body, ["action", "disposition", "material"]);
        const link = reviewObject(body.disposition, ["run_id", "disposition_fingerprint"]);
        const prepared = prepareStatelessReplacement(db, { config, credential, request: body.material, now: hostOptions.now,
          disposition: { run_id: reviewText(link.run_id, 160), disposition_fingerprint: reviewSha(link.disposition_fingerprint) } });
        admission = prepared.session_admission;
        result = { packet_id: prepared.packet_id, review: prepared.review, status: prepared.status, preparation_bytes: prepared.preparation_bytes, authorized: false, predecessor_effects_unknown: true };
      } else if (body.action === "preview") {
        reviewObject(body, ["action", "pricing"]);
        return NextResponse.json({ ok: true, authorization: await previewStatelessReview(db, hostOptions, body.pricing), read_only: true }, { headers });
      } else if (body.action === "authorize_and_run") {
        reviewObject(body, ["action", "authorization"]);
        const authorized = authorizeStatelessReview(db, hostOptions, credential, body.authorization as StatelessGrantRequest);
        admission = authorized.session_admission;
        const host = new StatelessSourceReviewHost(hostOptions, authorized.run_id);
        try { result = await host.run(request.signal); } catch { result = host.read(); }
      } else if (body.action === "continue" || body.action === "cancel") {
        reviewObject(body, ["action", "run_id"]);
        const host = new StatelessSourceReviewHost(hostOptions, reviewText(body.run_id, 160));
        if (body.action === "cancel") { admission = host.cancel(credential); result = host.read(); }
        else {
          db.exec("BEGIN IMMEDIATE");
          try { admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, { config, credential, clock: options.clock }); host.read(); db.exec("COMMIT"); }
          catch (e) { if (db.inTransaction) db.exec("ROLLBACK"); throw e; }
          try { result = await host.run(request.signal); } catch { result = host.read(); }
        }
      } else throw new Error("stateless_review_request_invalid");
      return NextResponse.json({ ok: true, result }, { headers: { ...headers, "Set-Cookie": serializeVNextLocalOperatorSessionCookieV01({ value: admission.cookie_value,
        expires_at: admission.cookie_expires_at, max_age_seconds: admission.cookie_max_age_seconds, secure: url.protocol === "https:" }) } });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof VNextLocalOperatorSessionErrorV01 ? error.code : error instanceof Error && /^stateless_review_[a-z_]+$/.test(error.message) ? error.message : "stateless_review_request_refused" }, { status: error instanceof VNextLocalOperatorSessionErrorV01 ? error.status : 409, headers });
    } finally { db?.close(); }
  };
}
export const GET = createStatelessSourceReviewHandler();
export const POST = createStatelessSourceReviewHandler();
