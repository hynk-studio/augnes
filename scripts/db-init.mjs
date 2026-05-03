import { dbPath, initializeDatabase } from "./db-common.mjs";

const db = initializeDatabase();
db.close();

console.log(`Initialized Augnes SQLite database at ${dbPath}`);
