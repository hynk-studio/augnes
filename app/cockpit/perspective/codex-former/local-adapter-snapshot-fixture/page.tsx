import { CodexFormerLocalAdapterSnapshotFixtureSurface } from "@/components/codex-former-local-adapter-snapshot-fixture";
import {
  validateCodexFormerLocalAdapterSnapshotFixtureSurface,
  type LocalAdapterSnapshotFixtureSurfaceInput,
} from "@/lib/perspective-ingest/codex-former-local-adapter-snapshot-fixture-surface";
import type {
  LocalAdapterInboxSurfaceViewModels,
  LocalAdapterSessionPanelSurfaceViewModels,
  LocalAdapterSnapshotSurfaceIntegrationReadiness,
} from "@/lib/perspective-ingest/codex-former-local-adapter-snapshot-surface-integration";
import inboxViewModelFixture from "@/reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-surface-view-models.json";
import readinessFixture from "@/reports/fixtures/2026-06-11-codex-former-local-adapter-snapshot-surface-integration-readiness.json";
import sessionPanelViewModelFixture from "@/reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-surface-view-models.json";

export default function CodexFormerLocalAdapterSnapshotFixturePage() {
  const input: LocalAdapterSnapshotFixtureSurfaceInput = {
    sessionViewModels:
      sessionPanelViewModelFixture as LocalAdapterSessionPanelSurfaceViewModels,
    inboxViewModels: inboxViewModelFixture as LocalAdapterInboxSurfaceViewModels,
    readiness: readinessFixture as LocalAdapterSnapshotSurfaceIntegrationReadiness,
  };

  const validation =
    validateCodexFormerLocalAdapterSnapshotFixtureSurface(input);

  return (
    <CodexFormerLocalAdapterSnapshotFixtureSurface
      inboxViewModels={input.inboxViewModels}
      readiness={input.readiness}
      sessionViewModels={input.sessionViewModels}
      validation={validation}
    />
  );
}
