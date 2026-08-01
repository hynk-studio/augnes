import { createHash } from "node:crypto";

const GRAMMAR_VERSION = "browser_verification_static_grammar.v1";
const RESULT_MUTATION_OPERATORS = new Set([
  "=",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "**=",
  "&&=",
  "||=",
  "??=",
  "++",
  "--",
]);
const SUPPORTED_DIRECT_RESULT_ASSIGNMENT_OPERATORS = new Set(["=", "+="]);
const MULTI_CHARACTER_TOKENS = [
  ">>>=",
  "===",
  "!==",
  "**=",
  "&&=",
  "||=",
  "??=",
  ">>>",
  "...",
  "=>",
  "==",
  "!=",
  "<=",
  ">=",
  "++",
  "--",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "**",
  "&&",
  "||",
  "??",
  "?.",
  "<<",
  ">>",
];
const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/u;
const INVENTORY_IDENTIFIER_PATTERN = /^[a-z0-9_]+$/u;
const SCOPE_IDENTIFIER_PATTERN = /^[a-z0-9_-]+$/u;

export function extractBrowserVerificationStaticMetadata(source) {
  if (typeof source !== "string" || source.length === 0) {
    throw metadataError(
      "browser_verification_source_empty",
      "browser verification source must be non-empty",
    );
  }

  const lexical = tokenizeJavaScript(source);
  if (lexical.nextIndex !== source.length) {
    throw metadataError(
      "browser_verification_lexical_scan_incomplete",
      "browser verification lexical scan did not consume the source",
    );
  }
  assertNoSensitiveTemplateExpressionSyntax(
    source,
    lexical.templateExpressionTokenGroups,
  );

  const tokens = lexical.tokens;
  const resultSurface = extractResultSurface(source, tokens);
  const validationScopes = extractValidationScopes(source, tokens);
  const recordCalls = extractUnqualifiedLiteralCalls({
    source,
    tokens,
    name: "record",
    identifierPattern: INVENTORY_IDENTIFIER_PATTERN,
    requireSingleArgument: true,
  });
  const phaseCalls = extractUnqualifiedLiteralCalls({
    source,
    tokens,
    name: "runPhase",
    identifierPattern: INVENTORY_IDENTIFIER_PATTERN,
    requireFollowingComma: true,
  });
  const longWaitCalls = extractUnqualifiedLiteralCalls({
    source,
    tokens,
    name: "recordLongWait",
    identifierPattern: INVENTORY_IDENTIFIER_PATTERN,
    requireFollowingComma: true,
  });
  const timingStartCalls = extractTimingLiteralCalls({
    source,
    tokens,
    method: "start",
    identifierPattern: INVENTORY_IDENTIFIER_PATTERN,
  });
  const timingDurationCalls = extractTimingDurationCalls(source, tokens);
  const timingMilestoneCalls = extractTimingLiteralCalls({
    source,
    tokens,
    method: "milestone",
    identifierPattern: null,
    requireSingleArgument: true,
  });
  const assertionCallCount = countAssertionCalls(tokens);

  const recordMarkers = recordCalls.values;
  const phaseCallIds = phaseCalls.values;
  const timingKinds = uniqueInOrder([
    ...timingStartCalls.values,
    ...timingDurationCalls.literalValues,
    ...longWaitCalls.values,
  ]);

  return {
    grammar_version: GRAMMAR_VERSION,
    source_sha256: createHash("sha256").update(source).digest("hex"),
    declared_result_fields: resultSurface.declaredFields,
    dynamically_declared_result_fields: resultSurface.dynamicFields,
    output_result_fields: uniqueInOrder([
      ...resultSurface.declaredFields,
      ...resultSurface.dynamicFields,
    ]),
    result_mutation_counts: resultSurface.mutationCounts,
    scopes: validationScopes.values,
    phase_call_ids: phaseCallIds,
    phase_ids: uniqueInOrder(phaseCallIds),
    record_markers: recordMarkers,
    timing_kinds: timingKinds,
    timing_milestones: timingMilestoneCalls.values,
    raw_call_counts: {
      record: recordCalls.rawCount,
      run_phase: phaseCalls.rawCount,
      timing_start: timingStartCalls.rawCount,
      timing_duration: timingDurationCalls.rawCount,
      timing_duration_forwarded: timingDurationCalls.forwardedCount,
      timing_milestone: timingMilestoneCalls.rawCount,
      record_long_wait: longWaitCalls.rawCount,
      validation_scope_declaration: validationScopes.rawCount,
    },
    assertion_call_count: assertionCallCount,
  };
}

export function hashStringInventory(values) {
  return createHash("sha256")
    .update(JSON.stringify([...values].sort(compareCodeUnits)))
    .digest("hex");
}

function extractResultSurface(source, tokens) {
  const declarations = [];
  for (let index = 0; index < tokens.length - 3; index += 1) {
    if (
      tokens[index].value === "const" &&
      tokens[index + 1].value === "result" &&
      tokens[index + 2].value === "=" &&
      tokens[index + 3].value === "{"
    ) {
      declarations.push({ resultIndex: index + 1, openIndex: index + 3 });
    }
  }
  if (declarations.length !== 1) {
    throw metadataError(
      "browser_verification_result_declaration_unsupported",
      `expected exactly one canonical const result object declaration; observed ${declarations.length}`,
    );
  }

  const declaration = declarations[0];
  const closeIndex = findMatchingToken(tokens, declaration.openIndex, "{", "}");
  const declaredFields = extractCanonicalObjectKeys(
    source,
    tokens,
    declaration.openIndex,
    closeIndex,
  );
  if (declaredFields.length !== new Set(declaredFields).size) {
    throw metadataError(
      "browser_verification_result_initializer_duplicate_field",
      "result initializer fields must be unique",
    );
  }

  const declaredSet = new Set(declaredFields);
  const dynamicFields = [];
  const referencedFields = [];
  const mutationCounts = {
    direct_property_assignment: 0,
    dynamic_field_assignment: 0,
    nested_collection_mutation: 0,
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type !== "identifier" || token.value !== "result") continue;
    if (index === declaration.resultIndex) continue;

    const previous = tokens[index - 1] ?? null;
    const next = tokens[index + 1] ?? null;
    if (previous?.value === "." || previous?.value === "?.") continue;
    if (next?.value === ":") continue;
    if (previous?.value === "...") {
      throw unsupportedResultMutation(source, token, "object spread");
    }
    if (previous?.value === "=" && next?.value !== ".") {
      throw unsupportedResultMutation(source, token, "result alias or destructuring source");
    }
    if (RESULT_MUTATION_OPERATORS.has(next?.value)) {
      throw unsupportedResultMutation(source, token, "whole-result reassignment");
    }

    if (next?.value === "[") {
      const closeBracket = findMatchingToken(tokens, index + 1, "[", "]");
      const afterBracket = tokens[closeBracket + 1] ?? null;
      if (
        RESULT_MUTATION_OPERATORS.has(afterBracket?.value) ||
        afterBracket?.value === "." ||
        afterBracket?.value === "?."
      ) {
        throw unsupportedResultMutation(
          source,
          token,
          "top-level bracket or computed property mutation",
        );
      }
      continue;
    }

    if (next?.value !== "." && next?.value !== "?.") {
      if (isKnownBareResultRead(tokens, index)) continue;
      throw unsupportedResultMutation(
        source,
        token,
        "bare result reference or helper mutation",
      );
    }

    const field = tokens[index + 2];
    if (field?.type !== "identifier") {
      throw unsupportedResultMutation(source, token, "non-identifier result property");
    }
    referencedFields.push(field.value);
    const afterField = tokens[index + 3] ?? null;

    if (RESULT_MUTATION_OPERATORS.has(afterField?.value)) {
      if (!isLineLeading(source, token.start)) {
        throw unsupportedResultMutation(
          source,
          token,
          "non-line-leading direct assignment",
        );
      }
      if (!SUPPORTED_DIRECT_RESULT_ASSIGNMENT_OPERATORS.has(afterField.value)) {
        throw unsupportedResultMutation(
          source,
          token,
          "direct assignments support only the established equals and plus-equals operators",
        );
      }
      mutationCounts.direct_property_assignment += 1;
      if (!declaredSet.has(field.value)) {
        if (afterField.value !== "=") {
          throw unsupportedResultMutation(
            source,
            token,
            "new dynamic fields require the established equals assignment",
          );
        }
        dynamicFields.push(field.value);
        mutationCounts.dynamic_field_assignment += 1;
      }
      continue;
    }

    if (afterField?.value === "[") {
      const closeBracket = findMatchingToken(tokens, index + 3, "[", "]");
      const afterBracket = tokens[closeBracket + 1] ?? null;
      if (RESULT_MUTATION_OPERATORS.has(afterBracket?.value)) {
        if (
          afterBracket.value !== "=" ||
          !declaredSet.has(field.value) ||
          !isLineLeading(source, token.start)
        ) {
          throw unsupportedResultMutation(
            source,
            token,
            "unsupported nested computed mutation",
          );
        }
        mutationCounts.nested_collection_mutation += 1;
      } else if (afterBracket?.value === "." || afterBracket?.value === "?.") {
        throw unsupportedResultMutation(
          source,
          token,
          "unsupported mutation after nested computed access",
        );
      }
      continue;
    }

    if (afterField?.value === "." || afterField?.value === "?.") {
      const method = tokens[index + 4];
      const openCall = tokens[index + 5];
      if (method?.type !== "identifier" || openCall?.value !== "(") {
        throw unsupportedResultMutation(
          source,
          token,
          "unsupported nested result property access",
        );
      }
      if (method.value === "push") {
        if (!declaredSet.has(field.value) || !isLineLeading(source, token.start)) {
          throw unsupportedResultMutation(
            source,
            token,
            "unsupported nested collection push",
          );
        }
        mutationCounts.nested_collection_mutation += 1;
      } else if (method.value !== "includes") {
        throw unsupportedResultMutation(
          source,
          token,
          `unsupported result collection method ${method.value}`,
        );
      }
      continue;
    }

    if (afterField?.value === "(") {
      throw unsupportedResultMutation(source, token, "direct result field call");
    }
    if (isDestructuringAssignmentTarget(tokens, index, index + 2)) {
      throw unsupportedResultMutation(source, token, "destructuring assignment target");
    }
  }

  const uniqueDynamicFields = uniqueInOrder(dynamicFields);
  const outputSet = new Set([...declaredFields, ...uniqueDynamicFields]);
  for (const field of referencedFields) {
    if (!outputSet.has(field)) {
      throw metadataError(
        "browser_verification_result_field_unclassified_reference",
        `result field ${field} is read or mutated without declaration or canonical dynamic assignment`,
      );
    }
  }

  assertNoIndirectResultMutationHelpers(source, tokens);
  return { declaredFields, dynamicFields: uniqueDynamicFields, mutationCounts };
}

function extractCanonicalObjectKeys(source, tokens, openIndex, closeIndex) {
  const keys = [];
  let index = openIndex + 1;
  while (index < closeIndex) {
    if (tokens[index].value === ",") {
      index += 1;
      continue;
    }
    const key = tokens[index];
    const colon = tokens[index + 1];
    if (key.type !== "identifier" || colon?.value !== ":") {
      throw metadataErrorAt(
        source,
        key,
        "browser_verification_result_initializer_unsupported",
        "result initializer supports only unquoted identifier keys followed by a colon; spreads, computed keys, shorthand, and methods are unsupported",
      );
    }
    keys.push(key.value);
    index += 2;
    let parenDepth = 0;
    let bracketDepth = 0;
    let braceDepth = 0;
    while (index < closeIndex) {
      const value = tokens[index].value;
      if (value === "(" ) parenDepth += 1;
      else if (value === ")") parenDepth -= 1;
      else if (value === "[") bracketDepth += 1;
      else if (value === "]") bracketDepth -= 1;
      else if (value === "{") braceDepth += 1;
      else if (value === "}") braceDepth -= 1;
      if (
        value === "," &&
        parenDepth === 0 &&
        bracketDepth === 0 &&
        braceDepth === 0
      ) {
        index += 1;
        break;
      }
      index += 1;
    }
  }
  return keys;
}

function assertNoIndirectResultMutationHelpers(source, tokens) {
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.value === "..." && tokens[index + 1]?.value === "result") {
      throw unsupportedResultMutation(source, tokens[index + 1], "object spread");
    }
    const callPath = callPathAt(tokens, index);
    if (
      [
        "Object.assign",
        "Object.defineProperty",
        "Object.defineProperties",
        "Object.setPrototypeOf",
        "Reflect.defineProperty",
        "Reflect.set",
        "defineProperty",
      ].includes(callPath)
    ) {
      const closeIndex = findMatchingToken(tokens, index, "(", ")");
      if (
        tokens
          .slice(index + 1, closeIndex)
          .some((candidate) => candidate.value === "result")
      ) {
        throw unsupportedResultMutation(
          source,
          tokens[index + 1],
          `${callPath} indirect mutation`,
        );
      }
    }
  }
}

function extractValidationScopes(source, tokens) {
  const declarationCount = tokens.filter(
    (token, index) =>
      token.value === "const" &&
      tokens[index + 1]?.value === "VALIDATION_SCOPE" &&
      tokens[index + 2]?.value === "=",
  ).length;
  if (declarationCount !== 1) {
    throw metadataError(
      "browser_verification_validation_scope_declaration_unsupported",
      `expected one const VALIDATION_SCOPE declaration; observed ${declarationCount}`,
    );
  }

  const validationAssertions = [];
  for (let index = 0; index < tokens.length - 1; index += 1) {
    if (tokens[index].value !== "assert" || tokens[index + 1]?.value !== "(") {
      continue;
    }
    const closeIndex = findMatchingToken(tokens, index + 1, "(", ")");
    if (
      tokens
        .slice(index + 2, closeIndex)
        .some((token) => token.value === "VALIDATION_SCOPE")
    ) {
      validationAssertions.push({ openIndex: index + 1, closeIndex });
    }
  }
  if (validationAssertions.length !== 1) {
    throw metadataError(
      "browser_verification_validation_scope_declaration_unsupported",
      `expected one validation-scope assertion; observed ${validationAssertions.length}`,
    );
  }

  const assertion = validationAssertions[0];
  const openArray = assertion.openIndex + 1;
  if (tokens[openArray]?.value !== "[") {
    throw metadataErrorAt(
      source,
      tokens[openArray],
      "browser_verification_validation_scope_declaration_unsupported",
      "validation scope assertion must begin with an inline literal array",
    );
  }
  const closeArray = findMatchingToken(tokens, openArray, "[", "]");
  if (
    tokens[closeArray + 1]?.value !== "." ||
    tokens[closeArray + 2]?.value !== "includes" ||
    tokens[closeArray + 3]?.value !== "(" ||
    tokens[closeArray + 4]?.value !== "VALIDATION_SCOPE" ||
    tokens[closeArray + 5]?.value !== ")"
  ) {
    throw metadataErrorAt(
      source,
      tokens[openArray],
      "browser_verification_validation_scope_declaration_unsupported",
      "validation scope assertion must use inlineLiteralArray.includes(VALIDATION_SCOPE)",
    );
  }
  const values = extractCommaSeparatedCanonicalStrings(
    source,
    tokens,
    openArray + 1,
    closeArray,
    SCOPE_IDENTIFIER_PATTERN,
    "browser_verification_validation_scope_literal_unsupported",
  );
  if (values.length === 0 || values.length !== new Set(values).size) {
    throw metadataError(
      "browser_verification_validation_scope_values_invalid",
      "validation scope literals must be non-empty and unique",
    );
  }
  return { values, rawCount: 1 };
}

function extractUnqualifiedLiteralCalls({
  source,
  tokens,
  name,
  identifierPattern,
  requireSingleArgument = false,
  requireFollowingComma = false,
}) {
  const values = [];
  let rawCount = 0;
  for (let index = 0; index < tokens.length - 1; index += 1) {
    if (
      tokens[index].type !== "identifier" ||
      tokens[index].value !== name ||
      tokens[index + 1]?.value !== "(" ||
      tokens[index - 1]?.value === "function" ||
      tokens[index - 1]?.value === "." ||
      tokens[index - 1]?.value === "?."
    ) {
      continue;
    }
    rawCount += 1;
    const closeIndex = findMatchingToken(tokens, index + 1, "(", ")");
    const firstArgument = extractFirstArgument(tokens, index + 1, closeIndex);
    const literal = requireCanonicalDoubleString(
      source,
      firstArgument.tokens,
      identifierPattern,
      `browser_verification_${toSnakeCase(name)}_argument_unsupported`,
    );
    if (
      requireSingleArgument &&
      firstArgument.delimiter !== ")" &&
      !(
        firstArgument.delimiter === "," &&
        firstArgument.delimiterIndex + 1 === closeIndex
      )
    ) {
      throw metadataErrorAt(
        source,
        tokens[index],
        `browser_verification_${toSnakeCase(name)}_argument_unsupported`,
        `${name} supports exactly one canonical double-quoted literal argument`,
      );
    }
    if (requireFollowingComma && firstArgument.delimiter !== ",") {
      throw metadataErrorAt(
        source,
        tokens[index],
        `browser_verification_${toSnakeCase(name)}_argument_unsupported`,
        `${name} requires a canonical double-quoted literal first argument followed by a comma`,
      );
    }
    values.push(literal);
  }
  return { values, rawCount };
}

function extractTimingLiteralCalls({
  source,
  tokens,
  method,
  identifierPattern,
  requireSingleArgument = false,
}) {
  const values = [];
  let rawCount = 0;
  for (let index = 0; index < tokens.length - 3; index += 1) {
    if (
      tokens[index].value !== "timing" ||
      tokens[index + 1]?.value !== "." ||
      tokens[index + 2]?.value !== method
    ) {
      continue;
    }
    if (tokens[index + 3]?.value !== "(") {
      throw metadataErrorAt(
        source,
        tokens[index],
        "browser_verification_timing_reference_unsupported",
        `timing.${method} must be invoked directly and may not be aliased`,
      );
    }
    rawCount += 1;
    const closeIndex = findMatchingToken(tokens, index + 3, "(", ")");
    const firstArgument = extractFirstArgument(tokens, index + 3, closeIndex);
    const literal = requireCanonicalDoubleString(
      source,
      firstArgument.tokens,
      identifierPattern,
      `browser_verification_timing_${method}_argument_unsupported`,
    );
    if (
      requireSingleArgument &&
      firstArgument.delimiter !== ")" &&
      !(
        firstArgument.delimiter === "," &&
        firstArgument.delimiterIndex + 1 === closeIndex
      )
    ) {
      throw metadataErrorAt(
        source,
        tokens[index],
        `browser_verification_timing_${method}_argument_unsupported`,
        `timing.${method} supports exactly one canonical double-quoted literal argument`,
      );
    }
    values.push(literal);
  }
  return { values, rawCount };
}

function extractTimingDurationCalls(source, tokens) {
  const literalValues = [];
  let rawCount = 0;
  let forwardedCount = 0;
  const forwardingRange = findRecordLongWaitForwardingRange(source, tokens);
  for (let index = 0; index < tokens.length - 3; index += 1) {
    if (
      tokens[index].value !== "timing" ||
      tokens[index + 1]?.value !== "." ||
      tokens[index + 2]?.value !== "duration"
    ) {
      continue;
    }
    if (tokens[index + 3]?.value !== "(") {
      throw metadataErrorAt(
        source,
        tokens[index],
        "browser_verification_timing_reference_unsupported",
        "timing.duration must be invoked directly and may not be aliased",
      );
    }
    rawCount += 1;
    const closeIndex = findMatchingToken(tokens, index + 3, "(", ")");
    const firstArgument = extractFirstArgument(tokens, index + 3, closeIndex);
    if (
      firstArgument.tokens.length === 1 &&
      firstArgument.tokens[0].type === "identifier" &&
      firstArgument.tokens[0].value === "kind" &&
      index > forwardingRange.openIndex &&
      index < forwardingRange.closeIndex
    ) {
      forwardedCount += 1;
      continue;
    }
    literalValues.push(
      requireCanonicalDoubleString(
        source,
        firstArgument.tokens,
        INVENTORY_IDENTIFIER_PATTERN,
        "browser_verification_timing_duration_argument_unsupported",
      ),
    );
  }
  if (forwardedCount !== 1) {
    throw metadataError(
      "browser_verification_timing_duration_forwarding_unsupported",
      `expected exactly one timing.duration(kind, ...) forwarding call inside recordLongWait; observed ${forwardedCount}`,
    );
  }
  return { literalValues, rawCount, forwardedCount };
}

function findRecordLongWaitForwardingRange(source, tokens) {
  const candidates = [];
  for (let index = 0; index < tokens.length - 8; index += 1) {
    if (
      tokens[index].value === "function" &&
      tokens[index + 1]?.value === "recordLongWait" &&
      tokens[index + 2]?.value === "(" &&
      tokens[index + 3]?.value === "kind" &&
      tokens[index + 4]?.value === "," &&
      tokens[index + 5]?.value === "label" &&
      tokens[index + 6]?.value === "," &&
      tokens[index + 7]?.value === "startedAt" &&
      tokens[index + 8]?.value === ")" &&
      tokens[index + 9]?.value === "{"
    ) {
      candidates.push({
        openIndex: index + 9,
        closeIndex: findMatchingToken(tokens, index + 9, "{", "}"),
      });
    }
  }
  if (candidates.length !== 1) {
    throw metadataError(
      "browser_verification_record_long_wait_forwarder_unsupported",
      `expected one canonical recordLongWait(kind, label, startedAt) helper; observed ${candidates.length}`,
    );
  }
  return candidates[0];
}

function extractFirstArgument(tokens, openIndex, closeIndex) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = openIndex + 1; index < closeIndex; index += 1) {
    const value = tokens[index].value;
    if (value === "(") parenDepth += 1;
    else if (value === ")") parenDepth -= 1;
    else if (value === "[") bracketDepth += 1;
    else if (value === "]") bracketDepth -= 1;
    else if (value === "{") braceDepth += 1;
    else if (value === "}") braceDepth -= 1;
    if (
      value === "," &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0
    ) {
      return {
        tokens: tokens.slice(openIndex + 1, index),
        delimiter: ",",
        delimiterIndex: index,
      };
    }
  }
  return {
    tokens: tokens.slice(openIndex + 1, closeIndex),
    delimiter: ")",
    delimiterIndex: closeIndex,
  };
}

function requireCanonicalDoubleString(
  source,
  argumentTokens,
  valuePattern,
  errorCode,
) {
  if (
    argumentTokens.length !== 1 ||
    argumentTokens[0].type !== "string" ||
    argumentTokens[0].quote !== '"' ||
    argumentTokens[0].hasEscape ||
    (valuePattern !== null && !valuePattern.test(argumentTokens[0].value))
  ) {
    throw metadataErrorAt(
      source,
      argumentTokens[0],
      errorCode,
      "supported extraction calls require one unescaped canonical double-quoted literal identifier",
    );
  }
  return argumentTokens[0].value;
}

function extractCommaSeparatedCanonicalStrings(
  source,
  tokens,
  startIndex,
  endIndex,
  valuePattern,
  errorCode,
) {
  const values = [];
  let expectValue = true;
  for (let index = startIndex; index < endIndex; index += 1) {
    const token = tokens[index];
    if (expectValue) {
      values.push(
        requireCanonicalDoubleString(source, [token], valuePattern, errorCode),
      );
      expectValue = false;
    } else if (token.value === ",") {
      expectValue = true;
    } else {
      throw metadataErrorAt(
        source,
        token,
        errorCode,
        "scope literals must be comma-separated canonical double-quoted strings",
      );
    }
  }
  if (expectValue && values.length > 0) {
    throw metadataError(
      errorCode,
      "scope literal array may not end with an unbound comma",
    );
  }
  return values;
}

function countAssertionCalls(tokens) {
  let count = 0;
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index].value !== "assert") continue;
    if (tokens[index + 1]?.value === "(") count += 1;
    else if (
      tokens[index + 1]?.value === "." &&
      tokens[index + 2]?.type === "identifier" &&
      tokens[index + 3]?.value === "("
    ) {
      count += 1;
    }
  }
  return count;
}

function assertNoSensitiveTemplateExpressionSyntax(source, groups) {
  for (const tokens of groups) {
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];
      if (
        ["record", "runPhase", "recordLongWait"].includes(token.value) &&
        tokens[index + 1]?.value === "(" &&
        tokens[index - 1]?.value !== "." &&
        tokens[index - 1]?.value !== "?."
      ) {
        throw metadataErrorAt(
          source,
          token,
          "browser_verification_template_expression_call_unsupported",
          `${token.value} calls inside template interpolation are unsupported and may not disappear from extraction`,
        );
      }
      if (
        token.value === "timing" &&
        tokens[index + 1]?.value === "." &&
        ["start", "duration", "milestone"].includes(tokens[index + 2]?.value)
      ) {
        throw metadataErrorAt(
          source,
          token,
          "browser_verification_template_expression_call_unsupported",
          "timing extraction calls inside template interpolation are unsupported",
        );
      }
      if (
        token.value === "result" &&
        (templateResultReferenceMutates(tokens, index) ||
          (tokens[index + 1]?.value !== "." &&
            tokens[index + 1]?.value !== "?." &&
            tokens[index + 1]?.value !== "[" &&
            !isKnownBareResultRead(tokens, index)))
      ) {
        throw unsupportedResultMutation(
          source,
          token,
          "template-interpolation result mutation",
        );
      }
    }
  }
}

function templateResultReferenceMutates(tokens, index) {
  const next = tokens[index + 1] ?? null;
  if (RESULT_MUTATION_OPERATORS.has(next?.value)) return true;
  if (next?.value === "[") {
    const close = findMatchingToken(tokens, index + 1, "[", "]");
    return RESULT_MUTATION_OPERATORS.has(tokens[close + 1]?.value);
  }
  if (next?.value === "." || next?.value === "?.") {
    const afterField = tokens[index + 3] ?? null;
    if (RESULT_MUTATION_OPERATORS.has(afterField?.value)) return true;
    if (afterField?.value === "[") {
      const close = findMatchingToken(tokens, index + 3, "[", "]");
      return RESULT_MUTATION_OPERATORS.has(tokens[close + 1]?.value);
    }
    if (
      (afterField?.value === "." || afterField?.value === "?.") &&
      tokens[index + 4]?.value === "push"
    ) {
      return true;
    }
  }
  return tokens[index - 1]?.value === "..." || tokens[index - 1]?.value === "=";
}

function tokenizeJavaScript(source, startIndex = 0, stopOnRightBrace = false) {
  const tokens = [];
  const templateExpressionTokenGroups = [];
  let index = startIndex;
  let braceDepth = 0;
  while (index < source.length) {
    const character = source[index];
    if (stopOnRightBrace && character === "}" && braceDepth === 0) {
      return { tokens, templateExpressionTokenGroups, nextIndex: index + 1 };
    }
    if (/\s/u.test(character)) {
      index += 1;
      continue;
    }
    if (index === 0 && source.startsWith("#!", index)) {
      index = skipLine(source, index + 2);
      continue;
    }
    if (source.startsWith("//", index)) {
      index = skipLine(source, index + 2);
      continue;
    }
    if (source.startsWith("/*", index)) {
      const close = source.indexOf("*/", index + 2);
      if (close < 0) {
        throw metadataErrorAtOffset(
          source,
          index,
          "browser_verification_unterminated_comment",
          "unterminated block comment",
        );
      }
      index = close + 2;
      continue;
    }
    if (character === '"' || character === "'") {
      const stringToken = scanQuotedString(source, index, character);
      tokens.push(stringToken);
      index = stringToken.end;
      continue;
    }
    if (character === "`") {
      const template = scanTemplateLiteral(source, index);
      tokens.push(template.token);
      templateExpressionTokenGroups.push(
        ...template.templateExpressionTokenGroups,
      );
      index = template.nextIndex;
      continue;
    }
    if (isIdentifierStart(character)) {
      const end = scanIdentifierEnd(source, index + 1);
      tokens.push({
        type: "identifier",
        value: source.slice(index, end),
        raw: source.slice(index, end),
        start: index,
        end,
      });
      index = end;
      continue;
    }
    if (/[0-9]/u.test(character)) {
      const end = scanNumberEnd(source, index + 1);
      tokens.push({
        type: "number",
        value: source.slice(index, end),
        raw: source.slice(index, end),
        start: index,
        end,
      });
      index = end;
      continue;
    }
    if (character === "/" && canStartRegex(tokens.at(-1))) {
      const regexToken = scanRegexLiteral(source, index);
      tokens.push(regexToken);
      index = regexToken.end;
      continue;
    }
    const multi = MULTI_CHARACTER_TOKENS.find((value) =>
      source.startsWith(value, index),
    );
    const value = multi ?? character;
    tokens.push({
      type: "punctuation",
      value,
      raw: value,
      start: index,
      end: index + value.length,
    });
    if (value === "{") braceDepth += 1;
    else if (value === "}") braceDepth -= 1;
    if (braceDepth < 0) {
      throw metadataErrorAtOffset(
        source,
        index,
        "browser_verification_unbalanced_brace",
        "unbalanced closing brace",
      );
    }
    index += value.length;
  }
  if (stopOnRightBrace) {
    throw metadataErrorAtOffset(
      source,
      startIndex,
      "browser_verification_unterminated_template_expression",
      "unterminated template interpolation expression",
    );
  }
  return { tokens, templateExpressionTokenGroups, nextIndex: index };
}

function scanQuotedString(source, start, quote) {
  let index = start + 1;
  let hasEscape = false;
  while (index < source.length) {
    const character = source[index];
    if (character === "\\") {
      hasEscape = true;
      index += 2;
      continue;
    }
    if (character === quote) {
      return {
        type: "string",
        value: source.slice(start + 1, index),
        raw: source.slice(start, index + 1),
        quote,
        hasEscape,
        start,
        end: index + 1,
      };
    }
    if (character === "\n" || character === "\r") {
      throw metadataErrorAtOffset(
        source,
        start,
        "browser_verification_unterminated_string",
        "newline in quoted string literal",
      );
    }
    index += 1;
  }
  throw metadataErrorAtOffset(
    source,
    start,
    "browser_verification_unterminated_string",
    "unterminated quoted string literal",
  );
}

function scanTemplateLiteral(source, start) {
  let index = start + 1;
  const groups = [];
  let hasInterpolation = false;
  while (index < source.length) {
    if (source[index] === "\\") {
      index += 2;
      continue;
    }
    if (source[index] === "`") {
      return {
        token: {
          type: "template",
          value: source.slice(start + 1, index),
          raw: source.slice(start, index + 1),
          hasInterpolation,
          start,
          end: index + 1,
        },
        templateExpressionTokenGroups: groups,
        nextIndex: index + 1,
      };
    }
    if (source.startsWith("${", index)) {
      hasInterpolation = true;
      const expression = tokenizeJavaScript(source, index + 2, true);
      groups.push(expression.tokens, ...expression.templateExpressionTokenGroups);
      index = expression.nextIndex;
      continue;
    }
    index += 1;
  }
  throw metadataErrorAtOffset(
    source,
    start,
    "browser_verification_unterminated_template",
    "unterminated template literal",
  );
}

function scanRegexLiteral(source, start) {
  let index = start + 1;
  let inCharacterClass = false;
  while (index < source.length) {
    const character = source[index];
    if (character === "\\") {
      index += 2;
      continue;
    }
    if (character === "[") inCharacterClass = true;
    else if (character === "]") inCharacterClass = false;
    else if (character === "/" && !inCharacterClass) {
      index += 1;
      while (/[A-Za-z]/u.test(source[index] ?? "")) index += 1;
      return {
        type: "regex",
        value: source.slice(start, index),
        raw: source.slice(start, index),
        start,
        end: index,
      };
    } else if (character === "\n" || character === "\r") {
      break;
    }
    index += 1;
  }
  throw metadataErrorAtOffset(
    source,
    start,
    "browser_verification_unterminated_regex",
    "unterminated regular expression literal",
  );
}

function canStartRegex(previous) {
  if (!previous) return true;
  if (
    previous.type === "identifier" &&
    ["return", "throw", "case", "delete", "void", "typeof", "instanceof", "in", "of", "await", "yield"].includes(previous.value)
  ) {
    return true;
  }
  return [
    "(",
    "[",
    "{",
    ",",
    ";",
    ":",
    "=",
    "=>",
    "!",
    "~",
    "?",
    "+",
    "-",
    "*",
    "%",
    "&&",
    "||",
    "??",
  ].includes(previous.value);
}

function findMatchingToken(tokens, openIndex, openValue, closeValue) {
  if (tokens[openIndex]?.value !== openValue) {
    throw metadataError(
      "browser_verification_balanced_token_expected",
      `expected ${openValue} at token ${openIndex}`,
    );
  }
  let depth = 0;
  for (let index = openIndex; index < tokens.length; index += 1) {
    if (tokens[index].value === openValue) depth += 1;
    else if (tokens[index].value === closeValue) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw metadataError(
    "browser_verification_unbalanced_token",
    `missing ${closeValue} for ${openValue} at token ${openIndex}`,
  );
}

function isDestructuringAssignmentTarget(tokens, resultIndex, fieldIndex) {
  for (let openIndex = resultIndex - 1; openIndex >= 0; openIndex -= 1) {
    const open = tokens[openIndex].value;
    if (open === ";") return false;
    if (open !== "{" && open !== "[") continue;
    const closeValue = open === "{" ? "}" : "]";
    const closeIndex = findMatchingToken(tokens, openIndex, open, closeValue);
    return closeIndex > fieldIndex && tokens[closeIndex + 1]?.value === "=";
  }
  return false;
}

function isKnownBareResultRead(tokens, index) {
  if (tokens[index - 1]?.value !== "(") return false;
  return callPathAt(tokens, index - 1) === "JSON.stringify";
}

function callPathAt(tokens, openIndex) {
  if (tokens[openIndex]?.value !== "(") return null;
  const name = tokens[openIndex - 1];
  if (name?.type !== "identifier") return null;
  if (tokens[openIndex - 2]?.value !== ".") return name.value;
  const owner = tokens[openIndex - 3];
  return owner?.type === "identifier" ? `${owner.value}.${name.value}` : null;
}

function isLineLeading(source, offset) {
  const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
  return /^\s*$/u.test(source.slice(lineStart, offset));
}

function skipLine(source, index) {
  const end = source.indexOf("\n", index);
  return end < 0 ? source.length : end + 1;
}

function isIdentifierStart(character) {
  return /[A-Za-z_$]/u.test(character);
}

function scanIdentifierEnd(source, start) {
  let index = start;
  while (/[A-Za-z0-9_$]/u.test(source[index] ?? "")) index += 1;
  return index;
}

function scanNumberEnd(source, start) {
  let index = start;
  while (/[A-Za-z0-9_.]/u.test(source[index] ?? "")) index += 1;
  return index;
}

function unsupportedResultMutation(source, token, mechanism) {
  return metadataErrorAt(
    source,
    token,
    "browser_verification_result_mutation_unsupported",
    `unsupported result mutation mechanism: ${mechanism}`,
  );
}

function metadataErrorAt(source, token, code, message) {
  return metadataErrorAtOffset(source, token?.start ?? 0, code, message);
}

function metadataErrorAtOffset(source, offset, code, message) {
  const line = source.slice(0, offset).split("\n").length;
  return metadataError(code, `${message} at line ${line}`);
}

function metadataError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function uniqueInOrder(values) {
  return [...new Set(values)];
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function toSnakeCase(value) {
  return value.replaceAll(/([a-z])([A-Z])/gu, "$1_$2").toLowerCase();
}
