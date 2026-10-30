import SourcesList from "./SourcesList";
import { BookOpenCheck } from "lucide-react";

export default function AnswerBlock({ text, citations, copy, local }) {
  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 shadow-sm">
        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-leaf">
          <BookOpenCheck className="h-3 w-3" strokeWidth={2} />
          {copy.answerLabel}
        </div>
        <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-foreground/90">{text}</p>
        {local && <p className="mt-2 text-[10px] text-muted-foreground">{copy.localNote}</p>}
      </div>
      <SourcesList citations={citations} copy={copy} />
    </div>
  );
}