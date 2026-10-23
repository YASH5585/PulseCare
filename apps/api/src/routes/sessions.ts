import { Router } from "express";
import { validate as isValidUUID } from "uuid";
import { pool } from "../db.js";

const router = Router();

const MAX_DURATION_SECONDS = 24 * 60 * 60;

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         started_at,
         duration_seconds,
         heart_rate,
         data_type,
         created_at
       FROM monitoring_sessions
       ORDER BY started_at DESC`,
    );

    res.status(200).json({
      success: true,
      sessions: result.rows,
    });
  } catch (error) {
    console.error("Failed to retrieve sessions:", error);
    res.status(500).json({
      success: false,
      message: "Unable to retrieve monitoring sessions.",
    });
  }
});

router.post("/", async (req, res) => {
  const { id, startedAt, durationSeconds, heartRate, dataType } = req.body ?? {};

  if (typeof id !== "string" || !isValidUUID(id)) {
    res.status(400).json({
      success: false,
      message: "A valid UUID session ID is required.",
    });
    return;
  }

  if (
    !Number.isInteger(durationSeconds) ||
    durationSeconds < 0 ||
    durationSeconds > MAX_DURATION_SECONDS
  ) {
    res.status(400).json({
      success: false,
      message: "durationSeconds must be an integer between 0 and 86400.",
    });
    return;
  }

  if (
    !Number.isInteger(heartRate) ||
    heartRate <= 0 ||
    heartRate > 300
  ) {
    res.status(400).json({
      success: false,
      message: "heartRate must be an integer between 1 and 300.",
    });
    return;
  }

  if (dataType !== "SIMULATED" && dataType !== "DEVICE") {
    res.status(400).json({
      success: false,
      message: "dataType must be SIMULATED or DEVICE.",
    });
    return;
  }

  let startedAtValue: Date | undefined;

  if (startedAt !== undefined) {
    if (typeof startedAt !== "string") {
      res.status(400).json({
        success: false,
        message: "startedAt must be a valid ISO date string.",
      });
      return;
    }

    startedAtValue = new Date(startedAt);

    if (Number.isNaN(startedAtValue.getTime())) {
      res.status(400).json({
        success: false,
        message: "startedAt must be a valid ISO date string.",
      });
      return;
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO monitoring_sessions
         (id, started_at, duration_seconds, heart_rate, data_type)
       VALUES ($1, COALESCE($2::timestamptz, NOW()), $3, $4, $5)
       RETURNING id, started_at, duration_seconds, heart_rate, data_type, created_at`,
      [id, startedAtValue ?? null, durationSeconds, heartRate, dataType],
    );

    res.status(201).json({
      success: true,
      message: "Monitoring session saved.",
      session: result.rows[0],
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({
        success: false,
        message: "A monitoring session with this ID already exists.",
      });
      return;
    }

    console.error(
      "Failed to save session:",
      error instanceof Error ? error.message : "Unknown database error",
    );

    res.status(500).json({
      success: false,
      message: "Unable to save monitoring session.",
    });
  }
});

router.delete("/", async (_req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM monitoring_sessions WHERE data_type = 'SIMULATED'",
    );

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.rowCount ?? 0} monitoring sessions.`,
    });
  } catch (error) {
    console.error("Failed to clear monitoring sessions:", error);

    res.status(500).json({
      success: false,
      message: "Failed to clear monitoring sessions.",
    });
  }
});
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    res.status(400).json({
      success: false,
      message: "A valid UUID session ID is required.",
    });
    return;
  }

  try {
    const result = await pool.query(
      "DELETE FROM monitoring_sessions WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "Monitoring session not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Monitoring session deleted.",
    });
  } catch (error) {
    console.error("Failed to delete session:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete monitoring session.",
    });
  }
});

export default router;


