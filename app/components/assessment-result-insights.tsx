import type { AlgorithmPrediction, CareerAlgorithm } from "@/lib/assessment-attempts";

const algorithmLabels: Record<CareerAlgorithm, string> = {
  knn: "KNN",
  decision_tree: "Decision Tree",
  kmeans: "K-Means",
  apriori: "Apriori",
};

const algorithmColors: Record<CareerAlgorithm, string> = {
  knn: "#75a7ff",
  decision_tree: "#68d4a9",
  kmeans: "#ff9175",
  apriori: "#f1ca6a",
};

export function AssessmentResultInsights({
  predictions,
}: {
  predictions: AlgorithmPrediction[];
}) {
  const byAlgorithm = new Map(predictions.map((prediction) => [prediction.algorithm, prediction]));
  const algorithms: CareerAlgorithm[] = ["knn", "decision_tree", "kmeans", "apriori"];

  return (
    <div className="mt-10 space-y-5">
    <section aria-label="Algorithm results comparison" className="overflow-hidden rounded-2xl border border-[#273449] bg-[#151d2b] p-5 text-white shadow-[0_12px_32px_rgba(24,32,50,0.12)] sm:p-7">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff9175]">Assessment output / normalized evidence</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Compare algorithm results</h2>
        <p className="mt-2 text-sm leading-6 text-[#b8c3d2]">Each row shows the career and exact evidence score returned by one algorithm. Scores are signals, not probabilities.</p>
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
            <p className="col-span-2 min-w-0 break-words text-sm font-semibold text-white sm:col-span-1">{prediction?.careerName ?? "No career prediction"}</p>
            <div className="col-span-1 min-w-0 sm:col-span-1">
              {hasScore ? <div role="progressbar" aria-label={`${algorithmLabels[algorithm]} normalized evidence`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={prediction.score!} className="relative h-3 overflow-hidden rounded-sm bg-[#273449]" style={{ backgroundImage: "linear-gradient(to right, transparent calc(25% - 1px), #526074 calc(25% - 1px), #526074 25%, transparent 25%, transparent calc(50% - 1px), #526074 calc(50% - 1px), #526074 50%, transparent 50%, transparent calc(75% - 1px), #526074 calc(75% - 1px), #526074 75%, transparent 75%)" }}><span className="block h-full rounded-sm" style={{ width: `${prediction.score}%`, backgroundColor: algorithmColors[algorithm] }} /></div> : <span className="font-mono text-[10px] text-[#99a7ba]">No score</span>}
            </div>
            <span className="text-right font-mono text-sm font-bold tabular-nums text-white">{hasScore ? `${prediction.score}/100` : "—"}</span>
          </div>;
        })}
      </div>
    </section>
    <AprioriAnalysisSection prediction={byAlgorithm.get("apriori")} />
    </div>
  );
}

function AprioriAnalysisSection({ prediction }: { prediction?: AlgorithmPrediction }) {
  const parameters = prediction?.parameters ?? {};
  const numberValue = (key: string) => typeof parameters[key] === "number" ? parameters[key] as number : null;
  const stringValue = (key: string) => typeof parameters[key] === "string" ? parameters[key] as string : null;
  const metrics = [
    { label: "Catalog records", value: numberValue("catalogRecords") },
    { label: "Rules generated", value: numberValue("rulesGenerated") },
    { label: "Career rules matched", value: numberValue("matchedCareerRules"), total: numberValue("careerRulesGenerated") },
    { label: "Student features", value: numberValue("studentFeatureCount") },
  ];
  const minimumSupport = numberValue("minSupport");
  const minimumConfidence = numberValue("minConfidence");
  const support = numberValue("support");
  const confidence = numberValue("confidence");
  const lift = numberValue("lift");
  const selectedRule = stringValue("selectedRule");
  const hasDiagnostics = numberValue("rulesGenerated") !== null;

  return <section aria-label="Apriori rule analysis" className="overflow-hidden rounded-2xl border border-[#e3e6df] bg-white">
    <div className="border-b border-[#e8ebe5] px-5 py-4 sm:px-6">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#e05e43]">Association-rule analysis</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="display-font text-2xl tracking-tight text-[#182032]">Apriori</h2>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${prediction?.status === "contributed" ? "bg-[#e3f2ec] text-[#25805c]" : "bg-[#f0f2ed] text-[#667085]"}`}>
          {prediction?.status === "contributed" ? "Career rule matched" : prediction?.status === "insufficient_data" ? "Insufficient data" : prediction?.status === "complexity_limit" ? "Evaluation limit reached" : prediction?.status === "no_candidate" ? "No career rule matched" : "Not recorded"}
        </span>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">{prediction?.explanation ?? "No Apriori prediction was saved for this attempt."}</p>
    </div>

    <div className="grid divide-y divide-[#edf0eb] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
      {metrics.map((metric) => <div key={metric.label} className="px-5 py-4 sm:px-6">
        <dt className="text-xs font-semibold text-[#667085]">{metric.label}</dt>
        <dd className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#182032]">
          {metric.value === null ? "Not recorded" : metric.total === undefined ? metric.value.toLocaleString() : `${metric.value.toLocaleString()} / ${metric.total === null ? "?" : metric.total.toLocaleString()}`}
        </dd>
      </div>)}
    </div>

    <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-[#edf0eb] bg-[#fbfcfa] px-5 py-3 font-mono text-[11px] text-[#667085] sm:px-6">
      <span>Minimum support: {minimumSupport === null ? "not recorded" : `${(minimumSupport * 100).toFixed(1)}%`}</span>
      <span>Minimum confidence: {minimumConfidence === null ? "not recorded" : `${(minimumConfidence * 100).toFixed(1)}%`}</span>
      {!hasDiagnostics && <span>This older attempt does not include rule-match counts.</span>}
    </div>

    {selectedRule && <div className="grid gap-3 border-t border-[#edf0eb] px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
      <div className="min-w-0"><p className="text-xs font-bold text-[#182032]">Selected association rule</p><code className="mt-1 block break-all font-mono text-xs leading-5 text-[#475467]">{selectedRule}</code></div>
      <div className="flex flex-wrap gap-4 font-mono text-[11px] text-[#667085]">
        {support !== null && <span>Support <strong className="text-[#182032]">{(support * 100).toFixed(1)}%</strong></span>}
        {confidence !== null && <span>Confidence <strong className="text-[#182032]">{(confidence * 100).toFixed(1)}%</strong></span>}
        {lift !== null && <span>Lift <strong className="text-[#182032]">{lift.toFixed(2)}x</strong></span>}
      </div>
    </div>}
  </section>;
}
