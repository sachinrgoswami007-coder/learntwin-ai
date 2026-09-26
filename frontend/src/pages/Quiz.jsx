import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, CheckCircle2, XCircle, AlertTriangle, ArrowRight, TrendingUp,
  TrendingDown, Wrench, Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { useStudent } from "@/context/StudentContext";
import { PageHeader, fade } from "@/components/common";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DIFF_LABELS = ["Easy", "Medium", "Hard"];

export default function Quiz() {
  const [difficulty, setDifficulty] = useState("medium");
  const [question, setQuestion] = useState(null);
  const [conceptName, setConceptName] = useState("");
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seen, setSeen] = useState([]);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [diffPercent, setDiffPercent] = useState(50);
  const { refresh } = useStudent();
  const navigate = useNavigate();

  const load = useCallback(async (diff, exclude) => {
    setLoading(true);
    setSelected(null);
    setFeedback(null);
    try {
      const d = await api.getQuizQuestion({ difficulty: diff, exclude: exclude.join(",") });
      setQuestion(d.question);
      setConceptName(d.concept_name);
    } catch {
      toast.error("Could not load question.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load("medium", []); }, [load]);

  const submit = async () => {
    if (!selected) return;
    try {
      const res = await api.submitQuiz({ question_id: question.id, selected, difficulty });
      setFeedback(res);
      setDifficulty(res.next_difficulty);
      setDiffPercent(res.difficulty_percent);
      setWrongStreak((w) => (res.correct ? 0 : w + 1));
      setSeen((s) => [...s, question.id]);
      await refresh();
    } catch {
      toast.error("Could not submit answer.");
    }
  };

  const next = () => load(feedback.next_difficulty, [...seen, question.id]);
  const diffIndex = DIFF_LABELS.findIndex((d) => d.toLowerCase() === difficulty);

  const pickLevel = (lvl) => {
    const idx = DIFF_LABELS.map((x) => x.toLowerCase()).indexOf(lvl);
    setDifficulty(lvl);
    setDiffPercent(Math.round((idx / 2) * 100));
    load(lvl, seen);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Adaptive Quiz" title="Practice that adapts to you"
        subtitle="Difficulty shifts with every answer, and questions target your weak areas." />

      <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="start-level-picker">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start at</span>
        {DIFF_LABELS.map((lvl) => (
          <button key={lvl} onClick={() => pickLevel(lvl.toLowerCase())} disabled={loading}
            data-testid={`level-${lvl.toLowerCase()}-btn`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${difficulty === lvl.toLowerCase() ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            {lvl}
          </button>
        ))}
        <span className="text-[11px] text-muted-foreground">· then it auto-adjusts to you</span>
      </div>

      {/* difficulty slider */}
      <div className="mb-5 rounded-2xl border bg-card p-4" data-testid="difficulty-meter">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Adaptive Difficulty</span>
          <span className="text-primary">{DIFF_LABELS[diffIndex] || "Medium"}</span>
        </div>
        <div className="relative h-2 w-full rounded-full bg-muted">
          <motion.div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500"
            animate={{ width: `${diffPercent}%` }} transition={{ duration: 0.5 }} />
          <motion.div className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow"
            animate={{ left: `calc(${diffPercent}% - 8px)` }} transition={{ duration: 0.5 }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Easy</span><span>Hard</span>
        </div>
      </div>

      {wrongStreak >= 2 && feedback && !feedback.correct && (
        <motion.div {...fade()} className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4" data-testid="prereq-alert">
          <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="text-sm">
            <p className="font-semibold">Let's step back to a prerequisite.</p>
            <p className="text-muted-foreground">You've missed a couple in a row. We recommend strengthening <b>{feedback.recommendation.concept_name}</b> first.</p>
            <Button size="sm" className="mt-2" onClick={() => navigate(`/app/tutor-chat?concept=${feedback.recommendation.concept}`)} data-testid="fix-prereq-btn">
              Review {feedback.recommendation.concept_name}
            </Button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="grid h-64 place-items-center rounded-2xl border bg-card"><div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={question?.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border bg-card p-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Target className="h-3.5 w-3.5" /> {conceptName} · {question?.difficulty}
            </div>
            <p className="whitespace-pre-wrap font-medium">{question?.text}</p>
            <div className="mt-5 space-y-2.5">
              {question?.options.map((o) => {
                const isSel = selected === o.id;
                let cls = "hover:bg-muted";
                if (feedback) {
                  if (o.id === feedback.correct_option) cls = "border-emerald-500 bg-emerald-500/10";
                  else if (isSel) cls = "border-red-500 bg-red-500/10";
                  else cls = "opacity-60";
                } else if (isSel) cls = "border-primary bg-primary/10";
                return (
                  <button key={o.id} disabled={!!feedback} data-testid={`quiz-option-${o.id}`}
                    onClick={() => setSelected(o.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all ${cls}`}>
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold">{o.id.toUpperCase()}</span>
                    <span className="whitespace-pre-wrap font-mono text-[13px]">{o.text}</span>
                    {feedback && o.id === feedback.correct_option && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />}
                    {feedback && isSel && o.id !== feedback.correct_option && <XCircle className="ml-auto h-4 w-4 text-red-500" />}
                  </button>
                );
              })}
            </div>

            {!feedback ? (
              <Button className="mt-5 w-full" disabled={!selected} onClick={submit} data-testid="quiz-submit-answer-btn">Submit Answer</Button>
            ) : (
              <motion.div {...fade()} className="mt-5 space-y-4">
                <div className={`rounded-xl p-4 ${feedback.correct ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                  <div className="flex items-center justify-between">
                    <p className={`flex items-center gap-2 font-semibold ${feedback.correct ? "text-emerald-600" : "text-red-600"}`}>
                      {feedback.correct ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      {feedback.correct ? "Correct!" : "Not quite."}
                    </p>
                    <span className="flex items-center gap-1 text-sm font-medium" data-testid="mastery-change">
                      {feedback.new_mastery >= (feedback.old_mastery ?? 0) ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                      {feedback.old_mastery ?? 0}% → {feedback.new_mastery}%
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{feedback.explanation}</p>
                  <p className="mt-2 text-xs text-muted-foreground"><b>Concept tested:</b> {feedback.concept_tested}</p>
                </div>

                {feedback.misconception && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4" data-testid="misconception-panel">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600">
                      <AlertTriangle className="h-4 w-4" /> Misconception Detected
                    </p>
                    <p className="mt-2 font-semibold">{feedback.misconception.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{feedback.misconception.explanation}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Confidence: <b className="text-foreground">{feedback.misconception.confidence}</b></span>
                    </div>
                    <Button size="sm" variant="outline" className="mt-3" data-testid="fix-misconception-btn"
                      onClick={() => navigate(`/app/tutor-chat?concept=${feedback.misconception.recommended_concept}`)}>
                      Fix This Misconception
                    </Button>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button className="flex-1" onClick={next} data-testid="quiz-next-btn">
                    Next Question <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/app/dashboard")}>Done</Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
