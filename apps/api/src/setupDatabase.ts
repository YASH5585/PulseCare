import { readFile } from "node:fs/promises";
import { pool } from "./db.js";

async function setupDatabase(): Promise<void> {
  try {
    const schema = await readFile(
      new URL("./schema.sql", import.meta.url),
      "utf8",
    );

    const statements = schema
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    for (const statement of statements) {
      await pool.query(statement);
    }

    console.log("Database schema created successfully!");
    console.log("Table: monitoring_sessions");
    console.log("Index: idx_monitoring_sessions_started_at");
  } catch (error) {
    console.error("Failed to create database schema.");

    if (error instanceof Error) {
      console.error(error.message);
    }

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void setupDatabase();
