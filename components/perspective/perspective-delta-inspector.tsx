import type {
  ArtifactRef,
  AugnesDelta,
  AugnesDeltaAuthorityBoundary,
  EvidenceRef,
  HandoffRef,
  ResearchDiagnosticRef,
  SnapshotRef,
} from "@/types/augnes-delta";
import type {
  AugnesDeltaProjectionGap,
  AugnesDeltaProjectionReadModel,
} from "@/types/augnes-delta-projection";

type PerspectiveDeltaInspectorProps = {
  delta: AugnesDelta | null;
  projection: AugnesDeltaProjectionReadModel;
  createdAtLabel: string | null;
};

const COMPACT_BOUNDARY_TEXT =
  "Read-only projection. No state mutation, no proof/evidence write, no external action.";

export function PerspectiveDeltaInspector({
  delta,
  projection,
  createdAtLabel,
}: PerspectiveDeltaInspectorProps) {
  if (!delta) {
    return (
      <aside
        className="perspective-human-panel perspective-human-inspector"
        aria-labelledby="perspective-human-inspector-title"
      >
        <div className="perspective-human-section-heading">
          <p>Delta Inspector</p>
          <h2 id="perspective-human-inspector-title">No delta selected</h2>
          <span>{COMPACT_BOUNDARY_TEXT}</span>
        </div>
        <p className="perspective-human-empty-state">
          Select a timeline delta to inspect source refs, pointer refs, merge
          policy, authority boundary, validation summary, gaps, review notes,
          and non-goals.
        </p>
      </aside>
    );
  }

  return (
    <aside
      className="perspective-human-panel perspective-human-inspector"
      aria-labelledby="perspective-human-inspector-title"
    >
      <div className="perspective-human-section-heading">
        <p>Delta Inspector</p>
        <h2 id="perspective-human-inspector-title">{delta.title}</h2>
        <span>{COMPACT_BOUNDARY_TEXT}</span>
      </div>

      <section className="perspective-human-inspector-block">
        <h3>Summary</h3>
        <p>{delta.summary}</p>
        <dl className="perspective-human-definition-grid">
          <Definition label="Type" value={delta.type} />
          <Definition label="Status" value={delta.status} />
          <Definition label="Source" value={delta.source} />
          <Definition label="Created" value={createdAtLabel ?? delta.created_at} />
        </dl>
      </section>

      <StringList title="Target refs" items={delta.target_refs} />
      <StringList title="Source refs" items={buildSourceRefs(delta)} />
      <SnapshotRefList items={delta.snapshot_refs} />
      <DiagnosticRefList items={delta.diagnostic_refs} />
      <EvidenceRefList items={delta.evidence_refs} />
      <ArtifactRefList items={delta.artifact_refs} />
      <HandoffRefList items={delta.handoff_refs} />

      <section className="perspective-human-inspector-block">
        <h3>Merge policy</h3>
        <dl className="perspective-human-definition-grid">
          <Definition label="Mode" value={delta.merge_policy.mode} />
          <Definition label="Target scope" value={delta.merge_policy.target_scope} />
          <Definition
            label="Auto apply"
            value={String(delta.merge_policy.allowed_auto_apply)}
          />
          <Definition
            label="Fresh snapshot"
            value={String(delta.merge_policy.requires_fresh_snapshot)}
          />
          <Definition
            label="Validation"
            value={String(delta.merge_policy.requires_validation)}
          />
          <Definition
            label="Blocked reason"
            value={delta.merge_policy.blocked_reason}
          />
        </dl>
      </section>

      <AuthorityBoundaryBlock boundary={delta.authority_boundary} />
      <ValidationSummaryBlock delta={delta} />
      <GapBlock gaps={projection.gaps} />
      <StringList title="Review notes" items={delta.review_notes ?? []} />
      <StringList title="Non-goals" items={delta.non_goals} />
    </aside>
  );
}

function buildSourceRefs(delta: AugnesDelta) {
  return [
    `augnes_delta:${delta.delta_id}`,
    ...delta.target_refs,
    ...delta.snapshot_refs.map((snapshot) => `snapshot:${snapshot.snapshot_id}`),
    ...delta.diagnostic_refs.map(
      (diagnostic) => `diagnostic:${diagnostic.diagnostic_id}`,
    ),
  ];
}

function Definition({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function StringList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="perspective-human-inspector-block">
      <h3>{title}</h3>
      {items.length > 0 ? (
        <ul className="perspective-human-ref-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="perspective-human-empty-state">No {title.toLowerCase()}.</p>
      )}
    </section>
  );
}

function SnapshotRefList({ items }: { items: SnapshotRef[] }) {
  return (
    <section className="perspective-human-inspector-block">
      <h3>Snapshot refs</h3>
      {items.length > 0 ? (
        <ul className="perspective-human-ref-list">
          {items.map((item) => (
            <li key={item.snapshot_id}>
              {item.snapshot_kind}: {item.snapshot_id} ({item.staleness_status})
            </li>
          ))}
        </ul>
      ) : (
        <p className="perspective-human-empty-state">No snapshot refs.</p>
      )}
    </section>
  );
}

function DiagnosticRefList({ items }: { items: ResearchDiagnosticRef[] }) {
  return (
    <section className="perspective-human-inspector-block">
      <h3>Diagnostic refs</h3>
      {items.length > 0 ? (
        <ul className="perspective-human-ref-list">
          {items.map((item) => (
            <li key={item.diagnostic_id}>
              {item.diagnostic_kind}: {item.summary}
            </li>
          ))}
        </ul>
      ) : (
        <p className="perspective-human-empty-state">No diagnostic refs.</p>
      )}
    </section>
  );
}

function EvidenceRefList({ items }: { items: EvidenceRef[] }) {
  return (
    <section className="perspective-human-inspector-block">
      <h3>Evidence refs</h3>
      {items.length > 0 ? (
        <ul className="perspective-human-ref-list">
          {items.map((item) => (
            <li key={item.evidence_ref}>
              {item.evidence_kind}: {item.summary} ({item.pointer_semantics})
            </li>
          ))}
        </ul>
      ) : (
        <p className="perspective-human-empty-state">No evidence refs.</p>
      )}
    </section>
  );
}

function ArtifactRefList({ items }: { items: ArtifactRef[] }) {
  return (
    <section className="perspective-human-inspector-block">
      <h3>Artifact refs</h3>
      {items.length > 0 ? (
        <ul className="perspective-human-ref-list">
          {items.map((item) => (
            <li key={item.artifact_ref}>
              {item.artifact_kind}: {item.summary} ({item.pointer_semantics})
            </li>
          ))}
        </ul>
      ) : (
        <p className="perspective-human-empty-state">No artifact refs.</p>
      )}
    </section>
  );
}

function HandoffRefList({ items }: { items: HandoffRef[] }) {
  return (
    <section className="perspective-human-inspector-block">
      <h3>Handoff refs</h3>
      {items.length > 0 ? (
        <ul className="perspective-human-ref-list">
          {items.map((item) => (
            <li key={item.handoff_ref}>
              {item.handoff_kind}: {item.summary} ({item.pointer_semantics})
            </li>
          ))}
        </ul>
      ) : (
        <p className="perspective-human-empty-state">No handoff refs.</p>
      )}
    </section>
  );
}

function AuthorityBoundaryBlock({
  boundary,
}: {
  boundary: AugnesDeltaAuthorityBoundary;
}) {
  const denied: Array<[string, boolean]> = [
    ["state mutation", boundary.can_commit_or_reject_state],
    ["proof write", boundary.can_record_proof],
    ["evidence write", boundary.can_create_evidence],
    ["memory mutation", boundary.can_mutate_memory],
    ["project Perspective apply", boundary.can_apply_project_perspective],
    ["external publish", boundary.can_publish_external],
    ["merge", boundary.can_merge],
    ["retry/replay/deploy", boundary.can_retry_replay_deploy],
    ["GitHub call", boundary.can_call_github],
    ["provider call", boundary.can_call_openai_or_provider],
    ["Codex execution", boundary.can_execute_codex],
  ];

  return (
    <section className="perspective-human-inspector-block">
      <h3>Authority boundary</h3>
      <p>{COMPACT_BOUNDARY_TEXT}</p>
      <dl className="perspective-human-definition-grid">
        <Definition label="Source of truth" value={boundary.source_of_truth} />
        {denied.map(([label, value]) => (
          <Definition key={label} label={label} value={String(value)} />
        ))}
      </dl>
      <StringList title="Authority notes" items={boundary.notes} />
    </section>
  );
}

function ValidationSummaryBlock({ delta }: { delta: AugnesDelta }) {
  const validation = delta.validation_summary;
  return (
    <section className="perspective-human-inspector-block">
      <h3>Validation summary</h3>
      {validation ? (
        <>
          <dl className="perspective-human-definition-grid">
            <Definition label="Status" value={validation.validation_status} />
            <Definition
              label="Required checks"
              value={String(validation.required_checks.length)}
            />
            <Definition
              label="Completed checks"
              value={String(validation.completed_checks.length)}
            />
            <Definition
              label="Failed checks"
              value={String(validation.failed_checks.length)}
            />
          </dl>
          <StringList title="Validation notes" items={validation.notes} />
        </>
      ) : (
        <p className="perspective-human-empty-state">
          No validation summary attached to this projected delta.
        </p>
      )}
    </section>
  );
}

function GapBlock({ gaps }: { gaps: AugnesDeltaProjectionGap[] }) {
  return (
    <section className="perspective-human-inspector-block">
      <h3>Gaps / staleness</h3>
      {gaps.length > 0 ? (
        <ul className="perspective-human-ref-list">
          {gaps.slice(0, 5).map((gap) => (
            <li key={gap.code}>
              {gap.severity}: {gap.summary}
            </li>
          ))}
        </ul>
      ) : (
        <p className="perspective-human-empty-state">
          No projection gaps are attached to this read model.
        </p>
      )}
    </section>
  );
}
