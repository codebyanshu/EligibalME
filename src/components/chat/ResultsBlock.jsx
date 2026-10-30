import SchemeCard from "./SchemeCard";
import { CircleCheck, SearchX } from "lucide-react";

export default function ResultsBlock({ msg, lang, copy }) {
  const eligible = msg.eligible || [];
  const check = msg.check || [];
  const total = eligible.length + check.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CircleCheck className="h-4 w-4 text-leaf" strokeWidth={2} />
        <p className="font-display text-lg leading-snug">
          {copy.resultsTitle}{" "}
          <span className="text-muted-foreground">
            · {copy.resultsCount.replace("{n}", String(total))}
          </span>
        </p>
      </div>

      {total === 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <SearchX className="h-4 w-4 text-muted-foreground" />
            <p className="font-medium">{copy.noMatchTitle}</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{copy.noMatchBody}</p>
        </div>
      )}

      {eligible.length > 0 && (
        <div className="space-y-3">
          {eligible.map((row) => (
            <SchemeCard key={row.scheme.id} row={row} lang={lang} copy={copy} />
          ))}
        </div>
      )}

      {check.length > 0 && (
        <div className="space-y-3 pt-1">
          {eligible.length > 0 && (
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{copy.tierCheck}</p>
          )}
          {check.map((row) => (
            <SchemeCard key={row.scheme.id} row={row} lang={lang} copy={copy} />
          ))}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">{copy.resultsSub}</p>
    </div>
  );
}