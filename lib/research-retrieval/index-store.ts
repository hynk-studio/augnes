import type { RebuildableRetrievalIndex } from "./rebuild-index";

export interface RebuildableRetrievalIndexStoreMetadata {
  index_id: string;
  built_at: string;
  entry_count: number;
  token_count: number;
  source_refs: string[];
  candidate_refs: string[];
  review_memory_refs: string[];
  durable_summary_refs: string[];
  feedback_refs: string[];
  derived_non_authoritative: true;
  rebuildable: true;
  stale_index_cannot_override_current_state: true;
  index_fingerprint: string;
}

export interface RebuildableRetrievalIndexStoreSnapshot {
  store_version: "rebuildable_retrieval_index_in_memory_store.v0.1";
  scope: "project:augnes";
  storage_kind: "in_memory_derived_cache_only";
  durable_state: false;
  disk_write: false;
  db_write: false;
  file_read_or_write: false;
  automatic_rebuild: false;
  background_job: false;
  indexes: RebuildableRetrievalIndexStoreMetadata[];
  discard_log: Array<{
    index_id: string;
    reason: string;
    discarded_at: string;
    derived_cache_only: true;
    candidate_rejection: false;
    proof_or_evidence_deletion: false;
    product_write: false;
  }>;
}

export interface InMemoryRebuildableRetrievalIndexStoreV01 {
  saveIndex(index: RebuildableRetrievalIndex): RebuildableRetrievalIndexStoreMetadata;
  readIndex(indexId: string): RebuildableRetrievalIndex | null;
  listIndexMetadata(): RebuildableRetrievalIndexStoreMetadata[];
  discardIndex(indexId: string, reason: string): boolean;
}

interface MutableStore extends InMemoryRebuildableRetrievalIndexStoreV01 {
  __readDiscardLog(): RebuildableRetrievalIndexStoreSnapshot["discard_log"];
}

export function createInMemoryRebuildableRetrievalIndexStoreV01(): InMemoryRebuildableRetrievalIndexStoreV01 {
  const indexes = new Map<string, RebuildableRetrievalIndex>();
  const discardLog: RebuildableRetrievalIndexStoreSnapshot["discard_log"] = [];
  const store: MutableStore = {
    saveIndex(index) {
      indexes.set(index.index_id, index);
      return toMetadata(index);
    },
    readIndex(indexId) {
      return indexes.get(indexId) ?? null;
    },
    listIndexMetadata() {
      return [...indexes.values()].map(toMetadata).sort((left, right) =>
        left.index_id.localeCompare(right.index_id),
      );
    },
    discardIndex(indexId, reason) {
      const existed = indexes.delete(indexId);
      if (existed) {
        discardLog.push({
          index_id: indexId,
          reason,
          discarded_at: new Date(0).toISOString(),
          derived_cache_only: true,
          candidate_rejection: false,
          proof_or_evidence_deletion: false,
          product_write: false,
        });
      }
      return existed;
    },
    __readDiscardLog() {
      return [...discardLog];
    },
  };
  return store;
}

export function createReadOnlyRebuildableRetrievalIndexStoreSnapshotV01(
  store: InMemoryRebuildableRetrievalIndexStoreV01,
): RebuildableRetrievalIndexStoreSnapshot {
  const maybeMutable = store as Partial<MutableStore>;
  return {
    store_version: "rebuildable_retrieval_index_in_memory_store.v0.1",
    scope: "project:augnes",
    storage_kind: "in_memory_derived_cache_only",
    durable_state: false,
    disk_write: false,
    db_write: false,
    file_read_or_write: false,
    automatic_rebuild: false,
    background_job: false,
    indexes: store.listIndexMetadata(),
    discard_log: maybeMutable.__readDiscardLog?.() ?? [],
  };
}

export const rebuildableRetrievalIndexRuntimeDerivedStoreV01 =
  createInMemoryRebuildableRetrievalIndexStoreV01();

function toMetadata(index: RebuildableRetrievalIndex): RebuildableRetrievalIndexStoreMetadata {
  return {
    index_id: index.index_id,
    built_at: index.built_at,
    entry_count: index.entries.length,
    token_count: index.token_records.length,
    source_refs: [...index.source_refs].sort(),
    candidate_refs: [...index.candidate_refs].sort(),
    review_memory_refs: [...index.review_memory_refs].sort(),
    durable_summary_refs: [...index.durable_summary_refs].sort(),
    feedback_refs: [...index.feedback_refs].sort(),
    derived_non_authoritative: true,
    rebuildable: true,
    stale_index_cannot_override_current_state: true,
    index_fingerprint: index.index_fingerprint,
  };
}
