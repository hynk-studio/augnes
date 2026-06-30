import currentWorkingPerspectiveFixture from "@/fixtures/current-working-perspective.sample.v0.1.json";
import type {
  CurrentWorkingPerspective,
  CurrentWorkingPerspectiveAuthorityBoundary,
} from "@/types/current-working-perspective";
import { headers } from "next/headers";

export const HUMAN_SURFACE_CURRENT_PERSPECTIVE_SCOPE = "project:augnes" as const;
export const HUMAN_SURFACE_CURRENT_PERSPECTIVE_ENDPOINT =
  "/api/perspective/current?scope=project:augnes" as const;
export const HUMAN_SURFACE_LOCAL_READ_HEADER = "x-augnes-local-readonly" as const;
export const HUMAN_SURFACE_CURRENT_PERSPECTIVE_MARKER =
  "current-working-perspective-v0.1" as const;

export type HumanSurfaceSourceStatus =
  | "runtime"
  | "fixture_fallback"
  | "empty_fallback";

export type HumanSurfaceCurrentPerspectiveRead = {
  data: CurrentWorkingPerspective;
  source_status: HumanSurfaceSourceStatus;
  fallback_reason: string | null;
  authority_boundary: CurrentWorkingPerspectiveAuthorityBoundary;
};

const fixturePerspective =
  currentWorkingPerspectiveFixture as CurrentWorkingPerspective;

export async function readCurrentPerspectiveForHumanSurface():
  Promise<HumanSurfaceCurrentPerspectiveRead> {
  try {
    const runtimeRead = await readRuntimeCurrentPerspective();
    if (runtimeRead) {
      return runtimeRead;
    }
  } catch {
    return buildFixtureFallback(
      "Runtime Current Working Perspective read failed; using public-safe fixture fallback.",
    );
  }

  return buildFixtureFallback(
    "Runtime Current Working Perspective read was unavailable; using public-safe fixture fallback.",
  );
}

async function readRuntimeCurrentPerspective():
  Promise<HumanSurfaceCurrentPerspectiveRead | null> {
  const baseUrl = await resolveRequestBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const response = await fetch(
    new URL(HUMAN_SURFACE_CURRENT_PERSPECTIVE_ENDPOINT, baseUrl),
    {
      method: "GET",
      headers: {
        [HUMAN_SURFACE_LOCAL_READ_HEADER]:
          HUMAN_SURFACE_CURRENT_PERSPECTIVE_MARKER,
      },
      cache: "no-store",
    },
  );

  const marker = response.headers.get(HUMAN_SURFACE_LOCAL_READ_HEADER);
  if (!response.ok || marker !== HUMAN_SURFACE_CURRENT_PERSPECTIVE_MARKER) {
    return null;
  }

  const data = (await response.json()) as CurrentWorkingPerspective;
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
): HumanSurfaceCurrentPerspectiveRead {
  return {
    data: fixturePerspective,
    source_status: "fixture_fallback",
    fallback_reason: fallbackReason,
    authority_boundary: fixturePerspective.authority_boundary,
  };
}
