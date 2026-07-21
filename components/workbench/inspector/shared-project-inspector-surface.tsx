import type {
  SharedProjectInspectorProjectionV01,
  SharedProjectInspectorSectionV01,
} from "@/types/vnext/shared-project-inspector";
import { ProductShell } from "@/components/product-shell";

import styles from "@/components/workbench/semantic-review/semantic-review.module.css";

export function SharedProjectInspectorSurface({
  inspector,
  accessBoundary,
}: {
  inspector: SharedProjectInspectorProjectionV01;
  accessBoundary?: React.ReactNode;
}) {
  return (
    <ProductShell surface="inspector">
      <main
        className={styles.page}
        data-shared-project-inspector="v0.1"
        data-inspector-read-only="true"
        data-inspector-semantic-mutation="false"
        data-inspector-target-kind={inspector.target.target_kind}
        data-inspector-completeness={inspector.completeness}
      >
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Shared Inspector · exact read-only drill-down</p>
            <h1>{inspector.target_title}</h1>
            <p className={styles.headerCopy}>{inspector.target_summary}</p>
          </div>
        </header>

        <details className={styles.boundaryDisclosure}>
          <summary><strong className={styles.entryState}>{humanizeV01(inspector.target_status)}</strong><span>Read-only boundary</span></summary>
          <div className={styles.boundaryBand} aria-label="Shared Inspector authority boundary">
            <span>Exact project scope comes from the authenticated server</span>
            <span>Evidence supports; it does not establish Claim truth</span>
            <span>Decision and gate are not Transition application</span>
            <span>Inspector reads never mutate semantic state</span>
          </div>
        </details>

        {accessBoundary}

        <section className={styles.panel} aria-labelledby="inspector-focus-title">
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Authenticated exact focus</p>
            <h2 id="inspector-focus-title">Target and read boundary</h2>
          </div>
          <dl className={styles.statusGrid}>
            <DataPoint label="Target" value={humanizeV01(inspector.target.target_kind)} />
            <DataPoint label="Trust" value={inspector.target_trust} />
            <DataPoint label="Currentness" value={inspector.target_currentness} />
            <DataPoint label="Completeness" value={humanizeV01(inspector.completeness)} />
            <DataPoint label="Observed" value={formatTimestampV01(inspector.observed_at)} />
            <DataPoint label="Projection" value={inspector.inspector_version} />
          </dl>
          <p className={styles.muted}>Server-authenticated project scope · exact target refs only.</p>
        </section>

        <div className={styles.twoColumnGrid} data-inspector-sections="true">
          {inspector.sections.map((section) => (
            <InspectorSection key={section.section_kind} section={section} />
          ))}
        </div>

        <section
          className={styles.notice}
          data-inspector-authority-proof="true"
        >
          This read created no Evidence, Claim, proposal, ReviewDecision,
          Transition, packet, ContextUseReview, or project state.
          It invoked no model/provider and performed no external action.
        </section>
      </div>
      </main>
    </ProductShell>
  );
}

function InspectorSection({
  section,
}: {
  section: SharedProjectInspectorSectionV01;
}) {
  const reviewBoundary = inspectorSectionReviewBoundaryV01(section);

  return (
    <details
      className={styles.inspectorSection}
      data-inspector-section={section.section_kind}
      data-inspector-section-status={section.status}
    >
      <summary>
        <div>
          <span className={styles.inspectorSectionTitle} role="heading" aria-level={2}>{section.title}</span>
          <span
            className={styles.inspectorSectionMeta}
            data-inspector-summary-status={section.status}
          >
            {inspectorSectionSummaryV01(section)}
          </span>
          {reviewBoundary ? (
            <small data-inspector-summary-boundary={section.section_kind}>
              {reviewBoundary}
            </small>
          ) : null}
        </div>
          <span className={styles.badge}>{humanizeV01(section.status)}</span>
      </summary>
      <div className={styles.inspectorSectionBody}>
      {section.bounds.presentation_omitted ? (
        <div
          className={styles.notice}
          role="status"
          data-inspector-section-omission="true"
          data-inspector-section-returned-items={section.bounds.items.returned_count}
          data-inspector-section-total-items={section.bounds.items.total_count}
          data-inspector-section-presentation-bound={section.bounds.items.presentation_bound}
        >
          <strong>Bounded presentation</strong>
          <span>
            Facts {section.bounds.facts.returned_count}/{section.bounds.facts.total_count}
            {" · "}items {section.bounds.items.returned_count}/{section.bounds.items.total_count}
            {" · "}exact refs {section.bounds.exact_refs.returned_count}/{section.bounds.exact_refs.total_count}.
          </span>
          <span>
            Omitted material remains unknown here; it is not treated as absent,
            resolved, false, non-current, or irrelevant.
          </span>
        </div>
      ) : null}
      {section.facts.length > 0 ? (
        <dl className={styles.statusGrid}>
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
        <ol className={styles.plainList}>
          {section.items.map((item, itemIndex) => (
            <li
              key={`${section.section_kind}:${item.item_id}:${itemIndex}`}
              data-inspector-item-status={item.status}
            >
              <div className={styles.rowBetween}>
                <strong>{item.title}</strong>
                <span className={styles.badge}>{humanizeV01(item.status)}</span>
              </div>
              <span>{item.summary}</span>
              {item.recorded_at ? (
                <small>{formatTimestampV01(item.recorded_at)}</small>
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
      </div>
    </details>
  );
}

function inspectorSectionReviewBoundaryV01(
  section: SharedProjectInspectorSectionV01,
): string | null {
  switch (section.section_kind) {
    case "selected_context_work":
      return "This is selected working context, not truth.";
    case "run_receipt":
      return "Host completion remains distinct from task success.";
    case "criterion_basis":
      return "Insufficient remains unknown; skipped checks do not satisfy a criterion.";
    case "evidence_claims_relations":
      return "Claim truth is not established; relation existence is not proof.";
    case "decision_gate":
      return "A decision itself applies no state; authorization is not application.";
    case "transition_current_head":
      return "Only successfully applied StateTransitionReceipts change durable semantic state.";
    default:
      return null;
  }
}

function ExactRefs({
  refs,
}: {
  refs: SharedProjectInspectorSectionV01["exact_refs"];
}) {
  return (
    <details className={styles.inspectionDisclosure}>
      <summary>Exact authenticated identity</summary>
      <ul className={styles.plainList}>
        {refs.map((ref, refIndex) => (
          <li key={`${ref.record_kind}:${ref.record_id}:${ref.record_fingerprint ?? "none"}:${refIndex}`}>
            <strong>{humanizeV01(ref.record_kind)}</strong>
            <code className={styles.identifier}>{ref.record_id}</code>
            {ref.record_fingerprint ? (
              <code className={styles.identifier}>{ref.record_fingerprint}</code>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{humanizeV01(value)}</dd></div>;
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

function inspectorSectionSummaryV01(
  section: SharedProjectInspectorSectionV01,
): string {
  const status = section.status === "available"
    ? "Exact read"
    : section.status === "missing"
      ? "Target missing"
      : humanizeV01(section.status);
  const counts: string[] = [];
  const itemCount = section.bounds.items.total_count;
  const factCount = section.bounds.facts.total_count;
  const exactRefCount = section.bounds.exact_refs.total_count;

  if (itemCount > 0) {
    counts.push(`${itemCount} ${itemCount === 1 ? "entry" : "entries"}`);
  }
  if (exactRefCount > 0) {
    counts.push(`${exactRefCount} exact record ${exactRefCount === 1 ? "reference" : "references"}`);
  }
  if (factCount > 0 && itemCount === 0 && exactRefCount === 0) {
    counts.push(`${factCount} exact ${factCount === 1 ? "fact" : "facts"}`);
  }
  if (counts.length === 0) {
    counts.push("no section records returned");
  }
  if (section.bounds.presentation_omitted) {
    counts.push("bounded view");
  }

  return `${status} · ${counts.join(" · ")}`;
}
