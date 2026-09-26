import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Target, Zap, Award, CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, fade } from "@/components/common";

function ChartCard({ title, children, testid }) {
  return (
    <motion.div {...fade()} className="rounded-2xl border bg-card p-5" data-testid={testid}>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">{label}</p>
      {payload.map((p) => <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}%</p>)}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  useEffect(() => { api.getAnalytics().then(setData).catch(() => {}); }, []);

  if (!data) return <div className="grid h-64 place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const stats = [
    { icon: Target, label: "Questions Attempted", value: data.attempts, color: "#6366F1" },
    { icon: CheckCircle2, label: "Questions Correct", value: data.correct, color: "#10B981" },
    { icon: TrendingUp, label: "Quiz Accuracy", value: `${data.accuracy}%`, color: "#0D9488" },
    { icon: Zap, label: "Total XP", value: data.xp.toLocaleString(), color: "#F59E0B" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Progress Analytics" title="Your learning, measured"
        subtitle="Mastery growth, accuracy and the impact of personalized recommendations." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-4" data-testid={`analytics-stat-${s.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
            <s.icon className="h-4 w-4" style={{ color: s.color }} />
            <p className="mt-2 font-display text-2xl font-bold tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Overall Mastery Over Time" testid="chart-mastery-time">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="overall" name="Mastery" stroke="#6366F1" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Concept Mastery" testid="chart-concept-mastery">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.concept_mastery} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="concept" width={90} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="mastery" name="Mastery" fill="#0D9488" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* before / after */}
      <motion.div {...fade()} className="rounded-2xl border bg-card p-5" data-testid="before-after-card">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <TrendingUp className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-wider">Before vs After personalized learning</p>
        </div>
        {data.comparison.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.comparison.map((c) => (
              <div key={c.concept} className="flex items-center justify-between rounded-xl bg-muted/60 p-4">
                <span className="font-medium">{c.concept}</span>
                <span className="flex items-center gap-2 font-display font-bold">
                  <span className="text-muted-foreground">{c.before}%</span>
                  <ArrowRight className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-500">{c.after}%</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Complete some adaptive practice to see your before/after gains.</p>
        )}
      </motion.div>

      {/* badges */}
      <motion.div {...fade()} className="rounded-2xl border bg-card p-5">
        <div className="mb-3 flex items-center gap-2 text-amber-500">
          <Award className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-wider">Mastery Badges</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.badges.map((b) => (
            <span key={b} className="inline-flex items-center gap-1.5 rounded-full border bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <Award className="h-3.5 w-3.5" /> {b}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
