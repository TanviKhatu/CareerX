import { getCareer } from "./careers";
import {
  buildFeaturesFromAnswerProfile,
  DECISION_TREE_MIN_RECORDS,
  type DecisionTrainingRecord,
  type KnnProfile,
  type StudentAnswers,
} from "./decision-tree";
import type { FeatureVector } from "./knn";

export type RandomForestOptions = {
  nTrees?: number;
  maxDepth?: number;
  minSamples?: number;
  featureSampleSize?: number;
};

type ResolvedOptions = {
  nTrees: number;
  maxDepth: number;
  minSamples: number;
  featureSampleSize: number;
};

export type LeafTreeNode = { kind: "leaf"; label: string; samples: number };
export type SplitTreeNode = {
  kind: "split";
  feature: string;
  threshold: number;
  samples: number;
  left: ForestTreeNode;
  right: ForestTreeNode;
};
export type ForestTreeNode = LeafTreeNode | SplitTreeNode;

export type RandomForestModel = {
  trees: ForestTreeNode[];
  options: ResolvedOptions;
};

export type RandomForestVote = { label: string; votes: number };

export type RandomForestPrediction = {
  label: string;
  confidence: number;
  votes: RandomForestVote[];
  treeCount: number;
  matchedCareer?: { slug: string; name: string };
};

export type RandomForestStatus = {
  algorithm: "random-forest-cdt-v1";
  status: "ready" | "insufficient_data";
  recordCount: number;
  minRecords: number;
  nTrees: number;
  prediction?: RandomForestPrediction;
  reason?: string;
  error?: string;
};

export const RANDOM_FOREST_MIN_RECORDS = DECISION_TREE_MIN_RECORDS;
export const RANDOM_FOREST_DEFAULT_TREES = 10;

const DEFAULT_MAX_DEPTH = 5;
const DEFAULT_MIN_SAMPLES = 2;

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

function uniqueFeatureKeys(records: DecisionTrainingRecord[]): string[] {
  const set = new Set<string>();
  records.forEach((record) => Object.keys(record.features).forEach((key) => set.add(key)));
  return Array.from(set);
}

function shuffleInPlace<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temporary = array[i];
    array[i] = array[j];
    array[j] = temporary;
  }
  return array;
}

function randomFeatureSubset(keys: string[], size: number): string[] {
  if (size >= keys.length) return keys.slice();
  return shuffleInPlace(keys.slice()).slice(0, size);
}

function computeFeatureSampleSize(userSize: number | undefined, totalFeatures: number): number {
  if (userSize && userSize > 0) return userSize;
  return Math.max(1, Math.floor(Math.sqrt(totalFeatures)));
}

function resolveOptions(options: RandomForestOptions | undefined, featureSampleSize: number): ResolvedOptions {
  return {
    nTrees: Math.max(0, options?.nTrees ?? RANDOM_FOREST_DEFAULT_TREES),
    maxDepth: options?.maxDepth ?? DEFAULT_MAX_DEPTH,
    minSamples: options?.minSamples ?? DEFAULT_MIN_SAMPLES,
    featureSampleSize: Math.max(1, featureSampleSize),
  };
}

function bootstrapSample(records: DecisionTrainingRecord[]): DecisionTrainingRecord[] {
  const n = records.length;
  const sample: DecisionTrainingRecord[] = [];
  for (let i = 0; i < n; i++) sample.push(records[Math.floor(Math.random() * n)]);
  return sample;
}

function bestSplit(
  records: DecisionTrainingRecord[],
  featureSubset: string[]
): { feature: string; threshold: number } | null {
  let best: { feature: string; threshold: number; gini: number } | null = null;
  for (const feature of featureSubset) {
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
  options: ResolvedOptions
): ForestTreeNode {
  const labels = records.map((record) => record.label);
  const samples = records.length;
  const majority = majorityLabel(labels);

  if (depth >= options.maxDepth || samples < options.minSamples || gini(labels) === 0) {
    return { kind: "leaf", label: majority, samples };
  }

  const keys = uniqueFeatureKeys(records);
  const subset = randomFeatureSubset(keys, Math.min(options.featureSampleSize, keys.length || 1));
  const split = bestSplit(records, subset);
  if (!split) {
    return { kind: "leaf", label: majority, samples };
  }

  const left = records.filter((record) => (record.features[split.feature] ?? 0) <= split.threshold);
  const right = records.filter((record) => (record.features[split.feature] ?? 0) > split.threshold);
  if (!left.length || !right.length) {
    return { kind: "leaf", label: majority, samples };
  }

  return {
    kind: "split",
    feature: split.feature,
    threshold: split.threshold,
    samples,
    left: buildTree(left, depth + 1, options),
    right: buildTree(right, depth + 1, options),
  };
}

export function trainRandomForest(records: DecisionTrainingRecord[], options?: RandomForestOptions): RandomForestModel {
  const nTrees = Math.max(0, options?.nTrees ?? RANDOM_FOREST_DEFAULT_TREES);
  if (!records || records.length === 0 || nTrees < 1) {
    return { trees: [], options: resolveOptions(options, 0) };
  }
  const baseKeys = uniqueFeatureKeys(records);
  const featureSampleSize = computeFeatureSampleSize(options?.featureSampleSize, baseKeys.length);
  const resolved = resolveOptions(options, featureSampleSize);
  const trees: ForestTreeNode[] = [];
  for (let i = 0; i < nTrees; i++) {
    trees.push(buildTree(bootstrapSample(records), 0, resolved));
  }
  return { trees, options: resolved };
}

export function classifyTree(tree: ForestTreeNode, features: FeatureVector): string {
  let node: ForestTreeNode | undefined = tree;
  while (node && node.kind !== "leaf") {
    const value: number = features[node.feature] ?? 0;
    node = value <= node.threshold ? node.left : node.right;
  }
  return node?.kind === "leaf" ? node.label : "";
}

export function predictForest(model: RandomForestModel, features: FeatureVector): RandomForestPrediction {
  const votes: Record<string, number> = {};
  for (const tree of model.trees) {
    const label = classifyTree(tree, features);
    votes[label] = (votes[label] ?? 0) + 1;
  }
  const treeCount = model.trees.length;
  const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = sorted[0];
  const topLabel = top ? top[0] : "";
  const topVotes = top ? top[1] : 0;
  const matchedCareer = topLabel ? getCareer(topLabel) : undefined;
  return {
    label: topLabel,
    confidence: treeCount ? round(topVotes / treeCount, 4) : 0,
    votes: sorted.map(([label, count]) => ({ label, votes: count })),
    treeCount,
    matchedCareer: matchedCareer ? { slug: matchedCareer.slug, name: matchedCareer.name } : undefined,
  };
}

export function evaluateRandomForest(
  answers: StudentAnswers | null | undefined,
  profile: KnnProfile | null | undefined,
  records: DecisionTrainingRecord[] | null | undefined,
  options?: RandomForestOptions
): RandomForestStatus {
  const validRecords = (records ?? []).filter(
    (record): record is DecisionTrainingRecord => !!record && record.features && Object.keys(record.features).length > 0
  );
  const recordCount = validRecords.length;
  const nTrees = Math.max(0, options?.nTrees ?? RANDOM_FOREST_DEFAULT_TREES);

  if (recordCount < RANDOM_FOREST_MIN_RECORDS) {
    return {
      algorithm: "random-forest-cdt-v1",
      status: "insufficient_data",
      recordCount,
      minRecords: RANDOM_FOREST_MIN_RECORDS,
      nTrees,
      reason: `Random Forest needs at least ${RANDOM_FOREST_MIN_RECORDS} real labeled CareerX student records before it can train. CareerX currently has ${recordCount}.`,
    };
  }

  const model = trainRandomForest(validRecords, options);
  if (!model.trees.length) {
    return {
      algorithm: "random-forest-cdt-v1",
      status: "insufficient_data",
      recordCount,
      minRecords: RANDOM_FOREST_MIN_RECORDS,
      nTrees,
      reason: `Training produced no trees from ${recordCount} records.`,
    };
  }

  const features = buildFeaturesFromAnswerProfile(answers, profile);
  const prediction = predictForest(model, features);

  return {
    algorithm: "random-forest-cdt-v1",
    status: "ready",
    recordCount,
    minRecords: RANDOM_FOREST_MIN_RECORDS,
    nTrees: model.options.nTrees,
    prediction,
  };
}
