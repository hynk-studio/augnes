import type Database from "better-sqlite3";

import {
  autonomyRunnerLedgerSchemaExistsV01,
  readAutonomyRunLedgerRecord,
} from "@/lib/autonomy/runner-ledger";
import { createSuggestedChangeReviewHrefV01 } from "@/lib/vnext/ai-workplane-review-href";
import { validateEpisodeDeltaProposalV01 } from "@/lib/vnext/episode-delta-proposal";
import {
  readVNextCoreRecordV01,
  type VNextCoreRecordEnvelopeV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { validateReviewDecisionV01 } from "@/lib/vnext/review-decision";
import {
  readProjectRunResultDetailV01,
} from "@/lib/vnext/runtime/project-run-result-read-model";
import { DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01 } from "@/lib/vnext/runtime/direct-native-host-round-trip";
import { createSharedInspectorHrefV01 } from "@/lib/vnext/shared-project-inspector-href";
import { validateStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
import type {
  ContinuityPinTargetRefV01,
  ProjectContinuityPinResolutionStatusV01,
} from "@/types/vnext/continuity-pins";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";

export interface ContinuityPinOwnerResolutionV01 {
  status: ProjectContinuityPinResolutionStatusV01;
  label: string | null;
  state_label: string;
  destination: string | null;
  exact_detail_destination: string | null;
}

export function resolveContinuityPinTargetV01(
  db: Database.Database,
  target: ContinuityPinTargetRefV01,
): ContinuityPinOwnerResolutionV01 {
  if (target.owner.kind === "unsupported_source") {
    return unsupportedResolutionV01();
  }
  if (target.owner.kind === "managed_run") {
    return resolveManagedRunV01(db, target, target.owner.run_ref);
  }
  const record = readVNextCoreRecordV01(db, {
    workspace_id: target.workspace_id,
    project_id: target.project_id,
    record_kind: target.owner.record_kind,
    record_id: target.owner.record_id,
  });
  if (!record) return unavailableResolutionV01();
  return resolveCoreRecordV01(db, target, record);
}

function resolveManagedRunV01(
  db: Database.Database,
  target: ContinuityPinTargetRefV01,
  runRef: string,
): ContinuityPinOwnerResolutionV01 {
  const receipt = findReceiptForRunV01(db, target, runRef);
  if (receipt) {
    try {
      const detail = readProjectRunResultDetailV01(db, {
        workspace_id: target.workspace_id,
        project_id: target.project_id,
        receipt_id: receipt.record_id,
      });
      return {
        status: "resolved",
        label: boundedPublicTextV01(detail.summary.summary),
        state_label: resultStateLabelV01(
          detail.summary.execution_status,
          detail.summary.verification_status,
        ),
        destination: detail.summary.review_href,
        exact_detail_destination: detail.summary.inspector_href,
      };
    } catch {
      return unavailableResolutionV01(
        createSharedInspectorHrefV01({
          target_kind: receipt.record_kind,
          record_id: receipt.record_id,
          expected_fingerprint: receipt.fingerprint,
        }),
      );
    }
  }
  const run = autonomyRunnerLedgerSchemaExistsV01(db)
    ? readAutonomyRunLedgerRecord(runRef, { db })
    : null;
  if (
    !run ||
    run.scope !== target.project_id ||
    run.autonomy_contract_ref !== DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01 ||
    run.metadata.workspace_id !== target.workspace_id ||
    run.metadata.project_id !== target.project_id
  ) {
    return unavailableResolutionV01();
  }
  const terminal = [
    "completed",
    "failed",
    "cancelled",
    "timed_out",
    "blocked",
  ].includes(run.status);
  if (terminal) {
    return {
      status: "temporarily_unavailable",
      label: boundedPublicTextV01(run.title),
      state_label:
        "The run owner remains recorded, but no trusted saved-result destination is available.",
      destination: null,
      exact_detail_destination: createSharedInspectorHrefV01({
        target_kind: "automation_run",
        run_id: run.run_id,
      }),
    };
  }
  return {
    status: "resolved",
    label: boundedPublicTextV01(run.title),
    state_label: managedRunStateLabelV01(run.status),
    destination: "/workbench/semantic-review#delegated-work",
    exact_detail_destination: createSharedInspectorHrefV01({
      target_kind: "automation_run",
      run_id: run.run_id,
    }),
  };
}

function resolveCoreRecordV01(
  db: Database.Database,
  target: ContinuityPinTargetRefV01,
  record: VNextCoreRecordEnvelopeV01,
): ContinuityPinOwnerResolutionV01 {
  const exactDetail = createSharedInspectorHrefV01({
    target_kind: record.record_kind,
    record_id: record.record_id,
    expected_fingerprint: record.fingerprint,
  });
  if (record.record_kind === "run_receipt") {
    try {
      const detail = readProjectRunResultDetailV01(db, {
        workspace_id: target.workspace_id,
        project_id: target.project_id,
        receipt_id: record.record_id,
      });
      return {
        status: "resolved",
        label: boundedPublicTextV01(detail.summary.summary),
        state_label: resultStateLabelV01(
          detail.summary.execution_status,
          detail.summary.verification_status,
        ),
        destination: detail.summary.review_href,
        exact_detail_destination: detail.summary.inspector_href,
      };
    } catch {
      return unavailableResolutionV01(exactDetail);
    }
  }
  if (record.record_kind === "episode_delta_proposal") {
    if (validateEpisodeDeltaProposalV01(record.payload).status !== "valid") {
      return unavailableResolutionV01(exactDetail);
    }
    const proposal = record.payload as EpisodeDeltaProposalV01;
    return {
      status: "resolved",
      label: boundedPublicTextV01(proposal.bounded_summary),
      state_label: "Review context remains available",
      destination: createSuggestedChangeReviewHrefV01(proposal.proposal_id),
      exact_detail_destination: exactDetail,
    };
  }
  if (record.record_kind === "review_decision") {
    if (validateReviewDecisionV01(record.payload).status !== "valid") {
      return unavailableResolutionV01(exactDetail);
    }
    const decision = record.payload as ReviewDecisionV01;
    const proposal = readProposalV01(
      db,
      target,
      decision.source_proposal.proposal_id,
    );
    return {
      status: "resolved",
      label: proposal
        ? boundedPublicTextV01(proposal.bounded_summary)
        : `Recorded ${decision.decision} decision`,
      state_label: `Decision recorded · ${decision.decision}`,
      destination: createSuggestedChangeReviewHrefV01(
        decision.source_proposal.proposal_id,
      ),
      exact_detail_destination: exactDetail,
    };
  }
  if (validateStateTransitionReceiptV01(record.payload).status !== "valid") {
    return unavailableResolutionV01(exactDetail);
  }
  const transition = record.payload as StateTransitionReceiptV01;
  const proposal = readProposalV01(
    db,
    target,
    transition.source_proposal.proposal_id,
  );
  return {
    status: "resolved",
    label: proposal
      ? boundedPublicTextV01(proposal.bounded_summary)
      : "Applied project transition",
    state_label: "Applied transition remains available for review",
    destination: createSuggestedChangeReviewHrefV01(
      transition.source_proposal.proposal_id,
    ),
    exact_detail_destination: exactDetail,
  };
}

function findReceiptForRunV01(
  db: Database.Database,
  target: ContinuityPinTargetRefV01,
  runRef: string,
): VNextCoreRecordEnvelopeV01 | null {
  const row = db.prepare(
    `SELECT record_id
     FROM vnext_core_records
     WHERE workspace_id = ?
       AND project_id = ?
       AND record_kind = 'run_receipt'
       AND json_extract(payload_json, '$.run_id') = ?
     ORDER BY created_at DESC, record_id DESC
     LIMIT 1`,
  ).get(target.workspace_id, target.project_id, runRef) as
    | { record_id: string }
    | undefined;
  if (!row) return null;
  return readVNextCoreRecordV01(db, {
    workspace_id: target.workspace_id,
    project_id: target.project_id,
    record_kind: "run_receipt",
    record_id: row.record_id,
  });
}

function readProposalV01(
  db: Database.Database,
  target: ContinuityPinTargetRefV01,
  proposalId: string,
): EpisodeDeltaProposalV01 | null {
  const record = readVNextCoreRecordV01(db, {
    workspace_id: target.workspace_id,
    project_id: target.project_id,
    record_kind: "episode_delta_proposal",
    record_id: proposalId,
  });
  if (
    !record ||
    validateEpisodeDeltaProposalV01(record.payload).status !== "valid"
  ) {
    return null;
  }
  return record.payload as EpisodeDeltaProposalV01;
}

function resultStateLabelV01(
  execution: string,
  verification: string,
): string {
  return boundedPublicTextV01(
    `Saved result · execution ${execution.replaceAll("_", " ")} · verification ${verification.replaceAll("_", " ")}`,
  );
}

function managedRunStateLabelV01(status: string): string {
  const labels: Record<string, string> = {
    scheduled: "Preparing",
    running: "Work is in progress",
    paused: "Paused; review current work",
    cancelling: "Stopping",
  };
  return labels[status] ?? `Current run · ${status.replaceAll("_", " ")}`;
}

function unavailableResolutionV01(
  exactDetailDestination: string | null = null,
): ContinuityPinOwnerResolutionV01 {
  return {
    status: "temporarily_unavailable",
    label: null,
    state_label: "Unavailable in the current projection",
    destination: null,
    exact_detail_destination: exactDetailDestination,
  };
}

function unsupportedResolutionV01(): ContinuityPinOwnerResolutionV01 {
  return {
    status: "no_longer_supported",
    label: null,
    state_label: "This pinned source is no longer supported",
    destination: null,
    exact_detail_destination: null,
  };
}

function boundedPublicTextV01(value: string): string {
  const text = value
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  return text.length <= 320 ? text : `${text.slice(0, 319)}…`;
}
