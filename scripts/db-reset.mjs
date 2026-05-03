import { dbPath, resetDatabase } from "./db-common.mjs";

const db = resetDatabase();
db.close();

console.log(`Reset Augnes SQLite database at ${dbPath}`);
