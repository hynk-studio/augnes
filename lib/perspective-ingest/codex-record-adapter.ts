import codexRecordFixture from "@/fixtures/perspective-ingest/codex-record-to-constellation.sample.v0.1.json";
import {
  normalizePerspectiveIngestFixtureRecord,
  type PerspectiveIngestFixtureRecord,
} from "@/lib/perspective-ingest/session-episode";
import type { PerspectiveIngestSessionEpisode } from "@/types/perspective-ingest-constellation-preview";

export function buildCodexSampleSessionEpisode(): PerspectiveIngestSessionEpisode {
  return normalizePerspectiveIngestFixtureRecord(
    codexRecordFixture as PerspectiveIngestFixtureRecord,
  );
}
