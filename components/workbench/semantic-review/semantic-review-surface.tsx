"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  OperatorSessionPanel,
  type OperatorSessionStateV01,
  type OperatorSessionViewV01,
} from "./operator-session-panel";
import { SemanticReviewProposalDetail } from "./proposal-detail";
import { SemanticReviewProposalList } from "./proposal-list";
import type {
  SemanticReviewDecisionRequestV01,
  SemanticReviewDetailRouteResponseV01,
  SemanticReviewListRouteResponseV01,
} from "./semantic-review-types";
import styles from "./semantic-review.module.css";

const SESSION_ROUTE = "/api/vnext/operator/session";
const SEMANTIC_REVIEW_ROUTE = "/api/vnext/operator/semantic-review";

type PrivateSemanticReviewViewV01 =
  | { kind: "list"; value: SemanticReviewListRouteResponseV01 }
  | { kind: "detail"; value: SemanticReviewDetailRouteResponseV01 };

export function SemanticReviewSurface({ proposalId }: { proposalId?: string }) {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<OperatorSessionStateV01>({
    status: "checking",
    session: null,
    error_code: null,
  });
  const [privateView, setPrivateView] =
    useState<PrivateSemanticReviewViewV01 | null>(null);
  const [loadingPrivateView, setLoadingPrivateView] = useState(false);
  const [privateError, setPrivateError] = useState<string | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<string | null>(null);
  const [busyCandidateId, setBusyCandidateId] = useState<string | null>(null);
  const operatorMutationInFlight = useRef(false);

  const loadPrivateView = useCallback(async () => {
    setLoadingPrivateView(true);
    setPrivateError(null);
    try {
      const url = proposalId
        ? `${SEMANTIC_REVIEW_ROUTE}?${new URLSearchParams({
            proposal_id: proposalId,
          }).toString()}`
        : SEMANTIC_REVIEW_ROUTE;
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });
      const body = (await response.json()) as SemanticReviewReadResponseV01;
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setPrivateView(null);
          setSessionState({
            status: "locked",
            session: null,
            error_code: publicErrorCode(body.error_code),
          });
          return;
        }
        throw new Error(publicErrorCode(body.error_code));
      }
      if (body.status === "proposal_list" && body.project && body.proposals) {
        setPrivateView({
          kind: "list",
          value: body as SemanticReviewListRouteResponseV01,
        });
        return;
      }
      if (body.status === "proposal_detail" && body.project && body.proposal) {
        setPrivateView({
          kind: "detail",
          value: body as SemanticReviewDetailRouteResponseV01,
        });
        return;
      }
      throw new Error("semantic_review_response_invalid");
    } catch (error) {
      setPrivateView(null);
      setPrivateError(
        error instanceof Error
          ? publicErrorCode(error.message)
          : "semantic_review_request_failed",
      );
    } finally {
      setLoadingPrivateView(false);
    }
  }, [proposalId]);

  const checkSession = useCallback(async () => {
    setPrivateView(null);
    setPrivateError(null);
    try {
      const response = await fetch(SESSION_ROUTE, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });
      const body = (await response.json()) as SessionCheckResponseV01;
      if (response.status === 404) {
        setSessionState({
          status: "disabled",
          session: null,
          error_code: "not_found",
        });
        return;
      }
      if (!response.ok || body.status !== "authenticated" || !body.session) {
        const errorCode = publicErrorCode(body.error_code);
        setSessionState({
          status: "locked",
          session: null,
          error_code:
            errorCode === "operator_session_cookie_missing" ? null : errorCode,
        });
        return;
      }
      setSessionState({
        status: "authenticated",
        session: body.session,
        error_code: null,
      });
      await loadPrivateView();
    } catch {
      setSessionState({
        status: "locked",
        session: null,
        error_code: "operator_session_request_failed",
      });
    }
  }, [loadPrivateView]);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  async function recordDecision(request: SemanticReviewDecisionRequestV01) {
    if (
      sessionState.status !== "authenticated" ||
      operatorMutationInFlight.current
    ) {
      return;
    }
    operatorMutationInFlight.current = true;
    setBusyCandidateId(request.candidate_id);
    setDecisionStatus(null);
    setPrivateError(null);
    try {
      const response = await fetch(SEMANTIC_REVIEW_ROUTE, {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      const body = (await response.json()) as SemanticReviewDecisionResponseV01;
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setPrivateView(null);
          setSessionState({
            status: "locked",
            session: null,
            error_code: publicErrorCode(body.error_code),
          });
          return;
        }
        setPrivateError(publicErrorCode(body.error_code));
        return;
      }
      if (body.status !== "inserted" && body.status !== "exact_replay") {
        setPrivateError("semantic_review_decision_response_invalid");
        return;
      }
      setDecisionStatus(
        body.status === "exact_replay"
          ? "Exact ReviewDecision replay returned the existing record; no duplicate was written."
          : body.transition_requested
            ? "ReviewDecision recorded with transition intent only. No state transition occurred."
            : "ReviewDecision recorded with no transition intent. No state transition occurred.",
      );
      router.replace(
        semanticReviewProposalHref(proposalId),
      );
      router.refresh();
      await loadPrivateView();
    } catch {
      setPrivateError("semantic_review_decision_request_failed");
    } finally {
      operatorMutationInFlight.current = false;
      setBusyCandidateId(null);
    }
  }

  function authenticated(session: OperatorSessionViewV01) {
    setPrivateView(null);
    setSessionState({
      status: "authenticated",
      session,
      error_code: null,
    });
    void loadPrivateView();
  }

  function locked(errorCode?: string) {
    setPrivateView(null);
    setDecisionStatus(null);
    setSessionState({
      status: "locked",
      session: null,
      error_code: errorCode ? publicErrorCode(errorCode) : null,
    });
  }

  async function refreshPrivateMaterial(): Promise<void> {
    router.replace(
      semanticReviewProposalHref(proposalId),
    );
    router.refresh();
    await loadPrivateView();
  }

  const privateMaterialVisible =
    sessionState.status === "authenticated" && privateView !== null;

  return (
    <main
      className={styles.page}
      data-vnext-semantic-review="v0.1"
      data-vnext-private-material-rendered={String(privateMaterialVisible)}
      data-vnext-semantic-review-state={
        sessionState.status === "authenticated"
          ? privateView
            ? "authenticated_loaded"
            : "authenticated_loading"
          : sessionState.status
      }
    >
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Augnes Semantic Workbench / M3D pilot</p>
            <h1>{proposalId ? "Review proposal" : "Semantic review"}</h1>
            <p className={styles.headerCopy}>
              Review bounded project-semantic candidates, record an explicit
              ReviewDecision, and keep preview, gate confirmation, durable commit, and
              later-context compilation as separate operator actions. This surface is
              not a general chat, terminal, code editor, Git diff, provider session
              manager, or scheduler.
            </p>
          </div>
          <nav className={styles.nav} aria-label="Semantic review navigation">
            {proposalId ? <a href="/workbench/semantic-review">All proposals</a> : null}
            <a href="/workbench">Agent Workplane</a>
            <a href="/">Project Home</a>
          </nav>
        </header>

        <div className={styles.boundaryBand} aria-label="Semantic review boundaries">
          <span>proposal is not state</span>
          <span>decision is not transition</span>
          <span>local session is not external identity</span>
          <span>confirmation is gate only</span>
          <span>packet compilation is not transition</span>
        </div>

        <OperatorSessionPanel
          state={sessionState}
          onAuthenticated={authenticated}
          onLocked={locked}
        />

        {sessionState.status === "authenticated" && loadingPrivateView ? (
          <section className={styles.panel} aria-live="polite">
            <p className={styles.copy}>Loading authenticated project review material…</p>
          </section>
        ) : null}

        {privateError && sessionState.status === "authenticated" ? (
          <p className={styles.error} role="alert">
            {privateError}
          </p>
        ) : null}

        {decisionStatus && privateMaterialVisible ? (
          <p className={styles.success} role="status">
            {decisionStatus}
          </p>
        ) : null}

        {privateMaterialVisible && privateView.kind === "list" ? (
          <SemanticReviewProposalList
            project={privateView.value.project}
            proposals={privateView.value.proposals}
          />
        ) : null}

        {privateMaterialVisible && privateView.kind === "detail" ? (
          <SemanticReviewProposalDetail
            project={privateView.value.project}
            read={privateView.value.proposal}
            busyCandidateId={busyCandidateId}
            onDecision={recordDecision}
            onSessionInvalid={(errorCode) => locked(errorCode)}
            onPrivateMaterialChanged={refreshPrivateMaterial}
            tryBeginOperatorMutation={() => {
              if (operatorMutationInFlight.current) return false;
              operatorMutationInFlight.current = true;
              return true;
            }}
            endOperatorMutation={() => {
              operatorMutationInFlight.current = false;
            }}
          />
        ) : null}

        {sessionState.status !== "authenticated" ? (
          <p className={styles.muted}>
            Private proposal and decision material is not rendered without an
            authenticated, project-scoped local session.
          </p>
        ) : null}
      </div>
    </main>
  );
}

interface SessionCheckResponseV01 {
  status?: string;
  error_code?: string | null;
  session?: OperatorSessionViewV01;
}

interface SemanticReviewRouteErrorV01 {
  error_code?: string | null;
}

interface SemanticReviewReadResponseV01 extends SemanticReviewRouteErrorV01 {
  status?: string;
  project?: SemanticReviewListRouteResponseV01["project"];
  proposals?: SemanticReviewListRouteResponseV01["proposals"];
  proposal?: SemanticReviewDetailRouteResponseV01["proposal"];
}

interface SemanticReviewDecisionResponseV01 {
  status?: string;
  error_code?: string | null;
  transition_requested?: boolean;
}

function publicErrorCode(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 96) {
    return "semantic_review_request_failed";
  }
  return /^[a-z0-9_:-]+$/.test(value)
    ? value
    : "semantic_review_request_failed";
}

function semanticReviewProposalHref(proposalId: string | undefined): string {
  return proposalId && /^episode-delta-proposal:[a-f0-9]{24}$/.test(proposalId)
    ? `/workbench/semantic-review/${proposalId.replace(":", "~")}`
    : "/workbench/semantic-review";
}
