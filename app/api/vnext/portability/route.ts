import { mkdirSync } from "node:fs";
import path from "node:path";

import { getDatabasePath, openDatabase } from "@/lib/db";
import {
  MAX_PORTABLE_PROJECT_BYTES_V01,
  PortableProjectErrorV01,
  exportActivePortableProjectV01,
  importPortableProjectV01,
  previewActivePortableProjectV01,
} from "@/lib/vnext/portability/portable-project";
import { recordPortableOperationResult } from "@/scripts/continuity-operational-status.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "frame-ancestors 'none'",
} as const;

export function GET(request: Request): Response {
  try {
    assertLocalRequestV01(request);
    const db = openDatabase();
    try {
      const preview = previewActivePortableProjectV01(db);
      recordPortableResultBestEffortV01({
        operation: "preview",
        outcome: "available",
        reason_code: "portable_project_preview_available",
        record_count: preview.record_count,
        personal_perspective_included: false,
        reader_verification: "not_applicable",
        data_preserved: true,
        next_safe_action: "review_scope_and_export",
      });
      return jsonResponseV01(preview, 200);
    } finally {
      db.close();
    }
  } catch (error) {
    return portableErrorResponseV01(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertLocalRequestV01(request);
    const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
    if (contentType === "application/json") {
      const body = await readBoundedJsonV01(request, 1_024);
      if (
        Object.keys(body).sort().join(",") !==
          "action,include_personal_perspective" ||
        body.action !== "export" ||
        typeof body.include_personal_perspective !== "boolean"
      ) {
        throw new PortableProjectErrorV01("portable_project_request_invalid", 400);
      }
      const db = openDatabase();
      try {
        const result = exportActivePortableProjectV01(db, {
          include_personal_perspective: body.include_personal_perspective,
        });
        recordPortableResultBestEffortV01({
          operation: "export",
          outcome: "completed",
          reason_code: "portable_project_export_completed",
          record_count: result.package.manifest.record_count,
          personal_perspective_included:
            result.package.manifest.personal_perspective.included,
          reader_verification: "not_applicable",
          data_preserved: true,
          next_safe_action: "store_or_import_local_package",
        });
        return new Response(result.bytes.buffer as ArrayBuffer, {
          status: 200,
          headers: {
            ...RESPONSE_HEADERS,
            "Content-Type": "application/vnd.augnes.portable-project+json",
            "Content-Disposition": `attachment; filename="${result.filename}"`,
          },
        });
      } finally {
        db.close();
      }
    }
    if (
      contentType !== "application/vnd.augnes.portable-project+json" &&
      contentType !== "application/octet-stream"
    ) {
      throw new PortableProjectErrorV01("portable_project_request_invalid", 400);
    }
    const bytes = await readBoundedBytesV01(request, MAX_PORTABLE_PROJECT_BYTES_V01);
    const destinationRootBase = path.join(
      path.dirname(getDatabasePath()),
      "portable-projects",
    );
    mkdirSync(destinationRootBase, { recursive: true, mode: 0o700 });
    const db = openDatabase();
    try {
      const result = importPortableProjectV01(db, {
          bytes,
          destination_root_base: destinationRootBase,
        });
      recordPortableResultBestEffortV01({
        operation: "import",
        outcome: result.status === "exact_replay" ? "exact_replay" : "completed",
        reason_code: result.reason_code,
        record_count: result.record_count,
        personal_perspective_included:
          result.personal_perspective_included === true,
        reader_verification: "verified",
        data_preserved: true,
        next_safe_action: result.next_action,
      });
      return jsonResponseV01(result, 200);
    } finally {
      db.close();
    }
  } catch (error) {
    return portableErrorResponseV01(error);
  }
}

function recordPortableResultBestEffortV01(event: {
  operation: "preview" | "export" | "import";
  outcome: "available" | "completed" | "exact_replay" | "refused";
  reason_code: string;
  record_count: number;
  personal_perspective_included: boolean;
  reader_verification: "not_applicable" | "verified" | "refused";
  data_preserved: boolean;
  next_safe_action: string;
}): void {
  try {
    recordPortableOperationResult({
      databasePath: path.resolve(getDatabasePath()),
      event: {
        contract: "augnes.portable-operation-result.v1",
        observed_at: new Date().toISOString(),
        ...event,
      },
    });
  } catch {
    // The sidecar is public operational evidence, not canonical project state.
  }
}

function assertLocalRequestV01(request: Request): void {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  if (
    url.search.length > 0 ||
    host === null ||
    !/^127\.0\.0\.1(?::(?:[1-9]\d{0,4}))?$/u.test(host) ||
    (host.includes(":") && Number(host.slice(host.lastIndexOf(":") + 1)) > 65_535)
  ) {
    throw new PortableProjectErrorV01("portable_project_request_invalid", 400);
  }
  const origin = request.headers.get("origin");
  if (
    (request.method === "POST" && origin === null) ||
    (origin !== null && origin !== `http://${host}`)
  ) {
    throw new PortableProjectErrorV01("portable_project_request_invalid", 400);
  }
}

async function readBoundedJsonV01(
  request: Request,
  limit: number,
): Promise<Record<string, unknown>> {
  const bytes = await readBoundedBytesV01(request, limit);
  try {
    const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new PortableProjectErrorV01("portable_project_request_invalid", 400);
  }
}

async function readBoundedBytesV01(request: Request, limit: number): Promise<Uint8Array> {
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/u.test(declared) || Number(declared) > limit)) {
    throw new PortableProjectErrorV01("portable_project_request_too_large", 413);
  }
  if (request.body === null) {
    throw new PortableProjectErrorV01("portable_project_request_invalid", 400);
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      try { await reader.cancel(); } catch { /* bounded refusal */ }
      throw new PortableProjectErrorV01("portable_project_request_too_large", 413);
    }
    chunks.push(value);
  }
  if (size === 0) throw new PortableProjectErrorV01("portable_project_request_invalid", 400);
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function portableErrorResponseV01(error: unknown): Response {
  const portable = error instanceof PortableProjectErrorV01
    ? error
    : new PortableProjectErrorV01("portable_project_operation_failed", 500);
  return jsonResponseV01({
    contract: "augnes.portable-project-operation-result.v1",
    outcome: "refused",
    reason_code: portable.code,
    next_action:
      portable.status === 409
        ? "review_project_identity_or_personal_perspective_scope"
        : "choose_a_current_compatible_local_package",
    semantic_authority_created: false,
    automation_authority_created: false,
    external_action_created: false,
  }, portable.status);
}

function jsonResponseV01(value: unknown, status: number): Response {
  return Response.json(value, { status, headers: RESPONSE_HEADERS });
}
