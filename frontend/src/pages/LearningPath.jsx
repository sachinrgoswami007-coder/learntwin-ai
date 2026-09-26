import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api, STATUS_COLORS, STATUS_LABELS } from "@/lib/api";
import { PageHeader, fade } from "@/components/common";
import { Button } from "@/components/ui/button";
import { BookOpen, Target, CheckCircle2, Sparkles, Bell } from "lucide-react";

export default function LearningPath() {
  const [path, setPath] = useState([]);
  const [rec, setRec] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getLearningPath().then((d) => setPath(d.path)).catch(() => {});
    api.getRecommendation().then(setRec).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Personalized Learning Path" title="Your dynamic roadmap"
        subtitle="This path is not static — it rewrites itself as your mastery changes." />

      <motion.div {...fade()} className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4" data-testid="path-updated-notice">
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="text-sm">
          <p className="font-semibold">Your learning path was updated based on your recent performance.</p>
          {rec && <p className="mt-0.5 text-muted-foreground">{rec.reason}</p>}
        </div>
      </motion.div>

      <div className="relative pl-8">
        <div className="absolute left-[15px] top-2 h-[calc(100%-1rem)] w-0.5 bg-border" />
        {path.map((item, i) => {
          const color = STATUS_COLORS[item.status];
          return (
            <motion.div key={item.concept} {...fade(i * 0.06)} className="relative mb-5" data-testid={`path-item-${item.concept}`}>
              <span className="absolute -left-8 top-3 grid h-8 w-8 place-items-center rounded-full border-2 bg-background"
                style={{ borderColor: color }}>
                {item.status === "mastered" ? <CheckCircle2 className="h-4 w-4" style={{ color }} /> :
                  item.current ? <Target className="h-4 w-4" style={{ color: STATUS_COLORS.recommended }} /> :
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />}
              </span>
              <div className={`rounded-2xl border p-4 transition-all ${item.current ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" : "bg-card"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold">{item.name}</h3>
                      {item.current && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">Start here</span>}
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color }}>
                      {item.mastery == null ? "Not started" : `${item.mastery}% · ${STATUS_LABELS[item.status]}`}
                    </p>
                  </div>
                  <Button size="sm" variant={item.current ? "default" : "outline"}
                    onClick={() => navigate(`/app/tutor-chat?concept=${item.concept}`)}
                    data-testid={`path-start-${item.concept}`}>
                    <BookOpen className="mr-1 h-4 w-4" /> Learn
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-wider">Expected benefit</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{rec?.expected_benefit}</p>
      </div>
    </div>
  );
}
