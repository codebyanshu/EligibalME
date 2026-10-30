import { ExternalLink } from "lucide-react";

export default function SourcesList({ citations, copy }) {
  if (!citations?.length) return null;
  return (
    <div className="rounded-xl border border-border/80 bg-secondary/50 p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{copy.citationsTitle}</p>
      <ul className="mt-1.5 space-y-1">
        {citations.map((s) => (
          <li key={s.id}>
            {s.link ? (
              <a href={s.link} target="_blank" rel="noreferrer" className="group flex items-start gap-1.5 text-xs text-foreground/75 transition hover:text-foreground">
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground group-hover:text-saffron" />
                <span className="underline decoration-border decoration-dotted underline-offset-2">{s.source}</span>
              </a>
            ) : (
              <span className="flex items-start gap-1.5 text-xs text-foreground/75">{s.source}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
