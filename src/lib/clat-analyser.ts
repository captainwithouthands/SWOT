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
  /** Minutes actually spent on this section during the mock (optional debrief field). */
  minutesSpent?: number;
  /** Deep analysis: per question-type wrong count. Key = QuestionType.key. */
  questionTypeBreakdown?: Record<string, number>;
  /** How difficult the user found this section today. */
  perceivedDifficulty?: "Easy" | "Medium" | "Hard";
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

/** CLAT 2024+ question-type taxonomy, keyed by section. */
export const QUESTION_TYPES: Record<SectionKey, { key: string; label: string; drillAdvice: string }[]> = {
  english: [
    { key: "inference", label: "Inference / Conclusion", drillAdvice: "Stay within the passage. Wrong inferences usually import outside knowledge — only use what's explicitly written." },
    { key: "main_idea", label: "Main idea / Central theme", drillAdvice: "Read first and last sentences of each paragraph first. The central theme is almost always explicitly stated." },
    { key: "vocab_context", label: "Vocabulary in context", drillAdvice: "Use elimination. Substitute each option and ask 'does this preserve the author's meaning?' Not dictionary definitions." },
    { key: "tone_attitude", label: "Author's tone / Attitude", drillAdvice: "Look for emotionally loaded words (adjectives, adverbs). The tone must match ALL charged words in the passage, not just one." },
    { key: "fill_blank", label: "Fill in the blank", drillAdvice: "Check grammatical clues (connectors like 'however/therefore', singular/plural agreement) before reading the options." },
    { key: "grammar", label: "Grammar / Usage", drillAdvice: "Focus on subject-verb agreement, pronoun reference, and misplaced modifiers — these three cover 80% of CLAT grammar questions." },
    { key: "title_heading", label: "Title / Heading", drillAdvice: "The title must capture the ENTIRE passage, not just one paragraph. Eliminate options that are too narrow or too broad." },
    { key: "summary", label: "Summary / Para completion", drillAdvice: "A valid summary must include the main claim and key support. If it contradicts any part of the passage, eliminate it." },
  ],
  currentAffairs: [
    { key: "static_gk", label: "Static GK (Constitution / Polity)", drillAdvice: "Revise constitutional articles weekly. Articles 12–35 (FRs), 36–51 (DPSPs), and all Schedules are the most tested areas." },
    { key: "current_news", label: "Current Affairs (News-based)", drillAdvice: "Read Hindu/IE editorials for the 6 months before the exam. Focus on policy decisions and court rulings, not event dates." },
    { key: "legal_gk", label: "Legal GK (Acts / Landmark Cases)", drillAdvice: "Know year + key holding of: Kesavananda Bharati, Maneka Gandhi, Vishaka, Indra Sawhney, and the 5 latest landmark cases." },
    { key: "science_tech", label: "Science & Technology", drillAdvice: "Follow PIB for space (ISRO), defence, and health-tech announcements. CLAT tests applications, not deep science." },
    { key: "intl_affairs", label: "International Affairs", drillAdvice: "Track UN resolutions, G20/SCO outcomes, and bilateral agreements India signed in the past year." },
    { key: "govt_schemes", label: "Govt Schemes / Policies", drillAdvice: "Revise PM-launched flagship schemes with their objectives and target years — not just the names." },
    { key: "sports_awards", label: "Sports / Awards / Appointments", drillAdvice: "Use a monthly current affairs PDF. This sub-type rewards consistent revision — it cannot be crammed last-minute." },
  ],
  legal: [
    { key: "principle_fact", label: "Principle–Fact application", drillAdvice: "Read the principle twice before the facts. Identify: what legal rule is triggered? Then apply it mechanically — no moral reasoning." },
    { key: "principle_id", label: "Principle identification", drillAdvice: "Ask 'what is the law protecting here?' The answer is usually one of: property, consent, bodily autonomy, or reasonable reliance." },
    { key: "legal_maxim", label: "Legal maxims / Latin terms", drillAdvice: "Memorise top 20 CLAT maxims with one real case example each. Recognition beats rote translation." },
    { key: "contract", label: "Contract law", drillAdvice: "Core: offer-acceptance-consideration, void vs voidable, mistake, misrepresentation. Apply ICA 1872 mentally while reading." },
    { key: "tort", label: "Tort law", drillAdvice: "Revise: negligence (duty-breach-damage), nuisance, strict liability (Rylands v Fletcher), defamation. CLAT rarely goes beyond these five." },
    { key: "criminal", label: "Criminal law (IPC / BNS)", drillAdvice: "Focus on mens rea vs actus reus, ss. 299–300 (murder/culpable homicide), ss. 378–391 (theft), and general exceptions ss. 76–106." },
    { key: "constitutional", label: "Constitutional law", drillAdvice: "CLAT tests application of FRs + DPSPs. For every Q: identify the right, who's violating it, then apply the reasonable-restriction test." },
    { key: "family_property", label: "Family / Property law", drillAdvice: "Know Hindu Succession Act basics, Muslim personal law essentials, and Transfer of Property Act key sections — frequently in mixed passages." },
    { key: "intl_law", label: "International law", drillAdvice: "Focus on: UN Charter, sovereignty principles, pacta sunt servanda, and recent ICJ cases involving India." },
  ],
  logical: [
    { key: "strengthen_weaken", label: "Strengthen / Weaken argument", drillAdvice: "Map the conclusion before reading options. A strengthener adds evidence FOR the conclusion; a weakener attacks the underlying assumption." },
    { key: "assumption", label: "Assumption identification", drillAdvice: "Use the negation test: negate the option. If the argument collapses, that's the assumption." },
    { key: "inference_draw", label: "Inference drawing", drillAdvice: "A valid inference must be 100% supported by the passage. If it's only 'likely', it fails the test." },
    { key: "cause_effect", label: "Cause-effect analysis", drillAdvice: "True causation requires: A precedes B, A is necessary for B, and no confounding factor explains B. Check all three." },
    { key: "flaw_identify", label: "Flaw / Error identification", drillAdvice: "Name the flaw type first: ad hominem, hasty generalisation, false analogy, circular reasoning. Once named, match it to options." },
    { key: "analogy", label: "Analogy / Parallel reasoning", drillAdvice: "Find the logical structure (A:B as C:D). Match the relationship, not the domain or content." },
    { key: "sequence", label: "Logical sequence / Arrangement", drillAdvice: "Find the anchor — the statement that can only go first or last. Build outward from there, not from the middle." },
    { key: "syllogism", label: "Syllogism / Statement-conclusion", drillAdvice: "Use Venn diagrams for All-Some-No questions. Never assume what's not explicitly stated." },
  ],
  quant: [
    { key: "data_interp", label: "Data Interpretation (tables / charts)", drillAdvice: "Approximate first (round to 2 significant figures). CLAT DI options are spaced enough that approximation finds the right answer." },
    { key: "percentage", label: "Percentage / Ratio / Proportion", drillAdvice: "Convert to fractions immediately. 37.5% = 3/8. Mental fraction arithmetic is 3× faster than percentage-based calculation." },
    { key: "time_speed", label: "Time–Speed–Distance / Work", drillAdvice: "Use the unitary method. Establish base rate first, then scale. Relative speed = sum (opposite) or difference (same direction)." },
    { key: "profit_loss", label: "Profit–Loss / SI & CI", drillAdvice: "For P&L, set cost price = 100. For successive discounts, multiply fractions — never add percentages." },
    { key: "number_series", label: "Number series / Patterns", drillAdvice: "Check differences, ratios, squares, and cubes in that order. Most CLAT series follow exactly one of these four patterns." },
    { key: "geometry", label: "Geometry / Mensuration", drillAdvice: "Memorise area and volume formulas cold. CLAT tests: circles, triangles (Heron's formula), and cylinders most often." },
    { key: "averages", label: "Averages / Mixtures / Alligation", drillAdvice: "For alligation: draw the cross-multiply diagram. For weighted averages: sum of (weight × value) ÷ total weight." },
    { key: "sets_logic", label: "Sets / Venn diagrams / Probability", drillAdvice: "Always draw the Venn diagram — never solve mentally. Label all regions including the 'outside' region." },
  ],
};

/** Question types that are foundational / should-not-miss per section. */
const EASY_TYPES: Partial<Record<SectionKey, string[]>> = {
  english: ["vocab_context", "fill_blank", "grammar"],
  currentAffairs: ["static_gk", "sports_awards"],
  legal: ["legal_maxim", "contract"],
  logical: ["syllogism", "sequence"],
  quant: ["percentage", "profit_loss"],
};

/** Question types that are genuinely hard and 0-wrong is a real strength. */
const HARD_TYPES: Partial<Record<SectionKey, string[]>> = {
  english: ["inference", "tone_attitude", "summary"],
  currentAffairs: ["legal_gk", "intl_affairs"],
  legal: ["principle_fact", "constitutional", "intl_law"],
  logical: ["strengthen_weaken", "assumption", "flaw_identify"],
  quant: ["data_interp", "time_speed", "geometry"],
};

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
  ctx: {
    totalScore?: number;
    cutoffMarks?: number;
    /** Recommended minutes per section key (from buildTimePlan) — enables time debrief bullets. */
    recommendedMinutes?: Record<string, number>;
  } = {},
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

  // Time-based debrief (only when minutesSpent data is provided)
  if (ctx.recommendedMinutes) {
    const recMin = ctx.recommendedMinutes;
    const timedSections = sections.filter((s) => s.minutesSpent != null && recMin[s.key]);
    timedSections.forEach((s) => {
      const spent = s.minutesSpent!;
      const rec = recMin[s.key];
      const ratio = spent / rec;
      const overBy = +(spent - rec).toFixed(0);

      if (ratio > 1.25 && s.accuracy < 65 && s.attempted > 0) {
        weaknesses.push(
          `${s.name}: time-accuracy double loss — ${spent} min used vs ${rec.toFixed(0)} min recommended (+${overBy} min) at only ${s.accuracy.toFixed(0)}% accuracy. Slow and inaccurate is the costliest pattern in CLAT.`,
        );
      } else if (ratio > 1.25 && s.accuracy >= 65 && s.attempted > 0) {
        threats.push(
          `${s.name}: pacing drag — ${spent} min vs ${rec.toFixed(0)} min recommended (+${overBy} min over). You're accurate but too slow; this starves time from other sections.`,
        );
      } else if (ratio < 0.82 && s.accuracy >= 75 && s.attempted > 0) {
        strengths.push(
          `${s.name}: time-efficient — finished in ${spent} min vs ${rec.toFixed(0)} min planned. Healthy surplus; consider redirecting saved time toward weaker sections.`,
        );
      }

      if (ratio < 0.85 && s.attemptRate < 70 && s.attempted > 0) {
        opportunities.push(
          `${s.name}: finished ${(rec - spent).toFixed(0)} min early but left ${s.total - s.attempted} questions unattempted — reinvest that saved time for more attempts.`,
        );
      }
    });

    if (timedSections.length >= 3) {
      const totalSpent = timedSections.reduce((a, s) => a + (s.minutesSpent ?? 0), 0);
      const totalRec = timedSections.reduce((a, s) => a + (recMin[s.key] ?? 0), 0);
      const overallOver = +(totalSpent - totalRec).toFixed(0);
      if (overallOver >= 8) {
        threats.push(
          `Overall pacing: ${totalSpent} min used across ${timedSections.length} sections vs ${totalRec.toFixed(0)} min planned (+${overallOver} min). In a real exam this eats into your OMR buffer — work on cut-offs per section.`,
        );
      }
    }
  }

  // Question-type deep analysis (only when breakdown data is present)
  sections.forEach((s) => {
    const bd = s.questionTypeBreakdown;
    if (!bd) return;
    const types = QUESTION_TYPES[s.key];
    if (!types) return;

    const withWrongs = types
      .map((t) => ({ ...t, wrongs: bd[t.key] ?? 0 }))
      .filter((t) => t.wrongs > 0)
      .sort((a, b) => b.wrongs - a.wrongs);

    if (!withWrongs.length) {
      // Zero wrongs on ALL types → noteworthy strength
      if (s.attempted > 0)
        strengths.push(
          `${s.name} — deep analysis: zero errors recorded across all question types. Exceptional consistency; protect this by reviewing technique before each mock.`,
        );
      return;
    }

    // Pinpoint weaknesses: top 1-2 types with ≥2 wrongs
    withWrongs
      .filter((t) => t.wrongs >= 2)
      .slice(0, 2)
      .forEach((t) => {
        weaknesses.push(
          `${s.name} → ${t.label} (${t.wrongs} wrong): ${t.drillAdvice}`,
        );
      });

    // Concentration check: single type dominates wrongs
    const totalWrongsInSection = withWrongs.reduce((a, t) => a + t.wrongs, 0);
    const top = withWrongs[0];
    if (withWrongs.length > 1 && top.wrongs / totalWrongsInSection >= 0.6 && top.wrongs >= 3) {
      threats.push(
        `${s.name}: ${top.wrongs} of ${totalWrongsInSection} wrong come from "${top.label}" alone — this one type is your single biggest score drain in this section.`,
      );
    }

    // Near-misses (exactly 1 wrong) → Opportunities
    const nearMiss = withWrongs.filter((t) => t.wrongs === 1);
    if (nearMiss.length >= 2) {
      opportunities.push(
        `${s.name}: near-misses on ${nearMiss.slice(0, 3).map((t) => t.label).join(", ")} (1 wrong each) — a targeted 30-min drill per type would likely clean these up.`,
      );
    } else if (nearMiss.length === 1) {
      opportunities.push(
        `${s.name} → ${nearMiss[0].label}: just 1 wrong — one focused session should fix this. ${nearMiss[0].drillAdvice}`,
      );
    }

    // Foundational type errors → Threats
    const easyKeys = EASY_TYPES[s.key] ?? [];
    const easyWrongs = withWrongs.filter((t) => easyKeys.includes(t.key));
    if (easyWrongs.length > 0) {
      const plural = easyWrongs.length > 1;
      threats.push(
        `${s.name}: ${plural ? `${easyWrongs.length} foundational types wrong (${easyWrongs.map((t) => t.label).join(", ")})` : `${easyWrongs[0].wrongs} wrong on "${easyWrongs[0].label}" — a foundational type`}. These should be your most reliable questions. ${easyWrongs[0].drillAdvice}`,
      );
    }

    // Strong on hard types → Strengths
    const hardKeys = HARD_TYPES[s.key] ?? [];
    const hardZero = types.filter((t) => hardKeys.includes(t.key) && (bd[t.key] ?? 0) === 0);
    if (hardZero.length >= 2 && s.attempted > 0) {
      strengths.push(
        `${s.name}: zero errors on ${hardZero.slice(0, 2).map((t) => t.label).join(" & ")} — these are the hardest question types in this section. This is a genuine competitive edge.`,
      );
    }
  });

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
  { score: 94, rank: 664 },
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

