import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { SectionAnalysis } from "@/lib/clat-analyser";
import { buildTimePlan } from "@/lib/time-allocation";

export function TimeManagementInsights({ sections }: { sections: SectionAnalysis[] }) {
  const plan = buildTimePlan(sections);
  const max = Math.max(...plan.sections.map((p) => p.minutes), 1);

  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand" /> Time-management plan
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {plan.solvingBudget} min solving · {plan.omrBuffer} min OMR buffer · {plan.total} min total
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          {plan.sections.map((p) => {
            const Icon =
              p.deltaMinutes > 1.5 ? ArrowUp : p.deltaMinutes < -1.5 ? ArrowDown : Minus;
            const tone =
              p.deltaMinutes > 1.5
                ? "text-swot-weakness"
                : p.deltaMinutes < -1.5
                  ? "text-swot-strength"
                  : "text-muted-foreground";
            return (
              <div key={p.key} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`flex items-center gap-0.5 ${tone}`}>
                      <Icon className="h-3 w-3" />
                      {p.deltaMinutes > 0 ? "+" : ""}
                      {p.deltaMinutes.toFixed(0)}m vs even
                    </span>
                    <span className="font-semibold text-foreground">
                      {p.minutes.toFixed(0)} min
                    </span>
                    <span>· {p.secondsPerQ}s/Q</span>
                  </span>
                </div>
                <Progress value={(p.minutes / max) * 100} className="h-1.5" />
                <p className="text-[11px] text-muted-foreground">{p.reason}</p>
              </div>
            );
          })}
          <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">OMR bubbling buffer</span>
              <span className="font-semibold text-foreground">{plan.omrBuffer} min</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Reserved for transferring answers — bubble in batches every 25–30 questions.
            </p>
          </div>
        </div>

        {plan.insights.length > 0 && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pacing insights
            </p>
            <ul className="space-y-1.5 text-sm leading-relaxed text-foreground">
              {plan.insights.map((i, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
