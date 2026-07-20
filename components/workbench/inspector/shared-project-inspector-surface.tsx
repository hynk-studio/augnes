import type {
  SharedProjectInspectorProjectionV01,
  SharedProjectInspectorSectionV01,
} from "@/types/vnext/shared-project-inspector";

import styles from "@/components/workbench/semantic-review/semantic-review.module.css";

export function SharedProjectInspectorSurface({
  inspector,
  accessBoundary,
}: {
  inspector: SharedProjectInspectorProjectionV01;
  accessBoundary?: React.ReactNode;
}) {
  return (
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
          <nav className={styles.nav} aria-label="Shared Inspector navigation">
            <a href="/">Project Home</a>
            <a href="/workbench/semantic-review">Semantic Workbench</a>
          </nav>
        </header>

        <div
          className={styles.boundaryBand}
          aria-label="Shared Inspector authority boundary"
        >
          <strong className={styles.entryState}>{humanizeV01(inspector.target_status)}</strong>
          <span>Exact project scope comes from the authenticated server</span>
          <span>Evidence supports; it does not establish Claim truth</span>
          <span>Decision and gate are not Transition application</span>
          <span>Inspector reads never mutate semantic state</span>
        </div>

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
          <p className={styles.muted}>
            Workspace and project identity are authenticated server-side. The URL
            carries only the exact target refs emitted by Augnes; there is no ID,
            fingerprint, database, path, or JSON entry procedure.
          </p>
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
          This read created no Evidence, Claim, relation, proposal, revision,
          ReviewDecision, gate, Transition, packet, ContextUseReview,
          automation cycle, grant, current head, Perspective, or reviewed memory.
          It invoked no model/provider and performed no external action.
        </section>
      </div>
    </main>
  );
}

function InspectorSection({
  section,
}: {
  section: SharedProjectInspectorSectionV01;
}) {
  return (
    <section
      className={styles.panel}
      data-inspector-section={section.section_kind}
      data-inspector-section-status={section.status}
    >
      <div className={styles.panelHeader}>
        <div className={styles.rowBetween}>
          <h2>{section.title}</h2>
          <span className={styles.badge}>{humanizeV01(section.status)}</span>
        </div>
      </div>
      <p className={section.status === "missing" ? styles.empty : styles.copy}>
        {section.summary}
      </p>
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
    </section>
  );
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
