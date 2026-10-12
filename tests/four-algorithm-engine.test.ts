import assert from "node:assert/strict";
import test from "node:test";
import { assessmentQuestions, matchCareers } from "../lib/assessment";
import {
  buildUnifiedCandidates,
  analyzeAprioriCandidate,
  candidateFromApriori,
  candidateFromDecisionTree,
  candidateFromKmeans,
  candidateFromKnn,
  type AlgorithmCandidate,
} from "../lib/assessment-attempts";
import { careers } from "../lib/careers";
import { buildFeaturesFromAnswerProfile, evaluateDecisionTree, type DecisionTreeStatus } from "../lib/decision-tree";
import { buildCareerCatalogTransactions, mineApriori, runAprioriAnalysis } from "../lib/apriori";
import { buildCareerFeatureVectors, buildStudentFeatureVector, type KnnPredictionSet } from "../lib/knn";
import { runKmeansAnalysis, type KmeansResult } from "../lib/kmeans";

const answers = Object.fromEntries(assessmentQuestions.map((question) => [question.id, 1]));
const profile = { stream: "Commerce", interests: ["Business", "Finance"], skills: ["Analysis", "Mathematics"], career_interests: ["finance"] };
const profileScores = matchCareers(answers, profile, careers.length);
assert.equal(assessmentQuestions.length, 25);
assert.deepEqual(careers.map((career) => career.name), ["Engineer", "Doctor", "Teacher", "Lawyer", "Designer", "Social Worker", "Finance", "Media", "Content Creator", "Journalist"]);
const software = careers.find((career) => career.slug === "engineer");
assert.ok(software);
const studentVector = buildStudentFeatureVector(answers, profile).vector;
const softwareVector = buildCareerFeatureVectors().find((candidate) => candidate.career.slug === software.slug);
assert.ok(softwareVector);

function assertBoundedCandidate(candidate: AlgorithmCandidate | null) {
  assert.ok(candidate);
  assert.ok(candidate.evidence.score >= 0 && candidate.evidence.score <= 100);
  assert.ok(candidate.evidence.parameters.calibration);
  return candidate;
}

test("Apriori mines the complete valid rules for a small fixture", () => {
  const transactions = [["a", "b"], ["a", "b"], ["a"], ["b"]];
  const result = mineApriori(transactions, { minRecords: 3, minSupport: 0.5, minConfidence: 0.6 });
  assert.equal(result.status, "ready");
  assert.equal(result.rules.length, 2);
  assert.deepEqual(result.rules.map((rule) => [rule.antecedent, rule.consequent]), [[['a'], ['b']], [['b'], ['a']]]);
});

test("duplicate items inside a transaction do not change Apriori output", () => {
  const transactions = [["a", "b"], ["a", "b"], ["a"], ["b"]];
  const duplicatedItems = [["a", "a", "b", "b"], ["a", "b"], ["a", "a"], ["b", "b"]];
  const options = { minRecords: 3, minSupport: 0.5, minConfidence: 0.6 };
  assert.deepEqual(mineApriori(duplicatedItems, options).rules, mineApriori(transactions, options).rules);
});

test("empty and insufficient Apriori data returns no fabricated rules", () => {
  assert.equal(mineApriori([], { minRecords: 3 }).status, "insufficient_data");
  const result = mineApriori([["a"], ["b"]], { minRecords: 3 });
  assert.equal(result.status, "insufficient_data");
  assert.deepEqual(result.rules, []);
});

test("catalog reference algorithms work with only three student-history records", async () => {
  const kinds = ["commerce", "technology", "healthcare"];
  const studentHistory = kinds.map((kind, index) => {
    const recordAnswers = Object.fromEntries(assessmentQuestions.map((question) => [question.id, kind === "commerce" ? 1 : kind === "technology" ? (question.id === "interest-technology" ? 3 : 1) : (question.id === "interest-people" ? 3 : 1)]));
    const recordProfile = kind === "commerce" ? { stream: "Commerce", career_interests: ["finance"] } : kind === "technology" ? { stream: "Computer Science", career_interests: ["engineer"] } : { stream: "Medical", career_interests: ["doctor"] };
    return { recordId: `actual-history-test-${index}`, dataSource: "student_history" as const, features: buildFeaturesFromAnswerProfile(recordAnswers, recordProfile), label: recordProfile.career_interests[0] };
  });
  const decisionTree = evaluateDecisionTree(answers, profile, studentHistory);
  assert.equal(decisionTree.status, "ready");
  assert.equal(decisionTree.dataSource, "career_catalog_reference");
  assert.equal(decisionTree.studentRecordCount, 3);
  assert.equal(decisionTree.referenceRecordCount, careers.length);
  assert.ok(decisionTree.prediction?.matchedCareer && careers.some((career) => career.slug === decisionTree.prediction?.matchedCareer?.slug));

  const kmeans = await runKmeansAnalysis(null, { k: 3 });
  assert.equal(kmeans.status, "ready");
  assert.equal(kmeans.dataSource, "career_catalog_reference");
  assert.equal(kmeans.recordCount, careers.length);
  assert.equal(kmeans.clusters.length, 3);

  const apriori = await runAprioriAnalysis(null);
  assert.equal(apriori.status, "ready");
  assert.equal(apriori.dataSource, "career_catalog_reference");
  assert.equal(apriori.recordCount, buildCareerCatalogTransactions().length);
  assert.ok(apriori.rules.every((rule) => rule.confidence >= apriori.minConfidence));
});

test("dense Apriori input reports a limit instead of returning partial rules", () => {
  const dense = Array.from({ length: 12 }, () => Array.from({ length: 12 }, (_, index) => `common-${index}`));
  const result = mineApriori(dense, { minRecords: 3, minSupport: 0.3, minConfidence: 0.5, maxCandidateEvaluations: 100, maxRuleEvaluations: 100 });
  assert.equal(result.status, "complexity_limit");
  assert.deepEqual(result.rules, []);
  assert.match(result.reason ?? "", /No partial rules were returned/);
});

test("original 12-profile commerce/technology/healthcare Apriori fixture completes deterministically", () => {
  const makeAnswers = (kind: string) => Object.fromEntries(assessmentQuestions.map((question) => [
    question.id,
    kind === "commerce"
      ? question.id === "interest-business" || question.id.startsWith("preference-") ? 3 : question.id === "interest-technology" || question.id === "skill-programming" ? 0 : 1
      : kind === "technology"
        ? question.id === "interest-technology" || question.id === "skill-programming" ? 3 : question.id === "interest-business" ? 0 : 1
        : question.id === "interest-people" || question.id === "interest-science" ? 3 : question.id === "interest-technology" ? 0 : 1,
  ]));
  const kinds = ["commerce", "technology", "healthcare", "commerce", "technology", "healthcare", "commerce", "technology", "healthcare", "commerce", "technology", "healthcare"];
  const transactions = kinds.map((kind) => {
    const profile = kind === "commerce"
      ? { stream: "Commerce", interests: ["Business", "Finance"], skills: ["Mathematics", "Analysis"], career_interests: ["chartered-accountant"] }
      : kind === "technology"
        ? { stream: "Computer Science", interests: ["Technology", "Programming"], skills: ["Programming", "Problem Solving"], career_interests: ["engineer"] }
        : { stream: "Medical", interests: ["Medicine", "Biology", "Helping others"], skills: ["Communication", "Research"], career_interests: ["doctor"] };
    const features = buildFeaturesFromAnswerProfile(makeAnswers(kind), profile);
    return Object.keys(features).filter((key) => features[key] > 0).sort();
  });
  const options = { minSupport: 0.34, minConfidence: 0.5 };
  const first = mineApriori(transactions, options);
  const second = mineApriori(transactions, options);
  assert.ok(first.status === "ready" || first.status === "complexity_limit");
  assert.equal(first.status, second.status);
  assert.equal(first.candidateEvaluations, second.candidateEvaluations);
  assert.equal(first.ruleEvaluations, second.ruleEvaluations);
  assert.deepEqual(first.rules, second.rules);
  if (first.status === "complexity_limit") assert.deepEqual(first.rules, []);
});

test("each algorithm adapter emits at most one valid calibrated career", () => {
  const knn: KnnPredictionSet = { algorithm: "content-based-knn-v1", k: 1, distanceMetric: "euclidean", studentFeatureCount: 3, featureDimensions: 12, predictions: [{ rank: 1, careerSlug: software.slug, careerName: software.name, category: software.category, distance: 0.4, similarity: 1 / 1.4, matchingAreas: ["Technology"], explanation: "Nearest match." }] };
  const tree: DecisionTreeStatus = { algorithm: "decision-tree-cart-v1", status: "ready", dataSource: "student_history", recordCount: 20, studentRecordCount: 20, referenceRecordCount: 0, minRecords: 10, prediction: { label: software.slug, confidence: 0.8, matchedCareer: { slug: software.slug, name: software.name } } };
  const kmeans: KmeansResult = { algorithm: "kmeans-student-clustering-v1", status: "ready", dataSource: "career_catalog_reference", recordCount: careers.length, minRecords: 3, k: 3, iterations: 4, converged: true, clusters: [{ id: 1, size: 4, centroid: softwareVector.vector, members: [software.slug], summary: ["technology"] }] };
  const apriori = { algorithm: "apriori-cdt-v1" as const, status: "ready" as const, dataSource: "career_catalog_reference" as const, recordCount: careers.length, minRecords: careers.length, minSupport: 1 / careers.length, minConfidence: 0.5, rules: [{ antecedent: [Object.keys(studentVector)[0]], consequent: [`career:${software.slug}`], support: 0.6, confidence: 0.8, lift: 1.5 }] };
  const aprioriAnalysis = analyzeAprioriCandidate(apriori, answers, profile);
  assert.equal(aprioriAnalysis.candidate?.careerSlug, software.slug);
  assert.equal(aprioriAnalysis.parameters.rulesGenerated, 1);
  assert.equal(aprioriAnalysis.parameters.matchedCareerRules, 1);
  assert.equal(aprioriAnalysis.parameters.matchedCareers, 1);
  const normalized = [
    assertBoundedCandidate(candidateFromKnn(knn)),
    assertBoundedCandidate(candidateFromDecisionTree(tree)),
    assertBoundedCandidate(candidateFromKmeans(kmeans, answers, profile)),
    assertBoundedCandidate(candidateFromApriori(apriori, answers, profile)),
  ];
  assert.equal(normalized.length, 4);
  assert.ok(normalized.every((candidate) => careers.some((career) => career.slug === candidate.careerSlug)));
  assert.ok(new Set(normalized.map((candidate) => candidate.evidence.algorithm)).size === 4);
  assert.ok(normalized.every((candidate) => candidate.evidence.score >= 0 && candidate.evidence.score <= 100));
  assert.equal(new Set(normalized.map((candidate) => candidate.evidence.score)).size, 4);
  assert.deepEqual(normalized, [
    candidateFromKnn(knn),
    candidateFromDecisionTree(tree),
    candidateFromKmeans(kmeans, answers, profile),
    candidateFromApriori(apriori, answers, profile),
  ]);
});

test("Apriori explains when career rules do not match student features", () => {
  const result = {
    algorithm: "apriori-cdt-v1" as const,
    status: "ready" as const,
    dataSource: "career_catalog_reference" as const,
    recordCount: careers.length,
    minRecords: careers.length,
    minSupport: 1 / careers.length,
    minConfidence: 0.5,
    rules: [{ antecedent: ["feature:not-in-student-vector"], consequent: [`career:${software.slug}`], support: 0.4, confidence: 0.7, lift: 1.2 }],
  };
  const analysis = analyzeAprioriCandidate(result, answers, profile);
  assert.equal(analysis.candidate, null);
  assert.equal(analysis.parameters.rulesGenerated, 1);
  assert.equal(analysis.parameters.careerRulesGenerated, 1);
  assert.equal(analysis.parameters.matchedCareerRules, 0);
  assert.match(analysis.explanation, /none matched/);
});

test("insufficient algorithm outputs contribute no candidates", () => {
  const tree: DecisionTreeStatus = { algorithm: "decision-tree-cart-v1", status: "insufficient_data", dataSource: "none", recordCount: 0, studentRecordCount: 2, referenceRecordCount: 0, minRecords: 10, reason: "fixture has no catalog references" };
  const kmeans: KmeansResult = { algorithm: "kmeans-student-clustering-v1", status: "insufficient_data", dataSource: "none", recordCount: 2, minRecords: 3, k: 3, iterations: 0, converged: false, clusters: [], reason: "fixture has too few records" };
  const apriori = { algorithm: "apriori-cdt-v1" as const, status: "insufficient_data" as const, dataSource: "career_catalog_reference" as const, recordCount: 2, minRecords: 3, minSupport: 0.3, minConfidence: 0.5, rules: [], reason: "fixture has too few records" };
  const knn: KnnPredictionSet = { algorithm: "content-based-knn-v1", k: 1, distanceMetric: "euclidean", studentFeatureCount: 0, featureDimensions: 12, predictions: [] };
  assert.equal(candidateFromKnn(knn), null);
  assert.equal(candidateFromDecisionTree(tree), null);
  assert.equal(candidateFromKmeans(kmeans, answers, profile), null);
  assert.equal(candidateFromApriori(apriori, answers, profile), null);
});

test("candidate aggregation merges duplicate slugs and empty input stays empty", () => {
  const first = assertBoundedCandidate(candidateFromKnn({ algorithm: "content-based-knn-v1", k: 1, distanceMetric: "euclidean", studentFeatureCount: 3, featureDimensions: 12, predictions: [{ rank: 1, careerSlug: software.slug, careerName: software.name, category: software.category, distance: 0.4, similarity: 1 / 1.4, matchingAreas: [], explanation: "fixture" }] }));
  const second = assertBoundedCandidate(candidateFromDecisionTree({ algorithm: "decision-tree-cart-v1", status: "ready", dataSource: "student_history", recordCount: 20, studentRecordCount: 20, referenceRecordCount: 0, minRecords: 10, prediction: { label: software.slug, confidence: 0.8, matchedCareer: { slug: software.slug, name: software.name } } }));
  const combined = buildUnifiedCandidates(profileScores, [first, second]);
  assert.equal(combined.length, 1);
  assert.equal(combined[0].careerSlug, software.slug);
  assert.equal(combined[0].algorithmEvidence.length, 2);
  assert.ok(combined[0].finalScore >= 0 && combined[0].finalScore <= 100);
  assert.deepEqual(buildUnifiedCandidates(profileScores, []), []);
});
