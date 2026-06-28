import { Buffer } from "node:buffer";

import type { BoundedSourceInputKindV01 } from "./sanitize-source-ref";

export type BoundedSourceFetchFailureKindV01 =
  | "fetch_failed"
  | "unsupported_content_type"
  | "content_too_large"
  | "source_unavailable"
  | "timeout";

export type BoundedSourceFetchStatusV01 =
  | "ok"
  | BoundedSourceFetchFailureKindV01;

export interface BoundedSourceFetchLimitsV01 {
  size_limit_bytes: number;
  timeout_ms: number;
  content_type_allowlist: string[];
}

export interface BoundedSourceFetchRequestV01 {
  input_kind: Extract<BoundedSourceInputKindV01, "url" | "doi">;
  source_locator: string;
  source_locator_ref: string;
  source_ref_id: string;
  limits: BoundedSourceFetchLimitsV01;
}

export interface BoundedSourceFetchResponseV01 {
  status: BoundedSourceFetchStatusV01;
  http_status?: number;
  content_type?: string;
  byte_length?: number;
  elapsed_ms?: number;
  bounded_summary?: string;
  source_title?: string;
  failure_kind?: BoundedSourceFetchFailureKindV01;
  reason_codes: string[];
}

export type BoundedSourceFetcherV01 = (
  request: BoundedSourceFetchRequestV01,
) => Promise<BoundedSourceFetchResponseV01> | BoundedSourceFetchResponseV01;

export interface MockBoundedSourceFetchFixtureV01 {
  source_locator_ref?: string;
  source_ref_id?: string;
  status: BoundedSourceFetchStatusV01;
  http_status?: number;
  content_type?: string;
  body_text?: string;
  byte_length?: number;
  elapsed_ms?: number;
  bounded_summary?: string;
  source_title?: string;
  failure_kind?: BoundedSourceFetchFailureKindV01;
  reason_codes?: string[];
}

export async function fetchBoundedSourceV01(
  request: BoundedSourceFetchRequestV01,
  options?: {
    fetcher?: BoundedSourceFetcherV01;
    allow_live_fetch?: boolean;
  },
): Promise<BoundedSourceFetchResponseV01> {
  if (options?.fetcher) {
    return enforceBoundedSourceFetchLimitsV01(await options.fetcher(request), request.limits);
  }
  if (options?.allow_live_fetch !== true) {
    return {
      status: "fetch_failed",
      failure_kind: "fetch_failed",
      reason_codes: ["live_fetch_not_enabled", "failure_to_gap_candidate_metadata_now"],
    };
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), request.limits.timeout_ms);
  try {
    const response = await fetch(request.source_locator, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: request.limits.content_type_allowlist.join(", "),
      },
    });
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    const bytes = Buffer.from(await response.arrayBuffer());
    return enforceBoundedSourceFetchLimitsV01(
      {
        status: response.ok ? "ok" : "source_unavailable",
        http_status: response.status,
        content_type: contentType,
        byte_length: bytes.length,
        elapsed_ms: Date.now() - startedAt,
        bounded_summary: response.ok
          ? `Bounded fetch completed for ${request.source_locator_ref}.`
          : undefined,
        failure_kind: response.ok ? undefined : "source_unavailable",
        reason_codes: response.ok
          ? ["bounded_fetch_completed", "raw_body_non_persistent_by_default"]
          : ["source_unavailable", "failure_to_gap_candidate_metadata_now"],
      },
      request.limits,
    );
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return {
      status: timedOut ? "timeout" : "fetch_failed",
      failure_kind: timedOut ? "timeout" : "fetch_failed",
      elapsed_ms: Date.now() - startedAt,
      reason_codes: [
        timedOut ? "timeout" : "fetch_failed",
        "failure_to_gap_candidate_metadata_now",
      ],
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function createMockBoundedSourceFetcherV01(
  fixtures: MockBoundedSourceFetchFixtureV01[],
): BoundedSourceFetcherV01 {
  return (request) => {
    const fixture =
      fixtures.find((candidate) => candidate.source_ref_id === request.source_ref_id) ??
      fixtures.find((candidate) => candidate.source_locator_ref === request.source_locator_ref);
    if (!fixture) {
      return {
        status: "fetch_failed",
        failure_kind: "fetch_failed",
        reason_codes: ["mock_fetch_fixture_missing", "failure_to_gap_candidate_metadata_now"],
      };
    }
    const byteLength =
      fixture.byte_length ??
      (typeof fixture.body_text === "string"
        ? Buffer.byteLength(fixture.body_text, "utf8")
        : undefined);
    return {
      status: fixture.status,
      http_status: fixture.http_status,
      content_type: fixture.content_type,
      byte_length: byteLength,
      elapsed_ms: fixture.elapsed_ms,
      bounded_summary: fixture.bounded_summary,
      source_title: fixture.source_title,
      failure_kind:
        fixture.failure_kind ??
        (fixture.status === "ok" ? undefined : (fixture.status as BoundedSourceFetchFailureKindV01)),
      reason_codes: fixture.reason_codes ?? [`mock_fetch_${fixture.status}`],
    };
  };
}

export function enforceBoundedSourceFetchLimitsV01(
  response: BoundedSourceFetchResponseV01,
  limits: BoundedSourceFetchLimitsV01,
): BoundedSourceFetchResponseV01 {
  if ((response.elapsed_ms ?? 0) > limits.timeout_ms || response.status === "timeout") {
    return {
      ...boundedFailure(response),
      status: "timeout",
      failure_kind: "timeout",
      reason_codes: uniqueSorted([...response.reason_codes, "timeout"]),
    };
  }

  const normalizedContentType = normalizeContentType(response.content_type);
  if (
    response.status === "ok" &&
    normalizedContentType &&
    !limits.content_type_allowlist.some((allowed) =>
      normalizedContentType.startsWith(allowed.toLowerCase()),
    )
  ) {
    return {
      ...boundedFailure(response),
      status: "unsupported_content_type",
      failure_kind: "unsupported_content_type",
      reason_codes: uniqueSorted([...response.reason_codes, "unsupported_content_type"]),
    };
  }

  if ((response.byte_length ?? 0) > limits.size_limit_bytes || response.status === "content_too_large") {
    return {
      ...boundedFailure(response),
      status: "content_too_large",
      failure_kind: "content_too_large",
      reason_codes: uniqueSorted([...response.reason_codes, "content_too_large"]),
    };
  }

  if (response.status !== "ok") {
    return {
      ...boundedFailure(response),
      failure_kind: response.failure_kind ?? (response.status as BoundedSourceFetchFailureKindV01),
      reason_codes: uniqueSorted(response.reason_codes),
    };
  }

  return {
    status: "ok",
    http_status: response.http_status,
    content_type: response.content_type,
    byte_length: response.byte_length,
    elapsed_ms: response.elapsed_ms,
    bounded_summary: response.bounded_summary,
    source_title: response.source_title,
    reason_codes: uniqueSorted([
      ...response.reason_codes,
      "bounded_fetch_limits_enforced",
      "raw_body_non_persistent_by_default",
    ]),
  };
}

function boundedFailure(response: BoundedSourceFetchResponseV01): BoundedSourceFetchResponseV01 {
  return {
    status: response.status,
    http_status: response.http_status,
    content_type: response.content_type,
    byte_length: response.byte_length,
    elapsed_ms: response.elapsed_ms,
    failure_kind: response.failure_kind,
    reason_codes: response.reason_codes,
  };
}

function normalizeContentType(value: string | undefined): string {
  return (value ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}
