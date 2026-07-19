import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import {
  STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01,
  type ModelAdapterSessionV01,
  type ModelAdapterV01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  buildModelGatewayCostAuthorityV01,
  buildModelGatewayCostBudgetV01,
} from "@/lib/vnext/model-gateway/cost-authority";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import { normalizeStrategicAdvantageTransferModelOutputV01 } from "@/lib/vnext/strategic-advantage-transfer-protocol";
import type { VNextOperatorStrategicAdvantageTransferDependenciesV01 } from "@/lib/vnext/runtime/operator-pilot-strategic-advantage-transfer";
import type {
  StrategicAdvantageTransferModelInputV01,
  StrategicAdvantageTransferModelOutputV01,
} from "@/types/vnext/strategic-advantage-transfer";

export const CANONICAL_TEST_STRATEGIC_TRANSPORT_FIXTURE_FILE_V01 =
  "strategic-model-transport-fixture-v0-1.json" as const;
export const CANONICAL_TEST_STRATEGIC_TRANSPORT_COUNTER_FILE_V01 =
  "strategic-model-transport-counter-v0-1.json" as const;
export const CANONICAL_TEST_STRATEGIC_TRANSPORT_FIXTURE_VERSION_V01 =
  "strategic_model_transport_fixture.v0.1" as const;
export const CANONICAL_TEST_STRATEGIC_COST_UNIT_V01 =
  "canonical_test_credit_microunit" as const;
export const CANONICAL_TEST_STRATEGIC_COST_CEILING_V01 = 98_304 as const;

interface CanonicalTestStrategicTransportFixtureV01 {
  fixture_version: typeof CANONICAL_TEST_STRATEGIC_TRANSPORT_FIXTURE_VERSION_V01;
  workspace_id: string;
  project_id: string;
  working_frame_fingerprint: string;
  source_catalog_fingerprint: string;
}

/**
 * Returns a deterministic fake transport only for an explicitly owned
 * canonical-test root. Production and ordinary local runtimes never discover
 * this seam, and a missing fixture preserves the normal Model Gateway path.
 */
export function createCanonicalTestStrategicTransportDependenciesV01(
  environment: NodeJS.ProcessEnv = process.env,
): VNextOperatorStrategicAdvantageTransferDependenciesV01 | undefined {
  if (environment.AUGNES_CANONICAL_TEST_MODE !== "1") return undefined;
  const requestedRoot = environment.AUGNES_CANONICAL_TEMP_ROOT?.trim();
  if (!requestedRoot || !path.isAbsolute(requestedRoot)) return undefined;
  const root = realpathSync(requestedRoot);
  const requestedDatabase = environment.AUGNES_DB_PATH?.trim();
  if (!requestedDatabase || !path.isAbsolute(requestedDatabase)) {
    return undefined;
  }
  const databaseStat = lstatSync(requestedDatabase);
  if (!databaseStat.isFile() || databaseStat.isSymbolicLink()) {
    throw new Error("canonical_strategic_transport_database_invalid");
  }
  assertInsideRoot(root, realpathSync(requestedDatabase));
  const fixturePath = path.join(
    root,
    CANONICAL_TEST_STRATEGIC_TRANSPORT_FIXTURE_FILE_V01,
  );
  if (!existsSync(fixturePath)) return undefined;
  const fixtureStat = lstatSync(fixturePath);
  if (!fixtureStat.isFile() || fixtureStat.isSymbolicLink()) {
    throw new Error("canonical_strategic_transport_fixture_invalid");
  }
  const resolvedFixturePath = realpathSync(fixturePath);
  assertInsideRoot(root, resolvedFixturePath);
  const fixture = parseFixture(readFileSync(resolvedFixturePath, "utf8"));
  if (
    fixture.workspace_id !== environment.AUGNES_VNEXT_OPERATOR_WORKSPACE_ID ||
    fixture.project_id !== environment.AUGNES_VNEXT_OPERATOR_PROJECT_ID
  ) {
    throw new Error("canonical_strategic_transport_scope_conflict");
  }
  const counterPath = path.join(
    root,
    CANONICAL_TEST_STRATEGIC_TRANSPORT_COUNTER_FILE_V01,
  );
  const costBudget = createCanonicalTestStrategicCostBudgetV01(fixture);
  return {
    read_model_capability: () => ({
      status: "available",
      summary:
        "A deterministic fake R4 transport is available inside this owned canonical-test runtime.",
      verification: "trusted_local_status",
    }),
    read_cost_budget: ({ workspace_id, project_id }) =>
      workspace_id === fixture.workspace_id && project_id === fixture.project_id
        ? structuredClone(costBudget)
        : null,
    adapter: createCanonicalTestStrategicAdapterV01((projected) => {
      if (
        projected.working_frame.working_frame_fingerprint !==
          fixture.working_frame_fingerprint ||
        projected.source_catalog.source_catalog_fingerprint !==
          fixture.source_catalog_fingerprint
      ) {
        throw new Error("canonical_strategic_transport_source_conflict");
      }
      if (
        JSON.stringify(projected.lenses) !==
        JSON.stringify([
          "constraint_fit",
          "verification_leverage",
          "regression_safety",
        ])
      ) {
        throw new Error("canonical_strategic_transport_lens_conflict");
      }
      const base = projected.source_catalog.items.find(
        (entry) => entry.material_kind === "accepted_agent_plan_base",
      );
      if (!base) {
        throw new Error("canonical_strategic_transport_base_missing");
      }
      writeFileSync(
        counterPath,
        `${JSON.stringify({
          counter_version: "strategic_model_transport_counter.v0.1",
          transport_calls: 1,
          working_frame_fingerprint: fixture.working_frame_fingerprint,
          source_catalog_fingerprint: fixture.source_catalog_fingerprint,
        })}\n`,
        { encoding: "utf8", flag: "wx", mode: 0o600 },
      );
      return buildOutput(base.source_key);
    }),
  };
}

export function createCanonicalTestStrategicCostBudgetV01(
  fixture: Pick<
    CanonicalTestStrategicTransportFixtureV01,
    "workspace_id" | "project_id"
  >,
) {
  const providerRef = canonicalTestProviderRefV01();
  const modelRef = canonicalTestModelRefV01();
  const authority = buildModelGatewayCostAuthorityV01({
    authority_kind: "provider_model_pricing_snapshot",
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    purpose: "strategic_advantage_transfer",
    provider_ref: providerRef,
    model_ref: modelRef,
    cost_unit: CANONICAL_TEST_STRATEGIC_COST_UNIT_V01,
    input_rate: { unit: "utf8_byte", cost_per_unit: 1 },
    output_rate: { unit: "token", cost_per_unit: 16 },
    pricing_source_version: "canonical_test_strategic_pricing.v0.1",
    pricing_effective_at: "2020-01-01T00:00:00.000Z",
    pricing_expires_at: null,
    project_model_policy_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        policy_version: "canonical_test_project_model_policy.v0.1",
        workspace_id: fixture.workspace_id,
        project_id: fixture.project_id,
        provider_ref: providerRef,
        model_ref: modelRef,
        maximum_permitted_cost:
          CANONICAL_TEST_STRATEGIC_COST_CEILING_V01,
        cost_unit: CANONICAL_TEST_STRATEGIC_COST_UNIT_V01,
      }),
    ),
  });
  return buildModelGatewayCostBudgetV01({
    authority,
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    purpose: "strategic_advantage_transfer",
    provider_ref: providerRef,
    model_ref: modelRef,
    maximum_input_units: 65_536,
    maximum_output_units: 2_048,
    timeout_ms: 20_000,
    maximum_permitted_cost: CANONICAL_TEST_STRATEGIC_COST_CEILING_V01,
    evaluated_at: "2025-01-01T00:00:00.000Z",
  });
}

function canonicalTestProviderRefV01() {
  return {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "model_provider",
    external_id: "canonical-test-provider",
    provider: "canonical-test-provider",
    trust_class: "direct_local_observation" as const,
  };
}

function canonicalTestModelRefV01() {
  return {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "provider_model",
    external_id: "canonical-test-strategic-model",
    provider: "canonical-test-provider",
    trust_class: "direct_local_observation" as const,
  };
}

function parseFixture(value: string): CanonicalTestStrategicTransportFixtureV01 {
  const parsed = JSON.parse(value) as unknown;
  if (!isRecord(parsed)) fixtureInvalid();
  const keys = Object.keys(parsed).sort();
  if (
    JSON.stringify(keys) !==
    JSON.stringify(
      [
        "fixture_version",
        "project_id",
        "source_catalog_fingerprint",
        "working_frame_fingerprint",
        "workspace_id",
      ].sort(),
    )
  ) {
    fixtureInvalid();
  }
  if (
    parsed.fixture_version !==
      CANONICAL_TEST_STRATEGIC_TRANSPORT_FIXTURE_VERSION_V01 ||
    !isCanonicalScopeId(parsed.workspace_id, "workspace") ||
    !isCanonicalScopeId(parsed.project_id, "project") ||
    !isFingerprint(parsed.working_frame_fingerprint) ||
    !isFingerprint(parsed.source_catalog_fingerprint)
  ) {
    fixtureInvalid();
  }
  return parsed as unknown as CanonicalTestStrategicTransportFixtureV01;
}

function createCanonicalTestStrategicAdapterV01(
  transport: (
    input: { canonical_project_id: string } &
      StrategicAdvantageTransferModelInputV01,
  ) => StrategicAdvantageTransferModelOutputV01,
): ModelAdapterV01 {
  const implementation = {
    implementation_id: "canonical_test.strategic_transport",
    implementation_version: "canonical_test_strategic_transport.v0.1",
  } as const;
  return {
    describe() {
      return implementation;
    },
    async prepare(purpose) {
      if (purpose !== STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01) {
        return null;
      }
      const session: ModelAdapterSessionV01 = {
        ...implementation,
        purpose,
        provider_ref: canonicalTestProviderRefV01(),
        model_ref: canonicalTestModelRefV01(),
        async invoke(input, lifecycle) {
          if (
            input.input_kind !==
            STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01
          ) {
            fixtureInvalid();
          }
          lifecycle.report_input_bytes(
            new TextEncoder().encode(canonicalizeProtocolValueV01(input))
              .byteLength,
          );
          lifecycle.mark_egress_attempted();
          return {
            purpose,
            // The Gateway receipt fingerprints adapter-normalized output. Keep
            // this canonical fake at the same adapter boundary as the real
            // structured-output codec rather than fingerprinting fixture order.
            output: normalizeStrategicAdvantageTransferModelOutputV01(
              transport(input),
              input.lenses,
            ),
            model_identifier: "canonical-test-strategic-model",
            usage: {
              basis: "provider_report",
              quality: "reported",
              source: "provider_response",
              input_tokens: 240,
              output_tokens: 180,
              total_tokens: 420,
            },
          };
        },
      };
      return session;
    },
  };
}

function buildOutput(
  sourceKey: string,
): StrategicAdvantageTransferModelOutputV01 {
  return {
    schema_version: "strategic_advantage_transfer_model_output.v0.1",
    lens_results: [
      {
        result: "transfer",
        lens_id: "constraint_fit",
        title: "Narrow validation around the exact accepted plan",
        applicability_condition:
          "The packet-selected accepted plan remains current and source-bound.",
        expected_effect:
          "Reviewers can inspect one bounded local improvement without promoting host completion to task success.",
        transfer_cost:
          "One explicit human review and one later operation-aware revision are required.",
        source_keys: [sourceKey],
        falsifier:
          "The transfer is invalid if the accepted plan head or packet selection changes.",
        uncertainty: [
          "Criterion assessment remains unknown and insufficient.",
        ],
        introduced_risks: [
          "A narrow validation focus may omit an unrelated plan regression.",
        ],
        patch_summary:
          "Create review-only local transfer material linked to the exact accepted plan.",
        regression_review: {
          regression_risks: [
            "The plan may become stale before a human authors an operation-aware revision.",
          ],
          checks_or_observations_needed: [
            "Re-read the accepted plan head before any later revision.",
          ],
          stop_conditions: [
            "Stop when the base fingerprint no longer matches current state.",
          ],
          invalidation_conditions: [
            "Invalidate when the plan is replaced, superseded, or retracted.",
          ],
          source_keys: [sourceKey],
        },
        known_limitations: [
          "The transfer remains pending with operation unknown.",
        ],
      },
      {
        result: "no_transfer",
        lens_id: "verification_leverage",
        non_transfer_reason:
          "No second exact source supports another bounded transfer.",
      },
      {
        result: "no_transfer",
        lens_id: "regression_safety",
        non_transfer_reason:
          "No separate regression transfer is justified by the bounded catalog.",
      },
    ],
    stop_reason: "completed",
  };
}

function assertInsideRoot(root: string, candidate: string): void {
  const relative = path.relative(root, candidate);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error("canonical_strategic_transport_fixture_root_invalid");
  }
}

function isCanonicalScopeId(
  value: unknown,
  kind: "workspace" | "project",
): value is string {
  return (
    typeof value === "string" &&
    new RegExp(
      `^${kind}:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`,
      "i",
    ).test(value)
  );
}

function isFingerprint(value: unknown): value is string {
  return typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fixtureInvalid(): never {
  throw new Error("canonical_strategic_transport_fixture_invalid");
}
