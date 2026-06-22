"use client";

import agentPerspectiveSubstratePreviewFixture from "@/fixtures/agent-perspective-substrate-preview.sample.v0.1.json";
import type {
  AgentPerspectiveRulePreviewGroup,
  AgentPerspectiveSubstratePreview,
  AgentPerspectiveSubstratePreviewSection,
  AgentPerspectiveSurfacingPreviewCard,
} from "@/types/agent-perspective-substrate-preview";
import { useMemo, useState } from "react";

type AgentPerspectiveSubstrateFoldedAuditPanelProps = {
  preview?: AgentPerspectiveSubstratePreview;
  fixturePath?: string;
};

const DEFAULT_FIXTURE_PATH =
  "fixtures/agent-perspective-substrate-preview.sample.v0.1.json";
const FORWARD_NEXT_RECOMMENDED_SLICE =
  "ai_context_packet_compiler_geometry_substrate_upgrade_v0_1";
const REQUIRED_SECTION_KINDS = [
  "blockers",
  "warnings",
  "notices",
  "retrieval_hints",
  "handoff_improvements",
  "stale_context",
  "product_write_stopline",
  "source_coverage",
] as const;

export function AgentPerspectiveSubstrateFoldedAuditPanel({
  preview = agentPerspectiveSubstratePreviewFixture as AgentPerspectiveSubstratePreview,
  fixturePath = DEFAULT_FIXTURE_PATH,
}: AgentPerspectiveSubstrateFoldedAuditPanelProps) {
  const [openSectionIds, setOpenSectionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const cardsBySectionId = useMemo(
    () => groupCardsBySection(preview.surfacing_cards),
    [preview.surfacing_cards],
  );

  function toggleSection(sectionId: string) {
    setOpenSectionIds((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  return (
    <section
      id="agent-perspective-substrate-folded-audit-panel"
      className="perspective-section"
      aria-label="Agent Perspective Substrate folded audit panel"
      data-augnes-authority="read-only preview-only advisory non-SSOT no-write no-route no-agent-execution no-product-write"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">Agent Perspective Substrate</p>
          <h2>Folded audit panel</h2>
          <p>
            Human-facing folded advisory projection rendered from{" "}
            <code>{fixturePath}</code>. This panel is advisory only, preview only, non-SSOT, and non-authoritative.
          </p>
          <p>
            It creates no proof/evidence, performs no work mutation, promotes
            no Perspective state, executes no retrieval, routes or executes no agents, and grants no product write authority. Product-write lane remains parked by #686.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">folded-by-default</span>
          <span className="status-pill">static fixture</span>
          <span className="status-pill">preview-only</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          preview_version <code>{preview.preview_version}</code>
        </span>
        <span>
          preview_mode <code>{preview.preview_mode}</code>
        </span>
        <span>
          fingerprint <code>{preview.fingerprint}</code>
        </span>
        <span>
          fixture next <code>{preview.next_recommended_slice}</code>
        </span>
      </div>

      <div className="perspective-workbench-status-row">
        <span>local React state only for section toggles</span>
        <span>no persistence</span>
        <span>no route/API call</span>
        <span>no DB/SQL/transaction</span>
        <span>no provider/OpenAI call</span>
        <span>no durable feedback persistence</span>
      </div>

      <div className="tab-stat-row" aria-label="Agent substrate preview diagnostics">
        <Metric label="sections" value={preview.diagnostics.folded_section_count} />
        <Metric label="cards" value={preview.diagnostics.surfacing_card_count} />
        <Metric label="blockers" value={preview.diagnostics.blocker_card_count} />
        <Metric label="warnings" value={preview.diagnostics.warning_card_count} />
        <Metric label="notices" value={preview.diagnostics.notice_card_count} />
        <Metric label="retrieval hints" value={preview.diagnostics.retrieval_hint_card_count} />
        <Metric
          label="source coverage"
          value={preview.diagnostics.source_ref_coverage_ratio}
        />
        <Metric
          label="missing boundary"
          value={preview.diagnostics.missing_source_ref_without_boundary_count}
        />
      </div>

      <section className="perspective-inspector-section">
        <h3>Folded-by-default sections</h3>
        <p>
          Sections are folded by default. Toggle state is local React state only
          and is not persisted, not routed, and not written anywhere.
        </p>
        <div className="perspective-formation-summary-grid">
          {preview.folded_sections.map((section) => (
            <article key={section.section_id}>
              <span>{section.section_kind}</span>
              <strong>{section.item_count}</strong>
              <small>
                blocker {section.severity_counts.blocker} / warning{" "}
                {section.severity_counts.warning} / notice{" "}
                {section.severity_counts.notice} / info{" "}
                {section.severity_counts.info}
              </small>
            </article>
          ))}
        </div>
        <p>
          Required section kinds: <code>{REQUIRED_SECTION_KINDS.join(", ")}</code>
        </p>
      </section>

      <div className="perspective-detail-stack">
        {preview.folded_sections.map((section) => {
          const isOpen = openSectionIds.has(section.section_id);
          const cards = cardsBySectionId[section.section_id] ?? [];
          return (
            <section
              key={section.section_id}
              className="perspective-inspector-section"
              data-section-kind={section.section_kind}
            >
              <div className="perspective-constellation-shell-header">
                <div>
                  <h3>{section.section_title}</h3>
                  <p>
                    <code>{section.section_kind}</code> contains{" "}
                    <code>{section.item_count}</code> preview items and{" "}
                    <code>{section.source_ref_count}</code> unique source refs.
                  </p>
                  <p>
                    folded_by_default <code>{String(section.folded_by_default)}</code>{" "}
                    preview_only <code>{String(section.preview_only)}</code>
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  aria-expanded={isOpen}
                  aria-controls={`${section.section_id}-cards`}
                  onClick={() => toggleSection(section.section_id)}
                >
                  {isOpen ? "Fold section" : "Inspect preview"}
                </button>
              </div>
              <SectionCounts section={section} />
              {isOpen ? (
                <div id={`${section.section_id}-cards`} className="compact-list">
                  {cards.length > 0 ? (
                    cards.map((card) => (
                      <SurfacingCard key={card.card_id} card={card} />
                    ))
                  ) : (
                    <p>No surfacing cards are represented in this folded section.</p>
                  )}
                </div>
              ) : (
                <p>
                  Folded preview. Use Inspect preview to view cards without
                  persistence or execution.
                </p>
              )}
            </section>
          );
        })}
      </div>

      <section className="perspective-inspector-section">
        <h3>Rule groups</h3>
        <div className="perspective-constellation-workspace-grid">
          {preview.rule_groups.map((group) => (
            <RuleGroup key={group.rule_group_id} group={group} />
          ))}
        </div>
      </section>

      <section className="perspective-inspector-section">
        <h3>Source coverage preview</h3>
        <div className="perspective-workbench-status-row">
          <span>
            total_source_ref_count{" "}
            <code>{preview.source_coverage_preview.total_source_ref_count}</code>
          </span>
          <span>
            surfaced_card_count{" "}
            <code>{preview.source_coverage_preview.surfaced_card_count}</code>
          </span>
          <span>
            cards_with_source_refs_count{" "}
            <code>
              {preview.source_coverage_preview.cards_with_source_refs_count}
            </code>
          </span>
          <span>
            cards_with_boundary_note_count{" "}
            <code>
              {preview.source_coverage_preview.cards_with_boundary_note_count}
            </code>
          </span>
          <span>
            cards_missing_source_refs_without_boundary_note_count{" "}
            <code>
              {
                preview.source_coverage_preview
                  .cards_missing_source_refs_without_boundary_note_count
              }
            </code>
          </span>
        </div>
        <ListBlock
          title="source_ref_ids"
          values={preview.source_coverage_preview.source_ref_ids}
        />
        <ListBlock
          title="source_coverage_warnings"
          values={preview.source_coverage_preview.source_coverage_warnings}
        />
      </section>

      <section className="perspective-inspector-section">
        <h3>Diagnostics</h3>
        <div className="perspective-workbench-status-row">
          {Object.entries(preview.diagnostics).map(([key, value]) => (
            <span key={key}>
              {key} <code>{String(value)}</code>
            </span>
          ))}
        </div>
      </section>

      <section className="perspective-inspector-section">
        <h3>Authority boundary</h3>
        <p>
          execution_authority <code>false</code> durable_write_authority{" "}
          <code>false</code> product_write_available <code>false</code>
        </p>
        <div className="perspective-workbench-status-row">
          {Object.entries(preview.authority_boundary).map(([key, value]) => (
            <span key={key}>
              {key} <code>{String(value)}</code>
            </span>
          ))}
        </div>
      </section>

      <section className="perspective-inspector-section">
        <h3>Next preview note</h3>
        <p>
          Current fixture slice: <code>{preview.next_recommended_slice}</code>.
          Forward preview note: <code>{FORWARD_NEXT_RECOMMENDED_SLICE}</code>.
        </p>
        <p>
          The forward slice is advisory planning only from this panel; no route,
          no API, no feedback persistence, no agent execution, and no product
          write are available here.
        </p>
      </section>
    </section>
  );
}

function SectionCounts({
  section,
}: {
  section: AgentPerspectiveSubstratePreviewSection;
}) {
  return (
    <div className="perspective-workbench-status-row">
      <span>
        item_count <code>{section.item_count}</code>
      </span>
      <span>
        blocker <code>{section.severity_counts.blocker}</code>
      </span>
      <span>
        warning <code>{section.severity_counts.warning}</code>
      </span>
      <span>
        notice <code>{section.severity_counts.notice}</code>
      </span>
      <span>
        info <code>{section.severity_counts.info}</code>
      </span>
      <span>
        source_ref_count <code>{section.source_ref_count}</code>
      </span>
    </div>
  );
}

function SurfacingCard({ card }: { card: AgentPerspectiveSurfacingPreviewCard }) {
  return (
    <article className="cockpit-surface-card">
      <div className="meta-row">
        <span>
          severity <code>{card.severity}</code>
        </span>
        <span>
          impact <code>{card.impact}</code>
        </span>
        <span>
          confidence <code>{card.confidence}</code>
        </span>
        <span>
          epistemic_status <code>{card.epistemic_status}</code>
        </span>
        <span>
          review_status <code>{card.review_status}</code>
        </span>
      </div>
      <h4>{card.title}</h4>
      <p>{card.message}</p>
      <p>
        why_now <code>{card.why_now}</code>
      </p>
      <p>
        execution_authority <code>{String(card.execution_authority)}</code>{" "}
        durable_write_authority <code>{String(card.durable_write_authority)}</code>{" "}
        product_write_available <code>{String(card.product_write_available)}</code>
      </p>
      {card.source_refs.length > 0 ? (
        <ListBlock
          title="source_refs"
          values={card.source_refs.map((sourceRef) => sourceRef.source_ref_id)}
        />
      ) : (
        <p>
          source coverage boundary note{" "}
          <code>{card.source_coverage_boundary_note ?? "missing"}</code>
        </p>
      )}
      <ListBlock
        title="authority_boundary_notes"
        values={card.authority_boundary_notes}
      />
      <div className="button-row" aria-label={`${card.card_id} preview labels`}>
        {card.suggested_user_actions.map((action) => (
          <button
            key={action}
            type="button"
            className="secondary-button"
            disabled
            title="preview-only. No durable action in this slice."
          >
            {formatPreviewAction(action)} - preview-only
          </button>
        ))}
      </div>
      <p>No durable action in this slice.</p>
    </article>
  );
}

function RuleGroup({ group }: { group: AgentPerspectiveRulePreviewGroup }) {
  return (
    <article className="cockpit-surface-card">
      <div className="meta-row">
        <span>
          rule_group_id <code>{group.rule_group_id}</code>
        </span>
        <span>
          severity <code>{group.severity}</code>
        </span>
      </div>
      <ListBlock title="rule_names" values={group.rule_names} />
      <ListBlock title="rule_fire_ids" values={group.rule_fire_ids} />
      <ListBlock title="source_node_ids" values={group.source_node_ids} />
      <ListBlock title="surfacing_card_ids" values={group.surfacing_card_ids} />
      <p>
        why_now_summary <code>{group.why_now_summary}</code>
      </p>
      <ListBlock
        title="authority_boundary_notes"
        values={group.authority_boundary_notes}
      />
    </article>
  );
}

function ListBlock({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <strong>{title}</strong>
      {values.length > 0 ? (
        <ul>
          {values.map((value) => (
            <li key={value}>
              <code>{value}</code>
            </li>
          ))}
        </ul>
      ) : (
        <p>none</p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function groupCardsBySection(
  cards: AgentPerspectiveSurfacingPreviewCard[],
): Record<string, AgentPerspectiveSurfacingPreviewCard[]> {
  return cards.reduce<Record<string, AgentPerspectiveSurfacingPreviewCard[]>>(
    (groups, card) => {
      for (const sectionId of card.folded_section_ids) {
        groups[sectionId] = groups[sectionId] ?? [];
        groups[sectionId].push(card);
      }
      return groups;
    },
    {},
  );
}

function formatPreviewAction(action: string): string {
  return action.replace(/_/g, " ");
}
