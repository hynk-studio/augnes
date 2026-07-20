import type Database from "better-sqlite3";

import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  countVNextCoreRecordsV01,
  deriveVNextSemanticTargetKeyV01,
  listVNextCoreRecordsV01,
  readVNextCoreRecordV01,
  readVNextSemanticTargetHeadV01,
  validateVNextPersistedSemanticStateV01,
  type VNextCoreRecordEnvelopeV01,
  type VNextCoreRecordKindV01,
  type VNextSemanticTargetHeadV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  readClaimEvidenceRelationV01,
  readClaimRecordV01,
  readEvidenceRecordV01,
} from "@/lib/vnext/persistence/project-verify-material-store";
import {
  listCurrentVNextAutomationWorkSnapshotsV01,
  readCurrentVNextAutomationWorkSnapshotV01,
  readBoundedAutomationCapabilityGrantV01,
  validateVNextAutomationWorkSnapshotV01,
} from "@/lib/vnext/persistence/bounded-automation-authority";
import { readProjectAutomationControlV01 } from "@/lib/vnext/persistence/project-control-store";
import {
  CODEX_APP_SERVER_ADAPTER_VERSION_V01,
  CODEX_APP_SERVER_CAPABILITY_VERSION_V01,
} from "@/lib/vnext/native-host/codex-app-server-adapter";
import {
  readBoundedAutomationCycleProjectionV01,
} from "@/lib/vnext/runtime/bounded-automation-cycle";
import { DEFAULT_LIVE_TIMEOUT_MS } from "@/lib/vnext/runtime/live-native-host-run-service";
import type { VNextLocalOperatorPilotConfigV01 } from "@/lib/vnext/runtime/local-operator-session";
import {
  VNextOperatorPilotContinuityErrorV01,
  inspectVNextOperatorPilotPacketLineageV01,
  projectVNextOperatorPilotContinuityV01,
} from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  readVNextOperatorPilotSemanticReviewV01,
  type VNextOperatorPilotReviewDetailV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "@/lib/vnext/runtime/operator-pilot-workbench-lineage";
import {
  loadValidatedVNextSemanticCommitGateRelationV01,
  loadValidatedVNextSemanticTransitionRelationV01,
  type ValidatedVNextSemanticCommitGateRelationV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import { readProjectRunResultDetailV01 } from "@/lib/vnext/runtime/project-run-result-read-model";
import { readProjectVerifyLineageV01 } from "@/lib/vnext/runtime/project-verify-lineage";
import {
  ProjectVerifyReconciliationReadErrorV01,
  readProjectVerifyReconciliationV01,
} from "@/lib/vnext/runtime/project-verify-reconciliation";
import { validateEpisodeDeltaProposalV01 } from "@/lib/vnext/episode-delta-proposal";
import {
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionV01,
} from "@/lib/vnext/review-decision";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { validateStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import { validateContextUseReviewV01 } from "@/lib/vnext/context-use-review";
import {
  validateClaimEvidenceRelationV01,
  validateClaimRecordV01,
  validateEvidenceRecordV01,
} from "@/lib/vnext/project-verify-material";
import { validateBoundedAutomationCapabilityGrantV01 } from "@/lib/vnext/bounded-automation-cycle";
import { isPersonalPerspectiveSelectedEntryV01 } from "@/lib/vnext/project-controls/project-controls";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import type {
  ProjectVerifyExactProtocolRefV01,
  ProjectVerifyReconciliationV01,
} from "@/types/vnext/project-verify-reconciliation";
import type { ProjectVerifyLineageLookupV01 } from "@/types/vnext/project-verify-lineage";
import {
  SHARED_PROJECT_INSPECTOR_VERSION_V01,
  type SharedProjectInspectorExactRefV01,
  type SharedProjectInspectorFactV01,
  type SharedProjectInspectorItemV01,
  type SharedProjectInspectorProjectionV01,
  type SharedProjectInspectorSectionKindV01,
  type SharedProjectInspectorSectionV01,
  type SharedProjectInspectorTargetV01,
} from "@/types/vnext/shared-project-inspector";

const MAX_SECTION_ITEMS_V01 = 64;
const MAX_GATE_HISTORY_SCAN_V01 = 256;

export class SharedProjectInspectorReadErrorV01 extends Error {
  constructor(
    readonly code: string,
    readonly status = 422,
  ) {
    super(code);
    this.name = "SharedProjectInspectorReadErrorV01";
  }
}

interface ResolvedInspectorFocusV01 {
  exact_record: VNextCoreRecordEnvelopeV01 | null;
  proposal_id: string | null;
  receipt_id: string | null;
  candidate_id: string | null;
  decision_id: string | null;
  gate_id: string | null;
  transition_receipt_id: string | null;
  target_head: VNextSemanticTargetHeadV01 | null;
  packet: TaskContextPacketV01 | null;
  lineage_lookup: ProjectVerifyLineageLookupV01 | null;
  title: string;
  summary: string;
  trust: string;
  currentness: string;
}

interface InspectorGateHistoryEntryV01 {
  envelope: VNextCoreRecordEnvelopeV01;
  relation: ValidatedVNextSemanticCommitGateRelationV01;
  expired: boolean;
}

interface InspectorGateHistoryV01 {
  entries: InspectorGateHistoryEntryV01[];
  bounded_incomplete: boolean;
}

interface InspectorTargetHeadRelationV01 {
  head: VNextSemanticTargetHeadV01;
  source_transition_receipt_id: string;
  current_for_source_transition: boolean;
}

/**
 * Rebuildable target-focused composition over existing source-authenticated
 * readers. It adds no record kind, persistence, current-head selection, model
 * call, mutation or semantic authority.
 */
export function readSharedProjectInspectorV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    authenticated_session_id: string;
    observed_at: string;
    target: SharedProjectInspectorTargetV01;
  },
): SharedProjectInspectorProjectionV01 {
  let reconciliation: ProjectVerifyReconciliationV01 | null;
  try {
    reconciliation = readProjectVerifyReconciliationV01(db, {
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      observed_at: input.observed_at,
    });
  } catch (error) {
    if (
      input.target.target_kind !== "personal_perspective_inclusion" ||
      !(error instanceof ProjectVerifyReconciliationReadErrorV01)
    ) {
      throw error;
    }
    // Exact packet inclusion remains inspectable when an unrelated project-wide
    // reconciliation lane is source-conflicting. The unavailable lane is shown
    // bounded-incomplete; no relation is inferred, repaired, or accepted.
    reconciliation = null;
  }
  const focus = resolveFocusV01(db, input, reconciliation);
  const lineage = focus.lineage_lookup
    ? readProjectVerifyLineageV01(db, {
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
        observed_at: input.observed_at,
        lookup: focus.lineage_lookup,
      })
    : null;
  let continuity: ReturnType<typeof projectVNextOperatorPilotContinuityV01> | null;
  try {
    continuity = projectVNextOperatorPilotContinuityV01(db, {
      config: input.config,
      clock: { now: () => input.observed_at },
    });
  } catch (error) {
    if (
      input.target.target_kind !== "personal_perspective_inclusion" ||
      !(error instanceof VNextOperatorPilotContinuityErrorV01)
    ) {
      throw error;
    }
    // Exact packet targets can outlive an unavailable or source-conflicting
    // project continuity lane. The lane stops here rather than being inferred.
    continuity = null;
  }
  const automation = input.target.target_kind === "personal_perspective_inclusion"
    ? null
    : readBoundedAutomationCycleProjectionV01(db, {
        config: input.config,
        observed_at: input.observed_at,
        host: {
          adapter_version: CODEX_APP_SERVER_ADAPTER_VERSION_V01,
          capability_version: CODEX_APP_SERVER_CAPABILITY_VERSION_V01,
          timeout_ms: DEFAULT_LIVE_TIMEOUT_MS,
          execution_profile: "native_host_managed_model",
          provider_egress: "native_host_managed",
        },
      });
  const automationWork = automation?.work_source
    ? readCurrentVNextAutomationWorkSnapshotV01(db, {
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
        work_id: automation.work_source.work_id,
      })
    : null;
  const result = focus.receipt_id
    ? readProjectRunResultDetailV01(db, {
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
        receipt_id: focus.receipt_id,
      })
    : null;
  const proposal = focus.proposal_id
    ? readVNextOperatorPilotSemanticReviewV01(db, {
        config: input.config,
        proposal_id: focus.proposal_id,
        authenticated_session_id: input.authenticated_session_id,
        model_capability: {
          status: "unavailable",
          summary: "Inspector reads never request strategic model work.",
          verification: "trusted_local_status",
        },
      })
    : null;
  const durableLineage = proposal
    ? readVNextOperatorPilotProposalDurableLineageV01(db, {
        config: input.config,
        proposal: proposal.proposal,
        clock: { now: () => input.observed_at },
      })
    : null;
  const gateHistory = proposal
    ? readProposalGateHistoryV01(db, {
        config: input.config,
        proposal: proposal.proposal,
        observed_at: input.observed_at,
        exact_focus_gate: focus.gate_id ? focus.exact_record : null,
      })
    : { entries: [], bounded_incomplete: false };
  const targetHeads = readFocusedTargetHeadsV01(db, {
    config: input.config,
    focus,
    proposal,
  });

  const sections = buildSectionsV01({
    input,
    focus,
    reconciliation,
    lineage,
    continuity,
    automation,
    automation_work: automationWork,
    result,
    proposal,
    durable_lineage: durableLineage,
    gate_history: gateHistory,
    target_heads: targetHeads,
  });
  const completeness = [
    reconciliation?.completeness.status,
    lineage?.completeness.status,
  ].includes("bounded_incomplete") ||
    reconciliation === null ||
    continuity === null ||
    gateHistory.bounded_incomplete
    ? "bounded_incomplete"
    : reconciliation.conflicts.length > 0 || (lineage?.conflicts.length ?? 0) > 0
      ? "conflict"
      : reconciliation.completeness.status;
  return {
    inspector_version: SHARED_PROJECT_INSPECTOR_VERSION_V01,
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    observed_at: input.observed_at,
    target: structuredClone(input.target),
    target_status:
      completeness === "bounded_incomplete"
        ? "bounded_incomplete"
        : completeness === "conflict"
          ? "conflict"
          : "present",
    target_title: focus.title,
    target_summary: focus.summary,
    target_trust: focus.trust,
    target_currentness: focus.currentness,
    completeness,
    sections,
    lineage,
    authority: inspectorAuthorityV01(),
  };
}

function resolveFocusV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    authenticated_session_id: string;
    observed_at: string;
    target: SharedProjectInspectorTargetV01;
  },
  reconciliation: ProjectVerifyReconciliationV01 | null,
): ResolvedInspectorFocusV01 {
  const scope = {
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
  };
  const target = input.target;
  if (target.target_kind === "project_coordination") {
    return focusV01(
      "Project coordination",
      "Current project-scoped coordination and exact semantic lineage are composed from existing readers.",
      "mixed source-authenticated project material",
      "observed now",
    );
  }
  if (target.target_kind === "criterion") {
    const criterion = reconciliation?.criteria.find(
      (value) =>
        value.criterion.criterion_id === target.criterion_id &&
        exactRefMatchesV01(value.packet_ref, target.packet_id, target.packet_fingerprint) &&
        exactRefMatchesV01(value.receipt_ref, target.receipt_id, target.receipt_fingerprint) &&
        exactRefMatchesV01(value.assessment_ref, target.assessment_id, target.assessment_fingerprint),
    );
    if (!reconciliation || !criterion) {
      refuseV01("shared_inspector_criterion_source_conflict", 404);
    }
    return {
      ...focusV01(
        "Exact success criterion",
        criterion.criterion.criterion,
        criterion.criterion.basis,
        reconciliation.observed_at,
      ),
      receipt_id: target.receipt_id,
      packet: assertPacketV01(
        exactRecordV01(
          db,
          scope,
          "task_context_packet",
          target.packet_id,
          target.packet_fingerprint,
        ),
        input.observed_at,
      ),
      lineage_lookup: {
        lookup_kind: "criterion",
        criterion_id: target.criterion_id,
        packet_ref: criterion.packet_ref,
        receipt_ref: criterion.receipt_ref,
      },
    };
  }
  if (target.target_kind === "claim_family" || target.target_kind === "relation_family") {
    const family = target.target_kind === "claim_family"
      ? reconciliation?.claim_families.find(
          (value) => value.claim_family_id === target.family_id,
        )
      : reconciliation?.relation_families.find(
          (value) => value.relation_family_id === target.family_id,
        );
    if (
      !reconciliation ||
      !family ||
      family.family_origin_fingerprint !== target.family_origin_fingerprint ||
      family.applicability_scope_fingerprint !==
        target.applicability_scope_fingerprint
    ) {
      refuseV01("shared_inspector_family_source_conflict", 404);
    }
    return {
      ...focusV01(
        target.target_kind === "claim_family" ? "Claim family" : "Relation family",
        "Immutable revisions are shown separately from latest recorded and applied current material.",
        "source-authenticated family lineage",
        reconciliation.observed_at,
      ),
      lineage_lookup:
        target.target_kind === "claim_family"
          ? { lookup_kind: "claim_family", claim_family_id: target.family_id }
          : {
              lookup_kind: "claim_evidence_relation_family",
              relation_family_id: target.family_id,
            },
    };
  }
  if (target.target_kind === "proposal_candidate") {
    const proposalRecord = exactRecordV01(
      db,
      scope,
      "episode_delta_proposal",
      target.proposal_id,
      target.proposal_fingerprint,
    );
    assertProposalV01(proposalRecord);
    const proposal = proposalRecord.payload as EpisodeDeltaProposalV01;
    const candidate = proposal.proposed_deltas.find(
      (value) => value.candidate_id === target.candidate_id,
    );
    const candidateFingerprint = candidate
      ? createEpisodeDeltaCandidateFingerprintV01(candidate)
      : null;
    if (!candidate || candidateFingerprint !== target.candidate_fingerprint) {
      refuseV01("shared_inspector_candidate_source_conflict", 404);
    }
    return {
      ...focusV01(
        "Exact proposal candidate",
        candidate.proposed_state_summary,
        "candidate not command or current state",
        proposal.created_at,
      ),
      exact_record: proposalRecord,
      proposal_id: proposal.proposal_id,
      receipt_id: proposal.run_receipt_refs[0]?.external_id ?? null,
      candidate_id: candidate.candidate_id,
      packet: packetFromProposalV01(db, scope, proposal, input.observed_at),
      lineage_lookup: {
        lookup_kind: "proposal",
        proposal_id: proposal.proposal_id,
        expected_fingerprint: proposal.integrity.fingerprint,
      },
    };
  }
  if (target.target_kind === "semantic_target_head") {
    const head = readVNextSemanticTargetHeadV01(db, {
      ...scope,
      target_key: target.target_key,
    });
    if (
      !head ||
      head.revision !== target.revision ||
      head.presence !== target.presence ||
      head.source_transition_receipt_id !== target.transition_receipt_id ||
      head.source_transition_receipt_fingerprint !==
        target.transition_receipt_fingerprint
    ) {
      refuseV01("shared_inspector_target_head_conflict", 404);
    }
    return {
      ...focusV01(
        "Canonical semantic target head",
        `${head.presence} at revision ${head.revision}; timestamp ordering did not select this head.`,
        "canonical Core target-head projection",
        head.updated_at,
      ),
      transition_receipt_id: head.source_transition_receipt_id,
      target_head: head,
      lineage_lookup: {
        lookup_kind: "transition_receipt",
        transition_receipt_id: head.source_transition_receipt_id,
        expected_fingerprint: head.source_transition_receipt_fingerprint,
      },
    };
  }
  if (target.target_kind === "automation_policy") {
    const control = readProjectAutomationControlV01(db, scope);
    if (!control) refuseV01("shared_inspector_automation_policy_missing", 404);
    const policyId = `${input.config.project_id}:${control.revision}`;
    const policyFingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01(control.policy),
    );
    if (
      target.policy_id !== policyId ||
      target.policy_fingerprint !== policyFingerprint
    ) {
      refuseV01("shared_inspector_automation_policy_conflict", 404);
    }
    return focusV01(
      "Automation policy",
      "Project-scoped control policy; it grants no semantic authority.",
      "canonical project control",
      control.updated_at,
    );
  }
  if (target.target_kind === "automation_work_item") {
    const work = readCurrentVNextAutomationWorkSnapshotV01(db, {
      ...scope,
      work_id: target.record_id,
    });
    if (
      !work ||
      !validateVNextAutomationWorkSnapshotV01(work) ||
      work.source.work_fingerprint !== target.expected_fingerprint
    ) {
      refuseV01("shared_inspector_automation_work_conflict", 404);
    }
    return {
      ...focusV01(
        "Automation work item",
        `${work.status}: ${work.status_reason}`,
        "source-authenticated bounded work; no semantic authority",
        work.observed_at,
      ),
      packet: assertPacketV01(
        exactRecordV01(
          db,
          scope,
          "task_context_packet",
          work.source.source_packet.packet_id,
          work.source.source_packet.packet_fingerprint,
        ),
        input.observed_at,
      ),
      receipt_id: work.cycle_binding?.receipt_ref?.external_id ?? null,
      proposal_id: work.cycle_binding?.proposal_ref?.external_id ?? null,
    };
  }
  if (target.target_kind === "automation_cycle" || target.target_kind === "automation_run") {
    const work = listCurrentVNextAutomationWorkSnapshotsV01(db, scope).find(
      (value) =>
        target.target_kind === "automation_cycle"
          ? value.cycle_binding?.cycle_id === target.cycle_id
          : value.cycle_binding?.run_id === target.run_id,
    );
    if (!work) refuseV01("shared_inspector_automation_binding_missing", 404);
    if (!validateVNextAutomationWorkSnapshotV01(work)) {
      refuseV01("shared_inspector_automation_binding_conflict");
    }
    return {
      ...focusV01(
        target.target_kind === "automation_cycle" ? "Bounded automation cycle" : "Bounded automation run",
        `${work.status}: ${work.status_reason}`,
        "bounded automation lineage, no semantic authority",
        work.observed_at,
      ),
      receipt_id: work.cycle_binding?.receipt_ref?.external_id ?? null,
      proposal_id: work.cycle_binding?.proposal_ref?.external_id ?? null,
      packet: assertPacketV01(
        exactRecordV01(
          db,
          scope,
          "task_context_packet",
          work.source.source_packet.packet_id,
          work.source.source_packet.packet_fingerprint,
        ),
        input.observed_at,
      ),
    };
  }
  if (target.target_kind === "strategic_material") {
    const record = exactRecordV01(
      db,
      scope,
      "episode_delta_proposal",
      target.proposal_id,
      target.proposal_fingerprint,
    );
    assertProposalV01(record);
    const proposal = record.payload as EpisodeDeltaProposalV01;
    if (!proposal.strategic_advantage_transfer) {
      refuseV01("shared_inspector_strategic_material_missing", 404);
    }
    return {
      ...focusV01(
        "Source-bound strategic material",
        proposal.bounded_summary,
        "candidate-level advisory material",
        proposal.created_at,
      ),
      exact_record: record,
      proposal_id: proposal.proposal_id,
      receipt_id: proposal.run_receipt_refs[0]?.external_id ?? null,
      packet: packetFromProposalV01(db, scope, proposal, input.observed_at),
      lineage_lookup: {
        lookup_kind: "proposal",
        proposal_id: proposal.proposal_id,
        expected_fingerprint: proposal.integrity.fingerprint,
      },
    };
  }
  if (target.target_kind === "personal_perspective_inclusion") {
    const record = exactRecordV01(
      db,
      scope,
      "task_context_packet",
      target.packet_id,
      target.packet_fingerprint,
    );
    const packet = assertPacketV01(record, input.observed_at);
    if (!packet.selected_context.some(isPersonalPerspectiveSelectedEntryV01)) {
      refuseV01("shared_inspector_personal_perspective_not_included", 404);
    }
    return {
      ...focusV01(
        "Task-scoped Personal Perspective inclusion",
        "Only exact selected packet entries are shown; project membership alone is insufficient.",
        "exact packet inclusion lineage",
        packet.generated_at,
      ),
      exact_record: record,
      packet,
    };
  }
  if (target.target_kind === "integration_health" || target.target_kind === "capability_coverage") {
    const record = exactRecordV01(
      db,
      scope,
      "run_receipt",
      target.receipt_id,
      target.receipt_fingerprint,
    );
    assertRunReceiptV01(record);
    return {
      ...focusV01(
        target.target_kind === "integration_health" ? "Integration health" : "Capability coverage",
        "Exact receipt coverage is shown; UI availability is not treated as integration health.",
        "exact RunReceipt coverage",
        record.created_at,
      ),
      exact_record: record,
      receipt_id: target.receipt_id,
    };
  }

  if (!("record_id" in target) || !("expected_fingerprint" in target)) {
    refuseV01("shared_inspector_target_resolution_invalid");
  }
  const recordKind = coreRecordKindV01(target.target_kind);
  const record = exactRecordV01(
    db,
    scope,
    recordKind,
    target.record_id,
    target.expected_fingerprint,
  );
  const resolved = validateAndDescribeCoreRecordV01(
    db,
    input.config,
    record,
    input.observed_at,
  );
  return { ...resolved, exact_record: record };
}

function readProposalGateHistoryV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    proposal: EpisodeDeltaProposalV01;
    observed_at: string;
    exact_focus_gate: VNextCoreRecordEnvelopeV01 | null;
  },
): InspectorGateHistoryV01 {
  const scope = {
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
  };
  const total = countVNextCoreRecordsV01(db, {
    ...scope,
    record_kind: "semantic_commit_gate",
  });
  const records = listVNextCoreRecordsV01(db, {
    ...scope,
    record_kinds: ["semantic_commit_gate"],
    limit: MAX_GATE_HISTORY_SCAN_V01,
  });
  if (
    input.exact_focus_gate?.record_kind === "semantic_commit_gate" &&
    !records.some(
      (record) => record.record_id === input.exact_focus_gate!.record_id,
    )
  ) {
    records.push(input.exact_focus_gate);
  }
  const observedAt = parseStrictIsoTimestampV01(input.observed_at);
  if (observedAt === null) {
    refuseV01("shared_inspector_observed_at_invalid", 500);
  }
  const entries = records
    .map((envelope) => {
      const relation = loadValidatedVNextSemanticCommitGateRelationV01(db, {
        ...scope,
        gate_record_id: envelope.record_id,
        gate_record_fingerprint: envelope.fingerprint,
      });
      if (
        relation.proposal.proposal_id !== input.proposal.proposal_id ||
        relation.proposal.integrity.fingerprint !==
          input.proposal.integrity.fingerprint
      ) {
        return null;
      }
      const expiresAt = parseStrictIsoTimestampV01(
        relation.gate_record.semantic_commit_gate_evaluation.expires_at,
      );
      if (expiresAt === null) {
        refuseV01("shared_inspector_gate_expiry_invalid");
      }
      return {
        envelope,
        relation,
        expired: expiresAt <= observedAt,
      } satisfies InspectorGateHistoryEntryV01;
    })
    .filter((entry): entry is InspectorGateHistoryEntryV01 => entry !== null)
    .sort((left, right) => {
      const byTime = right.relation.gate_record.confirmed_at.localeCompare(
        left.relation.gate_record.confirmed_at,
      );
      return byTime || left.envelope.record_id.localeCompare(right.envelope.record_id);
    });
  return {
    entries,
    bounded_incomplete:
      total > MAX_GATE_HISTORY_SCAN_V01 ||
      entries.length > MAX_SECTION_ITEMS_V01,
  };
}

function readFocusedTargetHeadsV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    focus: ResolvedInspectorFocusV01;
    proposal: VNextOperatorPilotReviewDetailV01 | null;
  },
): InspectorTargetHeadRelationV01[] {
  if (input.focus.target_head) {
    return [{
      head: input.focus.target_head,
      source_transition_receipt_id:
        input.focus.target_head.source_transition_receipt_id,
      current_for_source_transition: true,
    }];
  }
  const receipts = (input.proposal?.transition_receipts ?? []).filter(
    (receipt) =>
      (!input.focus.transition_receipt_id ||
        receipt.transition_receipt_id === input.focus.transition_receipt_id) &&
      (!input.focus.decision_id ||
        receipt.source_decision.decision_id === input.focus.decision_id) &&
      (!input.focus.candidate_id ||
        receipt.source_candidate.candidate_id === input.focus.candidate_id) &&
      (!input.focus.gate_id ||
        receipt.semantic_commit_gate.evaluation_ref.external_id ===
          input.focus.gate_id),
  );
  const relations = receipts.flatMap((receipt) =>
    receipt.effects.flatMap((effect) => {
      const head = readVNextSemanticTargetHeadV01(db, {
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
        target_key: deriveVNextSemanticTargetKeyV01(effect.target_ref),
      });
      return head
        ? [{
            head,
            source_transition_receipt_id: receipt.transition_receipt_id,
            current_for_source_transition:
              head.source_transition_receipt_id ===
                receipt.transition_receipt_id &&
              head.source_transition_receipt_fingerprint ===
                receipt.integrity.fingerprint,
          }]
        : [];
    }),
  );
  return [...new Map(
    relations.map((relation) => [
      `${relation.source_transition_receipt_id}:${relation.head.target_key}`,
      relation,
    ]),
  ).values()];
}

function buildSectionsV01(input: {
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    authenticated_session_id: string;
    observed_at: string;
    target: SharedProjectInspectorTargetV01;
  };
  focus: ResolvedInspectorFocusV01;
  reconciliation: ProjectVerifyReconciliationV01 | null;
  lineage: ReturnType<typeof readProjectVerifyLineageV01> | null;
  continuity: ReturnType<typeof projectVNextOperatorPilotContinuityV01> | null;
  automation: ReturnType<typeof readBoundedAutomationCycleProjectionV01> | null;
  automation_work: ReturnType<typeof readCurrentVNextAutomationWorkSnapshotV01>;
  result: ReturnType<typeof readProjectRunResultDetailV01> | null;
  proposal: VNextOperatorPilotReviewDetailV01 | null;
  durable_lineage: ReturnType<typeof readVNextOperatorPilotProposalDurableLineageV01> | null;
  gate_history: InspectorGateHistoryV01;
  target_heads: InspectorTargetHeadRelationV01[];
}): SharedProjectInspectorSectionV01[] {
  const sections: SharedProjectInspectorSectionV01[] = [];
  sections.push(sectionV01(
    "target_authority",
    "Target identity and authority",
    "available",
    "The server authenticated project scope and exact source identity. This projection is read-only and rebuildable.",
    [
      factV01("Target kind", input.input.target.target_kind),
      factV01("Project", input.input.config.project_id),
      factV01("Trust", input.focus.trust),
      factV01("Currentness", input.focus.currentness),
      factV01("Claim truth", "not established", "attention"),
    ],
    [],
    input.focus.exact_record ? [recordRefV01(input.focus.exact_record)] : [],
  ));
  sections.push(timelineSectionV01(input));
  sections.push(contextSectionV01(input));
  sections.push(runSectionV01(input));
  sections.push(criterionSectionV01(input));
  sections.push(materialSectionV01(input));
  sections.push(proposalSectionV01(input));
  sections.push(decisionSectionV01(input));
  sections.push(transitionSectionV01(input));
  sections.push(laterContextSectionV01(input));
  sections.push(automationSectionV01(input));
  sections.push(strategicPerspectiveSectionV01(input));
  sections.push(integrationSectionV01(input));
  return sections;
}

function timelineSectionV01(
  input: Parameters<typeof buildSectionsV01>[0],
): SharedProjectInspectorSectionV01 {
  const items = input.lineage
    ? input.lineage.nodes.map((node) => ({
        item_id: node.node_id,
        title: humanizeV01(node.node_kind),
        summary: humanizeV01(node.authority_boundary),
        status: node.status,
        recorded_at: node.recorded_at,
        exact_refs: node.exact_ref ? [protocolRefV01(node.exact_ref)] : [],
      }))
    : input.focus.exact_record
      ? [recordItemV01(input.focus.exact_record)]
      : [];
  return sectionV01(
    "timeline",
    "Timeline",
    input.lineage?.completeness.status === "bounded_incomplete"
      ? "bounded_incomplete"
      : "available",
    "Recorded timestamps order relevant events; they never select semantic winners or current heads.",
    [],
    items,
    [],
  );
}

function contextSectionV01(
  input: Parameters<typeof buildSectionsV01>[0],
): SharedProjectInspectorSectionV01 {
  const packet = input.focus.packet;
  if (!packet) {
    return sectionV01(
      "selected_context_work",
      "Selected context and work",
      "missing",
      "No exact packet is bound to this focus target; the chain stops here rather than inferring context.",
    );
  }
  const selected = packet.selected_context.map((entry) => ({
    item_id: entry.entry_id,
    title: entry.bounded_summary ?? humanizeV01(entry.entry_kind),
    summary: `${entry.why_included} · ${entry.currentness.status} · ${entry.trust_class}`,
    status: entry.currentness.status,
    recorded_at: entry.currentness.as_of,
    exact_refs: [],
  }));
  return sectionV01(
    "selected_context_work",
    "Selected context and work",
    packet.source_status.status === "partial" ? "bounded_incomplete" : "available",
    `${packet.task.goal} TaskContextPacket is selected working context, not truth.`,
    [
      factV01("Selected", String(packet.selected_context.length)),
      factV01("Excluded", String(packet.excluded_context.length)),
      factV01("Gaps", String(packet.gaps.length)),
      factV01("Currentness", packet.source_status.currentness.status),
    ],
    selected,
    [{ record_kind: "task_context_packet", record_id: packet.packet_id, record_fingerprint: packet.integrity.fingerprint }],
  );
}

function runSectionV01(
  input: Parameters<typeof buildSectionsV01>[0],
): SharedProjectInspectorSectionV01 {
  const result = input.result;
  if (!result) {
    return sectionV01(
      "run_receipt",
      "Run and receipt",
      "missing",
      "No exact RunReceipt is bound to this target.",
    );
  }
  return sectionV01(
    "run_receipt",
    "Run and receipt",
    "available",
    `${result.summary.summary} Host completion remains distinct from task success.`,
    [
      factV01("Execution", result.summary.execution_status),
      factV01("Verification", result.summary.verification_status),
      factV01("Trust", result.summary.trust_label),
      factV01("Checks passed", String(result.summary.check_counts.passed)),
      factV01("Checks failed", String(result.summary.check_counts.failed), result.summary.check_counts.failed ? "critical" : "neutral"),
      factV01("Skipped", String(result.summary.check_counts.skipped), result.summary.check_counts.skipped ? "attention" : "neutral"),
      factV01("Direct observations", String(result.trust_summary.direct_observations)),
      factV01("Verified external observations", String(result.trust_summary.verified_external_observations)),
      factV01("Host attestations", String(result.trust_summary.host_attestations)),
      factV01("Provider reports", String(result.trust_summary.provider_reports)),
      factV01("Derived interpretations", String(result.trust_summary.derived_interpretations)),
    ],
    [
      ...result.commands.map((command) => itemV01(
        `command:${command.command_id}`,
        command.summary,
        `${command.basis} · exit ${command.exit_code ?? "not recorded"} · raw output excluded`,
        command.status,
        command.finished_at ?? command.started_at,
      )),
      ...result.actions.map((action) => itemV01(
        `action:${action.action_id}`,
        action.summary,
        `${action.basis} · bounded action residue`,
        action.basis,
        result.summary.recorded_at,
      )),
      ...result.checks.map((check) => itemV01(
        `check:${check.check_id}`,
        `${check.check_id}: ${check.summary}`,
        `${check.basis} · ${check.required ? "required" : "optional"}`,
        check.status,
        result.summary.recorded_at,
      )),
      ...result.skipped_checks.map((check) => itemV01(
        `skip:${check.check_id}`,
        `${check.check_id}: ${check.reason}`,
        `${check.basis} · skipped is not success`,
        "skipped",
        result.summary.recorded_at,
      )),
      ...result.artifacts.map((artifact, index) => itemV01(
        `artifact:${index}`,
        artifact.summary ?? "Recorded artifact",
        `${artifact.change_kind ?? "opaque artifact"} · ${artifact.basis} · raw diff and private absolute paths excluded`,
        artifact.change_kind ?? "unknown",
        result.summary.recorded_at,
        safeExternalRefV01(artifact.artifact_ref),
      )),
      ...result.host.approvals.map((approval, index) => itemV01(
        `approval:${index}`,
        approval.resource_summary,
        `${humanizeV01(approval.operation_class)} · ${humanizeV01(approval.decision_source ?? "not decided")} · semantic approval false`,
        approval.decision ?? "pending",
        approval.decided_at ?? approval.issued_at,
      )),
      ...result.blockers.map((issue) => itemV01(
        `blocker:${issue.code}`,
        issue.summary,
        "Exact receipt blocker",
        "blocked",
        result.summary.recorded_at,
      )),
      ...result.gaps.map((issue) => itemV01(
        `gap:${issue.code}`,
        issue.summary,
        "Exact receipt gap",
        "missing",
        result.summary.recorded_at,
      )),
      ...result.uncertainty.map((summary, index) => itemV01(
        `uncertainty:${index}`,
        summary,
        "Bounded receipt uncertainty",
        "unknown",
        result.summary.recorded_at,
      )),
    ],
    [{ record_kind: "run_receipt", record_id: result.identity.receipt_ref, record_fingerprint: result.identity.receipt_fingerprint }],
  );
}

function criterionSectionV01(
  input: Parameters<typeof buildSectionsV01>[0],
): SharedProjectInspectorSectionV01 {
  const reconciliation = input.reconciliation;
  if (!reconciliation) {
    return sectionV01(
      "criterion_basis",
      "Criterion basis",
      "bounded_incomplete",
      "The project-wide reconciliation lane is source-conflicting or unavailable. No criterion relation is inferred from this exact target.",
      [factV01("Source status", "bounded incomplete", "attention")],
    );
  }
  const criteria = focusedCriteriaV01(input);
  return sectionV01(
    "criterion_basis",
    "Criterion basis",
    reconciliation.completeness.status === "bounded_incomplete" ? "bounded_incomplete" : criteria.length ? "available" : "missing",
    "Statuses and basis come from exact SR-1 material. Insufficient remains unknown, and skipped checks do not satisfy a criterion.",
    [
      factV01("Criteria", String(criteria.length)),
      factV01("Source assessments", String(reconciliation.source_assessments.length)),
    ],
    criteria.map((entry) => ({
      item_id: entry.criterion.criterion_id,
      title: entry.criterion.criterion,
      summary: `${entry.criterion.basis} · ${entry.criterion.supporting_refs.length} supporting · ${entry.criterion.opposing_refs.length} opposing · ${entry.criterion.missing_refs.length} missing`,
      status: entry.criterion.status,
      recorded_at: reconciliation.observed_at,
      exact_refs: [
        protocolRefV01(entry.packet_ref),
        protocolRefV01(entry.receipt_ref),
        protocolRefV01(entry.assessment_ref),
      ],
    })),
    reconciliation.source_assessments.map(protocolRefV01),
  );
}

function focusedCriteriaV01(
  input: Parameters<typeof buildSectionsV01>[0],
): ProjectVerifyReconciliationV01["criteria"] {
  if (!input.reconciliation) return [];
  const target = input.input.target;
  if (target.target_kind === "criterion") {
    return input.reconciliation.criteria.filter(
      (entry) =>
        entry.criterion.criterion_id === target.criterion_id &&
        exactRefMatchesV01(
          entry.packet_ref,
          target.packet_id,
          target.packet_fingerprint,
        ) &&
        exactRefMatchesV01(
          entry.receipt_ref,
          target.receipt_id,
          target.receipt_fingerprint,
        ) &&
        exactRefMatchesV01(
          entry.assessment_ref,
          target.assessment_id,
          target.assessment_fingerprint,
        ),
    );
  }

  const receiptIds = new Set<string>();
  if (input.focus.receipt_id) receiptIds.add(input.focus.receipt_id);
  for (const ref of input.proposal?.proposal.run_receipt_refs ?? []) {
    if (ref.ref_type === "run_receipt") receiptIds.add(ref.external_id);
  }
  if (receiptIds.size > 0) {
    return input.reconciliation.criteria.filter((entry) =>
      receiptIds.has(entry.receipt_ref.record_id),
    );
  }

  if (input.focus.packet) {
    return input.reconciliation.criteria.filter((entry) =>
      exactRefMatchesV01(
        entry.packet_ref,
        input.focus.packet!.packet_id,
        input.focus.packet!.integrity.fingerprint,
      ),
    );
  }
  return input.reconciliation.criteria;
}

function materialSectionV01(
  input: Parameters<typeof buildSectionsV01>[0],
): SharedProjectInspectorSectionV01 {
  const reconciliation = input.reconciliation;
  if (!reconciliation) {
    return sectionV01(
      "evidence_claims_relations",
      "Evidence, Claims, and relations",
      "bounded_incomplete",
      "The project-wide reconciliation lane is source-conflicting or unavailable. Evidence, Claims, and relations are not inferred from the focus target.",
      [factV01("Claim truth", "not established", "attention")],
    );
  }
  const claims = reconciliation.claim_families.flatMap((family) =>
    family.revisions.map((revision) => itemV01(
      revision.claim.claim_id,
      revision.claim.proposition,
      `latest recorded ${String(revision.lifecycle.record.latest_recorded_candidate)} · current ${String(revision.lifecycle.application.current_family_head)} · truth not established`,
      revision.lifecycle.application.status,
      revision.claim.created_at,
      [protocolRefV01({ record_kind: "claim_record", record_id: revision.claim_ref.record_id, record_fingerprint: revision.claim_ref.record_fingerprint })],
    )),
  );
  const relations = reconciliation.relation_families.flatMap((family) =>
    family.revisions.map((revision) => itemV01(
      revision.relation.relation_id,
      humanizeV01(revision.relation.relation_kind),
      `relation exists; proof false · current ${String(revision.lifecycle.application.current_family_head)}`,
      revision.lifecycle.application.status,
      revision.relation.created_at,
      [protocolRefV01({ record_kind: "claim_evidence_relation", record_id: revision.relation_ref.record_id, record_fingerprint: revision.relation_ref.record_fingerprint })],
    )),
  );
  return sectionV01(
    "evidence_claims_relations",
    "Evidence, Claims, and relations",
    reconciliation.conflicts.length ? "conflict" : reconciliation.completeness.status === "bounded_incomplete" ? "bounded_incomplete" : "available",
    "Evidence is support material; Claims are revisable propositions; relation existence is not proof. Supporting, opposing, contradicting, qualifying, contextualizing, and insufficient material may coexist.",
    [
      factV01("Evidence", String(reconciliation.evidence.length)),
      factV01("Claim families", String(reconciliation.claim_families.length)),
      factV01("Relation families", String(reconciliation.relation_families.length)),
      factV01("Support present", String(reconciliation.summary.support_present)),
      factV01("Opposition present", String(reconciliation.summary.opposition_present)),
      factV01("Contradiction present", String(reconciliation.summary.contradiction_present)),
      factV01("Qualification present", String(reconciliation.summary.qualification_present)),
      factV01("Claim truth", reconciliation.summary.claim_truth, "attention"),
    ],
    [
      ...reconciliation.evidence.map((entry) => itemV01(
        entry.evidence.evidence_id,
        entry.evidence.bounded_summary,
        `${entry.trust_class} · ${entry.source_authentication.status} · ${entry.acceptance_status}`,
        "support_not_truth",
        entry.evidence.recorded_at,
        [protocolRefV01({ record_kind: "evidence_record", record_id: entry.evidence_ref.record_id, record_fingerprint: entry.evidence_ref.record_fingerprint })],
      )),
      ...claims,
      ...relations,
    ],
  );
}

function proposalSectionV01(
  input: Parameters<typeof buildSectionsV01>[0],
): SharedProjectInspectorSectionV01 {
  const proposal = input.proposal;
  if (!proposal) {
    return sectionV01(
      "proposal_candidate",
      "Proposal and candidate",
      "missing",
      "No exact proposal is bound to this target; absent stages are not fabricated.",
    );
  }
  return sectionV01(
    "proposal_candidate",
    "Proposal and candidate",
    "available",
    `${proposal.bounded_summary} Candidate revisions remain immutable and are not commands or current state.`,
    [
      factV01("Proposal status", proposal.status),
      factV01("Source currentness", proposal.source_currentness),
      factV01("Candidates", String(proposal.candidate_count)),
      factV01("Applied transition", proposal.transition_status),
    ],
    proposal.candidates.map(({ candidate, candidate_fingerprint }) => itemV01(
      candidate.candidate_id,
      candidate.title,
      `${candidate.operation} · ${candidate.proposed_state_summary}`,
      "candidate_not_command",
      proposal.created_at,
      [{ record_kind: "episode_delta_proposal_candidate", record_id: candidate.candidate_id, record_fingerprint: candidate_fingerprint }],
    )),
    [{ record_kind: "episode_delta_proposal", record_id: proposal.proposal_id, record_fingerprint: proposal.proposal_fingerprint }],
  );
}

function decisionSectionV01(
  input: Parameters<typeof buildSectionsV01>[0],
): SharedProjectInspectorSectionV01 {
  const proposal = input.proposal;
  const decisions = proposal?.decision_history ?? [];
  const appliedGateIds = new Set(
    (input.durable_lineage?.chains ?? []).map(
      (chain) => chain.semantic_gate.gate_id,
    ),
  );
  const gates = input.gate_history.entries;
  const authorizedUnapplied = gates.filter(
    (entry) =>
      !entry.expired &&
      !appliedGateIds.has(entry.relation.gate_record.gate_record_id),
  );
  const competingAuthorization = new Set(
    authorizedUnapplied.map((entry) =>
      canonicalizeProtocolValueV01({
        candidate_id: entry.relation.gate_record.candidate_id,
        effects: entry.relation.gate_record.intended_effects.map(
          (effect) => effect.target_key,
        ).sort(),
      }),
    ),
  ).size < authorizedUnapplied.length;
  return sectionV01(
    "decision_gate",
    "Decision and gate",
    competingAuthorization
      ? "conflict"
      : input.gate_history.bounded_incomplete ||
          decisions.length + gates.length > MAX_SECTION_ITEMS_V01
        ? "bounded_incomplete"
        : decisions.length || gates.length
          ? "available"
          : "pending",
    "ReviewDecision, gate authorization, and Transition application remain separate: the decision itself applies no state, and authorization is not application. Applying values are shown exactly; reject and defer are non-applying.",
    [
      factV01("Decision attempts", String(decisions.length)),
      factV01("Gate history", String(gates.length)),
      factV01("Authorized, unapplied", String(authorizedUnapplied.length), authorizedUnapplied.length ? "attention" : "neutral"),
      factV01("Expired, unapplied", String(gates.filter((entry) => entry.expired && !appliedGateIds.has(entry.relation.gate_record.gate_record_id)).length)),
      factV01("Applied gate chains", String(gates.filter((entry) => appliedGateIds.has(entry.relation.gate_record.gate_record_id)).length)),
      factV01("Competing live authorization", String(competingAuthorization), competingAuthorization ? "critical" : "neutral"),
    ],
    [
      ...decisions.map(({ decision, status, errors }) => itemV01(
        decision.decision_id,
        `ReviewDecision: ${decision.decision}`,
        `${status} provenance${errors.length ? ` · ${errors.join("; ")}` : ""}; decision itself applies no state`,
        decision.requested_transition_intent ? "intent_only" : "non_applying",
        decision.decided_at,
        [{ record_kind: "review_decision", record_id: decision.decision_id, record_fingerprint: decision.integrity.fingerprint }],
      )),
      ...gates.map((entry) => {
        const gate = entry.relation.gate_record;
        const applied = appliedGateIds.has(gate.gate_record_id);
        return itemV01(
        gate.gate_record_id,
        "Semantic commit gate",
        `${entry.relation.decision.decision} decision · authorized until ${gate.semantic_commit_gate_evaluation.expires_at} · ${applied ? "applied by exact Transition" : entry.expired ? "expired without application" : "authorized but unapplied"}`,
        applied ? "applied" : entry.expired ? "expired_unapplied" : "authorized_unapplied",
        gate.confirmed_at,
        [recordRefV01(entry.envelope)],
      );}),
    ],
  );
}

function transitionSectionV01(
  input: Parameters<typeof buildSectionsV01>[0],
): SharedProjectInspectorSectionV01 {
  const chains = focusedDurableChainsV01(input);
  const heads = input.target_heads;
  const currentHeads = heads.filter((entry) => entry.current_for_source_transition);
  return sectionV01(
    "transition_current_head",
    "Transition and current head",
    chains.length || heads.length ? "available" : "pending",
    "Only successfully applied StateTransitionReceipts change durable semantic state and the canonical target head. Retraction leaves history and does not reactivate an older revision.",
    [
      factV01("Applied chains", String(chains.length)),
      factV01("Current accepted states", input.continuity ? String(input.continuity.current_accepted_state_count) : "unavailable"),
      factV01("Head presence", currentHeads.map((entry) => entry.head.presence).join(", ") || "not available"),
      factV01("Head revision", currentHeads.map((entry) => String(entry.head.revision)).join(", ") || "not available"),
      factV01("Previously applied effects", String(heads.length - currentHeads.length)),
    ],
    [
      ...chains.map((chain) => itemV01(
        chain.transition.receipt_id,
        "Applied StateTransitionReceipt",
        `${chain.stage_status} · exact receipt-bound decision and gate`,
        "applied",
        chain.transition.applied_at,
        [{ record_kind: "state_transition_receipt", record_id: chain.transition.receipt_id, record_fingerprint: chain.transition.receipt_fingerprint }],
      )),
      ...heads.map((entry) => itemV01(
        `${entry.source_transition_receipt_id}:${entry.head.target_key}`,
        "Canonical semantic target head",
        `${entry.head.presence} at revision ${entry.head.revision} · ${entry.current_for_source_transition ? "current for this exact Transition" : "historical effect; a later Transition owns the current head"}`,
        entry.current_for_source_transition ? "applied_current" : "previously_applied",
        entry.head.updated_at,
        [{
          record_kind: "semantic_target_head",
          record_id: entry.head.target_key,
          record_fingerprint: entry.head.source_transition_receipt_fingerprint,
        }],
      )),
    ],
  );
}

function focusedDurableChainsV01(
  input: Parameters<typeof buildSectionsV01>[0],
): NonNullable<Parameters<typeof buildSectionsV01>[0]["durable_lineage"]>["chains"] {
  return (input.durable_lineage?.chains ?? []).filter(
    (chain) =>
      (!input.focus.transition_receipt_id ||
        chain.transition.receipt_id === input.focus.transition_receipt_id) &&
      (!input.focus.decision_id ||
        chain.transition.decision_id === input.focus.decision_id) &&
      (!input.focus.candidate_id ||
        chain.transition.candidate_id === input.focus.candidate_id) &&
      (!input.focus.gate_id ||
        chain.semantic_gate.gate_id === input.focus.gate_id),
  );
}

function laterContextSectionV01(
  input: Parameters<typeof buildSectionsV01>[0],
): SharedProjectInspectorSectionV01 {
  const packet = input.continuity?.latest_compiled_packet ?? null;
  const feedback = input.continuity?.latest_context_use_review_status ?? null;
  const exactTargetPacket = input.focus.packet;
  return sectionV01(
    "later_context_feedback",
    "Later context and feedback",
    packet ? "available" : input.continuity ? "pending" : exactTargetPacket ? "unavailable" : "missing",
    packet
      ? "The later packet is compiler-produced after an applied Transition. Presentation, actual use, and usefulness remain separate."
      : input.continuity
        ? "No compiler-produced later packet is available; decision-only and gate-only material did not change context."
        : exactTargetPacket
          ? "The exact packet target is available, but operator-pilot continuity is unavailable for this historical chain; no later stage was inferred or repaired."
          : "No exact later-context source is bound to this target.",
    [
      factV01("Packet", packet ? "compiled" : exactTargetPacket ? "exact target only" : "pending"),
      factV01("Packet currentness", input.continuity?.packet_currentness ?? exactTargetPacket?.source_status.currentness.status ?? "unavailable"),
      factV01("Feedback", feedback ? "recorded" : "pending"),
      factV01("Actually used", feedback?.actually_used ?? "unknown"),
      factV01("Usefulness", feedback?.assessment ?? "unknown"),
    ],
    packet
      ? [itemV01(
          packet.packet_id,
          "Compiler-produced TaskContextPacket",
          `${packet.accepted_state_count} accepted state refs · ${input.continuity?.packet_currentness ?? "unavailable"}`,
          feedback ? "feedback_recorded" : "feedback_pending",
          packet.generated_at,
          [{ record_kind: "task_context_packet", record_id: packet.packet_id, record_fingerprint: packet.packet_fingerprint }],
        )]
      : [],
  );
}

function automationSectionV01(
  input: Parameters<typeof buildSectionsV01>[0],
): SharedProjectInspectorSectionV01 {
  const automation = input.automation;
  if (!automation) {
    return sectionV01(
      "automation",
      "Bounded automation",
      "unavailable",
      "Automation lineage is not bound to this exact historical packet focus; no policy, grant, cycle, or run relation was inferred.",
    );
  }
  const binding = input.automation_work?.cycle_binding ?? null;
  return sectionV01(
    "automation",
    "Bounded automation",
    automation.status === "review_needed" ? "pending" : "available",
    "Policy, CapabilityGrant, work, cycle, run, receipt, and review-needed state share Core records without automatic semantic authority.",
    [
      factV01("Status", automation.status),
      factV01("Policy control revision", automation.control_revision === null ? "not configured" : String(automation.control_revision)),
      factV01("Stop reason", automation.stop_reason),
      factV01("Retryable", String(automation.retryable)),
      factV01("Model calls allowed", String(automation.model_calls_allowed)),
      factV01("Maximum work items", String(automation.budget.max_work_items)),
      factV01("Maximum active runs", String(automation.budget.max_active_runs)),
      factV01("Maximum attempts", String(automation.budget.max_attempts)),
      factV01("Network access", automation.budget.network_access),
      factV01("Decision created", String(automation.decision_created)),
      factV01("Transition created", String(automation.transition_created)),
    ],
    [
      ...(automation.work_source ? [itemV01(
        automation.work_source.work_id,
        automation.work_source.label,
        `${automation.work_source.lifecycle_status} · ${automation.work_source.operation_profile}`,
        automation.work_source.lifecycle_status,
        null,
        [{ record_kind: "automation_work_item", record_id: automation.work_source.work_id, record_fingerprint: automation.work_source.work_fingerprint }],
      )] : []),
      ...(automation.grant ? [itemV01(
        automation.grant.grant_id,
        "Bounded CapabilityGrant",
        `${automation.grant.host_execution_profile} · expires ${automation.grant.expires_at}`,
        "no_semantic_authority",
        null,
        [{ record_kind: "capability_grant", record_id: automation.grant.grant_id, record_fingerprint: automation.grant.grant_fingerprint }],
      )] : []),
      ...(binding ? [itemV01(
        binding.cycle_id,
        "Bounded automation cycle",
        `attempt ${binding.attempt} · policy, grant, packet, work, run, and receipt remain exact-bound`,
        automation.status,
        null,
        [
          { record_kind: binding.policy_ref.ref_type, record_id: binding.policy_ref.external_id, record_fingerprint: binding.policy_ref.source_ref ?? null },
          { record_kind: binding.final_grant_ref.ref_type, record_id: binding.final_grant_ref.external_id, record_fingerprint: binding.final_grant_ref.source_ref ?? null },
          { record_kind: binding.packet_ref.ref_type, record_id: binding.packet_ref.external_id, record_fingerprint: binding.packet_ref.source_ref ?? null },
        ],
      )] : []),
      ...(automation.run ? [itemV01(
        automation.run.run_id,
        "Bounded automation run",
        `attempt ${automation.run.attempt} · reconciliation ${String(automation.run.reconciliation_required)}`,
        automation.run.status,
        null,
      )] : []),
      ...(binding?.receipt_ref ? [itemV01(
        binding.receipt_ref.external_id,
        "Bounded RunReceipt",
        "Immutable receipt residue; no automatic decision, gate, Transition, Evidence acceptance, or Perspective promotion.",
        "review_needed",
        binding.receipt_ref.observed_at ?? null,
        [{ record_kind: binding.receipt_ref.ref_type, record_id: binding.receipt_ref.external_id, record_fingerprint: binding.receipt_ref.source_ref ?? null }],
      )] : []),
    ],
  );
}

function strategicPerspectiveSectionV01(
  input: Parameters<typeof buildSectionsV01>[0],
): SharedProjectInspectorSectionV01 {
  const strategic = input.proposal?.strategic_analysis ?? null;
  const profile = input.proposal?.proposal.strategic_advantage_transfer ?? null;
  const selectedPersonal = input.focus.packet?.selected_context.filter(
    isPersonalPerspectiveSelectedEntryV01,
  ) ?? [];
  const frameChallenge = input.proposal?.proposal.proposed_deltas.some(
    (candidate) =>
      candidate.delta_type === "research_delta" ||
      candidate.delta_type === "validation_delta" ||
      candidate.delta_type === "perspective_delta",
  ) ?? false;
  return sectionV01(
    "strategic_perspective",
    "Strategic and Perspective lineage",
    strategic || selectedPersonal.length ? "available" : "missing",
    "Strategic material stays source-bound and candidate-level. A frame challenge is not silently converted into a within-frame patch or Perspective change.",
    [
      factV01("Strategic status", strategic?.status ?? "not available"),
      factV01("Within-frame source-bound transfer", String(Boolean(profile))),
      factV01("Frame challenge material", String(frameChallenge)),
      factV01("Exact source catalog entries", String(profile?.source_catalog.items.length ?? 0)),
      factV01("Model invocation receipt", profile ? "recorded provenance only" : "not available"),
      factV01("Personal Perspective selected entries", String(selectedPersonal.length)),
      factV01("Automatic promotion", "false"),
    ],
    [
      ...(profile ? [itemV01(
        profile.base_strategy.semantic_state_record_id,
        "Exact accepted base strategy and fixed working frame",
        `${profile.base_strategy.bounded_summary} · ${profile.working_frame.task_goal}`,
        "within_frame_source_bound",
        profile.model_invocation.receipt.finished_at,
        [
          { record_kind: "semantic_state", record_id: profile.base_strategy.semantic_state_record_id, record_fingerprint: profile.base_strategy.semantic_state_record_fingerprint },
          { record_kind: profile.model_invocation.receipt_ref.ref_type, record_id: profile.model_invocation.receipt_ref.external_id, record_fingerprint: profile.model_invocation.receipt_ref.source_ref ?? profile.model_invocation.receipt_fingerprint },
        ],
      )] : []),
      ...(profile?.transfer_items.map((item) => itemV01(
        item.transfer_id,
        item.title,
        `${item.applicability_condition} · expected ${item.expected_effect} · cost ${item.transfer_cost} · falsifier ${item.falsifier} · patch ${item.patch_summary}`,
        item.support.status,
        profile.model_invocation.receipt.finished_at,
        item.source_refs.map((ref) => ({
          record_kind: ref.ref_type,
          record_id: ref.external_id,
          record_fingerprint: ref.source_ref ?? null,
        })),
      )) ?? []),
      ...selectedPersonal.map((entry) => itemV01(
        entry.entry_id,
        entry.bounded_summary ?? "Personal Perspective basis",
        `${entry.why_included} · ${entry.currentness.status}`,
        "exact_packet_inclusion",
        entry.currentness.as_of,
      )),
    ],
  );
}

function integrationSectionV01(
  input: Parameters<typeof buildSectionsV01>[0],
): SharedProjectInspectorSectionV01 {
  const result = input.result;
  return sectionV01(
    "integration_capability",
    "Integration health and capability coverage",
    result ? "available" : "unavailable",
    result
      ? "Coverage is exact receipt material. Missing coverage remains unknown and is never inferred from route availability."
      : "No exact RunReceipt source exists for integration or capability coverage.",
    result
      ? [
          factV01("Capabilities", String(result.capability_coverage.length)),
          factV01("Model invocation records", String(result.model_invocations.length)),
          factV01("Egress", result.privacy_egress.egress_status),
          factV01("Egress basis", result.privacy_egress.basis),
          factV01("Data classification", result.privacy_egress.data_classification),
          factV01("Redaction", result.privacy_egress.redaction_status),
          factV01("Raw prompt persisted", "false"),
          factV01("Raw output persisted", "false"),
          factV01("Raw transcript persisted", "false"),
          factV01("Raw diff rendered", "false"),
          factV01("Secret material persisted", "false"),
        ]
      : [],
    result
      ? [
          ...result.capability_coverage.map((coverage) => itemV01(
            coverage.capability,
            humanizeV01(coverage.capability),
            coverage.notes.join("; ") || "No additional coverage note.",
            coverage.coverage_level,
            result.summary.recorded_at,
          )),
          ...result.model_invocations.map((invocation, index) => itemV01(
            `model:${index}`,
            "Model invocation coverage",
            `${invocation.coverage} · ${invocation.egress_status ?? "egress unknown"} · raw provider material excluded`,
            invocation.state,
            result.summary.recorded_at,
          )),
        ]
      : [],
  );
}

function validateAndDescribeCoreRecordV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  record: VNextCoreRecordEnvelopeV01,
  observedAt: string,
): ResolvedInspectorFocusV01 {
  switch (record.record_kind) {
    case "task_context_packet": {
      const packet = assertPacketV01(record, observedAt);
      let proposalId: string | null = null;
      try {
        const packetLineage = inspectVNextOperatorPilotPacketLineageV01(db, {
          config,
          packet_id: packet.packet_id,
          packet_fingerprint: packet.integrity.fingerprint,
        });
        const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
          workspace_id: config.workspace_id,
          project_id: config.project_id,
          transition_receipt_id: packetLineage.source_transition_receipt.transition_receipt_id,
          transition_receipt_fingerprint: packetLineage.source_transition_receipt.transition_receipt_fingerprint,
        });
        proposalId = transition.proposal.proposal_id;
      } catch (error) {
        if (
          !(error instanceof VNextOperatorPilotContinuityErrorV01) ||
          error.code !== "operator_pilot_handoff_packet_not_compiled"
        ) {
          throw error;
        }
        // Source packets truthfully have no applied-Transition lineage. Any
        // malformed or conflicting compiled-packet lineage still fails closed.
      }
      return {
        ...focusV01(
          "TaskContextPacket",
          packet.task.goal,
          "selected working context, not truth",
          packet.source_status.currentness.status,
        ),
        packet,
        proposal_id: proposalId,
      };
    }
    case "run_receipt": {
      assertRunReceiptV01(record);
      const receipt = record.payload as RunReceiptV01;
      const packet = receipt.task_context_packet_ref?.source_ref
        ? assertPacketV01(
            exactRecordV01(
              db,
              { workspace_id: config.workspace_id, project_id: config.project_id },
              "task_context_packet",
              receipt.task_context_packet_ref.external_id,
              receipt.task_context_packet_ref.source_ref,
            ),
            observedAt,
          )
        : null;
      return {
        ...focusV01(
          "RunReceipt",
          "Immutable execution and verification residue; receipt is not accepted Evidence.",
          "source-authenticated receipt material",
          record.created_at,
        ),
        receipt_id: record.record_id,
        packet,
        lineage_lookup: null,
      };
    }
    case "evidence_record": {
      if (validateEvidenceRecordV01(record.payload).status !== "valid" ||
          !readEvidenceRecordV01(db, { workspace_id: config.workspace_id, project_id: config.project_id, evidence_id: record.record_id })) {
        refuseV01("shared_inspector_evidence_source_conflict");
      }
      return {
        ...focusV01("EvidenceRecord", "Support material with bounded trust and limitations; existence does not establish truth.", "support not truth", record.created_at),
        lineage_lookup: { lookup_kind: "evidence", evidence_id: record.record_id, expected_fingerprint: record.fingerprint },
      };
    }
    case "claim_record": {
      if (validateClaimRecordV01(record.payload).status !== "valid" ||
          !readClaimRecordV01(db, { workspace_id: config.workspace_id, project_id: config.project_id, claim_id: record.record_id })) {
        refuseV01("shared_inspector_claim_source_conflict");
      }
      return {
        ...focusV01("Claim revision", "Revisable proposition; latest recorded remains separate from applied current and truth remains not established.", "claim truth not established", record.created_at),
        lineage_lookup: { lookup_kind: "claim", claim_id: record.record_id, expected_fingerprint: record.fingerprint },
      };
    }
    case "claim_evidence_relation": {
      if (validateClaimEvidenceRelationV01(record.payload).status !== "valid" ||
          !readClaimEvidenceRelationV01(db, { workspace_id: config.workspace_id, project_id: config.project_id, relation_id: record.record_id })) {
        refuseV01("shared_inspector_relation_source_conflict");
      }
      return {
        ...focusV01("Claim–Evidence relation revision", "Exact relation material; relation existence remains non-proof.", "relation is not proof", record.created_at),
        lineage_lookup: { lookup_kind: "claim_evidence_relation", relation_id: record.record_id, expected_fingerprint: record.fingerprint },
      };
    }
    case "episode_delta_proposal": {
      assertProposalV01(record);
      const proposal = record.payload as EpisodeDeltaProposalV01;
      return {
        ...focusV01("EpisodeDeltaProposal", proposal.bounded_summary, "candidate not command or current state", record.created_at),
        proposal_id: record.record_id,
        receipt_id: proposal.run_receipt_refs[0]?.external_id ?? null,
        packet: packetFromProposalV01(
          db,
          { workspace_id: config.workspace_id, project_id: config.project_id },
          proposal,
          observedAt,
        ),
        lineage_lookup: { lookup_kind: "proposal", proposal_id: record.record_id, expected_fingerprint: record.fingerprint },
      };
    }
    case "review_decision": {
      if (validateReviewDecisionV01(record.payload).status !== "valid") refuseV01("shared_inspector_decision_source_conflict");
      const decision = record.payload as ReviewDecisionV01;
      return {
        ...focusV01("ReviewDecision", `${decision.decision}: ${decision.rationale_summary}`, "decision not Transition", decision.decided_at),
        proposal_id: decision.source_proposal.proposal_id,
        candidate_id: decision.candidate.candidate_id,
        decision_id: decision.decision_id,
        lineage_lookup: { lookup_kind: "proposal", proposal_id: decision.source_proposal.proposal_id, expected_fingerprint: decision.source_proposal.proposal_fingerprint },
      };
    }
    case "semantic_commit_gate": {
      const relation = loadValidatedVNextSemanticCommitGateRelationV01(db, {
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        gate_record_id: record.record_id,
        gate_record_fingerprint: record.fingerprint,
      });
      return {
        ...focusV01("Semantic commit gate", "Exact historical authorization; gate authorization is not application.", "authorized not applied", relation.gate_record.confirmed_at),
        proposal_id: relation.proposal.proposal_id,
        candidate_id: relation.gate_record.candidate_id,
        decision_id: relation.decision.decision_id,
        gate_id: relation.gate_record.gate_record_id,
        lineage_lookup: { lookup_kind: "proposal", proposal_id: relation.proposal.proposal_id, expected_fingerprint: relation.proposal.integrity.fingerprint },
      };
    }
    case "state_transition_receipt": {
      if (validateStateTransitionReceiptV01(record.payload).status !== "valid") refuseV01("shared_inspector_transition_source_conflict");
      const relation = loadValidatedVNextSemanticTransitionRelationV01(db, {
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        transition_receipt_id: record.record_id,
        transition_receipt_fingerprint: record.fingerprint,
      });
      return {
        ...focusV01("Applied StateTransitionReceipt", "Immutable applied semantic effect with exact decision and gate lineage.", "applied authorized Transition", relation.receipt.applied_at),
        proposal_id: relation.proposal.proposal_id,
        candidate_id: relation.gate_record.candidate_id,
        decision_id: relation.decision.decision_id,
        gate_id: relation.gate_record.gate_record_id,
        transition_receipt_id: relation.receipt.transition_receipt_id,
        lineage_lookup: { lookup_kind: "transition_receipt", transition_receipt_id: record.record_id, expected_fingerprint: record.fingerprint },
      };
    }
    case "semantic_state": {
      const validation = validateVNextPersistedSemanticStateV01(record.payload);
      if (validation.status !== "valid" || !validation.normalized_state) refuseV01("shared_inspector_semantic_state_conflict");
      return {
        ...focusV01("Durable semantic state version", validation.normalized_state.bounded_state_summary, "applied state version, not Claim truth", validation.normalized_state.created_at),
        proposal_id: validation.normalized_state.source_proposal_id,
        candidate_id: validation.normalized_state.source_candidate_id,
        decision_id: validation.normalized_state.source_decision_id,
      };
    }
    case "context_use_review": {
      if (validateContextUseReviewV01(record.payload).status !== "valid") refuseV01("shared_inspector_context_use_review_conflict");
      const review = record.payload as ContextUseReviewV01;
      const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        transition_receipt_id: review.source_transition_receipt.transition_receipt_id,
        transition_receipt_fingerprint: review.source_transition_receipt.transition_receipt_fingerprint,
      });
      return {
        ...focusV01("ContextUseReview", `${review.assessment}; actual use ${review.usage.actually_used}`, "feedback not truth", review.reviewed_at),
        proposal_id: transition.proposal.proposal_id,
        receipt_id: review.later_task_run_receipt.receipt_id,
        candidate_id: transition.gate_record.candidate_id,
        decision_id: transition.decision.decision_id,
        gate_id: transition.gate_record.gate_record_id,
        transition_receipt_id: transition.receipt.transition_receipt_id,
        lineage_lookup: { lookup_kind: "transition_receipt", transition_receipt_id: review.source_transition_receipt.transition_receipt_id, expected_fingerprint: review.source_transition_receipt.transition_receipt_fingerprint },
      };
    }
    case "automation_work_item": {
      if (!validateVNextAutomationWorkSnapshotV01(record.payload)) refuseV01("shared_inspector_automation_work_conflict");
      return focusV01("Automation work item", "Project-scoped bounded work lineage; no semantic authority is granted.", "bounded automation source", record.created_at);
    }
    case "capability_grant": {
      const grant = readBoundedAutomationCapabilityGrantV01(db, {
        ...config,
        grant_id: record.record_id,
        grant_fingerprint: record.fingerprint,
      });
      if (!validateBoundedAutomationCapabilityGrantV01(grant)) refuseV01("shared_inspector_capability_grant_conflict");
      return focusV01("CapabilityGrant", "Bounded operation authority only; no semantic or external-action authority.", "exact bounded grant", grant.issued_at);
    }
  }
}

function exactRecordV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  recordKind: VNextCoreRecordKindV01,
  recordId: string,
  expectedFingerprint: string,
): VNextCoreRecordEnvelopeV01 {
  const record = readVNextCoreRecordV01(db, {
    ...scope,
    record_kind: recordKind,
    record_id: recordId,
  });
  if (!record) refuseV01("shared_inspector_target_missing", 404);
  if (record.fingerprint !== expectedFingerprint) {
    refuseV01("shared_inspector_target_fingerprint_conflict", 409);
  }
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    ...scope,
    fingerprint: expectedFingerprint,
  });
  return record;
}

function packetFromProposalV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  proposal: EpisodeDeltaProposalV01,
  observedAt: string,
): TaskContextPacketV01 | null {
  const ref = proposal.task_context_packet_ref;
  if (!ref?.source_ref) return null;
  return assertPacketV01(
    exactRecordV01(
      db,
      scope,
      "task_context_packet",
      ref.external_id,
      ref.source_ref,
    ),
    observedAt,
  );
}

function coreRecordKindV01(
  targetKind: SharedProjectInspectorTargetV01["target_kind"],
): VNextCoreRecordKindV01 {
  if (targetKind === "later_task_context_packet") return "task_context_packet";
  const allowed: readonly VNextCoreRecordKindV01[] = [
    "task_context_packet",
    "run_receipt",
    "evidence_record",
    "claim_record",
    "claim_evidence_relation",
    "episode_delta_proposal",
    "review_decision",
    "semantic_commit_gate",
    "state_transition_receipt",
    "semantic_state",
    "context_use_review",
    "capability_grant",
  ];
  if (allowed.includes(targetKind as VNextCoreRecordKindV01)) {
    return targetKind as VNextCoreRecordKindV01;
  }
  refuseV01("shared_inspector_target_record_kind_invalid");
}

function assertPacketV01(
  record: VNextCoreRecordEnvelopeV01,
  _observedAt: string,
): TaskContextPacketV01 {
  const evaluatedAt =
    record.payload &&
    typeof record.payload === "object" &&
    "generated_at" in record.payload &&
    typeof record.payload.generated_at === "string"
      ? record.payload.generated_at
      : "";
  if (validateTaskContextPacketV01(record.payload, { evaluated_at: evaluatedAt }).status !== "valid") {
    refuseV01("shared_inspector_packet_source_conflict");
  }
  const packet = record.payload as TaskContextPacketV01;
  if (packet.packet_id !== record.record_id || packet.integrity.fingerprint !== record.fingerprint) {
    refuseV01("shared_inspector_packet_source_conflict");
  }
  return packet;
}

function assertRunReceiptV01(record: VNextCoreRecordEnvelopeV01): void {
  if (validateRunReceiptV01(record.payload).status !== "valid") {
    refuseV01("shared_inspector_receipt_source_conflict");
  }
}

function assertProposalV01(record: VNextCoreRecordEnvelopeV01): void {
  if (validateEpisodeDeltaProposalV01(record.payload).status !== "valid") {
    refuseV01("shared_inspector_proposal_source_conflict");
  }
}

function focusV01(
  title: string,
  summary: string,
  trust: string,
  currentness: string,
): ResolvedInspectorFocusV01 {
  return {
    exact_record: null,
    proposal_id: null,
    receipt_id: null,
    candidate_id: null,
    decision_id: null,
    gate_id: null,
    transition_receipt_id: null,
    target_head: null,
    packet: null,
    lineage_lookup: null,
    title,
    summary,
    trust,
    currentness,
  };
}

function exactRefMatchesV01(
  ref: ProjectVerifyExactProtocolRefV01,
  id: string,
  fingerprint: string,
): boolean {
  return ref.record_id === id && ref.record_fingerprint === fingerprint;
}

function sectionV01(
  sectionKind: SharedProjectInspectorSectionKindV01,
  title: string,
  status: SharedProjectInspectorSectionV01["status"],
  summary: string,
  facts: SharedProjectInspectorFactV01[] = [],
  items: SharedProjectInspectorItemV01[] = [],
  exactRefs: SharedProjectInspectorExactRefV01[] = [],
): SharedProjectInspectorSectionV01 {
  return {
    section_kind: sectionKind,
    title,
    status,
    summary,
    facts: facts.slice(0, MAX_SECTION_ITEMS_V01),
    items: items.slice(0, MAX_SECTION_ITEMS_V01),
    exact_refs: exactRefs.slice(0, MAX_SECTION_ITEMS_V01),
  };
}

function factV01(
  label: string,
  value: string,
  tone: SharedProjectInspectorFactV01["tone"] = "neutral",
): SharedProjectInspectorFactV01 {
  return { label, value, tone };
}

function itemV01(
  itemId: string,
  title: string,
  summary: string,
  status: string,
  recordedAt: string | null,
  exactRefs: SharedProjectInspectorExactRefV01[] = [],
): SharedProjectInspectorItemV01 {
  return {
    item_id: itemId,
    title,
    summary,
    status,
    recorded_at: recordedAt,
    exact_refs: exactRefs,
  };
}

function recordItemV01(
  record: VNextCoreRecordEnvelopeV01,
): SharedProjectInspectorItemV01 {
  return itemV01(
    `${record.record_kind}:${record.record_id}`,
    humanizeV01(record.record_kind),
    "Exact immutable record",
    "present",
    record.created_at,
    [recordRefV01(record)],
  );
}

function recordRefV01(
  record: VNextCoreRecordEnvelopeV01,
): SharedProjectInspectorExactRefV01 {
  return {
    record_kind: record.record_kind,
    record_id: record.record_id,
    record_fingerprint: record.fingerprint,
  };
}

function protocolRefV01(
  ref: ProjectVerifyExactProtocolRefV01,
): SharedProjectInspectorExactRefV01 {
  return {
    record_kind: ref.record_kind,
    record_id: ref.record_id,
    record_fingerprint: ref.record_fingerprint,
  };
}

function safeExternalRefV01(
  ref: {
    ref_type: string;
    external_id: string;
    source_ref?: string | null;
  },
): SharedProjectInspectorExactRefV01[] {
  if (
    ref.external_id.startsWith("/") ||
    ref.external_id.startsWith("~") ||
    /^[A-Za-z]:[\\/]/u.test(ref.external_id)
  ) {
    return [];
  }
  return [{
    record_kind: ref.ref_type,
    record_id: ref.external_id,
    record_fingerprint:
      typeof ref.source_ref === "string" && /^sha256:[a-f0-9]{64}$/u.test(ref.source_ref)
        ? ref.source_ref
        : null,
  }];
}

function humanizeV01(value: string): string {
  return value.replaceAll("_", " ");
}

function inspectorAuthorityV01(): SharedProjectInspectorProjectionV01["authority"] {
  return {
    read_only: true,
    projection_is_rebuildable: true,
    writes_database: false,
    creates_evidence: false,
    accepts_evidence: false,
    creates_claim_or_relation: false,
    creates_proposal_or_revision: false,
    creates_review_decision: false,
    authorizes_semantic_commit_gate: false,
    applies_transition: false,
    compiles_later_packet: false,
    records_context_use_review: false,
    creates_automation_cycle_or_grant: false,
    selects_current_head: false,
    establishes_claim_truth: false,
    promotes_perspective_or_memory: false,
    calls_model_or_provider: false,
    performs_network_or_external_action: false,
    mutates_filesystem: false,
  };
}

function refuseV01(code: string, status = 422): never {
  throw new SharedProjectInspectorReadErrorV01(code, status);
}
