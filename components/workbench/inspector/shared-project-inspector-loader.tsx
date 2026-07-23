"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ProductShell } from "@/components/product-shell";
import {
  OperatorSessionPanel,
  type OperatorSessionStateV01,
  type OperatorSessionViewV01,
} from "@/components/workbench/semantic-review/operator-session-panel";
import {
  buildContextualInspectorViewV01,
  deriveSafeContextualInspectorRelatedContextV01,
} from "@/lib/vnext/inspector/contextual-inspector-view";
import { parseSharedInspectorTargetV01 } from "@/lib/vnext/shared-project-inspector-href";
import type { ContextualInspectorRelatedContextV01 } from "@/types/vnext/contextual-inspector";
import type {
  SharedProjectInspectorProjectionV01,
  SharedProjectInspectorTargetV01,
} from "@/types/vnext/shared-project-inspector";

import styles from "./contextual-inspector.module.css";
import { SharedProjectInspectorSurface } from "./shared-project-inspector-surface";

const SESSION_ROUTE = "/api/vnext/operator/session";
const INSPECTOR_ROUTE = "/api/vnext/operator/inspector";

export function SharedProjectInspectorLoader() {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const parsedTarget = useMemo(() => parseTargetV01(searchParams), [searchParams]);
  const [session, setSession] = useState<OperatorSessionStateV01>({
    status: "checking",
    session: null,
    error_code: null,
  });
  const [inspectorResponse, setInspectorResponse] =
    useState<InspectorRouteResponseV01 | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const loadInspector = useCallback(
    async (signal?: AbortSignal) => {
      if (!parsedTarget.target) return;
      setInspectorResponse(null);
      setErrorCode(null);
      try {
        const response = await fetch(`${INSPECTOR_ROUTE}?${query}`, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal,
        });
        const body = (await response.json()) as InspectorRouteResponseV01;
        if (response.status === 401 || response.status === 403) {
          setSession({
            status: "locked",
            session: null,
            error_code: publicErrorCodeV01(body.error_code),
          });
          return;
        }
        if (!response.ok || body.status !== "inspector_read" || !body.inspector) {
          setErrorCode(publicErrorCodeV01(body.error_code));
          return;
        }
        setInspectorResponse(body);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setErrorCode("shared_inspector_request_failed");
        }
      }
    },
    [parsedTarget.target, query],
  );

  useEffect(() => {
    if (!parsedTarget.target) return;
    const controller = new AbortController();
    let active = true;
    void (async () => {
      try {
        const response = await fetch(SESSION_ROUTE, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        const body = (await response.json()) as SessionRouteResponseV01;
        if (!active) return;
        if (response.status === 404) {
          setSession({
            status: "disabled",
            session: null,
            error_code: "not_found",
          });
          return;
        }
        if (!response.ok || body.status !== "authenticated" || !body.session) {
          const code = publicErrorCodeV01(body.error_code);
          setSession({
            status: "locked",
            session: null,
            error_code:
              code === "operator_session_cookie_missing" ? null : code,
          });
          return;
        }
        setSession({
          status: "authenticated",
          session: body.session,
          error_code: null,
        });
        await loadInspector(controller.signal);
      } catch (error) {
        if (
          active &&
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
          setSession({
            status: "locked",
            session: null,
            error_code: "operator_session_request_failed",
          });
        }
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [loadInspector, parsedTarget.target]);

  useEffect(() => {
    if (inspectorResponse?.inspector) {
      headingRef.current?.focus();
    }
  }, [inspectorResponse]);

  function authenticated(value: OperatorSessionViewV01): void {
    setSession({
      status: "authenticated",
      session: value,
      error_code: null,
    });
    void loadInspector();
  }

  function locked(code?: string): void {
    setInspectorResponse(null);
    setSession({
      status: "locked",
      session: null,
      error_code: code ? publicErrorCodeV01(code) : null,
    });
  }

  if (!parsedTarget.target) {
    return (
      <ContextualInspectorState
        state="invalid"
        title="Open exact details from the item you are reviewing"
        copy="Exact details belong to a concrete result, suggested change, delegated run, warning, or project source."
        relatedContext={AI_WORKPLANE_CONTEXT}
        errorCode={parsedTarget.error_code}
      />
    );
  }

  const safeRelatedContext =
    deriveSafeContextualInspectorRelatedContextV01(parsedTarget.target);
  const accessBoundary = (
    <OperatorSessionPanel
      context="exact-details"
      state={session}
      onAuthenticated={authenticated}
      onLocked={locked}
    />
  );
  if (
    session.status === "authenticated" &&
    inspectorResponse?.inspector
  ) {
    const view = buildContextualInspectorViewV01({
      inspector: inspectorResponse.inspector,
      project_activity: inspectorResponse.project_activity,
    });
    return (
      <div ref={(node) => {
        headingRef.current = node?.querySelector<HTMLHeadingElement>(
          "[data-contextual-inspector-heading]",
        ) ?? null;
      }}>
        <SharedProjectInspectorSurface
          inspector={inspectorResponse.inspector}
          view={view}
          accessBoundary={accessBoundary}
        />
      </div>
    );
  }

  if (session.status !== "authenticated") {
    return (
      <ContextualInspectorState
        state="locked"
        title="Exact details require local review access"
        copy="Unlock local review access to read this exact project detail. Protected target material has not been loaded."
        relatedContext={safeRelatedContext}
      >
        {accessBoundary}
      </ContextualInspectorState>
    );
  }

  return (
    <ContextualInspectorState
      state={errorStateV01(errorCode)}
      title={errorTitleV01(errorCode)}
      copy={errorCopyV01(errorCode)}
      relatedContext={safeRelatedContext}
      errorCode={errorCode}
    >
      {accessBoundary}
    </ContextualInspectorState>
  );
}

function ContextualInspectorState({
  state,
  title,
  copy,
  relatedContext,
  errorCode,
  children,
}: {
  state: "invalid" | "locked" | "missing" | "conflict" | "unavailable";
  title: string;
  copy: string;
  relatedContext: ContextualInspectorRelatedContextV01;
  errorCode?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <ProductShell primaryZone="ai-workplane">
      <main
        className={styles.statePage}
        data-shared-project-inspector={state}
        data-contextual-inspector-state={state}
      >
        <div className={styles.stateShell}>
          <a
            className={styles.returnLink}
            href={relatedContext.href}
            data-contextual-inspector-return={relatedContext.kind}
          >
            ← {relatedContext.label}
          </a>
          <header className={styles.header}>
            <p className={styles.eyebrow}>Exact details</p>
            <h1 tabIndex={-1}>{title}</h1>
            <p className={styles.summary}>{copy}</p>
          </header>
          {children}
          {errorCode ? (
            <details className={styles.diagnosticDisclosure}>
              <summary>Technical diagnostic</summary>
              <code>{publicErrorCodeV01(errorCode)}</code>
            </details>
          ) : null}
        </div>
      </main>
    </ProductShell>
  );
}

const AI_WORKPLANE_CONTEXT: ContextualInspectorRelatedContextV01 = {
  kind: "ai_workplane_home",
  label: "Back to AI Workplane",
  href: "/workbench/semantic-review",
  explanation:
    "AI Workplane is the closest related context for this exact detail.",
};

function parseTargetV01(
  params: URLSearchParams,
): { target: SharedProjectInspectorTargetV01 | null; error_code: string | null } {
  try {
    return { target: parseSharedInspectorTargetV01(params), error_code: null };
  } catch (error) {
    return {
      target: null,
      error_code:
        error instanceof Error
          ? publicErrorCodeV01(error.message)
          : "shared_inspector_target_invalid",
    };
  }
}

function errorStateV01(
  errorCode: string | null,
): "missing" | "conflict" | "unavailable" {
  if (errorCode?.includes("conflict") || errorCode?.includes("mismatch")) {
    return "conflict";
  }
  if (
    errorCode?.includes("missing") ||
    errorCode?.includes("not_found") ||
    errorCode?.includes("unavailable")
  ) {
    return "missing";
  }
  return "unavailable";
}

function errorTitleV01(errorCode: string | null): string {
  const state = errorStateV01(errorCode);
  if (state === "missing") return "The exact target is no longer available";
  if (state === "conflict") return "The saved exact sources no longer agree";
  return "Exact details could not be read";
}

function errorCopyV01(errorCode: string | null): string {
  const state = errorStateV01(errorCode);
  if (state === "missing") {
    return "No substitute record was selected and no repair was attempted.";
  }
  if (state === "conflict") {
    return "The exact source conflict was preserved. These details do not repair or choose another record.";
  }
  return "No project write, repair, provider call, or automatic retry was attempted.";
}

interface InspectorRouteResponseV01 {
  ok?: boolean;
  status?: "inspector_read";
  project_activity?: "active" | "inactive_read_only";
  inspector?: SharedProjectInspectorProjectionV01;
  error_code?: string | null;
}

interface SessionRouteResponseV01 {
  ok?: boolean;
  status?: "authenticated";
  session?: OperatorSessionViewV01;
  error_code?: string | null;
}

function publicErrorCodeV01(value: unknown): string {
  return typeof value === "string" && /^[a-z0-9_:-]{1,160}$/u.test(value)
    ? value
    : "shared_inspector_unavailable";
}
