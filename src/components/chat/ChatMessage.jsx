import { GENDERS, INCOME_BANDS, OCCUPATIONS, CATEGORIES } from "@/data/taxonomy";
import AnswerBlock from "./AnswerBlock";
import ChatConsent from "./ChatConsent";
import QuestionBlock from "./QuestionBlock";
import ResultsBlock from "./ResultsBlock";
import SourcesList from "./SourcesList";
import { AlertCircle, RefreshCw } from "lucide-react";

const LISTS = { gender: GENDERS, occupation: OCCUPATIONS, income: INCOME_BANDS, category: CATEGORIES };

function userText(msg, copy) {
  if (msg.textKey) return copy[msg.textKey];
  if (msg.text) return msg.text;
  if (msg.type === "choice") {
    const found = (LISTS[msg.list] || []).find((x) => x.key === msg.valueKey);
    return found ? found.label[copy.__lang] : msg.valueKey;
  }
  if (msg.type === "choiceList") {
    return (msg.valueKeys || [])
      .map((k) => (LISTS[msg.list] || []).find((x) => x.key === k)?.label[copy.__lang] || k)
      .join(", ");
  }
  return "";
}

export default function ChatMessage({ msg, lang, copy, active, stepIndex, totalSteps, handlers }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="rise flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-paper shadow-sm">
          {userText(msg, { ...copy, __lang: lang })}
        </div>
      </div>
    );
  }

  return (
    <div className="rise flex gap-2.5">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-medium text-paper">
        ਹ
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        {msg.type === "text" && (
          <p className="max-w-[62ch] text-[15px] leading-relaxed text-foreground/90">
            {msg.key ? copy[msg.key] : msg.text}
          </p>
        )}

        {msg.type === "question" && (
          <QuestionBlock
            msg={msg}
            lang={lang}
            copy={copy}
            active={active}
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            onAnswer={handlers.answer}
            onLanguage={(key) => handlers.language(key)}
          />
        )}

        {msg.type === "consent" && <ChatConsent copy={copy} active={active} onConsent={handlers.consent} />}

        {msg.type === "results" && <ResultsBlock msg={msg} lang={lang} copy={copy} />}

        {msg.type === "answer" && (
          <AnswerBlock text={msg.text} citations={msg.citations} copy={copy} local={msg.local} sourceNotice={msg.sourceNotice} />
        )}

        {msg.type === "sourcesOnly" && <SourcesList citations={msg.citations} copy={copy} />}

        {msg.type === "suggestions" && active && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{copy.askTitle}</p>
            <div className="flex flex-wrap gap-2">
              {copy.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handlers.ask(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs text-foreground/80 transition hover:border-saffron/50 hover:bg-saffron/5"
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{copy.askHint}</p>
          </div>
        )}

        {msg.type === "error" && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{copy.errorTitle}</p>
              <p className="text-xs text-muted-foreground">{copy.errorBody}</p>
              <button
                type="button"
                onClick={() => handlers.ask(msg.question)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs transition hover:border-saffron/50"
              >
                <RefreshCw className="h-3 w-3" /> {copy.retry}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
