import { CLAT_SECTIONS, type SectionInput, type SectionKey } from "./clat-analyser";

// Map common section name variants → SectionKey
const ALIASES: { key: SectionKey; patterns: RegExp[] }[] = [
  {
    key: "english",
    patterns: [/english/i, /verbal/i, /reading\s*comprehension/i, /\beng\b/i],
  },
  {
    key: "currentAffairs",
    patterns: [/current\s*affairs/i, /\bg\.?k\.?\b/i, /general\s*knowledge/i, /\bca\b/i],
  },
  {
    key: "legal",
    patterns: [/legal/i, /\blaw\b/i, /\blr\b(?!.*logical)/i],
  },
  {
    key: "logical",
    patterns: [/logical/i, /\breasoning\b/i, /critical\s*reasoning/i],
  },
  {
    key: "quant",
    patterns: [/quant/i, /quantitative/i, /\bmath/i, /numerical/i, /\bqt\b/i, /\bqa\b/i],
  },
];

function matchSection(text: string): SectionKey | null {
  for (const { key, patterns } of ALIASES) {
    if (patterns.some((p) => p.test(text))) return key;
  }
  return null;
}

export type ParsedMock = Partial<Record<SectionKey, { attempted: number; correct: number }>>;

export interface ParseReport {
  data: ParsedMock;
  matched: number;
  warnings: string[];
}

/** Parse CSV text. Accepts headers like: section,attempted,correct (any order, also accepts "right"/"correct answers"). */
export function parseCsv(text: string): ParseReport {
  const warnings: string[] = [];
  const data: ParsedMock = {};
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { data, matched: 0, warnings: ["Empty file."] };

  // Detect delimiter
  const delim = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const split = (l: string) => l.split(delim).map((c) => c.trim().replace(/^"|"$/g, ""));

  const header = split(lines[0]).map((h) => h.toLowerCase());
  const hasHeader = header.some((h) => /section|subject|name/.test(h));
  let idxName = 0;
  let idxAtt = 1;
  let idxCorr = 2;
  let startRow = 0;

  if (hasHeader) {
    idxName = header.findIndex((h) => /section|subject|name/.test(h));
    idxAtt = header.findIndex((h) => /attempt/.test(h));
    idxCorr = header.findIndex((h) => /correct|right/.test(h));
    startRow = 1;
    if (idxAtt < 0 || idxCorr < 0) {
      warnings.push("Could not detect 'attempted' / 'correct' columns — using positional order.");
      idxAtt = 1;
      idxCorr = 2;
    }
  }

  for (let i = startRow; i < lines.length; i++) {
    const cells = split(lines[i]);
    if (cells.length < 2) continue;
    const name = cells[idxName] ?? "";
    const key = matchSection(name);
    if (!key) {
      warnings.push(`Skipped row "${name}" — section not recognised.`);
      continue;
    }
    const attempted = parseInt(cells[idxAtt] || "0") || 0;
    const correct = parseInt(cells[idxCorr] || "0") || 0;
    data[key] = { attempted, correct };
  }

  return { data, matched: Object.keys(data).length, warnings };
}

/** Parse PDF using pdfjs-dist (lazy-loaded). */
export async function parsePdf(file: File): Promise<ParseReport> {
  const pdfjs = await import("pdfjs-dist");
  // Worker via Vite ?url import
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let fullText = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? (it as { str: string }).str : ""))
      .join(" ");
    fullText += "\n" + text;
  }
  return parseTextBlock(fullText);
}

/**
 * Parse free-form text. For each section, look for the section name then the
 * next two numbers (attempted, correct) within a short window.
 * Also tolerates "Attempted: 22 Correct: 18" patterns.
 */
export function parseTextBlock(text: string): ParseReport {
  const data: ParsedMock = {};
  const warnings: string[] = [];
  const normalised = text.replace(/\s+/g, " ");

  for (const sec of CLAT_SECTIONS) {
    const alias = ALIASES.find((a) => a.key === sec.key)!;
    let found: { attempted: number; correct: number } | null = null;

    for (const pat of alias.patterns) {
      const re = new RegExp(pat.source, pat.flags.includes("g") ? pat.flags : pat.flags + "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(normalised))) {
        const window = normalised.slice(m.index, m.index + 220);
        // Pattern: "Attempted X ... Correct Y"
        const labelled = /attempt(?:ed)?\D{0,10}(\d{1,3})[\s\S]{0,80}?(?:correct|right)\D{0,10}(\d{1,3})/i.exec(window);
        if (labelled) {
          found = { attempted: +labelled[1], correct: +labelled[2] };
          break;
        }
        // Fallback: first two integers within window after the section name
        const after = window.slice(m[0].length);
        const nums = after.match(/-?\d+(?:\.\d+)?/g);
        if (nums && nums.length >= 2) {
          const a = parseInt(nums[0]);
          const c = parseInt(nums[1]);
          if (!isNaN(a) && !isNaN(c) && a <= sec.total + 5 && c <= a) {
            found = { attempted: a, correct: c };
            break;
          }
        }
      }
      if (found) break;
    }

    if (found) {
      data[sec.key] = {
        attempted: Math.min(found.attempted, sec.total),
        correct: Math.min(found.correct, found.attempted),
      };
    } else {
      warnings.push(`Could not detect numbers for ${sec.name}.`);
    }
  }

  return { data, matched: Object.keys(data).length, warnings };
}

/** Merge parsed data into a SectionInput map. */
export function applyParsed(
  current: Record<string, SectionInput>,
  parsed: ParsedMock,
): Record<string, SectionInput> {
  const next = { ...current };
  for (const sec of CLAT_SECTIONS) {
    const p = parsed[sec.key];
    if (!p) continue;
    next[sec.key] = {
      ...next[sec.key],
      attempted: Math.min(p.attempted, sec.total),
      correct: Math.min(p.correct, p.attempted),
    };
  }
  return next;
}
