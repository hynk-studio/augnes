import { appendFileSync } from "node:fs";

const observationPath =
  process.env.AUGNES_PROVIDER_EGRESS_OBSERVATION_PATH?.trim() ?? "";
const installed = Symbol.for("augnes.provider-egress-observer.v0.1");
const targetOrigin = "https://api.openai.com";
const targetPath = "/v1/responses";

if (
  observationPath &&
  typeof globalThis.fetch === "function" &&
  !globalThis[installed]
) {
  Object.defineProperty(globalThis, installed, {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false,
  });
  const nativeFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input, init) => {
    const url = requestUrl(input);
    if (!url || url.origin !== targetOrigin || url.pathname !== targetPath) {
      return await nativeFetch(input, init);
    }
    record("started");
    try {
      const response = await nativeFetch(input, init);
      record("completed", response.status);
      return response;
    } catch (error) {
      record(
        error instanceof DOMException && error.name === "AbortError"
          ? "cancelled"
          : "failed",
      );
      throw error;
    }
  };
}

function requestUrl(input) {
  try {
    return new URL(
      typeof input === "string" || input instanceof URL ? input : input.url,
    );
  } catch {
    return null;
  }
}

function record(status, responseStatus = null) {
  appendFileSync(
    observationPath,
    `${JSON.stringify({
      observation_version: "provider_egress_observation.v0.1",
      purpose: "guidebrief_interpretation",
      status,
      response_status: responseStatus,
    })}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
}
