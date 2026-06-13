"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
  type PerspectiveMemoryItemSearchMetadataV0,
  type PerspectiveMemoryItemSearchResultSummaryV0,
} from "@/lib/perspective-ingest/perspective-memory-item-search";
import styles from "./perspective-memory-item-search-surface.module.css";

const BOUNDARY_INBOX_ROUTE =
  "/cockpit/perspective/memory-boundary-review-inbox";
const LOCAL_MEMORY_REVIEW_QUEUE_ROUTE =
  "/cockpit/perspective/memory-review-queue/local";
const OPERATOR_FLOW_ROUTE =
  "/cockpit/perspective/codex-former/local-adapter-operator-flow";

const searchFilters = [
  "all statuses",
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

type SearchFilter = (typeof searchFilters)[number];

type SearchableItemList = PerspectiveMemoryItemListV0 & {
  search?: PerspectiveMemoryItemSearchMetadataV0;
};

const emptyItemList = createEmptyPerspectiveMemoryItemList("not_loaded");

export function PerspectiveMemoryItemSearchSurface() {
  const [itemList, setItemList] =
    useState<PerspectiveMemoryItemListV0>(emptyItemList);
  const [searchMetadata, setSearchMetadata] =
    useState<PerspectiveMemoryItemSearchMetadataV0 | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [queryDraft, setQueryDraft] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("all statuses");
  const [loadStatus, setLoadStatus] = useState("search not loaded");

  useEffect(() => {
    void loadItems({ query: "", filter: "all statuses" });
  }, []);

  const summaryByItemId = useMemo(() => {
    const entries = searchMetadata?.result_summaries ?? [];
    return new Map(entries.map((summary) => [summary.item_id, summary]));
  }, [searchMetadata]);

  const selectedItem =
    (selectedItemId
      ? itemList.items.find((item) => item.item_id === selectedItemId)
      : null) ??
    itemList.items[0] ??
    null;
  const selectedSummary = selectedItem
    ? summaryByItemId.get(selectedItem.item_id) ?? null
    : null;

  async function loadItems({
    query,
    filter,
  }: {
    query: string;
    filter: SearchFilter;
  }) {
    setLoadStatus("loading read-only perspective-memory item search");
    try {
      const requestUrl = buildSearchRequestUrl(query, filter);
      const response = await fetch(requestUrl, { method: "GET" });
      const body = await response.json();
      if (!response.ok || body?.ok !== true) {
        const reasons = Array.isArray(body?.blocked_reasons)
          ? body.blocked_reasons.join("; ")
          : response.statusText;
        setLoadStatus(`memory item search blocked: ${reasons}`);
        return;
      }
      const nextList = body.result as SearchableItemList;
      setItemList(nextList);
      setSearchMetadata(nextList.search ?? null);
      setSelectedItemId((current) => {
        if (current && nextList.items.some((item) => item.item_id === current)) {
          return current;
        }
        return nextList.items[0]?.item_id ?? null;
      });
      setLoadStatus(
        nextList.items.length > 0
          ? "read-only search results loaded from sqlite"
          : "no persisted perspective-memory items matched",
      );
    } catch (error) {
      setLoadStatus(
        `memory item search failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(queryDraft);
    void loadItems({ query: queryDraft, filter: activeFilter });
  }

  function handleClearSearch() {
    setQueryDraft("");
    setSubmittedQuery("");
    setActiveFilter("all statuses");
    void loadItems({ query: "", filter: "all statuses" });
  }

  function handleFilterChange(filter: SearchFilter) {
    setActiveFilter(filter);
    void loadItems({ query: submittedQuery, filter });
  }

  return (
    <main
      className={styles.shell}
      data-augnes-surface="perspective-memory-items-search"
      data-augnes-perspective-memory-items-search-route="true"
    >
      <section className={styles.surface}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>Perspective Memory Retrieval</p>
            <h1>Read-Only Perspective-Memory Item Search</h1>
            <p>
              Search persisted perspective-memory items by bounded title,
              summary, refs, risk notes, carry-forward questions, hashes, and
              source lineage without creating new memory or changing Core state.
            </p>
          </div>
          <div className={styles.boundaryPills} aria-label="Read-only boundary">
            <span>read-only search</span>
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

        <nav className={styles.navRow} aria-label="Perspective-memory search navigation">
          <Link
            className={styles.linkButton}
            href={PERSPECTIVE_MEMORY_ITEMS_ROUTE}
            data-augnes-memory-items-search-dashboard-link="true"
          >
            Back to memory items dashboard
          </Link>
          <Link
            className={styles.linkButton}
            href={BOUNDARY_INBOX_ROUTE}
            data-augnes-memory-items-search-boundary-inbox-link="true"
          >
            Back to boundary review inbox
          </Link>
          <Link
            className={styles.linkButton}
            href={LOCAL_MEMORY_REVIEW_QUEUE_ROUTE}
            data-augnes-memory-items-search-local-queue-link="true"
          >
            Back to local memory review queue
          </Link>
          <Link
            className={styles.linkButton}
            href={OPERATOR_FLOW_ROUTE}
            data-augnes-memory-items-search-operator-flow-link="true"
          >
            Open local Codex adapter operator flow
          </Link>
        </nav>

        <section className={styles.statusStrip} aria-label="Search route status">
          <StatusCell label="route" value={PERSPECTIVE_MEMORY_ITEM_SEARCH_ROUTE} />
          <StatusCell label="api_route" value={PERSPECTIVE_MEMORY_ITEM_API_ROUTE} />
          <StatusCell
            label="persistence_backend"
            value={PERSPECTIVE_MEMORY_ITEM_STORE_BACKEND}
          />
          <StatusCell label="result_count" value={String(itemList.items.length)} />
          <StatusCell label="selected_result_id" value={selectedItem?.item_id ?? "none"} />
          <StatusCell label="active_filter" value={activeFilter} />
          <StatusCell
            label="normalized_query"
            value={searchMetadata?.normalized_query ?? "none"}
          />
          <StatusCell label="load_status" value={loadStatus} />
        </section>

        <section className={styles.controlPanel} aria-label="Read-only search controls">
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <label htmlFor="perspective-memory-item-search-input">
              Search persisted perspective-memory items
            </label>
            <div className={styles.searchInputRow}>
              <input
                id="perspective-memory-item-search-input"
                data-augnes-memory-items-search-input="true"
                value={queryDraft}
                onChange={(event) => setQueryDraft(event.target.value)}
                placeholder="title, summary, source ref, hash, risk, question"
              />
              <button
                type="submit"
                className={styles.button}
                data-augnes-memory-items-search-submit="true"
              >
                Search
              </button>
              <button
                type="button"
                className={styles.button}
                data-augnes-memory-items-search-clear="true"
                onClick={handleClearSearch}
              >
                Clear search
              </button>
              <button
                type="button"
                className={styles.button}
                data-augnes-memory-items-search-reload="true"
                onClick={() =>
                  void loadItems({ query: submittedQuery, filter: activeFilter })
                }
              >
                Reload items
              </button>
            </div>
          </form>

          <div className={styles.filterRow} aria-label="Search result filters">
            {searchFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={classNames(
                  styles.button,
                  activeFilter === filter ? styles.activeButton : "",
                )}
                data-augnes-memory-items-search-filter={filter}
                aria-pressed={activeFilter === filter}
                onClick={() => handleFilterChange(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <section
            className={styles.policyBox}
            aria-label="Read-only retrieval boundary"
            data-augnes-memory-items-search-read-only-boundary="true"
          >
            <strong>Read-only boundary</strong>
            <p>
              This route retrieves persisted perspective-memory items only. It
              has no item status mutation controls, no item creation controls,
              no boundary creation controls, no Core or runtime controls, no
              provider/model enrichment, and no GitHub mutation controls.
            </p>
          </section>
        </section>

        <section className={styles.grid}>
          <section
            className={styles.panel}
            aria-label="Search result list"
            data-augnes-memory-items-search-result-list="true"
          >
            <PanelHeader
              eyebrow="Search Results"
              title="Persisted Perspective-Memory Items"
              detail={
                searchMetadata
                  ? `${searchMetadata.search_version}; matches ${searchMetadata.total_matches}`
                  : itemList.item_list_version
              }
            />
            <p className={styles.boundaryText}>
              Showing {itemList.items.length} read-only result(s). Total
              candidates considered:{" "}
              {searchMetadata?.total_candidates_considered ?? itemList.items.length}.
            </p>
            <div className={styles.itemList}>
              {itemList.items.length > 0 ? (
                itemList.items.map((item) => (
                  <SearchResultCard
                    key={item.item_id}
                    item={item}
                    summary={summaryByItemId.get(item.item_id) ?? null}
                    selected={selectedItem?.item_id === item.item_id}
                    onSelect={() => setSelectedItemId(item.item_id)}
                  />
                ))
              ) : (
                <p
                  className={styles.emptyState}
                  data-augnes-memory-items-search-empty-state="true"
                >
                  No persisted perspective-memory items matched this read-only
                  search.
                </p>
              )}
            </div>
          </section>

          <PerspectiveMemoryItemSearchDetail
            item={selectedItem}
            summary={selectedSummary}
          />
        </section>
      </section>
    </main>
  );
}

function buildSearchRequestUrl(query: string, filter: SearchFilter) {
  const params = new URLSearchParams();
  params.set("limit", "100");
  if (query.trim().length > 0) params.set("q", query);
  if (
    filter === "accepted" ||
    filter === "reviewing" ||
    filter === "retracted" ||
    filter === "superseded" ||
    filter === "deprecated"
  ) {
    params.set("item_status", filter);
  }
  if (filter === "PASS" || filter === "PASS with follow-up") {
    params.set("source_validation_result_state", filter);
  }
  if (filter === "has warnings") params.set("has_warnings", "true");
  if (filter === "active-ish") params.set("active_state", "active-ish");
  if (filter === "inactive-ish") params.set("active_state", "inactive-ish");
  return `${PERSPECTIVE_MEMORY_ITEM_API_ROUTE}?${params.toString()}`;
}

function SearchResultCard({
  item,
  summary,
  selected,
  onSelect,
}: {
  item: PerspectiveMemoryItemV0;
  summary: PerspectiveMemoryItemSearchResultSummaryV0 | null;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={classNames(styles.itemListEntry, selected ? styles.selectedItem : "")}
      data-augnes-memory-items-search-result={item.item_id}
    >
      <div className={styles.itemHeader}>
        <button
          type="button"
          className={styles.button}
          data-augnes-memory-items-search-select-result={item.item_id}
          aria-pressed={selected}
          onClick={onSelect}
        >
          Select result
        </button>
        <strong>{item.item_status}</strong>
      </div>
      <dl className={styles.detailGrid}>
        <DetailRow label="item_id" value={item.item_id} />
        <DetailRow label="title" value={item.content.title} />
        <DetailRow
          label="source_boundary_record_id"
          value={item.source_boundary_record_id}
        />
        <DetailRow
          label="source_validation_result_state"
          value={item.source_validation_result_state}
        />
        <DetailRow label="score" value={String(summary?.score ?? 0)} />
        <DetailRow
          label="matched_fields"
          value={
            summary && summary.matched_fields.length > 0
              ? summary.matched_fields.join(", ")
              : "query_empty_or_filter_only"
          }
        />
      </dl>
      <SnippetList summary={summary} />
    </article>
  );
}

function PerspectiveMemoryItemSearchDetail({
  item,
  summary,
}: {
  item: PerspectiveMemoryItemV0 | null;
  summary: PerspectiveMemoryItemSearchResultSummaryV0 | null;
}) {
  if (!item) {
    return (
      <section
        className={styles.panel}
        aria-label="Selected search result detail"
        data-augnes-memory-items-search-selected-detail="true"
      >
        <PanelHeader
          eyebrow="Selected Result"
          title="No Persisted Item Selected"
          detail="select a read-only search result"
        />
        <p className={styles.boundaryText}>
          Search results come from `sqlite:lib/db.ts` through the same item API.
        </p>
      </section>
    );
  }

  return (
    <section
      className={styles.panel}
      aria-label="Selected search result detail"
      data-augnes-memory-items-search-selected-detail="true"
    >
      <PanelHeader
        eyebrow="Selected Result"
        title="Persisted Perspective-Memory Item Detail"
        detail={item.item_version}
      />
      <p className={styles.boundaryText}>
        Selected result id: {item.item_id}. This view is inspectable and
        read-only; item status, creation, Core, runtime, provider/model, and
        GitHub actions are unavailable here.
      </p>

      <section
        className={styles.preview}
        aria-label="Search match metadata"
        data-augnes-memory-items-search-match-metadata="true"
      >
        <PanelHeader
          eyebrow="Match Metadata"
          title="Deterministic Match Metadata"
          detail={summary?.summary_version ?? "query_empty_or_filter_only"}
        />
        <dl className={styles.detailGrid}>
          <DetailRow label="score" value={String(summary?.score ?? 0)} />
          <DetailRow
            label="matched_fields"
            value={
              summary && summary.matched_fields.length > 0
                ? summary.matched_fields.join(", ")
                : "none"
            }
          />
        </dl>
        <SnippetList summary={summary} />
      </section>

      <section
        className={styles.preview}
        aria-label="Source boundary trace"
        data-augnes-memory-items-search-source-boundary-trace="true"
      >
        <PanelHeader
          eyebrow="Source Boundary Trace"
          title="Source Boundary Trace"
          detail={item.source}
        />
        <dl className={styles.detailGrid}>
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

      <section
        className={styles.preview}
        aria-label="Perspective-memory item content preview"
        data-augnes-memory-items-search-content-preview="true"
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
        aria-label="Perspective-memory item availability"
        data-augnes-memory-items-search-availability="true"
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
        data-augnes-memory-items-search-authority-boundary="true"
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

function SnippetList({
  summary,
}: {
  summary: PerspectiveMemoryItemSearchResultSummaryV0 | null;
}) {
  if (!summary || summary.snippets.length === 0) {
    return <p className={styles.boundaryText}>No snippets for filter-only results.</p>;
  }
  return (
    <section className={styles.resultList} aria-label="Matched snippets">
      <h3>matched snippets</h3>
      <ul>
        {summary.snippets.map((snippet, index) => (
          <li key={`${snippet.field}:${index}`}>
            <strong>{snippet.field}</strong>: {snippet.snippet}
          </li>
        ))}
      </ul>
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
