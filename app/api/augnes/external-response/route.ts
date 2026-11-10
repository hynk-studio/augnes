import { NextResponse } from "next/server";
import {
  localClientRequest,
  equal,
} from "@/lib/vnext/codex-repository-continuity/companion-local-channel";
import {
  handleExternalOperation,
  externalProjection,
} from "@/lib/vnext/external-response";
import { ExternalError } from "@/lib/vnext/external-response-rules.mjs";
import { EXTERNAL_MARKER } from "@/plugins/augnes-operator/mcp/external-response.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const identity = {
    "x-augnes-runtime-instance": process.env.AUGNES_RUNTIME_INSTANCE_ID ?? "",
    "x-augnes-runtime-generation":
      process.env.AUGNES_RUNTIME_GENERATION_ID ?? "",
    "x-augnes-runtime-repository":
      process.env.AUGNES_RUNTIME_REPOSITORY_FINGERPRINT ?? "",
  };
  const headers = {
    ...identity,
    "x-augnes-external": EXTERNAL_MARKER,
    "cache-control": "no-store",
  };
  const denied = (reason: string, status: number) =>
    NextResponse.json(
      externalProjection(status === 503 ? "unavailable" : "refused", {
        reason,
        persistence: "not_confirmed_read_before_repetition",
      }),
      { status, headers },
    );
  const query = new URL(request.url).searchParams;
  if (
    [...query.keys()].join(",") !== "scope" ||
    query.get("scope") !== "repository:local" ||
    !localClientRequest(request) ||
    request.headers.get("x-augnes-external") !== EXTERNAL_MARKER ||
    !equal(
      request.headers.get("x-augnes-companion-proxy"),
      process.env.AUGNES_COMPANION_PROXY_TOKEN,
    )
  )
    return denied("external_access_refused", 403);
  if (
    process.env.AUGNES_RECOVERY_MODE === "1" ||
    process.env.AUGNES_RUNTIME_CHILD_ROLE !== "ui" ||
    Object.values(identity).some((v) => !v)
  )
    return denied("external_runtime_unavailable", 503);
  if (Object.entries(identity).some(([k, v]) => request.headers.get(k) !== v))
    return denied("external_runtime_changed", 409);
  if (
    (request.headers.get("content-type") ?? "").split(";")[0] !==
    "application/json"
  )
    return denied("external_invalid_input", 415);
  try {
    const reader = request.body?.getReader();
    if (!reader) return denied("external_invalid_input", 400);
    let size = 0;
    const chunks = [];
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 100000) {
          await reader.cancel();
          return denied("external_request_out_of_bounds", 413);
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    let input;
    try {
      input = JSON.parse(Buffer.concat(chunks).toString());
    } catch {
      return denied("external_invalid_input", 400);
    }
    return NextResponse.json(await handleExternalOperation(input), { headers });
  } catch (error) {
    if (error instanceof ExternalError) return denied(error.code, error.status);
    return denied("external_inspection_or_storage_unavailable", 503);
  }
}
