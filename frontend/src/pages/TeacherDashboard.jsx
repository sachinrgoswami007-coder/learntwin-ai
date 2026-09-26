import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, Users, TrendingDown, GraduationCap, LogOut, Moon, Sun, AlertTriangle,
} from "lucide-react";
import { api, STATUS_COLORS } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fade } from "@/components/common";
import { Button } from "@/components/ui/button";

function barColor(v) {
  return v >= 75 ? STATUS_COLORS.mastered : v >= 60 ? STATUS_COLORS.developing : STATUS_COLORS.weak;
}

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [subject, setSubject] = useState("all");
  const { logout, user } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  useEffect(() => { api.teacherOverview(subject).then(setData).catch(() => {}); }, [subject]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-sm font-bold leading-tight">LearnTwin AI · Teacher</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{user?.name || "Educator"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggle} data-testid="teacher-theme-toggle" className="grid h-9 w-9 place-items-center rounded-lg border text-muted-foreground hover:bg-muted">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Button variant="outline" size="sm" onClick={() => { logout(); navigate("/"); }} data-testid="teacher-logout">
            <LogOut className="mr-1 h-4 w-4" /> Log out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Class Overview</p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Where your class is struggling</h1>
          <p className="mt-1 text-muted-foreground">Aggregated concept mastery across your students, ranked by difficulty.</p>
        </div>

        {!data ? (
          <div className="grid h-64 place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
        ) : (
          <div className="space-y-6">
            {/* stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border bg-card p-4" data-testid="teacher-stat-students">
                <Users className="h-4 w-4 text-primary" />
                <p className="mt-2 font-display text-2xl font-bold">{data.student_count}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
              <div className="rounded-2xl border bg-card p-4" data-testid="teacher-stat-avg">
                <Sparkles className="h-4 w-4 text-teal-500" />
                <p className="mt-2 font-display text-2xl font-bold">{data.class_average}%</p>
                <p className="text-xs text-muted-foreground">Class Average</p>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <p className="mt-2 font-display text-2xl font-bold">{data.most_struggled[0]?.name || "—"}</p>
                <p className="text-xs text-muted-foreground">Hardest concept</p>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <p className="mt-2 font-display text-2xl font-bold">{data.most_struggled.reduce((a, m) => a + m.struggling, 0)}</p>
                <p className="text-xs text-muted-foreground">Struggle flags</p>
              </div>
            </div>

            {/* subject filter */}
            <div className="flex flex-wrap gap-2">
              {[{ id: "all", name: "All Subjects" }, ...data.subjects].map((s) => (
                <button key={s.id} onClick={() => setSubject(s.id)} data-testid={`teacher-filter-${s.id}`}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${subject === s.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  {s.name}
                </button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              {/* most struggled */}
              <motion.div {...fade()} className="rounded-2xl border bg-card p-5 lg:col-span-3" data-testid="teacher-struggled">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Most-struggled concepts</p>
                <div className="space-y-3">
                  {data.most_struggled.map((m) => (
                    <div key={m.concept}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{m.name}</span>
                        <span className="tabular-nums text-muted-foreground">{m.avg}% avg · {m.struggling}/{m.count} struggling</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${m.avg}%`, background: barColor(m.avg) }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* students */}
              <motion.div {...fade(0.1)} className="rounded-2xl border bg-card p-5 lg:col-span-2" data-testid="teacher-students">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Students (weakest first)</p>
                <div className="space-y-2">
                  {data.students.map((s, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-muted/50 p-3 text-sm">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">Weakest: {s.weakest}</p>
                      </div>
                      <span className="font-display font-bold" style={{ color: barColor(s.overall) }}>{s.overall}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
