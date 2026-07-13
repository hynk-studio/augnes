import {
  CodexFormerLocalAdapterValidateResultFixtureSurface,
} from "./validate-result-fixture-surface";
import {
  validateCodexFormerLocalAdapterValidateResultFixtureSurface,
  type ValidateResultFixtureSurfaceInput,
} from "@/lib/perspective-ingest/codex-former-local-adapter-validate-result-fixture-surface";
import type {
  CodexFormerLocalAdapterValidateResultInboxItemV0,
  CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0,
  CodexFormerLocalAdapterValidateResultSnapshotSummaryV0,
} from "@/lib/perspective-ingest/codex-former-local-adapter-validate-result-snapshots";
import inboxBlockedFixture from "@/fixtures/codex-former/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-blocked.json";
import inboxPassWithFollowUpFixture from "@/fixtures/codex-former/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass-with-follow-up.json";
import inboxPassFixture from "@/fixtures/codex-former/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass.json";
import sessionBlockedFixture from "@/fixtures/codex-former/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-blocked.json";
import sessionPassWithFollowUpFixture from "@/fixtures/codex-former/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass-with-follow-up.json";
import sessionPassFixture from "@/fixtures/codex-former/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass.json";
import snapshotSummaryFixture from "@/fixtures/codex-former/2026-06-12-codex-former-local-adapter-validate-result-snapshot-summary.json";

export default function CodexFormerLocalAdapterValidateResultFixturePage() {
  const input: ValidateResultFixtureSurfaceInput = {
    sessionPanelSnapshots: {
      pass: sessionPassFixture as CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0,
      passWithFollowUp:
        sessionPassWithFollowUpFixture as CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0,
      blocked:
        sessionBlockedFixture as CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0,
    },
    inboxItems: {
      pass: inboxPassFixture as CodexFormerLocalAdapterValidateResultInboxItemV0,
      passWithFollowUp:
        inboxPassWithFollowUpFixture as CodexFormerLocalAdapterValidateResultInboxItemV0,
      blocked: inboxBlockedFixture as CodexFormerLocalAdapterValidateResultInboxItemV0,
    },
    snapshotSummary:
      snapshotSummaryFixture as CodexFormerLocalAdapterValidateResultSnapshotSummaryV0,
  };

  const validation =
    validateCodexFormerLocalAdapterValidateResultFixtureSurface(input);

  return (
    <CodexFormerLocalAdapterValidateResultFixtureSurface
      input={input}
      validation={validation}
    />
  );
}
