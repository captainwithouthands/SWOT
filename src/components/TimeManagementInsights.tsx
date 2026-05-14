import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  ArrowDown,
  ArrowUp,
  Minus,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Circle,
  Flag,
  Pencil,
  CheckCheck,
} from "lucide-react";
import type { SectionAnalysis } from "@/lib/clat-analyser";
import {
  buildTimePlan,
  CLAT_EXAM_MINUTES,
  OMR_BUFFER_MINUTES,
  type TimePlan,
} from "@/lib/time-allocation";

/* ─── OMR advice ──────────────────────────────────────────────────── */

type AdviceLevel = "danger" | "warn" | "ok";

function getOmrAdvice(buf: number): { level: AdviceLevel; text: string } {
  if (buf > 22)
    return {
      level: "warn",
      text:
        "You're reserving way too much time for OMR — that eats deep into your solving budget. 15-20 min is plenty for 120 bubbles.",
    };
  if (buf <= 10)
    return {
      level: "danger",
      text:
        "Cutting it very tight. Keep patience and take time to fill the OMR sheet carefully — rushed bubbling causes irreversible marking errors.",
    };
  if (buf <= 13)
    return {
      level: "warn",
      text:
        "A bit tight. Aim for at least 14 min so you're not rushing the final bubble-in.",
    };
  return {
    level: "ok",
    text: "Good buffer — enough to bubble carefully without a last-minute scramble.",
  };
}

const adviceStyles: Record<AdviceLevel, { icon: React.ElementType; cls: string }> = {
  danger: { icon: AlertCircle, cls: "text-swot-weakness bg-swot-weakness/10 border-swot-weakness/25" },
  warn: { icon: AlertTriangle, cls: "text-swot-threat bg-swot-threat/10 border-swot-threat/25" },
  ok: { icon: CheckCircle2, cls: "text-swot-strength bg-swot-strength/10 border-swot-strength/25" },
};

/* ─── Timeline helpers ────────────────────────────────────────────── */

type CheckpointType = "exam-start" | "section-start" | "mini-bubble" | "omr-start" | "exam-end";

interface Checkpoint {
  tMin: number;
  type: CheckpointType;
  label: string;
  sublabel?: string;
}

function buildCheckpoints(plan: TimePlan): Checkpoint[] {
  const pts: Checkpoint[] = [];
  let cursor = 0;

  pts.push({ tMin: 0, type: "exam-start", label: "Exam starts — pens down, read instructions" });

  plan.sections.forEach((sec) => {
    const start = cursor;
    const end = cursor + sec.minutes;

    pts.push({
      tMin: start,
      type: "section-start",
      label: sec.name,
      sublabel: `${Math.round(sec.minutes)} min window · ${sec.secondsPerQ}s per question`,
    });

    // Mini-bubble every ~25 questions within this section
    if (sec.total > 0 && sec.minutes > 0) {
      const minPerQ = sec.minutes / sec.total;
      const interval = 25 * minPerQ;
      let t = start + interval;
      let batch = 1;
      while (t < end - 0.5) {
        pts.push({
          tMin: t,
          type: "mini-bubble",
          label: `Bubble batch ${batch}`,
          sublabel: `≈25 ${sec.name} answers — then continue`,
        });
        t += interval;
        batch++;
      }
    }

    cursor = end;
  });

  pts.push({
    tMin: plan.solvingBudget,
    type: "omr-start",
    label: "Stop writing — OMR final buffer",
    sublabel: `${plan.omrBuffer} min to bubble all remaining answers carefully`,
  });

  pts.push({ tMin: plan.total, type: "exam-end", label: "Exam ends — submit sheet" });

  return pts;
}

function fmtTime(minFromStart: number): string {
  const totalSec = Math.round(minFromStart * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const checkpointMeta: Record<
  CheckpointType,
  { Icon: React.ElementType; dotCls: string; rowCls: string }
> = {
  "exam-start": {
    Icon: Flag,
    dotCls: "bg-brand border-brand",
    rowCls: "font-semibold text-foreground",
  },
  "section-start": {
    Icon: Clock,
    dotCls: "bg-brand/70 border-brand/70",
    rowCls: "font-medium text-foreground",
  },
  "mini-bubble": {
    Icon: Pencil,
    dotCls: "bg-swot-opportunity/60 border-swot-opportunity/60",
    rowCls: "text-muted-foreground",
  },
  "omr-start": {
    Icon: CheckCheck,
    dotCls: "bg-swot-strength border-swot-strength",
    rowCls: "font-semibold text-foreground",
  },
  "exam-end": {
    Icon: Flag,
    dotCls: "bg-swot-weakness border-swot-weakness",
    rowCls: "font-semibold text-foreground",
  },
};

/* ─── Component ───────────────────────────────────────────────────── */

export function TimeManagementInsights({ sections }: { sections: SectionAnalysis[] }) {
  const [omrBuffer, setOmrBuffer] = useState(OMR_BUFFER_MINUTES);

  const plan = buildTimePlan(sections, CLAT_EXAM_MINUTES, { omrBuffer });
  const max = Math.max(...plan.sections.map((p) => p.minutes), 1);
  const advice = getOmrAdvice(omrBuffer);
  const { icon: AdviceIcon, cls: adviceCls } = adviceStyles[advice.level];
  const checkpoints = buildCheckpoints(plan);

  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand" /> Time-management plan
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {plan.solvingBudget} min solving · {plan.omrBuffer} min OMR · {plan.total} min total
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Section allocation bars ── */}
        <div className="space-y-3">
          {plan.sections.map((p) => {
            const Icon =
              p.deltaMinutes > 1.5 ? ArrowUp : p.deltaMinutes < -1.5 ? ArrowDown : Minus;
            const tone =
              p.deltaMinutes > 1.5
                ? "text-swot-weakness"
                : p.deltaMinutes < -1.5
                  ? "text-swot-strength"
                  : "text-muted-foreground";
            return (
              <div key={p.key} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`flex items-center gap-0.5 ${tone}`}>
                      <Icon className="h-3 w-3" />
                      {p.deltaMinutes > 0 ? "+" : ""}
                      {p.deltaMinutes.toFixed(0)}m vs even
                    </span>
                    <span className="font-semibold text-foreground">
                      {p.minutes.toFixed(0)} min
                    </span>
                    <span>· {p.secondsPerQ}s/Q</span>
                  </span>
                </div>
                <Progress value={(p.minutes / max) * 100} className="h-1.5" />
                <p className="text-[11px] text-muted-foreground">{p.reason}</p>
              </div>
            );
          })}

          {/* ── Editable OMR buffer ── */}
          <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">OMR bubbling buffer</span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setOmrBuffer((v) => Math.max(5, v - 1))}
                  aria-label="Decrease OMR buffer"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-14 text-center text-sm font-semibold tabular-nums">
                  {omrBuffer} min
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setOmrBuffer((v) => Math.min(35, v + 1))}
                  aria-label="Increase OMR buffer"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className={`flex items-start gap-2 rounded-md border px-2.5 py-2 text-xs ${adviceCls}`}>
              <AdviceIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{advice.text}</span>
            </div>
          </div>
        </div>

        {/* ── Pacing insights ── */}
        {plan.insights.length > 0 && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pacing insights
            </p>
            <ul className="space-y-1.5 text-sm leading-relaxed text-foreground">
              {plan.insights.map((insight, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Minute-by-minute checkpoint timeline ── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Checkpoint timeline
          </p>
          <div className="relative pl-7">
            {/* Vertical connector line */}
            <div className="absolute left-[10px] top-2 bottom-2 w-px bg-border" />

            <div className="space-y-0">
              {checkpoints.map((cp, i) => {
                const { Icon, dotCls, rowCls } = checkpointMeta[cp.type];
                const isMini = cp.type === "mini-bubble";
                return (
                  <div key={i} className={`relative flex items-start gap-2.5 ${isMini ? "py-1" : "py-2"}`}>
                    {/* Dot */}
                    <div
                      className={`absolute -left-7 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-background ${dotCls} ${isMini ? "scale-75" : ""}`}
                    >
                      <Icon className={`${isMini ? "h-2 w-2" : "h-2.5 w-2.5"} text-white`} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`text-sm leading-snug ${rowCls} ${isMini ? "text-xs" : ""}`}>
                          {cp.label}
                        </span>
                        <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                          {fmtTime(cp.tMin)}
                        </span>
                      </div>
                      {cp.sublabel && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{cp.sublabel}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground pl-1">
            Times shown as MM:SS from exam start. Mini-bubble markers = every ≈25 questions within a section.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
