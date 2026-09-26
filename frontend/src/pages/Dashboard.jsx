import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Flame, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, TrendingUp,
  Lightbulb, PlayCircle, BookOpen,
} from "lucide-react";
import { useStudent } from "@/context/StudentContext";
import { api } from "@/lib/api";
import { MasteryRing, ConceptBar, fade } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({ icon: Icon, label, value, color, testid }) {
  return (
    <div data-testid={testid} className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { profile, loading } = useStudent();
  const [insight, setInsight] = useState("");
  const [path, setPath] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getInsight().then((d) => setInsight(d.insight)).catch(() => {});
    api.getLearningPath().then((d) => setPath(d.path)).catch(() => {});
  }, []);

  if (loading || !profile)
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
      </div>
    );

  const rec = profile.recommendation;
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <motion.div {...fade()} className="flex flex-col justify-between gap-4 rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}, {profile.name} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">Let's continue where you left off.</p>
          <button onClick={() => navigate("/app/subjects")} data-testid="dashboard-course-chip"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <BookOpen className="h-3.5 w-3.5" /> {profile.course_name} · change
          </button>
        </div>
        <Button onClick={() => navigate("/app/quiz")} data-testid="dashboard-continue-btn">
          <PlayCircle className="mr-2 h-4 w-4" /> Continue Learning
        </Button>
      </motion.div>

      {/* stats */}
      <motion.div {...fade(0.05)} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard testid="stat-mastery" icon={TrendingUp} label="Overall Mastery" value={`${profile.overall_mastery}%`} color="#6366F1" />
        <StatCard testid="stat-streak" icon={Flame} label="Learning Streak" value={`${profile.streak} days`} color="#F59E0B" />
        <StatCard testid="stat-mastered" icon={CheckCircle2} label="Concepts Mastered" value={profile.concepts_mastered} color="#10B981" />
        <StatCard testid="stat-attention" icon={AlertTriangle} label="Needs Attention" value={profile.concepts_needing_attention} color="#EF4444" />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* learning twin */}
        <motion.div {...fade(0.1)} className="rounded-2xl border bg-card p-6 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Learning Twin</p>
          <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
            <MasteryRing value={profile.overall_mastery} />
            <div className="flex-1 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-500">Strong Areas</p>
                <div className="space-y-2">
                  {profile.strong.slice(0, 3).map((c) => <ConceptBar key={c.concept} {...c} status="mastered" />)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-500">Needs Attention</p>
                <div className="space-y-2">
                  {profile.weak.slice(0, 3).map((c) => <ConceptBar key={c.concept} {...c} status={c.mastery < 50 ? "weak" : "developing"} />)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* recommendation */}
        <motion.div {...fade(0.15)} className="rounded-2xl border bg-card p-6 lg:col-span-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wider">AI Recommendation</p>
          </div>
          <h3 className="mt-3 font-display text-xl font-bold">
            Strengthen {rec.concept_name} before continuing to {rec.target_name}.
          </h3>
          <div className="mt-4 rounded-xl bg-muted/60 p-4">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5" /> Why are you seeing this?
            </p>
            <p className="text-sm leading-relaxed" data-testid="recommendation-reason">{rec.reason}</p>
          </div>

          {/* path */}
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Learning Path</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {rec.path_names.map((name, i) => (
              <span key={name} className="flex items-center gap-2">
                <span className={`rounded-lg px-3 py-1.5 text-sm font-medium ${rec.path[i] === rec.concept ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {name}
                </span>
                {i < rec.path_names.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </span>
            ))}
          </div>

          <Button className="mt-6" data-testid="ai-recommendation-cta"
            onClick={() => navigate(`/app/tutor-chat?concept=${rec.concept}`)}>
            Start Recommended Lesson <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </motion.div>
      </div>

      {/* ai insight */}
      <motion.div {...fade(0.2)} className="rounded-2xl border bg-card p-6" data-testid="ai-insight-card">
        <div className="flex items-center gap-2 text-teal-500">
          <TrendingUp className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-wider">AI Insight</p>
        </div>
        <p className="mt-3 text-base leading-relaxed">
          {insight || "Analyzing your learning profile…"}
        </p>
      </motion.div>
    </div>
  );
}
