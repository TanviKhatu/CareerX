import type { SupabaseClient } from "@supabase/supabase-js";
import { assessmentQuestions, matchCareers, type CareerParameterScores } from "./assessment";
import { buildCareerFeatureVectors, buildStudentFeatureVector, euclideanDistance, predictCareersWithKnn, type KnnPredictionSet, type KnnProfile, type StudentAnswers } from "./knn";
import { evaluateDecisionTree, loadTrainingRecords, type DecisionTreeStatus } from "./decision-tree";
import { DEFAULT_K, runKmeansAnalysis, type KmeansResult } from "./kmeans";
import { APRIORI_DEFAULT_MIN_CONFIDENCE, APRIORI_DEFAULT_MIN_SUPPORT, runAprioriAnalysis, type AprioriResult } from "./apriori";
import { careers, getCareer } from "./careers";

export const ASSESSMENT_TYPE = "career-guidance-v1";
export const ASSESSMENT_KNN_K = 1;
export const ATTEMPT_PROFILE_COLUMNS =
  "interests,skills,stream,work_style,preferred_work_environment,career_interests,preferred_industry,career_preferences,higher_education_preference,education_level";

export type CareerAlgorithm = "knn" | "decision_tree" | "kmeans" | "apriori";

export type AlgorithmEvidence = {
  algorithm: CareerAlgorithm;
  score: number;
  explanation: string;
  parameters: Record<string, number | string>;
};

export type AlgorithmPrediction = {
  algorithm: CareerAlgorithm;
  status: "contributed" | "insufficient_data" | "no_candidate" | "complexity_limit";
  careerSlug: string | null;
  careerName: string | null;
  score: number | null;
  explanation: string;
  parameters: Record<string, number | string>;
};

export type CareerMatch = {
  careerSlug: string;
  careerName: string;
  category: string;
  score: number;
  rawScore: number;
  reasons: string[];
  parameterScores: CareerParameterScores;
  algorithmEvidence: AlgorithmEvidence[];
};

export type CareerCandidate = {
  careerSlug: string;
  careerName: string;
  category: string;
  profileScore: number;
  finalScore: number;
  parameterScores: CareerParameterScores;
  algorithmEvidence: AlgorithmEvidence[];
  reasons: string[];
};

export type CareerMatchRankingEntry = {
  rank: number;
  careerSlug: string;
  careerName: string;
  category: string;
  score: number;
  profileScore: number;
  algorithmEvidence: AlgorithmEvidence[];
  parameterScores: CareerParameterScores;
};

export type AttemptExplanation = {
  careerSlug: string;
  careerName: string;
  matchReasons: string[];
  parameterScores: CareerParameterScores;
  algorithmEvidence: AlgorithmEvidence[];
};

export type AssessmentAttempt = {
  id: string;
  user_id: string;
  attempt_number: number;
  assessment_type: string;
  assessment_version: string;
  status: string;
  question_count: number | null;
  answered_count: number | null;
  started_at: string | null;
  submitted_at: string;
  created_at: string;
  top_score: number | null;
  answers: StudentAnswers;
  category_scores: Record<string, number>;
  knn_result: KnnPredictionSet | null;
  decision_tree_result: DecisionTreeStatus | null;
  kmeans_result: KmeansResult | null;
  apriori_result: AprioriResult | null;
  career_candidates: CareerCandidate[];
  match_results: CareerMatch[];
  match_ranking: CareerMatchRankingEntry[];
  explanations: AttemptExplanation[];
  algorithmPredictions: AlgorithmPrediction[];
};

export type CreateAttemptInput = {
  userId: string;
  answers: unknown;
  startedAt?: string | null;
};

export type CreateAttemptOutcome =
  | { ok: true; attemptId: string | null; attemptNumber: number | null; submittedAt: string | null; persisted: boolean }
  | { ok: false; error: string; code?: string };

const MAX_INSERT_ATTEMPTS = 3;

type SupabaseError = { message?: string; code?: string } | null;

// True only when public.assessment_attempts has not been created yet, i.e. the
// 202609290001_assessment_attempts.sql migration has not been applied.
function isMissingAttemptsTable(error: SupabaseError): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || error.code === "42P01" || /schema cache|does not exist/i.test(error.message ?? "");
}

export function normalizeAnswers(input: unknown): StudentAnswers | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  const answers: StudentAnswers = {};
  for (const question of assessmentQuestions) {
    const value = record[question.id];
    if (typeof value !== "number" || !Number.isInteger(value)) return null;
    if (value < 0 || value >= question.options.length) return null;
    answers[question.id] = value;
  }
  return answers;
}

export function buildCategoryScores(answers: StudentAnswers): Record<string, number> {
  return assessmentQuestions.reduce<Record<string, number>>((scores, item) => {
    const value = answers[item.id];
    if (value === undefined) return scores;
    scores[item.category] = (scores[item.category] ?? 0) + (value + 1);
    return scores;
  }, {});
}

function toMatchProfile(profile: KnnProfile | null) {
  if (!profile) return undefined;
  return {
    interests: profile.interests ?? undefined,
    skills: profile.skills ?? undefined,
    stream: profile.stream ?? undefined,
    work_style: profile.work_style ?? undefined,
    preferred_work_environment: profile.preferred_work_environment ?? undefined,
    preferred_industry: profile.preferred_industry ?? undefined,
    career_interests: profile.career_interests ?? undefined,
    career_preferences: profile.career_preferences ?? undefined
  };
}

export type AlgorithmCandidate = { careerSlug: string; evidence: AlgorithmEvidence };

const algorithmWeights: Record<CareerAlgorithm, number> = { knn: 0.3, decision_tree: 0.25, kmeans: 0.25, apriori: 0.2 };
const MAX_FEATURE_DISTANCE = 2 * Math.sqrt(1.35 ** 2 + 1 ** 2 + 0.85 ** 2);

function normalizedDistanceFit(distance: number): number {
  if (!Number.isFinite(distance) || distance < 0) return 0;
  return Math.round(Math.max(0, Math.min(1, 1 - distance / MAX_FEATURE_DISTANCE)) * 100);
}

export function candidateFromKnn(knn: KnnPredictionSet): AlgorithmCandidate | null {
  if (knn.studentFeatureCount < 1) return null;
  const prediction = knn.predictions[0];
  if (!prediction || !getCareer(prediction.careerSlug)) return null;
  return { careerSlug: prediction.careerSlug, evidence: { algorithm: "knn", score: normalizedDistanceFit(prediction.distance), explanation: prediction.explanation, parameters: { dataSource: "career_catalog_reference plus this student's assessment/profile vector", calibration: "distance relative to maximum weighted feature-space distance", rank: prediction.rank, distance: prediction.distance, rawSimilarity: prediction.similarity, matchingAreas: prediction.matchingAreas.length } } };
}

export function candidateFromDecisionTree(result: DecisionTreeStatus): AlgorithmCandidate | null {
  if (result.status !== "ready" || !result.prediction?.matchedCareer || !getCareer(result.prediction.matchedCareer.slug)) return null;
  const confidence = Math.max(0, Math.min(1, result.prediction.confidence));
  const reliability = result.recordCount / (result.recordCount + result.minRecords);
  const calibratedConfidence = 0.5 + (confidence - 0.5) * reliability;
  return { careerSlug: result.prediction.matchedCareer.slug, evidence: { algorithm: "decision_tree", score: Math.round(calibratedConfidence * 100), explanation: `Decision Tree classified the profile as ${result.prediction.matchedCareer.name}.`, parameters: { dataSource: result.dataSource, calibration: "student labels when enough real labeled history exists; otherwise career-catalog feature references", rawConfidence: confidence, trainingRecords: result.recordCount, realStudentRecords: result.studentRecordCount, catalogReferenceRecords: result.referenceRecordCount, reliability: Number(reliability.toFixed(4)) } } };
}

export function candidateFromKmeans(result: KmeansResult, answers: StudentAnswers, profile: KnnProfile | null): AlgorithmCandidate | null {
  if (result.status !== "ready" || result.dataSource !== "career_catalog_reference" || !result.clusters.length) return null;
  const student = buildStudentFeatureVector(answers, profile).vector;
  if (!Object.keys(student).length) return null;
  const assignedCluster = result.clusters
    .map((cluster) => ({ cluster, distance: euclideanDistance(student, cluster.centroid) }))
    .sort((a, b) => a.distance - b.distance || a.cluster.id - b.cluster.id)[0];
  if (!assignedCluster) return null;
  const clusterCareerSlugs = new Set(assignedCluster.cluster.members);
  const nearestCareer = buildCareerFeatureVectors()
    .filter((candidate) => clusterCareerSlugs.has(candidate.career.slug))
    .map((candidate) => ({ career: candidate.career, distance: euclideanDistance(assignedCluster.cluster.centroid, candidate.vector) }))
    .sort((a, b) => a.distance - b.distance || a.career.name.localeCompare(b.career.name))[0];
  if (!nearestCareer) return null;
  const clusterAffinity = normalizedDistanceFit(assignedCluster.distance) / 100;
  const careerAffinity = normalizedDistanceFit(nearestCareer.distance) / 100;
  const rawAffinity = clusterAffinity * 0.4 + careerAffinity * 0.6;
  const reliability = assignedCluster.cluster.size / (assignedCluster.cluster.size + result.minRecords);
  const calibratedAffinity = 0.5 + (rawAffinity - 0.5) * reliability;
  return { careerSlug: nearestCareer.career.slug, evidence: { algorithm: "kmeans", score: Math.round(calibratedAffinity * 100), explanation: `Your assessment feature vector was assigned to catalog-derived cluster ${assignedCluster.cluster.id}; ${nearestCareer.career.name} is the closest catalog career in that cluster.`, parameters: { dataSource: result.dataSource, calibration: "catalog-cluster assignment and nearest within-cluster career distance, adjusted by cluster size", clusterId: assignedCluster.cluster.id, clusterSize: assignedCluster.cluster.size, clusterReliability: Number(reliability.toFixed(4)), studentClusterDistance: Number(assignedCluster.distance.toFixed(4)), careerCentroidDistance: Number(nearestCareer.distance.toFixed(4)), clusterAffinity: Number(clusterAffinity.toFixed(4)), careerAffinity: Number(careerAffinity.toFixed(4)) } } };
}

export type AprioriCandidateAnalysis = {
  candidate: AlgorithmCandidate | null;
  explanation: string;
  parameters: Record<string, number | string>;
};

export function analyzeAprioriCandidate(result: AprioriResult, answers: StudentAnswers, profile: KnnProfile | null): AprioriCandidateAnalysis {
  const studentVector = buildStudentFeatureVector(answers, profile).vector;
  const studentFeatureCount = Object.values(studentVector).filter((value) => value > 0).length;
  const careerRules = result.rules.filter((rule) => rule.consequent.some((item) => item.startsWith("career:") && getCareer(item.slice("career:".length))));
  const parameters: Record<string, number | string> = {
    dataSource: result.dataSource ?? "none",
    catalogRecords: result.recordCount,
    rulesGenerated: result.rules.length,
    careerRulesGenerated: careerRules.length,
    matchedCareerRules: 0,
    matchedCareers: 0,
    studentFeatureCount,
    minSupport: result.minSupport,
    minConfidence: result.minConfidence,
  };

  if (result.status !== "ready") return { candidate: null, explanation: result.reason ?? `Apriori did not finish successfully (${result.status}).`, parameters };
  if (result.dataSource !== "career_catalog_reference") return { candidate: null, explanation: "Apriori did not have a supported career catalog to analyze.", parameters };
  if (!studentFeatureCount) return { candidate: null, explanation: "No assessment or profile features were available to match against Apriori rules.", parameters };
  if (!result.rules.length) return { candidate: null, explanation: `Apriori generated no rules from ${result.recordCount} catalog records at the configured support and confidence thresholds.`, parameters };

  const matches = result.rules.flatMap((rule) => {
    const premiseCoverage = rule.antecedent.length ? rule.antecedent.filter((item) => (studentVector[item] ?? 0) > 0).length / rule.antecedent.length : 0;
    if (premiseCoverage <= 0) return [];
    return rule.consequent.flatMap((item) => {
      if (!item.startsWith("career:")) return [];
      const careerSlug = item.slice("career:".length);
      if (!getCareer(careerSlug)) return [];
      const confidence = Math.max(0, Math.min(1, rule.confidence));
      const normalizedLift = rule.lift > 1 ? Math.min(1, (rule.lift - 1) / rule.lift) : 0;
      const evidenceStrength = 0.6 * confidence + 0.4 * normalizedLift;
      const reliability = result.recordCount / (result.recordCount + result.minRecords);
      const score = Math.round(100 * evidenceStrength * premiseCoverage * reliability);
      return [{ careerSlug, score, rule }];
    });
  }).sort((a, b) => b.score - a.score || b.rule.support - a.rule.support || a.careerSlug.localeCompare(b.careerSlug));
  const matchedCareers = new Set(matches.map((match) => match.careerSlug));
  parameters.matchedCareerRules = matches.length;
  parameters.matchedCareers = matchedCareers.size;

  const best = matches[0];
  if (!best) {
    return {
      candidate: null,
      explanation: `Apriori generated ${result.rules.length} rules, including ${careerRules.length} career rules, but none matched your ${studentFeatureCount} assessment/profile features.`,
      parameters,
    };
  }

  const careerName = getCareer(best.careerSlug)?.name ?? best.careerSlug;
  parameters.support = best.rule.support;
  parameters.confidence = best.rule.confidence;
  parameters.lift = best.rule.lift;
  parameters.selectedRule = `${best.rule.antecedent.join(" + ")} -> career:${best.careerSlug}`;
  return {
    candidate: {
      careerSlug: best.careerSlug,
      evidence: {
        algorithm: "apriori",
        score: best.score,
        explanation: `Apriori matched ${matches.length} career rules across ${matchedCareers.size} careers; the strongest match is ${careerName}.`,
        parameters: { ...parameters, calibration: "catalog-rule confidence and lift, adjusted for matched features and catalog size" },
      },
    },
    explanation: `The strongest matching association rule points to ${careerName}.`,
    parameters,
  };
}

export function candidateFromApriori(result: AprioriResult, answers: StudentAnswers, profile: KnnProfile | null): AlgorithmCandidate | null {
  return analyzeAprioriCandidate(result, answers, profile).candidate;
}

export function buildUnifiedCandidates(profileScores: ReturnType<typeof matchCareers>, algorithmCandidates: AlgorithmCandidate[]): CareerCandidate[] {
  const profileBySlug = new Map(profileScores.map((match) => [match.careerSlug, match]));
  const grouped = new Map<string, AlgorithmEvidence[]>();
  for (const candidate of algorithmCandidates) grouped.set(candidate.careerSlug, [...(grouped.get(candidate.careerSlug) ?? []), candidate.evidence]);
  const activeWeight = [...new Set(algorithmCandidates.map((candidate) => candidate.evidence.algorithm))].reduce((sum, algorithm) => sum + algorithmWeights[algorithm], 0);
  return [...grouped.entries()].flatMap(([slug, algorithmEvidence]) => {
    const career = getCareer(slug); const profile = profileBySlug.get(slug);
    if (!career || !profile) return [];
    const evidenceWeight = algorithmEvidence.reduce((sum, evidence) => sum + algorithmWeights[evidence.algorithm], 0);
    const algorithmScore = algorithmEvidence.reduce((sum, evidence) => sum + evidence.score * algorithmWeights[evidence.algorithm], 0) / Math.max(evidenceWeight, Number.EPSILON);
    const coverage = activeWeight ? evidenceWeight / activeWeight : 0;
    const finalScore = Math.round(profile.score * 0.45 + algorithmScore * 0.45 + coverage * 10);
    const reasons = [...profile.reasons, ...algorithmEvidence.map((evidence) => evidence.explanation)];
    return [{ careerSlug: career.slug, careerName: career.name, category: career.category, profileScore: profile.score, finalScore, parameterScores: profile.parameterScores, algorithmEvidence, reasons }];
  }).sort((a, b) => b.finalScore - a.finalScore || b.algorithmEvidence.length - a.algorithmEvidence.length || a.careerName.localeCompare(b.careerName));
}

function buildRecommendations(candidates: CareerCandidate[]): CareerMatch[] {
  return candidates.map((candidate) => ({ careerSlug: candidate.careerSlug, careerName: candidate.careerName, category: candidate.category, score: candidate.finalScore, rawScore: candidate.finalScore, parameterScores: candidate.parameterScores, algorithmEvidence: candidate.algorithmEvidence, reasons: candidate.reasons }));
}

function buildMatchRanking(candidates: CareerCandidate[]): CareerMatchRankingEntry[] {
  return candidates.map((candidate, index) => ({ rank: index + 1, careerSlug: candidate.careerSlug, careerName: candidate.careerName, category: candidate.category, score: candidate.finalScore, profileScore: candidate.profileScore, algorithmEvidence: candidate.algorithmEvidence, parameterScores: candidate.parameterScores }));
}

function buildExplanations(candidates: CareerCandidate[]): AttemptExplanation[] {
  return candidates.map((candidate) => ({ careerSlug: candidate.careerSlug, careerName: candidate.careerName, matchReasons: candidate.reasons, parameterScores: candidate.parameterScores, algorithmEvidence: candidate.algorithmEvidence }));
}

function buildAlgorithmPredictions(
  outputs: { knn: KnnPredictionSet; decisionTree: DecisionTreeStatus; kmeans: KmeansResult; apriori: AprioriResult },
  candidates: AlgorithmCandidate[],
  aprioriAnalysis: AprioriCandidateAnalysis,
): AlgorithmPrediction[] {
  const evidenceByAlgorithm = new Map(candidates.map((candidate) => [candidate.evidence.algorithm, candidate.evidence]));
  const names: CareerAlgorithm[] = ["knn", "decision_tree", "kmeans", "apriori"];
  return names.map((algorithm) => {
    const evidence = evidenceByAlgorithm.get(algorithm);
    if (evidence) {
      const career = getCareer(candidates.find((candidate) => candidate.evidence.algorithm === algorithm)?.careerSlug ?? "");
      return { algorithm, status: "contributed", careerSlug: career?.slug ?? null, careerName: career?.name ?? null, score: evidence.score, explanation: algorithm === "apriori" ? aprioriAnalysis.explanation : evidence.explanation, parameters: algorithm === "apriori" ? { ...evidence.parameters, ...aprioriAnalysis.parameters } : evidence.parameters };
    }
    let status: AlgorithmPrediction["status"] = "no_candidate";
    let reason: string | undefined;
    if (algorithm === "knn") {
      status = outputs.knn.studentFeatureCount < 1 ? "insufficient_data" : "no_candidate";
      reason = status === "insufficient_data" ? "KNN requires valid profile or assessment features." : undefined;
    } else {
      const output = algorithm === "decision_tree"
        ? outputs.decisionTree
        : algorithm === "kmeans"
          ? outputs.kmeans
          : outputs.apriori;
      if (output.status === "insufficient_data") status = "insufficient_data";
      else if (algorithm === "apriori" && output.status === "complexity_limit") status = "complexity_limit";
      reason = "reason" in output ? output.reason : undefined;
    }
    return {
      algorithm,
      status,
      careerSlug: null,
      careerName: null,
      score: null,
      explanation: algorithm === "apriori" ? aprioriAnalysis.explanation : reason ?? (status === "no_candidate" ? "The algorithm ran but did not produce a valid career candidate for this attempt." : "This algorithm has insufficient valid data for this attempt."),
      parameters: algorithm === "apriori" ? aprioriAnalysis.parameters : {},
    };
  });
}

export async function readAttemptProfile(client: SupabaseClient, userId: string): Promise<KnnProfile | null> {
  const { data } = await client
    .from("profiles")
    .select(ATTEMPT_PROFILE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  return (data ?? null) as KnnProfile | null;
}

// Returns the next attempt number for the student, or null when the attempts table
// does not exist yet. Every submission gets a new number, nothing is ever reused.
export async function readNextAttemptNumber(
  client: SupabaseClient,
  userId: string
): Promise<{ ok: true; attemptNumber: number } | { ok: false; missingTable: boolean; error: SupabaseError }> {
  const { data, error } = await client
    .from("assessment_attempts")
    .select("attempt_number")
    .eq("user_id", userId)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    const missingTable = isMissingAttemptsTable(error);
    if (!missingTable) console.error("CareerX attempt number lookup failed:", { message: error.message, code: error.code });
    return { ok: false, missingTable, error };
  }
  const latest = Number(data?.attempt_number ?? 0);
  return { ok: true, attemptNumber: (Number.isFinite(latest) ? latest : 0) + 1 };
}

export async function createAssessmentAttempt(client: SupabaseClient, input: CreateAttemptInput): Promise<CreateAttemptOutcome> {
  const answers = normalizeAnswers(input.answers);
  if (!answers) return { ok: false, error: "Every question must be answered before an attempt can be saved." };

  const profile = await readAttemptProfile(client, input.userId);
  const profileScores = matchCareers(answers, toMatchProfile(profile), careers.length);
  const knn = predictCareersWithKnn(answers, profile ?? undefined, { k: ASSESSMENT_KNN_K });
  const categoryScores = buildCategoryScores(answers);

  const training = client ? await loadTrainingRecords(client) : { records: [] };
  const decisionTree = evaluateDecisionTree(answers, profile, training.records);
  const kmeans = await runKmeansAnalysis(client, { k: DEFAULT_K });
  const apriori = await runAprioriAnalysis(client, { minSupport: APRIORI_DEFAULT_MIN_SUPPORT, minConfidence: APRIORI_DEFAULT_MIN_CONFIDENCE });
  const aprioriAnalysis = analyzeAprioriCandidate(apriori, answers, profile);

  const algorithmCandidates = [
    candidateFromKnn(knn),
    candidateFromDecisionTree(decisionTree),
    candidateFromKmeans(kmeans, answers, profile),
    aprioriAnalysis.candidate
  ].filter((candidate): candidate is AlgorithmCandidate => candidate !== null);
  const candidates = buildUnifiedCandidates(profileScores, algorithmCandidates);
  const recommendations = buildRecommendations(candidates);
  const ranking = buildMatchRanking(candidates);
  const explanations = buildExplanations(candidates);
  const algorithmOutputs = { knn, decisionTree, kmeans, apriori };
  const algorithmPredictions = buildAlgorithmPredictions(algorithmOutputs, algorithmCandidates, aprioriAnalysis);
  const resultData = { answers, categoryScores, recommendations, knn, algorithmOutputs, algorithmPredictions, careerCandidates: candidates, matchRanking: ranking, explanations };

  // The legacy row is still written so the existing training loaders, dashboard and
  // any already-deployed reads keep seeing new submissions. It is never updated.
  const { data: legacy, error: legacyError } = await client
    .from("assessment_results")
    .insert({ user_id: input.userId, assessment_type: ASSESSMENT_TYPE, score: recommendations[0]?.score ?? 0, result_data: resultData })
    .select("id")
    .single();
  if (legacyError) {
    console.error("CareerX legacy assessment_results write failed:", { message: legacyError.message, code: legacyError.code });
  }
  const sourceResultId: string | null = legacy?.id ?? null;
  const submittedAt = new Date().toISOString();

  const nextNumber = await readNextAttemptNumber(client, input.userId);
  if (!nextNumber.ok) {
    if (!nextNumber.missingTable) {
      return { ok: false, error: "We could not save your assessment. Please try again.", code: nextNumber.error?.code };
    }
    // Migration not applied yet: the attempt is not permanently recorded, but the
    // legacy result row above keeps the previous behaviour of the app working.
    console.error("CareerX assessment attempt not saved: public.assessment_attempts is missing. Apply supabase/migrations/202609290001_assessment_attempts.sql.");
    return { ok: true, attemptId: null, attemptNumber: null, submittedAt, persisted: false };
  }
  let attemptNumber = nextNumber.attemptNumber;

  let lastError: SupabaseError = null;
  for (let tries = 0; tries < MAX_INSERT_ATTEMPTS; tries += 1) {
    if (tries > 0) {
      // A concurrent submission took this attempt number: re-read and try again.
      const retry = await readNextAttemptNumber(client, input.userId);
      if (!retry.ok) {
        lastError = retry.error;
        break;
      }
      attemptNumber = retry.attemptNumber;
    }
    const { data: attempt, error } = await client
      .from("assessment_attempts")
      .insert({
        user_id: input.userId,
        attempt_number: attemptNumber,
        assessment_type: ASSESSMENT_TYPE,
        assessment_version: ASSESSMENT_TYPE,
        status: "completed",
        question_count: assessmentQuestions.length,
        answered_count: Object.keys(answers).length,
        started_at: input.startedAt ?? null,
        submitted_at: submittedAt,
        created_at: submittedAt,
        top_score: recommendations[0]?.score ?? 0,
        answers,
        category_scores: categoryScores,
        profile_snapshot: profile ?? {},
        knn_result: knn,
        decision_tree_result: decisionTree,
        kmeans_result: kmeans,
        apriori_result: apriori,
        career_candidates: candidates,
        match_results: recommendations,
        match_ranking: ranking,
        explanations,
        // The migration schema has no dedicated status column; the stable JSONB result payload stores statuses per attempt.
        source_result_id: sourceResultId,
        result_data: resultData
      })
      .select("id,attempt_number,submitted_at")
      .single();
    if (!error && attempt) {
      return { ok: true, attemptId: attempt.id, attemptNumber: attempt.attempt_number, submittedAt: attempt.submitted_at, persisted: true };
    }
    lastError = { message: error?.message ?? "Unknown error", code: error?.code };
    if (error?.code !== "23505") break;
  }

  console.error("CareerX assessment attempt save error:", lastError);
  return { ok: false, error: "We could not save your assessment. Please try again.", code: lastError?.code };
}
