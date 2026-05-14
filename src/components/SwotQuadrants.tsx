import type { SwotResult } from "@/lib/clat-analyser";
import { Shield, AlertTriangle, Lightbulb, Zap } from "lucide-react";

const QUADRANTS = [
  {
    key: "strengths" as const,
    title: "Strengths",
    subtitle: "What's working — protect it",
    color: "var(--swot-strength)",
    Icon: Shield,
  },
  {
    key: "weaknesses" as const,
    title: "Weaknesses",
    subtitle: "Conceptual gaps — drill these",
    color: "var(--swot-weakness)",
    Icon: AlertTriangle,
  },
  {
    key: "opportunities" as const,
    title: "Opportunities",
    subtitle: "Easy marks left on the table",
    color: "var(--swot-opportunity)",
    Icon: Lightbulb,
  },
  {
    key: "threats" as const,
    title: "Threats",
    subtitle: "Risks bleeding your score",
    color: "var(--swot-threat)",
    Icon: Zap,
  },
];

export function SwotQuadrants({ swot }: { swot: SwotResult }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-2xl font-bold">SWOT Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Strategic snapshot generated from this mock.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {QUADRANTS.map(({ key, title, subtitle, color, Icon }) => (
          <div
            key={key}
            className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-elegant)]"
          >
            <div
              aria-hidden
              className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl"
              style={{ background: color }}
            />
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `color-mix(in oklab, ${color} 18%, transparent)`, color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold leading-tight" style={{ color }}>
                  {title}
                </h3>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {swot[key].map((item, i) => (
                <li
                  key={i}
                  className="flex gap-2 rounded-lg bg-muted/40 p-3 text-sm leading-relaxed text-foreground"
                >
                  <span
                    className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
