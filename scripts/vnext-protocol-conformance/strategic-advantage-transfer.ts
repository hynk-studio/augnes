import assert from "node:assert/strict";

import { isModelEgressBoundaryError } from "@/lib/model-egress/bounded-model-payload";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import {
  canonicalizeProtocolValueV01,
  compareProtocolCanonicalV01,
} from "@/lib/vnext/protocol-primitives";

import {
  assertStrategicAdvantageTransferSourceTextSafeV01,
  createStrategicAdvantageTransferBudgetV01,
  createStrategicAnalysisIdentityV01,
  createStrategicSourceCatalogFingerprintV01,
  createStrategicSourceKeyV01,
  createStrategicWorkingFrameFingerprintV01,
  normalizeStrategicAdvantageTransferModelOutputV01,
  resolveStrategicAdvantageTransferItemsV01,
  StrategicAdvantageTransferProtocolErrorV01,
  validateStrategicAdvantageTransferSourceCatalogV01,
  validateStrategicAdvantageTransferWorkingFrameV01,
} from "@/lib/vnext/strategic-advantage-transfer-protocol";
import {
  STRATEGIC_ADVANTAGE_TRANSFER_MAX_CANONICAL_UTF8_BYTES_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MAX_SOURCE_CATALOG_ITEMS_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_SOURCE_CATALOG_VERSION_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_WORKING_FRAME_VERSION_V01,
  type StrategicAdvantageTransferBaseStrategyV01,
  type StrategicAdvantageTransferLensIdV01,
  type StrategicAdvantageTransferModelInputV01,
  type StrategicAdvantageTransferModelOutputV01,
  type StrategicAdvantageTransferModelTransferV01,
  type StrategicAdvantageTransferSourceCatalogV01,
  type StrategicAdvantageTransferWorkingFrameV01,
} from "@/types/vnext/strategic-advantage-transfer";
import type { ExternalRefTrustClassV01, ExternalRefV01 } from "@/types/vnext/external-ref";
import type { ModelInvocationReceiptV02 } from "@/types/vnext/model-invocation-receipt";

const HASH_A = `sha256:${"a".repeat(64)}`;
const HASH_B = `sha256:${"b".repeat(64)}`;
const HASH_C = `sha256:${"c".repeat(64)}`;
const WORKSPACE_ID = "workspace:11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "project:22222222-2222-4222-8222-222222222222";

export function runStrategicAdvantageTransferConformanceV01() {
  assert.doesNotThrow(() =>
    assertStrategicAdvantageTransferSourceTextSafeV01({
      summary: "Bounded project-relative material without local paths.",
    }),
  );
  for (const unsafe of [
    "/tmp/private/result.txt",
    "/var/private/result.txt",
    "file:///tmp/private/result.txt",
    "C:\\private\\result.txt",
    "\\\\server\\share\\result.txt",
  ]) {
    assertProtocolError(
      () => assertStrategicAdvantageTransferSourceTextSafeV01(unsafe),
      "strategic_advantage_transfer_source_text_unsafe",
    );
  }
  const directCatalog = catalogFixture([
    catalogEntryFixture({
      label: "direct",
      materialKind: "receipt_observation:direct",
      trustClass: "direct_local_observation",
    }),
  ]);
  const directKey = directCatalog.items[0]!.source_key;

  const oneLens = normalizeStrategicAdvantageTransferModelOutputV01(
    outputFixture([transferFixture("constraint_fit", directKey)]),
    ["constraint_fit"],
  );
  assert.equal(oneLens.lens_results.length, 1);
  const noTransfer = normalizeStrategicAdvantageTransferModelOutputV01(
    {
      schema_version: STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01,
      lens_results: [
        {
          result: "no_transfer",
          lens_id: "constraint_fit",
          non_transfer_reason: "No exact source-linked transfer is supportable.",
        },
      ],
      stop_reason: "no_transferable_advantage",
    },
    ["constraint_fit"],
  );
  assert.equal(noTransfer.stop_reason, "no_transferable_advantage");

  const threeLenses = normalizeStrategicAdvantageTransferModelOutputV01(
    outputFixture([
      transferFixture("constraint_fit", directKey),
      transferFixture("verification_leverage", directKey),
      transferFixture("regression_safety", directKey),
    ]),
    ["constraint_fit", "verification_leverage", "regression_safety"],
  );
  assert.equal(threeLenses.lens_results.length, 3);

  assertProtocolError(
    () =>
      normalizeStrategicAdvantageTransferModelOutputV01({
        ...outputFixture([]),
        lens_results: [
          transferFixture("constraint_fit", directKey),
          transferFixture("verification_leverage", directKey),
          transferFixture("regression_safety", directKey),
          transferFixture("constraint_fit", directKey),
        ],
      }),
    "strategic_advantage_transfer_collection_bound",
  );
  assertProtocolError(
    () =>
      normalizeStrategicAdvantageTransferModelOutputV01({
        ...outputFixture([]),
        lens_results: [
          {
            ...transferFixture("constraint_fit", directKey),
            lens_id: "invented_lens",
          },
        ],
      }),
    "strategic_advantage_transfer_lens_invalid",
  );
  assertProtocolError(
    () =>
      normalizeStrategicAdvantageTransferModelOutputV01(
        outputFixture([
          transferFixture("constraint_fit", directKey),
          transferFixture("constraint_fit", directKey),
        ]),
      ),
    "strategic_advantage_transfer_duplicate_lens",
  );
  assertProtocolError(
    () =>
      normalizeStrategicAdvantageTransferModelOutputV01({
        ...oneLens,
        confidence: 0.99,
      }),
    "strategic_advantage_transfer_unknown_or_missing_field",
  );
  for (const forbiddenField of [
    "score",
    "winner",
    "actor",
    "debate",
  ] as const) {
    assertProtocolError(
      () =>
        normalizeStrategicAdvantageTransferModelOutputV01({
          ...oneLens,
          [forbiddenField]: "forbidden model-owned authority material",
        }),
      "strategic_advantage_transfer_unknown_or_missing_field",
    );
  }
  assertProtocolError(
    () =>
      normalizeStrategicAdvantageTransferModelOutputV01(
        outputFixture([
          {
            ...transferFixture("constraint_fit", directKey),
            source_keys: [directKey, directKey],
          },
        ]),
      ),
    "strategic_advantage_transfer_duplicate_source_key",
  );
  assertProtocolError(
    () =>
      normalizeStrategicAdvantageTransferModelOutputV01(
        outputFixture([
          {
            ...transferFixture("constraint_fit", directKey),
            title: "x".repeat(1_201),
          },
        ]),
      ),
    "strategic_advantage_transfer_text_bound_exceeded",
  );
  assert.throws(
    () =>
      normalizeStrategicAdvantageTransferModelOutputV01(
        outputFixture([
          {
            ...transferFixture("constraint_fit", directKey),
            title: "OPENAI_API_KEY=sk-forbidden-secret-material",
          },
        ]),
      ),
    (error: unknown) =>
      isModelEgressBoundaryError(error) &&
      error.reasonCode === "model_egress_payload_unsafe",
  );
  assertProtocolError(
    () =>
      normalizeStrategicAdvantageTransferModelOutputV01(
        outputFixture([
          {
            ...transferFixture("constraint_fit", directKey),
            patch_summary:
              "Read /tmp/private/result.txt before preparing the patch.",
          },
        ]),
      ),
    "strategic_advantage_transfer_source_text_unsafe",
  );
  assertProtocolError(
    () =>
      normalizeStrategicAdvantageTransferModelOutputV01({
        ...oneLens,
        transcript: "forbidden model transcript",
      }),
    "strategic_advantage_transfer_unknown_or_missing_field",
  );
  assertProtocolError(
    () =>
      normalizeStrategicAdvantageTransferModelOutputV01({
        ...oneLens,
        lens_results: [
          {
            ...oneLens.lens_results[0],
            hidden_reasoning: "must never cross the structured boundary",
          },
        ],
      }),
    "strategic_advantage_transfer_unknown_or_missing_field",
  );

  const directItems = resolveStrategicAdvantageTransferItemsV01({
    catalog: directCatalog,
    model_output: oneLens,
  });
  assert.equal(directItems.length, 1);
  assert.equal(directItems[0]!.support.status, "supported");
  assert.equal(directItems[0]!.support.basis, "observed");
  assert.deepEqual(directItems[0]!.source_refs, [directCatalog.items[0]!.ref]);

  const noSource = structuredClone(oneLens);
  (noSource.lens_results[0] as StrategicAdvantageTransferModelTransferV01).source_keys = [];
  assertProtocolError(
    () => normalizeStrategicAdvantageTransferModelOutputV01(noSource),
    "strategic_advantage_transfer_collection_bound",
  );
  const unknownSource = structuredClone(oneLens);
  (unknownSource.lens_results[0] as StrategicAdvantageTransferModelTransferV01).source_keys = [
    `source:${"f".repeat(24)}`,
  ];
  const normalizedUnknownSource = normalizeStrategicAdvantageTransferModelOutputV01(
    unknownSource,
  );
  assertProtocolError(
    () =>
      resolveStrategicAdvantageTransferItemsV01({
        catalog: directCatalog,
        model_output: normalizedUnknownSource,
      }),
    "strategic_advantage_transfer_unknown_source_key",
  );

  assertSupportClassification("verified_external_observation", "receipt_observation:verified", {
    status: "supported",
    basis: "observed",
  });
  assertSupportClassification("host_attestation", "receipt_attestation:host", {
    status: "unknown",
    basis: "attested",
  });
  assertSupportClassification("provider_report", "receipt_attestation:provider", {
    status: "unknown",
    basis: "attested",
  });
  assertSupportClassification("derived_interpretation", "source_inference:derived", {
    status: "unknown",
    basis: "insufficient",
  });
  assertSupportClassification("provider_report", "model_invocation_receipt", {
    status: "unknown",
    basis: "insufficient",
  });
  const derivedOnDirectRefCatalog = catalogFixture([
    catalogEntryFixture({
      label: "derived-inference-anchored-by-local-ref",
      materialKind: "source_inference:criterion_assessment",
      trustClass: "derived_interpretation",
      referenceTrustClass: "direct_local_observation",
    }),
  ]);
  const derivedOnDirectRef = resolveStrategicAdvantageTransferItemsV01({
    catalog: derivedOnDirectRefCatalog,
    model_output: normalizeStrategicAdvantageTransferModelOutputV01(
      outputFixture([
        transferFixture(
          "constraint_fit",
          derivedOnDirectRefCatalog.items[0]!.source_key,
        ),
      ]),
    ),
  })[0]!;
  assert.equal(derivedOnDirectRef.support.status, "unknown");
  assert.equal(derivedOnDirectRef.support.basis, "insufficient");
  assert.equal(derivedOnDirectRef.support.direct_local_observation, 0);
  assert.equal(derivedOnDirectRef.support.derived_interpretation, 1);
  assertSupportClassification("direct_local_observation", "skipped_check", {
    status: "unknown",
    basis: "insufficient",
  });
  assertSupportClassification("direct_local_observation", "execution_status", {
    status: "unknown",
    basis: "insufficient",
  });
  assertSupportClassification("direct_local_observation", "source_conflict", {
    status: "unknown",
    basis: "insufficient",
  });
  for (const unavailableCoverageKind of [
    "coverage_unsupported",
    "coverage_outside_coverage",
  ]) {
    const unavailableCatalog = catalogFixture([
      catalogEntryFixture({
        label: unavailableCoverageKind,
        materialKind: unavailableCoverageKind,
        trustClass: "direct_local_observation",
      }),
    ]);
    const unavailableItem = resolveStrategicAdvantageTransferItemsV01({
      catalog: unavailableCatalog,
      model_output: normalizeStrategicAdvantageTransferModelOutputV01(
        outputFixture([
          transferFixture(
            "constraint_fit",
            unavailableCatalog.items[0]!.source_key,
          ),
        ]),
      ),
    })[0]!;
    assert.equal(unavailableItem.support.status, "unknown");
    assert.equal(unavailableItem.support.basis, "insufficient");
    assert.equal(unavailableItem.support.unavailable_material, 1);
    assert.equal(unavailableItem.support.direct_local_observation, 0);
  }

  const mixedCatalog = catalogFixture([
    catalogEntryFixture({
      label: "mixed-direct",
      materialKind: "receipt_observation:direct",
      trustClass: "direct_local_observation",
    }),
    catalogEntryFixture({
      label: "mixed-attestation",
      materialKind: "receipt_attestation:host",
      trustClass: "host_attestation",
    }),
  ]);
  const mixedOutput = normalizeStrategicAdvantageTransferModelOutputV01(
    outputFixture([
      transferFixture(
        "constraint_fit",
        mixedCatalog.items.map((entry) => entry.source_key),
      ),
    ]),
  );
  const mixed = resolveStrategicAdvantageTransferItemsV01({
    catalog: mixedCatalog,
    model_output: mixedOutput,
  });
  assert.equal(mixed[0]!.support.status, "supported");
  assert.equal(mixed[0]!.support.basis, "mixed");

  const agreementCatalog = catalogFixture([
    catalogEntryFixture({
      label: "model-agreement-derived-only",
      materialKind: "source_inference:derived",
      trustClass: "derived_interpretation",
    }),
  ]);
  const agreementOutput = normalizeStrategicAdvantageTransferModelOutputV01(
    outputFixture(
      ([
        "constraint_fit",
        "verification_leverage",
        "regression_safety",
      ] as const).map((lens) =>
        transferFixture(lens, agreementCatalog.items[0]!.source_key),
      ),
    ),
  );
  const agreementItems = resolveStrategicAdvantageTransferItemsV01({
    catalog: agreementCatalog,
    model_output: agreementOutput,
  });
  assert.equal(agreementItems.length, 3);
  assert.ok(
    agreementItems.every(
      (item) =>
        item.support.status === "unknown" &&
        item.support.basis === "insufficient",
    ),
    "three lenses agreeing on derived-only material must grant no authority",
  );

  const frameWithoutFingerprint = workingFrameFixture();
  const frameFingerprint = createStrategicWorkingFrameFingerprintV01(
    frameWithoutFingerprint,
  );
  assert.equal(
    createStrategicWorkingFrameFingerprintV01(structuredClone(frameWithoutFingerprint)),
    frameFingerprint,
  );
  const localOnlyFrameMaterial = {
    ...frameWithoutFingerprint,
    data_classification: "local_only" as const,
  };
  assert.equal(
    validateStrategicAdvantageTransferWorkingFrameV01({
      ...localOnlyFrameMaterial,
      working_frame_fingerprint:
        createStrategicWorkingFrameFingerprintV01(localOnlyFrameMaterial),
    }).data_classification,
    "local_only",
  );
  assert.notEqual(
    createStrategicWorkingFrameFingerprintV01({
      ...frameWithoutFingerprint,
      task_goal: "A materially changed task goal.",
    }),
    frameFingerprint,
  );

  const clonedCatalog = structuredClone(directCatalog);
  const { source_catalog_fingerprint: _catalogFingerprint, ...catalogMaterial } =
    clonedCatalog;
  assert.equal(
    createStrategicSourceCatalogFingerprintV01(catalogMaterial),
    directCatalog.source_catalog_fingerprint,
  );

  const maximumCatalog = catalogFixture(
    Array.from(
      { length: STRATEGIC_ADVANTAGE_TRANSFER_MAX_SOURCE_CATALOG_ITEMS_V01 },
      (_, index) =>
        catalogEntryFixture({
          label: `catalog-bound-${index.toString().padStart(2, "0")}`,
          materialKind: "receipt_observation:catalog_bound",
          trustClass: "direct_local_observation",
        }),
    ),
  );
  assert.equal(
    validateStrategicAdvantageTransferSourceCatalogV01(maximumCatalog).items
      .length,
    STRATEGIC_ADVANTAGE_TRANSFER_MAX_SOURCE_CATALOG_ITEMS_V01,
  );
  const overBoundCatalog = catalogFixture([
    ...maximumCatalog.items,
    catalogEntryFixture({
      label: "catalog-bound-overflow",
      materialKind: "receipt_observation:catalog_bound",
      trustClass: "direct_local_observation",
    }),
  ]);
  assertProtocolError(
    () => validateStrategicAdvantageTransferSourceCatalogV01(overBoundCatalog),
    "strategic_advantage_transfer_collection_bound",
  );

  const changedSourceFingerprintCatalog = catalogFixture(
    directCatalog.items.map((item) => ({
      ...item,
      source_fingerprint: HASH_B,
    })),
  );
  assertProtocolError(
    () =>
      validateStrategicAdvantageTransferSourceCatalogV01(
        changedSourceFingerprintCatalog,
      ),
    "strategic_advantage_transfer_source_fingerprint_conflict",
  );
  const unsafeCatalogItem = {
    ...directCatalog.items[0]!,
    bounded_summary: "Read /tmp/private/result.txt before review.",
  };
  unsafeCatalogItem.source_key = createStrategicSourceKeyV01({
    ref: unsafeCatalogItem.ref,
    material_kind: unsafeCatalogItem.material_kind,
    bounded_summary: unsafeCatalogItem.bounded_summary,
  });
  assertProtocolError(
    () =>
      validateStrategicAdvantageTransferSourceCatalogV01(
        catalogFixture([unsafeCatalogItem]),
      ),
    "strategic_advantage_transfer_source_text_unsafe",
  );

  const unsafeFrameMaterial = {
    ...workingFrameFixture(),
    task_goal: "Inspect /var/private/result.txt before review.",
  };
  assertProtocolError(
    () =>
      validateStrategicAdvantageTransferWorkingFrameV01({
        ...unsafeFrameMaterial,
        working_frame_fingerprint:
          createStrategicWorkingFrameFingerprintV01(unsafeFrameMaterial),
      }),
    "strategic_advantage_transfer_source_text_unsafe",
  );

  const maximumWorkingFrame = workingFrameAtCanonicalSize(
    STRATEGIC_ADVANTAGE_TRANSFER_MAX_CANONICAL_UTF8_BYTES_V01,
  );
  assert.equal(
    canonicalUtf8Size(maximumWorkingFrame),
    STRATEGIC_ADVANTAGE_TRANSFER_MAX_CANONICAL_UTF8_BYTES_V01,
  );
  validateStrategicAdvantageTransferWorkingFrameV01(maximumWorkingFrame);
  const overBoundWorkingFrame = workingFrameAtCanonicalSize(
    STRATEGIC_ADVANTAGE_TRANSFER_MAX_CANONICAL_UTF8_BYTES_V01 + 1,
  );
  assertProtocolError(
    () =>
      validateStrategicAdvantageTransferWorkingFrameV01(overBoundWorkingFrame),
    "strategic_advantage_transfer_material_bound_exceeded",
  );

  const historicalReceipt = historicalModelInvocationReceiptFixture();
  assert.equal(
    Object.hasOwn(historicalReceipt, "normalized_output_fingerprint"),
    false,
  );
  const normalizedHistoricalReceipt =
    validateModelInvocationReceiptV02(historicalReceipt);
  assert.equal(
    Object.hasOwn(normalizedHistoricalReceipt, "normalized_output_fingerprint"),
    false,
  );
  assert.notEqual(
    createStrategicSourceCatalogFingerprintV01({
      ...catalogMaterial,
      items: catalogMaterial.items.map((item) => ({
        ...item,
        bounded_summary: `${item.bounded_summary} changed`,
      })),
    }),
    directCatalog.source_catalog_fingerprint,
  );

  const identityInput = {
    profile: "strategic_advantage_transfer.v0.1",
    base: HASH_A,
    frame: frameFingerprint,
    catalog: directCatalog.source_catalog_fingerprint,
  };
  assert.equal(
    createStrategicAnalysisIdentityV01(structuredClone(identityInput)),
    createStrategicAnalysisIdentityV01(identityInput),
  );
  assert.notEqual(
    createStrategicAnalysisIdentityV01({ ...identityInput, base: HASH_B }),
    createStrategicAnalysisIdentityV01(identityInput),
  );

  const sourceKey = createStrategicSourceKeyV01({
    ref: directCatalog.items[0]!.ref,
    material_kind: directCatalog.items[0]!.material_kind,
    bounded_summary: directCatalog.items[0]!.bounded_summary,
  });
  assert.equal(sourceKey, directCatalog.items[0]!.source_key);
  return {
    suite: "strategic-advantage-transfer.v0.1",
    status: "passed",
    fixed_lens_bounds_checked: true,
    strict_structured_output_checked: true,
    exact_source_key_resolution_checked: true,
    source_less_transfer_refused: true,
    server_owned_support_classification_checked: true,
    deterministic_frame_catalog_identity_checked: true,
    forbidden_model_material_refused: true,
    no_authority_from_confidence_or_agreement: true,
    source_catalog_bounds_checked: true,
    aggregate_material_bounds_checked: true,
    source_text_safety_checked: true,
    historical_model_receipt_compatibility_checked: true,
  };
}

export function strategicModelInputFixtureV01(
  lenses: StrategicAdvantageTransferLensIdV01[] = [
    "constraint_fit",
    "verification_leverage",
    "regression_safety",
  ],
): StrategicAdvantageTransferModelInputV01 {
  const catalog = catalogFixture([
    catalogEntryFixture({
      label: "gateway-direct",
      materialKind: "receipt_observation:direct",
      trustClass: "direct_local_observation",
    }),
  ]);
  const frame = workingFrameFixture();
  return {
    input_kind: "strategic_advantage_transfer",
    profile_version: "strategic_advantage_transfer.v0.1",
    schema_version: STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01,
    working_frame: {
      working_frame_fingerprint:
        createStrategicWorkingFrameFingerprintV01(frame),
      data_classification: frame.data_classification,
      task_goal: frame.task_goal,
      success_criteria: frame.success_criteria,
      required_checks: frame.required_checks,
      forbidden_actions: frame.forbidden_actions,
      expected_artifacts: frame.expected_artifacts,
      required_return_fields: frame.required_return_fields,
      base_strategy_summary: frame.base_strategy.bounded_summary,
      excluded_context_summaries: frame.excluded_context_summaries,
      gap_summaries: frame.gap_summaries,
    },
    source_catalog: {
      source_catalog_fingerprint: catalog.source_catalog_fingerprint,
      items: catalog.items.map((item) => ({
        source_key: item.source_key,
        material_kind: item.material_kind,
        trust_class: item.trust_class,
        bounded_summary: item.bounded_summary,
      })),
    },
    lenses,
    budget: createStrategicAdvantageTransferBudgetV01(),
  };
}

export function strategicModelOutputFixtureV01(
  input: StrategicAdvantageTransferModelInputV01,
): StrategicAdvantageTransferModelOutputV01 {
  const sourceKey = input.source_catalog.items[0]!.source_key;
  return normalizeStrategicAdvantageTransferModelOutputV01(
    outputFixture(
      input.lenses.map((lens) => transferFixture(lens, sourceKey)),
    ),
    input.lenses,
  );
}

function assertSupportClassification(
  trustClass: ExternalRefTrustClassV01,
  materialKind: string,
  expected: { status: "supported" | "unknown"; basis: string },
): void {
  const catalog = catalogFixture([
    catalogEntryFixture({
      label: `${trustClass}-${materialKind}`,
      materialKind,
      trustClass,
    }),
  ]);
  const output = normalizeStrategicAdvantageTransferModelOutputV01(
    outputFixture([
      transferFixture("constraint_fit", catalog.items[0]!.source_key),
    ]),
  );
  const item = resolveStrategicAdvantageTransferItemsV01({
    catalog,
    model_output: output,
  })[0]!;
  assert.equal(item.support.status, expected.status);
  assert.equal(item.support.basis, expected.basis);
}

function outputFixture(
  lensResults: StrategicAdvantageTransferModelOutputV01["lens_results"],
): StrategicAdvantageTransferModelOutputV01 {
  return {
    schema_version: STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01,
    lens_results: lensResults,
    stop_reason:
      lensResults.some((result) => result.result === "transfer")
        ? "completed"
        : "no_transferable_advantage",
  };
}

function transferFixture(
  lensId: StrategicAdvantageTransferLensIdV01,
  sourceKeys: string | string[],
): StrategicAdvantageTransferModelTransferV01 {
  const keys = Array.isArray(sourceKeys) ? sourceKeys : [sourceKeys];
  return {
    result: "transfer",
    lens_id: lensId,
    title: `Bounded ${lensId} transfer`,
    applicability_condition: "The exact accepted plan remains current.",
    expected_effect: "Reviewers can test one local improvement.",
    transfer_cost: "One bounded validation pass.",
    source_keys: keys,
    falsifier: "The current plan no longer matches the packet.",
    uncertainty: ["No criterion-to-residue relation exists."],
    introduced_risks: ["The local patch may not generalize."],
    patch_summary: "Evaluate the source-linked local patch without applying it.",
    regression_review: {
      regression_risks: ["The current constraint could regress."],
      checks_or_observations_needed: ["Re-run the exact required check."],
      stop_conditions: ["Stop when the base becomes stale."],
      invalidation_conditions: ["Invalidate when source lineage changes."],
      source_keys: keys,
    },
    known_limitations: ["This remains candidate material."],
  };
}

function catalogEntryFixture(input: {
  label: string;
  materialKind: string;
  trustClass: ExternalRefTrustClassV01;
  referenceTrustClass?: ExternalRefTrustClassV01;
}): StrategicAdvantageTransferSourceCatalogV01["items"][number] {
  const ref = externalRefFixture(
    input.label,
    input.referenceTrustClass ?? input.trustClass,
  );
  const boundedSummary = `Bounded source material for ${input.label}.`;
  return {
    source_key: createStrategicSourceKeyV01({
      ref,
      material_kind: input.materialKind,
      bounded_summary: boundedSummary,
    }),
    ref,
    material_kind: input.materialKind,
    trust_class: input.trustClass,
    reference_trust_class: ref.trust_class,
    bounded_summary: boundedSummary,
    source_fingerprint: HASH_A,
  };
}

function catalogFixture(
  items: StrategicAdvantageTransferSourceCatalogV01["items"],
): StrategicAdvantageTransferSourceCatalogV01 {
  const normalizedItems = [...items].sort(compareProtocolCanonicalV01);
  const material = {
    catalog_version: STRATEGIC_ADVANTAGE_TRANSFER_SOURCE_CATALOG_VERSION_V01,
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    items: normalizedItems,
  };
  return {
    ...material,
    source_catalog_fingerprint:
      createStrategicSourceCatalogFingerprintV01(material),
  };
}

function workingFrameAtCanonicalSize(
  targetBytes: number,
): StrategicAdvantageTransferWorkingFrameV01 {
  for (let fullCriterionCount = 0; fullCriterionCount < 127; fullCriterionCount += 1) {
    const fixedCriteria = Array.from(
      { length: fullCriterionCount },
      (_, index) => boundCriterionFixture(index, 1_200),
    );
    const candidate = (adjustableLength: number) => {
      const material = {
        ...workingFrameFixture(),
        success_criteria: [
          ...fixedCriteria,
          boundCriterionFixture(fullCriterionCount, adjustableLength),
        ],
      };
      return {
        ...material,
        working_frame_fingerprint:
          createStrategicWorkingFrameFingerprintV01(material),
      };
    };
    const minimum = candidate(1);
    const minimumBytes = canonicalUtf8Size(minimum);
    const maximumBytes = canonicalUtf8Size(candidate(1_200));
    if (targetBytes < minimumBytes || targetBytes > maximumBytes) continue;
    const exact = candidate(1 + targetBytes - minimumBytes);
    assert.equal(canonicalUtf8Size(exact), targetBytes);
    return exact;
  }
  throw new Error(`strategic_working_frame_exact_bound_unreachable:${targetBytes}`);
}

function boundCriterionFixture(index: number, textLength: number) {
  return {
    criterion_id: `criterion:bound-${index.toString().padStart(3, "0")}`,
    criterion: "x".repeat(textLength),
    status: "unknown" as const,
    basis: "insufficient" as const,
    uncertainty: [],
  };
}

function canonicalUtf8Size(value: unknown): number {
  return new TextEncoder().encode(canonicalizeProtocolValueV01(value)).byteLength;
}

function historicalModelInvocationReceiptFixture(): ModelInvocationReceiptV02 {
  return {
    receipt_version: "model_invocation_receipt.v0.2",
    gateway_version: "model_gateway.v0.1",
    invocation_id: "historical-observe-invocation",
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    work_id: null,
    run_id: null,
    purpose: "observe_delta_compile",
    invocation_origin: "interactive",
    attempted_implementation_id: null,
    attempted_implementation_version: null,
    attempted_provider_ref: null,
    attempted_model_ref: null,
    final_implementation_id: "deterministic.observe",
    final_implementation_version: "deterministic_observe.v0.1",
    requested_mode: "deterministic",
    execution_mode: "deterministic",
    selection_reason: "explicit_deterministic",
    started_at: "2026-07-18T00:00:00.000Z",
    finished_at: "2026-07-18T00:00:00.000Z",
    latency_ms: 0,
    status: "completed",
    outcome: "deterministic_success",
    egress_attempted: false,
    egress_status: "did_not_occur",
    egress_policy_version: "model_gateway_egress_policy.v0.1",
    usage: null,
    cost: {
      basis: "unavailable",
      amount: null,
      currency: null,
      source: "no_pricing_authority",
    },
    budget: {
      decision: "not_used",
      input_bytes_limit: 65_536,
      input_bytes_used: null,
      output_tokens_limit: 2_048,
      output_tokens_used: null,
      provider_call_limit: 1,
      provider_calls_used: 0,
      timeout_limit_ms: 20_000,
      timeout_disposition: "completed_within_deadline",
    },
    cancellation_disposition: "not_cancelled",
    failure_code: null,
    data_classification: "public_safe",
    retention_class: "none",
    privacy_decision: "provider_egress_not_used",
    provenance_refs: [HASH_A],
    grant_lineage_ref: null,
    automation_control_lineage_ref: null,
    fallback_used: false,
    coverage_class: "enforced",
    trust_class: "direct_local_observation",
    raw_prompt_persisted: false,
    raw_response_persisted: false,
    hidden_reasoning_persisted: false,
    receipt_is_semantic_authority: false,
  };
}

function workingFrameFixture(): Omit<
  StrategicAdvantageTransferWorkingFrameV01,
  "working_frame_fingerprint"
> {
  const base = baseFixture();
  return {
    frame_version: STRATEGIC_ADVANTAGE_TRANSFER_WORKING_FRAME_VERSION_V01,
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    packet_ref: externalRefFixture("packet", "direct_local_observation", {
      refType: "task_context_packet",
      sourceRef: HASH_A,
    }),
    receipt_ref: externalRefFixture("receipt", "direct_local_observation", {
      refType: "run_receipt",
      sourceRef: HASH_B,
    }),
    assessment_version: "criterion_assessment.v0.1",
    assessment_fingerprint: HASH_C,
    source_proposal: {
      proposal_id: "episode-delta-proposal:source",
      proposal_fingerprint: HASH_A,
      candidate_bindings: [
        {
          candidate_id: "episode-delta-candidate:source",
          candidate_fingerprint: HASH_B,
        },
      ],
    },
    data_classification: "public_safe",
    task_goal: "Review one bounded strategic local transfer.",
    success_criteria: [
      {
        criterion_id: "criterion:source",
        criterion: "The proposal remains review-required.",
        status: "unknown",
        basis: "insufficient",
        uncertainty: ["No criterion-specific relation is available."],
      },
    ],
    required_checks: ["test:strategic-profile"],
    forbidden_actions: ["Do not apply a Transition automatically."],
    expected_artifacts: ["One pending proposal."],
    required_return_fields: ["proposal_id"],
    selected_accepted_state_refs: [base.state_ref],
    excluded_context_summaries: ["Unselected state remains excluded."],
    gap_summaries: ["Criterion-specific support remains unavailable."],
    base_strategy: base,
    trust_summary: {
      direct_local_observation: 1,
      verified_external_observation: 0,
      host_attestation: 0,
      provider_report: 0,
      derived_interpretation: 0,
      user_declaration: 0,
      imported_unverified: 0,
    },
    coverage_summary: ["repository_command: supported"],
    authority: {
      authoritative: false,
      creates_decision: false,
      applies_transition: false,
      changes_semantic_state: false,
      changes_later_context: false,
    },
  };
}

function baseFixture(): StrategicAdvantageTransferBaseStrategyV01 {
  const withoutFingerprint = {
    basis: "packet_selected_accepted_semantic_state" as const,
    delta_type: "agent_plan_delta" as const,
    semantic_state_record_id: "vnext-core-record:base",
    semantic_state_record_fingerprint: HASH_A,
    state_content_fingerprint: HASH_B,
    state_ref: externalRefFixture("state", "direct_local_observation", {
      refType: "accepted_semantic_state",
      sourceRef: HASH_A,
    }),
    target_ref: externalRefFixture("target", "direct_local_observation", {
      refType: "agent_plan_target",
      sourceRef: HASH_B,
    }),
    target_key: HASH_C,
    revision: 1,
    bounded_summary: "Exact accepted plan selected into the source packet.",
    source_proposal_id: "episode-delta-proposal:accepted",
    source_proposal_fingerprint: HASH_A,
    source_candidate_id: "episode-delta-candidate:accepted",
    source_candidate_fingerprint: HASH_B,
    source_decision_id: "review-decision:accepted",
    source_decision_fingerprint: HASH_C,
    source_transition_receipt_id: "state-transition-receipt:accepted",
    source_transition_receipt_fingerprint: HASH_A,
    currentness: "fresh" as const,
    source_refs: [
      externalRefFixture("base-source", "direct_local_observation", {
        sourceRef: HASH_C,
      }),
    ],
  };
  return {
    ...withoutFingerprint,
    base_fingerprint: createStrategicAnalysisIdentityV01(withoutFingerprint),
  };
}

function externalRefFixture(
  label: string,
  trustClass: ExternalRefTrustClassV01,
  options: { refType?: string; sourceRef?: string } = {},
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: options.refType ?? "strategic_test_source",
    external_id: `strategic-source:${label}`,
    provider: "augnes-local",
    source_ref: options.sourceRef ?? HASH_A,
    trust_class: trustClass,
    observed_at: "2026-07-18T00:00:00.000Z",
  };
}

function assertProtocolError(operation: () => unknown, code: string): void {
  assert.throws(operation, (error: unknown) => {
    assert.ok(error instanceof StrategicAdvantageTransferProtocolErrorV01);
    assert.equal(error.code, code);
    return true;
  });
}
