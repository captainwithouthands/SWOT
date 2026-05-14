import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  LineChart as LineIcon,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Pencil,
  Copy,
  Search,
  X,
} from "lucide-react";
import type { MockRecord } from "@/lib/mock-history";
import { TOP_COLLEGE_CUTOFF, TOP_COLLEGE_CUTOFF_MARKS } from "@/lib/clat-analyser";
import { MockEditor } from "./MockEditor";

type SortKey = "date" | "score" | "percentile";

interface Props {
  history: MockRecord[];
  onDelete: (id: string) => void;
  onClear: () => void;
  onEdit: (record: MockRecord) => Promise<void> | void;
  onDuplicate: (record: MockRecord) => void;
  isCloud: boolean;
}

export function MockHistory({ history, onDelete, onClear, onEdit, onDuplicate, isCloud }: Props) {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<string | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [editing, setEditing] = useState<MockRecord | null>(null);

  const allTags = useMemo(
    () => Array.from(new Set(history.flatMap((r) => r.tags ?? []))).sort(),
    [history],
  );
  const allSources = useMemo(
    () => Array.from(new Set(history.map((r) => r.source).filter(Boolean) as string[])).sort(),
    [history],
  );

  const filtered = useMemo(() => {
    let list = [...history];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (r) =>
          r.label.toLowerCase().includes(q) ||
          r.notes?.toLowerCase().includes(q) ||
          r.source?.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (tagFilter !== "all") list = list.filter((r) => r.tags.includes(tagFilter));
    if (sourceFilter !== "all") list = list.filter((r) => r.source === sourceFilter);
    list.sort((a, b) => {
      if (sortKey === "score") return a.score - b.score;
      if (sortKey === "percentile") return a.percentile - b.percentile;
      return a.mockDate.localeCompare(b.mockDate);
    });
    return list;
  }, [history, query, tagFilter, sourceFilter, sortKey]);

  const chartData = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => a.mockDate.localeCompare(b.mockDate))
        .map((r, i) => ({
          name: r.label.length > 14 ? r.label.slice(0, 12) + "…" : r.label,
          Score: r.score,
          Accuracy: r.accuracy,
          Percentile: r.percentile,
          idx: i + 1,
        })),
    [filtered],
  );

  const delta = useMemo(() => {
    if (filtered.length < 2) return null;
    const sorted = [...filtered].sort((a, b) => a.mockDate.localeCompare(b.mockDate));
    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    return {
      score: +(last.score - prev.score).toFixed(2),
      accuracy: +(last.accuracy - prev.accuracy).toFixed(1),
      percentile: +(last.percentile - prev.percentile).toFixed(1),
    };
  }, [filtered]);

  const filtersActive = query || tagFilter !== "all" || sourceFilter !== "all";

  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <LineIcon className="h-4 w-4 text-brand" /> Progress over time
          <span className="text-xs font-normal text-muted-foreground">
            {filtered.length}/{history.length} mocks{isCloud ? " · ☁︎ cloud" : ""}
          </span>
        </CardTitle>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="gap-1 text-xs">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Filter bar */}
        {history.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/20 p-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search label, notes, tag…"
                className="h-9 pl-8"
              />
            </div>
            {allTags.length > 0 && (
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Tag" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {allTags.map((t) => <SelectItem key={t} value={t}>#{t}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {allSources.length > 0 && (
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {allSources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort: date</SelectItem>
                <SelectItem value="score">Sort: score</SelectItem>
                <SelectItem value="percentile">Sort: %ile</SelectItem>
              </SelectContent>
            </Select>
            {filtersActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setQuery(""); setTagFilter("all"); setSourceFilter("all"); }}
                className="h-9 gap-1 text-xs"
              >
                <X className="h-3.5 w-3.5" /> Reset
              </Button>
            )}
          </div>
        )}

        {delta && (
          <div className="grid gap-3 sm:grid-cols-3">
            <DeltaPill label="Score" value={delta.score} suffix="" />
            <DeltaPill label="Accuracy" value={delta.accuracy} suffix="%" />
            <DeltaPill label="Percentile" value={delta.percentile} suffix="" />
          </div>
        )}

        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Save your first mock to start tracking growth across attempts.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No mocks match your filters.
          </div>
        ) : (
          <>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine
                    yAxisId="right"
                    y={TOP_COLLEGE_CUTOFF}
                    stroke="var(--swot-threat)"
                    strokeDasharray="3 3"
                    label={{
                      value: `Top 3 NLU cutoff (${TOP_COLLEGE_CUTOFF}%ile)`,
                      position: "insideTopRight",
                      fill: "var(--swot-threat)",
                      fontSize: 10,
                    }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="Score" stroke="var(--brand)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="Accuracy" stroke="var(--swot-strength)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="Percentile" stroke="var(--swot-opportunity)" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gap to Top 3 NLU cutoff */}
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4 text-swot-threat" />
                Gap to Top 3 NLU cutoff ({TOP_COLLEGE_CUTOFF_MARKS} marks · {TOP_COLLEGE_CUTOFF}%ile)
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {[...filtered].reverse().slice(0, 4).map((r, idx) => {
                  const pGap = +(TOP_COLLEGE_CUTOFF - r.percentile).toFixed(2);
                  const mGap = +(TOP_COLLEGE_CUTOFF_MARKS - r.score).toFixed(2);
                  const cleared = r.score >= TOP_COLLEGE_CUTOFF_MARKS;
                  const tag = idx === 0 ? "Latest" : idx === 1 ? "Previous" : `−${idx}`;
                  return (
                    <div key={r.id} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{r.label}</div>
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          {tag} · {r.percentile}%ile · {r.score}/{r.total}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {cleared ? (
                          <span className="font-semibold text-swot-strength">In top 3 ✓</span>
                        ) : (
                          <>
                            <div className="font-semibold text-swot-threat">+{mGap} marks</div>
                            <div className="text-[11px] text-muted-foreground">
                              {pGap > 0 ? `+${pGap}%ile` : "—"}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Mock</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Source</th>
                    <th className="p-3 text-right">Score</th>
                    <th className="p-3 text-right">Acc.</th>
                    <th className="p-3 text-right">%ile</th>
                    <th className="p-3 text-right">Rank</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].reverse().map((r) => (
                    <tr key={r.id} className="border-t align-top">
                      <td className="p-3">
                        <div className="font-medium">{r.label}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          {r.mockType && <Badge variant="outline" className="text-[10px]">{r.mockType}</Badge>}
                          {r.difficulty && <Badge variant="outline" className="text-[10px]">{r.difficulty}</Badge>}
                          {r.tags.map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">#{t}</Badge>
                          ))}
                        </div>
                        {r.notes && (
                          <div className="mt-1 line-clamp-2 max-w-[280px] text-[11px] text-muted-foreground">
                            {r.notes}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(r.mockDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-muted-foreground">{r.source ?? "—"}</td>
                      <td className="p-3 text-right font-medium">
                        {r.score} <span className="text-muted-foreground">/ {r.total}</span>
                      </td>
                      <td className="p-3 text-right">{r.accuracy}%</td>
                      <td className="p-3 text-right">{r.percentile}</td>
                      <td className="p-3 text-right">
                        {r.rank ? (
                          <>
                            #{r.rank.toLocaleString()}
                            {r.cohortSize && (
                              <span className="ml-1 text-[11px] text-muted-foreground">
                                /{r.cohortSize >= 1000 ? `${r.cohortSize / 1000}k` : r.cohortSize}
                                {r.rankMode === "batch" ? " · batch" : ""}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditing(r)}
                            className="h-8 w-8"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onDuplicate(r)}
                            className="h-8 w-8"
                            title="Duplicate as new draft"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onDelete(r.id)}
                            className="h-8 w-8"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <MockEditor
          open={!!editing}
          record={editing}
          onOpenChange={(v) => { if (!v) setEditing(null); }}
          onSave={onEdit}
        />
      </CardContent>
    </Card>
  );
}

function DeltaPill({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const color =
    value > 0
      ? "text-swot-strength"
      : value < 0
        ? "text-swot-threat"
        : "text-muted-foreground";
  const sign = value > 0 ? "+" : "";
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label} vs last mock</div>
      <div className={`mt-1 flex items-center gap-1.5 text-lg font-bold ${color}`}>
        <Icon className="h-4 w-4" />
        {sign}
        {value}
        {suffix}
      </div>
    </div>
  );
}
