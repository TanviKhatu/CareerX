"use client";

import Link from "next/link";
import type { AlgorithmPrediction, CareerAlgorithm } from "@/lib/assessment-attempts";
import { careers, type Career } from "@/lib/careers";
import { ArrowRight } from "lucide-react";

const algorithmLabels: Partial<Record<CareerAlgorithm, string>> = {
  knn: "KNN",
  decision_tree: "Decision Tree",
  kmeans: "K-Means",
};

const algorithmColors: Partial<Record<CareerAlgorithm, string>> = {
  knn: "#75a7ff",
  decision_tree: "#68d4a9",
  kmeans: "#ff9175",
};

export function AssessmentResultInsights({
  predictions,
}: {
  predictions: AlgorithmPrediction[];
}) {
  const byAlgorithm = new Map(predictions.map((prediction) => [prediction.algorithm, prediction]));
  const algorithms = (["knn", "decision_tree", "kmeans"] as CareerAlgorithm[]).sort((a, b) => {
    const firstScore = byAlgorithm.get(a)?.score;
    const secondScore = byAlgorithm.get(b)?.score;
    if (firstScore === null || firstScore === undefined) return secondScore === null || secondScore === undefined ? 0 : 1;
    if (secondScore === null || secondScore === undefined) return -1;
    return secondScore - firstScore;
  });
  const topCareers = predictions
    .filter((prediction) => prediction.status === "contributed" && prediction.score !== null && prediction.careerSlug)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .reduce<Array<{ career: Career; score: number }>>((top, prediction) => {
      if (top.some(({ career }) => career.slug === prediction.careerSlug)) return top;
      const career = careers.find((item) => item.slug === prediction.careerSlug);
      if (career && prediction.score !== null) top.push({ career, score: prediction.score });
      return top;
    }, [])
    .slice(0, 2);

  return (
    <div className="mt-10 space-y-5">
    <section aria-label="Algorithm results overview" className="overflow-hidden rounded-2xl border border-[#273449] bg-[#151d2b] p-5 text-white shadow-[0_12px_32px_rgba(24,32,50,0.12)] sm:p-7">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff9175]">Assessment output / normalized evidence</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Assessment results</h2>
        <p className="mt-2 text-sm leading-6 text-[#b8c3d2]">Each row shows the career and evidence score returned by one active algorithm. Scores are signals, not probabilities.</p>
      </div>
      <div className="mt-7 hidden grid-cols-[8rem_minmax(10rem,13rem)_minmax(0,1fr)_4rem] items-end gap-4 border-b border-[#344155] pb-2 font-mono text-[10px] font-semibold text-[#99a7ba] sm:grid">
        <span>Algorithm</span>
        <span>Predicted career</span>
        <div className="flex justify-between px-0.5"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
        <span className="text-right">Score</span>
      </div>
      <div className="divide-y divide-[#344155]">
        {algorithms.map((algorithm) => {
          const prediction = byAlgorithm.get(algorithm);
          const hasScore = prediction?.status === "contributed" && prediction.score !== null;
          const status = !prediction
            ? "Not recorded"
            : prediction.status === "contributed"
              ? hasScore ? "Result returned" : "Score unavailable"
              : prediction.status === "insufficient_data"
                ? "Insufficient data"
                : prediction.status === "complexity_limit"
                  ? "Limit reached"
                  : "No candidate";

          return <div key={algorithm} className="grid grid-cols-[minmax(0,1fr)_4rem] items-center gap-x-3 gap-y-2 py-4 sm:grid-cols-[8rem_minmax(10rem,13rem)_minmax(0,1fr)_4rem] sm:gap-4">
            <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:block">
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: algorithmColors[algorithm] }} /><p className="font-mono text-sm font-bold">{algorithmLabels[algorithm]}</p></div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${hasScore ? "bg-[#19392f] text-[#86e0bb]" : "bg-[#293445] text-[#c0cad8]"}`}>{status}</span>
            </div>
            <p className="col-span-2 min-w-0 wrap-break-word text-sm font-semibold text-white sm:col-span-1">{prediction?.careerName ?? "No career prediction"}</p>
            <div className="col-span-1 min-w-0 sm:col-span-1">
              {hasScore ? <div role="progressbar" aria-label={`${algorithmLabels[algorithm]} normalized evidence`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={prediction.score!} className="relative h-3 overflow-hidden rounded-sm bg-[#273449]" style={{ backgroundImage: "linear-gradient(to right, transparent calc(25% - 1px), #526074 calc(25% - 1px), #526074 25%, transparent 25%, transparent calc(50% - 1px), #526074 calc(50% - 1px), #526074 50%, transparent 50%, transparent calc(75% - 1px), #526074 calc(75% - 1px), #526074 75%, transparent 75%)" }}><span className="block h-full rounded-sm" style={{ width: `${prediction.score}%`, backgroundColor: algorithmColors[algorithm] }} /></div> : <span className="font-mono text-[10px] text-[#99a7ba]">No score</span>}
            </div>
            <span className="text-right font-mono text-sm font-bold tabular-nums text-white">{hasScore ? `${prediction.score}/100` : "—"}</span>
          </div>;
        })}
      </div>
    </section>
    <div className="flex flex-col items-start gap-3">
      {topCareers.length === 2 && <Link
        href={`/assessment/results/compare?first=${encodeURIComponent(topCareers[0].career.slug)}&firstScore=${topCareers[0].score}&second=${encodeURIComponent(topCareers[1].career.slug)}&secondScore=${topCareers[1].score}`}
        className="inline-flex items-center gap-2 rounded-xl bg-[#223b83] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1b306d]"
      >
        Explore your top 2 careers <ArrowRight size={16} />
      </Link>}
      {topCareers.length < 2 && <p className="text-sm text-[#667085]">At least two different career results with scores are needed for a comparison.</p>}
    </div>
    </div>
  );
}
