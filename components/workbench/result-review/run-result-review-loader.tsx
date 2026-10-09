"use client";

import type { WorkComposerDraft } from "../semantic-review/work-composer-draft";

import { ProjectClientScopeProvider, useProjectClientFetch, useProjectClientScope } from "../semantic-review/project-client-scope";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  OperatorSessionPanel,
  type OperatorSessionStateV01,
  type OperatorSessionViewV01,
} from "@/components/workbench/semantic-review/operator-session-panel";
import { AIWorkplaneShell } from "@/components/workbench/ai-workplane/ai-workplane-shell";
import { useProjectGuideBriefV02 } from "@/components/guide/use-project-guide-brief-v0-2";
import { ProductShell } from "@/components/product-shell";
import type { ProjectRunResultDetailV01 } from "@/types/vnext/project-run-result";
import type { ProjectGuideBriefV02 } from "@/types/vnext/guide-brief";

import { RunResultReviewSurface } from "./run-result-review-surface";
import styles from "@/components/workbench/semantic-review/semantic-review.module.css";

const SESSION_ROUTE = "/api/vnext/operator/session";
const RESULT_ROUTE = "/api/vnext/operator/run-results";
const PROPOSAL_SETTLEMENT_POLL_MS = 250;
const MAX_PROPOSAL_SETTLEMENT_POLLS = 40;

export function RunResultReviewLoader(props: { receiptId: string; guide?: ProjectGuideBriefV02; projectId?: string | null }) {
  return <ProjectClientScopeProvider projectId={props.projectId ?? null}><ScopedRunResultReviewLoader key={props.projectId ?? "default"} {...props} /></ProjectClientScopeProvider>;
}

function ScopedRunResultReviewLoader({
  receiptId,
  guide: initialGuide,
}: {
  receiptId: string;
  guide?: ProjectGuideBriefV02;
}) {
  const fetch = useProjectClientFetch();
  const projectId = useProjectClientScope();
  const guideState = useProjectGuideBriefV02(initialGuide, projectId);
  const [session, setSession] = useState<OperatorSessionStateV01>({
    status: "checking",
    session: null,
    error_code: null,
  });
  const [result, setResult] = useState<ProjectRunResultDetailV01 | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const proposalSettlementPolls = useRef(0);
  const resultReadGeneration = useRef(0);
  // Retain only this mounted review's drafts, scoped to the verified principal
  // and original receipt. Locked views never render this material.
  const workDrafts = useRef(new Map<string, WorkComposerDraft>());

  const loadResult = useCallback(
    async (options: { preserve_result?: boolean } = {}): Promise<boolean> => {
      const generation = ++resultReadGeneration.current;
      if (options.preserve_result !== true) setResult(null);
      setErrorCode(null);
      try {
        const response = await fetch(
          `${RESULT_ROUTE}?${new URLSearchParams({ receipt_ref: receiptId })}`,
          { method: "GET", cache: "no-store", credentials: "same-origin" },
        );
        const body = (await response.json().catch(() => ({}))) as ResultRouteResponseV01;
        if (generation !== resultReadGeneration.current) return false;
        if (response.status === 401 || response.status === 403) {
          setSession({
            status: "locked",
            session: null,
            error_code: publicErrorCodeV01(body.error_code),
          });
          return false;
        }
        if (!response.ok || body.status !== "result_detail" || !body.result) {
          setErrorCode(publicErrorCodeV01(body.error_code));
          return false;
        }
        setResult(body.result);
        return true;
      } catch {
        if (generation !== resultReadGeneration.current) return false;
        setErrorCode("run_result_request_failed");
        return false;
      }
    },
    [receiptId, fetch],
  );

  useEffect(() => {
    proposalSettlementPolls.current = 0;
  }, [receiptId]);

  useEffect(() => {
    if (
      session.status !== "authenticated" ||
      result?.proposal.status !== "unavailable" ||
      result.proposal.reason !== "not_created" ||
      proposalSettlementPolls.current >= MAX_PROPOSAL_SETTLEMENT_POLLS
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      proposalSettlementPolls.current += 1;
      void loadResult({ preserve_result: true });
    }, PROPOSAL_SETTLEMENT_POLL_MS);
    return () => window.clearTimeout(timer);
  }, [loadResult, result?.proposal, session.status]);

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
      resultReadGeneration.current += 1;
      active = false;
    };
  }, [loadResult, fetch]);

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
  if (session.status === "authenticated" && result?.identity.receipt_ref === receiptId) {
    const draftKey = JSON.stringify([session.session.workspace_id, session.session.project_id, session.session.operator_id, receiptId]);
    let draft = workDrafts.current.get(draftKey);
    if (!draft) { draft = new Map(); workDrafts.current.set(draftKey, draft); }
    const reportDraftKey = JSON.stringify([session.session.workspace_id, session.session.project_id, session.session.operator_id, receiptId, "expectation-report"]);
    let reportDraft = workDrafts.current.get(reportDraftKey);
    if (!reportDraft) { reportDraft = new Map(); workDrafts.current.set(reportDraftKey, reportDraft); }
    return (
      <RunResultReviewSurface
        result={result}
        onExpectationSaved={() => loadResult({ preserve_result: true })}
        workComposerContext={{ session: session.session, draft, onAccessRefused: locked }}
        expectationReportDraft={reportDraft}
        accessBoundary={accessBoundary}
        guidePacket={guideState.guide}
        guideLoading={guideState.status === "loading"}
        guideRequestCount={guideState.requestCountRef.current}
      />
    );
  }
  return (
    <ProductShell primaryZone="ai-workplane">
      <main className={styles.page} data-run-result-review="locked">
      <AIWorkplaneShell
        guide={guideState.projection}
        guideLoading={guideState.status === "loading"}
        guideRequestCount={guideState.requestCountRef.current}
        title="Review result"
        description="Protected result material is loaded only after local review access is validated."
        state={
          session.status === "authenticated" || session.status === "checking"
            ? "loading"
            : "access_required"
        }
        stateLabel={
          session.status === "authenticated"
            ? "Loading result"
            : session.status === "checking"
              ? "Checking local review access"
              : "Local review access required"
        }
        projectHref="/"
      >
        {accessBoundary}
        {session.status === "authenticated" && !errorCode ? (
          <section className={styles.panel} aria-live="polite">
            <p className={styles.copy}>Loading protected result detail…</p>
          </section>
        ) : null}
        {errorCode ? (
          <p className={styles.error} role="alert">{errorCode}</p>
        ) : null}
      </AIWorkplaneShell>
      </main>
    </ProductShell>
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
