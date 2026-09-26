import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ArrowRight, ArrowLeft, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useStudent } from "@/context/StudentContext";
import { PageHeader, ConceptBar, fade } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export default function Diagnostic() {
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [confidence, setConfidence] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { refresh } = useStudent();
  const navigate = useNavigate();

  useEffect(() => {
    api.getDiagnostic().then((d) => setQuestions(d.questions)).catch(() => toast.error("Could not load assessment."));
  }, []);

  const q = questions[idx];
  const progress = questions.length ? ((idx + 1) / questions.length) * 100 : 0;
  const allAnswered = questions.length > 0 && questions.every((x) => answers[x.id]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = questions.map((x) => ({ question_id: x.id, selected: answers[x.id] }));
      const res = await api.submitDiagnostic(payload);
      setResult(res);
      await refresh();
    } catch {
      toast.error("Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <motion.div {...fade()} className="space-y-6">
        <PageHeader eyebrow="Diagnostic complete" title="Your learning profile has been updated"
          subtitle={`Overall mastery: ${result.overall_mastery}%. Here's your concept-level breakdown.`} />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Concept Mastery</p>
            <div className="space-y-3">
              {result.profile_mastery.map((c) => <ConceptBar key={c.concept} {...c} />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wider">Here's what we think you should learn next</p>
              </div>
              <h3 className="mt-3 font-display text-xl font-bold">{result.recommendation.concept_name}</h3>
              <p className="mt-2 text-sm text-muted-foreground" data-testid="diagnostic-rec-reason">{result.recommendation.reason}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {result.recommendation.path_names.map((n, i) => (
                  <span key={n} className="flex items-center gap-2">
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${result.recommendation.path[i] === result.recommendation.concept ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{n}</span>
                    {i < result.recommendation.path_names.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => navigate("/app/dashboard")} data-testid="diagnostic-view-dashboard">Go to Dashboard</Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate("/app/knowledge-graph")}>View Knowledge Map</Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!q) return <div className="grid h-64 place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Diagnostic Assessment" title="Let's map what you know"
        subtitle="Answer honestly — we calculate concept-level mastery, not just a score." />
      <div className="mb-4 flex items-center gap-3">
        <Progress value={progress} className="h-2" />
        <span className="shrink-0 text-sm text-muted-foreground">{idx + 1}/{questions.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
          className="rounded-2xl border bg-card p-6">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Activity className="h-3.5 w-3.5" /> {q.concept.replace(/_/g, " ")} · {q.difficulty}
          </div>
          <p className="mt-2 whitespace-pre-wrap font-medium">{q.text}</p>
          <div className="mt-5 space-y-2.5">
            {q.options.map((o) => {
              const active = answers[q.id] === o.id;
              return (
                <button key={o.id} data-testid={`diagnostic-option-${o.id}`}
                  onClick={() => setAnswers({ ...answers, [q.id]: o.id })}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all ${active ? "border-primary bg-primary/10" : "hover:bg-muted"}`}>
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold ${active ? "border-primary bg-primary text-primary-foreground" : ""}`}>{o.id.toUpperCase()}</span>
                  <span className="whitespace-pre-wrap font-mono text-[13px]">{o.text}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>How confident are you?</span>
              <span className="font-medium">{confidence[q.id] ?? 50}%</span>
            </div>
            <Slider data-testid="confidence-slider" value={[confidence[q.id] ?? 50]} max={100} step={10}
              onValueChange={(v) => setConfidence({ ...confidence, [q.id]: v[0] })} />
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-5 flex items-center justify-between">
        <Button variant="ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)} data-testid="diagnostic-prev">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {idx < questions.length - 1 ? (
          <Button disabled={!answers[q.id]} onClick={() => setIdx(idx + 1)} data-testid="diagnostic-next">
            Next <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button disabled={!allAnswered || submitting} onClick={submit} data-testid="diagnostic-submit">
            {submitting ? "Analyzing your answers…" : "Finish & Analyze"}
          </Button>
        )}
      </div>
    </div>
  );
}
