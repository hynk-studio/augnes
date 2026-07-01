import autonomyContractSample from "@/fixtures/autonomy-contract.sample.v0.1.json";
import { buildAutonomyContractAuthorityBoundary } from "@/lib/autonomy/autonomy-contract";
import {
  AUTONOMY_CONTRACT_ROUTE_AUTHORITY_BOUNDARY,
  AUTONOMY_CONTRACT_ROUTE_ID,
  readAutonomyContractForRoute,
  validateAutonomyContractReadRequest,
} from "@/lib/autonomy/autonomy-contract-source";
import type { AutonomyContract } from "@/types/autonomy-contract";

export const AUTONOMY_PREVIEW_PUBLIC_SAFE_FALLBACK_SOURCE =
  "public_safe_fixture_fallback" as const;

export const AUTONOMY_PREVIEW_PUBLIC_SAFE_FALLBACK_REFS = [
  "fixtures/autonomy-contract.sample.v0.1.json",
  "docs/AUTONOMY_CONTRACT_V0_1.md",
] as const;

export type AutonomyPreviewWebSource =
  | typeof AUTONOMY_PREVIEW_PUBLIC_SAFE_FALLBACK_SOURCE
  | "local_readonly_route_context"
  | "validation_failed_fallback";

export type AutonomyContractPreviewForWeb = {
  contract: AutonomyContract;
  source_status: {
    source: AutonomyPreviewWebSource;
    autonomy_contract: string;
    budget: string;
    delta_merge_policy: string;
    run_preview: string;
    source_disclosure: string;
    synthetic_operator_supplied_fields: string[];
  };
  fallback_reasons: string[];
  boundary_notes: string[];
  public_safety: AutonomyContract["public_safety"];
  route_refs: string[];
  docs_refs: string[];
  warnings: string[];
  gaps: string[];
};

export type AutonomyContractWebReadContext = {
  request?: Request;
};

const AUTONOMY_CONTRACT_SAMPLE =
  autonomyContractSample as unknown as AutonomyContract;

const AUTONOMY_PREVIEW_ROUTE_REFS = [
  "/api/augnes/read/autonomy-contract?scope=project:augnes",
] as const;

const AUTONOMY_PREVIEW_DOC_REFS = [
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "docs/AUTHORITY_MATRIX.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
] as const;

const AUTONOMY_PREVIEW_BOUNDARY_NOTES = [
  "Read-only Autonomy Contract Web preview display only.",
  "Preview only; no run, no schedule, no Codex launch, no handoff send, no write, and no external side effect.",
  "Future runner not implemented.",
  "Phase 9 requires separate explicit scope and approval.",
  "Budget is a boundary only, not spend permission.",
  "Route-composed budget/operator fields may be synthetic/operator-supplied preview defaults.",
  "Public Web display defaults to public-safe fixture fallback unless a validated local read-only request context is supplied.",
  "Phase 8F permits local clipboard/manual copy preview only; copied text may become stale and is not authority.",
  "No API write route, App/MCP tool, DB write, proof/evidence write, memory mutation, durable Perspective apply, scheduler, daemon, or background work authority.",
] as const;

const AUTONOMY_PREVIEW_NEXT_PHASE_NOTES = [
  "Phase 8C adds read-only Autonomy Contract Web preview panels on /workbench.",
  "Phase 8D adds a ChatGPT App/MCP model-only read-only Autonomy Contract preview tool.",
  "Phase 8E adds Codex instruction-only Autonomy Contract alignment.",
  "Phase 8F adds local clipboard/manual-copy Autonomy Contract preview only.",
  "Phase 8F copy/export is not file export-to-disk, external posting, send, schedule, run, launch, budget spend, or auto-apply.",
  "Phase 9 runner remains deferred and requires separate explicit scope and approval.",
] as const;

export function readAutonomyContractPreviewForWeb(
  context: AutonomyContractWebReadContext = {},
): AutonomyContractPreviewForWeb {
  if (context.request) {
    const validation = validateAutonomyContractReadRequest(context.request);

    if (validation.ok) {
      const routeResponse = readAutonomyContractForRoute({
        scope: validation.scope,
      });

      return {
        contract: withWebPreviewNotes(routeResponse.contract),
        source_status: {
          source: "local_readonly_route_context",
          autonomy_contract: routeResponse.source_status.autonomy_contract,
          budget: routeResponse.source_status.budget,
          delta_merge_policy:
            routeResponse.source_status.delta_merge_policy,
          run_preview: routeResponse.source_status.run_preview,
          source_disclosure: [
            routeResponse.source_status.source_disclosure,
            "Live route-composed data was read only after the Phase 8B local read-only request validator passed.",
          ].join(" "),
          synthetic_operator_supplied_fields:
            routeResponse.source_status.synthetic_operator_supplied_fields,
        },
        fallback_reasons: [],
        boundary_notes: [
          ...AUTONOMY_PREVIEW_BOUNDARY_NOTES,
          ...AUTONOMY_CONTRACT_ROUTE_AUTHORITY_BOUNDARY,
        ],
        public_safety: routeResponse.contract.public_safety,
        route_refs: routeResponse.contract.source_refs.route_refs,
        docs_refs: routeResponse.contract.source_refs.docs_refs,
        warnings: uniqueSorted([
          ...routeResponse.warnings,
          "Autonomy Contract Web preview is read-only display, not active autonomy state.",
      "AutonomyRunPreview is not execution.",
      "Budget is not spend permission.",
      "Local copy/export preview is clipboard/manual-copy only and may become stale.",
    ]),
    gaps: uniqueSorted(routeResponse.gaps),
  };
    }

    return buildFallbackPreview({
      reason: `Local read-only Autonomy Contract request validation failed closed with ${validation.code}.`,
      source: "validation_failed_fallback",
    });
  }

  return buildFallbackPreview({
    reason:
      "No explicit local read-only request context was supplied to the Autonomy Contract Web preview.",
    source: AUTONOMY_PREVIEW_PUBLIC_SAFE_FALLBACK_SOURCE,
  });
}

export function buildPublicSafeAutonomyContractPreviewFallback(
  reason: string,
): AutonomyContractPreviewForWeb {
  return buildFallbackPreview({
    reason,
    source: AUTONOMY_PREVIEW_PUBLIC_SAFE_FALLBACK_SOURCE,
  });
}

function buildFallbackPreview({
  reason,
  source,
}: {
  reason: string;
  source: AutonomyPreviewWebSource;
}): AutonomyContractPreviewForWeb {
  const contract = withWebPreviewNotes({
    ...AUTONOMY_CONTRACT_SAMPLE,
    title: "Public-safe Autonomy Contract preview fallback",
    bounded_context_summary:
      "Public-safe fixture fallback for reviewing Autonomy Contract structure without exposing live route-composed autonomy state.",
    source_refs: {
      ...AUTONOMY_CONTRACT_SAMPLE.source_refs,
      route_refs: [...AUTONOMY_PREVIEW_ROUTE_REFS],
      docs_refs: uniqueSorted([
        ...AUTONOMY_PREVIEW_DOC_REFS,
        ...AUTONOMY_CONTRACT_SAMPLE.source_refs.docs_refs,
      ]),
      repo_refs: ["hynk-studio/augnes"],
    },
    context_scope: {
      ...AUTONOMY_CONTRACT_SAMPLE.context_scope,
      scope_summary:
        "Public-safe fallback context from committed Autonomy Contract fixture refs.",
      notes: [
        reason,
        "This is not live autonomy state.",
        "This is not active run state.",
        "This is not budget approval or spend permission.",
        "This is not runner, scheduler, daemon, proof, evidence, or background work.",
        "This is not file export-to-disk, external posting, budget spend, or auto-apply.",
      ],
    },
    delta_merge_policy: {
      ...AUTONOMY_CONTRACT_SAMPLE.delta_merge_policy,
      auto_apply_allowed: false,
      auto_apply_targets: [],
    },
    run_preview: {
      ...AUTONOMY_CONTRACT_SAMPLE.run_preview,
      status: "preview_only",
      not_implemented_notes: uniqueSorted([
        ...AUTONOMY_CONTRACT_SAMPLE.run_preview.not_implemented_notes,
        "AutonomyRunPreview is not execution.",
        "No runner exists.",
        "No scheduler exists.",
        "No daemon exists.",
        "No background job exists.",
        "Phase 9 requires separate explicit scope and approval.",
      ]),
    },
    authority_boundary: buildAutonomyContractAuthorityBoundary(),
    gaps: [
      ...AUTONOMY_CONTRACT_SAMPLE.gaps,
      {
        code: "autonomy_contract_web.public_safe_fallback",
        severity: "medium",
        summary:
          "Live Autonomy Contract route-composed data is unavailable to this Web render without validated local read authorization.",
        source_refs: [...AUTONOMY_PREVIEW_PUBLIC_SAFE_FALLBACK_REFS],
        blocks_future_runner: true,
      },
    ],
    public_safety: {
      fixture_kind: "synthetic_sample",
      contains_private_conversation: false,
      contains_hidden_reasoning: false,
      contains_local_private_paths: false,
      contains_secrets_or_tokens: false,
      contains_raw_provider_output: false,
      contains_raw_retrieval_output: false,
      contains_real_account_artifacts: false,
      notes: [
        reason,
        "No private conversation.",
        "No hidden reasoning.",
        "No local private paths.",
        "No secrets/tokens.",
        "No raw provider output.",
        "No raw retrieval output.",
        "No real account artifacts.",
      ],
    },
    next_phase_notes: uniqueSorted([
      ...AUTONOMY_CONTRACT_SAMPLE.next_phase_notes,
      ...AUTONOMY_PREVIEW_NEXT_PHASE_NOTES,
    ]),
  });

  return {
    contract,
    source_status: {
      source,
      autonomy_contract: "public_safe_fixture_fallback",
      budget: "synthetic_operator_supplied_preview_defaults",
      delta_merge_policy: "phase_8a_default_no_auto_apply_policy",
      run_preview: "preview_only_no_runner",
      source_disclosure:
        "Web preview is using committed public-safe fixture fallback data and is not displaying live route-composed runtime state.",
      synthetic_operator_supplied_fields: [
        "title",
        "goal",
        "autonomy_mode",
        "allowed_agents",
        "allowed_surfaces",
        "budget",
        "reporting_cadence",
        "run_preview",
      ],
    },
    fallback_reasons: [reason],
    boundary_notes: [...AUTONOMY_PREVIEW_BOUNDARY_NOTES],
    public_safety: contract.public_safety,
    route_refs: [...AUTONOMY_PREVIEW_ROUTE_REFS],
    docs_refs: [...AUTONOMY_PREVIEW_DOC_REFS],
    warnings: [
      "Autonomy Contract Web preview is showing public-safe fallback data.",
      "This is not live autonomy state.",
      "This is not active run state.",
      "Budget is not approval and not spend permission.",
      "No runner, scheduler, daemon, background work, proof/evidence write, or external side effect is implemented.",
      "Local copy/export preview is clipboard/manual-copy only; copied content may become stale and is not authority.",
    ],
    gaps: [
      "Live route-composed Autonomy Contract preview data is unavailable without validated local read authorization.",
    ],
  };
}

function withWebPreviewNotes(contract: AutonomyContract): AutonomyContract {
  return {
    ...contract,
    status: "preview_only",
    delta_merge_policy: {
      ...contract.delta_merge_policy,
      auto_apply_allowed: false,
      auto_apply_targets: [],
    },
    run_preview: {
      ...contract.run_preview,
      status: "preview_only",
    },
    authority_boundary: buildAutonomyContractAuthorityBoundary(),
    next_phase_notes: uniqueSorted([
      ...contract.next_phase_notes,
      ...AUTONOMY_PREVIEW_NEXT_PHASE_NOTES,
    ]),
  };
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
