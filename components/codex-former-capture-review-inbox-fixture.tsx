"use client";

import type {
  CodexFormerCaptureReviewFilter,
  CodexFormerCaptureReviewInboxFixture,
  CodexFormerCaptureReviewInboxItem,
} from "@/lib/perspective-ingest/codex-former-capture-review-inbox-fixture-surface";
import { filterCodexFormerCaptureReviewItems } from "@/lib/perspective-ingest/codex-former-capture-review-inbox-fixture-surface";
import { useEffect, useMemo, useState } from "react";

export function CodexFormerCaptureReviewInboxFixtureSurface({
  inbox,
}: {
  inbox: CodexFormerCaptureReviewInboxFixture;
}) {
  const [selectedFilter, setSelectedFilter] =
    useState<CodexFormerCaptureReviewFilter>("all");
  const [selectedItemId, setSelectedItemId] = useState<string>(
    inbox.items[0]?.id ?? "",
  );
  const [emptyMode, setEmptyMode] = useState(false);
  const [authorityOpen, setAuthorityOpen] = useState(false);

  const filteredItems = useMemo(
    () => filterCodexFormerCaptureReviewItems(inbox.items, selectedFilter),
    [inbox.items, selectedFilter],
  );

  useEffect(() => {
    if (!emptyMode && !filteredItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(filteredItems[0]?.id ?? "");
    }
    setAuthorityOpen(false);
  }, [emptyMode, filteredItems, selectedItemId]);

  const selectedItem =
    !emptyMode && selectedItemId
      ? filteredItems.find((item) => item.id === selectedItemId) ??
        filteredItems[0] ??
        null
      : null;

  function selectFilter(filter: CodexFormerCaptureReviewFilter) {
    setSelectedFilter(filter);
    setEmptyMode(false);
  }

  return (
    <main
      className="cockpit-shell codex-former-inbox-shell"
      data-augnes-surface="codex-former-capture-review-inbox-fixture"
    >
      <section className="cockpit-surface-card codex-former-inbox-surface">
        <InboxHeader inbox={inbox} items={inbox.items} />

        <FilterGroupBar
          emptyMode={emptyMode}
          filters={inbox.filters}
          onEmptyModeChange={setEmptyMode}
          onFilterChange={selectFilter}
          selectedFilter={selectedFilter}
        />

        {emptyMode ? (
          <EmptyInvalidState inbox={inbox} />
        ) : (
          <div className="codex-former-inbox-layout">
            <ReviewItemList
              items={filteredItems}
              onSelect={setSelectedItemId}
              selectedItemId={selectedItem?.id ?? ""}
            />
            <div className="codex-former-inbox-detail-stack">
              <SelectedItemSummary item={selectedItem} />
              <WarningBlockingTriage items={filteredItems} selectedItem={selectedItem} />
              <AuthorityBoundaryBox
                item={selectedItem}
                onOpenChange={setAuthorityOpen}
                open={authorityOpen}
              />
              <SafeNextActions item={selectedItem} />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function InboxHeader({
  inbox,
  items,
}: {
  inbox: CodexFormerCaptureReviewInboxFixture;
  items: CodexFormerCaptureReviewInboxItem[];
}) {
  const counts = {
    all: items.length,
    not_ready: items.filter((item) => item.reviewability === "not_ready").length,
    waiting: items.filter((item) => item.reviewability === "waiting").length,
    reviewable: items.filter(
      (item) => item.reviewability === "reviewable_with_follow_up",
    ).length,
    blocked: items.filter((item) => item.reviewability === "blocked").length,
  };

  return (
    <header
      className="codex-former-inbox-header"
      data-augnes-region="inbox-header"
      aria-label={`Inbox Header. ${inbox.boundaryLabel}. Accepted-state ${inbox.acceptedState}. No decision authority ${inbox.noDecisionAuthority}.`}
    >
      <div>
        <p className="panel-eyebrow">Capture Review Inbox</p>
        <h1>{inbox.title}</h1>
        <p>Read-only fixture-backed review queue for Codex Former capture items.</p>
      </div>
      <div className="codex-former-inbox-counts" aria-label="Item counts by status">
        <span>all {counts.all}</span>
        <span>not_ready {counts.not_ready}</span>
        <span>waiting {counts.waiting}</span>
        <span>reviewable {counts.reviewable}</span>
        <span>blocked {counts.blocked}</span>
      </div>
      <div className="codex-former-inbox-boundary">
        <span>{inbox.boundaryLabel}</span>
        <strong>accepted-state {String(inbox.acceptedState)}</strong>
        <strong>decision authority false</strong>
      </div>
    </header>
  );
}

function FilterGroupBar({
  emptyMode,
  filters,
  onEmptyModeChange,
  onFilterChange,
  selectedFilter,
}: {
  filters: CodexFormerCaptureReviewFilter[];
  selectedFilter: CodexFormerCaptureReviewFilter;
  emptyMode: boolean;
  onFilterChange: (filter: CodexFormerCaptureReviewFilter) => void;
  onEmptyModeChange: (emptyMode: boolean) => void;
}) {
  return (
    <section
      className="codex-former-inbox-filter-bar"
      aria-label="Filter / Group Bar"
      data-augnes-region="filter-group-bar"
    >
      <div role="tablist" aria-label="Capture review inbox filters">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={!emptyMode && selectedFilter === filter}
            className={
              !emptyMode && selectedFilter === filter
                ? "codex-former-inbox-filter is-active"
                : "codex-former-inbox-filter"
            }
            data-augnes-inbox-filter={filter}
            onClick={() => onFilterChange(filter)}
          >
            {filter}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={emptyMode}
          className={
            emptyMode
              ? "codex-former-inbox-filter is-active"
              : "codex-former-inbox-filter"
          }
          data-augnes-inbox-filter="empty"
          onClick={() => onEmptyModeChange(true)}
        >
          empty
        </button>
      </div>
      <p>Local filter state only. No saved filters or persistence.</p>
    </section>
  );
}

function ReviewItemList({
  items,
  onSelect,
  selectedItemId,
}: {
  items: CodexFormerCaptureReviewInboxItem[];
  selectedItemId: string;
  onSelect: (itemId: string) => void;
}) {
  return (
    <section
      className="codex-former-inbox-list"
      aria-label="Review Item List"
      data-augnes-region="review-item-list"
    >
      <header>
        <h2>Review Item List</h2>
        <p>Compact fixture rows only; no graph, transcript, or raw payload.</p>
      </header>
      {items.length === 0 ? (
        <p className="codex-former-inbox-muted">No items match this filter.</p>
      ) : (
        <div className="codex-former-inbox-card-list">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`codex-former-inbox-item tone-${item.tone}${
                item.id === selectedItemId ? " is-selected" : ""
              }`}
              data-augnes-inbox-item-id={item.id}
              onClick={() => onSelect(item.id)}
              aria-label={`${item.title}. Status ${item.primaryStatus}. Reviewability ${item.reviewability}. Caveat ${item.caveat}. Next safe action ${item.nextSafeAction}.`}
            >
              <span className="codex-former-inbox-item-main">
                <strong>{item.title}</strong>
                <span>{item.sourceSessionLabel}</span>
              </span>
              <span className="codex-former-inbox-item-status">
                <span>{item.primaryStatus}</span>
                <span>{item.reviewability}</span>
              </span>
              <span className="codex-former-inbox-item-metrics">
                <span>warnings {item.warningCount}</span>
                <span>blocked {item.blockedReasonCount}</span>
                <span>candidate_count {item.candidateCount}</span>
                <span>metadata_match {String(item.metadataMatch)}</span>
              </span>
              <span
                className="codex-former-inbox-badge-row"
                data-augnes-inbox-badge-count={Math.min(item.badges.length, 2)}
              >
                {item.badges.slice(0, 2).map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function SelectedItemSummary({
  item,
}: {
  item: CodexFormerCaptureReviewInboxItem | null;
}) {
  return (
    <section
      className="codex-former-inbox-selected"
      aria-label="Selected Item Summary"
      data-augnes-region="selected-item-summary"
    >
      <h2>Selected Item Summary</h2>
      {!item ? (
        <p>No review item selected.</p>
      ) : (
        <>
          <strong>{item.primaryStatus}</strong>
          <p>{item.caveat}</p>
          <dl>
            <DetailRow label="reviewability" value={item.reviewability} />
            <DetailRow label="next_safe_action" value={item.nextSafeAction} />
            <DetailRow label="review_only" value={String(item.reviewOnly)} />
            <DetailRow label="accepted_state" value={String(item.acceptedState)} />
          </dl>
          <div className="codex-former-inbox-link-row">
            <SafeLink link={item.safeLinks.sessionPanel} />
            <SafeLink link={item.safeLinks.constellationPreview} />
          </div>
        </>
      )}
    </section>
  );
}

function WarningBlockingTriage({
  items,
  selectedItem,
}: {
  items: CodexFormerCaptureReviewInboxItem[];
  selectedItem: CodexFormerCaptureReviewInboxItem | null;
}) {
  const blockedItems = items.filter((item) => item.reviewability === "blocked");
  const warningItems = items.filter(
    (item) => item.warningCount > 0 && item.reviewability !== "blocked",
  );
  const pendingItems = items.filter(
    (item) =>
      item.reviewability === "not_ready" || item.reviewability === "waiting",
  );

  return (
    <section
      className={`codex-former-inbox-triage${
        selectedItem?.tone === "blocked" ? " tone-blocked" : ""
      }`}
      aria-label="Warning / Blocking Triage"
      data-augnes-region="warning-blocking-triage"
    >
      <h2>Warning / Blocking Triage</h2>
      <div className="codex-former-inbox-triage-stats">
        <span>blocked items {blockedItems.length}</span>
        <span>warning items {warningItems.length}</span>
        <span>pending items {pendingItems.length}</span>
      </div>
      {selectedItem ? (
        <article className={`tone-${selectedItem.tone}`}>
          <strong>{selectedItem.warningSummary.label}</strong>
          <ul>
            {(selectedItem.warningSummary.examples.length > 0
              ? selectedItem.warningSummary.examples
              : ["No warning examples for this bounded fixture item."]
            ).map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
          {selectedItem.blockedReasonSummary.examples.length > 0 ? (
            <>
              <strong>{selectedItem.blockedReasonSummary.label}</strong>
              <ul>
                {selectedItem.blockedReasonSummary.examples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}

function AuthorityBoundaryBox({
  item,
  onOpenChange,
  open,
}: {
  item: CodexFormerCaptureReviewInboxItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <details
      className="codex-former-inbox-authority"
      data-augnes-region="authority-boundary-box"
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
    >
      <summary>
        <span>Authority Boundary Box</span>
        <small>review-only, non-authorizing, no review decisions</small>
      </summary>
      {!item ? (
        <p>No selected item authority facts.</p>
      ) : (
        <>
          <div className="codex-former-inbox-tag-grid" aria-label="Authority tags">
            {item.authorityTags.slice(0, 12).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <dl>
            {item.authorityFacts.map((fact) => (
              <DetailRow key={fact.label} label={fact.label} value={fact.value} />
            ))}
          </dl>
        </>
      )}
    </details>
  );
}

function SafeNextActions({
  item,
}: {
  item: CodexFormerCaptureReviewInboxItem | null;
}) {
  return (
    <section
      className="codex-former-inbox-actions"
      aria-label="Safe Next Actions"
      data-augnes-region="safe-next-actions"
    >
      <h2>Safe Next Actions</h2>
      <p>{item?.nextSafeAction ?? "Select a review item for advisory guidance."}</p>
      <span>Guidance only. No executable prepare, validate, Codex, GitHub, DB, approve, promote, reject, merge, deploy, or Core decision control is present.</span>
    </section>
  );
}

function EmptyInvalidState({
  inbox,
}: {
  inbox: CodexFormerCaptureReviewInboxFixture;
}) {
  return (
    <section
      className="codex-former-inbox-empty-state"
      aria-label="Empty / Invalid State"
      data-augnes-region="empty-invalid-state"
    >
      <h2>Empty / Invalid State</h2>
      <article>
        <strong>{inbox.emptyState.title}</strong>
        <p>{inbox.emptyState.detail}</p>
        <span>{inbox.emptyState.nextSafeAction}</span>
      </article>
      <article>
        <strong>{inbox.invalidState.title}</strong>
        <p>{inbox.invalidState.detail}</p>
        <span>{inbox.invalidState.nextSafeAction}</span>
      </article>
    </section>
  );
}

function SafeLink({
  link,
}: {
  link: CodexFormerCaptureReviewInboxItem["safeLinks"]["sessionPanel"];
}) {
  if (!link.available || !link.href) {
    return (
      <span className="codex-former-inbox-disabled-link">
        {link.label}: {link.detail}
      </span>
    );
  }

  return (
    <a href={link.href}>
      {link.label}
      <span>{link.detail}</span>
    </a>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
