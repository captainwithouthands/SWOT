import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { parseCsv, parsePdf, type ParseReport } from "@/lib/mock-parser";
import { toast } from "sonner";

interface Props {
  onParsed: (report: ParseReport) => void;
}

export function MockUpload({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [lastReport, setLastReport] = useState<ParseReport | null>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setLastReport(null);
    try {
      let report: ParseReport;
      const name = file.name.toLowerCase();
      if (name.endsWith(".pdf") || file.type === "application/pdf") {
        report = await parsePdf(file);
      } else if (
        name.endsWith(".csv") ||
        name.endsWith(".tsv") ||
        name.endsWith(".txt") ||
        file.type.startsWith("text/")
      ) {
        const text = await file.text();
        report = parseCsv(text);
      } else {
        toast.error("Unsupported file type", {
          description: "Please upload a CSV or PDF mock summary.",
        });
        setLoading(false);
        return;
      }

      setLastReport(report);
      onParsed(report);

      if (report.matched === 0) {
        toast.error("No sections detected", {
          description: "Check the file format or fill the inputs manually.",
        });
      } else {
        toast.success(`Filled ${report.matched} section${report.matched > 1 ? "s" : ""}`, {
          description: report.warnings.length
            ? `${report.warnings.length} item(s) need review.`
            : "Review the values below before analysing.",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not read file", {
        description: err instanceof Error ? err.message : "Unknown error.",
      });
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="rounded-2xl border-2 border-dashed bg-card/50 p-5 transition hover:border-brand/60 hover:bg-card"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.tsv,.txt,.pdf,application/pdf,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-semibold leading-tight">Auto-fill from your mock summary</h3>
            <p className="text-xs text-muted-foreground">
              Drop a CSV or PDF here, or click to browse. We'll detect sections, attempts and correct counts.
            </p>
          </div>
        </div>
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {loading ? "Reading..." : "Upload file"}
        </Button>
      </div>

      {lastReport && (
        <div className="mt-4 grid gap-2 text-xs">
          <div className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-swot-strength" />
            Detected {lastReport.matched} section{lastReport.matched === 1 ? "" : "s"}.
          </div>
          {lastReport.warnings.slice(0, 3).map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-muted-foreground">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-swot-threat" />
              {w}
            </div>
          ))}
          {lastReport.warnings.length > 3 && (
            <div className="text-muted-foreground">
              +{lastReport.warnings.length - 3} more — review inputs below.
            </div>
          )}
        </div>
      )}

      <details className="mt-4 text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">Expected formats</summary>
        <div className="mt-2 space-y-2">
          <div>
            <strong className="text-foreground">CSV:</strong> headers like
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5">section,attempted,correct</code>
            with one row per CLAT section.
          </div>
          <div>
            <strong className="text-foreground">PDF:</strong> any mock summary that lists section names
            with attempted &amp; correct numbers (works with most coaching reports).
          </div>
        </div>
      </details>
    </div>
  );
}
