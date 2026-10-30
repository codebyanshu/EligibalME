import { useState } from "react";
import { LANGUAGES, GENDERS, OCCUPATIONS, CATEGORIES, INCOME_BANDS, DISTRICTS, INDIAN_STATES_AND_UTS } from "@/data/taxonomy";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

const PROMPTS = {
  lang: "languageTitle",
  age: "qAge",
  gender: "qGender",
  occupation: "qOccupation",
  category: "qCategory",
  income: "qIncome",
  state: "qState",
  district: "qDistrict",
};

const HINTS = { age: "qAgeHint", category: "qCategoryHint" };

function Chip({ children, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition",
        selected
          ? "border-ink bg-ink text-paper"
          : "border-border bg-card text-foreground/85 hover:border-saffron/60 hover:bg-saffron/5",
      )}
    >
      {children}
    </button>
  );
}

export default function QuestionBlock({ msg, lang, copy, active, stepIndex, totalSteps, onAnswer, onLanguage }) {
  const step = msg.step;
  const [age, setAge] = useState("");
  const [cats, setCats] = useState([]);
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");

  const prompt = copy[PROMPTS[step]] || "";
  const numbered = stepIndex > 0;
  const disabled = !active;

  return (
    <div className={cn("space-y-3 transition", disabled && "opacity-55")}>
      {numbered && (
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {copy.stepLabel} {stepIndex} {copy.ofLabel} {totalSteps}
        </p>
      )}
      <p className="font-display text-lg leading-snug text-foreground">{prompt}</p>
      {HINTS[step] && <p className="text-xs text-muted-foreground">{copy[HINTS[step]]}</p>}

      {step === "lang" && (
        <div className="grid gap-2 sm:grid-cols-3">
          {LANGUAGES.map((l) => (
            <button
              key={l.key}
              type="button"
              disabled={disabled}
              onClick={() => onLanguage(l.key)}
              className="rounded-xl border border-border bg-card px-3 py-3 text-left transition hover:border-saffron/60 hover:bg-saffron/5 disabled:cursor-default"
            >
              <span className="block font-display text-base">{l.label}</span>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {l.key === "pa" ? "Punjabi" : l.key === "hi" ? "Hindi" : "English"}
              </span>
            </button>
          ))}
        </div>
      )}

      {step === "age" && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(age);
            if (n >= 1 && n <= 110) onAnswer("age", n);
          }}
        >
          <div className="flex items-center rounded-xl border border-border bg-card px-3">
            <input
              type="number"
              min={1}
              max={110}
              value={age}
              disabled={disabled}
              onChange={(e) => setAge(e.target.value)}
              placeholder={copy.agePlaceholder}
              className="w-24 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <span className="text-xs text-muted-foreground">{lang === "hi" ? "वर्ष" : lang === "pa" ? "ਸਾਲ" : "years"}</span>
          </div>
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm text-paper transition hover:opacity-90 disabled:opacity-40"
          >
            {copy.ageAction} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      )}

      {(step === "gender" || step === "occupation" || step === "income") && (
        <div className="flex flex-wrap gap-2">
          {(step === "gender" ? GENDERS : step === "occupation" ? OCCUPATIONS : INCOME_BANDS).map((o) => (
            <Chip key={o.key} selected={false} onClick={() => !disabled && onAnswer(step, o.key)}>
              {o.label[lang]}
            </Chip>
          ))}
        </div>
      )}

      {step === "category" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip
                key={c.key}
                selected={cats.includes(c.key)}
                onClick={() =>
                  !disabled &&
                  setCats((prev) => (prev.includes(c.key) ? prev.filter((k) => k !== c.key) : [...prev, c.key]))
                }
              >
                {c.label[lang]}
              </Chip>
            ))}
          </div>
          <button
            type="button"
            disabled={disabled || !cats.length}
            onClick={() => onAnswer("category", cats)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm text-paper transition hover:opacity-90 disabled:opacity-40"
          >
            {copy.next} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {step === "state" && (
        <div className="flex flex-wrap items-center gap-2">
          <select value={state} disabled={disabled} onChange={(e) => setState(e.target.value)} className="max-w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-saffron/60">
            <option value="">{copy.selectState}</option>
            {INDIAN_STATES_AND_UTS.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <button type="button" disabled={disabled || !state} onClick={() => onAnswer("state", state)} className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm text-paper transition hover:opacity-90 disabled:opacity-40">
            {copy.stateAction} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {step === "district" && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={district}
            disabled={disabled}
            onChange={(e) => setDistrict(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-saffron/60"
          >
            <option value="">—</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={disabled || !district}
            onClick={() => onAnswer("district", district)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm text-paper transition hover:opacity-90 disabled:opacity-40"
          >
            {copy.districtAction} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
