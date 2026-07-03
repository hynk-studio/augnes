"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  PERSPECTIVE_MEMORY_ITEM_API_ROUTE,
  PERSPECTIVE_MEMORY_ITEM_STORE_BACKEND,
  PERSPECTIVE_MEMORY_ITEMS_ROUTE,
  createEmptyPerspectiveMemoryItemList,
  type PerspectiveMemoryItemListV0,
  type PerspectiveMemoryItemV0,
} from "@/lib/perspective-ingest/perspective-memory-item";
import {
  PERSPECTIVE_MEMORY_ITEM_SEARCH_ROUTE,
} from "@/lib/perspective-ingest/perspective-memory-item-search";
import {
  PERSPECTIVE_MEMORY_ITEM_REVIEW_WORKSPACE_ROUTE,
  buildPerspectiveMemoryItemReviewPacket,
  perspectiveMemoryItemReviewHasWarnings,
  type PerspectiveMemoryItemReviewPacketV0,
} from "@/lib/perspective-ingest/perspective-memory-item-review-workspace";
import {
  PERSPECTIVE_MEMORY_REUSE_WORKSPACE_ROUTE,
} from "@/lib/perspective-ingest/perspective-memory-item-reuse-packet";
import styles from "./perspective-memory-item-review-workspace-surface.module.css";

const BOUNDARY_INBOX_ROUTE =
  "/perspective/memory-boundary-review-inbox";
const LOCAL_MEMORY_REVIEW_QUEUE_ROUTE =
  "/perspective/memory-review-queue/local";
const OPERATOR_FLOW_ROUTE =
  "/perspective/codex-former/local-adapter-operator-flow";

const reviewFilters = [
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

type ReviewFilter = (typeof reviewFilters)[number];

const emptyItemList = createEmptyPerspectiveMemoryItemList("not_loaded");

export function PerspectiveMemoryItemReviewWorkspaceSurface() {
  const [itemList, setItemList] =
    useState<PerspectiveMemoryItemListV0>(emptyItemList);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>("all");
  const [loadStatus, setLoadStatus] = useState("review workspace not loaded");
  const [packetGeneratedAt, setPacketGeneratedAt] = useState("not_generated");

  useEffect(() => {
    setSelectedItemIds(parsePreselectedItemIds());
    setPacketGeneratedAt(new Date().toISOString());
    void loadItems();
  }, []);

  const filteredItems = useMemo(
    () => itemList.items.filter((item) => filterItem(activeFilter, item)),
    [activeFilter, itemList.items],
  );
  const packet = useMemo(
    () =>
      buildPerspectiveMemoryItemReviewPacket({
        items: itemList.items,
        selected_item_ids: selectedItemIds,
        nowIso: packetGeneratedAt,
      }),
    [itemList.items, packetGeneratedAt, selectedItemIds],
  );
  const selectedItem =
    itemList.items.find((item) => item.item_id === packet.selected_item_ids[0]) ??
    null;
  const reuseSelectedHref = buildReuseSelectedHref(selectedItemIds);

  async function loadItems() {
    setLoadStatus("loading persisted perspective-memory items for review");
    try {
      const response = await fetch(`${PERSPECTIVE_MEMORY_ITEM_API_ROUTE}?limit=100`, {
        method: "GET",
      });
      const body = await response.json();
      if (!response.ok || body?.ok !== true) {
        const reasons = Array.isArray(body?.blocked_reasons)
          ? body.blocked_reasons.join("; ")
          : response.statusText;
        setLoadStatus(`review workspace load blocked: ${reasons}`);
        return;
      }
      const nextList = body.result as PerspectiveMemoryItemListV0;
      setItemList(nextList);
      setPacketGeneratedAt(new Date().toISOString());
      setLoadStatus(
        nextList.items.length > 0
          ? "persisted perspective-memory items loaded from sqlite"
          : "no persisted perspective-memory items",
      );
    } catch (error) {
      setLoadStatus(
        `review workspace load failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  function toggleItem(itemId: string) {
    setSelectedItemIds((current) => {
      if (current.includes(itemId)) {
        return current.filter((id) => id !== itemId);
      }
      return [...current, itemId];
    });
    setPacketGeneratedAt(new Date().toISOString());
  }

  function selectAllVisible() {
    setSelectedItemIds((current) =>
      uniqueStrings([...current, ...filteredItems.map((item) => item.item_id)]),
    );
    setPacketGeneratedAt(new Date().toISOString());
  }

  function clearSelection() {
    setSelectedItemIds([]);
    setPacketGeneratedAt(new Date().toISOString());
  }

  return (
    <main
      className={styles.shell}
      data-augnes-surface="perspective-memory-items-review-workspace"
      data-augnes-perspective-memory-items-review-route="true"
    >
      <section className={styles.surface}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>Perspective Memory Review</p>
            <h1>Read-Only Review Packet Workspace</h1>
            <p>
              Select persisted perspective-memory items and inspect a
              deterministic review packet for content, source traces, risks,
              unresolved tensions, carry-forward questions, and relationships.
            </p>
          </div>
          <div className={styles.boundaryPills} aria-label="Read-only review boundary">
            <span>deterministic review packet</span>
            <span>sqlite:lib/db.ts</span>
            <span>no Core memory</span>
            <span>no Core decision</span>
            <span>no runtime injection</span>
            <span>no provider/model call</span>
            <span>no Codex SDK</span>
            <span>no GitHub mutation</span>
            <span>no automatic promotion</span>
          </div>
        </header>

        <nav className={styles.navRow} aria-label="Perspective-memory review navigation">
          <Link
            className={styles.linkButton}
            href={PERSPECTIVE_MEMORY_ITEMS_ROUTE}
            data-augnes-memory-items-review-dashboard-link="true"
          >
            Back to memory items dashboard
          </Link>
          <Link
            className={styles.linkButton}
            href={PERSPECTIVE_MEMORY_ITEM_SEARCH_ROUTE}
            data-augnes-memory-items-review-search-link="true"
          >
            Back to memory item search
          </Link>
          <Link
            className={styles.linkButton}
            href={PERSPECTIVE_MEMORY_REUSE_WORKSPACE_ROUTE}
            data-augnes-memory-items-review-reuse-workspace-link="true"
          >
            Build Codex memory reuse packet
          </Link>
          <Link
            className={styles.linkButton}
            href={BOUNDARY_INBOX_ROUTE}
            data-augnes-memory-items-review-boundary-inbox-link="true"
          >
            Back to boundary review inbox
          </Link>
          <Link
            className={styles.linkButton}
            href={LOCAL_MEMORY_REVIEW_QUEUE_ROUTE}
            data-augnes-memory-items-review-local-queue-link="true"
          >
            Back to local memory review queue
          </Link>
          <Link
            className={styles.linkButton}
            href={OPERATOR_FLOW_ROUTE}
            data-augnes-memory-items-review-operator-flow-link="true"
          >
            Open local Codex adapter operator flow
          </Link>
        </nav>

        <section className={styles.statusStrip} aria-label="Review workspace status">
          <StatusCell label="route" value={PERSPECTIVE_MEMORY_ITEM_REVIEW_WORKSPACE_ROUTE} />
          <StatusCell label="api_route" value={PERSPECTIVE_MEMORY_ITEM_API_ROUTE} />
          <StatusCell
            label="persistence_backend"
            value={PERSPECTIVE_MEMORY_ITEM_STORE_BACKEND}
          />
          <StatusCell label="total_item_count" value={String(itemList.items.length)} />
          <StatusCell
            label="selected_count"
            value={String(packet.selected_item_count)}
          />
          <StatusCell label="active_filter" value={activeFilter} />
          <StatusCell
            label="missing_preselected_item_ids"
            value={
              packet.missing_item_ids.length > 0
                ? packet.missing_item_ids.join(", ")
                : "none"
            }
          />
          <StatusCell label="load_status" value={loadStatus} />
        </section>

        <section className={styles.controlPanel} aria-label="Review workspace controls">
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.button}
              data-augnes-memory-items-review-select-all-visible="true"
              onClick={selectAllVisible}
            >
              Select all visible
            </button>
            <button
              type="button"
              className={styles.button}
              data-augnes-memory-items-review-clear-selection="true"
              onClick={clearSelection}
            >
              Clear selection
            </button>
            <button
              type="button"
              className={styles.button}
              data-augnes-memory-items-review-reload="true"
              onClick={() => void loadItems()}
            >
              Reload items
            </button>
            <Link
              className={styles.linkButton}
              href={reuseSelectedHref}
              data-augnes-memory-items-review-reuse-selected-link="true"
            >
              Reuse selected items
            </Link>
          </div>
          <div className={styles.filterRow} aria-label="Review item filters">
            {reviewFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={classNames(
                  styles.button,
                  activeFilter === filter ? styles.activeButton : "",
                )}
                data-augnes-memory-items-review-filter={filter}
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <section
            className={styles.policyBox}
            aria-label="Read-only review packet boundary"
            data-augnes-memory-items-review-read-only-boundary="true"
          >
            <strong>Read-only authority boundary</strong>
            <p>
              This workspace generates a deterministic review packet only. It
              has no item status mutation controls, no item creation controls,
              no boundary creation controls, no Core or runtime controls, no
              provider/model synthesis, no GitHub mutation controls, and no
              persistence for review packet selection.
            </p>
          </section>
        </section>

        <section className={styles.workbenchGrid}>
          <ReviewPacketPanel packet={packet} />
          <section
            className={styles.panel}
            aria-label="Persisted perspective-memory item selector"
            data-augnes-memory-items-review-item-list="true"
          >
            <PanelHeader
              eyebrow="Selected Persisted Items"
              title="Item Selection"
              detail={`visible ${filteredItems.length}; selected ${packet.selected_item_count}`}
            />
            <div className={styles.itemList}>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const selected = selectedItemIds.includes(item.item_id);
                  return (
                    <article
                      key={item.item_id}
                      className={classNames(
                        styles.itemListEntry,
                        selected ? styles.selectedItem : "",
                      )}
                      data-augnes-memory-items-review-item={item.item_id}
                    >
                      <div className={styles.itemHeader}>
                        <button
                          type="button"
                          className={styles.button}
                          data-augnes-memory-items-review-toggle-item={item.item_id}
                          aria-pressed={selected}
                          onClick={() => toggleItem(item.item_id)}
                        >
                          {selected ? "Deselect item" : "Select item"}
                        </button>
                        <strong>{item.item_status}</strong>
                      </div>
                      <dl className={styles.detailGrid}>
                        <DetailRow label="item_id" value={item.item_id} />
                        <DetailRow label="title" value={item.content.title} />
                        <DetailRow
                          label="source_validation_result_state"
                          value={item.source_validation_result_state}
                        />
                        <DetailRow
                          label="risk_indicator"
                          value={packetRiskIndicator(item)}
                        />
                      </dl>
                    </article>
                  );
                })
              ) : (
                <p className={styles.boundaryText}>
                  No persisted perspective-memory items match the active filter.
                </p>
              )}
            </div>
          </section>

          <SelectedItemDetail item={selectedItem} />
        </section>
      </section>
    </main>
  );
}

function ReviewPacketPanel({
  packet,
}: {
  packet: PerspectiveMemoryItemReviewPacketV0;
}) {
  return (
    <section
      className={classNames(styles.panel, styles.packetPanel)}
      aria-label="Deterministic review packet"
      data-augnes-memory-items-review-packet="true"
    >
      <PanelHeader
        eyebrow="Review Packet"
        title="Deterministic Review Packet"
        detail={packet.packet_version}
      />
      <dl className={styles.detailGrid}>
        <DetailRow label="generated_at" value={packet.generated_at} />
        <DetailRow
          label="selected_item_count"
          value={String(packet.selected_item_count)}
        />
        <DetailRow
          label="selected_item_ids"
          value={packet.selected_item_ids.join(", ") || "none"}
        />
        <DetailRow
          label="missing_item_ids"
          value={packet.missing_item_ids.join(", ") || "none"}
        />
      </dl>

      {packet.selected_item_count === 0 ? (
        <p
          className={styles.emptyState}
          data-augnes-memory-items-review-empty-selection="true"
        >
          No items selected. Select persisted perspective-memory items to build
          a deterministic review packet.
        </p>
      ) : null}

      <section
        className={styles.preview}
        aria-label="Review packet counts"
        data-augnes-memory-items-review-counts="true"
      >
        <PanelHeader
          eyebrow="Counts"
          title="Status And Validation Counts"
          detail={packet.selection_summary.selection_summary_version}
        />
        <CountList title="status_counts" counts={packet.status_counts} />
        <CountList
          title="validation_result_counts"
          counts={packet.validation_result_counts}
        />
        <CountList title="memory_kind_counts" counts={packet.memory_kind_counts} />
      </section>

      <section
        className={styles.preview}
        aria-label="Review packet content summaries"
        data-augnes-memory-items-review-content-summary="true"
      >
        <PanelHeader
          eyebrow="Content"
          title="Content Summary Panel"
          detail={`${packet.content_summaries.length} selected item(s)`}
        />
        <div className={styles.summaryList}>
          {packet.content_summaries.length > 0 ? (
            packet.content_summaries.map((summary) => (
              <article key={summary.item_id} className={styles.summaryEntry}>
                <dl className={styles.detailGrid}>
                  <DetailRow label="item_id" value={summary.item_id} />
                  <DetailRow label="title" value={summary.title} />
                  <DetailRow label="summary" value={summary.summary} />
                  <DetailRow label="item_status" value={summary.item_status} />
                  <DetailRow
                    label="source_validation_result_state"
                    value={summary.source_validation_result_state}
                  />
                  <DetailRow
                    label="risk_indicator"
                    value={summary.risk_indicator}
                  />
                </dl>
              </article>
            ))
          ) : (
            <p className={styles.boundaryText}>No selected content summaries.</p>
          )}
        </div>
      </section>

      <section
        className={styles.preview}
        aria-label="Review packet source and evidence refs"
        data-augnes-memory-items-review-source-evidence-refs="true"
      >
        <PanelHeader
          eyebrow="Source"
          title="Source And Evidence Refs"
          detail="unique bounded refs"
        />
        <ResultList title="source_boundary_record_ids" values={packet.source_boundary_record_ids} />
        <ResultList title="source_candidate_draft_ids" values={packet.source_candidate_draft_ids} />
        <ResultList title="source_refs" values={packet.source_refs} />
        <ResultList title="evidence_refs" values={packet.evidence_refs} />
      </section>

      <section
        className={styles.preview}
        aria-label="Review packet risks tensions questions"
        data-augnes-memory-items-review-risk-tensions-questions="true"
      >
        <PanelHeader
          eyebrow="Review Material"
          title="Risks, Tensions, Questions"
          detail="deduplicated selected item fields"
        />
        <ResultList title="risk_notes" values={packet.risk_notes} />
        <ResultList
          title="unresolved_tensions"
          values={packet.unresolved_tensions}
        />
        <ResultList
          title="carry_forward_questions"
          values={packet.carry_forward_questions}
        />
        <ResultList
          title="suggested_next_review_actions"
          values={packet.suggested_next_review_actions}
        />
      </section>

      <section
        className={styles.preview}
        aria-label="Review packet relationship summary"
        data-augnes-memory-items-review-relationship-summary="true"
      >
        <PanelHeader
          eyebrow="Relationships"
          title="relationship_summary"
          detail="deterministic local comparisons"
        />
        <ResultList
          title="shared_source_refs"
          values={packet.relationship_summary.shared_source_refs}
        />
        <ResultList
          title="duplicate_titles"
          values={packet.relationship_summary.duplicate_titles}
        />
        <ResultList
          title="repeated_questions"
          values={packet.relationship_summary.repeated_questions}
        />
        <ResultList
          title="retracted_or_deprecated_items"
          values={packet.relationship_summary.retracted_or_deprecated_items}
        />
        <ResultList
          title="superseded_items"
          values={packet.relationship_summary.superseded_items}
        />
        <ResultList
          title="pass_with_follow_up_items"
          values={packet.relationship_summary.pass_with_follow_up_items}
        />
      </section>

      <section
        className={styles.preview}
        aria-label="Review packet guidance"
        data-augnes-memory-items-review-guidance="true"
      >
        <PanelHeader
          eyebrow="Guidance"
          title="Deterministic Review Guidance"
          detail={packet.review_guidance.guidance_version}
        />
        <DetailRow
          label="deterministic_only"
          value={String(packet.review_guidance.deterministic_only)}
        />
        <ResultList
          title="suggested_review_steps"
          values={packet.review_guidance.suggested_review_steps}
        />
        <ResultList
          title="blocked_actions"
          values={packet.review_guidance.blocked_actions}
        />
      </section>

      <section
        className={styles.preview}
        aria-label="Review packet authority boundary"
        data-augnes-memory-items-review-authority-boundary="true"
      >
        <PanelHeader
          eyebrow="Authority"
          title="Read-Only Authority Boundary"
          detail="not Core and not runtime injection"
        />
        <dl className={styles.detailGrid}>
          {Object.entries(packet.authority_boundary).map(([key, value]) => (
            <DetailRow key={key} label={key} value={String(value)} />
          ))}
        </dl>
      </section>
    </section>
  );
}

function SelectedItemDetail({ item }: { item: PerspectiveMemoryItemV0 | null }) {
  if (!item) {
    return (
      <section
        className={styles.panel}
        aria-label="Selected review item detail"
        data-augnes-memory-items-review-selected-detail="true"
      >
        <PanelHeader
          eyebrow="Selected Detail"
          title="No Selected Item Detail"
          detail="select an item to inspect its source trace"
        />
        <p className={styles.boundaryText}>
          The review packet remains available with empty-selection guidance.
        </p>
      </section>
    );
  }

  return (
    <section
      className={styles.panel}
      aria-label="Selected review item detail"
      data-augnes-memory-items-review-selected-detail="true"
    >
      <PanelHeader
        eyebrow="Selected Detail"
        title="Selected Item Source Trace"
        detail={item.item_version}
      />
      <dl className={styles.detailGrid}>
        <DetailRow label="item_id" value={item.item_id} />
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
      </dl>
    </section>
  );
}

function filterItem(filter: ReviewFilter, item: PerspectiveMemoryItemV0) {
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
  if (filter === "has warnings") return perspectiveMemoryItemReviewHasWarnings(item);
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

function packetRiskIndicator(item: PerspectiveMemoryItemV0) {
  if (item.source_validation_result_state === "PASS with follow-up") {
    return "PASS with follow-up caution";
  }
  return perspectiveMemoryItemReviewHasWarnings(item)
    ? "warnings present"
    : "no warning caveat";
}

function parsePreselectedItemIds() {
  if (typeof window === "undefined") return [];
  const value = new URLSearchParams(window.location.search).get("item_ids");
  if (!value) return [];
  return uniqueStrings(
    value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function buildReuseSelectedHref(itemIds: string[]) {
  if (itemIds.length === 0) return PERSPECTIVE_MEMORY_REUSE_WORKSPACE_ROUTE;
  return `${PERSPECTIVE_MEMORY_REUSE_WORKSPACE_ROUTE}?item_ids=${encodeURIComponent(
    itemIds.join(","),
  )}`;
}

function CountList({
  title,
  counts,
}: {
  title: string;
  counts: Record<string, number>;
}) {
  const entries = Object.entries(counts);
  return (
    <section className={styles.resultList}>
      <h3>{title}</h3>
      {entries.length > 0 ? (
        <ul>
          {entries.map(([key, value]) => (
            <li key={`${title}:${key}`}>
              {key}: {value}
            </li>
          ))}
        </ul>
      ) : (
        <p>none</p>
      )}
    </section>
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

function classNames(...values: string[]) {
  return values.filter(Boolean).join(" ");
}
