const SUPPORTED_SCHEMA_KEYWORDS_V01 = new Set([
  "type",
  "properties",
  "required",
  "additionalProperties",
  "items",
  "enum",
  "anyOf",
  "minItems",
  "maxItems",
  "minLength",
  "maxLength",
  "pattern",
]);

const SUPPORTED_TYPES_V01 = new Set([
  "object",
  "array",
  "string",
  "number",
  "integer",
  "boolean",
  "null",
]);

const MAX_SCHEMA_DEPTH_V01 = 24;
const MAX_SCHEMA_NODES_V01 = 512;

export class OpenAIStrictSchemaSupportedSubsetErrorV01 extends Error {
  constructor(
    readonly code:
      | "openai_strict_schema_malformed"
      | "openai_strict_schema_unsupported_keyword",
    readonly schema_path: string,
  ) {
    super("OpenAI strict schema is outside the locally supported subset.");
    this.name = "OpenAIStrictSchemaSupportedSubsetErrorV01";
  }
}

/**
 * Validates, without changing, the deliberately narrow JSON Schema subset used
 * by the repository's OpenAI strict-output codecs. Unsupported fields are
 * refused rather than removed from the provider-visible schema.
 */
export function validateOpenAIStrictSchemaSupportedSubsetV01(
  schema: unknown,
): void {
  const state = { nodes: 0 };
  validateNodeV01(schema, "$", 0, state);
}

function validateNodeV01(
  value: unknown,
  path: string,
  depth: number,
  state: { nodes: number },
): void {
  state.nodes += 1;
  if (
    depth > MAX_SCHEMA_DEPTH_V01 ||
    state.nodes > MAX_SCHEMA_NODES_V01 ||
    !isPlainRecordV01(value)
  ) {
    malformedV01(path);
  }

  for (const keyword of Object.keys(value)) {
    if (!SUPPORTED_SCHEMA_KEYWORDS_V01.has(keyword)) {
      throw new OpenAIStrictSchemaSupportedSubsetErrorV01(
        "openai_strict_schema_unsupported_keyword",
        `${path}.${keyword}`,
      );
    }
  }

  if (value.type === undefined) {
    if (!Object.hasOwn(value, "anyOf") || Object.keys(value).length !== 1) {
      malformedV01(`${path}.type`);
    }
  } else if (
    typeof value.type !== "string" ||
    !SUPPORTED_TYPES_V01.has(value.type)
  ) {
    malformedV01(`${path}.type`);
  }

  if (value.type === "object") {
    if (
      !isPlainRecordV01(value.properties) ||
      value.additionalProperties !== false ||
      !Array.isArray(value.required)
    ) {
      malformedV01(path);
    }
    const propertyNames = Object.keys(value.properties);
    if (
      propertyNames.length === 0 ||
      propertyNames.length > 128 ||
      value.required.length !== propertyNames.length ||
      new Set(value.required).size !== value.required.length ||
      value.required.some(
        (entry) => typeof entry !== "string" || !propertyNames.includes(entry),
      )
    ) {
      malformedV01(`${path}.required`);
    }
    for (const propertyName of propertyNames) {
      validateNodeV01(
        value.properties[propertyName],
        `${path}.properties.${propertyName}`,
        depth + 1,
        state,
      );
    }
  } else if (
    Object.hasOwn(value, "properties") ||
    Object.hasOwn(value, "required") ||
    Object.hasOwn(value, "additionalProperties")
  ) {
    malformedV01(path);
  }

  if (value.type === "array") {
    if (!Object.hasOwn(value, "items")) malformedV01(`${path}.items`);
    validateNodeV01(value.items, `${path}.items`, depth + 1, state);
  } else if (Object.hasOwn(value, "items")) {
    malformedV01(`${path}.items`);
  }

  if (Object.hasOwn(value, "anyOf")) {
    if (
      !Array.isArray(value.anyOf) ||
      value.anyOf.length < 1 ||
      value.anyOf.length > 8
    ) {
      malformedV01(`${path}.anyOf`);
    }
    value.anyOf.forEach((entry, index) =>
      validateNodeV01(entry, `${path}.anyOf[${index}]`, depth + 1, state),
    );
  }

  if (Object.hasOwn(value, "enum")) {
    if (
      !Array.isArray(value.enum) ||
      value.enum.length < 1 ||
      value.enum.length > 128 ||
      value.enum.some(
        (entry) =>
          entry !== null &&
          typeof entry !== "string" &&
          typeof entry !== "number" &&
          typeof entry !== "boolean",
      )
    ) {
      malformedV01(`${path}.enum`);
    }
  }

  for (const keyword of [
    "minItems",
    "maxItems",
    "minLength",
    "maxLength",
  ]) {
    if (
      Object.hasOwn(value, keyword) &&
      (!Number.isSafeInteger(value[keyword]) || (value[keyword] as number) < 0)
    ) {
      malformedV01(`${path}.${keyword}`);
    }
  }
  if (
    typeof value.minItems === "number" &&
    typeof value.maxItems === "number" &&
    value.minItems > value.maxItems
  ) {
    malformedV01(path);
  }
  if (
    typeof value.minLength === "number" &&
    typeof value.maxLength === "number" &&
    value.minLength > value.maxLength
  ) {
    malformedV01(path);
  }
  if (
    Object.hasOwn(value, "pattern") &&
    (typeof value.pattern !== "string" || value.pattern.length > 256)
  ) {
    malformedV01(`${path}.pattern`);
  }
}

function isPlainRecordV01(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function malformedV01(path: string): never {
  throw new OpenAIStrictSchemaSupportedSubsetErrorV01(
    "openai_strict_schema_malformed",
    path,
  );
}
