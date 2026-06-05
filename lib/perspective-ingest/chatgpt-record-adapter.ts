import chatGptRecordFixture from "@/fixtures/perspective-ingest/chatgpt-record-to-constellation.sample.v0.1.json";
import {
  normalizePerspectiveIngestFixtureRecord,
  type PerspectiveIngestFixtureRecord,
} from "@/lib/perspective-ingest/session-episode";
import type { PerspectiveIngestSessionEpisode } from "@/types/perspective-ingest-constellation-preview";

export function buildChatGptSampleSessionEpisode(): PerspectiveIngestSessionEpisode {
  return normalizePerspectiveIngestFixtureRecord(
    chatGptRecordFixture as PerspectiveIngestFixtureRecord,
  );
}
