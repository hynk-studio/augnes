import { NextResponse } from "next/server";
import { localClientRequest, equal } from "@/lib/vnext/codex-repository-continuity/companion-local-channel";
import { handleReviewOperation, ReviewError, reviewProjection, reviewObject, reviewKeys } from "@/lib/vnext/request-bound-review";
import { deliverReviewEvents, handleReviewEventOperation, recoverReviewEvents } from "@/lib/vnext/review-events";
import { CallbackError } from "@/plugins/augnes-operator/mcp/review-webhook.mjs";
import { REVIEW_MARKER } from "@/plugins/augnes-operator/mcp/review-connection.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Private, fixed-purpose channel. The trusted runtime credential authenticates
 * the originating Companion; an additional configured capability narrows the
 * reviewer. Browser cookies, project IDs and from_agent labels confer nothing. */
export async function POST(request: Request) {
    const headers: Record<string, string> = { "x-augnes-review": REVIEW_MARKER, "cache-control": "no-store",
        "x-augnes-runtime-instance": process.env.AUGNES_RUNTIME_INSTANCE_ID ?? "",
        "x-augnes-runtime-generation": process.env.AUGNES_RUNTIME_GENERATION_ID ?? "",
        "x-augnes-runtime-repository": process.env.AUGNES_RUNTIME_REPOSITORY_FINGERPRINT ?? "" };
    const denied = (reason: string, status: number, extra: object = {}) => NextResponse.json(reviewProjection(status === 503 ? "unavailable" : "refused", { reason, ...extra }), { status, headers });
    if (new URL(request.url).search !== "?scope=repository:local" || !localClientRequest(request) ||
        request.headers.get("x-augnes-review") !== REVIEW_MARKER || !equal(request.headers.get("x-augnes-companion-proxy"), process.env.AUGNES_COMPANION_PROXY_TOKEN))
        return denied("review_access_refused", 403);
    if (process.env.AUGNES_RECOVERY_MODE === "1" || process.env.AUGNES_RUNTIME_CHILD_ROLE !== "ui" ||
        !process.env.AUGNES_RUNTIME_INSTANCE_ID || !process.env.AUGNES_RUNTIME_GENERATION_ID || !process.env.AUGNES_RUNTIME_REPOSITORY_FINGERPRINT)
        return denied("review_runtime_unavailable", 503);
    if (Object.entries(headers).filter(([k]) => k.startsWith("x-augnes-runtime")).some(([k, v]) => request.headers.get(k) !== v))
        return denied("review_runtime_changed", 409);
    if ((request.headers.get("content-type") ?? "").split(";")[0] !== "application/json")
        return denied("invalid_review_input", 415);
    try {
        let text = "", bytes = 0;
        if (request.body) {
            const reader = request.body.getReader(), decoder = new TextDecoder();
            try {
                for (;;) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    bytes += value.byteLength;
                    if (bytes > 64000) {
                        await reader.cancel();
                        return denied("review_request_too_large", 413);
                    }
                    text += decoder.decode(value, { stream: true });
                }
                text += decoder.decode();
            }
            finally {
                reader.releaseLock();
            }
        }
        let input;
        try {
            input = reviewObject(JSON.parse(text));
        }
        catch {
            return denied("invalid_review_input", 400);
        }
        const secret = request.headers.get("x-augnes-review-credential");
        if (input.action === "recover_events") {
            reviewKeys(input, ["action", "connection_ref"]);
            return NextResponse.json(reviewProjection("available", { delivery: await recoverReviewEvents(input.connection_ref, secret) }), { headers });
        }
        const result = input.action === "event" ? await handleReviewEventOperation(input, secret) : await handleReviewOperation(input, secret);
        if (input.action === "request" || (input.action === "event" && input.method === "events/subscribe")) {
            // The request/subscription is already durable. A delivery error must not
            // be relabelled as an unsaved request after the commit boundary.
            try {
                Object.assign(result, { delivery: await deliverReviewEvents(input.connection_ref) });
            }
            catch {
                Object.assign(result, { delivery: { status: "unavailable", persistence: "saved" } });
            }
        }
        return NextResponse.json(result, { headers });
    }
    catch (error) {
        if (error instanceof CallbackError)
            return denied("callback_endpoint_error", 422, { protocol_error: { code: -32015, message: "CallbackEndpointError", data: { reason: error.reason } } });
        if (error instanceof ReviewError)
            return denied(error.code, error.status);
        const code = error instanceof Error ? error.message : "";
        if (["review_not_configured", "review_configuration_unavailable", "review_access_refused"].includes(code))
            return denied(code, code === "review_access_refused" ? 403 : 503);
        return denied("review_inspection_or_storage_unavailable", 503, { persistence: "unknown_read_back_before_retry" });
    }
}
