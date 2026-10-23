import express from "express";
import cors from "cors";
import sessionsRouter from "./routes/sessions.js";
import journalRouter from "./routes/journal.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "PulseCare API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/sessions", sessionsRouter);
app.use("/api/journal", journalRouter);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

export default app;
