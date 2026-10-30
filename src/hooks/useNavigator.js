import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ALL_SCHEMES, getScheme, schemesForQuestion } from "@/data/schemes";
import { rankSchemes } from "@/lib/eligibility";
import { answerLocally } from "@/lib/answerEngine";
import { base44 } from "@/api/base44Client";
import { askCatalog, discoverWebSchemes, getCatalogRecommendations, hasSchemeApi } from "@/lib/schemeApi";

const uid = () => Math.random().toString(36).slice(2, 9);
export const PROFILE_KEY = "haqdaar.profile";

const STEPS = ["age", "gender", "occupation", "category", "income", "state"];

export default function useNavigator(lang = "en") {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState("lang");
  const [profile, setProfile] = useState({});
  const [consent, setConsent] = useState(null);
  const [pending, setPending] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const push = useCallback((msg) => {
    setMessages((prev) => [...prev, { id: uid(), ...msg }]);
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setProfile({});
    setConsent(null);
    setPending(false);
    setStep("lang");
    push({ role: "bot", type: "text", key: "greeting" });
    push({ role: "bot", type: "question", step: "lang" });
  }, [push]);

  useEffect(() => {
    setHasSaved(Boolean(localStorage.getItem(PROFILE_KEY)));
    reset();
  }, [reset]);

  const respondFromDocuments = useCallback(
    (question) => {
      const local = answerLocally(question, lang);
      if (local) {
        push({ role: "bot", type: "answer", text: local.text, citations: local.citations, local: true });
      } else {
        push({ role: "bot", type: "error", question });
      }
    },
    [lang, push],
  );

  const askQuestion = useCallback(
    async (question) => {
      const trimmed = question.trim();
      if (!trimmed || pending) return;
      push({ role: "user", type: "text", text: trimmed });
      setPending(true);
      try {
        if (hasSchemeApi) {
          try {
            const retrieved = await askCatalog(trimmed, lang, consent ? profile : { state: profile.state });
            if (retrieved?.answer) {
              push({
                role: "bot",
                type: "answer",
                text: retrieved.answer,
                citations: retrieved.citations || [],
                sourceNotice: !retrieved.generated,
              });
              return;
            }
          } catch {
            // Keep the existing Base44 assistant available if the retrieval API is offline.
          }
        }
        const shortcutIds = schemesForQuestion(trimmed, 4);
        const matchIds = rankSchemes(ALL_SCHEMES, profile)
          .slice(0, 3)
          .map((r) => r.scheme.id);
        const schemeIds = Array.from(new Set([...shortcutIds, ...matchIds])).slice(0, 6);
        const res = await base44.functions.invoke("askSchemeAssistant", {
          question: trimmed,
          language: lang,
          schemeIds,
          profile: consent
            ? {
                age: profile.age,
                gender: profile.gender,
                occupation: profile.occupation,
                categories: profile.categories,
                incomeBand: profile.incomeBand,
                district: profile.district,
                state: profile.state,
              }
            : null,
        });
        const data = res.data || {};
        if (data.answer) {
          push({
            role: "bot",
            type: "answer",
            text: data.answer,
            citations: (data.citedIds || []).map(getScheme).filter(Boolean),
          });
        } else {
          respondFromDocuments(trimmed);
        }
      } catch (error) {
        respondFromDocuments(trimmed);
      } finally {
        setPending(false);
      }
    },
    [consent, lang, pending, profile, push, respondFromDocuments],
  );

  const finish = useCallback(
    async (finalProfile) => {
      setStep("chat");
      const ranked = rankSchemes(ALL_SCHEMES, finalProfile);
      const eligible = ranked.filter((r) => r.tier === "eligible");
      const check = ranked.filter((r) => r.tier === "check");
      let catalogMatches = [];
      let webDiscoveries = [];
      if (hasSchemeApi) {
        setPending(true);
        try {
          catalogMatches = await getCatalogRecommendations("", finalProfile);
        } catch {
          // Rule-based recommendations remain available if the catalogue service is offline.
        } finally {
          setPending(false);
        }
        try {
          const discovery = await discoverWebSchemes(finalProfile.state);
          webDiscoveries = discovery?.results || [];
        } catch {
          // Agent Reach is optional and may not be installed on this API host.
        }
      }
      push({ role: "bot", type: "results", eligible, check, catalogMatches, webDiscoveries });
      push({ role: "bot", type: "suggestions" });
      if (consent) {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(finalProfile));
        setHasSaved(true);
      }
    },
    [consent, push],
  );

  const nextStep = useCallback(
    (current) => {
      const idx = STEPS.indexOf(current);
      if (idx < STEPS.length - 1) {
        setStep(STEPS[idx + 1]);
        push({ role: "bot", type: "question", step: STEPS[idx + 1] });
      }
    },
    [push],
  );

  const answer = useCallback(
    (current, value) => {
      if (current === "age") {
        const age = Number(value);
        setProfile((p) => ({ ...p, age }));
        push({ role: "user", type: "text", text: String(age) });
        nextStep(current);
        return;
      }
      if (current === "gender") {
        setProfile((p) => ({ ...p, gender: value }));
        push({ role: "user", type: "choice", list: "gender", valueKey: value });
        nextStep(current);
        return;
      }
      if (current === "occupation") {
        setProfile((p) => ({ ...p, occupation: value }));
        push({ role: "user", type: "choice", list: "occupation", valueKey: value });
        nextStep(current);
        return;
      }
      if (current === "category") {
        setProfile((p) => ({ ...p, categories: value }));
        push({ role: "user", type: "choiceList", list: "category", valueKeys: value });
        nextStep(current);
        return;
      }
      if (current === "income") {
        setProfile((p) => ({ ...p, incomeBand: value }));
        push({ role: "user", type: "choice", list: "income", valueKey: value });
        nextStep(current);
        return;
      }
      if (current === "state") {
        const nextProfile = { ...profile, state: value };
        setProfile(nextProfile);
        push({ role: "user", type: "text", text: value });
        if (value === "Punjab") {
          setStep("district");
          push({ role: "bot", type: "question", step: "district" });
        } else {
          finish(nextProfile);
        }
        return;
      }
      if (current === "district") {
        const finalProfile = { ...profile, district: value };
        setProfile(finalProfile);
        push({ role: "user", type: "text", text: value });
        finish(finalProfile);
      }
    },
    [finish, nextStep, profile, push],
  );

  const giveConsent = useCallback(
    (agreed) => {
      setConsent(agreed);
      push({
        role: "user",
        type: "text",
        textKey: agreed ? "consentYes" : "consentNo",
      });
      push({ role: "bot", type: "text", key: agreed ? "consentSaidYes" : "consentSaidNo" });
      setStep("age");
      push({ role: "bot", type: "question", step: "age" });
    },
    [push],
  );

  const chooseLanguage = useCallback(() => {
    push({ role: "bot", type: "consent" });
    setStep("consent");
  }, [push]);

  const clearSaved = useCallback(() => {
    localStorage.removeItem(PROFILE_KEY);
    setHasSaved(false);
  }, []);

  const stepIndex = useMemo(() => {
    if (step === "district" && profile.state === "Punjab") return STEPS.length + 1;
    const i = STEPS.indexOf(step);
    return i >= 0 ? i + 1 : 0;
  }, [profile.state, step]);

  return {
    messages,
    step,
    stepIndex,
    totalSteps: STEPS.length + (profile.state === "Punjab" ? 1 : 0),
    profile,
    consent,
    pending,
    hasSaved,
    answer,
    askQuestion,
    giveConsent,
    chooseLanguage,
    restart: reset,
    clearSaved,
  };
}
