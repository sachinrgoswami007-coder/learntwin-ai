import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api, STATUS_COLORS, STATUS_LABELS } from "@/lib/api";
import { PageHeader } from "@/components/common";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const COL_W = 210;
const ROW_H = 96;

export default function KnowledgeGraph() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { api.getKnowledgeGraph().then(setData).catch(() => {}); }, []);

  const layout = useMemo(() => {
    if (!data) return { positions: {}, width: 0, height: 0 };
    const byDepth = {};
    data.nodes.forEach((n) => {
      byDepth[n.depth] = byDepth[n.depth] || [];
      byDepth[n.depth].push(n);
    });
    const positions = {};
    let maxRows = 0;
    Object.entries(byDepth).forEach(([depth, nodes]) => {
      maxRows = Math.max(maxRows, nodes.length);
      nodes.forEach((n, i) => {
        positions[n.id] = { x: Number(depth) * COL_W + 90, y: i * ROW_H + 60 };
      });
    });
    const depths = Object.keys(byDepth).length;
    return { positions, width: depths * COL_W + 60, height: maxRows * ROW_H + 60 };
  }, [data]);

  if (!data) return <div className="grid h-64 place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const nodeMap = Object.fromEntries(data.nodes.map((n) => [n.id, n]));

  return (
    <div>
      <PageHeader eyebrow="Knowledge Graph" title="Your concept map"
        subtitle="Every concept, its prerequisites, and your mastery. Click a node to explore." />

      {/* legend */}
      <div className="mb-4 flex flex-wrap gap-4">
        {Object.entries(STATUS_LABELS).map(([k, label]) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-xs font-medium">
            <span className="h-3 w-3 rounded-full" style={{ background: STATUS_COLORS[k] }} /> {label}
          </span>
        ))}
      </div>

      <div className="overflow-auto rounded-2xl border bg-card bg-grid p-4" data-testid="knowledge-graph">
        <svg width={layout.width} height={layout.height} style={{ minWidth: "100%" }}>
          {data.edges.map((e, i) => {
            const a = layout.positions[e.from], b = layout.positions[e.to];
            if (!a || !b) return null;
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--muted-foreground) / 0.35)" strokeWidth={1.5} />;
          })}
          {data.nodes.map((n) => {
            const p = layout.positions[n.id];
            const color = STATUS_COLORS[n.status];
            return (
              <g key={n.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer" }}
                onClick={() => setSelected(n)} data-testid={`knowledge-node-${n.status}`}>
                <circle r={22} fill={color} opacity={0.18} />
                <circle r={16} fill={color} stroke={n.status === "recommended" ? STATUS_COLORS.recommended : "white"} strokeWidth={n.status === "recommended" ? 3 : 1.5} />
                {n.mastery != null && (
                  <text textAnchor="middle" dy={4} fontSize={9} fontWeight={700} fill="white">{n.mastery}</text>
                )}
                <text textAnchor="middle" y={36} fontSize={11} fontWeight={600} fill="hsl(var(--foreground))">{n.name.length > 16 ? n.name.slice(0, 15) + "…" : n.name}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md" data-testid="node-detail-dialog">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: STATUS_COLORS[selected.status] }} />
                  <DialogTitle className="font-display">{selected.name}</DialogTitle>
                </div>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
                  <span className="text-muted-foreground">Mastery</span>
                  <span className="font-display text-xl font-bold">{selected.mastery == null ? "Not started" : `${selected.mastery}%`}</span>
                </div>
                <p><span className="font-semibold">Status:</span> {STATUS_LABELS[selected.status]}</p>
                <p><span className="font-semibold">About:</span> {selected.description}</p>
                <p><span className="font-semibold">Why it matters:</span> {selected.why}</p>
                {selected.prereqs.length > 0 && (
                  <p><span className="font-semibold">Prerequisites:</span> {selected.prereqs.map((p) => nodeMap[p]?.name).join(", ")}</p>
                )}
                {selected.prerequisite_for.length > 0 && (
                  <p><span className="font-semibold">Prerequisite for:</span> {selected.prerequisite_for.map((p) => nodeMap[p]?.name).join(", ")}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={() => navigate(`/app/tutor-chat?concept=${selected.id}`)} data-testid="node-learn-btn">
                    Learn this <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/app/quiz`)}>Practice</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
