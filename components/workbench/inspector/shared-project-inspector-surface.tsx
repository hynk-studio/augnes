import type { ReactNode } from "react";

import { ProductShell } from "@/components/product-shell";
import {
  contextualInspectorSectionSummaryV01,
  contextualInspectorSectionTitleV01,
} from "@/lib/vnext/inspector/contextual-inspector-view";
import type { ContextualInspectorViewV01 } from "@/types/vnext/contextual-inspector";
import type {
  SharedProjectInspectorProjectionV01,
  SharedProjectInspectorSectionV01,
} from "@/types/vnext/shared-project-inspector";
import {
  SEMANTIC_SURFACE_ROLE,
  SEMANTIC_VISUAL_PRIORITY,
} from "@/lib/vnext/semantic-visual/semantic-visual-contract";

import styles from "./contextual-inspector.module.css";

export function SharedProjectInspectorSurface({
  inspector,
  view,
  accessBoundary,
}: {
  inspector: SharedProjectInspectorProjectionV01;
  view: ContextualInspectorViewV01;
  accessBoundary?: ReactNode;
}) {
  return (
    <ProductShell primaryZone="ai-workplane">
      <main
        className={styles.page}
        data-shared-project-inspector="v0.1"
        data-contextual-inspector={view.presentation_version}
        data-inspector-read-only="true"
        data-inspector-semantic-mutation="false"
        data-inspector-target-kind={inspector.target.target_kind}
        data-inspector-completeness={inspector.completeness}
        data-contextual-inspector-exact-status={view.exact_status}
        data-contextual-inspector-project-activity={
          view.project_activity ?? "unknown"
        }
        data-contextual-inspector-related-context={view.related_context.kind}
        data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.inspector}
      >
        <div className={styles.shell}>
          <a
            className={styles.returnLink}
            href={view.related_context.href}
            data-contextual-inspector-return={view.related_context.kind}
          >
            ← {view.related_context.label}
          </a>

          <header
            className={styles.header}
            data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
          >
            <p className={styles.eyebrow}>Exact details</p>
            <h1
              id="contextual-inspector-heading"
              data-contextual-inspector-heading="true"
              tabIndex={-1}
            >
              {view.heading}
            </h1>
            <p className={styles.summary}>{view.target_summary}</p>
          </header>

          <section
            className={styles.context}
            aria-labelledby="contextual-inspector-about-title"
            data-contextual-inspector-about="true"
            data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
          >
            <p className={styles.sectionLabel}>What this detail is about</p>
            <h2 id="contextual-inspector-about-title">{view.target_label}</h2>
            <p>{view.related_context.explanation}</p>
          </section>

          <section
            className={styles.status}
            aria-labelledby="contextual-inspector-status-title"
            role={view.exact_status === "conflict" ? "alert" : "status"}
            data-contextual-inspector-status-block={view.exact_status}
            data-augnes-visual-priority={
              view.exact_status === "conflict"
                ? SEMANTIC_VISUAL_PRIORITY.risk
                : SEMANTIC_VISUAL_PRIORITY.supporting
            }
          >
            <p className={styles.sectionLabel}>Current exact status</p>
            <h2 id="contextual-inspector-status-title">{view.status_label}</h2>
            <p>{view.status_explanation}</p>
            {view.observed_at ? (
              <p className={styles.observed}>
                Observed at{" "}
                <time dateTime={view.observed_at}>
                  {formatTimestampV01(view.observed_at)}
                </time>
              </p>
            ) : null}
          </section>

          {view.activity_notice ? (
            <aside
              className={styles.activityNotice}
              aria-label="Project activity"
              data-contextual-inspector-activity-notice="true"
            >
              {view.activity_notice}
            </aside>
          ) : null}

          <div
            className={styles.primarySections}
            data-contextual-inspector-primary-section-count={
              view.primary_sections.length
            }
            data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.rawRecord}
          >
            {view.primary_sections.map((section) => (
              <InspectorSection
                key={section.section_kind}
                section={section}
                defaultOpen={
                  view.default_open_section_kind === section.section_kind
                }
              />
            ))}
          </div>

          {view.additional_sections.length > 0 ? (
            <details
              className={styles.additionalRecords}
              data-contextual-inspector-additional-records="true"
              data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.rawRecord}
            >
              <summary>
                <strong>Additional exact records</strong>
                <span>
                  {view.additional_sections.length} more bounded sections
                </span>
              </summary>
              <div className={styles.additionalBody}>
                {view.additional_sections.map((section) => (
                  <InspectorSection
                    key={section.section_kind}
                    section={section}
                    defaultOpen={false}
                  />
                ))}
              </div>
            </details>
          ) : null}

          <details
            className={styles.protectionDisclosure}
            data-contextual-inspector-protection="true"
            data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
          >
            <summary>How these details are protected</summary>
            <div>
              <p>
                These details are read-only. Opening them does not accept
                evidence, save a decision, change the project, or start
                external work.
              </p>
              <ul>
                <li>Exact project scope and target identity are validated by the server.</li>
                <li>Evidence and Claim relationships do not establish truth.</li>
                <li>A saved ReviewDecision or gate is not a Transition application.</li>
                <li>No model, provider, filesystem mutation, or external action is available here.</li>
              </ul>
            </div>
          </details>

          {accessBoundary}
        </div>
      </main>
    </ProductShell>
  );
}

function InspectorSection({
  section,
  defaultOpen,
}: {
  section: SharedProjectInspectorSectionV01;
  defaultOpen: boolean;
}) {
  return (
    <details
      className={styles.inspectorSection}
      data-inspector-section={section.section_kind}
      data-inspector-section-status={section.status}
      data-augnes-raw-record="true"
      open={defaultOpen || undefined}
    >
      <summary>
        <span>
          <strong>{contextualInspectorSectionTitleV01(section.section_kind)}</strong>
          <small>{contextualInspectorSectionSummaryV01(section.section_kind)}</small>
        </span>
        <span className={styles.statusLabel}>{sectionStatusV01(section.status)}</span>
      </summary>
      <div className={styles.sectionBody}>
        {section.bounds.presentation_omitted ||
        section.bounds.upstream_bounded_incomplete ? (
          <div
            className={styles.notice}
            role="status"
            data-inspector-section-omission="true"
            data-inspector-section-returned-items={
              section.bounds.items.returned_count
            }
            data-inspector-section-total-items={
              section.bounds.items.total_count
            }
            data-inspector-section-presentation-bound={
              section.bounds.items.presentation_bound
            }
          >
            Some earlier or additional exact material is not shown here.
            Omitted material is not treated as absent or resolved.
          </div>
        ) : null}

        {section.facts.length > 0 ? (
          <dl className={styles.factList}>
            {section.facts.map((fact) => (
              <div
                key={`${section.section_kind}:${fact.label}`}
                data-inspector-fact-tone={fact.tone}
              >
                <dt>{fact.label}</dt>
                <dd>{humanizeV01(fact.value)}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {section.items.length > 0 ? (
          <ol className={styles.itemList}>
            {section.items.map((item, itemIndex) => (
              <li
                key={`${section.section_kind}:${item.item_id}:${itemIndex}`}
                data-inspector-item-status={item.status}
              >
                <div className={styles.itemHeader}>
                  <strong>{item.title}</strong>
                  <span>{humanizeV01(item.status)}</span>
                </div>
                <p>{item.summary}</p>
                {item.recorded_at ? (
                  <time dateTime={item.recorded_at}>
                    {formatTimestampV01(item.recorded_at)}
                  </time>
                ) : null}
                {item.exact_refs.length > 0 ? (
                  <ExactRefs refs={item.exact_refs} />
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}

        {section.exact_refs.length > 0 ? (
          <ExactRefs refs={section.exact_refs} />
        ) : null}

        {section.facts.length === 0 &&
        section.items.length === 0 &&
        section.exact_refs.length === 0 ? (
          <p className={styles.emptySection}>
            No exact records are available in this bounded section.
          </p>
        ) : null}
      </div>
    </details>
  );
}

function ExactRefs({
  refs,
}: {
  refs: SharedProjectInspectorSectionV01["exact_refs"];
}) {
  return (
    <details
      className={styles.identityDisclosure}
      data-contextual-inspector-exact-identity="true"
    >
      <summary>Exact record identity</summary>
      <ul>
        {refs.map((ref, refIndex) => (
          <li
            key={`${ref.record_kind}:${ref.record_id}:${ref.record_fingerprint ?? "none"}:${refIndex}`}
          >
            <strong>{humanizeV01(ref.record_kind)}</strong>
            <code>{ref.record_id}</code>
            {ref.record_fingerprint ? <code>{ref.record_fingerprint}</code> : null}
          </li>
        ))}
      </ul>
    </details>
  );
}

function sectionStatusV01(
  value: SharedProjectInspectorSectionV01["status"],
): string {
  switch (value) {
    case "available":
      return "Available";
    case "pending":
      return "Still pending";
    case "missing":
      return "Not available";
    case "unavailable":
      return "Could not be read";
    case "conflict":
      return "Sources disagree";
    case "bounded_incomplete":
      return "Bounded view";
  }
}

function humanizeV01(value: string): string {
  return value.replaceAll("_", " ");
}

function formatTimestampV01(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Time unavailable"
    : new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(parsed);
}
