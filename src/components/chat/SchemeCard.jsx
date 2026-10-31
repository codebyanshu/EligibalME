import { DOCUMENTS } from "@/data/taxonomy";
import { Link } from "react-router-dom";
import { describeCheck } from "@/lib/eligibility";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Check, FileText, Info, TriangleAlert } from "lucide-react";

export default function SchemeCard({ row, lang, copy }) {
  const { scheme, tier, reasons, failed } = row;
  const catalog = scheme.catalog === true;
  const eligible = tier === "eligible";
  const note = scheme.criteria?.note?.[lang];
  const name = catalog ? scheme.name : scheme.name[lang];
  const summary = catalog ? scheme.summary : scheme.summary[lang];
  const benefit = catalog ? scheme.benefit : scheme.benefit[lang];
  const documents = scheme.docs || [];

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <div className="border-b border-border/70 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]",
              scheme.level === "central" ? "bg-secondary text-foreground/70" : "bg-saffron/15 text-saffron",
            )}
          >
            {scheme.level === "central" ? copy.centralTag : copy.stateTag}
          </span>
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", catalog ? "bg-saffron/12 text-saffron" : eligible ? "bg-leaf/12 text-leaf" : "bg-saffron/12 text-saffron")}>
            {catalog ? <TriangleAlert className="h-3 w-3" /> : eligible ? <Check className="h-3 w-3" strokeWidth={3} /> : <TriangleAlert className="h-3 w-3" />}
            {catalog ? copy.catalogVerifyTag : eligible ? copy.tierEligible : copy.tierCheck}
          </span>
        </div>
        <h3 className="mt-2 font-display text-lg leading-snug text-foreground">{name}</h3>
        {summary && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{summary}</p>}
      </div>

      <div className="space-y-3 px-4 py-3 sm:px-5">
        <div className="rounded-xl border border-leaf/20 bg-leaf/8 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-leaf/80">{copy.benefitTitle}</p>
          {benefit && <p className="mt-0.5 text-sm font-medium leading-snug text-foreground">{benefit}</p>}
        </div>

        {documents.length > 0 && <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{copy.docsTitle}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {documents.map((d, index) => (
              <span
                key={`${d}-${index}`}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/60 px-2 py-1 text-[11px] text-foreground/75"
              >
                <FileText className="h-3 w-3 text-muted-foreground" strokeWidth={1.8} />
                {DOCUMENTS[d]?.[lang] || d}
              </span>
            ))}
          </div>
        </div>}

        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{catalog ? copy.catalogEligibility : copy.whyTitle}</p>
          {catalog ? <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-foreground/80">{scheme.eligibility || copy.catalogEligibilityMissing}</p> : <>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {reasons.map((r, i) => (
                <span key={`${r.kind}-${i}`} className="rounded-lg bg-leaf/10 px-2 py-1 text-[11px] text-leaf">
                  {describeCheck(r, lang)}
                </span>
              ))}
              {failed.map((r, i) => (
                <span key={`f-${r.kind}-${i}`} className="rounded-lg bg-saffron/10 px-2 py-1 text-[11px] text-saffron">
                  {describeCheck(r, lang)}
                </span>
              ))}
            </div>
            {!eligible && <p className="mt-1.5 text-[11px] text-muted-foreground">{copy.checkNote}</p>}
          </>}
          {note && (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                <span className="font-medium text-foreground/70">{copy.alsoNote}: </span>
                {note}
              </span>
            </p>
          )}
        </div>

        {catalog && (scheme.applicationSteps.length > 0 || scheme.applicationText || scheme.department || scheme.deadline || scheme.lastVerifiedAt) && <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{copy.nextStepsTitle}</p>
          {scheme.applicationSteps.length > 0 ? <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-foreground/80">{scheme.applicationSteps.map((step, index) => <li key={`${step}-${index}`}>{step}</li>)}</ol> : scheme.applicationText && <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-foreground/80">{scheme.applicationText}</p>}
          {(scheme.department || scheme.deadline || scheme.lastVerifiedAt) && <p className="mt-2 text-[10px] text-muted-foreground">{[scheme.department, scheme.deadline && `${copy.deadlineLabel}: ${scheme.deadline}`, scheme.lastVerifiedAt && `${copy.lastVerifiedLabel}: ${scheme.lastVerifiedAt}`].filter(Boolean).join(" · ")}</p>}
        </div>}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {scheme.link && <a href={scheme.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-xs font-medium text-paper transition hover:opacity-90">
            {catalog ? (scheme.linkIsOfficial ? copy.catalogOfficialSourceLink : copy.catalogApplicationLink) : copy.applyCta} <ArrowUpRight className="h-3.5 w-3.5" />
          </a>}
          {(scheme.dept || scheme.category) && <span className="text-[10px] text-muted-foreground">{scheme.dept || scheme.category}</span>}
        </div>
        <Link to={`/applications?scheme=${encodeURIComponent(scheme.id)}&name=${encodeURIComponent(name)}${scheme.link ? `&url=${encodeURIComponent(scheme.link)}` : ""}`} className="inline-flex text-xs font-medium text-leaf hover:underline">
          {copy.trackApplication}
        </Link>
      </div>
    </article>
  );
}
