import { CodexFormerSessionPerspectivePanelFixtureSurface } from "@/components/codex-former-session-perspective-panel-fixture";
import {
  buildCodexFormerSessionPanelScenarios,
  type CodexFormerSessionPanelScenario,
} from "@/lib/perspective-ingest/codex-former-session-perspective-panel-fixture-surface";
import type { CodexFormerPreviewData } from "@/lib/perspective-ingest/codex-former-constellation-preview-fixture-surface";
import blockedPreviewData from "@/reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json";
import passWithFollowUpPreviewData from "@/reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json";

export default function CodexFormerSessionPerspectivePanelFixturePage() {
  const scenarios: CodexFormerSessionPanelScenario[] =
    buildCodexFormerSessionPanelScenarios({
      passWithFollowUpPreviewData: passWithFollowUpPreviewData as CodexFormerPreviewData,
      blockedPreviewData: blockedPreviewData as CodexFormerPreviewData,
    });

  return (
    <CodexFormerSessionPerspectivePanelFixtureSurface scenarios={scenarios} />
  );
}
