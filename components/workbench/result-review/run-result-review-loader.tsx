"use client";

import { useCallback, useEffect, useState } from "react";

import {
  OperatorSessionPanel,
  type OperatorSessionStateV01,
  type OperatorSessionViewV01,
} from "@/components/workbench/semantic-review/operator-session-panel";
import type { ProjectRunResultDetailV01 } from "@/types/vnext/project-run-result";

import { RunResultReviewSurface } from "./run-result-review-surface";
import styles from "@/components/workbench/semantic-review/semantic-review.module.css";

const SESSION_ROUTE = "/api/vnext/operator/session";
const RESULT_ROUTE = "/api/vnext/operator/run-results";

export function RunResultReviewLoader({ receiptId }: { receiptId: string }) {
  const [session, setSession] = useState<OperatorSessionStateV01>({
    status: "checking",
    session: null,
    error_code: null,
  });
  const [result, setResult] = useState<ProjectRunResultDetailV01 | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const loadResult = useCallback(async () => {
    setResult(null);
    setErrorCode(null);
    try {
      const response = await fetch(
        `${RESULT_ROUTE}?${new URLSearchParams({ receipt_ref: receiptId })}`,
        { method: "GET", cache: "no-store", credentials: "same-origin" },
      );
      const body = (await response.json()) as ResultRouteResponseV01;
      if (response.status === 401 || response.status === 403) {
        setSession({
          status: "locked",
          session: null,
          error_code: publicErrorCodeV01(body.error_code),
        });
        return;
      }
      if (!response.ok || body.status !== "result_detail" || !body.result) {
        setErrorCode(publicErrorCodeV01(body.error_code));
        return;
      }
      setResult(body.result);
    } catch {
      setErrorCode("run_result_request_failed");
    }
  }, [receiptId]);

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
          setSession({
            status: "disabled",
            session: null,
            error_code: "not_found",
          });
          return;
        }
        if (!response.ok || body.status !== "authenticated" || !body.session) {
          setSession({
            status: "locked",
            session: null,
            error_code:
              publicErrorCodeV01(body.error_code) ===
              "operator_session_cookie_missing"
                ? null
                : publicErrorCodeV01(body.error_code),
          });
          return;
        }
        setSession({
          status: "authenticated",
          session: body.session,
          error_code: null,
        });
        await loadResult();
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
  }, [loadResult]);

  function authenticated(value: OperatorSessionViewV01): void {
    setSession({ status: "authenticated", session: value, error_code: null });
    void loadResult();
  }

  function locked(code?: string): void {
    setResult(null);
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
  if (session.status === "authenticated" && result) {
    return (
      <RunResultReviewSurface
        result={result}
        accessBoundary={accessBoundary}
      />
    );
  }
  return (
    <main className={styles.page} data-run-result-review="locked">
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Semantic Workbench · read-only result</p>
            <h1>Review native-host result</h1>
            <p className={styles.headerCopy}>
              Private result detail is loaded only after the existing local
              operator session is validated.
            </p>
          </div>
        </header>
        {accessBoundary}
        {session.status === "authenticated" && !errorCode ? (
          <section className={styles.panel} aria-live="polite">
            <p className={styles.copy}>Loading immutable result detail…</p>
          </section>
        ) : null}
        {errorCode ? (
          <p className={styles.error} role="alert">{errorCode}</p>
        ) : null}
      </div>
    </main>
  );
}

interface SessionRouteResponseV01 {
  status?: string;
  error_code?: string | null;
  session?: OperatorSessionViewV01;
}

interface ResultRouteResponseV01 {
  status?: string;
  error_code?: string | null;
  result?: ProjectRunResultDetailV01;
}

function publicErrorCodeV01(value: unknown): string {
  if (typeof value !== "string" || !/^[a-z0-9_:-]{1,96}$/u.test(value)) {
    return "run_result_read_failed";
  }
  return value;
}
