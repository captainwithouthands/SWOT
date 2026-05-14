import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SectionAnalysis } from "@/lib/clat-analyser";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";

export function SwotChart({ sections }: { sections: SectionAnalysis[] }) {
  const data = sections.map((s) => ({
    name: s.name.replace(" Reasoning", "").replace(" Language", "").replace(" Techniques", "").replace(" & GK", ""),
    Correct: s.correct,
    Incorrect: s.incorrect,
    Unattempted: s.total - s.attempted,
  }));

  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-brand" /> Section breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--foreground)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Correct" stackId="a" fill="var(--swot-strength)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Incorrect" stackId="a" fill="var(--swot-weakness)" />
              <Bar dataKey="Unattempted" stackId="a" fill="var(--muted-foreground)" fillOpacity={0.4} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
