"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { GlowBorderCard } from "@/components/ui/glow-border-card";
import { LiquidButton } from "@/components/ui/liquid-button";
import StaggerText from "@/components/ui/staggerText";
import { KineticTextLoader } from "@/components/ui/kinetic-text-loader";
import { T, type Lang } from "./i18n";

type Stage = "form" | "loading" | "done";
const LANGS: { id: Lang; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "ar", label: "العربية" },
  { id: "tr", label: "TR" },
];
const BUDGETS = ["Under $500", "$500 - $2,000", "$2,000 - $10,000", "$10,000+", "Not sure yet"] as const;

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } } };
const item: Variants = {
  // transform + opacity only: GPU-composited, no per-frame repaint
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};
const swap = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -16, scale: 0.98, transition: { duration: 0.25 } },
};

function safeStore(k: string, v?: string) {
  try {
    if (v !== undefined) localStorage.setItem(k, v);
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}

export default function Page() {
  const [lang, setLang] = useState<Lang>("en");
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<{ name: string; reply: string }>({ name: "", reply: "" });
  const formRef = useRef<HTMLFormElement>(null);
  const t = T[lang];

  // language: ?lang= → saved choice → browser language
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("lang");
    const nav = (navigator.language || "en").slice(0, 2);
    const pick = [q, safeStore("lang"), nav].find((x) => x && x in T) as Lang | undefined;
    if (pick) setLang(pick);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    safeStore("lang", lang);
  }, [lang]);

  // animated "AI is working" steps
  useEffect(() => {
    if (stage !== "loading") return;
    setStep(0);
    const a = setTimeout(() => setStep(1), 1800);
    const b = setTimeout(() => setStep(2), 3800);
    return () => (clearTimeout(a), clearTimeout(b));
  }, [stage]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    for (const k of ["name", "email", "phone", "budget", "message"]) d[k] = (d[k] || "").trim();
    setError("");
    if (!d.name || !d.email || !d.phone || !d.budget || !d.message) return setError(t.eReq);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return setError(t.eMail);
    if (!/^\+?[\d\s\-()]{7,20}$/.test(d.phone)) return setError(t.ePhone);
    d.lang = lang;
    setStage("loading");
    try {
      const r = await fetch("/webhook/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      setResult({ name: j.first_name || d.name.split(" ")[0], reply: j.reply || "" });
      setStage("done");
    } catch {
      setStage("form");
      setError(t.eNet);
    }
  }

  const isAr = lang === "ar";
  return (
    <main
      className="relative min-h-screen w-full overflow-hidden px-4 py-8 sm:py-12"
      style={{ fontFamily: isAr ? "var(--font-cairo), sans-serif" : "var(--font-inter), sans-serif" }}
    >
      {/* Lightweight aurora: pre-blurred radial gradients moved with transform only */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="aurora-blob aurora-a" />
        <div className="aurora-blob aurora-b" />
        <div className="aurora-blob aurora-c" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[640px]">
        {/* top bar */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 font-semibold">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#22d3ee] text-lg"
            >
              ⚡
            </motion.div>
            <span dir="ltr">Mohammad Adeeb</span>
          </div>
          <div className="relative flex rounded-full border border-white/10 bg-[#11142a] p-1" role="group" aria-label="Language">
            {LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLang(l.id)}
                className="relative rounded-full px-3 py-1.5 text-[13px] font-semibold text-white/60 transition-colors data-[on=true]:text-white"
                data-on={lang === l.id}
              >
                {lang === l.id && (
                  <motion.span layoutId="lang-pill" className="absolute inset-0 rounded-full bg-[#7c5cff]" transition={{ type: "spring", stiffness: 420, damping: 32 }} />
                )}
                <span className="relative">{l.label}</span>
              </button>
            ))}
          </div>
        </motion.header>

        {/* Vengeance UI animated glow card */}
        <GlowBorderCard
          width="100%"
          aspectRatio="auto"
          borderRadius="24px"
          colorPreset="aurora"
          animationDuration={8}
          borderWidth="2px"
          blurAmount="0px"
          inset="0px"
          className="glow-card !bg-[#0d1020] !backdrop-blur-none shadow-[0_0_40px_-8px_rgba(124,92,255,.45),0_30px_80px_rgba(0,0,0,.55)]"
        >
          <div className="w-full p-3 sm:p-6">
            <AnimatePresence mode="wait">
              {stage === "form" && (
                <motion.form key={`form-${lang}`} ref={formRef} onSubmit={submit} noValidate {...swap}>
                  <motion.div variants={list} initial="hidden" animate="show">
                    <motion.span variants={item} className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                      {t.badge}
                    </motion.span>
                    <h1 className="mb-2 text-[26px] font-bold leading-tight sm:text-3xl">
                      {/* word-by-word reveal (letters would break Arabic joining) */}
                      <StaggerText key={lang} divideBy="word">{t.title}</StaggerText>
                    </h1>
                    <motion.p variants={item} className="mb-6 text-[15px] leading-relaxed text-white/60">
                      {t.subtitle}
                    </motion.p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label={t.name} req><input name="name" maxLength={80} autoComplete="name" className="lead-input" /></Field>
                      <Field label={t.email} req><input name="email" type="email" maxLength={120} autoComplete="email" className="lead-input" dir="ltr" /></Field>
                      <Field label={t.phone} req><input name="phone" type="tel" maxLength={25} autoComplete="tel" placeholder="+90 5xx xxx xx xx" className="lead-input" dir="ltr" /></Field>
                      <Field label={t.company}><input name="company" maxLength={100} autoComplete="organization" className="lead-input" /></Field>
                      <Field label={t.type} full>
                        <div className="flex flex-wrap gap-2">
                          {t.types.map((x, i) => (
                            <label key={i} className="cursor-pointer">
                              <input type="radio" name="type" value={T.en.types[i]} className="peer sr-only" defaultChecked={i === 0} />
                              <motion.span
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-block rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 text-[13px] text-white/70 transition-colors peer-checked:border-[#8b7bff] peer-checked:bg-[#7c5cff]/25 peer-checked:text-white"
                              >
                                {x}
                              </motion.span>
                            </label>
                          ))}
                        </div>
                      </Field>
                      <Field label={t.budget} req full>
                        <select name="budget" defaultValue="" className="lead-input cursor-pointer">
                          <option value="" disabled>{t.choose}</option>
                          {BUDGETS.map((b, i) => <option key={b} value={b}>{t.budgets[i]}</option>)}
                        </select>
                      </Field>
                      <Field label={t.message} req full>
                        <textarea name="message" maxLength={3000} rows={5} placeholder={t.msgPh} className="lead-input resize-y leading-relaxed" />
                      </Field>
                      <input className="hp-field" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                    </div>

                    <motion.div variants={item} className="mt-6">
                      <LiquidButton type="submit" variant="dark" size="lg" className="w-full text-base font-semibold" fillColor="#7c5cff" activeTextColor="#ffffff" borderColor="#8b7bff">
                        {t.send}
                      </LiquidButton>
                    </motion.div>
                    <AnimatePresence>
                      {error && (
                        <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }} exit={{ opacity: 0 }} role="alert" className="mt-3 text-center text-sm text-red-400">
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <motion.p variants={item} className="mt-3 text-center text-xs text-white/45">{t.privacy}</motion.p>
                  </motion.div>
                </motion.form>
              )}

              {stage === "loading" && (
                <motion.div key="loading" {...swap} className="flex flex-col items-center py-10 text-center" aria-live="polite">
                  <KineticTextLoader text="Loading" className="mb-6 scale-75 text-white" />
                  <h2 className="mb-5 text-xl font-bold">{t.working}</h2>
                  <ul className="inline-flex flex-col gap-3 text-start">
                    {[t.s1, t.s2, t.s3].map((s, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: isAr ? 12 : -12 }}
                        animate={{ opacity: i <= step ? 1 : 0.35, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className={`flex items-center gap-2 text-[15px] ${i < step ? "text-emerald-400" : "text-white"}`}
                      >
                        <span className="grid w-5 place-items-center">{i < step ? "✓" : i === step ? <Dot /> : "•"}</span>
                        {s}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {stage === "done" && (
                <motion.div key="done" {...swap} className="py-4 text-center" aria-live="polite">
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                    className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border border-emerald-400/40 bg-emerald-400/15 text-3xl text-emerald-300"
                  >
                    ✓
                  </motion.div>
                  <h2 className="text-2xl font-bold">
                    <StaggerText key={`done-${lang}`}>{t.done.replace("{n}", result.name)}</StaggerText>
                  </h2>
                  <p className="mt-2 text-[15px] text-white/60">{t.doneSub}</p>
                  {result.reply && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45, duration: 0.5 }}
                      className="mt-5 whitespace-pre-line rounded-2xl border border-white/10 bg-white/5 p-5 text-start text-[15px] leading-7"
                    >
                      {result.reply}
                    </motion.div>
                  )}
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => setStage("form")}
                    className="mt-5 rounded-xl border border-white/15 px-5 py-2.5 font-semibold"
                  >
                    {t.again}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlowBorderCard>

        <p className="mt-6 text-center text-xs text-white/40">{t.foot}</p>
      </div>
    </main>
  );
}

function Field({ label, req, full, children }: { label: string; req?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <motion.div variants={item} className={full ? "sm:col-span-2" : ""}>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-white/80">
          {label} {req && <span className="text-cyan-300">*</span>}
        </span>
        {children}
      </label>
    </motion.div>
  );
}

function Dot() {
  return (
    <motion.span
      className="block h-2.5 w-2.5 rounded-full bg-[#8b7bff]"
      animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
    />
  );
}
