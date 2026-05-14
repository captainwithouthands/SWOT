import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { Timer, ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { MockRecord } from "@/lib/mock-history";
import { CLAT_SECTIONS } from "@/lib/clat-analyser";
import { buildTimePlan, CLAT_EXAM_MINUTES } from "@/lib/time-allocation";
import { recordToAnalyses } from "@/lib/mock-record-utils";

const SECTION_COLORS: Record<string, string> = {
  english: "var(--brand)",
  currentAffairs: "var(--swot-opportunity)",
  legal: "var(--swot-strength)",
  logical: "var(--swot-weakness)",
  quant: "var(--swot-threat)",
};

export function PacingHistory({ history }: { history: MockRecord[] }) {
  const sorted = useMemo(
    () => [...history].sort((a, b) => a.mockDate.localeCompare(b.mockDate)),
    [history],
  );

  const data = useMemo(
    () =>
      sorted.map((r, i) => {
        const plan = buildTimePlan(recordToAnalyses(r));
        const row: Record<string, number | string> = {
          name: r.label.length > 14 ? r.label.slice(0, 12) + "…" : r.label,
          idx: i + 1,
        };
        plan.sections.forEach((p) => {
          row[p.name.split(" ")[0]] = +p.minutes.toFixed(1);
        });
        return row;
      }),
    [sorted],
  );

  // Drift: latest plan vs first plan, per section
  const drift = useMemo(() => {
    if (sorted.length < 2) return [];
    const first = buildTimePlan(recordToAnalyses(sorted[0]));
    const last = buildTimePlan(recordToAnalyses(sorted[sorted.length - 1]));
    return CLAT_SECTIONS.map((s) => {
      const f = first.sections.find((p) => p.key === s.key);
      const l = last.sections.find((p) => p.key === s.key);
      const delta = (l?.minutes ?? 0) - (f?.minutes ?? 0);
      return {
        key: s.key,
        name: s.name,
        first: f?.minutes ?? 0,
        last: l?.minutes ?? 0,
        delta: +delta.toFixed(1),
      };
    });
  }, [sorted]);

  const evenPace = CLAT_EXAM_MINUTES / 5; // 24 minutes per section if equal

  if (sorted.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-brand" /> Pacing evolution
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            How your recommended minutes-per-section have shifted
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {sorted.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            Save at least two mocks to see your pacing trends.
          </p>
        ) : (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    label={{
                      value: "Minutes",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "var(--muted-foreground)", fontSize: 11 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine
                    y={evenPace}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="3 3"
                    label={{
                      value: `Even pace ${evenPace}m`,
                      position: "insideTopRight",
                      fill: "var(--muted-foreground)",
                      fontSize: 10,
                    }}
                  />
                  {CLAT_SECTIONS.map((s) => (
                    <Line
                      key={s.key}
                      type="monotone"
                      dataKey={s.name.split(" ")[0]}
                      stroke={SECTION_COLORS[s.key]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {drift.map((d) => {
                const Icon = d.delta > 0.5 ? ArrowUp : d.delta < -0.5 ? ArrowDown : Minus;
                const tone =
                  d.delta > 0.5
                    ? "text-swot-weakness"
                    : d.delta < -0.5
                      ? "text-swot-strength"
                      : "text-muted-foreground";
                return (
                  <div key={d.key} className="rounded-lg border bg-card px-3 py-2">
                    <div className="text-xs font-medium">{d.name}</div>
                    <div className="mt-1 flex items-baseline justify-between text-xs text-muted-foreground">
                      <span>
                        {d.first.toFixed(0)}m → {d.last.toFixed(0)}m
                      </span>
                      <span className={`flex items-center gap-0.5 font-semibold ${tone}`}>
                        <Icon className="h-3 w-3" />
                        {d.delta > 0 ? "+" : ""}
                        {d.delta.toFixed(1)}m
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Lines show the recommended minutes per section the analyser
              suggested for each saved mock — driven by your accuracy that day.
              Sections trending <span className="text-swot-strength">down</span>{" "}
              mean your accuracy improved (you can move faster). Sections trending{" "}
              <span className="text-swot-weakness">up</span> mean accuracy
              dropped and the plan reserved more time.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
