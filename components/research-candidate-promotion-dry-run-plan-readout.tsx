"use client";

import type {
  ManualNotePreviewDraftDetailOkResponse,
  ManualNotePreviewDraftPromotionDryRunPlanOkResponse,
  ManualNotePreviewDraftPromotionDryRunPlanResponse,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import { useState } from "react";

const DRY_RUN_STATUS_LABELS = {
  blocked: "Blocked",
  needs_operator_review: "Needs operator review",
  plan_ready: "Plan ready",
} as const;

type PromotionDryRunPlanReadoutProps = {
  storedDraftResult: ManualNotePreviewDraftDetailOkResponse | null;
  dryRunPlanResult: ManualNotePreviewDraftPromotionDryRunPlanResponse | null;
  isLoadingDraftId: string | null;
  error: string | null;
  onLoad: (previewDraftId: string) => void;
};

type DryRunCopyState = {
  previewDraftId: string | null;
  status: "idle" | "success" | "error";
  mode: "markdown" | "json" | null;
  message: string | null;
  fallbackText: string | null;
  characterCount: number;
};

export function PromotionDryRunPlanReadout({
  storedDraftResult,
  dryRunPlanResult,
  isLoadingDraftId,
  error,
  onLoad,
}: PromotionDryRunPlanReadoutProps) {
  const [copyState, setCopyState] = useState<DryRunCopyState>({
    previewDraftId: null,
    status: "idle",
    mode: null,
    message: null,
    fallbackText: null,
    characterCount: 0,
  });

  if (!storedDraftResult) return null;

  const previewDraftId = storedDraftResult.draft.preview_draft_id;
  const isLoading = isLoadingDraftId === previewDraftId;
  const isCurrentDryRunPlan =
    dryRunPlanResult?.ok === true &&
    dryRunPlanResult.preview_draft_id === previewDraftId;
  const currentPlan = isCurrentDryRunPlan ? dryRunPlanResult : null;
  const currentCopyState =
    currentPlan && copyState.previewDraftId === currentPlan.preview_draft_id
      ? copyState
      : null;

  async function copyDryRunPlan(
    plan: ManualNotePreviewDraftPromotionDryRunPlanOkResponse,
    mode: "markdown" | "json",
  ) {
    const text =
      mode === "markdown"
        ? plan.local_copy_packet.markdown
        : plan.local_copy_packet.json;
    const nextCopyState = {
      previewDraftId: plan.preview_draft_id,
      mode,
      fallbackText: text,
      characterCount: text.length,
    };

    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== "function"
    ) {
      setCopyState({
        status: "error",
        message:
          "Clipboard API is unavailable. Select the fallback dry-run plan text manually.",
        ...nextCopyState,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyState({
        status: "success",
        message:
          mode === "markdown"
            ? "Markdown dry-run plan copied locally to clipboard."
            : "JSON dry-run plan copied locally to clipboard.",
        previewDraftId: plan.preview_draft_id,
        fallbackText: null,
        mode,
        characterCount: text.length,
      });
    } catch {
      setCopyState({
        status: "error",
        message:
          "Clipboard write failed. Select the fallback dry-run plan text manually.",
        ...nextCopyState,
      });
    }
  }

  return (
    <section
      className="perspective-inspector-section manual-note-promotion-readiness manual-note-promotion-dry-run-plan"
      aria-label="No-write promotion dry-run plan"
    >
      <div className="manual-note-preview-draft-activity-header">
        <div>
          <h3>No-write promotion dry-run plan</h3>
          <p>
            This readout maps the opened preview draft into hypothetical targets
            and required future authorities without writing records.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          disabled={isLoading}
          onClick={() => onLoad(previewDraftId)}
        >
          {isLoading
            ? "Generating no-write dry-run plan..."
            : currentPlan
              ? "Refresh no-write dry-run plan"
              : "Generate no-write dry-run plan"}
        </button>
      </div>

      <ul className="manual-note-label-boundary-copy">
        <li>This is not promotion.</li>
        <li>
          No proof/evidence, Perspective, canonical graph, or work item writes
          are performed.
        </li>
        <li>Source references are not fetched or verified.</li>
        <li>Provider/retrieval is not used.</li>
      </ul>

      {error ? (
        <p className="manual-note-runtime-error" role="alert">
          {error}
        </p>
      ) : null}

      {currentPlan ? (
        <>
          <div className="manual-note-promotion-readiness-status">
            <span>
              dry_run_status{" "}
              <strong>{DRY_RUN_STATUS_LABELS[currentPlan.dry_run_status]}</strong>
            </span>
            <span>
              dry_run_plan_version{" "}
              <strong>{currentPlan.dry_run_plan_version}</strong>
            </span>
            <span>
              preview_draft_id <strong>{currentPlan.preview_draft_id}</strong>
            </span>
          </div>

          <PromotionDryRunTextList
            title="Dry-run summary"
            items={[currentPlan.dry_run_summary]}
            emptyText="No dry-run summary returned."
          />

          <div className="manual-note-promotion-readiness-summary-grid">
            <div>
              <h4>Selected draft metadata</h4>
              {Object.entries(currentPlan.selected_preview_draft).map(
                ([key, value]) => (
                  <span key={key}>
                    {key} <code>{formatValue(value)}</code>
                  </span>
                ),
              )}
            </div>
            <div>
              <h4>Readiness snapshot</h4>
              {Object.entries(currentPlan.readiness_snapshot).map(
                ([key, value]) => (
                  <span key={key}>
                    {key} <code>{formatValue(value)}</code>
                  </span>
                ),
              )}
            </div>
            <div>
              <h4>Hypothetical targets summary</h4>
              <span>
                source_reference_targets{" "}
                <code>
                  {
                    currentPlan.hypothetical_targets.source_reference_targets
                      .length
                  }
                </code>
              </span>
              <span>
                claim_targets{" "}
                <code>{currentPlan.hypothetical_targets.claim_targets.length}</code>
              </span>
              <span>
                evidence_targets{" "}
                <code>
                  {currentPlan.hypothetical_targets.evidence_targets.length}
                </code>
              </span>
              <span>
                tension_gap_targets{" "}
                <code>
                  {currentPlan.hypothetical_targets.tension_gap_targets.length}
                </code>
              </span>
              <span>
                perspective_delta_targets{" "}
                <code>
                  {
                    currentPlan.hypothetical_targets.perspective_delta_targets
                      .length
                  }
                </code>
              </span>
              <span>
                follow_up_work_targets{" "}
                <code>
                  {currentPlan.hypothetical_targets.follow_up_work_targets.length}
                </code>
              </span>
            </div>
          </div>

          <PromotionDryRunTextList
            title="Blocking gate ids"
            items={currentPlan.readiness_snapshot.blocking_gate_ids}
            emptyText="No blocking gate ids."
          />
          <PromotionDryRunTextList
            title="Warning gate ids"
            items={currentPlan.readiness_snapshot.warning_gate_ids}
            emptyText="No warning gate ids."
          />
          <PromotionDryRunTextList
            title="Pass gate ids"
            items={currentPlan.readiness_snapshot.pass_gate_ids}
            emptyText="No pass gate ids."
          />

          <details open>
            <summary>Hypothetical target details</summary>
            <div className="manual-note-promotion-readiness-summary-grid">
              <DryRunJsonBlock
                title="Source references"
                value={currentPlan.hypothetical_targets.source_reference_targets}
              />
              <DryRunJsonBlock
                title="Claims"
                value={currentPlan.hypothetical_targets.claim_targets}
              />
              <DryRunJsonBlock
                title="Evidence"
                value={currentPlan.hypothetical_targets.evidence_targets}
              />
              <DryRunJsonBlock
                title="Tensions and gaps"
                value={currentPlan.hypothetical_targets.tension_gap_targets}
              />
              <DryRunJsonBlock
                title="Perspective deltas"
                value={currentPlan.hypothetical_targets.perspective_delta_targets}
              />
              <DryRunJsonBlock
                title="Follow-up work"
                value={currentPlan.hypothetical_targets.follow_up_work_targets}
              />
            </div>
          </details>

          <div className="manual-note-promotion-readiness-summary-grid">
            <DryRunJsonBlock
              title="Proposed canonical deltas"
              value={currentPlan.proposed_canonical_deltas}
            />
            <DryRunJsonBlock
              title="Boundary audit snapshot"
              value={currentPlan.boundary_audit_snapshot}
            />
          </div>

          <PromotionDryRunTextList
            title="Required authorities before write"
            items={currentPlan.required_authorities_before_write.map(
              (authority) => `${authority.authority_id}: ${authority.reason}`,
            )}
            emptyText="No required authorities returned."
          />

          <PromotionDryRunTextList
            title="Blocked side effects"
            items={currentPlan.blocked_side_effects.map(
              (sideEffect) =>
                `${sideEffect.side_effect_id}: blocked ${String(
                  sideEffect.blocked,
                )}, performed ${String(sideEffect.performed)}`,
            )}
            emptyText="No blocked side effects returned."
          />

          <PromotionDryRunTextList
            title="Operator next steps"
            items={currentPlan.operator_next_steps}
            emptyText="No operator next steps returned."
          />

          <div className="manual-note-readiness-copy-packet-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => void copyDryRunPlan(currentPlan, "markdown")}
            >
              Copy Markdown dry-run plan
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void copyDryRunPlan(currentPlan, "json")}
            >
              Copy JSON dry-run plan
            </button>
          </div>

          <div className="perspective-workbench-status-row">
            {Object.entries(currentPlan.local_copy_packet.boundary).map(
              ([key, value]) => (
                <span key={key}>
                  {key} <code>{String(value)}</code>
                </span>
              ),
            )}
            {Object.entries(currentPlan.runtime_boundary).map(([key, value]) => (
              <span key={key}>
                {key} <code>{String(value)}</code>
              </span>
            ))}
            {Object.entries(currentPlan.authority).map(([key, value]) => (
              <span key={key}>
                {key} <code>{String(value)}</code>
              </span>
            ))}
          </div>

          {currentCopyState?.message ? (
            <p
              className={
                currentCopyState.status === "error"
                  ? "manual-note-runtime-error"
                  : "manual-note-runtime-hint"
              }
              role={currentCopyState.status === "error" ? "alert" : undefined}
            >
              {currentCopyState.message} Character count{" "}
              {currentCopyState.characterCount}.
            </p>
          ) : null}
          {currentCopyState?.fallbackText ? (
            <details className="manual-note-readiness-copy-packet-fallback" open>
              <summary>Manual dry-run plan copy fallback</summary>
              <textarea
                readOnly
                value={currentCopyState.fallbackText}
                aria-label="Manual dry-run plan copy fallback"
              />
            </details>
          ) : null}
        </>
      ) : (
        <p className="manual-note-runtime-hint">
          Generate a no-write dry-run plan after opening a stored preview draft.
          The route returns hypothetical targets and blocked side effects only.
        </p>
      )}
    </section>
  );
}

function PromotionDryRunTextList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: readonly string[];
  emptyText: string;
}) {
  return (
    <div className="manual-note-promotion-readiness-list">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p>{emptyText}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DryRunJsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <h4>{title}</h4>
      <code>{JSON.stringify(value, null, 2)}</code>
    </div>
  );
}

function formatValue(value: unknown) {
  if (value === null || typeof value === "undefined") return "none";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "none";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
