import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import type { PreExecutionProjectWorkChainInspectionV01 } from "@/lib/vnext/runtime/pre-execution-project-work-revision";
import { PRE_EXECUTION_NEW_WORK_COMPILER_VERSION_V01, MAX_PRE_EXECUTION_PROJECT_WORK_REVISIONS_V01, type RetainedWorkSourceRef } from "@/types/vnext/project-work-revision";
import type { TaskContextPacketSelectedEntryV01 } from "@/types/vnext/task-context-packet";
import { normalizeRetainedWorkSourceRefs, readSelectedWorkSources, reviewedOutcomeSourceRef, SelectedWorkSourceError, NATIVE_SELECTED_WORK_SOURCE_LIMITS } from "./selected-work-source-comparison";

export const RETAINED_WORK_SOURCE_LIMITS = {
  query_characters: 160, query_terms: 8, results: 8, result_utf8_bytes: 20_000,
  packets: MAX_PRE_EXECUTION_PROJECT_WORK_REVISIONS_V01 + 1,
  note_occurrences: (MAX_PRE_EXECUTION_PROJECT_WORK_REVISIONS_V01 + 1) * NATIVE_SELECTED_WORK_SOURCE_LIMITS.entries,
  // Cumulative lookup capacity, independent of native per-packet admission.
  // Exhaustion is unavailable lookup, not corrupt source material. Count every
  // occurrence even when the same note is retained across revisions.
  scanned_entry_utf8_bytes: 396_000,
} as const;
type Chain = Pick<PreExecutionProjectWorkChainInspectionV01, "packets" | "tip_packet">;
export interface RetainedWorkSourceHit {
  source: RetainedWorkSourceRef;
  entry: TaskContextPacketSelectedEntryV01;
  first_recorded_at: string;
  last_selected_at: string;
  packet_occurrences: number;
  selection: "currently_selected" | "historical_not_selected";
}

/** Only the existing exact lineage owner may supply this invocation-local chain. */
export function recallRetainedWorkSources(chain: Chain, query: unknown,
  disclosure: { include_source_locator?: (locator: string) => boolean } = {}) {
  chain = currentTaskChain(chain);
  if (chain.packets.length > RETAINED_WORK_SOURCE_LIMITS.packets) throw new SelectedWorkSourceError("retained_source_scan_bound_exceeded");
  if (typeof query !== "string" || !query.trim() || [...query].length > RETAINED_WORK_SOURCE_LIMITS.query_characters ||
    /[\u0000-\u001f\u007f]/u.test(query)) throw new SelectedWorkSourceError("retained_source_query_invalid");
  const terms = [...new Set(query.trim().toLowerCase().split(/\s+/u))].sort();
  if (terms.length > RETAINED_WORK_SOURCE_LIMITS.query_terms) throw new SelectedWorkSourceError("retained_source_query_invalid");
  const current = new Set(readSelectedWorkSources(chain.tip_packet).map((entry) => entry.entry_id));
  const unique = new Map<string, RetainedWorkSourceHit>();
  let scannedEntries = 0;
  let scannedEntryBytes = 0;
  for (const packet of chain.packets) {
    for (const entry of readSelectedWorkSources(packet)) {
      scannedEntries += 1;
      scannedEntryBytes += utf8(entry);
      if (scannedEntryBytes > RETAINED_WORK_SOURCE_LIMITS.scanned_entry_utf8_bytes) throw new SelectedWorkSourceError("retained_source_scan_bound_exceeded");
      const previous = unique.get(entry.entry_id);
      if (previous) {
        previous.packet_occurrences += 1;
        previous.last_selected_at = packet.generated_at;
      } else {
        unique.set(entry.entry_id, {
          source: { packet_id: packet.packet_id, packet_fingerprint: packet.integrity.fingerprint,
            entry_id: entry.entry_id, source_fingerprint: entry.source_ref! },
          entry, first_recorded_at: packet.generated_at, last_selected_at: packet.generated_at,
          packet_occurrences: 1,
          selection: current.has(entry.entry_id) ? "currently_selected" : "historical_not_selected",
        });
      }
    }
  }
  const ordered = [...unique.values()].sort((a, b) => {
    const left = a.entry.external_ref?.observed_at ?? "~";
    const right = b.entry.external_ref?.observed_at ?? "~";
    return left < right ? -1 : left > right ? 1 : a.entry.entry_id < b.entry.entry_id ? -1 : a.entry.entry_id > b.entry.entry_id ? 1 : 0;
  });
  // Each packet was normalized as a complete snapshot above. A literal match
  // in either reviewed-outcome member discloses both exact retained members;
  // comparison/save still require the caller to explicitly submit both refs.
  const groups = new Map<string, RetainedWorkSourceHit[]>();
  for (const hit of ordered) {
    const binding = reviewedOutcomeSourceRef(hit.entry);
    const key = binding ? canonicalizeProtocolValueV01(binding) : hit.entry.entry_id;
    const group = groups.get(key) ?? [];
    group.push(hit); groups.set(key, group);
  }
  const matches = [...groups.values()].filter(group => group.some(({ entry }) => {
    const locator = entry.compatibility_source_ref!.external_id;
    // Browser retains its existing privileged matching. A local-client
    // projection must not turn a withheld locator into a search oracle.
    const text = `${disclosure.include_source_locator?.(locator) === false ? "" : locator}\n${entry.bounded_summary}`.toLowerCase();
    return terms.every((term) => text.includes(term));
  }));
  const matchingEntries = matches.reduce((count, group) => count + group.length, 0);
  const results: RetainedWorkSourceHit[] = [];
  let resultBytes = 2; // canonical JSON array, including separators
  for (const group of matches) {
    const additional = utf8(group) - 2 + (results.length ? 1 : 0);
    if (results.length + group.length > RETAINED_WORK_SOURCE_LIMITS.results || resultBytes + additional > RETAINED_WORK_SOURCE_LIMITS.result_utf8_bytes) continue;
    results.push(...group);
    resultBytes += additional;
  }
  return {
    current_packet_id: chain.tip_packet.packet_id,
    current_packet_fingerprint: chain.tip_packet.integrity.fingerprint,
    query_terms: terms,
    scope: "selected_note_snapshots_in_current_pre_execution_revision_chain" as const,
    cutoff_recorded_at: chain.tip_packet.generated_at,
    limits: RETAINED_WORK_SOURCE_LIMITS,
    scanned_packets: chain.packets.length,
    scanned_entry_occurrences: scannedEntries,
    scanned_entry_utf8_bytes: scannedEntryBytes,
    unique_entries: unique.size,
    matching_entries: matchingEntries,
    returned_entries: results.length,
    result_utf8_bytes: resultBytes,
    omitted_matching_entries: matchingEntries - results.length,
    truncated: results.length < matchingEntries,
    results,
    writes: 0 as const,
    qualifications: [
      "Only retained selected-note snapshots in this validated unstarted-work chain were searched; bounded no-match is not global absence.",
      "Historical/non-selected does not say why selection changed. Explicit revision exclusion remains effective until deliberate reselection. No cooling, refutation or deletion is inferred.",
      "Repeated packet copies are one exact excerpt, not independent evidence. Similar wording and source locators do not establish equivalence or supersession.",
      "Original external source availability, deletion and currentness are unverified. Retrieval does not refresh source time or accept a claim.",
      "A reviewed-outcome match includes both its historical forecast context and exact report, even if only one note matches. Counts and bytes include both notes. Selection of the complete visible group remains explicit.",
      "Whole notes or complete reviewed-outcome groups may be omitted at the result bounds; groups are never split and conditions and corrections are never clipped. Bytes describe serialized material, not disk I/O or tokens. Full lineage validation has additional read costs.",
    ],
  };
}

/** Recheck exact retained snapshots in the fresh owner-validated chain, never caller copies. */
export function resolveRetainedWorkSources(chain: Chain, value: unknown) {
  chain = currentTaskChain(chain);
  const refs = normalizeRetainedWorkSourceRefs(value);
  const entries = refs.map((ref) => {
    const packet = chain.packets.find((packet) => packet.packet_id === ref.packet_id && packet.integrity.fingerprint === ref.packet_fingerprint);
    const entry = packet && readSelectedWorkSources(packet).find((entry) => entry.entry_id === ref.entry_id && entry.source_ref === ref.source_fingerprint);
    if (!entry) throw new SelectedWorkSourceError("retained_source_changed_or_unavailable");
    return entry;
  });
  return { refs, entries };
}

function utf8(value: unknown): number { return Buffer.byteLength(canonicalizeProtocolValueV01(value), "utf8"); }

function currentTaskChain(chain: Chain): Chain {
  const start = chain.packets.findLastIndex(packet => packet.compatibility.source_contracts.includes(PRE_EXECUTION_NEW_WORK_COMPILER_VERSION_V01));
  return start < 0 ? chain : { ...chain, packets: chain.packets.slice(start) };
}
