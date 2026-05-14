import type { SectionAnalysis } from "./clat-analyser";
import { supabase } from "@/integrations/supabase/client";

export type MockType = "Full" | "Sectional" | "Revision" | "Surprise";
export type Difficulty = "Easy" | "Medium" | "Hard" | "Brutal";

export interface MockRecord {
  id: string;
  label: string;
  date: string; // ISO created
  mockDate: string; // YYYY-MM-DD
  score: number;
  total: number;
  accuracy: number;
  attempted: number;
  percentile: number;
  rank?: number;
  cohortSize?: number;
  rankMode?: "national" | "batch";
  sections: { key: string; name: string; score: number; accuracy: number; attempted?: number; correct?: number; total?: number }[];
  source?: string;
  mockType?: MockType;
  difficulty?: Difficulty;
  tags: string[];
  notes?: string;
}

const KEY = "clat-mock-history-v2";
const LEGACY_KEY = "clat-mock-history-v1";

// ---------- Local (anonymous) storage ----------
function readLocal(): MockRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockRecord[];
      return Array.isArray(parsed) ? parsed.map(normalize) : [];
    }
    // migrate v1
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const arr = JSON.parse(legacy) as MockRecord[];
      const migrated = (Array.isArray(arr) ? arr : []).map(normalize);
      localStorage.setItem(KEY, JSON.stringify(migrated));
      return migrated;
    }
    return [];
  } catch {
    return [];
  }
}

function writeLocal(history: MockRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(history));
}

function normalize(r: Partial<MockRecord>): MockRecord {
  return {
    id: r.id ?? crypto.randomUUID(),
    label: r.label ?? "Untitled mock",
    date: r.date ?? new Date().toISOString(),
    mockDate: r.mockDate ?? (r.date ? r.date.slice(0, 10) : new Date().toISOString().slice(0, 10)),
    score: r.score ?? 0,
    total: r.total ?? 120,
    accuracy: r.accuracy ?? 0,
    attempted: r.attempted ?? 0,
    percentile: r.percentile ?? 0,
    rank: r.rank,
    cohortSize: r.cohortSize,
    rankMode: r.rankMode,
    sections: r.sections ?? [],
    source: r.source,
    mockType: r.mockType,
    difficulty: r.difficulty,
    tags: r.tags ?? [],
    notes: r.notes,
  };
}

// ---------- Cloud (Supabase) storage ----------
type Row = {
  id: string;
  label: string;
  score: number;
  total: number;
  accuracy: number;
  percentile: number;
  rank: number | null;
  rank_mode: string | null;
  cohort_size: number | null;
  sections: unknown;
  mock_date: string;
  source: string | null;
  mock_type: string | null;
  difficulty: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
};

function fromRow(r: Row): MockRecord {
  return normalize({
    id: r.id,
    label: r.label,
    date: r.created_at,
    mockDate: r.mock_date,
    score: Number(r.score),
    total: r.total,
    accuracy: Number(r.accuracy),
    percentile: Number(r.percentile),
    rank: r.rank ?? undefined,
    rankMode: (r.rank_mode as "national" | "batch") ?? undefined,
    cohortSize: r.cohort_size ?? undefined,
    sections: (r.sections as MockRecord["sections"]) ?? [],
    source: r.source ?? undefined,
    mockType: (r.mock_type as MockType) ?? undefined,
    difficulty: (r.difficulty as Difficulty) ?? undefined,
    tags: r.tags ?? [],
    notes: r.notes ?? undefined,
    attempted: ((r.sections as MockRecord["sections"]) ?? []).reduce((a, s) => a + (s.attempted ?? 0), 0),
  });
}

function toUpsert(r: MockRecord, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    label: r.label,
    score: r.score,
    total: r.total,
    accuracy: r.accuracy,
    percentile: r.percentile,
    rank: r.rank ?? null,
    rank_mode: r.rankMode ?? null,
    cohort_size: r.cohortSize ?? null,
    sections: r.sections,
    mock_date: r.mockDate,
    source: r.source ?? null,
    mock_type: r.mockType ?? null,
    difficulty: r.difficulty ?? null,
    tags: r.tags ?? [],
    notes: r.notes ?? null,
  };
}

// ---------- Public API ----------
export async function loadHistory(userId: string | null): Promise<MockRecord[]> {
  if (!userId) return readLocal();
  const { data, error } = await supabase
    .from("mocks")
    .select("*")
    .order("mock_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("loadHistory cloud", error);
    return readLocal();
  }
  return (data as Row[]).map(fromRow);
}

export async function upsertRecord(record: MockRecord, userId: string | null): Promise<MockRecord[]> {
  if (!userId) {
    const list = readLocal().filter((r) => r.id !== record.id);
    const next = [...list, record].sort((a, b) => a.mockDate.localeCompare(b.mockDate));
    writeLocal(next);
    return next;
  }
  const { error } = await supabase.from("mocks").upsert(toUpsert(record, userId));
  if (error) throw error;
  return loadHistory(userId);
}

export async function deleteRecord(id: string, userId: string | null): Promise<MockRecord[]> {
  if (!userId) {
    const next = readLocal().filter((r) => r.id !== id);
    writeLocal(next);
    return next;
  }
  const { error } = await supabase.from("mocks").delete().eq("id", id);
  if (error) throw error;
  return loadHistory(userId);
}

export async function clearHistory(userId: string | null): Promise<MockRecord[]> {
  if (!userId) {
    writeLocal([]);
    return [];
  }
  const { error } = await supabase.from("mocks").delete().eq("user_id", userId);
  if (error) throw error;
  return [];
}

/** Push all locally-stored records to the cloud for the given user. Returns count imported. */
export async function importLocalToCloud(userId: string): Promise<number> {
  const local = readLocal();
  if (!local.length) return 0;
  const rows = local.map((r) => toUpsert(r, userId));
  const { error } = await supabase.from("mocks").upsert(rows);
  if (error) throw error;
  // keep local as backup but mark migrated by clearing
  writeLocal([]);
  return rows.length;
}

export function buildRecord(
  label: string,
  analyses: SectionAnalysis[],
  totals: {
    score: number;
    total: number;
    accuracy: number;
    attempted: number;
    percentile: number;
    rank?: number;
    cohortSize?: number;
    rankMode?: "national" | "batch";
  },
  meta: Partial<Pick<MockRecord, "mockDate" | "source" | "mockType" | "difficulty" | "tags" | "notes">> = {},
  existingId?: string,
): MockRecord {
  return normalize({
    id: existingId ?? crypto.randomUUID(),
    label: label.trim() || `Mock ${new Date().toLocaleDateString()}`,
    date: new Date().toISOString(),
    mockDate: meta.mockDate ?? new Date().toISOString().slice(0, 10),
    score: +totals.score.toFixed(2),
    total: totals.total,
    accuracy: +totals.accuracy.toFixed(1),
    attempted: totals.attempted,
    percentile: totals.percentile,
    rank: totals.rank,
    cohortSize: totals.cohortSize,
    rankMode: totals.rankMode,
    sections: analyses.map((a) => ({
      key: a.key,
      name: a.name,
      score: +a.score.toFixed(2),
      accuracy: +a.accuracy.toFixed(1),
      attempted: a.attempted,
      correct: a.correct,
      total: a.total,
    })),
    source: meta.source,
    mockType: meta.mockType,
    difficulty: meta.difficulty,
    tags: meta.tags ?? [],
    notes: meta.notes,
  });
}
