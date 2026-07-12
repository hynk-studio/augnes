"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import styles from "./semantic-review.module.css";

const SESSION_ROUTE = "/api/vnext/operator/session";

export interface OperatorSessionViewV01 {
  session_id: string;
  workspace_id: string;
  project_id: string;
  operator_id: string;
  issued_at: string;
  expires_at: string;
  authenticated: boolean;
}

export type OperatorSessionStateV01 =
  | { status: "checking"; session: null; error_code: null }
  | { status: "locked"; session: null; error_code: string | null }
  | { status: "disabled"; session: null; error_code: "not_found" }
  | {
      status: "authenticated";
      session: OperatorSessionViewV01;
      error_code: null;
    };

export function OperatorSessionPanel({
  state,
  onAuthenticated,
  onLocked,
}: {
  state: OperatorSessionStateV01;
  onAuthenticated: (session: OperatorSessionViewV01) => void;
  onLocked: (errorCode?: string) => void;
}) {
  const [bootstrapToken, setBootstrapToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function submitBootstrap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || bootstrapToken.length === 0) return;

    const submittedToken = bootstrapToken;
    setBootstrapToken("");
    setBusy(true);
    setStatusMessage(null);
    try {
      const response = await fetch(SESSION_ROUTE, {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "bootstrap",
          bootstrap_token: submittedToken,
        }),
      });
      const body = (await response.json()) as SessionRouteResponseV01;
      if (!response.ok || body.status !== "authenticated" || !body.session) {
        setStatusMessage(publicErrorCode(body.error_code));
        onLocked(body.error_code ?? "operator_bootstrap_invalid");
        return;
      }
      setStatusMessage("Local session established. No external identity was verified.");
      onAuthenticated(body.session);
    } catch {
      setStatusMessage("operator_session_request_failed");
      onLocked("operator_session_request_failed");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (busy) return;
    setBusy(true);
    setStatusMessage(null);
    try {
      const response = await fetch(SESSION_ROUTE, {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      const body = (await response.json()) as SessionRouteResponseV01;
      if (!response.ok || body.status !== "revoked") {
        setStatusMessage(publicErrorCode(body.error_code));
        return;
      }
      setStatusMessage("Local operator session revoked.");
      onLocked();
    } catch {
      setStatusMessage("operator_session_request_failed");
    } finally {
      setBusy(false);
    }
  }

  if (state.status === "checking") {
    return (
      <section className={styles.lockedPanel} data-vnext-operator-session="checking">
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Local operator session</p>
          <h2>Checking opt-in access</h2>
        </div>
        <p className={styles.copy} role="status">
          No proposal or decision material is loaded before local session validation.
        </p>
      </section>
    );
  }

  if (state.status === "disabled") {
    return (
      <section className={styles.lockedPanel} data-vnext-operator-session="disabled">
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Operator pilot disabled</p>
          <h2>Semantic review is not exposed</h2>
        </div>
        <p className={styles.notice}>
          The local operator pilot is disabled. This page loaded no private proposal,
          decision, state, or session material.
        </p>
      </section>
    );
  }

  if (state.status === "authenticated") {
    return (
      <section className={styles.panel} data-vnext-operator-session="authenticated">
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Local operator session</p>
          <h2>Possession-authenticated for this project</h2>
        </div>
        <dl className={styles.statusGrid}>
          <div>
            <dt>Workspace</dt>
            <dd>{state.session.workspace_id}</dd>
          </div>
          <div>
            <dt>Project</dt>
            <dd>{state.session.project_id}</dd>
          </div>
          <div>
            <dt>Configured operator</dt>
            <dd>{state.session.operator_id}</dd>
          </div>
          <div>
            <dt>Session expires</dt>
            <dd>{state.session.expires_at}</dd>
          </div>
        </dl>
        <p className={styles.notice}>
          This session proves possession of a locally issued secret. It does not prove
          legal identity, operating-system ownership, organization membership, or any
          external identity.
        </p>
        <div className={styles.buttonRow}>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={busy}
            onClick={() => void logout()}
          >
            {busy ? "Revoking session…" : "Log out and revoke session"}
          </button>
        </div>
        {statusMessage ? (
          <p className={styles.copy} role="status">
            {statusMessage}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className={styles.lockedPanel} data-vnext-operator-session="locked">
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Opt-in local access</p>
        <h2>Enter the one-time bootstrap token</h2>
      </div>
      <p className={styles.copy}>
        The token is accepted only through this local POST form. It is not placed in a
        URL, server-rendered HTML, log message, or persisted plaintext field.
      </p>
      <form className={styles.form} onSubmit={submitBootstrap}>
        <label htmlFor="vnext-operator-bootstrap-token">One-time bootstrap token</label>
        <input
          id="vnext-operator-bootstrap-token"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={bootstrapToken}
          onChange={(event) => setBootstrapToken(event.target.value)}
        />
        <button
          className={styles.button}
          type="submit"
          disabled={busy || bootstrapToken.length === 0}
        >
          {busy ? "Establishing local session…" : "Establish local session"}
        </button>
      </form>
      <p className={styles.notice}>
        Local secret possession is not external identity proof and grants no semantic
        transition authority by itself.
      </p>
      {statusMessage || state.error_code ? (
        <p className={styles.error} role="alert">
          {statusMessage ?? publicErrorCode(state.error_code)}
        </p>
      ) : null}
    </section>
  );
}

interface SessionRouteResponseV01 {
  status?: string;
  error_code?: string | null;
  session?: OperatorSessionViewV01;
}

function publicErrorCode(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 96) {
    return "operator_session_invalid";
  }
  return /^[a-z0-9_:-]+$/.test(value) ? value : "operator_session_invalid";
}
