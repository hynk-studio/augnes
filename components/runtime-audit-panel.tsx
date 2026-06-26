"use client";

import { useMemo, useState } from "react";
import type {
  RuntimeAuditItem,
  RuntimeAuditModel,
  RuntimeAuditSection,
} from "@/lib/runtime-audit/build-runtime-audit-model";

export type RuntimeAuditPanelProps = {
  model: RuntimeAuditModel;
  selectedItemId?: string;
  onSelectedItemIdChange?: (itemId: string) => void;
  className?: string;
};

export function RuntimeAuditPanel({
  model,
  selectedItemId,
  onSelectedItemIdChange,
  className,
}: RuntimeAuditPanelProps) {
  const [localSelectedItemId, setLocalSelectedItemId] = useState<string | undefined>(
    model.all_items[0]?.item_id,
  );
  const activeItemId = selectedItemId ?? localSelectedItemId;
  const selectedItem = useMemo(() => {
    return model.all_items.find((item) => item.item_id === activeItemId) ?? model.all_items[0];
  }, [activeItemId, model.all_items]);

  function handleSelection(itemId: string) {
    setLocalSelectedItemId(itemId);
    onSelectedItemIdChange?.(itemId);
  }

  return (
    <section
      className={className ?? "perspective-inspector-section"}
      aria-label="Runtime audit panel"
      data-runtime-audit-panel="read-only review-cue-not-truth no-state-mutation no-product-write"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">Runtime Audit Panel</p>
          <h3>Runtime Audit Panel is read-only</h3>
          <p>Audit is a review cue, not truth</p>
          <p>Verification is not proof</p>
          <p>No state mutation</p>
          <p>No product write</p>
          <p>Product-write remains parked</p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{model.status}</span>
          <span className="status-pill">props-only</span>
          <span className="status-pill">review surface</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>Sections {model.sections.length}</span>
        <span>Audit items {model.all_items.length}</span>
        <span>Product-write parked</span>
        <span>Verification not truth</span>
      </div>

      {model.all_items.length === 0 ? (
        <section className="perspective-inspector-section">
          <h4>Bounded empty state</h4>
          <p>No public-safe audit items supplied. The audit panel remains read-only.</p>
          <Warnings warnings={model.warnings} />
        </section>
      ) : (
        <>
          <label className="feedback-control-note">
            <span>Selected audit item</span>
            <select
              value={selectedItem?.item_id ?? ""}
              onChange={(event) => handleSelection(event.currentTarget.value)}
              aria-label="Selected runtime audit item"
            >
              {model.all_items.map((item) => (
                <option key={item.item_id} value={item.item_id}>
                  {item.bounded_title}
                </option>
              ))}
            </select>
          </label>

          <section className="perspective-inspector-section">
            <h4>Audit sections</h4>
            <div className="compact-list">
              {model.sections.map((section) => (
                <RuntimeAuditSectionCard key={section.section_id} section={section} />
              ))}
            </div>
          </section>

          {selectedItem ? (
            <section className="perspective-inspector-section">
              <h4>Selected audit item</h4>
              <article>
                <strong>{selectedItem.bounded_title}</strong>
                <p>{selectedItem.bounded_summary}</p>
                <dl className="perspective-authority-grid">
                  <div>
                    <dt>section_kind</dt>
                    <dd>{selectedItem.section_kind}</dd>
                  </div>
                  <div>
                    <dt>severity</dt>
                    <dd>{selectedItem.severity}</dd>
                  </div>
                  <div>
                    <dt>dogfooding review cues</dt>
                    <dd>{selectedItem.dogfooding_review_cue_refs.length}</dd>
                  </div>
                  <div>
                    <dt>feedback advisory refs</dt>
                    <dd>{selectedItem.feedback_aggregate_refs.length}</dd>
                  </div>
                </dl>
                <RefSummary item={selectedItem} />
                <ReasonCodes reasonCodes={selectedItem.reason_codes} />
              </article>
            </section>
          ) : null}
        </>
      )}

      <section className="perspective-inspector-section">
        <h4>Authority boundary</h4>
        <dl className="perspective-authority-grid">
          {Object.entries(model.authority_boundary)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([field, value]) => (
              <div key={field}>
                <dt>{field}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
        </dl>
      </section>
    </section>
  );
}

function RuntimeAuditSectionCard({ section }: { section: RuntimeAuditSection }) {
  return (
    <article>
      <strong>{section.bounded_title}</strong>
      <p>{section.bounded_summary}</p>
      <div className="perspective-workbench-status-row">
        {Object.entries(section.severity_counts).map(([severity, count]) => (
          <span key={severity}>
            {severity} <code>{count}</code>
          </span>
        ))}
      </div>
      <div className="compact-list">
        {section.items.map((item) => (
          <p key={item.item_id}>
            <code>{item.severity}</code> {item.bounded_title}
          </p>
        ))}
      </div>
      <ReasonCodes reasonCodes={section.reason_codes} />
    </article>
  );
}

function RefSummary({ item }: { item: RuntimeAuditItem }) {
  const refs = [
    ["dogfooding records", item.dogfooding_record_refs],
    ["dogfooding review cues", item.dogfooding_review_cue_refs],
    ["feedback aggregates", item.feedback_aggregate_refs],
    ["surfacing previews", item.surfacing_preview_refs],
    ["manual anchors", item.manual_anchor_refs],
    ["durable state applies", item.durable_state_apply_refs],
    ["Formation Receipts", item.formation_receipt_refs],
    ["promotion decisions", item.promotion_decision_refs],
    ["routes", item.route_refs],
    ["stores", item.store_refs],
    ["verification", item.verification_refs],
  ] as const;
  return (
    <dl className="perspective-authority-grid">
      {refs.map(([label, values]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{values.length === 0 ? "none" : values.join(", ")}</dd>
        </div>
      ))}
    </dl>
  );
}

function Warnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="compact-list">
      {warnings.map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
    </div>
  );
}

function ReasonCodes({ reasonCodes }: { reasonCodes: string[] }) {
  if (reasonCodes.length === 0) return null;
  return (
    <p>
      reason_codes <code>{[...new Set(reasonCodes)].sort().join(", ")}</code>
    </p>
  );
}
