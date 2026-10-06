import { buildCareerFeatureVector, euclideanDistance, type FeatureVector, type KnnProfile, type StudentAnswers } from "./knn";
import { buildFeaturesFromAnswerProfile } from "./decision-tree";
import { careers } from "./careers";
import type { SupabaseClient } from "@supabase/supabase-js";

export type { FeatureVector, KnnProfile, StudentAnswers };

export type KmeansOptions = {
  k?: number;
  maxIterations?: number;
  minRecords?: number;
};

export type KmeansDataSource = "student_history" | "career_catalog_reference" | "none";

export type KmeansRecord = {
  recordId: string;
  dataSource: Exclude<KmeansDataSource, "none">;
  features: FeatureVector;
};

export type KmeansCluster = {
  id: number;
  size: number;
  centroid: FeatureVector;
  members: string[];
  summary: string[];
};

export type KmeansResult = {
  algorithm: "kmeans-student-clustering-v1";
  status: "ready" | "insufficient_data";
  dataSource: KmeansDataSource;
  recordCount: number;
  minRecords: number;
  k: number;
  iterations: number;
  converged: boolean;
  clusters: KmeansCluster[];
  reason?: string;
};

export const DEFAULT_K = 3;
export const KMEANS_MIN_RECORDS = 3;
export const DEFAULT_MAX_ITERATIONS = 100;
const CONVERGENCE_EPSILON = 1e-9;

function round(value: number, digits: number): number {
  const factor = Math.pow(10, digits);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function uniqueFeatureKeys(records: KmeansRecord[]): string[] {
  const set = new Set<string>();
  records.forEach((record) => Object.keys(record.features).forEach((key) => set.add(key)));
  return Array.from(set);
}

function valueAt(vector: FeatureVector, key: string): number {
  return vector[key] ?? 0;
}

function centroidOf(records: KmeansRecord[]): FeatureVector {
  const keys = uniqueFeatureKeys(records);
  const centroid: FeatureVector = {};
  const total = records.length;
  for (const key of keys) {
    let sum = 0;
    for (const record of records) sum += valueAt(record.features, key);
    centroid[key] = sum / total;
  }
  return centroid;
}

function centroidsEqual(a: FeatureVector, b: FeatureVector): boolean {
  const keys = new Set<string>([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (Math.abs(valueAt(a, key) - valueAt(b, key)) > CONVERGENCE_EPSILON) return false;
  }
  return true;
}

function centroidSetsEqual(a: FeatureVector[], b: FeatureVector[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((centroid, index) => centroidsEqual(centroid, b[index]));
}

function initializeCentroids(records: KmeansRecord[], k: number): FeatureVector[] {
  return records
    .slice(0, k)
    .map((record) => ({ ...record.features }));
}

function assignClusters(records: KmeansRecord[], centroids: FeatureVector[]): number[] {
  return records.map((record) => {
    let best = 0;
    let bestDistance = Infinity;
    centroids.forEach((centroid, index) => {
      const distance = euclideanDistance(record.features, centroid);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  });
}

function recomputeCentroids(
  records: KmeansRecord[],
  assignments: number[],
  previousCentroids: FeatureVector[],
  k: number
): FeatureVector[] {
  const clusters: KmeansRecord[][] = Array.from({ length: k }, () => []);
  assignments.forEach((clusterId, index) => {
    clusters[clusterId].push(records[index]);
  });
  return clusters.map((cluster, index) => (cluster.length ? centroidOf(cluster) : previousCentroids[index]));
}

function runKmeans(
  records: KmeansRecord[],
  k: number,
  maxIterations: number
): { centroids: FeatureVector[]; assignments: number[]; iterations: number; converged: boolean } {
  const sorted = [...records].sort((a, b) => a.recordId.localeCompare(b.recordId));
  let centroids = initializeCentroids(sorted, k);
  let assignments: number[] = new Array(sorted.length).fill(-1);
  let iterations = 0;
  let converged = false;

  for (iterations = 1; iterations <= maxIterations; iterations++) {
    const newAssignments = assignClusters(sorted, centroids);
    const newCentroids = recomputeCentroids(sorted, newAssignments, centroids, k);
    const assignmentsStable = assignments.every((previous, index) => previous === newAssignments[index]);
    if (assignmentsStable && centroidSetsEqual(centroids, newCentroids)) {
      centroids = newCentroids;
      assignments = newAssignments;
      converged = true;
      break;
    }
    centroids = newCentroids;
    assignments = newAssignments;
  }

  return { centroids, assignments, iterations, converged };
}

function humanLabel(key: string): string {
  const base = key.replace(/^[^.]+\./, "");
  return base
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function summarizeCluster(members: KmeansRecord[], centroid: FeatureVector): string[] {
  return Object.entries(centroid)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, value]) => `${humanLabel(key)} (${round(value * 100, 0)}%)`);
}

function resolveK(k?: number): number {
  const numeric = typeof k === "number" && Number.isFinite(k) ? Math.floor(k) : DEFAULT_K;
  return numeric >= 2 ? numeric : DEFAULT_K;
}

function insufficientResult(recordCount: number, k: number, dataSource: KmeansDataSource = "none"): KmeansResult {
  const minimum = Math.max(KMEANS_MIN_RECORDS, k);
  return {
    algorithm: "kmeans-student-clustering-v1",
    status: "insufficient_data",
    dataSource,
    recordCount,
    minRecords: minimum,
    k,
    iterations: 0,
    converged: false,
    clusters: [],
    reason: `K-Means needs at least ${minimum} valid feature records to form ${k} clusters. This data source currently has ${recordCount}.`,
  };
}

export function clusterKmeansStudents(
  records: KmeansRecord[] | null | undefined,
  options: KmeansOptions = {}
): KmeansResult {
  const k = resolveK(options.k);
  const validRecords = (records ?? []).filter(
    (record): record is KmeansRecord => !!record && Boolean(record.recordId) && Object.keys(record.features).length > 0
  );

  if (validRecords.length < KMEANS_MIN_RECORDS || validRecords.length < k) {
    return insufficientResult(validRecords.length, k, validRecords[0]?.dataSource ?? "none");
  }

  const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const { centroids, assignments, iterations, converged } = runKmeans(validRecords, k, maxIterations);

  const clusters: KmeansCluster[] = [];
  for (let index = 0; index < k; index++) {
    const members: string[] = [];
    validRecords.forEach((record, recordIndex) => {
      if (assignments[recordIndex] === index) members.push(record.recordId);
    });
    clusters.push({
      id: index + 1,
      size: members.length,
      centroid: centroids[index],
      members,
      summary: summarizeCluster(validRecords.filter((record, recordIndex) => assignments[recordIndex] === index), centroids[index]),
    });
  }

  return {
    algorithm: "kmeans-student-clustering-v1",
    status: "ready",
    dataSource: validRecords[0].dataSource,
    recordCount: validRecords.length,
    minRecords: Math.max(KMEANS_MIN_RECORDS, k),
    k,
    iterations,
    converged,
    clusters,
  };
}

export async function loadClusteringRecords(client: SupabaseClient): Promise<KmeansRecord[]> {
  if (!client) return [];
  const profileSelect =
    "user_id,interests,skills,stream,work_style,preferred_work_environment,preferred_industry,career_preferences,career_interests";

  const { data: profiles, error: profileError } = await client.from("profiles").select(profileSelect);
  if (profileError || !profiles) return [];

  const { data: results, error: resultError } = await client
    .from("assessment_results")
    .select("user_id,result_data,completed_at")
    .eq("assessment_type", "career-guidance-v1")
    .order("completed_at", { ascending: false });

  if (resultError || results === null) return [];

  const latestByUser = new Map<string, { answers?: StudentAnswers }>();
  for (const row of results) {
    const userId = row?.user_id as string | undefined;
    if (!userId || latestByUser.has(userId)) continue;
    const resultData = (row?.result_data ?? {}) as { answers?: unknown };
    latestByUser.set(userId, { answers: resultData.answers as StudentAnswers | undefined });
  }

  const records: KmeansRecord[] = [];
  for (const profile of profiles) {
    const userId = profile?.user_id as string | undefined;
    const answers = userId ? latestByUser.get(userId)?.answers : undefined;
    if (!userId || !answers) continue;
    try {
      const features = buildFeaturesFromAnswerProfile(answers, profile as KnnProfile);
      if (Object.keys(features).length > 0) records.push({ recordId: userId, dataSource: "student_history", features });
    } catch {
      continue;
    }
  }

  return records;
}

export async function runKmeansAnalysis(
  _client: SupabaseClient | null | undefined,
  options: KmeansOptions = {}
): Promise<KmeansResult> {
  const records: KmeansRecord[] = careers.map((career) => ({
    recordId: career.slug,
    dataSource: "career_catalog_reference",
    features: buildCareerFeatureVector(career).vector,
  }));
  return clusterKmeansStudents(records, options);
}
