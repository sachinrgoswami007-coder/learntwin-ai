import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, PhoneOff, Sparkles, Volume2 } from "lucide-react";
import { api, LANGUAGES } from "@/lib/api";
import { useStudent } from "@/context/StudentContext";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const AVATAR = "https://images.unsplash.com/photo-1758600587839-56ba05596c69?crop=entropy&cs=srgb&fm=jpg&q=85&w=600";

export default function VoiceTutor() {
  const { profile } = useStudent();
  const [status, setStatus] = useState("idle"); // idle | listening | thinking | speaking
  const [transcript, setTranscript] = useState([]);
  const [language, setLanguage] = useState(profile?.preferences?.language || "en");
  const [sessionId, setSessionId] = useState(null);
  const [supported, setSupported] = useState(true);
  const [textInput, setTextInput] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = language === "hi" || language === "hinglish" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-US";
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      handleUserSpeech(text);
    };
    rec.onerror = () => setStatus("idle");
    rec.onend = () => setStatus((s) => (s === "listening" ? "idle" : s));
    recognitionRef.current = rec;
    // eslint-disable-next-line
  }, [language]);

  const speak = (text) => {
    if (!window.speechSynthesis) { setStatus("idle"); return; }
    const clean = text.replace(/```[\s\S]*?```/g, " here's a code example ").replace(/[*`#]/g, "");
    const u = new SpeechSynthesisUtterance(clean);
    u.onend = () => setStatus("idle");
    u.onerror = () => setStatus("idle");
    setStatus("speaking");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const handleUserSpeech = async (text) => {
    setTranscript((t) => [...t, { role: "user", content: text }]);
    setStatus("thinking");
    try {
      const res = await api.tutorChat({ session_id: sessionId, message: text, mode: "socratic", language });
      setSessionId(res.session_id);
      setTranscript((t) => [...t, { role: "assistant", content: res.reply }]);
      speak(res.reply);
    } catch {
      const fallback = "I'm having trouble reaching the AI right now. Let's continue in text — what part is confusing?";
      setTranscript((t) => [...t, { role: "assistant", content: fallback }]);
      setStatus("idle");
    }
  };

  const startListening = () => {
    if (!supported) return;
    setStatus("listening");
    try { recognitionRef.current?.start(); } catch { /* already started */ }
  };

  const stopSession = () => {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    setStatus("idle");
  };

  const statusText = {
    idle: "Tap the mic to start talking",
    listening: "AI Tutor is listening…",
    thinking: "AI Tutor is thinking…",
    speaking: "AI Tutor is speaking…",
  }[status];

  return (
    <div>
      <PageHeader eyebrow="Voice / Live AI" title="Talk to your AI Tutor"
        action={
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-32" data-testid="voice-language-select"><SelectValue /></SelectTrigger>
            <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent>
          </Select>
        } />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* video-call stage */}
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/20 via-card to-card p-8 lg:col-span-2" data-testid="voice-stage">
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className={`absolute -inset-3 rounded-full bg-primary/30 blur-xl ${status === "speaking" ? "avatar-speaking" : ""}`} />
              <img src={AVATAR} alt="AI Tutor" className={`relative h-40 w-40 rounded-full object-cover shadow-2xl ring-4 ring-background ${status === "speaking" ? "avatar-speaking" : ""}`} />
              {status === "speaking" && (
                <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-end gap-1">
                  {[0, 1, 2, 3, 4].map((i) => <span key={i} className="wave-bar w-1 rounded-full bg-primary" style={{ animationDelay: `${i * 0.1}s` }} />)}
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-bold">Ada · LearnTwin Tutor</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground" data-testid="voice-status">
                {status === "thinking" && <Sparkles className="h-4 w-4 animate-pulse" />}
                {status === "speaking" && <Volume2 className="h-4 w-4" />}
                {statusText}
              </p>
            </div>
          </div>

          {/* controls */}
          <div className="mt-4 flex items-center justify-center gap-3">
            {supported ? (
              <button onClick={startListening} disabled={status !== "idle"} data-testid="voice-mic-btn"
                className={`grid h-16 w-16 place-items-center rounded-full text-white shadow-lg transition-all ${status === "listening" ? "bg-red-500 scale-110" : "bg-primary hover:scale-105"} disabled:opacity-60`}>
                {status === "listening" ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
            ) : null}
            <button onClick={stopSession} data-testid="voice-end-btn" className="grid h-12 w-12 place-items-center rounded-full border bg-card text-muted-foreground hover:bg-muted">
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>

          {!supported && (
            <form onSubmit={(e) => { e.preventDefault(); if (textInput.trim()) { handleUserSpeech(textInput); setTextInput(""); } }}
              className="mt-4 flex gap-2">
              <Input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Voice not supported — type instead…" data-testid="voice-text-fallback" />
              <Button type="submit">Send</Button>
            </form>
          )}
          {supported && <p className="mt-3 text-center text-xs text-muted-foreground">Start Voice Session — speak naturally, the tutor replies aloud.</p>}
        </div>

        {/* transcript */}
        <div className="rounded-3xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transcript</p>
            <span className="text-xs text-muted-foreground">{profile ? `Mastery ${profile.overall_mastery}%` : ""}</span>
          </div>
          <div className="max-h-[420px] space-y-3 overflow-y-auto" data-testid="voice-transcript">
            {transcript.length === 0 && <p className="text-sm text-muted-foreground">Your conversation will appear here.</p>}
            {transcript.map((m, i) => (
              <div key={i} className={`rounded-xl p-3 text-sm ${m.role === "user" ? "bg-primary/10" : "bg-muted"}`}>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{m.role === "user" ? "You" : "Ada"}</p>
                {m.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
