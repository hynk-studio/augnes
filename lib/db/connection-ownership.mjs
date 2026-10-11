/** Settle a failed acquisition without losing either failure.
 * @returns {never}
 */
export function releaseFailedDatabase(database, failure) {
  try {
    database.close();
  } catch (cleanupFailure) {
    throw new AggregateError(
      [failure, cleanupFailure],
      "database_operation_and_cleanup_failed",
      { cause: failure },
    );
  }
  throw failure;
}

/** The creator owns the handle until setup has returned successfully.
 * @template {{ close(): unknown }} T
 * @param {T} database
 * @param {(database: T) => unknown} setup
 * @returns {T}
 */
export function configureOwnedDatabase(database, setup) {
  try {
    setup(database);
    return database;
  } catch (failure) {
    return releaseFailedDatabase(database, failure);
  }
}

/** Synchronous lifecycle work retains ownership on success and failure.
 * @template {{ close(): unknown }} T
 * @template R
 * @param {T} database
 * @param {(database: T) => R} operation
 * @returns {R}
 */
export function withOwnedDatabase(database, operation) {
  let result;
  try {
    result = operation(database);
  } catch (failure) {
    return releaseFailedDatabase(database, failure);
  }
  database.close();
  return result;
}

/** Keep ownership until asynchronous request work has settled.
 * @template {{ close(): unknown }} T
 * @template R
 * @param {T} database
 * @param {(database: T) => Promise<R>} operation
 * @returns {Promise<R>}
 */
export async function withOwnedDatabaseAsync(database, operation) {
  let result;
  try {
    result = await operation(database);
  } catch (failure) {
    return releaseFailedDatabase(database, failure);
  }
  database.close();
  return result;
}
