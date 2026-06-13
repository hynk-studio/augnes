"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./local-memory-review-queue-surface.module.css";
import {
  createEmptyCodexFormerLocalAdapterCandidateDraftList,
  loadCodexFormerLocalAdapterCandidateDraftListFromStorage,
  type CodexFormerLocalAdapterCandidateDraftListV0,
} from "@/lib/perspective-ingest/codex-former-local-adapter-candidate-draft-list";
import {
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE,
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE,
  clearPerspectiveMemoryLocalReviewQueueFromStorage,
  createEmptyPerspectiveMemoryLocalReviewQueue,
  getPerspectiveMemoryLocalReviewQueueItemSourceState,
  loadPerspectiveMemoryLocalReviewQueueFromStorage,
  savePerspectiveMemoryLocalReviewQueueToStorage,
  updatePerspectiveMemoryLocalReviewQueueItemStatus,
  type PerspectiveMemoryLocalReviewQueueItemV0,
  type PerspectiveMemoryLocalReviewQueueSourceState,
  type PerspectiveMemoryLocalReviewQueueStatus,
  type PerspectiveMemoryLocalReviewQueueV0,
} from "@/lib/perspective-ingest/perspective-memory-local-review-queue";

type QueueFilter =
  | "all"
  | "queued_for_memory_review"
  | "reviewing_locally"
  | "kept_for_later"
  | "removed_from_queue"
  | "stale_or_missing_source";

const initialIso = "1970-01-01T00:00:00.000Z";
const queueFilters: QueueFilter[] = [
  "all",
  "queued_for_memory_review",
  "reviewing_locally",
  "kept_for_later",
  "removed_from_queue",
  "stale_or_missing_source",
];

export function LocalMemoryReviewQueueSurface() {
  const [queue, setQueue] = useState<PerspectiveMemoryLocalReviewQueueV0>(() =>
    createEmptyPerspectiveMemoryLocalReviewQueue(initialIso),
  );
  const [candidateDraftList, setCandidateDraftList] =
    useState<CodexFormerLocalAdapterCandidateDraftListV0>(() =>
      createEmptyCodexFormerLocalAdapterCandidateDraftList(initialIso),
    );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<QueueFilter>("all");
  const [queueStatus, setQueueStatus] = useState(
    "local memory review queue not loaded",
  );

  useEffect(() => {
    const nowIso = new Date().toISOString();
    const loadedQueue = loadPerspectiveMemoryLocalReviewQueueFromStorage(
      window.localStorage,
      nowIso,
    );
    const loadedDraftList =
      loadCodexFormerLocalAdapterCandidateDraftListFromStorage(
        window.localStorage,
        nowIso,
      );
    setQueue(loadedQueue);
    setCandidateDraftList(loadedDraftList.list);
    setSelectedItemId(loadedQueue.items[0]?.queue_item_id ?? null);
    setQueueStatus(
      loadedQueue.items.length > 0
        ? "local memory review queue restored"
        : "no local memory review queue items",
    );
  }, []);

  const itemsWithSourceState = useMemo(
    () =>
      queue.items.map((item) => ({
        item,
        sourceState: getPerspectiveMemoryLocalReviewQueueItemSourceState(
          item,
          candidateDraftList,
        ),
      })),
    [candidateDraftList, queue.items],
  );
  const filteredItems = itemsWithSourceState.filter(({ item, sourceState }) =>
    queueFilterMatches(activeFilter, item, sourceState),
  );
  const selectedItem =
    queue.items.find((item) => item.queue_item_id === selectedItemId) ??
    queue.items[0] ??
    null;
  const selectedSourceState = selectedItem
    ? getPerspectiveMemoryLocalReviewQueueItemSourceState(
        selectedItem,
        candidateDraftList,
      )
    : null;

  function saveQueue(
    nextQueue: PerspectiveMemoryLocalReviewQueueV0,
    nextStatus: string,
  ) {
    setQueue(nextQueue);
    savePerspectiveMemoryLocalReviewQueueToStorage(
      window.localStorage,
      nextQueue,
    );
    setQueueStatus(nextStatus);
  }

  function updateSelectedQueueStatus(
    queueItemStatus: PerspectiveMemoryLocalReviewQueueStatus,
  ) {
    if (!selectedItem) {
      setQueueStatus("select a queue item before updating local review status");
      return;
    }
    const nowIso = new Date().toISOString();
    const nextQueue = updatePerspectiveMemoryLocalReviewQueueItemStatus(
      queue,
      selectedItem.queue_item_id,
      queueItemStatus,
      nowIso,
    );
    saveQueue(nextQueue, `queue item marked ${queueItemStatus}`);
  }

  function clearQueue() {
    const nowIso = new Date().toISOString();
    const nextQueue = createEmptyPerspectiveMemoryLocalReviewQueue(nowIso);
    clearPerspectiveMemoryLocalReviewQueueFromStorage(window.localStorage);
    setSelectedItemId(null);
    setQueue(nextQueue);
    setQueueStatus("local memory review queue cleared");
  }

  return (
    <main
      className={styles.shell}
      data-augnes-surface="perspective-memory-local-review-queue"
      data-augnes-memory-review-queue="local-queue-only"
    >
      <section className={styles.surface}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>Perspective Memory</p>
            <h1>Local Memory Review Queue</h1>
            <p>
              Local queue for Codex candidate drafts that need user review
              before any perspective-memory persistence decision.
            </p>
          </div>
          <div className={styles.boundaryPills} aria-label="Queue boundary">
            <span>local queue only</span>
            <span>not accepted Augnes memory</span>
            <span>not review decision</span>
            <span>not product DB persistence</span>
            <span>not Core decision</span>
            <span>not runtime handoff</span>
            <span>not automatic promotion</span>
          </div>
        </header>

        <section className={styles.statusStrip} aria-label="Queue status">
          <div>
            <span>route</span>
            <strong>{PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE}</strong>
          </div>
          <div>
            <span>queue item count</span>
            <strong>{String(queue.items.length)}</strong>
          </div>
          <div>
            <span>selected item</span>
            <strong>{selectedItem?.queue_item_id ?? "none"}</strong>
          </div>
          <div>
            <span>status</span>
            <strong>{queueStatus}</strong>
          </div>
        </section>

        <div className={styles.grid}>
          <section className={styles.panel} aria-label="Local queue list">
            <PanelHeader
              eyebrow="Queue"
              title="Queued Items"
              detail={PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE}
            />
            <div className={styles.filterRow} aria-label="Queue filters">
              {queueFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={classNames(
                    styles.button,
                    activeFilter === filter ? styles.activeButton : "",
                  )}
                  data-augnes-memory-queue-filter={filter}
                  aria-pressed={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.button}
                data-augnes-clear-local-memory-review-queue="true"
                disabled={queue.items.length === 0}
                onClick={clearQueue}
              >
                Clear queue
              </button>
              <a
                className={styles.linkButton}
                href="/cockpit/perspective/codex-former/local-adapter-operator-flow"
              >
                Back to operator flow
              </a>
            </div>
            {filteredItems.length > 0 ? (
              <div
                className={styles.itemList}
                data-augnes-local-memory-review-queue-list="true"
              >
                {filteredItems.map(({ item, sourceState }) => (
                  <QueueItemListEntry
                    key={item.queue_item_id}
                    item={item}
                    sourceState={sourceState}
                    selected={selectedItem?.queue_item_id === item.queue_item_id}
                    onSelect={() => setSelectedItemId(item.queue_item_id)}
                  />
                ))}
              </div>
            ) : (
              <p className={styles.boundaryText}>
                No queue items match the current filter.
              </p>
            )}
          </section>

          <section className={styles.panel} aria-label="Queue item detail">
            <PanelHeader
              eyebrow="Detail"
              title="Queue Item Detail"
              detail={selectedItem?.queue_status ?? "none"}
            />
            {selectedItem && selectedSourceState ? (
              <>
                <div className={styles.buttonRow}>
                  <button
                    type="button"
                    className={styles.button}
                    data-augnes-mark-reviewing-locally="true"
                    disabled={!selectedItem.review_only_actions.can_mark_reviewing}
                    onClick={() => updateSelectedQueueStatus("reviewing_locally")}
                  >
                    Mark reviewing locally
                  </button>
                  <button
                    type="button"
                    className={styles.button}
                    data-augnes-keep-for-later="true"
                    disabled={!selectedItem.review_only_actions.can_keep_for_later}
                    onClick={() => updateSelectedQueueStatus("kept_for_later")}
                  >
                    Keep for later
                  </button>
                  <button
                    type="button"
                    className={styles.button}
                    data-augnes-remove-from-queue="true"
                    disabled={
                      !selectedItem.review_only_actions.can_remove_from_queue
                    }
                    onClick={() => updateSelectedQueueStatus("removed_from_queue")}
                  >
                    Remove from queue
                  </button>
                  <button
                    type="button"
                    className={styles.button}
                    data-augnes-return-to-candidate-drafts="true"
                    disabled={
                      !selectedItem.review_only_actions
                        .can_return_to_candidate_drafts
                    }
                    onClick={() =>
                      updateSelectedQueueStatus("returned_to_candidate_drafts")
                    }
                  >
                    Return to candidate drafts, local note only
                  </button>
                </div>
                <QueueItemDetail
                  item={selectedItem}
                  sourceState={selectedSourceState}
                />
              </>
            ) : (
              <p className={styles.boundaryText}>
                Select a queue item to inspect its bounded memory candidate
                preview and local review-only controls.
              </p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function QueueItemListEntry({
  item,
  sourceState,
  selected,
  onSelect,
}: {
  item: PerspectiveMemoryLocalReviewQueueItemV0;
  sourceState: PerspectiveMemoryLocalReviewQueueSourceState;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={classNames(styles.itemListEntry, selected ? styles.selectedItem : "")}
      data-augnes-memory-review-queue-item={item.queue_item_id}
      data-augnes-memory-review-queue-status={item.queue_status}
      data-augnes-memory-review-queue-source-state={sourceState}
    >
      <div className={styles.itemHeader}>
        <button
          type="button"
          className={styles.button}
          data-augnes-select-memory-review-queue-item={item.queue_item_id}
          aria-pressed={selected}
          onClick={onSelect}
        >
          Select item
        </button>
        <strong>{item.queue_status}</strong>
        <span>{sourceState}</span>
      </div>
      <dl className={styles.detailGrid}>
        <DetailRow label="queue_item_id" value={item.queue_item_id} />
        <DetailRow
          label="source_candidate_draft_id"
          value={item.source_candidate_draft_id}
        />
        <DetailRow
          label="local_status"
          value={item.source_candidate_local_status}
        />
        <DetailRow
          label="validation_result_state"
          value={item.source_validation_result_state}
        />
        <DetailRow label="warning_count" value={String(item.warning_count)} />
        <DetailRow
          label="pointer_warning_count"
          value={String(item.pointer_warning_count)}
        />
      </dl>
    </article>
  );
}

function QueueItemDetail({
  item,
  sourceState,
}: {
  item: PerspectiveMemoryLocalReviewQueueItemV0;
  sourceState: PerspectiveMemoryLocalReviewQueueSourceState;
}) {
  return (
    <div data-augnes-memory-review-queue-detail="true">
      <dl className={styles.detailGrid}>
        <DetailRow label="queue_item_id" value={item.queue_item_id} />
        <DetailRow label="queue_status" value={item.queue_status} />
        <DetailRow label="stale_state" value={sourceState} />
        <DetailRow
          label="source_candidate_draft_id"
          value={item.source_candidate_draft_id}
        />
        <DetailRow
          label="source_candidate_local_status"
          value={item.source_candidate_local_status}
        />
        <DetailRow
          label="source_candidate_action"
          value={item.source_candidate_action}
        />
        <DetailRow
          label="source_validation_result_state"
          value={item.source_validation_result_state}
        />
        <DetailRow
          label="source_validation_summary_hash"
          value={item.source_validation_summary_hash}
        />
        <DetailRow label="source_input_ref" value={item.source_input_ref} />
        <DetailRow label="source_input_hash" value={item.source_input_hash} />
        <DetailRow
          label="prepare_summary_ref"
          value={item.prepare_summary_ref}
        />
        <DetailRow
          label="prepare_execution_summary_hash"
          value={item.prepare_execution_summary_hash}
        />
        <DetailRow
          label="returned_envelope_hash"
          value={item.returned_envelope_hash}
        />
        <DetailRow label="warning_count" value={String(item.warning_count)} />
        <DetailRow
          label="pointer_warning_count"
          value={String(item.pointer_warning_count)}
        />
        <DetailRow
          label="changed_files_count"
          value={String(item.changed_files_count)}
        />
        <DetailRow label="created_at" value={item.created_at} />
        <DetailRow label="updated_at" value={item.updated_at} />
        <DetailRow
          label="can_create_memory_write"
          value={String(item.review_only_actions.can_create_memory_write)}
        />
        <DetailRow
          label="authority_boundary"
          value={formatQueueAuthorityBoundary(item)}
        />
      </dl>

      <section
        className={styles.preview}
        aria-label="Bounded memory candidate preview"
        data-augnes-memory-candidate-preview="true"
      >
        <PanelHeader
          eyebrow="Preview"
          title="Bounded Memory Candidate Preview"
          detail={item.memory_candidate_preview.preview_version}
        />
        <h3>{item.memory_candidate_preview.title}</h3>
        <p>{item.memory_candidate_preview.summary}</p>
        <ResultList
          title="supporting_refs"
          values={item.memory_candidate_preview.supporting_refs}
        />
        <ResultList
          title="risk_notes"
          values={item.memory_candidate_preview.risk_notes}
        />
        <ResultList
          title="unresolved_tensions"
          values={item.memory_candidate_preview.unresolved_tensions}
        />
        <DetailRow
          label="next_review_action"
          value={item.memory_candidate_preview.next_review_action}
        />
      </section>

      <p className={styles.boundaryText}>
        This queue item is local-only review material: not accepted Augnes
        memory, not review decision, not Core decision, not product DB
        persistence, not runtime handoff, and can_create_memory_write is false.
      </p>
    </div>
  );
}

function queueFilterMatches(
  filter: QueueFilter,
  item: PerspectiveMemoryLocalReviewQueueItemV0,
  sourceState: PerspectiveMemoryLocalReviewQueueSourceState,
) {
  if (filter === "all") return true;
  if (filter === "stale_or_missing_source") {
    return (
      sourceState === "source_candidate_draft_stale" ||
      sourceState === "source_candidate_draft_missing"
    );
  }
  return item.queue_status === filter;
}

function PanelHeader({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <header className={styles.panelHeader}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <div>
        <h2>{title}</h2>
        <span>{detail}</span>
      </div>
    </header>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ResultList({ title, values }: { title: string; values: string[] }) {
  return (
    <div className={styles.resultList}>
      <strong>{title}</strong>
      {values.length > 0 ? (
        <ul>
          {values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      ) : (
        <p>none</p>
      )}
    </div>
  );
}

function formatQueueAuthorityBoundary(
  item: PerspectiveMemoryLocalReviewQueueItemV0,
) {
  return Object.entries(item.authority_boundary)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
