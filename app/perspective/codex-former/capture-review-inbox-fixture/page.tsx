import { CodexFormerCaptureReviewInboxFixtureSurface } from "@/components/codex-former-capture-review-inbox-fixture";
import {
  buildCodexFormerCaptureReviewInboxFixture,
  type CodexFormerCaptureReviewInboxFixture,
} from "@/lib/perspective-ingest/codex-former-capture-review-inbox-fixture-surface";
import type { CodexFormerPreviewData } from "@/lib/perspective-ingest/codex-former-constellation-preview-fixture-surface";
import blockedPreviewData from "@/fixtures/codex-former/2026-06-10-codex-former-constellation-preview-data-blocked.json";
import passWithFollowUpPreviewData from "@/fixtures/codex-former/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json";

export default function CodexFormerCaptureReviewInboxFixturePage() {
  const inboxFixture: CodexFormerCaptureReviewInboxFixture =
    buildCodexFormerCaptureReviewInboxFixture({
      passWithFollowUpPreviewData: passWithFollowUpPreviewData as CodexFormerPreviewData,
      blockedPreviewData: blockedPreviewData as CodexFormerPreviewData,
    });

  return <CodexFormerCaptureReviewInboxFixtureSurface inbox={inboxFixture} />;
}
