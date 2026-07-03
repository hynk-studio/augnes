"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  PERSPECTIVE_MEMORY_BOUNDARY_REVIEW_INBOX_ROUTE,
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE,
  type PerspectiveMemoryProductPersistenceBoundaryRecordListV0,
  type PerspectiveMemoryProductPersistenceBoundaryRecordV0,
  type PerspectiveMemoryProductPersistenceBoundaryStatus,
} from "@/lib/perspective-ingest/perspective-memory-product-persistence-boundary";
import {
  PERSPECTIVE_MEMORY_ITEM_API_ROUTE,
  PERSPECTIVE_MEMORY_ITEMS_ROUTE,
  canBuildPerspectiveMemoryItemFromBoundaryRecord,
  createEmptyPerspectiveMemoryItemList,
  type PerspectiveMemoryItemListV0,
  type PerspectiveMemoryItemUserConfirmation,
  type PerspectiveMemoryItemV0,
} from "@/lib/perspective-ingest/perspective-memory-item";
import styles from "./memory-boundary-review-inbox-surface.module.css";

const LOCAL_MEMORY_REVIEW_QUEUE_ROUTE =
  "/perspective/memory-review-queue/local";
const OPERATOR_FLOW_ROUTE =
  "/perspective/codex-former/local-adapter-operator-flow";
const allItemConfirmations: Required<PerspectiveMemoryItemUserConfirmation> = {
  user_confirmed_create_persisted_perspective_memory_item: true,
  user_confirmed_not_core_decision: true,
  user_confirmed_no_automatic_runtime_injection: true,
  user_confirmed_source_boundary_record_preserved: true,
};
const emptyItemConfirmations: PerspectiveMemoryItemUserConfirmation = {
  user_confirmed_create_persisted_perspective_memory_item: false,
  user_confirmed_not_core_decision: false,
  user_confirmed_no_automatic_runtime_injection: false,
  user_confirmed_source_boundary_record_preserved: false,
};

const filters = [
  "all",
  "product_persistence_boundary_recorded",
  "locally_reviewing_boundary_record",
  "kept_for_later",
  "retracted_before_memory_write",
  "PASS",
  "PASS with follow-up",
  "has warnings",
  "retracted or kept",
] as const;

type BoundaryInboxFilter = (typeof filters)[number];

const emptyRecordList: PerspectiveMemoryProductPersistenceBoundaryRecordListV0 = {
  boundary_record_list_version:
    "perspective_memory_product_persistence_boundary_record_list.v0.1",
  updated_at: "not_loaded",
  records: [],
};

const emptyItemList: PerspectiveMemoryItemListV0 =
  createEmptyPerspectiveMemoryItemList("not_loaded");

export function MemoryBoundaryReviewInboxSurface() {
  const [recordList, setRecordList] =
    useState<PerspectiveMemoryProductPersistenceBoundaryRecordListV0>(
      emptyRecordList,
    );
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] =
    useState<BoundaryInboxFilter>("all");
  const [loadStatus, setLoadStatus] = useState("records not loaded");
  const [itemList, setItemList] =
    useState<PerspectiveMemoryItemListV0>(emptyItemList);
  const [itemStatus, setItemStatus] = useState("memory items not loaded");
  const [itemConfirmations, setItemConfirmations] =
    useState<PerspectiveMemoryItemUserConfirmation>(emptyItemConfirmations);

  useEffect(() => {
    void loadRecords();
    void loadItems();
  }, []);

  useEffect(() => {
    setItemConfirmations(emptyItemConfirmations);
  }, [selectedRecordId]);

  const filteredRecords = useMemo(
    () => recordList.records.filter((record) => filterRecord(activeFilter, record)),
    [activeFilter, recordList.records],
  );
  const selectedRecord =
    (selectedRecordId
      ? recordList.records.find((record) => record.record_id === selectedRecordId)
      : null) ??
    filteredRecords[0] ??
    recordList.records[0] ??
    null;
  const selectedRecordItem = selectedRecord
    ? itemList.items.find(
        (item) => item.source_boundary_record_id === selectedRecord.record_id,
      ) ?? null
    : null;
  const itemEligibility = selectedRecord
    ? canBuildPerspectiveMemoryItemFromBoundaryRecord({
        boundaryRecord: selectedRecord,
        userConfirmation: allItemConfirmations,
      })
    : {
        eligible: false,
        blocked_reasons: ["select a persisted boundary record"],
      };

  async function loadRecords() {
    setLoadStatus("loading persisted boundary records");
    try {
      const response = await fetch(
        `${PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE}?limit=100`,
        { method: "GET" },
      );
      const body = await response.json();
      if (!response.ok || body?.ok !== true) {
        const reasons = Array.isArray(body?.blocked_reasons)
          ? body.blocked_reasons.join("; ")
          : response.statusText;
        setLoadStatus(`boundary record load blocked: ${reasons}`);
        return;
      }
      const nextList =
        body.result as PerspectiveMemoryProductPersistenceBoundaryRecordListV0;
      setRecordList(nextList);
      setSelectedRecordId((current) => {
        if (current && nextList.records.some((record) => record.record_id === current)) {
          return current;
        }
        return nextList.records[0]?.record_id ?? null;
      });
      setLoadStatus(
        nextList.records.length > 0
          ? "persisted boundary records loaded from sqlite"
          : "no persisted boundary records",
      );
    } catch (error) {
      setLoadStatus(
        `boundary record load failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function loadItems() {
    setItemStatus("loading persisted perspective-memory items");
    try {
      const response = await fetch(`${PERSPECTIVE_MEMORY_ITEM_API_ROUTE}?limit=100`, {
        method: "GET",
      });
      const body = await response.json();
      if (!response.ok || body?.ok !== true) {
        const reasons = Array.isArray(body?.blocked_reasons)
          ? body.blocked_reasons.join("; ")
          : response.statusText;
        setItemStatus(`memory item load blocked: ${reasons}`);
        return;
      }
      const nextList = body.result as PerspectiveMemoryItemListV0;
      setItemList(nextList);
      setItemStatus(
        nextList.items.length > 0
          ? "persisted perspective-memory items loaded from sqlite"
          : "no persisted perspective-memory items",
      );
    } catch (error) {
      setItemStatus(
        `memory item load failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function createMemoryItem() {
    if (!selectedRecord) {
      setItemStatus("select a boundary record before creating a memory item");
      return;
    }
    setItemStatus("creating persisted perspective-memory item");
    try {
      const response = await fetch(PERSPECTIVE_MEMORY_ITEM_API_ROUTE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source_boundary_record_id: selectedRecord.record_id,
          user_confirmation: itemConfirmations,
        }),
      });
      const body = await response.json();
      if (!response.ok || body?.ok !== true) {
        const reasons = Array.isArray(body?.blocked_reasons)
          ? body.blocked_reasons.join("; ")
          : response.statusText;
        setItemStatus(`memory item creation blocked: ${reasons}`);
        return;
      }
      await loadItems();
      const created = body.created === true ? "created" : "already existed";
      setItemStatus(
        `persisted perspective-memory item ${created}: ${body.result.item.item_id}`,
      );
    } catch (error) {
      setItemStatus(
        `memory item creation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  function updateItemConfirmation(
    key: keyof PerspectiveMemoryItemUserConfirmation,
    value: boolean,
  ) {
    setItemConfirmations((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function updateBoundaryStatus(
    status: PerspectiveMemoryProductPersistenceBoundaryStatus,
  ) {
    if (!selectedRecord) {
      setLoadStatus("select a boundary record before updating status");
      return;
    }
    setLoadStatus(`updating boundary record to ${status}`);
    try {
      const response = await fetch(
        `${PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE}/${encodeURIComponent(
          selectedRecord.record_id,
        )}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ boundary_status: status }),
        },
      );
      const body = await response.json();
      if (!response.ok || body?.ok !== true) {
        const reasons = Array.isArray(body?.blocked_reasons)
          ? body.blocked_reasons.join("; ")
          : response.statusText;
        setLoadStatus(`boundary status update blocked: ${reasons}`);
        return;
      }
      await loadRecords();
      setSelectedRecordId(body.result.record.record_id);
      setLoadStatus(`boundary record marked ${status}`);
    } catch (error) {
      setLoadStatus(
        `boundary status update failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return (
    <main
      className={styles.shell}
      data-augnes-surface="perspective-memory-boundary-review-inbox"
      data-augnes-boundary-review-inbox="true"
    >
      <section className={styles.surface}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>Perspective Memory</p>
            <h1>Boundary Review Inbox</h1>
            <p>
              Product-facing inbox for persisted perspective-memory product
              persistence boundary records created from locally-ready write
              proposal checklists.
            </p>
          </div>
          <div className={styles.boundaryPills} aria-label="Boundary policy">
            <span>product persistence boundary records</span>
            <span>not accepted Augnes memory</span>
            <span>not product memory write</span>
            <span>not review decision</span>
            <span>not Core decision</span>
            <span>not runtime handoff</span>
            <span>not automatic promotion</span>
          </div>
        </header>

        <nav className={styles.navRow} aria-label="Boundary inbox navigation">
          <Link
            className={styles.linkButton}
            href={LOCAL_MEMORY_REVIEW_QUEUE_ROUTE}
            data-augnes-boundary-inbox-local-queue-link="true"
          >
            Back to local memory review queue
          </Link>
          <Link
            className={styles.linkButton}
            href={OPERATOR_FLOW_ROUTE}
            data-augnes-boundary-inbox-operator-flow-link="true"
          >
            Open local Codex adapter operator flow
          </Link>
          <button
            type="button"
            className={styles.button}
            data-augnes-boundary-inbox-reload-records="true"
            onClick={() => void loadRecords()}
          >
            Reload persisted boundary records
          </button>
        </nav>

        <section className={styles.statusStrip} aria-label="Inbox status">
          <StatusCell label="route" value={PERSPECTIVE_MEMORY_BOUNDARY_REVIEW_INBOX_ROUTE} />
          <StatusCell label="api_route" value={PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE} />
          <StatusCell label="persistence_backend" value="sqlite:lib/db.ts" />
          <StatusCell label="total_record_count" value={String(recordList.records.length)} />
          <StatusCell label="active_filter" value={activeFilter} />
          <StatusCell label="selected_record_id" value={selectedRecord?.record_id ?? "none"} />
          <StatusCell label="load_status" value={loadStatus} />
          <StatusCell label="memory_item_api_route" value={PERSPECTIVE_MEMORY_ITEM_API_ROUTE} />
          <StatusCell label="total_item_count" value={String(itemList.items.length)} />
          <StatusCell label="selected_record_item_id" value={selectedRecordItem?.item_id ?? "none"} />
        </section>

        <section className={styles.grid}>
          <section
            className={styles.panel}
            aria-label="Persisted boundary record list"
            data-augnes-boundary-inbox-record-list="true"
          >
            <PanelHeader
              eyebrow="Persisted Records"
              title="Boundary Records"
              detail={recordList.boundary_record_list_version}
            />
            <div className={styles.filterRow} aria-label="Boundary inbox filters">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={classNames(
                    styles.button,
                    activeFilter === filter ? styles.activeButton : "",
                  )}
                  data-augnes-boundary-inbox-filter={filter}
                  aria-pressed={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <p className={styles.boundaryText}>
              Showing {filteredRecords.length} of {recordList.records.length} persisted
              product persistence boundary records.
            </p>
            <div className={styles.itemList}>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <article
                    key={record.record_id}
                    className={classNames(
                      styles.itemListEntry,
                      selectedRecord?.record_id === record.record_id
                        ? styles.selectedItem
                        : "",
                    )}
                    data-augnes-boundary-inbox-record={record.record_id}
                    data-augnes-boundary-inbox-record-status={record.boundary_status}
                  >
                    <div className={styles.itemHeader}>
                      <button
                        type="button"
                        className={styles.button}
                        data-augnes-boundary-inbox-select-record={record.record_id}
                        aria-pressed={selectedRecord?.record_id === record.record_id}
                        onClick={() => setSelectedRecordId(record.record_id)}
                      >
                        Select record
                      </button>
                      <strong>{record.boundary_status}</strong>
                    </div>
                    <dl className={styles.detailGrid}>
                      <DetailRow label="record_id" value={record.record_id} />
                      <DetailRow
                        label="source_validation_result_state"
                        value={record.source_validation_result_state}
                      />
                      <DetailRow
                        label="warning_risk_indicator"
                        value={recordRiskIndicator(record)}
                      />
                      <DetailRow
                        label="source_checklist_id"
                        value={record.source_checklist_id}
                      />
                      <DetailRow
                        label="source_proposal_id"
                        value={record.source_proposal_id}
                      />
                      <DetailRow
                        label="source_queue_item_id"
                        value={record.source_queue_item_id}
                      />
                      <DetailRow
                        label="source_candidate_draft_id"
                        value={record.source_candidate_draft_id}
                      />
                      <DetailRow
                        label="returned_envelope_hash"
                        value={record.returned_envelope_hash}
                      />
                      <DetailRow label="created_at" value={record.created_at} />
                      <DetailRow label="updated_at" value={record.updated_at} />
                      <DetailRow
                        label="authority_boundary"
                        value={formatAuthorityBoundarySummary(record)}
                      />
                    </dl>
                  </article>
                ))
              ) : (
                <p className={styles.boundaryText}>
                  No persisted boundary records match the selected filter.
                </p>
              )}
            </div>
          </section>

          <BoundaryRecordDetail
            record={selectedRecord}
            onUpdateBoundaryStatus={(status) => void updateBoundaryStatus(status)}
            itemForRecord={selectedRecordItem}
            itemList={itemList}
            itemEligibility={itemEligibility}
            itemStatus={itemStatus}
            itemConfirmations={itemConfirmations}
            onItemConfirmationChange={updateItemConfirmation}
            onCreateMemoryItem={() => void createMemoryItem()}
            onReloadMemoryItems={() => void loadItems()}
          />
        </section>
      </section>
    </main>
  );
}

function BoundaryRecordDetail({
  record,
  onUpdateBoundaryStatus,
  itemForRecord,
  itemList,
  itemEligibility,
  itemStatus,
  itemConfirmations,
  onItemConfirmationChange,
  onCreateMemoryItem,
  onReloadMemoryItems,
}: {
  record: PerspectiveMemoryProductPersistenceBoundaryRecordV0 | null;
  onUpdateBoundaryStatus: (
    status: PerspectiveMemoryProductPersistenceBoundaryStatus,
  ) => void;
  itemForRecord: PerspectiveMemoryItemV0 | null;
  itemList: PerspectiveMemoryItemListV0;
  itemEligibility: { eligible: boolean; blocked_reasons: string[] };
  itemStatus: string;
  itemConfirmations: PerspectiveMemoryItemUserConfirmation;
  onItemConfirmationChange: (
    key: keyof PerspectiveMemoryItemUserConfirmation,
    value: boolean,
  ) => void;
  onCreateMemoryItem: () => void;
  onReloadMemoryItems: () => void;
}) {
  if (!record) {
    return (
      <section
        className={styles.panel}
        aria-label="Boundary record detail"
        data-augnes-boundary-inbox-record-detail="true"
      >
        <PanelHeader
          eyebrow="Record Detail"
          title="No Boundary Record Selected"
          detail="select a persisted record"
        />
        <p className={styles.boundaryText}>
          Persisted boundary records are loaded from the same-origin API and
          SQLite product store, not from localStorage.
        </p>
        <PerspectiveMemoryItemPanel
          record={null}
          itemForRecord={null}
          itemList={itemList}
          itemEligibility={itemEligibility}
          itemStatus={itemStatus}
          itemConfirmations={itemConfirmations}
          onItemConfirmationChange={onItemConfirmationChange}
          onCreateMemoryItem={onCreateMemoryItem}
          onReloadMemoryItems={onReloadMemoryItems}
        />
      </section>
    );
  }

  return (
    <section
      className={styles.panel}
      aria-label="Boundary record detail"
      data-augnes-boundary-inbox-record-detail="true"
    >
      <PanelHeader
        eyebrow="Record Detail"
        title="Product Persistence Boundary Detail"
        detail={record.record_version}
      />
      <p className={styles.boundaryText}>
        Boundary status controls update only `boundary_status`. Actual memory
        write requires a future product decision and is not available here.
      </p>
      <div className={styles.buttonRow} aria-label="Boundary status controls">
        <button
          type="button"
          className={styles.button}
          data-augnes-boundary-inbox-status-reviewing="true"
          onClick={() => onUpdateBoundaryStatus("locally_reviewing_boundary_record")}
        >
          Mark locally reviewing boundary record
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-boundary-inbox-status-kept-for-later="true"
          onClick={() => onUpdateBoundaryStatus("kept_for_later")}
        >
          Keep boundary for later
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-boundary-inbox-status-retracted="true"
          onClick={() => onUpdateBoundaryStatus("retracted_before_memory_write")}
        >
          Retract before memory write
        </button>
      </div>

      <section className={styles.policyBox} aria-label="Unavailable actions">
        <strong>Unavailable actions</strong>
        <p>
          Write to memory, Commit memory, Accept memory, Create accepted memory,
          Send to Core, Create Core decision, Auto promote, Deploy, and Runtime
          handoff are unavailable from this inbox.
        </p>
      </section>

      <dl className={styles.detailGrid}>
        <DetailRow label="record_id" value={record.record_id} />
        <DetailRow label="record_version" value={record.record_version} />
        <DetailRow label="boundary_status" value={record.boundary_status} />
        <DetailRow label="source_checklist_id" value={record.source_checklist_id} />
        <DetailRow label="source_proposal_id" value={record.source_proposal_id} />
        <DetailRow label="source_queue_item_id" value={record.source_queue_item_id} />
        <DetailRow
          label="source_candidate_draft_id"
          value={record.source_candidate_draft_id}
        />
        <DetailRow
          label="source_validation_result_state"
          value={record.source_validation_result_state}
        />
        <DetailRow
          label="source_validation_summary_hash"
          value={record.source_validation_summary_hash}
        />
        <DetailRow label="source_input_ref" value={record.source_input_ref} />
        <DetailRow label="source_input_hash" value={record.source_input_hash} />
        <DetailRow label="prepare_summary_ref" value={record.prepare_summary_ref} />
        <DetailRow
          label="prepare_execution_summary_hash"
          value={record.prepare_execution_summary_hash}
        />
        <DetailRow
          label="returned_envelope_hash"
          value={record.returned_envelope_hash}
        />
        <DetailRow label="source_proposal_hash" value={record.source_proposal_hash} />
        <DetailRow
          label="checklist_ready_for_product_persistence_review"
          value={String(record.checklist_ready_for_product_persistence_review)}
        />
        <DetailRow
          label="checklist_ready_for_memory_write_now"
          value={String(record.checklist_ready_for_memory_write_now)}
        />
        <DetailRow
          label="can_create_accepted_memory"
          value={String(record.next_allowed_actions.can_create_accepted_memory)}
        />
        <DetailRow
          label="can_create_core_decision"
          value={String(record.next_allowed_actions.can_create_core_decision)}
        />
        <DetailRow
          label="can_auto_promote"
          value={String(record.next_allowed_actions.can_auto_promote)}
        />
        <DetailRow
          label="product_memory_write_created"
          value={String(record.authority_boundary.product_memory_write_created)}
        />
        <DetailRow
          label="accepted_augnes_memory_created"
          value={String(record.authority_boundary.accepted_augnes_memory_created)}
        />
        <DetailRow label="created_at" value={record.created_at} />
        <DetailRow label="updated_at" value={record.updated_at} />
        <DetailRow
          label="user_confirmation"
          value={formatUserConfirmation(record)}
        />
        <DetailRow
          label="next_allowed_actions"
          value={formatNextAllowedActions(record)}
        />
        <DetailRow
          label="authority_boundary"
          value={formatFullAuthorityBoundary(record)}
        />
        <DetailRow
          label="local_review_notes"
          value={record.local_review_notes || "none"}
        />
      </dl>

      <section
        className={styles.preview}
        aria-label="Proposed memory payload"
        data-augnes-boundary-inbox-proposed-memory-payload="true"
      >
        <PanelHeader
          eyebrow="Payload Preview"
          title="Proposed Memory Payload"
          detail={record.proposed_memory_payload.payload_version}
        />
        <dl className={styles.detailGrid}>
          <DetailRow label="title" value={record.proposed_memory_payload.title} />
          <DetailRow
            label="summary"
            value={record.proposed_memory_payload.summary}
          />
          <DetailRow
            label="memory_kind"
            value={record.proposed_memory_payload.memory_kind}
          />
          <DetailRow
            label="suggested_next_review_action"
            value={record.proposed_memory_payload.suggested_next_review_action}
          />
          <DetailRow
            label="should_write_to_memory_now"
            value={String(
              record.proposed_memory_payload.should_write_to_memory_now,
            )}
          />
        </dl>
        <ResultList title="source_refs" values={record.proposed_memory_payload.source_refs} />
        <ResultList
          title="evidence_refs"
          values={record.proposed_memory_payload.evidence_refs}
        />
        <ResultList title="risk_notes" values={record.proposed_memory_payload.risk_notes} />
        <ResultList
          title="unresolved_tensions"
          values={record.proposed_memory_payload.unresolved_tensions}
        />
        <ResultList
          title="carry_forward_questions"
          values={record.proposed_memory_payload.carry_forward_questions}
        />
      </section>

      <section
        className={styles.preview}
        aria-label="Proposal diff summary"
        data-augnes-boundary-inbox-proposal-diff-summary="true"
      >
        <PanelHeader
          eyebrow="Diff Summary"
          title="Proposal Diff Summary"
          detail="raw material excluded"
        />
        <ResultList
          title="included_from_queue_item"
          values={record.proposal_diff_summary.included_from_queue_item}
        />
        <ResultList
          title="excluded_from_queue_item"
          values={record.proposal_diff_summary.excluded_from_queue_item}
        />
        <ResultList
          title="excluded_raw_material"
          values={record.proposal_diff_summary.excluded_raw_material}
        />
        <ResultList
          title="authority_boundary_notes"
          values={record.proposal_diff_summary.authority_boundary_notes}
        />
      </section>

      <section
        className={styles.preview}
        aria-label="Checklist gate summary"
        data-augnes-boundary-inbox-checklist-gate-summary="true"
      >
        <PanelHeader
          eyebrow="Checklist Snapshot"
          title="Checklist Gate Summary"
          detail="persisted boundary snapshot"
        />
        <dl className={styles.detailGrid}>
          <DetailRow
            label="required_gate_count"
            value={String(record.checklist_gate_summary.required_gate_count)}
          />
          <DetailRow
            label="completed_required_gate_count"
            value={String(
              record.checklist_gate_summary.completed_required_gate_count,
            )}
          />
          <DetailRow
            label="optional_gate_count"
            value={String(record.checklist_gate_summary.optional_gate_count)}
          />
          <DetailRow
            label="completed_optional_gate_count"
            value={String(
              record.checklist_gate_summary.completed_optional_gate_count,
            )}
          />
        </dl>
        <ResultList
          title="checked_required_gates"
          values={record.checklist_gate_summary.checked_required_gates}
        />
        <ResultList
          title="not_applicable_gates"
          values={record.checklist_gate_summary.not_applicable_gates}
        />
        <ResultList
          title="blocked_gates"
          values={record.checklist_gate_summary.blocked_gates}
        />
      </section>

      <PerspectiveMemoryItemPanel
        record={record}
        itemForRecord={itemForRecord}
        itemList={itemList}
        itemEligibility={itemEligibility}
        itemStatus={itemStatus}
        itemConfirmations={itemConfirmations}
        onItemConfirmationChange={onItemConfirmationChange}
        onCreateMemoryItem={onCreateMemoryItem}
        onReloadMemoryItems={onReloadMemoryItems}
      />
    </section>
  );
}

function PerspectiveMemoryItemPanel({
  record,
  itemForRecord,
  itemList,
  itemEligibility,
  itemStatus,
  itemConfirmations,
  onItemConfirmationChange,
  onCreateMemoryItem,
  onReloadMemoryItems,
}: {
  record: PerspectiveMemoryProductPersistenceBoundaryRecordV0 | null;
  itemForRecord: PerspectiveMemoryItemV0 | null;
  itemList: PerspectiveMemoryItemListV0;
  itemEligibility: { eligible: boolean; blocked_reasons: string[] };
  itemStatus: string;
  itemConfirmations: PerspectiveMemoryItemUserConfirmation;
  onItemConfirmationChange: (
    key: keyof PerspectiveMemoryItemUserConfirmation,
    value: boolean,
  ) => void;
  onCreateMemoryItem: () => void;
  onReloadMemoryItems: () => void;
}) {
  const confirmationsComplete =
    itemConfirmations.user_confirmed_create_persisted_perspective_memory_item ===
      true &&
    itemConfirmations.user_confirmed_not_core_decision === true &&
    itemConfirmations.user_confirmed_no_automatic_runtime_injection === true &&
    itemConfirmations.user_confirmed_source_boundary_record_preserved === true;
  const canCreate =
    record != null &&
    itemForRecord == null &&
    itemEligibility.eligible &&
    confirmationsComplete;
  return (
    <section
      className={styles.preview}
      aria-label="Perspective memory item creation"
      data-augnes-perspective-memory-item-panel="true"
    >
      <PanelHeader
        eyebrow="Perspective Memory Item"
        title="Create Persisted Perspective-Memory Item"
        detail="sqlite product memory item"
      />
      <p className={styles.boundaryText}>
        This creates a persisted perspective-memory item from the selected
        product persistence boundary record. It is not a Core decision, not Core
        memory, and not automatic runtime context injection.
      </p>
      <dl className={styles.detailGrid}>
        <DetailRow label="memory_item_api_route" value={PERSPECTIVE_MEMORY_ITEM_API_ROUTE} />
        <DetailRow label="memory_items_route" value={PERSPECTIVE_MEMORY_ITEMS_ROUTE} />
        <DetailRow label="persistence_backend" value="sqlite:lib/db.ts" />
        <DetailRow label="selected_boundary_record_id" value={record?.record_id ?? "none"} />
        <DetailRow label="memory_item_eligible" value={String(itemEligibility.eligible)} />
        <DetailRow label="selected_boundary_already_has_item" value={String(itemForRecord != null)} />
        <DetailRow label="persisted_memory_item_count" value={String(itemList.items.length)} />
        <DetailRow label="memory_item_status_note" value={itemStatus} />
      </dl>
      {!itemEligibility.eligible ? (
        <ResultList
          title="memory_item_blocked_reasons"
          values={itemEligibility.blocked_reasons}
        />
      ) : null}
      <section
        className={styles.confirmationBox}
        aria-label="Perspective memory item confirmations"
        data-augnes-perspective-memory-item-confirmations="true"
      >
        <label className={styles.gateItem}>
          <input
            type="checkbox"
            data-augnes-memory-item-confirm-create="true"
            checked={
              itemConfirmations
                .user_confirmed_create_persisted_perspective_memory_item ===
              true
            }
            onChange={(event) =>
              onItemConfirmationChange(
                "user_confirmed_create_persisted_perspective_memory_item",
                event.currentTarget.checked,
              )
            }
          />
          <span>
            I understand this creates a persisted perspective-memory item
          </span>
        </label>
        <label className={styles.gateItem}>
          <input
            type="checkbox"
            data-augnes-memory-item-confirm-not-core-decision="true"
            checked={itemConfirmations.user_confirmed_not_core_decision === true}
            onChange={(event) =>
              onItemConfirmationChange(
                "user_confirmed_not_core_decision",
                event.currentTarget.checked,
              )
            }
          />
          <span>I understand this is not a Core decision</span>
        </label>
        <label className={styles.gateItem}>
          <input
            type="checkbox"
            data-augnes-memory-item-confirm-no-runtime-injection="true"
            checked={
              itemConfirmations
                .user_confirmed_no_automatic_runtime_injection === true
            }
            onChange={(event) =>
              onItemConfirmationChange(
                "user_confirmed_no_automatic_runtime_injection",
                event.currentTarget.checked,
              )
            }
          />
          <span>
            I understand this will not be automatically injected into runtime
            context
          </span>
        </label>
        <label className={styles.gateItem}>
          <input
            type="checkbox"
            data-augnes-memory-item-confirm-source-preserved="true"
            checked={
              itemConfirmations
                .user_confirmed_source_boundary_record_preserved === true
            }
            onChange={(event) =>
              onItemConfirmationChange(
                "user_confirmed_source_boundary_record_preserved",
                event.currentTarget.checked,
              )
            }
          />
          <span>I understand the source boundary record will be preserved</span>
        </label>
      </section>
      <div className={styles.buttonRow}>
        <button
          type="button"
          className={styles.button}
          data-augnes-create-perspective-memory-item="true"
          disabled={!canCreate}
          onClick={onCreateMemoryItem}
        >
          Create persisted perspective-memory item
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-reload-perspective-memory-items="true"
          onClick={onReloadMemoryItems}
        >
          Reload memory items
        </button>
        <Link
          className={styles.linkButton}
          href={PERSPECTIVE_MEMORY_ITEMS_ROUTE}
          data-augnes-open-perspective-memory-items-dashboard="true"
        >
          Open perspective-memory items dashboard
        </Link>
      </div>

      {itemForRecord ? (
        <section
          className={styles.preview}
          aria-label="Perspective memory item summary"
          data-augnes-perspective-memory-item-summary="true"
        >
          <PanelHeader
            eyebrow="Created Item"
            title="Persisted Perspective-Memory Item"
            detail={itemForRecord.item_version}
          />
          <dl className={styles.detailGrid}>
            <DetailRow label="item_id" value={itemForRecord.item_id} />
            <DetailRow label="item_status" value={itemForRecord.item_status} />
            <DetailRow label="memory_kind" value={itemForRecord.memory_kind} />
            <DetailRow label="content_title" value={itemForRecord.content.title} />
            <DetailRow
              label="content_summary"
              value={itemForRecord.content.summary}
            />
            <DetailRow
              label="authority_boundary"
              value={formatItemAuthorityBoundary(itemForRecord)}
            />
          </dl>
        </section>
      ) : null}
    </section>
  );
}

function filterRecord(
  filter: BoundaryInboxFilter,
  record: PerspectiveMemoryProductPersistenceBoundaryRecordV0,
) {
  if (filter === "all") return true;
  if (
    filter === "product_persistence_boundary_recorded" ||
    filter === "locally_reviewing_boundary_record" ||
    filter === "kept_for_later" ||
    filter === "retracted_before_memory_write"
  ) {
    return record.boundary_status === filter;
  }
  if (filter === "PASS" || filter === "PASS with follow-up") {
    return record.source_validation_result_state === filter;
  }
  if (filter === "has warnings") return hasWarnings(record);
  if (filter === "retracted or kept") {
    return (
      record.boundary_status === "retracted_before_memory_write" ||
      record.boundary_status === "kept_for_later"
    );
  }
  return true;
}

function hasWarnings(record: PerspectiveMemoryProductPersistenceBoundaryRecordV0) {
  return record.proposed_memory_payload.risk_notes.some((note) => {
    const normalized = note.toLowerCase();
    if (normalized.includes("pass with follow-up")) return true;
    if (normalized.includes("warning") && !normalized.startsWith("0 ")) {
      return true;
    }
    if (normalized.includes("pointer") && !normalized.startsWith("0 ")) {
      return true;
    }
    return false;
  });
}

function recordRiskIndicator(
  record: PerspectiveMemoryProductPersistenceBoundaryRecordV0,
) {
  if (record.source_validation_result_state === "PASS with follow-up") {
    return "PASS with follow-up caveat";
  }
  return hasWarnings(record) ? "warnings present" : "no warning caveat";
}

function formatAuthorityBoundarySummary(
  record: PerspectiveMemoryProductPersistenceBoundaryRecordV0,
) {
  return [
    `accepted_augnes_memory_created: ${record.authority_boundary.accepted_augnes_memory_created}`,
    `product_memory_write_created: ${record.authority_boundary.product_memory_write_created}`,
    `review_decision_created: ${record.authority_boundary.review_decision_created}`,
    `core_decision_created: ${record.authority_boundary.core_decision_created}`,
    `automatic_promotion: ${record.authority_boundary.automatic_promotion}`,
  ].join("; ");
}

function formatFullAuthorityBoundary(
  record: PerspectiveMemoryProductPersistenceBoundaryRecordV0,
) {
  return Object.entries(record.authority_boundary)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
}

function formatNextAllowedActions(
  record: PerspectiveMemoryProductPersistenceBoundaryRecordV0,
) {
  return Object.entries(record.next_allowed_actions)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
}

function formatUserConfirmation(
  record: PerspectiveMemoryProductPersistenceBoundaryRecordV0,
) {
  return Object.entries(record.user_confirmation)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
}

function formatItemAuthorityBoundary(item: PerspectiveMemoryItemV0) {
  return Object.entries(item.authority_boundary)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
}

function StatusCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
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
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <span>{detail}</span>
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
    <section className={styles.resultList}>
      <h3>{title}</h3>
      {values.length > 0 ? (
        <ul>
          {values.map((value, index) => (
            <li key={`${title}:${index}`}>{value}</li>
          ))}
        </ul>
      ) : (
        <p>none</p>
      )}
    </section>
  );
}

function classNames(...values: string[]) {
  return values.filter(Boolean).join(" ");
}
