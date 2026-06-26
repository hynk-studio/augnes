"use client";

type CandidateOverlayToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function CandidateOverlayToggle({
  checked,
  onChange,
}: CandidateOverlayToggleProps) {
  return (
    <label className="constellation-overlay-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        aria-label="Show candidate overlay"
      />
      <span>
        <strong>Show candidate overlay</strong>
        <small>Display only</small>
      </span>
    </label>
  );
}
