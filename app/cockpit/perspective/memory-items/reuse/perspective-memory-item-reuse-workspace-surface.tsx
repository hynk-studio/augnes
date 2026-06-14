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
} from "@/lib/perspective-ingest/perspective-memory-item-review-workspace";
import {
  PERSPECTIVE_MEMORY_REUSE_TARGET_MODE,
  PERSPECTIVE_MEMORY_REUSE_WORKSPACE_ROUTE,
  PERSPECTIVE_MEMORY_REUSE_WORKSPACE_VERSION,
  buildPerspectiveMemoryReusePacket,
  type PerspectiveMemoryReuseBriefMetadataV01,
  type PerspectiveMemoryReuseSelectionInput,
} from "@/lib/perspective-ingest/perspective-memory-item-reuse-packet";
import styles from "./perspective-memory-item-reuse-workspace-surface.module.css";

const BOUNDARY_INBOX_ROUTE =
  "/cockpit/perspective/memory-boundary-review-inbox";
const LOCAL_MEMORY_REVIEW_QUEUE_ROUTE =
  "/cockpit/perspective/memory-review-queue/local";
const OPERATOR_FLOW_ROUTE =
  "/cockpit/perspective/codex-former/local-adapter-operator-flow";

type SelectionNotesById = Record<
  string,
  {
    why_selected: string;
    reuse_boundary: string;
  }
>;

const emptyItemList = createEmptyPerspectiveMemoryItemList("not_loaded");

export function PerspectiveMemoryItemReuseWorkspaceSurface() {
  const [itemList, setItemList] =
    useState<PerspectiveMemoryItemListV0>(emptyItemList);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectionNotesById, setSelectionNotesById] =
    useState<SelectionNotesById>({});
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [loadStatus, setLoadStatus] = useState("reuse workspace not loaded");
  const [packetGeneratedAt, setPacketGeneratedAt] = useState("not_generated");
  const [copyStatus, setCopyStatus] = useState("nothing copied");

  useEffect(() => {
    setSelectedItemIds(parsePreselectedItemIds());
    setPacketGeneratedAt(new Date().toISOString());
    void loadItems();
  }, []);

  const selectedInputs = useMemo<PerspectiveMemoryReuseSelectionInput[]>(
    () =>
      selectedItemIds.map((itemId) => ({
        memory_item_id: itemId,
        why_selected: selectionNotesById[itemId]?.why_selected ?? "",
        reuse_boundary: selectionNotesById[itemId]?.reuse_boundary ?? "",
      })),
    [selectedItemIds, selectionNotesById],
  );
  const packetResult = useMemo(
    () =>
      buildPerspectiveMemoryReusePacket({
        items: itemList.items,
        selected_memory_items: selectedInputs,
        task_title: taskTitle,
        task_description: taskDescription,
        nowIso: packetGeneratedAt,
      }),
    [itemList.items, packetGeneratedAt, selectedInputs, taskDescription, taskTitle],
  );
  const packetJson = useMemo(
    () => JSON.stringify(packetResult.packet, null, 2),
    [packetResult.packet],
  );
  const selectedItems = useMemo(
    () =>
      selectedItemIds
        .map((itemId) => itemList.items.find((item) => item.item_id === itemId))
        .filter((item): item is PerspectiveMemoryItemV0 => item != null),
    [itemList.items, selectedItemIds],
  );

  async function loadItems() {
    setLoadStatus("loading persisted perspective-memory items for reuse");
    try {
      const response = await fetch(`${PERSPECTIVE_MEMORY_ITEM_API_ROUTE}?limit=100`, {
        method: "GET",
      });
      const body = await response.json();
      if (!response.ok || body?.ok !== true) {
        const reasons = Array.isArray(body?.blocked_reasons)
          ? body.blocked_reasons.join("; ")
          : response.statusText;
        setLoadStatus(`reuse workspace load blocked: ${reasons}`);
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
        `reuse workspace load failed: ${
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

  function selectAllLoaded() {
    setSelectedItemIds((current) =>
      uniqueStrings([...current, ...itemList.items.map((item) => item.item_id)]),
    );
    setPacketGeneratedAt(new Date().toISOString());
  }

  function clearSelection() {
    setSelectedItemIds([]);
    setPacketGeneratedAt(new Date().toISOString());
  }

  function updateSelectionNote(
    itemId: string,
    field: "why_selected" | "reuse_boundary",
    value: string,
  ) {
    setSelectionNotesById((current) => ({
      ...current,
      [itemId]: {
        why_selected: current[itemId]?.why_selected ?? "",
        reuse_boundary: current[itemId]?.reuse_boundary ?? "",
        [field]: value,
      },
    }));
    setPacketGeneratedAt(new Date().toISOString());
  }

  async function copyText(label: string, value: string) {
    if (!navigator.clipboard) {
      setCopyStatus(`clipboard unavailable for ${label}`);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`${label} copied`);
    } catch (error) {
      setCopyStatus(
        `${label} copy failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return (
    <main
      className={styles.shell}
      data-augnes-surface="perspective-memory-items-reuse-workspace"
      data-augnes-perspective-memory-items-reuse-route="true"
    >
      <section className={styles.surface}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>Perspective Memory Reuse</p>
            <h1>Codex Memory Reuse Packet Workspace</h1>
            <p>
              Select persisted perspective-memory items, add task context and
              per-item reuse notes, then copy a deterministic packet and Codex
              Memory Brief without creating or mutating memory.
            </p>
          </div>
          <div className={styles.boundaryPills} aria-label="Reuse boundary">
            <span>deterministic local builder</span>
            <span>sqlite read API</span>
            <span>target mode: codex</span>
            <span>no memory creation</span>
            <span>no persistence writes</span>
            <span>no automatic synthesis</span>
            <span>no provider/model call</span>
            <span>no Codex SDK</span>
            <span>no MCP tools</span>
            <span>no GitHub mutation</span>
          </div>
        </header>

        <nav className={styles.navRow} aria-label="Perspective-memory reuse navigation">
          <Link
            className={styles.linkButton}
            href={PERSPECTIVE_MEMORY_ITEMS_ROUTE}
            data-augnes-memory-items-reuse-dashboard-link="true"
          >
            Back to memory items dashboard
          </Link>
          <Link
            className={styles.linkButton}
            href={PERSPECTIVE_MEMORY_ITEM_SEARCH_ROUTE}
            data-augnes-memory-items-reuse-search-link="true"
          >
            Back to memory item search
          </Link>
          <Link
            className={styles.linkButton}
            href={PERSPECTIVE_MEMORY_ITEM_REVIEW_WORKSPACE_ROUTE}
            data-augnes-memory-items-reuse-review-link="true"
          >
            Open review workspace
          </Link>
          <Link
            className={styles.linkButton}
            href={BOUNDARY_INBOX_ROUTE}
            data-augnes-memory-items-reuse-boundary-inbox-link="true"
          >
            Back to boundary review inbox
          </Link>
          <Link
            className={styles.linkButton}
            href={LOCAL_MEMORY_REVIEW_QUEUE_ROUTE}
            data-augnes-memory-items-reuse-local-queue-link="true"
          >
            Back to local memory review queue
          </Link>
          <Link
            className={styles.linkButton}
            href={OPERATOR_FLOW_ROUTE}
            data-augnes-memory-items-reuse-operator-flow-link="true"
          >
            Open local Codex adapter operator flow
          </Link>
        </nav>

        <section className={styles.statusStrip} aria-label="Reuse workspace status">
          <StatusCell label="route" value={PERSPECTIVE_MEMORY_REUSE_WORKSPACE_ROUTE} />
          <StatusCell label="version" value={PERSPECTIVE_MEMORY_REUSE_WORKSPACE_VERSION} />
          <StatusCell label="api_route" value={PERSPECTIVE_MEMORY_ITEM_API_ROUTE} />
          <StatusCell
            label="persistence_backend"
            value={PERSPECTIVE_MEMORY_ITEM_STORE_BACKEND}
          />
          <StatusCell label="target_mode" value={PERSPECTIVE_MEMORY_REUSE_TARGET_MODE} />
          <StatusCell label="total_item_count" value={String(itemList.items.length)} />
          <StatusCell label="selected_count" value={String(selectedItemIds.length)} />
          <StatusCell
            label="missing_item_ids"
            value={
              packetResult.packet.missing_memory_item_ids.length > 0
                ? packetResult.packet.missing_memory_item_ids.join(", ")
                : "none"
            }
          />
          <StatusCell label="load_status" value={loadStatus} />
          <StatusCell label="copy_status" value={copyStatus} />
        </section>

        <section className={styles.controlPanel} aria-label="Reuse packet controls">
          <div className={styles.taskGrid}>
            <label className={styles.fieldGroup} htmlFor="reuse-task-title">
              <span>Task title</span>
              <input
                id="reuse-task-title"
                className={styles.input}
                data-augnes-memory-items-reuse-task-title="true"
                value={taskTitle}
                onChange={(event) => {
                  setTaskTitle(event.target.value);
                  setPacketGeneratedAt(new Date().toISOString());
                }}
                placeholder="Short Codex task title"
              />
            </label>
            <label className={styles.fieldGroup} htmlFor="reuse-task-description">
              <span>Task description</span>
              <textarea
                id="reuse-task-description"
                className={styles.textArea}
                data-augnes-memory-items-reuse-task-description="true"
                value={taskDescription}
                onChange={(event) => {
                  setTaskDescription(event.target.value);
                  setPacketGeneratedAt(new Date().toISOString());
                }}
                placeholder="What should the next Codex worker use this memory for?"
              />
            </label>
          </div>

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.button}
              data-augnes-memory-items-reuse-select-all-loaded="true"
              onClick={selectAllLoaded}
            >
              Select all loaded
            </button>
            <button
              type="button"
              className={styles.button}
              data-augnes-memory-items-reuse-clear-selection="true"
              onClick={clearSelection}
            >
              Clear selection
            </button>
            <button
              type="button"
              className={styles.button}
              data-augnes-memory-items-reuse-reload="true"
              onClick={() => void loadItems()}
            >
              Reload items
            </button>
          </div>

          <section
            className={styles.policyBox}
            aria-label="Reuse packet authority boundary"
            data-augnes-memory-items-reuse-read-only-boundary="true"
          >
            <strong>Authority boundary</strong>
            <p>
              This workspace reads persisted perspective-memory items and builds
              local text artifacts only. It does not create memory items, mutate
              Augnes state, persist reuse packets, write DB schema, run
              provider/model calls, call MCP tools, use Codex SDK, or perform
              GitHub mutation.
            </p>
          </section>
        </section>

        <section className={styles.workbenchGrid}>
          <section
            className={styles.panel}
            aria-label="Persisted perspective-memory item selector"
            data-augnes-memory-items-reuse-item-list="true"
          >
            <PanelHeader
              eyebrow="Persisted Items"
              title="Item Selection"
              detail={`loaded ${itemList.items.length}; selected ${selectedItemIds.length}`}
            />
            <div className={styles.itemList}>
              {itemList.items.length > 0 ? (
                itemList.items.map((item) => {
                  const selected = selectedItemIds.includes(item.item_id);
                  return (
                    <article
                      key={item.item_id}
                      className={classNames(
                        styles.itemListEntry,
                        selected ? styles.selectedItem : "",
                      )}
                      data-augnes-memory-items-reuse-item={item.item_id}
                    >
                      <div className={styles.itemHeader}>
                        <button
                          type="button"
                          className={styles.button}
                          data-augnes-memory-items-reuse-toggle-item={item.item_id}
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
                        <DetailRow label="summary" value={item.content.summary} />
                        <DetailRow
                          label="source_ref"
                          value={item.content.source_refs[0] ?? item.source_input_ref}
                        />
                        <DetailRow
                          label="source_validation_result_state"
                          value={item.source_validation_result_state}
                        />
                      </dl>
                    </article>
                  );
                })
              ) : (
                <p
                  className={styles.emptyState}
                  data-augnes-memory-items-reuse-empty-state="true"
                >
                  No persisted perspective-memory items loaded for reuse.
                </p>
              )}
            </div>
          </section>

          <section
            className={styles.panel}
            aria-label="Selected memory item reuse notes"
            data-augnes-memory-items-reuse-selection-notes="true"
          >
            <PanelHeader
              eyebrow="Per-Item Notes"
              title="Why Selected And Boundary"
              detail={`${selectedItems.length} selected item(s) loaded`}
            />
            {selectedItemIds.length === 0 ? (
              <p
                className={styles.emptyState}
                data-augnes-memory-items-reuse-empty-selection="true"
              >
                Select persisted perspective-memory items to add why_selected
                and reuse_boundary notes.
              </p>
            ) : null}
            <div className={styles.annotationList}>
              {selectedItemIds.map((itemId) => {
                const item = itemList.items.find((candidate) => candidate.item_id === itemId);
                const notes = selectionNotesById[itemId] ?? {
                  why_selected: "",
                  reuse_boundary: "",
                };
                return (
                  <article
                    key={itemId}
                    className={styles.summaryEntry}
                    data-augnes-memory-items-reuse-selected-item={itemId}
                  >
                    <PanelHeader
                      eyebrow={item ? item.item_status : "missing"}
                      title={item?.content.title ?? itemId}
                      detail={itemId}
                    />
                    <label className={styles.fieldGroup}>
                      <span>why_selected</span>
                      <textarea
                        className={styles.textArea}
                        data-augnes-memory-items-reuse-why-selected={itemId}
                        value={notes.why_selected}
                        onChange={(event) =>
                          updateSelectionNote(
                            itemId,
                            "why_selected",
                            event.target.value,
                          )
                        }
                        placeholder="Why is this memory relevant to the task?"
                      />
                    </label>
                    <label className={styles.fieldGroup}>
                      <span>reuse_boundary</span>
                      <textarea
                        className={styles.textArea}
                        data-augnes-memory-items-reuse-boundary={itemId}
                        value={notes.reuse_boundary}
                        onChange={(event) =>
                          updateSelectionNote(
                            itemId,
                            "reuse_boundary",
                            event.target.value,
                          )
                        }
                        placeholder="What should the next worker preserve or avoid?"
                      />
                    </label>
                  </article>
                );
              })}
            </div>
          </section>

          <ReuseOutputPanel
            packetJson={packetJson}
            codexMemoryBrief={packetResult.codex_memory_brief}
            briefMetadata={packetResult.codex_memory_brief_metadata}
            onCopy={copyText}
          />
        </section>
      </section>
    </main>
  );
}

function ReuseOutputPanel({
  packetJson,
  codexMemoryBrief,
  briefMetadata,
  onCopy,
}: {
  packetJson: string;
  codexMemoryBrief: string;
  briefMetadata: PerspectiveMemoryReuseBriefMetadataV01;
  onCopy: (label: string, value: string) => void;
}) {
  return (
    <section
      className={classNames(styles.panel, styles.packetPanel)}
      aria-label="Reuse packet and Codex Memory Brief"
      data-augnes-memory-items-reuse-output-panel="true"
    >
      <PanelHeader
        eyebrow="Reuse Artifacts"
        title="Packet JSON And Codex Memory Brief"
        detail="copyable deterministic local outputs"
      />
      <div className={styles.outputGrid}>
        <section
          className={styles.outputBlock}
          aria-label="Perspective memory reuse packet JSON"
        >
          <div className={styles.outputHeader}>
            <h3>Structured Reuse Packet JSON</h3>
            <button
              type="button"
              className={styles.button}
              data-augnes-memory-items-reuse-copy-packet="true"
              onClick={() => onCopy("reuse packet JSON", packetJson)}
            >
              Copy packet JSON
            </button>
          </div>
          <textarea
            className={styles.outputTextArea}
            data-augnes-memory-items-reuse-packet-json="true"
            readOnly
            value={packetJson}
          />
        </section>

        <section className={styles.outputBlock} aria-label="Codex Memory Brief">
          <div className={styles.outputHeader}>
            <h3>Codex Memory Brief</h3>
            <button
              type="button"
              className={styles.button}
              data-augnes-memory-items-reuse-copy-brief="true"
              onClick={() => onCopy("Codex Memory Brief", codexMemoryBrief)}
            >
              Copy brief
            </button>
          </div>
          <dl
            className={styles.detailGrid}
            aria-label="Codex Memory Brief metadata"
            data-augnes-memory-items-reuse-brief-metadata="true"
          >
            <DetailRow
              label="selected_item_count"
              value={String(briefMetadata.selected_item_count)}
            />
            <DetailRow
              label="codex_memory_brief_character_count"
              value={String(briefMetadata.codex_memory_brief_character_count)}
            />
            <DetailRow
              label="codex_memory_brief_line_count"
              value={String(briefMetadata.codex_memory_brief_line_count)}
            />
            <DetailRow
              label="has_large_selection_warning"
              value={briefMetadata.has_large_selection_warning ? "yes" : "no"}
            />
            <DetailRow
              label="compact_brief_recommended"
              value={briefMetadata.compact_brief_recommended ? "yes" : "no"}
            />
          </dl>
          <textarea
            className={styles.outputTextArea}
            data-augnes-memory-items-reuse-codex-brief="true"
            readOnly
            value={codexMemoryBrief}
          />
        </section>
      </div>
    </section>
  );
}

function parsePreselectedItemIds() {
  if (typeof window === "undefined") return [];
  const params = new URLSearchParams(window.location.search);
  const values = [
    params.get("item_id") ?? "",
    params.get("item_ids") ?? "",
  ];
  return uniqueStrings(
    values
      .flatMap((value) => value.split(","))
      .map((part) => part.trim())
      .filter(Boolean),
  );
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
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
