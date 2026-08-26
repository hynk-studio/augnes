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
    record("started", null, guideBriefPrivacyObservation(init?.body));
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

function record(status, responseStatus = null, privacy = null) {
  appendFileSync(
    observationPath,
    `${JSON.stringify({
      observation_version: "provider_egress_observation.v0.1",
      purpose: "guidebrief_interpretation",
      status,
      response_status: responseStatus,
      ...(privacy ?? {}),
    })}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
}

function guideBriefPrivacyObservation(body) {
  if (typeof body !== "string") return null;
  try {
    const request = JSON.parse(body);
    const userText = request?.input?.find?.((item) => item?.role === "user")
      ?.content?.find?.((item) => item?.type === "input_text")?.text;
    if (typeof userText !== "string") return null;
    const dynamic = JSON.parse(userText);
    if (!Array.isArray(dynamic?.candidates)) return null;
    const anchor = dynamic.previous_answer_anchor;
    const anchorKeys = anchor && typeof anchor === "object"
      ? Object.keys(anchor).sort()
      : [];
    const anchorSerialized = anchor === null ? "" : JSON.stringify(anchor);
    return {
      guidebrief_dynamic_exact_keys:
        JSON.stringify(Object.keys(dynamic).sort()) ===
        JSON.stringify([
          "candidates",
          "previous_answer_anchor",
          "utterance",
        ]),
      reference_anchor_count: anchor === null ? 0 : 1,
      reference_anchor_public_shape:
        anchor === null
          ? null
          : JSON.stringify(anchorKeys) ===
              JSON.stringify(["anchor_kind", "public_subject"]) &&
            anchor.anchor_kind ===
              "immediately_previous_successful_guidebrief_answer" &&
            typeof anchor.public_subject === "string" &&
            Buffer.byteLength(anchor.public_subject, "utf8") <= 320,
      reference_anchor_internal_identity_absent:
        anchor === null
          ? null
          : !/(?:guidebrief-conversation-scope|sha256:|source[_ -]?ref|\/Users\/|https?:\/\/|c_[a-f0-9]{32})/iu.test(
              anchorSerialized,
            ),
      request_store_false: request.store === false,
    };
  } catch {
    return null;
  }
}
