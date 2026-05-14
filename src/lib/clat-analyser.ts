export type SectionKey =
  | "english"
  | "legal"
  | "logical"
  | "currentAffairs"
  | "quant";

export interface SectionInput {
  key: SectionKey;
  name: string;
  attempted: number;
  correct: number;
  total: number;
}

export interface SectionAnalysis extends SectionInput {
  incorrect: number;
  score: number; // CLAT marking: +1 / -0.25
  accuracy: number; // %
  attemptRate: number; // %
  netRate: number; // score / total
}

export interface SwotResult {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export const CLAT_TOTAL_MARKS = 120;

export const CLAT_SECTIONS: { key: SectionKey; name: string; total: number }[] = [
  { key: "english", name: "English Language", total: 24 },
  { key: "currentAffairs", name: "Current Affairs & GK", total: 28 },
  { key: "legal", name: "Legal Reasoning", total: 32 },
  { key: "logical", name: "Logical Reasoning", total: 24 },
  { key: "quant", name: "Quantitative Techniques", total: 12 },
];

export function analyseSection(s: SectionInput): SectionAnalysis {
  const incorrect = Math.max(0, s.attempted - s.correct);
  const score = s.correct - incorrect * 0.25;
  const accuracy = s.attempted ? (s.correct / s.attempted) * 100 : 0;
  const attemptRate = s.total ? (s.attempted / s.total) * 100 : 0;
  const netRate = s.total ? (score / s.total) * 100 : 0;
  return { ...s, incorrect, score, accuracy, attemptRate, netRate };
}

export function buildSwot(
  sections: SectionAnalysis[],
  ctx: { totalScore?: number; cutoffMarks?: number } = {},
): SwotResult {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  const totalScore = ctx.totalScore ?? sections.reduce((a, s) => a + s.score, 0);
  const cutoff = ctx.cutoffMarks ?? TOP_COLLEGE_CUTOFF_MARKS;
  const totalNeg = sections.reduce((a, s) => a + s.incorrect * 0.25, 0);
  const totalWrong = sections.reduce((a, s) => a + s.incorrect, 0);
  const attemptedSecs = sections.filter((s) => s.attempted > 0);
  const sorted = [...sections].sort((a, b) => b.netRate - a.netRate);
  const best = sorted[0];
  const worst = [...attemptedSecs].sort((a, b) => a.netRate - b.netRate)[0];
  const gap = cutoff - totalScore;

  // Anchor section call-out
  if (best && best.attempted > 0 && best.netRate >= 50) {
    strengths.push(
      `Anchor section — ${best.name}: ${best.score.toFixed(2)}/${best.total} at ${best.accuracy.toFixed(0)}% accuracy. Build your time strategy around finishing this first.`,
    );
  }

  sections.forEach((s) => {
    if (s.attempted === 0) return;
    const negLost = s.incorrect * 0.25;

    if (s.accuracy >= 85 && s.attemptRate >= 75) {
      strengths.push(
        `${s.name}: elite control (${s.correct}/${s.attempted}, ${s.accuracy.toFixed(0)}%). Negatives only -${negLost.toFixed(2)} — don't over-think; trust your first instinct.`,
      );
    } else if (s.accuracy >= 75 && s.attemptRate >= 70 && s !== best) {
      strengths.push(
        `${s.name}: reliable scorer at ${s.score.toFixed(2)} net. Filter is working — keep skipping the trap questions.`,
      );
    }

    if (s.accuracy < 50 && s.attempted >= Math.ceil(s.total * 0.4)) {
      weaknesses.push(
        `${s.name}: concept gap — ${s.correct}/${s.attempted} correct (${s.accuracy.toFixed(0)}%). Pause new attempts; revise theory + redo last 2 mocks of this section before next attempt.`,
      );
    }
    if (s.netRate < 30 && s.attempted > 0) {
      weaknesses.push(
        `${s.name}: net ${s.score.toFixed(2)}/${s.total} (${s.netRate.toFixed(0)}%). This is the single biggest score drag in the mock.`,
      );
    }
    if (s.attemptRate < 45 && s.accuracy >= 60) {
      const potential = (s.total - s.attempted) * (s.accuracy / 100);
      weaknesses.push(
        `${s.name}: under-attempted (${s.attempted}/${s.total}) despite ${s.accuracy.toFixed(0)}% accuracy — ~${potential.toFixed(1)} marks left untouched. Likely a time-management leak.`,
      );
    }

    if (s.attemptRate < 70 && s.accuracy >= 70) {
      const potential = (s.total - s.attempted) * (s.accuracy / 100);
      opportunities.push(
        `${s.name}: push attempts to 90%+ — adds ~${potential.toFixed(1)} marks at your current accuracy.`,
      );
    }
    if (s.attemptRate >= 75 && s.accuracy >= 55 && s.accuracy < 75) {
      const polish = s.attempted * 0.1;
      opportunities.push(
        `${s.name}: accuracy polish — a 10-pt lift (drill targeted question types) adds ~${polish.toFixed(1)} marks with zero extra attempts.`,
      );
    }

    if (s.attemptRate >= 75 && s.accuracy < 60) {
      threats.push(
        `${s.name}: over-attempting at ${s.accuracy.toFixed(0)}% — bleeding -${negLost.toFixed(2)} to negatives. Drop your weakest 4-5 question types from the attempt pool.`,
      );
    }
    if (s.incorrect >= 8) {
      threats.push(
        `${s.name}: ${s.incorrect} wrongs (-${negLost.toFixed(2)}). High-volume errors compound — fix elimination logic before next mock.`,
      );
    }
  });

  // Cutoff gap framing
  if (gap > 0.01) {
    const candidates = sections
      .filter((s) => s.attempted < s.total && s.accuracy >= 55)
      .map((s) => ({ s, room: (s.total - s.attempted) * (s.accuracy / 100) }))
      .sort((a, b) => b.room - a.room)
      .slice(0, 2);
    if (candidates.length) {
      const txt = candidates.map((c) => `${c.s.name} (+${c.room.toFixed(1)})`).join(", ");
      opportunities.push(
        `Top 3 NLU cutoff is ${cutoff}. You're ${gap.toFixed(2)} marks short — most realistic recovery: ${txt}.`,
      );
    } else {
      opportunities.push(
        `Top 3 NLU cutoff is ${cutoff}. You're ${gap.toFixed(2)} short — every section needs a small lift, no single bailout.`,
      );
    }
  } else {
    strengths.push(
      `You're already ${(-gap).toFixed(2)} marks past the top 3 NLU benchmark (${cutoff}). Goal now: convert this once into consistency over 3+ mocks.`,
    );
  }

  // Total negative bleed
  if (totalNeg >= 4) {
    threats.push(
      `Total negative bleed: -${totalNeg.toFixed(2)} across ${totalWrong} wrongs. Cutting this by 25% lifts your net by +${(totalNeg * 0.25).toFixed(2)}.`,
    );
  }

  // Variance / lopsided performance
  const rates = attemptedSecs.map((s) => s.netRate);
  if (rates.length >= 3 && best && worst && best !== worst) {
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const std = Math.sqrt(rates.reduce((a, b) => a + (b - mean) ** 2, 0) / rates.length);
    if (std >= 20) {
      threats.push(
        `Lopsided sheet — net-rate spread of ${std.toFixed(0)} pts (best ${best.name} ${best.netRate.toFixed(0)}% vs weakest ${worst.name} ${worst.netRate.toFixed(0)}%). One bad section in the real exam can sink your rank.`,
      );
    }
  }

  // Skip-discipline observation (unattempted but high section weight)
  const bigUnattempted = sections
    .filter((s) => s.total >= 24 && s.attempted < s.total * 0.5)
    .sort((a, b) => b.total - a.total)[0];
  if (bigUnattempted) {
    opportunities.push(
      `${bigUnattempted.name} is a ${bigUnattempted.total}-mark section but you only attempted ${bigUnattempted.attempted}. Allocating 5 more minutes here usually outperforms accuracy drills.`,
    );
  }

  if (!strengths.length)
    strengths.push("No section crossed the 75% accuracy benchmark yet — your first priority is building one reliable anchor section.");
  if (!weaknesses.length)
    weaknesses.push("No critical weakness — focus on widening the gap from cutoff rather than damage control.");
  if (!opportunities.length)
    opportunities.push("Attempt rates are healthy — sharpen elimination and timing instead of raw volume.");
  if (!threats.length)
    threats.push("Negative marking under control. Lock in this attempt discipline across the next 3 mocks.");

  return { strengths, weaknesses, opportunities, threats };
}

// Real CLAT 2024 anchor points (rank within 75,000 candidates).
export const BASELINE_COHORT = 75000;
export const RANK_ANCHORS: { score: number; rank: number }[] = [
  { score: 112.75, rank: 1 },
  { score: 102, rank: 102 },
  { score: 96, rank: 625 },
  { score: 86, rank: 2106 },
  { score: 75, rank: 7076 },
  { score: 64.5, rank: 14300 },
  { score: 58.75, rank: 20000 },
];

// Derived percentile anchors (kept for backwards compatibility)
export const PERCENTILE_ANCHORS = RANK_ANCHORS.map((a) => ({
  score: a.score,
  percentile: +(((1 - (a.rank - 0.5) / BASELINE_COHORT) * 100).toFixed(4)),
}));

// Cutoff for top 3 NLUs (NLSIU, NALSAR, NUJS) anchored to raw marks
export const TOP_COLLEGE_CUTOFF_MARKS = 98.75;

export type CohortKind = "batch" | "national";
export const COHORT_PRESETS: {
  label: string;
  size: number;
  hint: string;
  kind: CohortKind;
}[] = [
  { label: "Small batch (1k)", size: 1000, hint: "Coaching weekly mock", kind: "batch" },
  { label: "Mid batch (10k)", size: 10000, hint: "Major series", kind: "batch" },
  { label: "National (30k)", size: 30000, hint: "All-India test", kind: "national" },
  { label: "CLAT-scale (60k)", size: 60000, hint: "Close to actual CLAT", kind: "national" },
  { label: "CLAT 2024 (75k)", size: 75000, hint: "Actual exam size", kind: "national" },
];

// Acklam's inverse normal CDF approximation
function probit(p: number): number {
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425, ph = 1 - pl;
  let q: number, r: number;
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
  if (p <= ph) { q = p - 0.5; r = q*q; return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1); }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
}

// Standard normal CDF via erf approximation
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}

// Continuous national percentile (against 75k CLAT distribution) using probit interpolation
function nationalZ(score: number): number {
  const anchors = [...PERCENTILE_ANCHORS].sort((a, b) => a.score - b.score);
  const zs = anchors.map((a) => ({ score: a.score, z: probit(a.percentile / 100) }));
  if (score <= zs[0].score) {
    const slope = zs[0].z / Math.max(zs[0].score, 1);
    return slope * score;
  }
  if (score >= zs[zs.length - 1].score) {
    const a = zs[zs.length - 2], b = zs[zs.length - 1];
    const slope = (b.z - a.z) / (b.score - a.score);
    return b.z + slope * (score - b.score);
  }
  for (let i = 0; i < zs.length - 1; i++) {
    const a = zs[i], b = zs[i + 1];
    if (score >= a.score && score <= b.score) {
      const t = (score - a.score) / (b.score - a.score);
      return a.z + t * (b.z - a.z);
    }
  }
  return zs[zs.length - 1].z;
}

export function nationalPercentile(score: number): number {
  return Math.min(99.9999, Math.max(0, normalCdf(nationalZ(score)) * 100));
}

// Continuous national rank (against 75k); can be fractional for math, round for display.
export function nationalRank(score: number): number {
  const p = nationalPercentile(score) / 100;
  return Math.max(1, (1 - p) * BASELINE_COHORT + 0.5);
}

// Derived percentile equivalent of the marks-based top 3 NLU cutoff (~98.75 marks).
export const TOP_COLLEGE_CUTOFF = +nationalPercentile(TOP_COLLEGE_CUTOFF_MARKS).toFixed(2);
export const TOP_COLLEGE_CUTOFF_RANK = Math.round(nationalRank(TOP_COLLEGE_CUTOFF_MARKS));

export interface PercentileOptions {
  cohortSize: number;
  /** For small batches: the topper's raw score in your batch (rank 1). */
  topperScore?: number;
  kind?: CohortKind;
}

export interface RankResult {
  percentile: number;
  rank: number;
  /** "national" if mapped against CLAT 75k pool, "batch" if topper-anchored. */
  mode: "national" | "batch";
}

export function computeRankAndPercentile(
  score: number,
  opts: PercentileOptions,
): RankResult {
  const { cohortSize, topperScore, kind } = opts;
  const batchMode = kind === "batch" && topperScore !== undefined && topperScore > 0;

  if (batchMode) {
    // Anchor topper at rank 1; spread the rest of the batch using the
    // gap between user and topper on the national rank scale.
    const topperRank = nationalRank(topperScore);
    const userRank = nationalRank(score);
    const denom = Math.max(1, BASELINE_COHORT - topperRank);
    const fraction = Math.min(1, Math.max(0, (userRank - topperRank) / denom));
    const rank = Math.min(cohortSize, Math.max(1, Math.round(fraction * (cohortSize - 1) + 1)));
    const percentile = +(((1 - (rank - 0.5) / cohortSize) * 100).toFixed(2));
    return { rank, percentile, mode: "batch" };
  }

  // National mode: scale the 75k rank curve to the chosen cohort size.
  const p = nationalPercentile(score);
  const maxP = (1 - 0.5 / cohortSize) * 100;
  const cappedP = Math.min(p, maxP);
  const rank = Math.min(cohortSize, Math.max(1, Math.round((1 - cappedP / 100) * cohortSize + 0.5)));
  const percentile = +(((1 - (rank - 0.5) / cohortSize) * 100).toFixed(2));
  return { rank, percentile, mode: "national" };
}

// Backwards-compatible: percentile only.
export function computePercentile(score: number, cohortSize: number = 60000): number {
  return computeRankAndPercentile(score, { cohortSize, kind: "national" }).percentile;
}

// Inverse: estimated raw score required to hit a target percentile (national curve).
export function scoreForPercentile(targetPercentile: number, _cohortSize: number = BASELINE_COHORT): number {
  const p = Math.min(99.999, Math.max(0.001, targetPercentile)) / 100;
  const targetZ = probit(p);
  const anchors = [...PERCENTILE_ANCHORS].sort((a, b) => a.score - b.score);
  const zs = anchors.map((a) => ({ score: a.score, z: probit(a.percentile / 100) }));
  if (targetZ <= zs[0].z) {
    const slope = zs[0].z / Math.max(zs[0].score, 1);
    return slope === 0 ? 0 : targetZ / slope;
  }
  if (targetZ >= zs[zs.length - 1].z) {
    const a = zs[zs.length - 2], b = zs[zs.length - 1];
    const slope = (b.z - a.z) / (b.score - a.score);
    return b.score + (targetZ - b.z) / slope;
  }
  for (let i = 0; i < zs.length - 1; i++) {
    const a = zs[i], b = zs[i + 1];
    if (targetZ >= a.z && targetZ <= b.z) {
      const t = (targetZ - a.z) / (b.z - a.z);
      return a.score + t * (b.score - a.score);
    }
  }
  return zs[zs.length - 1].score;
}

export function totals(
  sections: SectionAnalysis[],
  cohortSize: number = BASELINE_COHORT,
  opts: { topperScore?: number; kind?: CohortKind } = {},
) {
  const score = sections.reduce((a, s) => a + s.score, 0);
  const total = sections.reduce((a, s) => a + s.total, 0);
  const correct = sections.reduce((a, s) => a + s.correct, 0);
  const attempted = sections.reduce((a, s) => a + s.attempted, 0);
  const accuracy = attempted ? (correct / attempted) * 100 : 0;
  const pct = (score / 120) * 100;
  const rp = computeRankAndPercentile(score, {
    cohortSize,
    topperScore: opts.topperScore,
    kind: opts.kind ?? "national",
  });
  return {
    score,
    total,
    correct,
    attempted,
    accuracy,
    pct,
    percentile: rp.percentile,
    rank: rp.rank,
    rankMode: rp.mode,
    cohortSize,
  };
}

