import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { query } from "./db.js";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) throw new Error("JWT_SECRET must be set to at least 32 characters");
const production = process.env.NODE_ENV === "production";
const sessionCookie = production ? "__Host-eligibalme_session" : "eligibalme_session";
const sessionOptions = { httpOnly: true, secure: production, sameSite: "lax", path: "/" };

function setSessionCookie(res, user) {
  const token = jwt.sign({ sub: user.id, ver: user.token_version }, jwtSecret, { algorithm: "HS256", expiresIn: "2h", issuer: "eligibalme" });
  res.cookie(sessionCookie, token, { ...sessionOptions, maxAge: 2 * 60 * 60 * 1000 });
}

export async function requireAuth(req, res, next) {
  const token = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookie}=`))
    ?.slice(sessionCookie.length + 1);
  if (!token) return res.status(401).json({ error: "Authentication required" });
  let claims;
  try {
    claims = jwt.verify(token, jwtSecret, { issuer: "eligibalme", algorithms: ["HS256"] });
    if (typeof claims.sub !== "string" || !Number.isInteger(claims.ver)) throw new Error("Invalid session claims");
  } catch {
    return res.status(401).json({ error: "Session expired; please sign in again" });
  }
  try {
    const result = await query("SELECT id, name, email, created_at, token_version FROM app_users WHERE id = $1", [claims.sub]);
    if (!result.rowCount || result.rows[0].token_version !== claims.ver) return res.status(401).json({ error: "Session expired; please sign in again" });
    const user = { ...result.rows[0] };
    delete user.token_version;
    req.user = user;
    next();
  } catch (error) { next(error); }
}

export function authRouter(express, rateLimit) {
  const router = express.Router();
  const attempts = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false });

  router.post("/register", attempts, async (req, res, next) => {
    try {
      const name = String(req.body.name || "").trim().slice(0, 100);
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");
      if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 12 || password.length > 128) {
        return res.status(400).json({ error: "Enter a valid email and a password of 12–128 characters" });
      }
      const hash = await bcrypt.hash(password, 12);
      const result = await query("INSERT INTO app_users (name,email,password_hash) VALUES ($1,$2,$3) RETURNING id,name,email,created_at,token_version", [name, email, hash]);
      setSessionCookie(res, result.rows[0]);
      delete result.rows[0].token_version;
      res.status(201).json({ user: result.rows[0] });
    } catch (error) {
      if (error.code === "23505") return res.status(409).json({ error: "An account with this email already exists" });
      next(error);
    }
  });

  router.post("/login", attempts, async (req, res, next) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");
      const result = await query("SELECT id,name,email,password_hash,created_at,token_version FROM app_users WHERE email = $1", [email]);
      const user = result.rows[0];
      if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "Email or password is incorrect" });
      delete user.password_hash;
      setSessionCookie(res, user);
      delete user.token_version;
      res.json({ user });
    } catch (error) { next(error); }
  });

  router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));
  router.post("/logout", requireAuth, async (req, res, next) => {
    try {
      await query("UPDATE app_users SET token_version=token_version+1,updated_at=NOW() WHERE id=$1", [req.user.id]);
      res.clearCookie(sessionCookie, sessionOptions).status(204).end();
    } catch (error) { next(error); }
  });

  router.post("/forgot-password", attempts, async (req, res, next) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const result = await query("SELECT id,email FROM app_users WHERE email = $1", [email]);
      if (result.rowCount && process.env.SMTP_HOST) {
        const token = crypto.randomBytes(32).toString("base64url");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        await query("INSERT INTO password_resets (user_id,token_hash,expires_at) VALUES ($1,$2,NOW()+INTERVAL '30 minutes')", [result.rows[0].id, tokenHash]);
        const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === "true", auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined });
        const resetUrl = `${frontendOrigin()}/reset-password?token=${encodeURIComponent(token)}`;
        await transport.sendMail({ from: process.env.SMTP_FROM, to: email, subject: "Reset your EligibalME password", text: `Use this link within 30 minutes to reset your password: ${resetUrl}` });
      }
      res.json({ message: "If an account exists, password reset instructions will be sent." });
    } catch (error) { next(error); }
  });

  router.post("/reset-password", attempts, async (req, res, next) => {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");
    if (password.length < 12 || password.length > 128) return res.status(400).json({ error: "Password must be 12–128 characters" });
    try {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const hash = await bcrypt.hash(password, 12);
      const client = await query("WITH consumed AS (UPDATE password_resets SET used_at=NOW() WHERE token_hash=$2 AND used_at IS NULL AND expires_at>NOW() RETURNING user_id) UPDATE app_users SET password_hash=$1,auth_provider='password',provider_user_id=NULL,token_version=token_version+1,updated_at=NOW() WHERE id=(SELECT user_id FROM consumed) RETURNING id", [hash, tokenHash]);
      if (!client.rowCount) return res.status(400).json({ error: "Reset link is invalid or expired" });
      res.clearCookie(sessionCookie, sessionOptions).json({ message: "Password updated" });
    } catch (error) { next(error); }
  });

  return router;
}

function frontendOrigin() {
  return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
}
