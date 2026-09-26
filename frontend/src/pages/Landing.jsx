import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, Brain, GitFork, Route, Languages, Mic2, AlertTriangle,
  GraduationCap, LineChart, ArrowRight, Check, X, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun } from "lucide-react";

const LOOP = [
  "Diagnostic", "Knowledge Analysis", "Gap Detection", "Prerequisite Analysis",
  "Personalized Path", "AI Tutor", "Adaptive Practice", "Updated Profile",
];

const FEATURES = [
  { icon: Brain, title: "AI Learning Twin", desc: "A living model of what you know, don't know, and should learn next." },
  { icon: AlertTriangle, title: "Knowledge Gap Detection", desc: "Finds the exact prerequisite holding you back, not just the symptom." },
  { icon: Route, title: "Adaptive Learning Paths", desc: "Your roadmap rewrites itself as your mastery changes." },
  { icon: Languages, title: "Multilingual AI Tutor", desc: "Learn in English, Hindi, Marathi or Hinglish." },
  { icon: Mic2, title: "Voice Conversation", desc: "Talk face-to-face with an AI tutor that listens and speaks." },
  { icon: GitFork, title: "Misconception Detection", desc: "Understands why an answer was wrong, then fixes the root cause." },
  { icon: GraduationCap, title: "Teach-Back", desc: "Prove real understanding by explaining concepts back." },
  { icon: LineChart, title: "Continuous Profile", desc: "Every action updates your learning profile in real time." },
];

const COMPARE = [
  ["Understands the learner first", true, false],
  ["Detects prerequisite gaps", true, false],
  ["Explains 'why this next?'", true, false],
  ["Adapts difficulty in real time", true, false],
  ["Detects misconceptions", true, false],
  ["Same content for everyone", false, true],
];

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">LearnTwin AI</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} data-testid="landing-theme-toggle" className="grid h-9 w-9 place-items-center rounded-lg border text-muted-foreground hover:bg-muted">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button variant="ghost" onClick={() => navigate("/login")} data-testid="landing-login-btn">Log in</Button>
            <Button onClick={() => navigate("/login?demo=1")} data-testid="landing-demo-nav-btn">Explore Demo</Button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden bg-grid">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Activity className="h-3.5 w-3.5" /> Adaptive Learning Engine
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Meet your <span className="text-primary">AI Learning Twin.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              An adaptive AI tutor that understands what you know, discovers what you're missing,
              and builds a learning path specifically for you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate("/login")} data-testid="hero-start-diagnostic-btn" className="group">
                Start Diagnostic
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/login?demo=1")} data-testid="hero-explore-demo-btn">
                Explore Demo
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              "Other platforms give everyone content. <span className="font-semibold text-foreground">LearnTwin AI first understands the learner.</span>"
            </p>
          </motion.div>

          {/* engine preview card */}
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-3xl border bg-card p-6 shadow-2xl shadow-primary/5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Recommendation</p>
            <div className="mt-3 rounded-2xl bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground">What should you learn next?</p>
              <p className="mt-1 font-display text-2xl font-bold text-primary">Return Values</p>
              <p className="mt-2 text-sm">
                You're attempting <b>Recursion (24%)</b>, but its prerequisite <b>Return Values</b> is only <b>38%</b>.
                Strengthen it first.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              {["Return Values", "Functions", "Recursion"].map((s, i) => (
                <span key={s} className="flex items-center gap-2">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{s}</span>
                  {i < 2 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* adaptive loop */}
      <section className="border-y bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-center font-display text-2xl font-bold tracking-tight sm:text-3xl">The continuous adaptive loop</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">Every feature feeds data back into your learning profile.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {LOOP.map((step, i) => (
              <motion.div key={step} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2">
                <span className="rounded-xl border bg-card px-3 py-2 text-sm font-medium">{step}</span>
                {i < LOOP.length - 1 && <ArrowRight className="h-4 w-4 text-primary" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* features bento */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Built to understand, not just deliver</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
              className="rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-display font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* comparison */}
      <section className="border-t bg-card/40">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-display text-2xl font-bold tracking-tight sm:text-3xl">Adaptive Engine vs Static LMS</h2>
          <div className="mt-8 overflow-hidden rounded-2xl border bg-card">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b bg-muted/40 px-5 py-3 text-sm font-semibold">
              <span></span>
              <span className="w-24 text-center text-primary">LearnTwin</span>
              <span className="w-24 text-center text-muted-foreground">Static LMS</span>
            </div>
            {COMPARE.map(([label, a, b]) => (
              <div key={label} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b px-5 py-3 text-sm last:border-0">
                <span>{label}</span>
                <span className="grid w-24 place-items-center">{a ? <Check className="h-5 w-5 text-emerald-500" /> : <X className="h-5 w-5 text-muted-foreground" />}</span>
                <span className="grid w-24 place-items-center">{b ? <Check className="h-5 w-5 text-emerald-500" /> : <X className="h-5 w-5 text-muted-foreground" />}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* cta footer */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Ready to meet your Learning Twin?</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Assess → Understand → Personalize → Teach → Test → Learn → Adapt.</p>
        <Button size="lg" className="mt-7" onClick={() => navigate("/login?demo=1")} data-testid="footer-cta-btn">
          Explore the Demo <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        LearnTwin AI · Your learning path. Your pace. Your AI tutor.
      </footer>
    </div>
  );
}
