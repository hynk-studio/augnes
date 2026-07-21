"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  SemanticWorkbenchShell,
  type SemanticWorkbenchShellStateV01,
} from "@/components/workbench/semantic-workbench-shell";
import { ProductShell } from "@/components/product-shell";
import {
  OperatorSessionPanel,
  type OperatorSessionStateV01,
  type OperatorSessionViewV01,
} from "./operator-session-panel";
import { DecisionCenteredProposalDetail } from "./decision-centered-proposal-detail";
import { SemanticReviewProposalList } from "./proposal-list";
import { semanticReviewDetailEntryPresentationV01 } from "./semantic-review-entry-presentation";
import type {
  SemanticContextUseReviewRequestV01,
  SemanticReviewDecisionRequestV01,
  SemanticReviewDetailRouteResponseV01,
  SemanticReviewListRouteResponseV01,
  SemanticReviewRevisionRequestV01,
  SemanticReviewStrategicAnalysisRequestV01,
} from "./semantic-review-types";
import styles from "./semantic-review.module.css";

const SESSION_ROUTE = "/api/vnext/operator/session";
const SEMANTIC_REVIEW_ROUTE = "/api/vnext/operator/semantic-review";
const PROJECT_CONTINUITY_ROUTE = "/api/vnext/operator/project-continuity";

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
  const [selectedCandidateBinding, setSelectedCandidateBinding] = useState<{
    proposal_id: string;
    candidate_id: string;
  } | null>(null);
  const [strategicAnalysisBusy, setStrategicAnalysisBusy] = useState(false);
  const operatorMutationInFlight = useRef(false);

  const loadPrivateView = useCallback(async (options?: {
    announceLoading?: boolean;
  }) => {
    const announceLoading = options?.announceLoading ?? true;
    if (announceLoading) setLoadingPrivateView(true);
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
      if (announceLoading) setLoadingPrivateView(false);
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
    setSelectedCandidateBinding({
      proposal_id: request.proposal_id,
      candidate_id: request.candidate_id,
    });
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
      await loadPrivateView({ announceLoading: false });
    } catch {
      setPrivateError("semantic_review_decision_request_failed");
    } finally {
      operatorMutationInFlight.current = false;
      setBusyCandidateId(null);
    }
  }

  async function recordRevision(request: SemanticReviewRevisionRequestV01) {
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
      const body = (await response.json()) as SemanticReviewRevisionResponseV01;
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
      if (
        !(body.status === "inserted" || body.status === "exact_replay") ||
        !body.proposal_id
      ) {
        setPrivateError("semantic_review_revision_response_invalid");
        return;
      }
      setDecisionStatus(
        body.status === "exact_replay"
          ? "Exact operation-aware revision replay returned the immutable existing proposal."
          : "Immutable operation-aware proposal revision recorded. The source proposal remains unchanged.",
      );
      router.push(semanticReviewProposalHref(body.proposal_id));
      router.refresh();
    } catch {
      setPrivateError("semantic_review_revision_request_failed");
    } finally {
      operatorMutationInFlight.current = false;
      setBusyCandidateId(null);
    }
  }

  async function requestStrategicAnalysis(
    request: SemanticReviewStrategicAnalysisRequestV01,
  ) {
    if (
      sessionState.status !== "authenticated" ||
      operatorMutationInFlight.current
    ) {
      return;
    }
    operatorMutationInFlight.current = true;
    setStrategicAnalysisBusy(true);
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
      const body =
        (await response.json()) as SemanticReviewStrategicAnalysisResponseV01;
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
      if (
        (body.status === "inserted" || body.status === "exact_replay") &&
        body.proposal_id
      ) {
        setDecisionStatus(
          body.status === "exact_replay"
            ? "Exact strategic analysis replay returned the existing pending proposal; no model or proposal duplicate was created."
            : "Bounded strategic transfer material is available as a separate pending proposal. The source proposal remains unchanged.",
        );
        router.push(semanticReviewProposalHref(body.proposal_id));
        router.refresh();
        return;
      }
      if (
        body.status === "unavailable" ||
        body.status === "model_denied" ||
        body.status === "model_timeout" ||
        body.status === "model_cancelled" ||
        body.status === "model_failed" ||
        body.status === "malformed_output" ||
        body.status === "source_conflict" ||
        body.status === "stale_base" ||
        body.status === "proposal_admission_failed"
      ) {
        setDecisionStatus(
          `Optional strategic analysis ${body.status.replaceAll("_", " ")}: ${publicStrategicReason(body.reason)}. Normal zero-model proposal review remains available.`,
        );
        await loadPrivateView();
        return;
      }
      setPrivateError("semantic_review_strategic_response_invalid");
    } catch {
      setPrivateError("semantic_review_strategic_request_failed");
    } finally {
      operatorMutationInFlight.current = false;
      setStrategicAnalysisBusy(false);
    }
  }

  async function recordContextUseReview(
    request: SemanticContextUseReviewRequestV01,
  ) {
    if (
      sessionState.status !== "authenticated" ||
      operatorMutationInFlight.current
    ) {
      return;
    }
    operatorMutationInFlight.current = true;
    setDecisionStatus(null);
    setPrivateError(null);
    try {
      const response = await fetch(PROJECT_CONTINUITY_ROUTE, {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      const body = (await response.json()) as SemanticReviewMutationResponseV01;
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          locked(publicErrorCode(body.error_code));
          return;
        }
        setPrivateError(publicErrorCode(body.error_code));
        return;
      }
      if (!(body.status === "inserted" || body.status === "exact_replay")) {
        setPrivateError("context_use_review_response_invalid");
        return;
      }
      setDecisionStatus(
        body.status === "exact_replay"
          ? "Exact ContextUseReview replay returned the existing bounded review."
          : "Bounded ContextUseReview recorded. It changed no semantic state or later context.",
      );
      await loadPrivateView();
    } catch {
      setPrivateError("context_use_review_request_failed");
    } finally {
      operatorMutationInFlight.current = false;
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
    await loadPrivateView({ announceLoading: false });
  }

  const privateMaterialVisible =
    sessionState.status === "authenticated" && privateView !== null;
  const entryPresentation = semanticReviewEntryPresentation(
    sessionState,
    privateView,
  );
  const projectHref = privateView
    ? `/projects/${encodeURIComponent(privateView.value.project.project_id)}`
    : "/";

  return (
    <ProductShell surface="workbench">
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
      <SemanticWorkbenchShell
        title={proposalId ? "Verify and decide" : "Review project decisions"}
        description="Trace exact evidence to one explicit decision; an applied Transition remains a separate step."
        entryState={entryPresentation.state}
        entryLabel={entryPresentation.label}
        projectHref={projectHref}
        inspectorHref={
          privateView?.value.inspector_href
        }
        navigation={[{ href: "/workbench", label: "Workplane compatibility" }]}
      >
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
            proposals={privateView.value.proposals}
            reconciliation={privateView.value.project_verify_reconciliation}
            continuity={privateView.value.project_continuity}
          />
        ) : null}

        {privateMaterialVisible && privateView.kind === "detail" ? (
          <DecisionCenteredProposalDetail
            read={privateView.value.proposal}
            selectedCandidateId={
              selectedCandidateBinding?.proposal_id ===
              privateView.value.proposal.proposal.proposal_id
                ? selectedCandidateBinding.candidate_id
                : null
            }
            onSelectedCandidateChange={(candidateId) =>
              setSelectedCandidateBinding({
                proposal_id:
                  privateView.value.proposal.proposal.proposal_id,
                candidate_id: candidateId,
              })
            }
            busyCandidateId={busyCandidateId}
            onDecision={recordDecision}
            onRevision={recordRevision}
            onStrategicAnalysis={requestStrategicAnalysis}
            strategicAnalysisBusy={strategicAnalysisBusy}
            onContextUseReview={recordContextUseReview}
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
      </SemanticWorkbenchShell>
      </main>
    </ProductShell>
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

interface SemanticReviewRevisionResponseV01 {
  status?: string;
  error_code?: string | null;
  proposal_id?: string;
}

interface SemanticReviewStrategicAnalysisResponseV01 {
  status?:
    | "inserted"
    | "exact_replay"
    | "unavailable"
    | "model_denied"
    | "model_timeout"
    | "model_cancelled"
    | "model_failed"
    | "malformed_output"
    | "source_conflict"
    | "stale_base"
    | "proposal_admission_failed";
  error_code?: string | null;
  proposal_id?: string | null;
  reason?: string | null;
  retryable?: boolean;
  model_invocation_count?: 0 | 1;
  source_proposal_unchanged?: true;
}

interface SemanticReviewMutationResponseV01 {
  status?: string;
  error_code?: string | null;
}

function publicErrorCode(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 96) {
    return "semantic_review_request_failed";
  }
  return /^[a-z0-9_:-]+$/.test(value)
    ? value
    : "semantic_review_request_failed";
}

function publicStrategicReason(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 160) {
    return "bounded request unavailable";
  }
  return /^[a-z0-9_:-]+$/.test(value)
    ? value.replaceAll("_", " ")
    : "bounded request unavailable";
}

function semanticReviewProposalHref(proposalId: string | undefined): string {
  return proposalId && /^episode-delta-proposal:[a-f0-9]{24}$/.test(proposalId)
    ? `/workbench/semantic-review/${proposalId.replace(":", "~")}`
    : "/workbench/semantic-review";
}

function semanticReviewEntryPresentation(
  sessionState: OperatorSessionStateV01,
  privateView: PrivateSemanticReviewViewV01 | null,
): { state: SemanticWorkbenchShellStateV01; label: string } {
  if (sessionState.status !== "authenticated") {
    return sessionState.status === "checking"
      ? { state: "loading", label: "Validating local access" }
      : { state: "locked", label: "Private review locked" };
  }
  if (!privateView) {
    return { state: "loading", label: "Loading project review" };
  }
  if (privateView.kind === "list") {
    return { state: "proposal_queue", label: "Project proposal queue" };
  }
  return semanticReviewDetailEntryPresentationV01(privateView.value.proposal);
}
