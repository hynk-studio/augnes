import { NextResponse } from "next/server";

import { interpretGuideBriefQuestionV01 } from "@/lib/vnext/guide-brief/guide-brief-interpretation-service";
import {
  GUIDE_BRIEF_INTERPRETATION_LIMITS_V01,
  GUIDE_BRIEF_INTERPRETATION_RESULT_VERSION_V01,
} from "@/types/vnext/guide-brief-interpretation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "cache-control": "no-store",
  "x-augnes-guidebrief-interpretation": "bounded-v0.1",
} as const;

export async function POST(request: Request) {
  if (!sameOriginLoopbackRequestV01(request)) {
    return routeErrorV01(403);
  }
  if (
    (request.headers.get("content-type") ?? "").split(";", 1)[0] !==
    "application/json"
  ) {
    return routeErrorV01(415);
  }
  const text = await request.text();
  if (
    Buffer.byteLength(text, "utf8") >
    GUIDE_BRIEF_INTERPRETATION_LIMITS_V01.max_input_bytes
  ) {
    return routeErrorV01(413);
  }
  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    return routeErrorV01(400);
  }
  try {
    return NextResponse.json(
      await interpretGuideBriefQuestionV01(body, request.signal),
      { status: 200, headers: HEADERS },
    );
  } catch {
    return routeErrorV01(400);
  }
}

function sameOriginLoopbackRequestV01(request: Request): boolean {
  try {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
    const originUrl = origin && !origin.includes(",")
      ? new URL(origin)
      : null;
    return (
      ["localhost", "127.0.0.1", "::1"].includes(requestUrl.hostname) &&
      originUrl !== null &&
      ["localhost", "127.0.0.1", "::1"].includes(originUrl.hostname) &&
      originUrl.protocol === requestUrl.protocol &&
      originUrl.port === requestUrl.port &&
      (!fetchSite || fetchSite === "same-origin")
    );
  } catch {
    return false;
  }
}

function routeErrorV01(status: number) {
  return NextResponse.json(
    {
      result_version: GUIDE_BRIEF_INTERPRETATION_RESULT_VERSION_V01,
      status: "unavailable",
      intent: null,
      model_assisted: false,
      no_answer_prose_returned: true,
      durable_state_changed: false,
    },
    { status, headers: HEADERS },
  );
}
