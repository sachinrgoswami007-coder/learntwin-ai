import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Code2, Atom, FlaskConical, Sigma, ArrowRight, Check, BookMarked } from "lucide-react";
import { api } from "@/lib/api";
import { useStudent } from "@/context/StudentContext";
import { PageHeader, fade } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const ICONS = { Code2, Atom, FlaskConical, Sigma };

export default function Subjects() {
  const [data, setData] = useState(null);
  const [board, setBoard] = useState({});
  const [std, setStd] = useState({});
  const [busy, setBusy] = useState("");
  const { refresh, profile } = useStudent();
  const navigate = useNavigate();

  useEffect(() => { api.getSubjects().then(setData).catch(() => {}); }, []);

  const start = async (courseId) => {
    setBusy(courseId);
    try {
      await api.selectCourse(courseId);
      await refresh();
      toast.success("Subject selected. Let's learn!");
      navigate("/app/dashboard");
    } catch {
      toast.error("Could not select this subject.");
    } finally {
      setBusy("");
    }
  };

  if (!data) return <div className="grid h-64 place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const current = profile?.course || data.current;

  return (
    <div>
      <PageHeader eyebrow="Subjects" title="Choose what to learn"
        subtitle="Python, or Physics / Chemistry / Maths for Class 9–12 (CBSE & Maharashtra State Board). Your adaptive twin works across all of them." />

      <div className="grid gap-4 sm:grid-cols-2">
        {data.subjects.map((s, i) => {
          const Icon = ICONS[s.icon] || BookMarked;
          const courseId = s.has_levels
            ? `${s.id}__${board[s.id] || "cbse"}__${std[s.id] || 10}`
            : s.id;
          const isCurrent = current === courseId || (!s.has_levels && current === s.id);
          return (
            <motion.div key={s.id} {...fade(i * 0.05)} data-testid={`subject-card-${s.id}`}
              className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{s.has_levels ? "Class 9–12 · CBSE / State" : "Programming track"}</p>
                  </div>
                </div>
                {isCurrent && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600"><Check className="h-3.5 w-3.5" /> Active</span>}
              </div>

              {s.has_levels && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Select value={board[s.id] || "cbse"} onValueChange={(v) => setBoard({ ...board, [s.id]: v })}>
                    <SelectTrigger data-testid={`board-select-${s.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{data.boards.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={String(std[s.id] || 10)} onValueChange={(v) => setStd({ ...std, [s.id]: Number(v) })}>
                    <SelectTrigger data-testid={`std-select-${s.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{data.standards.map((n) => <SelectItem key={n} value={String(n)}>Class {n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              <Button className="mt-4 w-full" disabled={busy === courseId} onClick={() => start(courseId)}
                data-testid={`start-subject-${s.id}`}>
                {busy === courseId ? "Switching…" : "Start Learning"} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
