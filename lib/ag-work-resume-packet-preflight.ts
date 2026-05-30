export type AgWorkResumePacketPreflightCheckStatus = "pass" | "warn" | "fail";

export type AgWorkResumePacketPreflightCheck = {
  id: string;
  status: AgWorkResumePacketPreflightCheckStatus;
  message: string;
};

export type AgWorkResumePacketPreflightSummary = {
  input_mode: string;
  schema: string | null;
  packet_kind: string | null;
  has_packet_id: boolean;
  has_runtime_instance_id: boolean;
  has_scope: boolean;
  has_work_id: boolean;
  has_git_remote: boolean;
  has_expected_checks: boolean;
  preview_only_by_default: boolean;
};

export type AgWorkResumePacketPreflightResult = {
  ok: boolean;
  strict: boolean;
  summary: AgWorkResumePacketPreflightSummary;
  checks: AgWorkResumePacketPreflightCheck[];
  recommended_next_step: string;
};

export type AgWorkResumePacketPreflightOptions = {
  strict?: boolean;
  rawInput?: string;
  inputMode?: string;
};

const KNOWN_SCHEMAS = new Set(["augnes.ag_work_resume_packet.v0_2"]);
const KNOWN_PACKET_KINDS = new Set(["ag_work_resume_packet"]);

export function preflightAgWorkResumePacket(
  packet: unknown,
  options: AgWorkResumePacketPreflightOptions = {},
): AgWorkResumePacketPreflightResult {
  const strict = options.strict === true;
  const inputMode = clean(options.inputMode) ?? "json";
  const checks: AgWorkResumePacketPreflightCheck[] = [
    {
      id: "input_present",
      status: "pass",
      message: "AG Resume Packet input is present.",
    },
  ];

  if (!isRecord(packet)) {
    checks.push({
      id: "valid_json",
      status: "fail",
      message: "AG Resume Packet JSON must be an object.",
    });
    return buildOutput({
      strict,
      inputMode,
      packet: null,
      checks,
    });
  }

  checks.push({
    id: "valid_json",
    status: "pass",
    message: "Packet input is valid JSON.",
  });

  addCorePacketChecks(packet, checks, strict);
  addIntegrityChecks(packet, checks);
  addTargetPolicyChecks(packet, checks, strict);
  addRedactionChecks(packet, checks, strict);
  addBoundsChecks(packet, checks, strict);
  addUnsafeContentChecks(options.rawInput ?? safeJsonStringify(packet), packet, checks, strict);
  addRecommendedNextStepCheck(checks);

  return buildOutput({
    strict,
    inputMode,
    packet,
    checks,
  });
}

function buildOutput({
  strict,
  inputMode,
  packet,
  checks,
}: {
  strict: boolean;
  inputMode: string;
  packet: Record<string, unknown> | null;
  checks: AgWorkResumePacketPreflightCheck[];
}): AgWorkResumePacketPreflightResult {
  const hasFail = checks.some((check) => check.status === "fail");
  const hasWarn = checks.some((check) => check.status === "warn");
  return {
    ok: !hasFail,
    strict,
    summary: packet ? buildSummary(inputMode, packet) : emptySummary(inputMode),
    checks,
    recommended_next_step: recommendedNextStep(hasFail, hasWarn),
  };
}

function addCorePacketChecks(
  packet: Record<string, unknown>,
  checks: AgWorkResumePacketPreflightCheck[],
  strict: boolean,
) {
  const schema = jsonString(packet.schema);
  checks.push({
    id: "schema",
    status: schema && KNOWN_SCHEMAS.has(schema) ? "pass" : strict ? "fail" : "warn",
    message: schema && KNOWN_SCHEMAS.has(schema)
      ? "Recognized AG resume packet schema."
      : schema
        ? `Unknown AG resume packet schema: ${schema}.`
        : "AG resume packet schema is missing.",
  });

  const packetKind = jsonString(packet.packet_kind);
  checks.push({
    id: "packet_kind",
    status:
      packetKind && KNOWN_PACKET_KINDS.has(packetKind)
        ? "pass"
        : strict
          ? "fail"
          : "warn",
    message:
      packetKind && KNOWN_PACKET_KINDS.has(packetKind)
        ? "Recognized AG resume packet kind."
        : packetKind
          ? `Unknown packet kind: ${packetKind}.`
          : "Packet kind is missing.",
  });

  addRequiredStringCheck(
    checks,
    "packet_id",
    jsonString(packet.packet_id),
    "Packet id is present.",
    "Packet id is missing.",
    "Packet id is a placeholder.",
    strict,
  );
  addExpiresAtCheck(checks, packet.expires_at, strict);

  const issuer = jsonRecord(packet.issuer);
  const issuerRuntime = jsonString(issuer?.runtime);
  checks.push({
    id: "issuer_runtime",
    status: issuerRuntime === "augnes" ? "pass" : strict ? "fail" : "warn",
    message:
      issuerRuntime === "augnes"
        ? "Issuer runtime is augnes."
        : issuerRuntime
          ? `Issuer runtime should be augnes, got ${issuerRuntime}.`
          : "Issuer runtime is missing.",
  });
  addRequiredStringCheck(
    checks,
    "issuer_runtime_instance_id",
    jsonString(issuer?.runtime_instance_id),
    "Runtime instance id is present.",
    "Runtime instance id is missing.",
    "Runtime instance id is a placeholder.",
    strict,
  );

  const sourceWork = jsonRecord(packet.source_work);
  addRequiredStringCheck(checks, "source_work_scope", jsonString(sourceWork?.scope), "Source work scope is present.", "Source work scope is missing.", "Source work scope is a placeholder.", strict);
  addRequiredStringCheck(checks, "source_work_id", jsonString(sourceWork?.work_id), "Source work id is present.", "Source work id is missing.", "Source work id is a placeholder.", strict);
  addRequiredStringCheck(checks, "source_work_title", jsonString(sourceWork?.title), "Source work title is present.", "Source work title is missing.", "Source work title is a placeholder.", strict);
  addRequiredStringCheck(checks, "source_work_status", jsonString(sourceWork?.status), "Source work status is present.", "Source work status is missing.", "Source work status is a placeholder.", strict);
  addRequiredStringCheck(checks, "source_work_next_action", jsonString(sourceWork?.next_action), "Source work next action is present.", "Source work next action is missing.", "Source work next action is a placeholder.", strict);

  const git = jsonRecord(packet.git);
  addRequiredStringCheck(checks, "git_remote", jsonString(git?.remote), "Git remote is present.", "Git remote is missing.", "Git remote is a placeholder.", strict);
  addRequiredStringCheck(checks, "git_base_branch", jsonString(git?.base_branch), "Git base branch is present.", "Git base branch is missing.", "Git base branch is a placeholder.", strict);
  addRequiredStringCheck(checks, "git_base_commit", jsonString(git?.base_commit), "Git base commit is present.", "Git base commit is missing.", "Git base commit is a placeholder.", strict);

  const handoff = jsonRecord(packet.handoff);
  addArrayPresenceCheck(checks, "expected_files", jsonArray(handoff?.expected_files), "Expected files are listed.", "Expected files are missing.", strict);
  addArrayPresenceCheck(checks, "expected_checks", jsonArray(handoff?.expected_checks), "Expected checks are listed.", "Expected checks are missing.", strict);
}

function addIntegrityChecks(
  packet: Record<string, unknown>,
  checks: AgWorkResumePacketPreflightCheck[],
) {
  const integrity = jsonRecord(packet.integrity);
  addOptionalHashCheck(checks, "integrity_payload_hash", jsonString(integrity?.payload_hash), "Payload hash is present.");
  addOptionalHashCheck(checks, "integrity_redaction_report_hash", jsonString(integrity?.redaction_report_hash), "Redaction report hash is present.");
}

function addTargetPolicyChecks(
  packet: Record<string, unknown>,
  checks: AgWorkResumePacketPreflightCheck[],
  strict: boolean,
) {
  const policy = jsonRecord(packet.target_runtime_policy);
  addRequiredTrueCheck(checks, "target_preview_only", policy?.preview_only_by_default, "Target runtime policy is preview-only by default.", strict);
  addRequiredFalseCheck(checks, "target_no_create_work_item", policy?.may_create_local_work_item, "Target runtime policy does not allow automatic work item creation.", strict);
  addNoDirectRecordCheck(checks, "target_no_record_evidence_auto", policy?.may_record_evidence, "evidence", strict);
  addNoDirectRecordCheck(checks, "target_no_record_proof_auto", policy?.may_record_proof, "proof", strict);
  addRequiredFalseCheck(checks, "target_no_bind_session", policy?.may_bind_session, "Target runtime policy does not allow automatic session binding.", strict);
  addRequiredFalseCheck(checks, "target_no_commit_or_reject", policy?.may_commit_or_reject_state, "Target runtime policy does not allow commit/reject state mutation.", strict);
  addRequiredFalseCheck(checks, "target_no_execute_codex", policy?.may_execute_codex, "Target runtime policy does not allow Codex execution.", strict);
  addRequiredFalseCheck(checks, "target_no_merge", policy?.may_merge, "Target runtime policy does not allow merge.", strict);
  addRequiredFalseCheck(checks, "target_no_publish_or_replay", policy?.may_publish_or_replay, "Target runtime policy does not allow publish/replay.", strict);
}

function addRedactionChecks(
  packet: Record<string, unknown>,
  checks: AgWorkResumePacketPreflightCheck[],
  strict: boolean,
) {
  const redaction = jsonRecord(packet.redaction);
  addRequiredFalseCheck(checks, "redaction_no_raw_db_paths", redaction?.raw_db_paths_included, "Redaction report says raw DB paths are excluded.", strict);
  addRequiredFalseCheck(checks, "redaction_no_secrets", redaction?.secrets_included, "Redaction report says secrets are excluded.", strict);
  addRequiredFalseCheck(checks, "redaction_no_tunnel_urls", redaction?.tunnel_urls_included, "Redaction report says tunnel URLs are excluded.", strict);
  addRequiredFalseCheck(checks, "redaction_no_local_absolute_paths", redaction?.local_absolute_paths_included, "Redaction report says unsafe local absolute paths are excluded.", strict);
  addRequiredFalseCheck(checks, "redaction_no_media", redaction?.screenshots_or_media_included, "Redaction report says screenshots/media are excluded.", strict);
  addRequiredFalseCheck(checks, "redaction_no_raw_openai_responses", redaction?.raw_openai_responses_included, "Redaction report says raw OpenAI responses are excluded.", strict);
}

function addBoundsChecks(
  packet: Record<string, unknown>,
  checks: AgWorkResumePacketPreflightCheck[],
  strict: boolean,
) {
  const bounds = jsonRecord(packet.bounds);
  const continuity = jsonRecord(packet.continuity);
  const recentWorkEvents = jsonArray(continuity?.recent_work_events);
  const foreignEvidenceRefs = jsonArray(continuity?.foreign_evidence_refs);

  addMaxCountCheck({
    checks,
    id: "bounds_recent_work_events",
    configuredMax: bounds?.max_recent_work_events,
    hardMax: 10,
    actualCount: recentWorkEvents.length,
    label: "recent work events",
    strict,
  });
  addMaxCountCheck({
    checks,
    id: "bounds_foreign_evidence_refs",
    configuredMax: bounds?.max_foreign_evidence_refs,
    hardMax: 20,
    actualCount: foreignEvidenceRefs.length,
    label: "foreign evidence refs",
    strict,
  });

  addRequiredTrueCheck(checks, "bounds_summaries_only", bounds?.summaries_only, "Bounds require summaries only.", strict);
  addRequiredFalseCheck(checks, "bounds_no_raw_logs", bounds?.raw_logs_included, "Bounds say raw logs are excluded.", strict);
}

function addUnsafeContentChecks(
  rawInput: string,
  packet: Record<string, unknown>,
  checks: AgWorkResumePacketPreflightCheck[],
  strict: boolean,
) {
  const text = `${rawInput}\n${JSON.stringify(packet)}`;
  const secretFindings = findSecretLikeValues(text);
  checks.push({
    id: "unsafe_secret_like_content",
    status: secretFindings.length === 0 ? "pass" : "fail",
    message:
      secretFindings.length === 0
        ? "No obvious secret-like content detected."
        : `Obvious secret-like content detected: ${secretFindings.join(", ")}`,
  });

  const tunnelFindings = findTunnelUrls(text);
  checks.push({
    id: "unsafe_tunnel_urls",
    status: tunnelFindings.length === 0 ? "pass" : "fail",
    message:
      tunnelFindings.length === 0
        ? "No tunnel URL content detected."
        : `Tunnel URL content detected: ${tunnelFindings.join(", ")}`,
  });

  const rawDbFindings = findRawDbPaths(text);
  checks.push({
    id: "unsafe_raw_db_paths",
    status: rawDbFindings.length === 0 ? "pass" : "fail",
    message:
      rawDbFindings.length === 0
        ? "No raw DB path content detected."
        : `Raw DB path content detected: ${rawDbFindings.join(", ")}`,
  });

  const localPathFindings = findUnsafeLocalAbsolutePaths(text);
  checks.push({
    id: "unsafe_local_absolute_paths",
    status: localPathFindings.length === 0 ? "pass" : "fail",
    message:
      localPathFindings.length === 0
        ? "No unsafe local absolute paths detected."
        : `Unsafe local absolute paths detected: ${localPathFindings.join(", ")}`,
  });

  const authorityFindings = findUnsafeAuthorityLabels(text);
  checks.push({
    id: "unsafe_authority_labels",
    status: authorityFindings.length === 0 ? "pass" : "fail",
    message:
      authorityFindings.length === 0
        ? "No packet/code authority-grant language detected."
        : `Unsafe authority language detected: ${authorityFindings.join(", ")}`,
  });

  const resumeCodeFinding = checkResumeCodeSemantics(packet, strict);
  checks.push({
    id: "resume_code_semantics_doc_guard",
    status: resumeCodeFinding.status,
    message: resumeCodeFinding.message,
  });
}

function addRecommendedNextStepCheck(checks: AgWorkResumePacketPreflightCheck[]) {
  const hasFail = checks.some((check) => check.status === "fail");
  const hasWarn = checks.some((check) => check.status === "warn");
  checks.push({
    id: "recommended_next_step",
    status: hasFail ? "fail" : hasWarn ? "warn" : "pass",
    message: recommendedNextStep(hasFail, hasWarn),
  });
}

function addRequiredStringCheck(
  checks: AgWorkResumePacketPreflightCheck[],
  id: string,
  value: string | null,
  presentMessage: string,
  missingMessage: string,
  placeholderMessage: string,
  strict: boolean,
) {
  let status: AgWorkResumePacketPreflightCheckStatus = "pass";
  let message = presentMessage;
  if (!value) {
    status = strict ? "fail" : "warn";
    message = missingMessage;
  } else if (isPlaceholder(value)) {
    status = strict ? "fail" : "warn";
    message = placeholderMessage;
  }
  checks.push({ id, status, message });
}

function addArrayPresenceCheck(
  checks: AgWorkResumePacketPreflightCheck[],
  id: string,
  value: unknown[],
  presentMessage: string,
  missingMessage: string,
  strict: boolean,
) {
  checks.push({
    id,
    status: value.length > 0 ? "pass" : strict ? "fail" : "warn",
    message: value.length > 0 ? presentMessage : missingMessage,
  });
}

function addOptionalHashCheck(
  checks: AgWorkResumePacketPreflightCheck[],
  id: string,
  value: string | null,
  presentMessage: string,
) {
  const hashPattern = /^sha256:[A-Za-z0-9._:-]+$/;
  checks.push({
    id,
    status: value ? hashPattern.test(value) ? "pass" : "fail" : "warn",
    message: value
      ? hashPattern.test(value)
        ? presentMessage
        : "Integrity hash is malformed."
      : "Optional integrity hash is missing.",
  });
}

function addExpiresAtCheck(
  checks: AgWorkResumePacketPreflightCheck[],
  value: unknown,
  strict: boolean,
) {
  if (value === null) {
    checks.push({
      id: "expires_at",
      status: "pass",
      message: "Packet has no expiration.",
    });
    return;
  }
  if (value === undefined) {
    checks.push({
      id: "expires_at",
      status: strict ? "fail" : "warn",
      message: "Packet expiration is missing.",
    });
    return;
  }
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  ) {
    checks.push({
      id: "expires_at",
      status: "fail",
      message: "Packet expiration must be null or an ISO UTC timestamp.",
    });
    return;
  }
  const expiresAtMs = Date.parse(value);
  if (!Number.isFinite(expiresAtMs)) {
    checks.push({
      id: "expires_at",
      status: "fail",
      message: "Packet expiration timestamp is invalid.",
    });
    return;
  }
  if (expiresAtMs <= Date.now()) {
    checks.push({
      id: "expires_at",
      status: "fail",
      message: "Packet is expired.",
    });
    return;
  }
  checks.push({
    id: "expires_at",
    status: "pass",
    message: "Packet expiration is in the future.",
  });
}

function addRequiredTrueCheck(
  checks: AgWorkResumePacketPreflightCheck[],
  id: string,
  value: unknown,
  passMessage: string,
  strict: boolean,
) {
  let status: AgWorkResumePacketPreflightCheckStatus = "pass";
  let message = passMessage;
  if (value !== true) {
    status = value === undefined ? strict ? "fail" : "warn" : "fail";
    message =
      value === undefined
        ? `${passMessage.replace(/\.$/, "")} is missing.`
        : `${passMessage.replace(/\.$/, "")} must be true.`;
  }
  checks.push({ id, status, message });
}

function addRequiredFalseCheck(
  checks: AgWorkResumePacketPreflightCheck[],
  id: string,
  value: unknown,
  passMessage: string,
  strict: boolean,
) {
  let status: AgWorkResumePacketPreflightCheckStatus = "pass";
  let message = passMessage;
  if (value !== false) {
    status = value === undefined ? strict ? "fail" : "warn" : "fail";
    message =
      value === undefined
        ? `${passMessage.replace(/\.$/, "")} is missing.`
        : `${passMessage.replace(/\.$/, "")} must be false.`;
  }
  checks.push({ id, status, message });
}

function addNoDirectRecordCheck(
  checks: AgWorkResumePacketPreflightCheck[],
  id: string,
  value: unknown,
  label: string,
  strict: boolean,
) {
  let status: AgWorkResumePacketPreflightCheckStatus = "pass";
  let message = `Target runtime policy requires explicit user/Core approval and known local work_id before ${label} recording.`;
  if (value === true) {
    status = "fail";
    message = `Target runtime policy must not directly allow ${label} recording.`;
  } else if (value === undefined) {
    status = strict ? "fail" : "warn";
    message = `Target runtime policy for ${label} recording is missing.`;
  } else if (typeof value === "string") {
    const safe =
      /requires explicit user\/Core approval/i.test(value) &&
      /known local work_id/i.test(value);
    if (!safe) {
      status = strict ? "fail" : "warn";
      message = `Target runtime policy for ${label} recording should require explicit user/Core approval and known local work_id.`;
    }
  } else if (value !== false) {
    status = "fail";
    message = `Target runtime policy for ${label} recording is unsafe or ambiguous.`;
  }
  checks.push({ id, status, message });
}

function addMaxCountCheck({
  checks,
  id,
  configuredMax,
  hardMax,
  actualCount,
  label,
  strict,
}: {
  checks: AgWorkResumePacketPreflightCheck[];
  id: string;
  configuredMax: unknown;
  hardMax: number;
  actualCount: number;
  label: string;
  strict: boolean;
}) {
  const configuredIsNumber =
    typeof configuredMax === "number" && Number.isInteger(configuredMax);
  let status: AgWorkResumePacketPreflightCheckStatus = "pass";
  let message = `Bounds limit ${label} to ${String(configuredMax)}, actual count ${actualCount}.`;
  if (!configuredIsNumber) {
    status = strict ? "fail" : "warn";
    message = `Bounds max for ${label} is missing.`;
  } else if (configuredMax > hardMax || configuredMax < 0) {
    status = "fail";
    message = `Bounds max for ${label} must be between 0 and ${hardMax}.`;
  } else if (actualCount > configuredMax) {
    status = "fail";
    message = `Packet has ${actualCount} ${label}, exceeding configured max ${configuredMax}.`;
  }
  checks.push({ id, status, message });
}

function findSecretLikeValues(text: string) {
  const findings: string[] = [];
  const patterns = [
    /\bsk-[A-Za-z0-9_-]*/g,
    /\bghp_[A-Za-z0-9_]*/g,
    /\bgithub_pat_[A-Za-z0-9_]*/g,
    /\bGITHUB_TOKEN\s*=/g,
    /\bOPENAI_API_KEY\s*=/g,
    /BEGIN OPENSSH PRIVATE KEY/g,
    /BEGIN RSA PRIVATE KEY/g,
    /BEGIN PRIVATE KEY/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) findings.push(match[0]);
  }
  return [...new Set(findings)];
}

function findTunnelUrls(text: string) {
  const findings: string[] = [];
  const patterns = [
    /\b[\w.-]*trycloudflare\.com\b/g,
    /\b[\w.-]*ngrok-free\.app\b/g,
    /\b[\w.-]*ngrok\.io\b/g,
    /\b[\w.-]*loca\.lt\b/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) findings.push(match[0]);
  }
  return [...new Set(findings)];
}

function findRawDbPaths(text: string) {
  const findings: string[] = [];
  const patterns = [
    /\/tmp\/augnes[^\s"',}]*/g,
    /[A-Za-z0-9._/-]+\.db\b/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) findings.push(match[0]);
  }
  return [...new Set(findings)];
}

function findUnsafeLocalAbsolutePaths(text: string) {
  const findings: string[] = [];
  const patterns = [
    /\/Users\/[^\s"',}]*/g,
    /\/home\/[^\s"',}]*/g,
    /\b[A-Za-z]:\\[^\s"',}]*/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) findings.push(match[0]);
  }
  return [...new Set(findings)];
}

function findUnsafeAuthorityLabels(text: string) {
  const findings: string[] = [];
  const patterns = [
    /\b(?:packet|resume code|direct code)\s+(?:is|acts as|serves as)\s+(?:an?\s+)?approval\b/gi,
    /\b(?:packet|resume code|direct code)\s+grants?\s+(?:approval|execution|Codex execution|merge|publish|publication|proof|evidence|state mutation|work item creation|session binding)\b/gi,
    /\bresume code\s+(?:executes|starts|launches)\s+Codex\b/gi,
    /\b(?:auto-?import|automatically imports?|auto-?create|automatically creates?)\s+(?:local\s+)?work item\b/gi,
    /\b(?:approve|publish|retry|replay|merge|commit state|reject state)\s+from\s+(?:the\s+)?(?:packet|resume code|direct code)\b/gi,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) findings.push(match[0]);
  }
  return [...new Set(findings)];
}

function checkResumeCodeSemantics(
  packet: Record<string, unknown>,
  strict: boolean,
): { status: AgWorkResumePacketPreflightCheckStatus; message: string } {
  const directCodeValues = collectValuesByKeyPattern(
    packet,
    /(?:direct.*resume.*code|resume.*code|direct.*code)/i,
  );
  if (directCodeValues.length === 0) {
    return { status: "pass", message: "No Direct Resume Code metadata detected." };
  }

  const serialized = JSON.stringify(directCodeValues);
  const hasRetrievalOnly =
    /retrieval[_ -]?only|read[_ -]?only|packet retrieval/i.test(serialized);
  const unsafe = findUnsafeAuthorityLabels(serialized);
  if (unsafe.length > 0) {
    return {
      status: "fail",
      message: `Direct Resume Code metadata contains unsafe authority language: ${unsafe.join(", ")}`,
    };
  }
  if (!hasRetrievalOnly) {
    return {
      status: strict ? "fail" : "warn",
      message:
        "Direct Resume Code metadata is present but does not clearly say retrieval-only/read-only packet retrieval.",
    };
  }
  return {
    status: "pass",
    message: "Direct Resume Code metadata is retrieval-only/read-only.",
  };
}

function collectValuesByKeyPattern(
  value: unknown,
  pattern: RegExp,
  matches: unknown[] = [],
) {
  if (Array.isArray(value)) {
    for (const item of value) collectValuesByKeyPattern(item, pattern, matches);
    return matches;
  }
  if (!isRecord(value)) return matches;
  for (const [key, entry] of Object.entries(value)) {
    if (pattern.test(key)) matches.push(entry);
    collectValuesByKeyPattern(entry, pattern, matches);
  }
  return matches;
}

function buildSummary(
  inputMode: string,
  packet: Record<string, unknown>,
): AgWorkResumePacketPreflightSummary {
  const issuer = jsonRecord(packet.issuer);
  const sourceWork = jsonRecord(packet.source_work);
  const git = jsonRecord(packet.git);
  const handoff = jsonRecord(packet.handoff);
  const policy = jsonRecord(packet.target_runtime_policy);
  return {
    input_mode: inputMode === "stdin" || inputMode === "file" ? inputMode : "json",
    schema: jsonString(packet.schema),
    packet_kind: jsonString(packet.packet_kind),
    has_packet_id: Boolean(jsonString(packet.packet_id)),
    has_runtime_instance_id: Boolean(jsonString(issuer?.runtime_instance_id)),
    has_scope: Boolean(jsonString(sourceWork?.scope)),
    has_work_id: Boolean(jsonString(sourceWork?.work_id)),
    has_git_remote: Boolean(jsonString(git?.remote)),
    has_expected_checks: jsonArray(handoff?.expected_checks).length > 0,
    preview_only_by_default: policy?.preview_only_by_default === true,
  };
}

function emptySummary(inputMode = "none"): AgWorkResumePacketPreflightSummary {
  return {
    input_mode: inputMode,
    schema: null,
    packet_kind: null,
    has_packet_id: false,
    has_runtime_instance_id: false,
    has_scope: false,
    has_work_id: false,
    has_git_remote: false,
    has_expected_checks: false,
    preview_only_by_default: false,
  };
}

function recommendedNextStep(hasFail: boolean, hasWarn: boolean) {
  if (hasFail) {
    return "Stop. Fix failed packet preflight checks before preview, import, or Codex start.";
  }
  if (hasWarn) {
    return "Resolve warnings with user/Core confirmation before mapping this packet to a local runtime/work item.";
  }
  return "Packet preflight passed. Use this packet only as read-only resume context until user/Core confirms the local runtime/work mapping.";
}

function clean(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function jsonRecord(value: unknown) {
  return isRecord(value) ? value : null;
}

function jsonArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function jsonString(value: unknown) {
  return clean(typeof value === "string" ? value : null);
}

function isPlaceholder(value: string) {
  const normalized = value.toLowerCase();
  return (
    /^<[^>]+>$/.test(value) ||
    normalized.includes("example") ||
    normalized.includes("placeholder") ||
    normalized.includes("operator-provided") ||
    normalized.includes("provided by") ||
    normalized.includes("todo") ||
    normalized.includes("tbd")
  );
}

function safeJsonStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}
