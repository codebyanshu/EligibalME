import SchemeCard from "./SchemeCard";
import { CircleCheck, SearchX } from "lucide-react";
import CatalogRecommendations from "./CatalogRecommendations";

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
      <CatalogRecommendations recommendations={msg.catalogMatches} lang={lang} copy={copy} />
      {msg.webDiscoveries?.length > 0 && (
        <section className="space-y-2 rounded-2xl border border-saffron/25 bg-saffron/5 p-4">
          <div>
            <h3 className="font-display text-base">{copy.webDiscoveryTitle}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy.webDiscoveryNotice}</p>
          </div>
          {msg.webDiscoveries.map((item) => (
            <article key={item.url} className="rounded-xl border border-border bg-card p-3">
              <a href={item.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-foreground underline decoration-saffron/50 underline-offset-2">{item.title}</a>
              <p className="mt-1 text-[11px] text-muted-foreground">{item.source}</p>
              {item.snippet && <p className="mt-2 text-xs leading-relaxed text-foreground/80">{item.snippet}</p>}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
