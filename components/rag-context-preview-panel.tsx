import type {
  RagContextPreviewAuthorityBoundary,
  RagContextPreviewContextItem,
  RagContextPreviewEnvelope,
} from "@/types/rag-context-preview";
import type { RagContextPreviewRuntimeResultV01 } from "@/lib/research-retrieval/build-rag-context-preview";

type RagContextPreviewPanelProps = {
  title?: string;
  envelope?: RagContextPreviewEnvelope;
  runtimeResult?: RagContextPreviewRuntimeResultV01;
  fixturePath?: string;
};

export function RagContextPreviewPanel({
  title = "RAG context preview",
  envelope,
  runtimeResult,
  fixturePath,
}: RagContextPreviewPanelProps) {
  if (runtimeResult) {
    return (
      <RagContextPreviewRuntimeResultPanel
        title={title}
        result={runtimeResult}
        fixturePath={fixturePath}
      />
    );
  }
  if (!envelope) return null;
  return (
    <section
      className="perspective-inspector-section"
      data-augnes-authority="read-only preview-only rag-context"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">RAG context preview only</p>
          <h3>{title}</h3>
          <p>No answer generated</p>
          <p>Context items are not evidence</p>
          <p>Retrieval score is not truth score</p>
          <p>Product-write remains parked</p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{envelope.status}</span>
          <span className="status-pill">read-only</span>
          <span className="status-pill">preview-only</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          preview <code>{envelope.preview_id}</code>
        </span>
        <span>
          scope <code>{envelope.scope}</code>
        </span>
        <span>
          fingerprint <code>{envelope.preview_fingerprint}</code>
        </span>
        {fixturePath ? (
          <span>
            fixture <code>{fixturePath}</code>
          </span>
        ) : null}
      </div>

      <section className="perspective-inspector-section">
        <h4>Bounded query summary</h4>
        <p>{envelope.bounded_query_summary}</p>
      </section>

      <div className="perspective-constellation-workspace-grid">
        <ContextItemList
          title="Included context items"
          items={envelope.included_context_items}
        />
        <ContextItemList
          title="Excluded context items"
          items={envelope.excluded_context_items}
        />
        <RefList title="Source refs" values={envelope.source_refs} />
        <RefList title="Candidate refs" values={envelope.candidate_refs} />
        <RefList title="Durable summary refs" values={envelope.durable_summary_refs} />
        <RefList title="Unresolved tensions" values={envelope.unresolved_tension_refs} />
        <RefList title="Knowledge gaps" values={envelope.knowledge_gap_refs} />
        <RefList title="Staleness warnings" values={envelope.staleness_warnings} />
        <AuthorityBoundaryReadout boundary={envelope.authority_boundary} />
      </div>
    </section>
  );
}

function RagContextPreviewRuntimeResultPanel({
  title,
  result,
  fixturePath,
}: {
  title: string;
  result: RagContextPreviewRuntimeResultV01;
  fixturePath?: string;
}) {
  return (
    <section
      className="perspective-inspector-section"
      data-augnes-authority="read-only db-backed rag-context-preview"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">DB-backed RAG context preview only</p>
          <h3>{title}</h3>
          <p>No answer generated</p>
          <p>No final answer generated</p>
          <p>RAG context is not truth</p>
          <p>RAG context is not proof</p>
          <p>Retrieval result is not evidence</p>
          <p>Retrieval score is not truth score</p>
          <p>Retrieval score is not promotion readiness</p>
          <p>Product-write remains parked</p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{result.status}</span>
          <span className="status-pill">read-only</span>
          <span className="status-pill">context-preview</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          preview request <code>{result.preview_request_id}</code>
        </span>
        <span>
          query ref <code>{result.query_ref}</code>
        </span>
        <span>
          search <code>{result.search_status}</code>
        </span>
        {fixturePath ? (
          <span>
            fixture <code>{fixturePath}</code>
          </span>
        ) : null}
      </div>

      <div className="perspective-constellation-workspace-grid">
        <RuntimeContextList
          title="Included context summaries"
          items={result.included_context_summaries}
        />
        <RuntimeExcludedList
          title="Excluded context reasons"
          items={result.excluded_context_reasons}
        />
        <RuntimeMarkerList
          title="Candidate vs durable markers"
          markers={result.candidate_vs_durable_markers}
        />
        <RefList title="Retrieved refs" values={result.retrieved_refs} />
        <RefList title="Staleness warnings" values={result.staleness_warnings} />
        <RefList title="Unresolved tensions" values={result.unresolved_tensions} />
        <RefList title="Knowledge gaps" values={result.knowledge_gaps} />
        <RuntimeAuthorityBoundaryReadout boundary={result.authority_boundary} />
      </div>
    </section>
  );
}

function RuntimeContextList({
  title,
  items,
}: {
  title: string;
  items: RagContextPreviewRuntimeResultV01["included_context_summaries"];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item.context_ref}>
            <strong>{item.bounded_title}</strong>{" "}
            <code>{item.candidate_or_durable_marker}</code>{" "}
            <code>{item.stale_marker}</code>
            <p>{item.bounded_context_summary}</p>
            <small>
              source ref <code>{item.source_ref_id ?? "none"}</code>
            </small>
            <small>
              {" "}
              candidate ref <code>{item.candidate_ref ?? "none"}</code>
            </small>
            <small>
              {" "}
              review ref <code>{item.review_record_ref ?? "none"}</code>
            </small>
            <small>
              {" "}
              durable ref <code>{item.perspective_id ?? "none"}</code>
            </small>
            <small>
              {" "}
              reasons <code>{formatList(item.inclusion_reason_codes)}</code>
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RuntimeExcludedList({
  title,
  items,
}: {
  title: string;
  items: RagContextPreviewRuntimeResultV01["excluded_context_reasons"];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={`${item.source_result_ref}:${item.exclusion_reason}`}>
            <strong>{item.bounded_title}</strong>{" "}
            <code>{item.exclusion_reason}</code>{" "}
            <code>{item.source_surface}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RuntimeMarkerList({
  title,
  markers,
}: {
  title: string;
  markers: RagContextPreviewRuntimeResultV01["candidate_vs_durable_markers"];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>{title}</h4>
      <ul>
        {markers.map((marker) => (
          <li key={marker.context_ref}>
            <code>{marker.marker}</code> <code>{marker.source_surface}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ContextItemList({
  title,
  items,
}: {
  title: string;
  items: RagContextPreviewContextItem[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item.item_id}>
            <strong>{item.bounded_title}</strong>{" "}
            <code>{item.inclusion_status}</code>{" "}
            <code>{item.layer}</code>{" "}
            <code>{item.retrieval_score_band}</code>
            <p>{item.bounded_summary}</p>
            <small>
              source refs <code>{formatList(item.source_refs)}</code>
            </small>
            <small>
              {" "}
              candidate refs <code>{formatList(item.candidate_refs)}</code>
            </small>
            <small>
              {" "}
              durable refs <code>{formatList(item.durable_summary_refs)}</code>
            </small>
            <small>
              {" "}
              review refs <code>{formatList(item.review_memory_refs)}</code>
            </small>
            <small>
              {" "}
              feedback refs <code>{formatList(item.feedback_refs)}</code>
            </small>
            <small>
              {" "}
              reasons <code>{formatList(item.reason_codes)}</code>
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RefList({ title, values }: { title: string; values: string[] }) {
  return (
    <section className="perspective-inspector-section">
      <h4>{title}</h4>
      <ul>
        {values.map((value) => (
          <li key={value}>
            <code>{value}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AuthorityBoundaryReadout({
  boundary,
}: {
  boundary: RagContextPreviewAuthorityBoundary;
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>Authority boundary</h4>
      <div className="perspective-workbench-status-row">
        {Object.entries(boundary).map(([key, value]) => (
          <span key={key}>
            {key} <code>{String(value)}</code>
          </span>
        ))}
      </div>
    </section>
  );
}

function RuntimeAuthorityBoundaryReadout({
  boundary,
}: {
  boundary: RagContextPreviewRuntimeResultV01["authority_boundary"];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>Authority boundary</h4>
      <div className="perspective-workbench-status-row">
        {Object.entries(boundary).map(([key, value]) => (
          <span key={key}>
            {key} <code>{String(value)}</code>
          </span>
        ))}
      </div>
    </section>
  );
}

function formatList(values: readonly string[]) {
  return values.length > 0 ? values.join(", ") : "none";
}
