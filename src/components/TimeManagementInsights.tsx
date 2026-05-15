import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  Flag,
  Pencil,
  CheckCheck,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import type { SectionAnalysis } from "@/lib/clat-analyser";
import {
  buildTimePlan,
  CLAT_EXAM_MINUTES,
  OMR_BUFFER_MINUTES,
  type SectionDifficulty,
  type TimePlan,
} from "@/lib/time-allocation";

/* ─── OMR advice ──────────────────────────────────────────────────── */

type AdviceLevel = "danger" | "warn" | "ok";

function getOmrAdvice(buf: number): { level: AdviceLevel; text: string } {
  if (buf > 22)
    return {
      level: "warn",
      text: "Reserving too much for OMR — that eats into your solving budget. 15–20 min is plenty.",
    };
  if (buf <= 10)
    return {
      level: "danger",
      text: "Very tight. Rushed bubbling causes irreversible marking errors — keep at least 13 min.",
    };
  if (buf <= 13)
    return { level: "warn", text: "A bit tight. Aim for 14+ min so you're not rushing the final bubble-in." };
  return { level: "ok", text: "Good buffer — enough to bubble carefully without a last-minute scramble." };
}

const adviceStyles: Record<AdviceLevel, { icon: React.ElementType; cls: string }> = {
  danger: { icon: AlertCircle, cls: "text-swot-weakness bg-swot-weakness/10 border-swot-weakness/25" },
  warn: { icon: AlertTriangle, cls: "text-swot-threat bg-swot-threat/10 border-swot-threat/25" },
  ok: { icon: CheckCircle2, cls: "text-swot-strength bg-swot-strength/10 border-swot-strength/25" },
};

/* ─── Difficulty toggle (Recommended panel only) ──────────────────── */

const DIFFICULTIES: SectionDifficulty[] = ["Easy", "Medium", "Hard"];

const diffStyle: Record<SectionDifficulty, { active: string; label: string }> = {
  Easy: { active: "bg-swot-strength/15 text-swot-strength border-swot-strength/40 font-semibold", label: "E" },
  Medium: { active: "bg-muted text-muted-foreground border-border font-semibold", label: "M" },
  Hard: { active: "bg-swot-weakness/15 text-swot-weakness border-swot-weakness/40 font-semibold", label: "H" },
};

function DifficultyToggle({
  sectionKey,
  value,
  onChange,
}: {
  sectionKey: string;
  value: SectionDifficulty;
  onChange: (key: string, d: SectionDifficulty) => void;
}) {
  return (
    <div
      className="flex overflow-hidden rounded border border-border"
      title="Expected difficulty for next exam"
    >
      {DIFFICULTIES.map((d) => {
        const isActive = value === d;
        return (
          <button
            key={d}
            onClick={() => onChange(sectionKey, d)}
            className={`px-1.5 py-0.5 text-[10px] leading-none transition-colors ${
              isActive
                ? diffStyle[d].active
                : "text-muted-foreground/50 hover:bg-muted/60 hover:text-muted-foreground"
            }`}
            title={`${d} — next exam`}
            aria-label={`Mark ${d}`}
            aria-pressed={isActive}
          >
            {diffStyle[d].label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── AI Order Suggestion ─────────────────────────────────────────── */

interface AiOrderItem {
  key: string;
  name: string;
  position: number;
  reason: string;
}

function buildAiOrder(sections: SectionAnalysis[]): AiOrderItem[] {
  const score = (s: SectionAnalysis): number => {
    let pts = s.netRate * 0.5;
    if (s.key === "legal" && s.accuracy >= 60) pts += 12;
    if (s.key === "english") pts += 5;
    if (s.key === "currentAffairs") pts -= 18;
    if (s.key === "quant" && s.accuracy >= 70) pts += 8;
    if (s.accuracy >= 80 && s.attempted > 0) pts += 10;
    if (s.accuracy < 40 && s.attempted > 0) pts -= 15;
    return pts;
  };

  const sorted = [...sections].sort((a, b) => score(b) - score(a));

  return sorted.map((s, i) => {
    const pos = i + 1;
    const last = sorted.length;
    let reason: string;

    if (pos === 1) {
      if (s.key === "legal")
        reason = `32-mark anchor — ${s.accuracy > 0 ? `your ${s.accuracy.toFixed(0)}% accuracy here is your biggest score lever.` : "highest mark weight."} Attack while focus is sharpest.`;
      else if (s.accuracy >= 75 && s.attempted > 0)
        reason = `Strong opener — ${s.accuracy.toFixed(0)}% accuracy builds early confidence and banks marks before pressure peaks.`;
      else
        reason = `Best available opener — establishes rhythm and momentum early.`;
    } else if (pos === last) {
      if (s.key === "currentAffairs")
        reason = `Recall section — park it last. You either know the fact or you don't; no amount of re-reading helps.`;
      else if (s.accuracy < 50 && s.attempted > 0)
        reason = `Weakest section (${s.accuracy.toFixed(0)}% accuracy) — attempt last so earlier sections aren't contaminated by early frustration.`;
      else
        reason = `Close with this — mop up remaining time here.`;
    } else {
      if (s.key === "currentAffairs")
        reason = `Recall-based — cap at 10–12 min and move on regardless of how many you know.`;
      else if (s.accuracy >= 70 && s.attempted > 0)
        reason = `Solid ${s.accuracy.toFixed(0)}% accuracy — maintains momentum through the exam middle.`;
      else if (s.key === "legal")
        reason = `Highest-weight section (32 marks) — prioritised even if accuracy is building.`;
      else
        reason = `Mid-exam slot — less opening anxiety, more energy than the close.`;
    }
    return { key: s.key, name: s.name, position: pos, reason };
  });
}

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

const checkpointMeta: Record<CheckpointType, { Icon: React.ElementType; dotCls: string; rowCls: string }> = {
  "exam-start": { Icon: Flag, dotCls: "bg-brand border-brand", rowCls: "font-semibold text-foreground" },
  "section-start": { Icon: Clock, dotCls: "bg-brand/70 border-brand/70", rowCls: "font-medium text-foreground" },
  "mini-bubble": { Icon: Pencil, dotCls: "bg-swot-opportunity/60 border-swot-opportunity/60", rowCls: "text-muted-foreground" },
  "omr-start": { Icon: CheckCheck, dotCls: "bg-swot-strength border-swot-strength", rowCls: "font-semibold text-foreground" },
  "exam-end": { Icon: Flag, dotCls: "bg-swot-weakness border-swot-weakness", rowCls: "font-semibold text-foreground" },
};

/* ─── Today's Pacing Panel ────────────────────────────────────────── */

function TodayPanel({ sections, defaultPlan }: { sections: SectionAnalysis[]; defaultPlan: ReturnType<typeof buildTimePlan> }) {
  const hasData = sections.some((s) => s.minutesSpent != null);
  const totalSpent = sections.reduce((a, s) => a + (s.minutesSpent ?? 0), 0);
  const maxBar = Math.max(
    ...sections.map((s) => s.minutesSpent ?? 0),
    ...defaultPlan.sections.map((p) => p.minutes),
    1,
  );

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <Clock className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Enter <span className="font-semibold">Min spent</span> for each section above to see how you paced today.
        </p>
        <p className="text-xs text-muted-foreground/70">
          Bars will show your actual time vs the recommended plan side-by-side.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Total time recorded</span>
        <span className="font-semibold tabular-nums">
          {totalSpent} min
          {totalSpent > 0 && (
            <span className={`ml-2 text-xs ${totalSpent > CLAT_EXAM_MINUTES ? "text-swot-weakness" : "text-muted-foreground"}`}>
              ({totalSpent > CLAT_EXAM_MINUTES ? `${totalSpent - CLAT_EXAM_MINUTES}m over exam limit` : `${CLAT_EXAM_MINUTES - totalSpent}m unaccounted`})
            </span>
          )}
        </span>
      </div>

      {/* Section bars */}
      <div className="space-y-4">
        {sections.map((s) => {
          const spent = s.minutesSpent;
          const rec = defaultPlan.sections.find((p) => p.key === s.key)?.minutes ?? 0;
          const hasSpent = spent != null;
          const ratio = hasSpent ? spent / rec : null;
          const isOver = ratio != null && ratio > 1.2;
          const isUnder = ratio != null && ratio < 0.82;
          const tone = isOver ? "text-swot-weakness" : isUnder ? "text-swot-strength" : "text-muted-foreground";
          const barColor = isOver
            ? "bg-swot-weakness/70"
            : isUnder
            ? "bg-swot-strength/70"
            : "bg-brand/70";

          return (
            <div key={s.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{s.name}</span>
                <span className={`flex items-center gap-2 text-xs ${tone}`}>
                  {hasSpent ? (
                    <>
                      <span className="font-semibold text-foreground">{spent} min</span>
                      <span>
                        vs {rec.toFixed(0)} min plan
                        {ratio != null && ratio !== 1 && (
                          <span className="ml-1 font-semibold">
                            ({isOver ? `+${(spent! - rec).toFixed(0)}m over` : `-${(rec - spent!).toFixed(0)}m under`})
                          </span>
                        )}
                      </span>
                    </>
                  ) : (
                    <span className="italic text-muted-foreground/50">not entered</span>
                  )}
                </span>
              </div>

              {/* Dual bar: actual vs recommended */}
              <div className="space-y-1">
                {hasSpent && (
                  <div className="flex items-center gap-2">
                    <span className="w-12 shrink-0 text-right text-[10px] text-muted-foreground">Actual</span>
                    <div className="flex-1 rounded-full bg-muted/40 h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, ((spent ?? 0) / maxBar) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-right text-[10px] text-muted-foreground">Plan</span>
                  <div className="flex-1 rounded-full bg-muted/40 h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand/30 transition-all duration-500"
                      style={{ width: `${Math.min(100, (rec / maxBar) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {s.accuracy > 0 && (
                <p className="text-[11px] text-muted-foreground pl-14">
                  {s.accuracy.toFixed(0)}% accuracy · {s.score.toFixed(2)} net
                  {hasSpent && rec > 0 && ratio != null && (
                    <span className={`ml-2 ${tone}`}>
                      {ratio > 1.2
                        ? `— slow relative to accuracy`
                        : ratio < 0.82
                        ? `— time-efficient`
                        : `— on-pace`}
                    </span>
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Recommended Plan Panel ──────────────────────────────────────── */

function PlanPanel({
  sections,
  sectionOrder,
  onReorder,
  omrBuffer,
  setOmrBuffer,
  sectionDifficulty,
  setDiff,
  aiOrder,
  onApplyAiOrder,
}: {
  sections: SectionAnalysis[];
  sectionOrder: string[];
  onReorder: (key: string, dir: -1 | 1) => void;
  omrBuffer: number;
  setOmrBuffer: (fn: (v: number) => number) => void;
  sectionDifficulty: Record<string, SectionDifficulty>;
  setDiff: (key: string, d: SectionDifficulty) => void;
  aiOrder: AiOrderItem[];
  onApplyAiOrder: () => void;
}) {
  const [showAi, setShowAi] = useState(true);

  const orderedSections = sectionOrder
    .map((key) => sections.find((s) => s.key === key))
    .filter((s): s is SectionAnalysis => s != null);

  const plan = buildTimePlan(orderedSections, CLAT_EXAM_MINUTES, { omrBuffer, sectionDifficulty });
  const max = Math.max(...plan.sections.map((p) => p.minutes), 1);
  const advice = getOmrAdvice(omrBuffer);
  const { icon: AdviceIcon, cls: adviceCls } = adviceStyles[advice.level];
  const checkpoints = buildCheckpoints(plan);

  const currentOrderKeys = sectionOrder;
  const isAiOrder =
    aiOrder.length === currentOrderKeys.length &&
    aiOrder.every((item, i) => item.key === currentOrderKeys[i]);

  return (
    <div className="space-y-5">
      {/* ── AI Section Order ── */}
      <div className="rounded-xl border bg-muted/20 overflow-hidden">
        <button
          onClick={() => setShowAi((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span className="text-sm font-semibold">AI-suggested section order</span>
            {isAiOrder && (
              <span className="rounded-full bg-swot-strength/15 px-2 py-0.5 text-[10px] font-medium text-swot-strength">
                Applied
              </span>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${showAi ? "rotate-180" : ""}`}
          />
        </button>

        {showAi && (
          <div className="border-t px-4 pb-4 pt-3 space-y-3">
            <p className="text-[11px] text-muted-foreground">
              Based on your accuracy profile — tackles high-value sections early when focus is sharpest.
            </p>
            <ol className="space-y-2">
              {aiOrder.map((item) => (
                <li key={item.key} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand mt-0.5">
                    {item.position}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.reason}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1.5"
              onClick={onApplyAiOrder}
              disabled={isAiOrder}
            >
              <Sparkles className="h-3 w-3" />
              {isAiOrder ? "AI order applied" : "Apply this order"}
            </Button>
          </div>
        )}
      </div>

      {/* ── Section order editor + allocation bars ── */}
      <div className="space-y-3">
        <p className="text-[11px] text-muted-foreground">
          Drag the order you'll attempt sections · tap <span className="font-semibold">E · M · H</span> to adjust for expected difficulty.
        </p>

        {sectionOrder.map((key, idx) => {
          const p = plan.sections.find((x) => x.key === key);
          if (!p) return null;
          const DeltaIcon = p.deltaMinutes > 1.5 ? ArrowUp : p.deltaMinutes < -1.5 ? ArrowDown : Minus;
          const tone =
            p.deltaMinutes > 1.5
              ? "text-swot-weakness"
              : p.deltaMinutes < -1.5
              ? "text-swot-strength"
              : "text-muted-foreground";
          const currentDiff = sectionDifficulty[key] ?? "Medium";

          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                {/* Position badge + reorder controls */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <button
                      onClick={() => onReorder(key, -1)}
                      disabled={idx === 0}
                      className="h-3.5 w-4 flex items-center justify-center text-muted-foreground/50 hover:text-foreground disabled:opacity-20 transition-colors"
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onReorder(key, 1)}
                      disabled={idx === sectionOrder.length - 1}
                      className="h-3.5 w-4 flex items-center justify-center text-muted-foreground/50 hover:text-foreground disabled:opacity-20 transition-colors"
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Name + difficulty */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-medium truncate">{p.name}</span>
                  <DifficultyToggle sectionKey={key} value={currentDiff} onChange={setDiff} />
                </div>

                {/* Stats */}
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <span className={`flex items-center gap-0.5 ${tone}`}>
                    <DeltaIcon className="h-3 w-3" />
                    {p.deltaMinutes > 0 ? "+" : ""}
                    {p.deltaMinutes.toFixed(0)}m
                  </span>
                  <span className="font-semibold text-foreground">{p.minutes.toFixed(0)} min</span>
                  <span>· {p.secondsPerQ}s/Q</span>
                </span>
              </div>
              <Progress value={(p.minutes / max) * 100} className="h-1.5 ml-11" />
              <p className="text-[11px] text-muted-foreground ml-11">{p.reason}</p>
            </div>
          );
        })}

        {/* ── OMR buffer ── */}
        <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-2.5 space-y-2 mt-2">
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
              <span className="w-14 text-center text-sm font-semibold tabular-nums">{omrBuffer} min</span>
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

      {/* ── Checkpoint timeline ── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Checkpoint timeline
        </p>
        <div className="relative pl-7">
          <div className="absolute left-[10px] top-2 bottom-2 w-px bg-border" />
          <div className="space-y-0">
            {checkpoints.map((cp, i) => {
              const { Icon, dotCls, rowCls } = checkpointMeta[cp.type];
              const isMini = cp.type === "mini-bubble";
              return (
                <div key={i} className={`relative flex items-start gap-2.5 ${isMini ? "py-1" : "py-2"}`}>
                  <div
                    className={`absolute -left-7 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-background ${dotCls} ${isMini ? "scale-75" : ""}`}
                  >
                    <Icon className={`${isMini ? "h-2 w-2" : "h-2.5 w-2.5"} text-white`} />
                  </div>
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
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────── */

export function TimeManagementInsights({ sections }: { sections: SectionAnalysis[] }) {
  const [panel, setPanel] = useState<0 | 1>(0);
  const [omrBuffer, setOmrBuffer] = useState(OMR_BUFFER_MINUTES);
  const [sectionDifficulty, setSectionDifficulty] = useState<Record<string, SectionDifficulty>>({});
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => sections.map((s) => s.key));

  const defaultPlan = buildTimePlan(sections);

  const aiOrder = buildAiOrder(sections);

  const setDiff = (key: string, d: SectionDifficulty) =>
    setSectionDifficulty((prev) => ({ ...prev, [key]: d }));

  const moveSection = (key: string, dir: -1 | 1) => {
    setSectionOrder((prev) => {
      const idx = prev.indexOf(key);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const applyAiOrder = () => setSectionOrder(aiOrder.map((x) => x.key));

  const hasTimeData = sections.some((s) => s.minutesSpent != null);

  const TABS = [
    { label: "Today's pacing", sub: hasTimeData ? undefined : "enter min spent above" },
    { label: "Next exam plan", sub: undefined },
  ] as const;

  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardHeader className="pb-0">
        {/* Header row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand" />
            <span className="font-semibold text-base">Time Management</span>
          </div>

          {/* Pill switcher */}
          <div className="flex rounded-lg border bg-muted/30 p-0.5 gap-0.5 self-start sm:self-auto">
            {TABS.map((tab, i) => (
              <button
                key={i}
                onClick={() => setPanel(i as 0 | 1)}
                className={`relative flex flex-col items-center rounded-md px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                  panel === i
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.sub && (
                  <span className="text-[9px] text-muted-foreground/70 font-normal">{tab.sub}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 overflow-hidden">
        {/* Sliding track */}
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            width: "200%",
            transform: `translateX(${panel === 0 ? "0%" : "-50%"})`,
          }}
        >
          {/* Panel 0 — Today's pacing */}
          <div className="w-1/2 min-w-0 pr-6">
            <TodayPanel sections={sections} defaultPlan={defaultPlan} />
          </div>

          {/* Panel 1 — Recommended plan */}
          <div className="w-1/2 min-w-0">
            <PlanPanel
              sections={sections}
              sectionOrder={sectionOrder}
              onReorder={moveSection}
              omrBuffer={omrBuffer}
              setOmrBuffer={setOmrBuffer}
              sectionDifficulty={sectionDifficulty}
              setDiff={setDiff}
              aiOrder={aiOrder}
              onApplyAiOrder={applyAiOrder}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
