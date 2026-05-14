import { createFileRoute } from "@tanstack/react-router";
import { MockAnalyser } from "@/components/MockAnalyser";

export const Route = createFileRoute("/")({
  component: MockAnalyser,
  head: () => ({
    meta: [
      { title: "CLAT Mock Analyser — SWOT Insights for Every Mock Test" },
      {
        name: "description",
        content:
          "Analyse your CLAT mock test section-wise and get an instant SWOT analysis, accuracy radar and projected percentile.",
      },
    ],
  }),
});
