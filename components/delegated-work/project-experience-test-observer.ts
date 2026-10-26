// Diagnostic seam for the disposable project-experience Browser only. No observer
// is installed by the application. Production builds cannot use the portal;
// development also requires the disposable Browser's CDP binding and portal.
export interface ProjectExperienceReadObserverV1 {
  fetch: typeof fetch;
  event(state: "response_headers_received" | "body_read_started" |
    "body_read_completed" | "body_read_failed" | "consumer_returned" |
    "read_aborted" | "read_failed", status?: number): void;
}

export interface ProjectExperienceConsumerObserverV1 {
  auth(state: string): void;
  mount(): () => void;
  effectActive(enabled: boolean): void;
  initialReadInvocation(active: boolean): void;
  refusalConsumed(response: Response): void;
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

export interface ProjectExperienceGuideReadObserverV1 {
  fetch: typeof fetch;
  event(kind: string, value?: boolean | number): void;
  apply(value: object): void;
}

export interface ProjectExperienceGuideObserverV1 {
  setup(projectId: string | null | undefined): void;
  initial(active: boolean): void;
  abort(controller: AbortController | null, cause: "cleanup" | "supersede"): void;
  abortReturned(controller: AbortController | null): void;
  read(controller: AbortController, projectId: string | null | undefined): ProjectExperienceGuideReadObserverV1 | null;
  commit(guide: object | null, controller: AbortController | null, projectId: string | null | undefined): void;
}

export function projectExperienceGuideObserverV1(instance: object): ProjectExperienceGuideObserverV1 | null {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return null;
  try {
    const testWindow = window as unknown as {
      __augnesGuideLifecycleEventV1?: unknown;
      __augnesGuideLifecycleV1?: { consumer(instance: object): ProjectExperienceGuideObserverV1 | null };
    };
    if (typeof testWindow.__augnesGuideLifecycleEventV1 !== "function") return null;
    return testWindow.__augnesGuideLifecycleV1?.consumer(instance) ?? null;
  } catch { return null; }
}
