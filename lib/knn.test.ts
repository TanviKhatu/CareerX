import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { predictCareersWithKnn, type KnnPredictionSet, type StudentAnswers } from "./knn";

const commerceAnswers: StudentAnswers = {
  "interest-technology": 0,
  "interest-science": 1,
  "interest-business": 3,
  "interest-design": 0,
  "interest-people": 1,
  "interest-writing": 1,
  "aptitude-logic": 1,
  "aptitude-numbers": 3,
  "aptitude-verbal": 2,
  "aptitude-analysis": 2,
  "style-team": 1,
  "style-independent": 3,
  "style-creative": 0,
  "style-leadership": 2,
  "style-research": 3,
  "style-helping": 1,
  "style-practical": 0,
  "style-theoretical": 2,
  "skill-programming": 0,
  "skill-communication": 2,
  "skill-leadership": 2,
  "skill-creativity": 0,
  "preference-environment": 3,
  "preference-impact": 3,
  "preference-learning": 1,
};

const commerceProfile = {
  interests: ["Finance", "Business", "Mathematics"],
  skills: ["Analysis", "Communication", "Mathematics"],
  stream: "Commerce",
  preferred_industry: "Finance",
  career_interests: ["Chartered Accountant", "Financial Analyst", "Banking Professional"],
  career_preferences: { goals: ["accounting", "finance"] },
};

const technologyAnswers: StudentAnswers = {
  "interest-technology": 3,
  "interest-science": 1,
  "interest-business": 0,
  "interest-design": 1,
  "interest-people": 0,
  "interest-writing": 0,
  "aptitude-logic": 3,
  "aptitude-numbers": 3,
  "aptitude-verbal": 0,
  "aptitude-analysis": 3,
  "style-team": 0,
  "style-independent": 3,
  "style-creative": 0,
  "style-leadership": 0,
  "style-research": 3,
  "style-helping": 0,
  "style-practical": 1,
  "style-theoretical": 3,
  "skill-programming": 3,
  "skill-communication": 0,
  "skill-leadership": 0,
  "skill-creativity": 0,
  "preference-environment": 0,
  "preference-impact": 0,
  "preference-learning": 0,
};

const technologyProfile = {
  interests: ["Technology", "Mathematics", "Research"],
  skills: ["Programming", "Analysis"],
  stream: "Computer Science",
  preferred_industry: "Technology",
  career_interests: ["Software Developer", "Data Scientist", "AI/ML Engineer"],
};

const medicalAnswers: StudentAnswers = {
  "interest-technology": 0,
  "interest-science": 3,
  "interest-business": 0,
  "interest-design": 0,
  "interest-people": 3,
  "interest-writing": 0,
  "aptitude-logic": 2,
  "aptitude-numbers": 1,
  "aptitude-verbal": 2,
  "aptitude-analysis": 3,
  "style-team": 1,
  "style-independent": 1,
  "style-creative": 0,
  "style-leadership": 1,
  "style-research": 3,
  "style-helping": 3,
  "style-practical": 1,
  "style-theoretical": 2,
  "skill-programming": 0,
  "skill-communication": 2,
  "skill-leadership": 1,
  "skill-creativity": 0,
  "preference-environment": 1,
  "preference-impact": 1,
  "preference-learning": 3,
};

const medicalProfile = {
  interests: ["Medicine", "Science", "Helping others"],
  skills: ["Communication", "Analysis"],
  stream: "Medical",
  preferred_industry: "Healthcare",
  career_interests: ["Doctor", "Nursing Professional", "Pharmacist"],
};

const mixedAnswers: StudentAnswers = {
  "interest-technology": 2,
  "interest-science": 2,
  "interest-business": 2,
  "interest-design": 2,
  "interest-people": 3,
  "interest-writing": 2,
  "aptitude-logic": 2,
  "aptitude-numbers": 2,
  "aptitude-verbal": 3,
  "aptitude-analysis": 2,
  "style-team": 3,
  "style-independent": 2,
  "style-creative": 2,
  "style-leadership": 2,
  "style-research": 2,
  "style-helping": 3,
  "style-practical": 2,
  "style-theoretical": 1,
  "skill-programming": 2,
  "skill-communication": 3,
  "skill-leadership": 2,
  "skill-creativity": 2,
  "preference-environment": 0,
  "preference-impact": 1,
  "preference-learning": 2,
};

const mixedProfile = {
  interests: ["Technology", "Business", "Design", "Media", "Helping others"],
  skills: ["Communication", "Creativity", "Problem Solving"],
  stream: "Science",
  preferred_industry: "Technology",
  career_interests: ["Product Designer", "Business Analyst", "Media Professional"],
};

function assertValidKnnSet(result: KnnPredictionSet, k: number) {
  assert.equal(result.algorithm, "content-based-knn-v1");
  assert.equal(result.distanceMetric, "euclidean");
  assert.equal(result.k, k);
  assert.equal(result.predictions.length, k);
  assert.ok(result.studentFeatureCount > 0, "student feature vector should not be empty");
  assert.ok(result.featureDimensions > 0, "feature dimensions should be measured");
}

function assertRanked(result: KnnPredictionSet) {
  for (let i = 1; i < result.predictions.length; i++) {
    const prev = result.predictions[i - 1];
    const next = result.predictions[i];
    assert.ok(
      prev.distance < next.distance ||
        (prev.distance === next.distance && prev.careerName <= next.careerName),
      "predictions must be ranked by ascending distance"
    );
    assert.equal(prev.rank, i);
    assert.equal(next.rank, i + 1);
    assert.ok(next.matchingAreas.length >= 1, "should report at least one matching area");
    assert.ok(next.matchingAreas.length <= 4, "should report at most four matching areas");
    assert.ok(next.explanation.length > 0, "should include an explanation");
  }
}

function round(value: number, digits: number): number {
  const factor = Math.pow(10, digits);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

describe("career knn", () => {
  it("commerce-focused student ranks commerce careers and differs from technology", () => {
    const result = predictCareersWithKnn(commerceAnswers, commerceProfile, { k: 5 });
    assertValidKnnSet(result, 5);
    assertRanked(result);
    assert.equal(result.predictions[0].category, "Finance");
    assert.ok(result.predictions[0].distance <= result.predictions[4].distance);
    const techTop = predictCareersWithKnn(technologyAnswers, technologyProfile, { k: 5 });
    assert.notEqual(result.predictions[0].careerSlug, techTop.predictions[0].careerSlug);
  });

  it("technology-focused student ranks technology careers and differs from commerce", () => {
    const result = predictCareersWithKnn(technologyAnswers, technologyProfile, { k: 5 });
    assertValidKnnSet(result, 5);
    assertRanked(result);
    assert.equal(result.predictions[0].category, "Technology");
  });

  it("medical/healthcare-focused student ranks healthcare careers and differs from technology", () => {
    const result = predictCareersWithKnn(medicalAnswers, medicalProfile, { k: 5 });
    assertValidKnnSet(result, 5);
    assertRanked(result);
    assert.equal(result.predictions[0].category, "Healthcare");
  });

  it("mixed-interest student returns diverse categories ranked by distance", () => {
    const result = predictCareersWithKnn(mixedAnswers, mixedProfile, { k: 5 });
    assertValidKnnSet(result, 5);
    assertRanked(result);
    const categories = new Set(result.predictions.map((item) => item.category));
    assert.ok(categories.size >= 2, "mixed profile should surface multiple categories");
  });

  it("respects configurable K without exceeding catalog size", () => {
    const small = predictCareersWithKnn(technologyAnswers, technologyProfile, { k: 3 });
    assert.equal(small.predictions.length, 3);
    const large = predictCareersWithKnn(technologyAnswers, undefined, { k: 100 });
    assert.ok(large.predictions.length <= 46);
    assert.equal(large.k, 100);
    const defaulted = predictCareersWithKnn(technologyAnswers, undefined, {});
    assert.equal(defaulted.predictions.length, 5);
  });

  it("missing optional profile fields do not crash and still respond to answers", () => {
    const noProfile = predictCareersWithKnn(commerceAnswers, undefined, { k: 5 });
    assertValidKnnSet(noProfile, 5);
    const empty = predictCareersWithKnn({}, {}, { k: 5 });
    assert.equal(empty.predictions.length, 5);
    assert.ok(empty.studentFeatureCount === 0);
  });

  it("different profiles produce different KNN rankings", () => {
    const tech = predictCareersWithKnn(technologyAnswers, technologyProfile, { k: 5 });
    const commerce = predictCareersWithKnn(commerceAnswers, commerceProfile, { k: 5 });
    const medical = predictCareersWithKnn(medicalAnswers, medicalProfile, { k: 5 });
    assert.notEqual(tech.predictions[0].careerSlug, commerce.predictions[0].careerSlug);
    assert.notEqual(tech.predictions[0].careerSlug, medical.predictions[0].careerSlug);
    assert.notEqual(commerce.predictions[0].careerSlug, medical.predictions[0].careerSlug);
  });

  it("similarity is derived consistently from distance", () => {
    const result = predictCareersWithKnn(technologyAnswers, technologyProfile, { k: 5 });
    for (const prediction of result.predictions) {
      const expected = round(1 / (1 + prediction.distance), 4);
      assert.equal(prediction.similarity, expected);
    }
  });
});
