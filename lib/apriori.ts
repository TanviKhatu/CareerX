import type { SupabaseClient } from "@supabase/supabase-js";
import { careers } from "./careers";
import { buildCareerFeatureVectors } from "./knn";

export const APRIORI_MIN_RECORDS = 3;
export const APRIORI_DEFAULT_MIN_SUPPORT = 1 / careers.length;
export const APRIORI_DEFAULT_MIN_CONFIDENCE = 0.5;
export const APRIORI_ALGORITHM = "apriori-cdt-v1";

export type AprioriOptions = {
  minSupport?: number;
  minConfidence?: number;
  minRecords?: number;
  maxCandidateEvaluations?: number;
  maxRuleEvaluations?: number;
  maxItemsetSize?: number;
};

export type AprioriRule = {
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
};

export type AprioriResult = {
  algorithm: typeof APRIORI_ALGORITHM;
  status: "ready" | "insufficient_data" | "complexity_limit";
  dataSource?: "career_catalog_reference";
  recordCount: number;
  minRecords: number;
  minSupport: number;
  minConfidence: number;
  rules: AprioriRule[];
  candidateEvaluations?: number;
  ruleEvaluations?: number;
  reason?: string;
  error?: string;
};

export const APRIORI_MAX_CANDIDATE_EVALUATIONS = 50_000;
export const APRIORI_MAX_RULE_EVALUATIONS = 50_000;

export function itemLabel(key: string): string {
  const base = key.replace(/^[^.]+\./, "");
  return base
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function round(value: number, digits: number): number {
  const factor = Math.pow(10, digits);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function itemsetKey(items: string[]): string {
  return items.join("|");
}

type FrequentItemset = { items: string[]; transactionIds: Set<number> };
type FrequentMining = { itemsets: FrequentItemset[]; evaluations: number; exceededLimit: boolean };
type RuleMining = { rules: AprioriRule[]; evaluations: number; exceededLimit: boolean };

function hasEqualPrefix(a: string[], b: string[], length: number): boolean {
  for (let i = 0; i < length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

function intersect(left: Set<number>, right: Set<number>): Set<number> {
  const smaller = left.size <= right.size ? left : right;
  const larger = smaller === left ? right : left;
  const result = new Set<number>();
  for (const id of smaller) if (larger.has(id)) result.add(id);
  return result;
}

function generateFrequentItemsets(transactions: string[][], minSupport: number, maxEvaluations: number, maxItemsetSize: number): FrequentMining {
  const minCount = Math.ceil(minSupport * transactions.length - Number.EPSILON);
  const vertical = new Map<string, Set<number>>();
  transactions.forEach((transaction, transactionId) => {
    for (const item of transaction) {
      const ids = vertical.get(item) ?? new Set<number>();
      ids.add(transactionId);
      vertical.set(item, ids);
    }
  });

  let current = [...vertical.entries()]
    .filter(([, ids]) => ids.size >= minCount)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([item, transactionIds]) => ({ items: [item], transactionIds }));
  const frequent: FrequentItemset[] = [];
  for (const itemset of current) frequent.push(itemset);
  let evaluations = 0;
  let size = 2;

  while (current.length > 1 && size <= maxItemsetSize) {
    const currentKeys = new Set(current.map((itemset) => itemsetKey(itemset.items)));
    const next: FrequentItemset[] = [];
    const seen = new Set<string>();
    for (let leftIndex = 0; leftIndex < current.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < current.length; rightIndex += 1) {
        const left = current[leftIndex];
        const right = current[rightIndex];
        if (size > 2 && !hasEqualPrefix(left.items, right.items, size - 2)) continue;
        const candidate = [...new Set([...left.items, ...right.items])].sort();
        if (candidate.length !== size) continue;
        const key = itemsetKey(candidate);
        if (seen.has(key)) continue;
        seen.add(key);
        evaluations += 1;
        if (evaluations > maxEvaluations) return { itemsets: [], evaluations, exceededLimit: true };

        let allSubsetsFrequent = true;
        for (let removed = 0; removed < candidate.length; removed += 1) {
          if (!currentKeys.has(itemsetKey(candidate.filter((_, index) => index !== removed)))) {
            allSubsetsFrequent = false;
            break;
          }
        }
        if (!allSubsetsFrequent) continue;
        const transactionIds = intersect(left.transactionIds, right.transactionIds);
        if (transactionIds.size >= minCount) next.push({ items: candidate, transactionIds });
      }
    }
    for (const itemset of next) frequent.push(itemset);
    current = next;
    size += 1;
  }

  return { itemsets: frequent, evaluations, exceededLimit: false };
}

function* properSubsets(items: string[]): Generator<string[]> {
  const selected: string[] = [];
  function* visit(index: number): Generator<string[]> {
    if (index === items.length) {
      if (selected.length > 0 && selected.length < items.length) yield [...selected];
      return;
    }
    selected.push(items[index]);
    yield* visit(index + 1);
    selected.pop();
    yield* visit(index + 1);
  }
  yield* visit(0);
}

function generateRules(transactions: string[][], mining: FrequentMining, minConfidence: number, maxEvaluations: number): RuleMining {
  const rules: AprioriRule[] = [];
  const byKey = new Map(mining.itemsets.map((itemset) => [itemsetKey(itemset.items), itemset]));
  let evaluations = 0;
  for (const itemset of mining.itemsets) {
    if (itemset.items.length < 2) continue;
    const supportItemset = itemset.transactionIds.size / transactions.length;
    for (const antecedent of properSubsets(itemset.items)) {
      evaluations += 1;
      if (evaluations > maxEvaluations) return { rules: [], evaluations, exceededLimit: true };
      const consequent = itemset.items.filter((item) => !antecedent.includes(item));
      const supportAntecedent = (byKey.get(itemsetKey(antecedent))?.transactionIds.size ?? 0) / transactions.length;
      if (supportAntecedent === 0) continue;
      const confidence = supportItemset / supportAntecedent;
      const supportConsequent = (byKey.get(itemsetKey(consequent))?.transactionIds.size ?? 0) / transactions.length;
      const lift = supportConsequent ? confidence / supportConsequent : 0;
      if (confidence >= minConfidence) rules.push({ antecedent, consequent, support: round(supportItemset, 4), confidence: round(confidence, 4), lift: round(lift, 4) });
    }
  }
  rules.sort((a, b) => b.lift - a.lift || b.confidence - a.confidence || b.support - a.support || a.antecedent.join(",").localeCompare(b.antecedent.join(",")) || a.consequent.join(",").localeCompare(b.consequent.join(",")));
  return { rules, evaluations, exceededLimit: false };
}

export function mineApriori(transactions: string[][] | null | undefined, options: AprioriOptions = {}): AprioriResult {
  const minRecords = options.minRecords ?? APRIORI_MIN_RECORDS;
  const minSupport = options.minSupport ?? APRIORI_DEFAULT_MIN_SUPPORT;
  const minConfidence = options.minConfidence ?? APRIORI_DEFAULT_MIN_CONFIDENCE;
  const normalizedTransactions = (transactions ?? [])
    .map((transaction) => [...new Set(transaction.filter((item) => typeof item === "string" && item.length > 0))].sort())
    .filter((transaction) => transaction.length > 0);
  const recordCount = normalizedTransactions.length;
  const maxCandidateEvaluations = options.maxCandidateEvaluations ?? APRIORI_MAX_CANDIDATE_EVALUATIONS;
  const maxRuleEvaluations = options.maxRuleEvaluations ?? APRIORI_MAX_RULE_EVALUATIONS;
  const maxItemsetSize = options.maxItemsetSize ?? Number.POSITIVE_INFINITY;

  if (recordCount < minRecords) {
    return {
      algorithm: APRIORI_ALGORITHM,
      status: "insufficient_data",
      recordCount,
      minRecords,
      minSupport,
      minConfidence,
      rules: [],
      reason: `Apriori requires at least ${minRecords} valid reference transactions to discover associations. It currently has ${recordCount}.`,
    };
  }

  const mining = generateFrequentItemsets(normalizedTransactions, minSupport, maxCandidateEvaluations, maxItemsetSize);
  if (mining.exceededLimit) {
    return {
      algorithm: APRIORI_ALGORITHM,
      status: "complexity_limit",
      recordCount,
      minRecords,
      minSupport,
      minConfidence,
      rules: [],
      candidateEvaluations: mining.evaluations,
      reason: `Apriori exceeded its ${maxCandidateEvaluations} candidate-evaluation limit. No partial rules were returned; reduce feature density or increase the configured limit.`,
    };
  }

  const ruleMining = generateRules(normalizedTransactions, mining, minConfidence, maxRuleEvaluations);
  if (ruleMining.exceededLimit) {
    return {
      algorithm: APRIORI_ALGORITHM,
      status: "complexity_limit",
      recordCount,
      minRecords,
      minSupport,
      minConfidence,
      rules: [],
      candidateEvaluations: mining.evaluations,
      ruleEvaluations: ruleMining.evaluations,
      reason: `Apriori exceeded its ${maxRuleEvaluations} rule-evaluation limit. No partial rules were returned; reduce feature density or increase the configured limit.`,
    };
  }
  return {
    algorithm: APRIORI_ALGORITHM,
    status: "ready",
    recordCount,
    minRecords,
    minSupport,
    minConfidence,
    rules: ruleMining.rules,
    candidateEvaluations: mining.evaluations,
    ruleEvaluations: ruleMining.evaluations,
  };
}

export function buildCareerCatalogTransactions(): string[][] {
  return buildCareerFeatureVectors().map(({ career, vector }) => [
    ...Object.keys(vector).filter((feature) => vector[feature] > 0).sort(),
    `career:${career.slug}`,
  ]);
}
export async function loadAprioriTransactions(client?: SupabaseClient): Promise<{ transactions: string[][]; recordCount: number; dataSource: "career_catalog_reference" }> {
  void client;
  const transactions = buildCareerCatalogTransactions();
  return { transactions, recordCount: transactions.length, dataSource: "career_catalog_reference" };
}

export async function runAprioriAnalysis(
  client: SupabaseClient | null | undefined,
  options: AprioriOptions = {}
): Promise<AprioriResult> {
  void client;
  const { transactions, recordCount, dataSource } = await loadAprioriTransactions();
  return {
    ...mineApriori(transactions, {
      ...options,
      minRecords: options.minRecords ?? recordCount,
      minSupport: options.minSupport ?? APRIORI_DEFAULT_MIN_SUPPORT,
      maxItemsetSize: options.maxItemsetSize ?? 2,
    }),
    dataSource,
  };
}
