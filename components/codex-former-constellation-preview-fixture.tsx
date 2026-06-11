"use client";

import {
  getCodexFormerPreviewDrawerById,
  validateCodexFormerConstellationPreviewSurfaceData,
} from "@/lib/perspective-ingest/codex-former-constellation-preview-fixture-surface";
import type {
  CodexFormerPreviewData,
  CodexFormerPreviewDetailDrawer,
  CodexFormerPreviewGraphEdge,
  CodexFormerPreviewGraphNode,
  CodexFormerPreviewWarningGroup,
} from "@/lib/perspective-ingest/codex-former-constellation-preview-fixture-surface";
import { useMemo, useState } from "react";

type FixtureEntry = {
  id: "pass-with-follow-up" | "blocked";
  label: string;
  previewData: CodexFormerPreviewData;
};

type DetailSelection =
  | { kind: "summary"; drawerId: "drawer:summary" }
  | { kind: "warnings"; drawerId: "drawer:warning_panel" }
  | { kind: "authority"; drawerId: "drawer:authority_lens" }
  | { kind: "node"; id: string; drawerId: string }
  | { kind: "edge"; id: string; drawerId: string };

export function CodexFormerConstellationPreviewFixtureSurface({
  fixtures,
}: {
  fixtures: FixtureEntry[];
}) {
  const [selectedFixtureId, setSelectedFixtureId] =
    useState<FixtureEntry["id"]>("pass-with-follow-up");
  const [detailSelection, setDetailSelection] = useState<DetailSelection>({
    kind: "summary",
    drawerId: "drawer:summary",
  });
  const [warningOpen, setWarningOpen] = useState(false);
  const [authorityOpen, setAuthorityOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  const selectedFixture =
    fixtures.find((fixture) => fixture.id === selectedFixtureId) ?? null;
  const previewData = selectedFixture?.previewData ?? null;
  const validation = useMemo(
    () =>
      previewData
        ? validateCodexFormerConstellationPreviewSurfaceData(previewData)
        : { valid: false, errors: ["no fixture selected or available"] },
    [previewData],
  );

  const selectedDrawer = useMemo(() => {
    if (!previewData) {
      return null;
    }

    return getCodexFormerPreviewDrawerById(previewData, detailSelection.drawerId);
  }, [detailSelection.drawerId, previewData]);

  function selectFixture(fixtureId: FixtureEntry["id"]) {
    setSelectedFixtureId(fixtureId);
    setDetailSelection({ kind: "summary", drawerId: "drawer:summary" });
    const nextFixture = fixtures.find((fixture) => fixture.id === fixtureId);
    setWarningOpen(!Boolean(nextFixture?.previewData.warning_panel.default_collapsed));
    setAuthorityOpen(Boolean(nextFixture?.previewData.authority_lens.default_enabled));
    setLegendOpen(false);
  }

  return (
    <main
      className="cockpit-shell codex-former-fixture-shell"
      data-augnes-surface="codex-former-constellation-preview-fixture"
    >
      <section className="cockpit-surface-card codex-former-fixture-surface">
        <header className="codex-former-fixture-header">
          <div>
            <p className="panel-eyebrow">Constellation Preview</p>
            <h1>Codex Former Fixture Preview</h1>
            <p>
              Read-only fixture-backed review surface for adapted Codex Former
              constellation preview data.
            </p>
          </div>
          <div
            className="codex-former-fixture-selector"
            role="tablist"
            aria-label="Codex Former preview fixtures"
          >
            {fixtures.map((fixture) => (
              <button
                key={fixture.id}
                type="button"
                role="tab"
                aria-selected={fixture.id === selectedFixtureId}
                className={
                  fixture.id === selectedFixtureId
                    ? "codex-former-fixture-tab is-active"
                    : "codex-former-fixture-tab"
                }
                data-augnes-fixture-tab={fixture.id}
                onClick={() => selectFixture(fixture.id)}
              >
                {fixture.label}
              </button>
            ))}
          </div>
        </header>

        {!previewData ? (
          <SurfaceState
            title="No fixture selected"
            detail="Fixture preview data is not loaded yet."
          />
        ) : validation.valid ? (
          <>
            <SummaryStrip
              previewData={previewData}
              onSelect={() =>
                setDetailSelection({ kind: "summary", drawerId: "drawer:summary" })
              }
            />

            <div className="codex-former-preview-layout">
              <GraphCanvas
                previewData={previewData}
                onSelectNode={(node) =>
                  setDetailSelection({
                    kind: "node",
                    id: node.id,
                    drawerId: node.detail_drawer_id,
                  })
                }
                onSelectEdge={(edge) =>
                  setDetailSelection({
                    kind: "edge",
                    id: edge.id,
                    drawerId: edge.detail_drawer_id,
                  })
                }
                selectedId={"id" in detailSelection ? detailSelection.id : null}
              />

              <div className="codex-former-side-stack">
                <WarningPanel
                  previewData={previewData}
                  open={warningOpen}
                  onOpenChange={setWarningOpen}
                  onSelect={() =>
                    setDetailSelection({
                      kind: "warnings",
                      drawerId: "drawer:warning_panel",
                    })
                  }
                />
                <AuthorityLens
                  previewData={previewData}
                  open={authorityOpen}
                  onOpenChange={setAuthorityOpen}
                  onSelect={() =>
                    setDetailSelection({
                      kind: "authority",
                      drawerId: "drawer:authority_lens",
                    })
                  }
                />
                <Legend
                  previewData={previewData}
                  open={legendOpen}
                  onOpenChange={setLegendOpen}
                />
              </div>
            </div>

            <DetailPanel
              drawer={selectedDrawer}
              selection={detailSelection}
              previewData={previewData}
            />
          </>
        ) : (
          <SurfaceState
            title="Invalid fixture preview data"
            detail={validation.errors.join("; ")}
          />
        )}
      </section>
    </main>
  );
}

function SummaryStrip({
  onSelect,
  previewData,
}: {
  previewData: CodexFormerPreviewData;
  onSelect: () => void;
}) {
  const summary = previewData.summary_panel;
  const blocked = summary.overall_status === "blocked";

  return (
    <section
      className={`codex-former-summary-strip${blocked ? " is-blocked" : ""}`}
      aria-label="Summary Strip"
      data-augnes-region="summary-strip"
    >
      <button
        type="button"
        className="codex-former-summary-button"
        onClick={onSelect}
      >
        Inspect summary details
      </button>
      <article>
        <span className="codex-former-state-prefix">
          {blocked ? "Stopped result" : "Review result"}
        </span>
        <strong>{summary.primary_status_label}</strong>
        <p>{summary.primary_caveat_label}</p>
      </article>
      <article>
        <span>Next safe action</span>
        <p>{summary.next_safe_action_label}</p>
      </article>
      <article>
        <span>Review-only state</span>
        <strong>{summary.is_review_only ? "true" : "false"}</strong>
      </article>
      <article>
        <span>Accepted Augnes state</span>
        <strong>{summary.is_accepted_state ? "true" : "false"}</strong>
      </article>
    </section>
  );
}

function GraphCanvas({
  onSelectEdge,
  onSelectNode,
  previewData,
  selectedId,
}: {
  previewData: CodexFormerPreviewData;
  onSelectNode: (node: CodexFormerPreviewGraphNode) => void;
  onSelectEdge: (edge: CodexFormerPreviewGraphEdge) => void;
  selectedId: string | null;
}) {
  const nodesById = new Map(
    previewData.graph.nodes.map((node) => [node.id, node.label]),
  );

  return (
    <section
      className="codex-former-graph-canvas"
      aria-label="Graph Canvas"
      data-augnes-region="graph-canvas"
    >
      <header>
        <div>
          <h2>Graph Canvas</h2>
          <p>
            Nodes are read-only fixture summaries. Edges show relation and line
            style without drag, write, or decision controls.
          </p>
        </div>
        <span className="codex-former-graph-count">
          {previewData.graph.nodes.length} nodes / {previewData.graph.edges.length} edges
        </span>
      </header>

      <div className="codex-former-graph-grid">
        <section aria-label="Graph nodes">
          <h3>Nodes</h3>
          <div className="codex-former-node-list">
            {previewData.graph.nodes.map((node, index) => (
              <button
                key={node.id}
                type="button"
                className={`codex-former-node-card tone-${node.tone}${
                  selectedId === node.id ? " is-selected" : ""
                }`}
                data-augnes-graph-node-id={node.id}
                onClick={() => onSelectNode(node)}
                aria-label={`${node.label}. Status ${node.status}. Authority ${node.authority}. Tone ${node.tone}.`}
              >
                <span className="codex-former-node-index">{index + 1}</span>
                <span className="codex-former-node-main">
                  <strong>{node.label}</strong>
                  <span>{node.compact_summary}</span>
                </span>
                <span className="codex-former-node-meta">
                  <span>{node.status}</span>
                  <span>{node.tone}</span>
                </span>
                <span
                  className="codex-former-badge-row"
                  data-augnes-node-badge-count={Math.min(node.badges.length, 2)}
                >
                  {node.badges.slice(0, 2).map((badge) => (
                    <span key={badge}>{badge}</span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section aria-label="Graph edges">
          <h3>Edges</h3>
          <div className="codex-former-edge-list">
            {previewData.graph.edges.map((edge) => (
              <button
                key={edge.id}
                type="button"
                className={`codex-former-edge-row line-${edge.line_style} tone-${edge.tone}${
                  selectedId === edge.id ? " is-selected" : ""
                }`}
                data-augnes-graph-edge-id={edge.id}
                onClick={() => onSelectEdge(edge)}
                aria-label={`${nodesById.get(edge.from) ?? edge.from} to ${
                  nodesById.get(edge.to) ?? edge.to
                }. Relation ${edge.label}. Line style ${edge.line_style}. Tone ${edge.tone}.`}
              >
                <span className="codex-former-edge-path">
                  <strong>{nodesById.get(edge.from) ?? edge.from}</strong>
                  <span aria-hidden="true">-&gt;</span>
                  <strong>{nodesById.get(edge.to) ?? edge.to}</strong>
                </span>
                <span className="codex-former-edge-meta">
                  <span>{edge.label}</span>
                  <span>{edge.line_style}</span>
                  <span>{edge.status}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function WarningPanel({
  onSelect,
  onOpenChange,
  open,
  previewData,
}: {
  previewData: CodexFormerPreviewData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: () => void;
}) {
  const panel = previewData.warning_panel;
  const pressureLabel =
    panel.pointer_warning_count > 0
      ? "Pointer warning pressure"
      : panel.warning_count > 0
        ? "General warning pressure"
        : "No warning pressure";

  return (
    <details
      className={`codex-former-warning-panel${
        panel.has_blocking_warnings ? " is-blocked" : ""
      }`}
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
      data-augnes-region="warning-panel"
    >
      <summary>
        <span>Warning Panel</span>
        <small>
          {pressureLabel}: {panel.warning_count} warnings
        </small>
      </summary>
      <button
        type="button"
        className="secondary-button codex-former-detail-trigger"
        onClick={onSelect}
      >
        Inspect warning details
      </button>
      <div className="codex-former-warning-stats">
        <span>Warnings: {panel.warning_count}</span>
        <span>Pointer warnings: {panel.pointer_warning_count}</span>
        <span>Blocking: {panel.has_blocking_warnings ? "yes" : "no"}</span>
      </div>
      <WarningGroups groups={panel.blocked_reasons} title="Blocked reasons" />
      <WarningGroups groups={panel.grouped_warnings} title="Grouped warnings" />
    </details>
  );
}

function WarningGroups({
  groups,
  title,
}: {
  groups: CodexFormerPreviewWarningGroup[];
  title: string;
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="codex-former-warning-group">
      <h3>{title}</h3>
      {groups.map((group) => (
        <article key={group.id} className={`tone-${group.tone}`}>
          <strong>{group.label}</strong>
          <span>{group.count} bounded examples</span>
          <ul>
            {group.examples.slice(0, 3).map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

function AuthorityLens({
  onSelect,
  onOpenChange,
  open,
  previewData,
}: {
  previewData: CodexFormerPreviewData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: () => void;
}) {
  const lens = previewData.authority_lens;

  return (
    <details
      className="codex-former-authority-lens"
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
      data-augnes-region="authority-lens"
    >
      <summary>
        <span>Authority Lens</span>
        <small>{lens.available ? "available, collapsed by default" : "unavailable"}</small>
      </summary>
      <button
        type="button"
        className="secondary-button codex-former-detail-trigger"
        onClick={onSelect}
      >
        Inspect Authority Lens details
      </button>
      <p>{lens.summary}</p>
      <div className="codex-former-tag-grid" aria-label="Authority Lens tags">
        {lens.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="codex-former-flag-list">
        {Object.entries(lens.flags)
          .filter(([, value]) => value === false)
          .slice(0, 10)
          .map(([flag, value]) => (
            <span key={flag}>
              {flag}: {String(value)}
            </span>
          ))}
      </div>
    </details>
  );
}

function DetailPanel({
  drawer,
  previewData,
  selection,
}: {
  drawer: CodexFormerPreviewDetailDrawer | null;
  previewData: CodexFormerPreviewData;
  selection: DetailSelection;
}) {
  return (
    <aside
      className="codex-former-detail-panel"
      aria-label="Detail Panel"
      data-augnes-region="detail-panel"
      tabIndex={-1}
    >
      <header>
        <p className="panel-eyebrow">Details</p>
        <h2>{drawer?.title ?? "No detail drawer"}</h2>
        <span>{selection.kind}</span>
      </header>
      {drawer ? (
        <div className="codex-former-detail-section-list">
          {drawer.sections.map((section) => (
            <section key={section.heading}>
              <h3>{section.heading}</h3>
              {section.rows.length === 0 ? (
                <p>No rows for this section.</p>
              ) : (
                <dl>
                  {section.rows.slice(0, 12).map((row, index) => (
                    <div key={`${row.label}:${index}`}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          ))}
        </div>
      ) : (
        <SurfaceState
          title="No detail drawer available"
          detail="Select summary, warnings, Authority Lens, a node, or an edge."
        />
      )}
      <section className="codex-former-boundary-footnotes">
        <h3>Privacy and authority boundary</h3>
        <p>
          Raw payloads included: {String(previewData.privacy.raw_payloads_included)}.
          Bounded summaries only: {String(previewData.privacy.bounded_summaries_only)}.
        </p>
        <p>
          Authority flags remain false for persistence, provider/model calls,
          Codex execution, GitHub mutation, merge/publish/approval, and Core
          decision behavior.
        </p>
      </section>
    </aside>
  );
}

function Legend({
  onOpenChange,
  open,
  previewData,
}: {
  previewData: CodexFormerPreviewData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <details
      className="codex-former-legend"
      data-augnes-region="legend"
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
    >
      <summary>
        <span>Legend</span>
        <small>tones, line styles, badges, tags</small>
      </summary>
      <LegendMap title="Node tones" values={previewData.legend.node_tones} />
      <LegendMap title="Edge line styles" values={previewData.legend.edge_line_styles} />
      <LegendMap title="Badges" values={previewData.legend.badges} />
      <LegendMap
        title="Authority Lens tags"
        values={previewData.legend.authority_lens_tags}
      />
    </details>
  );
}

function LegendMap({
  title,
  values,
}: {
  title: string;
  values: Record<string, string>;
}) {
  return (
    <section>
      <h3>{title}</h3>
      <dl>
        {Object.entries(values).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SurfaceState({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="codex-former-surface-state" data-augnes-region="surface-state">
      <strong>{title}</strong>
      <p>{detail}</p>
    </section>
  );
}
