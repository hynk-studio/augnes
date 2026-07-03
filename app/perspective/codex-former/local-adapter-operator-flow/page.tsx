import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CodexFormerLocalAdapterOperatorFlowSurface,
} from "./operator-flow-surface";
import {
  buildCodexFormerLocalAdapterOperatorFlowViewModel,
  type OperatorFlowInput,
  type OperatorFlowPrepareExecutionSummary,
  type OperatorFlowSourceInput,
} from "@/lib/perspective-ingest/codex-former-local-adapter-operator-flow";
import type {
  CodexFormerLocalAdapterValidateExecutionSummaryForSnapshots,
} from "@/lib/perspective-ingest/codex-former-local-adapter-validate-result-snapshots";
import preparePassFixture from "@/reports/fixtures/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass.json";
import preparePassWithFollowUpFixture from "@/reports/fixtures/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass-with-follow-up.json";
import sourcePassFixture from "@/reports/fixtures/2026-06-12-codex-former-local-adapter-source-input-pass.json";
import sourcePassWithFollowUpFixture from "@/reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json";
import validateBlockedFixture from "@/reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-blocked.json";
import validatePassFixture from "@/reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass.json";
import validatePassWithFollowUpFixture from "@/reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass-with-follow-up.json";

const sourcePassPath =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-source-input-pass.json";
const sourcePassWithFollowUpPath =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json";
const preparePassPath =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass.json";
const preparePassWithFollowUpPath =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass-with-follow-up.json";
const validatePassPath =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass.json";
const validatePassWithFollowUpPath =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass-with-follow-up.json";
const validateBlockedPath =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-blocked.json";
const returnedPassPath =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-pass.txt";
const returnedPassWithFollowUpPath =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-ready.txt";
const returnedBlockedPath =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-blocked.txt";

export default function CodexFormerLocalAdapterOperatorFlowPage() {
  const input: OperatorFlowInput = {
    scenarios: {
      pass: {
        key: "pass",
        label: "PASS",
        sourceInput: sourcePassFixture as OperatorFlowSourceInput,
        sourceInputPath: sourcePassPath,
        prepareSummary:
          preparePassFixture as OperatorFlowPrepareExecutionSummary,
        prepareSummaryPath: preparePassPath,
        validateSummary:
          validatePassFixture as CodexFormerLocalAdapterValidateExecutionSummaryForSnapshots,
        validateSummaryPath: validatePassPath,
        returnedEnvelopeText: readFixtureText(
          "2026-06-12-codex-former-local-adapter-returned-candidate-envelope-pass.txt",
        ),
        returnedEnvelopePath: returnedPassPath,
      },
      pass_with_follow_up: {
        key: "pass_with_follow_up",
        label: "PASS with follow-up",
        sourceInput:
          sourcePassWithFollowUpFixture as OperatorFlowSourceInput,
        sourceInputPath: sourcePassWithFollowUpPath,
        prepareSummary:
          preparePassWithFollowUpFixture as OperatorFlowPrepareExecutionSummary,
        prepareSummaryPath: preparePassWithFollowUpPath,
        validateSummary:
          validatePassWithFollowUpFixture as CodexFormerLocalAdapterValidateExecutionSummaryForSnapshots,
        validateSummaryPath: validatePassWithFollowUpPath,
        returnedEnvelopeText: readFixtureText(
          "2026-06-12-codex-former-local-adapter-returned-candidate-envelope-ready.txt",
        ),
        returnedEnvelopePath: returnedPassWithFollowUpPath,
      },
      blocked: {
        key: "blocked",
        label: "BLOCKED",
        sourceInput:
          sourcePassWithFollowUpFixture as OperatorFlowSourceInput,
        sourceInputPath: sourcePassWithFollowUpPath,
        prepareSummary:
          preparePassWithFollowUpFixture as OperatorFlowPrepareExecutionSummary,
        prepareSummaryPath: preparePassWithFollowUpPath,
        validateSummary:
          validateBlockedFixture as CodexFormerLocalAdapterValidateExecutionSummaryForSnapshots,
        validateSummaryPath: validateBlockedPath,
        returnedEnvelopeText: readFixtureText(
          "2026-06-12-codex-former-local-adapter-returned-candidate-envelope-blocked.txt",
        ),
        returnedEnvelopePath: returnedBlockedPath,
      },
    },
  };

  const viewModel = buildCodexFormerLocalAdapterOperatorFlowViewModel(input);

  return <CodexFormerLocalAdapterOperatorFlowSurface viewModel={viewModel} />;
}

function readFixtureText(fileName: string) {
  return readFileSync(
    join(process.cwd(), "reports", "fixtures", fileName),
    "utf8",
  );
}
