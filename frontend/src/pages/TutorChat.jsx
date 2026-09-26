import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Send, Sparkles, Volume2, VolumeX, Lightbulb, Code, Globe, ListOrdered,
  Baby, MessageSquareText,
} from "lucide-react";
import { api, LANGUAGES } from "@/lib/api";
import { useStudent } from "@/context/StudentContext";
import { PageHeader, RichText } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const MODES = [
  { id: "socratic", label: "Socratic", icon: MessageSquareText },
  { id: "eli5", label: "ELI5", icon: Baby },
  { id: "analogy", label: "Analogy", icon: Lightbulb },
  { id: "technical", label: "Technical", icon: Code },
];

const EXPLAIN_ACTIONS = [
  { mode: "simple", label: "Explain simply", icon: Lightbulb },
  { mode: "real_world", label: "Real-world example", icon: Globe },
  { mode: "step_by_step", label: "Step-by-step", icon: ListOrdered },
  { mode: "code", label: "Code example", icon: Code },
  { mode: "visual", label: "Visual explanation", icon: Sparkles },
  { mode: "hint", label: "Give me a hint", icon: Lightbulb },
];

export default function TutorChat() {
  const [params] = useSearchParams();
  const concept = params.get("concept");
  const { profile } = useStudent();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("socratic");
  const [language, setLanguage] = useState(profile?.preferences?.language || "en");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tts, setTts] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (concept) {
      setMessages([{ role: "assistant", content: `Let's work on **${concept.replace(/_/g, " ")}**. Ask me anything, or tap a quick action below to get an explanation your way. 🎓` }]);
    } else {
      setMessages([{ role: "assistant", content: "Hi! I'm your LearnTwin tutor. I know your mastery and gaps. What would you like to understand today?" }]);
    }
  }, [concept]);

  const speak = (text) => {
    if (!tts || !window.speechSynthesis) return;
    const clean = text.replace(/```[\s\S]*?```/g, " code example ").replace(/[*`#]/g, "");
    const u = new SpeechSynthesisUtterance(clean);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const push = (msg) => setMessages((m) => [...m, msg]);

  const send = async (text) => {
    if (!text.trim()) return;
    push({ role: "user", content: text });
    setInput("");
    setLoading(true);
    try {
      const res = await api.tutorChat({ session_id: sessionId, message: text, mode, language, concept });
      setSessionId(res.session_id);
      push({ role: "assistant", content: res.reply, source: res.source });
      speak(res.reply);
    } catch {
      push({ role: "assistant", content: "AI service unavailable. Demo mode explanation: try breaking the problem into a tiny example and predict the output before running it." });
    } finally {
      setLoading(false);
    }
  };

  const explain = async (m) => {
    if (!concept) return send(`Explain ${m.replace(/_/g, " ")}`);
    setLoading(true);
    try {
      const res = await api.explain({ concept, mode: m, language });
      push({ role: "assistant", content: res.explanation, source: res.source });
      speak(res.explanation);
    } catch {
      push({ role: "assistant", content: "AI service unavailable. Demo mode explanation loaded." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader eyebrow="AI Tutor" title="Your Socratic tutor"
        action={
          <div className="flex items-center gap-2">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-32" data-testid="tutor-language-select"><SelectValue /></SelectTrigger>
              <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setTts(!tts)} data-testid="tutor-tts-toggle" title="Read responses aloud">
              {tts ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        } />

      {/* mode selector */}
      <div className="mb-3 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} data-testid={`tutor-mode-${m.id}-btn`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${mode === m.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            <m.icon className="h-3.5 w-3.5" /> {m.label}
          </button>
        ))}
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-2xl border bg-card p-4" data-testid="tutor-messages">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.role === "assistant" ? <RichText text={m.content} /> : <p className="text-sm">{m.content}</p>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* explanation quick actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {EXPLAIN_ACTIONS.map((a) => (
          <button key={a.mode} onClick={() => explain(a.mode)} disabled={loading} data-testid={`explain-${a.mode}-btn`}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:bg-muted disabled:opacity-50">
            <a.icon className="h-3.5 w-3.5" /> {a.label}
          </button>
        ))}
      </div>

      {/* input */}
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your tutor anything…" data-testid="tutor-input" />
        <Button type="submit" disabled={loading || !input.trim()} data-testid="tutor-send-btn"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
