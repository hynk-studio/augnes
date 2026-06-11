"use client";

import { useEffect, useMemo, useState } from "react";
import {
  filterLocalAdapterSnapshotInboxItems,
  type LocalAdapterSnapshotFixtureSurfaceFilter,
  type LocalAdapterSnapshotFixtureSurfaceValidation,
} from "@/lib/perspective-ingest/codex-former-local-adapter-snapshot-fixture-surface";
import type {
  LocalAdapterInboxSurfaceItem,
  LocalAdapterInboxSurfaceViewModels,
  LocalAdapterSessionPanelSurfaceScenario,
  LocalAdapterSessionPanelSurfaceViewModels,
  LocalAdapterSnapshotSurfaceIntegrationReadiness,
} from "@/lib/perspective-ingest/codex-former-local-adapter-snapshot-surface-integration";

type DetailKey =
  | "session-evidence"
  | "session-authority"
  | "inbox-evidence"
  | "inbox-authority"
  | "readiness-matrix"
  | "readiness-policy";

export function CodexFormerLocalAdapterSnapshotFixtureSurface({
  inboxViewModels,
  readiness,
  sessionViewModels,
  validation,
}: {
  sessionViewModels: LocalAdapterSessionPanelSurfaceViewModels;
  inboxViewModels: LocalAdapterInboxSurfaceViewModels;
  readiness: LocalAdapterSnapshotSurfaceIntegrationReadiness;
  validation: LocalAdapterSnapshotFixtureSurfaceValidation;
}) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<
    LocalAdapterSessionPanelSurfaceScenario["scenario_id"]
  >(sessionViewModels.default_scenario_id);
  const [selectedFilter, setSelectedFilter] =
    useState<LocalAdapterSnapshotFixtureSurfaceFilter>(
      inboxViewModels.default_filter,
    );
  const [selectedItemId, setSelectedItemId] = useState<string>(
    inboxViewModels.default_selected_item_id,
  );
  const [openDetails, setOpenDetails] = useState<Record<DetailKey, boolean>>({
    "session-evidence": false,
    "session-authority": false,
    "inbox-evidence": false,
    "inbox-authority": false,
    "readiness-matrix": false,
    "readiness-policy": true,
  });

  const selectedScenario =
    sessionViewModels.scenarios.find(
      (scenario) => scenario.scenario_id === selectedScenarioId,
    ) ?? sessionViewModels.scenarios[0];

  const filteredItems = useMemo(
    () =>
      filterLocalAdapterSnapshotInboxItems(inboxViewModels.items, selectedFilter),
    [inboxViewModels.items, selectedFilter],
  );

  useEffect(() => {
    if (!filteredItems.some((item) => item.item_id === selectedItemId)) {
      setSelectedItemId(filteredItems[0]?.item_id ?? "");
    }
  }, [filteredItems, selectedItemId]);

  const selectedItem =
    filteredItems.find((item) => item.item_id === selectedItemId) ??
    filteredItems[0] ??
    null;

  function setDetailOpen(key: DetailKey, open: boolean) {
    setOpenDetails((current) => ({ ...current, [key]: open }));
  }

  return (
    <main
      className="cockpit-shell codex-former-adapter-snapshot-shell"
      data-augnes-surface="codex-former-local-adapter-snapshot-fixture"
    >
      <section className="cockpit-surface-card codex-former-adapter-snapshot-surface">
        <header className="codex-former-adapter-snapshot-header">
          <div>
            <p className="panel-eyebrow">Codex Former Local Adapter</p>
            <h1>Local Adapter Snapshot Fixture Surface</h1>
            <p>
              Read-only fixture-backed inspection surface for PR #519 Session
              Panel, Capture Review Inbox, and integration readiness view-models.
            </p>
          </div>
          <div
            className="codex-former-adapter-snapshot-boundary"
            aria-label="Surface boundary"
          >
            <span>fixture-backed</span>
            <span>local-only</span>
            <span>review-only</span>
            <span>no persistence</span>
            <span>no runtime mutation</span>
          </div>
        </header>

        {!validation.valid ? (
          <section className="codex-former-adapter-snapshot-alert">
            <h2>Fixture Contract Check</h2>
            <p>Committed fixture data failed the read-only surface contract.</p>
            <ul>
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section
          className="codex-former-adapter-snapshot-section-grid"
          aria-label="Adapter snapshot previews"
        >
          <SessionPanelPreview
            onDetailOpenChange={setDetailOpen}
            onScenarioChange={setSelectedScenarioId}
            openDetails={openDetails}
            scenarios={sessionViewModels.scenarios}
            selectedScenario={selectedScenario}
          />
          <CaptureReviewInboxPreview
            filteredItems={filteredItems}
            inboxViewModels={inboxViewModels}
            onDetailOpenChange={setDetailOpen}
            onFilterChange={setSelectedFilter}
            onItemSelect={setSelectedItemId}
            openDetails={openDetails}
            selectedFilter={selectedFilter}
            selectedItem={selectedItem}
          />
        </section>

        <IntegrationReadinessPreview
          onDetailOpenChange={setDetailOpen}
          openDetails={openDetails}
          readiness={readiness}
        />
      </section>
    </main>
  );
}

function SessionPanelPreview({
  onDetailOpenChange,
  onScenarioChange,
  openDetails,
  scenarios,
  selectedScenario,
}: {
  scenarios: LocalAdapterSessionPanelSurfaceScenario[];
  selectedScenario: LocalAdapterSessionPanelSurfaceScenario;
  openDetails: Record<DetailKey, boolean>;
  onScenarioChange: (scenarioId: LocalAdapterSessionPanelSurfaceScenario["scenario_id"]) => void;
  onDetailOpenChange: (key: DetailKey, open: boolean) => void;
}) {
  return (
    <section
      className="codex-former-adapter-snapshot-panel"
      aria-label={`Session Panel Preview. ${selectedScenario.primary_status_label}. ${selectedScenario.caveat_label}.`}
    >
      <header>
        <p className="panel-eyebrow">Session Panel Preview</p>
        <h2>Session Panel Preview</h2>
        <p>{selectedScenario.secondary_status_label}</p>
      </header>

      <div
        className="codex-former-adapter-snapshot-button-row"
        aria-label="Session scenario selector"
      >
        {scenarios.map((scenario) => (
          <button
            key={scenario.scenario_id}
            type="button"
            aria-pressed={scenario.scenario_id === selectedScenario.scenario_id}
            className={
              scenario.scenario_id === selectedScenario.scenario_id
                ? "codex-former-adapter-snapshot-chip is-active"
                : "codex-former-adapter-snapshot-chip"
            }
            data-augnes-snapshot-scenario={scenario.snapshot_state}
            onClick={() => onScenarioChange(scenario.scenario_id)}
          >
            {scenario.snapshot_state}
          </button>
        ))}
      </div>

      <article
        className={`codex-former-adapter-snapshot-status tone-${selectedScenario.display_tone}`}
      >
        <h3>Status Card</h3>
        <strong>{selectedScenario.primary_status_label}</strong>
        <p>{selectedScenario.caveat_label}</p>
        <dl>
          <DetailRow
            label="next safe action"
            value={selectedScenario.next_safe_action_label}
          />
          <DetailRow
            label="accepted state"
            value={String(selectedScenario.accepted_state)}
          />
          <DetailRow
            label="review-only boundary"
            value={String(selectedScenario.review_only)}
          />
          <DetailRow
            label="Constellation available"
            value={String(selectedScenario.handoff_status.constellation_available)}
          />
          <DetailRow
            label="validation available"
            value={String(selectedScenario.handoff_status.validation_available)}
          />
          <DetailRow
            label="returned candidate available"
            value={String(
              selectedScenario.handoff_status.returned_candidate_available,
            )}
          />
          <DetailRow
            label="prepare_helper_executed"
            value={
              selectedScenario.authority_summary
                .prepare_helper_executed_operational_only
                ? "operational provenance only"
                : "false"
            }
          />
        </dl>
      </article>

      <section className="codex-former-adapter-snapshot-timeline">
        <h3>Compact Timeline</h3>
        <ol>
          {selectedScenario.timeline.map((step, index) => (
            <li key={step.id} className={`status-${step.status}`}>
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
              <small>{step.status}</small>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <WarningGroups groups={selectedScenario.warning_groups} />

      <details
        className="codex-former-adapter-snapshot-details"
        open={openDetails["session-evidence"]}
        onToggle={(event) =>
          onDetailOpenChange("session-evidence", event.currentTarget.open)
        }
      >
        <summary>
          Evidence Cards
          <small>bounded paths, hashes, counts, and helper refs only</small>
        </summary>
        <div className="codex-former-adapter-snapshot-card-grid">
          {selectedScenario.evidence_cards.map((card) => (
            <article key={card.id}>
              <h4>{card.title}</h4>
              <dl>
                {card.rows.map((row) => (
                  <DetailRow
                    key={`${card.id}:${row.label}`}
                    label={row.label}
                    value={row.value}
                  />
                ))}
              </dl>
            </article>
          ))}
        </div>
      </details>

      <details
        className="codex-former-adapter-snapshot-details"
        open={openDetails["session-authority"]}
        onToggle={(event) =>
          onDetailOpenChange("session-authority", event.currentTarget.open)
        }
      >
        <summary>
          Authority Details
          <small>{selectedScenario.authority_summary.label}</small>
        </summary>
        <AuthorityFacts
          facts={selectedScenario.authority_details.facts}
          flags={selectedScenario.authority_details.flags}
          tags={selectedScenario.authority_details.tags}
        />
      </details>

      <section className="codex-former-adapter-snapshot-privacy">
        <h3>Privacy Summary</h3>
        <dl>
          <DetailRow
            label="bounded summaries only"
            value={String(selectedScenario.privacy_summary.bounded_summaries_only)}
          />
          <DetailRow
            label="raw payloads included"
            value={String(selectedScenario.privacy_summary.raw_payloads_included)}
          />
          <DetailRow
            label="raw prompt/source/packet content"
            value={String(
              !selectedScenario.privacy_summary
                .no_raw_prompt_source_or_packet_content,
            )}
          />
        </dl>
      </section>
    </section>
  );
}

function CaptureReviewInboxPreview({
  filteredItems,
  inboxViewModels,
  onDetailOpenChange,
  onFilterChange,
  onItemSelect,
  openDetails,
  selectedFilter,
  selectedItem,
}: {
  inboxViewModels: LocalAdapterInboxSurfaceViewModels;
  filteredItems: LocalAdapterInboxSurfaceItem[];
  selectedFilter: LocalAdapterSnapshotFixtureSurfaceFilter;
  selectedItem: LocalAdapterInboxSurfaceItem | null;
  openDetails: Record<DetailKey, boolean>;
  onFilterChange: (filter: LocalAdapterSnapshotFixtureSurfaceFilter) => void;
  onItemSelect: (itemId: string) => void;
  onDetailOpenChange: (key: DetailKey, open: boolean) => void;
}) {
  return (
    <section
      className="codex-former-adapter-snapshot-panel"
      aria-label={`Capture Review Inbox Preview. ${selectedItem?.primary_status ?? "No item selected"}.`}
    >
      <header>
        <p className="panel-eyebrow">Capture Review Inbox Preview</p>
        <h2>Capture Review Inbox Preview</h2>
        <p>
          all {inboxViewModels.counts.total}; reviewable count{" "}
          {inboxViewModels.counts.reviewable}; blocked count{" "}
          {inboxViewModels.counts.blocked}
        </p>
      </header>

      <div
        className="codex-former-adapter-snapshot-button-row"
        aria-label="Inbox filter bar"
      >
        {inboxViewModels.filters.map((filter) => (
          <button
            key={filter}
            type="button"
            aria-pressed={filter === selectedFilter}
            className={
              filter === selectedFilter
                ? "codex-former-adapter-snapshot-chip is-active"
                : "codex-former-adapter-snapshot-chip"
            }
            data-augnes-snapshot-filter={filter}
            onClick={() => onFilterChange(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="codex-former-adapter-snapshot-inbox-layout">
        <section
          className="codex-former-adapter-snapshot-item-list"
          aria-label="Adapter snapshot inbox items"
        >
          <h3>Item List</h3>
          <p>visible items {filteredItems.length}</p>
          {filteredItems.map((item) => (
            <button
              key={item.item_id}
              type="button"
              aria-pressed={item.item_id === selectedItem?.item_id}
              className={
                item.item_id === selectedItem?.item_id
                  ? `codex-former-adapter-snapshot-item tone-${item.display_tone} is-selected`
                  : `codex-former-adapter-snapshot-item tone-${item.display_tone}`
              }
              data-augnes-snapshot-inbox-item={item.item_id}
              onClick={() => onItemSelect(item.item_id)}
            >
              <strong>{item.title}</strong>
              <span>{item.source_session_label}</span>
              <span>
                stage {item.stage}; reviewability {item.reviewability}
                {item.stage === "prepared_waiting_for_codex_return"
                  ? " (waiting, not reviewable)"
                  : ""}
              </span>
              <span>{item.caveat}</span>
              <span className="codex-former-adapter-snapshot-badge-row">
                {item.badges.slice(0, 2).map((badge) => (
                  <small key={badge}>{badge}</small>
                ))}
              </span>
              <span className="codex-former-adapter-snapshot-badge-row">
                {item.compact_authority_tags.slice(0, 3).map((tag) => (
                  <small key={tag}>{tag}</small>
                ))}
              </span>
              <span className="codex-former-adapter-snapshot-badge-row">
                <small>warning count {item.warning_count}</small>
                <small>candidate_count {item.candidate_count}</small>
                <small>blocked_reason_count {item.blocked_reason_count}</small>
              </span>
            </button>
          ))}
        </section>

        <section className="codex-former-adapter-snapshot-selected">
          <h3>Selected Item Summary</h3>
          {selectedItem ? (
            <>
              <strong>{selectedItem.primary_status}</strong>
              <p>{selectedItem.caveat}</p>
              <dl>
                <DetailRow
                  label="reviewability"
                  value={
                    selectedItem.stage === "prepared_waiting_for_codex_return"
                      ? `${selectedItem.reviewability} (waiting, not reviewable)`
                      : selectedItem.reviewability
                  }
                />
                <DetailRow
                  label="next safe action"
                  value={selectedItem.next_safe_action}
                />
                <DetailRow
                  label="candidate_count"
                  value={String(selectedItem.candidate_count)}
                />
                <DetailRow
                  label="blocked_reason_count"
                  value={String(selectedItem.blocked_reason_count)}
                />
                <DetailRow
                  label="reviewable count"
                  value={String(inboxViewModels.counts.reviewable)}
                />
              </dl>
              <SafeLinks item={selectedItem} />
            </>
          ) : (
            <p>No item selected.</p>
          )}
        </section>
      </div>

      {selectedItem ? (
        <>
          <details
            className="codex-former-adapter-snapshot-details"
            open={openDetails["inbox-evidence"]}
            onToggle={(event) =>
              onDetailOpenChange("inbox-evidence", event.currentTarget.open)
            }
          >
            <summary>
              Evidence Summary
              <small>bounded snapshot references only</small>
            </summary>
            <dl>
              {selectedItem.evidence_summary.rows.map((row) => (
                <DetailRow
                  key={`${selectedItem.item_id}:${row.label}`}
                  label={row.label}
                  value={row.value}
                />
              ))}
            </dl>
          </details>

          <details
            className="codex-former-adapter-snapshot-details"
            open={openDetails["inbox-authority"]}
            onToggle={(event) =>
              onDetailOpenChange("inbox-authority", event.currentTarget.open)
            }
          >
            <summary>
              Authority Summary
              <small>read-only local snapshot; no decision authority</small>
            </summary>
            <div className="codex-former-adapter-snapshot-tag-row">
              {selectedItem.compact_authority_tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <dl>
              <DetailRow label="accepted state" value="false" />
              <DetailRow label="review decision" value="false" />
              <DetailRow label="Constellation link" value="unavailable" />
            </dl>
          </details>

          <section className="codex-former-adapter-snapshot-privacy">
            <h3>Privacy Summary</h3>
            <dl>
              <DetailRow
                label="bounded summaries only"
                value={String(
                  selectedItem.privacy_summary.bounded_summaries_only,
                )}
              />
              <DetailRow
                label="raw payloads included"
                value={String(selectedItem.privacy_summary.raw_payloads_included)}
              />
              <DetailRow
                label="raw prompt/source/packet content"
                value={String(
                  !selectedItem.privacy_summary
                    .no_raw_prompt_source_or_packet_content,
                )}
              />
            </dl>
          </section>
        </>
      ) : null}
    </section>
  );
}

function IntegrationReadinessPreview({
  onDetailOpenChange,
  openDetails,
  readiness,
}: {
  readiness: LocalAdapterSnapshotSurfaceIntegrationReadiness;
  openDetails: Record<DetailKey, boolean>;
  onDetailOpenChange: (key: DetailKey, open: boolean) => void;
}) {
  return (
    <section
      className="codex-former-adapter-snapshot-readiness"
      aria-label="Integration Readiness"
    >
      <header>
        <p className="panel-eyebrow">Integration Readiness</p>
        <h2>Integration Readiness</h2>
        <p>{readiness.status}</p>
      </header>

      <div className="codex-former-adapter-snapshot-readiness-grid">
        <ReadinessList title="Surfaces Covered" values={readiness.surfaces} />
        <ReadinessList
          title="Scenario Coverage"
          values={readiness.scenario_coverage}
        />
        <ReadinessList
          title="UI Scope"
          values={Object.entries(readiness.ui_implementation_scope)
            .filter(([, enabled]) => enabled)
            .map(([label]) => label)}
        />
        <section>
          <h3>Authority Boundary</h3>
          <dl>
            <DetailRow label="browser validation required" value="true" />
            <DetailRow
              label="prepare_helper_executed"
              value={
                readiness.prepared_operational_provenance.prepare_helper_executed
                  ? "operational provenance only"
                  : "false"
              }
            />
            {Object.entries(readiness.authority_flags).map(([label, value]) => (
              <DetailRow key={label} label={label} value={String(value)} />
            ))}
          </dl>
        </section>
      </div>

      <div className="codex-former-adapter-snapshot-readiness-grid">
        <ReadinessList title="Accessibility Plan" values={readiness.accessibility_plan.requirements} />
        <ReadinessList title="Caveats / Blockers" values={[...readiness.caveats, `blockers ${readiness.blockers.length}`]} />
      </div>

      <details
        className="codex-former-adapter-snapshot-details"
        open={openDetails["readiness-matrix"]}
        onToggle={(event) =>
          onDetailOpenChange("readiness-matrix", event.currentTarget.open)
        }
      >
        <summary>
          Browser Validation Matrix
          <small>required for this UI implementation PR</small>
        </summary>
        <ul>
          {readiness.next_ui_pr_browser_validation_matrix.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </details>

      <details
        className="codex-former-adapter-snapshot-details codex-former-adapter-snapshot-policy"
        open={openDetails["readiness-policy"]}
        onToggle={(event) =>
          onDetailOpenChange("readiness-policy", event.currentTarget.open)
        }
      >
        <summary>
          Prohibited Control Copy / Denylist
          <small>policy text only; not controls, links, or next actions</small>
        </summary>
        <div className="codex-former-adapter-snapshot-tag-row">
          {readiness.copy_and_density_policy.prohibited_control_copy.map((term) => (
            <span key={term}>{term}</span>
          ))}
        </div>
        <ReadinessList
          title="Copy and Density Policy"
          values={[
            ...readiness.copy_and_density_policy.session_panel,
            ...readiness.copy_and_density_policy.inbox,
            ...readiness.copy_and_density_policy.expanded_details,
          ]}
        />
      </details>
    </section>
  );
}

function WarningGroups({ groups }: { groups: Array<Record<string, unknown>> }) {
  return (
    <section className="codex-former-adapter-snapshot-warning-groups">
      <h3>Warning Groups</h3>
      {groups.map((group) => (
        <article key={String(group.id)}>
          <strong>{String(group.label)}</strong>
          <span>warning count {String(group.count)}</span>
          <ul>
            {Array.isArray(group.examples)
              ? group.examples.map((example) => (
                  <li key={String(example)}>{String(example)}</li>
                ))
              : null}
          </ul>
        </article>
      ))}
    </section>
  );
}

function AuthorityFacts({
  facts,
  flags,
  tags,
}: {
  facts: Array<{ label: string; value: string }>;
  flags: Record<string, boolean>;
  tags: string[];
}) {
  return (
    <>
      <div className="codex-former-adapter-snapshot-tag-row">
        {tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <dl>
        {facts.map((fact) => (
          <DetailRow key={fact.label} label={fact.label} value={fact.value} />
        ))}
        {Object.entries(flags).map(([label, value]) => (
          <DetailRow key={label} label={label} value={String(value)} />
        ))}
      </dl>
    </>
  );
}

function SafeLinks({ item }: { item: LocalAdapterInboxSurfaceItem }) {
  return (
    <section className="codex-former-adapter-snapshot-safe-links">
      <h4>Safe Links</h4>
      <span>
        {item.safe_links.session_panel.label}: available{" "}
        {String(item.safe_links.session_panel.available)};{" "}
        {item.safe_links.session_panel.detail}
      </span>
      <span>
        {item.safe_links.constellation_preview.label}: available{" "}
        {String(item.safe_links.constellation_preview.available)};{" "}
        {item.safe_links.constellation_preview.detail}
      </span>
    </section>
  );
}

function ReadinessList({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  return (
    <section>
      <h3>{title}</h3>
      <ul>
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </section>
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
