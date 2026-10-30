import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ALL_SCHEMES, searchSchemes } from "@/data/schemes";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowUpRight, FileText, Search } from "lucide-react";

export default function SchemesPage() {
  const { lang } = useOutletContext();
  const copy = t(lang);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const list = useMemo(() => {
    const base = query ? searchSchemes(query) : ALL_SCHEMES;
    return filter === "all" ? base : base.filter((s) => s.level === filter);
  }, [query, filter]);

  const filters = [
    { key: "all", label: copy.filterAll },
    { key: "central", label: copy.filterCentral },
    { key: "state", label: copy.filterState },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {copy.backToChat}
      </Link>

      <h1 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">{copy.schemesTitle}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{copy.schemesSub}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 sm:max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.searchPlaceholder}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-0.5">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs transition",
                filter === f.key ? "bg-ink text-paper" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <a
            key={s.id}
            href={s.link}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]",
                    s.level === "central" ? "bg-secondary text-foreground/70" : "bg-saffron/15 text-saffron",
                  )}
                >
                  {s.level === "central" ? copy.centralTag : copy.stateTag}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-saffron" />
              </div>
              <p className="mt-2 font-display text-base leading-snug">{s.name[lang]}</p>
              <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{s.summary[lang]}</p>
            </div>
            <p className="mt-3 flex items-center gap-1.5 border-t border-border/70 pt-2.5 text-[11px] text-leaf">
              <FileText className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{s.benefit[lang]}</span>
            </p>
          </a>
        ))}
      </div>

      {list.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">{copy.resultsEmpty}</p>
      )}
    </div>
  );
}