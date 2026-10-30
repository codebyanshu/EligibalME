import { ArrowRight, Lock, RotateCcw, Sparkles } from "lucide-react";
import { SCHEME_COUNT } from "@/data/schemes";
import { GENDERS, INCOME_BANDS, OCCUPATIONS, CATEGORIES } from "@/data/taxonomy";
import { labelOf, bandOf } from "@/lib/eligibility";
import { cn } from "@/lib/utils";

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-medium text-foreground/85">{value}</span>
    </div>
  );
}

export default function ProfileRail({ copy, lang, profile, consent, stepIndex, totalSteps, hasSaved, onRestart, onClear }) {
  const hasProfile = Boolean(profile.age);
  const band = bandOf(profile.incomeBand);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card/70 p-4">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-saffron" />
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{copy.heroKicker}</p>
        </div>
        <p className="mt-2 font-display text-2xl leading-[1.2] text-foreground">{copy.heroTitle}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{copy.heroSub}</p>

        <ol className="mt-4 space-y-2">
          {copy.howSteps.map((s, i) => (
            <li key={s} className="flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold",
                  i < (stepIndex || 0) ? "bg-leaf text-white" : "bg-secondary text-foreground/60",
                )}
              >
                {i + 1}
              </span>
              <span className="text-xs leading-relaxed text-foreground/75">{s}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {SCHEME_COUNT} {lang === "hi" ? "योजनाएं" : lang === "pa" ? "ਸਕੀਮਾਂ" : "schemes"} · {totalSteps}{" "}
          {lang === "hi" ? "सवाल" : lang === "pa" ? "ਸਵਾਲ" : "questions"}
        </p>
      </div>

      {hasProfile && (
        <div className="rounded-2xl border border-border bg-card/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{copy.profileTitle}</p>
          <div className="mt-1">
            <Row label={copy.profileAge} value={String(profile.age)} />
            <Row label={copy.profileGender} value={labelOf(GENDERS, profile.gender, lang)} />
            <Row label={copy.profileOccupation} value={labelOf(OCCUPATIONS, profile.occupation, lang)} />
            <Row
              label={copy.profileCategory}
              value={(profile.categories || []).map((k) => labelOf(CATEGORIES, k, lang)).join(", ")}
            />
            <Row label={copy.profileIncome} value={band ? band.label[lang] : ""} />
            <Row label={copy.profileDistrict} value={profile.district} />
          </div>
          <button
            type="button"
            onClick={onRestart}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> {copy.restart}
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card/70 p-4">
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-leaf" />
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{copy.privacyTitle}</p>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
          {consent ? copy.privacySaved : copy.privacyNotSaved}
        </p>
        {hasSaved && (
          <button
            type="button"
            onClick={onClear}
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-foreground/70 underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            {copy.privacyClear} <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}