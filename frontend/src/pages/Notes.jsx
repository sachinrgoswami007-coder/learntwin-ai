import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, Upload, Sparkles, ArrowRight, CheckCircle2, XCircle, ListChecks,
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, fade } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_COLORS } from "@/lib/api";
import { toast } from "sonner";

export default function Notes() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [phase, setPhase] = useState("input"); // input | quiz | plan
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!text.trim() && !file) { toast.error("Paste notes or upload a file first."); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("text", text);
      if (file) fd.append("file", file);
      const res = await api.notesAnalyze(fd);
      setQuestions(res.questions);
      setPhase("quiz");
    } catch (e) {
      toast.error("Could not analyze notes. Try pasting the text directly.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const payload = questions.map((q) => ({ question_id: q.id, selected: answers[q.id], topic: q.topic }));
      const res = await api.notesSubmit(payload);
      setPlan(res.plan);
      setPhase("plan");
    } catch {
      toast.error("Could not build your plan.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setPhase("input"); setQuestions([]); setAnswers({}); setPlan([]); setText(""); setFile(null); setFileName(""); };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Notes → Path" title="Turn your notes into a study plan"
        subtitle="Upload a PDF or paste your notes. We extract the topics, run a quick diagnostic, and build a prioritized plan." />

      {phase === "input" && (
        <motion.div {...fade()} className="space-y-4 rounded-2xl border bg-card p-6">
          <Textarea rows={7} value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Paste your lecture notes here…" data-testid="notes-text-input" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm hover:bg-muted" data-testid="notes-file-label">
              <Upload className="h-4 w-4" />
              {fileName || "Upload PDF / text"}
              <input type="file" accept=".pdf,.txt,.md" className="hidden" data-testid="notes-file-input"
                onChange={(e) => { const f = e.target.files?.[0]; setFile(f); setFileName(f?.name || ""); }} />
            </label>
            <Button className="sm:ml-auto" onClick={analyze} disabled={loading} data-testid="notes-analyze-btn">
              <Sparkles className="mr-1 h-4 w-4" /> {loading ? "Analyzing…" : "Analyze & Build Path"}
            </Button>
          </div>
        </motion.div>
      )}

      {phase === "quiz" && (
        <motion.div {...fade()} className="space-y-4">
          <p className="text-sm text-muted-foreground">We found {questions.length} topics. Answer this quick check so we know where you stand.</p>
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-2xl border bg-card p-5" data-testid={`notes-q-${i}`}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{q.topic}</p>
              <p className="font-medium">{q.question}</p>
              <div className="mt-3 space-y-2">
                {q.options.map((o) => {
                  const active = answers[q.id] === o.id;
                  return (
                    <button key={o.id} onClick={() => setAnswers({ ...answers, [q.id]: o.id })}
                      data-testid={`notes-q${i}-opt-${o.id}`}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all ${active ? "border-primary bg-primary/10" : "hover:bg-muted"}`}>
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold">{o.id.toUpperCase()}</span>
                      {o.text}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <Button className="w-full" disabled={loading || Object.keys(answers).length < questions.length}
            onClick={submit} data-testid="notes-submit-btn">
            {loading ? "Building your plan…" : "Build My Study Plan"} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {phase === "plan" && (
        <motion.div {...fade()} className="space-y-4" data-testid="notes-plan">
          <div className="flex items-center gap-2 text-primary">
            <ListChecks className="h-5 w-5" />
            <p className="font-display text-lg font-bold">Your personalized study plan</p>
          </div>
          <p className="text-sm text-muted-foreground">Ordered weakest-first — fix these before moving on.</p>
          <div className="relative pl-8">
            <div className="absolute left-[15px] top-2 h-[calc(100%-1rem)] w-0.5 bg-border" />
            {plan.map((p, i) => (
              <div key={i} className="relative mb-4">
                <span className="absolute -left-8 top-3 grid h-8 w-8 place-items-center rounded-full border-2 bg-background text-xs font-bold"
                  style={{ borderColor: STATUS_COLORS[p.status] }}>{i + 1}</span>
                <div className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{p.topic}</h4>
                    <span className="text-sm font-medium" style={{ color: STATUS_COLORS[p.status] }}>{p.mastery}%</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{p.action}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={reset} data-testid="notes-restart-btn">Analyze different notes</Button>
        </motion.div>
      )}
    </div>
  );
}
