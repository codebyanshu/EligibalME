import { useEffect, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import useNavigator from "@/hooks/useNavigator";
import { t } from "@/lib/i18n";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatComposer from "@/components/chat/ChatComposer";
import ProfileRail from "@/components/chat/ProfileRail";
import { cn } from "@/lib/utils";
import { ClipboardCheck, FileText, Search } from "lucide-react";

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

      <section className="mt-14 rounded-3xl border border-border/70 bg-card/55 px-5 py-9 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-foreground">{lang === "hi" ? "यह कैसे काम करता है" : lang === "pa" ? "ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ" : "How it works"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{lang === "hi" ? "योजनाएं खोजें, आधिकारिक पोर्टल पर आवेदन करें और अपनी प्रगति दर्ज रखें।" : lang === "pa" ? "ਸਕੀਮਾਂ ਲੱਭੋ, ਸਰਕਾਰੀ ਪੋਰਟਲ 'ਤੇ ਅਰਜ਼ੀ ਦਿਓ ਅਤੇ ਆਪਣੀ ਤਰੱਕੀ ਦਰਜ ਕਰੋ।" : "Discover schemes, apply through official portals, and keep track of your progress."}</p>
        </div>
        <div className="mx-auto mt-9 grid max-w-5xl gap-8 md:grid-cols-3">
          {[
            { icon: Search, title: lang === "hi" ? "योजनाएं खोजें" : lang === "pa" ? "ਸਕੀਮਾਂ ਲੱਭੋ" : "Discover schemes", body: lang === "hi" ? "अपनी जानकारी के आधार पर योजनाएं और पात्रता विवरण देखें।" : lang === "pa" ? "ਆਪਣੀ ਜਾਣਕਾਰੀ ਅਨੁਸਾਰ ਸਕੀਮਾਂ ਅਤੇ ਯੋਗਤਾ ਵੇਖੋ।" : "Explore schemes and eligibility details based on your profile." },
            { icon: FileText, title: lang === "hi" ? "आधिकारिक पोर्टल पर आवेदन करें" : lang === "pa" ? "ਸਰਕਾਰੀ ਪੋਰਟਲ 'ਤੇ ਅਰਜ਼ੀ ਦਿਓ" : "Apply online", body: lang === "hi" ? "ज़रूरी दस्तावेज़ तैयार करें और योजना के आधिकारिक पोर्टल पर जाएं।" : lang === "pa" ? "ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼ ਤਿਆਰ ਕਰੋ ਅਤੇ ਸਕੀਮ ਦੇ ਸਰਕਾਰੀ ਪੋਰਟਲ 'ਤੇ ਜਾਓ।" : "Prepare required documents and continue on the scheme's official portal." },
            { icon: ClipboardCheck, title: lang === "hi" ? "प्रगति दर्ज करें" : lang === "pa" ? "ਤਰੱਕੀ ਦਰਜ ਕਰੋ" : "Track progress", body: lang === "hi" ? "अपनी आवेदन स्थिति और अगली कार्रवाई को निजी तौर पर ट्रैक करें।" : lang === "pa" ? "ਆਪਣੀ ਅਰਜ਼ੀ ਦੀ ਸਥਿਤੀ ਅਤੇ ਅਗਲਾ ਕਦਮ ਨਿੱਜੀ ਤੌਰ 'ਤੇ ਟਰੈਕ ਕਰੋ।" : "Keep a private record of application status and your next steps." },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-saffron/10 text-saffron"><Icon className="h-6 w-6" /></span>
              <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
