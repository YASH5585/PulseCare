import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "./app.js";

describe("PulseCare API", () => {
  it("should return a successful health check", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("PulseCare API is running");
    expect(response.body.timestamp).toBeDefined();
  });

  it("should return 404 for an unknown endpoint", async () => {
    const response = await request(app).get("/api/unknown");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("API endpoint not found");
  });

  it("should reject a session with an invalid UUID", async () => {
    const response = await request(app)
      .post("/api/sessions")
      .send({
        id: "invalid-id",
        durationSeconds: 60,
        heartRate: 72,
        dataType: "SIMULATED",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "A valid UUID session ID is required.",
    );
  });

  it("should reject a negative session duration", async () => {
    const response = await request(app)
      .post("/api/sessions")
      .send({
        id: "550e8400-e29b-41d4-a716-446655440000",
        durationSeconds: -10,
        heartRate: 72,
        dataType: "SIMULATED",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "durationSeconds must be an integer between 0 and 86400.",
    );
  });

  it("should reject an invalid heart rate", async () => {
    const response = await request(app)
      .post("/api/sessions")
      .send({
        id: "550e8400-e29b-41d4-a716-446655440000",
        durationSeconds: 60,
        heartRate: 0,
        dataType: "SIMULATED",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "heartRate must be an integer between 1 and 300.",
    );
  });

  it("should reject an unsupported data type", async () => {
    const response = await request(app)
      .post("/api/sessions")
      .send({
        id: "550e8400-e29b-41d4-a716-446655440000",
        durationSeconds: 60,
        heartRate: 72,
        dataType: "UNKNOWN",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "dataType must be SIMULATED or DEVICE.",
    );
  });
});