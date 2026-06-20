"use client";

import { DisabledPromotionWriteAdapterReadout } from "@/components/research-candidate-disabled-promotion-write-adapter-readout";
import {
  buildManualNoteAuthorityGatedPromotionDesignJson,
  buildManualNoteAuthorityGatedPromotionDesignMarkdown,
  buildManualNoteAuthorityGatedPromotionDesignPacket,
  buildManualNoteDryRunCandidateReviewJson,
  buildManualNoteDryRunCandidateReviewMarkdown,
  buildManualNoteDryRunCandidateReviewPacket,
  buildManualNoteDryRunCandidateSelectionDefault,
  createManualNoteAuthorityGatedPromotionDesignFingerprint,
  createManualNoteDryRunCandidateReviewFingerprint,
  type ManualNoteAuthorityGatedPromotionDesignPacket,
  type ManualNoteDryRunCandidateReviewPacket,
  type ManualNoteDryRunCandidateSelectionIds,
} from "@/lib/research-candidate-review/manual-note-dry-run-candidate-review-and-authority-design";
import type { ManualNotePreviewDraftPromotionDryRunPlanOkResponse } from "@/lib/research-candidate-review/manual-note-runtime-preview";
import { useEffect, useMemo, useState } from "react";

type DryRunCandidateReviewDesignPanelProps = {
  plan: ManualNotePreviewDraftPromotionDryRunPlanOkResponse;
};

type CandidateGroupKey = keyof ManualNoteDryRunCandidateSelectionIds;

type CandidateGroup = {
  selectionKey: CandidateGroupKey;
  title: string;
  selectAllLabel: string;
  clearLabel: string;
  items: Array<{
    id: string;
    label: string;
    detail: string;
  }>;
};

type ReviewDesignCopyState = {
  packetKind:
    | "manual_note_dry_run_candidate_review_packet"
    | "manual_note_authority_gated_promotion_design_packet"
    | null;
  previewDraftId: string | null;
  packetFingerprint: string | null;
  status: "idle" | "success" | "error";
  mode: "markdown" | "json" | null;
  message: string | null;
  fallbackText: string | null;
  characterCount: number;
};

const EMPTY_COPY_STATE: ReviewDesignCopyState = {
  packetKind: null,
  previewDraftId: null,
  packetFingerprint: null,
  status: "idle",
  mode: null,
  message: null,
  fallbackText: null,
  characterCount: 0,
};

export function DryRunCandidateReviewDesignPanel({
  plan,
}: DryRunCandidateReviewDesignPanelProps) {
  const planIdentity = useMemo(() => buildPlanIdentity(plan), [plan]);
  const [selection, setSelection] = useState<ManualNoteDryRunCandidateSelectionIds>(
    () => buildManualNoteDryRunCandidateSelectionDefault(plan),
  );
  const [candidateReviewPacket, setCandidateReviewPacket] =
    useState<ManualNoteDryRunCandidateReviewPacket | null>(null);
  const [authorityDesignPacket, setAuthorityDesignPacket] =
    useState<ManualNoteAuthorityGatedPromotionDesignPacket | null>(null);
  const [copyState, setCopyState] =
    useState<ReviewDesignCopyState>(EMPTY_COPY_STATE);

  useEffect(() => {
    setSelection(buildManualNoteDryRunCandidateSelectionDefault(plan));
    setCandidateReviewPacket(null);
    setAuthorityDesignPacket(null);
    setCopyState(EMPTY_COPY_STATE);
  }, [planIdentity, plan]);

  const groups = useMemo(() => buildCandidateGroups(plan), [plan]);
  const reviewFingerprint = useMemo(
    () =>
      createManualNoteDryRunCandidateReviewFingerprint({
        plan,
        selected_target_ids: selection,
      }),
    [plan, selection],
  );
  const currentCandidateReviewPacket =
    candidateReviewPacket?.packet_fingerprint === reviewFingerprint
      ? candidateReviewPacket
      : null;
  const designFingerprint = currentCandidateReviewPacket
    ? createManualNoteAuthorityGatedPromotionDesignFingerprint({
        candidate_review_packet: currentCandidateReviewPacket,
      })
    : null;
  const currentAuthorityDesignPacket =
    authorityDesignPacket?.packet_fingerprint === designFingerprint
      ? authorityDesignPacket
      : null;
  const selectionCounts = countSelections(groups, selection);
  const currentCopyState = getCurrentCopyState({
    copyState,
    currentCandidateReviewPacket,
    currentAuthorityDesignPacket,
    previewDraftId: plan.preview_draft_id,
  });

  function selectGroup(selectionKey: CandidateGroupKey, ids: string[]) {
    setSelection((current) => ({ ...current, [selectionKey]: ids }));
    setAuthorityDesignPacket(null);
  }

  function toggleCandidate(
    selectionKey: CandidateGroupKey,
    id: string,
    checked: boolean,
  ) {
    setSelection((current) => {
      const existing = current[selectionKey];
      const next = checked
        ? Array.from(new Set([...existing, id]))
        : existing.filter((selectedId) => selectedId !== id);
      return { ...current, [selectionKey]: next };
    });
    setAuthorityDesignPacket(null);
  }

  function selectAllCandidates() {
    setSelection(
      groups.reduce<ManualNoteDryRunCandidateSelectionIds>(
        (nextSelection, group) => ({
          ...nextSelection,
          [group.selectionKey]: group.items.map((item) => item.id),
        }),
        buildManualNoteDryRunCandidateSelectionDefault(plan),
      ),
    );
    setAuthorityDesignPacket(null);
  }

  function clearAllCandidates() {
    setSelection(buildManualNoteDryRunCandidateSelectionDefault(plan));
    setCandidateReviewPacket(null);
    setAuthorityDesignPacket(null);
    setCopyState(EMPTY_COPY_STATE);
  }

  function buildCandidateReviewPacket() {
    const packet = buildManualNoteDryRunCandidateReviewPacket({
      plan,
      selected_target_ids: selection,
    });
    setCandidateReviewPacket(packet);
    setAuthorityDesignPacket(null);
    setCopyState(EMPTY_COPY_STATE);
  }

  function buildAuthorityDesignPacket() {
    if (!currentCandidateReviewPacket) return;
    const packet = buildManualNoteAuthorityGatedPromotionDesignPacket({
      candidate_review_packet: currentCandidateReviewPacket,
    });
    setAuthorityDesignPacket(packet);
    setCopyState(EMPTY_COPY_STATE);
  }

  async function copyPacket(
    packet:
      | ManualNoteDryRunCandidateReviewPacket
      | ManualNoteAuthorityGatedPromotionDesignPacket,
    mode: "markdown" | "json",
  ) {
    const text =
      packet.packet_kind === "manual_note_dry_run_candidate_review_packet"
        ? mode === "markdown"
          ? buildManualNoteDryRunCandidateReviewMarkdown(packet)
          : buildManualNoteDryRunCandidateReviewJson(packet)
        : mode === "markdown"
          ? buildManualNoteAuthorityGatedPromotionDesignMarkdown(packet)
          : buildManualNoteAuthorityGatedPromotionDesignJson(packet);
    const nextCopyState = {
      packetKind: packet.packet_kind,
      previewDraftId: plan.preview_draft_id,
      packetFingerprint: packet.packet_fingerprint,
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
          "Clipboard API is unavailable. Select the fallback packet text manually.",
        ...nextCopyState,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyState({
        status: "success",
        message:
          packet.packet_kind === "manual_note_dry_run_candidate_review_packet"
            ? mode === "markdown"
              ? "Selected review Markdown copied locally to clipboard."
              : "Selected review JSON copied locally to clipboard."
            : mode === "markdown"
              ? "Authority design Markdown copied locally to clipboard."
              : "Authority design JSON copied locally to clipboard.",
        packetKind: packet.packet_kind,
        previewDraftId: plan.preview_draft_id,
        packetFingerprint: packet.packet_fingerprint,
        fallbackText: null,
        mode,
        characterCount: text.length,
      });
    } catch {
      setCopyState({
        status: "error",
        message:
          "Clipboard write failed. Select the fallback packet text manually.",
        ...nextCopyState,
      });
    }
  }

  return (
    <section
      className="perspective-inspector-section manual-note-promotion-readiness manual-note-dry-run-candidate-review-design"
      aria-label="Dry-run candidate review and authority design"
      data-selection-persisted="false"
      data-design-packet-persisted="false"
    >
      <div className="manual-note-preview-draft-activity-header">
        <div>
          <h3>Dry-run candidate review and authority design</h3>
          <p>
            Select dry-run targets for a local review packet, then build a
            design packet for future authority review without writing records.
          </p>
        </div>
        <div className="manual-note-readiness-copy-packet-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={selectAllCandidates}
          >
            Select all dry-run candidates
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={clearAllCandidates}
          >
            Clear all dry-run candidate selections
          </button>
        </div>
      </div>

      <ul className="manual-note-label-boundary-copy">
        <li>Local review aid only.</li>
        <li>Selections are not approval.</li>
        <li>Selections are not persisted.</li>
        <li>Selections do not grant write authority.</li>
        <li>Authority design is not actual promotion.</li>
        <li>
          No proof/evidence, Perspective, canonical graph, work item, provider,
          retrieval, source fetch, or external handoff is performed.
        </li>
      </ul>

      <div className="perspective-workbench-status-row">
        <span>
          selected_total <code>{selectionCounts.selectedTotal}</code>
        </span>
        <span>
          unselected_total <code>{selectionCounts.unselectedTotal}</code>
        </span>
        <span>
          selection_persisted <code>false</code>
        </span>
        <span>
          write_authority_granted <code>false</code>
        </span>
        <span>
          review_fingerprint <code>{reviewFingerprint}</code>
        </span>
      </div>

      <div className="manual-note-promotion-readiness-summary-grid">
        {groups.map((group) => (
          <section key={group.selectionKey}>
            <div className="manual-note-input-header">
              <h4>{group.title}</h4>
              <div className="manual-note-readiness-copy-packet-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    selectGroup(
                      group.selectionKey,
                      group.items.map((item) => item.id),
                    )
                  }
                >
                  {group.selectAllLabel}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => selectGroup(group.selectionKey, [])}
                >
                  {group.clearLabel}
                </button>
              </div>
            </div>
            <p className="manual-note-runtime-hint">
              Selected {selection[group.selectionKey].length}; unselected{" "}
              {group.items.length - selection[group.selectionKey].length}.
            </p>
            {group.items.length === 0 ? (
              <p>No dry-run targets returned for this group.</p>
            ) : (
              <ul className="boundary-list">
                {group.items.map((item) => {
                  const inputId = `${planIdentity}-${group.selectionKey}-${item.id}`;
                  return (
                    <li key={item.id}>
                      <label htmlFor={inputId}>
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={selection[group.selectionKey].includes(
                            item.id,
                          )}
                          onChange={(event) =>
                            toggleCandidate(
                              group.selectionKey,
                              item.id,
                              event.currentTarget.checked,
                            )
                          }
                        />{" "}
                        <strong>{item.label}</strong>
                      </label>
                      <p>{item.detail}</p>
                      <code>{item.id}</code>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div className="manual-note-readiness-copy-packet-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={buildCandidateReviewPacket}
        >
          Build selected candidate review packet
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={!currentCandidateReviewPacket}
          onClick={buildAuthorityDesignPacket}
        >
          Build authority-gated design packet
        </button>
      </div>

      {candidateReviewPacket && !currentCandidateReviewPacket ? (
        <p className="manual-note-runtime-hint">
          Current selections changed after the selected candidate review packet
          was built. Build a new selected candidate review packet before
          building authority design.
        </p>
      ) : null}

      {currentCandidateReviewPacket ? (
        <PacketReviewSection
          packet={currentCandidateReviewPacket}
          onCopy={(mode) => void copyPacket(currentCandidateReviewPacket, mode)}
        />
      ) : null}

      {currentAuthorityDesignPacket ? (
        <AuthorityDesignSection
          packet={currentAuthorityDesignPacket}
          onCopy={(mode) => void copyPacket(currentAuthorityDesignPacket, mode)}
        />
      ) : null}

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
          <summary>Manual review/design packet copy fallback</summary>
          <textarea
            readOnly
            value={currentCopyState.fallbackText}
            aria-label="Manual review or design packet copy fallback"
          />
        </details>
      ) : null}
    </section>
  );
}

function PacketReviewSection({
  packet,
  onCopy,
}: {
  packet: ManualNoteDryRunCandidateReviewPacket;
  onCopy: (mode: "markdown" | "json") => void;
}) {
  return (
    <section>
      <div className="manual-note-preview-draft-activity-header">
        <div>
          <h4>Selected candidate review packet</h4>
          <p>
            Packet fingerprint <code>{packet.packet_fingerprint}</code>.
          </p>
        </div>
        <div className="manual-note-readiness-copy-packet-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onCopy("markdown")}
          >
            Copy selected review Markdown
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onCopy("json")}
          >
            Copy selected review JSON
          </button>
        </div>
      </div>

      <div className="manual-note-promotion-readiness-summary-grid">
        <SummaryMap title="Selected counts" values={packet.selected_counts} />
        <SummaryMap title="Unselected counts" values={packet.unselected_counts} />
        <SummaryMap title="Review notes" values={packet.review_notes} />
        <SummaryMap title="Local copy boundary" values={packet.local_copy_boundary} />
      </div>

      <TextList
        title="Unresolved authority requirements"
        items={packet.unresolved_authority_requirements.map(
          (authority) => `${authority.authority_id}: ${authority.reason}`,
        )}
      />
      <TextList
        title="Blocked side effects"
        items={packet.blocked_side_effects.map(
          (sideEffect) =>
            `${sideEffect.side_effect_id}: blocked ${String(
              sideEffect.blocked,
            )}, performed ${String(sideEffect.performed)}`,
        )}
      />
    </section>
  );
}

function AuthorityDesignSection({
  packet,
  onCopy,
}: {
  packet: ManualNoteAuthorityGatedPromotionDesignPacket;
  onCopy: (mode: "markdown" | "json") => void;
}) {
  return (
    <section>
      <div className="manual-note-preview-draft-activity-header">
        <div>
          <h4>Authority-gated actual promotion design packet</h4>
          <p>
            Design status <code>{packet.design_status}</code>. Packet
            fingerprint <code>{packet.packet_fingerprint}</code>.
          </p>
        </div>
        <div className="manual-note-readiness-copy-packet-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onCopy("markdown")}
          >
            Copy authority design Markdown
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onCopy("json")}
          >
            Copy authority design JSON
          </button>
        </div>
      </div>

      <p>{packet.design_summary}</p>

      <div className="manual-note-promotion-readiness-summary-grid">
        <SummaryMap
          title="Proposed write contract"
          values={packet.proposed_write_contract}
        />
        <SummaryMap title="Idempotency design" values={packet.idempotency_design} />
        <SummaryMap title="Rollback design" values={packet.rollback_design} />
        <SummaryMap
          title="Review audit design"
          values={packet.review_audit_design}
        />
        <SummaryMap
          title="Source evidence authority design"
          values={packet.source_evidence_authority_design}
        />
        <SummaryMap title="Execution boundary" values={packet.execution_boundary} />
      </div>

      <TextList
        title="Blocking requirements before any write"
        items={packet.blocking_requirements_before_any_write}
      />

      <DisabledPromotionWriteAdapterReadout
        previewDraftId={packet.source_candidate_review_packet.preview_draft_id}
        authorityDesignPacket={packet}
      />
    </section>
  );
}

function SummaryMap({
  title,
  values,
}: {
  title: string;
  values: Record<string, unknown>;
}) {
  return (
    <div>
      <h4>{title}</h4>
      {Object.entries(values).map(([key, value]) => (
        <span key={key}>
          {key} <code>{formatValue(value)}</code>
        </span>
      ))}
    </div>
  );
}

function TextList({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="manual-note-promotion-readiness-list">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p>No items.</p>
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

function buildCandidateGroups(
  plan: ManualNotePreviewDraftPromotionDryRunPlanOkResponse,
): CandidateGroup[] {
  return [
    {
      selectionKey: "source_reference_target_ids",
      title: "source reference targets",
      selectAllLabel: "Select all source references",
      clearLabel: "Clear source references",
      items: plan.hypothetical_targets.source_reference_targets.map((target) => ({
        id: target.source_ref_id,
        label: target.title,
        detail: `${target.source_status}; ${target.boundary_notes}`,
      })),
    },
    {
      selectionKey: "claim_target_ids",
      title: "claim targets",
      selectAllLabel: "Select all claims",
      clearLabel: "Clear claims",
      items: plan.hypothetical_targets.claim_targets.map((target) => ({
        id: target.claim_candidate_id,
        label: target.claim_type,
        detail: target.claim_text,
      })),
    },
    {
      selectionKey: "evidence_target_ids",
      title: "evidence targets",
      selectAllLabel: "Select all evidence",
      clearLabel: "Clear evidence",
      items: plan.hypothetical_targets.evidence_targets.map((target) => ({
        id: target.evidence_candidate_id,
        label: target.evidence_role,
        detail: target.evidence_summary,
      })),
    },
    {
      selectionKey: "tension_gap_target_ids",
      title: "tension/gap targets",
      selectAllLabel: "Select all tensions and gaps",
      clearLabel: "Clear tensions and gaps",
      items: plan.hypothetical_targets.tension_gap_targets.map((target) => ({
        id: target.target_id,
        label: target.target_kind,
        detail: target.summary,
      })),
    },
    {
      selectionKey: "perspective_delta_target_ids",
      title: "perspective delta targets",
      selectAllLabel: "Select all Perspective deltas",
      clearLabel: "Clear Perspective deltas",
      items: plan.hypothetical_targets.perspective_delta_targets.map(
        (target) => ({
          id: target.perspective_delta_candidate_id,
          label: target.delta_type,
          detail: `${target.target_perspective_key}: ${target.proposed_update_summary}`,
        }),
      ),
    },
    {
      selectionKey: "follow_up_work_target_ids",
      title: "follow-up work targets",
      selectAllLabel: "Select all follow-up work",
      clearLabel: "Clear follow-up work",
      items: plan.hypothetical_targets.follow_up_work_targets.map((target) => ({
        id: target.follow_up_work_candidate_id,
        label: target.candidate_title,
        detail: target.candidate_summary,
      })),
    },
  ];
}

function countSelections(
  groups: CandidateGroup[],
  selection: ManualNoteDryRunCandidateSelectionIds,
) {
  const selectedTotal = groups.reduce(
    (sum, group) => sum + selection[group.selectionKey].length,
    0,
  );
  const targetTotal = groups.reduce((sum, group) => sum + group.items.length, 0);
  return {
    selectedTotal,
    unselectedTotal: targetTotal - selectedTotal,
  };
}

function getCurrentCopyState({
  copyState,
  currentCandidateReviewPacket,
  currentAuthorityDesignPacket,
  previewDraftId,
}: {
  copyState: ReviewDesignCopyState;
  currentCandidateReviewPacket: ManualNoteDryRunCandidateReviewPacket | null;
  currentAuthorityDesignPacket: ManualNoteAuthorityGatedPromotionDesignPacket | null;
  previewDraftId: string;
}) {
  if (
    copyState.packetKind === "manual_note_dry_run_candidate_review_packet" &&
    copyState.previewDraftId === previewDraftId &&
    copyState.packetFingerprint ===
      currentCandidateReviewPacket?.packet_fingerprint
  ) {
    return copyState;
  }

  if (
    copyState.packetKind === "manual_note_authority_gated_promotion_design_packet" &&
    copyState.previewDraftId === previewDraftId &&
    copyState.packetFingerprint ===
      currentAuthorityDesignPacket?.packet_fingerprint
  ) {
    return copyState;
  }

  return null;
}

function buildPlanIdentity(
  plan: ManualNotePreviewDraftPromotionDryRunPlanOkResponse,
) {
  return [
    plan.preview_draft_id,
    plan.dry_run_plan_version,
    plan.dry_run_status,
    plan.selected_preview_draft.input_fingerprint,
    plan.selected_preview_draft.updated_at,
    plan.readiness_snapshot.readiness_status,
    plan.readiness_snapshot.readiness_score,
    plan.hypothetical_targets.source_reference_targets
      .map((target) => target.source_ref_id)
      .join(","),
    plan.hypothetical_targets.claim_targets
      .map((target) => target.claim_candidate_id)
      .join(","),
    plan.hypothetical_targets.evidence_targets
      .map((target) => target.evidence_candidate_id)
      .join(","),
    plan.hypothetical_targets.tension_gap_targets
      .map((target) => target.target_id)
      .join(","),
    plan.hypothetical_targets.perspective_delta_targets
      .map((target) => target.perspective_delta_candidate_id)
      .join(","),
    plan.hypothetical_targets.follow_up_work_targets
      .map((target) => target.follow_up_work_candidate_id)
      .join(","),
  ].join("|");
}

function formatValue(value: unknown): string {
  if (value === null || typeof value === "undefined") return "none";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "none";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
