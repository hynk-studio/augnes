import { createHash } from "node:crypto";

// Read-only structural inspection shared by access and lifecycle admission.
export function structuralSchemaContractSignature(database) {
  return createHash("sha256")
    .update(JSON.stringify(buildStructuralSchemaContract(database)))
    .digest("hex");
}

export function buildStructuralSchemaContract(database) {
  const objects = database
    .prepare(
      `SELECT type, name, tbl_name, sql
       FROM sqlite_schema
       WHERE name NOT LIKE 'sqlite_%'
       ORDER BY type, name, tbl_name`,
    )
    .all();
  const tableLikeNames = objects
    .filter((object) => object.type === "table" || object.type === "view")
    .map((object) => object.name)
    .sort(compareStrings);
  const indexMetadata = new Map();
  for (const tableName of tableLikeNames) {
    for (const index of database
      .prepare(
        `SELECT seq, name, "unique" AS is_unique, origin, partial
         FROM pragma_index_list(?)
         ORDER BY name`,
      )
      .all(tableName)) {
      indexMetadata.set(index.name, {
        unique: Number(index.is_unique),
        origin: normalizeIdentifier(index.origin),
        partial: Number(index.partial),
      });
    }
  }

  return {
    objects: objects.map((object) => ({
      type: normalizeIdentifier(object.type),
      name: object.name,
      table: object.tbl_name,
      definition: normalizeSqlDefinition(object.sql),
      columns:
        object.type === "table" || object.type === "view"
          ? database
              .prepare(
                `SELECT cid, name, type, "notnull" AS is_not_null,
                        dflt_value, pk, hidden
                 FROM pragma_table_xinfo(?)
                 ORDER BY cid`,
              )
              .all(object.name)
              .map((column) => ({
                position: Number(column.cid),
                name: column.name,
                declared_type: normalizeDeclaredType(column.type),
                not_null: Number(column.is_not_null),
                default_expression: normalizeSqlDefinition(column.dflt_value),
                primary_key_position: Number(column.pk),
                hidden: Number(column.hidden),
              }))
          : null,
      foreign_keys:
        object.type === "table"
          ? database
              .prepare(
                `SELECT id, seq, "table" AS target_table, "from" AS source_column,
                        "to" AS target_column, on_update, on_delete, match
                 FROM pragma_foreign_key_list(?)
                 ORDER BY id, seq`,
              )
              .all(object.name)
              .map((foreignKey) => ({
                id: Number(foreignKey.id),
                sequence: Number(foreignKey.seq),
                target_table: foreignKey.target_table,
                source_column: foreignKey.source_column,
                target_column: foreignKey.target_column,
                on_update: normalizeIdentifier(foreignKey.on_update),
                on_delete: normalizeIdentifier(foreignKey.on_delete),
                match: normalizeIdentifier(foreignKey.match),
              }))
          : null,
      index:
        object.type === "index"
          ? {
              ...(indexMetadata.get(object.name) ?? {
                unique: null,
                origin: null,
                partial: null,
              }),
              columns: database
                .prepare(
                  `SELECT seqno, cid, name, "desc" AS is_descending,
                          coll, key
                   FROM pragma_index_xinfo(?)
                   ORDER BY seqno`,
                )
                .all(object.name)
                .map((column) => ({
                  sequence: Number(column.seqno),
                  column_id: Number(column.cid),
                  name: column.name,
                  descending: Number(column.is_descending),
                  collation: normalizeIdentifier(column.coll),
                  key: Number(column.key),
                })),
            }
          : null,
    })),
  };
}

function normalizeDeclaredType(value) {
  if (value === null || value === undefined) return null;
  return String(value).trim().replace(/\s+/g, " ").toUpperCase();
}

function normalizeIdentifier(value) {
  if (value === null || value === undefined) return null;
  return String(value).toLowerCase();
}

function normalizeSqlDefinition(value) {
  if (value === null || value === undefined) return null;
  const input = String(value);
  const tokens = [];
  let index = 0;
  while (index < input.length) {
    const character = input[index];
    if (/\s/.test(character)) {
      index += 1;
      continue;
    }
    if (character === "-" && input[index + 1] === "-") {
      index += 2;
      while (index < input.length && input[index] !== "\n") index += 1;
      continue;
    }
    if (character === "/" && input[index + 1] === "*") {
      index += 2;
      while (
        index < input.length &&
        !(input[index] === "*" && input[index + 1] === "/")
      ) {
        index += 1;
      }
      index += 2;
      continue;
    }
    if (
      character === "'" ||
      character === '"' ||
      character === "`" ||
      character === "["
    ) {
      const closing = character === "[" ? "]" : character;
      let token = character;
      index += 1;
      while (index < input.length) {
        token += input[index];
        if (input[index] === closing) {
          if (closing !== "]" && input[index + 1] === closing) {
            token += input[index + 1];
            index += 2;
            continue;
          }
          index += 1;
          break;
        }
        index += 1;
      }
      tokens.push(token);
      continue;
    }
    if (/[A-Za-z_]/.test(character)) {
      let end = index + 1;
      while (end < input.length && /[A-Za-z0-9_$]/.test(input[end])) end += 1;
      tokens.push(input.slice(index, end).toLowerCase());
      index = end;
      continue;
    }
    if (/[0-9]/.test(character)) {
      let end = index;
      if (input.slice(index, index + 2).toLowerCase() === "0x") {
        end += 2;
        while (end < input.length && /[0-9A-Fa-f]/.test(input[end])) end += 1;
      } else {
        while (end < input.length && /[0-9]/.test(input[end])) end += 1;
        if (input[end] === ".") {
          end += 1;
          while (end < input.length && /[0-9]/.test(input[end])) end += 1;
        }
        if (input[end]?.toLowerCase() === "e") {
          end += 1;
          if (input[end] === "+" || input[end] === "-") end += 1;
          while (end < input.length && /[0-9]/.test(input[end])) end += 1;
        }
      }
      tokens.push(input.slice(index, end).toLowerCase());
      index = end;
      continue;
    }
    const twoCharacterOperator = input.slice(index, index + 2);
    if (
      ["<=", ">=", "!=", "<>", "==", "||", "->", "->>"].includes(
        twoCharacterOperator,
      )
    ) {
      tokens.push(twoCharacterOperator);
      index += 2;
      continue;
    }
    tokens.push(character);
    index += 1;
  }
  return tokens;
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
