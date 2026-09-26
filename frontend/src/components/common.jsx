import { motion } from "framer-motion";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/api";

export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
        )}
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function fade(delay = 0) {
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut", delay },
  };
}

export function MasteryRing({ value = 0, size = 140, stroke = 12, label = "Overall Mastery" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 75 ? STATUS_COLORS.mastered : value >= 50 ? STATUS_COLORS.developing : STATUS_COLORS.weak;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-3xl font-bold tabular-nums">{value}%</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function StatusDot({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[status] }} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ConceptBar({ name, mastery, status }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.not_started;
  return (
    <div data-testid={`concept-bar-${name.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{name}</span>
        <span className="tabular-nums text-muted-foreground">{mastery == null ? "—" : `${mastery}%`}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${mastery ?? 0}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// very small markdown renderer for tutor messages (bold, code blocks, inline code)
export function RichText({ text }) {
  if (!text) return null;
  const blocks = text.split(/```/);
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        if (i % 2 === 1) {
          const code = block.replace(/^\w+\n/, "");
          return (
            <pre key={i} className="overflow-x-auto rounded-xl bg-foreground/90 p-3 font-mono text-xs text-background">
              <code>{code.trim()}</code>
            </pre>
          );
        }
        return block.split("\n").filter(Boolean).map((line, j) => (
          <p key={`${i}-${j}`} dangerouslySetInnerHTML={{
            __html: line
              .replace(/&/g, "&amp;").replace(/</g, "&lt;")
              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
              .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 font-mono text-[12px]">$1</code>'),
          }} />
        ));
      })}
    </div>
  );
}
