import type { SelectedChangeRevisionV01 } from "@/lib/vnext/ai-workplane/selected-change-revision";
import type { ReactNode } from "react";
import type { SemanticReviewCandidateReadV01 } from "./semantic-review-types";
import styles from "./semantic-review.module.css";

export function SelectedChangeRevision({ comparison, selected }: {
  comparison: SelectedChangeRevisionV01;
  selected: SemanticReviewCandidateReadV01;
}) {
  return (
    <div data-selected-change-revision={comparison.status}>
      <h4>What changed in this revision</h4>
      {!comparison.prior ? <p className={styles.copy}>{selected.candidate.proposed_state_summary}</p> : null}
      {comparison.prior ? <>
        <dl className={`${styles.statusGrid} ${styles.twoColumnGrid}`}>
          <div>
            <dt>Earlier suggestion · {comparison.prior.operation}</dt>
            <dd data-revision-before="true">{comparison.prior.proposed_state_summary}</dd>
          </div>
          <div>
            <dt>Revised suggestion · {selected.candidate.operation}</dt>
            <dd data-revision-after="true">{selected.candidate.proposed_state_summary}</dd>
          </div>
        </dl>
        <p className={styles.muted}>
          The earlier material is a recorded suggestion. Its account of current
          state is not a live state check or a prior user decision.
        </p>
        <a className={styles.inlineLink} href={comparison.source_href!} data-revision-source="true">
          Earlier source: {comparison.prior.title}
        </a>
        <h4>Recorded reason · {comparison.author_basis?.replaceAll("_", " ")}</h4>
        <p className={styles.copy} data-revision-rationale="true">{comparison.rationale}</p>
        {comparison.result_reports.map((report) => <div key={report.href} data-revision-result-report="true">
          <h4>Recorded result report</h4>
          <p className={styles.copy}>{report.summary}</p>
          {report.limitations.length > 0 ? <RecordedItems items={report.limitations.map((text, index) => <li key={index}>Report limitation: {text}</li>)} /> : null}
          <a className={styles.inlineLink} href={report.href}>Read source result</a>
          <p className={styles.muted}>This report supplies context; it does not establish criterion-specific support or verified success.</p>
        </div>)}
        <h4>Recorded basis retained for review</h4>
        <p className={styles.muted}>
          These source lanes preserve provenance. They do not count independent
          confirmation or establish that an earlier interpretation remains valid.
        </p>
        <RecordedItems items={comparison.materials.map((item) => (
          <li key={`${item.lane}:${item.material_id}`} data-revision-source-lane={item.lane}>
            <span className={styles.timelineBasis}>{item.lane} · {item.trust_class.replaceAll("_", " ")} · {item.role.replaceAll("_", " ")}</span>
            <p className={styles.copy}>{item.summary}</p>
            {item.source_hrefs.map((href, index) => <a className={styles.inlineLink} key={href} href={href}>Source result{item.source_hrefs.length > 1 ? ` ${index + 1}` : ""}</a>)}
          </li>
        ))} />
        <h4>Conditions and unresolved information</h4>
        <RecordedItems items={[
          ...selected.candidate.uncertainties.map((text, index) => <li key={`uncertainty:${index}`}>Uncertainty: {text}</li>),
          ...selected.candidate.limitations.map((text, index) => <li key={`limitation:${index}`}>{comparison.prior!.limitations.includes(text) ? "Earlier limitation retained as context" : "Revision limitation"}: {text}</li>),
          ...comparison.unresolved.map((item) => <li key={item.id}>{item.summary}</li>),
        ]} />
        <p className={styles.muted}>
          Recorded conditions are review context, not new work obligations.
          The current decision and application status below own the next action.
          Snapshot integrity does not establish external source currentness.
        </p>
        <details className={styles.disclosure}>
          <summary>Earlier recorded conditions</summary>
          <p className={styles.muted}>Historical context; no superseded obligation is reactivated.</p>
          <RecordedItems items={[
            ...comparison.prior.uncertainties.map((text, index) => <li key={`prior-uncertainty:${index}`}>Uncertainty: {text}</li>),
            ...comparison.prior.limitations.map((text, index) => <li key={`prior-limitation:${index}`}>Limitation: {text}</li>),
          ]} />
        </details>
      </> : null}
      {comparison.gaps.map((gap) => <p className={styles.notice} key={gap}>{gap}</p>)}
    </div>
  );
}

function RecordedItems({ items }: { items: ReactNode[] }) {
  if (items.length === 0) return <p className={styles.muted}>No additional material is recorded here.</p>;
  return <>
    <ul className={styles.plainList}>{items.slice(0, 4)}</ul>
    {items.length > 4 ? <details className={styles.disclosure}>
      <summary>{items.length - 4} more recorded items</summary>
      <ul className={styles.plainList}>{items.slice(4)}</ul>
    </details> : null}
  </>;
}
