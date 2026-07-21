"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductShell } from "@/components/product-shell";

import {
  OperatorSessionPanel,
  type OperatorSessionStateV01,
  type OperatorSessionViewV01,
} from "@/components/workbench/semantic-review/operator-session-panel";
import type { SharedProjectInspectorProjectionV01 } from "@/types/vnext/shared-project-inspector";

import { SharedProjectInspectorSurface } from "./shared-project-inspector-surface";
import styles from "@/components/workbench/semantic-review/semantic-review.module.css";

const SESSION_ROUTE = "/api/vnext/operator/session";
const INSPECTOR_ROUTE = "/api/vnext/operator/inspector";

export function SharedProjectInspectorLoader() {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [session, setSession] = useState<OperatorSessionStateV01>({
    status: "checking",
    session: null,
    error_code: null,
  });
  const [inspector, setInspector] =
    useState<SharedProjectInspectorProjectionV01 | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const loadInspector = useCallback(async () => {
    setInspector(null);
    setErrorCode(null);
    try {
      const response = await fetch(`${INSPECTOR_ROUTE}?${query}`, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
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
      setInspector(body.inspector);
    } catch {
      setErrorCode("shared_inspector_request_failed");
    }
  }, [query]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch(SESSION_ROUTE, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });
        const body = (await response.json()) as SessionRouteResponseV01;
        if (!active) return;
        if (response.status === 404) {
          setSession({ status: "disabled", session: null, error_code: "not_found" });
          return;
        }
        if (!response.ok || body.status !== "authenticated" || !body.session) {
          const code = publicErrorCodeV01(body.error_code);
          setSession({
            status: "locked",
            session: null,
            error_code: code === "operator_session_cookie_missing" ? null : code,
          });
          return;
        }
        setSession({ status: "authenticated", session: body.session, error_code: null });
        await loadInspector();
      } catch {
        if (active) {
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
    };
  }, [loadInspector]);

  function authenticated(value: OperatorSessionViewV01): void {
    setSession({ status: "authenticated", session: value, error_code: null });
    void loadInspector();
  }

  function locked(code?: string): void {
    setInspector(null);
    setSession({
      status: "locked",
      session: null,
      error_code: code ? publicErrorCodeV01(code) : null,
    });
  }

  const accessBoundary = (
    <OperatorSessionPanel
      state={session}
      onAuthenticated={authenticated}
      onLocked={locked}
    />
  );
  if (session.status === "authenticated" && inspector) {
    return (
      <SharedProjectInspectorSurface
        inspector={inspector}
        accessBoundary={accessBoundary}
      />
    );
  }
  return (
    <ProductShell surface="inspector">
      <main
        className={styles.page}
        data-shared-project-inspector={session.status === "authenticated" ? "error" : "locked"}
      >
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Shared Inspector · exact read-only drill-down</p>
            <h1>{session.status === "authenticated" ? "Inspector target unavailable" : "Private Inspector locked"}</h1>
            <p className={styles.headerCopy}>
              Exact project material loads only after the existing local operator
              session and server-owned project scope are validated.
            </p>
          </div>
        </header>
        {accessBoundary}
        {errorCode ? (
          <section className={styles.notice} role="alert">
            Inspector read unavailable: {errorCode.replaceAll("_", " ")}. No
            repair or semantic write was attempted.
          </section>
        ) : null}
      </div>
      </main>
    </ProductShell>
  );
}

interface InspectorRouteResponseV01 {
  ok?: boolean;
  status?: "inspector_read";
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
