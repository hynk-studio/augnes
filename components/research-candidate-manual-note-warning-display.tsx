"use client";

import type { ManualResearchNoteParserWarning } from "@/lib/research-candidate-review/manual-note-parser";

export function ParserWarningSummary({
  warnings,
}: {
  warnings: ManualResearchNoteParserWarning[];
}) {
  if (warnings.length === 0) return null;

  return (
    <section
      className="perspective-inspector-section manual-note-warning-summary"
      role="status"
      aria-live="polite"
    >
      <h3>Parser warning summary</h3>
      <ul>
        {warnings.map((warning) => (
          <li key={`${warning.code}:${warning.line ?? "none"}`}>
            <strong>{warning.code}</strong>
            <span>{warning.message}</span>
            <small>
              line <code>{warning.line ?? "not available"}</code>
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ParserWarningsList({
  warnings,
}: {
  warnings: ManualResearchNoteParserWarning[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>warnings</h3>
      {warnings.length === 0 ? (
        <p>No parser warnings.</p>
      ) : (
        <ul>
          {warnings.map((warning) => (
            <li key={`${warning.code}:${warning.line ?? "none"}`}>
              <code>{warning.code}</code> {warning.message}
              {warning.line ? <small> line {warning.line}</small> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
