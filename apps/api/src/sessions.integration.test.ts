import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import app from "./app.js";
import { pool } from "./db.js";

const testSessionId = randomUUID();

describe("PulseCare Session API integration", () => {
  afterAll(async () => {
    // Delete only the test record created by this test.
    await pool.query(
      "DELETE FROM monitoring_sessions WHERE id = $1",
      [testSessionId],
    );
  });

  it("should retrieve monitoring sessions", async () => {
    const response = await request(app).get("/api/sessions");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.sessions)).toBe(true);
  });

  it("should save a monitoring session to PostgreSQL", async () => {
    const response = await request(app)
      .post("/api/sessions")
      .send({
        id: testSessionId,
        durationSeconds: 60,
        heartRate: 72,
        dataType: "SIMULATED",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.session.id).toBe(testSessionId);
    expect(response.body.session.heart_rate).toBe(72);
  });

  it("should retrieve the saved test session", async () => {
    const response = await request(app).get("/api/sessions");

    expect(response.status).toBe(200);

    const savedSession = response.body.sessions.find(
      (session: { id: string }) => session.id === testSessionId,
    );

    expect(savedSession).toBeDefined();
    expect(savedSession.duration_seconds).toBe(60);
  });

  it("should reject a duplicate session ID", async () => {
    const response = await request(app)
      .post("/api/sessions")
      .send({
        id: testSessionId,
        durationSeconds: 60,
        heartRate: 72,
        dataType: "SIMULATED",
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it("should delete only the test session", async () => {
    const response = await request(app).delete(
      `/api/sessions/${testSessionId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("should return 404 when deleting the same session again", async () => {
    const response = await request(app).delete(
      `/api/sessions/${testSessionId}`,
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});