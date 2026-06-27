export type GitLedgerExportReadonlyPreviewAuthorityBoundary = Record<
  string,
  boolean
>;

export type GitLedgerExportReadonlyPreviewLineageRef = {
  lineage_ref_id: string;
  lineage_ref_kind: string;
  ref: string;
  public_safe_summary: string;
};

export type GitLedgerExportReadonlyPreviewModel = {
  status: string;
  packet_status: string;
  packet_title: string;
  packet_id: string;
  generated_by: string;
  generated_at: string;
  change_summary: string;
  reason_summary: string;
  lineage_refs: GitLedgerExportReadonlyPreviewLineageRef[];
  privacy_report_summary: string;
  validation_report_summary: string;
  validation_findings: string[];
  authority_boundary_highlights: string[];
  packet_hash: string;
  idempotency_key: string;
  summary_markdown: string;
  suggested_commit_message: string;
  reason_codes: string[];
  authority_boundary: GitLedgerExportReadonlyPreviewAuthorityBoundary;
};

type GitLedgerExportReadonlyPreviewPanelProps = {
  preview: GitLedgerExportReadonlyPreviewModel;
};

export function GitLedgerExportReadonlyPreviewPanel({
  preview,
}: GitLedgerExportReadonlyPreviewPanelProps) {
  return (
    <section
      className="cockpit-surface-card git-ledger-export-readonly-preview-panel"
      data-augnes-authority="read-only preview-only public-safe git-ledger-packet-candidate"
      aria-label="Git Ledger export readonly preview"
    >
      <header className="panel-header">
        <div>
          <p className="panel-eyebrow">Git Ledger export readonly preview</p>
          <h3>{preview.packet_title}</h3>
          <p>This slice is read-only preview only.</p>
          <p>Suggested commit message is not approval.</p>
          <p>Packet hash is not truth.</p>
          <p>Idempotency key is not authority.</p>
          <p>Git ref is not authority.</p>
          <p>
            Git Ledger export packet is not commit/proof/accepted
            evidence/durable state/promotion/product-write.
          </p>
          <p>Product-write remains parked by #686.</p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{preview.status}</span>
          <span className="status-pill">{preview.packet_status}</span>
          <span className="status-pill">read-only</span>
        </div>
      </header>

      <section aria-label="Packet identity">
        <h4>Packet Status</h4>
        <dl className="perspective-authority-grid">
          <div>
            <dt>packet id</dt>
            <dd>
              <code>{preview.packet_id}</code>
            </dd>
          </div>
          <div>
            <dt>generated_by</dt>
            <dd>
              <code>{preview.generated_by}</code>
            </dd>
          </div>
          <div>
            <dt>generated_at</dt>
            <dd>
              <code>{preview.generated_at}</code>
            </dd>
          </div>
          <div>
            <dt>packet hash</dt>
            <dd>
              <code>{preview.packet_hash}</code>
            </dd>
          </div>
          <div>
            <dt>idempotency key</dt>
            <dd>
              <code>{preview.idempotency_key}</code>
            </dd>
          </div>
        </dl>
      </section>

      <section aria-label="Change summary">
        <h4>Change Summary</h4>
        <p>{preview.change_summary}</p>
      </section>

      <section aria-label="Reason summary">
        <h4>Reason Summary</h4>
        <p>{preview.reason_summary}</p>
      </section>

      <section aria-label="Lineage refs">
        <h4>Lineage Refs</h4>
        <ul>
          {preview.lineage_refs.map((lineageRef) => (
            <li key={lineageRef.lineage_ref_id}>
              <strong>{lineageRef.lineage_ref_kind}</strong>{" "}
              <code>{lineageRef.ref}</code>
              <p>{lineageRef.public_safe_summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Privacy report">
        <h4>Privacy Report</h4>
        <p>{preview.privacy_report_summary}</p>
      </section>

      <section aria-label="Validation report">
        <h4>Validation Report</h4>
        <p>{preview.validation_report_summary}</p>
        <ul>
          {preview.validation_findings.map((finding) => (
            <li key={finding}>{finding}</li>
          ))}
        </ul>
      </section>

      <section aria-label="Markdown summary">
        <h4>Markdown Summary</h4>
        <textarea
          aria-label="Bounded markdown summary"
          readOnly
          rows={12}
          value={preview.summary_markdown}
        />
      </section>

      <section aria-label="Suggested commit message">
        <h4>Suggested Commit Message Text</h4>
        <p>Suggested commit message is not approval.</p>
        <textarea
          aria-label="Suggested commit message text"
          readOnly
          rows={6}
          value={preview.suggested_commit_message}
        />
      </section>

      <section aria-label="Authority boundary highlights">
        <h4>Authority Boundary Highlights</h4>
        <ul>
          {preview.authority_boundary_highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </section>

      <section aria-label="Authority boundary">
        <h4>Authority Boundary</h4>
        <dl className="perspective-authority-grid">
          {Object.entries(preview.authority_boundary)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([field, value]) => (
              <div key={field}>
                <dt>{field}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
        </dl>
      </section>

      <section aria-label="Reason codes">
        <h4>Reason Codes</h4>
        <p>
          <code>{preview.reason_codes.join(", ")}</code>
        </p>
      </section>
    </section>
  );
}
