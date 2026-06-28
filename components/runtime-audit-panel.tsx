"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  RuntimeAuditItem,
  RuntimeAuditModel,
  RuntimeAuditPanelRuntimeModelV01,
  RuntimeAuditSection,
} from "@/lib/runtime-audit/build-runtime-audit-model";

export type RuntimeAuditPanelProps = {
  model: RuntimeAuditModel;
  selectedItemId?: string;
  onSelectedItemIdChange?: (itemId: string) => void;
  className?: string;
  runtimeMode?: "props_only" | "route_backed";
  dbPath?: string;
  eventSurface?: string;
  eventStatus?: string;
  subjectRef?: string;
  limit?: number;
};

export function RuntimeAuditPanel({
  model,
  selectedItemId,
  onSelectedItemIdChange,
  className,
  runtimeMode = "props_only",
  dbPath = ".tmp/runtime-audit/ui/runtime-audit.sqlite",
  eventSurface,
  eventStatus,
  subjectRef,
  limit = 50,
}: RuntimeAuditPanelProps) {
  const [localSelectedItemId, setLocalSelectedItemId] = useState<string | undefined>(
    model.all_items[0]?.item_id,
  );
  const [runtimeAuditModel, setRuntimeAuditModel] =
    useState<RuntimeAuditPanelRuntimeModelV01 | null>(null);
  const [runtimeAuditError, setRuntimeAuditError] = useState<string | null>(null);
  const [runtimeAuditLoading, setRuntimeAuditLoading] = useState(false);
  const activeItemId = selectedItemId ?? localSelectedItemId;
  const selectedItem = useMemo(() => {
    return model.all_items.find((item) => item.item_id === activeItemId) ?? model.all_items[0];
  }, [activeItemId, model.all_items]);

  useEffect(() => {
    if (runtimeMode !== "route_backed") return;

    const abortController = new AbortController();
    const params = new URLSearchParams({
      db_path: dbPath,
      limit: String(Math.max(1, Math.min(limit, 200))),
    });
    if (eventSurface) params.set("event_surface", eventSurface);
    if (eventStatus) params.set("event_status", eventStatus);
    if (subjectRef) params.set("subject_ref", subjectRef);

    setRuntimeAuditLoading(true);
    setRuntimeAuditError(null);
    fetch(`/api/runtime-audit/events?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: abortController.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          audit_model?: RuntimeAuditPanelRuntimeModelV01;
          error_code?: string | null;
          status?: string;
        };
        if (!response.ok || payload.status === "error") {
          setRuntimeAuditModel(null);
          setRuntimeAuditError(payload.error_code ?? `runtime_audit_http_${response.status}`);
          return;
        }
        setRuntimeAuditModel(payload.audit_model ?? null);
        setRuntimeAuditError(null);
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) return;
        setRuntimeAuditModel(null);
        setRuntimeAuditError(
          error instanceof Error ? "runtime_audit_route_unavailable" : "runtime_audit_fetch_failed",
        );
      })
      .finally(() => {
        if (!abortController.signal.aborted) setRuntimeAuditLoading(false);
      });

    return () => abortController.abort();
  }, [dbPath, eventSurface, eventStatus, limit, runtimeMode, subjectRef]);

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
          <span className="status-pill">
            {runtimeMode === "route_backed" ? "route-backed read" : "props-only"}
          </span>
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

      {runtimeMode === "route_backed" ? (
        <RuntimeAuditRouteBackedReadModel
          dbPath={dbPath}
          loading={runtimeAuditLoading}
          errorCode={runtimeAuditError}
          runtimeModel={runtimeAuditModel}
        />
      ) : null}

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

function RuntimeAuditRouteBackedReadModel({
  dbPath,
  loading,
  errorCode,
  runtimeModel,
}: {
  dbPath: string;
  loading: boolean;
  errorCode: string | null;
  runtimeModel: RuntimeAuditPanelRuntimeModelV01 | null;
}) {
  return (
    <section className="perspective-inspector-section" data-runtime-audit-route-backed-read="true">
      <h4>DB-backed audit event read model</h4>
      <p>Audit events are bounded review records only.</p>
      <p>Audit event is not truth, proof, approval, durable state, or product-write authority.</p>
      <p>Product-write remains parked by #686.</p>
      <dl className="perspective-authority-grid">
        <div>
          <dt>db_path</dt>
          <dd>{dbPath}</dd>
        </div>
        <div>
          <dt>route</dt>
          <dd>/api/runtime-audit/events</dd>
        </div>
        <div>
          <dt>request</dt>
          <dd>GET only from this panel</dd>
        </div>
        <div>
          <dt>status</dt>
          <dd>{loading ? "loading" : errorCode ?? runtimeModel?.status ?? "empty"}</dd>
        </div>
      </dl>
      {errorCode ? (
        <div className="compact-list">
          <p>
            bounded_error <code>{errorCode}</code>
          </p>
        </div>
      ) : null}
      {runtimeModel ? (
        <>
          <dl className="perspective-authority-grid">
            <div>
              <dt>events</dt>
              <dd>{runtimeModel.summary.event_count}</dd>
            </div>
            <div>
              <dt>bounded errors</dt>
              <dd>{runtimeModel.summary.bounded_error_count}</dd>
            </div>
            <div>
              <dt>surfaces</dt>
              <dd>{runtimeModel.grouped_by_surface.length}</dd>
            </div>
            <div>
              <dt>last event</dt>
              <dd>{runtimeModel.summary.last_event_at ?? "none"}</dd>
            </div>
          </dl>
          <section className="perspective-inspector-section">
            <h5>Grouped surface rows</h5>
            <div className="compact-list">
              {runtimeModel.grouped_by_surface.map((group) => (
                <article key={group.event_surface}>
                  <strong>{group.event_surface}</strong>
                  <p>
                    events <code>{group.event_count}</code> latest{" "}
                    <code>{group.latest_event_at ?? "none"}</code>
                  </p>
                  <ReasonCodes reasonCodes={Object.keys(group.status_counts)} />
                </article>
              ))}
            </div>
          </section>
          <section className="perspective-inspector-section">
            <h5>Bounded audit events</h5>
            <div className="compact-list">
              {runtimeModel.events.slice(0, 8).map((event) => (
                <article key={event.audit_event_id}>
                  <strong>{event.event_surface}</strong>
                  <p>{event.bounded_summary}</p>
                  <p>
                    <code>{event.event_kind}</code> <code>{event.event_status}</code>{" "}
                    <code>{event.subject_ref}</code>
                  </p>
                </article>
              ))}
            </div>
          </section>
          <section className="perspective-inspector-section">
            <h5>Runtime authority boundary</h5>
            <dl className="perspective-authority-grid">
              {Object.entries(runtimeModel.authority_boundary)
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([field, value]) => (
                  <div key={field}>
                    <dt>{field}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
            </dl>
          </section>
        </>
      ) : null}
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
