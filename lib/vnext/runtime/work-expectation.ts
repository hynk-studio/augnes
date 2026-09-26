import type Database from "better-sqlite3";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import { expectationSnapshotRefs, insertWorkExpectationRecord, readWorkExpectationComparison, readWorkExpectationRecords } from "@/lib/vnext/persistence/work-expectation-store";
import { buildWorkExpectationRecord, expectationCheck, expectationHash, expectationKeys, expectationRef, expectationSourceRef, expectationText } from "@/lib/vnext/work-expectation";
import { deriveCriterionIdentityV01 } from "@/lib/vnext/criterion-identity";
import { WORK_EXPECTATION_LIMIT, WORK_EXPECTATION_RULE, WORK_EXPECTATION_VERSION, type WorkExpectation, type WorkOutcomeReport } from "@/types/vnext/work-expectation";
import { inspectRevisableProjectWorkChainV01, readProjectWorkRevisionEligibilityStrictV01 } from "./project-work-revision";
import { readProjectRunResultSourceBindingV01 } from "./project-run-result-read-model";
import { admitVNextLocalOperatorMutationInsideTransactionV01, type VNextLocalOperatorPilotConfigV01, type VNextLocalOperatorSessionCredentialV01, type VNextLocalOperatorSecretSourceV01 } from "./local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "./local-runtime-clock";

function expectationAuthoringAvailable(eligibility: ReturnType<typeof readProjectWorkRevisionEligibilityStrictV01>): boolean {
  // A valid final ordinary revision may still receive a forecast. The packet
  // revision budget does not authorize another packet or consume forecast capacity.
  return eligibility.eligible || (eligibility.current_lineage_kind === "authored_successor_task" &&
    eligibility.status === "revision_limit_reached");
}

export function readWorkExpectationPreparation(db: Database.Database, config: { workspace_id: string; project_id: string }) {
  const eligibility = readProjectWorkRevisionEligibilityStrictV01(db, config);
  const records = readWorkExpectationRecords(db, config);
  const history = records.filter((r): r is WorkExpectation => r.kind === "expectation" &&
    r.packet_ref.external_id === eligibility.current_packet_id && r.packet_ref.source_ref === eligibility.current_packet_fingerprint);
  const criteria = eligibility.current_packet_id ? inspectRevisableProjectWorkChainV01(db, config).tip_packet.task.success_criteria.map(criterion => ({ criterion, criterion_id: deriveCriterionIdentityV01(criterion) })) : [];
  return { eligibility, history, criteria, authoring_available: expectationAuthoringAvailable(eligibility),
    capacity_available: records.length < 255 && history.length < WORK_EXPECTATION_LIMIT,
    outcome_rule: WORK_EXPECTATION_RULE };
}

export function recordWorkExpectationMaterial(db: Database.Database, input: {
  config: VNextLocalOperatorPilotConfigV01; credential: VNextLocalOperatorSessionCredentialV01; request: unknown;
  clock?: VNextLocalRuntimeClockV01; secret_source?: VNextLocalOperatorSecretSourceV01;
}) {
  const request = input.request as Record<string, unknown>;
  const common = ["action", "expected_active_project_id", "expected_active_selection_revision", "expected_previous_id"];
  const forecast = request?.action === "record_work_expectation";
  expectationCheck(forecast || request?.action === "report_work_expectation_outcome", "expectation_action_invalid");
  expectationKeys(request, [...common, ...(forecast ? ["expected_packet_id", "expected_packet_fingerprint", "criterion_id", "predicted_outcome", "reason", "conditions"]
    : ["expectation_id", "receipt_id", "receipt_fingerprint", "outcome", "observation", "applicability"])]);
  expectationCheck(request.expected_previous_id === null || typeof request.expected_previous_id === "string");
  expectationCheck(!db.inTransaction, "expectation_transaction_conflict");
  db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, input);
    const selection = readActiveProjectSelectionV01(db, input.config.workspace_id);
    expectationCheck(selection && selection.project_id === input.config.project_id && selection.project_id === request.expected_active_project_id &&
      selection.selection_revision === request.expected_active_selection_revision, "expectation_selection_changed");
    const records = readWorkExpectationRecords(db, input.config);
    // Prospective authoring reserves one slot for Start's immutable binding.
    expectationCheck(records.length < (forecast ? 255 : 256), "expectation_history_bound_exceeded");
    const at = admission.action_observed_at;
    let saved: WorkExpectation | WorkOutcomeReport;
    if (forecast) {
      const eligibility = readProjectWorkRevisionEligibilityStrictV01(db, input.config, { evaluated_at: at });
      expectationCheck(expectationAuthoringAvailable(eligibility), "expectation_pre_start_only");
      expectationCheck(eligibility.current_packet_id === request.expected_packet_id && eligibility.current_packet_fingerprint === request.expected_packet_fingerprint,
        "expectation_packet_changed");
      const packet = inspectRevisableProjectWorkChainV01(db, input.config).tip_packet;
      const criterion = packet.task.success_criteria.find(c => deriveCriterionIdentityV01(c) === request.criterion_id);
      expectationCheck(criterion, "expectation_criterion_changed");
      const history = records.filter((r): r is WorkExpectation => r.kind === "expectation" && r.packet_ref.external_id === packet.packet_id);
      const previous = history.at(-1);
      expectationCheck((previous?.record_id ?? null) === request.expected_previous_id, "expectation_revision_changed");
      expectationCheck(history.length < WORK_EXPECTATION_LIMIT && Date.parse(at) > Date.parse(previous?.recorded_at ?? packet.generated_at), "expectation_chronology_invalid");
      expectationCheck(request.predicted_outcome === "satisfied" || request.predicted_outcome === "unsatisfied");
      saved = buildWorkExpectationRecord<WorkExpectation>({ version: WORK_EXPECTATION_VERSION, kind: "expectation",
        workspace_id: input.config.workspace_id, project_id: input.config.project_id, recorded_at: at,
        packet_ref: expectationSourceRef(packet.packet_id, packet.integrity.fingerprint, packet.generated_at, "task_context_packet"),
        previous_ref: previous ? expectationRef(previous) : null, revision: history.length + 1,
        criterion_id: deriveCriterionIdentityV01(criterion), criterion, predicted_outcome: request.predicted_outcome,
        reason: expectationText(request.reason), conditions: expectationText(request.conditions),
        observation_window: "first_upcoming_interactive_attempt_of_exact_packet", outcome_rule: WORK_EXPECTATION_RULE,
        author: { operator_id: input.config.operator_id, session_id: admission.session.session_id, provenance: "operator_authored" },
        information_cutoff: at, source_refs: expectationSnapshotRefs(packet),
        source_currentness: "recorded_packet_snapshot_only_external_currentness_unknown",
        exposure: "operator_ui_only_no_automatic_worker_delivery_attention_and_copying_unknown",
      });
    } else {
      expectationCheck(typeof request.receipt_id === "string");
      const source = readProjectRunResultSourceBindingV01(db, { ...input.config, receipt_id: request.receipt_id });
      expectationCheck(source.packet && source.receipt.integrity.fingerprint === request.receipt_fingerprint, "expectation_result_changed");
      const comparison = readWorkExpectationComparison(db, { ...input.config, packet: source.packet, receipt: source.receipt, assessment: source.criterion_assessment });
      expectationCheck(comparison?.report_allowed && comparison.attempt && comparison.expectation.record_id === request.expectation_id, "expectation_report_unavailable");
      if (comparison.outcome_source === "criterion_assessment") expectationCheck(request.outcome === comparison.actual_outcome, "expectation_assessment_not_rewritable");
      const previous = comparison.reports.at(-1);
      expectationCheck((previous?.record_id ?? null) === request.expected_previous_id, "expectation_report_revision_changed");
      expectationCheck(comparison.reports.length < WORK_EXPECTATION_LIMIT && Date.parse(at) > Date.parse(previous?.recorded_at ?? source.receipt.recorded_at), "expectation_chronology_invalid");
      expectationCheck(["satisfied", "unsatisfied", "unknown", "not_applicable"].includes(String(request.outcome)) &&
        ["applied", "not_established"].includes(String(request.applicability)));
      saved = buildWorkExpectationRecord<WorkOutcomeReport>({ version: WORK_EXPECTATION_VERSION, kind: "outcome_report",
        workspace_id: input.config.workspace_id, project_id: input.config.project_id, recorded_at: at,
        packet_ref: comparison.expectation.packet_ref, expectation_ref: expectationRef(comparison.expectation), attempt_ref: expectationRef(comparison.attempt),
        receipt_ref: expectationSourceRef(source.receipt.receipt_id, source.receipt.integrity.fingerprint, source.receipt.recorded_at, "run_receipt"),
        previous_ref: previous ? expectationRef(previous) : null, revision: comparison.reports.length + 1,
        outcome: request.outcome as WorkOutcomeReport["outcome"], observation: expectationText(request.observation),
        applicability: request.applicability as WorkOutcomeReport["applicability"],
        author: { operator_id: input.config.operator_id, session_id: admission.session.session_id, provenance: "operator_attested" },
      });
    }
    insertWorkExpectationRecord(db, saved);
    // Re-read using the same normal immutable reader before the transaction commits.
    expectationCheck(readWorkExpectationRecords(db, input.config).some(r => expectationHash(r) === expectationHash(saved)));
    db.exec("COMMIT");
    return { record: saved, session_admission: admission, semantic_state_changed: false, execution_started: false };
  } catch (error) { if (db.inTransaction) db.exec("ROLLBACK"); throw error; }
}
