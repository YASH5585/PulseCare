import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import app from "./app.js";
import { pool } from "./db.js";

const createdEntryIds: string[] = [];

describe("PulseCare Health Journal API integration", () => {
  afterAll(async () => {
    // Remove only entries created by these tests.
    if (createdEntryIds.length > 0) {
      await pool.query(
        "DELETE FROM health_journal_entries WHERE id = ANY($1::uuid[])",
        [createdEntryIds],
      );
    }
  });

  it("should retrieve journal entries", async () => {
    const response = await request(app).get("/api/journal");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.entries)).toBe(true);
  });

  it("should create a journal entry", async () => {
    const response = await request(app)
      .post("/api/journal")
      .send({
        title: "Automated test journal entry",
        notes: "Created by the PulseCare integration test.",
        mood: "Happy",
        tags: ["test", "automated"],
        entryDate: "2026-10-23T10:00:00.000Z",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.entry.title).toBe(
      "Automated test journal entry",
    );
    expect(response.body.entry.notes).toBe(
      "Created by the PulseCare integration test.",
    );

    createdEntryIds.push(response.body.entry.id);
  });

  it("should reject an empty title", async () => {
    const response = await request(app)
      .post("/api/journal")
      .send({ title: "   " });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Title must contain between 1 and 150 characters.",
    );
  });

  it("should reject notes that are not strings", async () => {
    const response = await request(app)
      .post("/api/journal")
      .send({
        title: "Invalid notes test",
        notes: 123,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should reject more than 20 tags", async () => {
    const response = await request(app)
      .post("/api/journal")
      .send({
        title: "Invalid tags test",
        tags: Array.from({ length: 21 }, (_, index) => `tag-${index}`),
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should reject an invalid entry date", async () => {
    const response = await request(app)
      .post("/api/journal")
      .send({
        title: "Invalid date test",
        entryDate: "not-a-date",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should update a created journal entry", async () => {
    const createResponse = await request(app)
      .post("/api/journal")
      .send({
        title: "Journal entry before update",
        notes: "Original notes",
      });

    expect(createResponse.status).toBe(201);

    const entryId = createResponse.body.entry.id as string;
    createdEntryIds.push(entryId);

    const updateResponse = await request(app)
      .put(`/api/journal/${entryId}`)
      .send({
        title: "Journal entry after update",
        notes: "Updated notes",
        mood: "Calm",
        tags: ["updated"],
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.entry.title).toBe(
      "Journal entry after update",
    );
    expect(updateResponse.body.entry.notes).toBe("Updated notes");
    expect(updateResponse.body.entry.mood).toBe("Calm");
  });

  it("should reject an invalid UUID when updating", async () => {
    const response = await request(app)
      .put("/api/journal/invalid-id")
      .send({ title: "Updated title" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should return 404 when updating a nonexistent entry", async () => {
    const nonexistentId = randomUUID();

    const response = await request(app)
      .put(`/api/journal/${nonexistentId}`)
      .send({ title: "Updated title" });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("should reject an empty update", async () => {
    const response = await request(app)
      .put(`/api/journal/${randomUUID()}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should delete a created journal entry", async () => {
    const createResponse = await request(app)
      .post("/api/journal")
      .send({ title: "Journal entry for deletion test" });

    expect(createResponse.status).toBe(201);

    const entryId = createResponse.body.entry.id as string;
    createdEntryIds.push(entryId);

    const deleteResponse = await request(app)
      .delete(`/api/journal/${entryId}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);

    // The test already deleted this record, so cleanup need not repeat it.
    createdEntryIds.splice(createdEntryIds.indexOf(entryId), 1);
  });

  it("should reject an invalid UUID when deleting", async () => {
    const response = await request(app).delete(
      "/api/journal/invalid-id",
    );

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should return 404 when deleting a nonexistent entry", async () => {
    const response = await request(app).delete(
      `/api/journal/${randomUUID()}`,
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
