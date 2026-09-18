// Diagnostic seam for the disposable project-experience Browser only. No observer
// is installed by the application. Production builds cannot use the portal;
// development also requires the disposable Browser's CDP binding and portal.
export interface ProjectExperienceReadObserverV1 {
  fetch: typeof fetch;
  event(state: "response_headers_received" | "body_read_started" |
    "body_read_completed" | "body_read_failed" | "consumer_returned", status?: number): void;
}

export interface ProjectExperienceConsumerObserverV1 {
  auth(state: string): void;
  mount(): () => void;
  effectActive(enabled: boolean): void;
  initialReadInvocation(active: boolean): void;
  beginRead(controller: AbortController): ProjectExperienceReadObserverV1 | null;
  cleanup(controller: AbortController | null): void;
  cleanupFinished(): void;
}

export function projectExperienceTestObserverV1(instance: object): ProjectExperienceConsumerObserverV1 | null {
  if (process.env.NODE_ENV !== "development" ||
    typeof window === "undefined") return null;
  try {
    const testWindow = window as unknown as {
      __augnesProjectExperienceDiagnosticEventV1?: unknown;
      __augnesProjectExperienceDiagnosticsV1?: {
        consumer(instance: object): ProjectExperienceConsumerObserverV1 | null;
      };
    };
    if (typeof testWindow.__augnesProjectExperienceDiagnosticEventV1 !== "function") return null;
    const portal = testWindow.__augnesProjectExperienceDiagnosticsV1;
    return portal?.consumer(instance) ?? null;
  } catch { return null; }
}
