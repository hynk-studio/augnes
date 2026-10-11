import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type { EpisodeDeltaProposalDeltaCandidateV01 } from "@/types/vnext/episode-delta-proposal";

// Candidate identity is independent of proposal validation and review services.
export function createEpisodeDeltaCandidateFingerprintV01(
  candidate: EpisodeDeltaProposalDeltaCandidateV01,
): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(candidate));
}
