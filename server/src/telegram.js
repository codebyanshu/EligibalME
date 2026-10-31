import crypto from "node:crypto";
import { query } from "./db.js";
import { requireAuth } from "./auth.js";
import { eligibleSchemes, validateEligibilityProfile } from "./schemeAlerts.js";

const BOT_USERNAME = () => (process.env.TELEGRAM_BOT_USERNAME || "").replace(/^@/, "");
const webhookSecret = () => process.env.TELEGRAM_WEBHOOK_SECRET || "";
const isConfigured = () => Boolean(process.env.TELEGRAM_BOT_TOKEN && /^[A-Za-z0-9_-]{32,256}$/.test(webhookSecret()) && /^[A-Za-z0-9_]{5,32}$/.test(BOT_USERNAME()));

export function telegramRouter(express, rateLimit) {
  const router = express.Router();
  const linkAttempts = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

  router.post("/webhook", verifyWebhookSecret, async (req, res, next) => {
    try {
      const message = req.body?.message;
      if (!message || message.chat?.type !== "private" || !Number.isSafeInteger(message.chat.id) || message.chat.id <= 0) return res.sendStatus(200);
      const chatId = String(message.chat.id);
      const text = typeof message.text === "string" ? message.text.trim() : "";
      const start = text.match(/^\/start(?:@\w+)?(?:\s+([A-Za-z0-9_-]{20,128}))?\s*$/);

      if (start) {
        if (!start[1]) {
          await sendTelegramMessage(chatId, "To connect, create a link from the Telegram notifications section in your EligibalME application tracker.");
          return res.sendStatus(200);
        }
        const tokenHash = crypto.createHash("sha256").update(start[1]).digest("hex");
        try {
          const result = await query(
            `WITH consumed AS (
               DELETE FROM telegram_link_tokens
               WHERE token_hash=$1 AND expires_at>NOW()
               RETURNING user_id
             )
             INSERT INTO telegram_links (user_id,chat_id)
             SELECT user_id,$2 FROM consumed
             ON CONFLICT (user_id) DO UPDATE SET chat_id=EXCLUDED.chat_id, linked_at=NOW()
             RETURNING user_id`,
            [tokenHash, chatId],
          );
          await sendTelegramMessage(chatId, result.rowCount
            ? "Telegram notifications are connected. You will receive a message when an application status changes. Send /stop at any time to disconnect."
            : "This connection link is invalid or expired. Create a new one in your application tracker.");
        } catch (error) {
          if (error.code === "23505") {
            await sendTelegramMessage(chatId, "This Telegram account is already linked to another EligibalME account.");
          } else {
            throw error;
          }
        }
        return res.sendStatus(200);
      }

      if (/^\/(?:stop|unlink)(?:@\w+)?$/.test(text)) {
        const linked = await query("DELETE FROM telegram_links WHERE chat_id=$1 RETURNING user_id", [chatId]);
        if (linked.rowCount) await deleteSchemeAlertData(linked.rows[0].user_id);
        await sendTelegramMessage(chatId, "Telegram notifications are disconnected.");
        return res.sendStatus(200);
      }

      await sendTelegramMessage(chatId, "I send application status and optional matching-scheme notifications. Use /stop to disconnect.");
      return res.sendStatus(200);
    } catch (error) { next(error); }
  });

  router.use(requireAuth);
  router.get("/status", async (req, res, next) => {
    try {
      const result = await query(
        `SELECT EXISTS (SELECT 1 FROM telegram_links WHERE user_id=$1) AS connected,
                EXISTS (SELECT 1 FROM telegram_preferences WHERE user_id=$1 AND eligible_schemes_enabled) AS scheme_alerts_enabled,
                EXISTS (SELECT 1 FROM user_eligibility_profiles WHERE user_id=$1) AS has_eligibility_profile`,
        [req.user.id],
      );
      res.json({
        configured: isConfigured(),
        connected: result.rows[0].connected,
        schemeAlertsEnabled: result.rows[0].scheme_alerts_enabled,
        hasEligibilityProfile: result.rows[0].has_eligibility_profile,
      });
    } catch (error) { next(error); }
  });

  router.post("/scheme-alerts", async (req, res, next) => {
    try {
      if (!isConfigured()) return res.status(503).json({ error: "Telegram notifications are not configured on this server" });
      if (!await isTelegramConnected(req.user.id)) return res.status(409).json({ error: "Connect Telegram before enabling scheme alerts" });
      const profile = validateEligibilityProfile(req.body?.profile);
      if (!profile) return res.status(400).json({ error: "A valid eligibility profile is required" });
      await saveEligibilityProfile(req.user.id, profile);
      await sendNewSchemeMatches(req.user.id, profile, true);
      res.json({ enabled: true });
    } catch (error) { next(error); }
  });

  router.put("/scheme-alerts", async (req, res, next) => {
    try {
      if (!isConfigured()) return res.status(503).json({ error: "Telegram notifications are not configured on this server" });
      const preference = await query("SELECT eligible_schemes_enabled FROM telegram_preferences WHERE user_id=$1", [req.user.id]);
      if (!preference.rows[0]?.eligible_schemes_enabled) return res.status(409).json({ error: "Enable scheme alerts before updating the saved profile" });
      const profile = validateEligibilityProfile(req.body?.profile);
      if (!profile) return res.status(400).json({ error: "A valid eligibility profile is required" });
      await saveEligibilityProfile(req.user.id, profile);
      await sendNewSchemeMatches(req.user.id, profile, false);
      res.json({ enabled: true });
    } catch (error) { next(error); }
  });

  router.delete("/scheme-alerts", async (req, res, next) => {
    try {
      await deleteSchemeAlertData(req.user.id);
      res.status(204).end();
    } catch (error) { next(error); }
  });

  router.post("/link", linkAttempts, async (req, res, next) => {
    if (!isConfigured()) return res.status(503).json({ error: "Telegram notifications are not configured on this server" });
    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    try {
      await query("DELETE FROM telegram_link_tokens WHERE user_id=$1 OR expires_at<=NOW()", [req.user.id]);
      await query("INSERT INTO telegram_link_tokens (token_hash,user_id,expires_at) VALUES ($1,$2,NOW()+INTERVAL '10 minutes')", [tokenHash, req.user.id]);
      res.json({ url: `https://t.me/${BOT_USERNAME()}?start=${token}` });
    } catch (error) { next(error); }
  });

  router.delete("/link", linkAttempts, async (req, res, next) => {
    try {
      await query("DELETE FROM telegram_links WHERE user_id=$1", [req.user.id]);
      await query("DELETE FROM telegram_link_tokens WHERE user_id=$1", [req.user.id]);
      await deleteSchemeAlertData(req.user.id);
      res.status(204).end();
    } catch (error) { next(error); }
  });

  return router;
}

export async function syncCatalogueSchemeMatches() {
  if (!isConfigured()) return;
  const result = await query(
    `SELECT p.user_id, p.age, p.gender, p.occupation, p.categories, p.income_band, p.state,
            t.matched_scheme_ids
     FROM user_eligibility_profiles p
     JOIN telegram_preferences t ON t.user_id=p.user_id AND t.eligible_schemes_enabled
     JOIN telegram_links l ON l.user_id=p.user_id`,
  );
  for (const row of result.rows) {
    const profile = {
      age: row.age,
      gender: row.gender,
      occupation: row.occupation,
      categories: row.categories,
      incomeBand: row.income_band,
      state: row.state,
    };
    try {
      await sendNewSchemeMatches(row.user_id, profile, false);
    } catch (error) {
      console.error(`Could not sync Telegram scheme alerts for account ${row.user_id}:`, error.message);
    }
  }
}

export async function sendApplicationStatusNotification(userId, schemeName, status) {
  if (!isConfigured()) return;
  const result = await query("SELECT chat_id FROM telegram_links WHERE user_id=$1", [userId]);
  if (!result.rowCount) return;
  const labels = {
    planning: "Planning",
    ready_to_apply: "Ready to apply",
    submitted: "Submitted",
    under_review: "Under review",
    approved: "Approved",
    rejected: "Rejected",
    closed: "Closed",
  };
  await sendTelegramMessage(result.rows[0].chat_id, `Application status updated\n${String(schemeName).slice(0, 240)}\nNew status: ${labels[status] || status}`);
}

async function isTelegramConnected(userId) {
  const result = await query("SELECT EXISTS (SELECT 1 FROM telegram_links WHERE user_id=$1) AS connected", [userId]);
  return result.rows[0].connected;
}

async function saveEligibilityProfile(userId, profile) {
  await query(
    `INSERT INTO user_eligibility_profiles
       (user_id,age,gender,occupation,categories,income_band,state,district)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NULL)
     ON CONFLICT (user_id) DO UPDATE SET
       age=EXCLUDED.age, gender=EXCLUDED.gender, occupation=EXCLUDED.occupation,
       categories=EXCLUDED.categories, income_band=EXCLUDED.income_band,
       state=EXCLUDED.state, district=NULL, updated_at=NOW()`,
    [userId, profile.age, profile.gender, profile.occupation, profile.categories, profile.incomeBand, profile.state],
  );
}

async function sendNewSchemeMatches(userId, profile, isEnabling) {
  const result = await query(
    `SELECT l.chat_id, t.eligible_schemes_enabled, t.matched_scheme_ids
     FROM telegram_links l LEFT JOIN telegram_preferences t ON t.user_id=l.user_id
     WHERE l.user_id=$1`,
    [userId],
  );
  if (!result.rowCount) throw new Error("Telegram is not connected");

  const matches = eligibleSchemes(profile);
  const currentIds = matches.map((scheme) => scheme.id);
  const previousIds = new Set(result.rows[0].matched_scheme_ids || []);
  const newMatches = isEnabling && !result.rows[0].eligible_schemes_enabled
    ? matches
    : matches.filter((scheme) => !previousIds.has(scheme.id));
  if (newMatches.length) {
    await sendSchemeMatches(result.rows[0].chat_id, newMatches, false);
  } else if (isEnabling && !result.rows[0].eligible_schemes_enabled) {
    await sendSchemeMatches(result.rows[0].chat_id, [], true);
  }
  await query(
    `INSERT INTO telegram_preferences (user_id,eligible_schemes_enabled,matched_scheme_ids,updated_at)
     VALUES ($1,TRUE,$2,NOW())
     ON CONFLICT (user_id) DO UPDATE SET eligible_schemes_enabled=TRUE,
       matched_scheme_ids=EXCLUDED.matched_scheme_ids, updated_at=NOW()`,
    [userId, currentIds],
  );
}

async function sendSchemeMatches(chatId, matches, noMatches) {
  const heading = "Scheme matches based on your saved profile (not official eligibility confirmation):";
  if (noMatches) {
    await sendTelegramMessage(chatId, `${heading}\n\nThere are no current catalogue matches. We’ll check again when your profile or the app’s scheme catalogue is updated.`);
    return;
  }
  const blocks = matches.map((scheme) => `${scheme.name}${scheme.url ? `\n${scheme.url}` : ""}`);
  let message = heading;
  for (const block of blocks) {
    if (message.length + block.length + 3 > 3500) {
      await sendTelegramMessage(chatId, message);
      message = "More matching schemes:";
    }
    message += `\n\n${block}`;
  }
  if (message !== heading) await sendTelegramMessage(chatId, message);
}

async function deleteSchemeAlertData(userId) {
  await query(
    `WITH deleted_preferences AS (
       DELETE FROM telegram_preferences WHERE user_id=$1
     )
     DELETE FROM user_eligibility_profiles WHERE user_id=$1`,
    [userId],
  );
}

function verifyWebhookSecret(req, res, next) {
  const expected = webhookSecret();
  const received = req.get("X-Telegram-Bot-Api-Secret-Token") || "";
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(expected) || expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    return res.sendStatus(401);
  }
  next();
}

async function sendTelegramMessage(chatId, text) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(process.env.TELEGRAM_BOT_TOKEN)}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Telegram API request failed (${response.status})`);
    const result = await response.json();
    if (!result.ok) throw new Error("Telegram API rejected the message");
  } catch (error) {
    if (error.message.startsWith("Telegram API")) throw error;
    throw new Error("Telegram API request failed");
  } finally {
    clearTimeout(timeout);
  }
}
