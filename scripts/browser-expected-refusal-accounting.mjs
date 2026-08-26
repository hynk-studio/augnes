export class ExpectedRefusalAccountingError extends Error {
  constructor(code, details = null) {
    super(code);
    this.name = "ExpectedRefusalAccountingError";
    this.code = code;
    this.details = details;
  }
}

export function createExpectedRefusalAccounting({
  maximumTokens = 8,
  maximumEvents = 512,
} = {}) {
  if (
    !Number.isSafeInteger(maximumTokens) ||
    maximumTokens < 1 ||
    !Number.isSafeInteger(maximumEvents) ||
    maximumEvents < 1
  ) {
    throw new ExpectedRefusalAccountingError(
      "expected_refusal_accounting_config_invalid",
    );
  }

  const tokens = new Map();
  const requests = new Map();
  const observedFingerprints = new Map();
  const classifiedConsoleIndexes = new Set();
  const consoleClassifications = [];
  const duplicateDeliveries = [];
  const failures = [];
  const ledger = [];
  let lastSequence = 0;

  return {
    register,
    observe,
    isSettled,
    assertHealthy,
    snapshot,
    finalize,
    isClassifiedConsoleIndex,
  };

  function register(input) {
    const spec = validateSpec(input);
    if (tokens.size >= maximumTokens) {
      throw new ExpectedRefusalAccountingError(
        "expected_refusal_token_limit_exceeded",
      );
    }
    if (tokens.has(spec.token_id)) {
      throw new ExpectedRefusalAccountingError(
        "expected_refusal_token_duplicated",
      );
    }
    tokens.set(spec.token_id, {
      spec,
      refusal: emptyLifecycleRole(),
      chrome_log: null,
      recovery: emptyLifecycleRole(),
      authenticated: emptyLifecycleRole(),
      duplicate_count: 0,
    });
    return spec.token_id;
  }

  function observe(input) {
    const event = validateEvent(input);
    if (ledger.length >= maximumEvents) {
      addFailure("expected_refusal_event_limit_exceeded", {
        maximum_events: maximumEvents,
      });
      return { disposition: "event_limit_exceeded", token_id: null };
    }
    if (event.sequence <= lastSequence) {
      addFailure("expected_refusal_event_sequence_invalid", {
        sequence: event.sequence,
        last_sequence: lastSequence,
      });
      return { disposition: "invalid_sequence", token_id: null };
    }
    lastSequence = event.sequence;

    const priorFingerprint = observedFingerprints.get(
      event.event_fingerprint,
    );
    if (priorFingerprint) {
      if (
        priorFingerprint.identity !== stableEventIdentity(event)
      ) {
        addFailure("expected_refusal_event_fingerprint_conflict", {
          sequence: event.sequence,
          original_sequence: priorFingerprint.sequence,
        });
        return { disposition: "fingerprint_conflict", token_id: null };
      }
      const duplicate = {
        event_name: event.event_name,
        event_fingerprint: event.event_fingerprint,
        original_sequence: priorFingerprint.sequence,
        duplicate_sequence: event.sequence,
        token_id: priorFingerprint.token_id,
        raw_console_index: event.raw_console_index,
      };
      duplicateDeliveries.push(duplicate);
      ledger.push({
        ...event,
        disposition: "duplicate_delivery",
        token_id: priorFingerprint.token_id,
      });
      if (
        event.event_name === "Log.entryAdded" &&
        priorFingerprint.token_id
      ) {
        const token = tokens.get(priorFingerprint.token_id);
        token.duplicate_count += 1;
        classifyConsole({
          event,
          tokenId: priorFingerprint.token_id,
          disposition: "duplicate_delivery",
        });
      }
      return {
        disposition: "duplicate_delivery",
        token_id: priorFingerprint.token_id,
      };
    }

    const fingerprintRecord = {
      sequence: event.sequence,
      identity: stableEventIdentity(event),
      token_id: null,
    };
    observedFingerprints.set(event.event_fingerprint, fingerprintRecord);

    let classification;
    if (event.event_name === "Network.requestWillBeSent") {
      classification = observeRequest(event);
    } else if (event.event_name === "Network.responseReceived") {
      classification = observeResponse(event);
    } else if (
      event.event_name === "Network.loadingFinished" ||
      event.event_name === "Network.loadingFailed"
    ) {
      classification = observeTerminal(event);
    } else if (event.event_name === "Log.entryAdded") {
      classification = observeLog(event);
    } else {
      classification = {
        disposition: "unrelated_observer_event",
        token_id: null,
      };
    }
    fingerprintRecord.token_id = classification.token_id;
    ledger.push({
      ...event,
      disposition: classification.disposition,
      token_id: classification.token_id,
    });
    return classification;
  }

  function observeRequest(event) {
    if (!event.request_id || requests.has(event.request_id)) {
      addFailure("expected_refusal_request_identity_invalid", {
        request_id: event.request_id,
      });
      return { disposition: "invalid_request", token_id: null };
    }
    const lifecycle = {
      request_id: event.request_id,
      method: event.method,
      path: event.path,
      url: event.url,
      phase_started: event.phase_observed,
      response: null,
      response_count: 0,
      terminal: null,
      token_id: null,
      role: null,
    };
    requests.set(event.request_id, lifecycle);

    const candidates = [];
    for (const token of tokens.values()) {
      if (
        !token.refusal.request_id &&
        requestMatches(event, token.spec.refusal) &&
        event.phase_observed === token.spec.phase
      ) {
        candidates.push({ token, role: "refusal" });
      }
      if (
        token.refusal.request_id &&
        !token.recovery.request_id &&
        requestMatches(event, token.spec.recovery)
      ) {
        candidates.push({ token, role: "recovery" });
      }
      if (
        token.recovery.response?.status === token.spec.recovery.status &&
        !token.authenticated.request_id &&
        requestMatches(event, token.spec.authenticated)
      ) {
        candidates.push({ token, role: "authenticated" });
      }
    }
    if (candidates.length > 1) {
      addFailure("ambiguous_expected_refusal_request", {
        request_id: event.request_id,
        candidates: candidates.map(
          ({ token, role }) => `${token.spec.token_id}:${role}`,
        ),
      });
      return { disposition: "ambiguous_request", token_id: null };
    }
    if (candidates.length === 0) {
      return { disposition: "unbound_request", token_id: null };
    }
    const [{ token, role }] = candidates;
    lifecycle.token_id = token.spec.token_id;
    lifecycle.role = role;
    token[role].request_id = event.request_id;
    token[role].phase_started = event.phase_observed;
    return {
      disposition: `${role}_request`,
      token_id: token.spec.token_id,
    };
  }

  function observeResponse(event) {
    const lifecycle = requests.get(event.request_id);
    if (!lifecycle) {
      addFailure(
        event.status !== null && event.status >= 400
          ? "unexpected_network_error_response"
          : "expected_refusal_response_without_request",
        {
          request_id: event.request_id,
          path: event.path,
          status: event.status,
        },
      );
      return { disposition: "orphan_response", token_id: null };
    }
    if (lifecycle.response) {
      addFailure("multiple_response_events_for_request", {
        request_id: event.request_id,
      });
      return {
        disposition: "multiple_response_events",
        token_id: lifecycle.token_id,
      };
    }
    lifecycle.response = {
      status: event.status,
      sequence: event.sequence,
      phase_observed: event.phase_observed,
      event_fingerprint: event.event_fingerprint,
    };
    lifecycle.response_count += 1;

    if (!lifecycle.token_id) {
      const exactRefusal = [...tokens.values()].find(
        (token) =>
          requestMatches(lifecycle, token.spec.refusal) &&
          event.status === token.spec.refusal.status,
      );
      if (exactRefusal) {
        addFailure("multiple_exact_refusal_responses", {
          request_id: event.request_id,
          expected_request_id: exactRefusal.refusal.request_id,
          token_id: exactRefusal.spec.token_id,
        });
        return {
          disposition: "extra_refusal_response",
          token_id: exactRefusal.spec.token_id,
        };
      }
      if (event.status !== null && event.status >= 400) {
        addFailure("unexpected_network_error_response", {
          request_id: event.request_id,
          path: lifecycle.path,
          status: event.status,
        });
        return {
          disposition: "unexpected_network_error_response",
          token_id: null,
        };
      }
      return { disposition: "unbound_response", token_id: null };
    }

    const token = tokens.get(lifecycle.token_id);
    const expected = token.spec[lifecycle.role];
    token[lifecycle.role].response = lifecycle.response;
    token[lifecycle.role].response_count = lifecycle.response_count;
    if (event.status !== expected.status) {
      const code =
        lifecycle.role === "refusal"
          ? "expected_refusal_response_mismatch"
          : lifecycle.role === "recovery"
            ? "expected_refusal_recovery_failed"
            : "authenticated_session_recovery_failed";
      addFailure(code, {
        request_id: event.request_id,
        expected_status: expected.status,
        observed_status: event.status,
      });
      return {
        disposition: `${lifecycle.role}_response_mismatch`,
        token_id: lifecycle.token_id,
      };
    }
    return {
      disposition: `${lifecycle.role}_response`,
      token_id: lifecycle.token_id,
    };
  }

  function observeTerminal(event) {
    const lifecycle = requests.get(event.request_id);
    if (!lifecycle) {
      addFailure("expected_refusal_terminal_without_request", {
        request_id: event.request_id,
      });
      return { disposition: "orphan_terminal", token_id: null };
    }
    if (lifecycle.terminal) {
      addFailure("multiple_terminal_events_for_request", {
        request_id: event.request_id,
      });
      return {
        disposition: "multiple_terminal_events",
        token_id: lifecycle.token_id,
      };
    }
    lifecycle.terminal = {
      event_name: event.event_name,
      sequence: event.sequence,
      phase_observed: event.phase_observed,
      event_fingerprint: event.event_fingerprint,
    };
    if (!lifecycle.token_id) {
      return { disposition: "unbound_terminal", token_id: null };
    }
    const token = tokens.get(lifecycle.token_id);
    token[lifecycle.role].terminal = lifecycle.terminal;
    if (event.event_name !== "Network.loadingFinished") {
      addFailure(`${lifecycle.role}_request_loading_failed`, {
        request_id: event.request_id,
      });
      return {
        disposition: `${lifecycle.role}_loading_failed`,
        token_id: lifecycle.token_id,
      };
    }
    return {
      disposition: `${lifecycle.role}_terminal`,
      token_id: lifecycle.token_id,
    };
  }

  function observeLog(event) {
    let token = null;
    let correlation = null;
    if (event.log_network_request_id) {
      const lifecycle = requests.get(event.log_network_request_id);
      if (lifecycle?.token_id && lifecycle.role === "refusal") {
        token = tokens.get(lifecycle.token_id);
        correlation = "network_request_id";
      }
    } else {
      const candidates = [...tokens.values()].filter(
        (candidate) =>
          candidate.refusal.response?.status ===
            candidate.spec.refusal.status &&
          !candidate.chrome_log &&
          logMatches(event, candidate.spec.refusal),
      );
      if (candidates.length > 1) {
        addFailure("ambiguous_refusal_log_correlation", {
          sequence: event.sequence,
          candidates: candidates.map(
            (candidate) => candidate.spec.token_id,
          ),
        });
        return { disposition: "ambiguous_log", token_id: null };
      }
      if (candidates.length === 1) {
        [token] = candidates;
        correlation = "single_candidate_fallback";
      }
    }
    if (!token || !logMatches(event, token.spec.refusal)) {
      return { disposition: "unrelated_log", token_id: null };
    }
    if (token.chrome_log) {
      addFailure("multiple_refusal_logs", {
        token_id: token.spec.token_id,
        first_fingerprint: token.chrome_log.event_fingerprint,
        second_fingerprint: event.event_fingerprint,
      });
      return {
        disposition: "extra_refusal_log",
        token_id: token.spec.token_id,
      };
    }
    token.chrome_log = {
      event_fingerprint: event.event_fingerprint,
      network_request_id: event.log_network_request_id,
      phase_observed: event.phase_observed,
      raw_console_index: event.raw_console_index,
      correlation,
    };
    classifyConsole({
      event,
      tokenId: token.spec.token_id,
      disposition: "expected_refusal_log",
    });
    return {
      disposition: "expected_refusal_log",
      token_id: token.spec.token_id,
    };
  }

  function classifyConsole({ event, tokenId, disposition }) {
    if (!Number.isSafeInteger(event.raw_console_index)) {
      addFailure("expected_refusal_raw_console_index_missing", {
        sequence: event.sequence,
      });
      return;
    }
    classifiedConsoleIndexes.add(event.raw_console_index);
    consoleClassifications.push({
      raw_console_index: event.raw_console_index,
      token_id: tokenId,
      disposition,
      event_fingerprint: event.event_fingerprint,
    });
  }

  function addFailure(code, details) {
    if (!failures.some((failure) => failure.code === code)) {
      failures.push({ code, details });
    }
  }

  function assertHealthy() {
    if (failures.length > 0) {
      throw new ExpectedRefusalAccountingError(
        failures[0].code,
        failures[0].details,
      );
    }
  }

  function isSettled(tokenId) {
    const token = tokens.get(tokenId);
    if (!token || failures.length > 0) return false;
    return tokenComplete(token);
  }

  function isClassifiedConsoleIndex(index) {
    return classifiedConsoleIndexes.has(index);
  }

  function snapshot() {
    return {
      ok:
        failures.length === 0 &&
        tokens.size > 0 &&
        [...tokens.values()].every(tokenComplete),
      tokens: [...tokens.values()].map(tokenSummary),
      failures: structuredClone(failures),
      classified_console_indexes: [...classifiedConsoleIndexes].sort(
        (left, right) => left - right,
      ),
      console_classifications: structuredClone(consoleClassifications),
      duplicate_deliveries: structuredClone(duplicateDeliveries),
      event_ledger: structuredClone(ledger),
    };
  }

  function finalize() {
    assertHealthy();
    if (tokens.size === 0) {
      throw new ExpectedRefusalAccountingError(
        "expected_refusal_token_missing",
      );
    }
    for (const token of tokens.values()) {
      const missingCode = tokenMissingCode(token);
      if (missingCode) {
        throw new ExpectedRefusalAccountingError(missingCode, {
          token_id: token.spec.token_id,
        });
      }
    }
    return snapshot();
  }
}

export function unexpectedConsoleErrorsForExpectedRefusals({
  rawConsoleErrors,
  accounting,
  isOtherExpected = () => false,
}) {
  if (!Array.isArray(rawConsoleErrors)) {
    throw new ExpectedRefusalAccountingError(
      "expected_refusal_raw_console_list_invalid",
    );
  }
  if (
    !accounting ||
    typeof accounting.isClassifiedConsoleIndex !== "function"
  ) {
    throw new ExpectedRefusalAccountingError(
      "expected_refusal_accounting_instance_invalid",
    );
  }
  return rawConsoleErrors.filter(
    (entry, index) =>
      !accounting.isClassifiedConsoleIndex(index) &&
      !isOtherExpected(entry, index),
  );
}

function emptyLifecycleRole() {
  return {
    request_id: null,
    phase_started: null,
    response: null,
    response_count: 0,
    terminal: null,
  };
}

function validateSpec(input) {
  if (
    !input ||
    typeof input !== "object" ||
    !isBoundedString(input.token_id) ||
    !isBoundedString(input.phase)
  ) {
    throw new ExpectedRefusalAccountingError(
      "expected_refusal_token_invalid",
    );
  }
  return {
    token_id: input.token_id,
    phase: input.phase,
    refusal: validateRoleSpec(input.refusal, {
      requireChromeLog: true,
      label: "refusal",
    }),
    recovery: validateRoleSpec(input.recovery, {
      requireChromeLog: false,
      label: "recovery",
    }),
    authenticated: validateRoleSpec(input.authenticated, {
      requireChromeLog: false,
      label: "authenticated",
    }),
  };
}

function validateRoleSpec(input, { requireChromeLog, label }) {
  if (
    !input ||
    typeof input !== "object" ||
    !/^(GET|POST)$/u.test(input.method ?? "") ||
    !isPath(input.path) ||
    !Number.isSafeInteger(input.status) ||
    input.status < 100 ||
    input.status > 599 ||
    (requireChromeLog && !isBoundedString(input.chrome_log_text))
  ) {
    throw new ExpectedRefusalAccountingError(
      `expected_refusal_${label}_spec_invalid`,
    );
  }
  return {
    method: input.method,
    path: input.path,
    status: input.status,
    ...(requireChromeLog
      ? { chrome_log_text: input.chrome_log_text }
      : {}),
  };
}

function validateEvent(input) {
  if (
    !input ||
    typeof input !== "object" ||
    !Number.isSafeInteger(input.sequence) ||
    input.sequence < 1 ||
    ![
      "Network.requestWillBeSent",
      "Network.responseReceived",
      "Network.loadingFinished",
      "Network.loadingFailed",
      "Log.entryAdded",
      "Runtime.consoleAPICalled",
    ].includes(input.event_name) ||
    !isBoundedString(input.phase_observed) ||
    !isBoundedString(input.event_fingerprint)
  ) {
    throw new ExpectedRefusalAccountingError(
      "expected_refusal_event_invalid",
    );
  }
  return {
    sequence: input.sequence,
    event_name: input.event_name,
    request_id:
      typeof input.request_id === "string" ? input.request_id : null,
    log_network_request_id:
      typeof input.log_network_request_id === "string"
        ? input.log_network_request_id
        : null,
    observer_channel:
      typeof input.observer_channel === "string"
        ? input.observer_channel
        : input.event_name.split(".", 1)[0],
    phase_started:
      typeof input.phase_started === "string"
        ? input.phase_started
        : null,
    phase_observed: input.phase_observed,
    cdp_timestamp:
      typeof input.cdp_timestamp === "number"
        ? input.cdp_timestamp
        : null,
    observation_monotonic_ms:
      typeof input.observation_monotonic_ms === "number"
        ? input.observation_monotonic_ms
        : null,
    method:
      typeof input.method === "string" ? input.method.toUpperCase() : null,
    status:
      Number.isSafeInteger(input.status) ? input.status : null,
    url: typeof input.url === "string" ? input.url : null,
    path: typeof input.path === "string" ? input.path : null,
    raw_text:
      typeof input.raw_text === "string" ? input.raw_text : null,
    raw_console_index: Number.isSafeInteger(input.raw_console_index)
      ? input.raw_console_index
      : null,
    event_fingerprint: input.event_fingerprint,
  };
}

function requestMatches(event, spec) {
  return event.method === spec.method && event.path === spec.path;
}

function logMatches(event, refusalSpec) {
  return (
    event.path === refusalSpec.path &&
    event.raw_text === refusalSpec.chrome_log_text
  );
}

function stableEventIdentity(event) {
  return JSON.stringify({
    event_name: event.event_name,
    request_id: event.request_id,
    log_network_request_id: event.log_network_request_id,
    observer_channel: event.observer_channel,
    cdp_timestamp: event.cdp_timestamp,
    method: event.method,
    status: event.status,
    url: event.url,
    path: event.path,
    raw_text: event.raw_text,
  });
}

function tokenComplete(token) {
  return tokenMissingCode(token) === null;
}

function tokenMissingCode(token) {
  if (!token.refusal.request_id) return "expected_refusal_request_missing";
  if (!token.refusal.response) return "expected_refusal_response_missing";
  if (token.refusal.response.status !== token.spec.refusal.status) {
    return "expected_refusal_response_mismatch";
  }
  if (!token.refusal.terminal) return "expected_refusal_terminal_missing";
  if (!token.chrome_log) return "expected_refusal_log_missing";
  if (!token.recovery.request_id) {
    return "authenticated_session_recovery_missing";
  }
  if (!token.recovery.response) {
    return "authenticated_session_recovery_missing";
  }
  if (token.recovery.response.status !== token.spec.recovery.status) {
    return "expected_refusal_recovery_failed";
  }
  if (!token.recovery.terminal) {
    return "authenticated_session_recovery_missing";
  }
  if (!token.authenticated.request_id) {
    return "authenticated_session_recovery_missing";
  }
  if (!token.authenticated.response) {
    return "authenticated_session_recovery_missing";
  }
  if (
    token.authenticated.response.status !== token.spec.authenticated.status
  ) {
    return "authenticated_session_recovery_failed";
  }
  if (!token.authenticated.terminal) {
    return "authenticated_session_recovery_missing";
  }
  return null;
}

function tokenSummary(token) {
  return {
    token_id: token.spec.token_id,
    complete: tokenComplete(token),
    refusal: {
      request_id: token.refusal.request_id,
      status: token.refusal.response?.status ?? null,
      response_count: token.refusal.response_count,
      terminal_event: token.refusal.terminal?.event_name ?? null,
      phase_started: token.refusal.phase_started,
    },
    chrome_log: {
      expected_count: token.chrome_log ? 1 : 0,
      duplicate_count: token.duplicate_count,
      network_request_id:
        token.chrome_log?.network_request_id ?? null,
      phase_observed: token.chrome_log?.phase_observed ?? null,
      correlation: token.chrome_log?.correlation ?? null,
    },
    recovery: {
      request_id: token.recovery.request_id,
      status: token.recovery.response?.status ?? null,
      response_count: token.recovery.response_count,
      terminal_event: token.recovery.terminal?.event_name ?? null,
      phase_started: token.recovery.phase_started,
    },
    authenticated: {
      request_id: token.authenticated.request_id,
      status: token.authenticated.response?.status ?? null,
      response_count: token.authenticated.response_count,
      terminal_event:
        token.authenticated.terminal?.event_name ?? null,
      phase_started: token.authenticated.phase_started,
    },
  };
}

function isBoundedString(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 1_024
  );
}

function isPath(value) {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.includes("?") &&
    value.length <= 512
  );
}
