import type {
  PerspectiveIngestSessionEpisode,
  PerspectiveIngestSourceKind,
} from "@/types/perspective-ingest-constellation-preview";

export type PerspectiveIngestFixtureKind = "sample:chatgpt" | "sample:codex";

export type PerspectiveIngestFixtureRecord = {
  fixture_version: string;
  fixture_kind: PerspectiveIngestFixtureKind;
  source_kind: PerspectiveIngestSourceKind;
  source_ref: string;
  source_label: string;
  episode_id: string;
  title: string;
  synthetic_timestamp: string;
  actors: string[];
  public_safety: {
    synthetic: boolean;
    public_safe: boolean;
    sample_fixture_only: boolean;
    not_raw_private_history: boolean;
    no_credentials_or_secrets: boolean;
    no_proof_evidence_readiness_write: boolean;
    no_external_call: boolean;
    no_codex_execution_authority: boolean;
    boundary_notes: string[];
  };
  summary: string;
  user_intents?: string[];
  product_concepts?: string[];
  decisions?: string[];
  work_units?: string[];
  changed_files?: string[];
  validations?: string[];
  final_report_points?: string[];
  evidence_refs?: string[];
  unresolved_tensions?: string[];
  next_actions?: string[];
};

export function normalizePerspectiveIngestFixtureRecord(
  record: PerspectiveIngestFixtureRecord,
): PerspectiveIngestSessionEpisode {
  const safety = record.public_safety;

  return {
    episode_id: record.episode_id,
    source_kind: record.source_kind,
    source_ref: record.source_ref,
    source_label: record.source_label,
    title: record.title,
    summary: record.summary,
    synthetic_timestamp: record.synthetic_timestamp,
    actors: [...record.actors],
    public_safety: {
      synthetic: true,
      public_safe: true,
      sample_fixture_only: true,
      not_raw_private_history: true,
      no_credentials_or_secrets: true,
      no_proof_evidence_readiness_write: true,
      no_external_call: true,
      no_codex_execution_authority: true,
      boundary_notes: [
        ...new Set([
          ...(safety.boundary_notes ?? []),
          "synthetic",
          "public-safe",
          "sample fixture only",
          "not raw private history",
          "no credential/secrets",
          "no proof/evidence/readiness write",
          "no external call",
          "no Codex execution authority",
        ]),
      ],
    },
    user_intents: [...(record.user_intents ?? [])],
    product_concepts: [...(record.product_concepts ?? [])],
    decisions: [...(record.decisions ?? [])],
    work_units: [...(record.work_units ?? [])],
    changed_files: [...(record.changed_files ?? [])],
    validations: [...(record.validations ?? [])],
    final_report_points: [...(record.final_report_points ?? [])],
    evidence_refs: [...(record.evidence_refs ?? [])],
    unresolved_tensions: [...(record.unresolved_tensions ?? [])],
    next_actions: [...(record.next_actions ?? [])],
  };
}
