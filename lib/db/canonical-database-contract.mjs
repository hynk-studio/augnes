// Metadata and read-only admission shared with lifecycle preparation.
export const CANONICAL_DATABASE_SCHEMA_CONTRACT =
  "augnes.sqlite.structural-schema.v1";
export const CANONICAL_DATABASE_MIGRATION_CONTRACT =
  "augnes.canonical-database-migrations.v1";
export const CANONICAL_DATABASE_MIGRATION_CONTRACT_VERSION = 1;
export const CANONICAL_DATABASE_RECORD_CONTRACT =
  "augnes.vnext-canonical-records.v1";
export const CANONICAL_DATABASE_RECORD_CONTRACT_VERSION = 1;
// Exact structural contract shipped by merged R8-A PR #1118. Recovery accepts
// only enumerated prior contracts; arbitrary partial SQLite files are never
// treated as migratable Augnes state.
export const CANONICAL_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES =
  Object.freeze([
    // Exact #1399 schema with only the migration ledger and package identity
    // guard absent, retaining the existing bounded ledgerless recovery lane.
    "872e629d1b1e122cb5e85283ec119a04b918a4688cef29e24bbd085cd8ba1646",
    // Exact #1398 schema before durable active/empty selection observations.
    "05472650bc9bec935c2ece2a2cff9678cf3d361dea46599e9e1d83ed0e571326",
    // Complete #1382 ledgerless schema, with only the two recovery-owned
    // metadata tables absent; no arbitrary partial database is admitted.
    "207d6ef998f1a632c6bf1dca6fcfe7ff3695c2a12a22e9c0b3da41970d836c08",
    // Exact merged #1381 schema; direction history is additive.
    "974fa6e9495ce84a42ef47f4b2932de8334c676469c3f32b0565cbdd8610d948",
    "800d9cdf741cf7b85362e8ee9c101b6b33d923a41ff1efdddc098e32df776a4a",
    // Exact CUX1 pre-Pinned schema. CUX2 migrates it additively.
    "91f244d9ecda6e7702370a9cc0382c244bb9bf7929bc5abd722fa833ff1c5e7e",
    // Exact CUX2 structural predecessor used by the ledgerless recovery lane.
    "a6fb21f4cf5a33df52d130f4b05b9b26094ac151afff274592979f9fe535d302",
    // Exact CDX2B2A structural predecessor used by the ledgerless recovery
    // lane. The migration ledger and package identity guard are both absent;
    // arbitrary partial schemas remain fail-closed.
    "cdc300623c2a79fadba08eb452d34aeb3a009ae15c4e45737e5edc7e004bdd53",
    // Exact corrected CDX2B2A structural contract with the migration ledger
    // and package identity guard removed by the bounded recovery fixture.
    // This admits only that complete ledgerless contract for one-way repair;
    // arbitrary partial schemas remain fail-closed.
    "e218d8bc2c60b991c50f1b0982abb74361ca0e38bccaa28e6ec43d18165132b0",
    // Exact Browser decision-session CDX2B2A structural contract with the
    // migration ledger and package identity guard removed by the bounded
    // recovery fixture. Only this complete ledgerless contract is accepted.
    "94b48f5951c32e4ffc27578970e08bda305e332f102ee54c3bd798fd9bad2b46",
    // Exact CDX2B2B structural contract with the migration ledger and package
    // identity guard removed by the bounded recovery fixture. The start/run
    // migration remains one-way and arbitrary partial schemas still refuse.
    "d28eb1500f9cd646cb3979d6a499745cb79e4448c7ba36d7990090594e26a7c3",
    // Exact merged CDX2B2B schema. CDX2B3A rebuilds only the physical-root
    // baseline constraint/columns and preserves every valid prior row.
    "96d291d31d72154309598d4a308f8c9c8bd5182dbbcdb39ab51239e39a2355f3",
    // Exact CDX2B3A structural contract with the migration ledger and package
    // identity guard removed by the bounded recovery fixture.
    "b6a39ad73850ab0839e2f41975e61966d1a23f260cc09bf90ae5c9a877230e79",
    // Exact CDX2B4A structural contract with the migration ledger and package
    // identity guard removed by the bounded recovery fixture. The checkpoint
    // table remains machine-local run history; only this complete ledgerless
    // contract is accepted for one-way repair.
    "4fcaf45675a2a4604fa5c2a0b545366621dca967dce33bd6bab0759ee3c18db4",
    // Exact CDX2B4B structural contract with the migration ledger and package
    // identity guard removed by the bounded recovery fixture. Resume attempts
    // remain private machine-local history and arbitrary partial stores fail.
    "0bbd52cf5430bce8102865ea347b15aa90341e60d822b2000282080018698d8a",
    // Exact corrected CDX2B4B structural contract with the migration ledger
    // and package identity guard removed by the bounded recovery fixture.
    // Runtime claims, their stale-claim history, and cancellation intent stay
    // private machine-local history; partial stores remain unsupported.
    "6ba9e92e9632a88373805fa6c123d24b5fbd3e311052a76be953815e8e98190f",
    // Exact integrated CDX2B3A + CDX2B4B structural contract with only the
    // migration ledger and package identity guard removed. Windows baseline
    // identity and private resume history are both complete; arbitrary
    // partial combinations remain unsupported.
    "b784b2bd6da466388c1a1c6f639f9f4bdb128c3fb6cda0d4b50e85b006cca477",
    // Exact ACGC5B structural contract with only the migration ledger and
    // package identity guard removed. The continuation-admission record kind
    // is present; arbitrary partial schemas remain unsupported.
    "542b04dcf26b7fc95480438e8ac4fe2e60e29817fce07b2af141def313eab2e5",
    // Exact merged P3.1 predecessor. F1 adds only the optional immutable
    // work-expectation record kind; existing rows retain their original bytes.
    "66f470e7a6e5bc2a10d5e2b0437dc95165596ae55f915ecd27ee1666e130f980",
    // Exact F1 schema with only the migration ledger and package identity
    // guard absent, for the existing bounded ledgerless recovery lane.
    "548df1c54ff6bafff41cdc1ad09b9a724c4e0ac5087d5b20d1b2651ad06dd0b1",
    // Exact merged #1379 schema. #1380 adds only machine-local prospective
    // eligibility; existing Core records, grants and run history are unchanged.
    "ef52834e336468afde007eb513d1ea555e06d60aed64256a24e7f0e773cfd7da",
    // Exact #1380 schema with only the migration ledger and package identity
    // guard absent, for the existing bounded ledgerless recovery fixture.
    "9c70e925c3c49a1b945f0fa62e9ad027cd97c0ce01284c9a7eb14ff2d6be8568",
  ]);
export const CANONICAL_DATABASE_MIGRATION_IDS = Object.freeze([
  "0001_r8_recovery_contract",
]);

export function readCanonicalDatabaseMigrationLedger(db) {
  const table = db
    .prepare(
      "SELECT name FROM sqlite_schema WHERE type = 'table' AND name = 'augnes_schema_migrations'",
    )
    .get();
  if (!table) return null;
  return db
    .prepare(
      `SELECT migration_id, migration_contract, migration_contract_version,
              applied_at
       FROM augnes_schema_migrations
       ORDER BY migration_id`,
    )
    .all()
    .map((row) => ({
      migration_id: row.migration_id,
      migration_contract: row.migration_contract,
      migration_contract_version: Number(row.migration_contract_version),
      applied_at: row.applied_at,
    }));
}

export function verifyCanonicalDatabaseMigrationLedger(db) {
  const entries = readCanonicalDatabaseMigrationLedger(db);
  if (!entries) throw new Error("database_migration_ledger_missing");
  if (
    entries.length !== CANONICAL_DATABASE_MIGRATION_IDS.length ||
    entries.some(
      (entry, index) =>
        entry.migration_id !== CANONICAL_DATABASE_MIGRATION_IDS[index] ||
        entry.migration_contract !== CANONICAL_DATABASE_MIGRATION_CONTRACT ||
        entry.migration_contract_version !==
          CANONICAL_DATABASE_MIGRATION_CONTRACT_VERSION ||
        typeof entry.applied_at !== "string" ||
        entry.applied_at.length === 0 ||
        entry.applied_at.length > 64,
    )
  ) {
    throw new Error("database_migration_ledger_unsupported");
  }
  return entries;
}

export function readCanonicalPackageIdentityGuard(db) {
  const table = db
    .prepare(
      "SELECT name FROM sqlite_schema WHERE type = 'table' AND name = 'augnes_package_identity_guard'",
    )
    .get();
  if (!table) return null;
  const rows = db
    .prepare(
      `SELECT singleton, identity_state, updated_at
         FROM augnes_package_identity_guard
        ORDER BY singleton`,
    )
    .all();
  if (
    rows.length !== 1 ||
    Number(rows[0].singleton) !== 1 ||
    !["legacy_unadopted", "package_identity_required"].includes(
      rows[0].identity_state,
    ) ||
    typeof rows[0].updated_at !== "string" ||
    rows[0].updated_at.length === 0 ||
    rows[0].updated_at.length > 64
  ) {
    throw new Error("database_package_identity_guard_invalid");
  }
  return {
    identity_state: rows[0].identity_state,
    updated_at: rows[0].updated_at,
  };
}

export function verifyCanonicalPackageIdentityGuard(db) {
  const guard = readCanonicalPackageIdentityGuard(db);
  if (!guard) throw new Error("database_package_identity_guard_missing");
  return guard;
}
