import "./_group.css";
import { Scale, Cloud, CloudOff, LogOut, Sparkles, RotateCcw, FileDown, TrendingUp, BarChart3, Target, Award, ChevronRight, BookOpen, Calculator, FileText, Gavel } from "lucide-react";

const SECTIONS = [
  { name: "English & Comprehension", icon: BookOpen, attempts: 24, correct: 19, total: 28 },
  { name: "Current Affairs & GK", icon: FileText, attempts: 30, correct: 21, total: 35 },
  { name: "Legal Reasoning", icon: Gavel, attempts: 22, correct: 14, total: 30 },
  { name: "Logical Reasoning", icon: Target, attempts: 18, correct: 13, total: 25 },
  { name: "Quantitative Techniques", icon: Calculator, attempts: 12, correct: 8, total: 15 },
];

const STATS = [
  { label: "Total Attempted", value: "106", sub: "out of 133" },
  { label: "Correct", value: "75", sub: "70.8% accuracy" },
  { label: "Score", value: "+220", sub: "net marks" },
  { label: "Percentile", value: "94.2", sub: "projected rank ~450" },
];

const SWOT = [
  { type: "S", label: "Strengths", color: "oklch(0.65 0.17 150)", bg: "oklch(0.65 0.17 150 / 0.1)", items: ["Strong English comprehension", "GK accuracy above 60%"] },
  { type: "W", label: "Weaknesses", color: "oklch(0.62 0.22 25)", bg: "oklch(0.62 0.22 25 / 0.1)", items: ["Legal reasoning below target", "High skip rate in Quants"] },
  { type: "O", label: "Opportunities", color: "oklch(0.7 0.16 220)", bg: "oklch(0.7 0.16 220 / 0.1)", items: ["Logical reasoning improving", "Attempt rate trending up"] },
  { type: "T", label: "Threats", color: "oklch(0.7 0.18 60)", bg: "oklch(0.7 0.18 60 / 0.1)", items: ["Time management risk", "Legal Q difficulty spike"] },
];

export function LandingPage() {
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--background)", color: "var(--foreground)", minHeight: "100vh" }}>

      {/* Hero header */}
      <header style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.92, background: "var(--gradient-hero)" }} />
        <div style={{ position: "relative", maxWidth: 1152, margin: "0 auto", padding: "56px 24px 48px", color: "var(--brand-foreground)" }}>

          {/* Nav row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ borderRadius: 12, background: "rgba(255,255,255,0.15)", padding: 8, backdropFilter: "blur(8px)" }}>
                <Scale size={24} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.9 }}>
                CLAT Mock Analyser
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 999, background: "rgba(255,255,255,0.15)", padding: "6px 14px", fontSize: 12, backdropFilter: "blur(8px)" }}>
                <Cloud size={14} />
                <span>aspirant@example.com</span>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "0 2px", display: "flex", alignItems: "center", opacity: 0.8 }}>
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{ marginTop: 20, fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, lineHeight: 1.18, letterSpacing: "-0.02em" }}>
            Turn every mock into a<br />sharper strategy.
          </h1>
          <p style={{ marginTop: 12, maxWidth: 560, fontSize: 17, opacity: 0.88, lineHeight: 1.6 }}>
            Enter your section-wise attempts and get an instant SWOT analysis, accuracy radar, and a projected percentile for CLAT.
          </p>

          {/* CTA buttons */}
          <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.95)", color: "oklch(0.208 0.042 265.755)", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
              <Sparkles size={16} /> Try sample data
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", color: "var(--brand-foreground)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 500, cursor: "pointer", backdropFilter: "blur(8px)" }}>
              <RotateCcw size={16} /> Reset
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.95)", color: "oklch(0.208 0.042 265.755)", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
              <FileDown size={16} /> Export PDF
            </button>
          </div>

          {/* Quick stats strip */}
          <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {STATS.map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "14px 16px", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)" }}>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.75, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
                <div style={{ fontSize: 12, opacity: 0.65, marginTop: 1 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 1152, margin: "0 auto", padding: "40px 24px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>

          {/* Section-wise table */}
          <div style={{ background: "white", borderRadius: 16, boxShadow: "var(--shadow-soft)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <BarChart3 size={18} style={{ color: "var(--brand)" }} />
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>Section Performance</h2>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "oklch(0.968 0.007 247.896)" }}>
                  {["Section", "Att.", "Correct", "Acc."].map(h => (
                    <th key={h} style={{ padding: "8px 16px", textAlign: h === "Section" ? "left" : "right", fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map((sec, i) => {
                  const acc = Math.round((sec.correct / sec.attempts) * 100);
                  const Icon = sec.icon;
                  return (
                    <tr key={sec.name} style={{ borderTop: "1px solid var(--border)", background: i % 2 === 0 ? "white" : "oklch(0.985 0.005 240 / 0.4)" }}>
                      <td style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon size={15} style={{ color: "var(--brand)", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{sec.name}</span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, color: "var(--muted-foreground)" }}>{sec.attempts}/{sec.total}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 600, color: "oklch(0.65 0.17 150)" }}>{sec.correct}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, background: acc >= 70 ? "oklch(0.65 0.17 150 / 0.12)" : "oklch(0.62 0.22 25 / 0.12)", color: acc >= 70 ? "oklch(0.45 0.17 150)" : "oklch(0.5 0.22 25)", borderRadius: 6, padding: "2px 8px" }}>
                          {acc}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* SWOT */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {SWOT.map(q => (
              <div key={q.type} style={{ background: q.bg, borderRadius: 14, padding: "18px 18px", border: `1.5px solid ${q.color}30` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 8, background: q.color, color: "white", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{q.type}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: q.color }}>{q.label}</span>
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  {q.items.map(item => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "var(--foreground)", opacity: 0.85, lineHeight: 1.4 }}>
                      <ChevronRight size={12} style={{ color: q.color, flexShrink: 0, marginTop: 2 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Percentile projection banner */}
        <div style={{ marginTop: 28, borderRadius: 16, background: "var(--gradient-hero)", padding: "24px 28px", color: "var(--brand-foreground)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, boxShadow: "var(--shadow-elegant)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 10, backdropFilter: "blur(8px)" }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ fontSize: 13, opacity: 0.8, fontWeight: 500 }}>Projected National Rank</div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>~450 &nbsp;<span style={{ fontSize: 15, fontWeight: 500, opacity: 0.75 }}>out of ~60,000</span></div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>94.2<span style={{ fontSize: 16 }}>%ile</span></div>
              <div style={{ fontSize: 11, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.08em" }}>Percentile</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Award size={18} style={{ opacity: 0.9 }} />
                <span style={{ fontSize: 15, fontWeight: 600 }}>Top 1%</span>
              </div>
              <div style={{ fontSize: 11, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Tier</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
