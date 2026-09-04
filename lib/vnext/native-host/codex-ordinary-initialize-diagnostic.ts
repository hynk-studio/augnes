import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import {
  createReadStream,
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import path from "node:path";

import { CODEX_APP_SERVER_CLIENT_VERSION_V01 } from "@/types/vnext/codex-isolated-auth-projection";
import {
  codex01532OrdinaryCanaryConfigOverrideArgsForDiagnosticV01,
  CODEX_0_153_2_ORDINARY_CANARY_ENTRY_ID_V01,
} from "@/lib/vnext/native-host/codex-ordinary-authenticated-candidate";
import {
  CODEX_STDIO_INITIALIZE_TRANSPORT_DIAGNOSIS_VERSION_V01,
  runCodex01532StdioInitializeTransportDiagnosisV01,
  type CodexStdioInitializeTransportDiagnosisResultV01,
  type CodexStdioTransportDiagnosisObservationV01,
} from "@/lib/vnext/native-host/codex-app-server-adapter";
import { observeReviewedCandidateCodexAppServerUserAgentV01 } from "@/lib/vnext/native-host/codex-app-server-user-agent";
import {
  getCodexReviewedRuntimeArtifactV01,
  type CodexReviewedRuntimeArtifactV01,
} from "@/lib/vnext/native-host/codex-qualified-runtime-registry";
import {
  isProcessAliveV01,
  listOwnedDescendantProcessIdsV01,
  stopOwnedProcessTreeV01,
} from "@/lib/vnext/native-host/owned-process-tree";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";

export const CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_VERSION_V01 =
  "codex_0_153_2_initialize_only_diagnostic.v0.1" as const;
export const CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_CLIENT_NAME_V01 =
  "augnes-initialize-diagnostic" as const;
export const CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_REQUEST_ID_V01 =
  "augnes:codex-0-153-2-initialize-diagnostic:1" as const;

const REVIEWED = getCodexReviewedRuntimeArtifactV01({
  entry_id: CODEX_0_153_2_ORDINARY_CANARY_ENTRY_ID_V01,
});
export const CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_TIMEOUT_MS_V01 =
  REVIEWED.compatibility_profile.semantics.lifecycle_cleanup_contract
    .rpc_timeout_ms;

const MAX_JSONL_LINE_BYTES =
  REVIEWED.compatibility_profile.semantics.lifecycle_cleanup_contract
    .max_jsonl_line_bytes;
const MAX_JSONL_BUFFER_BYTES =
  REVIEWED.compatibility_profile.semantics.lifecycle_cleanup_contract
    .max_jsonl_buffer_bytes;
const GRACEFUL_STOP_MS =
  REVIEWED.compatibility_profile.semantics.lifecycle_cleanup_contract
    .graceful_stop_ms;
const FORCED_STOP_MS =
  REVIEWED.compatibility_profile.semantics.lifecycle_cleanup_contract
    .forced_stop_ms;
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const FORBIDDEN_PUBLIC_MATERIAL =
  /(?:sk-(?:proj-)?|OPENAI_API_KEY|TOKEN|SECRET|PASSWORD|COOKIE|CREDENTIAL|BEGIN (?:RSA |EC )?PRIVATE KEY|(?:^|[\s"'])\/(?:Users|home|private|tmp)\/|[A-Za-z]:\\)/iu;

export type Codex01532InitializeDiagnosticProbeLabelV01 =
  | "A_private_control"
  | "B_split_home_real_codex_home"
  | "C_real_home_real_codex_home";

export type Codex01532InitializeDiagnosticEnvironmentShapeV01 =
  | "private_home_private_codex_home"
  | "private_home_real_codex_home"
  | "real_home_real_codex_home";

export type Codex01532InitializeDiagnosticPublicErrorV01 =
  | "initialize_timeout"
  | "initialize_rpc_failure"
  | "initialize_response_invalid"
  | "initialize_identity_mismatch"
  | "initialize_unexpected_protocol_message"
  | "initialize_process_exited"
  | "initialize_transport_failure"
  | "initialize_cleanup_failed";

export interface Codex01532InitializeDiagnosticProbeResultV01 {
  diagnostic_version: typeof CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_VERSION_V01;
  probe: Codex01532InitializeDiagnosticProbeLabelV01;
  environment_shape: Codex01532InitializeDiagnosticEnvironmentShapeV01;
  native_sha256: string;
  initialize_request_sent: boolean;
  valid_initialize_response_received: boolean;
  initialize_user_agent_validated: boolean;
  returned_codex_home_validated_locally: boolean;
  elapsed_ms: number;
  response_bound_ms: number;
  response_bound_met: boolean;
  public_error_class: Codex01532InitializeDiagnosticPublicErrorV01 | null;
  process_settled: boolean;
  streams_closed: boolean;
  remaining_owned_processes: number;
  protected_surfaces_unchanged: boolean;
}

export const CODEX_0_153_2_PARENT_STDIN_DIAGNOSTIC_VERSION_V01 =
  "codex_0_153_2_parent_stdin_delivery_diagnostic.v0.1" as const;

export interface Codex01532ExactWireDirectInitializeProbeResultV01 {
  diagnostic_version: typeof CODEX_0_153_2_PARENT_STDIN_DIAGNOSTIC_VERSION_V01;
  probe: "D0_exact_wire_direct_control";
  environment_shape: "private_home_real_codex_home";
  native_sha256: string;
  exact_canary_wire_identity: true;
  generated_request_id_class: "augnes_uuid_v4";
  stdin_write_called: boolean;
  stdin_write_sync_returned: boolean;
  stdin_write_returned_boolean: boolean | null;
  stdin_writable_length_after_return: number | null;
  stdin_writable_need_drain_after_return: boolean | null;
  stdin_write_completion_callback_observed: boolean;
  stdin_write_completion_callback_elapsed_ms: number | null;
  drain_observed: boolean;
  drain_elapsed_ms: number | null;
  first_stdout_chunk_elapsed_ms: number | null;
  stdout_chunk_count: number;
  total_stdout_bytes: number;
  first_complete_jsonl_line_elapsed_ms: number | null;
  response_envelope_elapsed_ms: number | null;
  timeout_callback_elapsed_ms: number | null;
  initialize_request_sent: boolean;
  valid_initialize_response_received: boolean;
  initialize_user_agent_validated: boolean;
  returned_codex_home_validated_locally: boolean;
  elapsed_ms: number;
  response_bound_ms: number;
  response_bound_met: boolean;
  public_error_class: Codex01532InitializeDiagnosticPublicErrorV01 | null;
  process_settled: boolean;
  streams_closed: boolean;
  remaining_owned_processes: number;
  protected_surfaces_unchanged: boolean;
  post_initialize_requests_sent: 0;
}

export type Codex01532InitializeDiagnosticDispositionV01 =
  | "BASELINE_INITIALIZE_FAILURE"
  | "FAILED_CANARY_ENVIRONMENT_TIMEOUT_NOT_REPRODUCED"
  | "SPLIT_HOME_CODEX_HOME_STARTUP_CAUSE_STRONG_EVIDENCE"
  | "REAL_CODEX_HOME_STARTUP_PATH_UNRESOLVED"
  | "UNEXPECTED_DIAGNOSTIC_FAILURE";

export interface Codex01532InitializeDiagnosticSequenceV01 {
  diagnostic_version: typeof CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_VERSION_V01;
  disposition: Codex01532InitializeDiagnosticDispositionV01;
  probes: readonly Codex01532InitializeDiagnosticProbeResultV01[];
  skipped_probes: readonly Codex01532InitializeDiagnosticProbeLabelV01[];
  initialize_requests_sent: number;
  post_initialize_requests_sent: 0;
  diagnostic_fingerprint: string;
}

export async function runCodex01532InitializeDiagnosticSequenceV01(input: {
  run_probe(
    probe: Codex01532InitializeDiagnosticProbeLabelV01,
  ): Promise<Codex01532InitializeDiagnosticProbeResultV01>;
}): Promise<Codex01532InitializeDiagnosticSequenceV01> {
  if (typeof input.run_probe !== "function")
    throw new Error("codex_initialize_diagnostic_runner_invalid");
  const probes: Codex01532InitializeDiagnosticProbeResultV01[] = [];
  const run = async (probe: Codex01532InitializeDiagnosticProbeLabelV01) => {
    const result = await input.run_probe(probe);
    assertProbeResultV01(result, probe);
    probes.push(result);
    return result;
  };

  const a = await run("A_private_control");
  let disposition: Codex01532InitializeDiagnosticDispositionV01;
  let skipped: Codex01532InitializeDiagnosticProbeLabelV01[];
  if (!probePassedV01(a)) {
    disposition = "BASELINE_INITIALIZE_FAILURE";
    skipped = ["B_split_home_real_codex_home", "C_real_home_real_codex_home"];
  } else {
    const b = await run("B_split_home_real_codex_home");
    if (probePassedV01(b)) {
      disposition = "FAILED_CANARY_ENVIRONMENT_TIMEOUT_NOT_REPRODUCED";
      skipped = ["C_real_home_real_codex_home"];
    } else if (b.public_error_class !== "initialize_timeout") {
      disposition = "UNEXPECTED_DIAGNOSTIC_FAILURE";
      skipped = ["C_real_home_real_codex_home"];
    } else {
      const c = await run("C_real_home_real_codex_home");
      skipped = [];
      if (probePassedV01(c))
        disposition = "SPLIT_HOME_CODEX_HOME_STARTUP_CAUSE_STRONG_EVIDENCE";
      else if (c.public_error_class === "initialize_timeout")
        disposition = "REAL_CODEX_HOME_STARTUP_PATH_UNRESOLVED";
      else disposition = "UNEXPECTED_DIAGNOSTIC_FAILURE";
    }
  }

  const material = {
    diagnostic_version: CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_VERSION_V01,
    disposition,
    probes,
    skipped_probes: skipped,
    initialize_requests_sent: probes.filter(
      ({ initialize_request_sent }) => initialize_request_sent,
    ).length,
    post_initialize_requests_sent: 0 as const,
  };
  const result = Object.freeze({
    ...material,
    diagnostic_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    ),
  });
  assertPublicSafeV01(result);
  return result;
}

interface Codex01532InitializeOnlyProbeInputV01 {
  probe: Codex01532InitializeDiagnosticProbeLabelV01;
  command: string;
  expected_native_sha256: string;
  private_root: string;
  execution_root: string;
  environment: NodeJS.ProcessEnv;
  protected_surfaces_unchanged: boolean;
  test_only?: Readonly<{
    fixture_path: string;
    response_bound_ms: number;
  }>;
}

interface Codex01532DirectInitializeWireV01 {
  request_id: string;
  client_name:
    | typeof CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_CLIENT_NAME_V01
    | "augnes-ordinary-canary";
  client_title: string;
  request_id_class: "fixed_diagnostic" | "augnes_uuid_v4";
}

interface Codex01532DirectInitializeCoreResultV01 extends Codex01532InitializeDiagnosticProbeResultV01 {
  exact_canary_wire_identity: boolean;
  generated_request_id_class: "fixed_diagnostic" | "augnes_uuid_v4";
  stdin_write_called: boolean;
  stdin_write_sync_returned: boolean;
  stdin_write_returned_boolean: boolean | null;
  stdin_writable_length_after_return: number | null;
  stdin_writable_need_drain_after_return: boolean | null;
  stdin_write_completion_callback_observed: boolean;
  stdin_write_completion_callback_elapsed_ms: number | null;
  drain_observed: boolean;
  drain_elapsed_ms: number | null;
  first_stdout_chunk_elapsed_ms: number | null;
  stdout_chunk_count: number;
  total_stdout_bytes: number;
  first_complete_jsonl_line_elapsed_ms: number | null;
  response_envelope_elapsed_ms: number | null;
  timeout_callback_elapsed_ms: number | null;
  post_initialize_requests_sent: 0;
}

export async function runCodex01532InitializeOnlyProbeV01(
  input: Codex01532InitializeOnlyProbeInputV01,
): Promise<Codex01532InitializeDiagnosticProbeResultV01> {
  return runCodex01532DirectInitializeProbeCoreV01(input, {
    request_id: CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_REQUEST_ID_V01,
    client_name: CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_CLIENT_NAME_V01,
    client_title: "Augnes initialize-only diagnostic",
    request_id_class: "fixed_diagnostic",
  });
}

export async function runCodex01532ExactWireDirectInitializeProbeV01(
  input: Omit<Codex01532InitializeOnlyProbeInputV01, "probe">,
): Promise<Codex01532ExactWireDirectInitializeProbeResultV01> {
  const observed = await runCodex01532DirectInitializeProbeCoreV01(
    { ...input, probe: "B_split_home_real_codex_home" },
    {
      request_id: `augnes:${randomUUID()}`,
      client_name: "augnes-ordinary-canary",
      client_title: "Augnes ordinary candidate canary",
      request_id_class: "augnes_uuid_v4",
    },
  );
  const result = Object.freeze({
    ...observed,
    diagnostic_version: CODEX_0_153_2_PARENT_STDIN_DIAGNOSTIC_VERSION_V01,
    probe: "D0_exact_wire_direct_control" as const,
    environment_shape: "private_home_real_codex_home" as const,
    exact_canary_wire_identity: true as const,
    generated_request_id_class: "augnes_uuid_v4" as const,
  });
  assertExactWireDirectProbeResultV01(result);
  assertPublicSafeV01(result);
  return result;
}

export const CODEX_0_153_2_INITIALIZE_WIRE_ISOLATION_VERSION_V01 =
  "codex_0_153_2_initialize_wire_field_isolation.v0.1" as const;

export type Codex01532InitializeWireIsolationProbeLabelV01 =
  | "W1_adapter_request_id_control"
  | "W2_canary_title_control"
  | "F0_fixed_baseline"
  | "U1_generated_uuid"
  | "F2_fixed_bracket";

export type Codex01532InitializeWireIsolationDispositionV01 =
  | "ADAPTER_STYLE_REQUEST_ID_DIRECT_TIMEOUT_REPRODUCED"
  | "CANARY_TITLE_DIRECT_TIMEOUT_REPRODUCED"
  | "CANARY_CLIENT_NAME_TIMEOUT_STRONGLY_ISOLATED"
  | "FIXED_ID_BASELINE_NOW_TIMEOUT"
  | "REQUEST_ID_TIMEOUT_NOT_REPRODUCED_CONTEMPORANEOUSLY"
  | "REQUEST_ID_SHAPE_EFFECT_CONTEMPORANEOUSLY_BRACKETED"
  | "REQUEST_ID_EFFECT_CONFOUNDED_BY_SEQUENCE_STATE_DRIFT"
  | "UNEXPECTED_INITIALIZE_WIRE_ISOLATION_FAILURE";

export interface Codex01532InitializeWireIsolationProbeResultV01
  extends Omit<
    Codex01532ExactWireDirectInitializeProbeResultV01,
    | "diagnostic_version"
    | "probe"
    | "exact_canary_wire_identity"
    | "generated_request_id_class"
  > {
  diagnostic_version: typeof CODEX_0_153_2_INITIALIZE_WIRE_ISOLATION_VERSION_V01;
  probe: Codex01532InitializeWireIsolationProbeLabelV01;
  changed_field_from_prior_control:
    | "request_id_class_only_from_passing_baseline"
    | "title_only_from_W1"
    | "current_fixed_baseline"
    | "request_id_only_from_F0"
    | "fixed_id_bracket_repeat";
  client_name: typeof CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_CLIENT_NAME_V01;
  client_title:
    | "Augnes initialize-only diagnostic"
    | "Augnes ordinary candidate canary";
  client_version: typeof CODEX_APP_SERVER_CLIENT_VERSION_V01;
  capabilities: null;
  request_id_class: "augnes_uuid_v4" | "fixed_baseline" | "generated_uuid";
}

export interface Codex01532InitializeWireIsolationSequenceV01 {
  diagnostic_version: typeof CODEX_0_153_2_INITIALIZE_WIRE_ISOLATION_VERSION_V01;
  sequence_kind: "wire_field_isolation" | "request_id_bracket";
  disposition: Codex01532InitializeWireIsolationDispositionV01;
  probes: readonly Codex01532InitializeWireIsolationProbeResultV01[];
  skipped_probes: readonly Codex01532InitializeWireIsolationProbeLabelV01[];
  initialize_requests_sent: number;
  post_initialize_requests_sent: 0;
  diagnostic_fingerprint: string;
}

export async function runCodex01532InitializeWireIsolationProbeV01(
  input: Omit<Codex01532InitializeOnlyProbeInputV01, "probe"> & {
    probe: Codex01532InitializeWireIsolationProbeLabelV01;
  },
): Promise<Codex01532InitializeWireIsolationProbeResultV01> {
  const wire = initializeWireIsolationTupleV01(input.probe);
  const observed = await runCodex01532DirectInitializeProbeCoreV01(
    { ...input, probe: "B_split_home_real_codex_home" },
    {
      request_id:
        wire.request_id_class === "fixed_baseline"
          ? CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_REQUEST_ID_V01
          : `augnes:${randomUUID()}`,
      client_name: wire.client_name,
      client_title: wire.client_title,
      request_id_class:
        wire.request_id_class === "fixed_baseline"
          ? "fixed_diagnostic"
          : "augnes_uuid_v4",
    },
  );
  const {
    exact_canary_wire_identity: _exactCanaryWireIdentity,
    generated_request_id_class: _generatedRequestIdClass,
    ...bounded
  } = observed;
  const result = Object.freeze({
    ...bounded,
    diagnostic_version: CODEX_0_153_2_INITIALIZE_WIRE_ISOLATION_VERSION_V01,
    probe: input.probe,
    environment_shape: "private_home_real_codex_home" as const,
    changed_field_from_prior_control: wire.changed_field_from_prior_control,
    client_name: wire.client_name,
    client_title: wire.client_title,
    client_version: CODEX_APP_SERVER_CLIENT_VERSION_V01,
    capabilities: null,
    request_id_class: wire.request_id_class,
  });
  assertInitializeWireIsolationProbeResultV01(result, input.probe);
  assertPublicSafeV01(result);
  return result;
}

export async function runCodex01532InitializeWireIsolationSequenceV01(input: {
  sequence_kind?: "wire_field_isolation" | "request_id_bracket";
  run_probe(
    probe: Codex01532InitializeWireIsolationProbeLabelV01,
  ): Promise<Codex01532InitializeWireIsolationProbeResultV01>;
}): Promise<Codex01532InitializeWireIsolationSequenceV01> {
  if (typeof input.run_probe !== "function")
    throw new Error("codex_initialize_wire_isolation_runner_invalid");
  const sequenceKind = input.sequence_kind ?? "wire_field_isolation";
  if (!["wire_field_isolation", "request_id_bracket"].includes(sequenceKind))
    throw new Error("codex_initialize_wire_isolation_sequence_invalid");
  const probes: Codex01532InitializeWireIsolationProbeResultV01[] = [];
  const run = async (probe: Codex01532InitializeWireIsolationProbeLabelV01) => {
    const result = await input.run_probe(probe);
    assertInitializeWireIsolationProbeResultV01(result, probe);
    assertPublicSafeV01(result);
    probes.push(result);
    return result;
  };

  let disposition: Codex01532InitializeWireIsolationDispositionV01;
  let skipped: readonly Codex01532InitializeWireIsolationProbeLabelV01[] = [];
  if (sequenceKind === "request_id_bracket") {
    // A timeout is usable for bracketing only after safe settlement. An
    // integrity/cleanup failure must never authorize the next child.
    const safeTimeout = (
      result: Codex01532InitializeWireIsolationProbeResultV01,
    ) =>
      result.public_error_class === "initialize_timeout" &&
      !result.valid_initialize_response_received &&
      !result.response_bound_met &&
      result.initialize_request_sent &&
      result.process_settled &&
      result.streams_closed &&
      result.remaining_owned_processes === 0 &&
      result.protected_surfaces_unchanged;
    const f0 = await run("F0_fixed_baseline");
    if (!initializeWireIsolationProbePassedV01(f0)) {
      disposition = safeTimeout(f0)
        ? "FIXED_ID_BASELINE_NOW_TIMEOUT"
        : "UNEXPECTED_INITIALIZE_WIRE_ISOLATION_FAILURE";
      skipped = ["U1_generated_uuid", "F2_fixed_bracket"];
    } else {
      const u1 = await run("U1_generated_uuid");
      if (initializeWireIsolationProbePassedV01(u1)) {
        disposition = "REQUEST_ID_TIMEOUT_NOT_REPRODUCED_CONTEMPORANEOUSLY";
        skipped = ["F2_fixed_bracket"];
      } else if (!safeTimeout(u1)) {
        disposition = "UNEXPECTED_INITIALIZE_WIRE_ISOLATION_FAILURE";
        skipped = ["F2_fixed_bracket"];
      } else {
        const f2 = await run("F2_fixed_bracket");
        disposition = initializeWireIsolationProbePassedV01(f2)
          ? "REQUEST_ID_SHAPE_EFFECT_CONTEMPORANEOUSLY_BRACKETED"
          : safeTimeout(f2)
            ? "REQUEST_ID_EFFECT_CONFOUNDED_BY_SEQUENCE_STATE_DRIFT"
            : "UNEXPECTED_INITIALIZE_WIRE_ISOLATION_FAILURE";
      }
    }
  } else {
    const w1 = await run("W1_adapter_request_id_control");
    if (!initializeWireIsolationProbePassedV01(w1)) {
      disposition =
        w1.public_error_class === "initialize_timeout"
          ? "ADAPTER_STYLE_REQUEST_ID_DIRECT_TIMEOUT_REPRODUCED"
          : "UNEXPECTED_INITIALIZE_WIRE_ISOLATION_FAILURE";
      skipped = ["W2_canary_title_control"];
    } else {
      const w2 = await run("W2_canary_title_control");
      if (initializeWireIsolationProbePassedV01(w2))
        disposition = "CANARY_CLIENT_NAME_TIMEOUT_STRONGLY_ISOLATED";
      else if (w2.public_error_class === "initialize_timeout")
        disposition = "CANARY_TITLE_DIRECT_TIMEOUT_REPRODUCED";
      else disposition = "UNEXPECTED_INITIALIZE_WIRE_ISOLATION_FAILURE";
    }
  }

  const material = {
    diagnostic_version: CODEX_0_153_2_INITIALIZE_WIRE_ISOLATION_VERSION_V01,
    sequence_kind: sequenceKind,
    disposition,
    probes,
    skipped_probes: skipped,
    initialize_requests_sent: probes.filter(
      (probe) => probe.initialize_request_sent,
    ).length,
    post_initialize_requests_sent: 0 as const,
  };
  const result = Object.freeze({
    ...material,
    diagnostic_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    ),
  });
  assertPublicSafeV01(result);
  return result;
}

function initializeWireIsolationTupleV01(
  probe: Codex01532InitializeWireIsolationProbeLabelV01,
): Readonly<
  Pick<Codex01532InitializeWireIsolationProbeResultV01,
    | "client_name" | "client_title" | "request_id_class"
    | "changed_field_from_prior_control"
  >
> {
  if (["F0_fixed_baseline", "U1_generated_uuid", "F2_fixed_bracket"].includes(probe))
    return Object.freeze({
      client_name: CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_CLIENT_NAME_V01,
      client_title: "Augnes initialize-only diagnostic",
      request_id_class:
        probe === "U1_generated_uuid" ? "generated_uuid" : "fixed_baseline",
      changed_field_from_prior_control:
        probe === "F0_fixed_baseline"
          ? "current_fixed_baseline"
          : probe === "U1_generated_uuid"
            ? "request_id_only_from_F0"
            : "fixed_id_bracket_repeat",
    });
  if (probe === "W1_adapter_request_id_control")
    return Object.freeze({
      client_name: CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_CLIENT_NAME_V01,
      client_title: "Augnes initialize-only diagnostic" as const,
      request_id_class: "augnes_uuid_v4",
      changed_field_from_prior_control: "request_id_class_only_from_passing_baseline",
    });
  if (probe === "W2_canary_title_control")
    return Object.freeze({
      client_name: CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_CLIENT_NAME_V01,
      client_title: "Augnes ordinary candidate canary" as const,
      request_id_class: "augnes_uuid_v4",
      changed_field_from_prior_control: "title_only_from_W1",
    });
  throw new Error("codex_initialize_wire_isolation_probe_invalid");
}

async function runCodex01532DirectInitializeProbeCoreV01(
  input: Codex01532InitializeOnlyProbeInputV01,
  wire: Codex01532DirectInitializeWireV01,
): Promise<Codex01532DirectInitializeCoreResultV01> {
  const reviewed = REVIEWED;
  const testOnly = input.test_only !== undefined;
  assertProbeLaunchV01(input, reviewed, testOnly);
  const command = realpathSync.native(input.command);
  const observedDigest = await sha256FileV01(command);
  const expectedDigest = testOnly
    ? input.expected_native_sha256
    : reviewed.artifact.native_executable_sha256;
  if (observedDigest !== expectedDigest)
    throw new Error("codex_initialize_diagnostic_native_identity_mismatch");
  const responseBoundMs = testOnly
    ? input.test_only!.response_bound_ms
    : CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_TIMEOUT_MS_V01;
  if (
    !Number.isSafeInteger(responseBoundMs) ||
    responseBoundMs < 50 ||
    (testOnly
      ? responseBoundMs > CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_TIMEOUT_MS_V01
      : responseBoundMs !== CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_TIMEOUT_MS_V01)
  )
    throw new Error("codex_initialize_diagnostic_response_bound_invalid");

  const prefixArgs = testOnly ? [input.test_only!.fixture_path] : [];
  const child = spawn(
    command,
    [
      ...prefixArgs,
      ...codex01532OrdinaryCanaryConfigOverrideArgsForDiagnosticV01(),
      "app-server",
      "--stdio",
    ],
    {
      cwd: realpathSync.native(input.execution_root),
      env: input.environment,
      detached: false,
      shell: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  let responseStartedAt: number | null = null;
  let responseStartedMonotonic: number | null = null;
  let initializeRequestSent = false;
  let validResponseReceived = false;
  let userAgentValidated = false;
  let codexHomeValidated = false;
  let publicError: Codex01532InitializeDiagnosticPublicErrorV01 | null = null;
  let stdoutBuffer = Buffer.alloc(0);
  let stdinWriteCalled = false;
  let stdinWriteSyncReturned = false;
  let stdinWriteReturnedBoolean: boolean | null = null;
  let stdinWritableLengthAfterReturn: number | null = null;
  let stdinWritableNeedDrainAfterReturn: boolean | null = null;
  let stdinWriteCompletionCallbackObserved = false;
  let stdinWriteCompletionCallbackElapsedMs: number | null = null;
  let drainObserved = false;
  let drainElapsedMs: number | null = null;
  let firstStdoutChunkElapsedMs: number | null = null;
  let stdoutChunkCount = 0;
  let totalStdoutBytes = 0;
  let firstCompleteJsonlLineElapsedMs: number | null = null;
  let responseEnvelopeElapsedMs: number | null = null;
  let timeoutCallbackElapsedMs: number | null = null;
  let outcomeSettled = false;
  let settleOutcome!: () => void;
  const outcome = new Promise<void>((resolve) => {
    settleOutcome = resolve;
  });
  const finish = (
    error: Codex01532InitializeDiagnosticPublicErrorV01 | null,
  ) => {
    if (outcomeSettled) return;
    outcomeSettled = true;
    publicError = error;
    settleOutcome();
  };
  const closed = new Promise<void>((resolve) => child.once("close", resolve));
  child.once("error", () => finish("initialize_transport_failure"));
  child.once("close", () => {
    if (!outcomeSettled) finish("initialize_process_exited");
  });
  child.stderr.on("data", () => undefined);
  child.stderr.on("error", () => undefined);
  child.stdout.on("error", () => finish("initialize_transport_failure"));
  child.stdin.on("error", () => {
    if (!outcomeSettled) finish("initialize_transport_failure");
  });
  child.stdout.on("data", (chunk: Buffer) => {
    if (outcomeSettled) return;
    stdoutChunkCount += 1;
    totalStdoutBytes = Math.min(
      MAX_JSONL_BUFFER_BYTES + 1,
      totalStdoutBytes + chunk.byteLength,
    );
    firstStdoutChunkElapsedMs ??= directProbeElapsedV01(
      responseStartedMonotonic,
    );
    stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);
    if (stdoutBuffer.byteLength > MAX_JSONL_BUFFER_BYTES) {
      finish("initialize_response_invalid");
      return;
    }
    while (!outcomeSettled) {
      const newline = stdoutBuffer.indexOf(0x0a);
      if (newline < 0) break;
      const line = stdoutBuffer.subarray(0, newline);
      stdoutBuffer = stdoutBuffer.subarray(newline + 1);
      if (line.byteLength === 0) continue;
      firstCompleteJsonlLineElapsedMs ??= directProbeElapsedV01(
        responseStartedMonotonic,
      );
      if (line.byteLength > MAX_JSONL_LINE_BYTES) {
        finish("initialize_response_invalid");
        break;
      }
      let envelope: unknown;
      try {
        envelope = JSON.parse(line.toString("utf8"));
        responseEnvelopeElapsedMs ??= directProbeElapsedV01(
          responseStartedMonotonic,
        );
      } catch {
        finish("initialize_response_invalid");
        break;
      }
      const response = recordV01(envelope);
      if (!response) {
        finish("initialize_response_invalid");
        break;
      }
      if (
        response.id !== wire.request_id ||
        Object.hasOwn(response, "method")
      ) {
        finish("initialize_unexpected_protocol_message");
        break;
      }
      const hasResult = Object.hasOwn(response, "result");
      const hasError = Object.hasOwn(response, "error");
      if (hasResult === hasError) {
        finish("initialize_response_invalid");
        break;
      }
      if (hasError) {
        finish("initialize_rpc_failure");
        break;
      }
      const initialized = recordV01(response.result);
      if (
        !initialized ||
        typeof initialized.codexHome !== "string" ||
        typeof initialized.userAgent !== "string"
      ) {
        finish("initialize_response_invalid");
        break;
      }
      try {
        observeReviewedCandidateCodexAppServerUserAgentV01({
          raw_user_agent: initialized.userAgent,
          expected_client_name: wire.client_name,
          expected_client_version: CODEX_APP_SERVER_CLIENT_VERSION_V01,
          expected_codex_cli_version: reviewed.artifact.version,
        });
        userAgentValidated = true;
        codexHomeValidated =
          realpathSync.native(initialized.codexHome) ===
          realpathSync.native(input.environment.CODEX_HOME!);
        if (!codexHomeValidated) {
          finish("initialize_identity_mismatch");
          break;
        }
      } catch {
        finish("initialize_identity_mismatch");
        break;
      }
      validResponseReceived = true;
      finish(null);
    }
  });
  child.stdout.resume();
  child.stderr.resume();

  let timer: NodeJS.Timeout | null = null;
  try {
    await new Promise<void>((resolve, reject) => {
      if (child.pid !== undefined) resolve();
      else {
        child.once("spawn", resolve);
        child.once("error", reject);
      }
    });
    const exactLine = `${JSON.stringify({
      id: wire.request_id,
      method: "initialize",
      params: {
        clientInfo: {
          name: wire.client_name,
          title: wire.client_title,
          version: CODEX_APP_SERVER_CLIENT_VERSION_V01,
        },
        capabilities: null,
      },
    })}\n`;
    responseStartedAt = Date.now();
    responseStartedMonotonic = performance.now();
    timer = setTimeout(() => {
      timeoutCallbackElapsedMs = directProbeElapsedV01(
        responseStartedMonotonic,
      );
      finish("initialize_timeout");
    }, responseBoundMs);
    timer.unref();
    stdinWriteCalled = true;
    const writeReturned = child.stdin.write(exactLine, "utf8", () => {
      stdinWriteCompletionCallbackObserved = true;
      stdinWriteCompletionCallbackElapsedMs = directProbeElapsedV01(
        responseStartedMonotonic,
      );
    });
    stdinWriteSyncReturned = true;
    stdinWriteReturnedBoolean = writeReturned;
    stdinWritableLengthAfterReturn = Math.min(
      MAX_JSONL_LINE_BYTES,
      Math.max(0, child.stdin.writableLength),
    );
    stdinWritableNeedDrainAfterReturn = child.stdin.writableNeedDrain;
    if (!writeReturned)
      child.stdin.once("drain", () => {
        drainObserved = true;
        drainElapsedMs = directProbeElapsedV01(responseStartedMonotonic);
      });
    initializeRequestSent = true;
    await outcome;
  } catch {
    finish("initialize_transport_failure");
    await outcome;
  } finally {
    if (timer) clearTimeout(timer);
  }
  const elapsedMs =
    responseStartedAt === null
      ? 0
      : Math.max(0, Date.now() - responseStartedAt);
  const knownPids = new Set<number>();
  if (child.pid) {
    knownPids.add(child.pid);
    for (const pid of listOwnedDescendantProcessIdsV01(child.pid))
      knownPids.add(pid);
  }
  child.stdin.end();
  await Promise.race([closed, delayV01(250)]);
  const stopped = await stopOwnedProcessTreeV01(child, {
    graceful_timeout_ms: GRACEFUL_STOP_MS,
    forced_timeout_ms: FORCED_STOP_MS,
    additional_owned_pids: knownPids,
  });
  await Promise.race([closed, delayV01(FORCED_STOP_MS)]);
  child.stdin.destroy();
  child.stdout.destroy();
  child.stderr.destroy();
  const remainingOwnedProcesses = [...knownPids].filter(
    isProcessAliveV01,
  ).length;
  const streamsClosed =
    child.stdin.destroyed && child.stdout.destroyed && child.stderr.destroyed;
  const processSettled = stopped.settled && remainingOwnedProcesses === 0;
  if (!processSettled || !streamsClosed)
    publicError = "initialize_cleanup_failed";

  const result = Object.freeze({
    diagnostic_version: CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_VERSION_V01,
    probe: input.probe,
    environment_shape: environmentShapeV01(input.probe),
    native_sha256: observedDigest,
    initialize_request_sent: initializeRequestSent,
    valid_initialize_response_received: validResponseReceived,
    initialize_user_agent_validated: userAgentValidated,
    returned_codex_home_validated_locally: codexHomeValidated,
    elapsed_ms: elapsedMs,
    response_bound_ms: responseBoundMs,
    response_bound_met:
      validResponseReceived &&
      elapsedMs <= responseBoundMs &&
      publicError === null,
    public_error_class: publicError,
    process_settled: processSettled,
    streams_closed: streamsClosed,
    remaining_owned_processes: remainingOwnedProcesses,
    protected_surfaces_unchanged: input.protected_surfaces_unchanged,
    exact_canary_wire_identity: wire.request_id_class === "augnes_uuid_v4",
    generated_request_id_class: wire.request_id_class,
    stdin_write_called: stdinWriteCalled,
    stdin_write_sync_returned: stdinWriteSyncReturned,
    stdin_write_returned_boolean: stdinWriteReturnedBoolean,
    stdin_writable_length_after_return: stdinWritableLengthAfterReturn,
    stdin_writable_need_drain_after_return: stdinWritableNeedDrainAfterReturn,
    stdin_write_completion_callback_observed:
      stdinWriteCompletionCallbackObserved,
    stdin_write_completion_callback_elapsed_ms:
      stdinWriteCompletionCallbackElapsedMs,
    drain_observed: drainObserved,
    drain_elapsed_ms: drainElapsedMs,
    first_stdout_chunk_elapsed_ms: firstStdoutChunkElapsedMs,
    stdout_chunk_count: stdoutChunkCount,
    total_stdout_bytes: totalStdoutBytes,
    first_complete_jsonl_line_elapsed_ms: firstCompleteJsonlLineElapsedMs,
    response_envelope_elapsed_ms: responseEnvelopeElapsedMs,
    timeout_callback_elapsed_ms: timeoutCallbackElapsedMs,
    post_initialize_requests_sent: 0 as const,
  });
  assertProbeResultV01(result, input.probe);
  assertPublicSafeV01(result);
  return result;
}

export const CODEX_0_153_2_ADAPTER_TRANSPORT_DIAGNOSTIC_VERSION_V01 =
  "codex_0_153_2_adapter_transport_initialize_diagnostic.v0.1" as const;

export type Codex01532AdapterTransportDiagnosticProbeLabelV01 =
  | "T1_normal_observer_1"
  | "T1_normal_observer_2"
  | "T2_observer_disabled_control"
  | "T3_write_completion_control";

export type Codex01532AdapterTransportDiagnosticDispositionV01 =
  | "INSTRUMENTED_ADAPTER_TIMEOUT_NOT_REPRODUCED"
  | "INSTRUMENTED_ADAPTER_TIMEOUT_INTERMITTENT"
  | "PROCESS_TREE_OBSERVER_CAUSAL_STRONG_EVIDENCE"
  | "NO_CHILD_STDOUT_RESPONSE_OBSERVED"
  | "FRAMING_PARTIAL_OUTPUT_BOUNDARY"
  | "RESPONSE_MATCHING_DISPATCH_BOUNDARY"
  | "TRANSPORT_INTERNAL_SCHEDULING_INVARIANT_FAILURE"
  | "LATE_RESPONSE_AFTER_TIMEOUT"
  | "PROCESS_TREE_POLLING_INSUFFICIENT"
  | "UNEXPECTED_DIAGNOSTIC_FAILURE";

export interface Codex01532AdapterTransportDiagnosticProbeResultV01 {
  diagnostic_version: typeof CODEX_0_153_2_ADAPTER_TRANSPORT_DIAGNOSTIC_VERSION_V01;
  transport_diagnosis_version: typeof CODEX_STDIO_INITIALIZE_TRANSPORT_DIAGNOSIS_VERSION_V01;
  probe: Codex01532AdapterTransportDiagnosticProbeLabelV01;
  periodic_process_tree_observer: "enabled" | "disabled_control";
  native_sha256: string;
  initialize_request_sent: boolean;
  valid_initialize_response_received: boolean;
  initialize_user_agent_validated: boolean;
  returned_codex_home_validated_locally: boolean;
  response_bound_ms: number;
  deadline_monotonic_elapsed_ms: number | null;
  timeout_callback_fired: boolean;
  timeout_callback_lateness_ms: number | null;
  first_stdout_chunk_elapsed_ms: number | null;
  first_complete_jsonl_line_elapsed_ms: number | null;
  first_response_classified_elapsed_ms: number | null;
  response_id_match: "pending" | "timed_out" | "unknown" | null;
  response_deferred_resolved_elapsed_ms: number | null;
  stdin_write_returned_boolean: boolean | null;
  stdin_writable_length_after_return: number | null;
  stdin_writable_need_drain_after_return: boolean | null;
  stdin_write_completion_callback_observed: boolean;
  stdin_write_completion_callback_elapsed_ms: number | null;
  stdin_writable_length_at_completion: number | null;
  stdin_writable_need_drain_at_completion: boolean | null;
  drain_observed: boolean;
  drain_elapsed_ms: number | null;
  stdin_error_observed: boolean;
  stdout_chunk_count: number;
  total_stdout_bytes: number;
  response_observed_after_deadline: boolean;
  process_tree_observation_count: number;
  periodic_process_tree_observation_count: number;
  process_tree_descendant_scan_call_count: number;
  process_tree_max_observation_ms: number;
  process_tree_cumulative_observation_ms_before_rpc_outcome: number;
  process_tree_known_owned_process_count_min: number;
  process_tree_known_owned_process_count_max: number;
  process_tree_observation_overlapped_rpc_deadline: boolean;
  public_error_class: string | null;
  process_settled: boolean;
  streams_closed: boolean;
  remaining_owned_processes: number;
  protected_surfaces_unchanged: boolean;
  post_initialize_requests_sent: 0;
  observations: readonly CodexStdioTransportDiagnosisObservationV01[];
}

export interface Codex01532AdapterTransportDiagnosticSequenceV01 {
  diagnostic_version: typeof CODEX_0_153_2_ADAPTER_TRANSPORT_DIAGNOSTIC_VERSION_V01;
  disposition: Codex01532AdapterTransportDiagnosticDispositionV01;
  probes: readonly Codex01532AdapterTransportDiagnosticProbeResultV01[];
  skipped_probes: readonly Codex01532AdapterTransportDiagnosticProbeLabelV01[];
  initialize_requests_sent: number;
  post_initialize_requests_sent: 0;
  diagnostic_fingerprint: string;
}

export type Codex01532ParentStdinDiagnosticDispositionV01 =
  | "CANARY_WIRE_DIRECT_INITIALIZE_TIMEOUT_REPRODUCED"
  | "PARENT_STDIN_DELIVERY_UNRESOLVED"
  | "CHILD_OR_STDIO_EMISSION_BOUNDARY_STRONGLY_ISOLATED"
  | "ADAPTER_TIMEOUT_NOT_REPRODUCED_AFTER_WRITE_INSTRUMENTATION"
  | "UNEXPECTED_PARENT_STDIN_DIAGNOSTIC_FAILURE";

export interface Codex01532ParentStdinDiagnosticSequenceV01 {
  diagnostic_version: typeof CODEX_0_153_2_PARENT_STDIN_DIAGNOSTIC_VERSION_V01;
  disposition: Codex01532ParentStdinDiagnosticDispositionV01;
  direct_probe: Codex01532ExactWireDirectInitializeProbeResultV01;
  adapter_probe: Codex01532AdapterTransportDiagnosticProbeResultV01 | null;
  skipped_probes: readonly "T3_write_completion_control"[];
  initialize_requests_sent: 1 | 2;
  post_initialize_requests_sent: 0;
  diagnostic_fingerprint: string;
}

export async function runCodex01532ParentStdinDiagnosticSequenceV01(input: {
  run_direct_probe(): Promise<Codex01532ExactWireDirectInitializeProbeResultV01>;
  run_adapter_probe(): Promise<Codex01532AdapterTransportDiagnosticProbeResultV01>;
}): Promise<Codex01532ParentStdinDiagnosticSequenceV01> {
  if (
    typeof input.run_direct_probe !== "function" ||
    typeof input.run_adapter_probe !== "function"
  )
    throw new Error("codex_parent_stdin_diagnostic_runner_invalid");
  const direct = await input.run_direct_probe();
  assertExactWireDirectProbeResultV01(direct);
  let adapter: Codex01532AdapterTransportDiagnosticProbeResultV01 | null = null;
  let disposition: Codex01532ParentStdinDiagnosticDispositionV01;
  let skipped: readonly "T3_write_completion_control"[] = [];
  if (!exactWireDirectProbePassedV01(direct)) {
    disposition =
      direct.public_error_class === "initialize_timeout"
        ? "CANARY_WIRE_DIRECT_INITIALIZE_TIMEOUT_REPRODUCED"
        : "UNEXPECTED_PARENT_STDIN_DIAGNOSTIC_FAILURE";
    skipped = ["T3_write_completion_control"];
  } else {
    adapter = await input.run_adapter_probe();
    assertAdapterTransportProbeResultV01(
      adapter,
      "T3_write_completion_control",
    );
    if (adapterTransportProbePassedV01(adapter)) {
      disposition =
        "ADAPTER_TIMEOUT_NOT_REPRODUCED_AFTER_WRITE_INSTRUMENTATION";
    } else if (adapterTransportProbeTimedOutV01(adapter)) {
      const callbackBeforeDeadline =
        adapter.stdin_write_completion_callback_observed &&
        adapter.stdin_write_completion_callback_elapsed_ms !== null &&
        adapter.stdin_write_completion_callback_elapsed_ms <=
          adapter.response_bound_ms;
      const drainedAtCompletion =
        adapter.stdin_writable_length_at_completion === 0 &&
        adapter.stdin_writable_need_drain_at_completion === false;
      disposition =
        callbackBeforeDeadline && drainedAtCompletion
          ? "CHILD_OR_STDIO_EMISSION_BOUNDARY_STRONGLY_ISOLATED"
          : "PARENT_STDIN_DELIVERY_UNRESOLVED";
    } else {
      disposition = "UNEXPECTED_PARENT_STDIN_DIAGNOSTIC_FAILURE";
    }
  }
  const material = {
    diagnostic_version: CODEX_0_153_2_PARENT_STDIN_DIAGNOSTIC_VERSION_V01,
    disposition,
    direct_probe: direct,
    adapter_probe: adapter,
    skipped_probes: skipped,
    initialize_requests_sent: (adapter ? 2 : 1) as 1 | 2,
    post_initialize_requests_sent: 0 as const,
  };
  const result = Object.freeze({
    ...material,
    diagnostic_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    ),
  });
  assertPublicSafeV01(result);
  return result;
}

export async function runCodex01532AdapterTransportDiagnosticSequenceV01(input: {
  run_probe(
    probe: Codex01532AdapterTransportDiagnosticProbeLabelV01,
  ): Promise<Codex01532AdapterTransportDiagnosticProbeResultV01>;
}): Promise<Codex01532AdapterTransportDiagnosticSequenceV01> {
  if (typeof input.run_probe !== "function")
    throw new Error("codex_adapter_transport_diagnostic_runner_invalid");
  const probes: Codex01532AdapterTransportDiagnosticProbeResultV01[] = [];
  const run = async (
    probe: Codex01532AdapterTransportDiagnosticProbeLabelV01,
  ) => {
    const result = await input.run_probe(probe);
    assertAdapterTransportProbeResultV01(result, probe);
    probes.push(result);
    return result;
  };

  const first = await run("T1_normal_observer_1");
  let disposition: Codex01532AdapterTransportDiagnosticDispositionV01;
  let skipped: Codex01532AdapterTransportDiagnosticProbeLabelV01[];
  if (adapterTransportProbePassedV01(first)) {
    const second = await run("T1_normal_observer_2");
    skipped = ["T2_observer_disabled_control"];
    disposition = adapterTransportProbePassedV01(second)
      ? "INSTRUMENTED_ADAPTER_TIMEOUT_NOT_REPRODUCED"
      : adapterTransportProbeTimedOutV01(second)
        ? "INSTRUMENTED_ADAPTER_TIMEOUT_INTERMITTENT"
        : "UNEXPECTED_DIAGNOSTIC_FAILURE";
  } else if (adapterTransportProbeTimedOutV01(first)) {
    const control = await run("T2_observer_disabled_control");
    skipped = ["T1_normal_observer_2"];
    if (adapterTransportProbePassedV01(control)) {
      disposition = "PROCESS_TREE_OBSERVER_CAUSAL_STRONG_EVIDENCE";
    } else if (adapterTransportProbeTimedOutV01(control)) {
      disposition = classifyAdapterTransportTimeoutV01(first, control);
    } else {
      disposition = "UNEXPECTED_DIAGNOSTIC_FAILURE";
    }
  } else {
    disposition = "UNEXPECTED_DIAGNOSTIC_FAILURE";
    skipped = ["T1_normal_observer_2", "T2_observer_disabled_control"];
  }

  const material = {
    diagnostic_version: CODEX_0_153_2_ADAPTER_TRANSPORT_DIAGNOSTIC_VERSION_V01,
    disposition,
    probes,
    skipped_probes: skipped,
    initialize_requests_sent: probes.filter(
      ({ initialize_request_sent }) => initialize_request_sent,
    ).length,
    post_initialize_requests_sent: 0 as const,
  };
  const result = Object.freeze({
    ...material,
    diagnostic_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    ),
  });
  assertPublicSafeV01(result);
  return result;
}

export async function runCodex01532AdapterTransportInitializeProbeV01(input: {
  probe: Codex01532AdapterTransportDiagnosticProbeLabelV01;
  command: string;
  expected_native_sha256: string;
  private_root: string;
  execution_root: string;
  environment: NodeJS.ProcessEnv;
  protected_surfaces_unchanged: boolean;
  test_only?: Readonly<{
    fixture_path: string;
    response_bound_ms: number;
    post_timeout_observation_ms: number;
    process_tree_observation_delay_ms: number;
    stdin_write_behavior?: Readonly<{
      completion_observation_delay_ms?: number;
      suppress_completion_observation?: boolean;
      force_reported_backpressure?: boolean;
      synthetic_drain_observation_delay_ms?: number | null;
      synthetic_write_error_delay_ms?: number | null;
    }>;
  }>;
}): Promise<Codex01532AdapterTransportDiagnosticProbeResultV01> {
  const testOnly = input.test_only !== undefined;
  assertProbeLaunchV01(
    {
      probe: "B_split_home_real_codex_home",
      command: input.command,
      expected_native_sha256: input.expected_native_sha256,
      private_root: input.private_root,
      execution_root: input.execution_root,
      environment: input.environment,
      protected_surfaces_unchanged: input.protected_surfaces_unchanged,
      ...(testOnly
        ? {
            test_only: {
              fixture_path: input.test_only!.fixture_path,
              response_bound_ms: input.test_only!.response_bound_ms,
            },
          }
        : {}),
    },
    REVIEWED,
    testOnly,
  );
  if (
    ["T2_observer_disabled_control", "T3_write_completion_control"].includes(
      input.probe,
    ) &&
    input.test_only?.process_tree_observation_delay_ms
  )
    throw new Error("codex_adapter_transport_diagnostic_control_invalid");
  const command = realpathSync.native(input.command);
  const observedDigest = await sha256FileV01(command);
  const expectedDigest = testOnly
    ? input.expected_native_sha256
    : REVIEWED.artifact.native_executable_sha256;
  if (observedDigest !== expectedDigest)
    throw new Error("codex_adapter_transport_diagnostic_native_mismatch");
  const child = spawn(
    command,
    [
      ...(testOnly ? [input.test_only!.fixture_path] : []),
      ...codex01532OrdinaryCanaryConfigOverrideArgsForDiagnosticV01(),
      "app-server",
      "--stdio",
    ],
    {
      cwd: realpathSync.native(input.execution_root),
      env: input.environment,
      detached: false,
      shell: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  const transportResult =
    await runCodex01532StdioInitializeTransportDiagnosisV01({
      spawned_child: child,
      expected_codex_home: input.environment.CODEX_HOME!,
      periodic_process_tree_observer: [
        "T2_observer_disabled_control",
        "T3_write_completion_control",
      ].includes(input.probe)
        ? "disabled_control"
        : "enabled",
      ...(testOnly
        ? {
            test_only: {
              response_timeout_ms: input.test_only!.response_bound_ms,
              post_timeout_observation_ms:
                input.test_only!.post_timeout_observation_ms,
              process_tree_observation_delay_ms:
                input.test_only!.process_tree_observation_delay_ms,
              ...(input.test_only!.stdin_write_behavior
                ? {
                    stdin_write_behavior: input.test_only!.stdin_write_behavior,
                  }
                : {}),
            },
          }
        : {}),
    });
  const result = summarizeAdapterTransportProbeV01({
    probe: input.probe,
    native_sha256: observedDigest,
    response_bound_ms: testOnly
      ? input.test_only!.response_bound_ms
      : CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_TIMEOUT_MS_V01,
    protected_surfaces_unchanged: input.protected_surfaces_unchanged,
    transport: transportResult,
  });
  assertAdapterTransportProbeResultV01(result, input.probe);
  assertPublicSafeV01(result);
  return result;
}

function summarizeAdapterTransportProbeV01(input: {
  probe: Codex01532AdapterTransportDiagnosticProbeLabelV01;
  native_sha256: string;
  response_bound_ms: number;
  protected_surfaces_unchanged: boolean;
  transport: CodexStdioInitializeTransportDiagnosisResultV01;
}): Codex01532AdapterTransportDiagnosticProbeResultV01 {
  const observations = input.transport.observations;
  const first = (kind: CodexStdioTransportDiagnosisObservationV01["kind"]) =>
    observations.find((entry) => entry.kind === kind) ?? null;
  const deadline = first("initialize_timeout_deadline");
  const timeout = first("initialize_timeout_callback_fired");
  const stdout = first("first_stdout_chunk_observed");
  const line = first("first_complete_jsonl_line_observed");
  const classified = first("response_envelope_classified");
  const matched = first("response_id_matched_pending");
  const resolved = first("response_deferred_resolved");
  const writeReturned = first("initialize_write_returned");
  const writeCompleted = first("initialize_write_completion_callback_observed");
  const drain = first("initialize_drain_observed");
  const stdinError = first("initialize_stdin_error_observed");
  const outcomeElapsed =
    resolved?.monotonic_elapsed_ms ??
    timeout?.monotonic_elapsed_ms ??
    observations.at(-1)?.monotonic_elapsed_ms ??
    0;
  const starts = new Map(
    observations
      .filter(
        (entry) =>
          entry.kind === "process_tree_observation_started" &&
          entry.process_tree_observation_index !== undefined,
      )
      .map((entry) => [entry.process_tree_observation_index!, entry]),
  );
  const completed = observations.filter(
    (entry) => entry.kind === "process_tree_observation_completed",
  );
  const completedBeforeOutcome = completed.filter((entry) => {
    const started = starts.get(entry.process_tree_observation_index ?? -1);
    return Boolean(started && started.monotonic_elapsed_ms <= outcomeElapsed);
  });
  const durations = completed.map(
    ({ process_tree_elapsed_ms }) => process_tree_elapsed_ms ?? 0,
  );
  const knownCounts = completed.flatMap((entry) => [
    entry.known_owned_process_count_before ?? 0,
    entry.known_owned_process_count_after ?? 0,
  ]);
  const deadlineElapsed = deadline?.deadline_monotonic_elapsed_ms ?? null;
  const overlapsDeadline =
    deadlineElapsed !== null &&
    completed.some((entry) => {
      const started = starts.get(entry.process_tree_observation_index ?? -1);
      return Boolean(
        started &&
        started.monotonic_elapsed_ms <= deadlineElapsed &&
        entry.monotonic_elapsed_ms >= deadlineElapsed,
      );
    });
  const result = Object.freeze({
    diagnostic_version: CODEX_0_153_2_ADAPTER_TRANSPORT_DIAGNOSTIC_VERSION_V01,
    transport_diagnosis_version: input.transport.diagnosis_version,
    probe: input.probe,
    periodic_process_tree_observer: [
      "T2_observer_disabled_control",
      "T3_write_completion_control",
    ].includes(input.probe)
      ? ("disabled_control" as const)
      : ("enabled" as const),
    native_sha256: input.native_sha256,
    initialize_request_sent: Boolean(first("initialize_write_returned")),
    valid_initialize_response_received:
      input.transport.initialize_response_validated,
    initialize_user_agent_validated:
      input.transport.initialize_user_agent_validated,
    returned_codex_home_validated_locally:
      input.transport.returned_codex_home_validated_locally,
    response_bound_ms: input.response_bound_ms,
    deadline_monotonic_elapsed_ms: deadlineElapsed,
    timeout_callback_fired: timeout !== null,
    timeout_callback_lateness_ms: timeout?.timeout_callback_lateness_ms ?? null,
    first_stdout_chunk_elapsed_ms: stdout?.monotonic_elapsed_ms ?? null,
    first_complete_jsonl_line_elapsed_ms: line?.monotonic_elapsed_ms ?? null,
    first_response_classified_elapsed_ms:
      classified?.monotonic_elapsed_ms ?? null,
    response_id_match: matched?.response_match ?? null,
    response_deferred_resolved_elapsed_ms:
      resolved?.monotonic_elapsed_ms ?? null,
    stdin_write_returned_boolean:
      writeReturned?.stdin_write_returned_boolean ?? null,
    stdin_writable_length_after_return:
      writeReturned?.stdin_writable_length ?? null,
    stdin_writable_need_drain_after_return:
      writeReturned?.stdin_writable_need_drain ?? null,
    stdin_write_completion_callback_observed: writeCompleted !== null,
    stdin_write_completion_callback_elapsed_ms:
      writeCompleted?.monotonic_elapsed_ms ?? null,
    stdin_writable_length_at_completion:
      writeCompleted?.stdin_writable_length ?? null,
    stdin_writable_need_drain_at_completion:
      writeCompleted?.stdin_writable_need_drain ?? null,
    drain_observed: drain !== null,
    drain_elapsed_ms: drain?.monotonic_elapsed_ms ?? null,
    stdin_error_observed: stdinError !== null,
    stdout_chunk_count: observations.filter(
      ({ kind }) => kind === "stdout_chunk_observed",
    ).length,
    total_stdout_bytes:
      [...observations]
        .reverse()
        .find(({ total_stdout_bytes }) => total_stdout_bytes !== undefined)
        ?.total_stdout_bytes ?? 0,
    response_observed_after_deadline: observations.some(
      (entry) =>
        entry.after_rpc_deadline === true &&
        [
          "first_stdout_chunk_observed",
          "first_complete_jsonl_line_observed",
          "json_envelope_parsed",
          "response_envelope_classified",
          "response_id_matched_pending",
          "response_deferred_resolved",
        ].includes(entry.kind),
    ),
    process_tree_observation_count: completed.length,
    periodic_process_tree_observation_count: completed.filter(
      ({ process_tree_reason }) => process_tree_reason === "periodic",
    ).length,
    process_tree_descendant_scan_call_count: completed.reduce(
      (sum, entry) => sum + (entry.descendant_scan_call_count ?? 0),
      0,
    ),
    process_tree_max_observation_ms: Math.max(0, ...durations),
    process_tree_cumulative_observation_ms_before_rpc_outcome:
      completedBeforeOutcome.reduce(
        (sum, entry) => sum + (entry.process_tree_elapsed_ms ?? 0),
        0,
      ),
    process_tree_known_owned_process_count_min:
      knownCounts.length > 0 ? Math.min(...knownCounts) : 0,
    process_tree_known_owned_process_count_max: Math.max(0, ...knownCounts),
    process_tree_observation_overlapped_rpc_deadline: overlapsDeadline,
    public_error_class: input.transport.public_error_class,
    process_settled: input.transport.process_settled,
    streams_closed: input.transport.streams_closed,
    remaining_owned_processes: input.transport.remaining_owned_processes,
    protected_surfaces_unchanged: input.protected_surfaces_unchanged,
    post_initialize_requests_sent: 0 as const,
    observations,
  });
  return result;
}

function classifyAdapterTransportTimeoutV01(
  first: Codex01532AdapterTransportDiagnosticProbeResultV01,
  control: Codex01532AdapterTransportDiagnosticProbeResultV01,
): Codex01532AdapterTransportDiagnosticDispositionV01 {
  const probes = [first, control];
  if (
    probes.every(
      ({ first_stdout_chunk_elapsed_ms }) =>
        first_stdout_chunk_elapsed_ms === null,
    )
  )
    return "NO_CHILD_STDOUT_RESPONSE_OBSERVED";
  if (
    probes.some(
      (probe) =>
        probe.first_stdout_chunk_elapsed_ms !== null &&
        probe.first_complete_jsonl_line_elapsed_ms === null,
    )
  )
    return "FRAMING_PARTIAL_OUTPUT_BOUNDARY";
  if (
    probes.some(
      (probe) =>
        probe.first_response_classified_elapsed_ms !== null &&
        probe.response_id_match !== "pending",
    )
  )
    return "RESPONSE_MATCHING_DISPATCH_BOUNDARY";
  if (
    probes.some(
      (probe) =>
        probe.response_id_match === "pending" &&
        probe.response_deferred_resolved_elapsed_ms !== null &&
        probe.timeout_callback_fired,
    )
  )
    return "TRANSPORT_INTERNAL_SCHEDULING_INVARIANT_FAILURE";
  if (
    probes.some(
      ({ response_observed_after_deadline }) =>
        response_observed_after_deadline,
    )
  )
    return "LATE_RESPONSE_AFTER_TIMEOUT";
  return "PROCESS_TREE_POLLING_INSUFFICIENT";
}

function adapterTransportProbePassedV01(
  value: Codex01532AdapterTransportDiagnosticProbeResultV01,
): boolean {
  return (
    value.initialize_request_sent &&
    value.valid_initialize_response_received &&
    value.initialize_user_agent_validated &&
    value.returned_codex_home_validated_locally &&
    value.response_deferred_resolved_elapsed_ms !== null &&
    value.response_deferred_resolved_elapsed_ms <= value.response_bound_ms &&
    !value.timeout_callback_fired &&
    value.public_error_class === null &&
    value.process_settled &&
    value.streams_closed &&
    value.remaining_owned_processes === 0 &&
    value.protected_surfaces_unchanged &&
    value.post_initialize_requests_sent === 0
  );
}

function adapterTransportProbeTimedOutV01(
  value: Codex01532AdapterTransportDiagnosticProbeResultV01,
): boolean {
  return (
    value.public_error_class === "codex_rpc_timeout" ||
    value.public_error_class ===
      "codex_transport_diagnosis_response_after_deadline"
  );
}

function assertAdapterTransportProbeResultV01(
  value: Codex01532AdapterTransportDiagnosticProbeResultV01,
  expectedProbe: Codex01532AdapterTransportDiagnosticProbeLabelV01,
): void {
  if (
    value.diagnostic_version !==
      CODEX_0_153_2_ADAPTER_TRANSPORT_DIAGNOSTIC_VERSION_V01 ||
    value.transport_diagnosis_version !==
      CODEX_STDIO_INITIALIZE_TRANSPORT_DIAGNOSIS_VERSION_V01 ||
    value.probe !== expectedProbe ||
    value.periodic_process_tree_observer !==
      (["T2_observer_disabled_control", "T3_write_completion_control"].includes(
        expectedProbe,
      )
        ? "disabled_control"
        : "enabled") ||
    !HASH_PATTERN.test(value.native_sha256) ||
    !Number.isSafeInteger(value.response_bound_ms) ||
    value.response_bound_ms < 50 ||
    value.response_bound_ms > 10_000 ||
    !Number.isSafeInteger(value.stdout_chunk_count) ||
    value.stdout_chunk_count < 0 ||
    !Number.isSafeInteger(value.total_stdout_bytes) ||
    value.total_stdout_bytes < 0 ||
    value.total_stdout_bytes > MAX_JSONL_BUFFER_BYTES + 1 ||
    (value.stdin_write_returned_boolean !== null &&
      typeof value.stdin_write_returned_boolean !== "boolean") ||
    (value.stdin_writable_length_after_return !== null &&
      (!Number.isSafeInteger(value.stdin_writable_length_after_return) ||
        value.stdin_writable_length_after_return < 0 ||
        value.stdin_writable_length_after_return > MAX_JSONL_LINE_BYTES)) ||
    (value.stdin_writable_need_drain_after_return !== null &&
      typeof value.stdin_writable_need_drain_after_return !== "boolean") ||
    typeof value.stdin_write_completion_callback_observed !== "boolean" ||
    (value.stdin_write_completion_callback_elapsed_ms !== null &&
      (!Number.isFinite(value.stdin_write_completion_callback_elapsed_ms) ||
        value.stdin_write_completion_callback_elapsed_ms < 0)) ||
    (value.stdin_writable_length_at_completion !== null &&
      (!Number.isSafeInteger(value.stdin_writable_length_at_completion) ||
        value.stdin_writable_length_at_completion < 0 ||
        value.stdin_writable_length_at_completion > MAX_JSONL_LINE_BYTES)) ||
    (value.stdin_writable_need_drain_at_completion !== null &&
      typeof value.stdin_writable_need_drain_at_completion !== "boolean") ||
    typeof value.drain_observed !== "boolean" ||
    typeof value.stdin_error_observed !== "boolean" ||
    !Number.isSafeInteger(value.process_tree_observation_count) ||
    value.process_tree_observation_count < 0 ||
    !Number.isSafeInteger(value.remaining_owned_processes) ||
    value.remaining_owned_processes < 0 ||
    value.post_initialize_requests_sent !== 0 ||
    value.observations.length > 256 ||
    value.observations.some(
      (entry, index) =>
        entry.sequence !== index + 1 ||
        !Number.isFinite(entry.monotonic_elapsed_ms) ||
        entry.monotonic_elapsed_ms < 0,
    )
  )
    throw new Error("codex_adapter_transport_diagnostic_result_invalid");
}

export function protectedCodexConfigurationFingerprintV01(
  codexHome: string,
): string {
  const root = realpathSync.native(codexHome);
  const material = [
    "config.toml",
    "history.jsonl",
    "state_5.sqlite",
    "memory",
    "memories",
    "skills",
    "plugins",
    "mcp",
  ].map((surface) => ({
    surface,
    fingerprint: fingerprintPathV01(path.join(root, surface), root),
  }));
  return createProtocolSha256V01(canonicalizeProtocolValueV01(material));
}

function assertProbeLaunchV01(
  input: Parameters<typeof runCodex01532InitializeOnlyProbeV01>[0],
  reviewed: CodexReviewedRuntimeArtifactV01,
  testOnly: boolean,
): void {
  if (
    CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_TIMEOUT_MS_V01 !== 10_000 ||
    reviewed.artifact.version !== "0.153.2" ||
    reviewed.artifact.lanes.ordinary_chatgpt_auth.status !== "candidate" ||
    reviewed.artifact.lanes.strict_agent_identity.status !== "hold" ||
    !HASH_PATTERN.test(input.expected_native_sha256) ||
    environmentShapeV01(input.probe) === null
  )
    throw new Error("codex_initialize_diagnostic_reviewed_identity_invalid");
  const command = realpathSync.native(input.command);
  const commandStat = lstatSync(command);
  const privateRoot = exactPrivateDirectoryV01(input.private_root);
  const executionRoot = exactDirectoryV01(input.execution_root);
  if (
    command !== path.resolve(input.command) ||
    !commandStat.isFile() ||
    commandStat.isSymbolicLink() ||
    (commandStat.mode & 0o111) === 0 ||
    !physicallyContainedV01(executionRoot, privateRoot)
  )
    throw new Error("codex_initialize_diagnostic_launch_invalid");
  const allowed = new Set([
    "NODE_ENV",
    "HOME",
    "CODEX_HOME",
    "CODEX_SQLITE_HOME",
    "TMPDIR",
    "PATH",
    "LANG",
    "LC_ALL",
    "TZ",
    "NO_COLOR",
    ...(testOnly ? ["FAKE_CODEX_SCENARIO", "FAKE_CODEX_TRACE_PATH"] : []),
  ]);
  const entries = Object.entries(input.environment).filter(
    ([, value]) => value !== undefined,
  );
  if (
    entries.some(([name]) => !allowed.has(name)) ||
    input.environment.NODE_ENV !== (testOnly ? "test" : "production") ||
    !input.environment.HOME ||
    !input.environment.CODEX_HOME ||
    !input.environment.CODEX_SQLITE_HOME ||
    !input.environment.TMPDIR ||
    !input.environment.PATH
  )
    throw new Error("codex_initialize_diagnostic_environment_invalid");
  const home = exactDirectoryV01(input.environment.HOME);
  const codexHome = exactDirectoryV01(input.environment.CODEX_HOME);
  const sqliteHome = exactDirectoryV01(input.environment.CODEX_SQLITE_HOME);
  const tmp = exactDirectoryV01(input.environment.TMPDIR);
  const pathRoot = exactDirectoryV01(input.environment.PATH);
  if (
    !physicallyContainedV01(sqliteHome, privateRoot) ||
    !physicallyContainedV01(tmp, privateRoot) ||
    !physicallyContainedV01(pathRoot, privateRoot)
  )
    throw new Error("codex_initialize_diagnostic_environment_invalid");
  const expectedShape = environmentShapeV01(input.probe);
  if (
    (expectedShape === "private_home_private_codex_home" &&
      (!physicallyContainedV01(home, privateRoot) ||
        !physicallyContainedV01(codexHome, privateRoot))) ||
    (expectedShape === "private_home_real_codex_home" &&
      (!physicallyContainedV01(home, privateRoot) ||
        physicallyContainedV01(codexHome, privateRoot))) ||
    (expectedShape === "real_home_real_codex_home" &&
      (physicallyContainedV01(home, privateRoot) ||
        physicallyContainedV01(codexHome, privateRoot)))
  )
    throw new Error("codex_initialize_diagnostic_environment_shape_invalid");
  if (testOnly) {
    if (
      process.env.AUGNES_CODEX_INITIALIZE_DIAGNOSTIC_TEST_MODE !== "1" ||
      command !== realpathSync.native(process.execPath) ||
      input.test_only!.fixture_path !==
        path.resolve(
          process.cwd(),
          "scripts",
          "fixtures",
          "fake-codex-app-server.mjs",
        )
    )
      throw new Error("codex_initialize_diagnostic_test_control_refused");
  } else if (
    input.test_only !== undefined ||
    input.expected_native_sha256 !== reviewed.artifact.native_executable_sha256
  )
    throw new Error("codex_initialize_diagnostic_test_control_refused");
}

function assertProbeResultV01(
  value: Codex01532InitializeDiagnosticProbeResultV01,
  expectedProbe: Codex01532InitializeDiagnosticProbeLabelV01,
): void {
  if (
    value.diagnostic_version !==
      CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_VERSION_V01 ||
    value.probe !== expectedProbe ||
    value.environment_shape !== environmentShapeV01(expectedProbe) ||
    !HASH_PATTERN.test(value.native_sha256) ||
    typeof value.initialize_request_sent !== "boolean" ||
    typeof value.valid_initialize_response_received !== "boolean" ||
    typeof value.initialize_user_agent_validated !== "boolean" ||
    typeof value.returned_codex_home_validated_locally !== "boolean" ||
    !Number.isSafeInteger(value.elapsed_ms) ||
    value.elapsed_ms < 0 ||
    !Number.isSafeInteger(value.response_bound_ms) ||
    value.response_bound_ms < 50 ||
    typeof value.response_bound_met !== "boolean" ||
    (value.public_error_class !== null &&
      ![
        "initialize_timeout",
        "initialize_rpc_failure",
        "initialize_response_invalid",
        "initialize_identity_mismatch",
        "initialize_unexpected_protocol_message",
        "initialize_process_exited",
        "initialize_transport_failure",
        "initialize_cleanup_failed",
      ].includes(value.public_error_class)) ||
    typeof value.process_settled !== "boolean" ||
    typeof value.streams_closed !== "boolean" ||
    !Number.isSafeInteger(value.remaining_owned_processes) ||
    value.remaining_owned_processes < 0 ||
    typeof value.protected_surfaces_unchanged !== "boolean"
  )
    throw new Error("codex_initialize_diagnostic_result_invalid");
}

function assertExactWireDirectProbeResultV01(
  value: Codex01532ExactWireDirectInitializeProbeResultV01,
): void {
  if (
    value.diagnostic_version !==
      CODEX_0_153_2_PARENT_STDIN_DIAGNOSTIC_VERSION_V01 ||
    value.probe !== "D0_exact_wire_direct_control" ||
    value.environment_shape !== "private_home_real_codex_home" ||
    value.exact_canary_wire_identity !== true ||
    value.generated_request_id_class !== "augnes_uuid_v4" ||
    value.post_initialize_requests_sent !== 0
  )
    throw new Error("codex_exact_wire_direct_diagnostic_result_invalid");
  assertDirectInitializeObservationV01(value);
}

function assertInitializeWireIsolationProbeResultV01(
  value: Codex01532InitializeWireIsolationProbeResultV01,
  expectedProbe: Codex01532InitializeWireIsolationProbeLabelV01,
): void {
  const expected = initializeWireIsolationTupleV01(expectedProbe);
  if (
    value.diagnostic_version !==
      CODEX_0_153_2_INITIALIZE_WIRE_ISOLATION_VERSION_V01 ||
    value.probe !== expectedProbe ||
    value.environment_shape !== "private_home_real_codex_home" ||
    value.changed_field_from_prior_control !==
      expected.changed_field_from_prior_control ||
    value.client_name !== expected.client_name ||
    value.client_title !== expected.client_title ||
    value.client_version !== CODEX_APP_SERVER_CLIENT_VERSION_V01 ||
    value.capabilities !== null ||
    value.request_id_class !== expected.request_id_class ||
    value.post_initialize_requests_sent !== 0
  )
    throw new Error("codex_initialize_wire_isolation_result_invalid");
  assertProbeResultV01(
    {
      ...value,
      diagnostic_version: CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_VERSION_V01,
      probe: "B_split_home_real_codex_home",
      environment_shape: "private_home_real_codex_home",
    },
    "B_split_home_real_codex_home",
  );
  assertDirectInitializeObservationV01(value);
}

function assertDirectInitializeObservationV01(
  value: Pick<
    Codex01532ExactWireDirectInitializeProbeResultV01,
    | "native_sha256"
    | "stdin_write_called"
    | "stdin_write_sync_returned"
    | "stdin_write_returned_boolean"
    | "stdin_writable_length_after_return"
    | "stdin_writable_need_drain_after_return"
    | "stdin_write_completion_callback_observed"
    | "stdin_write_completion_callback_elapsed_ms"
    | "drain_observed"
    | "drain_elapsed_ms"
    | "first_stdout_chunk_elapsed_ms"
    | "stdout_chunk_count"
    | "total_stdout_bytes"
    | "first_complete_jsonl_line_elapsed_ms"
    | "response_envelope_elapsed_ms"
    | "timeout_callback_elapsed_ms"
  >,
): void {
  const nullableElapsedFields = [
    value.stdin_write_completion_callback_elapsed_ms,
    value.drain_elapsed_ms,
    value.first_stdout_chunk_elapsed_ms,
    value.first_complete_jsonl_line_elapsed_ms,
    value.response_envelope_elapsed_ms,
    value.timeout_callback_elapsed_ms,
  ];
  if (
    !HASH_PATTERN.test(value.native_sha256) ||
    typeof value.stdin_write_called !== "boolean" ||
    typeof value.stdin_write_sync_returned !== "boolean" ||
    (value.stdin_write_returned_boolean !== null &&
      typeof value.stdin_write_returned_boolean !== "boolean") ||
    (value.stdin_writable_length_after_return !== null &&
      (!Number.isSafeInteger(value.stdin_writable_length_after_return) ||
        value.stdin_writable_length_after_return < 0 ||
        value.stdin_writable_length_after_return > MAX_JSONL_LINE_BYTES)) ||
    (value.stdin_writable_need_drain_after_return !== null &&
      typeof value.stdin_writable_need_drain_after_return !== "boolean") ||
    typeof value.stdin_write_completion_callback_observed !== "boolean" ||
    typeof value.drain_observed !== "boolean" ||
    !Number.isSafeInteger(value.stdout_chunk_count) ||
    value.stdout_chunk_count < 0 ||
    !Number.isSafeInteger(value.total_stdout_bytes) ||
    value.total_stdout_bytes < 0 ||
    value.total_stdout_bytes > MAX_JSONL_BUFFER_BYTES + 1 ||
    nullableElapsedFields.some(
      (elapsed) =>
        elapsed !== null &&
        (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > 120_000),
    )
  )
    throw new Error("codex_direct_initialize_observation_invalid");
}

function exactWireDirectProbePassedV01(
  value: Codex01532ExactWireDirectInitializeProbeResultV01,
): boolean {
  return (
    value.stdin_write_called &&
    value.stdin_write_sync_returned &&
    value.stdin_write_completion_callback_observed &&
    value.initialize_request_sent &&
    value.valid_initialize_response_received &&
    value.initialize_user_agent_validated &&
    value.returned_codex_home_validated_locally &&
    value.response_bound_met &&
    value.public_error_class === null &&
    value.process_settled &&
    value.streams_closed &&
    value.remaining_owned_processes === 0 &&
    value.protected_surfaces_unchanged &&
    value.post_initialize_requests_sent === 0
  );
}

function initializeWireIsolationProbePassedV01(
  value: Codex01532InitializeWireIsolationProbeResultV01,
): boolean {
  return (
    value.stdin_write_called &&
    value.stdin_write_sync_returned &&
    value.stdin_write_completion_callback_observed &&
    value.initialize_request_sent &&
    value.valid_initialize_response_received &&
    value.initialize_user_agent_validated &&
    value.returned_codex_home_validated_locally &&
    value.response_bound_met &&
    value.public_error_class === null &&
    value.process_settled &&
    value.streams_closed &&
    value.remaining_owned_processes === 0 &&
    value.protected_surfaces_unchanged &&
    value.post_initialize_requests_sent === 0
  );
}

function probePassedV01(
  value: Codex01532InitializeDiagnosticProbeResultV01,
): boolean {
  return (
    value.initialize_request_sent &&
    value.valid_initialize_response_received &&
    value.initialize_user_agent_validated &&
    value.returned_codex_home_validated_locally &&
    value.response_bound_met &&
    value.public_error_class === null &&
    value.process_settled &&
    value.streams_closed &&
    value.remaining_owned_processes === 0 &&
    value.protected_surfaces_unchanged
  );
}

function environmentShapeV01(
  probe: Codex01532InitializeDiagnosticProbeLabelV01,
): Codex01532InitializeDiagnosticEnvironmentShapeV01 {
  if (probe === "A_private_control") return "private_home_private_codex_home";
  if (probe === "B_split_home_real_codex_home")
    return "private_home_real_codex_home";
  return "real_home_real_codex_home";
}

function assertPublicSafeV01(value: unknown): void {
  const rendered = JSON.stringify(value);
  if (rendered.length > 64 * 1024 || FORBIDDEN_PUBLIC_MATERIAL.test(rendered))
    throw new Error("codex_initialize_diagnostic_private_material_forbidden");
}

function exactPrivateDirectoryV01(value: string): string {
  const resolved = exactDirectoryV01(value);
  if ((lstatSync(resolved).mode & 0o077) !== 0)
    throw new Error("codex_initialize_diagnostic_private_root_invalid");
  return resolved;
}

function exactDirectoryV01(value: string): string {
  const resolved = realpathSync.native(value);
  const stat = lstatSync(resolved);
  if (
    resolved !== path.resolve(value) ||
    !stat.isDirectory() ||
    stat.isSymbolicLink()
  )
    throw new Error("codex_initialize_diagnostic_directory_invalid");
  return resolved;
}

function physicallyContainedV01(value: string, root: string): boolean {
  const relative = path.relative(root, value);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

async function sha256FileV01(value: string): Promise<string> {
  const hash = createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(value);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.once("error", reject);
    stream.once("end", resolve);
  });
  return `sha256:${hash.digest("hex")}`;
}

function fingerprintPathV01(target: string, root: string): string {
  if (!existsSync(target)) return "absent";
  const stat = lstatSync(target);
  if (stat.isSymbolicLink())
    return createProtocolSha256V01(`symlink:${path.relative(root, target)}`);
  if (stat.isFile())
    return `sha256:${createHash("sha256")
      .update(readFileSync(target))
      .digest("hex")}`;
  if (!stat.isDirectory()) return "unsupported";
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(
      readdirSync(target)
        .sort()
        .map((name) => ({
          name_fingerprint: createProtocolSha256V01(name),
          value: fingerprintPathV01(path.join(target, name), root),
        })),
    ),
  );
}

function recordV01(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function delayV01(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function directProbeElapsedV01(startedAt: number | null): number | null {
  return startedAt === null
    ? null
    : Math.round(Math.max(0, performance.now() - startedAt) * 1_000) / 1_000;
}
