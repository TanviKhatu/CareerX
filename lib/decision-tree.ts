import { careers, getCareer, slugify } from "./careers";
import { buildCareerFeatureVector, buildStudentFeatureVector, type FeatureVector, type KnnProfile, type StudentAnswers } from "./knn";
import type { SupabaseClient } from "@supabase/supabase-js";

export type { StudentAnswers, KnnProfile, FeatureVector } from "./knn";

export const DECISION_TREE_MIN_RECORDS = 10;
export const DECISION_TREE_DEFAULT_DEPTH = 5;
export const DECISION_TREE_ALGORITHM = "decision-tree-cart-v1";

export type DecisionTreeNode = {
  isLeaf: boolean;
  samples: number;
  label?: string;
  confidence?: number;
  feature?: string;
  threshold?: number;
  left?: DecisionTreeNode;
  right?: DecisionTreeNode;
};

export type DecisionPrediction = {
  label: string;
  confidence: number;
  matchedCareer?: { slug: string; name: string };
};

export type DecisionTreeDataSource = "student_history" | "career_catalog_reference" | "none";

export type DecisionTreeStatus = {
  algorithm: typeof DECISION_TREE_ALGORITHM;
  status: "ready" | "insufficient_data";
  dataSource: DecisionTreeDataSource;
  recordCount: number;
  studentRecordCount: number;
  referenceRecordCount: number;
  minRecords: number;
  baselineConfidence?: number;
  prediction?: DecisionPrediction;
  reason?: string;
  error?: string;
};

export type DecisionTrainingRecord = {
  recordId: string;
  dataSource: Exclude<DecisionTreeDataSource, "none">;
  features: FeatureVector;
  label: string;
};

export type TrainingLoadResult = {
  records: DecisionTrainingRecord[];
  error?: string;
};

function round(value: number, digits: number): number {
  const factor = Math.pow(10, digits);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function gini(labels: string[]): number {
  if (!labels.length) return 0;
  const counts: Record<string, number> = {};
  labels.forEach((label) => {
    counts[label] = (counts[label] ?? 0) + 1;
  });
  let impurity = 1;
  const total = labels.length;
  for (const key in counts) {
    const proportion = counts[key] / total;
    impurity -= proportion * proportion;
  }
  return impurity;
}

function majorityLabel(labels: string[]): string {
  const counts: Record<string, number> = {};
  labels.forEach((label) => {
    counts[label] = (counts[label] ?? 0) + 1;
  });
  let best = "";
  let bestCount = 0;
  for (const key in counts) {
    if (counts[key] > bestCount) {
      bestCount = counts[key];
      best = key;
    }
  }
  return best;
}

function labelProportion(labels: string[], label: string): number {
  const count = labels.filter((item) => item === label).length;
  return labels.length ? count / labels.length : 0;
}

function uniqueFeatureKeys(records: DecisionTrainingRecord[]): string[] {
  const set = new Set<string>();
  records.forEach((record) => Object.keys(record.features).forEach((key) => set.add(key)));
  return Array.from(set);
}

function bestSplit(records: DecisionTrainingRecord[]): { feature: string; threshold: number } | null {
  const featureKeys = uniqueFeatureKeys(records);
  let best: { feature: string; threshold: number; gini: number } | null = null;
  for (const feature of featureKeys) {
    const values = records
      .map((record) => record.features[feature] ?? 0)
      .sort((a, b) => a - b);
    for (let i = 0; i < values.length - 1; i++) {
      if (values[i] === values[i + 1]) continue;
      const threshold = (values[i] + values[i + 1]) / 2;
      const left = records.filter((record) => (record.features[feature] ?? 0) <= threshold);
      const right = records.filter((record) => (record.features[feature] ?? 0) > threshold);
      const weighted =
        (left.length * gini(left.map((item) => item.label)) + right.length * gini(right.map((item) => item.label))) /
        records.length;
      if (!best || weighted < best.gini) {
        best = { feature, threshold, gini: weighted };
      }
    }
  }
  return best ? { feature: best.feature, threshold: best.threshold } : null;
}

function buildTree(
  records: DecisionTrainingRecord[],
  depth: number,
  maxDepth: number,
  minSamples: number
): DecisionTreeNode {
  const labels = records.map((record) => record.label);
  const samples = records.length;
  const majority = majorityLabel(labels);
  const confidence = labelProportion(labels, majority);

  if (depth >= maxDepth || samples < minSamples || gini(labels) === 0) {
    return { isLeaf: true, samples, label: majority, confidence };
  }

  const split = bestSplit(records);
  if (!split) {
    return { isLeaf: true, samples, label: majority, confidence };
  }

  const left = records.filter((record) => (record.features[split.feature] ?? 0) <= split.threshold);
  const right = records.filter((record) => (record.features[split.feature] ?? 0) > split.threshold);
  if (left.length === 0 || right.length === 0) {
    return { isLeaf: true, samples, label: majority, confidence };
  }

  return {
    isLeaf: false,
    samples,
    feature: split.feature,
    threshold: split.threshold,
    left: buildTree(left, depth + 1, maxDepth, minSamples),
    right: buildTree(right, depth + 1, maxDepth, minSamples),
  };
}

export function trainDecisionTree(records: DecisionTrainingRecord[], maxDepth = DECISION_TREE_DEFAULT_DEPTH): DecisionTreeNode | null {
  if (!records || records.length === 0) return null;
  return buildTree(records, 0, maxDepth, DECISION_TREE_MIN_RECORDS);
}

export function classify(model: DecisionTreeNode, features: FeatureVector): { label: string; confidence: number } {
  let node: DecisionTreeNode | undefined = model;
  while (node && !node.isLeaf) {
    const feature: string = node.feature ?? "";
    const threshold: number = node.threshold ?? 0;
    const value: number = features[feature] ?? 0;
    node = value <= threshold ? node.left : node.right;
  }
  return { label: node?.label ?? "", confidence: node?.confidence ?? 0 };
}

export function buildFeaturesFromAnswerProfile(
  answers: StudentAnswers | null | undefined,
  profile: KnnProfile | null | undefined
): FeatureVector {
  return buildStudentFeatureVector(answers, profile).vector;
}

/**
 * One labeled reference vector per catalog career. These are catalog-derived
 * descriptors, not observed student histories or training outcomes.
 */
export function buildCareerCatalogReferenceRecords(): DecisionTrainingRecord[] {
  return careers.map((career) => ({
    recordId: `career-catalog:${career.slug}`,
    dataSource: "career_catalog_reference",
    features: buildCareerFeatureVector(career).vector,
    label: career.slug,
  }));
}

export function evaluateDecisionTree(
  answers: StudentAnswers | null | undefined,
  profile: KnnProfile | null | undefined,
  records: DecisionTrainingRecord[] | null | undefined
): DecisionTreeStatus {
  const validRecords = (records ?? []).filter(
    (record): record is DecisionTrainingRecord => !!record && record.features && Object.keys(record.features).length > 0 && Boolean(getCareer(record.label))
  );
  const studentRecords = validRecords.filter((record) => record.dataSource === "student_history");
  const useStudentHistory = studentRecords.length >= DECISION_TREE_MIN_RECORDS;
  const selectedRecords = useStudentHistory ? studentRecords : buildCareerCatalogReferenceRecords();
  const dataSource: DecisionTreeDataSource = useStudentHistory ? "student_history" : "career_catalog_reference";
  const recordCount = selectedRecords.length;
  const labelCounts = new Map<string, number>();
  for (const record of selectedRecords) labelCounts.set(record.label, (labelCounts.get(record.label) ?? 0) + 1);
  const baselineConfidence = recordCount ? Math.max(...labelCounts.values()) / recordCount : 0;

  if (recordCount === 0) {
    return {
      algorithm: DECISION_TREE_ALGORITHM,
      status: "insufficient_data",
      dataSource: "none",
      recordCount,
      minRecords: DECISION_TREE_MIN_RECORDS,
      studentRecordCount: studentRecords.length,
      referenceRecordCount: 0,
      reason: "Decision Tree has no valid career-catalog reference vectors available.",
    };
  }

  const model = trainDecisionTree(selectedRecords);
  if (!model) {
    return {
      algorithm: DECISION_TREE_ALGORITHM,
      status: "insufficient_data",
      dataSource,
      recordCount,
      minRecords: DECISION_TREE_MIN_RECORDS,
      studentRecordCount: studentRecords.length,
      referenceRecordCount: dataSource === "career_catalog_reference" ? selectedRecords.length : 0,
      reason: `Training could not produce a tree from ${recordCount} records.`,
    };
  }

  const features = buildFeaturesFromAnswerProfile(answers, profile);
  const prediction = classify(model, features);
  const matchedCareer = prediction.label ? getCareer(prediction.label) : undefined;

  return {
    algorithm: DECISION_TREE_ALGORITHM,
    status: "ready",
    dataSource,
    recordCount,
    minRecords: useStudentHistory ? DECISION_TREE_MIN_RECORDS : selectedRecords.length,
    studentRecordCount: studentRecords.length,
    referenceRecordCount: dataSource === "career_catalog_reference" ? selectedRecords.length : 0,
    baselineConfidence: round(baselineConfidence, 4),
    prediction: {
      label: prediction.label,
      confidence: round(prediction.confidence, 4),
      matchedCareer: matchedCareer ? { slug: matchedCareer.slug, name: matchedCareer.name } : undefined,
    },
  };
}

function toCareerLabel(careerInterests?: string[] | null): string | null {
  if (!Array.isArray(careerInterests)) return null;
  for (const interest of careerInterests) {
    if (typeof interest === "string") {
      const slug = slugify(interest);
      if (slug && getCareer(slug)) return slug;
    }
  }
  return null;
}

export async function loadTrainingRecords(client: SupabaseClient): Promise<TrainingLoadResult> {
  if (!client) return { records: [] };
  const profileSelect =
    "user_id,interests,skills,stream,work_style,preferred_work_environment,preferred_industry,career_preferences,career_interests";

  const { data: profiles, error: profileError } = await client.from("profiles").select(profileSelect);
  if (!profiles) {
    return { records: [], error: profileError?.message ?? "Profiles are not available for training." };
  }

  const { data: results, error: resultError } = await client
    .from("assessment_results")
    .select("user_id,result_data,completed_at")
    .eq("assessment_type", "career-guidance-v1")
    .order("completed_at", { ascending: false });

  if (results === null) {
    return { records: [], error: resultError?.message ?? "Assessment results are not available for training." };
  }

  const latestByUser = new Map<string, { answers?: StudentAnswers }>();
  for (const row of results) {
    const userId = row?.user_id as string | undefined;
    if (!userId || latestByUser.has(userId)) continue;
    const resultData = (row?.result_data ?? {}) as { answers?: unknown };
    latestByUser.set(userId, { answers: resultData.answers as StudentAnswers | undefined });
  }

  const records: DecisionTrainingRecord[] = [];
  for (const profile of profiles) {
    const userId = profile?.user_id as string | undefined;
    const answers = userId ? latestByUser.get(userId)?.answers : undefined;
    if (!userId || !answers) continue;
    const label = toCareerLabel(profile?.career_interests);
    if (!label) continue;
    try {
      const features = buildFeaturesFromAnswerProfile(answers, profile as KnnProfile);
      if (Object.keys(features).length > 0) records.push({ recordId: userId, dataSource: "student_history", features, label });
    } catch {
      continue;
    }
  }

  return { records };
}

export function resolveDecisionTreeMinRecords(): number {
  return DECISION_TREE_MIN_RECORDS;
}
