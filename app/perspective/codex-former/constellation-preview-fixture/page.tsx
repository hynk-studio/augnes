import { CodexFormerConstellationPreviewFixtureSurface } from "@/components/codex-former-constellation-preview-fixture";
import type { CodexFormerPreviewData } from "@/lib/perspective-ingest/codex-former-constellation-preview-fixture-surface";
import blockedPreviewData from "@/fixtures/codex-former/2026-06-10-codex-former-constellation-preview-data-blocked.json";
import passWithFollowUpPreviewData from "@/fixtures/codex-former/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json";

export default function CodexFormerConstellationPreviewFixturePage() {
  return (
    <CodexFormerConstellationPreviewFixtureSurface
      fixtures={[
        {
          id: "pass-with-follow-up",
          label: "PASS with follow-up",
          previewData: passWithFollowUpPreviewData as CodexFormerPreviewData,
        },
        {
          id: "blocked",
          label: "BLOCKED",
          previewData: blockedPreviewData as CodexFormerPreviewData,
        },
      ]}
    />
  );
}
