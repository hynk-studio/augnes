"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  AIWorkplaneShell,
  type AIWorkplaneShellStateV01,
} from "@/components/workbench/ai-workplane/ai-workplane-shell";
import { useProjectGuideBriefV02 } from "@/components/guide/use-project-guide-brief-v0-2";
import { ProductShell } from "@/components/product-shell";
import { DelegatedWorkPanel } from "@/components/delegated-work/delegated-work-panel";
import { useDelegatedCodexWorkV01 } from "@/components/delegated-work/use-delegated-codex-work-v0-1";
import type { ProjectGuideBriefV02 } from "@/types/vnext/guide-brief";
import {
  buildAIWorkplaneHomeViewV01,
  compareAIWorkplaneGuideProjectV01,
} from "@/lib/vnext/ai-workplane/ai-workplane-view";
import { refreshAIWorkplaneAfterProjectApplicationV01 } from "@/lib/vnext/ai-workplane/ai-workplane-refresh";
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

export function SemanticReviewSurface({
  proposalId,
  guide: initialGuide,
}: {
  proposalId?: string;
  guide?: ProjectGuideBriefV02;
}) {
  const router = useRouter();
  const guideState = useProjectGuideBriefV02(initialGuide);
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
  const lastGuideSyncKey = useRef<string | null>(null);
  const lastTrustedResultRef = useRef<string | null>(null);
  const delegatedState = useDelegatedCodexWorkV01(
    sessionState.status === "authenticated" && !proposalId,
  );

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
          ? "Existing decision reused. No duplicate was saved."
          : body.transition_requested
            ? "Decision saved. The project has not changed yet."
            : "Decision saved. No project change was requested.",
      );
      await loadPrivateView({ announceLoading: false });
      await guideState.refresh();
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
          ? "Existing clarified change reused."
          : "A clarified change is ready for separate review. The original suggestion is unchanged.",
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
            ? "Existing strategic review reused; no duplicate was created."
            : "Strategic implications are ready as a separate suggested change. The source suggestion is unchanged.",
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
          ? "Existing context feedback reused."
          : "Context feedback saved. It did not change the project or future work context.",
      );
      await loadPrivateView();
      await guideState.refresh();
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

  async function refreshExactReviewMaterial(): Promise<void> {
    await loadPrivateView({ announceLoading: false });
  }

  async function refreshAfterProjectApplication(): Promise<void> {
    await refreshAIWorkplaneAfterProjectApplicationV01({
      refresh_exact_review: refreshExactReviewMaterial,
      refresh_guide_brief: guideState.refresh,
    });
  }

  useEffect(() => {
    const delegated = delegatedState.projection;
    if (!delegated || proposalId) return;
    const guideDelegated = guideState.guide?.coordinate.delegated_work ?? null;
    const exactKey = [
      delegated.stage,
      delegated.current.latest_checkpoint ?? "",
      delegated.current.trusted_result_available ? "result" : "no-result",
      delegated.control_revision,
    ].join("\u0000");
    const guideKey = guideDelegated
      ? [
          guideDelegated.stage,
          guideDelegated.latest_checkpoint ?? "",
          guideDelegated.trusted_result_available ? "result" : "no-result",
        ].join("\u0000")
      : "";
    const comparableExactKey = [
      delegated.stage,
      delegated.current.latest_checkpoint ?? "",
      delegated.current.trusted_result_available ? "result" : "no-result",
    ].join("\u0000");
    if (
      comparableExactKey !== guideKey &&
      lastGuideSyncKey.current !== exactKey
    ) {
      lastGuideSyncKey.current = exactKey;
      void guideState.refresh();
    }
  }, [
    delegatedState.projection,
    guideState.guide,
    guideState.refresh,
    proposalId,
  ]);

  useEffect(() => {
    const resultRef = delegatedState.projection?.result?.receipt_ref ?? null;
    if (
      !resultRef ||
      resultRef === lastTrustedResultRef.current ||
      sessionState.status !== "authenticated" ||
      proposalId
    ) {
      return;
    }
    lastTrustedResultRef.current = resultRef;
    void loadPrivateView({ announceLoading: false });
  }, [
    delegatedState.projection?.result?.receipt_ref,
    loadPrivateView,
    proposalId,
    sessionState.status,
  ]);

  const privateMaterialVisible =
    sessionState.status === "authenticated" && privateView !== null;
  const guideConsistency = compareAIWorkplaneGuideProjectV01(
    guideState.guide,
    privateView?.value.project.project_id ?? null,
  );
  const exactReviewAvailable =
    privateMaterialVisible && !guideConsistency.blocks_actions;
  const homeView = buildAIWorkplaneHomeViewV01({
    access: sessionState.status,
    loading:
      loadingPrivateView ||
      (sessionState.status === "authenticated" &&
        privateView === null &&
        !privateError),
    guide: guideState.guide,
    proposals: privateView?.kind === "list" ? privateView.value.proposals : [],
    continuity:
      privateView?.kind === "list"
        ? privateView.value.project_continuity
        : privateView?.kind === "detail"
          ? privateView.value.proposal.project_continuity
          : null,
    delegated_work: !proposalId ? delegatedState.projection : null,
  });
  const delegatedOwnsFocus =
    !proposalId &&
    Boolean(
      delegatedState.projection &&
        (delegatedState.projection.stage !== "not_started" ||
          (delegatedState.projection.start_eligible &&
            homeView.state === "delegated_ready")),
    );
  const entryPresentation = aiWorkplaneEntryPresentation(
    sessionState,
    privateView,
    homeView.state,
  );
  const projectHref = privateView
    ? `/projects/${encodeURIComponent(privateView.value.project.project_id)}`
    : "/";

  return (
    <ProductShell primaryZone="ai-workplane">
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
      <AIWorkplaneShell
        guide={guideState.projection}
        guideLoading={guideState.status === "loading"}
        guideRequestCount={guideState.requestCountRef.current}
        priorityContent={
          exactReviewAvailable &&
          privateView?.kind === "list" &&
          delegatedState.projection ? (
            <DelegatedWorkPanel
              projection={delegatedState.projection}
              status={delegatedState.status}
              error={delegatedState.error}
              requestCount={delegatedState.requestCountRef.current}
              ownsPrimaryAction={delegatedOwnsFocus}
              onAction={delegatedState.act}
            />
          ) : null
        }
        title={proposalId ? "Review suggested change" : homeView.heading}
        description={
          proposalId
            ? "Understand what would change, what was verified, what remains uncertain, and the decision that is yours."
            : homeView.situation
        }
        state={guideConsistency.blocks_actions ? "blocked" : entryPresentation.state}
        stateLabel={
          guideConsistency.blocks_actions
            ? "Current project sources do not agree"
            : entryPresentation.label
        }
        projectHref={projectHref}
        exactDetailsHref={
          privateView?.kind === "detail"
            ? privateView.value.inspector_href
            : undefined
        }
      >
        <OperatorSessionPanel
          state={sessionState}
          onAuthenticated={authenticated}
          onLocked={locked}
        />

        {sessionState.status === "authenticated" && loadingPrivateView ? (
          <section className={styles.panel} aria-live="polite">
            <p className={styles.copy}>Loading protected project review…</p>
          </section>
        ) : null}

        {privateError && sessionState.status === "authenticated" ? (
          <p className={styles.error} role="alert">
            {privateError}
          </p>
        ) : null}

        {guideConsistency.blocks_actions ? (
          <section
            className={`${styles.panel} ${styles.workplaneFocus}`}
            role="alert"
            data-ai-workplane-guide-consistency={guideConsistency.status}
          >
            <h2>Check the current project before continuing</h2>
            <p className={styles.copy}>{guideConsistency.message}</p>
            <a
              className={styles.button}
              href="/"
              data-ai-workplane-primary-action="open-blank-state"
            >
              Open Blank State
            </a>
          </section>
        ) : null}

        {decisionStatus && exactReviewAvailable ? (
          <p className={styles.success} role="status">
            {decisionStatus}
          </p>
        ) : null}

        {exactReviewAvailable && privateView.kind === "list" ? (
          <SemanticReviewProposalList
            proposals={privateView.value.proposals}
            reconciliation={privateView.value.project_verify_reconciliation}
            continuity={privateView.value.project_continuity}
            view={homeView}
            showCurrentFocus={!delegatedOwnsFocus}
          />
        ) : null}

        {exactReviewAvailable && privateView.kind === "detail" ? (
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
            onExactReviewMaterialChanged={refreshExactReviewMaterial}
            onProjectApplicationCompleted={refreshAfterProjectApplication}
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
            Protected project review is not loaded until local review access is
            established for the current project.
          </p>
        ) : null}
      </AIWorkplaneShell>
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

function aiWorkplaneEntryPresentation(
  sessionState: OperatorSessionStateV01,
  privateView: PrivateSemanticReviewViewV01 | null,
  homeState: ReturnType<typeof buildAIWorkplaneHomeViewV01>["state"],
): { state: AIWorkplaneShellStateV01; label: string } {
  if (sessionState.status !== "authenticated") {
    return sessionState.status === "checking"
      ? { state: "loading", label: "Checking local review access" }
      : { state: "access_required", label: "Local review access required" };
  }
  if (!privateView) {
    return { state: "loading", label: "Loading current review" };
  }
  if (privateView.kind === "list") {
    return {
      state: homeState,
      label:
        homeState === "change_completion"
          ? "Decision saved · project unchanged"
          : homeState === "change_decision"
            ? "Needs your decision"
            : homeState === "delegated_approval"
              ? "Waiting for your approval"
              : homeState === "delegated_resume"
                ? "Codex work interrupted"
                : homeState === "delegated_cancelling"
                  ? "Codex work stopping"
                  : homeState === "delegated_ready"
                    ? "Ready to delegate"
            : homeState === "result_ready"
              ? "Result ready"
              : homeState === "work_in_progress"
                ? "Work in progress"
                : homeState === "no_project"
                  ? "No current project"
                  : homeState === "guidance_unavailable"
                    ? "Current guidance unavailable"
                    : "No current decision",
    };
  }
  const exact = semanticReviewDetailEntryPresentationV01(
    privateView.value.proposal,
  );
  return exact.state === "pending_proposal"
    ? { state: "change_decision", label: "Needs your decision" }
    : exact.state === "decided_proposal" ||
        exact.state === "transition_blocked"
      ? {
          state: "change_completion",
          label: "Decision saved · project unchanged",
        }
      : { state: "change_applied", label: "Project updated" };
}
