import type { SectionAnalysis } from "./clat-analyser";

export const CLAT_EXAM_MINUTES = 120;
/** Time reserved for OMR bubbling (transferring answers to the sheet). */
export const OMR_BUFFER_MINUTES = 18;
/** Hard cap for the GK/Current Affairs section — recall-based, no extra time helps. */
export const GK_MAX_MINUTES = 12;

export interface SectionTimePlan {
  key: string;
  name: string;
  /** Recommended minutes for this section. */
  minutes: number;
  /** Recommended seconds per question. */
  secondsPerQ: number;
  /** Even-pace baseline minutes (questions / total * solving budget). */
  baselineMinutes: number;
  /** Delta vs even pace (positive = give more time). */
  deltaMinutes: number;
  /** Why this allocation — short label. */
  reason: string;
  /** True if a hard cap was applied to this section. */
  capped?: boolean;
}

export interface TimePlan {
  /** Total exam minutes (includes OMR buffer). */
  total: number;
  /** Minutes available for solving questions (after OMR buffer). */
  solvingBudget: number;
  /** Minutes reserved for OMR bubbling. */
  omrBuffer: number;
  sections: SectionTimePlan[];
  insights: string[];
}

/**
 * Builds a time-allocation plan based on attempt + accuracy patterns.
 *
 * Real-exam constraints applied:
 *   - OMR_BUFFER_MINUTES (~18 min) is reserved for bubbling the answer sheet.
 *   - GK / Current Affairs is hard-capped at GK_MAX_MINUTES — it's a recall
 *     section, extra time doesn't unlock more correct answers.
 *
 * Heuristic (per remaining section):
 *   weight = total_questions * difficultyFactor
 *   difficultyFactor = clamp(1.35 - accuracy/100, 0.7, 1.4)
 * Remaining minutes (solvingBudget - GK allocation) are normalised across
 * the rest by weight.
 */
export function buildTimePlan(
  sections: SectionAnalysis[],
  examMinutes: number = CLAT_EXAM_MINUTES,
  opts: { omrBuffer?: number; gkCap?: number } = {},
): TimePlan {
  const omrBuffer = Math.max(0, opts.omrBuffer ?? OMR_BUFFER_MINUTES);
  const gkCap = Math.max(1, opts.gkCap ?? GK_MAX_MINUTES);
  const solvingBudget = Math.max(1, examMinutes - omrBuffer);

  const totalQ = sections.reduce((a, s) => a + s.total, 0) || 1;

  const factorOf = (s: SectionAnalysis) => {
    const acc = s.attempted > 0 ? s.accuracy : 70;
    return Math.min(1.4, Math.max(0.7, 1.35 - acc / 100));
  };

  // Step 1: pull the GK section out and cap it.
  const gk = sections.find((s) => s.key === "currentAffairs");
  const gkMinutes = gk ? Math.min(gkCap, solvingBudget * 0.18) : 0;
  // (~18% of solving budget is the natural cap; we also clamp at gkCap.)

  // Step 2: distribute the remaining solving minutes across other sections.
  const others = sections.filter((s) => s.key !== "currentAffairs");
  const otherBudget = Math.max(1, solvingBudget - gkMinutes);
  const otherWeights = others.map((s) => ({ s, w: s.total * factorOf(s) }));
  const sumW = otherWeights.reduce((a, r) => a + r.w, 0) || 1;

  const allocFor = (s: SectionAnalysis): { minutes: number; capped: boolean } => {
    if (s.key === "currentAffairs") return { minutes: gkMinutes, capped: gkMinutes >= gkCap - 0.05 };
    const w = otherWeights.find((r) => r.s.key === s.key)!.w;
    return { minutes: (w / sumW) * otherBudget, capped: false };
  };

  const plan: SectionTimePlan[] = sections.map((s) => {
    const { minutes, capped } = allocFor(s);
    const baseline = (s.total / totalQ) * solvingBudget;
    const delta = minutes - baseline;
    const secondsPerQ = (minutes * 60) / Math.max(1, s.total);
    const factor = factorOf(s);

    let reason: string;
    if (s.key === "currentAffairs") {
      reason = `Capped at ${gkCap} min — recall-based, extra time wasted`;
    } else if (s.attempted > 0) {
      if (factor >= 1.15) reason = "Slow down — accuracy below 70%";
      else if (factor <= 0.85) reason = "Tighten — accuracy above 85%";
      else reason = "On track";
    } else {
      reason = "Default — no data yet";
    }

    return {
      key: s.key,
      name: s.name,
      minutes: +minutes.toFixed(1),
      secondsPerQ: Math.round(secondsPerQ),
      baselineMinutes: +baseline.toFixed(1),
      deltaMinutes: +delta.toFixed(1),
      reason,
      capped,
    };
  });

  // Build natural-language insights
  const insights: string[] = [];
  const attempted = sections.filter((s) => s.attempted > 0);

  // Always-on planning callouts
  insights.push(
    `Reserve ${omrBuffer} min for OMR bubbling — fill in batches (every 25–30 questions) so a last-minute scramble can't cost you marks.`,
  );
  insights.push(
    `Cap Current Affairs & GK at ${gkCap} min — if you don't know the fact in 30s, mark and move; rereading recall questions doesn't help.`,
  );

  if (!attempted.length) {
    insights.push(
      `No data yet — solving budget is ${solvingBudget} min across the remaining ${totalQ - (gk?.total ?? 0)} questions (~${((solvingBudget - gkMinutes) / Math.max(1, totalQ - (gk?.total ?? 0)) * 60).toFixed(0)}s per question).`,
    );
  } else {
    // Over-attempters with low accuracy → bleed time
    sections.forEach((s) => {
      if (s.attemptRate >= 80 && s.accuracy < 60 && s.attempted > 0) {
        const drop = Math.max(2, Math.round(s.attempted * 0.15));
        insights.push(
          `${s.name}: you're spending exam time on questions you're getting wrong (${s.accuracy.toFixed(0)}% accuracy). Skip your weakest ~${drop} questions and reinvest those minutes elsewhere.`,
        );
      }
    });

    // Under-attempters with high accuracy → time-management leak
    sections.forEach((s) => {
      if (s.attemptRate < 70 && s.accuracy >= 75 && s.attempted > 0) {
        const left = s.total - s.attempted;
        const extraMin = ((left / s.total) * (plan.find((p) => p.key === s.key)?.minutes ?? 0)).toFixed(0);
        insights.push(
          `${s.name}: ${left} questions left untouched at ${s.accuracy.toFixed(0)}% accuracy. Allocate ~${extraMin} more minutes to attempt them — biggest free marks on the table.`,
        );
      }
    });

    // Suggest first / last section ordering
    const ranked = [...attempted].sort((a, b) => b.netRate - a.netRate);
    if (ranked.length >= 2) {
      const anchor = ranked[0];
      const close = ranked[ranked.length - 1];
      insights.push(
        `Order suggestion: open with ${anchor.name} (your strongest at ${anchor.netRate.toFixed(0)}% net) to lock in marks fast, and leave ${close.name} for last when fatigue hits.`,
      );
    }

    // Pace alarm — net minutes summary (skip GK to avoid noise from the cap)
    const reallocated = plan
      .filter((p) => p.key !== "currentAffairs" && Math.abs(p.deltaMinutes) >= 2)
      .map((p) => `${p.name} ${p.deltaMinutes > 0 ? "+" : ""}${p.deltaMinutes.toFixed(0)}m`)
      .join(" · ");
    if (reallocated) {
      insights.push(`Reallocation vs even pace → ${reallocated}.`);
    }
  }

  return { total: examMinutes, solvingBudget, omrBuffer, sections: plan, insights };
}
