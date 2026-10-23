import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from the .env file");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

export async function testDatabaseConnection(): Promise<void> {
  const result = await pool.query("SELECT NOW() AS current_time");

  console.log("PostgreSQL connection successful!");
  console.log("Database server time:", result.rows[0].current_time);
}
