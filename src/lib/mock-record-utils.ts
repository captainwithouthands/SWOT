import { analyseSection, CLAT_SECTIONS, type SectionAnalysis } from "./clat-analyser";
import type { MockRecord } from "./mock-history";

/** Rebuild SectionAnalysis[] from a saved MockRecord (in canonical CLAT order). */
export function recordToAnalyses(r: MockRecord): SectionAnalysis[] {
  return CLAT_SECTIONS.map((def) => {
    const s = r.sections.find((x) => x.key === def.key);
    return analyseSection({
      key: def.key,
      name: def.name,
      total: s?.total ?? def.total,
      attempted: s?.attempted ?? 0,
      correct: s?.correct ?? 0,
    });
  });
}
