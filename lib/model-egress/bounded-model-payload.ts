export const MODEL_EGRESS_PURPOSES = [
  "observe_delta_compile",
  "planner_plan",
  "temporal_interpretation",
] as const;

export type ModelEgressPurpose = (typeof MODEL_EGRESS_PURPOSES)[number];

export const MODEL_EGRESS_REFUSAL_REASONS = [
  "model_egress_payload_oversize",
  "model_egress_payload_malformed",
  "model_egress_payload_unsupported",
] as const;

export type ModelEgressRefusalReason =
  (typeof MODEL_EGRESS_REFUSAL_REASONS)[number];

export type ModelEgressJsonValue =
  | null
  | boolean
  | number
  | string
  | ModelEgressJsonValue[]
  | { [key: string]: ModelEgressJsonValue };

export type ModelTransportResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

export type BoundedModelTransport = (
  requestBody: string,
) => Promise<ModelTransportResponse>;

export class ModelEgressBoundaryError extends Error {
  readonly code = "model_egress_boundary_refusal";

  constructor(
    readonly purpose: ModelEgressPurpose,
    readonly reasonCode: ModelEgressRefusalReason,
    readonly measured: number,
    readonly maximum: number,
  ) {
    super(
      `Model egress refused: purpose=${purpose} reason=${reasonCode} measured=${measured} maximum=${maximum}`,
    );
    this.name = "ModelEgressBoundaryError";
  }
}

export function isModelEgressBoundaryError(
  value: unknown,
): value is ModelEgressBoundaryError {
  return value instanceof ModelEgressBoundaryError;
}

export function refuseModelEgress(
  purpose: ModelEgressPurpose,
  reasonCode: ModelEgressRefusalReason,
  measured = 1,
  maximum = 0,
): never {
  throw new ModelEgressBoundaryError(
    purpose,
    reasonCode,
    measured,
    maximum,
  );
}

export function utf8ByteLength(value: string) {
  return Buffer.byteLength(value, "utf8");
}

export function assertModelEgressCollectionCount(
  purpose: ModelEgressPurpose,
  measured: number,
  maximum: number,
) {
  if (!Number.isSafeInteger(measured) || measured < 0) {
    refuseModelEgress(
      purpose,
      "model_egress_payload_malformed",
      1,
      0,
    );
  }
  if (measured > maximum) {
    refuseModelEgress(
      purpose,
      "model_egress_payload_oversize",
      measured,
      maximum,
    );
  }
}

export function assertModelEgressTextBytes(
  purpose: ModelEgressPurpose,
  value: string,
  maximum: number,
) {
  const measured = utf8ByteLength(value);
  if (measured > maximum) {
    refuseModelEgress(
      purpose,
      "model_egress_payload_oversize",
      measured,
      maximum,
    );
  }
  return value;
}

export function requireModelEgressText(
  purpose: ModelEgressPurpose,
  value: unknown,
  maximum: number,
  options: { allowEmpty?: boolean } = {},
) {
  if (
    typeof value !== "string" ||
    (!options.allowEmpty && value.trim().length === 0)
  ) {
    refuseModelEgress(
      purpose,
      "model_egress_payload_malformed",
      1,
      0,
    );
  }
  return assertModelEgressTextBytes(purpose, value, maximum);
}

export function requireModelEgressRecord(
  purpose: ModelEgressPurpose,
  value: unknown,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    refuseModelEgress(
      purpose,
      "model_egress_payload_malformed",
      1,
      0,
    );
  }

  let prototype: object | null;
  try {
    prototype = Object.getPrototypeOf(value);
  } catch {
    return refuseModelEgress(
      purpose,
      "model_egress_payload_unsupported",
      1,
      0,
    );
  }
  if (prototype !== Object.prototype && prototype !== null) {
    refuseModelEgress(
      purpose,
      "model_egress_payload_unsupported",
      1,
      0,
    );
  }
  return value as Record<string, unknown>;
}

export function readModelEgressField(
  purpose: ModelEgressPurpose,
  record: Record<string, unknown>,
  key: string,
) {
  let descriptor: PropertyDescriptor | undefined;
  try {
    descriptor = Object.getOwnPropertyDescriptor(record, key);
  } catch {
    return refuseModelEgress(
      purpose,
      "model_egress_payload_unsupported",
      1,
      0,
    );
  }
  if (!descriptor || !("value" in descriptor)) {
    refuseModelEgress(
      purpose,
      descriptor
        ? "model_egress_payload_unsupported"
        : "model_egress_payload_malformed",
      1,
      0,
    );
  }
  return descriptor.value;
}

export function readModelEgressArray(
  purpose: ModelEgressPurpose,
  value: unknown,
  maximum: number,
) {
  if (!Array.isArray(value)) {
    refuseModelEgress(
      purpose,
      "model_egress_payload_malformed",
      1,
      0,
    );
  }
  let lengthDescriptor: PropertyDescriptor | undefined;
  try {
    lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  } catch {
    return refuseModelEgress(
      purpose,
      "model_egress_payload_unsupported",
      1,
      0,
    );
  }
  if (
    !lengthDescriptor ||
    !("value" in lengthDescriptor) ||
    !Number.isSafeInteger(lengthDescriptor.value) ||
    lengthDescriptor.value < 0
  ) {
    refuseModelEgress(
      purpose,
      "model_egress_payload_malformed",
      1,
      0,
    );
  }
  const length = lengthDescriptor.value as number;
  assertModelEgressCollectionCount(purpose, length, maximum);

  const items: unknown[] = [];
  for (let index = 0; index < length; index += 1) {
    let descriptor: PropertyDescriptor | undefined;
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    } catch {
      return refuseModelEgress(
        purpose,
        "model_egress_payload_unsupported",
        1,
        0,
      );
    }
    if (!descriptor || !("value" in descriptor)) {
      refuseModelEgress(
        purpose,
        descriptor
          ? "model_egress_payload_unsupported"
          : "model_egress_payload_malformed",
        1,
        0,
      );
    }
    items.push(descriptor.value);
  }
  return items;
}

export function cloneBoundedModelEgressJson(
  purpose: ModelEgressPurpose,
  value: unknown,
  options: { maximumDepth?: number; maximumNodes?: number } = {},
): ModelEgressJsonValue {
  const maximumDepth = options.maximumDepth ?? 8;
  const maximumNodes = options.maximumNodes ?? 2_048;
  const ancestors = new WeakSet<object>();
  let nodes = 0;

  const clone = (input: unknown, depth: number): ModelEgressJsonValue => {
    nodes += 1;
    if (nodes > maximumNodes) {
      refuseModelEgress(
        purpose,
        "model_egress_payload_oversize",
        nodes,
        maximumNodes,
      );
    }
    if (depth > maximumDepth) {
      refuseModelEgress(
        purpose,
        "model_egress_payload_oversize",
        depth,
        maximumDepth,
      );
    }
    if (
      input === null ||
      typeof input === "string" ||
      typeof input === "boolean"
    ) {
      return input;
    }
    if (typeof input === "number") {
      if (!Number.isFinite(input)) {
        refuseModelEgress(
          purpose,
          "model_egress_payload_malformed",
          1,
          0,
        );
      }
      return input;
    }
    if (typeof input !== "object") {
      refuseModelEgress(
        purpose,
        "model_egress_payload_unsupported",
        1,
        0,
      );
    }
    if (ancestors.has(input)) {
      refuseModelEgress(
        purpose,
        "model_egress_payload_malformed",
        1,
        0,
      );
    }

    ancestors.add(input);
    try {
      if (Array.isArray(input)) {
        return readModelEgressArray(purpose, input, maximumNodes).map((item) =>
          clone(item, depth + 1),
        );
      }

      const record = requireModelEgressRecord(purpose, input);
      let keys: (string | symbol)[];
      try {
        keys = Reflect.ownKeys(record);
      } catch {
        return refuseModelEgress(
          purpose,
          "model_egress_payload_unsupported",
          1,
          0,
        );
      }
      assertModelEgressCollectionCount(purpose, keys.length, maximumNodes);
      const result: Record<string, ModelEgressJsonValue> = {};
      for (const key of keys) {
        if (typeof key !== "string") {
          refuseModelEgress(
            purpose,
            "model_egress_payload_unsupported",
            1,
            0,
          );
        }
        let descriptor: PropertyDescriptor | undefined;
        try {
          descriptor = Object.getOwnPropertyDescriptor(record, key);
        } catch {
          return refuseModelEgress(
            purpose,
            "model_egress_payload_unsupported",
            1,
            0,
          );
        }
        if (!descriptor || !("value" in descriptor)) {
          refuseModelEgress(
            purpose,
            "model_egress_payload_unsupported",
            1,
            0,
          );
        }
        if (!descriptor.enumerable) continue;
        result[key] = clone(descriptor.value, depth + 1);
      }
      return result;
    } finally {
      ancestors.delete(input);
    }
  };

  return clone(value, 0);
}

export function serializeModelEgressJson(
  purpose: ModelEgressPurpose,
  value: unknown,
  maximumBytes: number,
) {
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return refuseModelEgress(
      purpose,
      "model_egress_payload_malformed",
      1,
      0,
    );
  }
  if (typeof serialized !== "string") {
    refuseModelEgress(
      purpose,
      "model_egress_payload_unsupported",
      1,
      0,
    );
  }
  assertModelEgressTextBytes(purpose, serialized, maximumBytes);
  return serialized;
}
