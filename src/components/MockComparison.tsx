import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from "recharts";
import { GitCompare, ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { MockRecord } from "@/lib/mock-history";
import { CLAT_SECTIONS } from "@/lib/clat-analyser";
import { buildTimePlan } from "@/lib/time-allocation";
import { recordToAnalyses } from "@/lib/mock-record-utils";

interface Props {
  history: MockRecord[];
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString();
}

function Delta({
  value,
  suffix = "",
  invert = false,
  digits = 2,
}: {
  value: number;
  suffix?: string;
  invert?: boolean;
  digits?: number;
}) {
  const positive = invert ? value < 0 : value > 0;
  const negative = invert ? value > 0 : value < 0;
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus;
  const tone = positive
    ? "text-swot-strength"
    : negative
      ? "text-swot-threat"
      : "text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${tone}`}>
      <Icon className="h-3 w-3" />
      {value > 0 ? "+" : ""}
      {value.toFixed(digits)}
      {suffix}
    </span>
  );
}

export function MockComparison({ history }: Props) {
  const sorted = useMemo(
    () => [...history].sort((a, b) => b.mockDate.localeCompare(a.mockDate)),
    [history],
  );

  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");

  // Default: latest vs previous
  useEffect(() => {
    if (sorted.length >= 2) {
      if (!aId || !sorted.find((r) => r.id === aId)) setAId(sorted[1].id);
      if (!bId || !sorted.find((r) => r.id === bId)) setBId(sorted[0].id);
    }
  }, [sorted, aId, bId]);

  if (sorted.length < 2) {
    return (
      <Card className="shadow-[var(--shadow-soft)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-brand" /> Compare two mocks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Save at least two mocks to unlock side-by-side comparison.
          </p>
        </CardContent>
      </Card>
    );
  }

  const a = sorted.find((r) => r.id === aId) ?? sorted[1];
  const b = sorted.find((r) => r.id === bId) ?? sorted[0];

  const aAnalyses = recordToAnalyses(a);
  const bAnalyses = recordToAnalyses(b);
  const aPlan = buildTimePlan(aAnalyses);
  const bPlan = buildTimePlan(bAnalyses);

  const radarData = CLAT_SECTIONS.map((s) => {
    const aa = aAnalyses.find((x) => x.key === s.key);
    const bb = bAnalyses.find((x) => x.key === s.key);
    return {
      section: s.name.split(" ")[0],
      [`A: ${a.label}`.slice(0, 24)]: aa ? Math.round(aa.accuracy) : 0,
      [`B: ${b.label}`.slice(0, 24)]: bb ? Math.round(bb.accuracy) : 0,
    };
  });
  const aKey = `A: ${a.label}`.slice(0, 24);
  const bKey = `B: ${b.label}`.slice(0, 24);

  const sectionRows = CLAT_SECTIONS.flatMap((s) => {
    const aa = aAnalyses.find((x) => x.key === s.key);
    const bb = bAnalyses.find((x) => x.key === s.key);
    const aTime = aPlan.sections.find((p) => p.key === s.key);
    const bTime = bPlan.sections.find((p) => p.key === s.key);
    if (!aa || !bb || !aTime || !bTime) return [];
    return [{
      key: s.key,
      name: s.name,
      a: aa,
      b: bb,
      scoreDelta: +(bb.score - aa.score).toFixed(2),
      accDelta: +(bb.accuracy - aa.accuracy).toFixed(1),
      attDelta: bb.attempted - aa.attempted,
      timeDelta: +(bTime.minutes - aTime.minutes).toFixed(1),
    }];
  });

  const totals = {
    score: +(b.score - a.score).toFixed(2),
    accuracy: +(b.accuracy - a.accuracy).toFixed(1),
    percentile: +(b.percentile - a.percentile).toFixed(2),
    attempted: b.attempted - a.attempted,
    rank:
      b.rank && a.rank ? b.rank - a.rank : null,
  };

  // Verdict
  const verdict: string[] = [];
  if (totals.score > 0)
    verdict.push(
      `Net +${totals.score} marks · accuracy ${totals.accuracy >= 0 ? "+" : ""}${totals.accuracy}% — momentum is up.`,
    );
  else if (totals.score < 0)
    verdict.push(
      `Net ${totals.score} marks vs the earlier mock — investigate which section bled the most.`,
    );
  else verdict.push("Identical net score — accuracy/attempt mix tells the real story.");

  const biggestGain = [...sectionRows].sort((a, b) => b.scoreDelta - a.scoreDelta)[0];
  const biggestDrop = [...sectionRows].sort((a, b) => a.scoreDelta - b.scoreDelta)[0];
  if (biggestGain && biggestGain.scoreDelta > 0)
    verdict.push(
      `Biggest gain: ${biggestGain.name} (+${biggestGain.scoreDelta} marks) — keep this routine.`,
    );
  if (biggestDrop && biggestDrop.scoreDelta < 0)
    verdict.push(
      `Biggest drop: ${biggestDrop.name} (${biggestDrop.scoreDelta} marks) — prioritise revision here.`,
    );

  // Pacing shift
  const bigPace = sectionRows
    .filter((r) => Math.abs(r.timeDelta) >= 2)
    .map(
      (r) =>
        `${r.name} ${r.timeDelta > 0 ? "+" : ""}${r.timeDelta.toFixed(0)}m`,
    )
    .join(" · ");
  if (bigPace) verdict.push(`Recommended pacing shift A→B: ${bigPace}.`);

  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-brand" /> Compare two mocks
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Side-by-side breakdown across score, accuracy, sections and pacing
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pickers */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Mock A (baseline)
            </div>
            <Select value={aId} onValueChange={setAId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {sorted.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label} · {fmtDate(r.mockDate)} · {r.score}/{r.total}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Mock B (compared to A)
            </div>
            <Select value={bId} onValueChange={setBId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {sorted.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label} · {fmtDate(r.mockDate)} · {r.score}/{r.total}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {a.id === b.id ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Pick two different mocks to compare.
          </div>
        ) : (
          <>
            {/* Headline metrics */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricBlock label="Net score" a={a.score} b={b.score} delta={totals.score} suffix={`/${a.total}`} />
              <MetricBlock label="Accuracy" a={a.accuracy} b={b.accuracy} delta={totals.accuracy} suffix="%" digits={1} />
              <MetricBlock label="Percentile" a={a.percentile} b={b.percentile} delta={totals.percentile} digits={2} />
              <MetricBlock
                label="Attempted"
                a={a.attempted}
                b={b.attempted}
                delta={totals.attempted}
                digits={0}
              />
            </div>

            {/* Tags / context */}
            <div className="grid gap-3 sm:grid-cols-2">
              <ContextCard label="A" record={a} />
              <ContextCard label="B" record={b} />
            </div>

            {/* Section table */}
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Section</th>
                    <th className="p-3 text-right">A net</th>
                    <th className="p-3 text-right">B net</th>
                    <th className="p-3 text-right">Δ Score</th>
                    <th className="p-3 text-right">Δ Acc.</th>
                    <th className="p-3 text-right">Δ Attempts</th>
                    <th className="p-3 text-right">Δ Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sectionRows.map((r) => (
                    <tr key={r.key} className="border-t">
                      <td className="p-3 font-medium">{r.name}</td>
                      <td className="p-3 text-right text-muted-foreground">
                        {r.a.score.toFixed(2)} <span className="text-[11px]">({r.a.accuracy.toFixed(0)}%)</span>
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        {r.b.score.toFixed(2)} <span className="text-[11px]">({r.b.accuracy.toFixed(0)}%)</span>
                      </td>
                      <td className="p-3 text-right"><Delta value={r.scoreDelta} /></td>
                      <td className="p-3 text-right"><Delta value={r.accDelta} suffix="%" digits={1} /></td>
                      <td className="p-3 text-right"><Delta value={r.attDelta} digits={0} /></td>
                      <td className="p-3 text-right"><Delta value={r.timeDelta} suffix="m" digits={1} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Accuracy radar */}
            <div className="h-[320px] rounded-xl border bg-muted/10 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="section" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name={aKey} dataKey={aKey} stroke="var(--swot-opportunity)" fill="var(--swot-opportunity)" fillOpacity={0.25} />
                  <Radar name={bKey} dataKey={bKey} stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.45} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--foreground)",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Verdict */}
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Verdict
              </div>
              <ul className="space-y-1.5 text-sm leading-relaxed">
                {verdict.map((v, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MetricBlock({
  label,
  a,
  b,
  delta,
  suffix = "",
  digits = 2,
}: {
  label: string;
  a: number;
  b: number;
  delta: number;
  suffix?: string;
  digits?: number;
}) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="text-base font-semibold text-foreground">
          {a.toFixed(digits)}
          <span className="mx-1 text-muted-foreground">→</span>
          {b.toFixed(digits)}
          <span className="text-xs text-muted-foreground">{suffix}</span>
        </span>
        <Delta value={delta} digits={digits} />
      </div>
    </div>
  );
}

function ContextCard({ label, record }: { label: string; record: MockRecord }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        Mock {label}
      </div>
      <div className="mt-1 font-semibold">{record.label}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {fmtDate(record.mockDate)}
        {record.source ? ` · ${record.source}` : ""}
        {record.rank ? ` · #${record.rank.toLocaleString()}` : ""}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {record.mockType && <Badge variant="outline" className="text-[10px]">{record.mockType}</Badge>}
        {record.difficulty && <Badge variant="outline" className="text-[10px]">{record.difficulty}</Badge>}
        {record.tags.map((t) => (
          <Badge key={t} variant="secondary" className="text-[10px]">#{t}</Badge>
        ))}
      </div>
    </div>
  );
}
