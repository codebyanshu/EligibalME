import { SearchCheck } from "lucide-react";
import SchemeCard from "./SchemeCard";

export default function CatalogRecommendations({ recommendations, lang, copy }) {
  if (!recommendations?.length) return null;

  return (
    <section className="space-y-3 border-t border-border/70 pt-4" aria-label={copy.catalogTitle}>
      <div className="flex items-center gap-2">
        <SearchCheck className="h-4 w-4 text-saffron" />
        <h3 className="font-display text-base">{copy.catalogTitle}</h3>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{copy.catalogNotice}</p>
      <div className="space-y-3">
        {recommendations.map((record) => {
          const scheme = {
            id: record.id,
            catalog: true,
            level: record.level,
            name: record.title,
            summary: record.summary,
            benefit: record.benefits,
            eligibility: record.eligibility,
            docs: (record.documents || "").split(/[,;|\n•]+/).map((item) => item.trim()).filter(Boolean),
            link: record.sourceUrls?.[0] || "",
            category: record.category,
          };

          return <SchemeCard key={`${record.id}-${record.sourceRow}`} row={{ scheme, reasons: [], failed: [] }} lang={lang} copy={copy} />;
        })}
      </div>
    </section>
  );
}
