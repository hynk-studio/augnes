"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  PERSPECTIVE_MEMORY_ITEM_API_ROUTE,
  PERSPECTIVE_MEMORY_ITEMS_ROUTE,
  createEmptyPerspectiveMemoryItemList,
  type PerspectiveMemoryItemListV0,
  type PerspectiveMemoryItemStatus,
  type PerspectiveMemoryItemV0,
} from "@/lib/perspective-ingest/perspective-memory-item";
import {
  PERSPECTIVE_MEMORY_ITEM_SEARCH_ROUTE,
} from "@/lib/perspective-ingest/perspective-memory-item-search";
import {
  PERSPECTIVE_MEMORY_ITEM_REVIEW_WORKSPACE_ROUTE,
} from "@/lib/perspective-ingest/perspective-memory-item-review-workspace";
import styles from "./perspective-memory-items-surface.module.css";

const BOUNDARY_INBOX_ROUTE =
  "/cockpit/perspective/memory-boundary-review-inbox";
const LOCAL_MEMORY_REVIEW_QUEUE_ROUTE =
  "/cockpit/perspective/memory-review-queue/local";
const OPERATOR_FLOW_ROUTE =
  "/cockpit/perspective/codex-former/local-adapter-operator-flow";

const itemFilters = [
  "all",
  "accepted",
  "reviewing",
  "retracted",
  "superseded",
  "deprecated",
  "PASS",
  "PASS with follow-up",
  "has warnings",
  "active-ish",
  "inactive-ish",
] as const;

type MemoryItemFilter = (typeof itemFilters)[number];

const emptyItemList = createEmptyPerspectiveMemoryItemList("not_loaded");

export function PerspectiveMemoryItemsSurface() {
  const [itemList, setItemList] =
    useState<PerspectiveMemoryItemListV0>(emptyItemList);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] =
    useState<MemoryItemFilter>("all");
  const [loadStatus, setLoadStatus] = useState("items not loaded");

  useEffect(() => {
    void loadItems();
  }, []);

  const filteredItems = useMemo(
    () => itemList.items.filter((item) => filterItem(activeFilter, item)),
    [activeFilter, itemList.items],
  );
  const selectedItem =
    (selectedItemId
      ? itemList.items.find((item) => item.item_id === selectedItemId)
      : null) ??
    filteredItems[0] ??
    itemList.items[0] ??
    null;

  async function loadItems() {
    setLoadStatus("loading persisted perspective-memory items");
    try {
      const response = await fetch(`${PERSPECTIVE_MEMORY_ITEM_API_ROUTE}?limit=100`, {
        method: "GET",
      });
      const body = await response.json();
      if (!response.ok || body?.ok !== true) {
        const reasons = Array.isArray(body?.blocked_reasons)
          ? body.blocked_reasons.join("; ")
          : response.statusText;
        setLoadStatus(`memory item load blocked: ${reasons}`);
        return;
      }
      const nextList = body.result as PerspectiveMemoryItemListV0;
      setItemList(nextList);
      setSelectedItemId((current) => {
        if (current && nextList.items.some((item) => item.item_id === current)) {
          return current;
        }
        return nextList.items[0]?.item_id ?? null;
      });
      setLoadStatus(
        nextList.items.length > 0
          ? "persisted perspective-memory items loaded from sqlite"
          : "no persisted perspective-memory items",
      );
    } catch (error) {
      setLoadStatus(
        `memory item load failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function updateItemStatus(status: PerspectiveMemoryItemStatus) {
    if (!selectedItem) {
      setLoadStatus("select a perspective-memory item before updating status");
      return;
    }
    setLoadStatus(`updating perspective-memory item to ${status}`);
    try {
      const response = await fetch(
        `${PERSPECTIVE_MEMORY_ITEM_API_ROUTE}/${encodeURIComponent(
          selectedItem.item_id,
        )}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ item_status: status }),
        },
      );
      const body = await response.json();
      if (!response.ok || body?.ok !== true) {
        const reasons = Array.isArray(body?.blocked_reasons)
          ? body.blocked_reasons.join("; ")
          : response.statusText;
        setLoadStatus(`memory item status update blocked: ${reasons}`);
        return;
      }
      await loadItems();
      setSelectedItemId(body.result.item.item_id);
      setLoadStatus(`perspective-memory item marked ${status}`);
    } catch (error) {
      setLoadStatus(
        `memory item status update failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return (
    <main
      className={styles.shell}
      data-augnes-surface="perspective-memory-items"
      data-augnes-perspective-memory-items-dashboard="true"
    >
      <section className={styles.surface}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>Perspective Memory</p>
            <h1>Perspective-Memory Items</h1>
            <p>
              Product-facing dashboard for persisted perspective-memory items
              created from reviewed product persistence boundary records.
            </p>
          </div>
          <div className={styles.boundaryPills} aria-label="Item boundary">
            <span>product-level durable memory items</span>
            <span>not Core memory</span>
            <span>not Core decision</span>
            <span>not automatic runtime injection</span>
            <span>not automatic promotion</span>
            <span>not provider/model generated</span>
            <span>not GitHub mutation</span>
          </div>
        </header>

        <nav className={styles.navRow} aria-label="Perspective-memory item navigation">
          <Link
            className={styles.linkButton}
            href={PERSPECTIVE_MEMORY_ITEM_SEARCH_ROUTE}
            data-augnes-memory-items-search-link="true"
          >
            Search persisted perspective-memory items
          </Link>
          <Link
            className={styles.linkButton}
            href={PERSPECTIVE_MEMORY_ITEM_REVIEW_WORKSPACE_ROUTE}
            data-augnes-memory-items-review-workspace-link="true"
          >
            Review selected perspective-memory items
          </Link>
          <Link
            className={styles.linkButton}
            href={BOUNDARY_INBOX_ROUTE}
            data-augnes-memory-items-boundary-inbox-link="true"
          >
            Back to boundary review inbox
          </Link>
          <Link
            className={styles.linkButton}
            href={LOCAL_MEMORY_REVIEW_QUEUE_ROUTE}
            data-augnes-memory-items-local-queue-link="true"
          >
            Back to local memory review queue
          </Link>
          <Link
            className={styles.linkButton}
            href={OPERATOR_FLOW_ROUTE}
            data-augnes-memory-items-operator-flow-link="true"
          >
            Open local Codex adapter operator flow
          </Link>
          <button
            type="button"
            className={styles.button}
            data-augnes-memory-items-reload="true"
            onClick={() => void loadItems()}
          >
            Reload persisted perspective-memory items
          </button>
        </nav>

        <section className={styles.statusStrip} aria-label="Perspective-memory item status">
          <StatusCell label="route" value={PERSPECTIVE_MEMORY_ITEMS_ROUTE} />
          <StatusCell label="api_route" value={PERSPECTIVE_MEMORY_ITEM_API_ROUTE} />
          <StatusCell label="persistence_backend" value="sqlite:lib/db.ts" />
          <StatusCell label="total_item_count" value={String(itemList.items.length)} />
          <StatusCell label="selected_item_id" value={selectedItem?.item_id ?? "none"} />
          <StatusCell label="active_filter" value={activeFilter} />
          <StatusCell label="load_status" value={loadStatus} />
        </section>

        <section className={styles.grid}>
          <section
            className={styles.panel}
            aria-label="Persisted perspective-memory item list"
            data-augnes-perspective-memory-item-list="true"
          >
            <PanelHeader
              eyebrow="Persisted Items"
              title="Perspective-Memory Items"
              detail={itemList.item_list_version}
            />
            <div className={styles.filterRow} aria-label="Perspective-memory item filters">
              {itemFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={classNames(
                    styles.button,
                    activeFilter === filter ? styles.activeButton : "",
                  )}
                  data-augnes-memory-item-filter={filter}
                  aria-pressed={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <p className={styles.boundaryText}>
              Showing {filteredItems.length} of {itemList.items.length} persisted
              perspective-memory items.
            </p>
            <div className={styles.itemList}>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <article
                    key={item.item_id}
                    className={classNames(
                      styles.itemListEntry,
                      selectedItem?.item_id === item.item_id
                        ? styles.selectedItem
                        : "",
                    )}
                    data-augnes-perspective-memory-item={item.item_id}
                    data-augnes-perspective-memory-item-status={item.item_status}
                  >
                    <div className={styles.itemHeader}>
                      <button
                        type="button"
                        className={styles.button}
                        data-augnes-select-perspective-memory-item={item.item_id}
                        aria-pressed={selectedItem?.item_id === item.item_id}
                        onClick={() => setSelectedItemId(item.item_id)}
                      >
                        Select item
                      </button>
                      <strong>{item.item_status}</strong>
                    </div>
                    <dl className={styles.detailGrid}>
                      <DetailRow label="item_id" value={item.item_id} />
                      <DetailRow label="memory_kind" value={item.memory_kind} />
                      <DetailRow
                        label="source_boundary_record_id"
                        value={item.source_boundary_record_id}
                      />
                      <DetailRow
                        label="source_validation_result_state"
                        value={item.source_validation_result_state}
                      />
                      <DetailRow label="item_title" value={item.content.title} />
                      <DetailRow
                        label="risk_indicator"
                        value={itemRiskIndicator(item)}
                      />
                      <DetailRow label="created_at" value={item.created_at} />
                      <DetailRow label="updated_at" value={item.updated_at} />
                      <DetailRow
                        label="authority_summary"
                        value={formatAuthoritySummary(item)}
                      />
                    </dl>
                  </article>
                ))
              ) : (
                <p className={styles.boundaryText}>
                  No persisted perspective-memory items match the selected filter.
                </p>
              )}
            </div>
          </section>

          <PerspectiveMemoryItemDetail
            item={selectedItem}
            onUpdateItemStatus={(status) => void updateItemStatus(status)}
          />
        </section>
      </section>
    </main>
  );
}

function PerspectiveMemoryItemDetail({
  item,
  onUpdateItemStatus,
}: {
  item: PerspectiveMemoryItemV0 | null;
  onUpdateItemStatus: (status: PerspectiveMemoryItemStatus) => void;
}) {
  if (!item) {
    return (
      <section
        className={styles.panel}
        aria-label="Perspective-memory item detail"
        data-augnes-perspective-memory-item-detail="true"
      >
        <PanelHeader
          eyebrow="Item Detail"
          title="No Perspective-Memory Item Selected"
          detail="select a persisted item"
        />
        <p className={styles.boundaryText}>
          Persisted perspective-memory items are loaded from the same-origin API
          and SQLite product store, not from localStorage.
        </p>
      </section>
    );
  }

  return (
    <section
      className={styles.panel}
      aria-label="Perspective-memory item detail"
      data-augnes-perspective-memory-item-detail="true"
    >
      <PanelHeader
        eyebrow="Item Detail"
        title="Persisted Perspective-Memory Item Detail"
        detail={item.item_version}
      />
      <Link
        className={styles.linkButton}
        href={`${PERSPECTIVE_MEMORY_ITEM_REVIEW_WORKSPACE_ROUTE}?item_ids=${encodeURIComponent(
          item.item_id,
        )}`}
        data-augnes-memory-items-review-selected-item-link="true"
      >
        Open selected item in review workspace
      </Link>
      <p className={styles.boundaryText}>
        Item status controls update only `item_status`. Send to Core, Create Core
        decision, Auto inject into runtime, Auto promote, Provider/model enrich,
        GitHub mutation, Commit state entry, and Deploy are unavailable here.
      </p>
      <div className={styles.buttonRow} aria-label="Perspective-memory item status controls">
        <button
          type="button"
          className={styles.button}
          data-augnes-memory-item-status-accepted="true"
          onClick={() => onUpdateItemStatus("accepted")}
        >
          Mark item accepted
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-memory-item-status-reviewing="true"
          onClick={() => onUpdateItemStatus("reviewing")}
        >
          Mark item reviewing
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-memory-item-status-retracted="true"
          onClick={() => onUpdateItemStatus("retracted")}
        >
          Retract item
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-memory-item-status-superseded="true"
          onClick={() => onUpdateItemStatus("superseded")}
        >
          Mark item superseded
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-memory-item-status-deprecated="true"
          onClick={() => onUpdateItemStatus("deprecated")}
        >
          Mark item deprecated
        </button>
      </div>

      <section className={styles.policyBox} aria-label="Unavailable memory item actions">
        <strong>Unavailable actions</strong>
        <p>
          Send to Core, Create Core decision, Auto inject into runtime, Auto
          promote, Provider/model enrich, GitHub mutation, Commit state entry,
          and Deploy are unavailable from this dashboard.
        </p>
      </section>

      <dl className={styles.detailGrid}>
        <DetailRow label="item_id" value={item.item_id} />
        <DetailRow label="item_version" value={item.item_version} />
        <DetailRow label="item_status" value={item.item_status} />
        <DetailRow label="memory_kind" value={item.memory_kind} />
        <DetailRow
          label="source_boundary_record_id"
          value={item.source_boundary_record_id}
        />
        <DetailRow label="source_checklist_id" value={item.source_checklist_id} />
        <DetailRow label="source_proposal_id" value={item.source_proposal_id} />
        <DetailRow label="source_queue_item_id" value={item.source_queue_item_id} />
        <DetailRow
          label="source_candidate_draft_id"
          value={item.source_candidate_draft_id}
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
        <DetailRow label="prepare_summary_ref" value={item.prepare_summary_ref} />
        <DetailRow
          label="prepare_execution_summary_hash"
          value={item.prepare_execution_summary_hash}
        />
        <DetailRow
          label="returned_envelope_hash"
          value={item.returned_envelope_hash}
        />
        <DetailRow label="source_proposal_hash" value={item.source_proposal_hash} />
        <DetailRow label="created_at" value={item.created_at} />
        <DetailRow label="updated_at" value={item.updated_at} />
      </dl>

      <section
        className={styles.preview}
        aria-label="Perspective-memory item content"
        data-augnes-perspective-memory-item-content="true"
      >
        <PanelHeader
          eyebrow="Content"
          title="Content Preview"
          detail={item.content.content_version}
        />
        <dl className={styles.detailGrid}>
          <DetailRow label="title" value={item.content.title} />
          <DetailRow label="summary" value={item.content.summary} />
          <DetailRow
            label="suggested_next_review_action"
            value={item.content.suggested_next_review_action}
          />
        </dl>
        <ResultList title="source_refs" values={item.content.source_refs} />
        <ResultList title="evidence_refs" values={item.content.evidence_refs} />
        <ResultList title="risk_notes" values={item.content.risk_notes} />
        <ResultList
          title="unresolved_tensions"
          values={item.content.unresolved_tensions}
        />
        <ResultList
          title="carry_forward_questions"
          values={item.content.carry_forward_questions}
        />
      </section>

      <section
        className={styles.preview}
        aria-label="Perspective-memory item acceptance"
        data-augnes-perspective-memory-item-acceptance="true"
      >
        <PanelHeader
          eyebrow="Acceptance"
          title="Acceptance Confirmation"
          detail={item.acceptance.acceptance_label}
        />
        <dl className={styles.detailGrid}>
          <DetailRow label="accepted_at" value={item.acceptance.accepted_at} />
          <DetailRow
            label="user_confirmed_create_persisted_perspective_memory_item"
            value={String(
              item.acceptance
                .user_confirmed_create_persisted_perspective_memory_item,
            )}
          />
          <DetailRow
            label="user_confirmed_not_core_decision"
            value={String(item.acceptance.user_confirmed_not_core_decision)}
          />
          <DetailRow
            label="user_confirmed_no_automatic_runtime_injection"
            value={String(
              item.acceptance.user_confirmed_no_automatic_runtime_injection,
            )}
          />
          <DetailRow
            label="user_confirmed_source_boundary_record_preserved"
            value={String(
              item.acceptance.user_confirmed_source_boundary_record_preserved,
            )}
          />
        </dl>
      </section>

      <section
        className={styles.preview}
        aria-label="Perspective-memory source boundary snapshot"
        data-augnes-perspective-memory-item-source-boundary-snapshot="true"
      >
        <PanelHeader
          eyebrow="Source Snapshot"
          title="Source Boundary Snapshot"
          detail={item.source_boundary_snapshot.boundary_status_at_creation}
        />
        <dl className={styles.detailGrid}>
          <DetailRow
            label="checklist_ready_for_product_persistence_review"
            value={String(
              item.source_boundary_snapshot
                .checklist_ready_for_product_persistence_review,
            )}
          />
          <DetailRow
            label="checklist_ready_for_memory_write_now"
            value={String(
              item.source_boundary_snapshot.checklist_ready_for_memory_write_now,
            )}
          />
          <DetailRow
            label="proposed_memory_payload_should_write_to_memory_now"
            value={String(
              item.source_boundary_snapshot
                .proposed_memory_payload_should_write_to_memory_now,
            )}
          />
          <DetailRow
            label="user_confirmation_from_boundary_record"
            value={formatObject(item.source_boundary_snapshot.user_confirmation_from_boundary_record)}
          />
          <DetailRow
            label="checklist_gate_summary"
            value={formatObject(item.source_boundary_snapshot.checklist_gate_summary)}
          />
          <DetailRow
            label="proposal_diff_summary"
            value={formatObject(item.source_boundary_snapshot.proposal_diff_summary)}
          />
        </dl>
      </section>

      <section
        className={styles.preview}
        aria-label="Perspective-memory item availability"
        data-augnes-perspective-memory-item-availability="true"
      >
        <PanelHeader
          eyebrow="Availability"
          title="Availability Flags"
          detail="manual review and future retrieval only"
        />
        <dl className={styles.detailGrid}>
          {Object.entries(item.availability).map(([key, value]) => (
            <DetailRow key={key} label={key} value={String(value)} />
          ))}
        </dl>
      </section>

      <section
        className={styles.preview}
        aria-label="Perspective-memory item authority boundary"
        data-augnes-perspective-memory-item-authority-boundary="true"
      >
        <PanelHeader
          eyebrow="Authority"
          title="Authority Boundary"
          detail="not Core and not runtime injection"
        />
        <dl className={styles.detailGrid}>
          {Object.entries(item.authority_boundary).map(([key, value]) => (
            <DetailRow key={key} label={key} value={String(value)} />
          ))}
        </dl>
      </section>
    </section>
  );
}

function filterItem(filter: MemoryItemFilter, item: PerspectiveMemoryItemV0) {
  if (filter === "all") return true;
  if (
    filter === "accepted" ||
    filter === "reviewing" ||
    filter === "retracted" ||
    filter === "superseded" ||
    filter === "deprecated"
  ) {
    return item.item_status === filter;
  }
  if (filter === "PASS" || filter === "PASS with follow-up") {
    return item.source_validation_result_state === filter;
  }
  if (filter === "has warnings") return hasWarnings(item);
  if (filter === "active-ish") {
    return item.item_status === "accepted" || item.item_status === "reviewing";
  }
  if (filter === "inactive-ish") {
    return (
      item.item_status === "retracted" ||
      item.item_status === "superseded" ||
      item.item_status === "deprecated"
    );
  }
  return true;
}

function hasWarnings(item: PerspectiveMemoryItemV0) {
  return item.content.risk_notes.some((note) => {
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

function itemRiskIndicator(item: PerspectiveMemoryItemV0) {
  if (item.source_validation_result_state === "PASS with follow-up") {
    return "PASS with follow-up caveat";
  }
  return hasWarnings(item) ? "warnings present" : "no warning caveat";
}

function formatAuthoritySummary(item: PerspectiveMemoryItemV0) {
  return [
    `core_decision_created: ${item.authority_boundary.core_decision_created}`,
    `core_memory_created: ${item.authority_boundary.core_memory_created}`,
    `automatic_runtime_injection_created: ${item.authority_boundary.automatic_runtime_injection_created}`,
    `provider_model_call_created: ${item.authority_boundary.provider_model_call_created}`,
    `github_mutation_created: ${item.authority_boundary.github_mutation_created}`,
  ].join("; ");
}

function formatObject(value: object) {
  return JSON.stringify(value);
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
