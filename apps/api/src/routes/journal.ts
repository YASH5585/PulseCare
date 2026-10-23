import { Router } from "express";
import { randomUUID } from "node:crypto";
import { validate as isValidUUID } from "uuid";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, notes, mood, tags, entry_date, created_at, updated_at
       FROM health_journal_entries
       ORDER BY entry_date DESC`,
    );

    res.status(200).json({
      success: true,
      entries: result.rows,
    });
  } catch (error) {
    console.error("Failed to retrieve journal entries:", error);
    res.status(500).json({
      success: false,
      message: "Unable to retrieve journal entries.",
    });
  }
});

router.post("/", async (req, res) => {
  const { title, notes = "", mood = null, tags = [], entryDate } = req.body ?? {};

  if (typeof title !== "string" || !title.trim() || title.trim().length > 150) {
    res.status(400).json({
      success: false,
      message: "Title must contain between 1 and 150 characters.",
    });
    return;
  }

  if (typeof notes !== "string" || notes.length > 10000) {
    res.status(400).json({
      success: false,
      message: "Notes must be a string of at most 10000 characters.",
    });
    return;
  }

  if (
    mood !== null &&
    (typeof mood !== "string" || mood.length > 30)
  ) {
    res.status(400).json({
      success: false,
      message: "Mood must be a string of at most 30 characters or null.",
    });
    return;
  }

  if (
    !Array.isArray(tags) ||
    !tags.every((tag: unknown) => typeof tag === "string" && tag.length <= 50) ||
    tags.length > 20
  ) {
    res.status(400).json({
      success: false,
      message: "Tags must be an array of up to 20 strings, each at most 50 characters.",
    });
    return;
  }

  let parsedEntryDate: Date | null = null;

  if (entryDate !== undefined) {
    if (typeof entryDate !== "string" || Number.isNaN(Date.parse(entryDate))) {
      res.status(400).json({
        success: false,
        message: "entryDate must be a valid date string.",
      });
      return;
    }

    parsedEntryDate = new Date(entryDate);
  }

  try {
    const id = randomUUID();

    const result = await pool.query(
      `INSERT INTO health_journal_entries
         (id, title, notes, mood, tags, entry_date)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW()))
       RETURNING id, title, notes, mood, tags, entry_date, created_at, updated_at`,
      [id, title.trim(), notes, mood, tags, parsedEntryDate],
    );

    res.status(201).json({
      success: true,
      message: "Health journal entry created.",
      entry: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to create journal entry:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create journal entry.",
    });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    res.status(400).json({
      success: false,
      message: "A valid UUID entry ID is required.",
    });
    return;
  }

  const { title, notes, mood, tags, entryDate } = req.body ?? {};

  if (title !== undefined &&
      (typeof title !== "string" || !title.trim() || title.trim().length > 150)) {
    res.status(400).json({
      success: false,
      message: "Title must contain between 1 and 150 characters.",
    });
    return;
  }

  if (notes !== undefined &&
      (typeof notes !== "string" || notes.length > 10000)) {
    res.status(400).json({
      success: false,
      message: "Notes must be a string of at most 10000 characters.",
    });
    return;
  }

  if (mood !== undefined &&
      mood !== null &&
      (typeof mood !== "string" || mood.length > 30)) {
    res.status(400).json({
      success: false,
      message: "Mood must be a string of at most 30 characters or null.",
    });
    return;
  }

  if (tags !== undefined &&
      (!Array.isArray(tags) ||
       !tags.every((tag: unknown) => typeof tag === "string" && tag.length <= 50) ||
       tags.length > 20)) {
    res.status(400).json({
      success: false,
      message: "Tags must be an array of up to 20 strings, each at most 50 characters.",
    });
    return;
  }

  let parsedEntryDate: Date | null | undefined;

  if (entryDate !== undefined) {
    if (typeof entryDate !== "string" || Number.isNaN(Date.parse(entryDate))) {
      res.status(400).json({
        success: false,
        message: "entryDate must be a valid date string.",
      });
      return;
    }

    parsedEntryDate = new Date(entryDate);
  }

  if (
    title === undefined &&
    notes === undefined &&
    mood === undefined &&
    tags === undefined &&
    entryDate === undefined
  ) {
    res.status(400).json({
      success: false,
      message: "Provide at least one field to update.",
    });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE health_journal_entries
       SET title = COALESCE($2, title),
           notes = COALESCE($3, notes),
           mood = CASE WHEN $4::boolean THEN $5::varchar ELSE mood END,
           tags = COALESCE($6::text[], tags),
           entry_date = COALESCE($7::timestamptz, entry_date),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, title, notes, mood, tags, entry_date, created_at, updated_at`,
      [
        id,
        title === undefined ? null : title.trim(),
        notes === undefined ? null : notes,
        mood !== undefined,
        mood ?? null,
        tags ?? null,
        parsedEntryDate ?? null,
      ],
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "Journal entry not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Health journal entry updated.",
      entry: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to update journal entry:", error);
    res.status(500).json({
      success: false,
      message: "Unable to update journal entry.",
    });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    res.status(400).json({
      success: false,
      message: "A valid UUID entry ID is required.",
    });
    return;
  }

  try {
    const result = await pool.query(
      "DELETE FROM health_journal_entries WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "Journal entry not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Health journal entry deleted.",
    });
  } catch (error) {
    console.error("Failed to delete journal entry:", error);
    res.status(500).json({
      success: false,
      message: "Unable to delete journal entry.",
    });
  }
});

export default router;


