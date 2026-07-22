export function parseCanonicalYaml(source) {
  if (typeof source !== "string") {
    throw new Error("canonical YAML source must be text");
  }
  const lines = source
    .replaceAll("\t", "  ")
    .split(/\r?\n/u)
    .map((raw, lineNumber) => ({
      raw,
      lineNumber: lineNumber + 1,
      indent: raw.match(/^ */u)[0].length,
      text: raw.trim(),
    }))
    .filter((line) => line.text && !line.text.startsWith("#"));
  if (lines.length === 0) return {};
  if (lines[0].indent !== 0) {
    throw new Error("canonical YAML root must start at indentation zero");
  }
  const parsed = parseBlock(lines, 0, 0);
  if (parsed.next !== lines.length) {
    throw new Error(`unparsed canonical YAML at line ${lines[parsed.next].lineNumber}`);
  }
  return parsed.value;
}

function parseBlock(lines, start, indent) {
  const sequence = lines[start]?.indent === indent && /^-(?:\s|$)/u.test(lines[start].text);
  return sequence
    ? parseSequence(lines, start, indent)
    : parseMapping(lines, start, indent);
}

function parseMapping(lines, start, indent) {
  const value = {};
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) break;
    if (line.indent > indent) {
      throw new Error(`unexpected canonical YAML indentation at line ${line.lineNumber}`);
    }
    if (/^-(?:\s|$)/u.test(line.text)) break;
    const entry = parseMappingEntry(line.text, line.lineNumber);
    if (Object.hasOwn(value, entry.key)) {
      throw new Error(`duplicate canonical YAML key ${entry.key} at line ${line.lineNumber}`);
    }
    index += 1;
    if (entry.blockStyle) {
      const block = collectBlockScalar(lines, index, indent, entry.blockStyle);
      value[entry.key] = block.value;
      index = block.next;
    } else if (entry.rawValue === "") {
      if (index < lines.length && lines[index].indent > indent) {
        const child = parseBlock(lines, index, lines[index].indent);
        value[entry.key] = child.value;
        index = child.next;
      } else {
        value[entry.key] = null;
      }
    } else {
      value[entry.key] = parseScalar(entry.rawValue);
    }
  }
  return { value, next: index };
}

function parseSequence(lines, start, indent) {
  const value = [];
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) break;
    if (line.indent !== indent || !/^-(?:\s|$)/u.test(line.text)) break;
    const rest = line.text.slice(1).trimStart();
    index += 1;
    if (!rest) {
      if (index >= lines.length || lines[index].indent <= indent) {
        value.push(null);
      } else {
        const child = parseBlock(lines, index, lines[index].indent);
        value.push(child.value);
        index = child.next;
      }
      continue;
    }

    if (looksLikeMappingEntry(rest)) {
      const item = {};
      const first = parseMappingEntry(rest, line.lineNumber);
      if (first.blockStyle) {
        const block = collectBlockScalar(lines, index, indent, first.blockStyle);
        item[first.key] = block.value;
        index = block.next;
      } else if (first.rawValue === "") {
        if (index < lines.length && lines[index].indent > indent) {
          const child = parseBlock(lines, index, lines[index].indent);
          item[first.key] = child.value;
          index = child.next;
        } else {
          item[first.key] = null;
        }
      } else {
        item[first.key] = parseScalar(first.rawValue);
      }
      if (index < lines.length && lines[index].indent > indent) {
        const continuation = parseMapping(lines, index, lines[index].indent);
        for (const [key, entryValue] of Object.entries(continuation.value)) {
          if (Object.hasOwn(item, key)) {
            throw new Error(`duplicate canonical YAML sequence key ${key}`);
          }
          item[key] = entryValue;
        }
        index = continuation.next;
      }
      value.push(item);
    } else {
      value.push(parseScalar(rest));
    }
  }
  return { value, next: index };
}

function parseMappingEntry(text, lineNumber) {
  const match = text.match(/^([^:]+):(?:\s*(.*))?$/u);
  if (!match) {
    throw new Error(`unsupported canonical YAML mapping at line ${lineNumber}`);
  }
  const key = unquote(match[1].trim());
  const rawValue = match[2] ?? "";
  const blockStyle = /^(?:\||>)[+-]?$/u.test(rawValue) ? rawValue[0] : null;
  return { key, rawValue, blockStyle };
}

function collectBlockScalar(lines, start, parentIndent, blockStyle) {
  let index = start;
  const collected = [];
  let contentIndent = null;
  while (index < lines.length && lines[index].indent > parentIndent) {
    const line = lines[index];
    contentIndent ??= line.indent;
    collected.push(line.raw.slice(Math.min(contentIndent, line.raw.length)));
    index += 1;
  }
  return {
    value: blockStyle === ">" ? collected.join(" ") : collected.join("\n"),
    next: index,
  };
}

function parseScalar(raw) {
  const value = raw.trim();
  if (/^\[.*\]$/u.test(value)) {
    const inner = value.slice(1, -1).trim();
    return inner ? inner.split(",").map((entry) => parseScalar(entry)) : [];
  }
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~") return null;
  if (/^-?\d+(?:\.\d+)?$/u.test(value)) return Number(value);
  return unquote(value);
}

function unquote(value) {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function looksLikeMappingEntry(value) {
  return /^[^:]+:(?:\s|$)/u.test(value);
}
