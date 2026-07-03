"use client";

import { useEffect, useId, useMemo, useState } from "react";
import styles from "./validate-result-fixture-surface.module.css";
import {
  CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_FIXTURE_SURFACE_ROUTE,
  defaultValidateResultInboxItemId,
  defaultValidateResultScenarioId,
  filterValidateResultInboxItems,
  getValidateResultInboxItems,
  getValidateResultSessionPanelScenarios,
  getValidateResultTone,
  normalizeValidateResultAuthorityFlagsForDisplay,
  validateResultFixtureSurfaceFilters,
  type ValidateResultFixtureSurfaceFilter,
  type ValidateResultFixtureSurfaceInput,
  type ValidateResultFixtureSurfaceValidation,
} from "@/lib/perspective-ingest/codex-former-local-adapter-validate-result-fixture-surface";
import type {
  CodexFormerLocalAdapterValidateResultInboxItemV0,
  CodexFormerLocalAdapterValidateResultScenarioId,
  CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0,
  CodexFormerLocalAdapterValidateResultSnapshotSummaryV0,
} from "@/lib/perspective-ingest/codex-former-local-adapter-validate-result-snapshots";

type DetailKey =
  | "session-paths"
  | "session-authority"
  | "inbox-safe-links"
  | "inbox-authority"
  | "summary-authority"
  | "policy-boundary";

export function CodexFormerLocalAdapterValidateResultFixtureSurface({
  input,
  validation,
}: {
  input: ValidateResultFixtureSurfaceInput;
  validation: ValidateResultFixtureSurfaceValidation;
}) {
  const scenarios = useMemo(
    () => getValidateResultSessionPanelScenarios(input),
    [input],
  );
  const inboxItems = useMemo(() => getValidateResultInboxItems(input), [input]);
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<CodexFormerLocalAdapterValidateResultScenarioId>(
      defaultValidateResultScenarioId,
    );
  const [selectedFilter, setSelectedFilter] =
    useState<ValidateResultFixtureSurfaceFilter>("all");
  const [selectedItemId, setSelectedItemId] = useState(
    defaultValidateResultInboxItemId,
  );
  const [openDetails, setOpenDetails] = useState<Record<DetailKey, boolean>>({
    "session-paths": false,
    "session-authority": false,
    "inbox-safe-links": false,
    "inbox-authority": false,
    "summary-authority": false,
    "policy-boundary": true,
  });
  const scenarioStatusId = useId();
  const inboxStatusId = useId();

  const selectedScenario =
    scenarios.find((scenario) => scenario.scenario_id === selectedScenarioId) ??
    scenarios[0];
  const filteredItems = useMemo(
    () => filterValidateResultInboxItems(inboxItems, selectedFilter),
    [inboxItems, selectedFilter],
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
      className={styles.shell}
      data-augnes-surface="codex-former-local-adapter-validate-result-fixture"
    >
      <section className={styles.surface}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>Codex Former Local Adapter</p>
            <h1>Validate Result Fixture Surface</h1>
            <p>
              Read-only fixture-backed preview for the committed PR #525 validate
              result snapshots. This page presents fixture material only, not
              runtime state, product state, approval, persistence, or a Core
              decision.
            </p>
          </div>
          <div className={styles.boundaryPills} aria-label="Surface boundary">
            <span>fixture-backed</span>
            <span>review-only</span>
            <span>local React state</span>
            <span>no persistence</span>
            <span>no handoff</span>
          </div>
        </header>

        {!validation.valid ? (
          <section className={styles.alert} aria-label="Fixture contract check">
            <h2>Fixture Contract Check</h2>
            <p>Committed validate result fixtures failed the surface contract.</p>
            <ul>
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section
          className={styles.previewGrid}
          aria-label="Validate result preview sections"
        >
          <SessionPanelPreview
            onDetailOpenChange={setDetailOpen}
            onScenarioChange={setSelectedScenarioId}
            openDetails={openDetails}
            scenarioStatusId={scenarioStatusId}
            scenarios={scenarios}
            selectedScenario={selectedScenario}
          />
          <CaptureReviewInboxPreview
            filteredItems={filteredItems}
            inboxItems={inboxItems}
            onDetailOpenChange={setDetailOpen}
            onFilterChange={setSelectedFilter}
            onItemSelect={setSelectedItemId}
            openDetails={openDetails}
            inboxStatusId={inboxStatusId}
            selectedFilter={selectedFilter}
            selectedItem={selectedItem}
          />
        </section>

        <SnapshotSummary
          onDetailOpenChange={setDetailOpen}
          openDetails={openDetails}
          summary={input.snapshotSummary}
        />

        <PolicyBoundary
          onDetailOpenChange={setDetailOpen}
          open={openDetails["policy-boundary"]}
        />
      </section>
    </main>
  );
}

function SessionPanelPreview({
  onDetailOpenChange,
  onScenarioChange,
  openDetails,
  scenarioStatusId,
  scenarios,
  selectedScenario,
}: {
  scenarios: CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0[];
  selectedScenario: CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0;
  openDetails: Record<DetailKey, boolean>;
  scenarioStatusId: string;
  onScenarioChange: (scenarioId: CodexFormerLocalAdapterValidateResultScenarioId) => void;
  onDetailOpenChange: (key: DetailKey, open: boolean) => void;
}) {
  const tone = getValidateResultTone(selectedScenario.result_state);

  return (
    <section
      className={styles.panel}
      aria-label={`Validate result Session Panel preview. ${selectedScenario.primary_status}. ${selectedScenario.caveat}`}
    >
      <header className={styles.panelHeader}>
        <p className={styles.eyebrow}>Session Panel Preview</p>
        <h2>Validate Result Session Panel</h2>
        <p>Default scenario is PASS with follow-up to show caution pressure.</p>
      </header>

      <p
        className={styles.selectionEvidence}
        data-augnes-selected-scenario-evidence={selectedScenario.scenario_id}
        id={scenarioStatusId}
      >
        Current scenario: {selectedScenario.result_state};{" "}
        {selectedScenario.primary_status}; review-only fixture material, not
        approval, acceptance, mergeability, product readiness, persistence,
        export, runtime state, or Core decision.
      </p>

      <div
        className={styles.buttonRow}
        role="group"
        aria-label="Validate result scenario selector"
      >
        {scenarios.map((scenario) => (
          <button
            key={scenario.scenario_id}
            type="button"
            aria-current={
              scenario.scenario_id === selectedScenario.scenario_id
                ? "true"
                : undefined
            }
            aria-describedby={scenarioStatusId}
            aria-label={`${scenario.result_state} scenario, review-only fixture preview${
              scenario.scenario_id === selectedScenario.scenario_id
                ? ", currently selected"
                : ""
            }`}
            aria-pressed={scenario.scenario_id === selectedScenario.scenario_id}
            className={classNames(
              styles.chip,
              scenario.scenario_id === selectedScenario.scenario_id
                ? styles.activeChip
                : "",
            )}
            data-augnes-validate-result-scenario={scenario.scenario_id}
            onClick={() => onScenarioChange(scenario.scenario_id)}
          >
            {scenario.result_state}
          </button>
        ))}
      </div>

      <article
        className={classNames(styles.statusPanel, toneClass(tone))}
        data-augnes-selected-session-status={selectedScenario.result_state}
      >
        <h3>{selectedScenario.primary_status}</h3>
        <p className={styles.caveat}>{selectedScenario.caveat}</p>
        <dl className={styles.detailGrid}>
          <DetailRow
            label="next_safe_action"
            value={selectedScenario.next_safe_action}
          />
          <DetailRow
            label="candidate_count"
            value={String(selectedScenario.candidate_count)}
          />
          <DetailRow
            label="candidate_shape_status"
            value={selectedScenario.candidate_shape_status}
          />
          <DetailRow
            label="contract_fit_status"
            value={selectedScenario.contract_fit_status}
          />
          <DetailRow
            label="direct_validation_status"
            value={selectedScenario.direct_validation_status}
          />
          <DetailRow
            label="candidate_compatible_review_material"
            value={String(selectedScenario.candidate_compatible_review_material)}
          />
          <DetailRow
            label="candidate_authority"
            value={selectedScenario.candidate_authority ?? "null"}
          />
          <DetailRow
            label="candidate_basis_quality"
            value={selectedScenario.candidate_basis_quality ?? "null"}
          />
          <DetailRow
            label="worker_facing_guidance_status"
            value={selectedScenario.worker_facing_guidance_status}
          />
          <DetailRow
            label="worker_facing_guidance_advisory_only"
            value={String(selectedScenario.worker_facing_guidance_advisory_only)}
          />
          <DetailRow
            label="warning_count"
            value={String(selectedScenario.warning_count)}
          />
          <DetailRow
            label="pointer_warning_count"
            value={String(selectedScenario.pointer_warning_count)}
          />
          <DetailRow
            label="blocked_reason_count"
            value={String(selectedScenario.blocked_reason_count)}
          />
        </dl>
      </article>

      <section className={styles.boundaryBox}>
        <h3>Authority Flags</h3>
        <dl className={styles.compactGrid}>
          <DetailRow label="review_only" value="true / review-only boundary" />
          <DetailRow
            label="accepted_state"
            value={`${String(selectedScenario.accepted_state)} / non-authorizing`}
          />
          <DetailRow
            label="review_decision_created"
            value={`${String(
              selectedScenario.review_decision_created,
            )} / non-authorizing`}
          />
          <DetailRow
            label="product_readiness_created"
            value={`${String(
              selectedScenario.product_readiness_created,
            )} / non-authorizing`}
          />
          <DetailRow
            label="constellation_handoff_available"
            value={`${String(
              selectedScenario.constellation_handoff_available,
            )} / non-authorizing`}
          />
          <DetailRow
            label="runtime_handoff_available"
            value={`${String(
              selectedScenario.runtime_handoff_available,
            )} / non-authorizing`}
          />
        </dl>
      </section>

      <details
        className={styles.details}
        data-augnes-details="session-paths"
        open={openDetails["session-paths"]}
        onToggle={(event) =>
          onDetailOpenChange("session-paths", event.currentTarget.open)
        }
      >
        <summary>
          Expanded Path And Hash Details
          <span>validation refs and provenance hashes only</span>
        </summary>
        <dl className={styles.detailGrid}>
          <DetailRow
            label="validation_summary_path"
            value={selectedScenario.validation_summary_path}
          />
          <DetailRow
            label="validation_summary_hash"
            value={selectedScenario.validation_summary_hash}
          />
          <DetailRow
            label="source_input_hash"
            value={selectedScenario.source_input_hash}
          />
          <DetailRow
            label="prepare_execution_summary_hash"
            value={selectedScenario.prepare_execution_summary_hash}
          />
          <DetailRow
            label="returned_envelope_hash"
            value={selectedScenario.returned_envelope_hash}
          />
        </dl>
      </details>

      <details
        className={styles.details}
        data-augnes-details="session-authority"
        open={openDetails["session-authority"]}
        onToggle={(event) =>
          onDetailOpenChange("session-authority", event.currentTarget.open)
        }
      >
        <summary>
          Expanded Session Authority Details
          <span>false flags are non-authorizing</span>
        </summary>
        <AuthorityFlagList flags={selectedScenario.authority_flags} />
      </details>
    </section>
  );
}

function CaptureReviewInboxPreview({
  filteredItems,
  inboxItems,
  onDetailOpenChange,
  onFilterChange,
  onItemSelect,
  openDetails,
  inboxStatusId,
  selectedFilter,
  selectedItem,
}: {
  inboxItems: CodexFormerLocalAdapterValidateResultInboxItemV0[];
  filteredItems: CodexFormerLocalAdapterValidateResultInboxItemV0[];
  selectedFilter: ValidateResultFixtureSurfaceFilter;
  selectedItem: CodexFormerLocalAdapterValidateResultInboxItemV0 | null;
  openDetails: Record<DetailKey, boolean>;
  inboxStatusId: string;
  onFilterChange: (filter: ValidateResultFixtureSurfaceFilter) => void;
  onItemSelect: (itemId: string) => void;
  onDetailOpenChange: (key: DetailKey, open: boolean) => void;
}) {
  const counts = {
    all: inboxItems.length,
    reviewable: inboxItems.filter((item) => item.reviewability === "reviewable")
      .length,
    reviewable_with_follow_up: inboxItems.filter(
      (item) => item.reviewability === "reviewable_with_follow_up",
    ).length,
    blocked: inboxItems.filter((item) => item.reviewability === "blocked").length,
  };

  return (
    <section
      className={styles.panel}
      aria-label={`Capture Review Inbox preview. ${selectedItem?.title ?? "No item selected"}.`}
    >
      <header className={styles.panelHeader}>
        <p className={styles.eyebrow}>Capture Review Inbox Preview</p>
        <h2>Validate Result Review Queue</h2>
        <p>
          all {counts.all}; reviewable {counts.reviewable};
          reviewable_with_follow_up {counts.reviewable_with_follow_up}; blocked{" "}
          {counts.blocked}
        </p>
      </header>

      <p
        className={styles.selectionEvidence}
        data-augnes-selected-inbox-evidence={selectedItem?.item_id ?? "none"}
        id={inboxStatusId}
      >
        Current inbox item: {selectedItem?.title ?? "none"}; reviewability{" "}
        {selectedItem?.reviewability ?? "none"} means local review material only,
        not approval, acceptance, persistence, mergeability, product readiness,
        review decision, or Core decision.
      </p>

      <div
        className={styles.buttonRow}
        role="group"
        aria-label="Capture Review Inbox filters"
      >
        {validateResultFixtureSurfaceFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            aria-current={filter === selectedFilter ? "true" : undefined}
            aria-describedby={inboxStatusId}
            aria-label={`${filter} inbox filter, local view state only${
              filter === selectedFilter ? ", currently selected" : ""
            }`}
            aria-pressed={filter === selectedFilter}
            className={classNames(
              styles.chip,
              filter === selectedFilter ? styles.activeChip : "",
            )}
            data-augnes-validate-result-filter={filter}
            onClick={() => onFilterChange(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className={styles.inboxLayout}>
        <section className={styles.itemList} aria-label="Validate result items">
          <h3>Items</h3>
          <p>visible items {filteredItems.length}</p>
          {filteredItems.map((item) => (
            <button
              key={item.item_id}
              type="button"
              aria-current={item.item_id === selectedItem?.item_id ? "true" : undefined}
              aria-describedby={inboxStatusId}
              aria-label={`${item.title}; ${item.reviewability}; ${item.summary_line}; review-only fixture material${
                item.item_id === selectedItem?.item_id ? "; currently selected" : ""
              }`}
              aria-pressed={item.item_id === selectedItem?.item_id}
              className={classNames(
                styles.itemButton,
                toneClass(getValidateResultTone(item.result_state)),
                item.item_id === selectedItem?.item_id ? styles.selectedItem : "",
              )}
              data-augnes-validate-result-inbox-item={item.item_id}
              onClick={() => onItemSelect(item.item_id)}
            >
              <strong>{item.title}</strong>
              <span>stage {item.stage}</span>
              <span>reviewability {item.reviewability}</span>
              <span>{item.summary_line}</span>
              <span>review-only selector label</span>
              <span className={styles.badgeRow}>
                {item.badges.map((badge) => (
                  <small key={badge}>{badge}</small>
                ))}
              </span>
            </button>
          ))}
        </section>

        <section className={styles.selectedItemPanel}>
          <h3>Selected Item</h3>
          {selectedItem ? (
            <SelectedInboxItem
              item={selectedItem}
              onDetailOpenChange={onDetailOpenChange}
              openDetails={openDetails}
            />
          ) : (
            <p>No validate result item is selected for this filter.</p>
          )}
        </section>
      </div>
    </section>
  );
}

function SelectedInboxItem({
  item,
  onDetailOpenChange,
  openDetails,
}: {
  item: CodexFormerLocalAdapterValidateResultInboxItemV0;
  openDetails: Record<DetailKey, boolean>;
  onDetailOpenChange: (key: DetailKey, open: boolean) => void;
}) {
  return (
    <>
      <article
        className={classNames(
          styles.statusPanel,
          toneClass(getValidateResultTone(item.result_state)),
        )}
        data-augnes-selected-inbox-item={item.item_id}
      >
        <h4>{item.title}</h4>
        <p className={styles.caveat}>{item.caveat}</p>
        <p>{item.summary_line}</p>
        <dl className={styles.detailGrid}>
          <DetailRow label="stage" value={item.stage} />
          <DetailRow label="reviewability" value={item.reviewability} />
          <DetailRow label="next_safe_action" value={item.next_safe_action} />
          <DetailRow label="candidate_count" value={String(item.candidate_count)} />
          <DetailRow label="warning_count" value={String(item.warning_count)} />
          <DetailRow
            label="pointer_warning_count"
            value={String(item.pointer_warning_count)}
          />
          <DetailRow
            label="blocked_reason_count"
            value={String(item.blocked_reason_count)}
          />
          <DetailRow
            label="review_candidate_available"
            value={String(item.review_candidate_available)}
          />
          <DetailRow
            label="worker_guidance_available"
            value={String(item.worker_guidance_available)}
          />
          <DetailRow label="review_only" value="true / review-only boundary" />
          <DetailRow
            label="accepted_state"
            value={`${String(item.accepted_state)} / non-authorizing`}
          />
          <DetailRow
            label="review_decision_created"
            value={`${String(item.review_decision_created)} / non-authorizing`}
          />
        </dl>
      </article>

      <section className={styles.tagPanel}>
        <h4>Authority Tags</h4>
        <div className={styles.tagRow}>
          {item.authority_tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>

      <details
        className={styles.details}
        data-augnes-details="inbox-safe-links"
        data-augnes-safe-links="availability-text-only"
        open={openDetails["inbox-safe-links"]}
        onToggle={(event) =>
          onDetailOpenChange("inbox-safe-links", event.currentTarget.open)
        }
      >
        <summary>
          Safe Link Availability
          <span>availability text only, no href, no navigation target</span>
        </summary>
        <p
          className={styles.safeLinkNotice}
          data-augnes-safe-link-navigation="none"
        >
          Safe links are non-navigational availability labels. The
          validation_summary path and hash are local fixture reference only;
          read_only_validate_result_ui and runtime_handoff remain unavailable.
        </p>
        <dl className={styles.detailGrid}>
          <DetailRow
            label="validation_summary available"
            value={String(item.safe_links.validation_summary.available)}
          />
          <DetailRow
            label="validation_summary href"
            value={String(item.safe_links.validation_summary.href)}
          />
          <DetailRow
            label="validation_summary path"
            value={`${item.safe_links.validation_summary.path} / local fixture reference only`}
          />
          <DetailRow
            label="validation_summary hash"
            value={`${item.safe_links.validation_summary.hash} / local fixture reference only`}
          />
          <DetailRow
            label="read_only_validate_result_ui available"
            value={String(item.safe_links.read_only_validate_result_ui.available)}
          />
          <DetailRow
            label="read_only_validate_result_ui href"
            value={String(item.safe_links.read_only_validate_result_ui.href)}
          />
          <DetailRow
            label="read_only_validate_result_ui detail"
            value={item.safe_links.read_only_validate_result_ui.detail}
          />
          <DetailRow
            label="read_only_validate_result_ui boundary"
            value="unavailable / no href / no navigation / no product authority"
          />
          <DetailRow
            label="runtime_handoff available"
            value={String(item.safe_links.runtime_handoff.available)}
          />
          <DetailRow
            label="runtime_handoff href"
            value={String(item.safe_links.runtime_handoff.href)}
          />
          <DetailRow
            label="runtime_handoff detail"
            value={item.safe_links.runtime_handoff.detail}
          />
          <DetailRow
            label="runtime_handoff boundary"
            value="unavailable / no href / no navigation / no runtime state"
          />
        </dl>
      </details>

      <details
        className={styles.details}
        data-augnes-details="inbox-authority"
        open={openDetails["inbox-authority"]}
        onToggle={(event) =>
          onDetailOpenChange("inbox-authority", event.currentTarget.open)
        }
      >
        <summary>
          Expanded Inbox Authority Details
          <span>review material only</span>
        </summary>
        <dl className={styles.detailGrid}>
          <DetailRow
            label="validation_summary_path"
            value={item.validation_summary_path}
          />
          <DetailRow
            label="validation_summary_hash"
            value={item.validation_summary_hash}
          />
          <DetailRow label="accepted_state" value="false / non-authorizing" />
          <DetailRow
            label="review_decision_created"
            value="false / non-authorizing"
          />
          <DetailRow label="review_only" value="true / review-only boundary" />
        </dl>
      </details>
    </>
  );
}

function SnapshotSummary({
  onDetailOpenChange,
  openDetails,
  summary,
}: {
  summary: CodexFormerLocalAdapterValidateResultSnapshotSummaryV0;
  openDetails: Record<DetailKey, boolean>;
  onDetailOpenChange: (key: DetailKey, open: boolean) => void;
}) {
  return (
    <section className={styles.summaryPanel} aria-label="Snapshot readiness summary">
      <header className={styles.panelHeader}>
        <p className={styles.eyebrow}>Snapshot Summary / Readiness</p>
        <h2>Fixture Surface Summary</h2>
        <p>
          mode {summary.mode}. The current UI consumes committed fixtures and is
          not runtime state, product readiness, accepted state, or a review
          decision.
        </p>
      </header>

      <div className={styles.summaryGrid}>
        <ValueList title="covered result states" values={summary.covered_result_states} />
        <ValueList title="covered surfaces" values={summary.covered_surfaces} />
        <StateCountList
          counts={summary.candidate_count_by_state}
          title="candidate_count_by_state"
        />
        <StateCountList
          counts={summary.warning_count_by_state}
          title="warning_count_by_state"
        />
        <StateCountList
          counts={summary.blocked_reason_count_by_state}
          title="blocked_reason_count_by_state"
        />
      </div>

      <section className={styles.boundaryBox}>
        <h3>Readiness Boundary</h3>
        <dl className={styles.detailGrid}>
          <DetailRow label="future_ui_path" value={summary.future_ui_path} />
          <DetailRow
            label="browser_validation_requirement"
            value={summary.browser_validation_requirement}
          />
          <DetailRow
            label="route_path"
            value={CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_FIXTURE_SURFACE_ROUTE}
          />
        </dl>
      </section>

      <details
        className={styles.details}
        data-augnes-details="summary-authority"
        open={openDetails["summary-authority"]}
        onToggle={(event) =>
          onDetailOpenChange("summary-authority", event.currentTarget.open)
        }
      >
        <summary>
          Expanded Summary Authority Boundary
          <span>all authority flags stay non-authorizing</span>
        </summary>
        <AuthorityFlagList flags={summary.authority_boundary} />
      </details>
    </section>
  );
}

function PolicyBoundary({
  onDetailOpenChange,
  open,
}: {
  open: boolean;
  onDetailOpenChange: (key: DetailKey, open: boolean) => void;
}) {
  return (
    <details
      className={classNames(styles.details, styles.policyDetails)}
      data-augnes-details="policy-boundary"
      open={open}
      onToggle={(event) =>
        onDetailOpenChange("policy-boundary", event.currentTarget.open)
      }
    >
      <summary>
        Prohibited Control Copy / Policy Text Only
        <span>visible policy, not executable controls</span>
      </summary>
      <p>
        This fixture surface has no controls labeled Accept, Approve, Promote,
        Reject, Merge, Deploy, Persist, Export, Run Codex, Call Codex, Call
        Provider, Call provider/model, Create review decision, Create accepted
        state, Handoff to runtime, Create readiness, Create evidence, or Create
        proof.
      </p>
      <p>
        PASS remains review-only. PASS with follow-up remains review material
        only. BLOCKED is a validation result, not automated rejection.
      </p>
    </details>
  );
}

function AuthorityFlagList({ flags }: { flags: object }) {
  const rows = normalizeValidateResultAuthorityFlagsForDisplay(flags);
  return (
    <dl className={styles.detailGrid}>
      {rows.map((row) => (
        <DetailRow
          key={row.label}
          label={row.label}
          value={`${row.value} / ${row.boundary}`}
        />
      ))}
    </dl>
  );
}

function StateCountList({
  counts,
  title,
}: {
  title: string;
  counts: Record<string, number>;
}) {
  return (
    <section className={styles.miniPanel}>
      <h3>{title}</h3>
      <dl className={styles.compactGrid}>
        {["PASS", "PASS with follow-up", "BLOCKED"].map((state) => (
          <DetailRow key={state} label={state} value={String(counts[state] ?? 0)} />
        ))}
      </dl>
    </section>
  );
}

function ValueList({
  title,
  values,
}: {
  title: string;
  values: readonly string[];
}) {
  return (
    <section className={styles.miniPanel}>
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

function toneClass(tone: string) {
  if (tone === "pass") return styles.tonePass;
  if (tone === "followUp") return styles.toneFollowUp;
  return styles.toneBlocked;
}

function classNames(...values: string[]) {
  return values.filter(Boolean).join(" ");
}
