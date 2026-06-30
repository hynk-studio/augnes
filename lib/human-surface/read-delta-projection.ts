import deltaProjectionFixture from "@/fixtures/augnes-delta-projection.sample.v0.1.json";
import type { AugnesDeltaProjectionReadModel } from "@/types/augnes-delta-projection";
import type { AugnesDeltaAuthorityBoundary } from "@/types/augnes-delta";
import { headers } from "next/headers";

export const HUMAN_SURFACE_DELTA_PROJECTION_SCOPE = "project:augnes" as const;
export const HUMAN_SURFACE_DELTA_PROJECTION_ENDPOINT =
  "/api/augnes/read/deltas?scope=project:augnes" as const;
export const HUMAN_SURFACE_DELTA_PROJECTION_LOCAL_READ_HEADER =
  "x-augnes-local-readonly" as const;
export const HUMAN_SURFACE_DELTA_PROJECTION_MARKER =
  "augnes-delta-projection-v0.1" as const;

export type HumanSurfaceDeltaProjectionSourceStatus =
  | "runtime"
  | "fixture_fallback"
  | "empty_fallback";

export type HumanSurfaceDeltaProjectionRead = {
  data: AugnesDeltaProjectionReadModel;
  source_status: HumanSurfaceDeltaProjectionSourceStatus;
  fallback_reason: string | null;
  authority_boundary: AugnesDeltaAuthorityBoundary;
};

const fixtureProjection =
  deltaProjectionFixture as AugnesDeltaProjectionReadModel;

export async function readDeltaProjectionForHumanSurface():
  Promise<HumanSurfaceDeltaProjectionRead> {
  try {
    const runtimeRead = await readRuntimeDeltaProjection();
    if (runtimeRead) {
      return runtimeRead;
    }
  } catch {
    return buildFixtureFallback(
      "Runtime Augnes Delta Projection read failed; using public-safe fixture fallback.",
    );
  }

  return buildFixtureFallback(
    "Runtime Augnes Delta Projection read was unavailable; using public-safe fixture fallback.",
  );
}

async function readRuntimeDeltaProjection():
  Promise<HumanSurfaceDeltaProjectionRead | null> {
  const baseUrl = await resolveRequestBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const response = await fetch(
    new URL(HUMAN_SURFACE_DELTA_PROJECTION_ENDPOINT, baseUrl),
    {
      method: "GET",
      headers: {
        [HUMAN_SURFACE_DELTA_PROJECTION_LOCAL_READ_HEADER]:
          HUMAN_SURFACE_DELTA_PROJECTION_MARKER,
      },
      cache: "no-store",
    },
  );

  const marker = response.headers.get(
    HUMAN_SURFACE_DELTA_PROJECTION_LOCAL_READ_HEADER,
  );
  if (!response.ok || marker !== HUMAN_SURFACE_DELTA_PROJECTION_MARKER) {
    return null;
  }

  const data = (await response.json()) as AugnesDeltaProjectionReadModel;
  return {
    data,
    source_status: "runtime",
    fallback_reason: null,
    authority_boundary: data.authority_boundary,
  };
}

async function resolveRequestBaseUrl(): Promise<string | null> {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get("host");
    if (!host) {
      return null;
    }

    const protocol =
      requestHeaders.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https");

    return `${protocol}://${host}`;
  } catch {
    return null;
  }
}

function buildFixtureFallback(
  fallbackReason: string,
): HumanSurfaceDeltaProjectionRead {
  return {
    data: fixtureProjection,
    source_status: "fixture_fallback",
    fallback_reason: fallbackReason,
    authority_boundary: fixtureProjection.authority_boundary,
  };
}
