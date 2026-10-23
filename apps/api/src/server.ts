import dotenv from "dotenv";
import app from "./app.js";
import { pool, testDatabaseConnection } from "./db.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 3001;

async function startServer(): Promise<void> {
  try {
    await testDatabaseConnection();

    app.listen(PORT, () => {
      console.log(`PulseCare API running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`Sessions API: http://localhost:${PORT}/api/sessions`);
      console.log(`Journal API: http://localhost:${PORT}/api/journal`);
    });
  } catch (error) {
    console.error("Failed to connect to PostgreSQL.");

    if (error instanceof Error) {
      console.error(error.message);
    }

    await pool.end();
    process.exitCode = 1;
  }
}

void startServer();
