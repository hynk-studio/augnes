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

const KEYWORDS_BY_TYPE_V01 = {
  object: new Set(["type", "properties", "required", "additionalProperties"]),
  array: new Set(["type", "items", "minItems", "maxItems"]),
  string: new Set(["type", "enum", "minLength", "maxLength", "pattern"]),
  number: new Set(["type"]),
  integer: new Set(["type"]),
  boolean: new Set(["type"]),
  null: new Set(["type"]),
} as const;

/** Root is level 1; every child schema reached through properties, items, or
 * anyOf advances exactly one level. */
export const OPENAI_STRICT_SCHEMA_MAX_NESTING_LEVELS_V01 = 10;
export const OPENAI_STRICT_SCHEMA_MAX_TOTAL_STRING_CHARACTERS_V01 = 120_000;
export const OPENAI_STRICT_SCHEMA_MAX_TOTAL_ENUM_VALUES_V01 = 1_000;

// Deliberately narrower than the provider's documented 5,000-property bound.
const MAX_SCHEMA_PROPERTIES_V01 = 512;
const MAX_SCHEMA_NODES_V01 = 512;
const MAX_PROPERTIES_PER_OBJECT_V01 = 128;
const MAX_ENUM_VALUES_PER_SCHEMA_V01 = 128;
const MAX_ANY_OF_BRANCHES_V01 = 8;
const MAX_LARGE_ENUM_STRING_CHARACTERS_V01 = 15_000;

type SupportedSchemaTypeV01 = keyof typeof KEYWORDS_BY_TYPE_V01;

type ValidationStateV01 = {
  nodes: number;
  properties: number;
  enum_values: number;
  total_string_characters: number;
};

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
  const state: ValidationStateV01 = {
    nodes: 0,
    properties: 0,
    enum_values: 0,
    total_string_characters: 0,
  };
  validateNodeV01(schema, "$", 1, true, state);
}

function validateNodeV01(
  value: unknown,
  path: string,
  level: number,
  root: boolean,
  state: ValidationStateV01,
): void {
  state.nodes += 1;
  if (
    level > OPENAI_STRICT_SCHEMA_MAX_NESTING_LEVELS_V01 ||
    state.nodes > MAX_SCHEMA_NODES_V01 ||
    !isPlainRecordV01(value)
  ) {
    malformedV01(path);
  }

  const keywords = Object.keys(value);
  for (const keyword of keywords) {
    addSchemaStringV01(keyword, path, state);
    if (!SUPPORTED_SCHEMA_KEYWORDS_V01.has(keyword)) {
      throw new OpenAIStrictSchemaSupportedSubsetErrorV01(
        "openai_strict_schema_unsupported_keyword",
        `${path}.${keyword}`,
      );
    }
  }

  if (root && (value.type !== "object" || Object.hasOwn(value, "anyOf"))) {
    malformedV01(Object.hasOwn(value, "anyOf") ? `${path}.anyOf` : `${path}.type`);
  }

  if (value.type === undefined) {
    if (
      root ||
      !Object.hasOwn(value, "anyOf") ||
      keywords.length !== 1
    ) {
      malformedV01(`${path}.type`);
    }
    validateAnyOfV01(value.anyOf, path, level, state);
    return;
  }

  if (
    typeof value.type !== "string" ||
    !SUPPORTED_TYPES_V01.has(value.type)
  ) {
    malformedV01(`${path}.type`);
  }
  const type = value.type as SupportedSchemaTypeV01;
  addSchemaStringV01(type, `${path}.type`, state);
  const allowedKeywords = KEYWORDS_BY_TYPE_V01[type];
  for (const keyword of keywords) {
    if (!allowedKeywords.has(keyword)) malformedV01(`${path}.${keyword}`);
  }

  if (type === "object") {
    validateObjectV01(value, path, level, state);
  } else if (type === "array") {
    validateArrayV01(value, path, level, state);
  } else if (type === "string") {
    validateStringV01(value, path, state);
  }
}

function validateObjectV01(
  value: Record<string, unknown>,
  path: string,
  level: number,
  state: ValidationStateV01,
): void {
  if (
    !isPlainRecordV01(value.properties) ||
    value.additionalProperties !== false ||
    !Array.isArray(value.required)
  ) {
    malformedV01(path);
  }
  const propertyNames = Object.keys(value.properties);
  state.properties += propertyNames.length;
  if (
    propertyNames.length === 0 ||
    propertyNames.length > MAX_PROPERTIES_PER_OBJECT_V01 ||
    state.properties > MAX_SCHEMA_PROPERTIES_V01 ||
    value.required.length !== propertyNames.length ||
    new Set(value.required).size !== value.required.length ||
    value.required.some(
      (entry) => typeof entry !== "string" || !propertyNames.includes(entry),
    )
  ) {
    malformedV01(`${path}.required`);
  }

  for (const requiredName of value.required) {
    addSchemaStringV01(requiredName as string, `${path}.required`, state);
  }
  for (const propertyName of propertyNames) {
    addSchemaStringV01(propertyName, `${path}.properties`, state);
    validateNodeV01(
      value.properties[propertyName],
      `${path}.properties.${propertyName}`,
      level + 1,
      false,
      state,
    );
  }
}

function validateArrayV01(
  value: Record<string, unknown>,
  path: string,
  level: number,
  state: ValidationStateV01,
): void {
  if (!Object.hasOwn(value, "items")) malformedV01(`${path}.items`);
  validateNonNegativeBoundsV01(value, path, "minItems", "maxItems");
  validateNodeV01(value.items, `${path}.items`, level + 1, false, state);
}

function validateStringV01(
  value: Record<string, unknown>,
  path: string,
  state: ValidationStateV01,
): void {
  validateNonNegativeBoundsV01(value, path, "minLength", "maxLength");
  if (Object.hasOwn(value, "pattern")) {
    if (typeof value.pattern !== "string" || value.pattern.length > 256) {
      malformedV01(`${path}.pattern`);
    }
    addSchemaStringV01(value.pattern, `${path}.pattern`, state);
  }
  if (!Object.hasOwn(value, "enum")) return;
  if (
    !Array.isArray(value.enum) ||
    value.enum.length < 1 ||
    value.enum.length > MAX_ENUM_VALUES_PER_SCHEMA_V01 ||
    value.enum.some((entry) => typeof entry !== "string") ||
    new Set(value.enum).size !== value.enum.length
  ) {
    malformedV01(`${path}.enum`);
  }

  state.enum_values += value.enum.length;
  if (state.enum_values > OPENAI_STRICT_SCHEMA_MAX_TOTAL_ENUM_VALUES_V01) {
    malformedV01(`${path}.enum`);
  }
  let enumStringCharacters = 0;
  for (const entry of value.enum) {
    const length = schemaStringLengthV01(entry as string);
    enumStringCharacters += length;
    addSchemaStringV01(entry as string, `${path}.enum`, state);
  }
  if (
    value.enum.length > 250 &&
    enumStringCharacters > MAX_LARGE_ENUM_STRING_CHARACTERS_V01
  ) {
    malformedV01(`${path}.enum`);
  }
}

function validateAnyOfV01(
  value: unknown,
  path: string,
  level: number,
  state: ValidationStateV01,
): void {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > MAX_ANY_OF_BRANCHES_V01
  ) {
    malformedV01(`${path}.anyOf`);
  }
  value.forEach((entry, index) =>
    validateNodeV01(
      entry,
      `${path}.anyOf[${index}]`,
      level + 1,
      false,
      state,
    ),
  );
}

function validateNonNegativeBoundsV01(
  value: Record<string, unknown>,
  path: string,
  minimumKeyword: "minItems" | "minLength",
  maximumKeyword: "maxItems" | "maxLength",
): void {
  for (const keyword of [minimumKeyword, maximumKeyword]) {
    if (
      Object.hasOwn(value, keyword) &&
      (!Number.isSafeInteger(value[keyword]) || (value[keyword] as number) < 0)
    ) {
      malformedV01(`${path}.${keyword}`);
    }
  }
  if (
    typeof value[minimumKeyword] === "number" &&
    typeof value[maximumKeyword] === "number" &&
    value[minimumKeyword] > value[maximumKeyword]
  ) {
    malformedV01(path);
  }
}

function addSchemaStringV01(
  value: string,
  path: string,
  state: ValidationStateV01,
): void {
  state.total_string_characters += schemaStringLengthV01(value);
  if (
    state.total_string_characters >
    OPENAI_STRICT_SCHEMA_MAX_TOTAL_STRING_CHARACTERS_V01
  ) {
    malformedV01(path);
  }
}

function schemaStringLengthV01(value: string): number {
  return Array.from(value).length;
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
