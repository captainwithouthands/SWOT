import jsPDF from "jspdf";
import type { SectionAnalysis, SwotResult } from "./clat-analyser";
import { TOP_COLLEGE_CUTOFF_MARKS, TOP_COLLEGE_CUTOFF } from "./clat-analyser";
import type { MockRecord } from "./mock-history";

interface Totals {
  score: number;
  total: number;
  accuracy: number;
  percentile: number;
  rank: number;
  rankMode: "national" | "batch";
  cohortSize: number;
}

export function exportReportPdf(
  sections: SectionAnalysis[],
  swot: SwotResult,
  t: Totals,
  history: MockRecord[],
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  let y = M;

  const ensure = (h: number) => {
    if (y + h > H - M) {
      doc.addPage();
      y = M;
    }
  };

  // Header band
  doc.setFillColor(30, 41, 82);
  doc.rect(0, 0, W, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CLAT Mock Analyser — Report", M, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(new Date().toLocaleString(), M, 52);
  y = 90;

  doc.setTextColor(20, 20, 20);

  // Summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Summary", M, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const summary = [
    `Net score: ${t.score.toFixed(2)} / ${t.total}`,
    `Overall accuracy: ${t.accuracy.toFixed(1)}%`,
    `Projected percentile: ${t.percentile}`,
    `${t.rankMode === "batch" ? "Rank in batch" : "Projected rank"}: #${t.rank.toLocaleString()} / ${t.cohortSize.toLocaleString()}${t.rankMode === "batch" ? " (batch-anchored)" : ""}`,
    `Top 3 NLU cutoff: ${TOP_COLLEGE_CUTOFF_MARKS} marks (~${TOP_COLLEGE_CUTOFF}%ile)`,
    t.score >= TOP_COLLEGE_CUTOFF_MARKS
      ? "Status: In Top 3 NLU range ✓"
      : `Gap to Top 3 NLU: +${(TOP_COLLEGE_CUTOFF_MARKS - t.score).toFixed(2)} marks`,
  ];
  summary.forEach((line) => {
    ensure(14);
    doc.text(line, M, y);
    y += 14;
  });
  y += 8;

  // Section table
  ensure(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Section-wise performance", M, y);
  y += 16;
  doc.setFontSize(10);
  const cols = ["Section", "Att.", "Correct", "Inc.", "Score", "Acc.%"];
  const colX = [M, M + 200, M + 245, M + 295, M + 340, M + 400];
  cols.forEach((c, i) => doc.text(c, colX[i], y));
  y += 6;
  doc.setDrawColor(180);
  doc.line(M, y, W - M, y);
  y += 12;
  doc.setFont("helvetica", "normal");
  sections.forEach((s) => {
    ensure(14);
    const row = [
      s.name,
      String(s.attempted),
      String(s.correct),
      String(s.incorrect),
      s.score.toFixed(2),
      `${s.accuracy.toFixed(0)}%`,
    ];
    row.forEach((c, i) => doc.text(c, colX[i], y));
    y += 14;
  });
  y += 10;

  // SWOT
  const swotBlock = (title: string, items: string[]) => {
    ensure(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, M, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    items.forEach((it) => {
      const lines = doc.splitTextToSize(`• ${it}`, W - M * 2);
      ensure(lines.length * 12 + 2);
      doc.text(lines, M, y);
      y += lines.length * 12;
    });
    y += 6;
  };
  ensure(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("SWOT analysis", M, y);
  y += 16;
  swotBlock("Strengths", swot.strengths);
  swotBlock("Weaknesses", swot.weaknesses);
  swotBlock("Opportunities", swot.opportunities);
  swotBlock("Threats", swot.threats);

  // History
  if (history.length) {
    ensure(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Mock history", M, y);
    y += 16;
    doc.setFontSize(10);
    const hCols = ["Mock", "Date", "Score", "Acc.%", "%ile", "Rank"];
    const hX = [M, M + 200, M + 280, M + 330, M + 380, M + 430];
    hCols.forEach((c, i) => doc.text(c, hX[i], y));
    y += 6;
    doc.line(M, y, W - M, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    history.forEach((r) => {
      ensure(14);
      const row = [
        r.label.length > 32 ? r.label.slice(0, 30) + "…" : r.label,
        new Date(r.mockDate).toLocaleDateString(),
        `${r.score}/${r.total}`,
        `${r.accuracy}%`,
        String(r.percentile),
        r.rank ? `#${r.rank.toLocaleString()}` : "—",
      ];
      row.forEach((c, i) => doc.text(c, hX[i], y));
      y += 14;
    });
  }

  // Footer page numbers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(`Page ${i} of ${pages} · CLAT Mock Analyser`, M, H - 20);
  }

  doc.save(`clat-mock-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
