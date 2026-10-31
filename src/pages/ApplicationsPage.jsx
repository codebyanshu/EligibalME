import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ClipboardCheck, ExternalLink, Plus, Trash2 } from "lucide-react";
import { appApi } from "@/lib/appApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALL_SCHEMES, getScheme } from "@/data/schemes";

const STATUS_OPTIONS = ["planning", "ready_to_apply", "submitted", "under_review", "approved", "rejected", "closed"];
const STATUS_LABELS = { planning: "Planning", ready_to_apply: "Ready to apply", submitted: "Submitted", under_review: "Under review", approved: "Approved", rejected: "Rejected", closed: "Closed" };
const PROFILE_KEY = "haqdaar.profile";

export default function ApplicationsPage() {
  const [params, setParams] = useSearchParams();
  const initialScheme = getScheme(params.get("scheme"));
  const [applications, setApplications] = useState([]);
  const [schemeName, setSchemeName] = useState(params.get("name") || initialScheme?.name.en || "");
  const [schemeSlug, setSchemeSlug] = useState(params.get("scheme") || "");
  const [officialUrl, setOfficialUrl] = useState(params.get("url") || initialScheme?.link || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [telegramConfigured, setTelegramConfigured] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [schemeAlertsEnabled, setSchemeAlertsEnabled] = useState(false);
  const [hasEligibilityProfile, setHasEligibilityProfile] = useState(false);
  const [hasLocalProfile, setHasLocalProfile] = useState(false);
  const [profileConsent, setProfileConsent] = useState(false);
  const [telegramLinkUrl, setTelegramLinkUrl] = useState("");
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [telegramError, setTelegramError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await appApi("/applications");
      setApplications(result.applications || []);
      setError("");
    } catch (err) { setError(err.message || "Could not load application tracker"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const refreshTelegram = useCallback(async () => {
    try {
      const result = await appApi("/telegram/status");
      setTelegramConfigured(result.configured);
      setTelegramConnected(result.connected);
      setSchemeAlertsEnabled(result.schemeAlertsEnabled);
      setHasEligibilityProfile(result.hasEligibilityProfile);
      setTelegramError("");
    } catch (err) { setTelegramError(err.message || "Could not load Telegram settings"); }
  }, []);

  useEffect(() => { refreshTelegram(); }, [refreshTelegram]);
  useEffect(() => {
    try { setHasLocalProfile(Boolean(localStorage.getItem(PROFILE_KEY))); }
    catch { setHasLocalProfile(false); }
  }, []);

  const connectTelegram = async () => {
    setTelegramBusy(true);
    setTelegramError("");
    try {
      const result = await appApi("/telegram/link", { method: "POST" });
      setTelegramLinkUrl(result.url);
    } catch (err) { setTelegramError(err.message || "Could not create a Telegram connection link"); }
    finally { setTelegramBusy(false); }
  };

  const disconnectTelegram = async () => {
    setTelegramBusy(true);
    setTelegramError("");
    try {
      await appApi("/telegram/link", { method: "DELETE" });
      setTelegramConnected(false);
      setSchemeAlertsEnabled(false);
      setHasEligibilityProfile(false);
      setTelegramLinkUrl("");
    } catch (err) { setTelegramError(err.message || "Could not disconnect Telegram"); }
    finally { setTelegramBusy(false); }
  };

  const enableSchemeAlerts = async () => {
    setTelegramBusy(true);
    setTelegramError("");
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (!saved) throw new Error("Complete the scheme questionnaire and save your answers on this device first.");
      const { age, gender, occupation, categories, incomeBand, state } = JSON.parse(saved);
      const profile = { age, gender, occupation, categories, incomeBand, state };
      await appApi("/telegram/scheme-alerts", { method: "POST", body: { profile } });
      setProfileConsent(false);
      await refreshTelegram();
    } catch (err) { setTelegramError(err.message || "Could not enable scheme alerts"); }
    finally { setTelegramBusy(false); }
  };

  const disableSchemeAlerts = async () => {
    setTelegramBusy(true);
    setTelegramError("");
    try {
      await appApi("/telegram/scheme-alerts", { method: "DELETE" });
      setSchemeAlertsEnabled(false);
      setHasEligibilityProfile(false);
      setProfileConsent(false);
    } catch (err) { setTelegramError(err.message || "Could not disable scheme alerts"); }
    finally { setTelegramBusy(false); }
  };

  const addApplication = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await appApi("/applications", { method: "POST", body: { schemeName, schemeSlug, officialUrl } });
      setSchemeName(""); setSchemeSlug(""); setOfficialUrl("");
      setParams({}, { replace: true });
      await refresh();
    } catch (err) { setError(err.message || "Could not save this application"); }
    finally { setSaving(false); }
  };

  const updateStatus = async (application, status) => {
    try {
      const result = await appApi(`/applications/${application.id}`, { method: "PATCH", body: { status } });
      setApplications((rows) => rows.map((row) => row.id === application.id ? result.application : row));
      setError("");
    } catch (err) { setError(err.message || "Could not update status"); }
  };

  const removeApplication = async (application) => {
    try {
      await appApi(`/applications/${application.id}`, { method: "DELETE" });
      setApplications((rows) => rows.filter((row) => row.id !== application.id));
    } catch (err) { setError(err.message || "Could not remove this record"); }
  };

  const schemeSuggestions = ALL_SCHEMES.filter((scheme) => !schemeName || scheme.name.en.toLowerCase().includes(schemeName.toLowerCase())).slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to scheme assistant</Link>
      <div className="mt-4 flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-saffron/10 text-saffron"><ClipboardCheck className="h-5 w-5" /></span><div><h1 className="font-display text-3xl">My applications</h1><p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">Save a private progress record, update its status, and open the scheme’s official portal. This tracker does not submit forms to government departments or receive status updates from them.</p></div></div>

      {error && <div role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}

      <section className="mt-7 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">Telegram notifications</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {telegramConfigured
                ? telegramConnected ? "Connected. Changes you make to tracked application statuses will be sent to your Telegram chat." : "Connect your Telegram chat to receive tracked application status changes."
                : "Telegram notifications are not configured on this server."}
            </p>
          </div>
          {telegramConfigured && (telegramConnected
            ? <button type="button" className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-accent disabled:opacity-50" disabled={telegramBusy} onClick={disconnectTelegram}>{telegramBusy ? "Working…" : "Disconnect"}</button>
            : <button type="button" className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-accent disabled:opacity-50" disabled={telegramBusy} onClick={connectTelegram}>{telegramBusy ? "Creating link…" : "Connect Telegram"}</button>)}
        </div>
        {telegramError && <p role="alert" className="mt-3 text-sm text-destructive">{telegramError}</p>}
        {!telegramConnected && telegramLinkUrl && <p className="mt-3 text-sm">Open Telegram and press Start: <a href={telegramLinkUrl} target="_blank" rel="noreferrer" className="font-medium text-primary underline">Connect your chat</a>. Then <button type="button" onClick={refreshTelegram} className="font-medium text-primary underline">check connection</button>.</p>}
        {telegramConnected && (
          <div className="mt-5 border-t border-border pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium">Eligible scheme alerts</h3>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {schemeAlertsEnabled
                    ? "On. New matches are sent when your saved profile or the app catalogue changes."
                    : "Get an immediate list of matching schemes and alerts for new catalogue matches."}
                </p>
              </div>
              {schemeAlertsEnabled
                ? <button type="button" className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-accent disabled:opacity-50" disabled={telegramBusy} onClick={disableSchemeAlerts}>{telegramBusy ? "Working…" : "Turn off scheme alerts"}</button>
                : null}
            </div>
            {!schemeAlertsEnabled && (
              <div className="mt-4 space-y-3">
                {!hasLocalProfile && <p className="text-sm text-muted-foreground">Complete the eligibility questionnaire and choose to save your answers on this device before enabling alerts.</p>}
                <label className="flex max-w-3xl items-start gap-2 text-sm leading-relaxed">
                  <input type="checkbox" className="mt-1 accent-primary" checked={profileConsent} onChange={(event) => setProfileConsent(event.target.checked)} />
                  <span>I agree to store my age, gender, occupation, category, income band, and state in my account’s PostgreSQL profile to find matching schemes. Telegram messages contain scheme names and official links only, not my profile details. I can turn this off to delete the saved profile.</span>
                </label>
                <button type="button" className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" disabled={telegramBusy || !profileConsent || !hasLocalProfile} onClick={enableSchemeAlerts}>{telegramBusy ? "Enabling…" : "Enable personalized scheme alerts"}</button>
              </div>
            )}
            {schemeAlertsEnabled && hasEligibilityProfile && <p className="mt-3 text-xs text-muted-foreground">Your eligibility profile is saved for matching. Turning off scheme alerts deletes it; application status alerts remain connected.</p>}
          </div>
        )}
      </section>

      <form onSubmit={addApplication} className="mt-7 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-2"><Label htmlFor="schemeName">Scheme name</Label><Input id="schemeName" list="scheme-options" value={schemeName} onChange={(event) => { setSchemeName(event.target.value); const match = ALL_SCHEMES.find((scheme) => scheme.name.en.toLowerCase() === event.target.value.toLowerCase()); if (match) { setSchemeSlug(match.id); setOfficialUrl(match.link || ""); } }} placeholder="Choose a scheme" required maxLength={240} /><datalist id="scheme-options">{schemeSuggestions.map((scheme) => <option key={scheme.id} value={scheme.name.en} />)}</datalist></div>
        <div className="space-y-2"><Label htmlFor="officialUrl">Official portal URL (optional)</Label><Input id="officialUrl" type="url" value={officialUrl} onChange={(event) => setOfficialUrl(event.target.value)} placeholder="https://…" /></div>
        <Button type="submit" disabled={saving} className="h-10"><Plus className="mr-1.5 h-4 w-4" />{saving ? "Saving…" : "Track application"}</Button>
      </form>

      <section className="mt-8 space-y-3" aria-live="polite">
        <div className="flex items-center justify-between"><h2 className="font-display text-xl">Tracked applications</h2><span className="text-xs text-muted-foreground">{applications.length}</span></div>
        {loading ? <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Loading your applications…</p> : applications.length === 0 ? <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">You have not added an application yet. Start by entering a scheme above.</p> : applications.map((application) => (
          <article key={application.id} className="grid gap-4 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="min-w-0"><h3 className="font-medium">{application.schemeName}</h3><p className="mt-1 text-xs text-muted-foreground">Updated {new Date(application.updatedAt).toLocaleDateString()}</p>{application.referenceNumber && <p className="mt-1 text-xs text-muted-foreground">Reference: {application.referenceNumber}</p>}</div>
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor={`status-${application.id}`} className="sr-only">Status for {application.schemeName}</Label>
              <select id={`status-${application.id}`} value={application.status} onChange={(event) => updateStatus(application, event.target.value)} className="h-9 rounded-lg border border-border bg-background px-2 text-xs">
                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
              </select>
              {application.officialUrl && <a href={application.officialUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1 rounded-lg bg-ink px-3 text-xs text-paper">Open official portal <ExternalLink className="h-3.5 w-3.5" /></a>}
              <button type="button" onClick={() => removeApplication(application)} aria-label={`Remove ${application.schemeName}`} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
