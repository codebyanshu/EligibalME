import { query } from "./db.js";
import { requireAuth } from "./auth.js";
import { sendApplicationStatusNotification } from "./telegram.js";

const STATUSES = new Set(["planning", "ready_to_apply", "submitted", "under_review", "approved", "rejected", "closed"]);
const clean = (value, max = 1000) => String(value ?? "").trim().slice(0, max);
const present = (row) => ({
  id: row.id, schemeSlug: row.scheme_slug, schemeName: row.scheme_name,
  officialUrl: row.official_url, status: row.status, referenceNumber: row.reference_number,
  notes: row.notes, appliedAt: row.applied_at, createdAt: row.created_at, updatedAt: row.updated_at,
});

export function applicationsRouter(express) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const { rows } = await query("SELECT id,scheme_slug,scheme_name,official_url,status,reference_number,notes,applied_at,created_at,updated_at FROM applications WHERE user_id=$1 ORDER BY updated_at DESC", [req.user.id]);
      res.json({ applications: rows.map(present) });
    } catch (error) { next(error); }
  });

  router.post("/", async (req, res, next) => {
    const schemeName = clean(req.body.schemeName, 240);
    const officialUrl = clean(req.body.officialUrl, 2048);
    if (!schemeName) return res.status(400).json({ error: "Scheme name is required" });
    if (officialUrl) {
      try { const url = new URL(officialUrl); if (url.protocol !== "https:") throw new Error(); }
      catch { return res.status(400).json({ error: "Official URL must be a valid HTTPS link" }); }
    }
    try {
      const { rows } = await query(
        "INSERT INTO applications (user_id,scheme_slug,scheme_name,official_url,status,reference_number,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
        [req.user.id, clean(req.body.schemeSlug, 160) || null, schemeName, officialUrl || null, "planning", clean(req.body.referenceNumber, 160) || null, clean(req.body.notes, 2000)],
      );
      res.status(201).json({ application: present(rows[0]) });
    } catch (error) { next(error); }
  });

  router.patch("/:id", async (req, res, next) => {
    const status = clean(req.body.status, 40);
    if (status && !STATUSES.has(status)) return res.status(400).json({ error: "Invalid application status" });
    try {
      const previous = status
        ? await query("SELECT status FROM applications WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id])
        : null;
      const { rows } = await query(
        "UPDATE applications SET status=COALESCE($3,status), reference_number=COALESCE($4,reference_number), notes=COALESCE($5,notes), applied_at=CASE WHEN $3='submitted' AND applied_at IS NULL THEN NOW() ELSE applied_at END, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *",
        [req.params.id, req.user.id, status || null, req.body.referenceNumber === undefined ? null : clean(req.body.referenceNumber, 160), req.body.notes === undefined ? null : clean(req.body.notes, 2000)],
      );
      if (!rows.length) return res.status(404).json({ error: "Application record not found" });
      if (status && previous?.rows[0]?.status !== rows[0].status) {
        void sendApplicationStatusNotification(req.user.id, rows[0].scheme_name, rows[0].status)
          .catch((error) => console.error("Telegram status notification failed:", error.message));
      }
      res.json({ application: present(rows[0]) });
    } catch (error) { next(error); }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const result = await query("DELETE FROM applications WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
      if (!result.rowCount) return res.status(404).json({ error: "Application record not found" });
      res.status(204).end();
    } catch (error) { next(error); }
  });
  return router;
}
