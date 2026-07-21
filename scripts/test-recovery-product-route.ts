#!/usr/bin/env node

import assert from "node:assert/strict";

import { NextRequest } from "next/server";

import { POST } from "../app/api/recovery/route";
import { proxy } from "../proxy";

const environment = {
  AUGNES_CANONICAL_TEST_MODE: "1",
  AUGNES_TEST_RECOVERY_ROUTE_TIMEOUT_MS: "20",
  AUGNES_RUNTIME_CONTROL_PORT: "43123",
  AUGNES_RUNTIME_INSTANCE_ID: "instance-recovery-route-timeout",
  AUGNES_RUNTIME_OWNERSHIP_TOKEN: "ownership-recovery-route-timeout",
  AUGNES_RECOVERY_MODE: "1",
};
const requestHeaders = {
  host: "127.0.0.1:3000",
  origin: "http://127.0.0.1:3000",
  "content-type": "application/json",
};

async function main() {
  const savedEnvironment = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(environment)) {
    savedEnvironment.set(key, process.env[key]);
    process.env[key] = value;
  }

  const originalFetch = globalThis.fetch;
  let simulatedSupervisorAccepted = false;
  let supervisorRequestCount = 0;

  try {
    globalThis.fetch = (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      supervisorRequestCount += 1;
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          simulatedSupervisorAccepted = true;
          resolve(
            Response.json(
              {
                accepted: true,
                outcome: "retry_scheduled",
                next_action: "wait_for_augnes_to_restart",
              },
              { status: 202 },
            ),
          );
        }, 60);
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("request aborted", "AbortError")),
          { once: true },
        );
      });
    };

    const response = await POST(recoveryRequest({ action: "retry_update" }));
    assert.equal(response.status, 504);
    const body = await response.json();
    assert.deepEqual(body, {
      outcome: "status_unknown",
      reason_code: "recovery_action_outcome_unknown",
      next_action: "refresh_recovery_status",
      message:
        "Augnes could not confirm whether the recovery action was accepted. Refresh recovery status before choosing another action.",
    });
    assert.doesNotMatch(JSON.stringify(body), /did not change|not changed/u);

    await new Promise((resolve) => setTimeout(resolve, 80));
    assert.equal(
      simulatedSupervisorAccepted,
      true,
      "the route must remain truthful when the supervisor accepts after the bounded client timeout",
    );

    const encoder = new TextEncoder();
    const oversizedStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("x".repeat(4_096)));
        controller.enqueue(encoder.encode("x"));
        controller.close();
      },
    });
    await assertRequestRefused(
      new Request("http://127.0.0.1:3000/api/recovery", {
        method: "POST",
        headers: requestHeaders,
        body: oversizedStream,
        duplex: "half",
      } as RequestInit & { duplex: "half" }),
    );
    await assertRequestRefused(
      recoveryRequest({ action: "retry_update" }, { "content-length": "x" }),
    );
    await assertRequestRefused(
      recoveryRequest({ action: "retry_update", unexpected: true }),
    );
    await assertRequestRefused(recoveryRequest("", {}, "text/plain"));
    await assertRequestRefused(recoveryRequest(""));
    assert.equal(
      supervisorRequestCount,
      1,
      "invalid or oversized product requests must be refused before supervisor contact",
    );

    const writeRefusal = proxy(
      new NextRequest("http://127.0.0.1:3000/api/product-write", {
        method: "POST",
      }),
    );
    assert.equal(writeRefusal.status, 503);
    assert.equal(writeRefusal.headers.get("location"), null);
    assert.equal(writeRefusal.headers.get("cache-control"), "no-store, max-age=0");
    assert.deepEqual(await writeRefusal.json(), {
      error_code: "recovery_mode_write_refused",
      next_action: "use_the_recovery_page",
    });

    const recoveryWrite = proxy(
      new NextRequest("http://127.0.0.1:3000/api/recovery", {
        method: "POST",
      }),
    );
    assert.equal(recoveryWrite.headers.get("x-middleware-next"), "1");
    assert.equal(recoveryWrite.headers.get("location"), null);

    const navigation = proxy(
      new NextRequest("http://127.0.0.1:3000/projects?private=value"),
    );
    assert.equal(navigation.status, 307);
    const recoveryLocation = new URL(
      navigation.headers.get("location") ?? "invalid:",
    );
    assert.equal(recoveryLocation.pathname, "/recovery");
    assert.equal(recoveryLocation.search, "");
    assert.equal(navigation.headers.get("cache-control"), "no-store, max-age=0");

    console.log(
      JSON.stringify(
        {
          test: "recovery-product-route",
          status: "pass",
          bounded_timeout_verified: true,
          late_supervisor_acceptance_reported_as_unknown: true,
          streamed_oversize_and_malformed_requests_refused: true,
          recovery_mode_write_barrier_verified: true,
          recovery_product_action_allowed: true,
          recovery_navigation_no_store_verified: true,
          false_no_mutation_claims: 0,
        },
        null,
        2,
      ),
    );
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of savedEnvironment) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function recoveryRequest(
  body: unknown,
  additionalHeaders: Record<string, string> = {},
  contentType = "application/json",
): Request {
  return new Request("http://127.0.0.1:3000/api/recovery", {
    method: "POST",
    headers: {
      ...requestHeaders,
      "content-type": contentType,
      ...additionalHeaders,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function assertRequestRefused(request: Request): Promise<void> {
  const response = await POST(request);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    accepted: false,
    outcome: "refused",
    reason_code: "recovery_request_invalid",
    next_action: "choose_an_available_recovery_action",
  });
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
