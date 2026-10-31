import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pool, query } from "./db.js";
import { authRouter } from "./auth.js";
import { applicationsRouter } from "./applications.js";
import { syncCatalogueSchemeMatches, telegramRouter } from "./telegram.js";

const app = express();
const frontendOrigin = new URL(process.env.FRONTEND_URL || "http://localhost:5173").origin;

app.disable("x-powered-by");
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use(helmet());
app.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
app.use(cors({ origin: frontendOrigin, credentials: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] }));
app.use(express.json({ limit: "32kb" }));
app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const pathname = new URL(req.originalUrl, "http://localhost").pathname;
  if (pathname === "/api/telegram/webhook") return next();
  if (req.get("origin") !== frontendOrigin) return res.status(403).json({ error: "Request origin is not allowed" });
  next();
});

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 180, standardHeaders: true, legacyHeaders: false });
app.use("/api", limiter);
app.use("/api/telegram", telegramRouter(express, rateLimit));
app.get("/health", async (_req, res, next) => {
  try { await query("SELECT 1"); res.json({ status: "ok", database: "connected" }); }
  catch (error) { next(error); }
});
app.use("/api/auth", authRouter(express, rateLimit));
app.use("/api/applications", applicationsRouter(express));
app.use((error, _req, res, _next) => {
  console.error("API request failed:", error.message);
  res.status(500).json({ error: "The request could not be completed" });
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => process.stdout.write(`EligibalME API listening on ${port}\n`));
syncCatalogueSchemeMatches().catch((error) => {
  console.error("Could not check for new Telegram scheme matches:", error.message);
});
process.on("SIGTERM", async () => { await pool.end(); process.exit(0); });
process.on("SIGINT", async () => { await pool.end(); process.exit(0); });
