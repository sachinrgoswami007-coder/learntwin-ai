import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, CheckCircle2, AlertCircle, Send, GraduationCap, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useStudent } from "@/context/StudentContext";
import { PageHeader, MasteryRing, fade } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function TeachBack() {
  const { profile, refresh } = useStudent();
  const [concept, setConcept] = useState("return_values");
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef(null);

  const concepts = (profile?.weak || []).concat(profile?.strong || []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript + " ";
      setText((prev) => (prev + " " + t).trim());
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
  }, []);

  const toggleMic = () => {
    if (!supported) return;
    if (listening) { recRef.current?.stop(); setListening(false); }
    else { try { recRef.current?.start(); setListening(true); } catch {} }
  };

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.teachBack({ concept, explanation: text });
      setResult(res);
      await refresh();
    } catch {
      toast.error("Could not evaluate.");
    } finally {
      setLoading(false);
    }
  };

  const conceptName = concepts.find((c) => c.concept === concept)?.name || concept.replace(/_/g, " ");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Teach-Back Mode" title="Teach it back"
        subtitle="The Feynman technique: explain a concept in your own words and let the AI check your true understanding." />

      <motion.div {...fade()} className="rounded-2xl border bg-card p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-primary">
            <GraduationCap className="h-5 w-5" />
            <p className="font-medium">You've just learned <b>{conceptName}</b>. Explain it to me in your own words.</p>
          </div>
          <Select value={concept} onValueChange={(v) => { setConcept(v); setResult(null); }}>
            <SelectTrigger className="w-full sm:w-48" data-testid="teachback-concept-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(concepts.length ? concepts : [{ concept: "return_values", name: "Return Values" }, { concept: "recursion", name: "Recursion" }, { concept: "functions", name: "Functions" }])
                .map((c) => <SelectItem key={c.concept} value={c.concept}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5}
          placeholder="Type or speak your explanation…" data-testid="teachback-input" />

        <div className="mt-3 flex items-center gap-3">
          {supported && (
            <Button variant="outline" onClick={toggleMic} data-testid="teachback-mic-btn"
              className={listening ? "border-red-500 text-red-500" : ""}>
              {listening ? <MicOff className="mr-1 h-4 w-4" /> : <Mic className="mr-1 h-4 w-4" />}
              {listening ? "Stop" : "Speak"}
            </Button>
          )}
          <Button onClick={submit} disabled={loading || !text.trim()} data-testid="teachback-submit-btn">
            {loading ? "Evaluating…" : <>Evaluate <Send className="ml-1 h-4 w-4" /></>}
          </Button>
        </div>
      </motion.div>

      {result && (
        <motion.div {...fade()} className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr]" data-testid="teachback-result">
          <div className="grid place-items-center rounded-2xl border bg-card p-6">
            <MasteryRing value={result.score} label="Understanding" size={130} />
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Concept coverage</p>
            <div className="space-y-2">
              {result.criteria.map((c) => (
                <div key={c.name} className="flex items-center gap-2 text-sm">
                  {c.met ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                  <span className={c.met ? "" : "text-muted-foreground"}>{c.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm">{result.feedback}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
