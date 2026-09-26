import { useStudent } from "@/context/StudentContext";
import { PageHeader, ConceptBar, fade } from "@/components/common";
import { motion } from "framer-motion";
import {
  Languages, Sparkles, AlertTriangle, Award, Brain, History, Target,
} from "lucide-react";
import { LANGUAGES } from "@/lib/api";

function Section({ icon: Icon, title, children, testid }) {
  return (
    <motion.div {...fade()} className="rounded-2xl border bg-card p-5" data-testid={testid}>
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wider">{title}</p>
      </div>
      {children}
    </motion.div>
  );
}

export default function Profile() {
  const { profile, loading } = useStudent();
  if (loading || !profile) return <div className="grid h-64 place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const prefs = profile.preferences || {};
  const langLabel = LANGUAGES.find((l) => l.code === prefs.language)?.label || "English";
  const misconceptions = Object.values(profile.misconceptions || {});

  return (
    <div>
      <PageHeader eyebrow="Continuous Learning Profile" title={`${profile.name}'s Learning Twin`}
        subtitle="A living profile updated by every assessment, quiz and conversation." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section icon={Target} title="Current Mastery" testid="profile-mastery">
          <p className="font-display text-3xl font-bold">{profile.overall_mastery}%</p>
          <p className="text-sm text-muted-foreground">Overall across {profile.concepts_mastered + profile.concepts_needing_attention}+ tracked concepts</p>
        </Section>

        <Section icon={Brain} title="Learning Preferences" testid="profile-preferences">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-muted-foreground">Preferred language</p><p className="font-medium">{langLabel}</p></div>
            <div><p className="text-muted-foreground">Explanation style</p><p className="font-medium capitalize">{prefs.explanation_style}</p></div>
            <div><p className="text-muted-foreground">Learning level</p><p className="font-medium capitalize">{prefs.level}</p></div>
            <div><p className="text-muted-foreground">Course</p><p className="font-medium">{profile.course}</p></div>
          </div>
        </Section>

        <Section icon={Sparkles} title="Strong Concepts" testid="profile-strong">
          <div className="space-y-2.5">
            {profile.strong.length ? profile.strong.map((c) => <ConceptBar key={c.concept} {...c} status="mastered" />) : <p className="text-sm text-muted-foreground">Take the diagnostic to populate this.</p>}
          </div>
        </Section>

        <Section icon={AlertTriangle} title="Weak Concepts" testid="profile-weak">
          <div className="space-y-2.5">
            {profile.weak.length ? profile.weak.map((c) => <ConceptBar key={c.concept} {...c} status={c.mastery < 50 ? "weak" : "developing"} />) : <p className="text-sm text-muted-foreground">Nothing major — great work!</p>}
          </div>
        </Section>

        <Section icon={AlertTriangle} title="Common Misconceptions" testid="profile-misconceptions">
          {misconceptions.length ? (
            <div className="space-y-2">
              {misconceptions.map((m, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-muted/60 p-3 text-sm">
                  <div>
                    <p className="font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground">Seen {m.count}× · {m.confidence} confidence</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No recurring misconceptions detected.</p>}
        </Section>

        <Section icon={History} title="Recent Mistakes" testid="profile-mistakes">
          {(profile.recent_mistakes || []).length ? (
            <ul className="space-y-2 text-sm">
              {profile.recent_mistakes.slice(0, 6).map((m, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <span>{m.label} <span className="text-xs text-muted-foreground">· {m.date}</span></span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No recent mistakes recorded.</p>}
        </Section>

        <Section icon={Award} title="Achievements" testid="profile-badges">
          <div className="flex flex-wrap gap-2">
            {(profile.badges || []).map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5 rounded-full border bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Award className="h-3.5 w-3.5" /> {b}
              </span>
            ))}
          </div>
        </Section>

        <Section icon={Languages} title="Languages" testid="profile-languages">
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <span key={l.code} className={`rounded-full px-3 py-1.5 text-xs font-medium ${l.code === prefs.language ? "bg-primary text-primary-foreground" : "border"}`}>{l.label}</span>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
