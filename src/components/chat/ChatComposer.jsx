import { useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";

export default function ChatComposer({ copy, pending, enabled, onAsk }) {
  const [value, setValue] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!value.trim() || pending) return;
    onAsk(value);
    setValue("");
  };

  return (
    <form onSubmit={submit} className="border-t border-border/80 bg-card/80 px-3 py-3 backdrop-blur sm:px-5">
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-background/70 px-3 py-2 focus-within:border-saffron/60">
        <textarea
          rows={1}
          value={value}
          disabled={!enabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) submit(e);
          }}
          placeholder={enabled ? copy.askPlaceholder : copy.askHint}
          className="max-h-28 min-h-6 flex-1 resize-none bg-transparent py-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!enabled || pending || !value.trim()}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-ink text-paper transition hover:opacity-90 disabled:opacity-30"
          aria-label={copy.send}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-1.5 px-1 text-[10px] leading-relaxed text-muted-foreground">{copy.disclaimer}</p>
    </form>
  );
}