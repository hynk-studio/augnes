import type Database from "better-sqlite3";
import { readAutonomyRunLedgerRecord } from "@/lib/autonomy/runner-ledger";
import { deriveCriterionIdentityV01 } from "@/lib/vnext/criterion-identity";
import { createSharedInspectorHrefV01 } from "@/lib/vnext/shared-project-inspector-href";
import { createRunResultReviewHrefV01 } from "@/lib/vnext/ai-workplane-review-href";
import { readVNextLocalOperatorSessionHistoryV01 } from "@/lib/vnext/runtime/local-operator-session";
import { inspectProjectManagedRunHistoryV01 } from "@/lib/vnext/runtime/project-managed-run-history";
import { inspectCurrentOrdinarySuccessorRevisionChainV01, assertOrdinarySuccessorRevisionRootV01, ordinarySuccessorRevisionExecutionBlockedV01 } from "@/lib/vnext/runtime/authored-successor-revision";
import { inspectAuthoredSuccessorPacketV01 } from "@/lib/vnext/runtime/authored-successor-task";
import { AUTHORED_SUCCESSOR_CONTEXT_V01 } from "@/types/vnext/project-work-initialization";
import { readActiveProjectSelectionV01 } from "./project-lifecycle-registry";
import { assertWorkExpectationRecord, buildWorkExpectationRecord, expectationCheck, expectationHash, expectationRef, expectationSourceRef } from "@/lib/vnext/work-expectation";
import { ORDINARY_SUCCESSOR_EXPECTATION_CHRONOLOGY, WORK_EXPECTATION_VERSION, type WorkExpectation, type WorkExpectationAttempt, type WorkExpectationComparison, type WorkExpectationRecord, type WorkOutcomeReport } from "@/types/vnext/work-expectation";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import type { CriterionAssessmentReadbackV01 } from "@/types/vnext/criterion-assessment";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import { insertVNextCoreRecordV01, readVNextCoreRecordV01 } from "./durable-semantic-store";

type Scope = { workspace_id: string; project_id: string };
export function expectationSnapshotRefs(packet: TaskContextPacketV01) {
  return [...packet.source_status.source_refs, ...packet.compatibility.source_refs,
    ...packet.selected_context.flatMap(e => [e.external_ref, e.compatibility_source_ref])];
}
export function insertWorkExpectationRecord(db: Database.Database, record: WorkExpectationRecord): void {
  expectationCheck(db.inTransaction, "expectation_transaction_required");
  assertWorkExpectationRecord(record);
  insertVNextCoreRecordV01(db, { record_kind: "work_expectation_record", record_id: record.record_id,
    workspace_id: record.workspace_id, project_id: record.project_id, fingerprint: record.integrity.fingerprint,
    idempotency_key: null, payload: record, created_at: record.recorded_at });
}
export function readWorkExpectationRecords(db: Database.Database, scope: Scope): WorkExpectationRecord[] {
  const rows = db.prepare(`SELECT record_id FROM vnext_core_records
    WHERE workspace_id = ? AND project_id = ? AND record_kind = 'work_expectation_record'
    ORDER BY created_at, record_id LIMIT 257`).all(scope.workspace_id, scope.project_id) as { record_id: string }[];
  expectationCheck(rows.length <= 256, "expectation_history_bound_exceeded");
  const records = rows.map(row => {
    const envelope = readVNextCoreRecordV01(db, { ...scope, record_kind: "work_expectation_record", record_id: row.record_id })!;
    assertWorkExpectationRecord(envelope.payload);
    const r = envelope.payload;
    expectationCheck(r.record_id === envelope.record_id && r.workspace_id === scope.workspace_id && r.project_id === scope.project_id &&
      r.recorded_at === envelope.created_at && r.integrity.fingerprint === envelope.fingerprint && envelope.idempotency_key === null);
    return r;
  });
  const exact = (id: string, fingerprint: string | null | undefined) => {
    const r = records.find(item => item.record_id === id);
    expectationCheck(r && r.integrity.fingerprint === fingerprint, "expectation_relation_invalid");
    return r;
  };
  for (const r of records) {
    const p = readVNextCoreRecordV01(db, { ...scope, record_kind: "task_context_packet", record_id: r.packet_ref.external_id });
    expectationCheck(p && p.fingerprint === r.packet_ref.source_ref && p.fingerprint === (p.payload as TaskContextPacketV01).integrity.fingerprint,
      "expectation_packet_invalid");
    const packet = p.payload as TaskContextPacketV01;
    expectationCheck(expectationHash(r.packet_ref) === expectationHash(expectationSourceRef(packet.packet_id, packet.integrity.fingerprint, packet.generated_at, "task_context_packet")));
    if (r.kind === "expectation") {
      expectationCheck(packet.task.success_criteria.some(c => deriveCriterionIdentityV01(c) === r.criterion_id && c === r.criterion) &&
        expectationHash(r.source_refs) === expectationHash(expectationSnapshotRefs(packet)) && Date.parse(r.recorded_at) > Date.parse(packet.generated_at));
    } else {
      const forecast = exact(r.expectation_ref.external_id, r.expectation_ref.source_ref);
      expectationCheck(forecast.kind === "expectation" && expectationHash(forecast.packet_ref) === expectationHash(r.packet_ref) &&
        expectationHash(expectationRef(forecast)) === expectationHash(r.expectation_ref) && Date.parse(r.recorded_at) > Date.parse(forecast.recorded_at));
      if (r.kind === "attempt_binding") {
        if (r.chronology === ORDINARY_SUCCESSOR_EXPECTATION_CHRONOLOGY) {
          expectationCheck(packet.compatibility.source_contracts.includes(AUTHORED_SUCCESSOR_CONTEXT_V01), "expectation_chronology_profile_invalid");
          // Validate the immutable family and genuine result anchor, without
          // requiring the historical packet to remain current or a local run
          // to be invented after import. Local chronology is checked separately.
          inspectAuthoredSuccessorPacketV01(db, { config: { ...scope, enabled: true, database_path: db.name, operator_id: "expectation-reader" }, packet });
        } else expectationCheck(!packet.compatibility.source_contracts.includes(AUTHORED_SUCCESSOR_CONTEXT_V01), "expectation_chronology_profile_invalid");
        expectationCheck(records.filter(item => item.kind === "attempt_binding" && item.packet_ref.external_id === r.packet_ref.external_id).length === 1);
        const preceding = records.filter((item): item is WorkExpectation => item.kind === "expectation" && item.packet_ref.external_id === r.packet_ref.external_id);
        expectationCheck(preceding.at(-1)?.record_id === forecast.record_id && preceding.every(item => Date.parse(item.recorded_at) < Date.parse(r.recorded_at)));
      } else {
        const attempt = exact(r.attempt_ref.external_id, r.attempt_ref.source_ref);
        expectationCheck(attempt.kind === "attempt_binding" && attempt.expectation_ref.external_id === forecast.record_id &&
          expectationHash(expectationRef(attempt)) === expectationHash(r.attempt_ref) && Date.parse(r.recorded_at) > Date.parse(attempt.recorded_at));
        const receipt = readVNextCoreRecordV01(db, { ...scope, record_kind: "run_receipt", record_id: r.receipt_ref.external_id });
        expectationCheck(receipt && receipt.fingerprint === r.receipt_ref.source_ref &&
          (receipt.payload as RunReceiptV01).run_id === attempt.run_id && Date.parse(r.recorded_at) > Date.parse(receipt.created_at));
        const outcome = receipt.payload as RunReceiptV01;
        expectationCheck(outcome.task_context_packet_ref?.external_id === r.packet_ref.external_id &&
          outcome.task_context_packet_ref.source_ref === r.packet_ref.source_ref &&
          expectationHash(r.receipt_ref) === expectationHash(expectationSourceRef(outcome.receipt_id, outcome.integrity.fingerprint, outcome.recorded_at, "run_receipt")));
      }
    }
    if (r.kind !== "attempt_binding") {
      const session = readVNextLocalOperatorSessionHistoryV01(db, { session_id: r.author.session_id });
      expectationCheck(session && session.workspace_id === scope.workspace_id && session.project_id === scope.project_id &&
        session.operator_id === r.author.operator_id && session.bootstrap_consumed_at &&
        Date.parse(r.recorded_at) >= Date.parse(session.bootstrap_consumed_at) && Date.parse(r.recorded_at) < Date.parse(session.expires_at));
      const history = records.filter(item => item.kind === r.kind && item.packet_ref.external_id === r.packet_ref.external_id);
      const index = history.findIndex(item => item.record_id === r.record_id);
      expectationCheck(index + 1 === r.revision);
      const prior = history[index - 1];
      expectationCheck(prior ? r.previous_ref && expectationHash(expectationRef(prior)) === expectationHash(r.previous_ref) &&
        Date.parse(prior.recorded_at) < Date.parse(r.recorded_at) : r.previous_ref === null);
    }
  }
  return records;
}

/** Called only in the existing Start transaction, before its ledger insert.
 * Invalid/unavailable optional material never grants or blocks Start. */
export function bindWorkExpectationToAttempt(db: Database.Database, input: Scope & {
  packet: TaskContextPacketV01; run_id: string; started_at: string; mode: string;
}): WorkExpectationAttempt | null {
  expectationCheck(db.inTransaction, "expectation_transaction_required");
  if (input.mode !== "interactive") return null;
  let forecast: WorkExpectation | undefined;
  let chronology: WorkExpectationAttempt["chronology"] = "same_transaction_as_first_local_interactive_run";
  try {
    const records = readWorkExpectationRecords(db, input);
    if (records.length >= 256) return null;
    if (input.packet.compatibility.source_contracts.includes(AUTHORED_SUCCESSOR_CONTEXT_V01)) {
      const chain = inspectCurrentOrdinarySuccessorRevisionChainV01(db, input, input.started_at);
      if (!chain?.projection_current || chain.tip_packet.packet_id !== input.packet.packet_id ||
        chain.tip_packet.integrity.fingerprint !== input.packet.integrity.fingerprint ||
        readActiveProjectSelectionV01(db, input.workspace_id)?.project_id !== input.project_id ||
        ordinarySuccessorRevisionExecutionBlockedV01(db, input, chain) ||
        records.some(r => r.kind === "attempt_binding" && chain.packet_ids.includes(r.packet_ref.external_id))) return null;
      assertOrdinarySuccessorRevisionRootV01(db, input, chain);
      chronology = ORDINARY_SUCCESSOR_EXPECTATION_CHRONOLOGY;
    } else if (inspectProjectManagedRunHistoryV01(db, input).status !== "none" ||
      records.some(r => r.kind === "attempt_binding")) return null;
    forecast = records.filter((r): r is WorkExpectation => r.kind === "expectation" &&
      r.packet_ref.external_id === input.packet.packet_id && r.packet_ref.source_ref === input.packet.integrity.fingerprint).at(-1);
    if (!forecast || Date.parse(forecast.recorded_at) >= Date.parse(input.started_at)) return null;
    // Portable sessions are imported revoked. A revoked author session cannot
    // create a new local chronology claim; the operator may explicitly re-record.
    const author = readVNextLocalOperatorSessionHistoryV01(db, { session_id: forecast.author.session_id });
    if (!author || author.revoked_at !== null) return null;
  } catch { return null; }
  const binding = buildWorkExpectationRecord<WorkExpectationAttempt>({
    version: WORK_EXPECTATION_VERSION, kind: "attempt_binding", workspace_id: input.workspace_id, project_id: input.project_id,
    recorded_at: input.started_at, packet_ref: forecast.packet_ref, expectation_ref: expectationRef(forecast),
    run_id: input.run_id, run_created_at: input.started_at, chronology,
  });
  insertWorkExpectationRecord(db, binding);
  return binding;
}

export function readWorkExpectationComparison(db: Database.Database, input: Scope & {
  packet: TaskContextPacketV01; receipt: RunReceiptV01; assessment: CriterionAssessmentReadbackV01;
}): WorkExpectationComparison | null {
  const { packet, receipt } = input;
  const records = readWorkExpectationRecords(db, input);
  const history = records.filter((r): r is WorkExpectation => r.kind === "expectation" &&
    r.packet_ref.external_id === packet.packet_id && r.packet_ref.source_ref === packet.integrity.fingerprint);
  if (!history.length) return null;
  const attempt = records.find((r): r is WorkExpectationAttempt => r.kind === "attempt_binding" && r.packet_ref.external_id === packet.packet_id) ?? null;
  const expectation = history.find(r => r.record_id === attempt?.expectation_ref.external_id) ?? history[0]!;
  const reports = records.filter((r): r is WorkOutcomeReport => r.kind === "outcome_report" &&
    r.expectation_ref.external_id === expectation.record_id && r.receipt_ref.external_id === receipt.receipt_id && r.receipt_ref.source_ref === receipt.integrity.fingerprint);
  const run = readAutonomyRunLedgerRecord(receipt.run_id, { db });
  const exact = Boolean(attempt && run && attempt.run_id === receipt.run_id && run.created_at === attempt.run_created_at &&
    run.scope === input.project_id && run.metadata.workspace_id === input.workspace_id && run.metadata.project_id === input.project_id &&
    run.metadata.work_expectation_binding_id === attempt.record_id && run.metadata.work_expectation_binding_fingerprint === attempt.integrity.fingerprint &&
    run.metadata.invocation_origin === "interactive" && run.metadata.packet_id === packet.packet_id && run.metadata.packet_fingerprint === packet.integrity.fingerprint);
  const completed = receipt.execution.status === "completed";
  const criterion = input.assessment.status === "available" ? input.assessment.assessment.criteria.find(c => c.criterion_id === expectation.criterion_id && c.criterion === expectation.criterion) : null;
  const typed = Boolean(packet.criterion_verification_plan?.criteria.some(c => c.criterion_id === expectation.criterion_id));
  const report = reports.at(-1);
  const actual = typed ? criterion?.status ?? "unknown" : report?.outcome ?? "unknown";
  const basis = typed ? criterion?.basis ?? "insufficient" : report ? "attested" : "insufficient";
  const conditionsKnown = report?.applicability === "applied";
  const conclusive = exact && completed && conditionsKnown && ["satisfied", "unsatisfied"].includes(actual) && basis !== "insufficient";
  return { expectation, history, attempt, reports, run_disposition: exact && run ? run.status : receipt.execution.status,
    eligibility: !exact ? "local_chronology_unavailable" : !completed ? "not_observed" : "eligible",
    comparison: conclusive ? actual === expectation.predicted_outcome ? "match" : "mismatch" : report || typed ? "unknown" : "unassessed",
    actual_outcome: actual, outcome_source: typed ? "criterion_assessment" : report ? "operator_report" : "unassessed", basis, supporting_refs: typed ? criterion?.supporting_refs ?? [] : report ? [report.receipt_ref, expectationRef(report)] : [],
    uncertainty: ["Prediction match does not establish task success.",
      ...(actual === "unsatisfied" ? ["This criterion remains unsatisfied on the stated evidence basis, including when the prediction matches."] : []),
      ...(!exact ? ["Exact local first-attempt chronology is unavailable; imported or other attempts cannot settle this expectation."] : []),
      ...(!completed ? ["This run did not complete the observation window; no match or mismatch is assigned."] : []),
      ...(typed ? criterion?.uncertainty ?? [] : ["Natural-language criteria require an explicit source-linked operator observation; worker summaries and overall completion are not proof."]),
      ...(!conditionsKnown ? ["Applicability conditions have not been established by an operator report."] : [])],
    report_allowed: exact && completed,
    packet_href: createSharedInspectorHrefV01({ target_kind: "task_context_packet", record_id: packet.packet_id, expected_fingerprint: packet.integrity.fingerprint }),
    result_href: createRunResultReviewHrefV01(receipt.receipt_id),
  };
}
