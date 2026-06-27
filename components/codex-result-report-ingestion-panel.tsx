import type { CodexResultReportIngestionRecordV01 } from "@/lib/dogfooding/codex-result-report-normalizer";

type CodexResultReportIngestionPanelProps = {
  record: CodexResultReportIngestionRecordV01;
};

export function CodexResultReportIngestionPanel({
  record,
}: CodexResultReportIngestionPanelProps) {
  return (
    <section
      className="cockpit-surface-card codex-result-report-ingestion-panel"
      data-augnes-authority="read-only preview-only candidate-only codex-result-report-ingestion"
    >
      <header className="panel-header">
        <div>
          <p className="panel-eyebrow">Codex result report ingestion</p>
          <h3>Candidate review input</h3>
          <p>
            Read-only preview. Product-write remains parked by #686. Reports,
            PR refs, changed files, validation refs, CI, and smoke outcomes are
            review cues only.
          </p>
        </div>
        <span className="status-pill">{record.status}</span>
      </header>

      <section aria-label="Normalized summary">
        <h4>Normalized Summary</h4>
        <p>{record.normalized_summary}</p>
      </section>

      <div className="perspective-formation-summary-grid">
        <RefList title="Changed File Refs" values={record.changed_file_refs} />
        <RefList title="Observed Checks" values={record.observed_check_refs} />
        <RefList title="Skipped Checks" values={record.skipped_check_refs} />
        <RefList title="Known Warnings" values={record.known_warning_refs} />
        <RefList title="Not-Done Items" values={record.not_done_refs} />
        <RefList
          title="Expected/Observed Deltas"
          values={record.expected_observed_delta_refs}
        />
      </div>

      <section aria-label="Review cues">
        <h4>Review Cues</h4>
        <ul>
          {record.review_cues.map((cue) => (
            <li key={cue.cue_id}>
              <strong>{cue.cue_kind}</strong>
              <span>{cue.public_safe_summary}</span>
              <code>{formatList(cue.reason_codes)}</code>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Authority boundary notes">
        <h4>Authority Boundary Notes</h4>
        <ul>
          {record.boundary_notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}

function RefList({ title, values }: { title: string; values: readonly string[] }) {
  return (
    <section>
      <h4>{title}</h4>
      {values.length > 0 ? (
        <ul>
          {values.map((value) => (
            <li key={value}>
              <code>{value}</code>
            </li>
          ))}
        </ul>
      ) : (
        <p>No refs supplied.</p>
      )}
    </section>
  );
}

function formatList(values: readonly string[]) {
  return values.length > 0 ? values.join(", ") : "none";
}
