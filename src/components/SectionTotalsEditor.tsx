import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CLAT_SECTIONS, CLAT_TOTAL_MARKS } from "@/lib/clat-analyser";
import { ChevronDown, RotateCcw, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  totals: Record<string, number>;
  onApply: (next: Record<string, number>) => void;
}

const DEFAULTS: Record<string, number> = Object.fromEntries(
  CLAT_SECTIONS.map((s) => [s.key, s.total]),
);

export function SectionTotalsEditor({ totals, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, number>>(totals);

  useEffect(() => {
    if (!open) setDraft(totals);
  }, [open, totals]);

  const sum = CLAT_SECTIONS.reduce((a, s) => a + (draft[s.key] || 0), 0);
  const isDefault = CLAT_SECTIONS.every((s) => totals[s.key] === DEFAULTS[s.key]);
  const valid = sum === CLAT_TOTAL_MARKS && CLAT_SECTIONS.every((s) => (draft[s.key] || 0) > 0);

  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 p-5 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Customise section maximums</p>
                <p className="text-xs text-muted-foreground">
                  {isDefault
                    ? `Using CLAT defaults — total stays ${CLAT_TOTAL_MARKS}.`
                    : `Custom split active: ${CLAT_SECTIONS.map((s) => totals[s.key]).join(" + ")} = ${CLAT_TOTAL_MARKS}.`}
                </p>
              </div>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition", open && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <p className="text-xs text-muted-foreground">
              Only edit this for special-format mocks. Total <span className="font-semibold">must equal {CLAT_TOTAL_MARKS}</span> — the CLAT paper size is fixed.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {CLAT_SECTIONS.map((s) => (
                <div key={s.key}>
                  <Label className="text-xs">{s.name}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={CLAT_TOTAL_MARKS}
                    value={draft[s.key] ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        [s.key]: Math.max(0, parseInt(e.target.value) || 0),
                      }))
                    }
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">Default {DEFAULTS[s.key]}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="text-xs">
                Sum:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    sum === CLAT_TOTAL_MARKS ? "text-[color:var(--swot-strength)]" : "text-[color:var(--swot-weakness)]",
                  )}
                >
                  {sum}
                </span>{" "}
                / {CLAT_TOTAL_MARKS}
                {sum !== CLAT_TOTAL_MARKS && (
                  <span className="ml-2 text-muted-foreground">
                    ({sum > CLAT_TOTAL_MARKS ? "−" : "+"}
                    {Math.abs(CLAT_TOTAL_MARKS - sum)} to fix)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDraft({ ...DEFAULTS })}
                  className="gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset to default
                </Button>
                <Button
                  size="sm"
                  disabled={!valid}
                  onClick={() => {
                    onApply({ ...draft });
                    setOpen(false);
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
