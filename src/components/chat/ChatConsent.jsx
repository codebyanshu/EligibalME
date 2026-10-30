import { Check, ShieldCheck } from "lucide-react";

export default function ChatConsent({ copy, active, onConsent }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-leaf" strokeWidth={1.8} />
        <p className="font-display text-base">{copy.consentTitle}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/80">{copy.consentBody}</p>
      <ul className="mt-3 space-y-1.5">
        {copy.consentPoints.map((p) => (
          <li key={p} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-leaf" strokeWidth={2.4} />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={!active}
          onClick={() => onConsent(true)}
          className="flex-1 rounded-xl bg-ink px-3.5 py-2.5 text-sm text-paper transition hover:opacity-90 disabled:opacity-40"
        >
          {copy.consentYes}
        </button>
        <button
          type="button"
          disabled={!active}
          onClick={() => onConsent(false)}
          className="flex-1 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground/80 transition hover:border-saffron/60 hover:bg-saffron/5 disabled:opacity-40"
        >
          {copy.consentNo}
        </button>
      </div>
    </div>
  );
}