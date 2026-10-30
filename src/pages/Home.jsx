import { useEffect, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import useNavigator from "@/hooks/useNavigator";
import { t } from "@/lib/i18n";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatComposer from "@/components/chat/ChatComposer";
import ProfileRail from "@/components/chat/ProfileRail";
import { cn } from "@/lib/utils";

export default function Home() {
  const { lang, setLang } = useOutletContext();
  const copy = t(lang);
  const nav = useNavigator(lang);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [nav.messages, nav.pending]);

  const handlers = useMemo(
    () => ({
      answer: nav.answer,
      consent: nav.giveConsent,
      ask: nav.askQuestion,
      language: (key) => {
        setLang(key);
        nav.chooseLanguage();
      },
    }),
    [nav.answer, nav.askQuestion, nav.giveConsent, nav.chooseLanguage, setLang],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 lg:py-9">
      <div className="mb-4 lg:hidden">
        <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{copy.heroKicker}</p>
        <h1 className="mt-1 font-display text-2xl leading-tight text-foreground">{copy.heroTitle}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[318px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <ProfileRail
            copy={copy}
            lang={lang}
            profile={nav.profile}
            consent={nav.consent}
            stepIndex={nav.stepIndex}
            totalSteps={nav.totalSteps}
            hasSaved={nav.hasSaved}
            onRestart={nav.restart}
            onClear={nav.clearSaved}
          />
        </aside>

        <section className="flex h-[calc(100dvh-8.5rem)] min-h-[540px] flex-col overflow-hidden rounded-3xl border border-border bg-card/85 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.55)] backdrop-blur">
          <header className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf" />
              </span>
              <p className="text-xs font-medium tracking-wide text-foreground/80">
                {lang === "hi" ? "योजना सहायक" : lang === "pa" ? "ਸਕੀਮ ਸਹਾਇਕ" : "Scheme assistant"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: nav.totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    i < nav.stepIndex ? "w-5 bg-leaf" : "w-5 bg-border",
                  )}
                />
              ))}
            </div>
          </header>

          <div className="scroll-thin flex-1 space-y-5 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
            {nav.messages.map((msg, i) => {
              const active =
                msg.type === "suggestions"
                  ? nav.step === "chat"
                  : i === nav.messages.length - 1 &&
                    ((msg.type === "question" && msg.step === nav.step) ||
                      (msg.type === "consent" && nav.step === "consent"));
              return (
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  lang={lang}
                  copy={copy}
                  active={active}
                  stepIndex={nav.stepIndex}
                  totalSteps={nav.totalSteps}
                  handlers={handlers}
                />
              );
            })}

            {nav.pending && (
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[11px] text-paper">ਹ</span>
                <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  </span>
                  <span className="text-[11px] text-muted-foreground">{copy.thinking}</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <ChatComposer copy={copy} pending={nav.pending} enabled={nav.step === "chat"} onAsk={nav.askQuestion} />
        </section>
      </div>
    </div>
  );
}