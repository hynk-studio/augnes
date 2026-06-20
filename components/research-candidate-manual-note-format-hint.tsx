"use client";

const MANUAL_NOTE_PREFIX_GROUPS = [
  { label: "Research Question", prefixes: ["Research Question:", "연구질문:"] },
  { label: "Operator Intent", prefixes: ["Operator Intent:", "의도:"] },
  { label: "Source Title", prefixes: ["Source Title:", "출처제목:"] },
  { label: "Source Origin", prefixes: ["Source Origin:", "출처:"] },
  { label: "Source Identifier", prefixes: ["Source Identifier:", "식별자:"] },
  { label: "Claim", prefixes: ["Claim:", "주장:"] },
  { label: "Evidence", prefixes: ["Evidence:", "근거:"] },
  { label: "Tension", prefixes: ["Tension:", "긴장:"] },
  { label: "Gap", prefixes: ["Gap:", "공백:"] },
  { label: "Perspective Delta", prefixes: ["Perspective Delta:", "관점변화:"] },
  { label: "Next", prefixes: ["Next:", "다음:"] },
];

export function ManualNoteFormatHint() {
  return (
    <section
      className="perspective-inspector-section manual-note-format-hint"
      id="research-candidate-manual-note-format-hint"
    >
      <h3>How to format a note</h3>
      <p>
        Use one prefix per line. This help mirrors the current deterministic
        parser prefixes; it is UI guidance, not a new parser contract.
      </p>
      <div className="manual-note-prefix-grid">
        {MANUAL_NOTE_PREFIX_GROUPS.map((group) => (
          <div key={group.label}>
            <strong>{group.label}</strong>
            <code>{group.prefixes.join(" / ")}</code>
          </div>
        ))}
      </div>
      <p>
        For gap and follow-up lines, the parser also reads inline markers such
        as <code>next:</code>, <code>files:</code>, and <code>checks:</code>.
      </p>
    </section>
  );
}
