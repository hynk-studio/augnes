"use client";

import type {
  ManualNotePreviewDraftDetailOkResponse,
  ManualNotePreviewDraftListItem,
  ManualNotePreviewRuntimeOkResponse,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";

type PreviewDraftMetadataReadoutProps = {
  runtimeResult: ManualNotePreviewRuntimeOkResponse | null;
  storedDraftResult: ManualNotePreviewDraftDetailOkResponse | null;
};

export function RuntimeMetadataSummary({
  runtimeResult,
  storedDraftResult,
}: PreviewDraftMetadataReadoutProps) {
  if (!runtimeResult && !storedDraftResult) return null;

  if (storedDraftResult) {
    const draft = storedDraftResult.draft;
    const lifecycleSummary = draft.lifecycle_summary;

    return (
      <section
        className="perspective-inspector-section manual-note-runtime-summary"
        aria-label="Stored preview draft metadata"
      >
        <h3>Stored preview draft metadata</h3>
        <div className="perspective-workbench-status-row">
          <span>
            runtime_version <code>{storedDraftResult.runtime_version}</code>
          </span>
          <span>
            preview_draft_id <code>{draft.preview_draft_id}</code>
          </span>
          <span>
            lifecycle_status <code>{storedDraftResult.lifecycle_status}</code>
          </span>
          <span>
            operator_note_label{" "}
            <code>{draft.operator_note_label ?? "Untitled preview draft"}</code>
          </span>
          <span>
            input_fingerprint <code>{draft.input_fingerprint}</code>
          </span>
          <span>
            parser_version <code>{draft.parser_version}</code>
          </span>
          <span>
            preview_version <code>{draft.preview_version}</code>
          </span>
          <span>
            warning_count <code>{draft.warning_count}</code>
          </span>
          <span>
            candidate_count_summary{" "}
            <code>{formatCandidateCountSummary(draft)}</code>
          </span>
          <span>
            label_state <code>{lifecycleSummary.label_state}</code>
          </span>
          <span>
            discard_state <code>{lifecycleSummary.discard_state}</code>
          </span>
          <span>
            activity_count <code>{lifecycleSummary.activity_count}</code>
          </span>
          <span>
            last_activity_type{" "}
            <code>{lifecycleSummary.last_activity_type ?? "none recorded"}</code>
          </span>
          <span>
            last_activity_at{" "}
            <code>{lifecycleSummary.last_activity_at ?? "none recorded"}</code>
          </span>
          <span>
            manual_note_text_stored{" "}
            <code>{String(draft.manual_note_text_stored)}</code>
          </span>
          <span>
            created_at <code>{draft.created_at}</code>
          </span>
          {storedDraftResult.discard_metadata ? (
            <span>
              discarded_at{" "}
              <code>{storedDraftResult.discard_metadata.discarded_at}</code>
            </span>
          ) : null}
        </div>
      </section>
    );
  }

  const activeRuntimeResult = runtimeResult;
  if (!activeRuntimeResult) return null;

  return (
    <section
      className="perspective-inspector-section manual-note-runtime-summary"
      aria-label="Runtime preview draft metadata"
    >
      <h3>Runtime preview draft metadata</h3>
      <div className="perspective-workbench-status-row">
        <span>
          runtime_version <code>{activeRuntimeResult.runtime_version}</code>
        </span>
        <span>
          input_fingerprint <code>{activeRuntimeResult.input_fingerprint}</code>
        </span>
        <span>
          preview_draft_id{" "}
          <code>{activeRuntimeResult.preview_draft_id ?? "not persisted"}</code>
        </span>
        <span>
          persistence_mode <code>{activeRuntimeResult.persistence_mode}</code>
        </span>
        <span>
          persisted_preview_draft{" "}
          <code>{String(activeRuntimeResult.persisted_preview_draft)}</code>
        </span>
        <span>
          created_at <code>{activeRuntimeResult.created_at}</code>
        </span>
      </div>
    </section>
  );
}

export function RuntimeBoundarySummary({
  runtimeResult,
  storedDraftResult,
}: PreviewDraftMetadataReadoutProps) {
  if (!runtimeResult && !storedDraftResult) return null;

  const routeBoundary =
    runtimeResult?.runtime_boundary ?? storedDraftResult?.runtime_boundary;
  const noSideEffects =
    runtimeResult?.no_side_effects ?? storedDraftResult?.no_side_effects;
  if (!routeBoundary || !noSideEffects) return null;

  return (
    <section
      className="perspective-inspector-section manual-note-runtime-boundary"
      aria-label="Runtime boundary and no side effects"
    >
      <h3>Runtime boundary</h3>
      <div className="perspective-workbench-status-row">
        {Object.entries(routeBoundary).map(([key, value]) => (
          <span key={key}>
            {key} <code>{String(value)}</code>
          </span>
        ))}
        {Object.entries(noSideEffects).map(([key, value]) => (
          <span key={key}>
            {key} <code>{String(value)}</code>
          </span>
        ))}
      </div>
      {storedDraftResult ? (
        <>
          <h4>Stored creation boundary</h4>
          <div className="perspective-workbench-status-row">
            {Object.entries(storedDraftResult.draft.stored_runtime_boundary).map(
              ([key, value]) => (
                <span key={key}>
                  {key} <code>{String(value)}</code>
                </span>
              ),
            )}
            {Object.entries(storedDraftResult.draft.stored_no_side_effects).map(
              ([key, value]) => (
                <span key={key}>
                  {key} <code>{String(value)}</code>
                </span>
              ),
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

function formatCandidateCountSummary(item: {
  candidate_count_summary: ManualNotePreviewDraftListItem["candidate_count_summary"];
}) {
  const counts = item.candidate_count_summary;
  return [
    `total ${counts.total}`,
    `claims ${counts.claims}`,
    `evidence ${counts.evidence}`,
    `tensions ${counts.tensions}`,
    `gaps ${counts.knowledge_gaps}`,
    `deltas ${counts.perspective_deltas}`,
    `work ${counts.follow_up_work}`,
  ].join(", ");
}
