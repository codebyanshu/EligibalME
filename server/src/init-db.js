import "dotenv/config";
import { readFile } from "node:fs/promises";
import { pool } from "./db.js";

try {
  const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  await pool.query(schema);
  process.stdout.write("PostgreSQL schema initialized.\n");
} finally {
  await pool.end();
}
