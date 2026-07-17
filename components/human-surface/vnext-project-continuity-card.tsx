"use client";

import { useEffect, useState } from "react";

import type { VNextOperatorPilotProjectContinuityV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";

const PROJECT_CONTINUITY_ROUTE = "/api/vnext/operator/project-continuity";

interface VNextProjectContinuityResponseV01 {
  ok: true;
  status: "project_continuity";
  project: { workspace_id: string; project_id: string };
  continuity: VNextOperatorPilotProjectContinuityV01;
  projection_is_read_only: true;
  semantic_authority_granted: false;
}

type ContinuityReadStateV01 =
  | { status: "loading" }
  | { status: "disabled" }
  | { status: "locked"; error_code: string | null }
  | { status: "error"; error_code: string }
  | { status: "loaded"; value: VNextProjectContinuityResponseV01 };

export function VNextProjectContinuityCard() {
  const [read, setRead] = useState<ContinuityReadStateV01>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    async function load(): Promise<void> {
      try {
        const response = await fetch(PROJECT_CONTINUITY_ROUTE, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        const body = (await response.json()) as
          | VNextProjectContinuityResponseV01
          | { error_code?: unknown };
        if (response.status === 404) {
          setRead({ status: "disabled" });
          return;
        }
        if (response.status === 401 || response.status === 403) {
          setRead({
            status: "locked",
            error_code: publicErrorCode(body),
          });
          return;
        }
        if (!response.ok) {
          setRead({
            status: "error",
            error_code: publicErrorCode(body) ?? "project_continuity_read_failed",
          });
          return;
        }
        if (
          !("status" in body) ||
          body.status !== "project_continuity" ||
          body.projection_is_read_only !== true ||
          body.semantic_authority_granted !== false ||
          body.continuity.projection_is_read_only !== true ||
          body.continuity.semantic_authority_granted !== false ||
          body.continuity.workspace_id !== body.project.workspace_id ||
          body.continuity.project_id !== body.project.project_id
        ) {
          setRead({
            status: "error",
            error_code: "project_continuity_response_invalid",
          });
          return;
        }
        setRead({ status: "loaded", value: body });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRead({ status: "error", error_code: "project_continuity_read_failed" });
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  if (read.status !== "loaded") {
    return (
      <section
        className="human-surface-panel vnext-project-continuity-card"
        data-vnext-project-continuity={read.status}
        aria-labelledby="vnext-project-continuity-title"
      >
        <ContinuityHeading />
        <p className="human-surface-fallback-note">
          {read.status === "loading"
            ? "Checking the authenticated local project continuity projection…"
            : read.status === "disabled"
              ? "The opt-in local operator pilot is disabled. No private continuity material was loaded."
              : read.status === "locked"
                ? "An authenticated, project-scoped local operator session is required. No private continuity material is rendered."
                : `Continuity projection unavailable: ${read.error_code}`}
        </p>
        <a className="human-surface-inline-link" href="/workbench/semantic-review">
          Open Semantic Workbench
        </a>
      </section>
    );
  }

  const { project, continuity } = read.value;
  const packet = continuity.latest_compiled_packet;

  return (
    <section
      className="human-surface-panel vnext-project-continuity-card"
      data-vnext-project-continuity="loaded"
      data-vnext-project-continuity-read-only="true"
      data-vnext-project-continuity-actions="none"
      aria-labelledby="vnext-project-continuity-title"
    >
      <ContinuityHeading />
      <div className="vnext-project-continuity-scope">
        <span>{project.workspace_id}</span>
        <strong>{project.project_id}</strong>
      </div>

      <div
        className="human-surface-metric-grid"
        aria-label="Durable semantic continuity counts"
      >
        <ContinuityMetric
          label="Pending proposals"
          value={continuity.pending_proposal_count}
        />
        <ContinuityMetric
          label="Accepted decisions awaiting apply"
          value={continuity.pending_accepted_decision_count}
        />
        <ContinuityMetric
          label="Accepted semantic state"
          value={continuity.current_accepted_state_count}
        />
        <ContinuityMetric
          label="Latest target revision"
          value={continuity.latest_target_head_revision?.revision ?? "none"}
        />
      </div>

      <dl className="vnext-project-continuity-details">
        <ContinuityDetail
          label="Latest target head"
          value={
            continuity.latest_target_head_revision
              ? `${continuity.latest_target_head_revision.presence} / ${continuity.latest_target_head_revision.target_key} / ${continuity.latest_target_head_revision.updated_at}`
              : "none"
          }
        />
        <ContinuityDetail
          label="Latest applied transition"
          value={
            continuity.latest_applied_transition
              ? `${continuity.latest_applied_transition.transition_receipt_id} / ${continuity.latest_applied_transition.transition_receipt_fingerprint} / ${continuity.latest_applied_transition.applied_at}`
              : "none"
          }
        />
        <ContinuityDetail
          label="Latest compiled packet"
          value={
            packet
              ? `${packet.packet_id} / ${packet.packet_fingerprint} / ${packet.generated_at}`
              : "none"
          }
        />
        <ContinuityDetail
          label="Packet currentness"
          value={continuity.packet_currentness}
        />
        <ContinuityDetail
          label="Latest context-use receipt"
          value={
            continuity.latest_context_use_receipt
              ? `${continuity.latest_context_use_receipt.receipt_id} / ${continuity.latest_context_use_receipt.receipt_fingerprint} / ${continuity.latest_context_use_receipt.recorded_at}`
              : "none"
          }
        />
        <ContinuityDetail
          label="Latest context-use review"
          value={
            continuity.latest_context_use_review_status
              ? `${continuity.latest_context_use_review_status.assessment} / used ${continuity.latest_context_use_review_status.actually_used} / ${continuity.latest_context_use_review_status.review_id} / ${continuity.latest_context_use_review_status.review_fingerprint} / ${continuity.latest_context_use_review_status.reviewed_at}`
              : "not reviewed"
          }
        />
      </dl>

      <p className="human-surface-boundary-note">
        Read-only continuity projection. Project Home cannot accept, reject, confirm a
        gate, commit semantic state, or compile a packet. Local session possession is
        not external identity authentication.
      </p>
      <div className="vnext-project-continuity-links">
        <a className="human-surface-inline-link" href="/workbench/semantic-review">
          Open Semantic Workbench
        </a>
      </div>
    </section>
  );
}

function ContinuityHeading() {
  return (
    <div className="human-surface-section-heading">
      <p>vNext durable continuity</p>
      <h2 id="vnext-project-continuity-title">Project semantic state and context</h2>
      <span>
        Authenticated local projection of pending review, durable state, and later
        context. It grants no semantic authority.
      </span>
    </div>
  );
}

function ContinuityMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="human-surface-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ContinuityDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function publicErrorCode(value: unknown): string | null {
  const candidate =
    value && typeof value === "object" && "error_code" in value
      ? value.error_code
      : null;
  return typeof candidate === "string" && /^[a-z0-9_:-]{1,96}$/.test(candidate)
    ? candidate
    : null;
}
