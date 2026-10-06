import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { PlatformShell } from "../../components/platform-shell";
import { AssessmentResultInsights } from "../../components/assessment-result-insights";
import { createClient } from "@/lib/supabase/server";
import { analyzeAprioriCandidate, normalizeAnswers, type AlgorithmPrediction, type CareerAlgorithm } from "@/lib/assessment-attempts";
import { getCareer } from "@/lib/careers";
import type { AprioriResult } from "@/lib/apriori";
import type { KnnProfile } from "@/lib/knn";

const algorithms: CareerAlgorithm[] = ["knn", "decision_tree", "kmeans", "apriori"];
const predictionStatuses = ["contributed", "insufficient_data", "no_candidate", "complexity_limit"] as const;
const attemptIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

function readAprioriResult(value: unknown): AprioriResult | null {
  const item = asRecord(value);
  if (item.algorithm !== "apriori-cdt-v1" || !["ready", "insufficient_data", "complexity_limit"].includes(String(item.status))) return null;
  if (typeof item.recordCount !== "number" || typeof item.minRecords !== "number" || typeof item.minSupport !== "number" || typeof item.minConfidence !== "number" || !Array.isArray(item.rules)) return null;
  const rules = item.rules.flatMap((entry) => {
    const rule = asRecord(entry);
    if (!Array.isArray(rule.antecedent) || !rule.antecedent.every((part) => typeof part === "string") || !Array.isArray(rule.consequent) || !rule.consequent.every((part) => typeof part === "string")) return [];
    if (typeof rule.support !== "number" || typeof rule.confidence !== "number" || typeof rule.lift !== "number") return [];
    return [{ antecedent: rule.antecedent as string[], consequent: rule.consequent as string[], support: rule.support, confidence: rule.confidence, lift: rule.lift }];
  });
  return {
    algorithm: "apriori-cdt-v1",
    status: item.status as AprioriResult["status"],
    dataSource: item.dataSource === "career_catalog_reference" ? item.dataSource : undefined,
    recordCount: item.recordCount,
    minRecords: item.minRecords,
    minSupport: item.minSupport,
    minConfidence: item.minConfidence,
    rules,
    reason: typeof item.reason === "string" ? item.reason : undefined,
  };
}

function readProfileSnapshot(value: unknown): KnnProfile | null {
  const item = asRecord(value);
  const readStrings = (key: string) => Array.isArray(item[key]) ? (item[key] as unknown[]).filter((entry): entry is string => typeof entry === "string") : undefined;
  const readString = (key: string) => typeof item[key] === "string" ? item[key] as string : undefined;
  const profile: KnnProfile = {
    interests: readStrings("interests"),
    skills: readStrings("skills"),
    stream: readString("stream"),
    work_style: readString("work_style"),
    preferred_work_environment: readString("preferred_work_environment"),
    preferred_industry: readString("preferred_industry"),
    career_interests: readStrings("career_interests"),
    career_preferences: item.career_preferences,
  };
  return Object.values(profile).some((entry) => entry !== undefined) ? profile : null;
}

function addAprioriDiagnostics(predictions: AlgorithmPrediction[], resultData: UnknownRecord, profileSnapshot: unknown): AlgorithmPrediction[] {
  const outputs = asRecord(resultData.algorithmOutputs);
  const result = readAprioriResult(outputs.apriori);
  const answers = normalizeAnswers(resultData.answers);
  if (!result || !answers) return predictions;

  const analysis = analyzeAprioriCandidate(result, answers, readProfileSnapshot(profileSnapshot));
  const existing = predictions.find((prediction) => prediction.algorithm === "apriori");
  const status: AlgorithmPrediction["status"] = analysis.candidate
    ? "contributed"
    : result.status === "insufficient_data"
      ? "insufficient_data"
      : result.status === "complexity_limit"
        ? "complexity_limit"
        : "no_candidate";
  const prediction: AlgorithmPrediction = {
    algorithm: "apriori",
    status,
    careerSlug: analysis.candidate?.careerSlug ?? null,
    careerName: analysis.candidate ? getCareer(analysis.candidate.careerSlug)?.name ?? null : null,
    score: analysis.candidate?.evidence.score ?? null,
    explanation: analysis.explanation,
    parameters: { ...existing?.parameters, ...analysis.parameters, ...analysis.candidate?.evidence.parameters },
  };
  return [...predictions.filter((item) => item.algorithm !== "apriori"), prediction];
}

function readPredictions(value: unknown): AlgorithmPrediction[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const item = asRecord(entry);
    const parameters = asRecord(item.parameters);
    if (!algorithms.includes(item.algorithm as CareerAlgorithm) || !predictionStatuses.includes(item.status as typeof predictionStatuses[number]) || typeof item.explanation !== "string") return [];
    if (item.score !== null && (typeof item.score !== "number" || item.score < 0 || item.score > 100)) return [];
    return [{
      algorithm: item.algorithm as CareerAlgorithm,
      status: item.status as AlgorithmPrediction["status"],
      careerSlug: typeof item.careerSlug === "string" ? item.careerSlug : null,
      careerName: typeof item.careerName === "string" ? item.careerName : null,
      score: typeof item.score === "number" ? item.score : null,
      explanation: item.explanation,
      parameters: parameters as Record<string, number | string>,
    }];
  });
}

export default async function AssessmentResultsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const rawAttempt = (Array.isArray(params.attempt) ? params.attempt[0] : params.attempt)?.trim() ?? "";
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  let selected: UnknownRecord | null = null;
  let lookupError: string | null = null;
  let history: Array<{ id: string; attempt_number: number; submitted_at: string }> = [];

  if (supabase && user) {
    const columns = "id,attempt_number,submitted_at,result_data,profile_snapshot";
    if (rawAttempt && attemptIdPattern.test(rawAttempt)) {
      const { data, error } = await supabase.from("assessment_attempts").select(columns).eq("user_id", user.id).eq("id", rawAttempt).maybeSingle();
      selected = data as UnknownRecord | null;
      if (error) lookupError = error.message;
    } else if (rawAttempt && /^\d+$/.test(rawAttempt)) {
      const { data, error } = await supabase.from("assessment_attempts").select(columns).eq("user_id", user.id).eq("attempt_number", Number(rawAttempt)).maybeSingle();
      selected = data as UnknownRecord | null;
      if (error) lookupError = error.message;
    } else if (!rawAttempt) {
      const { data, error } = await supabase.from("assessment_attempts").select(columns).eq("user_id", user.id).order("attempt_number", { ascending: false }).limit(1).maybeSingle();
      selected = data as UnknownRecord | null;
      if (error) lookupError = error.message;
    }
    const { data: attempts, error: historyError } = await supabase.from("assessment_attempts").select("id,attempt_number,submitted_at").eq("user_id", user.id).order("attempt_number", { ascending: false }).limit(10);
    if (historyError) console.error("CareerX assessment attempt history lookup failed:", { message: historyError.message, code: historyError.code });
    history = (attempts ?? []) as typeof history;
  }

  if (lookupError) console.error("CareerX selected assessment attempt lookup failed:", lookupError);
  const selectedData = asRecord(selected);
  const resultData = asRecord(selectedData.result_data);
  const predictions = addAprioriDiagnostics(readPredictions(resultData.algorithmPredictions), resultData, selectedData.profile_snapshot);
  const selectedId = typeof selectedData.id === "string" ? selectedData.id : null;

  return <PlatformShell>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-[#223b83]"><ArrowLeft size={15} /> Dashboard</Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#e05e43]">Your career assessment results</p>
        <h1 className="display-font mt-2 text-4xl tracking-tight sm:text-5xl">A few paths worth exploring.</h1>
        <p className="mt-3 max-w-xl text-[#667085]">Compare the careers and scores returned by each algorithm in this saved attempt.</p>
      </div>
      <Link href="/assessment" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dfe3dc] bg-white px-4 py-2.5 text-sm font-bold text-[#223b83]"><RotateCcw size={16} /> Retake assessment</Link>
    </div>

    {history.length > 0 && <nav aria-label="Saved assessment attempts" className="mt-7 flex flex-wrap gap-2">{history.map((attempt) => <Link key={attempt.id} href={`/assessment/results?attempt=${attempt.id}`} aria-current={attempt.id === selectedId ? "page" : undefined} className={`rounded-full border px-3 py-2 text-xs font-bold ${attempt.id === selectedId ? "border-[#223b83] bg-[#223b83] text-white" : "border-[#dfe3dc] bg-white text-[#667085]"}`}>Attempt {attempt.attempt_number} · {new Date(attempt.submitted_at).toLocaleDateString()}</Link>)}</nav>}

    {!supabase || !user ? <div className="mt-10 rounded-2xl border border-[#e3e6df] bg-white p-8 text-sm text-[#667085]">Sign in to view your saved assessment results.</div> : lookupError ? <div role="alert" className="mt-10 rounded-2xl border border-[#e3e6df] bg-white p-8 text-sm text-[#a13d28]">We could not load this assessment attempt. Please try again.</div> : !selected ? <div className="mt-10 rounded-2xl border border-dashed border-[#cfd4db] bg-white p-8 text-center"><h2 className="font-bold">No saved assessment attempt is available.</h2><p className="mt-2 text-sm text-[#667085]">Complete the career assessment to see results saved for your account.</p><Link href="/assessment" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#223b83] px-4 py-3 text-sm font-bold text-white">Start assessment <ArrowRight size={15} /></Link></div> : <>
      {typeof selectedData.attempt_number === "number" && <p className="mt-5 text-xs text-[#8b93a2]">Viewing saved attempt {selectedData.attempt_number}{typeof selectedData.submitted_at === "string" ? ` · ${new Date(selectedData.submitted_at).toLocaleString()}` : ""}</p>}
      <AssessmentResultInsights predictions={predictions} />
    </>}
  </PlatformShell>;
}
