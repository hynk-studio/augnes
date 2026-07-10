import type { CodexResultReportIngestionRecordV01 } from "@/lib/dogfooding/codex-result-report-normalizer";
import type { CodexResultReportRunReceiptInputV01 } from "@/lib/vnext/compat/run-receipt-from-codex-result-report";

export const CODEX_RESULT_MAPPER_RECORDED_AT = "2026-07-10T08:30:00.000Z";
export const CODEX_RESULT_MAPPER_WORKSPACE_ID = "workspace-codex-result-fixture";
export const CODEX_RESULT_MAPPER_PROJECT_ID = "project-codex-result-fixture";
export const CODEX_RESULT_MAPPER_RUN_ID = "run-codex-result-fixture-001";

export function codexResultMapperInputFixture(
  sourceRecord: CodexResultReportIngestionRecordV01,
): CodexResultReportRunReceiptInputV01 {
  return {
    workspace_id: CODEX_RESULT_MAPPER_WORKSPACE_ID,
    project_id: CODEX_RESULT_MAPPER_PROJECT_ID,
    run_id: CODEX_RESULT_MAPPER_RUN_ID,
    recorded_at: CODEX_RESULT_MAPPER_RECORDED_AT,
    data_classification: "public_safe",
    source_record: sourceRecord,
  };
}
