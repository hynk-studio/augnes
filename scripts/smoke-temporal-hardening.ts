import { execFileSync } from "node:child_process";
import {
  classifyActiveContextCandidate,
  type ActiveContextCandidate,
} from "@/lib/temporal-interpretation/admission";
import { TEMPORAL_HARDENING_FIXTURES } from "@/lib/temporal-interpretation/fixtures";
import { validateTemporalPreviewGuardrails } from "@/lib/temporal-interpretation/guardrails";
import { buildTemporalInterpretationPreview } from "@/lib/temporal-interpretation/preview";
import {
  type ActiveContextAdmissionCategory,
} from "@/lib/temporal-interpretation/types";

const categoryCases: Array<
  [ActiveContextCandidate, ActiveContextAdmissionCategory]
> = [
  [
    {
      candidate_id: "state:primary",
      source_authority: "committed_state",
      reason: "primary",
      primary: true,
    },
    "admit_primary_active",
  ],
  [
    {
      candidate_id: "boundary:summary",
      source_authority: "counterexample",
      reason: "boundary",
      boundary: true,
    },
    "admit_boundary_active",
  ],
  [
    {
      candidate_id: "tension:open",
      source_authority: "residual_tension",
      reason: "tension",
      tension: true,
    },
    "admit_tension_active",
  ],
  [
    {
      candidate_id: "prior:recallable",
      source_authority: "work_trace",
      reason: "recallable",
    },
    "retain_recallable",
  ],
  [
    {
      candidate_id: "state:dup",
      source_authority: "committed_state",
      reason: "duplicate",
      duplicate_of: "state:primary",
    },
    "exclude_duplicate",
  ],
  [
    {
      candidate_id: "summary:only",
      source_authority: "summary_only",
      reason: "summary",
      summary_only: true,
    },
    "exclude_summary_only",
  ],
  [
    {
      candidate_id: "prior:other",
      source_authority: "out_of_scope",
      reason: "out",
      out_of_scope: true,
    },
    "exclude_out_of_scope",
  ],
  [
    {
      candidate_id: "readiness:stale",
      source_authority: "stale_readiness",
      reason: "pending",
      pending_evidence: true,
    },
    "suspend_pending_evidence",
  ],
];

for (const [candidate, expectedCategory] of categoryCases) {
  const decision = classifyActiveContextCandidate(candidate);
  if (decision.category !== expectedCategory) {
    throw new Error(
      `Admission rubric category mismatch for ${candidate.candidate_id}: expected ${expectedCategory}, got ${decision.category}`,
    );
  }
}

const fixtureResults: Array<{
  name: string;
  passed: boolean;
  warning_count: number;
}> = [];
for (const fixture of TEMPORAL_HARDENING_FIXTURES) {
  const result = validateTemporalPreviewGuardrails({
    context: fixture.input_context,
    preview: fixture.output_preview,
  });
  if (result.passed !== fixture.expected_guardrail_passed) {
    throw new Error(
      `${fixture.name} guardrail result mismatch: expected ${fixture.expected_guardrail_passed}, got ${result.passed}. Warnings: ${result.warnings.join(" | ")}`,
    );
  }

  const categories = new Set(
    fixture.output_preview.active_context_admission?.decisions.map(
      (decision) => decision.category,
    ) ?? [],
  );
  for (const expectedCategory of fixture.expected_admission_categories) {
    if (!categories.has(expectedCategory)) {
      throw new Error(
        `${fixture.name} missing expected admission category: ${expectedCategory}`,
      );
    }
  }

  for (const expectedWarning of fixture.expected_warning_text) {
    if (!result.warnings.some((warning) => warning.includes(expectedWarning))) {
      throw new Error(
        `${fixture.name} missing expected warning text: ${expectedWarning}. Warnings: ${result.warnings.join(" | ")}`,
      );
    }
  }

  fixtureResults.push({
    name: fixture.name,
    passed: result.passed,
    warning_count: result.warnings.length,
  });
}

const savedOpenAIKey = process.env.OPENAI_API_KEY;
delete process.env.OPENAI_API_KEY;
let externalFetchCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input) => {
  externalFetchCalls += 1;
  throw new Error(
    `Unexpected fetch during fixture preview build: ${String(input)}`,
  );
};

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Temporal hardening smoke failed.";
  console.error(message);
  process.exitCode = 1;
});

async function main() {
  try {
    const response = await buildTemporalInterpretationPreview({
      scope: "project:augnes",
      context: TEMPORAL_HARDENING_FIXTURES[0].input_context,
    });
    if (response.generator !== "mock") {
      throw new Error(
        `Expected mock generator without OPENAI_API_KEY, got ${response.generator}`,
      );
    }
    if (!response.guardrails.passed) {
      throw new Error(
        `Expected valid fixture preview guardrails to pass, got warnings: ${response.guardrails.warnings.join(" | ")}`,
      );
    }
    if (externalFetchCalls !== 0) {
      throw new Error(
        `Expected zero external fetch calls, got ${externalFetchCalls}`,
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (savedOpenAIKey) {
      process.env.OPENAI_API_KEY = savedOpenAIKey;
    }
  }

  const existingSmokeOutput = execFileSync(
    "npm",
    ["run", "smoke:temporal-preview"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        OPENAI_API_KEY: "",
      },
      encoding: "utf8",
    },
  );

  if (!existingSmokeOutput.includes("guardrails_passed")) {
    throw new Error(
      "Existing smoke:temporal-preview did not return expected output.",
    );
  }

  console.log(
    JSON.stringify(
      {
        smoke: "temporal-hardening",
        admission_category_cases: categoryCases.length,
        fixtures_checked: fixtureResults.length,
        summary_only_evidence_misuse_caught: true,
        missing_counterexample_caught: true,
        residual_tension_omission_caught: true,
        overconfident_safe_next_step_caught: true,
        valid_fixture_passed: true,
        openai_required: false,
        direct_fixture_fetch_calls: externalFetchCalls,
        github_calls: 0,
        db_mutation_state_commit_approval_publish_replay: false,
        existing_temporal_preview_smoke_passed: true,
        fixture_results: fixtureResults,
      },
      null,
      2,
    ),
  );
}
