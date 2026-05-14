import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MockHistory } from "./MockHistory";
import {
  loadHistory,
  upsertRecord,
  deleteRecord,
  clearHistory,
  buildRecord,
  importLocalToCloud,
  type MockRecord,
  type MockType,
  type Difficulty,
} from "@/lib/mock-history";
import { TOP_COLLEGE_CUTOFF_MARKS, TOP_COLLEGE_CUTOFF_RANK } from "@/lib/clat-analyser";
import {
  CLAT_SECTIONS,
  CLAT_TOTAL_MARKS,
  analyseSection,
  buildSwot,
  totals,
  COHORT_PRESETS,
  TOP_COLLEGE_CUTOFF,
  type SectionInput,
} from "@/lib/clat-analyser";
import { SectionTotalsEditor } from "./SectionTotalsEditor";
import { buildTimePlan } from "@/lib/time-allocation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { SwotChart } from "./SwotChart";
import { SwotQuadrants } from "./SwotQuadrants";
import { MockUpload } from "./MockUpload";
import { Toaster } from "@/components/ui/sonner";
import { applyParsed, type ParseReport } from "@/lib/mock-parser";
import { Scale, Sparkles, RotateCcw, TrendingUp, FileDown, LogOut, Cloud, CloudOff } from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import { exportReportPdf } from "@/lib/pdf-export";
import { TagInput } from "./TagInput";
import { TimeManagementInsights } from "./TimeManagementInsights";
import { PacingHistory } from "./PacingHistory";
import { MockComparison } from "./MockComparison";
import { AuthDialog } from "./AuthDialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const initial: Record<string, SectionInput> = Object.fromEntries(
  CLAT_SECTIONS.map((s) => [
    s.key,
    { key: s.key, name: s.name, attempted: 0, correct: 0, total: s.total },
  ]),
) as Record<string, SectionInput>;

const TYPES: MockType[] = ["Full", "Sectional", "Revision", "Surprise"];
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard", "Brutal"];

interface MetaState {
  label: string;
  mockDate: string;
  source: string;
  mockType: MockType | "";
  difficulty: Difficulty | "";
  tags: string[];
  notes: string;
}

const blankMeta: MetaState = {
  label: "",
  mockDate: new Date().toISOString().slice(0, 10),
  source: "",
  mockType: "",
  difficulty: "",
  tags: [],
  notes: "",
};

export function MockAnalyser() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [inputs, setInputs] = useState(initial);
  const [history, setHistory] = useState<MockRecord[]>([]);
  const [cohortSize, setCohortSize] = useState<number>(60000);
  const [topperScore, setTopperScore] = useState<number | "">("");
  const [meta, setMeta] = useState<MetaState>(blankMeta);
  const [importPrompted, setImportPrompted] = useState(false);

  // Restore drafts (auto-snapshot)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedInputs = localStorage.getItem("clat-current-inputs");
    if (savedInputs) {
      try { setInputs(JSON.parse(savedInputs)); } catch { /* noop */ }
    }
    const savedMeta = localStorage.getItem("clat-current-meta");
    if (savedMeta) {
      try { setMeta({ ...blankMeta, ...JSON.parse(savedMeta) }); } catch { /* noop */ }
    }
    const c = localStorage.getItem("clat-cohort-size");
    if (c) setCohortSize(parseInt(c) || 60000);
    const t = localStorage.getItem("clat-topper-score");
    if (t) setTopperScore(parseFloat(t) || "");
  }, []);

  // Auto-snapshot inputs + meta to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("clat-current-inputs", JSON.stringify(inputs));
  }, [inputs]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("clat-current-meta", JSON.stringify(meta));
  }, [meta]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("clat-cohort-size", String(cohortSize));
  }, [cohortSize]);
  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem("clat-topper-score", topperScore === "" ? "" : String(topperScore));
  }, [topperScore]);

  // Load history when auth state is known
  useEffect(() => {
    if (authLoading) return;
    loadHistory(userId).then(setHistory).catch((e) => {
      console.error(e);
      toast.error("Could not load history");
    });
  }, [authLoading, userId]);

  // First sign-in: offer to import local history
  useEffect(() => {
    if (!userId || importPrompted) return;
    if (typeof window === "undefined") return;
    const local = localStorage.getItem("clat-mock-history-v2") || localStorage.getItem("clat-mock-history-v1");
    if (!local || local === "[]") return;
    try {
      const arr = JSON.parse(local);
      if (!Array.isArray(arr) || !arr.length) return;
    } catch { return; }
    setImportPrompted(true);
    toast("Import local mocks to your cloud account?", {
      duration: 12000,
      action: {
        label: "Import",
        onClick: async () => {
          try {
            const n = await importLocalToCloud(userId);
            const next = await loadHistory(userId);
            setHistory(next);
            toast.success(`Imported ${n} mocks to cloud`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Import failed");
          }
        },
      },
    });
  }, [userId, importPrompted]);

  const cohortPreset = COHORT_PRESETS.find((c) => c.size === cohortSize) ?? COHORT_PRESETS[3];
  const isBatch = cohortPreset.kind === "batch";

  const analyses = useMemo(
    () => CLAT_SECTIONS.map((s) => analyseSection(inputs[s.key])),
    [inputs],
  );
  const timePlan = useMemo(() => buildTimePlan(analyses), [analyses]);
  const swot = useMemo(
    () =>
      buildSwot(analyses, {
        totalScore: analyses.reduce((a, s) => a + s.score, 0),
        recommendedMinutes: Object.fromEntries(timePlan.sections.map((p) => [p.key, p.minutes])),
      }),
    [analyses, timePlan],
  );
  const t = useMemo(
    () =>
      totals(analyses, cohortSize, {
        kind: cohortPreset.kind,
        topperScore: isBatch && typeof topperScore === "number" ? topperScore : undefined,
      }),
    [analyses, cohortSize, cohortPreset.kind, isBatch, topperScore],
  );

  const saveCurrent = async () => {
    if (t.attempted === 0) {
      toast.error("Add some attempts before saving.");
      return;
    }
    const record = buildRecord(meta.label, analyses, t, {
      mockDate: meta.mockDate,
      source: meta.source.trim() || undefined,
      mockType: meta.mockType || undefined,
      difficulty: meta.difficulty || undefined,
      tags: meta.tags,
      notes: meta.notes.trim() || undefined,
    });
    try {
      const next = await upsertRecord(record, userId);
      setHistory(next);
      toast.success(userId ? "Mock saved to cloud" : "Mock saved locally", {
        description: record.label,
      });
      // Reset label/notes for next attempt; keep date+source+tags as sticky context
      setMeta((m) => ({ ...m, label: "", notes: "" }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const editRecord = async (updated: MockRecord) => {
    try {
      const next = await upsertRecord(updated, userId);
      setHistory(next);
      toast.success("Mock updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const duplicateToCurrent = (r: MockRecord) => {
    // Hydrate inputs from sections snapshot
    const next: Record<string, SectionInput> = { ...initial };
    r.sections.forEach((s) => {
      if (next[s.key]) {
        next[s.key] = {
          key: next[s.key].key,
          name: s.name,
          total: s.total ?? next[s.key].total,
          attempted: s.attempted ?? 0,
          correct: s.correct ?? 0,
          minutesSpent: s.minutesSpent,
        };
      }
    });
    setInputs(next);
    setMeta({
      label: `${r.label} (copy)`,
      mockDate: new Date().toISOString().slice(0, 10),
      source: r.source ?? "",
      mockType: r.mockType ?? "",
      difficulty: r.difficulty ?? "",
      tags: [...r.tags],
      notes: "",
    });
    toast.success("Loaded as new draft", { description: "Edit and save to record a new attempt." });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeRecord = async (id: string) => {
    try {
      const next = await deleteRecord(id, userId);
      setHistory(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const wipeHistory = async () => {
    try {
      const next = await clearHistory(userId);
      setHistory(next);
      toast.success("History cleared");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Clear failed");
    }
  };

  const update = (key: string, field: "attempted" | "correct", v: string) => {
    const num = Math.max(0, parseInt(v) || 0);
    setInputs((prev) => {
      const sec = { ...prev[key] };
      const max = sec.total;
      if (field === "attempted") sec.attempted = Math.min(num, max);
      else sec.correct = Math.min(num, sec.attempted);
      return { ...prev, [key]: sec };
    });
  };

  const updateMinutes = (key: string, v: string) => {
    const num = v === "" ? undefined : Math.max(0, Math.min(120, parseInt(v) || 0));
    setInputs((prev) => ({ ...prev, [key]: { ...prev[key], minutesSpent: num } }));
  };

  const reset = () => {
    setInputs(initial);
    setMeta(blankMeta);
  };

  const handleParsed = (report: ParseReport) => {
    setInputs((prev) => applyParsed(prev, report.data));
  };

  const fillSample = () => {
    setInputs({
      english: { key: "english", name: "English Language", total: 24, attempted: 22, correct: 18 },
      currentAffairs: { key: "currentAffairs", name: "Current Affairs & GK", total: 28, attempted: 26, correct: 14 },
      legal: { key: "legal", name: "Legal Reasoning", total: 32, attempted: 30, correct: 25 },
      logical: { key: "logical", name: "Logical Reasoning", total: 24, attempted: 16, correct: 13 },
      quant: { key: "quant", name: "Quantitative Techniques", total: 12, attempted: 6, correct: 4 },
    });
  };

  const radarData = analyses.map((a) => ({
    section: a.name.split(" ")[0],
    Accuracy: Math.round(a.accuracy),
    Attempt: Math.round(a.attemptRate),
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-14 text-brand-foreground">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-2 backdrop-blur">
                <Scale className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium uppercase tracking-widest opacity-90">
                CLAT Mock Analyser
              </span>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs backdrop-blur">
                  <Cloud className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{user.email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-1.5 text-brand-foreground hover:bg-white/15 hover:text-brand-foreground"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      toast.success("Signed out");
                    }}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="hidden items-center gap-1 text-xs opacity-80 sm:flex">
                    <CloudOff className="h-3.5 w-3.5" /> Local only
                  </span>
                  <AuthDialog />
                </>
              )}
            </div>
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
            Turn every mock into a sharper strategy.
          </h1>
          <p className="mt-3 max-w-2xl text-base opacity-90 md:text-lg">
            Enter your section-wise attempts and get an instant SWOT analysis,
            accuracy radar, and a projected percentile for CLAT.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={fillSample} className="gap-2">
              <Sparkles className="h-4 w-4" /> Try sample data
            </Button>
            <Button
              variant="ghost"
              onClick={reset}
              className="gap-2 text-brand-foreground hover:bg-white/10 hover:text-brand-foreground"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (t.attempted === 0) {
                  toast.error("Add some attempts before exporting.");
                  return;
                }
                exportReportPdf(analyses, swot, t, history);
                toast.success("Report exported as PDF");
              }}
              className="gap-2"
            >
              <FileDown className="h-4 w-4" /> Export PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <MockUpload onParsed={handleParsed} />

        {/* Section maximums (advanced) */}
        <SectionTotalsEditor
          totals={Object.fromEntries(CLAT_SECTIONS.map((s) => [s.key, inputs[s.key].total]))}
          onApply={(next) => {
            setInputs((prev) => {
              const out: Record<string, SectionInput> = { ...prev };
              CLAT_SECTIONS.forEach((s) => {
                const max = next[s.key] ?? prev[s.key].total;
                const sec = { ...prev[s.key], total: max };
                sec.attempted = Math.min(sec.attempted, max);
                sec.correct = Math.min(sec.correct, sec.attempted);
                out[s.key] = sec;
              });
              return out;
            });
            toast.success(`Section maximums updated · total ${CLAT_TOTAL_MARKS}`);
          }}
        />

        {/* Input grid */}
        <Card className="shadow-[var(--shadow-soft)]">
          <CardHeader>
            <CardTitle>Section-wise performance</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CLAT_SECTIONS.map((s) => {
              const a = analyses.find((x) => x.key === s.key)!;
              const max = inputs[s.key].total;
              return (
                <div
                  key={s.key}
                  className="rounded-xl border bg-card p-4 transition hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-semibold">{s.name}</h3>
                    <span className="text-xs text-muted-foreground">/ {max}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Attempted</Label>
                      <Input
                        type="number"
                        min={0}
                        max={max}
                        value={inputs[s.key].attempted || ""}
                        onChange={(e) => update(s.key, "attempted", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Correct</Label>
                      <Input
                        type="number"
                        min={0}
                        max={inputs[s.key].attempted}
                        value={inputs[s.key].correct || ""}
                        onChange={(e) => update(s.key, "correct", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Min spent</Label>
                      <Input
                        type="number"
                        min={0}
                        max={120}
                        placeholder="–"
                        value={inputs[s.key].minutesSpent ?? ""}
                        onChange={(e) => updateMinutes(s.key, e.target.value)}
                      />
                    </div>
                  </div>
                  {(() => {
                    const rec = timePlan.sections.find((p) => p.key === s.key);
                    const spent = inputs[s.key].minutesSpent;
                    if (spent == null || !rec) return null;
                    const diff = spent - rec.minutes;
                    const isOver = diff > rec.minutes * 0.2;
                    const isUnder = diff < -(rec.minutes * 0.15);
                    return (
                      <div className={`mt-1.5 flex items-center justify-between rounded px-2 py-1 text-[11px] ${
                        isOver
                          ? "bg-swot-weakness/10 text-swot-weakness"
                          : isUnder
                          ? "bg-swot-strength/10 text-swot-strength"
                          : "bg-muted/40 text-muted-foreground"
                      }`}>
                        <span>vs plan ({rec.minutes.toFixed(0)} min)</span>
                        <span className="font-semibold">
                          {diff > 0 ? `+${diff.toFixed(0)}m over` : diff < 0 ? `${diff.toFixed(0)}m under` : "on plan"}
                        </span>
                      </div>
                    );
                  })()}
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Net score</span>
                      <span className="font-medium text-foreground">{a.score.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accuracy</span>
                      <span className="font-medium text-foreground">{a.accuracy.toFixed(0)}%</span>
                    </div>
                    <Progress value={a.accuracy} className="h-1.5" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Cohort baseline selector */}
        <Card className="shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Mock cohort baseline
                </Label>
                <p className="mt-1 text-sm text-foreground">
                  Calibrate against a realistic pool. Top 3 NLU cutoff ≈{" "}
                  <span className="font-semibold text-brand">{TOP_COLLEGE_CUTOFF_MARKS} marks</span>{" "}
                  (~rank {TOP_COLLEGE_CUTOFF_RANK} in 75k).
                </p>
              </div>
              <Select
                value={String(cohortSize)}
                onValueChange={(v) => setCohortSize(parseInt(v))}
              >
                <SelectTrigger className="w-full sm:w-[260px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COHORT_PRESETS.map((c) => (
                    <SelectItem key={c.size} value={String(c.size)}>
                      {c.label} — {c.hint}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isBatch && (
              <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <Label htmlFor="topper" className="text-xs">
                    Highest marks in your batch (rank 1)
                  </Label>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Optional. We anchor your batch topper at rank 1 and place you relative to them.
                  </p>
                </div>
                <Input
                  id="topper"
                  type="number"
                  min={0}
                  max={120}
                  step={0.25}
                  placeholder="e.g. 92.75"
                  value={topperScore}
                  onChange={(e) =>
                    setTopperScore(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value)))
                  }
                  className="sm:w-[160px]"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Net score" value={`${t.score.toFixed(2)} / ${t.total}`} />
          <StatCard label="Overall accuracy" value={`${t.accuracy.toFixed(1)}%`} />
          <StatCard
            label={t.rankMode === "batch" ? "Rank in batch" : `Projected rank (${cohortSize.toLocaleString()})`}
            value={`#${t.rank.toLocaleString()}`}
            hint={
              t.rankMode === "batch"
                ? typeof topperScore === "number"
                  ? `Topper ${topperScore} → rank 1`
                  : "Add topper marks for batch rank"
                : `Top ${((t.rank / cohortSize) * 100).toFixed(2)}% of cohort`
            }
          />
          <StatCard
            label="Projected percentile"
            value={`${t.percentile}`}
            hint={
              t.rankMode === "batch"
                ? `In a ${cohortSize.toLocaleString()}-student batch`
                : t.score >= TOP_COLLEGE_CUTOFF_MARKS
                  ? "Top 3 NLU range ✓"
                  : `~${(TOP_COLLEGE_CUTOFF_MARKS - t.score).toFixed(2)} marks to top 3 (${TOP_COLLEGE_CUTOFF_MARKS})`
            }
            accent
          />
        </div>

        {/* Mock metadata + save */}
        <Card className="shadow-[var(--shadow-soft)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Save this mock
              <span className="text-xs font-normal text-muted-foreground">
                {userId ? "→ cloud" : "→ this device only"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="mock-label" className="text-xs">Label</Label>
              <Input
                id="mock-label"
                placeholder="e.g. CLAT Mock #5 — LegalEdge"
                value={meta.label}
                onChange={(e) => setMeta({ ...meta, label: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="mock-date" className="text-xs">Mock date</Label>
              <Input
                id="mock-date"
                type="date"
                value={meta.mockDate}
                onChange={(e) => setMeta({ ...meta, mockDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="mock-source" className="text-xs">Source / test series</Label>
              <Input
                id="mock-source"
                placeholder="LegalEdge, CL, IMS…"
                value={meta.source}
                onChange={(e) => setMeta({ ...meta, source: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select
                value={meta.mockType || undefined}
                onValueChange={(v) => setMeta({ ...meta, mockType: v as MockType })}
              >
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((tp) => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Difficulty</Label>
              <Select
                value={meta.difficulty || undefined}
                onValueChange={(v) => setMeta({ ...meta, difficulty: v as Difficulty })}
              >
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Tags</Label>
              <TagInput value={meta.tags} onChange={(v) => setMeta({ ...meta, tags: v })} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="mock-notes" className="text-xs">Notes</Label>
              <Textarea
                id="mock-notes"
                rows={3}
                placeholder="What went well? What to fix next time?"
                value={meta.notes}
                onChange={(e) => setMeta({ ...meta, notes: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                {userId
                  ? "Saved mocks sync across all your devices."
                  : "Sign in to back up your history to the cloud."}
              </p>
              <Button onClick={saveCurrent} disabled={t.attempted === 0} className="gap-2">
                <Cloud className="h-4 w-4" />
                Save mock
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-[var(--shadow-soft)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand" /> Accuracy vs Attempt radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis
                      dataKey="section"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Accuracy" dataKey="Accuracy" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.45} />
                    <Radar name="Attempt" dataKey="Attempt" stroke="var(--swot-opportunity)" fill="var(--swot-opportunity)" fillOpacity={0.2} />
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
            </CardContent>
          </Card>

          <SwotChart sections={analyses} />
        </div>

        <SwotQuadrants swot={swot} />

        <TimeManagementInsights sections={analyses} />

        {/* Mock history */}
        <MockHistory
          history={history}
          onDelete={removeRecord}
          onClear={wipeHistory}
          onEdit={editRecord}
          onDuplicate={duplicateToCurrent}
          isCloud={!!userId}
        />

        <PacingHistory history={history} />

        <MockComparison history={history} />
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Built for CLAT aspirants · Marking scheme +1 / −0.25
      </footer>
      <Toaster richColors position="top-right" />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div
      className="rounded-xl border bg-card p-5 shadow-[var(--shadow-soft)]"
      style={accent ? { background: "var(--gradient-hero)" } : undefined}
    >
      <div
        className={
          accent
            ? "text-xs font-medium uppercase tracking-wider text-brand-foreground/80"
            : "text-xs font-medium uppercase tracking-wider text-muted-foreground"
        }
      >
        {label}
      </div>
      <div
        className={
          accent
            ? "mt-1 text-2xl font-bold text-brand-foreground"
            : "mt-1 text-2xl font-bold text-foreground"
        }
      >
        {value}
      </div>
      {hint && (
        <div
          className={
            accent
              ? "mt-1 text-[11px] text-brand-foreground/80"
              : "mt-1 text-[11px] text-muted-foreground"
          }
        >
          {hint}
        </div>
      )}
    </div>
  );
}
