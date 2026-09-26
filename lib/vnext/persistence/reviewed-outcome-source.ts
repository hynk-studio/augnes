import type Database from "better-sqlite3";
import { buildReviewedOutcomeSourceEntry, normalizeSelectedWorkSources, readSelectedWorkSources, reviewedOutcomeSourceRef, SelectedWorkSourceError } from "@/lib/intake/selected-work-source-comparison";
import { assertWorkExpectationRecord, expectationCheck as check, expectationHash as hash, expectationRef, expectationSourceRef } from "@/lib/vnext/work-expectation";
import { deriveCriterionIdentityV01 } from "@/lib/vnext/criterion-identity";
import { readVNextLocalOperatorSessionHistoryV01 } from "@/lib/vnext/runtime/local-operator-session";
import type { ReviewedOutcomeSourceRefV01 } from "@/types/vnext/project-work-revision";
import type { TaskContextPacketSelectedEntryV01, TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { CriterionAssessmentReadbackV01 } from "@/types/vnext/criterion-assessment";
import type { WorkExpectation, WorkExpectationRecord, WorkOutcomeReport } from "@/types/vnext/work-expectation";
import { readVNextCoreRecordV01 } from "./durable-semantic-store";
import { expectationSnapshotRefs, readWorkExpectationComparison } from "./work-expectation-store";

type Source = { workspace_id: string; project_id: string; packet: TaskContextPacketV01; receipt: RunReceiptV01 };
type Available = { status: "available"; binding: ReviewedOutcomeSourceRefV01; entries: TaskContextPacketSelectedEntryV01[] };
export type ReviewedOutcomeReuseV01 = Available | { status: "absent" | "unavailable" | "local_chronology_unavailable" | "over_budget"; binding: null; entries: [] };

/** Optional projection from the existing exact result reader. No source is selected. */
export function readReviewedOutcomeReuseV01(db: Database.Database, input: Source & { assessment: CriterionAssessmentReadbackV01 }): ReviewedOutcomeReuseV01 {
  const unavailable = (status: Exclude<ReviewedOutcomeReuseV01["status"], "available">): ReviewedOutcomeReuseV01 => ({ status, binding: null, entries: [] });
  try {
    const comparison = readWorkExpectationComparison(db, input);
    const report = comparison?.reports.at(-1);
    if (!report) return unavailable("absent");
    if (comparison!.eligibility !== "eligible") return unavailable("local_chronology_unavailable");
    const binding = { record_id: report.record_id, fingerprint: report.integrity.fingerprint };
    return { status: "available", binding, entries: readHistoricalReviewedOutcomeSourcesV01(db, input, binding) };
  } catch (error) {
    return unavailable(error instanceof SelectedWorkSourceError ? "over_budget" : "unavailable");
  }
}

/** Exact immutable records only: never latest-report selection or live chronology.
 * Avoid the whole-history reader here: ordinary expectation history itself reads
 * preparation lineage. This bounded relation read is also usable after import. */
export function readHistoricalReviewedOutcomeSourcesV01(db: Database.Database, input: Source,
  binding: ReviewedOutcomeSourceRefV01): TaskContextPacketSelectedEntryV01[] {
  check(binding && Object.keys(binding).sort().join(",") === "fingerprint,record_id", "reviewed_outcome_binding_invalid");
  const exact = (id: string, fingerprint: string): WorkExpectationRecord => {
    const row = readVNextCoreRecordV01(db, { ...input, record_kind: "work_expectation_record", record_id: id });
    check(row && row.fingerprint === fingerprint, "reviewed_outcome_source_changed");
    assertWorkExpectationRecord(row.payload);
    const r = row.payload;
    check(r.workspace_id === input.workspace_id && r.project_id === input.project_id && r.record_id === row.record_id &&
      r.integrity.fingerprint === row.fingerprint && r.recorded_at === row.created_at && row.idempotency_key === null, "reviewed_outcome_envelope_invalid");
    if (r.kind !== "attempt_binding") {
      const session = readVNextLocalOperatorSessionHistoryV01(db, { session_id: r.author.session_id });
      check(session && session.workspace_id === input.workspace_id && session.project_id === input.project_id &&
        session.operator_id === r.author.operator_id && session.bootstrap_consumed_at &&
        Date.parse(r.recorded_at) >= Date.parse(session.bootstrap_consumed_at) && Date.parse(r.recorded_at) < Date.parse(session.expires_at), "reviewed_outcome_author_invalid");
    }
    return r;
  };
  const referenced = (ref: ExternalRefV01) => {
    const record = exact(ref.external_id, ref.source_ref!);
    check(hash(expectationRef(record)) === hash(ref), "reviewed_outcome_ref_invalid");
    return record;
  };
  const report = exact(binding.record_id, binding.fingerprint);
  check(report.kind === "outcome_report", "reviewed_outcome_report_required");
  const expectation = referenced(report.expectation_ref), attempt = referenced(report.attempt_ref);
  check(expectation.kind === "expectation" && attempt.kind === "attempt_binding" &&
    hash(attempt.expectation_ref) === hash(report.expectation_ref) && attempt.run_id === input.receipt.run_id &&
    hash(report.receipt_ref) === hash(expectationSourceRef(input.receipt.receipt_id, input.receipt.integrity.fingerprint, input.receipt.recorded_at, "run_receipt")), "reviewed_outcome_relation_invalid");
  const packetRef = expectationSourceRef(input.packet.packet_id, input.packet.integrity.fingerprint, input.packet.generated_at, "task_context_packet");
  check([report, expectation, attempt].every(r => hash(r.packet_ref) === hash(packetRef)) &&
    input.receipt.task_context_packet_ref?.external_id === input.packet.packet_id && input.receipt.task_context_packet_ref.source_ref === input.packet.integrity.fingerprint &&
    input.packet.task.success_criteria.some(c => c === expectation.criterion && deriveCriterionIdentityV01(c) === expectation.criterion_id) &&
    hash(expectation.source_refs) === hash(expectationSnapshotRefs(input.packet)) &&
    Date.parse(expectation.recorded_at) > Date.parse(input.packet.generated_at) &&
    Date.parse(attempt.recorded_at) > Date.parse(expectation.recorded_at), "reviewed_outcome_packet_invalid");
  let version: WorkOutcomeReport = report;
  for (let count = 0; ; count++) {
    check(count < 32 && Date.parse(version.recorded_at) > Date.parse(input.receipt.recorded_at) &&
      hash(version.expectation_ref) === hash(report.expectation_ref) && hash(version.attempt_ref) === hash(report.attempt_ref) &&
      hash(version.receipt_ref) === hash(report.receipt_ref) && hash(version.packet_ref) === hash(packetRef), "reviewed_outcome_history_invalid");
    if (!version.previous_ref) { check(version.revision === 1, "reviewed_outcome_history_invalid"); break; }
    const prior = referenced(version.previous_ref);
    check(prior.kind === "outcome_report" && prior.revision === version.revision - 1 &&
      Date.parse(prior.recorded_at) < Date.parse(version.recorded_at), "reviewed_outcome_history_invalid");
    version = prior;
  }
  return buildSources(input, expectation, report);
}

function buildSources(input: Source, forecast: WorkExpectation, report: WorkOutcomeReport) {
  const binding = { record_id: report.record_id, fingerprint: report.integrity.fingerprint };
  const texts = {
    expectation: `Historical operator-authored forecast v${forecast.revision}; not a requirement for this work.\nRecorded: ${forecast.recorded_at}; author: ${forecast.author.operator_id}; cutoff: ${forecast.information_cutoff}.\nRequirement: ${forecast.criterion}\nPrediction: ${forecast.predicted_outcome}\nReason: ${forecast.reason}\nOriginal applicability conditions: ${forecast.conditions}\nForecast: ${forecast.record_id} ${forecast.integrity.fingerprint}\nPacket: ${input.packet.packet_id} ${input.packet.integrity.fingerprint}\nSource currentness: recorded packet snapshot only; external currentness unknown. Operator-visible; prior attention/copying unknown.`,
    report: `Historical operator-attested outcome report v${report.revision}; not independently verified truth or a host claim.\nRecorded: ${report.recorded_at}; author: ${report.author.operator_id}.\nReported outcome: ${report.outcome}; original conditions held: ${report.applicability}.\nObservation: ${report.observation}\nReport: ${report.record_id} ${report.integrity.fingerprint}\nPrevious report: ${report.previous_ref?.external_id ?? "none"}; earlier reports remain historical.\nAttempt: ${report.attempt_ref.external_id} ${report.attempt_ref.source_ref}\nReceipt: ${input.receipt.receipt_id} ${input.receipt.integrity.fingerprint}\nThis report does not change the original forecast conditions or any typed assessment. Unknown applicability/outcomes remain unknown. Prediction match is not task success. No derived comparison or local chronology is asserted by this snapshot.`,
  };
  return normalizeSelectedWorkSources(input, (["expectation", "report"] as const).map(part => buildReviewedOutcomeSourceEntry(input,
    { source: report.record_id, observed_at: report.recorded_at, provenance: "imported_unverified", label: "Unclassified / needs review", text: texts[part] }, binding, part)));
}

/** Save uses latest=true inside BEGIN IMMEDIATE; persisted reconstruction uses
 * exact historical versions and never subscribes a saved packet to later reports. */
export function assertReviewedOutcomeSelectionV01(db: Database.Database, input: Source & {
  entries: TaskContextPacketSelectedEntryV01[]; latest?: boolean; selected_at?: string; assessment: CriterionAssessmentReadbackV01;
}) {
  const selected = input.entries.filter(e => reviewedOutcomeSourceRef(e));
  if (!selected.length) return;
  const inherited = readSelectedWorkSources(input.packet);
  for (const id of new Set(selected.map(e => reviewedOutcomeSourceRef(e)!.record_id))) {
    const group = selected.filter(e => reviewedOutcomeSourceRef(e)!.record_id === id);
    if (group.every(e => inherited.some(prior => hash(prior) === hash(e)))) continue;
    const binding = reviewedOutcomeSourceRef(group[0]!)!;
    const expected = readHistoricalReviewedOutcomeSourcesV01(db, input, binding);
    check(hash(normalizeSelectedWorkSources(input, group)) === hash(expected), "reviewed_outcome_selection_changed");
    check(!input.selected_at || expected.every(e => Date.parse(e.external_ref!.observed_at!) <= Date.parse(input.selected_at!)), "reviewed_outcome_selection_time");
    if (input.latest) {
      const current = readReviewedOutcomeReuseV01(db, input);
      check(current.status === "available" && hash(current.binding) === hash(binding), "reviewed_outcome_changed");
    }
  }
}
